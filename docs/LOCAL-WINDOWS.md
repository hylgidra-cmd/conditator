# Jumis AI ni Windows da Dockersiz ishga tushirish

Administrator huquqi kerak emas. Hamma narsa foydalanuvchi papkasiga o'rnatiladi.
Barcha buyruqlar **PowerShell** da bajariladi (Start → "PowerShell").

Loyiha papkasi: `C:\Users\user\Desktop\jumis-ai` (`jumis-ai.zip` shu yerga ochilgan).

---

## 1. Node.js (portativ, o'rnatuvchisiz)

1. https://nodejs.org/dist/latest-v22.x/ sahifasidan `node-v22.….-win-x64.zip` faylini yuklab oling.
2. Uni `C:\Users\user\node` papkasiga oching, shunda `C:\Users\user\node\node.exe` bo'ladi.
3. PowerShell da `node` ni PATH ga qo'shing (faqat sizning foydalanuvchingiz uchun):

   ```powershell
   $p = [Environment]::GetEnvironmentVariable("Path", "User")
   [Environment]::SetEnvironmentVariable("Path", "$p;C:\Users\user\node", "User")
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

   Ikkinchi buyruq `npm` skriptlariga ruxsat beradi. "Y" deb javob bering.

4. PowerShell ni yopib, qayta oching va tekshiring:

   ```powershell
   node -v    # v22.x
   npm -v
   ```

## 2. Ma'lumotlar bazasi: Neon (bepul, bulutda, o'rnatish shart emas)

1. https://neon.tech da ro'yxatdan o'ting (Google akkaunt bilan bo'ladi).
2. **Create project** → nom: `jumis`, Postgres versiyasi: 16, region: Europe (Frankfurt).
3. **Connect** oynasida **Connection pooling** ni **o'chiring** (migratsiya uchun to'g'ridan-to'g'ri ulanish kerak) va satrni nusxalang. U shunga o'xshaydi:

   ```
   postgresql://neondb_owner:PAROL@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

Eslatma: bu sinov bazasi. Unga haqiqiy talabalar ma'lumotini kiritmang.

## 3. Email: Mailpit (xatlarni kompyuteringizda ushlab qoladi)

Tasdiqlash kodi faqat emailga yuboriladi: u ekranda ham, logda ham ko'rinmaydi. Shu sababli dev uchun Mailpit kerak.

1. https://github.com/axllent/mailpit/releases/latest sahifasidan `mailpit-windows-amd64.zip` ni yuklab oling.
2. Uni `C:\Users\user\mailpit` ga oching.
3. Alohida PowerShell oynasida ishga tushiring va oynani ochiq qoldiring:

   ```powershell
   C:\Users\user\mailpit\mailpit.exe
   ```

   Windows Firewall so'rasa, "Cancel" ni bossangiz ham bo'ladi: hammasi `localhost` da ishlaydi.

4. Xatlar http://localhost:8025 da ko'rinadi.

## 4. `.env` fayli

```powershell
cd C:\Users\user\Desktop\jumis-ai
Copy-Item .env.example .env
notepad .env
```

Quyidagi qatorlarni o'zgartiring, qolganlarini tegmang:

```ini
DATABASE_URL="postgresql://neondb_owner:PAROL@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

ADMIN_EMAIL=sizning@email.uz
ADMIN_PASSWORD=kamida-12-belgili-parol

# AI: https://console.anthropic.com → API Keys. Bo'sh qolsa, "CV yaratish" o'rniga
# "qo'lda to'ldiring" xabari chiqadi, qolgan hamma narsa ishlaydi.
ANTHROPIC_API_KEY=sk-ant-...
```

`SMTP_HOST=localhost` va `SMTP_PORT=1025` Mailpit ga mos, ularni o'zgartirmang.
Fayl nomi aynan `.env` bo'lsin (`.env.txt` emas).

## 5. Kutubxonalar va baza

```powershell
cd C:\Users\user\Desktop\jumis-ai
npm install
npm run db:deploy
npm run db:seed
```

- `npm install`: 2–5 daqiqa, Prisma klientini ham yaratadi.
- `npm run db:deploy`: Neon da jadvallarni yaratadi.
- `npm run db:seed`: admin akkaunt va sozlamalarni yaratadi (`.env` dagi ADMIN_EMAIL va ADMIN_PASSWORD bilan).

## 6. PDF uchun Chromium

Bitta buyruq bilan, `%LOCALAPPDATA%\ms-playwright` ga (~150 MB) yuklanadi:

```powershell
npx playwright-core install --only-shell chromium
```

Agar internet cheklangan bo'lsa, o'rniga kompyuterdagi Microsoft Edge ni ko'rsatish mumkin. `.env` ga quyidagini qo'shing (teskari emas, to'g'ri chiziq `/` bilan):

```ini
CHROMIUM_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

## 7. Ishga tushirish

```powershell
npm run dev
```

- Sayt: http://localhost:3000
- Xatlar (kodlar): http://localhost:8025, Mailpit oynasi ochiq bo'lishi kerak.

To'xtatish uchun `Ctrl+C`. Keyingi safar faqat Mailpit va `npm run dev` ni ishga tushirasiz.

## 8. Tekshirish

1. http://localhost:3000/uz/register da talaba sifatida ro'yxatdan o'ting.
2. Kodni http://localhost:8025 dan oling va kiriting.
3. Kabinet → "Mening CV im" sahifasida matn yozib "CV yaratish" ni bosing (API kaliti bo'lsa) yoki maydonlarni qo'lda to'ldiring.
4. "Saqlash" → "Ko'rish va PDF" → "PDF yuklab olish".
5. Admin: `.env` dagi email va parol bilan kiring. Admin paneli 2-kunda qo'shiladi.

## Muammolar

| Xato                                               | Yechim                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm : ... running scripts is disabled`            | 1-bo'limdagi `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ni bajaring                               |
| `node` topilmadi                                   | PowerShell ni yopib qayta oching; `C:\Users\user\node\node.exe` borligini tekshiring                         |
| `P1001: Can't reach database server`               | `DATABASE_URL` ni tekshiring, oxirida `?sslmode=require` bo'lsin; Neon loyihasi uyg'onadi (bir necha soniya) |
| Ro'yxatdan o'tishda server xatosi yoki kod kelmadi | Mailpit oynasi ochiq bo'lishi kerak                                                                          |
| PDF: `Executable doesn't exist`                    | 6-bo'limdagi buyruqni bajaring yoki `CHROMIUM_PATH` ni qo'shing                                              |
| `Port 3000 is in use`                              | `npm run dev -- -p 3001` va `.env` da `APP_URL=http://localhost:3001`                                        |
