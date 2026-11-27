import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { ApiError, readBodyLimited } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { importSkillTemplatesFromBuffer } from "@/backend/skill-templates/service";

const MAX_IMPORT_BYTES = 8 * 1024 * 1024; // 8 MB

/** POST /api/admin/skill-templates/import — Excel (.xlsx) yoki CSV fayldan ommaviy yuklash. */
export const POST = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  const raw = await readBodyLimited(request, MAX_IMPORT_BYTES + 256 * 1024);
  const limitedReq = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: new Uint8Array(raw),
  });
  const form = await limitedReq.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "VALIDATION");
  }
  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) {
    throw new ApiError(400, "FILE_TOO_LARGE");
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
    throw new ApiError(400, "FILE_TYPE_NOT_ALLOWED");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importSkillTemplatesFromBuffer({
    adminId: admin.id,
    buffer,
    filename: file.name,
  });

  return NextResponse.json({ ok: true, ...result });
});
