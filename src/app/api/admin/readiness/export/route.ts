import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { cvDataSchema } from "@/backend/cv/schema";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  listReadinessCandidates,
  parseFilters,
} from "@/backend/readiness/query";

function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const filters = parseFilters(request.nextUrl.searchParams);
  const listing = await listReadinessCandidates(filters, true);
  if (listing.total > listing.rows.length)
    throw new ApiError(413, "PAYLOAD_TOO_LARGE");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nomzodlar");
  sheet.columns = [
    { header: "Ism", key: "name", width: 28 },
    { header: "Email", key: "email", width: 32 },
    { header: "Kasb", key: "profession", width: 34 },
    { header: "Guruh", key: "group", width: 12 },
    { header: "Tip", key: "type", width: 12 },
    { header: "Tillar", key: "languages", width: 36 },
    { header: "Til toifasi", key: "languageBand", width: 18 },
    { header: "Tajriba", key: "experienceBand", width: 18 },
    { header: "Hudud", key: "region", width: 24 },
    { header: "Tayyorlik bali", key: "score", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const row of listing.rows) {
    const parsed = row.user.cvs[0]
      ? cvDataSchema.safeParse(row.user.cvs[0].data)
      : null;
    const cv = parsed?.success ? parsed.data : null;
    sheet.addRow({
      name: safeCell(cv?.fullName ?? ""),
      email: safeCell(row.user.email),
      profession: safeCell(row.profession.nameUz),
      group: row.personalityGroup,
      type: row.typeCode,
      languages: safeCell(
        row.user.userLanguages
          .map((item) => `${item.language} (${item.level})`)
          .join(", "),
      ),
      languageBand: row.languageBand,
      experienceBand: row.experienceBand,
      region: safeCell(cv?.location ?? ""),
      score: row.readinessScore,
    });
  }
  sheet.autoFilter = { from: "A1", to: "J1" };
  const bytes = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="candidator-readiness.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
});
