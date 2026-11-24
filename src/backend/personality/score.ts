import type { PersonalityQuestionType, PersonalityScale } from "@prisma/client";
import { STATEMENT_OPTION_VALUE_BY_KEY } from "./catalog";

export type ScoredQuestion = {
  id: string;
  scale: PersonalityScale;
  type?: PersonalityQuestionType;
  direction: number;
  sort: number;
};

export type PersonalityScore = {
  typeCode: string;
  identity: "A" | "T";
  mindPct: number;
  energyPct: number;
  naturePct: number;
  tacticsPct: number;
  identityPct: number;
};

export type RawAnswerValue = number | string;

const AXES = [
  ["MIND", "E", "I", "mindPct"],
  ["ENERGY", "N", "S", "energyPct"],
  ["NATURE", "F", "T", "naturePct"],
  ["TACTICS", "P", "J", "tacticsPct"],
  ["IDENTITY", "T", "A", "identityPct"],
] as const;

/**
 * Javobni ichki son qiymatiga (-2..+2) o'giradi.
 * - STATEMENT: so'zli kalit ("strongly_disagree".."strongly_agree") yoki -2..+2
 * - CHOICE: "A" (+2) yoki "B" (-2)
 */
export function resolveAnswerNumericValue(
  type: PersonalityQuestionType,
  raw: RawAnswerValue,
): { value: number; choice: "A" | "B" | null } {
  if (type === "CHOICE") {
    if (raw === "A" || raw === "a") return { value: 2, choice: "A" };
    if (raw === "B" || raw === "b") return { value: -2, choice: "B" };
    throw new Error("Invalid choice answer");
  }
  if (typeof raw === "string") {
    if (Object.hasOwn(STATEMENT_OPTION_VALUE_BY_KEY, raw)) {
      return { value: STATEMENT_OPTION_VALUE_BY_KEY[raw], choice: null };
    }
    throw new Error("Invalid statement answer key");
  }
  if (Number.isInteger(raw) && raw >= -2 && raw <= 2) {
    return { value: raw, choice: null };
  }
  throw new Error("Invalid numeric answer");
}

/** A positive score favours the first letter on each axis (E/N/F/P/T). */
export function scorePersonality(
  questions: ScoredQuestion[],
  answers: Record<string, RawAnswerValue>,
): PersonalityScore {
  if (
    questions.length < 10 ||
    questions.length % 5 !== 0 ||
    Object.keys(answers).length !== questions.length
  ) {
    throw new Error("All attempt questions must be answered");
  }
  const perScale = questions.length / 5;
  const maxAbs = perScale * 2;
  const result: Record<string, number> = {};
  const letters: string[] = [];

  for (const [scale, positive, negative, field] of AXES) {
    const items = questions.filter((q) => q.scale === scale);
    if (items.length !== perScale) {
      throw new Error(`Invalid ${scale} question set`);
    }
    let sum = 0;
    const numericMap = new Map<string, number>();
    for (const item of items) {
      if (item.direction !== 1 && item.direction !== -1) {
        throw new Error("Invalid question direction");
      }
      const raw = answers[item.id];
      if (raw === undefined || raw === null) {
        throw new Error("Missing answer");
      }
      const { value } = resolveAnswerNumericValue(
        item.type ?? "STATEMENT",
        raw,
      );
      numericMap.set(item.id, value);
      sum += value * item.direction;
    }
    result[field] = Math.round(((sum + maxAbs) / (2 * maxAbs)) * 100);
    const last = [...items].sort((a, b) => b.sort - a.sort)[0];
    const tie = (numericMap.get(last.id) ?? 0) * last.direction;
    letters.push(sum > 0 || (sum === 0 && tie >= 0) ? positive : negative);
  }

  return {
    typeCode: letters.slice(0, 4).join(""),
    identity: letters[4] as "A" | "T",
    mindPct: result.mindPct,
    energyPct: result.energyPct,
    naturePct: result.naturePct,
    tacticsPct: result.tacticsPct,
    identityPct: result.identityPct,
  };
}

export function personalityGroup(code: string): "NT" | "NF" | "SJ" | "SP" {
  if (code[1] === "N") return code[2] === "T" ? "NT" : "NF";
  return code[3] === "J" ? "SJ" : "SP";
}
