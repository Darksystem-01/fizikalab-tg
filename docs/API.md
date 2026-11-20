# FizikaLab Reels — API Hujjatlari (API Specification)

Ushbu hujjat FizikaLab Reels platformasining barcha backend REST API endpointlari, so'rov formatlari, parametrlar va qaytuvchi javoblar spetsifikatsiyasini o'z ichiga oladi.

---

## 1. Autentifikatsiya (Authentication)

### 1.1. Ro'yxatdan o'tish (SMS OTP so'rash)
- **URL:** `POST /api/auth/register`
- **Ruxsat:** Ommaviy (Rate limit: IP bo'yicha soatiga maks. 20, telefon bo'yicha soatiga 5 ta)
- **So'rov tanasi (JSON):**
  ```json
  {
    "nickname": "fizik_tatu",
    "phone": "+998901234567",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "university": "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    "faculty": "Dasturiy injiniring fakulteti",
    "course": 1
  }
  ```
- **Muvaffaqiyatli javob (200 OK):**
  ```json
  {
    "success": true,
    "phone": "+998 ** *** ** 67",
    "message": "Tasdiqlash kodi SMS orqali yuborildi."
  }
  ```

### 1.2. OTP kodni tasdiqlash
- **URL:** `POST /api/auth/verify-otp`
- **Ruxsat:** Ommaviy (5 ta noto'g'ri urinishdan keyin kod bekor qilinadi)
- **So'rov tanasi:**
  ```json
  {
    "phone": "+998901234567",
    "code": "123456"
  }
  ```
- **Muvaffaqiyatli javob (200 OK):**
  `Set-Cookie` sarlavhasida xavfsiz `fizika_session` cookie o'rnatiladi.
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_...",
      "nickname": "fizik_tatu",
      "role": "student"
    }
  }
  ```

### 1.3. Tizimga kirish (Login)
- **URL:** `POST /api/auth/login`
- **Ruxsat:** Ommaviy (Brute-force cheklovi: 5 ta urinish / daqiqa)
- **So'rov tanasi:**
  ```json
  {
    "phone": "+998901234567",
    "password": "Password123!"
  }
  ```

### 1.4. Parolni tiklash
- **URL:** `POST /api/auth/reset-password`
- **1-bosqich:** `{ "step": "request_otp", "phone": "+998901234567" }`
- **2-bosqich:** `{ "step": "verify_and_update", "phone": "+998901234567", "code": "123456", "newPassword": "NewPassword123!" }`

---

## 2. Reels Videolar Lentasi (Reels Feed)

### 2.1. Reels ro'yxatini olish (Cursor-based)
- **URL:** `GET /api/reels`
- **Parametrlar (Query):**
  - `topic`: mavzu slugi (masalan, `mexanika`, `optika`)
  - `cursor`: oxirgi ko'rilgan sana (ISO string)
  - `limit`: miqdori (standart 10, maks. 20)
  - `feed`: `for_you` | `following` | `latest`
- **Javob (200 OK):**
  ```json
  {
    "reels": [
      {
        "id": "reel_mexanika_1",
        "title": "2D Ballistika: 45° burchak siri",
        "videoUrl": "https://...",
        "problemText": "Masala sharti...",
        "answerText": "Yechim va javob...",
        "hint": "Formulaga e'tibor bering",
        "likesCount": 312,
        "viewsCount": 1420,
        "isLiked": false,
        "isSaved": false
      }
    ],
    "nextCursor": "2026-11-20T12:00:00.000Z"
  }
  ```

### 2.2. Layk va Saqlash
- **URL:** `POST /api/reels/[id]/like`
- **URL:** `POST /api/reels/[id]/save`
- **Ruxsat:** Autentifikatsiyadan o'tgan foydalanuvchi.
- **Javob:** `{ "success": true, "liked": true, "likesCount": 313 }`

---

## 3. Video Yuklash (Direct Storage Upload)

### 3.1. Yuklash havolasi olish
- **URL:** `POST /api/upload/direct`
- **Ruxsat:** Avtorizatsiyalangan talaba (kuniga maks. 5 ta yuklash)
- **So'rov tanasi:**
  ```json
  {
    "filename": "tajriba.mp4",
    "contentType": "video/mp4",
    "sizeBytes": 45000000,
    "durationSec": 58
  }
  ```
- **Javob (200 OK):**
  ```json
  {
    "uploadUrl": "https://blob.vercel-storage.com/...",
    "publicUrl": "https://blob.vercel-storage.com/fizika-reels/usr_.../uuid.mp4"
  }
  ```

### 3.2. Reel yaratish
- **URL:** `POST /api/reels/create`
- **So'rov tanasi:**
  ```json
  {
    "topicSlug": "mexanika",
    "title": "Erkin tushish tezlanishini aniqlash",
    "description": "Matematik mayatnik yordamida g qiymatini hisoblash",
    "problemText": "Mayatnik uzunligi l=1m bo'lsa...",
    "answerText": "g = 9.81 m/s²",
    "videoUrl": "https://...",
    "durationSec": 58,
    "sizeBytes": 45000000,
    "copyrightAgreed": true
  }
  ```

---

## 4. Universitet Chati (University Chat)

### 4.1. Kanallar ro'yxati
- **URL:** `GET /api/chat/channels`
- **Javob:** Barcha rasmiy va fan kanallari (`#umumiy`, `#savol-javob`, `#mexanika`...).

### 4.2. Xabarlar tarixi
- **URL:** `GET /api/chat/messages?channelId=chan_umumiy&limit=30`
- **Javob:** Xabarlar ketma-ketligi, muallif ma'lumotlari va reaksiya ro'yxati.

### 4.3. Xabar yuborish
- **URL:** `POST /api/chat/messages`
- **Ruxsat:** Tizimga kirgan foydalanuvchi (Rate limit: 5 msg / 10s)
- **So'rov tanasi:**
  ```json
  {
    "channelId": "chan_umumiy",
    "body": "Assalomu alaykum! @fizik_tatu darslar jadvali chiqdimi?",
    "replyToId": null
  }
  ```

### 4.4. Xabarga reaksiya bildirish
- **URL:** `POST /api/chat/messages/[id]/react`
- **So'rov tanasi:** `{ "emoji": "🔥" }` (qayta bosilsa o'chiriladi).

---

## 5. Moderatsiya va Boshqaruv (CMS)

### 5.1. Navbatdagi videolarni ko'rish
- **URL:** `GET /api/admin/moderation`
- **Ruxsat:** Faqat `admin` va `moderator` (boshqalar uchun 404).

### 5.2. Videoni tasdiqlash yoki rad etish
- **URL:** `POST /api/admin/moderation/review`
- **So'rov tanasi:**
  ```json
  {
    "reelId": "reel_123",
    "decision": "approve" // yoki "reject",
    "reason": "Sifatsiz tasvir (rad etilganda majburiy)"
  }
  ```
