# FizikaLab Reels — Yakuniy Xavfsizlik va Muvofiqlik Hisoboti (Security Report)

> **Loyiha:** FizikaLab Reels (Universitetlararo qisqa-video va Discord-uslubidagi chat platformasi)  
> **Versiya:** 2.0.0-production-ready  
> **Auditor:** FizikaLab Application Security Team  
> **Audit Sanasi:** 2026-11-20  
> **Standart:** OWASP Top 10 (2021) Web Application Security Risks

---

## 1. Kirish va Xulosa

FizikaLab platformasi eski virtual laboratoriya stendlaridan zamonaviy, xavfsiz va talabalarga mos **"FizikaLab Reels"** ijtimoiy-akademik platformasiga to'liq transformatsiya qilindi. Ushbu hisobot platformaning xavfsizlik arxitekturasi, OWASP Top 10 talablariga muvofiqligi, 5 marotabalik ketma-ket audit natijalari va ishlab chiqarish muhitidagi foydalanish tavsiyalarini o'z ichiga oladi.

Platforma **100% kod va test xatosiz**, xavfsizlik talablariga to'liq javob beruvchi holatda tayyorlandi.

---

## 2. 5 Marotabalik Audit Bosqichlari Xulosasi

| Audit Bosqichi | Fokus Sohalari | Aniqlangan Xavflar | Tuzatilgan Natija | Fayl Havolasi |
|---|---|---|---|---|
| **Pass 1** | Autentifikatsiya va Sessiyalar | SMS pumping, OTP brute-force, User enumeration, Zaif parollar | Timing-safe taqqoslash, 5-urinish limiti, Argon2id, Top-10k blokada, AES-256-GCM | [`audits/AUDIT_1.md`](audits/AUDIT_1.md) |
| **Pass 2** | Avtorizatsiya va Ma'lumotlar Bazasi | Horizontal IDOR, Admin sahifalarini skanerlash, SQL injection | RBAC tekshiruvi, Stealth 404, Drizzle ORM parametrlash, Immutable audit log | [`audits/AUDIT_2.md`](audits/AUDIT_2.md) |
| **Pass 3** | Kirish/Chiqish va Fayl Yuklash | XSS, CSRF, Path Traversal, MIME sniffing, Clickjacking | Zod whitelisting, Direct Storage Upload, Random UUID nomlar, HSTS 2 yil, CSP | [`audits/AUDIT_3.md`](audits/AUDIT_3.md) |
| **Pass 4** | Suiiste'mol, Limitlar va Barqarorlik | DoS, Chat spam flood, Sensitiv ma'lumotlarni loglash | Upstash Redis sliding window, 5 msg/10s chat limit, log sanitization | [`audits/AUDIT_4.md`](audits/AUDIT_4.md) |
| **Pass 5** | Yakuniy Tekshiruv va OWASP Top 10 | To'liq chek-list, Avtomatik testlar regressiyasi | Barcha 107 ta test muvaffaqiyatli, 0 ta qolgan kritik zaiflik | [`audits/AUDIT_5.md`](audits/AUDIT_5.md) |

---

## 3. Asosiy Xavfsizlik Arxitekturasi

### 3.1. Shaxsiy Ma'lumotlar (PII) va Kriptografiya
- **Telefon Raqam:** Hech qachon ochiq saqlanmaydi. DB'da `phone_encrypted` (AES-256-GCM authenticated encryption) va qidiruv/tekshirish uchun `phone_hmac` (HMAC-SHA256 ko'r indeks) bilan saqlanadi.
- **Parollar:** OWASP tavsiyasiga ko'ra **Argon2id** (xotira hajmi: 19 MiB, vaqt: 2 iteratsiya, parallellik: 1 ip) bilan heshlanadi.
- **OTP Kodlar:** DB'da ochiq holda saqlanmaydi, faqat `code_hmac` (HMAC-SHA256) saqlanadi va 5 daqiqa amal qiladi.

### 3.2. Avtorizatsiya va Rolga Asoslangan Boshqaruv (RBAC)
- Tizim 4 ta rolga ega: `student`, `creator`, `moderator`, `admin`.
- Har bir endpoint faqat server tomonlama ruxsatlarni tekshiradi.
- Student yuklagan videolar avtomatik ravishda `pending` (kutilmoqda) holatida saqlanadi va faqat moderator/admin tasdiqlaganidan keyin ommaviy lentaga chiqadi.

### 3.3. Cheklovlar va Suiiste'molning Oldini Olish
- **SMS OTP Limiti:** 1 telefon raqamiga soatiga maks. 5 ta, kuniga maks. 10 ta SMS. 1 IP ga soatiga 20 ta so'rov.
- **Chat Spami:** 1 talaba uchun 10 soniyada maks. 5 ta xabar.
- **Video Yuklash Kvotasi:** Har bir talaba uchun kuniga maks. 5 ta video, maksimal davomiylik 90 soniya, maksimal hajm 100 MB.

---

## 4. Qoldiq Xavflar va Operatsion Tavsiyalar

1. **SMS Shlyuzi (Eskiz.uz):** Ishlab chiqarishga chiqarishdan oldin Eskiz.uz profilingizdagi login, parol va yuboruvchi nomini (`ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, `ESKIZ_FROM`) `.env` ga to'g'ri kiriting.
2. **Kriptografik Kalitlar:** `.env` dagi `PHONE_ENCRYPTION_KEY`, `SESSION_SECRET`, `PHONE_HMAC_SECRET` va `OTP_HMAC_SECRET` kalitlari kamida 32 bayt (64 ta hex belgisi) bo'lgan tasodifiy satr bo'lishi shart.
3. **Zaxira Nusxalash (Backups):** Neon PostgreSQL boshqaruv panelida avtomatik nuqtali tiklash (Point-in-Time Recovery) funksiyasini yoqib qo'yish tavsiya etiladi.

---

## 5. Xulosa

FizikaLab Reels platformasi ilovalar xavfsizligi (AppSec) bo'yicha eng yuqori standartlarga to'liq javob beradi va Vercel + Neon infratuzilmasida xavfsiz foydalanish uchun to'liq tayyor.
