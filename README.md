# FizikaLab — Akademik Virtual Fizika Laboratoriyasi

Talabalar, ustozlar va bosh administrator uchun to‘liq server tomonida (backend) ishlaydigan, rasmiy akademik dizaynga ega virtual fizika laboratoriyasi platformasi.

## Asosiy Imkoniyatlar

- **Server Fizika Hisoblash Yadroviysi (`src/lib/physics/`)**:
  1. **Metrologiya va Xatoliklar Tahlili**: Verniy shtangensirkul, mikrometr, sferometr, statistik xatolik (`σ`, `δ = σ/√N`), chiziqli regressiya (OLS) va Styudent `t'`-mezoni.
  2. **Kinematika va Ballistika**: RK4 sonli integratori, havo qarshiligi (`F_d = ½ρC_dAv²`), erkin tushish va havo yostiqli yo‘lak.
  3. **Dinamika va Mexanik Tebranishlar**: Qiya tekislik, nolinear matematik mayatnik & Kater mayatnigi, so‘nuvchi Guk prujinasi, elastik/noelastik to‘qnashuvlar, maxovik inersiya momenti.
  4. **Statika va Muvozanat**: 360° kuchlar stoli, ikki tayanchli balka kesuvchi kuch/eguvchi moment diagrammalari, polispast va g‘ildirak-o‘q FIK tahlili.
  5. **Elektromagnetizm va Zanjirlar**: Gauss usuli bilan MNA matritsa yechuvchisi (`[G]V = I`), Uitston/Metr ko‘prigi, Potensiometr, RLC rezonans va KRO ossillograf, RC/RL o‘tish jarayonlari, 2D elektrostatik maydon & Faradey induksiyasi.
  6. **Geometrik va To‘lqin Optikasi**: Yupqa linza va sferik ko‘zgular (kaustik masofa bilan), prizma Koshi dispersiyasi, mikroskop/teleskop, N-tirqishli difraksiya panjarasi.
- **75 ta Laboratoriya Qurilmalari Katalogi** (`/instruments`) va **108+ KaTeX Formulalar + CODATA 2022** (`/reference` hamda har bir laboratoriya ichida).
- **Uch bosqichli Xavfsiz RBAC Tizimi**:
  - **Bosh Administrator** (`/admin`): faqat server muhit o‘zgaruvchilari (`ADMIN_SECRET`, ixtiyoriy ravishda `ADMIN_EMAIL` / `ADMIN_PASSWORD`) orqali kiradi; ustoz hisoblari ochish, talaba va ustozlarni boshqarish, bloklash/o‘chirish, audit jurnali.
  - **Ustoz (O‘qituvchi)** (`/teacher`): mustaqil ro‘yxatdan o‘ta olmaydi (hisob faqat administrator tomonidan ochiladi); alohida akademik guruhlar ochish, mustaqil ish va laboratoriya topshiriqlari berish, hisobotlarni baholash.
  - **Talaba**: universitet, fakultet va akademik guruh ko‘rsatilgan holda ro‘yxatdan o‘tadi, o‘lchovlar o‘tkazadi, CSV/Chop etish eksport qiladi va hisobot topshiradi.

## Mahalliy Ishga Tushirish (Local Development)

```bash
npm install
npm run dev
```

Mahalliy ishga tushirishda `.env.local` fayliga `AUTH_SECRET` va `ADMIN_SECRET` (`email:parol` ko‘rinishida) qiymatlarini kiriting.

## Vercel Orqali Joylashtirish (Deployment)

1. Loyihani **private** GitHub repozitoriyasiga joylang va Vercel loyihasiga ulang.
2. **Doimiy ma'lumotlar bazasi (`DATABASE_URL`)**: Vercel Postgres / Neon ulanish satrini kiriting.
3. **Encrypted Environment Variables** bo‘limiga quyidagilarni kiriting (barcha muhitlar: **Production, Preview, Development** uchun):
   - `AUTH_SECRET` — maxfiy sessiya kaliti
   - `ADMIN_SECRET` — administrator kirish ma’lumotlari (`email:parol` ko‘rinishida)
   - `DATABASE_URL` — PostgreSQL ulanish satri
4. **Deploy** tugmasini bosing.
