// Seed: admin akkaunt va boshlang'ich sozlamalar.
// Admin email va paroli faqat .env dan olinadi (ADMIN_EMAIL, ADMIN_PASSWORD), kodda yo'q.
// Ishga tushirish: npm run db:seed (Docker'da migrate xizmati avtomatik bajaradi).
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

const adminEmail = z.email().transform((value) => value.trim().toLowerCase());
const adminPassword = z.string().min(12, "kamida 12 belgi bo'lishi kerak");

const DEFAULT_SETTINGS: Record<string, string> = {
  monthlyAiLimitUsd: process.env.AI_MONTHLY_LIMIT_USD ?? "50",
};

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // Mavjud qiymat (admin o'zgartirgan bo'lishi mumkin) ustiga yozilmaydi.
    await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
  console.log(`Sozlamalar: ${Object.keys(DEFAULT_SETTINGS).join(", ")}`);
}

async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "ADMIN_EMAIL va ADMIN_PASSWORD .env da yo'q: admin yaratilmadi.",
    );
    return;
  }

  const parsedEmail = adminEmail.safeParse(process.env.ADMIN_EMAIL);
  if (!parsedEmail.success)
    throw new Error("Admin sozlamasi noto'g'ri: ADMIN_EMAIL email emas");
  const email = parsedEmail.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Parol ataylab qayta yozilmaydi: seed qayta ishga tushganda admin o'zgartirgan parol saqlanib qoladi.
    // Shuning uchun admin yaratilgach ADMIN_PASSWORD ni .env dan o'chirish mumkin.
    if (existing.role !== "ADMIN" || existing.status !== "ACTIVE") {
      await db.user.update({
        where: { email },
        data: { role: "ADMIN", status: "ACTIVE" },
      });
      console.log(`Admin huquqi berildi: ${email}`);
      return;
    }
    console.log(`Admin allaqachon mavjud: ${email}`);
    return;
  }

  const parsedPassword = adminPassword.safeParse(process.env.ADMIN_PASSWORD);
  if (!parsedPassword.success)
    throw new Error(
      `Admin sozlamasi noto'g'ri: ADMIN_PASSWORD ${parsedPassword.error.issues[0]?.message}`,
    );
  const password = parsedPassword.data;

  await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
    },
  });
  console.log(`Admin yaratildi: ${email}`);
}

async function main() {
  await seedSettings();
  await seedAdmin();
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
