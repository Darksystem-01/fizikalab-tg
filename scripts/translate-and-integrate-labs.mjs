import fs from "fs";
import path from "path";

const srcDir = "/tmp/kerim-physics-lab/labs";
const destDir = "/home/cyborg/.gemini/antigravity/scratch/fizika-lab/public/interactive-labs";

const labConfigs = [
  { file: "arhimed.html", titleUz: "Arximed qonuni va ko‘tarish kuchi", descUz: "Menzurka va dinamometr yordamida Arximed kuchini o‘lchash, suyuqlik zichligi va siqib chiqarilgan hajm bog‘liqligi", category: "Gidrostatika" },
  { file: "tygyzdyq.html", titleUz: "Qattiq jism va suyuqliklar zichligini aniqlash", descUz: "Tarozi va menzurka orqali jismlar massasi va hajmini o‘lchab zichlikni hisoblash", category: "Modda tuzilishi" },
  { file: "juzu.html", titleUz: "Jismlarning suyuqlikda suzish shartlari", descUz: "Turli zichlikdagi jismlarning suv, moy va glitserinda suzish, cho‘kish va qalqib chiqish qonuniyatlari", category: "Gidrostatika" },
  { file: "laqtyru.html", titleUz: "Gorizontal va burchak ostida otilgan jism harakati", descUz: "Boshlang‘ich tezlik, otilish burchagi, trayektoriya, uchish masofasi va maksimal balandlikni tadqiq etish", category: "Kinematika" },
  { file: "mayatnik.html", titleUz: "Matematik mayatnik yordamida erkin tushish tezlanishini aniqlash", descUz: "Ip uzunligi va tebranishlar sonini o‘zgartirib erkin tushish tezlanishi g ni hisoblash", category: "Tebranishlar" },
  { file: "jylu.html", titleUz: "Issiqlik miqdori va solishtirma issiqlik sig‘imini aniqlash", descUz: "Kalorimetr yordamida turli metall silindrlarning solishtirma issiqlik sig‘imini tajribada topish", category: "Termodinamika" },
  { file: "muz.html", titleUz: "Muzning solishtirma erish issiqligini aniqlash", descUz: "Kalorimetriya va faza o‘tishlari: muz eriganda yutiladigan solishtirma issiqlik miqdori lambda ni o‘lchash", category: "Termodinamika" },
  { file: "om.html", titleUz: "Zanjir qismi uchun Om qonunini tekshirish", descUz: "Ampermetr, voltmetr va reostat yordamida tok kuchi va kuchlanishning to‘g‘ri proporsional bog‘liqligini aniqlash", category: "Elektrodinamika" },
  { file: "tizbek.html", titleUz: "Elektr zanjiri elementlari va o‘lchash asboblari", descUz: "Tok manbayi, kalit, lampochka, reostat va o‘lchov asboblaridan iborat zanjir yig‘ish", category: "Elektrodinamika" },
  { file: "tizbektey.html", titleUz: "O‘tkazgichlarni ketma-ket ulash qonuniyatlari", descUz: "Ketma-ket ulangan rezistorlarda umumiy qarshilik, kuchlanishlar yig‘indisi va tok kuchining tengligi", category: "Elektr zanjirlari" },
  { file: "parallel.html", titleUz: "O‘tkazgichlarni parallel ulash qonuniyatlari", descUz: "Parallel tarmoqlarda kuchlanishlar tengligi, toklarning qo‘shilishi va ekvivalent qarshilik", category: "Elektr zanjirlari" },
  { file: "emagnit.html", titleUz: "Elektromagnit xususiyatlari va elektromagnit induksiya", descUz: "G‘altak o‘ramlar soni va tok kuchining elektromagnit tortish kuchiga ta’sirini tadqiq qilish", category: "Elektromagnetizm" },
  { file: "magnit.html", titleUz: "Doimiy magnit maydon chiziqlarini tadqiq qilish", descUz: "Magnit millari va temir qipiqlari orqali N va S qutblarning kuch chiziqlari konfiguratsiyasini ko‘rish", category: "Magnetizm" },
  { file: "linza.html", titleUz: "Yupqa linzaning fokus masofasi va optik kuchini aniqlash", descUz: "Optik skameyka: yig‘uvchi linzada haqiqiy va mavhum tasvirlar hosil qilish, fokus masofasi F va D ni topish", category: "Geometrik optika" },
  { file: "synu.html", titleUz: "Yorug‘likning sinish ko‘rsatkichini aniqlash (Snellius qonuni)", descUz: "Shisha plastinka orqali yorug‘lik nurining tushish va sinish burchaklarini o‘lchab n ni aniqlash", category: "To‘lqin optikasi" },
  { file: "tolqyn.html", titleUz: "Suyuqlik sirtidagi mexanik to‘lqinlar va tebranishlar", descUz: "To‘lqin vannasida sirtqi to‘lqinlar: to‘lqin uzunligi lambda, chastota nu va tarqalish tezligi v bog‘liqligi", category: "To‘lqinlar fizikasi" }
];

// Master dictionary of Kazakh phrases/terms to academic Uzbek Latin
const DICTIONARY = [
  // Page structure & navigation
  [/Архимед заңы зертханасы/g, "Arximed qonuni virtual laboratoriyasi"],
  [/Тығыздық зертханасы/g, "Moddalar zichligini aniqlash laboratoriyasi"],
  [/Жүзу шарттары зертханасы/g, "Jismlarning suzish shartlari laboratoriyasi"],
  [/Горизонталь лақтыру зертханасы/g, "Gorizontal otilgan jism harakati laboratoriyasi"],
  [/Математикалық маятник зертханасы/g, "Matematik mayatnik laboratoriyasi"],
  [/Жылу мөлшері зертханасы/g, "Issiqlik miqdori va issiqlik sig‘imi laboratoriyasi"],
  [/Мұздың балқу жылуы зертханасы/g, "Muzning solishtirma erish issiqligi laboratoriyasi"],
  [/Ом заңы зертханасы/g, "Om qonuni virtual laboratoriyasi"],
  [/Электр тізбегі зертханасы/g, "Elektr zanjiri virtual laboratoriyasi"],
  [/Тізбектей жалғау зертханасы/g, "Ketma-ket ulash qonuniyatlari laboratoriyasi"],
  [/Параллель жалғау зертханасы/g, "Parallel ulash qonuniyatlari laboratoriyasi"],
  [/Электромагнит зертханасы/g, "Elektromagnit laboratoriyasi"],
  [/Магнит өрісі зертханасы/g, "Doimiy magnit maydoni laboratoriyasi"],
  [/Линза фокусы зертханасы/g, "Yupqa linza fokus masofasi laboratoriyasi"],
  [/Сыну көрсеткіші зертханасы/g, "Yorug‘likning sinish ko‘rsatkichi laboratoriyasi"],
  [/Беттік толқын зертханасы/g, "Sirtqi mexanik to‘lqinlar laboratoriyasi"],

  // Stepper headers
  [/Тіркелу/g, "Ro‘yxatdan o‘tish"],
  [/Сіз тіркелдіңіз/g, "Siz muvaffaqiyatli kirdingiz"],
  [/Қауіпсіздік ережелері/g, "Xavfsizlik qoidalari"],
  [/Қауіпсіздік ережесі/g, "Xavfsizlik qoidasi"],
  [/Тәжірибе/g, "Tajriba va o‘lchash stendi"],
  [/Қорытынды/g, "Xulosa va hisobot"],
  [/Тапсыру және есепті жүктеу/g, "Topshirish va hisobotni yuklab olish"],
  [/Тапсыру/g, "Topshirish"],
  [/Мұғалім режимі/g, "Ustoz rejimi"],
  [/Нұсқаулық/g, "Ko‘rsatma"],
  [/Жұмыс мақсаты/g, "Ishning maqsadi"],
  [/Құрал-жабдықтар/g, "Asbob-uskunalar"],
  [/Теориялық мағлұмат/g, "Nazariy ma’lumot"],
  [/Жұмыс барысы/g, "Ishning borishi"],

  // Physics terms
  [/Кері итеруші күш/g, "Arximed (ko‘tarish) kuchi"],
  [/ығыстырылған судың салмағы/g, "siqib chiqarilgan suyuqlik og‘irligi"],
  [/ығыстырылған сұйықтықтың салмағы/g, "siqib chiqarilgan suyuqlik og‘irligi"],
  [/Бөлік құны/g, "Asbobning bo‘lim qiymati"],
  [/бөлік құны/g, "bo‘lim qiymati"],
  [/бөлік құнын/g, "bo‘lim qiymatini"],
  [/Абсолют қателік/g, "Absolyut xatolik"],
  [/Салыстырмалы қателік/g, "Nisbiy xatolik"],
  [/Дене тығыздығы/g, "Jism zichligi"],
  [/Сұйықтық тығыздығы/g, "Suyuqlik zichligi"],
  [/Сұйықтықтың тығыздығы/g, "Suyuqlikning zichligi"],
  [/Сұйықтық көлемі/g, "Suyuqlik hajmi"],
  [/Дене салмағы/g, "Jism og‘irligi"],
  [/ауадағы салмағы/g, "havodagi og‘irligi"],
  [/сұйықтықтағы салмағы/g, "suyuqlikdagi og‘irligi"],
  [/Меншікті балқу жылуы/g, "Solishtirma erish issiqligi"],
  [/Меншікті жылусыйымдылық/g, "Solishtirma issiqlik sig‘imi"],
  [/Тербеліс периоды/g, "Tebranish davri"],
  [/Тербеліс жиілігі/g, "Tebranish chastotasi"],
  [/Еркін түсу үдеуі/g, "Erkin tushish tezlanishi"],
  [/Бастапқы жылдамдық/g, "Boshlang‘ich tezlik"],
  [/Ұшу қашықтығы/g, "Uchish masofasi"],
  [/Көтерілу биіктігі/g, "Ko‘tarilish balandligi"],
  [/Фокус аралығы/g, "Fokus masofasi"],
  [/Оптикалық күш/g, "Optik kuch"],
  [/Түсу бұрышы/g, "Tushish burchagi"],
  [/Сыну бұрышы/g, "Sinish burchagi"],
  [/Толқын ұзындығы/g, "To‘lqin uzunligi"],
  [/Таралу жылдамдығы/g, "Tarqalish tezligi"],
  [/Ток күші/g, "Tok kuchi"],
  [/Кернеу/g, "Kuchlanish"],
  [/Кедергі/g, "Qarshilik"],
  [/Ішкі кедергі/g, "Ichki qarshilik"],

  // Laboratory objects
  [/Динамометр/g, "Dinamometr"],
  [/динамометрдің/g, "dinamometrning"],
  [/Мензурка/g, "Menzurka"],
  [/мензурканың/g, "menzurkaning"],
  [/Таразы/g, "Tarozi"],
  [/таразының/g, "tarozining"],
  [/Сызғыш/g, "Chizg‘ich"],
  [/Секундомер/g, "Sekundomer"],
  [/Калориметр/g, "Kalorimetr"],
  [/Термометр/g, "Termometr"],
  [/Амперметр/g, "Ampermetr"],
  [/Вольтметр/g, "Voltmetr"],
  [/Реостат/g, "Reostat"],
  [/Кілт/g, "Kalit"],
  [/Шам/g, "Lampochka"],
  [/Тұрақты ток көзі/g, "O‘zgarmas tok manbayi"],
  [/Сұйықтық/g, "Suyuqlik"],
  [/Су/g, "Suv"],
  [/тұзды су/g, "sho‘r suv"],
  [/Тұзды су/g, "Sho‘r suv"],
  [/өсімдік майы/g, "o‘simlik moyi"],
  [/Өсімдік майы/g, "O‘simlik moyi"],
  [/глицерин/g, "glitserin"],
  [/Глицерин/g, "Glitserin"],
  [/Мұз/g, "Muz"],
  [/мұздың/g, "muzning"],
  [/болат/g, "po‘lat"],
  [/Болат/g, "Po‘lat"],
  [/алюминий/g, "alyuminiy"],
  [/Алюминий/g, "Alyuminiy"],
  [/жез/g, "jez"],
  [/Жез/g, "Jez"],
  [/қорғасын/g, "qo‘rg‘oshin"],
  [/Қорғасын/g, "Qo‘rg‘oshin"],
  [/Дене/g, "Jism"],
  [/денелердің/g, "jismlarning"],
  [/№1 дене/g, "1-jism"],
  [/№2 дене/g, "2-jism"],
  [/№3 дене/g, "3-jism"],

  // Common UI words
  [/Аты-жөніңіз/g, "F.I.SH. (To‘liq ismingiz)"],
  [/Сынып/g, "Guruh / Kurs"],
  [/Сыныпты таңдаңыз/g, "Guruhni tanlang"],
  [/Нұсқа/g, "Variant"],
  [/Жұмысты бастау/g, "Ishni boshlash"],
  [/Жалғастыру/g, "Davom ettirish"],
  [/Келесі/g, "Keyingisi"],
  [/Артқа/g, "Orqaga"],
  [/Тексеру/g, "Tekshirish"],
  [/Қайтару/g, "Qayta o‘rnatish"],
  [/Тазалау/g, "Tozalash"],
  [/Өлшеу/g, "O‘lchash"],
  [/Есептеу/g, "Hisoblash"],
  [/Нәтиже/g, "Natija"],
  [/Нәтижелер/g, "Natijalar"],
  [/Балл/g, "Ball"],
  [/Баға/g, "Baho"],
  [/Барлығы/g, "Jami"],
  [/Критерийлер/g, "Baholash mezonlari"],
  [/Қате/g, "Xato"],
  [/Дұрыс/g, "To‘g‘ri"],
  [/Дұрыс емес/g, "Noto‘g‘ri"],
  [/Сұрақтар/g, "Nazorat savollari"],
  [/Жауап/g, "Javob"],
  [/Жауабыңыз/g, "Javobingiz"],
  [/Сақтау/g, "Saqlash"],
  [/Жүктеу/g, "Yuklab olish"],
  [/Код/g, "Tekshiruv kodi"],
  [/Көшіру/g, "Nusxa olish"],
  [/Есепті жүктеу/g, "Hisobotni yuklab olish"],
  [/Есеп/g, "Hisobot"],
  [/Кесте/g, "Jadval"],
  [/Тәжірибелік мәліметтер/g, "Tajriba ma’lumotlari"]
];

console.log(`Starting translation of ${labConfigs.length} laboratories...`);

for (const lab of labConfigs) {
  const srcPath = path.join(srcDir, lab.file);
  const destPath = path.join(destDir, lab.file);

  if (!fs.existsSync(srcPath)) {
    console.warn(`File not found: ${srcPath}`);
    continue;
  }

  let content = fs.readFileSync(srcPath, "utf-8");

  // 1. Apply translation dictionary
  for (const [regex, replacement] of DICTIONARY) {
    content = content.replace(regex, replacement);
  }

  // 2. Set official document title
  content = content.replace(/<title>([^<]+)<\/title>/i, `<title>${lab.titleUz} — FizikaLab</title>`);

  // 3. Fix colors from old violet to FizikaLab high-end academic navy/slate
  content = content.replace(/--primary:\s*#6b2fa0;/g, "--primary:#1E3A8A;");
  content = content.replace(/--primary-soft:\s*#efe6f8;/g, "--primary-soft:#EFF6FF;");
  content = content.replace(/--primary:\s*#c79cf2;/g, "--primary:#3B82F6;");
  content = content.replace(/--primary-soft:\s*#2d2042;/g, "--primary-soft:#1E293B;");

  // 4. Remove proprietary window.claude lock-in and add clean fallback & postMessage dispatch
  const claudePatch = `
  // FizikaLab Platform Integration: Remove external mock dependencies
  let cl = null;
  try { if (window.parent && window.parent !== window) { cl = null; } } catch(e){}
  `;
  content = content.replace(/const cl = window\.claude;[\s\S]*?catch \(e\) \{\}/, claudePatch);

  // Add postMessage event when report is submitted or finished
  const submitHook = `
    try {
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({
          type: "FIZIKA_LAB_REPORT_SUBMIT",
          lab: "${lab.file}",
          title: "${lab.titleUz}",
          score: S.result ? S.result.score : 0,
          grade: S.result ? S.result.grade5 : 5,
          timestamp: new Date().toISOString()
        }, "*");
      }
    } catch(e) {}
  `;
  content = content.replace(/(doSubmit\(\)\s*\{)/, `$1\n${submitHook}\n`);

  fs.writeFileSync(destPath, content, "utf-8");
  console.log(`✓ Translated & integrated: ${lab.file} (${lab.titleUz})`);
}

console.log("All 16 laboratories integrated successfully in public/interactive-labs/!");
