import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PERSONALITY_QUESTIONS } from "../prisma/personality-questions";

describe("seed data", () => {
  it("contains exactly 60 localized, distinct questions", () => {
    const rows = Object.values(PERSONALITY_QUESTIONS).flat();
    expect(rows).toHaveLength(60);
    expect(new Set(rows.map((row) => row[0]))).toHaveProperty("size", 60);
    expect(
      rows.every(
        (row) => row.length === 4 && row.every((text) => text.length >= 5),
      ),
    ).toBe(true);
  });

  it("contains the 21 areas and 126 professions from the TZ", () => {
    const data = JSON.parse(
      readFileSync(resolve("prisma/profession-seed.json"), "utf8"),
    ) as Array<{ area: string; professions: string[] }>;
    expect(data).toHaveLength(21);
    expect(data.reduce((sum, area) => sum + area.professions.length, 0)).toBe(
      126,
    );
  });
});
