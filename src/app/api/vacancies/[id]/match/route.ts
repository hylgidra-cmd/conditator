import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireApprovedCompany } from "@/lib/company/access";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";
import { runMatching } from "@/lib/match/service";
import { getOwnVacancy } from "@/lib/vacancy/service";

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
