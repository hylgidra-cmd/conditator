// Vercel build: baza bo'lsa migratsiya va seed (demo akkauntlar), keyin next build.
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
} else if (!run("npx prisma migrate deploy")) {
  console.warn(
    "OGOHLANTIRISH: migratsiya bajarilmadi (yuqoridagi xatoni ko'ring). Seed o'tkazib yuborildi.",
  );
} else if (!run("npx prisma db seed")) {
  console.warn("OGOHLANTIRISH: seed bajarilmadi (yuqoridagi xatoni ko'ring).");
}

process.exit(run("npx next build") ? 0 : 1);
