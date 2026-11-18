import type { Lang } from "@prisma/client";
import { z } from "zod";
import { redactPii } from "@/backend/ai/pii";
import { runJsonTask } from "@/backend/ai/run";
import { db } from "@/backend/db";
import type { CvData } from "./schema";

/** 80–100% ball olgan CV lar "Mukammal ishlangan CV" hisoblanadi va obuna bilan ko'riladi. */
export const MUKAMMAL_THRESHOLD = 80;

export type CvQualityTier = "MUKAMMAL" | "ORTA" | "BOSHLANGICH";

export type CvQualityEvaluation = {
  score: number;
  baseQualityScore: number;
  isMukammal: boolean;
  tier: CvQualityTier;
  aiSummary: string;
  strengths: string[];
  missing: string[];
};

function nonEmpty(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * CV ning to'liqligi, kasbiy tajribasi, ko'nikmalari va AI bahosini tahlil qilib
 * 0–100% ball hamda AI xulosasini qaytaradi.
 */
export function evaluateCvQuality(
  data: CvData,
  options?: {
    title?: string | null;
    aiMatchScore?: number | null;
    aiReason?: string | null;
  },
): CvQualityEvaluation {
  let points = 0;
  const strengths: string[] = [];
  const missing: string[] = [];

  // 1. Shaxsiy va aloqa ma'lumotlari (15 ballgacha)
  const hasName = nonEmpty(data.fullName);
  const hasPhone = nonEmpty(data.contact?.phone);
  const hasEmail = nonEmpty(data.contact?.email);
  const hasExtraContact =
    nonEmpty(data.contact?.telegram) ||
    nonEmpty(data.telegram) ||
    nonEmpty(data.contact?.linkedin) ||
    nonEmpty(data.linkedin) ||
    nonEmpty(data.contact?.github) ||
    nonEmpty(data.github);

  if (hasName) points += 4;
  else missing.push("F.I.Sh");

  if (hasPhone) points += 4;
  else missing.push("telefon");

  if (hasEmail) points += 3;
  if (hasExtraContact) points += 2;
  if (nonEmpty(data.location)) points += 2;
  else missing.push("hudud");

  // 2. Mutaxassislik sarlavhasi va kasbiy maqsad (16 ballgacha)
  const cleanTitle = options?.title?.trim() ?? "";
  const hasSpecificTitle =
    cleanTitle.length >= 3 &&
    cleanTitle.toLowerCase() !== "mening rezyumem" &&
    cleanTitle.toLowerCase() !== "rezyume";
  if (hasSpecificTitle) {
    points += 6;
  }

  const goalLen = data.goal?.trim().length ?? 0;
  if (goalLen >= 60) {
    points += 10;
    strengths.push("aniq kasbiy maqsad");
  } else if (goalLen >= 20) {
    points += 6;
    strengths.push("kasbiy maqsad");
  } else if (goalLen > 0) {
    points += 3;
  } else {
    missing.push("kasbiy maqsad");
  }

  // 3. Ish tajribasi va loyihalar (28 ballgacha)
  const expCount = data.experience?.length ?? 0;
  const detailedExpCount = (data.experience ?? []).filter(
    (e) => nonEmpty(e.position) && (e.description?.trim().length ?? 0) >= 25,
  ).length;
  const projectCount = data.projects?.length ?? 0;

  if (expCount >= 2 || (expCount >= 1 && detailedExpCount >= 1)) {
    points += 22;
    strengths.push(`${expCount} ta ish tajribasi`);
  } else if (expCount === 1) {
    points += 15;
    strengths.push("1 ta ish tajribasi");
  } else if (nonEmpty(data.obyektivka?.mehnatFaoliyati)) {
    points += 16;
    strengths.push("mehnat faoliyati");
  } else {
    missing.push("ish tajribasi");
  }

  if (projectCount >= 1) {
    points += Math.min(6, projectCount * 3);
    strengths.push(`${projectCount} ta loyiha`);
  }

  // 4. Ta'lim (15 ballgacha)
  const eduCount = data.education?.length ?? 0;
  if (eduCount >= 1) {
    const firstEdu = data.education[0];
    const hasDetails = nonEmpty(firstEdu?.degree) || nonEmpty(firstEdu?.field);
    points += hasDetails ? 15 : 11;
    strengths.push("ta'lim ma'lumotlari");
  } else if (nonEmpty(data.obyektivka?.oqiganJoyi)) {
    points += 12;
    strengths.push("ta'lim ma'lumotlari");
  } else {
    missing.push("ta'lim");
  }

  // 5. Kasbiy ko'nikmalar (14 ballgacha)
  const skillsCount = data.skills?.length ?? 0;
  if (skillsCount >= 5) {
    points += 14;
    strengths.push(`${skillsCount} ta ko'nikma`);
  } else if (skillsCount >= 3) {
    points += 10;
    strengths.push(`${skillsCount} ta ko'nikma`);
  } else if (skillsCount >= 1) {
    points += 5;
  } else {
    missing.push("ko'nikmalar");
  }

  // 6. Tillar va sertifikatlar (12 ballgacha)
  const langCount = data.languages?.length ?? 0;
  if (langCount >= 2) {
    points += 8;
    strengths.push(`${langCount} ta til`);
  } else if (langCount === 1) {
    points += 5;
    strengths.push("1 ta til");
  } else {
    missing.push("tillar");
  }

  const certCount = data.certificates?.length ?? 0;
  if (certCount >= 1) {
    points += 4;
    strengths.push(`${certCount} ta sertifikat`);
  }

  const baseQualityScore = Math.max(15, Math.min(100, points));
  const storedAiScore =
    typeof data.aiQualityScore === "number" ? data.aiQualityScore : null;
  const matchScore =
    typeof options?.aiMatchScore === "number" ? options.aiMatchScore : null;

  const score = Math.max(
    baseQualityScore,
    storedAiScore ?? 0,
    matchScore ?? 0,
  );

  const isMukammal = score >= MUKAMMAL_THRESHOLD;
  const tier: CvQualityTier =
    score >= MUKAMMAL_THRESHOLD
      ? "MUKAMMAL"
      : score >= 55
        ? "ORTA"
        : "BOSHLANGICH";

  let aiSummary: string;
  if (nonEmpty(options?.aiReason)) {
    aiSummary = options!.aiReason!.trim();
  } else if (nonEmpty(data.aiQualityReason)) {
    aiSummary = data.aiQualityReason!.trim();
  } else if (isMukammal) {
    const parts =
      strengths.length > 0
        ? strengths.join(", ")
        : "barcha asosiy bo'limlar to'liq";
    aiSummary = `AI tahlili: Mukammal ishlangan CV (${score}%) — ${parts} batafsil kiritilgan.`;
  } else {
    const presentText =
      strengths.length > 0
        ? `Kiritilgan: ${strengths.join(", ")}.`
        : "Asosiy ma'lumotlar qisman kiritilgan.";
    const missingText =
      missing.length > 0
        ? ` To'ldirilmagan: ${missing.slice(0, 3).join(", ")}.`
        : "";
    aiSummary = `AI tahlili (${score}%): ${presentText}${missingText}`;
  }

  return {
    score,
    baseQualityScore,
    isMukammal,
    tier,
    aiSummary,
    strengths,
    missing,
  };
}

const LANGUAGE_NAMES: Record<Lang, string> = {
  kk: "Karakalpak (Latin script)",
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  en: "English",
};

function aiQualityBatchSchema(aliases: string[]) {
  return z
    .object({
      results: z.array(
        z.object({
          id: z.enum(aliases as [string, ...string[]]),
          score: z.number().int().min(0).max(100),
          reason: z.string().trim().min(1).max(320),
        }),
      ),
    })
    .superRefine((val, ctx) => {
      const ids = val.results.map((item) => item.id);
      if (ids.length !== aliases.length || new Set(ids).size !== aliases.length) {
        ctx.addIssue({ code: "custom", message: "IDS_MISMATCH" });
      }
    });
}

/**
 * AI (LLM) yordamida CV larni o'qib, ularning mukammallik darajasini (0-100%)
 * va AI xulosasini hisoblaydi hamda bazaga saqlaydi.
 */
export async function scanCvsWithAi(params: {
  cvs: Array<{ id: string; title: string; data: CvData }>;
  locale: Lang;
  userId: string;
}): Promise<{
  mode: "ai" | "smart";
  evaluatedCount: number;
  mukammalCount: number;
}> {
  const batch = params.cvs.slice(0, 10);
  if (batch.length === 0) {
    return { mode: "smart", evaluatedCount: 0, mukammalCount: 0 };
  }

  const aliases = batch.map((_, idx) => `c${idx + 1}`);
  const payload = batch.map((cv, idx) => ({
    id: aliases[idx],
    title: cv.title,
    goal: cv.data.goal,
    skills: cv.data.skills,
    experience: cv.data.experience,
    education: cv.data.education,
    languages: cv.data.languages,
    projects: cv.data.projects ?? [],
    certificates: cv.data.certificates ?? [],
    location: cv.data.location,
  }));

  const names = batch.map((cv) => cv.data.fullName);
  const input = `<candidates>\n${redactPii(JSON.stringify(payload), names)}\n</candidates>`;
  const system = [
    "You are an expert HR AI evaluator. Read each candidate's CV in <candidates> and score how complete, well-crafted, and professionally strong the CV is from 0 to 100.",
    "Rules:",
    "1. Score 80–100 (Mukammal CV) ONLY if the CV is thoroughly filled out with strong skills, education, clear goal/profile, and relevant experience or projects.",
    "2. Score 0–79 if the CV is basic, incomplete, missing experience/education, or has very few skills.",
    `3. Write 'reason' in ${LANGUAGE_NAMES[params.locale]} (1–2 short sentences) explaining why the CV is Mukammal (80%+) or what is missing.`,
    "4. Return one result per candidate id.",
  ].join("\n");

  let mode: "ai" | "smart" = "ai";
  const updates: Array<{ id: string; data: CvData; score: number }> = [];

  try {
    const aiRes = await runJsonTask({
      task: "MATCH",
      system,
      input,
      schema: aiQualityBatchSchema(aliases),
      maxTokens: 2500,
      userId: params.userId,
    });

    for (const item of aiRes.results) {
      const idx = aliases.indexOf(item.id);
      const target = batch[idx];
      if (!target) continue;
      const fallback = evaluateCvQuality(target.data, { title: target.title });
      // Blend AI score with structural completeness so truly complete CVs stay >=80 and empty CVs stay <80
      const blendedScore = Math.round((item.score + fallback.baseQualityScore) / 2);
      const finalScore = Math.max(15, Math.min(100, blendedScore));
      updates.push({
        id: target.id,
        score: finalScore,
        data: {
          ...target.data,
          aiQualityScore: finalScore,
          aiQualityReason: item.reason,
        },
      });
    }
  } catch {
    mode = "smart";
    for (const target of batch) {
      const evaluated = evaluateCvQuality(target.data, { title: target.title });
      updates.push({
        id: target.id,
        score: evaluated.score,
        data: {
          ...target.data,
          aiQualityScore: evaluated.score,
          aiQualityReason: evaluated.aiSummary,
        },
      });
    }
  }

  await db.$transaction(
    updates.map((u) =>
      db.cv.update({
        where: { id: u.id },
        data: { data: u.data },
      }),
    ),
  );

  const mukammalCount = updates.filter((u) => u.score >= MUKAMMAL_THRESHOLD).length;
  return {
    mode,
    evaluatedCount: updates.length,
    mukammalCount,
  };
}
