import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { readBodyLimited } from "@/backend/http/errors";
import { completePayment } from "@/backend/payment/service";

const MAX_WEBHOOK_BYTES = 50_000;

/**
 * Click Webhook handler.
 * Follows standard Click prepare & complete action specifications.
 * https://docs.click.uz/click-api-request/
 */
export async function POST(req: Request) {
  try {
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: -8, error_note: "Click payment is not configured" },
        { status: 503 },
      );
    }

    const raw = await readBodyLimited(req, MAX_WEBHOOK_BYTES);
    const limitedReq = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: new Uint8Array(raw),
    });
    const formData = await limitedReq.formData();
    const clickTransId = formData.get("click_trans_id")?.toString() ?? "";
    const serviceId = formData.get("service_id")?.toString() ?? "";
    const merchantTransId = formData.get("merchant_trans_id")?.toString() ?? "";
    const merchantPrepareId =
      formData.get("merchant_prepare_id")?.toString() ?? "";
    const amount = formData.get("amount")?.toString() ?? "";
    const action = formData.get("action")?.toString() ?? "";
    const signTime = formData.get("sign_time")?.toString() ?? "";
    const signString = formData.get("sign_string")?.toString() ?? "";
    const error = formData.get("error")?.toString();

    if (!merchantTransId || !clickTransId || !signString) {
      return NextResponse.json({
        error: -8,
        error_note: "Missing required Click parameters",
      });
    }

    const expectedServiceId = process.env.CLICK_SERVICE_ID;
    if (expectedServiceId && serviceId !== expectedServiceId) {
      return NextResponse.json({
        error: -8,
        error_note: "Invalid service_id",
      });
    }

    const expectedRaw =
      clickTransId +
      serviceId +
      secretKey +
      merchantTransId +
      (action === "1" ? merchantPrepareId : "") +
      amount +
      action +
      signTime;
    const expectedHash = createHash("md5").update(expectedRaw).digest("hex");

    const a = Buffer.from(expectedHash.toLowerCase());
    const b = Buffer.from(signString.toLowerCase());
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({
        error: -1,
        error_note: "Invalid sign_string",
      });
    }

    if (error && error !== "0") {
      return NextResponse.json({
        error: -1,
        error_note: "Click reported error",
      });
    }

    const payment = await db.payment.findUnique({
      where: { id: merchantTransId },
    });
    if (!payment || payment.provider !== "CLICK") {
      return NextResponse.json({
        error: -5,
        error_note: "Order not found",
      });
    }

    if (Number(amount) !== payment.amount) {
      return NextResponse.json({
        error: -2,
        error_note: "Incorrect parameter amount",
      });
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        error: -4,
        error_note: "Already paid",
      });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({
        error: -9,
        error_note: "Transaction cancelled",
      });
    }

    // Action 0: Prepare
    if (action === "0") {
      return NextResponse.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: merchantTransId,
        error: 0,
        error_note: "Success",
      });
    }

    // Action 1: Complete
    if (action === "1") {
      await completePayment(merchantTransId, clickTransId);
      return NextResponse.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: merchantTransId,
        error: 0,
        error_note: "Success",
      });
    }

    return NextResponse.json({
      error: -3,
      error_note: "Action not found",
    });
  } catch (err) {
    console.error("Click webhook error:", err);
    return NextResponse.json({
      error: -9,
      error_note: "Internal error",
    });
  }
}
