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

## Keyingi qadam

- [ ] AI moduli (rejada 1.5)
- [ ] AI bilan CV yaratish (rejada 1.6)
- [ ] CV tahriri, saqlash, ochiq/yashirin (rejada 1.7)
- [ ] CV shabloni va PDF (rejada 1.8)
- [ ] 1.9 1-bosqich tekshiruvi
- [ ] 2.1–2.8 Kompaniya, admin, saralash, deploy

## Ochiq savollar

1. GitHub repo nomi (Gulgina hisobida). Hozircha kod faqat lokal git da.
2. Dizayn maketlari (`docs/design/`) yo'q: hozir oddiy toza dizayn.
3. Qoraqalpoq tarjimasini tekshiruvchi mutaxassis.
4. Anthropic API kaliti (1.5-qadamgacha), server, domen, SMTP (2-kun ertalabgacha).

## Ma'lum cheklovlar

- Claude ishlaydigan bulut muhitida Debian paket serverlari yopiq, shuning uchun Docker obrazi u yerda vaqtincha `node:22-bookworm` (to'liq) asosida yig'ib tekshirildi. Repodagi `Dockerfile` (`bookworm-slim` + `apt-get install openssl`) oddiy internetli kompyuter va serverda ishlaydi, lekin aynan shu variant hali sinalmagan.
