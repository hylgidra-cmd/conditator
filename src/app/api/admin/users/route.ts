import { NextResponse } from "next/server";
import { listUsers } from "@/backend/admin/service";
import { fromSearchParams, userListSchema } from "@/backend/admin/schema";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";

/** Foydalanuvchilar ro'yxati: faqat bitta sahifa (20 ta), qidiruv va filtr serverda. */
export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const query = userListSchema.parse(
    fromSearchParams(request.nextUrl.searchParams),
  );
  return NextResponse.json(await listUsers(query));
});
