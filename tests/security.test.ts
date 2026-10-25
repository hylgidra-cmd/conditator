import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POST as forgot } from "@/app/api/auth/forgot/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as resend } from "@/app/api/auth/resend/route";
import { POST as reset } from "@/app/api/auth/reset/route";
import { POST as verify } from "@/app/api/auth/verify/route";
import { GET as getCv, PUT as putCv } from "@/app/api/cv/me/route";
import { GET as getPdf } from "@/app/api/cv/me/pdf/route";
import { PATCH as patchVisibility } from "@/app/api/cv/me/visibility/route";
import { CODE_DAILY_MAX_FAILURES } from "@/lib/auth/email-code";
import { db } from "@/lib/db";
import { MAX_JSON_BYTES } from "@/lib/http/errors";
import {
  getRequest,
  jsonRequest,
  lastMailedCode,
  sessionCookie,
} from "./helpers";
import { sentMails } from "./mail-outbox";

const ctx = undefined as never;
const PASSWORD = "parol-12345";

async function student(email: string) {
  await register(
    jsonRequest("/api/auth/register", {
      email,
      password: PASSWORD,
      role: "STUDENT",
      consent: true,
      locale: "uz",
    }),
    ctx,
  );
  const res = await verify(
    jsonRequest("/api/auth/verify", { email, code: lastMailedCode() }),
    ctx,
  );
  return sessionCookie(res)!;
}

function cvBody(goal: string) {
  return {
    language: "en",
    workTypes: [],
    data: {
      fullName: "Ism Familiya",
      contact: { email: null, phone: null },
      goal,
      location: null,
      education: [],
      experience: [],
      skills: ["React"],
      languages: [],
      certificates: [],
    },
  };
}

/** Kodni 60 soniyalik kutishsiz qayta so'rash uchun oxirgi kodni "eskirtiramiz". */
async function skipResendCooldown(email: string) {
  await db.emailCode.updateMany({
    where: { user: { email } },
    data: { createdAt: new Date(Date.now() - 2 * 60_000) },
  });
}

describe("har bir API endpoint ruxsatni serverda tekshiradi", () => {
  const apiDir = path.join(process.cwd(), "src/app/api");
  const routes: string[] = [];
  (function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "route.ts") routes.push(path.relative(apiDir, full));
    }
  })(apiDir);
  // Ochiq endpointlar: kirishdan oldingi auth amallari va sog'liq tekshiruvi.
  const PUBLIC = new Set([
    "auth/forgot/route.ts",
    "auth/login/route.ts",
    "auth/logout/route.ts",
    "auth/register/route.ts",
    "auth/resend/route.ts",
    "auth/reset/route.ts",
    "auth/verify/route.ts",
    "health/route.ts",
  ]);

  it.each(routes.filter((file) => !PUBLIC.has(file)))(
    "%s requireRole chaqiradi",
    (file) => {
      const source = readFileSync(path.join(apiDir, file), "utf8");
      expect(source).toMatch(/require(Role|Company|ApprovedCompany)\(request/);
    },
  );

  it("CV ni ID bo'yicha faqat tasdiqlangan kompaniya ochadi", () => {
    const byId = routes.filter((file) => file.startsWith("cv/["));
    expect(byId.length).toBeGreaterThan(0);
    for (const file of byId) {
      const source = readFileSync(path.join(apiDir, file), "utf8");
      expect(source).toMatch(/requireApprovedCompany\(request\)/);
      expect(source).toMatch(/loadVisibleCvDocument\(/);
    }
  });

  it("saralash va qaror endpointlari faqat tasdiqlangan kompaniya uchun, faqat o'z talabi", () => {
    const matching = routes.filter((file) =>
      /^vacancies\/\[id\]\/(match|candidates)/.test(file),
    );
    expect(matching).toHaveLength(3);
    for (const file of matching) {
      const source = readFileSync(path.join(apiDir, file), "utf8");
      expect(source).toMatch(/requireApprovedCompany\(request\)/);
      expect(source).toMatch(/(getOwnVacancy|setDecision)\(company\.id/);
    }
  });
});

describe("talaba boshqa talabaning CV sini ko'ra olmaydi", () => {
  it("GET, PDF, ko'rinish va saqlash faqat o'z CV siga ta'sir qiladi", async () => {
    const alice = await student("alice@test.local");
    await putCv(
      jsonRequest("/api/cv/me", cvBody("Alice maqsadi"), {
        cookie: alice,
        method: "PUT",
      }),
      ctx,
    );
    const aliceUser = await db.user.findUniqueOrThrow({
      where: { email: "alice@test.local" },
    });
    const bob = await student("bob@test.local");

    // URL dagi userId e'tiborga olinmaydi.
    const res = await getCv(
      getRequest(`/api/cv/me?userId=${aliceUser.id}`, bob),
      ctx,
    );
    expect((await res.json()).cv).toBeNull();
    expect((await getPdf(getRequest("/api/cv/me/pdf", bob), ctx)).status).toBe(
      409,
    );
    const patch = await patchVisibility(
      jsonRequest(
        "/api/cv/me/visibility",
        { isVisible: true },
        { cookie: bob, method: "PATCH" },
      ),
      ctx,
    );
    expect(patch.status).toBe(409);

    await putCv(
      jsonRequest("/api/cv/me", cvBody("Bob maqsadi"), {
        cookie: bob,
        method: "PUT",
      }),
      ctx,
    );
    const aliceCv = await db.cv.findUniqueOrThrow({
      where: { userId: aliceUser.id },
    });
    expect(aliceCv.isVisible).toBe(false);
    expect((aliceCv.data as { goal: string }).goal).toBe("Alice maqsadi");
    expect(await db.cv.count()).toBe(2);
  });
});

describe("tasdiqlash kodi API javobida chiqmaydi", () => {
  it("register, resend, forgot, verify, reset javoblarida kod yo'q", async () => {
    const email = "kod@test.local";
    const responses: Response[] = [];
    responses.push(
      await register(
        jsonRequest("/api/auth/register", {
          email,
          password: PASSWORD,
          role: "STUDENT",
          consent: true,
          locale: "uz",
        }),
        ctx,
      ),
    );
    await skipResendCooldown(email);
    responses.push(
      await resend(jsonRequest("/api/auth/resend", { email }), ctx),
    );
    responses.push(
      await verify(
        jsonRequest("/api/auth/verify", { email, code: "000000" }),
        ctx,
      ),
    );
    responses.push(
      await verify(
        jsonRequest("/api/auth/verify", { email, code: lastMailedCode() }),
        ctx,
      ),
    );
    await skipResendCooldown(email);
    responses.push(
      await forgot(jsonRequest("/api/auth/forgot", { email }), ctx),
    );
    responses.push(
      await reset(
        jsonRequest("/api/auth/reset", {
          email,
          code: lastMailedCode(),
          password: "yangi-parol-123",
        }),
        ctx,
      ),
    );

    const codes = sentMails.map((mail) => mail.text.match(/\b\d{6}\b/)![0]);
    expect(codes).toHaveLength(3);
    for (const response of responses) {
      const text =
        (await response.text()) +
        JSON.stringify([...response.headers.entries()]);
      for (const code of codes) expect(text).not.toContain(code);
    }
  });

  it("kunlik noto'g'ri urinishlar chegarasi yangi kod bilan ham ishlaydi", async () => {
    const email = "brute@test.local";
    await register(
      jsonRequest("/api/auth/register", {
        email,
        password: PASSWORD,
        role: "STUDENT",
        consent: true,
        locale: "uz",
      }),
      ctx,
    );
    let failures = 0;
    while (failures < CODE_DAILY_MAX_FAILURES) {
      for (let i = 0; i < 5 && failures < CODE_DAILY_MAX_FAILURES; i++) {
        await verify(
          jsonRequest(
            "/api/auth/verify",
            { email, code: "999999" },
            { ip: `10.1.${failures}.1` },
          ),
          ctx,
        );
        failures++;
      }
      await skipResendCooldown(email);
      await resend(jsonRequest("/api/auth/resend", { email }), ctx);
    }
    const res = await verify(
      jsonRequest(
        "/api/auth/verify",
        { email, code: lastMailedCode() },
        { ip: "10.9.9.9" },
      ),
      ctx,
    );
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("CODE_DAILY_LIMIT");
  });
});

describe("bloklangan foydalanuvchi", () => {
  it("kira olmaydi, CV ga yo'li yo'q, parol tiklash xati ketmaydi", async () => {
    const cookie = await student("blok@test.local");
    await db.user.update({
      where: { email: "blok@test.local" },
      data: { status: "BLOCKED" },
    });
    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "blok@test.local",
        password: PASSWORD,
      }),
      ctx,
    );
    expect(res.status).toBe(403);
    expect(sessionCookie(res)).toBeUndefined();
    expect((await getCv(getRequest("/api/cv/me", cookie), ctx)).status).toBe(
      401,
    );
    expect(
      (await getPdf(getRequest("/api/cv/me/pdf", cookie), ctx)).status,
    ).toBe(401);

    const mailsBefore = sentMails.length;
    await skipResendCooldown("blok@test.local");
    await forgot(
      jsonRequest("/api/auth/forgot", { email: "blok@test.local" }),
      ctx,
    );
    expect(sentMails.length).toBe(mailsBefore);
  });
});

it("juda katta so'rov tanasi o'qilmaydi (413)", async () => {
  const cookie = await student("katta@test.local");
  const res = await putCv(
    jsonRequest("/api/cv/me", cvBody("x".repeat(MAX_JSON_BYTES)), {
      cookie,
      method: "PUT",
    }),
    ctx,
  );
  expect(res.status).toBe(413);
  expect((await res.json()).error).toBe("PAYLOAD_TOO_LARGE");
});
