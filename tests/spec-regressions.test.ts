// Topshiriqda tilga olingan ikki xato takrorlanmasligi (2.6):
// 1) parol tiklash kodi ekranda / API javobida / logda ko'rinmaydi;
// 2) foydalanuvchilar ro'yxati brauzerga to'liq yuklanmaydi.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as adminCompanies } from "@/app/api/admin/companies/route";
import { GET as adminUsers } from "@/app/api/admin/users/route";
import { POST as forgot } from "@/app/api/auth/forgot/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as reset } from "@/app/api/auth/reset/route";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/schema";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  getRequest,
  jsonRequest,
  lastMailedCode,
  sessionCookie,
} from "./helpers";
import { sentMails } from "./mail-outbox";

const ctx = undefined as never;

function captureLogs() {
  const logs: string[] = [];
  for (const method of ["log", "info", "warn", "error", "debug"] as const)
    vi.spyOn(console, method).mockImplementation((...args) => {
      logs.push(
        args
          .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
          .join(" "),
      );
    });
  return logs;
}
afterEach(() => vi.restoreAllMocks());

describe("1-xato: kod faqat emailda", () => {
  it("ro'yxat, parol tiklash, noto'g'ri kod: kod javobda ham, logda ham yo'q", async () => {
    const logs = captureLogs();
    const email = "talaba@test.local";
    const bodies: string[] = [];
    const codes: string[] = [];
    const call = async (res: Response) =>
      bodies.push(
        `${res.status} ${JSON.stringify([...res.headers])} ${await res.text()}`,
      );

    await call(
      await register(
        jsonRequest("/api/auth/register", {
          email,
          password: "parol-12345",
          role: "STUDENT",
          consent: true,
          locale: "uz",
        }),
        ctx,
      ),
    );
    await call(await forgot(jsonRequest("/api/auth/forgot", { email }), ctx));
    codes.push(lastMailedCode());
    await call(
      await reset(
        jsonRequest("/api/auth/reset", {
          email,
          code: "000000",
          password: "yangi-parol-123",
        }),
        ctx,
      ),
    );
    await db.emailCode.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 60_000) },
    });
    await call(await forgot(jsonRequest("/api/auth/forgot", { email }), ctx));
    codes.push(lastMailedCode());

    expect(sentMails).toHaveLength(2);
    expect(new Set(codes).size).toBe(2);
    const everything = [...bodies, ...logs].join("\n");
    for (const code of codes) expect(everything).not.toContain(code);
    // Bazada ham kodning o'zi yo'q, faqat xeshi.
    const stored = await db.emailCode.findMany();
    for (const row of stored)
      for (const code of codes) expect(row.codeHash).not.toContain(code);
  });

  it("sahifa va komponent kodlarida kodni ko'rsatadigan joy yo'q (kod faqat email shablonida)", () => {
    const files: string[] = [];
    (function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name)) files.push(full);
      }
    })(path.join(process.cwd(), "src"));
    // Kodni yaratadigan funksiya natijasi faqat email yuborish moduliga uzatiladi.
    const issuers = files.filter((file) =>
      /issueCode\(/.test(readFileSync(file, "utf8")),
    );
    for (const file of issuers) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/NextResponse\.json\([^)]*code/);
      expect(source, file).not.toMatch(/console\.\w+\([^)]*code/);
    }
  });
});

describe("2-xato: foydalanuvchilar ro'yxati to'liq yuklanmaydi", () => {
  it("1000 ta foydalanuvchida javobda faqat bitta sahifa (20 ta), qolgani so'ralmaydi", async () => {
    await db.user.createMany({
      data: Array.from({ length: 1000 }, (_, i) => ({
        email: `u${i}@test.local`,
        passwordHash: "x",
        role: i % 10 === 0 ? ("COMPANY" as const) : ("STUDENT" as const),
      })),
    });
    const companyUsers = await db.user.findMany({
      where: { role: "COMPANY" },
      select: { id: true },
    });
    await db.company.createMany({
      data: companyUsers.map((u, i) => ({ userId: u.id, name: `Firma ${i}` })),
    });
    const admin = await db.user.create({
      data: { email: "admin@test.local", passwordHash: "x", role: "ADMIN" },
    });
    const response = NextResponse.json({});
    await createSession(response, admin.id);
    const cookie = sessionCookie(response)!;

    const findMany = vi.spyOn(db.user, "findMany");
    const res = await adminUsers(getRequest("/api/admin/users", cookie), ctx);
    const text = await res.text();
    const body = JSON.parse(text);
    expect(body.total).toBe(1001);
    expect(body.items).toHaveLength(ADMIN_PAGE_SIZE);
    expect(body.pageCount).toBe(Math.ceil(1001 / ADMIN_PAGE_SIZE));
    expect(text.length).toBeLessThan(15_000);
    // Bazadan ham faqat bitta sahifa olinadi (take = 20).
    expect(findMany.mock.calls.at(-1)?.[0]).toMatchObject({
      take: ADMIN_PAGE_SIZE,
    });

    // Juda katta sahifa raqami bo'sh sahifa, xato emas; sahifa hajmini URL bilan oshirib bo'lmaydi.
    const far = await (
      await adminUsers(
        getRequest(
          "/api/admin/users?page=9999&take=5000&pageSize=5000",
          cookie,
        ),
        ctx,
      )
    ).json();
    expect(far.items).toEqual([]);
    const companies = await (
      await adminCompanies(
        getRequest("/api/admin/companies?pageSize=1000", cookie),
        ctx,
      )
    ).json();
    expect(companies.total).toBe(100);
    expect(companies.items).toHaveLength(ADMIN_PAGE_SIZE);
  });
});
