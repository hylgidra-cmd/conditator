import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { completePayment } from "@/backend/payment/service";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const returnUrl =
    searchParams.get("returnUrl") || `/${user.locale}/dashboard`;

  if (!paymentId) {
    return NextResponse.redirect(new URL(returnUrl, req.url));
  }

  try {
    await completePayment(paymentId, `TEST-TXN-${Date.now()}`);
  } catch (err) {
    console.error("Test payment completion error:", err);
  }

  const redirectTarget = new URL(returnUrl, req.url);
  redirectTarget.searchParams.set("payment", "success");
  return NextResponse.redirect(redirectTarget);
}
