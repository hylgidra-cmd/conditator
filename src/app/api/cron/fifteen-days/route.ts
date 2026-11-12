import { NextResponse } from "next/server";
import { runFifteenDaysCron } from "@/backend/cron/service";

export async function GET(req: Request) {
  // Can be protected with a CRON_SECRET header if set
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const result = await runFifteenDaysCron();
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error?.message || "CRON_FAILED" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
