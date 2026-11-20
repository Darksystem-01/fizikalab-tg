# FizikaLab Reels — Arxitektura va Texnik Qarorlar (ADR)

Ushbu hujjat loyiha transformatsiyasi davomida qabul qilingan texnik qarorlar va ularning sabablarini hujjatlashtiradi.

---

## ADR 001: ORM Tanlovi — Drizzle ORM
* **Holat:** Qabul qilindi.
* **Kontekst:** Vercel Serverless + Neon PostgreSQL arxitekturasi uchun ORM tanlash talab qilindi (Drizzle yoki Prisma).
* **Qaror:** **Drizzle ORM** (`drizzle-orm` va `drizzle-kit`) tanlandi.
* **Sabablari:**
  1. *Zero cold-start overhead:* Drizzle og'ir binary Rust dvigatelisiz sof TypeScript SQL builder sifatida ishlaydi. Serverless muhitda uyg'onish (cold-start) deyarli sezilmaydi.
  2. *Edge/Serverless mosligi:* `@neondatabase/serverless` drayveri bilan to'g'ridan-to'g'ri WebSocket va HTTP orqali bir xil darajada mukammal ishlaydi.
  3. *Type Safety & SQL Nazorati:* SQL so'rovlari va indekslari ustidan to'liq shaffof nazorat.

---

## ADR 002: Parol Hesh — Argon2id
* **Holat:** Qabul qilindi.
* **Kontekst:** Foydalanuvchi parollarini saqlash xavfsizligi (bcrypt, scrypt, pbkdf2 yoki argon2).
* **Qaror:** `@node-rs/argon2` orqali **argon2id** algoritmi tanlandi.
* **Konfiguratsiya:** `memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1`.
* **Sabablari:**
  1. OWASP Top 10 va Password Storage Cheat Sheet tavsiyalariga to'liq mos keladi.
  2. GPU va ASIC brute-force hujumlariga qarshi xotira-qattiq (memory-hard) himoya.
  3. Side-channel va timing hujumlariga qarshi chidamli.

---

## ADR 003: Shaxsiy Ma'lumotlarni (PII) Shifrlash — Telefon Raqami
* **Holat:** Qabul qilindi.
* **Kontekst:** Telefon raqamlari qonunchilik va OWASP bo'yicha nozik shaxsiy ma'lumot (PII) hisoblanadi. Bazaga to'g'ridan-to'g'ri ochiq matnda saqlash taqiqlangan.
* **Qaror:** Dual-field modeli: `phone_hmac` va `phone_encrypted`.
* **Sabablari:**
  1. `phone_hmac` (HMAC-SHA256 maxfiy tuz bilan): Ma'lumotlar bazasida `UNIQUE` indeks va qidiruv uchun deterministik ko'rsatkich.
  2. `phone_encrypted` (AES-256-GCM har safar tasodifiy IV bilan): Raqamni faqat SMS yuborish zarurati bo'lganda serverda dekodlash imkonini beradi.
  3. Boshqa foydalanuvchilar yoki ommaviy API hech qachon boshqa odamning telefon raqamini ko'rmaydi.

---

## ADR 004: Video Saqlash va Oqim — Direct-to-Storage Upload
* **Holat:** Qabul qilindi.
* **Kontekst:** Talabalar va adminlar 100MB gacha bo'lgan videolarni yuklaydi. Vercel Serverless funksiyalarining so'rov tanasi chegarasi ~4.5MB.
* **Qaror:** Videoni to'g'ridan-to'g'ri klientdan storage'ga yuklash (Vercel Blob upload tokens yoki Cloudflare R2 presigned URLs).
* **Sabablari:**
  1. Serverless RAM va timeout cheklovlaridan holi.
  2. Server funksiyasi faqat token beradi va yuklash tugagach webhook orqali DB metadatasini yangilaydi.
  3. Server orqali katta media fayllarni o'tkazish server narxini va sekinlashuvni keskin oshiradi.

---

## ADR 005: Dastur Cheklovi — Sun'iy Intellekt Video Generatsiyasi Yo'qligi
* **Holat:** Qabul qilindi va qat'iy cheklandi.
* **Kontekst:** Platformaning vazifasi tayyor videolarni namoyish qilish va moderatsiya qilish.
* **Qaror:** Dastur hech qanday AI video yaratish, animatsiya render qilish yoki avtomatik montaj funksiyasini o'z ichiga olmaydi.
* **Sabablari:**
  1. Belgilangan arxitektura talablarining 1.1-bandiga muvofiqlik.
  2. Barqarorlik va ortiqcha hisoblash xarajatlarini oldini olish.

---

## ADR 006: Realtime Universitet Chati — Serverless External Provider
* **Holat:** Qabul qilindi.
* **Kontekst:** Next.js Vercel Serverless muhitida mustaqil doimiy WebSocket server ishlatish imkonsiz.
* **Qaror:** Realtime xabarlar uchun tashqi ixtisoslashgan provayder (Ably yoki Pusher Channels) integratsiya qilinadi.
* **Sabablari:**
  1. Serverless funksiyalari xabar yuborilganda provayder REST API'siga trigger yuboradi.
  2. Klient to'g'ridan-to'g'ri provayderga xavfsiz token bilan ulanib, xabarlarni real vaqtda oladi.
  3. Ulanish uzilganda avtomatik qayta ulanish va DB cursor orqali tarixni to'ldirish (backfill).

---

## ADR 007: Eski Simulyatsiya Stendlarini Arxivlash (`/legacy-labs`)
* **Holat:** Qabul qilindi.
* **Kontekst:** Yangi platforma reels va chatga yo'naltirilgan, biroq avval ishlab chiqilgan 8 ta bob simulyatsiyalari va 107 ta test qiymatlari saqlanishi kerak.
* **Qaror:** Barcha simulyatsiya sahifalari va yordamchi modullar `/legacy-labs` katalogi orqali to'liq saqlab qolindi.
