# FizikaLab Reels — Tizim Arxitekturasi

Ushbu hujjat **FizikaLab** platformasining qisqa vertikal videolar (reels) va universitetlararo talabalar chati platformasiga transformatsiya qilingan arxitekturasini bayon qiladi.

---

## 1. Tizim Ko'rinishi va Maqsadi

```
                                  +------------------------------------+
                                  |         Klient (Browser)           |
                                  |  - Reels Feed (Vertikal Skroll)    |
                                  |  - Masala & Yechim Darchasi        |
                                  |  - Discord-uslubida Talabalar Chati|
                                  |  - To'g'ridan-to'g'ri Video Yuklash|
                                  +-----------------+------------------+
                                                    |
                                                    | HTTPS (HSTS / TLS 1.3)
                                                    v
                                  +------------------------------------+
                                  |    Vercel Serverless (Next.js 16)  |
                                  |  - Next.js App Router (SSR & RSC)  |
                                  |  - API Handlerlar (Zod Validatsiya)|
                                  |  - Argon2id & HMAC Auth Engine     |
                                  |  - RBAC & IDOR Server Tekshiruvlari|
                                  +--------+--------+--------+---------+
                                           |        |        |
         +---------------------------------+        |        +---------------------------------+
         |                                          |                                          |
         v                                          v                                          v
+-----------------------+              +-----------------------+              +-----------------------+
|   Neon PostgreSQL     |              |     Upstash Redis     |              |      Ably / Pusher    |
| (Drizzle ORM Pooled)  |              |   (Rate-Limiting &    |              |  (Realtime WebSocket  |
| - Users & HMAC PII    |              |    Token Buckets)     |              |    Kanallar & Chat)   |
| - Reels & Metadata    |              +-----------------------+              +-----------------------+
| - Comments & Likes    |
| - Channels & Messages |
+-----------------------+
```

---

## 2. Asosiy Qatlamlar

### 2.1. Frontend Qatlami (Next.js 16 App Router)
- **`/` — Reels Lentasi:** To'liq ekranli mobil-first vertikal lenta. `IntersectionObserver` yordamida videolarni avtomatik ijro qilish/pauza qilish, ovozsiz boshlash, faqat joriy va keyingi videoning metadata ma'lumotlarini yuklash orqali tarmoq trafigini tejash.
- **`/r/[id]` — Reel Permalink:** Alohida reel havolasi, Open Graph meta-teglari bilan ijtimoiy tarmoqlarda ulashish uchun optimallashtirilgan.
- **`/chat` — Universitetlararo Chat:** Discord-uslubidagi guruh kanallari (`#umumiy`, `#savol-javob`, `#mexanika`, va h.k.).
- **`/admin` — CMS & Moderatsiya:** Faqat `admin` va `moderator` rollari uchun server tomonda tekshiriluvchi boshqaruv konsoli.
- **`/auth/*` — Ro'yxatdan O'tish & Kirish:** Nickname + O'zbekiston telefon raqami (`+998XXXXXXXXX`) + SMS OTP + Argon2id parol bilan xavfsiz autentifikatsiya portali.
- **`/legacy-labs` — Virtual Simulyatsiyalar Arxivi:** Avvalgi Runge-Kutta va interaktiv hisoblash laboratoriyalari saqlangan bo'lim.

### 2.2. Backend & Xavfsizlik Qatlami
- **Drizzle ORM + Neon PostgreSQL:**
  - Barcha ma'lumotlar bazasi so'rovlari qat'iy parametrlangan (SQL injection imkonsiz).
  - Aloqa ulanishlari PgBouncer (`DATABASE_URL`, pooled) va to'g'ridan-to'g'ri DDL migratsiyalari (`DATABASE_URL_UNPOOLED`) orqali ajratilgan.
- **Kriptografik Ma'lumotlarni Himoyalash:**
  - Telefon raqamlar DB'da ochiq holda saqlanmaydi:
    - `phone_hmac`: HMAC-SHA256 (server siri bilan) qidirish va `UNIQUE` cheklovi uchun.
    - `phone_encrypted`: AES-256-GCM (IV + Auth Tag) orqali shifrlangan saqlanadi va faqat SMS yuborishda ochiladi.
  - Parollar: `@node-rs/argon2` (argon2id, memoryCost=19456, timeCost=2, parallelism=1).
- **Video Saqlash (Direct Client Upload):**
  - Foydalanuvchilar va adminlar yuklayotgan video fayllari Vercel serverless funksiyasining 4.5MB chegarasiga urilmasligi uchun to'g'ridan-to'g'ri storage (Vercel Blob / R2) orqali imzolangan upload tokenlar bilan yuklanadi.
- **Dastur Doirasi Cheklovi:**
  - Tizim hech qanday sun'iy intellekt orqali video generatsiya qilmaydi yoki render qilmaydi. Tizim faqat tayyor videolarni yuklash, tekshirish, saqlash, ko'rsatish va moderatsiya qilish vositasidir.

---

## 3. Papkalar Strukturasi

```
fizika-lab/
├── drizzle/                  # Neon PostgreSQL SQL migratsiyalari
├── public/                   # Statik aktivlar (universitet rasmiy logotiplari)
├── src/
│   ├── app/                  # Next.js App Router marshrutlari
│   │   ├── admin/            # CMS boshqaruv paneli
│   │   ├── api/              # Backend API marshrutlari
│   │   │   ├── admin/        # Moderatsiya va CMS API
│   │   │   ├── auth/         # Ro'yxatdan o'tish, SMS OTP, Login, Logout
│   │   │   ├── chat/         # Xabarlar, kanallar, reaksiyalar
│   │   │   ├── reels/        # Reels lentasi, layklar, izohlar, masalalar
│   │   │   └── upload/       # Direct client upload tokenlari
│   │   ├── auth/             # Login va SMS OTP ro'yxatdan o'tish UI
│   │   ├── chat/             # Discord-uslubidagi chat UI
│   │   ├── legacy-labs/      # Arxivlangan simulyatsiya stendlari
│   │   ├── r/[id]/           # Reel permalink sahifasi
│   │   ├── profile/          # Foydalanuvchi profili
│   │   └── page.tsx          # Asosiy sahifa: Vertikal Reels Feed
│   ├── components/           # UI komponentlar (ReelCard, ChatRoom, Nav)
│   ├── db/                   # Drizzle ORM sxemalari, ulanish va seed
│   │   ├── index.ts          # Neon client (pooled & direct)
│   │   ├── schema.ts         # Barcha jadvallar ta'rifi
│   │   └── seed.ts           # Boshlang'ich mavzular, kanallar, admin seed
│   ├── lib/                  # Biznes mantiq va xavfsizlik
│   │   ├── auth/             # Argon2id, parol siyosati, sessiya boshqaruvi
│   │   ├── crypto/           # AES-256-GCM, HMAC-SHA256, timingSafeEqual
│   │   ├── realtime/         # Ably/Pusher event dispatcher
│   │   ├── sms/              # Eskiz.uz provayderi va dev logger fallback
│   │   └── validation/       # Zod sxemalari
│   └── types/                # Umumiy TypeScript turlari
├── tests/                    # Avtomatik xavfsizlik va integratsiya testlari
├── ARCHITECTURE.md
├── DECISIONS.md
├── SECURITY.md
└── THREAT_MODEL.md
```
