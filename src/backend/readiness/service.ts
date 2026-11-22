import "server-only";
import { db } from "@/backend/db";
import { cvDataSchema } from "@/backend/cv/schema";
import { personalityGroup } from "@/backend/personality/score";
import { activeResult } from "@/backend/personality/service";

function languageLevel(value: string | null): number {
  const text = (value ?? "").toLowerCase();
  const match = /\b([abc][12])\b/i.exec(text);
  if (match)
    return (
      ["a1", "a2", "b1", "b2", "c1", "c2"].indexOf(match[1].toLowerCase()) + 1
    );
  if (/native|ona tili|rodn|ана тілі|ana tili/.test(text)) return 6;
  if (/advanced|yuqori|свобод|жоғары/.test(text)) return 5;
  if (/intermediate|o'rta|средн|орта/.test(text)) return 3;
  return 1;
}

function dateMonth(value: string | null): number | null {
  const text = value?.trim() ?? "";
  const match = /((?:19|20)\d{2})(?:[-/.](\d{1,2}))?/.exec(text);
  if (!match) return null;
  const month = match[2] ? Number(match[2]) : 1;
  if (month < 1 || month > 12) return null;
  return Number(match[1]) * 12 + month - 1;
}

function experienceMonths(
  experience: Array<{ startDate: string | null; endDate: string | null }>,
): number {
  const now = new Date();
  const thisMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
  return experience.reduce((total, job) => {
    const start = dateMonth(job.startDate);
    const end = dateMonth(job.endDate) ?? thisMonth;
    return start !== null && start <= end
      ? total + Math.min(480, end - start + 1)
      : total;
  }, 0);
}

function experienceBand(months: number): string {
  if (months === 0) return "NONE";
  if (months < 12) return "UNDER_1";
  if (months <= 36) return "ONE_TO_THREE";
  return "OVER_3";
}

export async function rebuildReadiness(userId: string): Promise<void> {
  const result = await activeResult(userId);
  const cvs = await db.cv.findMany({
    where: { userId, savedAt: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { title: true, data: true, workTypes: true },
  });
  const cv = cvs[0];
  if (!result || !cv) {
    await db.readinessProfile.deleteMany({ where: { userId } });
    return;
  }
  const parsed = cvDataSchema.safeParse(cv.data);
  if (!parsed.success) return;
  const data = parsed.data;
  const languages = data.languages
    .map((language) => ({
      name: language.name.trim().toLowerCase(),
      level: languageLevel(language.level),
    }))
    .filter((item) => item.name);
  const foreign = languages.filter(
    (language) =>
      language.level >= 3 &&
      !/^(uz|uzbek|o'zbek|kk|qoraqalpoq|karakalpak|русский|rus|ru)$/.test(
        language.name,
      ),
  );
  const languageBand =
    foreign.length >= 2
      ? "TWO_PLUS"
      : foreign.length === 1
        ? "ONE"
        : "NATIVE_ONLY";
  const months = experienceMonths(data.experience);
  const band = experienceBand(months);
  const hasInternship =
    cv.workTypes.includes("INTERNSHIP") ||
    data.experience.some((item) =>
      /intern|staj|amaliyot|стаж|практик/i.test(item.position ?? ""),
    );
  const parsedCvs = cvs.flatMap((item) => {
    const checked = cvDataSchema.safeParse(item.data);
    return checked.success ? [{ title: item.title, data: checked.data }] : [];
  });
  const search = parsedCvs
    .flatMap((item) => [
      item.title,
      item.data.goal,
      ...item.data.skills,
      ...item.data.experience.map((experience) => experience.position),
      ...item.data.education.map((education) => education.field),
    ])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const professions = await db.profession.findMany({
    where: { parentId: { not: null }, isActive: true },
    select: {
      id: true,
      keywords: true,
      nameUz: true,
      parent: { select: { educationFields: true } },
    },
  });
  const matched = professions
    .map((profession) => {
      const hits = profession.keywords.filter(
        (keyword) =>
          keyword.length >= 3 && search.includes(keyword.toLowerCase()),
      ).length;
      const education =
        profession.parent?.educationFields.some((field) =>
          parsedCvs.some((item) =>
            item.data.education.some((education) =>
              education.field?.toLowerCase().includes(field.toLowerCase()),
            ),
          ),
        ) ?? false;
      return {
        id: profession.id,
        confidence: Math.min(100, hits * 30 + (education ? 20 : 0)),
      };
    })
    .filter((item) => item.confidence >= 30);
  if (matched.length === 0) {
    const other = professions.find(
      (profession) => profession.nameUz === "Boshqa (admin qo'lda o'tkazadi)",
    );
    if (other) matched.push({ id: other.id, confidence: 0 });
  }
  const manual = await db.userProfession.findMany({
    where: { userId, source: { not: "AUTO" } },
    select: { professionId: true, confidence: true, source: true },
  });
  const selected = new Map<string, number>();
  for (const item of matched) selected.set(item.id, item.confidence);
  for (const item of manual) {
    if (item.source === "ADMIN_EXCLUDED") selected.delete(item.professionId);
    else selected.set(item.professionId, item.confidence);
  }
  if (selected.size === 0) {
    const other = professions.find(
      (profession) => profession.nameUz === "Boshqa (admin qo'lda o'tkazadi)",
    );
    if (
      other &&
      !manual.some(
        (item) =>
          item.professionId === other.id && item.source === "ADMIN_EXCLUDED",
      )
    )
      selected.set(other.id, 0);
  }
  const group = personalityGroup(result.typeCode);
  await db.$transaction(async (tx) => {
    await tx.userLanguage.deleteMany({ where: { userId } });
    if (languages.length)
      await tx.userLanguage.createMany({
        data: languages.map((item) => ({
          userId,
          language: item.name,
          level: item.level,
        })),
        skipDuplicates: true,
      });
    await tx.userProfession.deleteMany({ where: { userId, source: "AUTO" } });
    for (const item of matched) {
      if (manual.some((entry) => entry.professionId === item.id)) continue;
      await tx.userProfession.create({
        data: {
          userId,
          professionId: item.id,
          source: "AUTO",
          confidence: item.confidence,
        },
      });
    }
    for (const professionId of selected.keys()) {
      if (
        matched.some((item) => item.id === professionId) ||
        manual.some((item) => item.professionId === professionId)
      )
        continue;
      await tx.userProfession.create({
        data: { userId, professionId, source: "AUTO", confidence: 0 },
      });
    }
    await tx.readinessProfile.deleteMany({ where: { userId } });
    for (const [professionId, confidence] of selected) {
      const readinessScore = Math.min(
        100,
        Math.round(
          25 +
            confidence * 0.45 +
            Math.min(15, (months / 12) * 5) +
            Math.min(15, foreign.length * 7.5),
        ),
      );
      await tx.readinessProfile.create({
        data: {
          userId,
          professionId,
          personalityGroup: group,
          typeCode: result.typeCode,
          languageBand,
          experienceBand: band,
          hasInternship,
          readinessScore,
        },
      });
    }
  });
}
