import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCvCount, mockAppCount, mockCompanyFindFirst, mockVacancyCount, mockConvCount } =
  vi.hoisted(() => ({
    mockCvCount: vi.fn(),
    mockAppCount: vi.fn(),
    mockCompanyFindFirst: vi.fn(),
    mockVacancyCount: vi.fn(),
    mockConvCount: vi.fn(),
  }));

vi.mock("@/backend/db", () => ({
  db: {
    cv: { count: mockCvCount },
    vacancyApplication: { count: mockAppCount },
    company: { findFirst: mockCompanyFindFirst },
    vacancy: { count: mockVacancyCount },
    conversation: { count: mockConvCount },
  },
}));

import { getHowItWorksUserProgress } from "../src/backend/how-it-works-state";

describe("getHowItWorksUserProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zeroed progress for unauthenticated guests without touching DB", async () => {
    const res = await getHowItWorksUserProgress();
    expect(res).toEqual({
      studentHasCv: false,
      studentApplicationCount: 0,
      companyVacancyCount: 0,
      companyActiveChatCount: 0,
    });
    expect(mockCvCount).not.toHaveBeenCalled();
  });

  it("resolves saved CV and application counts for STUDENT users", async () => {
    mockCvCount.mockResolvedValueOnce(1);
    mockAppCount.mockResolvedValueOnce(3);

    const res = await getHowItWorksUserProgress("stu_1", "STUDENT");
    expect(res.studentHasCv).toBe(true);
    expect(res.studentApplicationCount).toBe(3);
  });

  it("resolves active vacancy and chat counts for COMPANY users", async () => {
    mockCompanyFindFirst.mockResolvedValueOnce({ id: "comp_1" });
    mockVacancyCount.mockResolvedValueOnce(2);
    mockConvCount.mockResolvedValueOnce(4);

    const res = await getHowItWorksUserProgress("usr_comp", "COMPANY");
    expect(res.companyVacancyCount).toBe(2);
    expect(res.companyActiveChatCount).toBe(4);
  });

  it("falls back safely to empty progress on DB error", async () => {
    mockCvCount.mockRejectedValueOnce(new Error("connection lost"));
    mockAppCount.mockRejectedValueOnce(new Error("connection lost"));

    const res = await getHowItWorksUserProgress("stu_1", "STUDENT");
    expect(res.studentHasCv).toBe(false);
    expect(res.studentApplicationCount).toBe(0);
  });
});
