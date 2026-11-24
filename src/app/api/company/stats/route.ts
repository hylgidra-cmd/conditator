import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { requireApprovedCompany } from "@/backend/company/access";
import { queryCompanyStats } from "@/backend/company/stats";
import { route } from "@/backend/http/route";

const querySchema = z.object({
  region: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  experienceBand: z
    .enum(["NONE", "UNDER_1", "ONE_TO_THREE", "OVER_3"])
    .optional(),
  personalityGroup: z.enum(["NT", "NF", "SJ", "SP"]).optional(),
  locale: z.enum(["uz", "kk", "ru", "en"]).optional(),
});

export const GET = route(async (request) => {
  const user = await requireRole(request, "COMPANY", "ADMIN");
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    await requireApprovedCompany(request);
  }
  const params = Object.fromEntries(
    [...request.nextUrl.searchParams].filter(([, v]) => Boolean(v)),
  );
  const parsed = querySchema.parse(params);
  const stats = await queryCompanyStats(
    {
      region: parsed.region,
      language: parsed.language,
      experienceBand: parsed.experienceBand,
      personalityGroup: parsed.personalityGroup,
    },
    parsed.locale ?? user.locale,
    { isAdmin },
  );
  return NextResponse.json(stats);
});
