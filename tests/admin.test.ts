import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as getAi, PUT as putAi } from "@/app/api/admin/ai/route";
import { PATCH as approve } from "@/app/api/admin/companies/[id]/approve/route";
import { PATCH as subscription } from "@/app/api/admin/companies/[id]/subscription/route";
import { GET as companies } from "@/app/api/admin/companies/route";
import { GET as logs } from "@/app/api/admin/logs/route";
import { GET as stats } from "@/app/api/admin/stats/route";
import { PATCH as userStatus } from "@/app/api/admin/users/[id]/status/route";
import { GET as users } from "@/app/api/admin/users/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as getCv } from "@/app/api/cv/me/route";
import { monthStart } from "@/backend/ai/budget";
import { endOfDayTashkent } from "@/backend/admin/service";
import { hashPassword } from "@/backend/auth/password";
import { createSession } from "@/backend/auth/session";
import { companyAccess } from "@/backend/company/access";
import { db } from "@/backend/db";
import { getRequest, jsonRequest, sessionCookie } from "./helpers";

const ctx = undefined as never;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const PASSWORD = "parol-12345";

async function user(
  email: string,
  role: "STUDENT" | "COMPANY" | "ADMIN" = "STUDENT",
) {
  return db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(PASSWORD),
      role,
      emailVerifiedAt: new Date(),
    },
  });
}

async function cookieFor(userId: string) {
  const response = NextResponse.json({});
  await createSession(response, userId);
  return sessionCookie(response)!;
}

async function adminCookie() {
  const admin = await user("admin@test.local", "ADMIN");
  return { admin, cookie: await cookieFor(admin.id) };
}

async function company(email: string, name: string) {
  const owner = await user(email, "COMPANY");
  return db.company.create({ data: { userId: owner.id, name } });
}

const patch = (path: string, body: unknown, cookie: string) =>
  jsonRequest(path, body, { cookie, method: "PATCH" });

describe("faqat ADMIN kira oladi", () => {
  it("talaba va kompaniya 403, kirmagan 401; hech narsa o'zgarmaydi", async () => {
    const target = await company("hr@test.local", "Firma");
    const student = await user("s@test.local");
    for (const cookie of [
      await cookieFor(student.id),
      await cookieFor(target.userId),
      "",
    ]) {
      const expected = cookie ? 403 : 401;
      const statuses = [
        (await users(getRequest("/api/admin/users", cookie), ctx)).status,
        (
          await userStatus(
            patch(
              `/api/admin/users/${student.id}/status`,
              { status: "BLOCKED" },
              cookie,
            ),
            params(student.id),
          )
        ).status,
        (await companies(getRequest("/api/admin/companies", cookie), ctx))
          .status,
        (
          await approve(
            patch(
              `/api/admin/companies/${target.id}/approve`,
              { approved: true },
              cookie,
            ),
            params(target.id),
          )
        ).status,
        (
          await subscription(
            patch(
              `/api/admin/companies/${target.id}/subscription`,
              { until: "2030-01-01" },
              cookie,
            ),
            params(target.id),
          )
        ).status,
        (await getAi(getRequest("/api/admin/ai", cookie), ctx)).status,
        (
          await putAi(
            jsonRequest(
              "/api/admin/ai",
              { limitUsd: 1 },
              { cookie, method: "PUT" },
            ),
            ctx,
          )
        ).status,
        (await stats(getRequest("/api/admin/stats", cookie), ctx)).status,
        (await logs(getRequest("/api/admin/logs", cookie), ctx)).status,
      ];
      expect(statuses).toEqual(Array(9).fill(expected));
    }
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: student.id } })).status,
    ).toBe("ACTIVE");
    expect(
      (await db.company.findUniqueOrThrow({ where: { id: target.id } }))
        .approval,
    ).toBe("PENDING");
    expect(await db.setting.count()).toBe(0);
    expect(await db.adminLog.count()).toBe(0);
  });
});

describe("foydalanuvchilar", () => {
  it("server tomonda sahifalanadi (20 tadan), qidiruv va filtr ishlaydi", async () => {
    const { cookie } = await adminCookie();
    for (let i = 0; i < 25; i++)
      await user(`talaba${String(i).padStart(2, "0")}@test.local`);
    await company("hr@firma.uz", "Nukus Soft");

    const page1 = await (
      await users(getRequest("/api/admin/users", cookie), ctx)
    ).json();
    expect(page1).toMatchObject({
      total: 27,
      page: 1,
      pageSize: 20,
      pageCount: 2,
    });
    expect(page1.items).toHaveLength(20);
    const page2 = await (
      await users(getRequest("/api/admin/users?page=2", cookie), ctx)
    ).json();
    expect(page2.items).toHaveLength(7);
    expect(page2.items[0]).not.toHaveProperty("passwordHash");

    const byEmail = await (
      await users(getRequest("/api/admin/users?q=TALABA0", cookie), ctx)
    ).json();
    expect(byEmail.total).toBe(10);
    const byCompany = await (
      await users(getRequest("/api/admin/users?q=nukus%20soft", cookie), ctx)
    ).json();
    expect(byCompany.items.map((u: { email: string }) => u.email)).toEqual([
      "hr@firma.uz",
    ]);
    const byRole = await (
      await users(getRequest("/api/admin/users?role=COMPANY", cookie), ctx)
    ).json();
    expect(byRole.total).toBe(1);
    // Noto'g'ri filtr xato emas: e'tiborga olinmaydi.
    const garbage = await (
      await users(
        getRequest("/api/admin/users?page=abc&role=HACKER", cookie),
        ctx,
      )
    ).json();
    expect(garbage).toMatchObject({ page: 1, total: 27 });
  });

  it("bloklash: sessiyalar o'chadi, kira olmaydi; blokdan chiqarish; ikkalasi jurnalda", async () => {
    const { admin, cookie } = await adminCookie();
    const student = await user("s@test.local");
    const studentCookie = await cookieFor(student.id);

    let res = await userStatus(
      patch(
        `/api/admin/users/${student.id}/status`,
        { status: "BLOCKED" },
        cookie,
      ),
      params(student.id),
    );
    expect(res.status).toBe(200);
    expect(await db.session.count({ where: { userId: student.id } })).toBe(0);
    expect(
      (await getCv(getRequest("/api/cv/me", studentCookie), ctx)).status,
    ).toBe(401);
    const blockedLogin = await login(
      jsonRequest("/api/auth/login", {
        email: "s@test.local",
        password: PASSWORD,
      }),
      ctx,
    );
    expect(blockedLogin.status).toBe(403);
    expect((await blockedLogin.json()).error).toBe("ACCOUNT_BLOCKED");
    const filtered = await (
      await users(getRequest("/api/admin/users?status=BLOCKED", cookie), ctx)
    ).json();
    expect(filtered.items.map((u: { email: string }) => u.email)).toEqual([
      "s@test.local",
    ]);

    res = await userStatus(
      patch(
        `/api/admin/users/${student.id}/status`,
        { status: "ACTIVE" },
        cookie,
      ),
      params(student.id),
    );
    expect(res.status).toBe(200);
    expect(
      (
        await login(
          jsonRequest("/api/auth/login", {
            email: "s@test.local",
            password: PASSWORD,
          }),
          ctx,
        )
      ).status,
    ).toBe(200);

    const entries = await db.adminLog.findMany({
      orderBy: { createdAt: "asc" },
    });
    expect(entries.map((e) => e.action)).toEqual([
      "USER_BLOCK",
      "USER_UNBLOCK",
    ]);
    expect(entries[0]).toMatchObject({
      adminId: admin.id,
      targetType: "User",
      targetId: student.id,
    });
    expect(entries[0].details).toMatchObject({
      email: "s@test.local",
      from: "ACTIVE",
      to: "BLOCKED",
    });
  });

  it("adminni bloklab bo'lmaydi (409); noma'lum foydalanuvchi 404; noto'g'ri qiymat 400", async () => {
    const { admin, cookie } = await adminCookie();
    const other = await user("admin2@test.local", "ADMIN");
    for (const id of [admin.id, other.id]) {
      const res = await userStatus(
        patch(`/api/admin/users/${id}/status`, { status: "BLOCKED" }, cookie),
        params(id),
      );
      expect(res.status).toBe(409);
    }
    expect(
      (
        await userStatus(
          patch("/api/admin/users/yoq/status", { status: "BLOCKED" }, cookie),
          params("yoq"),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await userStatus(
          patch(
            `/api/admin/users/${other.id}/status`,
            { status: "DELETED" },
            cookie,
          ),
          params(other.id),
        )
      ).status,
    ).toBe(400);
    expect(await db.adminLog.count()).toBe(0);
  });
});

describe("kompaniyalar", () => {
  it("tasdiqlash va rad etish, jurnalga yoziladi; ro'yxatda tasdiq kutayotganlar birinchi", async () => {
    const { cookie } = await adminCookie();
    const a = await company("a@test.local", "Alfa");
    const b = await company("b@test.local", "Beta");
    await approve(
      patch(`/api/admin/companies/${a.id}/approve`, { approved: true }, cookie),
      params(a.id),
    );
    const list = await (
      await companies(getRequest("/api/admin/companies", cookie), ctx)
    ).json();
    expect(list.items.map((c: { name: string }) => c.name)).toEqual([
      "Beta",
      "Alfa",
    ]);
    const pending = await (
      await companies(
        getRequest("/api/admin/companies?approval=PENDING", cookie),
        ctx,
      )
    ).json();
    expect(pending.total).toBe(1);

    await approve(
      patch(
        `/api/admin/companies/${b.id}/approve`,
        { approved: false },
        cookie,
      ),
      params(b.id),
    );
    expect(
      (await db.company.findUniqueOrThrow({ where: { id: b.id } })).approval,
    ).toBe("REJECTED");
    const entries = await db.adminLog.findMany({
      orderBy: { createdAt: "asc" },
    });
    expect(entries.map((e) => [e.action, e.targetId])).toEqual([
      ["COMPANY_APPROVE", a.id],
      ["COMPANY_REJECT", b.id],
    ]);
    expect(
      (
        await approve(
          patch("/api/admin/companies/yoq/approve", { approved: true }, cookie),
          params("yoq"),
        )
      ).status,
    ).toBe(404);
  });

  it("obuna: sana bilan yoqiladi (Toshkent kun oxiri), o'chiriladi; AI saralash ruxsati shunga bog'liq", async () => {
    const { cookie } = await adminCookie();
    const c = await company("a@test.local", "Alfa");
    await db.company.update({
      where: { id: c.id },
      data: { approval: "APPROVED" },
    });
    const future = new Date(Date.now() + 10 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    let res = await subscription(
      patch(
        `/api/admin/companies/${c.id}/subscription`,
        { until: future },
        cookie,
      ),
      params(c.id),
    );
    expect(res.status).toBe(200);
    let saved = await db.company.findUniqueOrThrow({ where: { id: c.id } });
    expect(saved.subscriptionUntil?.toISOString()).toBe(
      endOfDayTashkent(future).toISOString(),
    );
    expect(companyAccess(saved).canRunMatching).toBe(true);

    res = await subscription(
      patch(
        `/api/admin/companies/${c.id}/subscription`,
        { until: null },
        cookie,
      ),
      params(c.id),
    );
    saved = await db.company.findUniqueOrThrow({ where: { id: c.id } });
    expect(saved.subscriptionUntil).toBeNull();
    expect(companyAccess(saved).canRunMatching).toBe(false);

    for (const until of ["2030-13-45", "ertaga", 5])
      expect(
        (
          await subscription(
            patch(
              `/api/admin/companies/${c.id}/subscription`,
              { until },
              cookie,
            ),
            params(c.id),
          )
        ).status,
      ).toBe(400);
    expect(
      (await db.adminLog.findMany({ orderBy: { createdAt: "asc" } })).map(
        (e) => e.action,
      ),
    ).toEqual(["SUBSCRIPTION_SET", "SUBSCRIPTION_OFF"]);
  });
});

describe("AI va statistika", () => {
  it("shu oydagi so'rovlar va xarajat; limitni o'zgartirish jurnalga yoziladi", async () => {
    const { cookie } = await adminCookie();
    const log = (
      task: "CV_GEN" | "MATCH",
      ok: boolean,
      costUsd: number,
      createdAt = new Date(),
    ) =>
      db.aiLog.create({
        data: { task, provider: "fake", model: "x", ok, costUsd, createdAt },
      });
    await log("CV_GEN", true, 0.5);
    await log("CV_GEN", false, 0.25);
    await log("MATCH", true, 1);
    await log("MATCH", true, 100, new Date(monthStart().getTime() - 1000)); // o'tgan oy

    let ai = await (
      await getAi(getRequest("/api/admin/ai", cookie), ctx)
    ).json();
    expect(ai).toMatchObject({
      requests: 3,
      spentUsd: 1.75,
      limitUsd: 50,
      limitReached: false,
    });
    expect(ai.tasks.CV_GEN).toEqual({ ok: 1, failed: 1, costUsd: 0.75 });
    expect(ai.tasks.MATCH).toEqual({ ok: 1, failed: 0, costUsd: 1 });

    const res = await putAi(
      jsonRequest(
        "/api/admin/ai",
        { limitUsd: 1.5 },
        { cookie, method: "PUT" },
      ),
      ctx,
    );
    ai = await res.json();
    expect(ai).toMatchObject({ limitUsd: 1.5, limitReached: true });
    expect(
      (
        await db.setting.findUniqueOrThrow({
          where: { key: "monthlyAiLimitUsd" },
        })
      ).value,
    ).toBe("1.5");
    const entry = await db.adminLog.findFirstOrThrow();
    expect(entry).toMatchObject({
      action: "AI_LIMIT_SET",
      details: { from: 50, to: 1.5 },
    });

    for (const limitUsd of [-1, "10", null])
      expect(
        (
          await putAi(
            jsonRequest(
              "/api/admin/ai",
              { limitUsd },
              { cookie, method: "PUT" },
            ),
            ctx,
          )
        ).status,
      ).toBe(400);
  });

  it("talabalar, CV lar, kompaniyalar va talablar soni", async () => {
    const { cookie } = await adminCookie();
    const s1 = await user("s1@test.local");
    const s2 = await user("s2@test.local");
    await user("s3@test.local");
    await db.cv.create({
      data: { userId: s1.id, savedAt: new Date(), isVisible: true },
    });
    await db.cv.create({ data: { userId: s2.id, savedAt: new Date() } });
    const c = await company("a@test.local", "Alfa");
    await company("b@test.local", "Beta");
    await db.company.update({
      where: { id: c.id },
      data: { approval: "APPROVED" },
    });
    await db.vacancy.create({ data: { companyId: c.id, title: "Dasturchi" } });

    const body = await (
      await stats(getRequest("/api/admin/stats", cookie), ctx)
    ).json();
    expect(body).toEqual({
      students: 3,
      cvsSaved: 2,
      cvsVisible: 1,
      companies: 2,
      companiesApproved: 1,
      companiesPending: 1,
      vacancies: 1,
    });
  });
});
