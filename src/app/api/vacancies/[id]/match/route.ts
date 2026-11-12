import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireApprovedCompany } from "@/backend/company/access";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { runMatching } from "@/backend/match/service";
import { getOwnVacancy } from "@/backend/vacancy/service";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({ locale: z.enum(["kk", "uz", "ru", "en"]) });

/**
 * Saralash / yangilash. Faqat tasdiqlangan kompaniya va faqat o'z talabi.
 * Obuna bo'lmasa yoki AI ishlamasa ham xato emas: kalit so'z qidiruvi natijasi qaytadi.
 */
export const POST = route<Context>(async (request, { params }) => {
  const { user, company } = await requireApprovedCompany(request);
  const vacancy = await getOwnVacancy(company.id, (await params).id);
  const { locale } = await parseJson(request, bodySchema);
  rateLimit(`match:${company.id}`, LIMITS.matchRun);
  const outcome = await runMatching({
    company,
    vacancy,
    locale,
    userId: user.id,
  });
  return NextResponse.json(outcome);
});
