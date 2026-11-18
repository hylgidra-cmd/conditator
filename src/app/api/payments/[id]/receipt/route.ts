import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request);
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        transactionDetails: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, "NOT_FOUND");
    }

    if (user.role !== "ADMIN" && payment.userId !== user.id) {
      throw new ApiError(403, "FORBIDDEN");
    }

    const details = payment.transactionDetails as {
      receiptDataUrl?: string;
    } | null;
    const dataUrl = details?.receiptDataUrl;
    if (!dataUrl || typeof dataUrl !== "string") {
      throw new ApiError(404, "NOT_FOUND");
    }

    const match =
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
        dataUrl,
      );
    if (!match) {
      throw new ApiError(404, "NOT_FOUND");
    }

    const mime = match[1];
    const bytes = Buffer.from(match[2], "base64");

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  },
);
