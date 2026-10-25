import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PATCH as approve } from "@/app/api/admin/companies/[id]/approve/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as verify } from "@/app/api/auth/verify/route";
import {
  GET as getCompany,
  PUT as putCompany,
} from "@/app/api/company/me/route";
import {
  DELETE as deleteLogo,
  GET as getLogo,
  POST as postLogo,
} from "@/app/api/company/me/logo/route";
import { GET as companyCv } from "@/app/api/cv/[id]/route";
import { GET as companyCvPdf } from "@/app/api/cv/[id]/pdf/route";
import { PUT as putCv } from "@/app/api/cv/me/route";
import { PATCH as patchVisibility } from "@/app/api/cv/me/visibility/route";
import { createSession } from "@/lib/auth/session";
import { companyAccess } from "@/lib/company/access";
import { LOGO_MAX_BYTES } from "@/lib/company/logo";
import { closePdfBrowser } from "@/lib/cv-document/pdf";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  getRequest,
  jsonRequest,
  lastMailedCode,
  sessionCookie,
} from "./helpers";

const ctx = undefined as never;
let uploadDir: string;

beforeAll(async () => {
  uploadDir = await mkdtemp(path.join(tmpdir(), "jumis-uploads-"));
  process.env.UPLOAD_DIR = uploadDir;
});
afterAll(async () => {
  await closePdfBrowser();
  await rm(uploadDir, { recursive: true, force: true });
});

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
  "hex",
);

async function signUp(email: string, role: "STUDENT" | "COMPANY") {
  await register(
    jsonRequest("/api/auth/register", {
      email,
      password: "parol-12345",
      role,
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

async function adminCookie() {
  const admin = await db.user.create({
    data: {
      email: "admin@test.local",
      passwordHash: "x",
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  const response = NextResponse.json({});
  await createSession(response, admin.id);
  return sessionCookie(response)!;
}

/** Ochiq (saqlangan va ko'rinadigan) CV li talaba. */
async function visibleCv(email = "talaba@test.local") {
  const cookie = await signUp(email, "STUDENT");
  await putCv(
    jsonRequest(
      "/api/cv/me",
      {
        language: "en",
        workTypes: [],
        data: {
          fullName: "Aziza Karimova",
          contact: { email, phone: "+998 90 000 00 00" },
          goal: "Frontend",
          location: null,
          education: [],
          experience: [],
          skills: ["React"],
          languages: [],
          certificates: [],
        },
      },
      { cookie, method: "PUT" },
    ),
    ctx,
  );
  await patchVisibility(
    jsonRequest(
      "/api/cv/me/visibility",
      { isVisible: true },
      { cookie, method: "PATCH" },
    ),
    ctx,
  );
  const cv = await db.cv.findFirstOrThrow({ where: { user: { email } } });
  return { cookie, cvId: cv.id };
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const viewCv = (id: string, cookie?: string) =>
  companyCv(getRequest(`/api/cv/${id}`, cookie), params(id));
const viewPdf = (id: string, cookie?: string) =>
  companyCvPdf(getRequest(`/api/cv/${id}/pdf`, cookie), params(id));

async function setApproval(approval: "PENDING" | "APPROVED" | "REJECTED") {
  await db.company.updateMany({ data: { approval } });
}

describe("tasdiqlanmagan kompaniya CV ko'ra olmaydi", () => {
  it.each(["PENDING", "REJECTED"] as const)(
    "%s: CV va PDF endpointlari 403, ko'rish yozilmaydi",
    async (approval) => {
      const { cvId } = await visibleCv();
      const company = await signUp("hr@test.local", "COMPANY");
      await setApproval(approval);

      for (const res of [
        await viewCv(cvId, company),
        await viewPdf(cvId, company),
      ]) {
        expect(res.status).toBe(403);
        expect((await res.json()).error).toBe("COMPANY_NOT_APPROVED");
      }
      expect(await db.cvView.count()).toBe(0);
    },
  );

  it("yangi kompaniya PENDING holatida yaratiladi", async () => {
    await signUp("hr@test.local", "COMPANY");
    const company = await db.company.findFirstOrThrow();
    expect(company.approval).toBe("PENDING");
    expect(companyAccess(company).canViewCvs).toBe(false);
  });

  it("sessiyasiz 401, talaba 403", async () => {
    const { cookie, cvId } = await visibleCv();
    expect((await viewCv(cvId)).status).toBe(401);
    expect((await viewCv(cvId, cookie)).status).toBe(403);
  });
});

describe("tasdiqlangan kompaniya", () => {
  it("faqat ochiq CV ni ko'radi, har ochish yoziladi", async () => {
    const { cookie: student, cvId } = await visibleCv();
    const company = await signUp("hr@test.local", "COMPANY");
    await setApproval("APPROVED");

    const res = await viewCv(cvId, company);
    expect(res.status).toBe(200);
    expect((await res.json()).cv.data.fullName).toBe("Aziza Karimova");

    const pdf = await viewPdf(cvId, company);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    expect(
      await db.cvView.findMany({
        select: { pdf: true },
        orderBy: { createdAt: "asc" },
      }),
    ).toEqual([{ pdf: false }, { pdf: true }]);

    // Yashirilgan CV, mavjud bo'lmagan CV va bloklangan talaba: 404.
    await patchVisibility(
      jsonRequest(
        "/api/cv/me/visibility",
        { isVisible: false },
        { cookie: student, method: "PATCH" },
      ),
      ctx,
    );
    expect((await viewCv(cvId, company)).status).toBe(404);
    expect((await viewCv("yoq", company)).status).toBe(404);
    await db.cv.update({ where: { id: cvId }, data: { isVisible: true } });
    await db.user.updateMany({
      where: { role: "STUDENT" },
      data: { status: "BLOCKED" },
    });
    expect((await viewCv(cvId, company)).status).toBe(404);
  }, 60_000);

  it("saqlanmagan CV ko'rinmaydi", async () => {
    const { cvId } = await visibleCv();
    await db.cv.update({ where: { id: cvId }, data: { savedAt: null } });
    const company = await signUp("hr@test.local", "COMPANY");
    await setApproval("APPROVED");
    expect((await viewCv(cvId, company)).status).toBe(404);
  });
});

describe("admin tasdiqlashi", () => {
  it("faqat admin tasdiqlaydi va rad etadi", async () => {
    const company = await signUp("hr@test.local", "COMPANY");
    const { id } = await db.company.findFirstOrThrow();
    const call = (cookie: string, approved: boolean) =>
      approve(
        jsonRequest(
          `/api/admin/companies/${id}/approve`,
          { approved },
          { cookie, method: "PATCH" },
        ),
        params(id),
      );

    expect((await call(company, true)).status).toBe(403);
    const admin = await adminCookie();
    expect((await call(admin, true)).status).toBe(200);
    expect((await db.company.findFirstOrThrow()).approval).toBe("APPROVED");
    expect((await call(admin, false)).status).toBe(200);
    expect((await db.company.findFirstOrThrow()).approval).toBe("REJECTED");
  });
});

describe("kompaniya profili", () => {
  it("saqlanadi; tasdiq holatini kompaniya o'zi o'zgartira olmaydi", async () => {
    const cookie = await signUp("hr@test.local", "COMPANY");
    const res = await putCompany(
      jsonRequest(
        "/api/company/me",
        {
          name: "  Raqamli Yechimlar  ",
          country: "Oʻzbekiston",
          industry: "IT",
          size: "11-50",
          contactPerson: "Dilnoza",
          approval: "APPROVED",
          subscriptionUntil: "2030-01-01",
        },
        { cookie, method: "PUT" },
      ),
      ctx,
    );
    expect(res.status).toBe(200);
    const { company } = await res.json();
    expect(company).toMatchObject({
      name: "Raqamli Yechimlar",
      size: "11-50",
      approval: "PENDING",
      subscriptionUntil: null,
    });
    expect(
      (
        await (
          await getCompany(getRequest("/api/company/me", cookie), ctx)
        ).json()
      ).company.name,
    ).toBe("Raqamli Yechimlar");
  });

  it("nom majburiy, o'lcham ro'yxatdan; talaba kira olmaydi", async () => {
    const cookie = await signUp("hr@test.local", "COMPANY");
    const res = await putCompany(
      jsonRequest(
        "/api/company/me",
        {
          name: " ",
          country: null,
          industry: null,
          size: "5",
          contactPerson: null,
        },
        { cookie, method: "PUT" },
      ),
      ctx,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toMatchObject({
      name: "FIELD_REQUIRED",
      size: "FIELD_REQUIRED",
    });
    const student = await signUp("talaba@test.local", "STUDENT");
    expect(
      (await getCompany(getRequest("/api/company/me", student), ctx)).status,
    ).toBe(403);
  });
});

describe("logo", () => {
  function upload(
    cookie: string,
    bytes: Buffer,
    filename: string,
    type: string,
  ) {
    const form = new FormData();
    form.append("logo", new File([new Uint8Array(bytes)], filename, { type }));
    return postLogo(
      new NextRequest("http://localhost:3000/api/company/me/logo", {
        method: "POST",
        headers: { cookie },
        body: form,
      }),
      ctx,
    );
  }

  it("PNG yuklanadi, nomi server tomonidan beriladi, faqat API orqali o'qiladi", async () => {
    const cookie = await signUp("hr@test.local", "COMPANY");
    const res = await upload(cookie, PNG, "../../etc/passwd.png", "image/png");
    expect(res.status).toBe(200);
    expect((await res.json()).company.hasLogo).toBe(true);

    const { logoPath } = await db.company.findFirstOrThrow();
    expect(logoPath).toMatch(/^[a-z0-9]+-[0-9a-f-]{36}\.png$/);
    expect(await readdir(path.join(uploadDir, "logos"))).toEqual([logoPath]);

    const logo = await getLogo(getRequest("/api/company/me/logo", cookie), ctx);
    expect(logo.headers.get("content-type")).toBe("image/png");
    expect(logo.headers.get("content-security-policy")).toContain("sandbox");
    expect(Buffer.from(await logo.arrayBuffer()).equals(PNG)).toBe(true);
    expect(
      (await getLogo(getRequest("/api/company/me/logo"), ctx)).status,
    ).toBe(401);

    await deleteLogo(
      new NextRequest("http://localhost:3000/api/company/me/logo", {
        method: "DELETE",
        headers: { cookie },
      }),
      ctx,
    );
    expect(await readdir(path.join(uploadDir, "logos"))).toEqual([]);
  });

  it("rasm bo'lmagan fayl va katta fayl rad etiladi", async () => {
    const cookie = await signUp("hr@test.local", "COMPANY");
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const fake = await upload(cookie, svg, "logo.png", "image/png");
    expect(fake.status).toBe(415);
    expect((await fake.json()).error).toBe("FILE_TYPE_NOT_ALLOWED");

    const big = Buffer.concat([PNG, Buffer.alloc(LOGO_MAX_BYTES)]);
    const large = await upload(cookie, big, "big.png", "image/png");
    expect(large.status).toBe(413);
    expect((await db.company.findFirstOrThrow()).logoPath).toBeNull();
  });
});

describe("companyAccess", () => {
  it("AI saralash faqat tasdiq va faol obuna bilan", () => {
    const now = new Date("2026-10-25T00:00:00Z");
    const future = new Date("2026-11-25T00:00:00Z");
    const past = new Date("2026-09-25T00:00:00Z");
    expect(
      companyAccess({ approval: "PENDING", subscriptionUntil: future }, now),
    ).toMatchObject({ canViewCvs: false, canRunMatching: false });
    expect(
      companyAccess({ approval: "APPROVED", subscriptionUntil: past }, now),
    ).toMatchObject({ canViewCvs: true, canRunMatching: false });
    expect(
      companyAccess({ approval: "APPROVED", subscriptionUntil: future }, now),
    ).toMatchObject({ canViewCvs: true, canRunMatching: true });
  });
});
