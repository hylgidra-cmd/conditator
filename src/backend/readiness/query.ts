import "server-only";
import { z } from "zod";
import { db } from "@/backend/db";
import type { Prisma } from "@prisma/client";

export const filtersSchema = z.object({
  professionId: z.string().max(100).optional(),
  personalityGroup: z.enum(["NT", "NF", "SJ", "SP"]).optional(),
  typeCode: z
    .string()
    .regex(/^[IE][NS][TF][JP]$/)
    .optional(),
  language: z.string().max(50).optional(),
  languageBand: z.enum(["NATIVE_ONLY", "ONE", "TWO_PLUS"]).optional(),
  experienceBand: z
    .enum(["NONE", "UNDER_1", "ONE_TO_THREE", "OVER_3"])
    .optional(),
  region: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  sort: z.enum(["score", "recent", "name"]).default("score"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type ReadinessFilters = z.infer<typeof filtersSchema>;

export function parseFilters(params: URLSearchParams): ReadinessFilters {
  return filtersSchema.parse(Object.fromEntries(params));
}

function whereFor(
  filters: ReadinessFilters,
): Prisma.ReadinessProfileWhereInput {
  return {
    ...(filters.professionId ? { professionId: filters.professionId } : {}),
    ...(filters.personalityGroup
      ? { personalityGroup: filters.personalityGroup }
      : {}),
    ...(filters.typeCode ? { typeCode: filters.typeCode } : {}),
    ...(filters.languageBand ? { languageBand: filters.languageBand } : {}),
    ...(filters.experienceBand
      ? { experienceBand: filters.experienceBand }
      : {}),
    user: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.language
        ? {
            userLanguages: {
              some: {
                language: {
                  contains: filters.language.toLowerCase(),
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(filters.region
        ? {
            cvs: {
              some: {
                location: { contains: filters.region, mode: "insensitive" },
                savedAt: { not: null },
              },
            },
          }
        : {}),
    },
  };
}

const include = {
  user: {
    select: {
      id: true,
      email: true,
      status: true,
      locale: true,
      userLanguages: { select: { language: true, level: true } },
      cvs: {
        orderBy: { updatedAt: "desc" as const },
        take: 1,
        select: {
          id: true,
          title: true,
          location: true,
          data: true,
          isVisible: true,
        },
      },
    },
  },
  profession: {
    select: {
      id: true,
      nameKk: true,
      nameUz: true,
      nameRu: true,
      nameEn: true,
      parentId: true,
    },
  },
} as const;

export async function listReadinessCandidates(
  filters: ReadinessFilters,
  all = false,
) {
  const where = whereFor(filters);
  const orderBy: Prisma.ReadinessProfileOrderByWithRelationInput =
    filters.sort === "recent"
      ? { updatedAt: "desc" }
      : filters.sort === "name"
        ? { user: { email: "asc" } }
        : { readinessScore: "desc" };
  const [total, rows] = await Promise.all([
    db.readinessProfile.count({ where }),
    db.readinessProfile.findMany({
      where,
      include,
      orderBy,
      skip: all ? 0 : (filters.page - 1) * filters.limit,
      take: all ? 10000 : filters.limit,
    }),
  ]);
  return { total, rows };
}
