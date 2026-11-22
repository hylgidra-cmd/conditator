import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const [areas, counts] = await Promise.all([
    db.profession.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sort: "asc" } },
      },
      orderBy: { sort: "asc" },
    }),
    db.readinessProfile.groupBy({
      by: ["professionId", "personalityGroup", "typeCode"],
      _count: { _all: true },
    }),
  ]);
  return NextResponse.json({
    areas: areas.map((area) => ({
      id: area.id,
      name: area.nameUz,
      children: area.children.map((profession) => {
        const rows = counts.filter(
          (count) => count.professionId === profession.id,
        );
        return {
          id: profession.id,
          name: profession.nameUz,
          count: rows.reduce((sum, row) => sum + row._count._all, 0),
          groups: Object.fromEntries(
            ["NT", "NF", "SJ", "SP"].map((group) => [
              group,
              rows
                .filter((row) => row.personalityGroup === group)
                .reduce((sum, row) => sum + row._count._all, 0),
            ]),
          ),
          types: Object.fromEntries(
            rows.map((row) => [row.typeCode, row._count._all]),
          ),
        };
      }),
    })),
  });
});
