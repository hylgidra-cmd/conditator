import { NextResponse } from "next/server";
import { readLogo } from "@/backend/company/logo";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Tasdiqlangan kompaniyalar logosi ommaviy ko'rinishda beriladi. */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (_request, { params }) => {
    const { id } = await params;
  const company = await db.company.findUnique({
    where: { id },
    select: { approval: true, logoPath: true },
  });
  if (!company || company.approval !== "APPROVED" || !company.logoPath) {
    throw new ApiError(404, "NOT_FOUND");
  }
  const logo = await readLogo(company.logoPath);
  if (!logo) {
    throw new ApiError(404, "NOT_FOUND");
  }
  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.mime,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
});
