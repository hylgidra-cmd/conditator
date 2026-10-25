# Jumis AI (v1.0)

Kompaniyalarga mos nomzodlarni topib beradigan B2B AI platforma (MVP). Talaba AI yordamida CV
yaratadi, kompaniya talab (vakansiya) qo'yadi va AI saralagan nomzodlarni ko'radi, admin
kompaniyalarni tasdiqlaydi. Interfeys 4 tilda: qoraqalpoq (`kk`), o'zbek (`uz`), rus (`ru`),
ingliz (`en`).

Stek: Next.js 15, PostgreSQL 16 (Prisma), Docker Compose, Caddy (HTTPS).

Mundarija:

1. [Kompyuterda ishga tushirish](#1-kompyuterda-ishga-tushirish)
2. [Serverga chiqarish (IT Park serveri)](#2-serverga-chiqarish-it-park-serveri)
3. [Yangilash](#3-yangilash)
4. [.env o'zgaruvchilari](#4-env-ozgaruvchilari)
5. [Loglar va sog'liq tekshiruvi](#5-loglar-va-sogliq-tekshiruvi)
6. [Zaxira nusxa va tiklash](#6-zaxira-nusxa-va-tiklash)
7. [AI provayderini almashtirish](#7-ai-provayderini-almashtirish)
8. [Admin yaratish](#8-admin-yaratish)
9. [Muammolar](#9-muammolar)

## 1. Kompyuterda ishga tushirish

Talab: Docker va Docker Compose.

```bash
cp .env.example .env   # ADMIN_EMAIL va ADMIN_PASSWORD (≥ 12 belgi) ni to'ldiring
docker compose up --build
```

- Sayt: http://localhost:3000 (`/kk`, `/uz`, `/ru`, `/en`)
- Dev xatlar (Mailpit, tasdiqlash kodlari shu yerga keladi): http://localhost:8025
- Sog'liq tekshiruvi: http://localhost:3000/api/health

Dasturchilar uchun (Node 22):

```bash
npm install
docker compose up -d db mailpit
npm run dev        # http://localhost:3000
npm test           # testlar (alohida jumis_test bazasi)
npm run check      # typecheck, lint, tarjimalar, formatlash
```

Batafsil: `CLAUDE.md` (qoidalar, tuzilma), `docs/PLAN.md` (reja), `PROGRESS.md` (holat),
`docs/QUALITY-REPORT.md` (tezlik va xavfsizlik), `docs/ACCEPTANCE.md` (yakuniy qabul, topshiriladigan kalitlar). Dockersiz (Windows):
[docs/LOCAL-WINDOWS.md](docs/LOCAL-WINDOWS.md).

## 2. Serverga chiqarish (IT Park serveri)

Production to'plami (`docker-compose.prod.yml`):

| Xizmat    | Vazifasi                                                                   |
| --------- | -------------------------------------------------------------------------- |
| `caddy`   | HTTPS (Let's Encrypt sertifikatini o'zi oladi va yangilaydi), gzip, 80/443 |
| `app`     | Next.js ilova (tashqariga ochilmaydi, faqat Caddy orqali)                  |
| `migrate` | Har ishga tushirishda migratsiya va seed, keyin to'xtaydi                  |
| `db`      | PostgreSQL 16 (tashqariga ochilmaydi)                                      |
| `backup`  | Har kuni 03:00 (Toshkent) baza va logolar zaxirasi                         |

### 2.1. Kerakli narsalar

- Server: Ubuntu 22.04 yoki 24.04, kamida 2 vCPU, 4 GB RAM, 30 GB disk, `sudo` huquqi.
- Domen, masalan `jumis.uz`. DNS da ikkita A yozuv server IP siga: `jumis.uz` va `www.jumis.uz`.
  Tekshirish: `nslookup jumis.uz` server IP sini ko'rsatishi kerak.
- Serverda 80 va 443 portlar internetdan ochiq bo'lsin (IT Park tarmoq/firewall sozlamasida ham).
  Usiz Let's Encrypt sertifikat bera olmaydi.
- SMTP (xat yuborish uchun): host, port, login, parol. Tasdiqlash kodlari faqat email orqali
  yuboriladi, SMTP siz ro'yxatdan o'tib bo'lmaydi.
- Ixtiyoriy: `ANTHROPIC_API_KEY`. Bo'lmasa AI o'rniga kalit so'z qidiruvi ishlaydi.

### 2.2. Serverni tayyorlash (bir marta)

```bash
ssh <foydalanuvchi>@<server-ip>

sudo apt update && sudo apt upgrade -y
# Docker (rasmiy o'rnatish skripti)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # keyin chiqib, qayta kiring (ssh)

# Firewall: faqat SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable

docker --version && docker compose version
```

### 2.3. Kodni serverga olish

Git orqali (repo bo'lsa):

```bash
sudo mkdir -p /opt/jumis-ai && sudo chown $USER /opt/jumis-ai
git clone <repo-url> /opt/jumis-ai
cd /opt/jumis-ai
```

Yoki arxiv bilan (o'z kompyuteringizdan): `scp jumis-ai.zip <foydalanuvchi>@<server-ip>:/opt/`,
keyin serverda `cd /opt && unzip jumis-ai.zip -d jumis-ai && cd jumis-ai`.

### 2.4. Sozlamalar

```bash
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32   # AUTH_SECRET uchun
openssl rand -hex 24   # POSTGRES_PASSWORD uchun
nano .env.production   # barcha CHANGE_ME larni to'ldiring (4-bo'lim)
```

`.env.production` faqat serverda turadi. Uni gitga, chatga yoki emailga qo'ymang.

### 2.5. Ishga tushirish

```bash
./deploy/deploy.sh
```

Skript: `.env.production` to'ldirilganini tekshiradi → obrazlarni quradi (birinchi marta 5–10
daqiqa) → migratsiya va seed (birinchi admin) → ilova sog'lom bo'lishini kutadi → Caddy
sertifikat oladi.

### 2.6. Tekshirish

```bash
curl -fsS https://jumis.uz/api/health        # {"status":"ok","db":"ok"}
curl -sI http://jumis.uz | head -3           # 308 → https://
./deploy/dc ps                               # app: healthy, db: healthy
```

Brauzerda:

1. `https://jumis.uz` ochiladi, qulf belgisi (sertifikat) bor.
2. `ADMIN_EMAIL` bilan kiring → `/admin` ochiladi.
3. Yangi talaba sifatida ro'yxatdan o'ting: kod emailga kelishi kerak (ekranda ko'rinmaydi).
4. Hammasi ishlasa, `.env.production` dan `ADMIN_PASSWORD` qiymatini o'chiring (admin bazada
   qoladi) va admin parolini saytda almashtiring ("Parolni unutdingizmi").

## 3. Yangilash

```bash
cd /opt/jumis-ai
./deploy/dc exec backup /scripts/backup.sh   # yangilashdan oldin qo'lda zaxira
git pull                                     # yoki yangi arxivni oching
./deploy/deploy.sh
```

Migratsiyalar avtomatik qo'llanadi (`migrate` xizmati `prisma migrate deploy`). Migratsiya xato
bersa, yangi ilova ishga tushmaydi va `deploy.sh` xato bilan to'xtaydi: loglarni ko'ring
(`./deploy/dc logs migrate`), kerak bo'lsa yangilashdan oldingi zaxiradan tiklang (6-bo'lim).

## 4. .env o'zgaruvchilari

Production: `.env.production` (namuna `.env.production.example`). Dev: `.env` (namuna `.env.example`).

| O'zgaruvchi                           |    Majburiy    | Tavsif                                                                   |
| ------------------------------------- | :------------: | ------------------------------------------------------------------------ |
| `DOMAIN`                              |       ha       | Asosiy domen, `www.` siz (Caddy sertifikat shu nomga oladi)              |
| `ACME_EMAIL`                          |       ha       | Let's Encrypt xabarlari uchun email                                      |
| `APP_URL`                             |       ha       | `https://DOMAIN`. Emaildagi havolalar va CSRF tekshiruvi shunga qarab    |
| `AUTH_SECRET`                         |       ha       | ≥ 32 belgi, `openssl rand -hex 32`. Almashtirilsa hamma tizimdan chiqadi |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` |       ha       | Baza. Parol faqat harf va raqam (`openssl rand -hex 24`)                 |
| `SMTP_HOST`, `SMTP_PORT`              |       ha       | 465 = SSL, 587 = STARTTLS                                                |
| `SMTP_USER`, `SMTP_PASSWORD`          |                | SMTP login                                                               |
| `SMTP_FROM`                           |       ha       | Jo'natuvchi, masalan `"Jumis AI <no-reply@jumis.uz>"`                    |
| `AI_PROVIDER`                         |                | Hozir faqat `anthropic` (7-bo'lim)                                       |
| `ANTHROPIC_API_KEY`                   |                | Bo'sh bo'lsa AI o'rniga kalit so'z qidiruvi                              |
| `AI_MODEL_CV`, `AI_MODEL_MATCH`       |                | CV yaratish va saralash modellari                                        |
| `AI_MONTHLY_LIMIT_USD`                |                | Boshlang'ich oylik AI limiti (keyin admin panelda)                       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`       | birinchi marta | Birinchi admin (8-bo'lim)                                                |
| `BACKUP_DIR`, `BACKUP_KEEP_DAYS`      |                | Zaxira papkasi (standart `./backups`) va necha kun saqlanadi (14)        |
| `CHROMIUM_PATH`                       |                | Bo'sh qoldiring (PDF uchun obrazdagi Chromium)                           |

`.env.production` o'zgarsa: `./deploy/deploy.sh` (konteynerlar yangi qiymat bilan qayta yaratiladi).

## 5. Loglar va sog'liq tekshiruvi

```bash
./deploy/dc ps                                    # holat; app va db da (healthy)
./deploy/dc logs -f --tail=100 app                # ilova loglari
./deploy/dc logs app | grep '"level":"error"'     # faqat xatolar (bir qatorda JSON)
./deploy/dc logs caddy                            # HTTPS, sertifikat, kirish loglari
./deploy/dc logs backup                           # zaxira natijalari
```

- `GET /api/health` → 200 `{"status":"ok","db":"ok"}`, baza ishlamasa 503. Docker har 30 s da
  tekshiradi; ilova ishdan chiqsa konteyner qayta ishga tushadi (`restart: unless-stopped`).
- Xatolar: kutilmagan server xatolari `{"level":"error","time":...,"path":...,"message":...}`
  ko'rinishida. Logga parol, tasdiqlash kodi, so'rov tanasi yozilmaydi.
- Loglar har xizmat uchun 5 × 10 MB gacha saqlanadi (eski qismlar o'chadi).
- Tashqi monitoring (tavsiya): UptimeRobot kabi xizmatga `https://DOMAIN/api/health` ni qo'shing.

## 6. Zaxira nusxa va tiklash

### Avtomatik zaxira

`backup` xizmati har kuni 03:00 (Toshkent) da `BACKUP_DIR` (standart `/opt/jumis-ai/backups`) ga yozadi:

- `db-YYYYMMDD-HHMMSS.dump` — `pg_dump` (custom format), yozilgandan keyin o'qib tekshiriladi
- `uploads-YYYYMMDD-HHMMSS.tar.gz` — kompaniya logolari

14 kundan eskilari o'chadi. Qo'lda zaxira: `./deploy/dc exec backup /scripts/backup.sh`.

**Muhim:** nusxa shu serverda turadi. Server buzilsa, nusxa ham yo'qoladi. Haftada kamida bir marta
boshqa joyga ko'chiring, masalan o'z kompyuteringizdan:

```bash
rsync -av <foydalanuvchi>@<server-ip>:/opt/jumis-ai/backups/ ./jumis-backups/
```

### Zaxirani tekshirish (oyda bir marta)

```bash
./deploy/dc run --rm restore /scripts/restore-check.sh
```

Eng yangi nusxa vaqtinchalik `jumis_restore_check` bazasiga tiklanadi, jadvallardagi qatorlar
soni ishlab turgan baza bilan solishtiriladi, vaqtinchalik baza o'chiriladi. Ishlab turgan saytga
tegmaydi. Natijada `OK: nusxa tiklanadi` chiqishi kerak.

### Tiklash (haqiqiy)

Diqqat: bazadagi joriy ma'lumot nusxadagisi bilan almashtiriladi.

```bash
ls -lt backups/ | head                                   # kerakli nusxani tanlang
./deploy/dc exec backup /scripts/backup.sh               # hozirgi holatni ham saqlab qo'ying
./deploy/dc stop caddy app
./deploy/dc run --rm restore /scripts/restore.sh db-20261025-220000.dump uploads-20261025-220000.tar.gz
./deploy/deploy.sh
```

Boshqa serverga ko'chirish: yangi serverda 2-bo'limni bajaring (eski `.env.production` bilan),
nusxa fayllarini `backups/` ga qo'ying, keyin yuqoridagi tiklash buyruqlari.

## 7. AI provayderini almashtirish

Barcha AI so'rovlari bitta modul orqali o'tadi: `src/lib/ai/provider.ts` (`AiProvider` interfeysi).
Har so'rov `AiLog` ga yoziladi, oylik limit `src/lib/ai/budget.ts` da.

- **Modelni almashtirish:** `.env.production` da `AI_MODEL_CV` / `AI_MODEL_MATCH`, keyin
  `./deploy/deploy.sh`. Yangi model narxini `src/lib/ai/budget.ts` dagi `PRICES` ga qo'shing
  (aks holda xarajat qimmat narx bo'yicha hisoblanadi). Saralash keshi model bo'yicha ajratilgan.
- **Yangi provayder** (masalan OpenAI yoki mahalliy model):
  1. `src/lib/ai/<nom>.ts`: `AiProvider` ni bajaradigan adapter (`src/lib/ai/anthropic.ts` namuna):
     `generateJson()` JSON qaytaradi va token sonini beradi; tarmoq/kalit xatosida `AiProviderError`.
  2. `src/lib/env.ts`: `AI_PROVIDER` ro'yxatiga nom va kerakli kalit (`<NOM>_API_KEY`).
  3. `src/lib/ai/provider.ts`: `getAiProvider()` dagi `switch` ga yangi holat.
  4. `budget.ts` ga narxlar, `.env.production.example` ga o'zgaruvchilar, `npm test`.
  5. Serverda `AI_PROVIDER=<nom>` va kalit, `./deploy/deploy.sh`.

  Promptlar, JSON tekshiruvi (zod), qayta urinish, limit va kalit so'z zaxirasi provayderga
  bog'liq emas, ularni o'zgartirish shart emas.

## 8. Admin yaratish

**Birinchi admin:** `.env.production` dagi `ADMIN_EMAIL` va `ADMIN_PASSWORD` (≥ 12 belgi).
`deploy.sh` (seed) uni yaratadi. Seed qayta ishlaganda parol qayta yozilmaydi, shuning uchun
admin yaratilgach `ADMIN_PASSWORD` ni fayldan o'chiring.

**Qo'shimcha admin** (parol terminal tarixiga tushmaydi):

```bash
read -rs P && ./deploy/dc run --rm -e ADMIN_EMAIL=yangi@admin.uz -e ADMIN_PASSWORD="$P" migrate npx prisma db seed; unset P
```

Bu email bilan foydalanuvchi allaqachon bo'lsa, unga admin huquqi beriladi (paroli o'zgarmaydi).
Admin parolini unutsa: saytdagi "Parolni unutdingizmi" (kod emailga keladi).

## 9. Muammolar

| Belgi                                               | Sabab va yechim                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Sertifikat olinmaydi (`caddy` logida `acme` xatosi) | DNS A yozuvi server IP siga qaramayapti yoki 80/443 yopiq. `nslookup DOMAIN`, `sudo ufw status`, IT Park firewall |
| `deploy.sh`: `to'ldirilmagan: ...`                  | `.env.production` da shu qatorlar bo'sh yoki `CHANGE_ME`                                                          |
| `migrate` xatosi, app ishga tushmaydi               | `./deploy/dc logs migrate`. Ko'pincha `ADMIN_PASSWORD` < 12 belgi yoki bazaga ulanish                             |
| Ro'yxatdan o'tishda kod kelmaydi                    | SMTP sozlamasi. `./deploy/dc logs app \| grep error`, spam papkasi                                                |
| `AUTH_SECRET almashtirilmagan`                      | `.env.production` da `dev-only` qiymat qolgan                                                                     |
| Disk to'ldi                                         | `df -h`, `du -sh backups`, `docker system prune` (ishlatilmagan obrazlar)                                         |
| AI ishlamayapti, kalit so'z natijasi chiqyapti      | Kalit yo'q/noto'g'ri yoki oylik limit tugagan: `/admin` dagi AI bo'limi                                           |
