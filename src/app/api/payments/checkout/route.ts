import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { PaymentPurpose, PaymentProvider } from "@prisma/client";
import {
  createPaymentOrder,
  getCheckoutRedirect,
} from "@/backend/payment/service";
import { db } from "@/backend/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { purpose, provider, vacancyId, cvId, returnUrl } = body;

    let companyId: string | undefined;
    if (user.role === "COMPANY") {
      const company = await db.company.findUnique({
        where: { userId: user.id },
      });
      companyId = company?.id;
    }

    const payment = await createPaymentOrder({
      userId: user.id,
      purpose: purpose as PaymentPurpose,
      provider: (provider as PaymentProvider) || PaymentProvider.TEST,
      vacancyId,
      cvId,
      companyId,
    });

    const redirectUrl = getCheckoutRedirect(
      payment,
      returnUrl || `/${user.locale}/dashboard`,
    );

    return NextResponse.json({
      paymentId: payment.id,
      redirectUrl,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error?.message || "PAYMENT_CREATION_FAILED" },
      { status: 500 },
    );
  }
}
