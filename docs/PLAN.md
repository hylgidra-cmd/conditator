# Jumis AI MVP — Ish rejasi

Holat: **QORALAMA, tasdiq kutilmoqda.** "TASDIQLAYMAN" deyilmaguncha kod yozilmaydi.
Manba: `docs/Jumis-AI-texnik-topshiriq.docx` (17.10.2026).
Sana: 24.10.2026. Papka tuzilmasi Gulgina bergan variantga moslandi.

---

## 0. Qabul qilingan qarorlar (B-savollar bo'yicha tavsiyalarim)

Gulgina "tez yo'l"ni tanladi: qolgan savollarda mening tavsiyalarim olindi. Har birini shu yerda o'zgartirish mumkin.

| #   | Savol                | Qaror                                                                                                                                                                                          | Sabab                                                                                                                                                                                                                 |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stek                 | Next.js 15 (TypeScript, App Router) + PostgreSQL 16 + Prisma + next-intl + Tailwind + zod + argon2 + nodemailer + Docker Compose + Caddy (HTTPS)                                               | Bitta til, bitta loyiha, 2 kunga eng tez yetadi, keng tarqalgan                                                                                                                                                       |
| 2   | LLM                  | Anthropic Claude. CV yaratish: **Claude Haiku 5.5** (`claude-haiku-5-5`). Saralash: **Claude Sonnet 5.5** (`claude-sonnet-5-5`). Modellar `.env` dan o'qiladi, kod o'zgarmasdan almashtiriladi | Taxminiy narx: CV ≈ $0.002, bitta saralash (30 CV) ≈ $0.08–0.15. $50 ga oyiga ~300+ saralash va minglab CV sig'adi. Narxlar Anthropic'ning joriy ro'yxatidan, birinchi haqiqiy so'rovlardan keyin logdan tekshiriladi |
| 3   | PDF                  | HTML shablon → PDF, Chromium (Playwright) orqali. Shrift: **Noto Sans** (loyiha ichida, internetdan yuklanmaydi)                                                                               | Ekrandagi CV va PDF bitta shablondan chiqadi. Noto Sans qoraqalpoq harflarini (Á á, Ǵ ǵ, Í ı, Ń ń, Ó ó, Ú ú) to'liq qo'llaydi                                                                                         |
| 4   | Dizayn               | Dizayn fayllari hozircha yo'q. Toza, oddiy UI (Tailwind) bilan quriladi; maketlar kelganda ranglar va komponentlar almashtiriladi. CV shabloni: bitta oddiy bir ustunli shablon                | 2 kunda dizaynni kutib bo'lmaydi                                                                                                                                                                                      |
| 5   | Obuna                | Obuna **AI saralashni** yoqadi. Obunasiz (yoki muddati o'tgan) tasdiqlangan kompaniya faqat kalit so'z qidiruvidan foydalanadi                                                                 | Sizning taxminingiz, eng sodda va tushunarli                                                                                                                                                                          |
| 6   | Aloqa ma'lumoti      | Saralash ro'yxatida ism va aloqa **ko'rinmaydi** (anonim ID, lavozim, ko'nikmalar, ball). Kompaniya CV ni ochganda va PDF da ism, telefon, email ko'rinadi. Har bir ochish logga yoziladi      | Kompaniya nomzod bilan bog'lana olishi kerak, ammo ro'yxatni ommaviy yig'ish qiyinlashadi                                                                                                                             |
| 7   | SMTP, domen, server  | Dev rejimida xatlar **Mailpit** ga tushadi (Docker ichida). Haqiqiy SMTP, domen va IT Park server kirishi **2-kun ertalabgacha** kerak                                                         | Busiz deploy va HTTPS 2-kunga sig'maydi                                                                                                                                                                               |
| 8   | Qoraqalpoq tarjimasi | Men `messages/kk.json` ni qoralama sifatida yozaman, fayl boshida "tekshirilmagan" belgisi turadi. Tekshiruvchi mutaxassisni Gulgina tayinlaydi                                                | Sifat uchun ona tili egasi tekshirishi shart                                                                                                                                                                          |

### Topshiriqdagi noaniq joylar bo'yicha qarorlar

1. **Ism va AI.** CV formasida ism, telefon, email, joylashuv alohida maydonlar. Erkin matndan telefon, email va forma ismi avtomatik olib tashlanadi (`[REDACTED]`), keyin AI ga yuboriladi. AI javobidagi aloqa maydonlari ishlatilmaydi: ular formadan olinadi.
2. **Filtr maydonlari.** CV ga qo'shiladi: `joylashuv` (shahar/davlat), `ish turi` (to'liq, yarim, masofaviy, amaliyot), `relokatsiyaga tayyor` (ha/yo'q).
3. **Talabaning "kompaniya so'rovlari".** Talaba qaysi kompaniya (nomi, lavozim) uni "tanlandi" deb belgilaganini ko'radi va shu haqda email oladi. Bu topshiriqdagi "yangi so'rov" xabarnomasi.
4. **CV tili.** Bitta talabada bitta CV, bitta tilda (standart: ingliz). Tilni almashtirsa, AI qayta yaratadi va talaba yana saqlaydi.
5. **Erkin matnli talab.** Alohida AI chaqiruvi yo'q. Bazadagi filtr faqat kompaniya to'ldirgan maydonlar (til, joylashuv, ish turi) bo'yicha ishlaydi. `rawText` esa saralash so'roviga talab matni sifatida qo'shiladi, shuning uchun istalgan tilda yozilgan talab ham hisobga olinadi.
6. **30 dan ortiq nomzod.** Filtrdan keyin PostgreSQL to'liq matnli qidiruvi bilan kalit so'z bo'yicha tartiblanadi, eng yaxshi 30 tasi AI ga ketadi.
7. **Yangi CV qo'shilganda.** Hamma talablarni darhol qayta hisoblash qimmat. Shuning uchun natija "eskirgan" deb belgilanadi va kompaniya talab sahifasini ochganda avtomatik qayta hisoblanadi (bitta talab uchun soatiga eng ko'pi 1 marta). "Yangilash" tugmasi doim ishlaydi.
8. **Admin akkaunti.** Ro'yxatdan o'tish orqali emas, `.env` dagi `ADMIN_EMAIL`/`ADMIN_PASSWORD` dan seed skripti yaratadi.

---

## 1. Stek va papka tuzilmasi

- **Ilova:** Next.js 15 (App Router, TypeScript strict). UI sahifalar server komponentlarda, REST API `src/app/api/**/route.ts` da. Ikkalasi ham bitta servis qatlamini (`src/lib/**`) chaqiradi, ruxsat tekshiruvi aynan shu qatlamda.
- **Baza:** PostgreSQL 16 + Prisma (migratsiyalar gitda).
- **i18n:** next-intl, tillar: `kk` (qoraqalpoq, papka tuzilmangiz bo'yicha), `uz`, `ru`, `en`. URL: `/{locale}/...`.
- **Validatsiya:** zod (formalar, API kirishi, AI javobi).
- **Auth:** o'z sessiyamiz: tasodifiy token, httpOnly + Secure + SameSite=Lax cookie, bazada token xeshi saqlanadi. Parollar argon2id.
- **Email:** nodemailer (dev: Mailpit, prod: Gulgina bergan SMTP).
- **PDF:** Playwright Chromium, Noto Sans.
- **Testlar:** Vitest (servis qatlami va AI moduli), muhim ruxsat qoidalari uchun integratsiya testlari (test bazasi bilan).
- **Deploy:** Docker Compose: `app`, `db`, `caddy` (avtomatik HTTPS), `backup` (kunlik `pg_dump`, 14 kun saqlanadi). Dev: `app`, `db`, `mailpit`.

```
jumis-ai/
├─ docs/               topshiriq, design/, PLAN.md, DB-SCHEMA.md
├─ prisma/             schema.prisma, migrations/, seed.ts
├─ messages/           kk.json uz.json ru.json en.json
├─ src/
│  ├─ app/[locale]/    sahifalar: (auth)/, student/, company/, admin/
│  ├─ app/api/         REST endpointlar: auth/, student/, company/, admin/
│  ├─ lib/ai/          provider.ts (interfeys), anthropic.ts (adapter), cv.ts, match.ts, budget.ts
│  │                   + schemas.ts (zod), pii.ts (shaxsiy ma'lumotni tozalash), log.ts, fake.ts (test)
│  ├─ lib/auth/        sessiya, parol, email kodlari, ruxsat tekshiruvi (guards)
│  ├─ lib/pdf/         CV shablon va PDF
│  ├─ lib/email/       SMTP
│  ├─ lib/             db.ts, i18n/, va domen servislari: cv/, company/, vacancy/, admin/
│  └─ components/      UI
├─ public/fonts/       NotoSans-*.ttf
├─ tests/
├─ docker-compose.yml  Dockerfile  .env.example  Caddyfile
└─ CLAUDE.md  PROGRESS.md  README.md
```

---

## 2. Ma'lumotlar bazasi sxemasi

Gulgina bergan jadval asos qilib olindi. Kursiv bilan belgilanganlari men qo'shganlarim (sababi bilan).

| Jadval      | Asosiy maydonlar                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`      | id, email (unique), passwordHash, role (STUDENT / COMPANY / ADMIN), status (ACTIVE / BLOCKED), emailVerifiedAt, locale, consentAt, createdAt                                                                                                |
| `EmailCode` | userId, purpose (VERIFY / RESET), codeHash, expiresAt, attempts, usedAt                                                                                                                                                                     |
| _`Session`_ | _userId, tokenHash (unique), expiresAt, createdAt. Bazadagi sessiya: bloklanganda yoki parol tiklanganda darhol o'chiriladi_                                                                                                                |
| `Cv`        | id, userId (unique), language, sourceText, data (JSONB: ism, aloqa, maqsad, ta'lim, tajriba, ko'nikmalar, tillar, sertifikatlar), isVisible, savedAt, filter maydonlari (skills, languages, location, workType), _missingFields, updatedAt_ |
| `Company`   | userId, nomi, davlat, soha, xodimlar soni, mas'ul shaxs, logoPath, approval (PENDING / APPROVED / REJECTED), subscriptionUntil                                                                                                              |
| `Vacancy`   | companyId, lavozim, rawText, skills, languages, tajriba, joylashuv, ish turi, createdAt                                                                                                                                                     |
| `Match`     | vacancyId, cvId, score (0–100), reason, hash (talab + CV versiyasi), decision (NONE / SELECTED / REJECTED); unique (vacancyId, cvId)                                                                                                        |
| `AiLog`     | task (CV_GEN / MATCH), provider, model, inputTokens, outputTokens, costUsd, ok, userId, createdAt, _durationMs_                                                                                                                             |
| `Setting`   | key, value (masalan, `monthlyAiLimitUsd`)                                                                                                                                                                                                   |

Izohlar:

- **Obuna faol** = `subscriptionUntil > hozir`. Alohida "active" maydoni kerak emas.
- **CV versiyasi** = `Cv.savedAt`. Talaba saqlaganda o'zgaradi, shuning uchun `Match.hash` mos kelmay qoladi va natija eskirgan hisoblanadi.
- **AI ga anonim ID** sifatida `Cv.id` (tasodifiy cuid) yuboriladi. Undan shaxsni aniqlab bo'lmaydi.
- **Talabaning "so'rovlari"** = `Match` da `decision = SELECTED` bo'lgan yozuvlar (kompaniya nomi, lavozim). Alohida jadval kerak emas.
- **"Kompaniyaga ko'rinadi"** = `Cv.isVisible = true AND Cv.savedAt IS NOT NULL AND User.status = ACTIVE`. Bu shart bitta funksiyada va hamma joyda ishlatiladi.
- **Indekslar:** `Cv(isVisible, savedAt)`, `Cv.skills/languages` (GIN), `Cv.location`, `Cv` matni bo'yicha to'liq matnli qidiruv (GIN), `User(role, status)`, `AiLog.createdAt`, `Match(vacancyId, score)`.
- To'liq sxema `docs/DB-SCHEMA.md` da (2.7-qadamda).

---

## 3. REST API (rollar bo'yicha)

Gulgina bergan ro'yxat asos qilib olindi. Kursiv bilan belgilanganlari men qo'shganlarim.

| Rol       | Endpointlar                                                                                                                                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hamma     | `POST /api/auth/register`, `/verify`, `/login`, `/logout`, `/forgot`, `/reset`, _`/resend` (kodni qayta yuborish, 60 soniyada 1 marta)_, _`GET /api/me`_                                                                                                                                                                                                          |
| Talaba    | `POST /api/cv/generate`, `GET/PUT /api/cv/me`, `PATCH /api/cv/me/visibility`, `GET /api/cv/me/pdf`, _`GET /api/cv/me/requests` (meni "tanlandi" degan kompaniyalar; topshiriq 2-bo'limida talab qilingan)_                                                                                                                                                        |
| Kompaniya | `GET/PUT /api/company/me` (logo ham shu yerda), `POST/GET /api/vacancies`, `POST /api/vacancies/:id/match` (yangilash ham shu), `GET /api/vacancies/:id/matches`, `GET /api/cv/:id` (faqat ochiq CV, faqat tasdiqlangan kompaniya), `GET /api/cv/:id/pdf`, `PATCH /api/matches/:id/decision`, `GET /api/vacancies/:id/search?q=` (AI ishlamasa)                   |
| Admin     | `GET /api/admin/users?page=&q=` _(+ `role`, `status`, `approval` filtrlari)_, `PATCH /api/admin/users/:id/block`, `PATCH /api/admin/companies/:id/approve` _(rad etish ham shu: `{approved: false}`)_, `PATCH /api/admin/companies/:id/subscription`, `GET /api/admin/ai-usage`, _`PUT /api/admin/ai-limit` (oylik limitni o'zgartirish)_, `GET /api/admin/stats` |

Har bir endpointda serverda tekshiriladi: sessiya, rol, `status = ACTIVE`, egalik (talaba faqat o'z CV si), kompaniya uchun `approval = APPROVED`. Ro'yxatlar doim server tomonda sahifalanadi (`pageSize ≤ 50`).

---

## 4. AI moduli dizayni

```ts
interface LlmProvider {
  generateJson<T>(req: {
    task: AiTask;
    model: string;
    system: string;
    input: string;
    schema: ZodType<T>;
    maxTokens: number;
  }): Promise<{
    data: T;
    usage: { inputTokens: number; outputTokens: number };
  }>;
}
```

- **Bitta kirish nuqtasi:** `lib/ai` dagi `runAiTask(task, ...)` → (1) oylik limitni tekshiradi, (2) provayderni chaqiradi, (3) javobni zod bilan tekshiradi, noto'g'ri bo'lsa 2 martagacha qayta urinadi, (4) har urinishni `AiLog` ga yozadi (vaqt, vazifa, model, token, narx, muvaffaqiyat), (5) xato bo'lsa `AiUnavailableError` qaytaradi.
- **Adapter:** `lib/ai/anthropic.ts` rasmiy `@anthropic-ai/sdk` orqali, strukturali javob (JSON schema) bilan. Boshqa provayder = yangi adapter fayli + `.env` da `AI_PROVIDER`.
- **Narx:** `lib/ai/budget.ts` da model → $/1M token jadvali, `.env` dan almashtiriladi.
- **Limit (`lib/ai/budget.ts`):** shu oydagi `SUM(costUsd)` ≥ `aiMonthlyLimitUsd` bo'lsa AI chaqirilmaydi. CV yaratishda talabaga "AI vaqtincha mavjud emas, qo'lda to'ldiring" ko'rsatiladi, saralashda avtomatik kalit so'z qidiruviga o'tiladi (xato bermaydi).
- **Shaxsiy ma'lumot (`lib/ai/pii.ts`):** AI ga hech qachon telefon, email, to'liq ism ketmaydi. CV yaratishda matndan regex bilan telefon/email va forma ismi olib tashlanadi. Saralashda faqat `Cv.id` (anonim) + kasbiy maydonlar (lavozim, ko'nikmalar, tajriba yillari, tillar, ta'lim, joylashuv shahri). Unit test bilan tekshiriladi.
- **To'qimaslik:** prompt aniq aytadi: "matnda yo'q bo'lsa `null`/bo'sh qoldir". Bo'sh maydonlar `missingFields` ga tushadi va UI da "to'ldiring" deb belgilanadi.
- **Saralash:** filtr (ko'rinadigan CV, til, joylashuv/masofaviy, ish turi) → kalit so'z bo'yicha top 30 → AI: har biriga `{cvId, score 0–100, reason (1–2 gap)}` → ball bo'yicha top 10 (kamida 5, nomzod yetarli bo'lsa). Javobdagi `cvId` lar yuborilganlar bilan solishtiriladi, begonasi tashlab yuboriladi.
- **Kesh:** `Match.hash` = xesh(talab maydonlari + rawText + `Cv.savedAt`). Saralashda har bir nomzod uchun hash solishtiriladi: barcha nomzodlarda hash bir xil bo'lsa va yangi CV qo'shilmagan bo'lsa, AI chaqirilmaydi va saqlangan natija qaytadi. Aks holda faqat "yangilash" bosilganda yoki sahifa ochilganda qayta hisoblanadi.

---

## 5. Soatma-soat reja

### 1-kun — Talaba qismi (≈10 soat)

| Qadam | Vaqt  | Vazifa                                                                                                                     | Qabul mezoni                                                                                                                     |
| ----- | ----- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.1   | 1 s   | Loyiha skeleti: Next.js, Docker Compose (app, db, mailpit), Prisma, ESLint, Vitest, `.env.example`, CLAUDE.md, PROGRESS.md | `docker compose up` bitta buyruqda ko'tariladi, `localhost:3000` ochiladi, `.env` gitda yo'q                                     |
| 1.2   | 0.5 s | i18n: 4 til, til almashtirgich, 4 ta tarjima fayli                                                                         | `/kk /uz /ru /en` ishlaydi; kodda qo'lda yozilgan UI matni yo'q                                                                  |
| 1.3   | 0.5 s | To'liq baza sxemasi, migratsiya, admin seed                                                                                | `prisma migrate` toza bazada ishlaydi, admin kira oladi                                                                          |
| 1.4   | 2 s   | Auth: ro'yxat (rol + rozilik), email kod, kirish, chiqish, parol tiklash, rate limit                                       | Kod faqat Mailpit da; API javobi va logda yo'q; 5 xato urinishdan keyin kod bekor; muddati o'tgan kod ishlamaydi; testlar o'tadi |
| 1.5   | 1.5 s | AI moduli: interfeys, Anthropic adapter, fake provayder, zod, qayta urinish, AiLog, limit                                  | Unit testlar: noto'g'ri JSON → qayta urinish; limit → AI chaqirilmaydi; har chaqiruv logda                                       |
| 1.6   | 1.5 s | "AI bilan CV yaratish" oynasi + endpoint, PII tozalash                                                                     | Matn → maydonlar to'ldiriladi; yo'q ma'lumot bo'sh va "to'ldiring" bilan; testda prompt ichida telefon/email yo'q                |
| 1.7   | 1 s   | CV tahriri, saqlash, ochiq/yashirin                                                                                        | Saqlanmagan CV kompaniyaga ko'rinmaydi; boshqa talaba CV siga so'rov → 403 (test)                                                |
| 1.8   | 1.5 s | CV shabloni (ekran) + PDF                                                                                                  | PDF qoraqalpoq harflarini to'g'ri chiqaradi ("Ǵárezsizlik, Nókis, ı, ń"); CV ingliz tilida chiqadi                               |
| 1.9   | 0.5 s | Tekshiruv: xavfsizlik ko'rigi, kod ko'rigi, to'liq ssenariy                                                                | **1-bosqich qabul:** talaba ro'yxatdan o'tadi, matn yozadi, shablondagi CV ni oladi va PDF yuklaydi                              |

### 2-kun — Kompaniya qismi, admin, deploy (≈10 soat)

| Qadam | Vaqt  | Vazifa                                                                                             | Qabul mezoni                                                                                                                      |
| ----- | ----- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 2.1   | 1 s   | Kompaniya profili, logo, "tasdiq kutilmoqda" holati                                                | Tasdiqlanmagan kompaniya CV lar endpointiga → 403 (test)                                                                          |
| 2.2   | 1 s   | Admin: foydalanuvchilar (server sahifalash, qidiruv, filtr), bloklash, kompaniya tasdiqlash, obuna | Brauzerga faqat bir sahifa keladi; bloklangan foydalanuvchi sessiyasi o'chadi                                                     |
| 2.3   | 1 s   | Talab yaratish (forma + erkin matn), talablar tarixi                                               | Talab maydonlar bilan ham, faqat erkin matn bilan ham (istalgan 4 tilda) saqlanadi; tarix sahifalangan                            |
| 2.4   | 2 s   | Saralash: filtr, kalit so'z bo'yicha top 30, AI ball, kesh, eskirish, kalit so'z zaxira yo'li      | Bir xil talab ikki marta → AI 1 marta chaqiriladi (logda); limit tugasa → kalit so'z natijasi, xatosiz; AI ga PII ketmaydi (test) |
| 2.5   | 1 s   | Natijalar sahifasi, nomzod CV si va PDF, "tanlandi / mos emas", talabaga so'rov va email           | Kompaniya 5–10 ta nomzodni ball va izoh bilan ko'radi; talaba "So'rovlar" bo'limida ko'radi                                       |
| 2.6   | 0.5 s | Admin: AI xarajati (oylik), limit, statistika                                                      | Logdagi summa admin sahifasidagi bilan bir xil                                                                                    |
| 2.7   | 2 s   | Deploy: IT Park server, prod compose, Caddy HTTPS, domen, kunlik backup, README, docs/DB-SCHEMA.md | Sayt asosiy domenda HTTPS bilan ochiladi; backup fayli yaratiladi va qayta tiklash sinab ko'riladi                                |
| 2.8   | 0.5 s | Yakuniy tekshiruv: 1000 ta demo CV bilan tezlik, xavfsizlik ko'rigi, to'liq ssenariy               | **2-bosqich qabul:** kompaniya talab yozib, 5–10 ta saralangan nomzodni ko'radi; sahifalar < 3 s                                  |

Har qadam oxirida: tekshirish (testlar + qo'lda ishga tushirish), PROGRESS.md va CLAUDE.md yangilanadi, alohida git commit.

---

## 6. Xavflar va nimani qisqartiramiz

| Xavf                                               | Ta'sir                      | Choramiz                                                                                                          |
| -------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Server, domen, SMTP kirishi kechikadi              | 2-bosqich deployi kechikadi | 2-kun ertalabgacha kerak. Bo'lmasa, sayt Docker bilan tayyor topshiriladi, deploy kirish kelgan kuni              |
| Dizayn maketlari yo'q                              | UI keyin qayta bo'yaladi    | Oddiy toza UI; maket kelganda alohida qadam (MVP narxiga kirmaydi, kelishish kerak)                               |
| Qoraqalpoq tarjimasi tekshirilmagan                | Noto'g'ri matn              | Qoralama + mutaxassis tekshiruvi                                                                                  |
| 2 kun juda zich                                    | Sifat pasayadi              | Quyidagi qisqartirishlar                                                                                          |
| Ma'lumot chet elga (AI API) ketadi                 | Shaxsiy ma'lumot qonuni     | AI ga faqat anonim kasbiy ma'lumot ketadi; baza O'zbekistondagi serverda. Yurist bilan tasdiqlash tavsiya etiladi |
| Chromium Docker obrazini kattalashtiradi (~400 MB) | Deploy sekinroq             | Qabul qilinadi; muammo bo'lsa keyin yengilroq PDF kutubxonasiga o'tamiz                                           |
| AI narxi taxminiy                                  | Byudjetdan oshish           | Oylik limit + adminda kunlik ko'rsatkich                                                                          |

**Agar vaqt yetmasa, birinchi navbatda qisqartiriladi:**

1. Kompaniya logosi (keyinroq).
2. Talabaga "tanlandingiz" emaili (ekrandagi "So'rovlar" bo'limi qoladi).
3. Statistika faqat 4 ta raqam, grafiklar yo'q.
4. Talabni tahrirlash yo'q (yangi talab yaratiladi).
5. Testlar faqat muhim qoidalar uchun: auth, ruxsatlar, PII, AI kesh va limit.

**MVP ga kirmaydi (qo'shilmaydi):** kurslar, testlar, to'lov, Telegram bot, SMS, mobil ilova, community, kengaytirilgan statistika va topshiriqning 3.6-bo'limidagi hamma narsa.

---

## 7. Ochiq savollar (tasdiqdan oldin javob kerak)

1. **GitHub repo:** qaysi repoga yozamiz? (Gulgina hisobida yaratiladi, men faqat ruxsat olaman.)
2. **Anthropic API kaliti:** Gulgina nomida ochilgan akkauntdan kalit 1.5-qadamgacha kerak (`.env` ga o'zingiz qo'yasiz yoki xavfsiz yo'l bilan berasiz).
3. **Server, domen, SMTP:** 2-kun ertalabgacha.
4. Yuqoridagi 0-bo'limdagi 8 ta qaror va 8 ta noaniqlik bo'yicha qarorlarga roziligingiz.
