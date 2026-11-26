# AGENTS.md — Candidator handoff (read first)

> NEVER commit or print secret values (DB password, AUTH_SECRET, GEMINI_API_KEY, SMTP_PASSWORD, CRON_SECRET). Only variable NAMES are listed here.
> The owner is an Uzbek speaker and non-technical: reply in Uzbek, concisely, with simple step-by-step instructions.

## 1. Product
**Candidator** (historic repo name "jumis-ai") — multilingual job platform (locales `kk` default, `uz`, `ru`, `en` — 1737 synced i18n keys) for students / companies / admin.
Features: vacancies (CRUD + pause/resume + moderation + saved bookmarks + personality trait matching), CV builder (15 templates + obyektivka, PDF/DOCX via `@sparticuz/chromium` + `playwright-core`, automatic non-removable "Shaxsiyat" personality block), 20-question randomized Personality Test (1-per-screen, 5 word-only answers, 16 plain-language types & 4 groups), AI CV generation + AI candidate matching (Gemini), HH-style pipeline stages, Company `/company/stats` + Excel export, Studio Light/Dark Auth (Registan 3D globe + orbit + autumn leaves) & Studio Light/Dark Student/Employer `/account` cabinets, chat (1-message rule), support chat with admin (images/receipts), manual card payments with admin approval, company plans (Start 14 900 / Standart 29 000 / Pro 49 000 UZS), weekly 5000 UZS student apply pass, anti-screenshot `CvPaymentShield` (no background text watermark).

## 2. Stack & layout
Next.js 15.5 (App Router), React 19, TypeScript, Prisma 6.19 + PostgreSQL, next-intl 4, Tailwind 4, zod 4, nodemailer.
- `src/app` routes + `src/app/api`; `src/backend` services (auth, db, seo, payment, chat, cron...); `src/frontend` components; `src/i18n`
- `messages/{uz,kk,ru,en}.json` — must stay in sync (`npm run check:i18n`)
- `prisma/` schema + migrations; `scripts/` (`vercel-build.mjs`, `sync-db-hardening.mjs`, `check-messages.mjs`, load test); `docs/` (PLAN, DB-SCHEMA, ACCEPTANCE, LOAD-TEST, QUALITY-REPORT, LOCAL-WINDOWS, TZ docx)

## 3. Commands
- Dev: `npm run dev`
- Verify before every commit: `npm run check:i18n; npx tsc --noEmit; npm run lint; npx prisma validate`
- ESLint rule `react/jsx-no-literals` in `src/app/[locale]/**`: no raw strings in JSX — use translations/variables.
- vitest has no tests and startup errors (`code.charCodeAt is not a function`) — pre-existing.
- Windows PowerShell 5.1: no `&&`; use `; if ($LASTEXITCODE -eq 0) { ... }`.

## 4. Rules
- Keep locale prefixes `/kk /uz /ru /en`.
- Keep all 4 message files in sync (`npm run check:i18n`). Preserve existing comments/docstrings.
- Dark mode uses `document.documentElement.dataset.theme = "dark"` (`[data-theme="dark"]` selector, NOT `.dark` class). In CSS Modules always use `:global([data-theme="dark"])`.
- No fake/placeholder data. Never commit `.env*` (only `.env.example`, `.env.production.example`).
- Any new DB columns should be added to BOTH a Prisma migration AND idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `scripts/sync-db-hardening.mjs`.

## 5. Infrastructure map
| Part | Details |
|---|---|
| Domain | `candidator.uz`, bought at **ahost.uz** (renew yearly, ~Nov 2027). Nameservers → `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (DNS managed in Vercel: `npx vercel dns add candidator.uz '@' TXT "..."`) |
| Live URLs | https://candidator.uz, https://www.candidator.uz (also candidator-uz.vercel.app, canditator.vercel.app, conditator.vercel.app) |
| Hosting | **Vercel** Hobby (free), account/team `hylgidra-7217`, project `implement_new_tz_functions` (id `prj_zVGuw7uUu7CrQBFda8l7zdpwsHEd`), region iad1, Node 26.x |
| Build | `npm run vercel-build` → `scripts/vercel-build.mjs`: `prisma migrate deploy`, `scripts/sync-db-hardening.mjs`, `prisma db seed` (only if migrate OK), `next build`. Never fails build on DB problems |
| Deploy | **Manual**: `npx --prefer-offline vercel --prod --yes` (CLI logged in on owner's PC). NOT auto-deployed from GitHub. Transient "fetch failed/Not authorized" → retry |
| Cron | `vercel.json`: `/api/cron/fifteen-days` daily `0 2 * * *`, requires `CRON_SECRET` (no token → 403) |
| Database | **Neon** PostgreSQL free (500 MB), host `ep-lively-truth-b95tknyh.c-7.eu-central-1.aws.neon.tech:5432` (Frankfurt), console.neon.tech. Local `.env` uses same DB. No pooler yet |
| Git | remote `conditator` → https://github.com/hylgidra-cmd/conditator.git (source of truth; `git push conditator HEAD:main`); remote `origin` → https://github.com/Denji-chan/jumis-ai.git. Local branch `implement_new_tz_functions` |
| AI | Gemini (`AI_PROVIDER=gemini`), key from Google AI Studio |
| Email | SMTP via nodemailer |

**Vercel Production env var names:** `DATABASE_URL, AUTH_SECRET, APP_URL, GEMINI_API_KEY, AI_PROVIDER, AI_MODEL_CV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, CRON_SECRET`. Optional: `NEXT_PUBLIC_SITE_URL` (default https://candidator.uz), `GOOGLE_SITE_VERIFICATION`, `YANDEX_VERIFICATION`, `UPLOAD_DIR`. Values: Vercel → Settings → Environment Variables, or local `.env`.
`APP_URL` may still be the old .vercel.app URL (CSRF check in `src/backend/http/request.ts` accepts both).

## 6. Search engines
- Google Search Console: Domain property `candidator.uz` verified via DNS TXT `google-site-verification=i7D_CusXvp70zOFpu9cPNEkgVTrhaetvGpEiebISuZY`; sitemap `https://candidator.uz/sitemap.xml` submitted; indexing requested for `/uz`, `/uz/vacancies` (account hylgidra@gmail.com).
- Yandex Webmaster: `https://candidator.uz` verified via DNS TXT `yandex-verification: 2788c92c74207ee6`. Sitemap submission/recrawl not confirmed.
- Expect: brand queries 1–7 days; generic queries 1–3 months.

## 7. Payments
Manual card transfer to `9860 1301 6978 8069` (Gulgina E.), receipt screenshot (compressed client-side), admin approves at `/admin/payments`. Click/Payme routes exist but no real merchant keys. Plans in `src/backend/payment/plans.ts`: Start 7d `14 900 UZS`, Standart 15d `29 000 UZS`, Pro 30d `49 000 UZS`. Student prices: CV `5 000 UZS`, weekly apply pass `5 000 UZS`.

## 8. History (newest first, all on main)
- `8a532e3` Removed diagonal `CANDIDATOR` watermark text overlay from `CvPaymentShield` while keeping print/copy/blackout guards.
- `d5d38d7` Studio Light/Dark full-stack `/account` cabinets for both `STUDENT` and `COMPANY`: profile/logo modals (`/api/account/{profile,privacy,sessions,two-factor}`, `/api/company/account`), inline vacancy pause/resume (`/api/vacancies/[id]/status`), active device sessions (`Session.userAgent/ipAddress`), Prisma connection pool tuning (`connect_timeout=25&pool_timeout=25&connection_limit=6` in `src/backend/db.ts`).
- `84e460f` Studio Light/Dark Login & Register redesign: photorealistic emerald silk backdrops, layered Registan glass globe (`public/auth/`), occluded 3D diagonal orbit + bead, interactive autumn leaf burst inside sphere.
- `1dcc71a` Backend TZ 2: 20-question randomized personality test (60 statement + 20 choice questions, 5 word-only options, 1-per-screen UI), plain-language 16 types & 4 groups, automatic non-removable "Shaxsiyat" block on all 15 CV templates + PDF, Company `/company/stats` + Excel export + nightly snapshot cron, Vacancy "Qanday odam kerak?" picker + templates + 4-trait 25%-each matching, `14 900 UZS` entry company plan, `SavedVacancy` bookmarks.
- `cca8aa4` DB hardening: 17 composite indexes + `Company.hasLogo`, Prisma singleton (`src/backend/db.ts`), base64 stripping in SQL, row caps, adaptive chat polling, new rate limits (`src/backend/auth/rate-limit.ts`, in-memory per instance), image size caps, `landing-stats.ts` SQL aggregation, expanded daily cron (`src/backend/cron/service.ts`).
- `a207624` Branding: Candidator logo favicon/icons/OG/manifest.
- `bc21fa1` Technical SEO: `src/backend/seo.ts`, dynamic `sitemap.ts`, `robots.ts`, hreflang, JSON-LD (Organization/WebSite, JobPosting).
- `349df54` Removed AI badge from logo; photo + receipt upload in support chat; mobile layouts.
- `90bce8e`/`77a4475` Audit fixes: CSP, Chromium PDF on Vercel, AdminLog, CvPaymentShield, vacancy CRUD/moderation, mobile menu, privacy.
- Earlier: Neo-Editorial Emerald redesign, company subscription gate, AI CV quality evaluation, smart vacancy ranking.

Last live check: `/api/health` → ok/db ok; main pages, sitemap, robots, icons → 200.

## 9. TODO
1. Set Vercel `APP_URL=https://candidator.uz` and redeploy.
2. Yandex Webmaster: submit sitemap + recrawl `/uz`, `/uz/vacancies`.
3. Neon pooled connection (`-pooler` host) in `DATABASE_URL`; watch 500 MB disk (move images to Cloudflare R2 if >350 MB).
4. Optionally connect Vercel ↔ GitHub `conditator` for auto-deploy.
5. Enable 2FA on Vercel/GitHub/Neon.
6. Renew candidator.uz yearly at ahost.uz.
7. Optional: real Click/Payme integration.
8. Replace in-memory rate limiter with Redis/DB if abuse appears.
9. Fix vitest and add real tests.
10. Add real vacancies/companies for SEO growth.
