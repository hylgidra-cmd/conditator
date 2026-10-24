import { execSync } from "node:child_process";

// Test bazasini yaratadi (yo'q bo'lsa) va migratsiyalarni qo'llaydi.
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://jumis:jumis@localhost:5432/jumis_test?schema=public";
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });
  } catch (error) {
    const output = (error as { stdout?: Buffer }).stdout?.toString() ?? "";
    throw new Error(
      `Test bazasini tayyorlab bo'lmadi. Baza ishlayaptimi? (docker compose up -d db)\n${output}`,
    );
  }
}
