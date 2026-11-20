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

export interface VideoTrack {
  language: "uz" | "en";
  languageLabel: string;
  institution: string;
  title: string;
  youtubeId: string;
  googleDrivePreviewUrl: string;
  duration: string;
  summary: string;
  timestamps: VideoTimestampBookmark[];
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
  tracks?: {
    uz: VideoTrack;
    en: VideoTrack;
  };
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
    googleDrivePreviewUrl: "https://drive.google.com/file/d/1RdFqkJuNrenYAIkpd1QUtNz_YqW79CgW/preview",
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (OTM Stendi)",
    "institution": "TATU Fizika kafedrasi & Oliy ta'lim laboratoriya stendi",
    "title": "Shtangensirkul va Mikrometr Yordamida Chiziqli O'lchashlar",
    "youtubeId": "SQae73zfknQ",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1RdFqkJuNrenYAIkpd1QUtNz_YqW79CgW/preview",
    "duration": "06:42",
    "summary": "Laboratoriya sharoitida shtangensirkul (0.02 mm) va mikrometr (0.01 mm) yordamida qattiq jismlarning o'lchamlari va asbob xatoligi.",
    "timestamps": [
      {
        "seconds": 15,
        "timeLabel": "00:15",
        "title": "Asboblar bilan tanishish",
        "description": "Shtangensirkul va mikrometr shkalasi",
        "keyObservation": "Noniu bo'linmasi 0.02 mm"
      },
      {
        "seconds": 95,
        "timeLabel": "01:35",
        "title": "Nol xatolikni tekshirish",
        "description": "Jag'lar tutashtirilganda shkala holati",
        "keyObservation": "Nol xatolik mavjud emas"
      },
      {
        "seconds": 180,
        "timeLabel": "03:00",
        "title": "Silindr diametrini o'lchash",
        "description": "Tashqi va ichki o'lchovlar",
        "keyObservation": "d = 25.04 ± 0.02 mm"
      },
      {
        "seconds": 290,
        "timeLabel": "04:50",
        "title": "Mikrometrda plastinka qalinligi",
        "description": "Treschotka ovozi eshitilguncha burash",
        "keyObservation": "t = 2.45 ± 0.01 mm"
      },
      {
        "seconds": 360,
        "timeLabel": "06:00",
        "title": "Xatoliklarni hisoblash",
        "description": "O'rtacha qiymat va standart og'ish",
        "keyObservation": "Nisbiy xatolik < 0.5%"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (PASCO / MIT)",
    "institution": "PASCO Scientific & Classical Mechanics Laboratory",
    "title": "Linear Measurements with Vernier Caliper & Micrometer Screw Gauge",
    "youtubeId": "kwh4T-FvH3w",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Metrology_PASCO_HD/preview",
    "duration": "08:15",
    "summary": "High precision measurement laboratory using Vernier Caliper and Micrometer Screw Gauge with error propagation and uncertainty analysis.",
    "timestamps": [
      {
        "seconds": 20,
        "timeLabel": "00:20",
        "title": "Instrument Anatomy & Least Count",
        "description": "Understanding main scale and vernier scale",
        "keyObservation": "Least count calculation LC = 1MSD - 1VSD"
      },
      {
        "seconds": 110,
        "timeLabel": "01:50",
        "title": "Zero Error Calibration",
        "description": "Positive and negative zero error evaluation",
        "keyObservation": "Zero alignment verified"
      },
      {
        "seconds": 210,
        "timeLabel": "03:30",
        "title": "Caliper Jaw Measurements",
        "description": "Measuring external and internal diameters",
        "keyObservation": "Precision ratchet clamping"
      },
      {
        "seconds": 340,
        "timeLabel": "05:40",
        "title": "Micrometer Precision Spindle",
        "description": "Pitch calculation and thimble divisions",
        "keyObservation": "Resolution: 0.01 mm"
      },
      {
        "seconds": 440,
        "timeLabel": "07:20",
        "title": "Uncertainty & Statistical Treatment",
        "description": "Mean, standard deviation and t-Student factor",
        "keyObservation": "Total relative uncertainty < 0.4%"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (OTM Stendi)",
    "institution": "O‘zbekiston Milliy Universiteti & TATU Stendi",
    "title": "2D Ballistik To‘p Yordamida Gorizontga Burchak Ostida Otilgan Jism Harakati",
    "youtubeId": "l8VUh4pzhKI",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Kinematics_Ballistics_TUIT/preview",
    "duration": "08:15",
    "summary": "2D ballistik to‘p yordamida po‘lat sharning uchish uzoqligi, maksimal ko‘tarilish balandligi va trayektoriya qonuniyatlari.",
    "timestamps": [
      {
        "seconds": 20,
        "timeLabel": "00:20",
        "title": "Ballistik stend tuzilishi",
        "description": "Prujinali to‘p, burchak o‘lchagich va fotodarvoza",
        "keyObservation": "Burchak 0–90° oralig‘ida sozlanadi"
      },
      {
        "seconds": 120,
        "timeLabel": "02:00",
        "title": "Boshlang‘ich tezlik v₀ ni aniqlash",
        "description": "Gorizontal otish (θ = 0°) orqali v₀ ni o‘lchash",
        "keyObservation": "v₀ = 5.24 m/s"
      },
      {
        "seconds": 245,
        "timeLabel": "04:05",
        "title": "Burchak bog‘liqligi (30°, 45°, 60°)",
        "description": "Turli burchaklarda uchish masofasi",
        "keyObservation": "Maksimal masofa 45° da: R = 2.79 m"
      },
      {
        "seconds": 380,
        "timeLabel": "06:20",
        "title": "Trayektoriya tenglamasi",
        "description": "Parabola qonuniyatini grafik tasdiqlash",
        "keyObservation": "H_max = 0.70 m (45° da)"
      },
      {
        "seconds": 460,
        "timeLabel": "07:40",
        "title": "Havo qarshiligi tahlili",
        "description": "Nazariy va amaliy qiymatlar farqi",
        "keyObservation": "Og‘ish 2.8% ni tashkil etadi"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (PASCO / MIT)",
    "institution": "PASCO Scientific & MIT Department of Physics",
    "title": "2D Projectile Motion & Ballistic Launcher Mechanics",
    "youtubeId": "jLFbtK5HZgE",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Kinematics_MIT_Pasco/preview",
    "duration": "09:30",
    "summary": "Precision projectile launcher experiment tracking muzzle velocity, optimal launch angle (45 degrees), flight time, and aerodynamic drag.",
    "timestamps": [
      {
        "seconds": 30,
        "timeLabel": "00:30",
        "title": "Apparatus Overview & Photogates",
        "description": "Optical photogate timers and mini-launcher",
        "keyObservation": "Dual photogate gate spacing: 5.0 cm"
      },
      {
        "seconds": 140,
        "timeLabel": "02:20",
        "title": "Muzzle Velocity Calibration",
        "description": "Horizontal launch trial across 10 repeated fires",
        "keyObservation": "Muzzle velocity v0 = 5.28 ± 0.04 m/s"
      },
      {
        "seconds": 290,
        "timeLabel": "04:50",
        "title": "Angle of Elevation Sweep",
        "description": "Recording landing distance from 15° to 75°",
        "keyObservation": "Maximum range observed at exactly 45°"
      },
      {
        "seconds": 430,
        "timeLabel": "07:10",
        "title": "Complementary Angles Theorem",
        "description": "Verifying range equality for (90 - theta)",
        "keyObservation": "R(30°) matches R(60°) within 1.2%"
      },
      {
        "seconds": 520,
        "timeLabel": "08:40",
        "title": "Aerodynamic Drag & RK4 Modeling",
        "description": "Comparing real impact coordinates with numerical integration",
        "keyObservation": "Stokes drag correction accounted for"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (FarPI / OTM)",
    "institution": "FarPI & TATU Umumiy Fizika Laboratoriyasi",
    "title": "Matematik Mayatnik Yordamida Erkin Tushish Tezlanishini O‘lchash",
    "youtubeId": "1nPAuCcab7c",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Dynamics_Pendulums_TUIT/preview",
    "duration": "07:30",
    "summary": "Matematik mayatnik tebranish davrini o‘lchash va erkin tushish tezlanishi g ni yuqori aniqlikda aniqlash.",
    "timestamps": [
      {
        "seconds": 25,
        "timeLabel": "00:25",
        "title": "Mayatnik stendini o‘rnatish",
        "description": "Ip uzunligi va sharcha massasini belgilash",
        "keyObservation": "Ip uzunligi L = 1.00 m"
      },
      {
        "seconds": 110,
        "timeLabel": "01:50",
        "title": "Kichik burchakli tebranishlar",
        "description": "Burchak θ < 5° da garmonik tebranish",
        "keyObservation": "Davr T massaga bog‘liq emas"
      },
      {
        "seconds": 230,
        "timeLabel": "03:50",
        "title": "50 ta to‘liq tebranish vaqti",
        "description": "Sekundomer yordamida t vaqtni o‘lchash",
        "keyObservation": "t = 100.35 s, T = 2.007 s"
      },
      {
        "seconds": 340,
        "timeLabel": "05:40",
        "title": "Erkin tushish tezlanishini hisoblash",
        "description": "g = 4π²L / T² formulasi bo‘yicha",
        "keyObservation": "g = 9.805 ± 0.015 m/s²"
      },
      {
        "seconds": 410,
        "timeLabel": "06:50",
        "title": "Nisbiy va mutloq xatolik",
        "description": "Toshkent kengligidagi g = 9.801 m/s² bilan solishtirish",
        "keyObservation": "Nisbiy xatolik 0.12%"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (Harvard / Pasco)",
    "institution": "Harvard Natural Sciences & Mechanics Laboratory",
    "title": "Inclined Plane Friction & Connected Masses Dynamics",
    "youtubeId": "qwKUb_fN-Go",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Dynamics_Harvard_Kater/preview",
    "duration": "07:54",
    "summary": "Newton second law, static and kinetic friction coefficient on an incline, and Atwood system dynamic acceleration.",
    "timestamps": [
      {
        "seconds": 30,
        "timeLabel": "00:30",
        "title": "Apparatus Setup & Smart Cart",
        "description": "Low friction track with optical encoder wheel",
        "keyObservation": "Smart cart tare and track leveling"
      },
      {
        "seconds": 125,
        "timeLabel": "02:05",
        "title": "Static Friction Angle",
        "description": "Finding the critical breakaway angle theta_c",
        "keyObservation": "mu_s = tan(theta_c) = 0.285"
      },
      {
        "seconds": 240,
        "timeLabel": "04:00",
        "title": "Kinetic Friction Drag",
        "description": "Motion sensors recording constant acceleration",
        "keyObservation": "mu_k = 0.220 ± 0.008"
      },
      {
        "seconds": 360,
        "timeLabel": "06:00",
        "title": "Connected Mass System (Atwood)",
        "description": "Hanging mass pulling sliding cart over pulley",
        "keyObservation": "a = (m2 - mu*m1)g / (m1 + m2)"
      },
      {
        "seconds": 430,
        "timeLabel": "07:10",
        "title": "Energy Conservation Audit",
        "description": "Work done by friction vs mechanical energy loss",
        "keyObservation": "Energy balance verified within 0.8%"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (OTM Stendi)",
    "institution": "TATU Fizika Stendi & OTM amaliy laboratoriyasi",
    "title": "Kuchlar Stoli (Force Table) Yordamida Vektorlar Yig‘indisi va Muvozanat Sharti",
    "youtubeId": "-afmQUEG9BQ",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Statics_ForceTable_TUIT/preview",
    "duration": "05:55",
    "summary": "Kuchlar stoli yordamida koplanar kuchlarning vektorli qo‘shilishi, natijaviy kuch va tenglashtiruvchi kuchni tajribaviy tekshirish.",
    "timestamps": [
      {
        "seconds": 15,
        "timeLabel": "00:15",
        "title": "Kuchlar stoli konstruktsiyasi",
        "description": "Aylanma disk, 360° shkala, bloklar va markaziy halqa",
        "keyObservation": "Halqa markaziy shtir atrofida erkin joylashadi"
      },
      {
        "seconds": 90,
        "timeLabel": "01:30",
        "title": "Ikki kuchni qo‘shish (F₁ va F₂)",
        "description": "F₁ = 1.0 N (0°), F₂ = 1.5 N (60°)",
        "keyObservation": "Tenglashtiruvchi kuch F₃ qarama-qarshi yo‘naltiriladi"
      },
      {
        "seconds": 180,
        "timeLabel": "03:00",
        "title": "Muvozanat holatiga keltirish",
        "description": "Markaziy halqaning shtirga tegmasligi",
        "keyObservation": "F_eq = 2.18 N, θ_eq = 216.6°"
      },
      {
        "seconds": 270,
        "timeLabel": "04:30",
        "title": "Vektorlar parallelipipedi usuli",
        "description": "Grafik usul bilan analitik natijani solishtirish",
        "keyObservation": "Grafik va analitik qiymatlar 99.5% mos keldi"
      },
      {
        "seconds": 330,
        "timeLabel": "05:30",
        "title": "Uch kuch muvozanat qonuni",
        "description": "ΣF_x = 0 va ΣF_y = 0 shartlarini tekshirish",
        "keyObservation": "Nisbiy xatolik 0.45%"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (PHY105 Lab)",
    "institution": "PHY105 University Physics Mechanics Laboratory",
    "title": "Vector Addition and Coplanar Force Table Equilibrium",
    "youtubeId": "t1vLuhNEg68",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Statics_PHY105_Table/preview",
    "duration": "08:40",
    "summary": "Hands-on vector addition, component resolution (Fx and Fy), resultant force calculation, and equilibrant balancing on a 360-degree force table.",
    "timestamps": [
      {
        "seconds": 30,
        "timeLabel": "00:30",
        "title": "Force Table Setup & Ring Centering",
        "description": "Aligning low friction pulleys around 360 degree rim",
        "keyObservation": "Center pin clearance indicates zero net force"
      },
      {
        "seconds": 150,
        "timeLabel": "02:30",
        "title": "Setting Concurrent Force Vectors",
        "description": "Loading mass hangers for Vector A and Vector B",
        "keyObservation": "Vector A: 200g at 30°, Vector B: 150g at 110°"
      },
      {
        "seconds": 280,
        "timeLabel": "04:40",
        "title": "Analytical Component Resolution",
        "description": "Calculating Rx = Ax + Bx and Ry = Ay + By",
        "keyObservation": "Resultant magnitude R = 2.45 N, angle = 64.2°"
      },
      {
        "seconds": 400,
        "timeLabel": "06:40",
        "title": "Experimental Equilibrant Balancing",
        "description": "Placing Equilibrant force vector (R + 180°)",
        "keyObservation": "Ring achieves perfect center pin float"
      },
      {
        "seconds": 480,
        "timeLabel": "08:00",
        "title": "Uncertainty & Friction Error Audit",
        "description": "Pulley axle friction contribution and sensitivity",
        "keyObservation": "Mass uncertainty < 1 gram"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (TATU Lab)",
    "institution": "TATU Elektromagnetizm & Zanjirlar Nazariyasi Kafedrasi",
    "title": "Metrli Ko‘prik (Uitston Ko‘prigi) Yordamida Noma’lum Qarshilikni O‘lchash",
    "youtubeId": "R1pabnMCZDE",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Electromagnetism_Bridge_TUIT/preview",
    "duration": "07:18",
    "summary": "Metrli Uitston ko‘prigi yordamida o‘tkazgichning elektr qarshiligini nol indikatori (galvanometr) yordamida aniqlash.",
    "timestamps": [
      {
        "seconds": 20,
        "timeLabel": "00:20",
        "title": "Metrli ko‘prik sxemasini yig‘ish",
        "description": "Reoxord simi (1 metr), etalon qarshilik qutisi va galvanometr",
        "keyObservation": "Sxema Uitston ko‘prigi prinsipida ulanadi"
      },
      {
        "seconds": 105,
        "timeLabel": "01:45",
        "title": "Nol usuli (galvanometr muvozanati)",
        "description": "Zondni sim bo‘ylab siljitib, tok nolga tenglashtiriladi",
        "keyObservation": "I_G = 0 da ko‘prik muvozanatda"
      },
      {
        "seconds": 215,
        "timeLabel": "03:35",
        "title": "L₁ va L₂ yelkalar uzunligini o‘lchash",
        "description": "Sim bo‘linmasidan L₁ = 42.6 sm, L₂ = 57.4 sm olinadi",
        "keyObservation": "X = R_et · (L₁ / L₂)"
      },
      {
        "seconds": 320,
        "timeLabel": "05:20",
        "title": "O‘tkazgich diametrini mikrometrda o‘lchash",
        "description": "Solishtirma qarshilik ρ ni hisoblash uchun",
        "keyObservation": "d = 0.35 mm, S = 0.096 mm²"
      },
      {
        "seconds": 400,
        "timeLabel": "06:40",
        "title": "Solishtirma qarshilikni hisoblash",
        "description": "Nixrom yoki mis sim materialini aniqlash",
        "keyObservation": "ρ = 1.10·10⁻⁶ Ω·m (Nixrom)"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (PHY205 / Amrita)",
    "institution": "PHY205 Physics Laboratory / Amrita Virtual Labs",
    "title": "Wheatstone Bridge Balancing & Precision Resistance Measurement",
    "youtubeId": "eNYeXplaB5o",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_EM_Wheatstone_MIT/preview",
    "duration": "08:12",
    "summary": "Complete bridge circuit assembly, null deflection galvanometer balance, wire resistivity determination, and contact resistance minimization.",
    "timestamps": [
      {
        "seconds": 25,
        "timeLabel": "00:25",
        "title": "Wheatstone Bridge Circuit Principles",
        "description": "Four resistor arms ratio: R1/R2 = R3/R4",
        "keyObservation": "Zero potential difference across galvanometer"
      },
      {
        "seconds": 120,
        "timeLabel": "02:00",
        "title": "Decade Resistance Box Tuning",
        "description": "Selecting standard reference resistance R",
        "keyObservation": "Null deflection achieved near midpoint (50 cm)"
      },
      {
        "seconds": 240,
        "timeLabel": "04:00",
        "title": "Sliding Jockey Contact Technique",
        "description": "Tapping gently to prevent wire indentation",
        "keyObservation": "Balance point: L1 = 48.2 cm, L2 = 51.8 cm"
      },
      {
        "seconds": 360,
        "timeLabel": "06:00",
        "title": "Resistivity Formula Application",
        "description": "rho = (R * A) / L using micrometer measurements",
        "keyObservation": "Unknown wire confirmed as Constantan alloy"
      },
      {
        "seconds": 450,
        "timeLabel": "07:30",
        "title": "End-Correction & Systematic Error",
        "description": "Accounting for copper strip terminal resistance",
        "keyObservation": "Overall accuracy: 99.6%"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (O‘zMU / TATU)",
    "institution": "O‘zMU & TATU Optika Laboratoriyasi",
    "title": "Nyuton Halqalari Interferensiyasi Yordamida Yorug‘lik To‘lqin Uzunligini O‘lchash",
    "youtubeId": "6O1d19Rd7ys",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Optics_NewtonsRings_TUIT/preview",
    "duration": "09:05",
    "summary": "Yassi qavariq linza va yassi oyna sirti orasidagi yupqa havo qatlamida hosil bo‘lgan teng qalinlikdagi interferension halqalarni mikroskopda o‘lchash.",
    "timestamps": [
      {
        "seconds": 25,
        "timeLabel": "00:25",
        "title": "Optik stend va mikroskopni sozlash",
        "description": "Natriy lampasi (λ = 589 nm), 45° yarim shaffof ko‘zgu va linza",
        "keyObservation": "Monoxromatik sariq yorug‘lik nuri yo‘naltiriladi"
      },
      {
        "seconds": 135,
        "timeLabel": "02:15",
        "title": "Interferension manzarani fokuslash",
        "description": "Mikroskop okulyarida qorong‘i va yorug‘ halqalar markazi",
        "keyObservation": "Markaziy nuqta qorong‘i (faza siljishi π tufayli)"
      },
      {
        "seconds": 270,
        "timeLabel": "04:30",
        "title": "Halqalar diametrini o‘lchash (m- va n-tartib)",
        "description": "D_m va D_n halqalar koordinatalari mikrometrik vintda olinadi",
        "keyObservation": "D₁₀ = 3.65 mm, D₅ = 2.58 mm"
      },
      {
        "seconds": 410,
        "timeLabel": "06:50",
        "title": "Linza egrilik radiusi R va to‘lqin uzunligi",
        "description": "λ = (D_m² - D_n²) / [4R(m - n)] formulasi",
        "keyObservation": "R = 1.50 m bo‘lganda λ = 589.2 nm"
      },
      {
        "seconds": 500,
        "timeLabel": "08:20",
        "title": "Optik kontakt xatoligi tahlili",
        "description": "Linza va plastinka orasidagi chang zarralari ta’siri",
        "keyObservation": "Markaziy nuqta deformatsiyasi hisobga olinadi"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (Engineering Physics)",
    "institution": "Engineering Physics Laboratory / Monochromatic Light",
    "title": "Newton's Rings Traveling Microscope Full Laboratory Experiment",
    "youtubeId": "fWhgguWc8rk",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Optics_NewtonsRings_UK/preview",
    "duration": "11:20",
    "summary": "Division of amplitude thin film interference, traveling microscope horizontal vernier measurements, ring radius squaring and sodium D-line wavelength determination.",
    "timestamps": [
      {
        "seconds": 35,
        "timeLabel": "00:35",
        "title": "Apparatus Assembly & Plano-Convex Lens",
        "description": "Plano-convex lens resting on plane optical glass flat",
        "keyObservation": "Sodium vapor lamp monochromatic source (589 nm)"
      },
      {
        "seconds": 180,
        "timeLabel": "03:00",
        "title": "Traveling Microscope Crosshair Alignment",
        "description": "Focusing concentric circular interference fringes",
        "keyObservation": "Central spot is dark due to phase reversal at lower boundary"
      },
      {
        "seconds": 340,
        "timeLabel": "05:40",
        "title": "Left and Right Ring Boundary Measurements",
        "description": "Reading ring boundaries from 16th to 4th order",
        "keyObservation": "Travel scale vernier precision: 0.01 mm"
      },
      {
        "seconds": 490,
        "timeLabel": "08:10",
        "title": "Linear Regression of D^2 vs Ring Number",
        "description": "Plotting D_m^2 against ring order m to extract slope 4R*lambda",
        "keyObservation": "R-squared value > 0.998"
      },
      {
        "seconds": 610,
        "timeLabel": "10:10",
        "title": "Radius of Curvature & Spherometer Validation",
        "description": "Cross-validating lens curvature radius R with spherometer",
        "keyObservation": "Final wavelength lambda = 589.6 nm (error < 0.2%)"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (OTM Stendi)",
    "institution": "O‘zbekiston OTM Umumiy Fizika Termodinamika Stendi",
    "title": "Boyl-Mariott Qonuni: O‘zgarmas Haroratda Gazning Bosimi va Hajmi Bog‘liqligi",
    "youtubeId": "UPeE626-SuU",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Thermodynamics_GasLaws_TUIT/preview",
    "duration": "08:45",
    "summary": "Gaz qonunlari stendida izotermik siqilish va kengayish: P · V = const qonunini manometr va shisha kolba yordamida tajribada tekshirish.",
    "timestamps": [
      {
        "seconds": 20,
        "timeLabel": "00:20",
        "title": "Stend tuzilishi va manometr",
        "description": "Germetik silindr, porshen, bosim o‘lchagich va hajm shkalasi",
        "keyObservation": "T = 293 K harorat doimiy ushlab turiladi"
      },
      {
        "seconds": 115,
        "timeLabel": "01:55",
        "title": "Dastlabki holat parametrlarini qayd etish",
        "description": "V₀ = 50 sm³, P₀ = 101.3 kPa (atmosfera bosimi)",
        "keyObservation": "P₀ · V₀ = 5.065 J"
      },
      {
        "seconds": 230,
        "timeLabel": "03:50",
        "title": "Sekin-asta siqish (Kvazistatik jarayon)",
        "description": "Harorat ko‘tarilmasligi uchun har bir qadamda 2 daqiqa kutiladi",
        "keyObservation": "V = 40 sm³ da P = 126.8 kPa"
      },
      {
        "seconds": 350,
        "timeLabel": "05:50",
        "title": "Kengayish bosqichi",
        "description": "Hajm 60 sm³ gacha oshiriladi, bosim pasayishi kuzatiladi",
        "keyObservation": "V = 60 sm³ da P = 84.5 kPa"
      },
      {
        "seconds": 460,
        "timeLabel": "07:40",
        "title": "P = f(1/V) giperbola grafigi",
        "description": "Eksperimental nuqtalar to‘g‘ri chiziq bo‘ylab joylashadi",
        "keyObservation": "P · V ko‘paytmasi o‘zgarmas saqlandi"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (PASCO / Stanford)",
    "institution": "PASCO Scientific & Stanford Physics Demonstrations",
    "title": "Ideal Gas Laws & Thermodynamic Heat Engine Carnot Cycle",
    "youtubeId": "xZp3L9P2qXU",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Thermo_PASCO_Engine/preview",
    "duration": "10:05",
    "summary": "Gas pressure sensor, volume cylinder, absolute temperature probe, and real-time P-V indicator diagram of a Stirling / Carnot heat engine cycle.",
    "timestamps": [
      {
        "seconds": 30,
        "timeLabel": "00:30",
        "title": "Experimental System & Absolute Pressure Sensor",
        "description": "Sealed gas syringe coupled to high precision pressure transducer",
        "keyObservation": "Atmospheric calibration at 101.3 kPa"
      },
      {
        "seconds": 140,
        "timeLabel": "02:20",
        "title": "Isothermal Compression Sweep",
        "description": "Slow compression to maintain constant ambient temperature",
        "keyObservation": "Product PV remains invariant within 0.5%"
      },
      {
        "seconds": 280,
        "timeLabel": "04:40",
        "title": "Isochoric (Gay-Lussac) Thermal Cycle",
        "description": "Immersion into ice bath (273 K) and hot bath (373 K)",
        "keyObservation": "P vs T linear extrapolation yields absolute zero (-273.15 °C)"
      },
      {
        "seconds": 430,
        "timeLabel": "07:10",
        "title": "Four-Stage Heat Engine Cycle",
        "description": "Isothermal expansion, isochoric cooling, compression, heating",
        "keyObservation": "Enclosed area on PV diagram equals net mechanical work"
      },
      {
        "seconds": 530,
        "timeLabel": "08:50",
        "title": "Carnot Thermal Efficiency Benchmark",
        "description": "Comparing thermodynamic efficiency with theoretical limit 1 - Tc/Th",
        "keyObservation": "Real engine efficiency: 18.2% vs Carnot maximum 26.8%"
      }
    ]
  }
},
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
    tracks: {
  "uz": {
    "language": "uz",
    "languageLabel": "O‘zbekcha (TATU / O‘zMU)",
    "institution": "TATU & O‘zMU Kvant va Atom Fizikasi Laboratoriyasi",
    "title": "Tashqi Fotoeffekt Hodisasi Yordamida Plank Doimiysi (h) va Chiqish Ishini O‘lchash",
    "youtubeId": "FFP7fx8ZAu4",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Atomic_Photoelectric_TUIT/preview",
    "duration": "10:12",
    "summary": "Turli to‘lqin uzunlikdagi monoxromatik yorug‘lik filtrlari bilan fotoelementni yoritib, tormozlovchi kuchlanish U₀ ni o‘lchash va Plank doimiysi h ni hisoblash.",
    "timestamps": [
      {
        "seconds": 30,
        "timeLabel": "00:30",
        "title": "Fotoeffekt stendi va fotoelement",
        "description": "Vakuum fotoelementi, simob lampasi, optik filtrlar va mikroampermetr",
        "keyObservation": "Fotoelement yorug‘likdan himoyalangan korpusda"
      },
      {
        "seconds": 140,
        "timeLabel": "02:20",
        "title": "Sariq filtr (λ = 577 nm) uchun tormozlovchi kuchlanish",
        "description": "Teskari kuchlanish berilib, fototok nolga keltiriladi",
        "keyObservation": "U₀ = 0.43 V"
      },
      {
        "seconds": 250,
        "timeLabel": "04:10",
        "title": "Yashil va ko‘k filtrlar (λ = 546 nm, 436 nm)",
        "description": "Chastota oshgan sari tormozlovchi kuchlanish ortishi",
        "keyObservation": "λ = 436 nm da U₀ = 1.12 V"
      },
      {
        "seconds": 360,
        "timeLabel": "06:00",
        "title": "Binafsha filtr (λ = 365 nm)",
        "description": "Maksimal chastotada kinetik energiya eU₀ o‘lchanadi",
        "keyObservation": "U₀ = 1.68 V"
      },
      {
        "seconds": 480,
        "timeLabel": "08:00",
        "title": "U₀ = f(ν) grafigi va Plank doimiysi",
        "description": "Qiyalik burchagi k = h/e orqali h aniqlanadi",
        "keyObservation": "h = 6.61·10⁻³⁴ J·s (nisbiy xatolik 0.3%)"
      }
    ]
  },
  "en": {
    "language": "en",
    "languageLabel": "English (Quantum Physics)",
    "institution": "University Quantum Physics Lab (Photocell Tube & Spectral Filters)",
    "title": "Photoelectric Effect: Stopping Potential & Planck's Constant",
    "youtubeId": "uVoDdW7KwIE",
    "googleDrivePreviewUrl": "https://drive.google.com/file/d/1FizikaLab_Atomic_Photoelectric_USA/preview",
    "duration": "09:48",
    "summary": "Testing Einstein photoelectric equation (E = h*nu - W), vacuum phototube spectral response, stopping voltage V0 vs frequency slope, and Planck constant.",
    "timestamps": [
      {
        "seconds": 25,
        "timeLabel": "00:25",
        "title": "Einstein Photoelectric Equation Review",
        "description": "Theoretical relation: e*V_stop = h*nu - WorkFunction",
        "keyObservation": "Wave theory prediction failure: energy depends on frequency, not intensity"
      },
      {
        "seconds": 120,
        "timeLabel": "02:00",
        "title": "Mercury Discharge Lamp Spectrum",
        "description": "Isolating spectral lines with narrow bandpass interference filters",
        "keyObservation": "Lines at 365 nm, 405 nm, 436 nm, 546 nm, 577 nm"
      },
      {
        "seconds": 260,
        "timeLabel": "04:20",
        "title": "I-V Characteristic Curves",
        "description": "Applying reverse bias until photocurrent reaches absolute zero",
        "keyObservation": "Stopping potential determined for each optical frequency"
      },
      {
        "seconds": 390,
        "timeLabel": "06:30",
        "title": "Linear Plot of V_stop vs Frequency",
        "description": "Linear least-squares regression fit",
        "keyObservation": "Slope = h / e = 4.135 * 10^-15 V*s"
      },
      {
        "seconds": 490,
        "timeLabel": "08:10",
        "title": "Planck Constant & Work Function Extraction",
        "description": "Computing h = e * slope, intercept = -W/e",
        "keyObservation": "Extracted Planck constant: 6.626 * 10^-34 J*s (0.15% error)"
      }
    ]
  }
},
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

export function getVideoLabTrack(video: VideoLabDefinition, lang: "uz" | "en" = "uz"): VideoTrack {
  if (video.tracks && video.tracks[lang]) {
    return video.tracks[lang];
  }
  return {
    language: "uz",
    languageLabel: "O‘zbekcha",
    institution: "TATU Fizika kafedrasi",
    title: video.titleUz,
    youtubeId: video.youtubeId,
    googleDrivePreviewUrl: video.googleDrivePreviewUrl || "",
    duration: video.duration,
    summary: video.summaryUz,
    timestamps: video.timestamps,
  };
}
