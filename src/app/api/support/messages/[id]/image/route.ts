import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { extractSupportImageDataUrl } from "@/backend/chat/support-service";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request);
    const { id } = await params;

    const msg = await db.supportMessage.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        thread: { select: { userId: true } },
      },
    });

    if (!msg) {
      throw new ApiError(404, "NOT_FOUND");
    }

    if (user.role !== "ADMIN" && msg.thread.userId !== user.id) {
      throw new ApiError(403, "FORBIDDEN");
    }

    const dataUrl = extractSupportImageDataUrl(msg.text);
    if (!dataUrl) {
      throw new ApiError(404, "NOT_FOUND");
    }

    const match =
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
        dataUrl,
      );
    if (!match) {
      throw new ApiError(404, "NOT_FOUND");
    }

    const bytes = Buffer.from(match[2], "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": match[1],
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  },
);
