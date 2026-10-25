// DEV uchun yuklama sinovi: 100 ta bir vaqtdagi foydalanuvchi (60 talaba, 35 kompaniya, 5 admin).
// Har biri ITERATIONS marta o'z rolining asosiy sahifalarini ochadi. AI chaqirilmaydi
// (kompaniyalarda obuna yo'q → saralash kalit so'z bo'yicha). Ishga tushirish: docs/LOAD-TEST.md.
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SESSIONS = JSON.parse(
  readFileSync(process.argv[2] ?? "load-sessions.json", "utf8"),
);
const ITERATIONS = Number(process.env.ITERATIONS ?? 5);
const LIMIT_MS = Number(process.env.LIMIT_MS ?? 3000);
// Foydalanuvchi sahifalar orasida o'ylaydi (o'rtacha THINK_MS, ±50%). 0 = to'xtovsiz (stress).
const THINK_MS = Number(process.env.THINK_MS ?? 1000);
const think = () =>
  THINK_MS > 0
    ? new Promise((resolve) =>
        setTimeout(resolve, THINK_MS * (0.5 + Math.random())),
      )
    : null;

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error("Faqat lokal server (localhost) ga yuklama beriladi.");
  process.exit(1);
}

const LOCALES = ["kk", "uz", "ru", "en"];
function routes(s, i) {
  const l = LOCALES[i % 4];
  switch (s.role) {
    case "student":
      return [
        ["GET", `/${l}/student/cv`],
        ["GET", `/${l}/student/cv/preview`],
        ["GET", "/api/cv/me"],
      ];
    case "company":
      return [
        ["GET", `/${l}/company/vacancies`],
        ["GET", `/${l}/company/vacancies/${s.vacancyId}/matches`],
        ["GET", `/api/vacancies/${s.vacancyId}/matches?locale=${l}`],
        ["GET", `/${l}/company/vacancies/${s.vacancyId}/candidates/${s.cvId}`],
        ["GET", `/${l}/company`],
      ];
    case "admin":
      return [
        ["GET", `/${l}/admin`],
        ["GET", `/${l}/admin/users`],
        ["GET", `/${l}/admin/users?q=student1&role=STUDENT`],
        ["GET", `/${l}/admin/users?page=40`],
        ["GET", `/${l}/admin/companies?approval=PENDING`],
        ["GET", "/api/admin/users?q=load"],
        ["GET", "/api/admin/stats"],
      ];
  }
}
// Bir martalik og'irroq amallar (har kompaniya 1 marta): saralashni ishga tushirish.
function once(s) {
  return s.role === "company"
    ? [["POST", `/api/vacancies/${s.vacancyId}/match`, { locale: "uz" }]]
    : [];
}

const stats = new Map();
let measuring = false;
async function hit(s, [method, path, body]) {
  const key = `${method} ${path
    .replace(/load_[a-z]+_[\d_]+/g, ":id")
    .replace(/^\/(kk|uz|ru|en)\//, "/:locale/")
    .replace(/locale=\w+/, "locale=:l")}`;
  const started = performance.now();
  let status = 0;
  try {
    const res = await fetch(BASE + path, {
      method,
      redirect: "manual",
      headers: {
        cookie: s.cookie,
        origin: BASE,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    await res.arrayBuffer();
    status = res.status;
  } catch {
    status = -1;
  }
  const ms = performance.now() - started;
  if (!measuring) return;
  const entry = stats.get(key) ?? { times: [], errors: 0, statuses: {} };
  entry.times.push(ms);
  entry.statuses[status] = (entry.statuses[status] ?? 0) + 1;
  if (status < 200 || status >= 400) entry.errors++;
  stats.set(key, entry);
}

// Foydalanuvchilar RAMP_MS davomida birin-ketin kiradi (hammasi bir millisekundda emas).
const RAMP_MS = Number(process.env.RAMP_MS ?? 10_000);
async function user(s, i) {
  await new Promise((resolve) =>
    setTimeout(resolve, (RAMP_MS * i) / SESSIONS.length),
  );
  for (const request of once(s)) await hit(s, request);
  for (let n = 0; n < ITERATIONS; n++)
    for (const request of routes(s, i + n)) {
      await think();
      await hit(s, request);
    }
}

// Isitish: har sahifa bir marta (birinchi kompilyatsiya va ulanishlar o'lchovga kirmaydi).
const warm = new Map(
  SESSIONS.flatMap((s, i) =>
    routes(s, i).map((r) => [`${s.role} ${r[1]}`, [s, r]]),
  ),
);
for (const [s, r] of [...warm.values()].slice(0, 40)) await hit(s, r);
measuring = true;

const pct = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
const started = performance.now();
await Promise.all(SESSIONS.map((s, i) => user(s, i)));
const total = ((performance.now() - started) / 1000).toFixed(1);

let failed = false;
const rows = [...stats.entries()].map(([key, { times, errors, statuses }]) => {
  const sorted = times.sort((a, b) => a - b);
  const p95 = pct(sorted, 95);
  if (p95 > LIMIT_MS || errors > 0) failed = true;
  return {
    key,
    n: times.length,
    p50: pct(sorted, 50),
    p95,
    max: sorted.at(-1),
    errors,
    statuses,
  };
});
const count = [...stats.values()].reduce((sum, e) => sum + e.times.length, 0);
console.log(
  `${SESSIONS.length} foydalanuvchi bir vaqtda, ${ITERATIONS} aylanish, o'ylash ${THINK_MS} ms, kirish ${RAMP_MS / 1000} s, ${count} so'rov, ${total} s (${(count / total).toFixed(0)} so'rov/s)\n`,
);
console.log("| So'rov | soni | p50 ms | p95 ms | max ms | xato | status |");
console.log("| --- | --: | --: | --: | --: | --: | --- |");
for (const r of rows.sort((a, b) => b.p95 - a.p95))
  console.log(
    `| \`${r.key}\` | ${r.n} | ${r.p50.toFixed(0)} | ${r.p95.toFixed(0)} | ${r.max.toFixed(0)} | ${r.errors} | ${Object.entries(
      r.statuses,
    )
      .map(([k, v]) => `${k}×${v}`)
      .join(" ")} |`,
  );
console.log(
  failed
    ? `\nNATIJA: chegara (${LIMIT_MS} ms) oshdi yoki xato bor`
    : `\nNATIJA: hammasi ${LIMIT_MS} ms dan tez, xato yo'q`,
);
process.exit(failed ? 1 : 0);
