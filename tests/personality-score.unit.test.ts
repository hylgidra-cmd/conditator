import { describe, expect, it } from "vitest";
import {
  scorePersonality,
  personalityGroup,
} from "../src/backend/personality/score";
import type { ScoredQuestion } from "../src/backend/personality/score";

const scales = ["MIND", "ENERGY", "NATURE", "TACTICS", "IDENTITY"] as const;
const questions: ScoredQuestion[] = scales.flatMap((scale, group) =>
  Array.from({ length: 12 }, (_, index) => ({
    id: `${scale}-${index}`,
    scale,
    direction: index % 2 ? -1 : 1,
    sort: group * 12 + index,
  })),
);

describe("personality scoring", () => {
  it("requires all 60 valid answers", () => {
    expect(() => scorePersonality(questions, {})).toThrow();
    const answers = Object.fromEntries(questions.map((q) => [q.id, 0]));
    answers[questions[0].id] = 4;
    expect(() => scorePersonality(questions, answers)).toThrow();
  });

  it("scores both poles deterministically", () => {
    const positive = Object.fromEntries(
      questions.map((q) => [q.id, q.direction]),
    );
    const negative = Object.fromEntries(
      questions.map((q) => [q.id, -q.direction]),
    );
    expect(scorePersonality(questions, positive).typeCode).toBe("ENFP");
    expect(scorePersonality(questions, positive).identity).toBe("T");
    expect(scorePersonality(questions, negative).typeCode).toBe("ISTJ");
    expect(scorePersonality(questions, negative).identity).toBe("A");
    expect(scorePersonality(questions, positive)).toEqual(
      scorePersonality(questions, positive),
    );
  });

  it("uses the last keyed item to break a tie", () => {
    const answers = Object.fromEntries(questions.map((q) => [q.id, 0]));
    answers[questions[0].id] = 3;
    answers[questions[11].id] = 3;
    expect(scorePersonality(questions, answers).typeCode[0]).toBe("I");
  });

  it("assigns all four character groups", () => {
    expect(["INTJ", "INFP", "ISTJ", "ISFP"].map(personalityGroup)).toEqual([
      "NT",
      "NF",
      "SJ",
      "SP",
    ]);
  });
});
