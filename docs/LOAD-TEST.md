# Yuklama sinovi (faqat dev)

1000 ta namunaviy CV va 100 ta bir vaqtdagi foydalanuvchi. AI chaqirilmaydi: kompaniyalarda obuna
yo'q, saralash kalit so'z bo'yicha ishlaydi. Ma'lumotlar soxta.

Skriptlar faqat lokal bazada va nomida `load` bo'lgan bazada ishlaydi (`scripts/load/guard.ts`),
yuklama faqat `localhost` ga beriladi. Dev bazangiz (`jumis`) tegilmaydi.

## 1. Alohida baza

```bash
docker compose up -d db
docker compose exec -T db psql -U jumis -d jumis -c "CREATE DATABASE jumis_load"
export LOAD_URL="postgresql://jumis:<parol>@localhost:5432/jumis_load?schema=public"
DATABASE_URL="$LOAD_URL" npx prisma migrate deploy
```

## 2. Namunaviy ma'lumot

```bash
DATABASE_URL="$LOAD_URL" npm run load:seed -- load-sessions.json
```

Bazani tozalab yaratadi: 1000 talaba (800 ochiq CV, 5% saqlanmagan), 50 kompaniya (40 tasdiqlangan),
200 talab, 100 sessiya (60 talaba, 35 kompaniya, 5 admin). Sessiya cookie lari `load-sessions.json`
ga yoziladi (gitga qo'shilmaydi, faqat shu lokal baza uchun).

## 3. Server (production build)

```bash
npm run build
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
DATABASE_URL="$LOAD_URL&connection_limit=20" PORT=3200 node .next/standalone/server.js
```

## 4. Yuklama

```bash
BASE_URL=http://localhost:3200 npm run load:run -- load-sessions.json
```

Sozlamalar (env): `ITERATIONS` (5), `THINK_MS` (1000, sahifalar orasidagi o'rtacha o'ylash vaqti;
0 = stress), `RAMP_MS` (10000, foydalanuvchilar shu vaqt ichida bosqichma-bosqich kiradi), `LIMIT_MS`
(3000). Natija: har sahifa uchun p50/p95/max jadvali. Biror p95 `LIMIT_MS` dan oshsa yoki xato bo'lsa,
skript 1 kod bilan tugaydi.
