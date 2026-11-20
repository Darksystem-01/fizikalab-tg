# FizikaLab CMS — Ma'mur va Moderator Qo'llanmasi (Admin Guide)

Ushbu qo'llanma FizikaLab platformasi boshqaruv konsoli (`/admin`) orqali kontentni moderatsiya qilish, talabalar yuklagan videolarni tasdiqlash, foydalanuvchilar rollarini boshqarish va xavfsizlik audit jurnallarini tahlil qilish bo'yicha to'liq yo'riqnomadir.

---

## 1. Kirish va Xavfsizlik Konsepsiyasi

FizikaLab ma'muriy paneli **Stealth 404** konsepsiyasida himoyalangan:
- Tizimga kirmagan yoki `student` roliga ega bo'lgan foydalanuvchilar `/admin` manziliga kirganda yoki `/api/admin/*` so'rovlarini yuborganda `403 Forbidden` emas, balki `404 Not Found` xatosi ko'rsatiladi. Bu tajovuzkorlarga boshqaruv paneli mavjudligi haqida ma'lumot oshkor bo'lishining oldini oladi.
- Boshqaruv paneliga kirish uchun foydalanuvchining roli **`admin`** yoki **`moderator`** bo'lishi shart.
- Birinchi admin hisobi `.env` dagi `INITIAL_ADMIN_PHONE` raqami orqali ro'yxatdan o'tganda avtomatik faollashtiriladi.

---

## 2. Moderatsiya Navbati (Moderation Queue)

Har bir talaba yuklagan video dastlab **`pending` (kutilmoqda)** holatida moderatsiya navbatiga tushadi.

### 2.1. Videoni ko'rib chiqish qadamlari:
1. `/admin` sahifasidagi **"Moderatsiya Navbati"** yorlig'iga o'ting.
2. Har bir arizada quyidagilar aks etadi:
   - Video pleyeri (ko'rish va sifatini tekshirish uchun)
   - Sarlavha va qisqa tavsif
   - Fizika bo'limi (Mexanika, Optika, Termodinamika va h.k.)
   - Masala sharti (`problemText`), javobi (`answerText`) va maslahati (`hint`)
   - Muallifning taxallusi va universiteti
3. **Qaror qabul qilish:**
   - **Tasdiqlash (Chop etish):** Agar video akademik etika va fizika dasturiga to'g'ri kelsa, "Tasdiqlash" tugmasini bosing. Video darhol asosiy lentada (`/`) ommaga ko'rinadi.
   - **Rad etish (Sabab bilan):** Agar video sifatsiz, noto'g'ri formula yoki mualliflik huquqiga zid bo'lsa, "Rad etish" tugmasini bosing va rad etish sababini kiriting (masalan: *"Masala yechimida Nyuton 2-qonunining formulasi noto'g'ri ko'rsatilgan"*). Bu xabar talabaning bildirishnomalarida ko'rinadi.

---

## 3. Rollarni Boshqarish (User Roles Management)

FizikaLab platformasida 4 xil darajadagi rollar mavjud:

| Rol | Izoh | Tayinlash usuli |
|---|---|---|
| `student` | Standart talaba roli. Yuklagan videolari moderatsiyadan o'tadi. | Ro'yxatdan o'tganda avtomatik beriladi. |
| `creator` | Tasdiqlangan kontent muallifi / o'qituvchi. Videolari to'g'ridan-to'g'ri chop etiladi. | Admin tomonidan tayinlanadi. |
| `moderator` | Moderatsiya navbatini tekshira oladi va chatdagi qoidabuzar xabarlarni o'chiradi. | Faqat Admin tayinlaydi. |
| `admin` | Tizimning to'liq egasi. Barcha bo'limlar, kanallar va audit jurnallarini boshqaradi. | `INITIAL_ADMIN_PHONE` yoki Admin konsoli orqali. |

---

## 4. Universitet Chatini Boshqarish

- **E'lonlar kanali (`#elonlar`):** Faqat moderator va adminlar xabar yozishi mumkin bo'lgan kanal. Yangi olimpiadalar, tanlovlar va muhim yangiliklar shu yerda e'lon qilinadi.
- **Qoidabuzarlarni jazolash:** Chatda haqoratli so'z ishlatgan yoki spam tarqatgan foydalanuvchilarning xabarlarini bitta bosish bilan o'chirish (`DELETE`) mumkin.
- **Yangi kanallar ochish:** Kelgusida fakultet yoki yo'nalishlar bo'yicha yangi kanallar ochish Drizzle orqali `channels` jadvaliga qo'shish orqali amalga oshiriladi.

---

## 5. O'zgarmas Audit Jurnali (Immutable Audit Logs)

Ma'murlar tomonidan amalga oshirilgan har bir muhim amal:
- Kim (actorId)
- Qachon (createdAt)
- Qaysi resursga (targetType, targetId)
- Qanday amal (action: `approve_reel`, `reject_reel`, `change_role`, `ban_user`)
- IP-manzil heshi (ipHash)

ko'rinishida `audit_logs` jadvaliga yoziladi. Ushbu yozuvlarni tahrirlash yoki o'chirish bazaviy cheklovlar bilan taqiqlangan. Bu platformaning ichki nazorati va audit shaffofligini ta'minlaydi.
