import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as reset } from "@/app/api/auth/reset/route";
import { POST as forgot } from "@/app/api/auth/forgot/route";
import { GET as me } from "@/app/api/me/route";
import { hashPassword } from "@/backend/auth/password";
import { db } from "@/backend/db";
import {
  getRequest,
  jsonRequest,
  lastMailedCode,
  sessionCookie,
} from "./helpers";
import { sentMails } from "./mail-outbox";

const PASSWORD = "parol-12345";
const ctx = undefined as never;

function registerBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "Talaba@Test.local",
    password: PASSWORD,
    role: "STUDENT",
    consent: true,
    locale: "uz",
    ...overrides,
  };
}

async function registeredAndLoggedIn(role: "STUDENT" | "COMPANY" = "STUDENT") {
  await register(
    jsonRequest("/api/auth/register", registerBody({ role })),
    ctx,
  );
  const res = await login(
    jsonRequest("/api/auth/login", {
      email: "talaba@test.local",
      password: PASSWORD,
    }),
    ctx,
  );
  return sessionCookie(res)!;
}

afterEach(() => vi.restoreAllMocks());

describe("ro'yxatdan o'tish", () => {
  it("email va parol bilan ro'yxatdan o'tiladi, emailga kod yuborilmaydi", async () => {
    const res = await register(
      jsonRequest("/api/auth/register", registerBody()),
      ctx,
    );

    expect(res.status).toBe(201);
    expect(sentMails).toHaveLength(0);
    // Ro'yxatdan o'tish o'zi sessiya ochmaydi: foydalanuvchi kirish sahifasiga yuboriladi.
    expect(res.headers.get("set-cookie")).toBeNull();

    const user = await db.user.findUniqueOrThrow({
      where: { email: "talaba@test.local" },
    });
    expect(user.consentAt).not.toBeNull();
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("rozilik, 8 belgili parol va rol majburiy; admin bo'lib ro'yxatdan o'tib bo'lmaydi", async () => {
    const res = await register(
      jsonRequest(
        "/api/auth/register",
        registerBody({ consent: false, password: "1234567", role: "ADMIN" }),
      ),
      ctx,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields).toMatchObject({
      consent: "CONSENT_REQUIRED",
      password: "PASSWORD_TOO_SHORT",
      role: "ROLE_REQUIRED",
    });
    expect(await db.user.count()).toBe(0);
  });

  it("kompaniya ro'yxatdan o'tganda tasdiq kutayotgan profil yaratiladi", async () => {
    await register(
      jsonRequest("/api/auth/register", registerBody({ role: "COMPANY" })),
      ctx,
    );
    const company = await db.company.findFirstOrThrow({
      include: { user: true },
    });
    expect(company.approval).toBe("PENDING");
    expect(company.user.role).toBe("COMPANY");
  });

  it("bir xil email ikkinchi marta ro'yxatdan o'tmaydi", async () => {
    await register(jsonRequest("/api/auth/register", registerBody()), ctx);
    const res = await register(
      jsonRequest("/api/auth/register", registerBody()),
      ctx,
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("EMAIL_TAKEN");
  });
});

describe("kirish", () => {
  it("ro'yxatdan o'tgandan keyin darhol kirish mumkin, httpOnly sessiya ochiladi", async () => {
    await register(jsonRequest("/api/auth/register", registerBody()), ctx);
    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "talaba@test.local",
        password: PASSWORD,
      }),
      ctx,
    );

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/jumis_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
  });

  it("emaili tasdiqlanmagan eski akkaunt ham kira oladi", async () => {
    await db.user.create({
      data: {
        email: "eski@test.local",
        passwordHash: await hashPassword(PASSWORD),
        role: "STUDENT",
        emailVerifiedAt: null,
      },
    });
    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "eski@test.local",
        password: PASSWORD,
      }),
      ctx,
    );
    expect(res.status).toBe(200);
  });

  it("noto'g'ri parol: 401, sessiya ochilmaydi", async () => {
    await registeredAndLoggedIn();
    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "talaba@test.local",
        password: "boshqa-parol",
      }),
      ctx,
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("bloklangan foydalanuvchi kira olmaydi va eski sessiyasi ishlamaydi", async () => {
    const cookie = await registeredAndLoggedIn();
    await db.user.update({
      where: { email: "talaba@test.local" },
      data: { status: "BLOCKED" },
    });

    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "talaba@test.local",
        password: PASSWORD,
      }),
      ctx,
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("ACCOUNT_BLOCKED");
    expect((await me(getRequest("/api/me", cookie), ctx)).status).toBe(401);
  });

  it("login urinishlari cheklangan", async () => {
    // Faqat ro'yxatdan o'tish: muvaffaqiyatli kirish ham limitga sanaladi.
    await register(jsonRequest("/api/auth/register", registerBody()), ctx);
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await login(
        jsonRequest("/api/auth/login", {
          email: "talaba@test.local",
          password: "notogri-parol",
        }),
        ctx,
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("chiqishdan keyin sessiya bekor bo'ladi", async () => {
    const cookie = await registeredAndLoggedIn();
    expect((await me(getRequest("/api/me", cookie), ctx)).status).toBe(200);
    await logout(jsonRequest("/api/auth/logout", {}, { cookie }), ctx);
    expect((await me(getRequest("/api/me", cookie), ctx)).status).toBe(401);
  });

  it("boshqa saytdan kelgan so'rov rad etiladi (CSRF)", async () => {
    const request = jsonRequest("/api/auth/login", {
      email: "a@b.c",
      password: "x",
    });
    request.headers.set("origin", "https://yomon-sayt.example");
    const res = await login(request, ctx);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("BAD_ORIGIN");
  });
});

describe("parolni tiklash", () => {
  it("kod bilan parol almashadi, eski sessiyalar o'chadi", async () => {
    const oldCookie = await registeredAndLoggedIn();
    sentMails.length = 0;

    const forgotRes = await forgot(
      jsonRequest("/api/auth/forgot", { email: "talaba@test.local" }),
      ctx,
    );
    expect(forgotRes.status).toBe(200);
    const code = lastMailedCode();
    expect(await forgotRes.text()).not.toContain(code);

    const res = await reset(
      jsonRequest("/api/auth/reset", {
        email: "talaba@test.local",
        code,
        password: "yangi-parol-123",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect((await me(getRequest("/api/me", oldCookie), ctx)).status).toBe(401);

    const loginRes = await login(
      jsonRequest("/api/auth/login", {
        email: "talaba@test.local",
        password: "yangi-parol-123",
      }),
      ctx,
    );
    expect(loginRes.status).toBe(200);
  });

  it("mavjud bo'lmagan email uchun ham javob bir xil, xat yuborilmaydi", async () => {
    const res = await forgot(
      jsonRequest("/api/auth/forgot", { email: "yoq@test.local" }),
      ctx,
    );
    expect(res.status).toBe(200);
    expect(sentMails).toHaveLength(0);
  });
});

describe("rol tekshiruvi (requireRole)", () => {
  it("sessiyasiz so'rov 401", async () => {
    const res = await me(getRequest("/api/me"), ctx);
    expect(res.status).toBe(401);
  });

  it("rol mos kelmasa 403, mos kelsa o'tadi", async () => {
    const { requireRole } = await import("@/backend/auth/session");
    const cookie = await registeredAndLoggedIn("STUDENT");

    await expect(
      requireRole(getRequest("/api/x", cookie), "ADMIN"),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    await expect(
      requireRole(getRequest("/api/x", cookie), "COMPANY"),
    ).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      requireRole(getRequest("/api/x", cookie), "STUDENT"),
    ).resolves.toMatchObject({
      email: "talaba@test.local",
      role: "STUDENT",
    });
  });

  it("admin o'z rolida o'tadi", async () => {
    const { requireRole } = await import("@/backend/auth/session");
    await db.user.create({
      data: {
        email: "admin@test.local",
        passwordHash: await hashPassword(PASSWORD),
        role: "ADMIN",
        emailVerifiedAt: new Date(),
      },
    });
    const res = await login(
      jsonRequest("/api/auth/login", {
        email: "admin@test.local",
        password: PASSWORD,
      }),
      ctx,
    );
    const cookie = sessionCookie(res)!;
    await expect(
      requireRole(getRequest("/api/x", cookie), "ADMIN"),
    ).resolves.toMatchObject({
      role: "ADMIN",
    });
  });
});
