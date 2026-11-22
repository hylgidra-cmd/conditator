// One-time owner operation. Reads the new password from stdin, never logs it.
// Usage: NEW_ADMIN_EMAIL=... npx tsx scripts/update-admin-login.ts inspect|update [env-directory]
import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline";
import { hashPassword } from "../src/backend/auth/password";
import { db } from "../src/backend/db";

async function main() {
  const mode = process.argv[2];
  loadEnvConfig(process.argv[3] || process.cwd());
  const targetEmail = process.env.NEW_ADMIN_EMAIL?.trim().toLowerCase();
  if (!targetEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail))
    throw new Error("NEW_ADMIN_EMAIL talab qilinadi");
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, status: true },
  });
  const target = await db.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, role: true, status: true },
  });
  if (mode === "inspect") {
    console.log(
      JSON.stringify({
        admins: admins.map((admin) => ({
          email: admin.email,
          status: admin.status,
        })),
        targetExists: Boolean(target),
        targetRole: target?.role ?? null,
      }),
    );
    return;
  }
  if (mode !== "update") throw new Error("inspect yoki update rejimi kerak");
  if (target && target.role !== "ADMIN")
    throw new Error("Yangi email boshqa rolga tegishli");
  const source =
    target?.role === "ADMIN"
      ? admins.find((admin) => admin.id === target.id)
      : admins.length === 1
        ? admins[0]
        : admins.find(
            (admin) =>
              admin.email === process.env.OLD_ADMIN_EMAIL?.trim().toLowerCase(),
          );
  if (!source) throw new Error("Qaysi admin o'zgartirilishi aniq emas");
  if (target && target.id !== source.id)
    throw new Error("Yangi email boshqa akkauntda band");
  let password = "";
  const reader = createInterface({ input: process.stdin, terminal: false });
  for await (const line of reader) {
    password = line;
    break;
  }
  reader.close();
  if (password.length < 8 || password.length > 128)
    throw new Error("Parol uzunligi 8–128 belgi bo'lishi kerak");
  const passwordHash = await hashPassword(password);
  password = "";
  await db.$transaction([
    db.user.update({
      where: { id: source.id },
      data: {
        email: targetEmail,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    }),
    db.session.deleteMany({ where: { userId: source.id } }),
  ]);
  console.log("Admin login va paroli yangilandi; eski sessiyalar tugatildi.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Xatolik");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
