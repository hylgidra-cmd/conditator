import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireCompany } from "@/lib/company/access";
import {
  LOGO_MAX_BYTES,
  readLogo,
  removeLogo,
  storeLogo,
} from "@/lib/company/logo";
import { publicCompany } from "@/lib/company/profile";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

/** Logo faqat shu endpoint orqali beriladi (fayllar public/ da emas). */
export const GET = route(async (request) => {
  const { company } = await requireCompany(request);
  const logo = company.logoPath ? await readLogo(company.logoPath) : null;
  if (!logo) throw new ApiError(404, "NOT_FOUND");
  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.mime,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-cache",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
});

export const POST = route(async (request) => {
  const { company } = await requireCompany(request);
  rateLimit(`logo:${company.id}`, LIMITS.logoUpload);
  // Multipart sarlavhalari uchun ozgina zaxira bilan.
  if (
    Number(request.headers.get("content-length") ?? 0) >
    LOGO_MAX_BYTES + 10_000
  )
    throw new ApiError(413, "FILE_TOO_LARGE");

  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File) || file.size === 0)
    throw new ApiError(400, "VALIDATION", { logo: "FIELD_REQUIRED" });

  const name = await storeLogo(
    company.id,
    Buffer.from(await file.arrayBuffer()),
  );
  const saved = await db.company.update({
    where: { id: company.id },
    data: { logoPath: name },
  });
  await removeLogo(company.logoPath);
  return NextResponse.json({ company: publicCompany(saved) });
});

export const DELETE = route(async (request) => {
  const { company } = await requireCompany(request);
  const saved = await db.company.update({
    where: { id: company.id },
    data: { logoPath: null },
  });
  await removeLogo(company.logoPath);
  return NextResponse.json({ company: publicCompany(saved) });
});
