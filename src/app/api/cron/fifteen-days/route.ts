import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runFifteenDaysCron } from "@/backend/cron/service";

function isAuthorizedCron(authHeader: string | null, secret?: string): boolean {
  if (!secret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const actual = Buffer.from(authHeader, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const result = await runFifteenDaysCron();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Fifteen days cron error:", err);
    return NextResponse.json({ error: "CRON_FAILED" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
