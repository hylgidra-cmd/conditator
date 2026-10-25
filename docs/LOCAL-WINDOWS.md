# Jumis AI ni Windows da Dockersiz ishga tushirish (v1.0)

Docker shart emas: Docker faqat serverga chiqarish (`README.md` 2-bo'lim) va xohlovchilar uchun.
Kompyuterda sinash uchun shu yo'riqnoma yetadi: Node.js + bulutdagi bepul baza + Mailpit.
Administrator huquqi kerak emas. Hamma narsa foydalanuvchi papkasiga o'rnatiladi.

**Oldin (1-kunda) o'rnatgan bo'lsangiz**, faqat ["Yangi versiyaga o'tish"](#yangi-versiyaga-otish) bo'limini bajaring.
Barcha buyruqlar **PowerShell** da bajariladi (Start → "PowerShell").

Loyiha papkasi: `C:\Users\user\Desktop\jumis-ai` (`jumis-ai.zip` shu yerga ochilgan).
Tekshiring: papka ichida `package.json` bo'lishi kerak. v1.0 arxivi ichida `jumis-ai-v1.0\` papkasi bor:
uning ichidagi hamma narsani `jumis-ai` papkasiga ko'chiring (yoki shu papkadan foydalaning).
Agar oyna PowerShell emas, cmd bo'lsa, `Copy-Item` o'rniga `copy` ishlating.

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

# AI: https://console.anthropic.com → API Keys. Kalit yo'q bo'lsa, bo'sh qoldiring
# (yoki 7-bo'limdagi soxta AI ni ishlating).
ANTHROPIC_API_KEY=
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

### AI kaliti bo'lmasa

- Kalitsiz ham sayt ishlaydi: "CV yaratish" xato xabarini beradi (CV ni qo'lda to'ldirasiz), saralash
  esa AI o'rniga kalit so'z bo'yicha natija ko'rsatadi.
- AI qismini ko'rish uchun **soxta AI** bor (haqiqiy model emas, oddiy qoidalar bilan javob beradi,
  faqat sinov uchun). Uchinchi PowerShell oynasida:

  ```powershell
  cd C:\Users\user\Desktop\jumis-ai
  node scripts/acceptance/mock-anthropic.mjs mock-requests.jsonl
  ```

  `.env` ga qo'shing va `npm run dev` ni qayta ishga tushiring:

  ```ini
  ANTHROPIC_BASE_URL=http://127.0.0.1:4010
  ANTHROPIC_API_KEY=mock
  ```

  `mock-requests.jsonl` faylida AI ga nima yuborilgani ko'rinadi (ism, telefon, email bo'lmasligi kerak).
  Haqiqiy kalit kelganda bu ikki qatorni o'chirib, haqiqiy `ANTHROPIC_API_KEY` ni yozing.

- Sayt: http://localhost:3000
- Xatlar (kodlar): http://localhost:8025, Mailpit oynasi ochiq bo'lishi kerak.

To'xtatish uchun `Ctrl+C`. Keyingi safar faqat Mailpit va `npm run dev` ni ishga tushirasiz.

## 8. Tekshirish (asosiy ssenariy)

Ikki xil brauzer oynasi kerak bo'ladi (masalan, oddiy va "Inkognito"), chunki bir oynada bitta akkaunt.

1. **Talaba:** http://localhost:3000/uz/register → "Talaba" → kodni http://localhost:8025 dan oling.
   "Mening CV im": matn yozib "CV yaratish" (yoki qo'lda to'ldiring) → "Saqlash" → "Ochiq" belgisini yoqing.
2. **Kompaniya** (boshqa oynada): ro'yxatdan o'ting → "Kompaniya" → profilni to'ldirib saqlang.
   Holat: "tasdiq kutmoqda".
3. **Admin:** `.env` dagi `ADMIN_EMAIL` / `ADMIN_PASSWORD` bilan kiring → "Admin" → "Kompaniyalar" →
   "Tasdiqlash" → sana tanlab "Obunani yoqish".
4. **Kompaniya:** "Talablar" → "Yangi talab" (lavozim, ko'nikmalar, til, joy) → "Saqlash" → "Nomzodlar" →
   "Saralash". Ball va izohli ro'yxat chiqadi (AI yoki soxta AI bilan; kalitsiz — kalit so'z natijasi).
5. "CV ni ko'rish" → "PDF yuklab olish" → "Tanlandi". "Talablar" sahifasida "Tanlandi: 1" ko'rinadi.

Bir nechta nomzod ko'rish uchun 1-qadamni turli ko'nikmalar bilan 3–5 marta takrorlang
(har biri uchun yangi email, masalan `t1@test.uz`, `t2@test.uz`; Mailpit hammasini ushlaydi).

## Yangi versiyaga o'tish

Avval o'rnatgan bo'lsangiz (Node, Neon, Mailpit, `.env` bor):

1. Eski `.env` faylini saqlab qo'ying (masalan Desktop ga nusxa).
2. Yangi `jumis-ai.zip` ni oching va fayllarni loyiha papkasiga ko'chiring (ustidan yozing). `.env` ni
   qaytarib qo'ying.
3. PowerShell:

   ```powershell
   cd C:\Users\user\Desktop\jumis-ai
   npm install          # kutubxonalar o'zgarmagan, lekin Prisma klienti yangi sxema bilan qayta yaratiladi
   npm run db:deploy    # yangi jadvallar: kompaniya, talablar, saralash, admin jurnali
   npm run db:seed      # admin allaqachon bo'lsa, o'zgarmaydi
   npm run dev
   ```

## Muammolar

| Xato                                                    | Yechim                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm : ... running scripts is disabled`                 | 1-bo'limdagi `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ni bajaring                               |
| `node` topilmadi                                        | PowerShell ni yopib qayta oching; `C:\Users\user\node\node.exe` borligini tekshiring                         |
| `P1001: Can't reach database server`                    | `DATABASE_URL` ni tekshiring, oxirida `?sslmode=require` bo'lsin; Neon loyihasi uyg'onadi (bir necha soniya) |
| Ro'yxatdan o'tishda server xatosi yoki kod kelmadi      | Mailpit oynasi ochiq bo'lishi kerak                                                                          |
| PDF: `Executable doesn't exist`                         | 6-bo'limdagi buyruqni bajaring yoki `CHROMIUM_PATH` ni qo'shing                                              |
| `Port 3000 is in use`                                   | `npm run dev -- -p 3001` va `.env` da `APP_URL=http://localhost:3001`                                        |
| `The table ... does not exist` (yangi versiyadan keyin) | `npm run db:deploy` ni bajaring                                                                              |
| "Saralash" faqat kalit so'z natijasini beradi           | Kompaniya tasdiqlanmagan / obuna yoqilmagan (3-qadam) yoki AI kaliti yo'q (7-bo'lim)                         |
| Soxta AI: `ECONNREFUSED 127.0.0.1:4010`                 | Soxta AI oynasi yopilgan: 7-bo'limdagi buyruqni qayta ishga tushiring                                        |
