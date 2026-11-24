import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    vacancy: { findFirst: vi.fn() },
    savedVacancy: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/backend/db", () => ({
  db: mockDb,
}));

vi.mock("@/backend/http/errors", () => ({
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

import {
  listSavedVacancyIds,
  removeVacancyBookmark,
  saveVacancyBookmark,
} from "../src/backend/vacancy/bookmarks";

describe("vacancy bookmarks service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects bookmarking missing or inactive vacancies with 404", async () => {
    mockDb.vacancy.findFirst.mockResolvedValue(null);
    await expect(saveVacancyBookmark("u1", "v_missing")).rejects.toThrow();
    expect(mockDb.savedVacancy.upsert).not.toHaveBeenCalled();
  });

  it("saves published vacancies idempotently via upsert", async () => {
    mockDb.vacancy.findFirst.mockResolvedValue({ id: "v1" });
    mockDb.savedVacancy.upsert.mockResolvedValue({ id: "sb1" });

    const out = await saveVacancyBookmark("u1", "v1");
    expect(out).toEqual({ saved: true });
    expect(mockDb.savedVacancy.upsert).toHaveBeenCalledTimes(1);
  });

  it("removes bookmarks and lists user saved IDs cleanly", async () => {
    mockDb.savedVacancy.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.savedVacancy.findMany.mockResolvedValue([
      { vacancyId: "v2" },
      { vacancyId: "v1" },
    ]);

    expect(await removeVacancyBookmark("u1", "v1")).toEqual({ saved: false });
    expect(await listSavedVacancyIds("u1")).toEqual(["v2", "v1"]);
  });
});
