# PROGRESS — Jumis AI MVP

Reja: `docs/PLAN.md`. Yangi sessiyada avval `CLAUDE.md` va shu faylni o'qing.

## Tugagan qadamlar

- [x] **1.1 Loyiha skeleti** (24.10.2026)
  - Next.js 15 + TypeScript, Tailwind, Prisma 6 (sxema bo'sh), zod, next-intl 4, ESLint + Prettier
  - Docker Compose: app + postgres 16 + Mailpit; Dockerfile (standalone); `.env.example`; `.gitignore` (`.env` chiqarilgan)
  - 4 til: `/kk /uz /ru /en`, `/` → `/uz`; yuqorida til almashtirgich; tarjimalar `messages/*.json`, `_meta.status = TODO-review`
  - Bosh sahifa, umumiy layout (header, footer), tarjima qilingan 404
  - `/api/health` (baza ulanishini tekshiradi)
  - JSX da qo'lda yozilgan matnni taqiqlovchi ESLint qoidasi, `npm run check:i18n` skripti
  - Tekshirildi: `npm run check` o'tdi; konteynerlar ko'tarildi; `/kk /uz /ru /en` 200, `/` → `/uz`, `/api/health` → `{"status":"ok","db":"ok"}`, Mailpit UI ochiladi; brauzerda til almashtirgich bosilganda sahifa tili o'zgaradi; telefon kengligida gorizontal scroll yo'q

- [x] **1.2 Ma'lumotlar bazasi** (24.10.2026)
  - `prisma/schema.prisma`: User, Session, EmailCode, Cv, Company, Vacancy, Match, AiLog, Setting (2-kun jadvallari ham)
  - Indekslar: User.email unique, Cv(isVisible, language), Match(vacancyId, cvId) unique, AiLog(createdAt), qo'shimcha: Cv.skills GIN, Cv.searchText trigram, Match(vacancyId, score), Match(cvId, decision)
  - Birinchi migratsiya `init` (+ `pg_trgm`), seed: admin (.env dan) va `monthlyAiLimitUsd`
  - `migrate` xizmati: `docker compose up` migratsiya va seed ni o'zi bajaradi
  - `docs/DB-SCHEMA.md`
  - Tekshirildi: toza bazada (`docker compose down -v` dan keyin) migratsiya va seed o'tdi, admin argon2id xesh bilan yaratildi, qayta seed paroli o'zgartirmadi, qisqa parol rad etildi, logda parol yo'q; sxema va migratsiya o'rtasida farq yo'q

- [x] **1.3 Autentifikatsiya** (24.10.2026)
  - Ro'yxat (email, parol ≥ 8, rol talaba/kompaniya, majburiy rozilik → consentAt), kompaniyaga PENDING profil
  - Email tasdiqlash: 6 xonali kod faqat emailga (dev: Mailpit), HMAC xesh, 10 daqiqa, 5 urinish, qayta yuborish 60 s
  - Login, logout, parolni tiklash (kod bilan, eski sessiyalar o'chadi); argon2id
  - Sessiya cookie (httpOnly, SameSite=Lax, prod da Secure), rate limit (login, kod tekshirish, kod yuborish, ro'yxat), Origin tekshiruvi
  - `requireRole()`, `GET /api/me`, bloklangan foydalanuvchi kira olmaydi
  - Sahifalar 4 tilda: register, verify, login, forgot, reset, vaqtinchalik account; xato xabarlari `Errors` dan
  - Testlar: 23 ta (kod xeshi va muddati, noto'g'ri urinishlar, kod javob/logda yo'qligi, 401/403, bloklash, rate limit, CSRF, parol tiklash)
  - Tekshirildi: `npm test` 23/23; `npm run check` o'tdi; Docker'da brauzer orqali to'liq ssenariy (kk ro'yxat → Mailpit kodi → tasdiqlash → kabinet → chiqish → ru noto'g'ri parol → en parol tiklash → kirish); kod sahifada va app logida yo'q

- [x] **1.4 AI moduli va `POST /api/cv/generate`** (24.10.2026)
  - `AiProvider` interfeysi, Anthropic adapter (strukturali JSON), fake provayder testlar uchun
  - `runJsonTask`: oylik limit, zod tekshiruvi, 2 martagacha qayta urinish, har urinish AiLog ga (vazifa, model, token, narx, vaqt, ok)
  - CV sxemasi (ism, aloqa, maqsad, ta'lim, tajriba, ko'nikmalar, tillar, sertifikatlar), `missingFields`
  - PII tozalash (telefon, email, messenjer, ism), prompt injection himoyasi
  - Endpoint: faqat talaba, matn ≤ 3000 belgi (serverda), til kk/uz/ru/en, soatiga 10 ta; natija bazaga yozilmaydi
  - Testlar: 38/38 (qayta urinish, limit, o'tgan oy, PII, 401/403, uzunlik, rate limit)
  - Tekshirildi: `npm test`, `npm run check`, `npm run build`; haqiqiy API ga kalitsiz so'rov AUTH xatosi bilan to'g'ri ushlandi
  - **Haqiqiy Claude javobi hali sinalmagan**: API kaliti yo'q

- [x] **1.5 Talaba CV sahifasi** (25.10.2026; rejadagi 1.6 va 1.7 shu qadamda)
  - `/[locale]/student/cv`: AI bilan yaratish oynasi, barcha maydonlarni tahrirlash, "To'ldiring" belgilari, ish turi, saqlash, ochiq/yashirin
  - API: `GET/PUT /api/cv/me` (faqat o'z CV si), `PATCH /api/cv/me/visibility` (saqlanmagan CV ni ochib bo'lmaydi: 409 `CV_NOT_SAVED`)
  - Saqlashda: `savedAt`, `missingFields`, filtr maydonlari (ko'nikmalar, tillar kichik harfda, joy, ish turi) va `searchText` (ism va aloqasiz). Yangi CV yashirin, qayta saqlash ko'rinishni o'zgartirmaydi
  - Sana Node va brauzerda bir xil chiqishi uchun `formatDateTime` (UTC+5), next-intl `timeZone: Asia/Tashkent`
  - Testlar: 46/46 (401/403, boshqa talaba CV si, saqlash, searchText da PII yo'q, validatsiya, 409, ochish/yopish)
  - Tekshirildi: `npm test`, `npm run check`, `npm run build`; Playwright: uz sahifada qo'lda to'ldirish → saqlash → ochiq qilish → qayta yuklash (ma'lumot va holat saqlangan, konsol xatosiz), ru mobil 375 px (gorizontal skroll yo'q)
  - Gulgina spetsifikatsiyasi bo'yicha to'ldirildi: qo'lda tahrir qilingan (yoki saqlangan) CV ni AI bilan qayta yaratishdan oldin ogohlantirish; qayta yaratishda ism va aloqa saqlanadi; yuklanish paytida matn qulflanadi
  - Brauzerda (AI javobi soxtalashtirilgan holda) tekshirildi: 3001 belgida tugma o'chadi, yuklanish holati, haqiqiy server xatosi ko'rsatiladi, ogohlantirish (bekor qilsa tahrir qoladi), saqlash, ochiq → yashirin; 375, 768, 1024 px da gorizontal skroll yo'q
  - `docs/design/` maketlari yo'q: oddiy dizayn ishlatildi
  - **AI bilan yaratish tugmasi haqiqiy AI bilan sinalmagan**: API kaliti yo'q

## Keyingi qadam

- [ ] 1.6 CV shabloni va PDF (rejada 1.8)
- [ ] 1.9 1-bosqich tekshiruvi
- [ ] 2.1–2.8 Kompaniya, admin, saralash, deploy

## Ochiq savollar

0. **Inglizcha CV:** variant tanlanmagan (doim EN + tanlangan til / faqat tanlangan til / faqat EN). Hozir CV bitta, tanlangan tilda yaratiladi.

1. GitHub repo nomi (Gulgina hisobida). Hozircha kod faqat lokal git da.
2. Dizayn maketlari (`docs/design/`) yo'q: hozir oddiy toza dizayn.
3. Qoraqalpoq tarjimasini tekshiruvchi mutaxassis.
4. Anthropic API kaliti (haqiqiy AI ni sinash uchun), server, domen, SMTP (2-kun ertalabgacha).

## Ma'lum cheklovlar

- Claude ishlaydigan bulut muhitida Debian paket serverlari yopiq, shuning uchun Docker obrazi u yerda vaqtincha `node:22-bookworm` (to'liq) asosida yig'ib tekshirildi. Repodagi `Dockerfile` (`bookworm-slim` + `apt-get install openssl`) oddiy internetli kompyuter va serverda ishlaydi, lekin aynan shu variant hali sinalmagan.
