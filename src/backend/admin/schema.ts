import { z } from "zod";

export const ADMIN_PAGE_SIZE = 20;

const page = z.coerce.number().int().min(1).max(10_000).catch(1);
const query = z
  .string()
  .trim()
  .max(100)
  .optional()
  .catch(undefined)
  .transform((value) => value || undefined);

/** Ro'yxat filtrlari URL dan keladi: noto'g'ri qiymat xato emas, standart qiymatga aylanadi. */
export const userListSchema = z.object({
  page,
  q: query,
  role: z.enum(["STUDENT", "COMPANY", "ADMIN"]).optional().catch(undefined),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional().catch(undefined),
});
export type UserListQuery = z.infer<typeof userListSchema>;

export const companyListSchema = z.object({
  page,
  q: query,
  approval: z
    .enum(["PENDING", "APPROVED", "REJECTED"])
    .optional()
    .catch(undefined),
});
export type CompanyListQuery = z.infer<typeof companyListSchema>;

export const userStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

/** Obuna tugash sanasi (YYYY-MM-DD, Toshkent vaqti bilan kun oxirigacha) yoki null = o'chirish. */
export const subscriptionSchema = z.object({
  until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "INVALID_DATE")
    .refine(
      (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
      "INVALID_DATE",
    )
    .nullable(),
});

export const aiLimitSchema = z.object({
  limitUsd: z
    .number({ error: "INVALID_NUMBER" })
    .min(0, "INVALID_NUMBER")
    .max(100_000, "INVALID_NUMBER"),
});

/** Plain object (URLSearchParams yoki Next searchParams) → filtr. */
export function fromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  if (params instanceof URLSearchParams)
    return Object.fromEntries(params.entries());
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}
