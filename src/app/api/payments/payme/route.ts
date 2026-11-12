import { NextResponse } from "next/server";
import { completePayment } from "@/backend/payment/service";
import { db } from "@/backend/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { method, params, id } = body;

    if (method === "CheckPerformTransaction") {
      const orderId = params?.account?.order_id;
      const payment = await db.payment.findUnique({ where: { id: orderId } });
      if (!payment) {
        return NextResponse.json({
          error: {
            code: -31050,
            message: {
              uz: "Buyurtma topilmadi",
              ru: "Заказ не найден",
              en: "Order not found",
            },
          },
          id,
        });
      }
      return NextResponse.json({
        result: { allow: true },
        id,
      });
    }

    if (method === "PerformTransaction") {
      const orderId = params?.account?.order_id;
      const paymeTransId = params?.id;
      if (orderId) {
        await completePayment(orderId, paymeTransId);
      }
      return NextResponse.json({
        result: {
          transaction: paymeTransId,
          perform_time: Date.now(),
          state: 2,
        },
        id,
      });
    }

    if (method === "CheckTransaction") {
      return NextResponse.json({
        result: {
          create_time: Date.now(),
          perform_time: Date.now(),
          cancel_time: 0,
          transaction: params?.id,
          state: 2,
          reason: null,
        },
        id,
      });
    }

    return NextResponse.json({
      error: { code: -32601, message: "Method not found" },
      id,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({
      error: { code: -32400, message: error?.message || "System error" },
      id: null,
    });
  }
}
