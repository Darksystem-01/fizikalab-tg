# FizikaLab Reels — Tahdid Modeli (Threat Model)

Ushbu hujjat STRIDE metodologiyasi asosida tizim aktivlari, potensial tajovuzkorlar va ularning oldini olish choralarini belgilaydi.

---

## 1. Tizim Aktivlari (Assets)

1. **Talabalar Shaxsiy Ma'lumotlari (PII):** Telefon raqamlari, login ma'lumotlari, akademik profillar.
2. **Autentifikatsiya Infratuzilmasi:** SMS OTP shlyuzi (Eskiz.uz balansi), sessiya cookie-fayllari, parollar bazasi.
3. **Akademik va Ijtimoiy Kontent:** Yuklangan fizika videolari, masalalar, yechimlar, izohlar.
4. **Universitetlararo Muloqot:** Realtime chat xabarlari, moderatsiya nazorati.
5. **Ma'muriy Boshqaruv (CMS):** Admin huquqlari, moderatsiya qarorlari, audit loglari.

---

## 2. Potensial Tajovuzkorlar (Threat Actors)

| Tajovuzkor Turi | Maqsadi | Qo'llaniladigan Hujum Usuli |
|---|---|---|
| **SMS Pumping Botlar** | SMS provayder balansini yo'qotish (toll fraud) | API orqali millionlab raqamlarga soxta OTP so'rovlarini yuborish |
| **Spammerlar & Trollar** | Chat va Reels lentasiga nojo'ya yoki spam kontent tarqatish | Skriptlar orqali ko'p xabarlar, noo'rin videolar yuklash |
| **Buzg'unchilar (Account Takeover)** | Mashhur talaba yoki o'qituvchi akkauntini egallash | Parol brute-force, credential stuffing, OTP timing attack |
| **Ichki Tajovuzkor (Malicious Student)** | Boshqa talabalarning reelslarini o'chirish yoki o'zgartirish | IDOR (Insecure Direct Object Reference) orqali boshqa ID'larni yuborish |
| **Eskalatsiya Qidiruvchi** | Oddiy student rolidan Admin roliga o'tish | Mass-assignment, session forgery, admin URL probing |

---

## 3. STRIDE Tahlili va Himoya Mexanizmlari

### 3.1. Spoofing (Shaxsni Soxtalashtirish)
- **Xavf:** Boshqa talaba nomidan xabar yozish yoki tizimga kirish.
- **Himoya:** Faqat server tomonidan berilgan, kriptografik xavfsiz (HMAC / AES) `httpOnly` sessiya cookie-fayllari tekshiriladi. Chat xabarlari serverda avtorizatsiyalangan sessiya `user_id`siga qat'iy bog'lanadi.

### 3.2. Tampering (Ma'lumotlarni Qasddan O'zgartirish)
- **Xavf:** Foydalanuvchi so'rov tanasida `role: "admin"` yuborib, o'z vakolatini oshirishi (mass-assignment).
- **Himoya:** Zod whitelist validatsiyasi — ruxsat etilmagan maydonlar so'rovdan avtomatik tozalanadi. DB darajasida cheklovlar.

### 3.3. Repudiation (Harakatlarni Inkor Qilish)
- **Xavf:** Moderator yoki admin o'zi bajargan amallarni inkor qilishi.
- **Himoya:** Barcha muhim amallar (o'chirish, bloklash, rolni o'zgartirish) o'zgarmas `audit_logs` jadvaliga `actor_id`, `action`, `target_id`, `timestamp` va `ip_hash` bilan yoziladi.

### 3.4. Information Disclosure (Ma'lumotlar Oshkor Bo'lishi)
- **Xavf:** Talabalarning telefon raqamlari yoki parollarining bazadan yoki API javobidan oqib ketishi.
- **Himoya:** Telefon raqamlari hech qachon ommaviy API javobida qaytmaydi (faqat egasiga qisman maskalangan holda ko'rsatiladi: `+998 ** *** ** 45`). Bazada telefon AES-256-GCM bilan shifrlanadi.

### 3.5. Denial of Service (Xizmatni To'xtatib Qo'yish)
- **Xavf:** SMS shlyuziga ko'p so'rov yuborish, chatga xabarlar toshqini, katta hajmdagi videolarni to'xtovsiz yuklash.
- **Himoya:**
  - SMS OTP: Bitta raqamga soatiga maks 5 ta, kuniga maks 10 ta SMS; bitta IP uchun soatiga maks 20 ta so'rov. Qayta yuborish kamida 60 soniya oralig'ida.
  - Video yuklash: Maks 100MB, maks 90s, kuniga maks 5 ta yuklash.
  - Chat: 10 soniyada maks 5 ta xabar limiti.

### 3.6. Elevation of Privilege (Vakolatlarni Ruxsatsiz Oshirish)
- **Xavf:** Talaba `/admin` yoki `/api/admin/*` amallarini chaqirishi.
- **Himoya:** Har bir admin API marshruti ichida sessiya roli `admin` yoki `moderator` ekanligi qat'iy tekshiriladi; aks holda darhol `403 Forbidden` qaytadi.
