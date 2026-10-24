# Jumis AI — loyiha qo'llanmasi (Claude va dasturchilar uchun)

Yangi sessiyada avval shu faylni va `PROGRESS.md` ni o'qing. Reja: `docs/PLAN.md`. Topshiriq: `docs/Jumis-AI-texnik-topshiriq.docx`.

## Loyiha

B2B AI platforma: talaba erkin matndan CV oladi, kompaniya talab yozadi va AI bazadagi CV lardan 5–10 ta eng mos nomzodni ball (0–100) va izoh bilan saralaydi. Rollar: talaba, kompaniya, admin. 4 til: qoraqalpoq (`kk`), o'zbek (`uz`), rus (`ru`), ingliz (`en`).

## Stek

- Next.js 15 (App Router, TypeScript strict), React 19, Tailwind CSS 4
- PostgreSQL 16 + Prisma 6
- next-intl 4 (yo'llar `/{locale}/...`, tarjimalar `messages/*.json`)
- zod 4 (formalar, API kirishi, AI javobi)
- ESLint 9 + Prettier 3
- Docker Compose (dev: app + postgres + Mailpit; `migrate` xizmati migratsiya va seed ni bajaradi)
- argon2 (`@node-rs/argon2`), tsx (seed), nodemailer (SMTP), Vitest (testlar)
- `@anthropic-ai/sdk` (Claude, strukturali JSON javob)
- Keyingi qadamlarda: Playwright (PDF), Vitest

## Buyruqlar

| Vazifa                       | Buyruq                                                                |
| ---------------------------- | --------------------------------------------------------------------- |
| Hammasini ko'tarish (Docker) | `cp .env.example .env` (bir marta), keyin `docker compose up --build` |
| Faqat baza va Mailpit        | `docker compose up -d db mailpit`                                     |
| Dev server (kompyuterda)     | `npm install`, keyin `npm run dev`                                    |
| Barcha tekshiruvlar          | `npm run check` (typecheck + lint + i18n + format)                    |
| Tarjima kalitlari tekshiruvi | `npm run check:i18n`                                                  |
| Formatlash                   | `npm run format`                                                      |
| Prisma client                | `npm run db:generate`                                                 |
| Migratsiya (dev)             | `npm run db:migrate` (1.3-qadamdan)                                   |
| Testlar                      | (1.4-qadamdan, Vitest)                                                |

Manzillar: ilova http://localhost:3000, Mailpit http://localhost:8025, sog'liq tekshiruvi http://localhost:3000/api/health.

## Papka tuzilmasi

```
docs/                  topshiriq, design/, PLAN.md, DB-SCHEMA.md
prisma/                schema.prisma, migrations/, seed.ts
messages/              kk.json uz.json ru.json en.json
scripts/               check-messages.mjs
src/
  app/[locale]/        sahifalar: auth, student, company, admin
  app/[locale]/(auth)/ register, verify, login, forgot, reset
  app/[locale]/account vaqtinchalik kabinet
  app/api/             REST: auth/{register,verify,resend,login,logout,forgot,reset}, me, cv/generate, health
  i18n/                routing.ts, navigation.ts, request.ts
  lib/db.ts            Prisma client
  lib/ai/              provider.ts (interfeys + tanlash), anthropic.ts (adapter), fake.ts (testlar),
                       run.ts (limit → chaqiruv → zod → qayta urinish → AiLog), budget.ts (narx, oylik limit),
                       log.ts, pii.ts (shaxsiy ma'lumotni olib tashlash), cv.ts (matndan CV), match.ts (2-kun)
  lib/cv/schema.ts     CV zod sxemalari (AI qoralamasi va to'liq CV), missingFields
  lib/auth/            password, session (requireRole), current-user, email-code, rate-limit, schemas, service
  lib/http/            route() o'rami, ApiError va xato kodlari, Origin (CSRF) tekshiruvi
  lib/client/api.ts    brauzerdan API ga so'rov
  lib/pdf/             CV shablon va PDF (1.8)
  lib/email/           mailer.ts (SMTP), auth-emails.ts (4 tilli xatlar)
  components/          UI (auth/ formalar, ui/form.tsx)
tests/                 Vitest integratsiya testlari
  middleware.ts        til yo'naltirish
```

## Qat'iy qoidalar

1. **UI matnlari faqat `messages/*.json` da.** JSX ichida qo'lda matn yozilsa ESLint (`react/jsx-no-literals`) xato beradi. Yangi kalit 4 ta faylga ham qo'shiladi, `npm run check:i18n` o'tishi shart. Kalitlar `messages/uz.json` asosida tiplanadi (`src/global.d.ts`).
2. **Tarjimalar qoralama:** har faylda `_meta.status = "TODO-review"`. Mutaxassis tekshirgach `reviewed` qilinadi. Qoraqalpoq: lotin yozuvi (Á á, Ǵ ǵ, Í ı, Ń ń, Ó ó, Ú ú).
3. **`kk` = qoraqalpoq** (kelishuv bo'yicha; ISO da `kk` qozoq). Shuning uchun brauzer tilini avtomatik aniqlash o'chirilgan.
4. **Tasdiqlash kodi** faqat emailga ketadi: ekranda, API javobida, logda hech qachon ko'rinmaydi. Bazada xeshlangan, muddati va urinishlar soni cheklangan.
5. **Parollar** argon2id bilan xeshlanadi. Hamma narsa HTTPS orqali (prod).
6. **Sirlar** faqat `.env` da (gitda yo'q). Yangi o'zgaruvchi `.env.example` ga ham qo'shiladi.
7. **Ruxsat har endpointda serverda tekshiriladi** (`src/lib/**` servis qatlamida). Frontendga ishonilmaydi.
8. **Ro'yxatlar server tomonda sahifalanadi** (`pageSize ≤ 50`), brauzerga to'liq yuklanmaydi.
9. **Ko'rinish:** talaba boshqa talaba CV sini ko'rmaydi. Kompaniya faqat ochiq va saqlangan CV larni, faqat admin tasdiqlagandan keyin ko'radi.
10. **AI:** telefon, email, to'liq ism AI ga yuborilmaydi (saralashda faqat anonim `Cv.id` va kasbiy ma'lumot). AI to'qimaydi: yo'q maydon bo'sh qoladi. Javob qat'iy JSON, zod bilan tekshiriladi, 2 martagacha qayta urinish. Provayder faqat `src/lib/ai/provider.ts` interfeysi orqali. Har so'rov `AiLog` ga. Oylik limitga yetsa AI to'xtaydi va kalit so'z qidiruviga o'tiladi.
11. **Saralash natijasi saqlanadi:** bir xil talab va CV lar uchun AI qayta chaqirilmaydi.
12. **MVP dan tashqari narsa qo'shilmaydi:** kurslar, testlar, to'lov, Telegram bot, SMS, mobil ilova, community, kengaytirilgan statistika.
13. **Baza:** sxema o'zgarsa yangi migratsiya (`npm run db:migrate`) va `docs/DB-SCHEMA.md` yangilanadi. Mavjud migratsiya fayllari tahrirlanmaydi.
14. Har qadam oxirida: `npm run check`, ishga tushirib tekshirish, `PROGRESS.md` va shu faylni yangilash, alohida commit.

## Auth qanday ishlaydi

- Sessiya: tasodifiy token `jumis_session` cookie da (httpOnly, SameSite=Lax, prod da Secure, 7 kun); bazada faqat SHA-256 xeshi. Bloklangan foydalanuvchining sessiyasi ishlamaydi.
- Har bir himoyalangan API: `const user = await requireRole(request, "COMPANY")` (sessiyasiz 401, rol mos emas 403). Handler `route()` bilan o'raladi: xatolar `{ error: "KOD", fields? }` ko'rinishida, o'zgartiruvchi so'rovlarda Origin tekshiriladi.
- Email kodlari: 6 xonali, HMAC-SHA256 (`AUTH_SECRET`) xeshi, 10 daqiqa, 5 noto'g'ri urinishdan keyin bloklanadi, qayta yuborish 60 soniyada 1 marta. Kod faqat emailga ketadi.
- Rate limit xotirada (`lib/auth/rate-limit.ts`): bitta ilova nusxasi uchun. Bir nechta nusxaga o'tilsa, Redis/bazaga ko'chirish kerak.
- Xato kodlari ro'yxati: `src/lib/http/errors.ts` + `messages/*.json` → `Errors`. Yangi kod qo'shilsa, 4 tilga tarjima ham qo'shiladi.
- Kirgan foydalanuvchi auth sahifalaridan `/account` ga yo'naltiriladi.

## AI qanday ishlaydi

- Barcha chaqiruvlar `runJsonTask()` (`lib/ai/run.ts`) orqali: oylik limit (`Setting.monthlyAiLimitUsd`, shu oy UTC bo'yicha `AiLog.costUsd` yig'indisi) → provayder → zod tekshiruvi → noto'g'ri javobda 2 martagacha qayta urinish. Har urinish `AiLog` ga yoziladi.
- Provayder `AI_PROVIDER` (.env) bo'yicha tanlanadi. Yangi provayder: `AiProvider` ni bajaradigan adapter fayli + `provider.ts` dagi `switch` ga bitta qator + .env. Modellar: `AI_MODEL_CV`, `AI_MODEL_MATCH`. Narxlar: `budget.ts` (noma'lum model qimmat hisoblanadi).
- Shaxsiy ma'lumot: `redactPii()` telefon, email, messenjer manzili va formadagi ismni AI ga yuborishdan oldin olib tashlaydi. CV dagi ism va aloqa AI dan emas, forma va akkauntdan olinadi.
- Talaba matni `<student_text>` teglari ichida ma'lumot sifatida beriladi; system prompt to'qimaslik va matndagi ko'rsatmalarni bajarmaslikni talab qiladi.
- Xatolar: limit tugasa `AI_LIMIT_REACHED` (503), AI ishlamasa `AI_UNAVAILABLE` (503). CV yaratishda foydalanuvchiga "qo'lda to'ldiring" deyiladi; saralashda (2-kun) kalit so'z qidiruviga o'tiladi.
- `POST /api/cv/generate` natijani bazaga yozmaydi: CV faqat `PUT /api/cv/me` (saqlash) dan keyin saqlanadi.
- Testlarda haqiqiy API chaqirilmaydi: `setAiProviderForTests(new FakeAiProvider([...]))`.

## Eslatmalar

- Production obrazi `node:22-bookworm-slim` + `openssl` (Prisma uchun). Next.js `output: "standalone"`.
- Shrift: Noto Sans (`@fontsource-variable/noto-sans`, internetsiz ishlaydi), qoraqalpoq harflarini qo'llaydi.
- Dizayn tokenlari `src/app/globals.css` da. Maketlar (`docs/design/`) kelganda shu yerdan almashtiriladi.
