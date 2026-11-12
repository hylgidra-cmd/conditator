import { describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as list, POST as create } from "@/app/api/vacancies/route";
import { GET as getOne, PUT as update } from "@/app/api/vacancies/[id]/route";
import { db } from "@/backend/db";
import { VACANCY_TEXT_MAX } from "@/backend/vacancy/schema";
import { getRequest, jsonRequest, sessionCookie } from "./helpers";

const ctx = undefined as never;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function signUp(email: string, role: "STUDENT" | "COMPANY" = "COMPANY") {
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
  const res = await login(
    jsonRequest("/api/auth/login", { email, password: "parol-12345" }),
    ctx,
  );
  return sessionCookie(res)!;
}

const base = {
  title: null,
  rawText: null,
  skills: [],
  languages: [],
  minExperienceYears: null,
  location: null,
  workType: null,
};
const post = (cookie: string, body: Record<string, unknown>) =>
  create(jsonRequest("/api/vacancies", { ...base, ...body }, { cookie }), ctx);

describe("talab yaratish", () => {
  it("maydonlar bilan; tasdiqlanmagan (PENDING) kompaniya ham yarata oladi", async () => {
    const cookie = await signUp("hr@test.local");
    const res = await post(cookie, {
      title: "  Frontend dasturchi ",
      skills: ["React", " react ", "TypeScript", ""],
      languages: ["English"],
      minExperienceYears: 1,
      location: "Nukus",
      workType: "REMOTE",
    });
    expect(res.status).toBe(201);
    const { vacancy } = await res.json();
    expect(vacancy).toMatchObject({
      title: "Frontend dasturchi",
      skills: ["React", "TypeScript"],
      languages: ["English"],
      minExperienceYears: 1,
      workType: "REMOTE",
      rawText: null,
    });
    expect((await db.company.findFirstOrThrow()).approval).toBe("PENDING");
  });

  it.each([
    [
      "kk",
      "Bizge React biletuǵın frontend islep shıǵıwshı kerek.\nNókis, ámeliyat",
    ],
    ["ru", "Нужен frontend-разработчик со знанием React.\nНукус, стажировка"],
  ])(
    "faqat erkin matn (%s): rawText saqlanadi, sarlavha birinchi qatordan",
    async (_, text) => {
      const cookie = await signUp("hr@test.local");
      const res = await post(cookie, { rawText: text });
      expect(res.status).toBe(201);
      const { vacancy } = await res.json();
      expect(vacancy.rawText).toBe(text);
      expect(vacancy.title).toBe(text.split("\n")[0]);
    },
  );

  it.each([
    [{}, "title", "TITLE_OR_TEXT_REQUIRED"],
    [{ title: "   ", rawText: "  " }, "title", "TITLE_OR_TEXT_REQUIRED"],
    [{ title: "x".repeat(121) }, "title", "FIELD_TOO_LONG"],
    [{ rawText: "ǵ".repeat(VACANCY_TEXT_MAX + 1) }, "rawText", "TEXT_TOO_LONG"],
    [
      { title: "A", skills: Array.from({ length: 31 }, (_, i) => `s${i}`) },
      "skills",
      "TOO_MANY_ITEMS",
    ],
    [{ title: "A", skills: ["x".repeat(61)] }, "skills.0", "FIELD_TOO_LONG"],
    [
      { title: "A", languages: Array.from({ length: 11 }, (_, i) => `l${i}`) },
      "languages",
      "TOO_MANY_ITEMS",
    ],
    [
      { title: "A", minExperienceYears: 51 },
      "minExperienceYears",
      "INVALID_NUMBER",
    ],
    [
      { title: "A", minExperienceYears: -1 },
      "minExperienceYears",
      "INVALID_NUMBER",
    ],
    [
      { title: "A", minExperienceYears: 1.5 },
      "minExperienceYears",
      "INVALID_NUMBER",
    ],
    [
      { title: "A", minExperienceYears: "3" },
      "minExperienceYears",
      "INVALID_NUMBER",
    ],
    [{ title: "A", location: "x".repeat(101) }, "location", "FIELD_TOO_LONG"],
    [{ title: "A", workType: "ANY" }, "workType", "FIELD_REQUIRED"],
  ])("noto'g'ri kiritish rad etiladi: %j", async (body, field, code) => {
    const cookie = await signUp("hr@test.local");
    const res = await post(cookie, body);
    expect(res.status).toBe(400);
    expect((await res.json()).fields[field]).toBe(code);
    expect(await db.vacancy.count()).toBe(0);
  });

  it("3000 belgilik qoraqalpoq matni o'tadi", async () => {
    const cookie = await signUp("hr@test.local");
    const res = await post(cookie, { rawText: "ǵ".repeat(VACANCY_TEXT_MAX) });
    expect(res.status).toBe(201);
  });
});

describe("talablar tarixi", () => {
  it("server tomonda sahifalanadi, yangilari birinchi", async () => {
    const cookie = await signUp("hr@test.local");
    const company = await db.company.findFirstOrThrow();
    await db.vacancy.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        companyId: company.id,
        title: `Talab ${i + 1}`,
        createdAt: new Date(Date.UTC(2026, 9, 1 + i)),
      })),
    });
    const page = async (query: string) =>
      (await list(getRequest(`/api/vacancies${query}`, cookie), ctx)).json();

    const first = await page("");
    expect(first).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 12,
      pageCount: 2,
    });
    expect(first.items).toHaveLength(10);
    expect(first.items[0].title).toBe("Talab 12");
    const second = await page("?page=2");
    expect(second.items.map((v: { title: string }) => v.title)).toEqual([
      "Talab 2",
      "Talab 1",
    ]);
    expect((await page("?page=abc")).page).toBe(1);
  });

  it("faqat o'z talablari ko'rinadi", async () => {
    const mine = await signUp("hr@test.local");
    await post(mine, { title: "Meniki" });
    const other = await signUp("boshqa@test.local");
    const res = await list(getRequest("/api/vacancies", other), ctx);
    expect((await res.json()).total).toBe(0);
  });
});

describe("tahrirlash va ruxsat", () => {
  it("o'z talabi tahrirlanadi; boshqa kompaniyaga 404, talabaga 403, sessiyasiz 401", async () => {
    const cookie = await signUp("hr@test.local");
    const { vacancy } = await (await post(cookie, { title: "Eski" })).json();
    const put = (who: string | undefined, body: Record<string, unknown>) =>
      update(
        jsonRequest(
          `/api/vacancies/${vacancy.id}`,
          { ...base, ...body },
          { cookie: who, method: "PUT" },
        ),
        params(vacancy.id),
      );

    const res = await put(cookie, { title: "Yangi", skills: ["SQL"] });
    expect(res.status).toBe(200);
    const updated = (await res.json()).vacancy;
    expect(updated).toMatchObject({ title: "Yangi", skills: ["SQL"] });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(vacancy.updatedAt).getTime(),
    );

    const other = await signUp("boshqa@test.local");
    expect((await put(other, { title: "Buzish" })).status).toBe(404);
    expect(
      (
        await getOne(
          getRequest(`/api/vacancies/${vacancy.id}`, other),
          params(vacancy.id),
        )
      ).status,
    ).toBe(404);
    const student = await signUp("talaba@test.local", "STUDENT");
    expect((await put(student, { title: "X" })).status).toBe(403);
    expect((await put(undefined, { title: "X" })).status).toBe(401);
    expect((await db.vacancy.findFirstOrThrow()).title).toBe("Yangi");
  });
});
