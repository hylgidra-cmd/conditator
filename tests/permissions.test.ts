// Ruxsat jadvali (rol × endpoint). Shu jadval docs/SECURITY.md dagi jadval bilan bir xil.
// "ok" = ruxsat tekshiruvidan o'tadi (javob 2xx yoki 400/404/409 kabi mantiqiy xato),
// 401/403 = aynan shu status bilan rad etiladi va hech narsa o'zgarmaydi.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as adminAi from "@/app/api/admin/ai/route";
import * as adminApprove from "@/app/api/admin/companies/[id]/approve/route";
import * as adminSubscription from "@/app/api/admin/companies/[id]/subscription/route";
import * as adminCompanies from "@/app/api/admin/companies/route";
import * as adminLogs from "@/app/api/admin/logs/route";
import * as adminStats from "@/app/api/admin/stats/route";
import * as adminUserStatus from "@/app/api/admin/users/[id]/status/route";
import * as adminUsers from "@/app/api/admin/users/route";
import * as forgot from "@/app/api/auth/forgot/route";
import * as login from "@/app/api/auth/login/route";
import * as logout from "@/app/api/auth/logout/route";
import * as register from "@/app/api/auth/register/route";
import * as resend from "@/app/api/auth/resend/route";
import * as reset from "@/app/api/auth/reset/route";
import * as verify from "@/app/api/auth/verify/route";
import * as companyLogo from "@/app/api/company/me/logo/route";
import * as companyMe from "@/app/api/company/me/route";
import * as cvByIdPdf from "@/app/api/cv/[id]/pdf/route";
import * as cvById from "@/app/api/cv/[id]/route";
import * as cvGenerate from "@/app/api/cv/generate/route";
import * as cvMePdf from "@/app/api/cv/me/pdf/route";
import * as cvMe from "@/app/api/cv/me/route";
import * as cvVisibility from "@/app/api/cv/me/visibility/route";
import * as health from "@/app/api/health/route";
import * as me from "@/app/api/me/route";
import * as decision from "@/app/api/vacancies/[id]/candidates/[cvId]/decision/route";
import * as match from "@/app/api/vacancies/[id]/match/route";
import * as matches from "@/app/api/vacancies/[id]/matches/route";
import * as vacancyById from "@/app/api/vacancies/[id]/route";
import * as vacancies from "@/app/api/vacancies/route";
import { FakeAiProvider } from "@/lib/ai/fake";
import { setAiProviderForTests } from "@/lib/ai/provider";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getRequest, jsonRequest, sessionCookie } from "./helpers";

type Role = "anon" | "student" | "pending" | "company" | "admin";
export const ROLES: Role[] = ["anon", "student", "pending", "company", "admin"];
type Expect = "ok" | 401 | 403;
type Handler = (request: NextRequest, context: never) => Promise<Response>;

const X = "yoq-id"; // mavjud bo'lmagan ID: ruxsat berilgan rol 404 oladi, hech narsa o'zgarmaydi
const ctx = (params: Record<string, string> = {}) =>
  ({ params: Promise.resolve(params) }) as never;
const all = (value: Expect) => ({
  anon: value,
  student: value,
  pending: value,
  company: value,
  admin: value,
});
const PUBLIC = all("ok");
const LOGGED_IN = { ...all("ok"), anon: 401 } as const;
const STUDENT = {
  anon: 401,
  student: "ok",
  pending: 403,
  company: 403,
  admin: 403,
} as const;
const COMPANY = {
  anon: 401,
  student: 403,
  pending: "ok",
  company: "ok",
  admin: 403,
} as const;
const APPROVED = {
  anon: 401,
  student: 403,
  pending: 403,
  company: "ok",
  admin: 403,
} as const;
const ADMIN = {
  anon: 401,
  student: 403,
  pending: 403,
  company: 403,
  admin: "ok",
} as const;

type Row = {
  method: string;
  path: string;
  file: string;
  expect: Record<Role, Expect>;
  call: (cookie: string) => Promise<Response>;
};

const json =
  (method: "POST" | "PUT" | "PATCH", url: string, body: unknown) =>
  (cookie: string) =>
    jsonRequest(url, body, { cookie, method });
const get = (url: string) => (cookie: string) =>
  getRequest(url, cookie || undefined);

function row(
  method: string,
  pathName: string,
  file: string,
  handler: Handler,
  expect: Record<Role, Expect>,
  request: (cookie: string) => NextRequest,
  params: Record<string, string> = {},
): Row {
  return {
    method,
    path: pathName,
    file,
    expect,
    call: (cookie) => handler(request(cookie), ctx(params)),
  };
}

export const ROWS: Row[] = [
  row(
    "GET",
    "/api/health",
    "health",
    health.GET as Handler,
    PUBLIC,
    get("/api/health"),
  ),
  row(
    "POST",
    "/api/auth/register",
    "auth/register",
    register.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/register", { email: "x" }),
  ),
  row(
    "POST",
    "/api/auth/verify",
    "auth/verify",
    verify.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/verify", { email: "x" }),
  ),
  row(
    "POST",
    "/api/auth/resend",
    "auth/resend",
    resend.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/resend", { email: "x" }),
  ),
  row(
    "POST",
    "/api/auth/login",
    "auth/login",
    login.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/login", { email: "x" }),
  ),
  row(
    "POST",
    "/api/auth/forgot",
    "auth/forgot",
    forgot.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/forgot", { email: "x" }),
  ),
  row(
    "POST",
    "/api/auth/reset",
    "auth/reset",
    reset.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/reset", { email: "x" }),
  ),
  row("GET", "/api/me", "me", me.GET as Handler, LOGGED_IN, get("/api/me")),
  row(
    "GET",
    "/api/cv/me",
    "cv/me",
    cvMe.GET as Handler,
    STUDENT,
    get("/api/cv/me"),
  ),
  row(
    "PUT",
    "/api/cv/me",
    "cv/me",
    cvMe.PUT as Handler,
    STUDENT,
    json("PUT", "/api/cv/me", {}),
  ),
  row(
    "PATCH",
    "/api/cv/me/visibility",
    "cv/me/visibility",
    cvVisibility.PATCH as Handler,
    STUDENT,
    json("PATCH", "/api/cv/me/visibility", { isVisible: true }),
  ),
  row(
    "GET",
    "/api/cv/me/pdf",
    "cv/me/pdf",
    cvMePdf.GET as Handler,
    STUDENT,
    get("/api/cv/me/pdf"),
  ),
  row(
    "POST",
    "/api/cv/generate",
    "cv/generate",
    cvGenerate.POST as Handler,
    STUDENT,
    json("POST", "/api/cv/generate", {}),
  ),
  row(
    "GET",
    "/api/cv/:id",
    "cv/[id]",
    cvById.GET as Handler,
    APPROVED,
    get(`/api/cv/${X}`),
    { id: X },
  ),
  row(
    "GET",
    "/api/cv/:id/pdf",
    "cv/[id]/pdf",
    cvByIdPdf.GET as Handler,
    APPROVED,
    get(`/api/cv/${X}/pdf`),
    { id: X },
  ),
  row(
    "GET",
    "/api/company/me",
    "company/me",
    companyMe.GET as Handler,
    COMPANY,
    get("/api/company/me"),
  ),
  row(
    "PUT",
    "/api/company/me",
    "company/me",
    companyMe.PUT as Handler,
    COMPANY,
    json("PUT", "/api/company/me", {}),
  ),
  row(
    "GET",
    "/api/company/me/logo",
    "company/me/logo",
    companyLogo.GET as Handler,
    COMPANY,
    get("/api/company/me/logo"),
  ),
  row(
    "POST",
    "/api/company/me/logo",
    "company/me/logo",
    companyLogo.POST as Handler,
    COMPANY,
    json("POST", "/api/company/me/logo", {}),
  ),
  row(
    "DELETE",
    "/api/company/me/logo",
    "company/me/logo",
    companyLogo.DELETE as Handler,
    COMPANY,
    (cookie) =>
      jsonRequest(
        "/api/company/me/logo",
        {},
        { cookie, method: "DELETE" as never },
      ),
  ),
  row(
    "GET",
    "/api/vacancies",
    "vacancies",
    vacancies.GET as Handler,
    COMPANY,
    get("/api/vacancies"),
  ),
  row(
    "POST",
    "/api/vacancies",
    "vacancies",
    vacancies.POST as Handler,
    COMPANY,
    json("POST", "/api/vacancies", {}),
  ),
  row(
    "GET",
    "/api/vacancies/:id",
    "vacancies/[id]",
    vacancyById.GET as Handler,
    COMPANY,
    get(`/api/vacancies/${X}`),
    { id: X },
  ),
  row(
    "PUT",
    "/api/vacancies/:id",
    "vacancies/[id]",
    vacancyById.PUT as Handler,
    COMPANY,
    json("PUT", `/api/vacancies/${X}`, {}),
    { id: X },
  ),
  row(
    "POST",
    "/api/vacancies/:id/match",
    "vacancies/[id]/match",
    match.POST as Handler,
    APPROVED,
    json("POST", `/api/vacancies/${X}/match`, { locale: "uz" }),
    { id: X },
  ),
  row(
    "GET",
    "/api/vacancies/:id/matches",
    "vacancies/[id]/matches",
    matches.GET as Handler,
    APPROVED,
    get(`/api/vacancies/${X}/matches`),
    { id: X },
  ),
  row(
    "PUT",
    "/api/vacancies/:id/candidates/:cvId/decision",
    "vacancies/[id]/candidates/[cvId]/decision",
    decision.PUT as Handler,
    APPROVED,
    json("PUT", `/api/vacancies/${X}/candidates/${X}/decision`, {
      decision: "SELECTED",
    }),
    { id: X, cvId: X },
  ),
  row(
    "GET",
    "/api/admin/stats",
    "admin/stats",
    adminStats.GET as Handler,
    ADMIN,
    get("/api/admin/stats"),
  ),
  row(
    "GET",
    "/api/admin/users",
    "admin/users",
    adminUsers.GET as Handler,
    ADMIN,
    get("/api/admin/users"),
  ),
  row(
    "PATCH",
    "/api/admin/users/:id/status",
    "admin/users/[id]/status",
    adminUserStatus.PATCH as Handler,
    ADMIN,
    json("PATCH", `/api/admin/users/${X}/status`, { status: "BLOCKED" }),
    { id: X },
  ),
  row(
    "GET",
    "/api/admin/companies",
    "admin/companies",
    adminCompanies.GET as Handler,
    ADMIN,
    get("/api/admin/companies"),
  ),
  row(
    "PATCH",
    "/api/admin/companies/:id/approve",
    "admin/companies/[id]/approve",
    adminApprove.PATCH as Handler,
    ADMIN,
    json("PATCH", `/api/admin/companies/${X}/approve`, { approved: true }),
    { id: X },
  ),
  row(
    "PATCH",
    "/api/admin/companies/:id/subscription",
    "admin/companies/[id]/subscription",
    adminSubscription.PATCH as Handler,
    ADMIN,
    json("PATCH", `/api/admin/companies/${X}/subscription`, { until: null }),
    { id: X },
  ),
  row(
    "GET",
    "/api/admin/ai",
    "admin/ai",
    adminAi.GET as Handler,
    ADMIN,
    get("/api/admin/ai"),
  ),
  row(
    "PUT",
    "/api/admin/ai",
    "admin/ai",
    adminAi.PUT as Handler,
    ADMIN,
    json("PUT", "/api/admin/ai", { limitUsd: "x" }),
  ),
  row(
    "GET",
    "/api/admin/logs",
    "admin/logs",
    adminLogs.GET as Handler,
    ADMIN,
    get("/api/admin/logs"),
  ),
  // Oxirida: sessiyani o'chiradi.
  row(
    "POST",
    "/api/auth/logout",
    "auth/logout",
    logout.POST as Handler,
    PUBLIC,
    json("POST", "/api/auth/logout", {}),
  ),
];

async function cookieFor(role: Exclude<Role, "anon">) {
  const user = await db.user.create({
    data: {
      email: `${role}@test.local`,
      passwordHash: "x",
      role:
        role === "student" ? "STUDENT" : role === "admin" ? "ADMIN" : "COMPANY",
      emailVerifiedAt: new Date(),
    },
  });
  if (role === "pending" || role === "company")
    await db.company.create({
      data: {
        userId: user.id,
        approval: role === "company" ? "APPROVED" : "PENDING",
        subscriptionUntil: new Date(Date.now() + 86_400_000),
      },
    });
  const response = NextResponse.json({});
  await createSession(response, user.id);
  return sessionCookie(response)!;
}

beforeEach(() =>
  setAiProviderForTests(
    new FakeAiProvider([new Error("AI chaqirilmasligi kerak")]),
  ),
);
afterEach(() => setAiProviderForTests(undefined));

describe("ruxsat jadvali: rol × endpoint", () => {
  it("jadvalda src/app/api dagi barcha endpoint va metodlar bor", () => {
    const apiDir = path.join(process.cwd(), "src/app/api");
    const found: string[] = [];
    (function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name === "route.ts") {
          const rel = path.relative(apiDir, dir);
          const source = readFileSync(full, "utf8");
          for (const m of source.matchAll(
            /export (?:const|async function|function) (GET|POST|PUT|PATCH|DELETE)\b/g,
          ))
            found.push(`${m[1]} ${rel}`);
        }
      }
    })(apiDir);
    expect(ROWS.map((r) => `${r.method} ${r.file}`).sort()).toEqual(
      found.sort(),
    );
  });

  it.each(ROLES)("%s: har endpointda kutilgan javob", async (role) => {
    const cookie = role === "anon" ? "" : await cookieFor(role);
    const mismatches: string[] = [];
    for (const r of ROWS) {
      const res = await r.call(cookie);
      const expected = r.expect[role];
      const ok =
        expected === "ok"
          ? res.status !== 401 && res.status !== 403 && res.status < 500
          : res.status === expected;
      if (!ok)
        mismatches.push(
          `${r.method} ${r.path}: kutilgan ${expected}, keldi ${res.status}`,
        );
    }
    expect(mismatches).toEqual([]);
    // Rad etilgan so'rovlar hech narsa yaratmadi va AI chaqirilmadi.
    expect(await db.vacancy.count()).toBe(0);
    expect(await db.aiLog.count()).toBe(0);
    expect(await db.adminLog.count()).toBe(0);
  });
});
