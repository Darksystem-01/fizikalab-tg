# FizikaLab Reels — Xavfsizlik Siyosati (OWASP Top 10 2021)

Ushbu hujjat **FizikaLab Reels** platformasining OWASP Top 10 (2021) xavfsizlik standartlariga to'liq muvofiqligini bayon etadi.

---

## 1. OWASP Top 10 (2021) Bo'yicha Amalga Oshirilgan Himoya Qatlamlari

### A01: Broken Access Control (Buzilgan Kirish Nazorati)
- **Deny-by-default:** Har bir API handler va Server Action'da avtorizatsiya majburiy tekshiriladi.
- **RBAC:** `student`, `creator`, `moderator`, `admin` rollari server tomonda qat'iy tekshiriladi. Faqat UI'ni yashirish bilan cheklanilmaydi.
- **IDOR Himoyasi:** Foydalanuvchi faqat o'ziga tegishli resurslarni (reel, izoh, profil) tahrirlashi yoki o'chirishi mumkin. Har bir `UPDATE`/`DELETE` so'rovida `WHERE id = ? AND author_id = ?` sharti majburiydir.
- **Admin marshrutlari:** `/admin` va `/api/admin/*` marshrutlariga faqat `admin` va `moderator` huquqiga ega tasdiqlangan foydalanuvchilar kira oladi.

### A02: Cryptographic Failures (Kriptografik Xatolar)
- **HTTPS & HSTS:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` barcha javoblarda mavjud.
- **Parol Himoyasi:** `@node-rs/argon2` (argon2id) yordamida `memoryCost=19456`, `timeCost=2`, `parallelism=1` konfiguratsiyasi qo'llaniladi.
- **PII Shifrlash:** Telefon raqami AES-256-GCM bilan shifrlangan (`phone_encrypted`), qidiruv esa HMAC-SHA256 (`phone_hmac`) orqali amalga oshiriladi.
- **Xavfsiz Tasodifiylik:** Barcha tokenlar va OTP kodlari `crypto.randomBytes` va `crypto.randomInt` orqali yaratiladi (`Math.random()` taqiqlangan).
- **Timing-Safe Taqqoslash:** OTP kodlari va tokenlar `crypto.timingSafeEqual` orqali taqqoslanadi.

### A03: Injection (Inyeksiya)
- **SQL Injection:** Drizzle ORM orqali faqat parametrlangan so'rovlar yoziladi. String qo'shish (concatenation) butunlay taqiqlangan.
- **XSS (Cross-Site Scripting):** React avtomatik qochirish mexanizmi. `dangerouslySetInnerHTML` ishlatilmaydi.
- **Kirish Validatsiyasi:** Barcha so'rov parametrlari va tanasi Zod sxemalari bilan qat'iy tekshiriladi.
- **CSP (Content Security Policy):** Xavfsiz CSP sarlavhalari, faqat ruxsat etilgan media manbalari, `object-src 'none'`.

### A04: Insecure Design (Xavfsiz Bo'lmagan Loyihalash)
- Tizimli tahdid modeli (`THREAT_MODEL.md`) ishlab chiqilgan.
- SMS-pumping, bot ro'yxatdan o'tishi va hisob enumeration xavflariga qarshi oldindan chora ko'rilgan.
- Kvotalar va limitlar: talabalar uchun video maks 90s, 100MB, kuniga 5 tagacha yuklash; xabarlar uzunligi maks 2000 belgi.

### A05: Security Misconfiguration (Xavfsizlik Noto'g'ri Sozlanishi)
- Ishlab chiqarish (Production) muhitida stack-trace va ichki xatolar mijozga ko'rsatilmaydi; faqat xavfsiz `requestId` qaytadi.
- Xavfsizlik sarlavhalari: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Sir va kalitlar hech qachon gitga qo'shilmaydi (`.gitignore` qat'iy nazoratda).

### A06: Vulnerable and Outdated Components (Eskirgan va Zaif Komponentlar)
- Minimal kerakli bog'liqliklar to'plami.
- Har bir bosqichda `npm audit` orqali zaifliklar tekshiriladi.
- Qat'iy `package-lock.json` nazorati.

### A07: Identification and Authentication Failures (Autentifikatsiya Xatolari)
- Parol siyosati: kamida 8 belgi (maks 128), katta harf, kichik harf, raqam va maxsus belgi.
- Top-10,000 eng ko'p ishlatiladigan parollar qora ro'yxati tekshiriladi.
- SMS OTP xavfsizligi: 5 daqiqa amal qilish muddati, 5 ta noto'g'ri urinishdan keyin bloklanish, OTP HMAC orqali saqlanadi.
- Brute-force himoyasi: IP va telefon bo'yicha progressiv kechikishlar va vaqtinchalik bloklash.
- Foydalanuvchi mavjudligini oshkor qilmaslik (enumeration prevention): Login va tiklash xatolarida universal matn qaytariladi.
- Sessiyalar: Faqat `httpOnly`, `Secure`, `SameSite=Lax` cookie. LocalStorage'da token saqlash taqiqlangan.

### A08: Software and Data Integrity Failures (Yaxlitlik Xatolari)
- Tashqi skriptlar qat'iy cheklangan.
- Yuklangan videolar kod sifatida bajarilishi imkonsiz — ular to'g'ridan-to'g'ri statik Blob/R2 storage'dan xizmat ko'rsatiladi.

### A09: Security Logging and Monitoring Failures (Loglash va Monitoring)
- Muhim xavfsizlik voqealari (muvaffaqiyatsiz loginlar, OTP so'rovlari, rol o'zgarishlari, admin amallari) `audit_logs` jadvaliga qayd etiladi.
- Loglarda parollar, OTP kodlari, tokenlar va to'liq telefon raqamlari hech qachon yozilmaydi.

### A10: Server-Side Request Forgery (SSRF)
- Server foydalanuvchi taqdim etgan erkin URL'larga so'rov yubormaydi.
- Ichki tarmoq IP manzillariga (127.0.0.1, 10.0.0.0/8, 169.254.169.254 va h.k.) har qanday chiquvchi so'rovlar bloklangan.
