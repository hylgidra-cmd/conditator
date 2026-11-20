// Vercel build: baza bo'lsa migratsiya, baza mustahkamlash indekslari va seed, keyin next build.
// Baza yo'q yoki ulanib bo'lmasa ham build to'xtamaydi: ogohlantirish yoziladi, sayt baribir chiqadi.
import { spawnSync } from "node:child_process";

function run(command) {
  console.log(`> ${command}`);
  return spawnSync(command, { stdio: "inherit", shell: true }).status === 0;
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "OGOHLANTIRISH: DATABASE_URL yo'q, migratsiya va seed o'tkazib yuborildi. Vercel → Settings → Environment Variables ga qo'shing.",
  );
} else {
  const migrated = run("npx prisma migrate deploy");
  if (!migrated) {
    console.warn(
      "OGOHLANTIRISH: prisma migrate deploy o'tmadi — xavfsiz sxema sinxronlash (sync-db-hardening) ishga tushiriladi.",
    );
  }
  if (!run("node scripts/sync-db-hardening.mjs")) {
    console.warn("OGOHLANTIRISH: sync-db-hardening bajarilmadi.");
  }
  if (migrated && !run("npx prisma db seed")) {
    console.warn("OGOHLANTIRISH: seed bajarilmadi (yuqoridagi xatoni ko'ring).");
  }
}

process.exit(run("npx next build") ? 0 : 1);
