import { NextResponse } from "next/server";
import { completePayment } from "@/backend/payment/service";

/**
 * Click Webhook handler.
 * Follows standard Click prepare & complete action specifications.
 * https://docs.click.uz/click-api-request/
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const clickTransId = formData.get("click_trans_id")?.toString();
    const merchantTransId = formData.get("merchant_trans_id")?.toString();
    const action = formData.get("action")?.toString();
    const error = formData.get("error")?.toString();

    if (error && error !== "0") {
      return NextResponse.json({
        error: -1,
        error_note: "Click reported error",
      });
    }

    if (!merchantTransId) {
      return NextResponse.json({
        error: -5,
        error_note: "Missing merchant_trans_id",
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
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({
      error: -9,
      error_note: error?.message || "Internal error",
    });
  }
}
