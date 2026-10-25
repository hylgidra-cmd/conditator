import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireApprovedCompany } from "@/lib/company/access";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";
import { decisionSchema, setDecision } from "@/lib/match/decision";

type Context = { params: Promise<{ id: string; cvId: string }> };

/** "Tanlandi" / "Mos emas" / belgini olib tashlash. Faqat tasdiqlangan kompaniya, o'z talabi, ochiq CV. */
export const PUT = route<Context>(async (request, { params }) => {
  const { company } = await requireApprovedCompany(request);
  rateLimit(`decision:${company.id}`, LIMITS.vacancyWrite);
  const { id, cvId } = await params;
  const { decision } = await parseJson(request, decisionSchema);
  const saved = await setDecision(company.id, id, cvId, decision);
  return NextResponse.json({ decision: saved });
});
