import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  wantedTypes: z.array(z.string().regex(/^[IE][NS][TF][JP]$/)).max(16).default([]),
  wantedGroups: z.array(z.enum(["NT", "NF", "SJ", "SP"])).max(4).default([]),
});

export const GET = route(async (request) => {
  const { company } = await requireApprovedCompany(request);
  const templates = await db.companyTypeTemplate.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ templates });
});

export const POST = route(async (request) => {
  const { company } = await requireApprovedCompany(request);
  const input = await parseJson(request, createSchema);
  const template = await db.companyTypeTemplate.create({
    data: {
      companyId: company.id,
      name: input.name,
      wantedTypes: [...new Set(input.wantedTypes)],
      wantedGroups: [...new Set(input.wantedGroups)],
    },
  });
  return NextResponse.json({ template }, { status: 201 });
});
