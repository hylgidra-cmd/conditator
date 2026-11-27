import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { requireApprovedCompany } from "@/backend/company/access";
import { queryCompanyStats } from "@/backend/company/stats";
import { route } from "@/backend/http/route";

const querySchema = z.object({
  region: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  experienceBand: z
    .enum(["NONE", "UNDER_1", "ONE_TO_THREE", "OVER_3"])
    .optional(),
  personalityGroup: z.enum(["NT", "NF", "SJ", "SP"]).optional(),
  locale: z.enum(["uz", "kk", "ru", "en"]).optional(),
});

function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export const GET = route(async (request) => {
  const user = await requireRole(request, "COMPANY", "ADMIN");
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    await requireApprovedCompany(request);
  }
  const params = Object.fromEntries(
    [...request.nextUrl.searchParams].filter(([, v]) => Boolean(v)),
  );
  const parsed = querySchema.parse(params);
  const stats = await queryCompanyStats(
    {
      region: parsed.region,
      language: parsed.language,
      experienceBand: parsed.experienceBand,
      personalityGroup: parsed.personalityGroup,
    },
    parsed.locale ?? user.locale,
    { isAdmin },
  );

  const workbook = new ExcelJS.Workbook();

  const profSheet = workbook.addWorksheet("Kasblar");
  profSheet.columns = [
    { header: "Soha", key: "area", width: 30 },
    { header: "Kasb", key: "profession", width: 36 },
    { header: "Talabalar soni", key: "count", width: 18 },
  ];
  profSheet.getRow(1).font = { bold: true };
  for (const row of stats.professions) {
    profSheet.addRow({
      area: safeCell(row.areaName),
      profession: safeCell(row.professionName),
      count: row.masked ? "5 dan kam" : row.count,
    });
  }

  const skillSheet = workbook.addWorksheet("Konikmalar TOP 30");
  skillSheet.columns = [
    { header: "Ko'nikma", key: "skill", width: 32 },
    { header: "Talabalar soni", key: "count", width: 18 },
  ];
  skillSheet.getRow(1).font = { bold: true };
  for (const row of stats.skills) {
    skillSheet.addRow({
      skill: safeCell(row.skill),
      count: row.masked ? "5 dan kam" : row.count,
    });
  }

  const persSheet = workbook.addWorksheet("Xarakter");
  persSheet.columns = [
    { header: "Xarakter guruhi", key: "group", width: 30 },
    { header: "Tip nomi", key: "type", width: 28 },
    { header: "Talabalar soni", key: "count", width: 18 },
  ];
  persSheet.getRow(1).font = { bold: true };
  for (const row of stats.types) {
    persSheet.addRow({
      group: safeCell(row.groupName),
      type: safeCell(row.typeName),
      count: row.masked ? "5 dan kam" : row.count,
    });
  }

  const bytes = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="candidator-stats.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
});
