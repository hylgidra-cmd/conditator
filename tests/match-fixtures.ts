import type { Lang, WorkType } from "@prisma/client";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as match } from "@/app/api/vacancies/[id]/match/route";
import {
  type AiJsonRequest,
  type AiProvider,
  AiProviderError,
  type AiRawResponse,
} from "@/backend/ai/provider";
import type { CvData } from "@/backend/cv/schema";
import { saveOwnCv } from "@/backend/cv/service";
import { db } from "@/backend/db";
import type { MatchOutcome } from "@/backend/match/service";
import { jsonRequest, sessionCookie } from "./helpers";

// Saralash va nomzod testlari uchun umumiy yordamchilar.
export const ctx = undefined as never;
export const params = (id: string) => ({ params: Promise.resolve({ id }) });

/**
 * So'rovdagi nomzod ID larini (c1, c2, ...) o'qib, har biriga ball qaytaradigan soxta AI.
 * mode: "ok" — to'g'ri javob, "bad" — sxemaga mos emas, "error" — provayder xatosi.
 */
export class ScoringAi implements AiProvider {
  readonly name = "fake";
  readonly requests: AiJsonRequest[] = [];
  modes: Array<"ok" | "bad" | "error"> = [];
  delayMs = 0;
  /** Guruhdagi nomzodlar soniga qarab provayder xatosi (parallel guruhlar tartibiga bog'liq bo'lmasin). */
  failIf?: (candidateCount: number) => boolean;

  async generateJson(request: AiJsonRequest): Promise<AiRawResponse> {
    this.requests.push(request);
    const mode = this.modes.shift() ?? "ok";
    if (this.delayMs)
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    if (mode === "error") throw new AiProviderError("HTTP_500");
    const block = request.input.split("<candidates>")[1];
    const candidates = JSON.parse(block.split("</candidates>")[0]) as Array<{
      id: string;
      skills: string[];
    }>;
    if (this.failIf?.(candidates.length)) throw new AiProviderError("HTTP_500");
    const usage = { inputTokens: 1000, outputTokens: 300 };
    if (mode === "bad")
      return {
        json: { results: [{ id: "c99", score: 500, reason: "" }] },
        usage,
      };
    return {
      json: {
        results: candidates.map((candidate) => ({
          id: candidate.id,
          score: Math.min(100, 40 + candidate.skills.length * 10),
          reason: `Ko'nikmalar: ${candidate.skills.join(", ")}`,
        })),
      },
      usage,
    };
  }
}

export async function companySession(
  email = "hr@test.local",
  state: { approval?: "PENDING" | "APPROVED"; subscription?: boolean } = {},
) {
  await register(
    jsonRequest("/api/auth/register", {
      email,
      password: "parol-12345",
      role: "COMPANY",
      consent: true,
      locale: "uz",
    }),
    ctx,
  );
  const res = await login(
    jsonRequest("/api/auth/login", { email, password: "parol-12345" }),
    ctx,
  );
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const company = await db.company.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  await db.company.update({
    where: { id: company.id },
    data: {
      approval: state.approval ?? "APPROVED",
      subscriptionUntil:
        state.subscription === false
          ? null
          : new Date(Date.now() + 30 * 86_400_000),
    },
  });
  return { cookie: sessionCookie(res)!, companyId: company.id };
}

export function vacancy(
  companyId: string,
  data: Partial<{
    title: string;
    rawText: string | null;
    skills: string[];
    languages: string[];
    location: string | null;
    workType: WorkType | null;
    minExperienceYears: number | null;
  }> = {},
) {
  return db.vacancy.create({
    data: {
      companyId,
      title: "Frontend dasturchi",
      skills: ["React", "TypeScript"],
      ...data,
    },
  });
}

let counter = 0;
export async function studentCv(
  options: {
    skills?: string[];
    languages?: string[];
    location?: string | null;
    workTypes?: WorkType[];
    language?: Lang;
    visible?: boolean;
    fullName?: string;
    phone?: string;
    description?: string;
  } = {},
) {
  counter++;
  const user = await db.user.create({
    data: {
      email: `talaba${counter}@test.local`,
      passwordHash: "x",
      role: "STUDENT",
      emailVerifiedAt: new Date(),
    },
  });
  const data: CvData = {
    fullName: options.fullName ?? `Talaba${counter} Familiya`,
    contact: { email: user.email, phone: options.phone ?? "+998 90 123 45 67" },
    goal: "Dasturchi bo'lish",
    location: options.location === undefined ? "Nukus" : options.location,
    education: [
      {
        institution: "QDU",
        degree: "Bakalavr",
        field: "Informatika",
        startYear: "2021",
        endYear: null,
      },
    ],
    experience: options.description
      ? [
          {
            organization: "IT Park",
            position: "Stajyor",
            startDate: "2023",
            endDate: null,
            description: options.description,
          },
        ]
      : [],
    skills: options.skills ?? ["React"],
    languages: (options.languages ?? []).map((name) => ({ name, level: null })),
    certificates: [],
  };
  const cv = await saveOwnCv(user.id, {
    language: options.language ?? "uz",
    workTypes: options.workTypes ?? [],
    data,
  });
  if (options.visible !== false)
    await db.cv.update({
      where: { userId: user.id },
      data: { isVisible: true },
    });
  return {
    userId: user.id,
    cvId: (await db.cv.findUniqueOrThrow({ where: { userId: user.id } })).id,
    cv,
  };
}

export async function runMatch(
  cookie: string,
  vacancyId: string,
  locale: Lang = "uz",
) {
  const res = await match(
    jsonRequest(`/api/vacancies/${vacancyId}/match`, { locale }, { cookie }),
    params(vacancyId),
  );
  return { status: res.status, body: (await res.json()) as MatchOutcome };
}
