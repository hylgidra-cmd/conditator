import { NextResponse } from "next/server";
import { requireApprovedCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const DELETE = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    const { id } = await params;
    const { count } = await db.companyTypeTemplate.deleteMany({
      where: { id, companyId: company.id },
    });
    if (count === 0) throw new ApiError(404, "NOT_FOUND");
    return NextResponse.json({ ok: true });
  },
);
