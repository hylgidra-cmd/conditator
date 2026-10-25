# Jumis AI

Kompaniyalarga mos nomzodlarni topib beradigan B2B AI platforma (MVP).

## Tez ishga tushirish

Talab: Docker va Docker Compose.

```bash
cp .env.example .env   # ADMIN_EMAIL va ADMIN_PASSWORD (≥12 belgi) ni to'ldiring
docker compose up --build
```

- Sayt: http://localhost:3000 (`/kk`, `/uz`, `/ru`, `/en`)
- Dev xatlar (Mailpit): http://localhost:8025
- Sog'liq tekshiruvi: http://localhost:3000/api/health
- `migrate` xizmati migratsiya va seed (admin akkaunt) ni avtomatik bajaradi. Sxema: `docs/DB-SCHEMA.md`

## Dasturchilar uchun

```bash
npm install
docker compose up -d db mailpit
npm run dev
npm run check
```

Batafsil: `CLAUDE.md` (buyruqlar, qoidalar, tuzilma), `docs/PLAN.md` (reja), `PROGRESS.md` (holat).
Serverga chiqarish yo'riqnomasi 2.7-qadamda qo'shiladi.

Dockersiz (Windows, administrator huquqisiz): [docs/LOCAL-WINDOWS.md](docs/LOCAL-WINDOWS.md).
