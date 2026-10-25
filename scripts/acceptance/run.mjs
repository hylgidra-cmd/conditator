// Yakuniy qabul (2.8): asosiy ssenariy brauzerda boshidan oxirigacha. Faqat DEV/sinov uchun.
// Ishga tushirish va talablar: docs/ACCEPTANCE.md.
import { execSync } from "node:child_process";
import fs from "node:fs";
import { chromium } from "playwright-core";

const B = process.env.BASE_URL ?? "http://localhost:3100";
const MP = process.env.MAILPIT_API ?? "http://localhost:8025/api/v1";
const SH = (process.env.OUT_DIR ?? "acceptance-out") + "/";
const MOCK_LOG = process.env.MOCK_LOG ?? "acceptance-out/mock-requests.jsonl";
const DB = process.env.ACCEPT_DB ?? "jumis_accept";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@jumis.test";
const ADMIN_PW = process.env.ADMIN_PASSWORD;
if (!ADMIN_PW)
  throw new Error("ADMIN_PASSWORD kerak (sinov bazasidagi admin paroli)");
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(B))
  throw new Error("Faqat lokal server");
fs.mkdirSync(SH, { recursive: true });
const sql = (q) =>
  execSync(`docker compose exec -T db psql -U jumis -d ${DB} -tA`, { input: q })
    .toString()
    .trim();
const j = (path, body, cookie, method = "POST") =>
  fetch(B + path, {
    method,
    headers: {
      "content-type": "application/json",
      origin: B,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const ok = (cond, msg) => {
  console.log((cond ? "  OK   " : "  FAIL ") + msg);
  if (!cond) process.exitCode = 1;
};
async function lastCode(email) {
  for (let i = 0; i < 20; i++) {
    const list = await (
      await fetch(`${MP}/search?query=to:${encodeURIComponent(email)}`)
    ).json();
    if (list.messages?.length)
      return (
        await (await fetch(`${MP}/message/${list.messages[0].ID}`)).json()
      ).Text.match(/\b(\d{6})\b/)[1];
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("kod kelmadi " + email);
}
async function apiStudent(i, name, skills, langs, location, exp) {
  const email = `talaba${i}@jumis.test`;
  await j("/api/auth/register", {
    email,
    password: "parol-12345",
    role: "STUDENT",
    consent: true,
    locale: "uz",
  });
  const c = (
    await j("/api/auth/verify", { email, code: await lastCode(email) })
  ).headers
    .get("set-cookie")
    .split(";")[0];
  const r = await j(
    "/api/cv/me",
    {
      language: "uz",
      workTypes: [],
      data: {
        fullName: name,
        contact: { email, phone: `+99890${1000000 + i}` },
        goal: null,
        location,
        education: [
          {
            institution: "QDU",
            degree: "Bakalavr",
            field: "Informatika",
            startYear: "2021",
            endYear: null,
          },
        ],
        experience: exp
          ? [
              {
                organization: "Nukus IT",
                position: "Stajyor",
                startDate: "2024",
                endDate: "2025",
                description: null,
              },
            ]
          : [],
        skills,
        languages: langs.map((n) => ({ name: n, level: null })),
        certificates: [],
      },
    },
    c,
    "PUT",
  );
  if (!r.ok) throw new Error("cv " + r.status + (await r.text()));
  await j("/api/cv/me/visibility", { isVisible: true }, c, "PATCH");
  return { email, name };
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const errs = [];
  const newPage = async (w = 1280, h = 900) => {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      acceptDownloads: true,
    });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    p.on(
      "console",
      (m) =>
        m.type() === "error" &&
        errs.push(p.url() + " " + m.text().slice(0, 200)),
    );
    return p;
  };
  const register = async (p, email, roleLabel) => {
    await p.goto(B + "/uz/register");
    await p.fill("input[name=email]", email);
    await p.fill("input[name=password]", "parol-12345");
    await p.getByLabel(roleLabel).check();
    await p.locator("input[name=consent]").check();
    await p.getByRole("button", { name: "Roʻyxatdan oʻtish" }).click();
    await p.waitForURL("**/verify**");
    const html = await p.content();
    const code = await lastCode(email);
    ok(!html.includes(code), "kod sahifada yoʻq, faqat emailda (Mailpit)");
    await p.fill("input[name=code]", code);
    await p.getByRole("button", { name: "Tasdiqlash" }).click();
    await p.waitForURL((u) => !u.pathname.includes("verify"));
  };

  step(
    1,
    "Talaba: roʻyxatdan oʻtish, AI bilan CV yaratish, saqlash, ochiq qilish",
  );
  const sp = await newPage(390, 844); // telefon
  await register(sp, "aziza@jumis.test", "Talaba / ish izlovchi");
  await sp.goto(B + "/uz/student/cv");
  await sp
    .locator("#cv-text")
    .fill(
      "Ismim Aziza Karimova, telefon +998 90 123 45 67, aziza@jumis.test. QDU da informatika 4-kurs. React, TypeScript, Git va CSS bilaman. 2024 yili IT Park da amaliyot oʻtaganman. Ingliz tili B2, rus tili. Nukusda yashayman, frontend dasturchi boʻlmoqchiman.",
    );
  await sp.getByRole("button", { name: "CV yaratish" }).click();
  await sp.getByText("CV tayyor").waitFor({ timeout: 30000 });
  ok(
    (await sp.getByLabel("Koʻnikmalar", { exact: true }).inputValue()).includes(
      "React",
    ),
    "AI koʻnikmalarni toʻldirdi: " +
      (await sp.getByLabel("Koʻnikmalar", { exact: true }).inputValue()),
  );
  await sp.getByLabel("Ism va familiya").fill("Aziza Karimova");
  await sp.getByRole("button", { name: "Saqlash" }).click();
  await sp.getByText("CV saqlandi").waitFor();
  await sp.locator("input[type=checkbox]").last().click();
  await sp.getByText("Ochiq: tasdiqlangan").waitFor();
  await sp.screenshot({ path: SH + "1-student-cv.png", fullPage: true });
  ok(
    sql(
      `SELECT count(*) FROM "Cv" WHERE "savedAt" IS NOT NULL AND "isVisible"`,
    ) === "1",
    "CV bazada saqlangan va ochiq",
  );
  const others = [
    await apiStudent(
      2,
      "Bekzod Aliyev",
      ["React", "TypeScript", "Node.js"],
      ["English"],
      "Nukus",
      true,
    ),
    await apiStudent(
      3,
      "Dilnoza Rahimova",
      ["React", "CSS", "HTML"],
      ["Ingliz tili"],
      "Nukus",
      false,
    ),
    await apiStudent(
      4,
      "Sardor Qodirov",
      ["JavaScript", "React"],
      ["Ingliz tili"],
      "Nókis",
      false,
    ),
    await apiStudent(
      5,
      "Malika Yusupova",
      ["TypeScript", "Git"],
      ["English"],
      "Nukus",
      true,
    ),
    await apiStudent(
      6,
      "Jasur Tursunov",
      ["React", "Git"],
      ["Ingliz tili", "Rus tili"],
      "Nukus",
      false,
    ),
    await apiStudent(
      7,
      "Nilufar Saidova",
      ["Figma", "CSS"],
      ["English"],
      "Nukus",
      false,
    ),
    await apiStudent(
      8,
      "Otabek Ergashev",
      ["React", "TypeScript"],
      ["Rus tili"],
      "Nukus",
      true,
    ), // til mos emas
    await apiStudent(
      9,
      "Kamola Ismoilova",
      ["React", "TypeScript"],
      ["English"],
      "Toshkent",
      true,
    ), // joy mos emas
  ];
  console.log(
    "  + API orqali yana 8 talaba (2 tasi filtrdan oʻtmasligi kerak)",
  );

  step(2, "Kompaniya: roʻyxatdan oʻtish va profil");
  const cp = await newPage();
  await register(cp, "hr@raqamli.test", "Kompaniya / ish beruvchi");
  await cp.goto(B + "/uz/company");
  await cp.getByLabel("Kompaniya nomi").fill("Raqamli Yechimlar");
  await cp.getByLabel("Masʼul shaxs").fill("Gulnora Abdullayeva");
  await cp.getByLabel("Davlat").fill("Oʻzbekiston");
  await cp.getByLabel("Soha").fill("IT");
  await cp.getByLabel("Xodimlar soni").selectOption("11-50");
  await cp.getByRole("button", { name: "Saqlash" }).click();
  await cp.getByText("Profil saqlandi").waitFor();
  ok(
    sql(`SELECT approval FROM "Company"`) === "PENDING",
    "kompaniya tasdiq kutmoqda (PENDING)",
  );

  step(3, "Admin: kompaniyani tasdiqlash va obunani yoqish");
  const ap = await newPage();
  await ap.goto(B + "/uz/login");
  await ap.fill("input[name=email]", ADMIN_EMAIL);
  await ap.fill("input[name=password]", ADMIN_PW);
  await ap.getByRole("button", { name: "Kirish" }).click();
  await ap.waitForURL((u) => !u.pathname.endsWith("/login"));
  await ap.goto(B + "/uz/admin/companies");
  await ap.getByRole("button", { name: "Tasdiqlash" }).click();
  await ap.locator("main li span", { hasText: "Tasdiqlangan" }).waitFor();
  await ap.locator("input[type=date]").fill("2026-12-31");
  await ap.getByRole("button", { name: "Obunani yoqish" }).click();
  await ap.getByText("Obuna faol: 31.12.2026 gacha").waitFor();
  await ap.screenshot({ path: SH + "3-admin-companies.png", fullPage: true });
  ok(
    sql(
      `SELECT approval || ' ' || to_char(("subscriptionUntil" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent','YYYY-MM-DD HH24:MI') FROM "Company"`,
    ) === "APPROVED 2026-12-31 23:59",
    "bazada: APPROVED, obuna 31.12.2026 oxirigacha",
  );
  ok(
    sql(
      `SELECT string_agg(action::text, ',' ORDER BY "createdAt") FROM "AdminLog"`,
    ).includes("COMPANY_APPROVE"),
    "admin harakati logda: " +
      sql(
        `SELECT string_agg(action::text, ',' ORDER BY "createdAt") FROM "AdminLog"`,
      ),
  );

  step(4, "Kompaniya: talab yozish va AI saralash");
  await cp.goto(B + "/uz/company/vacancies");
  await cp.getByRole("link", { name: "Yangi talab" }).click();
  await cp.waitForURL("**/vacancies/new");
  await cp.getByLabel("Lavozim").fill("Frontend dasturchi (React)");
  await cp.getByLabel("Koʻnikmalar").fill("React, TypeScript, Git");
  await cp.getByLabel("Tillar").fill("ingliz");
  await cp.getByLabel("Joylashuv").fill("Nukus");
  await cp
    .locator("#rawText")
    .fill(
      "Nukusdagi ofisimizga React va TypeScript biladigan frontend dasturchi kerak. Ingliz tili texnik hujjatlar uchun.",
    );
  await cp.getByRole("button", { name: "Saqlash" }).click();
  await cp.waitForURL("**/company/vacancies");
  await cp.getByRole("link", { name: "Nomzodlar" }).first().click();
  await cp.waitForURL("**/matches");
  await cp.getByRole("button", { name: "Saralash" }).click();
  await cp
    .getByText("Eng mos nomzodlar (AI bahosi)")
    .waitFor({ timeout: 60000 });
  const items = cp
    .locator("main li")
    .filter({ has: cp.getByRole("link", { name: "CV ni koʻrish" }) });
  const n = await items.count();
  const texts = await items.allInnerTexts();
  console.log(texts.map((t) => "    " + t.replace(/\n+/g, " | ")).join("\n"));
  ok(n >= 5 && n <= 10, `${n} ta saralangan nomzod (5–10)`);
  ok(
    texts.every((t) => /\d+\s*\/\s*100/.test(t)),
    "har birida ball",
  );
  ok(
    texts.every((t) => /Talabdagi koʻnikmalar|Talabdagi ko'nikmalar/.test(t)),
    "har birida AI izohi",
  );
  ok(
    !texts.join(" ").match(/Aziza|Bekzod|Karimova|\+998|@jumis/),
    "roʻyxatda ism, telefon, email yoʻq (anonim)",
  );
  await cp.screenshot({ path: SH + "4-matches.png", fullPage: true });
  const aiCalls = fs.readFileSync(MOCK_LOG, "utf8").trim().split("\n");
  const matchReqs = aiCalls.filter((l) => l.includes("<candidates>"));
  ok(
    matchReqs.length === 1,
    `AI ga ${matchReqs.length} ta saralash soʻrovi (≤ 10 nomzod bitta guruhda)`,
  );
  const sent = aiCalls.join("\n");
  const pii = [
    "Aziza",
    "Karimova",
    "123 45 67",
    "aziza@jumis.test",
    ...others.flatMap((o) => [o.name, o.email]),
  ].filter((x) => sent.includes(x));
  ok(
    pii.length === 0,
    "AI ga ism, telefon, email yuborilmagan" +
      (pii.length ? ": " + pii.join(", ") : ""),
  );
  ok(
    !matchReqs[0].includes("Toshkent") && !matchReqs[0].includes('"Rus tili"]'),
    "filtrdan oʻtmaganlar (joy, til) AI ga yuborilmagan",
  );

  step(5, "Kesh: qayta ochish va «Yangilash» AI ni qayta chaqirmaydi");
  await cp.reload();
  await cp.getByText("Eng mos nomzodlar (AI bahosi)").waitFor();
  const before = fs.readFileSync(MOCK_LOG, "utf8").trim().split("\n").length;
  const refresh = cp.getByRole("button", { name: /Saralash|Yangilash/ });
  if (await refresh.count()) {
    await refresh.first().click();
    await cp.waitForTimeout(2500);
  }
  const after = fs.readFileSync(MOCK_LOG, "utf8").trim().split("\n").length;
  ok(
    after === before,
    `qayta saralashda yangi AI soʻrovi yoʻq (${before} → ${after})`,
  );
  ok(
    sql(`SELECT count(*) FROM "AiLog" WHERE task='MATCH'`) === "1" &&
      sql(`SELECT count(*) FROM "AiLog" WHERE task='CV_GEN'`) === "1",
    "AiLog: 1 CV_GEN, 1 MATCH",
  );

  step(6, "Nomzod CV si, PDF, belgilash");
  await cp.getByRole("link", { name: "CV ni koʻrish" }).first().click();
  await cp.waitForURL("**/candidates/*");
  const cvText = await cp.locator("main").innerText();
  ok(
    /\+998|@jumis\.test/.test(cvText),
    "CV ochilganda aloqa maʼlumoti koʻrinadi",
  );
  const href = await cp
    .getByRole("link", { name: "PDF yuklab olish" })
    .getAttribute("href");
  const pdf = await cp.context().request.get(B + href);
  const body = await pdf.body();
  fs.writeFileSync(SH + "6-candidate.pdf", body);
  ok(
    pdf.status() === 200 &&
      body.subarray(0, 4).toString() === "%PDF" &&
      body.length > 10000,
    `PDF: ${pdf.status()}, ${pdf.headers()["content-type"]}, ${Math.round(body.length / 1024)} KB`,
  );
  await cp.getByRole("button", { name: "Tanlandi" }).click();
  await cp.getByText("Belgini olib tashlash").waitFor();
  await cp.screenshot({ path: SH + "6-candidate.png", fullPage: true });
  await cp.reload();
  ok(
    (await cp
      .getByRole("button", { name: "Tanlandi" })
      .getAttribute("aria-pressed")) === "true",
    "qaror qayta yuklashda saqlangan",
  );
  await cp.goBack().catch(() => {});
  await cp.goto(B + "/uz/company/vacancies");
  const hist = (await cp.locator("main li").first().innerText()).replace(
    /\n+/g,
    " | ",
  );
  ok(hist.includes("Tanlandi: 1"), "talablar tarixida: " + hist);
  ok(
    sql(`SELECT count(*) FROM "CvView"`) >= "1",
    "CV koʻrish logga yozilgan (CvView)",
  );

  step(7, "Talaba kompaniya sahifasiga kira olmaydi");
  const r = await sp.context().request.get(B + "/api/vacancies");
  ok(r.status() === 403, "talaba /api/vacancies → " + r.status());

  ok(
    errs.length === 0,
    "brauzer konsolida xato yoʻq" +
      (errs.length ? ": " + errs.join(" || ") : ""),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
