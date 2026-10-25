# 2.6 Sifat tekshiruvi: hisobot

Sana: 2026-10-25. Hamma natija lokal muhitda o'lchandi va testlar bilan tasdiqlandi
(`npm test`: 14 fayl, barcha testlar o'tdi).

## 1. Yuklama sinovi (1000 CV, 100 foydalanuvchi, AI siz)

Qanday ishga tushiriladi: [LOAD-TEST.md](LOAD-TEST.md). Skriptlar faqat lokal `*load*` bazada ishlaydi.

Ma'lumot: 1000 talaba (800 ochiq CV), 50 kompaniya, 200 talab. Bir vaqtda 100 foydalanuvchi
(60 talaba, 35 kompaniya, 5 admin), har biri 5 marta o'z sahifalarini ochadi (jami 1985 so'rov),
sahifalar orasida ~1 s o'ylaydi, hamma 10 s ichida kiradi. Bitta Node jarayoni (production build).

| Holat                                             |                   Eng sekin sahifa (p95) | Natija                                          |
| ------------------------------------------------- | ---------------------------------------: | ----------------------------------------------- |
| Boshlang'ich (tuzatishlardan oldin, o'ylashsiz)   |                   5.3 s (`/admin/users`) | 3 s dan sekin                                   |
| Tuzatishlardan keyin, DB ulanishlari 9 (standart) |                                    1.8 s | hammasi < 3 s, xato 0                           |
| Tuzatishlardan keyin, DB ulanishlari 20           | 1.9 s (POST saralash), sahifalar ≤ 1.1 s | hammasi < 3 s, xato 0                           |
| Stress: o'ylashsiz, ~57 so'rov/s, ulanishlar 9    |                        16.8 s (`/admin`) | 3 s dan sekin                                   |
| Stress: o'ylashsiz, ~57 so'rov/s, ulanishlar 20   |                    2.6 s (POST saralash) | p95 < 3 s, xato 0 (alohida so'rovlar max 5.5 s) |

Bitta so'rov yuklamasiz: 20–60 ms. Nomzodlarni filtrlash SQL so'rovi: ~12 ms. Admin qidiruvi
(1000 foydalanuvchi): ~4 ms.

### Topilgan sekinliklar va tuzatish

1. **Gzip Node ichida** CPU ni band qilardi. `compress: false`; siqish 2.7-qadamda Caddy ga o'tadi.
2. **Har sahifa HTML iga barcha tarjimalar** (4 tildagi 381 kalit) qo'shilardi. Endi har bo'lim
   faqat o'z tarjimalarini yuboradi (`ClientMessages`): kompaniya sahifasi 41.7 → 35 KB,
   kirish sahifasi 29.8 → 18.9 KB.
3. **N+1:** `currentUser` bir so'rov ichida bir necha marta bazaga borardi (layout, sahifa, header).
   Endi React `cache()` bilan bir so'rovga bitta.
4. **DB ulanish hovuzi:** docker-compose da `connection_limit=20` (9 da so'rovlar navbat kutardi).
5. Indekslar: barcha ro'yxatlar sahifalangan (`take`), kerakli indekslar 2.1–2.5 da qo'yilgan
   (CV `searchText` trigram, `skills` GIN, `Match(vacancyId, score)` va boshqalar). Yangi indeks
   kerak bo'lmadi.

### Chegaralar (ochiq aytaman)

- **Stress chegarasi:** o'ylashsiz ~57 so'rov/s da bitta Node jarayoni CPU ga yaqinlashadi: p95
  < 3 s, lekin ayrim so'rovlar 5.5 s gacha. Bu 100 ta real foydalanuvchidan ancha og'ir yuklama.
  Undan ko'pi uchun kuchliroq server yoki bir nechta jarayon kerak; hozirgi rate limit va saralash
  qulfi xotirada, ko'p jarayonda ular Redis/Postgres ga ko'chishi kerak.
- O'lchov sinov konteynerida (umumiy CPU) qilindi; real serverda raqamlar boshqacha bo'ladi.
- **Real AI sinalmadi** (API kalit yo'q). AI bilan saralash har 10 nomzodga bitta LLM chaqiruvi
  qo'shadi; natija keshlanadi.

## 2. Ruxsat jadvali (rol × endpoint)

`tests/permissions.test.ts` har bir endpointni 5 rol bilan chaqiradi va kutilgan javobni tekshiradi.
Test `src/app/api` dagi barcha handlerlarni o'zi topadi: jadvalga qo'shilmagan yangi endpoint
testni yiqitadi. ✓ = ruxsat bor (401/403 emas).

Kompaniya (kutmoqda) = admin hali tasdiqlamagan kompaniya.

| Metod  | Endpoint                                       | Mehmon | Talaba | Kompaniya (kutmoqda) | Kompaniya (tasdiqlangan) | Admin |
| ------ | ---------------------------------------------- | :----: | :----: | :------------------: | :----------------------: | :---: |
| GET    | `/api/health`                                  |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/register`                           |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/verify`                             |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/resend`                             |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/login`                              |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/forgot`                             |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/reset`                              |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| POST   | `/api/auth/logout`                             |   ✓    |   ✓    |          ✓           |            ✓             |   ✓   |
| GET    | `/api/me`                                      |  401   |   ✓    |          ✓           |            ✓             |   ✓   |
| GET    | `/api/cv/me`                                   |  401   |   ✓    |         403          |           403            |  403  |
| PUT    | `/api/cv/me`                                   |  401   |   ✓    |         403          |           403            |  403  |
| PATCH  | `/api/cv/me/visibility`                        |  401   |   ✓    |         403          |           403            |  403  |
| GET    | `/api/cv/me/pdf`                               |  401   |   ✓    |         403          |           403            |  403  |
| POST   | `/api/cv/generate`                             |  401   |   ✓    |         403          |           403            |  403  |
| GET    | `/api/cv/:id`                                  |  401   |  403   |         403          |            ✓             |  403  |
| GET    | `/api/cv/:id/pdf`                              |  401   |  403   |         403          |            ✓             |  403  |
| GET    | `/api/company/me`                              |  401   |  403   |          ✓           |            ✓             |  403  |
| PUT    | `/api/company/me`                              |  401   |  403   |          ✓           |            ✓             |  403  |
| GET    | `/api/company/me/logo`                         |  401   |  403   |          ✓           |            ✓             |  403  |
| POST   | `/api/company/me/logo`                         |  401   |  403   |          ✓           |            ✓             |  403  |
| DELETE | `/api/company/me/logo`                         |  401   |  403   |          ✓           |            ✓             |  403  |
| GET    | `/api/vacancies`                               |  401   |  403   |          ✓           |            ✓             |  403  |
| POST   | `/api/vacancies`                               |  401   |  403   |          ✓           |            ✓             |  403  |
| GET    | `/api/vacancies/:id`                           |  401   |  403   |          ✓           |            ✓             |  403  |
| PUT    | `/api/vacancies/:id`                           |  401   |  403   |          ✓           |            ✓             |  403  |
| POST   | `/api/vacancies/:id/match`                     |  401   |  403   |         403          |            ✓             |  403  |
| GET    | `/api/vacancies/:id/matches`                   |  401   |  403   |         403          |            ✓             |  403  |
| PUT    | `/api/vacancies/:id/candidates/:cvId/decision` |  401   |  403   |         403          |            ✓             |  403  |
| GET    | `/api/admin/stats`                             |  401   |  403   |         403          |           403            |   ✓   |
| GET    | `/api/admin/users`                             |  401   |  403   |         403          |           403            |   ✓   |
| PATCH  | `/api/admin/users/:id/status`                  |  401   |  403   |         403          |           403            |   ✓   |
| GET    | `/api/admin/companies`                         |  401   |  403   |         403          |           403            |   ✓   |
| PATCH  | `/api/admin/companies/:id/approve`             |  401   |  403   |         403          |           403            |   ✓   |
| PATCH  | `/api/admin/companies/:id/subscription`        |  401   |  403   |         403          |           403            |   ✓   |
| GET    | `/api/admin/ai`                                |  401   |  403   |         403          |           403            |   ✓   |
| PUT    | `/api/admin/ai`                                |  401   |  403   |         403          |           403            |   ✓   |
| GET    | `/api/admin/logs`                              |  401   |  403   |         403          |           403            |   ✓   |

Rol ustiga egalik ham tekshiriladi (alohida testlarda): kompaniya faqat o'z talablarini ko'radi
(boshqasiniki 404), `/api/cv/:id` faqat ochiq va saqlangan CV ni beradi, talaba boshqa talabaning
CV siga kira olmaydi.

## 3. Xavfsizlik tekshiruvi

| Nima                | Holat                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Sirlar gitda        | Git tarixida faqat namunaviy qiymatlar (`.env.example`, hujjatdagi `xxxx`). `.env*` gitignore da, `load-sessions*.json` ham qo'shildi. |
| Parollar            | argon2.                                                                                                                                |
| Cookie              | `httpOnly`, `sameSite=lax`, production da `secure`, bazada token xeshi saqlanadi, 7 kun. Bloklanganda sessiyalar o'chiriladi.          |
| CSRF                | Har o'zgartiruvchi so'rovda `Origin` tekshiriladi. Auth formalari `method="post"` (JS yuklanmasa ham parol URL ga tushmaydi).          |
| HTTPS               | Ilova `Strict-Transport-Security` sarlavhasini yuboradi. Sertifikat va HTTP→HTTPS Caddy da, **2.7-qadamda**.                           |
| Fayl yuklash (logo) | Faqat PNG/JPEG/WebP (fayl ichidagi "magic bytes" bo'yicha), ≤ 1 MB, `public/` da emas, API orqali `CSP: sandbox` bilan beriladi.       |
| Rate limit          | Kirish, ro'yxatdan o'tish, kod, AI, saralash, CV ko'rish, admin amallari.                                                              |
| Xato javoblari      | Ichki xato tafsiloti foydalanuvchiga ko'rsatilmaydi.                                                                                   |

### Topilgan va tuzatilgan kamchiliklar

1. **Chunked so'rov hajm chegarasini aylanib o'tardi.** `Content-Length` siz yuborilgan katta tana
   xotiraga to'liq o'qilardi. Endi tana o'qish chegarada to'xtaydi (`readBodyLimited`): JSON
   > 100 KB va logo > 1 MB darhol 413. Test: 5 MB chunked so'rov.
2. **IP rate limitni `X-Forwarded-For` bilan aldash mumkin edi.** Mijoz sarlavhaning birinchi
   qiymatini o'zi yozib, har so'rovda "yangi IP" bo'lib ko'rinardi. Endi oxirgi qiymat (proksi
   qo'shgani) olinadi. Test: soxta IP lar bilan ham 11-urinish 429.
3. HSTS sarlavhasi qo'shildi. PDF endpointi uchun shriftlar standalone build ga kiritildi.

### 2.7 (deploy) uchun qolgan shartlar

- Caddy: HTTPS, `encode gzip zstd`, `request_body max_size`, `X-Forwarded-For` ni o'zi qo'ysin
  (mijoznikini almashtirsin).
- Rate limit xotirada: bitta jarayon uchun to'g'ri; serverni qayta ishga tushirsa nolga tushadi.

## 4. Topshiriqdagi ikki xato takrorlanmaydi

`tests/spec-regressions.test.ts`:

1. **Tasdiqlash kodi ekranda yo'q.** Ro'yxatdan o'tish, qayta yuborish, tasdiqlash, parolni
   tiklash oqimlarida kod (emaildan olinadi) hech bir API javobi tanasida, sarlavhasida va
   konsol logida yo'qligi tekshiriladi; bazada faqat xesh. Qo'shimcha: kod yaratadigan barcha
   fayllar kodni `NextResponse.json` yoki `console` ga bermasligi statik tekshiriladi. Brauzer
   sinovida ham sahifa HTML ida va server logida kod topilmadi.
2. **Foydalanuvchilar ro'yxati to'liq yuklanmaydi.** 1000 foydalanuvchi bilan `/api/admin/users`
   20 ta qaytaradi (`total: 1001`), javob < 15 KB, bazaga `take: 20` bilan boriladi, `pageSize` /
   `take` parametrlari bilan ko'proq so'rab bo'lmaydi. Kompaniyalar ro'yxati ham shunday.
