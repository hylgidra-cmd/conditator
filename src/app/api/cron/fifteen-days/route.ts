import { NextResponse } from "next/server";
import { runFifteenDaysCron } from "@/backend/cron/service";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
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
