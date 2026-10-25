# Yakuniy qabul (v1.0)

Sana: 2026-10-25. Topshiriqning 2-bosqich qabul mezoni bo'yicha asosiy ssenariy boshidan oxirigacha
haqiqiy ishga tushirilgan ilovada, haqiqiy brauzerda o'tkazildi.

## Sinov sharoiti

- Ilova: production build (`next build`, standalone server), toza PostgreSQL bazasi, migratsiya va seed.
- Email: Mailpit (dev SMTP). Tasdiqlash kodlari emaildan olindi.
- Brauzer: Chromium (Playwright), talaba telefon o'lchamida (390×844), kompaniya va admin kompyuterda.
- **AI: soxta Anthropic server** (`scripts/acceptance/mock-anthropic.mjs`). API kaliti hali yo'q.
  Ilova kodi o'zgarishsiz ishladi: prompt, PII tozalash, zod tekshiruvi, `AiLog`, xarajat, kesh,
  saralash guruhlari. Faqat javobni haqiqiy model emas, oddiy qoida yozdi. Shuning uchun **ball va
  izoh sifati haqiqiy AI bilan alohida tekshirilishi kerak**.

## Natija: 23 tekshiruv, hammasi o'tdi

| #   | Qadam                                                                               | Natija                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Talaba ro'yxatdan o'tadi, kod emailga keladi                                        | ✅ Kod sahifada yo'q, faqat emailda                                                                                                            |
| 1   | Talaba o'zi haqida matn yozadi → AI CV yaratadi → tahrirlab saqlaydi → ochiq qiladi | ✅ Ko'nikmalar, ta'lim, tajriba, tillar to'ldirildi; bazada saqlangan va ochiq                                                                 |
| 2   | Kompaniya ro'yxatdan o'tadi va profil to'ldiradi                                    | ✅ Holat "tasdiq kutmoqda"                                                                                                                     |
| 3   | Admin kompaniyani tasdiqlaydi va obunani 31.12.2026 gacha yoqadi                    | ✅ Bazada `APPROVED`, obuna 31.12.2026 23:59 (Toshkent) gacha; ikkala harakat `AdminLog` da                                                    |
| 4   | Kompaniya talab yozadi va "Saralash" ni bosadi                                      | ✅ 7 ta nomzod, har birida ball (98…30) va izoh; ro'yxat anonim. 9 ta ochiq CV dan 2 tasi filtrda chiqib ketdi (joy, til) va AI ga yuborilmadi |
| 4   | AI ga shaxsiy ma'lumot ketmaydi                                                     | ✅ AI ga ketgan so'rovlarda ism, telefon, email yo'q (tekshirildi)                                                                             |
| 5   | Qayta ochish va "Yangilash"                                                         | ✅ AI qayta chaqirilmadi (natija bazadan); `AiLog`: 1 ta CV, 1 ta saralash                                                                     |
| 6   | Nomzod CV sini ochadi, PDF yuklaydi, "Tanlandi" deb belgilaydi                      | ✅ CV da aloqa ma'lumoti bor, PDF 57 KB (A4, Noto Sans), qaror saqlanadi, talablar tarixida "Tanlandi: 1", ochish `CvView` da                  |
| 7   | Talaba kompaniya API siga kira olmaydi                                              | ✅ 403                                                                                                                                         |
| —   | Brauzer konsoli                                                                     | ✅ Xato yo'q                                                                                                                                   |

Skrinshotlar va PDF: loyiha fayllaridagi `screens/acceptance/`.

### Qabul vaqtida topilib tuzatilgan kamchiliklar

1. **Talaba matnida o'z ismini yozsa, ism AI ga ketardi** (formada ism hali kiritilmagan bo'lsa).
   Endi "Ismim …", "Atım …", "Меня зовут …", "My name is …" kabi iboralardan keyingi ism matnning
   hamma joyida `[NAME]` bilan almashtiriladi. Test qo'shildi.
2. **Kompaniya va admin formalarida "Yuborilmoqda…" tarjimasi brauzerga yuborilmagan edi**
   (2.6 dagi tarjimalarni bo'lish natijasi). Endi barcha sahifalarda bor.

## Qayta o'tkazish

```bash
docker compose up -d db mailpit
docker compose exec -T db psql -U jumis -d jumis -c "CREATE DATABASE jumis_accept"
export DATABASE_URL="postgresql://jumis:jumis@localhost:5432/jumis_accept?schema=public"
npx prisma migrate deploy
ADMIN_EMAIL=admin@jumis.test ADMIN_PASSWORD=<parol> npx prisma db seed

mkdir -p acceptance-out
node scripts/acceptance/mock-anthropic.mjs acceptance-out/mock-requests.jsonl &   # soxta AI, port 4010

npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
ANTHROPIC_BASE_URL=http://127.0.0.1:4010 ANTHROPIC_API_KEY=mock APP_URL=http://localhost:3100 PORT=3100 \
  node .next/standalone/server.js &                                                  # .env dagi qolgan qiymatlar bilan

ADMIN_PASSWORD=<parol> node scripts/acceptance/run.mjs
```

Har safar toza bazada ishga tushiring (skript sanoqlarni tekshiradi). Haqiqiy AI bilan sinash uchun
`ANTHROPIC_BASE_URL` ni bermang va haqiqiy `ANTHROPIC_API_KEY` qo'ying. U holda soxta server logiga
tayanadigan tekshiruvlar (AI ga ketgan so'rovlar) ishlamaydi; ball va izohlarni sahifada qo'lda baholang.

## Nima to'liq ishlaydi (avtomatik testlar + qabul)

- Ro'yxatdan o'tish, email kodi (xeshlangan, muddatli, urinishlar cheklangan), kirish, parolni tiklash, 4 til.
- Talaba: AI bilan CV yaratish (limit, kalit so'z zaxirasi), tahrirlash, saqlash, ochiq/yashirin, PDF.
- Kompaniya: profil, logo, talablar (yaratish, tahrirlash, nusxa), AI saralash (filtr, 10 tadan guruh,
  kesh, zaxira), nomzod CV si va PDF, "Tanlandi"/"Mos emas", tarix.
- Admin: foydalanuvchilar (server sahifalash, qidiruv, bloklash), kompaniyalarni tasdiqlash, obuna,
  AI xarajati va oylik limit, statistika, harakatlar jurnali.
- Xavfsizlik: rol × endpoint jadvali (37 endpoint × 5 rol), rate limit, CSRF, cookie, fayl yuklash.
- Production: Caddy HTTPS, avtomatik migratsiya, healthcheck, JSON xatolar logi, kunlik zaxira, tiklash.
- Avtomatik testlar: 158 ta (`npm test`).

## Nima qo'lda tekshirilmagan

| Nima                                              | Nega                                            | Qachon / kim                                     |
| ------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Haqiqiy Claude bilan CV va saralash sifati, narxi | API kaliti yo'q                                 | Kalit kelgach: 5–10 ta haqiqiy CV va talab bilan |
| Haqiqiy domen, Let's Encrypt sertifikati          | Server ma'lumotlari hali yo'q                   | Birinchi joylashda (`README.md` 2.6)             |
| Haqiqiy SMTP (spamga tushmasligi)                 | SMTP akkaunt yo'q                               | Birinchi joylashda                               |
| Docker obrazi ichida Chromium/PDF                 | Sinov muhitida obrazdan internet yopiq          | Birinchi joylashda (`deploy.sh` o'zi tekshiradi) |
| Qoraqalpoq tilidagi matnlar sifati                | Ona tili egasi ko'rmagan                        | Qoraqalpoq tilini biladigan odam                 |
| Haqiqiy foydalanuvchi bilan yuklama               | Faqat sun'iy sinov (1000 CV, 100 foydalanuvchi) | Ishga tushgach monitoring                        |
| iOS Safari va Android brauzerlari                 | Faqat Chromium da sinaldi                       | Haqiqiy telefonlarda qo'lda                      |

## Buyurtmachiga topshiriladigan kalitlar va akkauntlar

Hech biri repoda yo'q va bo'lmasligi kerak. Parol menejeri orqali topshiriladi, topshirilgandan keyin
o'zgartiriladi (ayniqsa admin paroli va SSH).

| #   | Nima                                     | Qayerda ishlatiladi           | Egasi bo'lishi kerak / izoh                                                             |
| --- | ---------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Server (IT Park) SSH kirish              | Joylash, yangilash, zaxira    | Buyurtmachi. SSH kalit bilan, parolsiz kirish tavsiya etiladi                           |
| 2   | Domen registratori va DNS akkaunti       | `DOMAIN`, A yozuvlari         | Buyurtmachi nomiga ro'yxatdan o'tgan bo'lsin                                            |
| 3   | SMTP akkaunt (login, parol)              | `SMTP_*` — tasdiqlash kodlari | Buyurtmachi domenidagi pochta yoki xat yuborish xizmati                                 |
| 4   | Anthropic Console akkaunti va API kaliti | `ANTHROPIC_API_KEY`           | Buyurtmachi (to'lov kartasi bilan). Console da ham oylik limit qo'yish tavsiya etiladi  |
| 5   | Birinchi admin (email + parol)           | `/admin`                      | Buyurtmachi; birinchi kirishdan keyin parolni almashtiradi                              |
| 6   | `AUTH_SECRET`                            | Sessiya va kod xeshlari       | Serverda yaratiladi (`openssl rand -hex 32`), faqat `.env.production` da                |
| 7   | `POSTGRES_PASSWORD`                      | Baza                          | Serverda yaratiladi, faqat `.env.production` da                                         |
| 8   | `ACME_EMAIL`                             | Let's Encrypt xabarlari       | Buyurtmachining texnik emaili. Let's Encrypt akkaunti alohida kerak emas                |
| 9   | Kod repozitoriysi (GitHub)               | Kod, tarix, yangilash         | Buyurtmachi tashkilotida. Hozircha kod lokal git da va arxivda (`exports/jumis-ai.zip`) |
| 10  | Zaxira nusxalar uchun tashqi joy         | Server buzilsa tiklash        | Buyurtmachi (boshqa server, bulut yoki kompyuter). `README.md` 6-bo'lim                 |
| 11  | (Ixtiyoriy) Monitoring (UptimeRobot)     | `/api/health` ni kuzatish     | Buyurtmachi emaili bilan                                                                |

`.env.production` faylining o'zi (serverda, `chmod 600`) yuqoridagi 3–8 ni o'z ichiga oladi.
