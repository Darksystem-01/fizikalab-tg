# Xavfsizlik Auditi — 3-Bosqich: Kirish/Chiqish Xavfsizligi va Fayllar (Input/Output & Uploads)

**Sana:** 2026-11-20  
**Auditor:** FizikaLab AppSec Engine  
**Fokus:** Zod validatsiya, XSS, CSRF, CSP va xavfsizlik sarlavhalari, Fayl yuklash (Direct Storage), SSRF, Mass Assignment.

---

## 1. Tekshirilgan Qatlamlar

1. **Kirish Ma'lumotlarini Validatsiya Qilish (Zod Schemas):**
   - Barcha API marshrutlariga keluvchi ma'lumotlar Zod sxemalari orqali turlanadi va cheklanadi.
   - Ortiqcha yoki noma'lum parametrlar rad etiladi (whitelist pattern). Foydalanuvchi hech qachon o'zining `role` yoki `status` maydonlarini so'rov orqali o'zgartira olmaydi (Mass Assignment himoyasi).

2. **XSS (Cross-Site Scripting) Himoyasi:**
   - React virtual DOM avtomatik escaping mexanizmi barcha matnlarni himoyalaydi.
   - `dangerouslySetInnerHTML` ishlatilmaydi; foydalanuvchi yozgan chat xabarlari, izohlar va bio matnlari xavfsiz plain-text sifatida render qilinadi.

3. **HTTP Xavfsizlik Sarlavhalari (Security Headers & CSP):**
   - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (2 yillik HSTS majburiy HTTPS).
   - `X-Content-Type-Options`: `nosniff` (MIME sniffing oldini olish).
   - `Referrer-Policy`: `strict-origin-when-cross-origin`.
   - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()` (ruxsatsiz apparat kirishlarini cheklash).
   - `Content-Security-Policy`: Faqat tasdiqlangan domenlar (Google, Telegram WebApp) ruxsat etilgan.

4. **Fayl Yuklash Xavfsizligi (`/api/upload/direct`):**
   - Server orqali og'ir oqim o'tmaydi (Vercel Serverless payload limiti ~4.5MB). Fayllar to'g'ridan-to'g'ri storage (Vercel Blob / Cloudflare R2) ga yuklanadi.
   - Hajm limiti: video uchun maks. 100 MB, rasm uchun maks. 5 MB.
   - Talabalar uchun kunlik kvota: 5 ta yuklash / kun.
   - Fayl nomlari mijozdan olinmaydi — serverda `crypto.randomUUID()` bilan almashtiriladi (Path Traversal hujumlarining oldi olingan).
   - MIME turlari: faqat `video/mp4`, `video/webm`, `video/quicktime`, `image/jpeg`, `image/png`, `image/webp`.

5. **SSRF (Server-Side Request Forgery) Himoyasi:**
   - Server mijoz taqdim etgan ixtiyoriy URL'larga tashqi so'rov yubormaydi. Avatar va video URL'lari faqat ichki domen va tasdiqlangan storage manbalari orqali cheklangan.

---

## 2. Topilgan Holatlar va Baholash

| ID | Tekshiruv Nomi | Jiddiyligi | Holat | Amalga Oshirilgan Chora |
|---|---|---|---|---|
| SEC-03-01 | File Path Traversal | **High** | Tuzatilgan | Yuklanayotgan fayl nomi mijoz parametrlaridan olinmaydi; serverda tasodifiy UUID yaratiladi. |
| SEC-03-02 | MIME Sniffing & Script Upload | **High** | Tuzatilgan | `X-Content-Type-Options: nosniff` qo'llangan, yuklanayotgan fayl turlari qat'iy oq ro'yxatda. |
| SEC-03-03 | Mass Assignment on User Update | **Medium** | Tuzatilgan | Zod sxemasi orqali faqat ruxsat etilgan maydonlar ajratib olinadi. |
| SEC-03-04 | Clickjacking Defense | **Medium** | Tuzatilgan | API'lar uchun `X-Frame-Options: DENY`, veb-sahifalar uchun faqat Telegram WebApp doirasida `frame-ancestors` ruxsat etilgan. |

---

## 3. Xulosa

3-o'tish auditi yakunlandi. OWASP A03 (Injection), A04 (Insecure Design) va A05 (Security Misconfiguration) talablariga to'liq rioya qilingan.
