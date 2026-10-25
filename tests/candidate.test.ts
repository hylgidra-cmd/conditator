import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as verify } from "@/app/api/auth/verify/route";
import { GET as getCv } from "@/app/api/cv/[id]/route";
import { GET as getCvPdf } from "@/app/api/cv/[id]/pdf/route";
import { PUT as putDecision } from "@/app/api/vacancies/[id]/candidates/[cvId]/decision/route";
import { POST as matchPost } from "@/app/api/vacancies/[id]/match/route";
import { GET as matchesGet } from "@/app/api/vacancies/[id]/matches/route";
import { GET as listVacancies } from "@/app/api/vacancies/route";
import { setAiProviderForTests } from "@/lib/ai/provider";
import { db } from "@/lib/db";
import { decisionCounts, listDecided } from "@/lib/match/decision";
import {
  getRequest,
  jsonRequest,
  lastMailedCode,
  sessionCookie,
} from "./helpers";
import {
  companySession,
  ctx,
  params,
  runMatch,
  ScoringAi,
  studentCv,
  vacancy,
} from "./match-fixtures";

let ai: ScoringAi;
beforeEach(() => {
  ai = new ScoringAi();
  setAiProviderForTests(ai);
});
afterEach(() => setAiProviderForTests(undefined));

const decide = (
  cookie: string,
  vacancyId: string,
  cvId: string,
  decision: string,
) =>
  putDecision(
    jsonRequest(
      `/api/vacancies/${vacancyId}/candidates/${cvId}/decision`,
      { decision },
      { cookie, method: "PUT" },
    ),
    { params: Promise.resolve({ id: vacancyId, cvId }) },
  );

async function studentSession(email = "s@test.local") {
  await register(
    jsonRequest("/api/auth/register", {
      email,
      password: "parol-12345",
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

describe("nomzod CV si", () => {
  it("tasdiqlangan kompaniya ochiq CV ni ism va aloqa bilan ko'radi, har ochish logga yoziladi", async () => {
    const { cookie, companyId } = await companySession();
    const cv = await studentCv({
      fullName: "Aziza Karimova",
      phone: "+998 91 765 43 21",
    });
    const res = await getCv(
      getRequest(`/api/cv/${cv.cvId}`, cookie),
      params(cv.cvId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cv.data.fullName).toBe("Aziza Karimova");
    expect(body.cv.data.contact.phone).toBe("+998 91 765 43 21");
    expect(await db.cvView.count({ where: { companyId, cvId: cv.cvId } })).toBe(
      1,
    );
  });

  it("yashirin CV ga kirib bo'lmaydi: CV, PDF va qaror 404", async () => {
    const { cookie, companyId } = await companySession();
    const hidden = await studentCv({ visible: false });
    const vac = await vacancy(companyId);
    expect(
      (
        await getCv(
          getRequest(`/api/cv/${hidden.cvId}`, cookie),
          params(hidden.cvId),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await getCvPdf(
          getRequest(`/api/cv/${hidden.cvId}/pdf`, cookie),
          params(hidden.cvId),
        )
      ).status,
    ).toBe(404);
    expect((await decide(cookie, vac.id, hidden.cvId, "SELECTED")).status).toBe(
      404,
    );
    expect((await decide(cookie, vac.id, "yoq-id", "SELECTED")).status).toBe(
      404,
    );
    expect(await db.match.count()).toBe(0);
    expect(await db.cvView.count()).toBe(0);
  });

  it("CV yashirilsa, oldin ochilgan bo'lsa ham endi ko'rinmaydi va qaror sonida hisoblanmaydi", async () => {
    const { cookie, companyId } = await companySession();
    const cv = await studentCv();
    const vac = await vacancy(companyId);
    expect((await decide(cookie, vac.id, cv.cvId, "SELECTED")).status).toBe(
      200,
    );
    await db.cv.update({ where: { id: cv.cvId }, data: { isVisible: false } });
    expect(
      (await getCv(getRequest(`/api/cv/${cv.cvId}`, cookie), params(cv.cvId)))
        .status,
    ).toBe(404);
    expect((await decisionCounts([vac.id])).get(vac.id)).toBeUndefined();
    expect(await listDecided(vac.id)).toEqual([]);
  });
});

describe("Tanlandi / Mos emas", () => {
  it("qaror saqlanadi, o'zgaradi, olib tashlanadi; talablar tarixida soni ko'rinadi", async () => {
    const { cookie, companyId } = await companySession();
    const a = await studentCv();
    const b = await studentCv();
    const vac = await vacancy(companyId);
    await runMatch(cookie, vac.id);

    let res = await decide(cookie, vac.id, a.cvId, "SELECTED");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ decision: "SELECTED" });
    await decide(cookie, vac.id, b.cvId, "REJECTED");
    expect((await decisionCounts([vac.id])).get(vac.id)).toEqual({
      selected: 1,
      rejected: 1,
    });

    // Saralash natijasida ham ko'rinadi.
    const outcome = await (
      await matchesGet(
        getRequest(`/api/vacancies/${vac.id}/matches?locale=uz`, cookie),
        params(vac.id),
      )
    ).json();
    const byId = Object.fromEntries(
      outcome.results.map((r: { cvId: string; decision: string }) => [
        r.cvId,
        r.decision,
      ]),
    );
    expect(byId).toEqual({ [a.cvId]: "SELECTED", [b.cvId]: "REJECTED" });

    res = await decide(cookie, vac.id, a.cvId, "NONE");
    expect(await res.json()).toEqual({ decision: "NONE" });
    expect((await decisionCounts([vac.id])).get(vac.id)).toEqual({
      selected: 0,
      rejected: 1,
    });
    // Qaror AI natijasini o'zgartirmaydi.
    expect(await db.match.count({ where: { hash: "" } })).toBe(0);
  });

  it("AI baholamagan nomzodga ham qaror qo'yiladi; keyingi saralashda AI baholaydi, qaror saqlanadi", async () => {
    const { cookie, companyId } = await companySession();
    const cv = await studentCv();
    const vac = await vacancy(companyId);
    expect((await decide(cookie, vac.id, cv.cvId, "SELECTED")).status).toBe(
      200,
    );
    expect(ai.requests).toHaveLength(0);

    const { body } = await runMatch(cookie, vac.id);
    expect(ai.requests).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      cvId: cv.cvId,
      decision: "SELECTED",
    });
    expect((await db.match.findFirstOrThrow()).score).toBeGreaterThan(0);
  });

  it("noto'g'ri qiymat 400; boshqa kompaniyaning talabi 404", async () => {
    const other = await companySession("boshqa@test.local");
    const otherVac = await vacancy(other.companyId);
    const { cookie, companyId } = await companySession();
    const cv = await studentCv();
    const vac = await vacancy(companyId);
    expect((await decide(cookie, vac.id, cv.cvId, "MAYBE")).status).toBe(400);
    expect(
      (await decide(cookie, otherVac.id, cv.cvId, "SELECTED")).status,
    ).toBe(404);
    expect(await db.match.count()).toBe(0);
  });

  it("PENDING kompaniya qaror qo'ya olmaydi va CV ni ko'rmaydi (403)", async () => {
    const { cookie, companyId } = await companySession("hr@test.local", {
      approval: "PENDING",
    });
    const cv = await studentCv();
    const vac = await vacancy(companyId);
    expect((await decide(cookie, vac.id, cv.cvId, "SELECTED")).status).toBe(
      403,
    );
    expect(
      (await getCv(getRequest(`/api/cv/${cv.cvId}`, cookie), params(cv.cvId)))
        .status,
    ).toBe(403);
    expect(await db.match.count()).toBe(0);
  });
});

describe("talaba kompaniya endpointlariga kira olmaydi", () => {
  it("CV, PDF, saralash, natijalar, qaror va talablar: 403", async () => {
    const { companyId } = await companySession();
    const other = await studentCv();
    const vac = await vacancy(companyId);
    const student = await studentSession();

    const statuses = [
      (
        await getCv(
          getRequest(`/api/cv/${other.cvId}`, student),
          params(other.cvId),
        )
      ).status,
      (
        await getCvPdf(
          getRequest(`/api/cv/${other.cvId}/pdf`, student),
          params(other.cvId),
        )
      ).status,
      (
        await matchPost(
          jsonRequest(
            `/api/vacancies/${vac.id}/match`,
            { locale: "uz" },
            { cookie: student },
          ),
          params(vac.id),
        )
      ).status,
      (
        await matchesGet(
          getRequest(`/api/vacancies/${vac.id}/matches`, student),
          params(vac.id),
        )
      ).status,
      (await decide(student, vac.id, other.cvId, "SELECTED")).status,
      (await listVacancies(getRequest("/api/vacancies", student), ctx)).status,
    ];
    expect(statuses).toEqual([403, 403, 403, 403, 403, 403]);
    expect(await db.match.count()).toBe(0);
    expect(await db.cvView.count()).toBe(0);
    expect(ai.requests).toHaveLength(0);
  });

  it("kirmagan foydalanuvchi: 401", async () => {
    const { companyId } = await companySession();
    const cv = await studentCv();
    const vac = await vacancy(companyId);
    expect((await decide("", vac.id, cv.cvId, "SELECTED")).status).toBe(401);
    expect(
      (await getCv(getRequest(`/api/cv/${cv.cvId}`), params(cv.cvId))).status,
    ).toBe(401);
  });
});
