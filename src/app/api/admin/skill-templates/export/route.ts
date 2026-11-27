import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";
import { exportSkillTemplatesWorkbook } from "@/backend/skill-templates/service";

/** GET /api/admin/skill-templates/export — barcha kasb shablonlarini Excel (.xlsx) faylga yuklash. */
export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const buffer = await exportSkillTemplatesWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="candidator-skill-templates.xlsx"',
      "Cache-Control": "no-store",
    },
  });
});
