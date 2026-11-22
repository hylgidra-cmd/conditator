// Vercel build: baza bo'lsa migratsiya, baza mustahkamlash indekslari va seed, keyin next build.
// Sxema va boshlang'ich test savollari bo'lmasa yangi sahifalar ishlamaydi.
import { spawnSync } from "node:child_process";

function run(command) {
  console.log(`> ${command}`);
  return spawnSync(command, { stdio: "inherit", shell: true }).status === 0;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL yo'q: deploy to'xtatildi.");
  process.exit(1);
} else {
  const migrated = run("npx prisma migrate deploy");
  if (!migrated) {
    console.error("prisma migrate deploy o'tmadi: deploy to'xtatildi.");
    process.exit(1);
  }
  if (!run("node scripts/sync-db-hardening.mjs")) {
    console.warn("OGOHLANTIRISH: sync-db-hardening bajarilmadi.");
  }
  if (!run("npx prisma db seed")) {
    console.error("seed bajarilmadi: deploy to'xtatildi.");
    process.exit(1);
  }
}

process.exit(run("npx next build") ? 0 : 1);
