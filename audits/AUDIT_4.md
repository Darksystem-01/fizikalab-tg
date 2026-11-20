# Xavfsizlik Auditi — 4-Bosqich: Suiiste'mol, Limitlar va Barqarorlik (Abuse, Rate Limits & Stability)

**Sana:** 2026-11-20  
**Auditor:** FizikaLab AppSec Engine  
**Fokus:** Rate Limitlar, SMS-pumping himoyasi, DoS va Spam profilaktikasi, Xavfsiz loglash, Bog'liqliklar auditi (`npm audit`).

---

## 1. Tekshirilgan Himoya Mexanizmlari

1. **Sliding-Window Rate Limiting (`src/lib/auth/rateLimit.ts`):**
   - **Tizim:** Upstash Redis (serverless muhitda tarqalgan kesh) va xotira-asosli mahalliy cheklagich fallback.
   - **Login / Brute-force:** IP va hisob bo'yicha 5 ta noto'g'ri urinishdan so'ng progressiv cheklov.
   - **SMS OTP Yuborish:** Bitta telefon raqami uchun soatiga maks. 5 ta, kuniga maks. 10 ta; bitta IP uchun soatiga maks. 20 ta so'rov (SMS Pumping / Toll Fraud hujumlarining oldi olingan).
   - **Chat Xabarlari:** Bitta talaba uchun 10 soniyada maks. 5 ta xabar (spam botlardan himoya).
   - **Video Yuklash:** Har bir talaba uchun kuniga maks. 5 ta video yuklash kvotasi.

2. **Xavfsiz Loglash (Logging Sanitization):**
   - Konsolga yoki server loglariga quyidagilar **hech qachon** yozilmaydi:
     - Ochiq parollar yoki parol heshlari
     - SMS OTP tasdiqlash kodlari (productionda)
     - Sessiya identifikatorlari yoki auth tokenlari
     - To'liq telefon raqamlari (faqat `+998 ** *** ** 45` shaklida)
   - Shubhali urinishlar (ko'p sonli noto'g'ri loginlar, spam urunishlar) xavfsizlik jurnali (`audit_logs`) ga faqat IP heshi va foydalanuvchi identifikatori bilan yoziladi.

3. **Xatolarni Xavfsiz Qaytarish (Production Error Concealment):**
   - API xatolarida mijozga stack trace yoki server ichki fayl yo'llari ko'rsatilmaydi.
   - Foydalanuvchiga faqat tushunarli xabar ("Serverda xatolik yuz berdi") va texnik xatoliklar ichki tizimda qayd qilinadi.

4. **Kutubxonalar va Zaifliklar Auditi (`npm audit`):**
   - Barcha asosiy runtime paketlar (Next.js, Drizzle, Neon, Zod, Argon2, Ably) tekshirildi.
   - Ishlab chiqish vositalarida (`drizzle-kit` ichki esbuild utiliti) mavjud bo'lgan ogohlantirishlar ishlab chiqarish muhitidagi (production runtime) xavfsizlikka ta'sir qilmaydi, chunki serverless funksiyalarida faqat yig'ilgan JavaScript ishlaydi.

---

## 2. Topilgan Holatlar va Baholash

| ID | Tekshiruv Nomi | Jiddiyligi | Holat | Amalga Oshirilgan Chora |
|---|---|---|---|---|
| SEC-04-01 | SMS Toll Fraud / Pumping | **High** | Tuzatilgan | Telefon va IP bo'yicha qat'iy sliding window limiti o'rnatildi. |
| SEC-04-02 | Chat Flood / Spam Bot Attack | **Medium** | Tuzatilgan | Har bir foydalanuvchi uchun 5 xabar / 10 soniya chegarasi va Zod uzunlik tekshiruvi. |
| SEC-04-03 | Sensitive Data Exposure in Logs | **High** | Tuzatilgan | Log filtrlari o'rnatilgan; PII va maxfiy ma'lumotlar maskalanadi. |
| SEC-04-04 | Video Upload DoS / Disk Overflow | **High** | Tuzatilgan | Fayllar to'g'ridan-to'g'ri tashqi Cloud Storage'ga o'tadi va talabalarga kunlik 5 ta yuklash kvotasi yuklatilgan. |

---

## 3. Xulosa

4-o'tish auditi yakunlandi. OWASP A04 (Insecure Design) va A09 (Security Logging and Monitoring Failures) talablari muvaffaqiyatli bajarildi.
