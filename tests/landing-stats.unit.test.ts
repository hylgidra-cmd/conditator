import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    vacancy: { count: vi.fn(), findMany: vi.fn() },
    cv: { count: vi.fn() },
    company: { count: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

vi.mock("@/backend/db", () => ({
  db: mockDb,
}));

import { getLandingStats } from "../src/backend/landing-stats";

describe("getLandingStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries VacancyApplication and never returns guessed QMU or 70% fallbacks", async () => {
    mockDb.vacancy.count.mockResolvedValue(1);
    mockDb.cv.count.mockResolvedValue(2);
    mockDb.company.count.mockResolvedValue(1);
    mockDb.company.findMany.mockResolvedValue([
      { id: "c1", name: "Nag-is", industry: "IT", hasLogo: true },
    ]);
    mockDb.$queryRaw
      .mockResolvedValueOnce([
        { marketing: 0, design: 0, pm: 0, business: 0, graphic: 0, web: 1 },
      ])
      .mockResolvedValueOnce([{ total: 0, progressed: 0 }]);
    mockDb.vacancy.findMany.mockResolvedValue([
      {
        id: "v1",
        title: "Frontend",
        location: "Nukus",
        workType: "REMOTE",
        salaryFrom: null,
        salaryTo: null,
        currency: "UZS",
        skills: ["React"],
        company: { id: "c1", name: null, industry: null, hasLogo: false },
      },
    ]);

    const res = await getLandingStats();

    expect(res.loadError).toBe(false);
    expect(res.featuredVacancies).toHaveLength(1);
    expect(res.featuredVacancies[0].companyName).toBeNull();
    expect(res.hiredRate).toBeNull();

    const secondRawCallSql = JSON.stringify(mockDb.$queryRaw.mock.calls[1]);
    expect(secondRawCallSql).toContain("VacancyApplication");
  });

  it("flags loadError=true without fake statistics when database query throws", async () => {
    mockDb.vacancy.count.mockRejectedValue(new Error("DB offline"));

    const res = await getLandingStats();

    expect(res.loadError).toBe(true);
    expect(res.featuredVacancies).toEqual([]);
    expect(res.hiredRate).toBeNull();
    expect(res.activeVacancies).toBe(0);
  });
});
