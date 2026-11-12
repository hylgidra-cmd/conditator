import { expect, it } from "vitest";
import { formatDateTime } from "@/backend/format-date";

it("sanani O'zbekiston vaqtida (UTC+5) bir xil ko'rinishda chiqaradi", () => {
  expect(formatDateTime("2026-10-25T20:05:00Z")).toBe("26.10.2026 01:05");
  expect(formatDateTime(new Date("2026-01-03T07:09:00Z"))).toBe(
    "03.01.2026 12:09",
  );
});
