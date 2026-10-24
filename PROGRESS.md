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

## Keyingi qadam

- [ ] **1.3 / 1.4 Auth** (ro'yxat, email kod, kirish, chiqish, parol tiklash)
- [ ] 1.5 AI moduli
- [ ] 1.6 AI bilan CV yaratish
- [ ] 1.7 CV tahriri, saqlash, ochiq/yashirin
- [ ] 1.8 CV shabloni va PDF
- [ ] 1.9 1-bosqich tekshiruvi
- [ ] 2.1–2.8 Kompaniya, admin, saralash, deploy

## Ochiq savollar

1. GitHub repo nomi (Gulgina hisobida). Hozircha kod faqat lokal git da.
2. Dizayn maketlari (`docs/design/`) yo'q: hozir oddiy toza dizayn.
3. Qoraqalpoq tarjimasini tekshiruvchi mutaxassis.
4. Anthropic API kaliti (1.5-qadamgacha), server, domen, SMTP (2-kun ertalabgacha).

## Ma'lum cheklovlar

- Claude ishlaydigan bulut muhitida Debian paket serverlari yopiq, shuning uchun Docker obrazi u yerda vaqtincha `node:22-bookworm` (to'liq) asosida yig'ib tekshirildi. Repodagi `Dockerfile` (`bookworm-slim` + `apt-get install openssl`) oddiy internetli kompyuter va serverda ishlaydi, lekin aynan shu variant hali sinalmagan.
