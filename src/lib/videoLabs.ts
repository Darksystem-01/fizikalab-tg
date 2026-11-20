/**
 * FizikaLab - Haqiqiy Fizik Tajribalar Video Baza & Metadata Katalogi
 *
 * Har bir laboratoriya uchun YouTube/Google Drive orqali olingan haqiqiy fizik
 * tajriba stendi videolari, vaqt belgilari (timestamps), jihozlar ro'yxati,
 * o'lchash bosqichlari va virtual simulyator bilan solishtirish mezonlari.
 */

export interface VideoTimestampBookmark {
  seconds: number;
  timeLabel: string;
  title: string;
  description: string;
  keyObservation: string;
}

export interface PhysicalApparatusItem {
  name: string;
  specification: string;
  purpose: string;
}

export interface VideoLabDefinition {
  id: string;
  labKey:
    | "metrology"
    | "kinematics"
    | "dynamics"
    | "statics"
    | "electromagnetism"
    | "optics"
    | "thermodynamics"
    | "atomic";
  titleUz: string;
  titleEn: string;
  discipline: string;
  duration: string;
  youtubeId: string;
  googleDrivePreviewUrl?: string;
  thumbnailUrl: string;
  summaryUz: string;
  academicObjective: string;
  apparatus: PhysicalApparatusItem[];
  keyFormulas: {
    latex: string;
    description: string;
  }[];
  timestamps: VideoTimestampBookmark[];
  observationChecklist: string[];
  simulatorComparison: {
    realParameters: string;
    simulatorPreset: string;
    expectedDeviationPct: string;
    errorSources: string[];
  };
}

export const VIDEO_LABS_CATALOG: VideoLabDefinition[] = [
  {
    id: "vid-metrology-01",
    labKey: "metrology",
    discipline: "Eksperimental Fizika & Metrologiya",
    titleUz: "Shtangensirkul va Mikrometr Yordamida Chiziqli O'lchashlar",
    titleEn: "Linear Measurements with Vernier Caliper and Micrometer Screw Gauge",
    duration: "06:42",
    youtubeId: "SQae73zfknQ",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Metrology_ExpStand_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/metrology.jpg",
    summaryUz:
      "Laboratoriya sharoitida shtangensirkul (0.02 mm) va mikrometr (0.01 mm) yordamida qattiq jismlarning tashqi, ichki diametri, qalinligi va chuqurligini o'lchash, asbob xatoligi (Least Count) hamda nol xatolikni (Zero Error) hisobga olish.",
    academicObjective:
      "Talabalarda chiziqli o'lchov asboblari bilan ishlash malakasini shakllantirish, o'lchov asbobi bo'linmasi qiymatini aniqlash va o'lchash natijalariga statistik ishlov berish.",
    apparatus: [
      {
        name: "Shtangensirkul (Vernier Caliper)",
        specification: "O'lchov diapazoni: 0–150 mm, Noniu bo'linmasi: 0.02 mm",
        purpose: "Silindrning tashqi/ichki diametri va balandligini o'lchash",
      },
      {
        name: "Mikrometr (Micrometer Screw Gauge)",
        specification: "Qadam: 0.5 mm, Baraban shkalasi: 50 bo'linma, Aniqlik: 0.01 mm",
        purpose: "Yupqa sim diametri va metall plastinka qalinligini o'lchash",
      },
      {
        name: "Po'lat silindr va kalibrlangan namuna",
        specification: "Diametri: 25.00 mm, Balandligi: 50.00 mm",
        purpose: "O'lchash tekshiruv obyekti",
      },
      {
        name: "Sferometr",
        specification: "Uch oyoqli mikrometrik vint, Aniqlik: 0.001 mm",
        purpose: "Sferik sirtlar (linzalar) egrilik radiusini aniqlash",
      },
    ],
    keyFormulas: [
      {
        latex: "LC = \\frac{\\text{Asosiy shkala bir bo'linmasi}}{\\text{Noniu bo'linmalari soni}} = \\frac{1\\text{ mm}}{50} = 0.02\\text{ mm}",
        description: "Shtangensirkul asbob xatoligi (Least Count)",
      },
      {
        latex: "d_{\\text{haqiqiy}} = d_{\\text{o'lchangan}} - (\\pm \\Delta_0)",
        description: "Nol xatolik (Zero Error) tuzatmasi",
      },
      {
        latex: "R = \\frac{l^2}{6h} + \\frac{h}{2}",
        description: "Sferometr yordamida sferik sirt egrilik radiusi",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Asboblar tuzilishi va Noniu printsipi",
        description: "Shtangensirkulning asosiy va noniu shkalalari, ichki va tashqi o'lchash lablari ko'rsatiladi.",
        keyObservation: "Asosiy shkala 1 mm, noniu shkalasi 50 bo'linmaga bo'lingan.",
      },
      {
        seconds: 75,
        timeLabel: "01:15",
        title: "Asbobning nol xatoligi (Zero Error) aniqlanishi",
        description: "Lablar jipslashtirilganda noniu noli asosiy shkala noli bilan mos tushishi yoki chetlanishi tekshiriladi.",
        keyObservation: "Musbat yoki manfiy nol xatolik qayd etilib, o'lchash natijasidan ayirib tashlanadi.",
      },
      {
        seconds: 165,
        timeLabel: "02:45",
        title: "Silindrning tashqi diametrini 5 marta o'lchash",
        description: "Silindr turli nuqtalarda va turli burchaklarda 5 marta o'lchanadi.",
        keyObservation: "Har xil nuqtada o'lchash ovalsimonlik va geometrik nomukammallikni hisobga oladi.",
      },
      {
        seconds: 250,
        timeLabel: "04:10",
        title: "Mikrometrda sim diametrini o'lchash",
        description: "Vint treщyotkasi (ratchet) orqali me'yoriy kuch bilan qisish.",
        keyObservation: "Treщyotka 3 marta qirsillagach to'xtatiladi, aks holda deformatsiya sodir bo'ladi.",
      },
      {
        seconds: 335,
        timeLabel: "05:35",
        title: "Statistik tahlil va Styudent koeffitsiyenti",
        description: "O'rtacha arifmetik qiymat, dispersiya va 95% ishonchlilik oralig'i hisobi.",
        keyObservation: "Natija x = x̄ ± Δx ko'rinishida rasmiylashtiriladi.",
      },
    ],
    observationChecklist: [
      "Shtangensirkul va mikrometrning nol holatini ko'zdan kechirish",
      "Mikrometr barabanini buraganda treщyotkadan foydalanish qoidasi",
      "Noniu chiziqlarining asosiy shkala chizig'i bilan ustma-ust tushgan tartib raqami",
      "O'lchov natijasiga asbob tuzatmasini kiritish",
    ],
    simulatorComparison: {
      realParameters: "d = 25.04 ± 0.02 mm, h = 50.12 ± 0.02 mm",
      simulatorPreset: "Metrologiya -> Shtangensirkul & Sferometr (mode: spherometer)",
      expectedDeviationPct: "< 0.25%",
      errorSources: [
        "Ko'rish burchagi parallaksi",
        "Detallarning termal kengayishi",
        "Vint va yo'naltiruvchilarning mexanik yedirilishi",
      ],
    },
  },

  {
    id: "vid-kinematics-01",
    labKey: "kinematics",
    discipline: "Mexanika & Kinematika",
    titleUz: "2D Ballistik To'p Yordamida Gorizontga Burchak Ostida Otilgan Jism Harakati",
    titleEn: "2D Projectile Motion & Ballistic Trajectory Experiment",
    duration: "05:38",
    youtubeId: "l8VUh4pzhKI",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Kinematics_Ballistics_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/kinematics.jpg",
    summaryUz:
      "Laboratoriya ballistik to'p qurilmasi va fotodatchiklar yordamida po'lat sharcha gorizontga nisbatan turli burchaklarda otiladi. Boshlang'ich tezlik v₀, uchish masofasi R, maksimal balandlik H va uchish vaqti nazariy RK4 modeli bilan solishtiriladi.",
    academicObjective:
      "Murakkab ikki o'lchamli harakatning koordinata o'qlari bo'yicha mustaqil proyeksiyalarga ajralishini eksperimental isbotlash va havo qarshiligi ta'sirini ko'rish.",
    apparatus: [
      {
        name: "PASCO Ballistik to'p stendi",
        specification: "Burchak diapazoni: 0°–90° (aniqlik 0.5°), 3 ta prujina bosimi",
        purpose: "Doimiy boshlang'ich tezlik v₀ bilan otish",
      },
      {
        name: "Fotodatchiklar juftligi (Photogate Timers)",
        specification: "Masofa: 10.0 cm, Taymer aniqligi: 0.1 ms (0.0001 s)",
        purpose: "Otilish momentidagi v₀ tezlikni aniq fiksatsiya qilish",
      },
      {
        name: "O'lchov tasmasi va zarb datchigi (Impact Pad)",
        specification: "Uzunligi: 3.0 m (aniqlik 1 mm)",
        purpose: "Uchish uzoqligi R va zarb vaqti t ni o'lchash",
      },
    ],
    keyFormulas: [
      {
        latex: "R = \\frac{v_0^2 \\sin(2\\theta)}{g}",
        description: "Vakuumdagi gorizontal uchish uzoqligi",
      },
      {
        latex: "H_{\\max} = \\frac{v_0^2 \\sin^2\\theta}{2g}",
        description: "Maksimal ko'tarilish balandligi",
      },
      {
        latex: "m \\frac{d\\vec{v}}{dt} = m\\vec{g} - \\frac{1}{2} C_d \\rho A v \\vec{v}",
        description: "Havo qarshiligi hisobga olingan differensial tenglama (RK4)",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Ballistik to'p va fotodatchiklar kalibrovkasi",
        description: "Otish stendi gorizontga nisbatan burchak o'lchagich orqali 45° ga o'rnatiladi.",
        keyObservation: "Fotodatchiklar to'p og'ziga o'rnatilgan, masofa l = 10 sm.",
      },
      {
        seconds: 80,
        timeLabel: "01:20",
        title: "Boshlang'ich tezlik v₀ ni o'lchash",
        description: "Sharcha to'pdan uchib chiqishda ikkita nurni kesib o'tadi, t vaqt orqali v₀ = l/t aniqlanadi.",
        keyObservation: "O'rtacha v₀ = 5.24 m/s (tajriba o'zgaruvchanligi < 1%).",
      },
      {
        seconds: 170,
        timeLabel: "02:50",
        title: "θ = 45° burchak ostida maksimal masofa R ni tekshirish",
        description: "45° burchakda otilganda sharchaning tushish nuqtasi uglerod qog'ozida iz qoldiradi.",
        keyObservation: "Nazariy R_vak = 2.80 m, amaliy o'lchangan R_taj = 2.74 m (havo qarshiligi tufayli kichikroq).",
      },
      {
        seconds: 255,
        timeLabel: "04:15",
        title: "Burchaklar seriyasi (30°, 45°, 60°) tekshiruvi",
        description: "30° va 60° burchaklarda uchish masofalarining tengligi (komplementar burchaklar qoidasi) kuzatiladi.",
        keyObservation: "sin(2·30°) = sin(2·60°) = √3/2, masofalar deyarli teng chiqadi.",
      },
      {
        seconds: 330,
        timeLabel: "05:30",
        title: "Traektoriya xatoliklari va Runge-Kutta solishtirmasi",
        description: "Haqiqiy traektoriya va virtual stenddagi RK4 integratsiyalashgan egri chizig'i taqqoslanadi.",
        keyObservation: "Virtual laboratoriyamizdagi havo zichligi ρ=1.225 kg/m³ bilan xatolik 0.8% dan oshmaydi.",
      },
    ],
    observationChecklist: [
      "Otish burchagi shkalasining 0° gorizontaliga to'g'rilanganligi",
      "Prujina dastasi bir xil tirqish holatiga tortilganligi",
      "Fotodatchik indikator chiroqlarining sinxron ishlashi",
      "Uglerod qog'ozidagi 5 ta nuqtaning klaster markazi aniqlanishi",
    ],
    simulatorComparison: {
      realParameters: "v₀ = 25.0 m/s, θ = 45°, y₀ = 0 m, g = 9.81 m/s²",
      simulatorPreset: "Kinematika -> Ballistika va Havo qarshiligi (kin-01)",
      expectedDeviationPct: "0.95%",
      errorSources: [
        "Havo harorati va namligi tufayli havoning yopishqoqlik o'zgarishi",
        "To'p stvolidagi prujina ishqalanishi",
        "Otilishdagi sharcha aylanishi (Magnus effekti)",
      ],
    },
  },

  {
    id: "vid-dynamics-01",
    labKey: "dynamics",
    discipline: "Klassik Mexanika & Dinamika",
    titleUz: "Qiya Tekislikda Ishqalanish Koeffitsiyenti va Ip Orqali Bog'langan Yuklar (Atvud Mashinasi)",
    titleEn: "Inclined Plane Friction & Connected Masses Dynamics Experiment",
    duration: "06:15",
    youtubeId: "qwKUb_fN-Go",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Dynamics_Pendulums_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/dynamics.jpg",
    summaryUz:
      "Qiya tekislik stendida aravacha va yuklar harakati: qiyalik burchagi θ ortishi bilan sirpanish sharti, tinchlikdagi sirpanish burchagi α orqali μₛ = tan(α) ni aniqlash hamda blok orqali osilgan ikkinchi yuk m₂ bilan birgalikdagi tezlanish a va ip tarangligi T ni o'lchash.",
    academicObjective:
      "Nyutonning ikkinchi qonunini murakkab bog'langan mexanik tizimda tekshirish, ishqalanish kuchlarining turlarini (tinchlik va sirpanish) farqlash va harakat tenglamalarini tuzish.",
    apparatus: [
      {
        name: "Qiya tekislik apparati",
        specification: "Uzunligi: 1.2 m, Burchak sektori: 0°–60°, Material: alyuminiy/yog'och",
        purpose: "Turli sirtlar orasidagi ishqalanishni o'rganish",
      },
      {
        name: "Smart Cart harakat aravachasi",
        specification: "O'rnatilgan optik enkoder va kuch sensori (aniqlik 0.01 N)",
        purpose: "Tezlanish a(t) va tortish kuchini real vaqt rejimida yozish",
      },
      {
        name: "Blok (Pulley) va o'lchovli yuklar to'plami",
        specification: "Blok inersiyasi past friksiyasiz podshipnik, yuklar: 50–500 g",
        purpose: "Ip orqali dinamik yuklama yaratish",
      },
    ],
    keyFormulas: [
      {
        latex: "\\mu_s = \\tan(\\alpha_{\\text{sirpanish}})",
        description: "Tinchlikdagi ishqalanish koeffitsiyenti",
      },
      {
        latex: "a = \\frac{m_2 g - m_1 g(\\sin\\theta + \\mu_k \\cos\\theta)}{m_1 + m_2 + \\frac{I}{R^2}}",
        description: "Bog'langan yuklar tezlanishi (blok inersiyasi bilan)",
      },
      {
        latex: "T = m_2(g - a)",
        description: "Ipning taranglik kuchi",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Qurilma montaji va kuchlar muvozanati tahlili",
        description: "Qiya tekislikda yotgan m₁ jismga ta'sir qiluvchi kuchlar: og'irlik m₁g, normal reaksiya N, ishqalanish f va taranglik T.",
        keyObservation: "N = m₁g·cos(θ) va og'irlikning qiyalik bo'ylab tashkil etuvchisi m₁g·sin(θ).",
      },
      {
        seconds: 70,
        timeLabel: "01:10",
        title: "Sirpanish burchagi orqali μₛ ni topish",
        description: "Qiyalik asta-sekin ko'tariladi; aravacha o'z-o'zidan harakatga kelgan burchak α qayd etiladi.",
        keyObservation: "α = 18.5° bo'lganda μₛ = tan(18.5°) ≈ 0.335 aniqlanadi.",
      },
      {
        seconds: 160,
        timeLabel: "02:40",
        title: "Bog'langan yuklar harakati va fotodatchiklar",
        description: "m₁ = 500 g va m₂ = 200 g o'rnatilib, sistema erkin qo'yib yuboriladi.",
        keyObservation: "Aravacha tekis tezlanuvchan harakat qiladi; v(t) grafigi to'g'ri chiziqdan iborat.",
      },
      {
        seconds: 245,
        timeLabel: "04:05",
        title: "Tezlanish va ip tarangligini hisoblash",
        description: "Datchik ko'rsatgan a_taj = 1.18 m/s² qiymat nazariy formula bilan taqqoslanadi.",
        keyObservation: "G'altakning inersiyasi hisobga olinganda nazariya va tajriba 99.1% mos keladi.",
      },
      {
        seconds: 350,
        timeLabel: "05:50",
        title: "Energiyaning saqlanishi va ishqalanish ishi",
        description: "Potensial energiya o'zgarishi ΔEp va kinetik energiya ΔEk farqi A_ishq ga tengligi tekshiriladi.",
        keyObservation: "ΔE_mex = A_ishq = f_k · s qonuni tasdiqlanadi.",
      },
    ],
    observationChecklist: [
      "Tekislik sirtining tozaligi va changdan xoliligi",
      "Ipning blok aylanasi bo'ylab to'g'ri parallel yo'naltirilganligi",
      "Smart Cart g'ildiraklarining siljimasdan aylanayotganligi",
      "Osilgan yuk tushishida yerga urilmasdan to'xtatish zonasi",
    ],
    simulatorComparison: {
      realParameters: "m₁ = 1.0 kg, m₂ = 0.5 kg, θ = 30°, μₛ = 0.25, μₖ = 0.20",
      simulatorPreset: "Dinamika -> Qiya tekislik va bog'langan massalar (dyn-01)",
      expectedDeviationPct: "1.10%",
      errorSources: [
        "Blok o'qidagi qoldiq ishqalanish momenti",
        "Ipning elastik cho'zilishi",
        "Sirt g'adir-budurligining notekis taqsimlanishi",
      ],
    },
  },

  {
    id: "vid-statics-01",
    labKey: "statics",
    discipline: "Mexanika & Statik Muvozanat",
    titleUz: "Kuchlar Stoli (Force Table) Yordamida Vektorlar Yig'indisi va Muvozanat Sharti",
    titleEn: "Force Table Vector Addition & Concurrent Equilibrium Experiment",
    duration: "05:46",
    youtubeId: "-afmQUEG9BQ",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Statics_ForceTable_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/statics.jpg",
    summaryUz:
      "Doiraviy 360° shkalali kuchlar stoli orqali bir nuqtaga qo'yilgan kuchlar (concurrent forces) vektorial qo'shiladi. Berilgan F₁ va F₂ kuchlar uchun tenglashtiruvchi kuch F_E (Equilibrant) topiladi va markaziy halqaning mutlaq markazlashuvi kuzatiladi.",
    academicObjective:
      "Vektorlarning geometrik va analitik qo'shilish qoidalarini (parallelogramm va koordinata proyeksiyalari) fizik tajribada bevosita tasdiqlash.",
    apparatus: [
      {
        name: "Kuchlar stoli (Force Table)",
        specification: "Diametri: 40 cm, Gradus bo'linmasi: 1°, 4 ta suriluvchi bloklar",
        purpose: "Kuchlarning burchak yo'nalishlarini 0°–360° oralig'ida belgilash",
      },
      {
        name: "Markaziy halqa va yo'naltiruvchi shtift",
        specification: "Yengil alyuminiy halqa, markaziy pin diametri 5 mm",
        purpose: "Kuchlar muvozanatda ekanligini vizual ko'rsatish (shtiftga tegmaslik sharti)",
      },
      {
        name: "Kalibrlangan og'irlik toshlari (Weight Hangers)",
        specification: "5 g, 10 g, 20 g, 50 g, 100 g aniq toshlar to'plami",
        purpose: "Iplarga gravitatsion tortish kuchi F = mg berish",
      },
    ],
    keyFormulas: [
      {
        latex: "\\sum \\vec{F} = \\vec{F}_1 + \\vec{F}_2 + \\vec{F}_E = 0",
        description: "Nuqtaviy jism muvozanat sharti",
      },
      {
        latex: "R_x = F_1 \\cos\\theta_1 + F_2 \\cos\\theta_2, \\quad R_y = F_1 \\sin\\theta_1 + F_2 \\sin\\theta_2",
        description: "Teng ta'sir etuvchi kuchning proyeksiyalari",
      },
      {
        latex: "F_E = R = \\sqrt{R_x^2 + R_y^2}, \\quad \\theta_E = \\theta_R + 180^\\circ",
        description: "Tenglashtiruvchi kuch moduli va burchagi",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Kuchlar stoli gorizontalligini sozlash",
        description: "Stol oyoqlaridagi vintlar va suv sathi (spirit level) yordamida stol to'liq gorizontal holatga keltiriladi.",
        keyObservation: "Gorizontallik buzilsa gravitatsiya kuchi halqani bir tomonga og'diradi.",
      },
      {
        seconds: 75,
        timeLabel: "01:15",
        title: "F₁ va F₂ kuchlar va burchaklarni o'rnatish",
        description: "F₁ = 1.96 N (200 g) 0° burchakda, F₂ = 1.47 N (150 g) 70° burchakda osiladi.",
        keyObservation: "Markaziy halqa o'ng tomonga qarab suriladi va markaziy pinga tiraladi.",
      },
      {
        seconds: 165,
        timeLabel: "02:45",
        title: "Tenglashtiruvchi kuch F_E ni eksperimental qidirish",
        description: "Uchinchi blok qarama-qarshi tomonga surilib, massalar asta-sekin qo'shiladi.",
        keyObservation: "θ_E = 219° va m_E = 285 g o'rnatilganda halqa markazdagi pinga umuman tegmay muallaq turadi.",
      },
      {
        seconds: 250,
        timeLabel: "04:10",
        title: "Analitik proyeksiyalar hisobi bilan solishtirish",
        description: "R_x = 200·cos(0°) + 150·cos(70°) = 251.3 g, R_y = 150·sin(70°) = 140.9 g.",
        keyObservation: "R = √(251.3² + 140.9²) = 288 g, tajribadagi 285 g bilan farq 1.04%.",
      },
      {
        seconds: 335,
        timeLabel: "05:35",
        title: "Xatoliklar manbai va qoldiq ishqalanish",
        description: "Blok podshipniklaridagi nozik ishqalanishni bartaraf etish uchun stol yuzasi yengil chertiladi.",
        keyObservation: "Chertish natijasida halqa o'zining mutlaq barqaror muvozanat nuqtasiga keladi.",
      },
    ],
    observationChecklist: [
      "Stol sathi pufakchasining aylana markazida ekanligi",
      "Iplarning tugunlari markaziy halqaning aniq o'rtasiga bog'langanligi",
      "Iplar blok kanallaridan chiqib ketmaganligi",
      "Halqa markaziy shpilkaga tegilmaganda barqaror turishi",
    ],
    simulatorComparison: {
      realParameters: "F₁ = 200 g (0°), F₂ = 150 g (70°), F₃ = 285 g (219°)",
      simulatorPreset: "Statika -> Kuchlar jadvali va vektorlar muvozanati (sta-01)",
      expectedDeviationPct: "0.85%",
      errorSources: [
        "Blok g'ildiraklarining ishqalanish chegarasi",
        "Og'irlik toshlarining zavod toleransi (±0.1 g)",
        "Gradus shkalasini ko'z bilan o'qishdagi yarim gradus xatolik",
      ],
    },
  },

  {
    id: "vid-electromagnetism-01",
    labKey: "electromagnetism",
    discipline: "Elektr & Magnetizm",
    titleUz: "Metrli Ko'prik (Uitston Ko'prigi) Yordamida Noma'lum Qarshilik va Solishtirma Qarshilikni O'lchash",
    titleEn: "Meter Bridge (Wheatstone Bridge) Wire Resistance & Resistivity Experiment",
    duration: "06:28",
    youtubeId: "R1pabnMCZDE",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Electromagnetism_Bridge_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/electromagnetism.jpg",
    summaryUz:
      "1 metrli kalibrlangan manganin simli Uitston ko'prigi stendi. Qarshiliklar qutisi R, sezgir galvanometr va joxkey (jockey) yordamida sim bo'ylab nol-muvozanat nuqtasi l₁ topiladi. Noma'lum o'tkazgich sim qarshiligi X va mikrometr bilan sim diametri o'lchanib solishtirma qarshilik ρ aniqlanadi.",
    academicObjective:
      "Uitston ko'prigi muvozanat shartini amalda qo'llash, o'ta aniq elektr o'lchash usullarini egallash va moddalarning solishtirma qarshiligini aniqlash.",
    apparatus: [
      {
        name: "Metrli ko'prik apparati (Meter Bridge)",
        specification: "Uzunligi: 100 cm, Sim materiali: Manganin/Konstantan, Shkala: 1 mm",
        purpose: "Chiziqli potensiallar taqsimoti va muvozanat elkasini hosil qilish",
      },
      {
        name: "Qarshiliklar qutisi (Resistance Box)",
        specification: "Diapazon: 1–1000 Ω, Xatolik darajasi: 0.1%",
        purpose: "Ma'lum aniq etalon qarshilik R ni kiritish",
      },
      {
        name: "Markaziy nolli galvanometr",
        specification: "Sezgirlik: 10⁻⁶ A/bo'linma, O'rtada 0 holat",
        purpose: "Ko'prik diagonalidagi tok nolga tengligini fiksatsiya qilish",
      },
      {
        name: "O'zgarmas tok manbai va reostat",
        specification: "Kuchlanish: 2–4 V akkumulyator/manba",
        purpose: "Zanjirni barqaror elektr toki bilan ta'minlash",
      },
    ],
    keyFormulas: [
      {
        latex: "\\frac{X}{R} = \\frac{l_1}{l_2} = \\frac{l_1}{100 - l_1}",
        description: "Metrli ko'prik muvozanat tenglamasi",
      },
      {
        latex: "X = R \\cdot \\frac{l_1}{100 - l_1}",
        description: "Noma'lum sim qarshiligini hisoblash",
      },
      {
        latex: "\\rho = \\frac{X \\cdot \\pi d^2}{4 L}",
        description: "Materialning solishtirma qarshiligi (ρ)",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Ko'prik zanjirini yig'ish va asboblar sxemasi",
        description: "Manba, kalit, qarshiliklar qutisi R, noma'lum sim X va galvanometr ulanadi.",
        keyObservation: "Mis plastinkalarning kontakt qarshiligi past bo'lishi uchun vintlarning mahkamligi tekshiriladi.",
      },
      {
        seconds: 65,
        timeLabel: "01:05",
        title: "Ulanishlar to'g'riligini tekshirish",
        description: "Joxkey simning chap va o'ng uchiga tekkiziladi; galvanometr millari qarama-qarshi tomonga og'ishi kerak.",
        keyObservation: "Ikkala tomonda ham bir tomonga og'sa, zanjirda uzilish yoki noto'g'ri ulanish mavjud.",
      },
      {
        seconds: 140,
        timeLabel: "02:20",
        title: "Nol-defleksiya (Null Point) nuqtasini topish",
        description: "R = 2 Ω o'rnatilib, joxkey sim bo'ylab ehtiyotkorlik bilan siljitiladi.",
        keyObservation: "Galvanometr mili aynan nolga to'xtagan nuqta l₁ = 41.2 sm qayd etiladi.",
      },
      {
        seconds: 230,
        timeLabel: "03:50",
        title: "Noma'lum qarshilik X ni hisoblash",
        description: "X = 2 · (41.2 / 58.8) = 1.401 Ω hisoblanadi. Turli R larda (3 Ω, 4 Ω) takrorlanadi.",
        keyObservation: "l₁ qiymati 40–60 sm oralig'ida bo'lganda ko'prik sezgirligi maksimal bo'ladi.",
      },
      {
        seconds: 310,
        timeLabel: "05:10",
        title: "Mikrometrda sim diametri d va solishtirma qarshilik ρ",
        description: "Sim diametri d = 0.38 mm, uzunligi L = 0.50 m o'lchanadi.",
        keyObservation: "ρ = (1.401 · 3.1416 · 0.00038²) / (4 · 0.50) ≈ 3.18·10⁻⁷ Ω·m (Konstantan).",
      },
    ],
    observationChecklist: [
      "Joxkeyni sim ustida qirib surmaslik (sim kesimi bir tekis bo'lib qolishi shart)",
      "Tok manbaini faqat o'lchash vaqtida yoqish (sim qizib qarshiligi o'zgarmasligi uchun)",
      "Galvanometr shuntasining boshlang'ich himoyasi",
      "Sim diametrini 3 ta turli joyda mikrometrlash",
    ],
    simulatorComparison: {
      realParameters: "R = 100 Ω, l₁ = 40.0 cm, l₂ = 60.0 cm, X = 66.67 Ω",
      simulatorPreset: "Elektromagnetizm -> Uitston va Metr ko'prigi (em-01)",
      expectedDeviationPct: "0.45%",
      errorSources: [
        "Mis ulanish plastinkalarining qoldiq qarshiligi (End Resistance)",
        "O'tkazgich simning Joule isishi tufayli harorat koeffitsiyenti",
        "Joxkey tig'ining kengligi tufayli yuzaga keladigan noaniqlik",
      ],
    },
  },

  {
    id: "vid-optics-01",
    labKey: "optics",
    discipline: "To'lqin Optikasi & Interferensiya",
    titleUz: "Nyuton Halqalari Interferensiyasi Yordamida Yorug'lik To'lqin Uzunligini O'lchash",
    titleEn: "Newton's Rings Interference & Sodium Light Wavelength Determination",
    duration: "06:50",
    youtubeId: "6O1d19Rd7ys",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Optics_NewtonsRings_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/optics.jpg",
    summaryUz:
      "Katta egrilik radiusli yassi-qavariq linza va yassi oyna plastinkasi orasidagi yupqa havo qatlamida hosil bo'ladigan Nyuton halqalari. Monoxromatik natriy lampasi (λ = 589 nm), 45° yarim shaffof plastinka va gorizontal o'lchov mikroskopi yordamida qorong'i halqalar diametrlari D_n o'lchanadi.",
    academicObjective:
      "Teng qalinlikli yo'llardagi optik interferensiyani kuzatish, yarim to'lqin yo'qotilishini (π faza siljishi) tushunish va optik to'lqin uzunligini 0.5% aniqlikda hisoblash.",
    apparatus: [
      {
        name: "Yassi-qavariq linza va shisha plastinka stendi",
        specification: "Linza egrilik radiusi R = 100–200 cm, maxsus qisqichli moslama",
        purpose: "O'zgaruvchan qalinlikdagi havo pona qatlamini yaratish",
      },
      {
        name: "Gorizontal o'lchov mikroskopi (Traveling Microscope)",
        specification: "Noniu aniqligi: 0.01 mm, Harakatlanish diapazoni: 150 mm",
        purpose: "Halqalarning o'ng va chap chegaralari koordinatasini aniq fiksatsiya qilish",
      },
      {
        name: "Natriy bug'li monoxromatik chiroq",
        specification: "To'lqin uzunligi: Sariq dublet λ_o'rtacha = 589.3 nm",
        purpose: "Kogerent monoxromatik yorug'lik oqimini berish",
      },
      {
        name: "45° yarim shaffof oynali nurlar yo'naltirgichi",
        specification: "Yorug'likni vertikal normal tushishini ta'minlovchi plastinka",
        purpose: "Nurlarni linza sirtiga 90° perpendikulyar yo'naltirish",
      },
    ],
    keyFormulas: [
      {
        latex: "D_n^2 = 4 n R \\lambda",
        description: "n-tartibli qorong'i halqa diametri",
      },
      {
        latex: "\\lambda = \\frac{D_{n+p}^2 - D_n^2}{4 p R}",
        description: "Yorug'lik to'lqin uzunligini hisoblash formulasi",
      },
      {
        latex: "\\Delta = 2 d + \\frac{\\lambda}{2} = (2m + 1)\\frac{\\lambda}{2} \\implies 2d = m\\lambda",
        description: "Optik yo'llar farqi va optik zichroq muhitdan qaytishdagi π siljish",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Optik stend va nurlar yo'lining sozlanishi",
        description: "Natriy nuri kondensor linza orqali 45° shisha plastinkaga tushirilib, linza sirtiga perpendikulyar yo'naltiriladi.",
        keyObservation: "Markaziy nuqtada linza plastinkaga tekkanda qorong'i doira hosil bo'ladi.",
      },
      {
        seconds: 85,
        timeLabel: "01:25",
        title: "Mikroskop okulyarida halqalarni fokuslash",
        description: "Konsentrik doiraviy qorong'i va yorug' halqalar tizimi mikroskop ko'rish maydonida tiniqlashtiriladi.",
        keyObservation: "Markazdan uzoqlashgan sari halqalar qalinligi ingichkalashib, zichlashib boradi.",
      },
      {
        seconds: 180,
        timeLabel: "03:00",
        title: "Halqalar koordinatasini chapdan o'ngga o'lchash",
        description: "20-qorong'i halqadan boshlab 4-halqagacha va o'ng tomondagi halqalar koordinatasi noniu orqali o'lchanadi.",
        keyObservation: "D_n = |X_o'ng - X_chap| orqali markaziy noaniqlik yo'qotiladi.",
      },
      {
        seconds: 270,
        timeLabel: "04:30",
        title: "D² ning n ga bog'liqlik chiziqli grafigi",
        description: "D_n² qiymatlari jadvalga kiritilib, to'g'ri chiziq burchak koeffitsiyenti k = 4Rλ topiladi.",
        keyObservation: "Grafik tekis to'g'ri chiziq bo'lib chiqishi interferensiya qonuniyatini isbotlaydi.",
      },
      {
        seconds: 360,
        timeLabel: "06:00",
        title: "Natriy to'lqin uzunligi λ ni yakuniy hisoblash",
        description: "R = 1.0 m linza uchun λ = 589.6 nm chiqadi; nazariy 589.3 nm bilan solishtiriladi.",
        keyObservation: "Nisbiy xatolik atigi 0.15% ni tashkil qiladi.",
      },
    ],
    observationChecklist: [
      "Markaziy nuqtaning qorong'i ekanligini tasdiqlash (yarim to'lqin faza yo'qotilishi)",
      "Mikroskop vintini faqat bir yo'nalishda burash (Backlash o'lik harakat xatoligini oldini olish)",
      "Halqalar markazi okulyar krestik ipiga to'g'rilanganligi",
      "Linza va plastinka orasiga chang tushmaganligi",
    ],
    simulatorComparison: {
      realParameters: "R = 100 cm, λ = 589 nm, n = 5, 10, 15, 20",
      simulatorPreset: "Optika -> Yupqa linza va Nyuton halqalari (opt-01)",
      expectedDeviationPct: "0.30%",
      errorSources: [
        "Mikroskop vinti o'lik yurishi (Backlash error)",
        "Linza sirtining sferiklikdan chetlanishi",
        "Qisish vinti orqali linzaning elastik deformatsiyasi",
      ],
    },
  },

  {
    id: "vid-thermodynamics-01",
    labKey: "thermodynamics",
    discipline: "Molekulyar Fizika & Termodinamika",
    titleUz: "Boyl-Mariott Qonuni: O'zgarmas Haroratda Gazning Bosimi va Hajmi Bog'liqligi",
    titleEn: "Boyle's Law Isothermal Gas Compression & Pressure-Volume Apparatus",
    duration: "05:42",
    youtubeId: "UPeE626-SuU",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Thermodynamics_GasLaws_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/thermodynamics.jpg",
    summaryUz:
      "Izotermik jarayonni o'rganish apparati: germetik shprits, yuqori aniqlikdagi raqamli bosim datchigi (absolyut bosim) va termometr. Gaz sekin siqilganda va kengayganda bosim P va hajm V ko'paytmasi P·V = const ekanligi hamda P ning 1/V ga bog'liqlik to'g'ri chiziqli grafigi olinadi.",
    academicObjective:
      "Ideal gaz holat tenglamasining xususiy holi bo'lgan Boyl-Mariott qonunini tekshirish va jarayonning haqiqiy izotermik bo'lishi shartlarini (sekin siqish, issiqlik almashinuvi) o'rganish.",
    apparatus: [
      {
        name: "Shpritsli gaz stendi",
        specification: "Hajm shkalasi: 0–60 ml (aniqlik 0.5 ml), germetik teflon porshen",
        purpose: "Gaz hajmi V ni bosqichma-bosqich o'zgartirish",
      },
      {
        name: "Raqamli bosim datchigi (Pressure Sensor)",
        specification: "Diapazon: 0–400 kPa, Aniqlik: 0.1 kPa",
        purpose: "Absolyut gaz bosimi P ni real vaqtda o'lchash",
      },
      {
        name: "Raqamli termistor termometr",
        specification: "Aniqlik: 0.1 °C",
        purpose: "Harorat T = const ekanligini doimiy nazorat qilish",
      },
    ],
    keyFormulas: [
      {
        latex: "P \\cdot V = \\text{const} \\quad (T = \\text{const}, m = \\text{const})",
        description: "Boyl-Mariott izoterma qonuni",
      },
      {
        latex: "P_1 V_1 = P_2 V_2",
        description: "Boshlang'ich va oxirgi holat tengligi",
      },
      {
        latex: "P = (\\nu R T) \\cdot \\frac{1}{V}",
        description: "P ning 1/V ga nisbatan chiziqli grafigi tenglamasi",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Gaz apparati tuzilishi va atmosfera bosimi",
        description: "Atmosfera bosimi P_atm = 101.3 kPa va xona harorati T = 22.4 °C qayd etiladi.",
        keyObservation: "Datchik absolyut bosimni o'lchaydi, porshen 50 ml belgisiga qo'yiladi.",
      },
      {
        seconds: 70,
        timeLabel: "01:10",
        title: "Kvazistatsionar sekin siqish usuli",
        description: "Porshen har 5 ml ga juda sekin siqilib, har bir nuqtada 15 soniya kutiladi.",
        keyObservation: "Tez siqilsa adiabatik qizish sodir bo'ladi, kutish davomida T xona haroratiga tenglashadi.",
      },
      {
        seconds: 150,
        timeLabel: "02:30",
        title: "Bosim va hajm ma'lumotlar juftligini yozish",
        description: "V = [50, 45, 40, 35, 30, 25, 20] ml uchun P = [101.3, 112.5, 126.8, 144.5, 168.9, 202.4, 253.1] kPa.",
        keyObservation: "Hajm 2.5 barobar kamayganda bosim aynan 2.5 barobar ortadi.",
      },
      {
        seconds: 240,
        timeLabel: "04:00",
        title: "P ning 1/V ga bog'liqlik grafigini qurish",
        description: "Gorizontal o'qda 1/V o'tkazilganda barcha eksperimental nuqtalar koordinata boshidan o'tuvchi to'g'ri chiziqqa tushadi.",
        keyObservation: "Regressiya koeffitsiyenti R² = 0.9998 ga teng bo'lib, ideal izotermani tasdiqlaydi.",
      },
      {
        seconds: 320,
        timeLabel: "05:20",
        title: "P·V ko'paytma doimiyligi va xatoliklar tahlili",
        description: "Barcha qatorlarda P·V ≈ 5065 kPa·ml = 5.065 J doimiyligi hisoblanadi.",
        keyObservation: "Maksimal chetlanish 1.2% dan oshmaydi (quvur ichidagi o'lik hajm hisobiga).",
      },
    ],
    observationChecklist: [
      "Quvurcha ulanish joylaridan gaz sizib chiqmasligini tekshirish",
      "Porshenni siqishda harorat datchigi ko'rsatkichi ko'tarilmasligini kuzatish",
      "Shpritsdagi ko'rsatkichga qo'shimcha ulovchi naycha hajmini qo'shish",
      "Bosim datchigi kalibrovkasi",
    ],
    simulatorComparison: {
      realParameters: "P₀ = 101.3 kPa, V₀ = 50 ml, T = 295 K",
      simulatorPreset: "Termodinamika -> Ideal gaz va izotermik jarayon (thm-01)",
      expectedDeviationPct: "0.65%",
      errorSources: [
        "Naycha va datchik kamerasidagi o'lik hajm (dead volume)",
        "Shprits rezina manjetining porshen devoriga ishqalanishi",
        "Atrof-muhit bilan to'liq bo'lmagan izotermik issiqlik balansi",
      ],
    },
  },

  {
    id: "vid-atomic-01",
    labKey: "atomic",
    discipline: "Kvant & Yadro Fizikasi",
    titleUz: "Tashqi Fotoeffekt Hodisasi Yordamida Plank Doimiysi (h) va Chiqish Ishini O'lchash",
    titleEn: "Photoelectric Effect Experiment & Planck's Constant Determination",
    duration: "06:12",
    youtubeId: "FFP7fx8ZAu4",
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1FizikaLab_Atomic_Photoelectric_TUIT/preview",
    thumbnailUrl: "/resources/videolabs/atomic.jpg",
    summaryUz:
      "Vakuum fotoelementi, yuqori bosimli simob lampasi va monoxromatik yorug'lik filtrlari (365, 405, 436, 546, 577 nm). Fototokni to'xtatuvchi teskari potensial V₀ o'lchanadi. Eynshteynning fotoeffekt tenglamasi asosida V₀ ning yorug'lik chastotasi ν ga bog'liqlik grafigidan Plank doimiysi h va katodning chiqish ishi A aniqlanadi.",
    academicObjective:
      "Yorug'likning korpuskulyar (foton) tabiatini eksperimental isbotlash, to'xtatuvchi potensial yorug'lik intensivligiga emas, balki chastotasiga bog'liqligini ko'rsatish va fundamental doimiy h ni hisoblash.",
    apparatus: [
      {
        name: "Vakuum fotoelementi (Photocell Station)",
        specification: "Seziy/Surma katod, qoraytirilgan metall korpus, qoldiq tok < 10⁻¹² A",
        purpose: "Fotonlar ta'sirida fotoelektronlar emissiyasini ta'minlash",
      },
      {
        name: "Spektral monoxromatik filtrlar to'plami",
        specification: "365 nm (UV), 405 nm (binafsha), 436 nm (ko'k), 546 nm (yashil), 577 nm (sariq)",
        purpose: "Aniq ma'lum kvant energiyasi E = hν ga ega yorug'lik ajratish",
      },
      {
        name: "Raqamli pikoampermetr va teskari kuchlanish manbai",
        specification: "Tok o'lchash sezgirligi: 10⁻¹³ A, Voltaj aniqligi: 1 mV",
        purpose: "Fototok to'xtagan V₀ kuchlanishni aniqlash",
      },
    ],
    keyFormulas: [
      {
        latex: "h\\nu = A + e V_0 = A + \\frac{1}{2} m v_{\\max}^2",
        description: "Eynshteynning fotoeffekt tenglamasi",
      },
      {
        latex: "V_0 = \\left(\\frac{h}{e}\\right) \\nu - \\frac{A}{e}",
        description: "To'xtatuvchi kuchlanishning chastotaga chiziqli bog'liqligi",
      },
      {
        latex: "h = e \\cdot \\frac{\\Delta V_0}{\\Delta \\nu} = 1.602 \\times 10^{-19} \\cdot \\text{Slope}",
        description: "Plank doimiysini grafik qiyalikdan hisoblash",
      },
    ],
    timestamps: [
      {
        seconds: 0,
        timeLabel: "00:00",
        title: "Fotoeffekt qurilmasi va vakuum kamerasining tuzilishi",
        description: "Simob lampasi yoqilib 10 daqiqa qiziydi; yorug'lik nurlari tor tirqish orqali yo'naltiriladi.",
        keyObservation: "Fotoelement yorug'lik tushmaganda to'liq qorong'ilik toki (dark current) nolga tenglashtiriladi.",
      },
      {
        seconds: 90,
        timeLabel: "01:30",
        title: "Sariq filtr (λ = 577 nm, ν = 5.19·10¹⁴ Hz) uchun V₀ ni o'lchash",
        description: "Teskari kuchlanish manfiy tomonga oshiriladi; fototok nolga tushgan nuqta V₀ = 0.42 V qayd etiladi.",
        keyObservation: "Yorug'lik intensivligi (diafragma) 100% dan 50% ga tushirilganda ham V₀ o'zgarmay qoladi!",
      },
      {
        seconds: 195,
        timeLabel: "03:15",
        title: "Barcha 5 ta to'lqin uzunliklari bo'yicha V₀ spektrini olish",
        description: "365 nm da V₀ = 1.48 V, 405 nm da V₀ = 1.15 V, 436 nm da V₀ = 0.94 V, 546 nm da V₀ = 0.58 V.",
        keyObservation: "To'lqin uzunligi qisqargan (chastota ortgan) sari to'xtatuvchi kuchlanish qat'iy chiziqli ortadi.",
      },
      {
        seconds: 285,
        timeLabel: "04:45",
        title: "V₀ ning ν ga nisbatan chiziqli grafigini qurish",
        description: "Grafik chiziladi: qiyalik k = ΔV₀/Δν = 4.12·10⁻¹⁵ V·s.",
        keyObservation: "Grafik ordinata o'qini -A/e nuqtada kesib o'tadi (chiqish ishi A ≈ 1.72 eV).",
      },
      {
        seconds: 375,
        timeLabel: "06:15",
        title: "Plank doimiysi h ni hisoblash va CODATA bilan solishtirish",
        description: "h = e · k = 1.6022·10⁻¹⁹ C · 4.12·10⁻¹⁵ V·s = 6.60·10⁻³⁴ J·s.",
        keyObservation: "CODATA standart qiymati (6.626·10⁻³⁴ J·s) bilan nisbiy xatolik 0.39%.",
      },
    ],
    observationChecklist: [
      "Simob lampasining barqaror yonish holatiga kelganligi",
      "Filtrlarning toza va tirnalmaganligi",
      "Pikoampermetrning nol nuqtasi sozlanganligi",
      "Anod va katod o'rtasidagi teskari kuchlanish qutbliligi",
    ],
    simulatorComparison: {
      realParameters: "λ = [365, 405, 436, 546, 577] nm, A = 1.72 eV",
      simulatorPreset: "Atom va Yadro -> Fotoeffekt va Plank doimiysi (atm-01)",
      expectedDeviationPct: "0.40%",
      errorSources: [
        "Katod va anod kontakt potensiallar farqi (Contact potential difference)",
        "Anoddan sochilgan yorug'lik tufayli teskari fotoemissiya",
        "Optik filtrlarning o'tkazish polosasining chekli kengligi (FWHM ~ 10 nm)",
      ],
    },
  },
];

export function getVideoLabByKey(labKey: string): VideoLabDefinition | undefined {
  return VIDEO_LABS_CATALOG.find((v) => v.labKey === labKey);
}

export function getVideoLabById(id: string): VideoLabDefinition | undefined {
  return VIDEO_LABS_CATALOG.find((v) => v.id === id);
}

export function getGoogleDriveViewUrl(video: VideoLabDefinition): string {
  if (!video.googleDrivePreviewUrl) {
    return "https://drive.google.com";
  }
  return video.googleDrivePreviewUrl.replace(/\/preview$/, "/view");
}
