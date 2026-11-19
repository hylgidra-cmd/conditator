import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { readBodyLimited } from "@/backend/http/errors";
import { completePayment } from "@/backend/payment/service";

const MAX_WEBHOOK_BYTES = 50_000;

function verifyPaymeAuth(req: Request): boolean {
  const secretKey = process.env.PAYME_SECRET_KEY;
  if (!secretKey) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const expected = `Paycom:${secretKey}`;
  const a = Buffer.from(decoded);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    if (!verifyPaymeAuth(req)) {
      return NextResponse.json(
        {
          error: {
            code: -32504,
            message: {
              uz: "Avtorizatsiya xatosi",
              ru: "Недостаточно привилегий",
              en: "Insufficient privileges",
            },
          },
          id: null,
        },
        { status: 200 },
      );
    }

    const raw = await readBodyLimited(req, MAX_WEBHOOK_BYTES);
    const body = JSON.parse(raw.toString("utf8"));
    const { method, params, id } = body;

    if (method === "CheckPerformTransaction") {
      const orderId = params?.account?.order_id;
      const payment = orderId
        ? await db.payment.findUnique({ where: { id: String(orderId) } })
        : null;
      if (!payment || payment.provider !== "PAYME") {
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
      if (payment.status !== "PENDING") {
        return NextResponse.json({
          error: {
            code: -31008,
            message: {
              uz: "Tranzaksiyani amalga oshirib bo'lmaydi",
              ru: "Невозможно выполнить данную операцию",
              en: "Cannot perform this operation",
            },
          },
          id,
        });
      }
      if (Number(params?.amount) !== payment.amount * 100) {
        return NextResponse.json({
          error: {
            code: -31001,
            message: {
              uz: "Summa noto'g'ri",
              ru: "Неверная сумма",
              en: "Incorrect amount",
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
      const paymeTransId = params?.id ? String(params.id) : undefined;
      if (!orderId) {
        return NextResponse.json({
          error: { code: -31050, message: "Order not found" },
          id,
        });
      }
      const payment = await db.payment.findUnique({
        where: { id: String(orderId) },
      });
      if (!payment || payment.provider !== "PAYME") {
        return NextResponse.json({
          error: { code: -31050, message: "Order not found" },
          id,
        });
      }
      if (
        params?.amount !== undefined &&
        Number(params.amount) !== payment.amount * 100
      ) {
        return NextResponse.json({
          error: { code: -31001, message: "Incorrect amount" },
          id,
        });
      }
      if (payment.status === "COMPLETED") {
        return NextResponse.json({
          result: {
            transaction: payment.externalId ?? paymeTransId,
            perform_time: payment.updatedAt.getTime(),
            state: 2,
          },
          id,
        });
      }
      if (payment.status !== "PENDING") {
        return NextResponse.json({
          error: { code: -31008, message: "Cannot perform operation" },
          id,
        });
      }
      const completed = await completePayment(String(orderId), paymeTransId);
      return NextResponse.json({
        result: {
          transaction: completed.externalId ?? paymeTransId,
          perform_time: completed.updatedAt.getTime(),
          state: 2,
        },
        id,
      });
    }

    if (method === "CheckTransaction") {
      const transId = params?.id ? String(params.id) : "";
      const payment = transId
        ? await db.payment.findFirst({
            where: { externalId: transId, provider: "PAYME" },
          })
        : null;
      if (!payment) {
        return NextResponse.json({
          error: { code: -31003, message: "Transaction not found" },
          id,
        });
      }
      return NextResponse.json({
        result: {
          create_time: payment.createdAt.getTime(),
          perform_time:
            payment.status === "COMPLETED" ? payment.updatedAt.getTime() : 0,
          cancel_time: 0,
          transaction: payment.externalId,
          state: payment.status === "COMPLETED" ? 2 : 1,
          reason: null,
        },
        id,
      });
    }

    return NextResponse.json({
      error: { code: -32601, message: "Method not found" },
      id,
    });
  } catch (err) {
    console.error("Payme webhook error:", err);
    return NextResponse.json({
      error: { code: -32400, message: "System error" },
      id: null,
    });
  }
}
