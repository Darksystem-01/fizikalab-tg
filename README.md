# FizikaLab Reels — Universitetlararo Fizika va Qisqa-Video Platformasi 🚀

> **"Fizika har bir talabaning ekranida — 60 soniyada!"**  
> O'zbekiston oliy ta'lim tizimi talabalari va o'qituvchilari uchun mo'ljallangan ijtimoiy qisqa-video (reels) va Discord-uslubidagi ilmiy chat platformasi.

---

## 🌟 Yangi Arxitektura va Asosiy Imkoniyatlar

FizikaLab 2.0 platformasi talabalar qiziqishiga mos ravishda to'liq qayta qurildi:

1. **Reels Lentasi (`/`):**
   - Mobil-first, vertikal to'liq ekranli skroll (TikTok/Instagram Reels tajribasi).
   - Avtomatik ijro (muted boshlanadi, tap orqali ovoz yoqiladi), aqlli preloading (trafikni tejash).
   - Umumiy fizika kursining **8 ta asosiy bo'limi filtri**:
     - *Mexanika*, *Molekulyar fizika va termodinamika*, *Elektr*, *Magnetizm*, *Tebranishlar va to'lqinlar*, *Optika*, *Kvant fizikasi*, *Atom va yadro fizikasi*.
   - **Interaktiv Masala Yechish Modali:** Har bir videoda masala sharti (`problemText`), maxfiy yechim (`answerText` - "Javobni ko'rish" tugmasi ortida) va yo'naltiruvchi maslahat (`hint`).
   - Layk, saqlash, 1-darajali ichma-ich izohlar va alohida permalink (`/r/[id]`) orqali ulashish.

2. **Discord Uslubidagi Universitet Chati (`/chat`):**
   - Realtime akademik muloqot zali (Ably integratsiyasi va HTTP polling fallback).
   - Kanallar strukturasi: `#umumiy`, `#savol-javob`, `#e'lonlar` (faqat ma'murlar yozadi), fan kanallari (`#mexanika`, `#optika`...) va `#tasodifiy`.
   - Xabarga javob qaytarish (reply), inline tahrirlash, o'chirish, emoji reaksiyalar va `@nickname` eslatmalar.

3. **Xavfsiz Ro'yxatdan O'tish va Autentifikatsiya:**
   - Taxallus (nickname) + O'zbekiston telefon raqami (`+998XXXXXXXXX` E.164).
   - SMS OTP tasdiqlash (Eskiz.uz shlyuzi + rivojlantirish muhiti dev-logger).
   - Argon2id OWASP standartidagi parol heshlash (19 MiB xotira, 2 iteratsiya).
   - Top-10 000 zaif parollar qora ro'yxati va real vaqtda parol kuchi indikatori.
   - PII himoyasi: Telefon raqamlar DB'da **AES-256-GCM** bilan shifrlanadi, ko'r indeks (`phone_hmac`) orqali qidiriladi va boshqa talabalarga hech qachon oshkor qilinmaydi.
   - Sessiyalar faqat `httpOnly`, `Secure`, `SameSite=Lax` cookie orqali boshqariladi.

4. **Klientdan To'g'ridan-To'g'ri Yuklash va CMS (`/admin`):**
   - Serverless xotira cheklovini chetlab o'tish uchun to'g'ridan-to'g'ri bulutli storage (Vercel Blob / Cloudflare R2) yuklash pipeline'i.
   - Talabalar uchun kvota: kuniga maks. 5 ta yuklash, maks. 90 soniya, maks. 100 MB.
   - Moderatsiya navbati (`pending` -> tasdiqlash yoki sabab bilan rad etish).
   - Stealth 404: Boshqaruv paneli oddiy foydalanuvchilarga bildirilmaydi (404 Not Found qaytaradi).
   - O'zgarmas xavfsizlik audit jurnali (`audit_logs`).

5. **Eski Laboratoriyalar Arxivlangan (`/legacy-labs`):**
   - Ilgari yaratilgan barcha 75+ interaktiv fizika stendlari, RK4 integratori va hisoblash yadrosi o'chirilmagan, toza holda `/legacy-labs` sahifasida saqlangan.

---

## 🛠 Texnologiyalar Steki

- **Dastur Tili:** TypeScript (100% turlangan, nol any)
- **Frontend / Backend:** Next.js (App Router, Turbopack)
- **Stil:** Tailwind CSS
- **Ma'lumotlar Bazasi:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **ORM:** Drizzle ORM (`drizzle-kit` migratsiyalari bilan)
- **Parol Hesh:** `@node-rs/argon2` (Argon2id)
- **SMS Gateway:** Eskiz.uz API abstraction (`SmsProvider`)
- **Rate Limit:** Upstash Redis (`@upstash/ratelimit`) + in-memory fallback
- **Realtime:** Ably REST / Realtime + in-memory event bus
- **Media Storage:** Vercel Blob / Cloudflare R2

---

## 🚀 Mahalliy Ishga Tushirish (Local Setup)

### 1. Reponi klonlash va paketlarni o'rnatish:
```bash
git clone https://github.com/Darksystem-01/fizika-lab.git
cd fizika-lab
npm install
```

### 2. Muhit o'zgaruvchilarini sozlash:
`.env.example` faylidan `.env.local` nusxasini oling:
```bash
cp .env.example .env.local
```
Lokal rejimda rivojlantirish uchun barcha sirlar o'rnatilmagan bo'lsa ham tizim dev-fallback rejimida (SMS konsolga chiqadi, chat polling bilan ishlaydi, baza lokal sinovda ishlaydi) ishlayveradi.

### 3. Ma'lumotlar bazasini tayyorlash:
Neon PostgreSQL bazangiz ulanish satrini (`DATABASE_URL`) kiritgach:
```bash
# Migratsiyalarni amalga oshirish:
npm run db:push
# yoki Drizzle migratsiya fayllarini yurgazish:
npx drizzle-kit push
```

### 4. Dasturni ishga tushirish:
```bash
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.

---

## 🧪 Sinovlar va Sifat Nazorati (Testing)

Loyiha to'liq avtomatlashtirilgan testlar to'plami bilan ta'minlangan:

```bash
# Barcha 107 ta tizim va fizik hisoblash testlari:
npm test

# Autentifikatsiya, SMS va Kriptografiya testi:
npx tsx --test tests/auth-reels-engine.test.ts

# Realtime Chat va Rate Limit testi:
npx tsx --test tests/chat-engine.test.ts

# Production build tekshiruvi:
npm run build
```

---

## ☁️ Vercel Orqali Deploy Qilish

1. [Vercel](https://vercel.com) boshqaruv panelida yangi loyiha oching va GitHub repozitoriyasini bog'lang.
2. Vercel **Environment Variables** bo'limida `.env.example` dagi o'zgaruvchilarni kiriting:
   - `DATABASE_URL` (Neon pooled `-pooler` ulanish satri)
   - `DATABASE_URL_UNPOOLED` (Neon direct ulanish satri)
   - `SESSION_SECRET`, `PHONE_HMAC_SECRET`, `PHONE_ENCRYPTION_KEY`, `OTP_HMAC_SECRET` (kamida 32-belgili tasodifiy satrlar)
   - `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, `ESKIZ_FROM` (Eskiz.uz hisobingizdan)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Upstash konsolidan)
   - `ABLY_API_KEY` (Ably boshqaruv panelidan)
   - `BLOB_READ_WRITE_TOKEN` (Vercel Storage yorlig'idan 1 click bilan)
   - `INITIAL_ADMIN_PHONE` (o'zingizning O'zbekiston raqamingiz, masalan: `+998901234567`)
3. **Deploy** tugmasini bosing. Loyiha avtomatik yig'iladi va jonli efirga chiqadi!

---

## 📚 Hujjatlar

- [Arxitektura va Ma'lumotlar Oqimi (ARCHITECTURE.md)](ARCHITECTURE.md)
- [Texnik Qarorlar Jurnali (DECISIONS.md)](DECISIONS.md)
- [Xavfsizlik Siyosati (SECURITY.md)](SECURITY.md)
- [Tahdid Modeli (THREAT_MODEL.md)](THREAT_MODEL.md)
- [Yakuniy Xavfsizlik Hisoboti (SECURITY_REPORT.md)](SECURITY_REPORT.md)
- [5 Marotabalik Xavfsizlik Auditi Jurnallari](audits/)
- [Ma'mur va Moderator Qo'llanmasi (docs/ADMIN_GUIDE.md)](docs/ADMIN_GUIDE.md)
- [API Spetsifikatsiyasi (docs/API.md)](docs/API.md)

---

## 📄 Litsenziya

FizikaLab Reels ochiq manbali akademik ta'limiy loyihadir. Barcha huquqlar himoyalangan.
