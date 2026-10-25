import type { MatchDecision } from "@prisma/client";
import { useTranslations } from "next-intl";

/** Qaror belgisi. Server va klient komponentlarida ishlaydi. */
export function DecisionBadge({ decision }: { decision: MatchDecision }) {
  const t = useTranslations("Candidate.decision");
  if (decision === "NONE") return null;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        decision === "SELECTED"
          ? "bg-green-100 text-green-800"
          : "bg-gray-200 text-gray-700"
      }`}
    >
      {t(decision)}
    </span>
  );
}
