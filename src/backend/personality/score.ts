import type { PersonalityScale } from "@prisma/client";

export type ScoredQuestion = {
  id: string;
  scale: PersonalityScale;
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

const AXES = [
  ["MIND", "E", "I", "mindPct"],
  ["ENERGY", "N", "S", "energyPct"],
  ["NATURE", "F", "T", "naturePct"],
  ["TACTICS", "P", "J", "tacticsPct"],
  ["IDENTITY", "T", "A", "identityPct"],
] as const;

/** A positive score favours the first letter on each axis. */
export function scorePersonality(
  questions: ScoredQuestion[],
  answers: Record<string, number>,
): PersonalityScore {
  if (questions.length !== 60 || Object.keys(answers).length !== 60) {
    throw new Error("Exactly 60 answers are required");
  }
  const result: Record<string, number> = {};
  const letters: string[] = [];
  for (const [scale, positive, negative, field] of AXES) {
    const items = questions.filter((q) => q.scale === scale);
    if (items.length !== 12) throw new Error(`Invalid ${scale} question set`);
    let sum = 0;
    for (const item of items) {
      const value = answers[item.id];
      if (
        !Number.isInteger(value) ||
        value < -3 ||
        value > 3 ||
        (item.direction !== 1 && item.direction !== -1)
      ) {
        throw new Error("Invalid answer");
      }
      sum += value * item.direction;
    }
    result[field] = Math.round(((sum + 36) / 72) * 100);
    const last = [...items].sort((a, b) => b.sort - a.sort)[0];
    const tie = answers[last.id] * last.direction;
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
