import ExcelJS from "exceljs";
import { z } from "zod";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { cvDataSchema } from "@/backend/cv/schema";

export type SupportedLocale = "uz" | "kk" | "ru" | "en";

export function normalizeSkillToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’‘`ʻʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function expandTargetTokens(template: {
  nameUz: string;
  nameKk: string;
  nameRu: string;
  nameEn: string;
  synonyms: string[];
}): string[] {
  const tokens = new Set<string>();
  const add = (val: string) => {
    const norm = normalizeSkillToken(val);
    if (!norm) return;
    tokens.add(norm);
    const noParens = norm.replace(/\s*\([^)]*\)/g, "").trim();
    if (noParens) tokens.add(noParens);
    for (const m of norm.matchAll(/\(([^)]+)\)/g)) {
      const inner = m[1];
      if (!inner) continue;
      for (const part of inner.split(/[,/]/)) {
        const clean = part.trim();
        if (clean.length >= 2) tokens.add(clean);
      }
    }
  };

  add(template.nameUz);
  add(template.nameKk);
  add(template.nameRu);
  add(template.nameEn);
  for (const s of template.synonyms) add(s);

  return Array.from(tokens);
}

/**
 * Sinonimlar bo'yicha, katta-kichik harfga qaramasdan ko'nikma mosligini tekshiradi.
 * Masalan: "Leadership", "liderlik", "jamoa boshqaruvi" -> bitta ko'nikma deb sanaladi.
 */
export function doesCvSkillMatchTemplate(
  cvSkills: string[],
  template: {
    nameUz: string;
    nameKk: string;
    nameRu: string;
    nameEn: string;
    synonyms: string[];
  },
): boolean {
  if (cvSkills.length === 0) return false;

  const cvTokens = new Set<string>();
  for (const raw of cvSkills) {
    const norm = normalizeSkillToken(raw);
    if (!norm) continue;
    cvTokens.add(norm);
    const noParens = norm.replace(/\s*\([^)]*\)/g, "").trim();
    if (noParens) cvTokens.add(noParens);
    for (const part of norm.split(/[,;/]/)) {
      const p = part.trim();
      if (p.length >= 2) cvTokens.add(p);
    }
  }

  const targets = expandTargetTokens(template);
  for (const cvTok of cvTokens) {
    for (const target of targets) {
      if (cvTok === target) return true;
      if (cvTok.length >= 4 && target.length >= 4) {
        if (cvTok.includes(target) || target.includes(cvTok)) return true;
      }
    }
  }
  return false;
}

export function localizedSkillFields(
  row: {
    id: string;
    position: number;
    nameUz: string;
    nameKk: string;
    nameRu: string;
    nameEn: string;
    descriptionUz: string;
    descriptionKk: string;
    descriptionRu: string;
    descriptionEn: string;
    synonyms: string[];
  },
  locale: SupportedLocale,
) {
  const name =
    locale === "kk"
      ? row.nameKk
      : locale === "ru"
        ? row.nameRu
        : locale === "en"
          ? row.nameEn
          : row.nameUz;
  const description =
    locale === "kk"
      ? row.descriptionKk
      : locale === "ru"
        ? row.descriptionRu
        : locale === "en"
          ? row.descriptionEn
          : row.descriptionUz;
  return {
    id: row.id,
    position: row.position,
    name,
    description,
    synonyms: row.synonyms,
  };
}

export function localizedProfessionName(
  prof: { nameUz: string; nameKk: string; nameRu: string; nameEn: string },
  locale: SupportedLocale,
): string {
  return locale === "kk"
    ? prof.nameKk
    : locale === "ru"
      ? prof.nameRu
      : locale === "en"
        ? prof.nameEn
        : prof.nameUz;
}

export async function getProfessionSkillTemplate(
  professionId: string,
  locale: SupportedLocale = "uz",
) {
  const profession = await db.profession.findUnique({
    where: { id: professionId },
    select: {
      id: true,
      parentId: true,
      nameUz: true,
      nameKk: true,
      nameRu: true,
      nameEn: true,
    },
  });
  if (!profession) throw new ApiError(404, "NOT_FOUND");

  const rows = await db.professionSkillTemplate.findMany({
    where: { professionId, isActive: true },
    orderBy: { position: "asc" },
  });

  return {
    professionId: profession.id,
    professionName: localizedProfessionName(profession, locale),
    skills: rows.map((r) => localizedSkillFields(r, locale)),
    rawSkills: rows,
  };
}

function extractCvSkills(cv: { skills: string[]; data: unknown }): string[] {
  const set = new Set<string>();
  for (const s of cv.skills) {
    if (s.trim()) set.add(s.trim());
  }
  const parsed = cvDataSchema.safeParse(cv.data);
  if (parsed.success) {
    for (const s of parsed.data.skills) {
      if (s.trim()) set.add(s.trim());
    }
  }
  return Array.from(set);
}

/**
 * Bitta CV uchun bog'langan (yoki sarlavhadan aniqlangan) kasblar bo'yicha CvSkillMatch ni hisoblaydi.
 */
export async function recalculateCvSkillMatchesForCv(cvId: string) {
  const cv = await db.cv.findUnique({
    where: { id: cvId },
    select: {
      id: true,
      userId: true,
      title: true,
      skills: true,
      data: true,
      user: {
        select: {
          professionLinks: {
            where: { source: { not: "ADMIN_EXCLUDED" } },
            select: { professionId: true },
          },
        },
      },
    },
  });
  if (!cv) return [];

  const cvSkills = extractCvSkills(cv);
  let targetProfessionIds = cv.user.professionLinks.map((l) => l.professionId);

  // Agar talabada hali kasb bog'lanmagan bo'lsa, CV sarlavhasi va ko'nikmalaridan eng mos kasbni topamiz
  if (targetProfessionIds.length === 0) {
    const allJobs = await db.profession.findMany({
      where: { parentId: { not: null }, isActive: true },
      select: { id: true, nameUz: true, keywords: true },
    });
    const hay = `${cv.title} ${cvSkills.join(" ")}`.toLowerCase();
    let bestId: string | null = null;
    let bestHits = 0;
    for (const job of allJobs) {
      let hits = 0;
      if (hay.includes(job.nameUz.toLowerCase())) hits += 3;
      for (const kw of job.keywords) {
        if (kw.length >= 3 && hay.includes(kw.toLowerCase())) hits += 1;
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestId = job.id;
      }
    }
    if (bestId) targetProfessionIds = [bestId];
  }

  if (targetProfessionIds.length === 0) return [];

  const templates = await db.professionSkillTemplate.findMany({
    where: {
      professionId: { in: targetProfessionIds },
      isActive: true,
    },
    orderBy: { position: "asc" },
  });

  const byProfession = new Map<string, typeof templates>();
  for (const tpl of templates) {
    const arr = byProfession.get(tpl.professionId) ?? [];
    arr.push(tpl);
    byProfession.set(tpl.professionId, arr);
  }

  const now = new Date();
  const results = [];
  for (const [professionId, profTemplates] of byProfession.entries()) {
    const matchedSkillIds: string[] = [];
    const missingSkillIds: string[] = [];
    for (const tpl of profTemplates) {
      if (doesCvSkillMatchTemplate(cvSkills, tpl)) {
        matchedSkillIds.push(tpl.id);
      } else {
        missingSkillIds.push(tpl.id);
      }
    }
    const row = await db.cvSkillMatch.upsert({
      where: {
        cvId_professionId: { cvId: cv.id, professionId },
      },
      create: {
        cvId: cv.id,
        professionId,
        matchedCount: matchedSkillIds.length,
        matchedSkillIds,
        missingSkillIds,
        recalculatedAt: now,
      },
      update: {
        matchedCount: matchedSkillIds.length,
        matchedSkillIds,
        missingSkillIds,
        recalculatedAt: now,
      },
    });
    results.push(row);
  }

  return results;
}

/**
 * Tungi cron yoki admin o'zgarishidan keyin barcha faol CV lar uchun CvSkillMatch ni qayta hisoblash.
 */
export async function recalculateAllCvSkillMatches(): Promise<number> {
  let updated = 0;
  let cursor: string | undefined;
  const BATCH_SIZE = 200;

  while (true) {
    const cvs = await db.cv.findMany({
      where: { savedAt: { not: null }, user: { status: "ACTIVE" } },
      select: { id: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (cvs.length === 0) break;

    for (const cv of cvs) {
      const rows = await recalculateCvSkillMatchesForCv(cv.id);
      if (rows.length > 0) updated += 1;
    }

    cursor = cvs[cvs.length - 1]?.id;
    if (cvs.length < BATCH_SIZE) break;
  }

  return updated;
}

/**
 * GET /api/cv/{id}/skill-fit uchun natija:
 * - Talaba (o'z CV si) va Admin: matchedCount / 6 + matchedSkills + missingSkills ("Rivojlantirish kerak")
 * - HR (COMPANY): FAQAT matchedCount / 6 va matchedSkills; missingSkills HECH QACHON qaytarilmaydi!
 */
export async function getCvSkillFit(params: {
  cvId: string;
  locale: SupportedLocale;
  includeMissing: boolean;
  professionId?: string | null;
}) {
  const cv = await db.cv.findUnique({
    where: { id: params.cvId },
    select: {
      id: true,
      title: true,
      skills: true,
      data: true,
      userId: true,
      skillMatches: {
        orderBy: { matchedCount: "desc" },
        take: 5,
      },
      user: {
        select: {
          professionLinks: {
            where: { source: { not: "ADMIN_EXCLUDED" } },
            select: { professionId: true },
            take: 3,
          },
        },
      },
    },
  });
  if (!cv) throw new ApiError(404, "NOT_FOUND");

  const resolvedProfessionId =
    params.professionId ??
    cv.skillMatches[0]?.professionId ??
    cv.user.professionLinks[0]?.professionId ??
    null;

  if (!resolvedProfessionId) {
    return null;
  }

  const profession = await db.profession.findUnique({
    where: { id: resolvedProfessionId },
    select: {
      id: true,
      nameUz: true,
      nameKk: true,
      nameRu: true,
      nameEn: true,
    },
  });
  if (!profession) return null;

  const templates = await db.professionSkillTemplate.findMany({
    where: { professionId: resolvedProfessionId, isActive: true },
    orderBy: { position: "asc" },
  });
  if (templates.length === 0) return null;

  const cvSkills = extractCvSkills(cv);
  const matched: ReturnType<typeof localizedSkillFields>[] = [];
  const missing: ReturnType<typeof localizedSkillFields>[] = [];

  for (const tpl of templates) {
    const localized = localizedSkillFields(tpl, params.locale);
    if (doesCvSkillMatchTemplate(cvSkills, tpl)) {
      matched.push(localized);
    } else {
      missing.push(localized);
    }
  }

  return {
    cvId: cv.id,
    professionId: profession.id,
    professionName: localizedProfessionName(profession, params.locale),
    matchedCount: matched.length,
    totalCount: templates.length,
    matchedSkills: matched,
    ...(params.includeMissing ? { missingSkills: missing } : {}),
  };
}

/**
 * Statistika sahifasi (TZ 3, GET /api/company/statistics/professions/{id}/skills):
 * Har ko'nikma bo'yicha nechta talabada borligini qaytaradi.
 * Maxfiylik qoidasi: 5 dan kam bo'lsa belowThreshold: true ("5 dan kam").
 */
export async function getCompanyProfessionSkillStats(
  professionId: string,
  locale: SupportedLocale = "uz",
) {
  const profession = await db.profession.findUnique({
    where: { id: professionId },
    select: {
      id: true,
      nameUz: true,
      nameKk: true,
      nameRu: true,
      nameEn: true,
    },
  });
  if (!profession) throw new ApiError(404, "NOT_FOUND");

  const templates = await db.professionSkillTemplate.findMany({
    where: { professionId, isActive: true },
    orderBy: { position: "asc" },
  });

  const cvs = await db.cv.findMany({
    where: {
      isVisible: true,
      savedAt: { not: null },
      user: {
        status: "ACTIVE",
        professionLinks: {
          some: { professionId, source: { not: "ADMIN_EXCLUDED" } },
        },
      },
    },
    select: { id: true, skills: true, data: true },
    take: 2000,
  });

  const totalCandidates = cvs.length;
  const items = templates.map((tpl) => {
    let count = 0;
    for (const cv of cvs) {
      if (doesCvSkillMatchTemplate(extractCvSkills(cv), tpl)) {
        count += 1;
      }
    }
    const belowThreshold = count < 5;
    const loc = localizedSkillFields(tpl, locale);
    return {
      id: loc.id,
      position: loc.position,
      name: loc.name,
      description: loc.description,
      matchedCount: belowThreshold ? null : count,
      belowThreshold,
      totalCandidates: totalCandidates < 5 ? null : totalCandidates,
      totalBelowThreshold: totalCandidates < 5,
    };
  });

  return {
    professionId: profession.id,
    professionName: localizedProfessionName(profession, locale),
    totalCandidates: totalCandidates < 5 ? null : totalCandidates,
    totalBelowThreshold: totalCandidates < 5,
    skills: items,
  };
}

// ---------- Admin CRUD & Excel/CSV Import/Export ----------

export const adminSkillItemSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().min(1).max(6),
  nameUz: z.string().trim().min(1).max(120),
  nameKk: z.string().trim().min(1).max(120),
  nameRu: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional().default(""),
  descriptionUz: z.string().trim().min(1).max(300),
  descriptionKk: z.string().trim().min(1).max(300),
  descriptionRu: z.string().trim().min(1).max(300),
  descriptionEn: z.string().trim().max(300).optional().default(""),
  synonyms: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

export const adminUpdateSkillTemplatesSchema = z.object({
  skills: z.array(adminSkillItemSchema).length(6, {
    error: "EXACTLY_SIX_SKILLS_REQUIRED",
  }),
});

export async function saveAdminProfessionSkillTemplates(params: {
  adminId: string;
  professionId: string;
  skills: Array<z.infer<typeof adminSkillItemSchema>>;
}) {
  if (params.skills.length !== 6) {
    throw new ApiError(400, "VALIDATION");
  }

  const profession = await db.profession.findUnique({
    where: { id: params.professionId },
    select: { id: true, nameUz: true },
  });
  if (!profession) throw new ApiError(404, "NOT_FOUND");

  const before = await db.professionSkillTemplate.findMany({
    where: { professionId: params.professionId },
    orderBy: { position: "asc" },
    select: { position: true, nameUz: true, descriptionUz: true },
  });

  const normalized = params.skills.map((item, idx) => ({
    position: idx + 1,
    nameUz: item.nameUz.trim(),
    nameKk: item.nameKk.trim() || item.nameUz.trim(),
    nameRu: item.nameRu.trim() || item.nameUz.trim(),
    nameEn: item.nameEn?.trim() || item.nameUz.trim(),
    descriptionUz: item.descriptionUz.trim(),
    descriptionKk: item.descriptionKk.trim() || item.descriptionUz.trim(),
    descriptionRu: item.descriptionRu.trim() || item.descriptionUz.trim(),
    descriptionEn: item.descriptionEn?.trim() || item.descriptionUz.trim(),
    synonyms: Array.from(
      new Set(
        item.synonyms
          .map((s) => normalizeSkillToken(s))
          .filter((s) => s.length >= 2),
      ),
    ),
  }));

  await db.$transaction(async (tx) => {
    for (const row of normalized) {
      await tx.professionSkillTemplate.upsert({
        where: {
          professionId_position: {
            professionId: params.professionId,
            position: row.position,
          },
        },
        create: {
          professionId: params.professionId,
          position: row.position,
          nameUz: row.nameUz,
          nameKk: row.nameKk,
          nameRu: row.nameRu,
          nameEn: row.nameEn,
          descriptionUz: row.descriptionUz,
          descriptionKk: row.descriptionKk,
          descriptionRu: row.descriptionRu,
          descriptionEn: row.descriptionEn,
          synonyms: row.synonyms,
          isActive: true,
          updatedById: params.adminId,
        },
        update: {
          nameUz: row.nameUz,
          nameKk: row.nameKk,
          nameRu: row.nameRu,
          nameEn: row.nameEn,
          descriptionUz: row.descriptionUz,
          descriptionKk: row.descriptionKk,
          descriptionRu: row.descriptionRu,
          descriptionEn: row.descriptionEn,
          synonyms: row.synonyms,
          isActive: true,
          updatedById: params.adminId,
        },
      });
    }

    await tx.adminLog.create({
      data: {
        adminId: params.adminId,
        action: "SKILL_TEMPLATE_EDIT",
        targetType: "Profession",
        targetId: params.professionId,
        details: {
          professionName: profession.nameUz,
          beforeCount: before.length,
          afterSkills: normalized.map((n) => n.nameUz),
        },
      },
    });
  });

  return db.professionSkillTemplate.findMany({
    where: { professionId: params.professionId, isActive: true },
    orderBy: { position: "asc" },
  });
}

export async function exportSkillTemplatesWorkbook(): Promise<Buffer> {
  const rows = await db.professionSkillTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ professionId: "asc" }, { position: "asc" }],
    include: {
      profession: {
        select: {
          id: true,
          nameUz: true,
          parent: { select: { nameUz: true } },
        },
      },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Skill Templates");
  ws.columns = [
    { header: "profession_id", key: "professionId", width: 18 },
    { header: "soha", key: "area", width: 28 },
    { header: "kasb_papkasi", key: "profession", width: 32 },
    { header: "tartib", key: "position", width: 8 },
    { header: "name_uz", key: "nameUz", width: 30 },
    { header: "description_uz", key: "descriptionUz", width: 42 },
    { header: "name_kk", key: "nameKk", width: 30 },
    { header: "description_kk", key: "descriptionKk", width: 42 },
    { header: "name_ru", key: "nameRu", width: 30 },
    { header: "description_ru", key: "descriptionRu", width: 42 },
    { header: "name_en", key: "nameEn", width: 28 },
    { header: "description_en", key: "descriptionEn", width: 36 },
    { header: "synonyms", key: "synonyms", width: 44 },
  ];

  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    ws.addRow({
      professionId: r.professionId,
      area: r.profession.parent?.nameUz ?? "",
      profession: r.profession.nameUz,
      position: r.position,
      nameUz: r.nameUz,
      descriptionUz: r.descriptionUz,
      nameKk: r.nameKk,
      descriptionKk: r.descriptionKk,
      nameRu: r.nameRu,
      descriptionRu: r.descriptionRu,
      nameEn: r.nameEn,
      descriptionEn: r.descriptionEn,
      synonyms: r.synonyms.join(", "),
    });
  }

  const arrBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrBuf);
}

type ParsedImportRow = {
  professionId?: string;
  professionName?: string;
  position: number;
  nameUz: string;
  descriptionUz: string;
  nameKk: string;
  descriptionKk: string;
  nameRu: string;
  descriptionRu: string;
  nameEn: string;
  descriptionEn: string;
  synonyms: string[];
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function importSkillTemplatesFromBuffer(params: {
  adminId: string;
  buffer: Buffer;
  filename: string;
}) {
  const lowerName = params.filename.toLowerCase();
  const parsedRows: ParsedImportRow[] = [];

  if (lowerName.endsWith(".csv")) {
    const text = params.buffer.toString("utf8").replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new ApiError(400, "VALIDATION");
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const idx = (names: string[]) =>
      headers.findIndex((h) => names.includes(h));

    const iProfId = idx(["profession_id", "professionid"]);
    const iProfName = idx(["kasb_papkasi", "profession", "kasb"]);
    const iPos = idx(["tartib", "position"]);
    const iNameUz = idx(["name_uz", "konikma", "ko'nikma"]);
    const iDescUz = idx(["description_uz", "izoh"]);
    const iNameKk = idx(["name_kk", "name_kaa"]);
    const iDescKk = idx(["description_kk", "description_kaa"]);
    const iNameRu = idx(["name_ru"]);
    const iDescRu = idx(["description_ru"]);
    const iNameEn = idx(["name_en"]);
    const iDescEn = idx(["description_en"]);
    const iSyns = idx(["synonyms", "sinonimlar"]);

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const nameUz = iNameUz >= 0 ? (cols[iNameUz] ?? "").trim() : "";
      const pos = Number(iPos >= 0 ? cols[iPos] : 0);
      if (!nameUz || !Number.isInteger(pos) || pos < 1 || pos > 6) continue;
      const descUz = (iDescUz >= 0 ? cols[iDescUz] : "") || nameUz;
      parsedRows.push({
        professionId: iProfId >= 0 ? cols[iProfId]?.trim() : undefined,
        professionName: iProfName >= 0 ? cols[iProfName]?.trim() : undefined,
        position: pos,
        nameUz,
        descriptionUz: descUz,
        nameKk: (iNameKk >= 0 ? cols[iNameKk]?.trim() : "") || nameUz,
        descriptionKk: (iDescKk >= 0 ? cols[iDescKk]?.trim() : "") || descUz,
        nameRu: (iNameRu >= 0 ? cols[iNameRu]?.trim() : "") || nameUz,
        descriptionRu: (iDescRu >= 0 ? cols[iDescRu]?.trim() : "") || descUz,
        nameEn: (iNameEn >= 0 ? cols[iNameEn]?.trim() : "") || nameUz,
        descriptionEn: (iDescEn >= 0 ? cols[iDescEn]?.trim() : "") || descUz,
        synonyms:
          iSyns >= 0 && cols[iSyns]
            ? cols[iSyns]
                .split(/[,;]/)
                .map((s) => normalizeSkillToken(s))
                .filter((s) => s.length >= 2)
            : [],
      });
    }
  } else {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      params.buffer as unknown as Parameters<typeof wb.xlsx.load>[0],
    );
    const ws = wb.worksheets[0];
    if (!ws) throw new ApiError(400, "VALIDATION");

    const headerMap = new Map<string, number>();
    ws.getRow(1).eachCell((cell, colNumber) => {
      headerMap.set(String(cell.value ?? "").toLowerCase().trim(), colNumber);
    });
    const colVal = (row: ExcelJS.Row, keys: string[]): string => {
      for (const k of keys) {
        const cIdx = headerMap.get(k);
        if (cIdx) {
          const val = row.getCell(cIdx).text?.trim();
          if (val) return val;
        }
      }
      return "";
    };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const nameUz = colVal(row, ["name_uz", "konikma", "ko'nikma"]);
      const pos = Number(colVal(row, ["tartib", "position"]));
      if (!nameUz || !Number.isInteger(pos) || pos < 1 || pos > 6) return;
      const descUz = colVal(row, ["description_uz", "izoh"]) || nameUz;
      const synsRaw = colVal(row, ["synonyms", "sinonimlar"]);
      parsedRows.push({
        professionId: colVal(row, ["profession_id", "professionid"]) || undefined,
        professionName:
          colVal(row, ["kasb_papkasi", "profession", "kasb"]) || undefined,
        position: pos,
        nameUz,
        descriptionUz: descUz,
        nameKk: colVal(row, ["name_kk", "name_kaa"]) || nameUz,
        descriptionKk:
          colVal(row, ["description_kk", "description_kaa"]) || descUz,
        nameRu: colVal(row, ["name_ru"]) || nameUz,
        descriptionRu: colVal(row, ["description_ru"]) || descUz,
        nameEn: colVal(row, ["name_en"]) || nameUz,
        descriptionEn: colVal(row, ["description_en"]) || descUz,
        synonyms: synsRaw
          ? synsRaw
              .split(/[,;]/)
              .map((s) => normalizeSkillToken(s))
              .filter((s) => s.length >= 2)
          : [],
      });
    });
  }

  if (parsedRows.length === 0) {
    throw new ApiError(400, "VALIDATION");
  }

  const allProfs = await db.profession.findMany({
    where: { parentId: { not: null } },
    select: { id: true, nameUz: true },
  });
  const byId = new Set(allProfs.map((p) => p.id));
  const byName = new Map(
    allProfs.map((p) => [normalizeSkillToken(p.nameUz), p.id]),
  );

  const grouped = new Map<string, ParsedImportRow[]>();
  for (const r of parsedRows) {
    const resolvedId =
      (r.professionId && byId.has(r.professionId) ? r.professionId : null) ??
      (r.professionName
        ? (byName.get(normalizeSkillToken(r.professionName)) ?? null)
        : null);
    if (!resolvedId) continue;
    const arr = grouped.get(resolvedId) ?? [];
    arr.push(r);
    grouped.set(resolvedId, arr);
  }

  let updatedProfessions = 0;
  let skippedInvalidCount = 0;

  for (const [professionId, group] of grouped.entries()) {
    const sorted = [...group].sort((a, b) => a.position - b.position);
    const uniquePositions = new Set(sorted.map((s) => s.position));
    if (
      sorted.length !== 6 ||
      uniquePositions.size !== 6 ||
      sorted[0]?.position !== 1 ||
      sorted[5]?.position !== 6
    ) {
      skippedInvalidCount += 1;
      continue;
    }
    for (let i = 0; i < 6; i++) {
      const row = sorted[i];
      await db.professionSkillTemplate.upsert({
        where: { professionId_position: { professionId, position: i + 1 } },
        create: {
          professionId,
          position: i + 1,
          nameUz: row.nameUz,
          nameKk: row.nameKk,
          nameRu: row.nameRu,
          nameEn: row.nameEn,
          descriptionUz: row.descriptionUz,
          descriptionKk: row.descriptionKk,
          descriptionRu: row.descriptionRu,
          descriptionEn: row.descriptionEn,
          synonyms: row.synonyms,
          isActive: true,
          updatedById: params.adminId,
        },
        update: {
          nameUz: row.nameUz,
          nameKk: row.nameKk,
          nameRu: row.nameRu,
          nameEn: row.nameEn,
          descriptionUz: row.descriptionUz,
          descriptionKk: row.descriptionKk,
          descriptionRu: row.descriptionRu,
          descriptionEn: row.descriptionEn,
          synonyms: row.synonyms,
          isActive: true,
          updatedById: params.adminId,
        },
      });
    }
    updatedProfessions += 1;
  }

  await db.adminLog.create({
    data: {
      adminId: params.adminId,
      action: "SKILL_TEMPLATE_IMPORT",
      targetType: "ProfessionSkillTemplate",
      targetId: "bulk",
      details: {
        filename: params.filename,
        updatedProfessions,
        skippedInvalidCount,
      },
    },
  });

  return { updatedProfessions, skippedInvalidCount };
}
