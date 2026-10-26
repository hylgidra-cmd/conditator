import { describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as getCv, PUT as putCv } from "@/app/api/cv/me/route";
import { PATCH as patchVisibility } from "@/app/api/cv/me/visibility/route";
import { db } from "@/lib/db";
import { getRequest, jsonRequest, sessionCookie } from "./helpers";

const ctx = undefined as never;

async function loggedIn(role: "STUDENT" | "COMPANY", email?: string) {
  const address = email ?? `${role.toLowerCase()}@test.local`;
  await register(
    jsonRequest("/api/auth/register", {
      email: address,
      password: "parol-12345",
      role,
      consent: true,
      locale: "uz",
    }),
    ctx,
  );
  const res = await login(
    jsonRequest("/api/auth/login", { email: address, password: "parol-12345" }),
    ctx,
  );
  return sessionCookie(res)!;
}

function cvBody(overrides: Record<string, unknown> = {}) {
  return {
    language: "en",
    sourceText: "Men frontend dasturchiman",
    workTypes: ["REMOTE", "REMOTE", "INTERNSHIP"],
    data: {
      fullName: "Aziza Karimova",
      contact: { email: "aziza@mail.local", phone: "+998 90 123 45 67" },
      goal: "Junior frontend developer",
      location: "Nukus",
      education: [
        {
          institution: "Qoraqalpoq davlat universiteti",
          degree: "Bakalavr",
          field: "Informatika",
          startYear: "2021",
          endYear: "2025",
        },
      ],
      experience: [],
      skills: [" React ", "react", "TypeScript"],
      languages: [{ name: "English", level: "B2" }],
      certificates: [],
      ...overrides,
    },
  };
}

const put = (body: unknown, cookie?: string) =>
  putCv(jsonRequest("/api/cv/me", body, { cookie, method: "PUT" }), ctx);
const patch = (body: unknown, cookie?: string) =>
  patchVisibility(
    jsonRequest("/api/cv/me/visibility", body, { cookie, method: "PATCH" }),
    ctx,
  );

describe("talabaning CV si: ruxsatlar", () => {
  it("sessiyasiz 401, kompaniya uchun 403", async () => {
    expect((await getCv(getRequest("/api/cv/me"), ctx)).status).toBe(401);
    expect((await put(cvBody())).status).toBe(401);
    expect((await patch({ isVisible: true })).status).toBe(401);

    const company = await loggedIn("COMPANY");
    expect((await getCv(getRequest("/api/cv/me", company), ctx)).status).toBe(
      403,
    );
    expect((await put(cvBody(), company)).status).toBe(403);
    expect((await patch({ isVisible: true }, company)).status).toBe(403);
  });

  it("talaba faqat o'z CV sini ko'radi", async () => {
    const first = await loggedIn("STUDENT", "birinchi@test.local");
    await put(cvBody(), first);
    const second = await loggedIn("STUDENT", "ikkinchi@test.local");

    const res = await getCv(getRequest("/api/cv/me", second), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).cv).toBeNull();
  });
});

describe("CV ni saqlash", () => {
  it("saqlaydi, filtr maydonlarini to'ldiradi va yashirin qoldiradi", async () => {
    const cookie = await loggedIn("STUDENT");
    const res = await put(cvBody(), cookie);
    expect(res.status).toBe(200);
    const { cv } = await res.json();
    expect(cv.isVisible).toBe(false);
    expect(cv.savedAt).toBeTruthy();
    expect(cv.missingFields).toEqual(["experience", "certificates"]);
    expect(cv.workTypes).toEqual(["REMOTE", "INTERNSHIP"]);

    const row = await db.cv.findFirstOrThrow();
    expect(row.skills).toEqual(["react", "typescript"]);
    expect(row.languages).toEqual(["english"]);
    expect(row.location).toBe("Nukus");
    expect(row.searchText).toContain("react");
    // Qidiruv matnida ism va aloqa ma'lumoti yo'q.
    expect(row.searchText).not.toContain("aziza");
    expect(row.searchText).not.toContain("mail.local");
    expect(row.searchText).not.toContain("123");
  });

  it("qayta saqlash ochiq CV ni yashirmaydi va savedAt ni yangilaydi", async () => {
    const cookie = await loggedIn("STUDENT");
    const first = (await (await put(cvBody(), cookie)).json()).cv;
    expect((await patch({ isVisible: true }, cookie)).status).toBe(200);

    const second = (await (await put(cvBody({ goal: "Yangi" }), cookie)).json())
      .cv;
    expect(second.isVisible).toBe(true);
    expect(new Date(second.savedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.savedAt).getTime(),
    );
  });

  it("noto'g'ri ma'lumotda maydon xatolarini qaytaradi", async () => {
    const cookie = await loggedIn("STUDENT");
    const res = await put(
      cvBody({
        education: [
          {
            institution: "  ",
            degree: null,
            field: null,
            startYear: null,
            endYear: null,
          },
        ],
        contact: { email: "email-emas", phone: null },
      }),
      cookie,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("VALIDATION");
    expect(body.fields["data.education.0.institution"]).toBe("FIELD_REQUIRED");
    expect(body.fields["data.contact.email"]).toBe("INVALID_EMAIL");
    expect(await db.cv.count()).toBe(0);
  });
});

describe("ochiq/yashirin", () => {
  it("saqlanmagan CV ni ochib bo'lmaydi", async () => {
    const cookie = await loggedIn("STUDENT");
    const res = await patch({ isVisible: true }, cookie);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("CV_NOT_SAVED");
  });

  it("saqlangandan keyin ochiladi va yopiladi", async () => {
    const cookie = await loggedIn("STUDENT");
    await put(cvBody(), cookie);
    const opened = await patch({ isVisible: true }, cookie);
    expect((await opened.json()).cv.isVisible).toBe(true);
    const closed = await patch({ isVisible: false }, cookie);
    expect((await closed.json()).cv.isVisible).toBe(false);
  });
});
