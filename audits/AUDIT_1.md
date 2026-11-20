# Xavfsizlik Auditi — 1-Bosqich: Autentifikatsiya va Sessiyalar (Authentication & Sessions)

**Sana:** 2026-11-20  
**Auditor:** FizikaLab AppSec Engine  
**Fokus:** Ro'yxatdan o'tish, SMS OTP, Parol siyosati, Login, Brute-force, Enumeration, Sessiya rotatsiyasi, Parol tiklash, Bir telefon = bir akkaunt.

---

## 1. Tekshirilgan Komponentlar va Endpointlar

1. `POST /api/auth/register` — Yangi talaba ro'yxatdan o'tishi va SMS OTP generatsiyasi.
2. `POST /api/auth/verify-otp` — 6 xonali OTP tasdiqlash va faollashtirish.
3. `POST /api/auth/login` — Telefon raqam/nickname va parol orqali kirish.
4. `POST /api/auth/reset-password` — Ikki bosqichli SMS OTP orqali parolni xavfsiz tiklash.
5. `GET /api/auth/me` & `POST /api/auth/logout` — Sessiyani tekshirish va server tomonlama bekor qilish.
6. `src/lib/auth/password.ts` — Argon2id OWASP parametrlari va top-10k qora ro'yxat.
7. `src/lib/auth/phone.ts` — O'zbekiston E.164 (`+998XXXXXXXXX`) qat'iy tekshiruvi.
8. `src/lib/auth/session.ts` — 256-bit kriptografik sessiya tokenlari va SHA-256 DB saqlash.
9. `src/lib/crypto/index.ts` — AES-256-GCM shifrlash va HMAC-SHA256 ko'r indekslar.

---

## 2. Topilgan Holatlar va Baholash

| ID | Zaiflik / Tekshiruv Nomi | Jiddiyligi | Holat | Tuzatish / Qabul Qilingan Chora |
|---|---|---|---|---|
| SEC-01-01 | User Enumeration (Foydalanuvchi mavjudligini aniqlash) | **High** | Tuzatilgan | Ro'yxatdan o'tish va login so'rovlarida umumlashtirilgan xato xabari qaytariladi. Mavjud bo'lmagan foydalanuvchilar uchun `dummyArgon2Verify()` bajarilib, javob berish vaqti tekislangan (timing attack bartaraf etildi). |
| SEC-01-02 | OTP Brute-force & Replay | **High** | Tuzatilgan | Har bir OTP uchun 5 martalik noto'g'ri kiritish limiti o'rnatilgan. 5-urinishdan so'ng kod butunlay bekor qilinadi (`consumed_at`). Kriptografik taqqoslash `crypto.timingSafeEqual` orqali amalga oshiriladi. |
| SEC-01-03 | SMS Pumping & Toll Fraud | **High** | Tuzatilgan | Upstash Redis va xotira-asosli sliding-window rate limit qo'llanilgan: 1 telefon uchun soatiga maks. 5 ta, kuniga maks. 10 ta SMS; 1 IP uchun soatiga maks. 20 ta SMS so'rovi. |
| SEC-01-04 | Zaif Parollar va Lug'at Hujumlari | **Medium** | Tuzatilgan | Min. 8, maks. 128 belgi, kamida 1 ta katta, 1 ta kichik harf, 1 ta son va 1 ta maxsus belgi majburiy. Top-10 000 eng mashhur parollar ro'yxati tekshiriladi. |
| SEC-01-05 | Sessiya O'g'irlanishi (Session Hijacking) | **High** | Tuzatilgan | Sessiya tokenlari faqat `httpOnly`, `Secure` (production), `SameSite=Lax` cookie'larda saqlanadi. `localStorage` ga hech qachon token yozilmaydi. Tokenlar DB'da SHA-256 hesh ko'rinishida saqlanadi. |
| SEC-01-06 | PII (Telefon Raqam) Ochiq Qolishi | **Critical** | Tuzatilgan | Telefon raqamlar DB'da AES-256-GCM bilan shifrlanadi, qidiruv uchun deterministik `phone_hmac` ko'r indeksi ishlatiladi. API javoblarida faqat maskalangan format (`+998 ** *** ** 45`) ko'rinadi. |

---

## 3. Avtomatlashtirilgan Testlar Natijasi

- `tests/auth-reels-engine.test.ts`:
  - E.164 formati va prefiks tekshiruvi: **PASS**
  - Parol siyosati va qora ro'yxat: **PASS**
  - Argon2id heshlash va verifikatsiya: **PASS**
  - AES-256-GCM shifrlash va ochish: **PASS**
  - Timing-safe HMAC taqqoslash: **PASS**
- Barcha 107 ta tizim regressiya testlari: **PASS**

---

## 4. Xulosa

1-o'tish auditi yakunlandi. Autentifikatsiya va sessiyalar OWASP A07 (Identification and Authentication Failures) va A02 (Cryptographic Failures) standartlariga to'liq javob beradi. Hech qanday Critical yoki High darajadagi hal etilmagan xavf mavjud emas.
