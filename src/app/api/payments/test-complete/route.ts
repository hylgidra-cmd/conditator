import { PaymentProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { completePayment } from "@/backend/payment/service";

function safeReturnPath(
  raw: string | null,
  reqUrl: string,
  fallback: string,
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  try {
    const base = new URL(reqUrl);
    const resolved = new URL(raw, base);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return fallback;
  }
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "TEST_PAYMENTS_DISABLED" },
      { status: 403 },
    );
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const returnPath = safeReturnPath(
    searchParams.get("returnUrl"),
    req.url,
    `/${user.locale}/dashboard`,
  );

  if (!paymentId) {
    return NextResponse.redirect(new URL(returnPath, req.url));
  }

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (
    !payment ||
    payment.userId !== user.id ||
    payment.provider !== PaymentProvider.TEST
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    await completePayment(paymentId, `TEST-TXN-${Date.now()}`);
  } catch (err) {
    console.error("Test payment completion error:", err);
  }

  const redirectTarget = new URL(returnPath, req.url);
  redirectTarget.searchParams.set("payment", "success");
  return NextResponse.redirect(redirectTarget);
}
