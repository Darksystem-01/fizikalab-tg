export interface University {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  city: string;
  category: "Davlat OTM" | "Xalqaro / Filial" | "Nodavlat / Xususiy";
  emblemText: string;
  emblemBg: string;
  faculties: string[];
  logoUrl?: string;
}

export const UZBEKISTAN_UNIVERSITIES: University[] = [
  {
    "id": "ozmu",
    "name": "O‘zbekiston Milliy Universiteti (O‘zMU)",
    "shortName": "O‘zMU",
    "aliases": [
      "ozmu",
      "o'zmu",
      "nuu",
      "nuuz",
      "milliy",
      "national university",
      "toshkent milliy"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "O‘zMU",
    "emblemBg": "#1E3A8A",
    "logoUrl": "/resources/universities/ozmu.svg",
    "faculties": [
      "Fizika fakulteti",
      "Matematika fakulteti",
      "Amaliy matematika va intellektual texnologiyalar fakulteti",
      "Kimyo fakulteti",
      "Biologiya va ekologiya fakulteti",
      "Geologiya va geoaxborot tizimlari fakulteti",
      "Geografiya va tabiiy resurslar fakulteti",
      "Iqtisodiyot fakulteti",
      "O‘zbek filologiyasi fakulteti",
      "Xorijiy filologiya fakulteti",
      "Tarix fakulteti",
      "Ijtimoiy fanlar fakulteti",
      "Jurnalistika fakulteti",
      "Huquqiy fanlar va falsafa fakulteti",
      "Taekvondo va sport faoliyati fakulteti",
      "Xalqaro qo‘shma ta'lim dasturlari fakulteti"
    ]
  },
  {
    "id": "tatu",
    "name": "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    "shortName": "TATU",
    "aliases": [
      "tatu",
      "tuit",
      "al-xorazmiy",
      "axborot texnologiyalari",
      "aloqa instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0284C7",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kiberxavfsizlik fakulteti",
      "Dasturiy injiniring fakulteti",
      "Kompyuter injiniringi fakulteti",
      "Telekommunikatsiya texnologiyalari fakulteti",
      "Televizion texnologiyalar fakulteti",
      "Radio va mobil aloqa fakulteti",
      "AKT sohasida iqtisodiyot va menejment fakulteti",
      "Raqamli ta'lim va sun'iy intellekt fakulteti",
      "TATU — BGUIR axborot texnologiyalari qo‘shma fakulteti",
      "Sirtqi va masofaviy ta'lim fakulteti",
      "Harbiy tayyorgarlik fakulteti (Maxsus fakultet)"
    ]
  },
  {
    "id": "tatu-sf",
    "name": "TATU Samarqand filiali (TATU SF)",
    "shortName": "TATU SF",
    "aliases": [
      "tatu samarqand",
      "tatusf",
      "tatu sf",
      "samarqand tatu"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0369A1",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring va axborot xavfsizligi fakulteti",
      "Telekommunikatsiya texnologiyalari va kasb ta'limi fakulteti",
      "Sirtqi va masofaviy ta'lim bo‘limi"
    ]
  },
  {
    "id": "tatu-ff",
    "name": "TATU Farg‘ona filiali (TATU FF)",
    "shortName": "TATU FF",
    "aliases": [
      "tatu fargona",
      "tatuff",
      "tatu ff",
      "farg'ona tatu"
    ],
    "city": "Farg‘ona",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0369A1",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring fakulteti",
      "Telekommunikatsiya texnologiyalari fakulteti",
      "Axborot xavfsizligi va raqamli ta'lim fakulteti"
    ]
  },
  {
    "id": "tatu-uf",
    "name": "TATU Urganch filiali (TATU UF)",
    "shortName": "TATU UF",
    "aliases": [
      "tatu urganch",
      "tatuuf",
      "tatu uf",
      "xorazm tatu"
    ],
    "city": "Urganch",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0369A1",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring va telekommunikatsiya fakulteti",
      "Raqamli texnologiyalar va sun'iy intellekt fakulteti"
    ]
  },
  {
    "id": "tatu-qf",
    "name": "TATU Qarshi filiali (TATU QF)",
    "shortName": "TATU QF",
    "aliases": [
      "tatu qarshi",
      "tatuqf",
      "tatu qf",
      "qashqadaryo tatu"
    ],
    "city": "Qarshi",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0369A1",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring fakulteti",
      "Telekommunikatsiya va axborot xavfsizligi fakulteti"
    ]
  },
  {
    "id": "tatu-nf",
    "name": "TATU Nukus filiali (TATU NF)",
    "shortName": "TATU NF",
    "aliases": [
      "tatu nukus",
      "tatunf",
      "tatu nf",
      "qoraqalpog'iston tatu"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "TATU",
    "emblemBg": "#0369A1",
    "logoUrl": "/resources/universities/tatu.png",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring va telekommunikatsiya fakulteti",
      "Axborot-kommunikatsiya texnologiyalari fakulteti"
    ]
  },
  {
    "id": "tdtu",
    "name": "Toshkent Davlat Texnika Universiteti (TDTU)",
    "shortName": "TDTU",
    "aliases": [
      "tdtu",
      "tstu",
      "politex",
      "politexnika",
      "islom karimov nomidagi tdtu",
      "texnika universiteti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDTU",
    "emblemBg": "#B45309",
    "logoUrl": "/resources/universities/tdtu.png",
    "faculties": [
      "Mashinasozlik fakulteti",
      "Energetika fakulteti",
      "Elektronika va avtomatika fakulteti",
      "Geologiya-qidiruv va kon-metallurgiya fakulteti",
      "Mexanika-mashinasozlik fakulteti",
      "Muhandislik texnologiyalari fakulteti",
      "Neft va gaz fakulteti",
      "Biotibbiyot muhandisligi fakulteti",
      "Issiqlik energetikasi fakulteti",
      "O‘zbekiston-Yaponiya yoshlar innovatsiya markazi qo‘shma fakulteti"
    ]
  },
  {
    "id": "tdtu-olmaliq",
    "name": "TDTU Olmaliq filiali",
    "shortName": "TDTU OF",
    "aliases": [
      "tdtu olmaliq",
      "tdtuof",
      "olmaliq konchilik instituti"
    ],
    "city": "Olmaliq",
    "category": "Davlat OTM",
    "emblemText": "TDTU",
    "emblemBg": "#9A3412",
    "logoUrl": "/resources/universities/tdtu.png",
    "faculties": [
      "Konchilik ishi fakulteti",
      "Metallurgiya va kimyoviy texnologiya fakulteti",
      "Avtomatlashtirish va boshqaruv fakulteti"
    ]
  },
  {
    "id": "tdtu-qoqon",
    "name": "TDTU Qo‘qon filiali",
    "shortName": "TDTU QF",
    "aliases": [
      "tdtu qoqon",
      "tdtuqf",
      "qo'qon politexnika"
    ],
    "city": "Qo‘qon",
    "category": "Davlat OTM",
    "emblemText": "TDTU",
    "emblemBg": "#9A3412",
    "logoUrl": "/resources/universities/tdtu.png",
    "faculties": [
      "Elektronika va avtomatika fakulteti",
      "Mashinasozlik texnologiyalari fakulteti"
    ]
  },
  {
    "id": "tdiu",
    "name": "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)",
    "shortName": "TDIU",
    "aliases": [
      "tdiu",
      "tsue",
      "narxoz",
      "iqtisodiyot universiteti",
      "tmi",
      "toshkent moliya instituti",
      "soliq instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDIU",
    "emblemBg": "#047857",
    "logoUrl": "/resources/universities/tdiu.png",
    "faculties": [
      "Moliya va bank ishi fakulteti",
      "Buxgalteriya hisobi va audit fakulteti",
      "Raqamli iqtisodiyot fakulteti",
      "Soliqlar va sug‘urta ishi fakulteti",
      "Iqtisodiyot va statistika fakulteti",
      "Biznes boshqaruvi va korporativ boshqaruv fakulteti",
      "Xalqaro turizm va servis fakulteti",
      "Xalqaro iqtisodiy munosabatlar fakulteti",
      "Sirtqi va masofaviy ta'lim fakulteti"
    ]
  },
  {
    "id": "tiiame",
    "name": "Toshkent Irrigatsiya va Qishloq Xo‘jaligini Mexanizatsiyalash Muhandislari Instituti (TIIAME)",
    "shortName": "TIIAME",
    "aliases": [
      "tiiame",
      "irrigatsiya",
      "tiiame milliy tadqiqot",
      "irrigatsiya instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TIAM",
    "emblemBg": "#15803D",
    "logoUrl": "/resources/universities/tiiame.png",
    "faculties": [
      "Gidromelioratsiya fakulteti",
      "Gidrotexnika qurilishi fakulteti",
      "Qishloq xo‘jaligini mexanizatsiyalash fakulteti",
      "Energiya ta'minoti va qayta tiklanuvchi energiya manbalari fakulteti",
      "Yer resurslari va kadastr fakulteti",
      "Ekologiya va huquq fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "tiiame-buxoro",
    "name": "TIIAME Buxoro Tabiiy Resurslarni Boshqarish Instituti",
    "shortName": "TIIAME BR",
    "aliases": [
      "tiiame buxoro",
      "buxoro irrigatsiya",
      "buxoro tabiiy resurslar"
    ],
    "city": "Buxoro",
    "category": "Davlat OTM",
    "emblemText": "TIAM",
    "emblemBg": "#166534",
    "logoUrl": "/resources/universities/tiiame.png",
    "faculties": [
      "Gidromelioratsiya va meliorativ gidrogeologiya fakulteti",
      "Yer resurslari va qishloq xo‘jaligini mexanizatsiyalash fakulteti"
    ]
  },
  {
    "id": "tiiame-qarshi",
    "name": "TIIAME Qarshi Irrigatsiya va Agrotexnologiyalar Instituti",
    "shortName": "TIIAME QR",
    "aliases": [
      "tiiame qarshi",
      "qarshi irrigatsiya",
      "qarshi agrotexnologiyalar"
    ],
    "city": "Qarshi",
    "category": "Davlat OTM",
    "emblemText": "TIAM",
    "emblemBg": "#166534",
    "logoUrl": "/resources/universities/tiiame.png",
    "faculties": [
      "Gidrotexnika inshootlari va melioratsiya fakulteti",
      "Qishloq xo‘jaligi texnikasi va agrotexnologiyalar fakulteti"
    ]
  },
  {
    "id": "tdtru",
    "name": "Toshkent Davlat Transport Universiteti (TDTrU)",
    "shortName": "TDTrU",
    "aliases": [
      "tdtru",
      "ttysi",
      "transport universiteti",
      "toshkent transport"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDTrU",
    "emblemBg": "#0E7490",
    "logoUrl": "/resources/universities/tdtru.png",
    "faculties": [
      "Avtomobil transporti muhandisligi fakulteti",
      "Temir yo‘l transporti muhandisligi fakulteti",
      "Aviatsiya transporti muhandisligi fakulteti",
      "Qurilish muhandisligi fakulteti",
      "Elektromexanika va radioelektronika fakulteti",
      "Transport tizimlari boshqaruvi va logistika fakulteti",
      "Iqtisodiyot va biznes fakulteti"
    ]
  },
  {
    "id": "tkti",
    "name": "Toshkent Kimyo-Texnologiya Instituti (TKTI)",
    "shortName": "TKTI",
    "aliases": [
      "tkti",
      "kimyo texnologiya",
      "kimyotexnologiya instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TKTI",
    "emblemBg": "#4C1D95",
    "faculties": [
      "Organik moddalar va yuqori molekulali birikmalar texnologiyasi fakulteti",
      "Noorganik moddalar texnologiyasi fakulteti",
      "Yoqilg‘i va organik birikmalar texnologiyasi fakulteti",
      "Oziq-ovqat mahsulotlari texnologiyasi fakulteti",
      "Menejment va kasb ta'limi fakulteti",
      "Vinochilik texnologiyasi va sanoat uzumchiligi fakulteti"
    ]
  },
  {
    "id": "tkti-yangiyer",
    "name": "TKTI Yangiyer filiali",
    "shortName": "TKTI YF",
    "aliases": [
      "tkti yangiyer",
      "yangiyer tkti",
      "yangiyer kimyo"
    ],
    "city": "Yangiyer",
    "category": "Davlat OTM",
    "emblemText": "TKTI",
    "emblemBg": "#581C87",
    "faculties": [
      "Kimyoviy texnologiya fakulteti",
      "Texnologik jarayonlarni avtomatlashtirish fakulteti"
    ]
  },
  {
    "id": "tkti-shahrisabz",
    "name": "TKTI Shahrisabz filiali",
    "shortName": "TKTI ShF",
    "aliases": [
      "tkti shahrisabz",
      "shahrisabz tkti",
      "shahrisabz kimyo"
    ],
    "city": "Shahrisabz",
    "category": "Davlat OTM",
    "emblemText": "TKTI",
    "emblemBg": "#581C87",
    "faculties": [
      "Oziq-ovqat texnologiyasi fakulteti",
      "Noorganik moddalar kimyoviy texnologiyasi fakulteti"
    ]
  },
  {
    "id": "taqu",
    "name": "Toshkent Arxitektura-Qurilish Universiteti (TAQU)",
    "shortName": "TAQU",
    "aliases": [
      "taqu",
      "taqi",
      "arxitektura qurilish",
      "arxitektura instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TAQU",
    "emblemBg": "#C2410C",
    "logoUrl": "/resources/universities/taqu.png",
    "faculties": [
      "Arxitektura fakulteti",
      "Bino va inshootlar qurilishi fakulteti",
      "Muhandislik kommunikatsiyalari qurilishi fakulteti",
      "Qurilishni boshqarish va texnologiyalar fakulteti"
    ]
  },
  {
    "id": "tdyu",
    "name": "Toshkent Davlat Yuridik Universiteti (TDYU)",
    "shortName": "TDYU",
    "aliases": [
      "tdyu",
      "tsul",
      "yuridik universiteti",
      "yurfak",
      "yuridik"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDYU",
    "emblemBg": "#1E293B",
    "logoUrl": "/resources/universities/tdyu.png",
    "faculties": [
      "Ommaviy huquq fakulteti",
      "Xususiy huquq fakulteti",
      "Jinoyat odil sudlovi fakulteti",
      "Xalqaro huquq va qiyosiy qonunshunoslik fakulteti",
      "Magistratura va uzluksiz ta'lim fakulteti"
    ]
  },
  {
    "id": "jidu",
    "name": "Jahon Iqtisodiyoti va Diplomatiya Universiteti (JIDU)",
    "shortName": "JIDU",
    "aliases": [
      "jidu",
      "uwed",
      "diplomatiya",
      "jahon iqtisodiyoti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "JIDU",
    "emblemBg": "#1E40AF",
    "logoUrl": "/resources/universities/jidu.png",
    "faculties": [
      "Xalqaro munosabatlar fakulteti",
      "Xalqaro iqtisodiyot va menejment fakulteti",
      "Xalqaro huquq fakulteti"
    ]
  },
  {
    "id": "tma",
    "name": "Toshkent Tibbiyot Akademiyasi (TMA)",
    "shortName": "TMA",
    "aliases": [
      "tma",
      "tashmi",
      "tibbiyot akademiyasi",
      "toshkent tibbiyot"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TMA",
    "emblemBg": "#059669",
    "logoUrl": "/resources/universities/tma.png",
    "faculties": [
      "1-Davolash fakulteti",
      "2-Davolash fakulteti",
      "Tibbiy-pedagogika fakulteti",
      "Tibbiy-profilaktika va jamoat salomatligi fakulteti",
      "Oliy hamshiralik ishi fakulteti",
      "Xalqaro talabalar fakulteti"
    ]
  },
  {
    "id": "tma-urganch",
    "name": "TMA Urganch filiali",
    "shortName": "TMA UF",
    "aliases": [
      "tma urganch",
      "tmauf",
      "urganch tibbiyot"
    ],
    "city": "Urganch",
    "category": "Davlat OTM",
    "emblemText": "TMA",
    "emblemBg": "#047857",
    "logoUrl": "/resources/universities/tma.png",
    "faculties": [
      "Davolash ishi fakulteti",
      "Pediatriya va oliy hamshiralik fakulteti"
    ]
  },
  {
    "id": "tma-termiz",
    "name": "TMA Termiz filiali",
    "shortName": "TMA TF",
    "aliases": [
      "tma termiz",
      "tmatf",
      "termiz tibbiyot filiali"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TMA",
    "emblemBg": "#047857",
    "logoUrl": "/resources/universities/tma.png",
    "faculties": [
      "Davolash ishi fakulteti",
      "Pediatriya va profilaktika fakulteti"
    ]
  },
  {
    "id": "tashpmi",
    "name": "Toshkent Pediatriya Tibbiyot Instituti (TashPMI)",
    "shortName": "TashPMI",
    "aliases": [
      "tashpmi",
      "samnpmi",
      "pediatriya instituti",
      "pediatriya"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "Tpmi",
    "emblemBg": "#0284C7",
    "faculties": [
      "1-Pediatriya va bolalar xirurgiyasi fakulteti",
      "2-Pediatriya va tibbiy genetika fakulteti",
      "Davolash va tibbiy pedagogika fakulteti",
      "Oliy hamshiralik ishi fakulteti"
    ]
  },
  {
    "id": "tdsi",
    "name": "Toshkent Davlat Stomatologiya Instituti (TDSI)",
    "shortName": "TDSI",
    "aliases": [
      "tdsi",
      "stomatologiya instituti",
      "stomatologiya"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDSI",
    "emblemBg": "#0891B2",
    "faculties": [
      "Stomatologiya fakulteti",
      "Bolalar stomatologiyasi fakulteti",
      "Davolash fakulteti",
      "Xalq tabobati va biotibbiyot muhandisligi fakulteti"
    ]
  },
  {
    "id": "toshfarmi",
    "name": "Toshkent Farmatsevtika Instituti (ToshFarmI)",
    "shortName": "ToshFarmI",
    "aliases": [
      "toshfarmi",
      "farmi",
      "farmatsevtika instituti",
      "farmatsevtika"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TFarm",
    "emblemBg": "#0D9488",
    "faculties": [
      "Farmatsiya fakulteti",
      "Sanoat farmatsiyasi fakulteti",
      "Biotexnologiya va kosmetsevtika fakulteti"
    ]
  },
  {
    "id": "tdpu",
    "name": "Nizomiy nomidagi Toshkent Davlat Pedagogika Universiteti (TDPU)",
    "shortName": "TDPU",
    "aliases": [
      "tdpu",
      "nizomiy",
      "pedagogika universiteti",
      "toshkent pedagogika"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDPU",
    "emblemBg": "#6D28D9",
    "logoUrl": "/resources/universities/tdpu.png",
    "faculties": [
      "Fizika va astronomiya fakulteti",
      "Matematika va informatika fakulteti",
      "Tabiiy fanlar fakulteti",
      "Boshlang‘ich ta'lim fakulteti",
      "Maktabgacha ta'lim fakulteti",
      "Maxsus pedagogika va defektologiya fakulteti",
      "Tarix fakulteti",
      "Chet tillari fakulteti",
      "Pedagogika va psixologiya fakulteti"
    ]
  },
  {
    "id": "ozdjtu",
    "name": "O‘zbekiston Davlat Jahon Tillari Universiteti (O‘zDJTU)",
    "shortName": "O‘zDJTU",
    "aliases": [
      "ozdjtu",
      "o'zdjtu",
      "inyaz",
      "jahon tillari",
      "uzswlu"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "DJTU",
    "emblemBg": "#4338CA",
    "faculties": [
      "1-Ingliz tili fakulteti",
      "2-Ingliz tili fakulteti",
      "3-Ingliz tili fakulteti",
      "Roman-german filologiyasi fakulteti",
      "Sharq filologiyasi fakulteti",
      "Rus filologiyasi fakulteti",
      "Tarjimonlik fakulteti",
      "Media va kommunikatsiya fakulteti"
    ]
  },
  {
    "id": "toshdshu",
    "name": "Toshkent Davlat Sharqshunoslik Universiteti (ToshDSHU)",
    "shortName": "ToshDSHU",
    "aliases": [
      "toshdshu",
      "sharqshunoslik",
      "vostokovedeniye",
      "oriental"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDSHU",
    "emblemBg": "#B45309",
    "faculties": [
      "Sharq sivilizatsiyasi va tarix fakulteti",
      "Sharq filologiyasi va tarjimashunoslik fakulteti",
      "Sharq mamlakatlari iqtisodiyoti va siyosati fakulteti",
      "Xitoyshunoslik fakulteti",
      "Koreyashunoslik fakulteti",
      "Yaponshunoslik fakulteti"
    ]
  },
  {
    "id": "toshdotau",
    "name": "Alisher Navoiy nomidagi Toshkent davlat o‘zbek tili va adabiyoti universiteti (ToshDO‘TAU)",
    "shortName": "ToshDO‘TAU",
    "aliases": [
      "toshdotau",
      "navoiy universiteti",
      "ozbek tili universiteti",
      "o'zbek tili"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TAU",
    "emblemBg": "#7C3AED",
    "faculties": [
      "O‘zbek filologiyasi fakulteti",
      "O‘zbek tili va adabiyotini o‘qitish fakulteti",
      "O‘zbek-ingliz tarjima nazariyasi va amaliyoti fakulteti",
      "Kompyuter lingvistikasi va amaliy filologiya fakulteti"
    ]
  },
  {
    "id": "tdau",
    "name": "Toshkent Davlat Agrar Universiteti (TDAU)",
    "shortName": "TDAU",
    "aliases": [
      "tdau",
      "agrar",
      "qishloq xojaligi universiteti",
      "agrar universiteti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "TDAU",
    "emblemBg": "#16A34A",
    "faculties": [
      "Agrobiologiya fakulteti",
      "O‘simliklar himoyasi, agrokimyo va tuproqshunoslik fakulteti",
      "Meva-sabzavotchilik va uzumchilik fakulteti",
      "Qishloq xo‘jaligi mahsulotlarini saqlash va qayta ishlash fakulteti",
      "Agroiqtisodiyot va biznes fakulteti",
      "O‘rmon xo‘jaligi va landshaft dizayni fakulteti"
    ]
  },
  {
    "id": "tdau-samarqand",
    "name": "TDAU Samarqand filiali",
    "shortName": "TDAU SF",
    "aliases": [
      "tdau samarqand",
      "tdausf",
      "samarqand agrar"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "TDAU",
    "emblemBg": "#15803D",
    "faculties": [
      "Agrobiologiya va meva-sabzavotchilik fakulteti",
      "Agromuhandislik va gidromelioratsiya fakulteti"
    ]
  },
  {
    "id": "ozdsmi",
    "name": "O‘zbekiston Davlat San'at va Madaniyat Instituti (O‘zDSMI)",
    "shortName": "O‘zDSMI",
    "aliases": [
      "ozdsmi",
      "sanat instituti",
      "madaniyat instituti",
      "teatr instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "SMI",
    "emblemBg": "#BE185D",
    "faculties": [
      "Teatr san'ati fakulteti",
      "Kino, televideniye va radio san'ati fakulteti",
      "Xalq ijodiyoti fakulteti",
      "Kutubxona-axborot faoliyati fakulteti"
    ]
  },
  {
    "id": "ozdsmi-nukus",
    "name": "O‘zDSMI Nukus filiali",
    "shortName": "O‘zDSMI NF",
    "aliases": [
      "ozdsmi nukus",
      "nukus sanat filiali"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "SMI",
    "emblemBg": "#9D174D",
    "faculties": [
      "Teatr san'ati va xalq ijodiyoti fakulteti"
    ]
  },
  {
    "id": "mrdi",
    "name": "Kamoliddin Behzod nomidagi Milliy Rassomlik va Dizayn Instituti (MRDI)",
    "shortName": "MRDI",
    "aliases": [
      "mrdi",
      "behzod instituti",
      "rassomlik instituti",
      "dizayn instituti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "MRDI",
    "emblemBg": "#C026D3",
    "faculties": [
      "Tasviriy san'at fakulteti",
      "Dastgohli va mahobatli rangtasvir fakulteti",
      "Amaliy san'at fakulteti",
      "Dizayn fakulteti"
    ]
  },
  {
    "id": "ozdk",
    "name": "O‘zbekiston Davlat Konservatoriyasi (O‘zDK)",
    "shortName": "Konservatoriya",
    "aliases": [
      "ozdk",
      "konservatoriya",
      "davlat konservatoriyasi",
      "musiqa akademiyasi"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "O‘zDK",
    "emblemBg": "#831843",
    "faculties": [
      "Orkestr cholg‘ulari fakulteti",
      "Fortepiano va akademik xonandalik fakulteti",
      "O‘zbek an'anaviy musiqasi fakulteti",
      "Musiqa san'ati va kompozitsiya fakulteti"
    ]
  },
  {
    "id": "ommsi",
    "name": "O‘zbekiston Milliy Musiqa San'ati Instituti (Yunus Rajabiy nomidagi)",
    "shortName": "OMMSI",
    "aliases": [
      "ommsi",
      "maqom instituti",
      "yunus rajabiy",
      "milliy musiqa"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "MMSI",
    "emblemBg": "#9F1239",
    "faculties": [
      "Maqom xonandaligi fakulteti",
      "Maqom cholg‘u ijrochiligi fakulteti",
      "Musiqashunoslik va xalq musiqasi fakulteti"
    ]
  },
  {
    "id": "ozdjtsu",
    "name": "O‘zbekiston Davlat Jismoniy Tarbiya va Sport Universiteti (O‘zDJTSU)",
    "shortName": "O‘zDJTSU",
    "aliases": [
      "ozdjtsu",
      "sport instituti",
      "sport universiteti",
      "jismoniy tarbiya"
    ],
    "city": "Chirchiq",
    "category": "Davlat OTM",
    "emblemText": "JTSU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Sport o‘yinlari fakulteti",
      "Yakkakurash sport turlari fakulteti",
      "Ko‘pkurash va qishki sport turlari fakulteti",
      "Paralimpiya va moslashuvchan jismoniy tarbiya fakulteti"
    ]
  },
  {
    "id": "ozjoku",
    "name": "O‘zbekiston Jurnalistika va Ommaviy Kommunikatsiyalar Universiteti (O‘zJOKU)",
    "shortName": "O‘zJOKU",
    "aliases": [
      "ozjoku",
      "jurnalistika universiteti",
      "jurnalistika",
      "media universiteti"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "JOKU",
    "emblemBg": "#2563EB",
    "faculties": [
      "Bosma OAV va noshirlik ishi fakulteti",
      "Internet jurnalistika va media menejment fakulteti",
      "Tele-radio jurnalistika fakulteti",
      "Xalqaro jurnalistika va PR fakulteti"
    ]
  },
  {
    "id": "prokuratura-akademiya",
    "name": "Huquqni Muhofaza Qilish Akademiyasi",
    "shortName": "HMQA",
    "aliases": [
      "bosh prokuratura akademiyasi",
      "hmqa",
      "prokuratura akademiyasi"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "HMQA",
    "emblemBg": "#0F172A",
    "faculties": [
      "Tergov faoliyati fakulteti",
      "Prokurorlik faoliyati fakulteti",
      "Korrupsiyaga qarshi kurashish fakulteti"
    ]
  },
  {
    "id": "new-uzb",
    "name": "Yangi O‘zbekiston Universiteti (New Uzbekistan University)",
    "shortName": "NewUz",
    "aliases": [
      "new uzbekistan",
      "yangi ozbekiston",
      "newuz",
      "prezident universiteti",
      "yangi o'zbekiston"
    ],
    "city": "Toshkent",
    "category": "Davlat OTM",
    "emblemText": "NUU",
    "emblemBg": "#4338CA",
    "logoUrl": "/resources/universities/new-uzb.svg",
    "faculties": [
      "Kompyuter fanlari va Sun'iy intellekt maktabi",
      "Muhandislik maktabi (Mechanical & Chemical Engineering)",
      "Tabiiy fanlar maktabi (Fizika va Matematika)",
      "Boshqaruv va Innovatsiyalar maktabi"
    ]
  },
  {
    "id": "samdu",
    "name": "Samarqand Davlat Universiteti (SamDU)",
    "shortName": "SamDU",
    "aliases": [
      "samdu",
      "samsu",
      "samarkand state",
      "sharof rashidov nomidagi samdu"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SamDU",
    "emblemBg": "#0F766E",
    "logoUrl": "/resources/universities/samdu.png",
    "faculties": [
      "Fizika fakulteti",
      "Matematika fakulteti",
      "Muhandislik fizikasi instituti",
      "Intellektual tizimlar va kompyuter texnologiyalari fakulteti",
      "Kimyo fakulteti",
      "Biologiya fakulteti",
      "Geografiya va ekologiya fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Xalqaro ta'lim dasturlari fakulteti",
      "Agrobiotexnologiyalar va oziq-ovqat xavfsizligi instituti"
    ]
  },
  {
    "id": "samdu-urgut",
    "name": "SamDU Urgut filiali",
    "shortName": "SamDU UF",
    "aliases": [
      "samdu urgut",
      "urgut samdu",
      "samduuf"
    ],
    "city": "Urgut",
    "category": "Davlat OTM",
    "emblemText": "SamDU",
    "emblemBg": "#115E59",
    "logoUrl": "/resources/universities/samdu.png",
    "faculties": [
      "Aniq va tabiiy fanlar fakulteti",
      "Gumanitar fanlar va pedagogika fakulteti"
    ]
  },
  {
    "id": "samdu-kattaqorgon",
    "name": "SamDU Kattaqo‘rg‘on filiali",
    "shortName": "SamDU KF",
    "aliases": [
      "samdu kattaqorgon",
      "kattaqorgon samdu",
      "samdukf"
    ],
    "city": "Kattaqo‘rg‘on",
    "category": "Davlat OTM",
    "emblemText": "SamDU",
    "emblemBg": "#115E59",
    "logoUrl": "/resources/universities/samdu.png",
    "faculties": [
      "Iqtisodiyot va pedagogika fakulteti",
      "Raqamli texnologiyalar va tillar fakulteti"
    ]
  },
  {
    "id": "samdaqi",
    "name": "Samarqand Davlat Arxitektura-Qurilish Universiteti (SamDAQI)",
    "shortName": "SamDAQI",
    "aliases": [
      "samdaqi",
      "samgasi",
      "samarqand arxitektura",
      "samarqand qurilish"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SDAQI",
    "emblemBg": "#D97706",
    "faculties": [
      "Arxitektura fakulteti",
      "Qurilish fakulteti",
      "Muhandislik kommunikatsiyalari qurilishi fakulteti",
      "Qurilishni boshqarish fakulteti"
    ]
  },
  {
    "id": "samisi",
    "name": "Samarqand Iqtisodiyot va Servis Instituti (SamISI)",
    "shortName": "SamISI",
    "aliases": [
      "samisi",
      "sies",
      "samarqand iqtisodiyot",
      "servis instituti"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SISI",
    "emblemBg": "#059669",
    "faculties": [
      "Bank-moliya xizmatlari fakulteti",
      "Buxgalteriya hisobi va audit fakulteti",
      "Servis va turizm fakulteti",
      "Menejment va marketing fakulteti"
    ]
  },
  {
    "id": "samdtu",
    "name": "Samarqand Davlat Tibbiyot Universiteti (SamDTU)",
    "shortName": "SamDTU",
    "aliases": [
      "samdtu",
      "sammi",
      "samarqand med",
      "samarqand tibbiyot"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SDTU",
    "emblemBg": "#0D9488",
    "faculties": [
      "1-Davolash fakulteti",
      "2-Davolash fakulteti",
      "Pediatriya fakulteti",
      "Stomatologiya fakulteti",
      "Farmatsiya fakulteti",
      "Tibbiy profilaktika va tibbiy biologiya fakulteti",
      "Xalq tabobati fakulteti"
    ]
  },
  {
    "id": "samdchti",
    "name": "Samarqand Davlat Chet Tillar Instituti (SamDChTI)",
    "shortName": "SamDChTI",
    "aliases": [
      "samdchti",
      "samarqand inyaz",
      "samarqand chet tillar"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SChTI",
    "emblemBg": "#2563EB",
    "faculties": [
      "1-Ingliz tili fakulteti",
      "2-Ingliz tili fakulteti",
      "Roman-german tillari fakulteti",
      "Tarjima nazariyasi va amaliyoti fakulteti",
      "Sharq tillari fakulteti"
    ]
  },
  {
    "id": "samdvmchbu",
    "name": "Samarqand Davlat Veterinariya Meditsinasi, Chorvachilik va Biotexnologiyalar Universiteti (SamDVMChBU)",
    "shortName": "SamDVMChBU",
    "aliases": [
      "samdvmchbu",
      "samvmi",
      "veterinariya instituti",
      "samarqand veterinariya"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "VET",
    "emblemBg": "#15803D",
    "faculties": [
      "Veterinariya meditsinasi fakulteti",
      "Veterinariya profilaktikasi va davolash fakulteti",
      "Zooinjeneriya va biotexnologiya fakulteti",
      "Mahsulotlarni qayta ishlash texnologiyasi va standartlashtirish fakulteti"
    ]
  },
  {
    "id": "silk-road",
    "name": "“Ipak Yo‘li” Turizm va Madaniy Meros Xalqaro Universiteti",
    "shortName": "Ipak Yo‘li",
    "aliases": [
      "ipak yoli",
      "silk road",
      "ipak yoli turizm",
      "samarqand turizm"
    ],
    "city": "Samarqand",
    "category": "Davlat OTM",
    "emblemText": "SILK",
    "emblemBg": "#B45309",
    "faculties": [
      "Turizm menejmenti fakulteti",
      "Madaniy merosni saqlash va restavratsiya fakulteti",
      "Mehmonxona va restoran boshqaruvi fakulteti",
      "Logistika va servis fakulteti"
    ]
  },
  {
    "id": "fardu",
    "name": "Farg‘ona Davlat Universiteti (FarDU)",
    "shortName": "FarDU",
    "aliases": [
      "fardu",
      "fergu",
      "fargona davlat",
      "fergana state"
    ],
    "city": "Farg‘ona",
    "category": "Davlat OTM",
    "emblemText": "FarDU",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Raqamli ta'lim texnologiyalari fakulteti",
      "Kimyo-biologiya fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Chet tillari fakulteti",
      "Iqtisodiyot fakulteti",
      "San'atshunoslik va jismoniy madaniyat fakulteti"
    ]
  },
  {
    "id": "farpi",
    "name": "Farg‘ona Politexnika Instituti (FarPI)",
    "shortName": "FarPI",
    "aliases": [
      "farpi",
      "ferpi",
      "fargona politexnika",
      "fergana polytechnic"
    ],
    "city": "Farg‘ona",
    "category": "Davlat OTM",
    "emblemText": "FarPI",
    "emblemBg": "#C2410C",
    "faculties": [
      "Energetika fakulteti",
      "Mexanika-mashinasozlik fakulteti",
      "Qurilish fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Kompyuter tizimlari va axborot texnologiyalari fakulteti",
      "Ishlab chiqarishda boshqaruv fakulteti"
    ]
  },
  {
    "id": "fjsti",
    "name": "Farg‘ona Jamoat Salomatligi Tibbiyot Instituti (FJSTI)",
    "shortName": "FJSTI",
    "aliases": [
      "fjsti",
      "fargona tibbiyot",
      "fargona med",
      "jamoat salomatligi"
    ],
    "city": "Farg‘ona",
    "category": "Davlat OTM",
    "emblemText": "FJSTI",
    "emblemBg": "#047857",
    "faculties": [
      "Davolash ishi fakulteti",
      "Jamoat salomatligi va profilaktika fakulteti",
      "Pediatriya va oliy hamshiralik fakulteti",
      "Farmatsiya fakulteti"
    ]
  },
  {
    "id": "qoqon-dpi",
    "name": "Qo‘qon Davlat Pedagogika Instituti (Qo‘qon DPI)",
    "shortName": "QDPI",
    "aliases": [
      "qdpi",
      "qoqon dpi",
      "muqimiy nomidagi qdpi",
      "qoqon pedagogika"
    ],
    "city": "Qo‘qon",
    "category": "Davlat OTM",
    "emblemText": "QDPI",
    "emblemBg": "#4338CA",
    "faculties": [
      "Fizika va matematika fakulteti",
      "Tabiiy fanlar fakulteti",
      "Tarix fakulteti",
      "O‘zbek tili va adabiyoti fakulteti",
      "Xorijiy tillar fakulteti",
      "Boshlang‘ich ta'lim fakulteti"
    ]
  },
  {
    "id": "anddu",
    "name": "Andijon Davlat Universiteti (AndDU)",
    "shortName": "AndDU",
    "aliases": [
      "anddu",
      "andu",
      "andijon davlat",
      "andijan state"
    ],
    "city": "Andijon",
    "category": "Davlat OTM",
    "emblemText": "AndDU",
    "emblemBg": "#1D4ED8",
    "logoUrl": "/resources/universities/anddu.png",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari va intellektual tizimlar fakulteti",
      "Kimyo-biologiya fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Xorijiy tillar fakulteti",
      "Ijtimoiy-iqtisodiyot fakulteti",
      "Pedagogika va jismoniy madaniyat fakulteti"
    ]
  },
  {
    "id": "andmi",
    "name": "Andijon Mashinasozlik Instituti (AndMI)",
    "shortName": "AndMI",
    "aliases": [
      "andmi",
      "andijon mashinasozlik",
      "andijan machine-building"
    ],
    "city": "Andijon",
    "category": "Davlat OTM",
    "emblemText": "AndMI",
    "emblemBg": "#B45309",
    "faculties": [
      "Avtomobilsozlik fakulteti",
      "Mashinasozlik texnologiyasi fakulteti",
      "Elektrotexnika va avtomatika fakulteti",
      "Transport logistikasi va xizmat ko‘rsatish fakulteti",
      "Iqtisodiyot va boshqaruv fakulteti"
    ]
  },
  {
    "id": "adti",
    "name": "Andijon Davlat Tibbiyot Instituti (ADTI)",
    "shortName": "ADTI",
    "aliases": [
      "adti",
      "andijon med",
      "andijon tibbiyot",
      "asmi"
    ],
    "city": "Andijon",
    "category": "Davlat OTM",
    "emblemText": "ADTI",
    "emblemBg": "#059669",
    "faculties": [
      "Davolash fakulteti",
      "Pediatriya fakulteti",
      "Stomatologiya fakulteti",
      "Farmatsiya va profilaktika fakulteti"
    ]
  },
  {
    "id": "anddchti",
    "name": "Andijon Davlat Chet Tillar Instituti (AndDChTI)",
    "shortName": "AndDChTI",
    "aliases": [
      "anddchti",
      "andijon chet tillar",
      "andijon inyaz"
    ],
    "city": "Andijon",
    "category": "Davlat OTM",
    "emblemText": "AChTI",
    "emblemBg": "#2563EB",
    "faculties": [
      "Ingliz tili va adabiyoti fakulteti",
      "Roman-german va sharq tillari fakulteti",
      "Tarjimashunoslik va xalqaro jurnalistika fakulteti"
    ]
  },
  {
    "id": "andijon-qishloq",
    "name": "Andijon Qishloq Xo‘jaligi va Agrotexnologiyalar Instituti",
    "shortName": "AQXAI",
    "aliases": [
      "andijon agrar",
      "aqxai",
      "andijon qishloq xojaligi"
    ],
    "city": "Andijon",
    "category": "Davlat OTM",
    "emblemText": "AQXI",
    "emblemBg": "#16A34A",
    "faculties": [
      "Agrobiologiya va o‘simliklar himoyasi fakulteti",
      "Agromuhandislik va gidromelioratsiya fakulteti",
      "Iqtisodiyot va buxgalteriya fakulteti"
    ]
  },
  {
    "id": "namdu",
    "name": "Namangan Davlat Universiteti (NamDU)",
    "shortName": "NamDU",
    "aliases": [
      "namdu",
      "namsu",
      "namangan davlat",
      "namangan state"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NamDU",
    "emblemBg": "#1E40AF",
    "logoUrl": "/resources/universities/namdu.png",
    "faculties": [
      "Fizika va matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Kimyo va biologiya fakulteti",
      "Filologiya fakulteti",
      "Ingliz tili va adabiyoti fakulteti",
      "Tarix va ijtimoiy fanlar fakulteti",
      "Pedagogika va psixologiya fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "nammqi",
    "name": "Namangan Muhandislik-Qurilish Instituti (NamMQI)",
    "shortName": "NamMQI",
    "aliases": [
      "nammqi",
      "namangan qurilish",
      "namangan muhandislik qurilish"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NMQI",
    "emblemBg": "#EA580C",
    "faculties": [
      "Qurilish fakulteti",
      "Muhandislik kommunikatsiyalari fakulteti",
      "Avtotransport fakulteti",
      "Energetika va mehnat muhofazasi fakulteti",
      "Boshqaruv va biznes fakulteti"
    ]
  },
  {
    "id": "nammti",
    "name": "Namangan Muhandislik-Texnologiya Instituti (NamMTI)",
    "shortName": "NamMTI",
    "aliases": [
      "nammti",
      "namangan texnologiya",
      "namangan toqimachilik"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NMTI",
    "emblemBg": "#7C2D12",
    "faculties": [
      "To‘qimachilik sanoati texnologiyalari fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Avtomatika va energetika fakulteti",
      "Oziq-ovqat texnologiyasi fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "namdchti",
    "name": "Namangan Davlat Chet Tillar Instituti (NamDChTI)",
    "shortName": "NamDChTI",
    "aliases": [
      "namdchti",
      "namangan chet tillar",
      "namangan inyaz"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NChTI",
    "emblemBg": "#3B82F6",
    "faculties": [
      "1-Ingliz tili fakulteti",
      "2-Ingliz tili fakulteti",
      "Roman-german va sharq tillari fakulteti"
    ]
  },
  {
    "id": "namangan-pedagogika",
    "name": "Namangan Davlat Pedagogika Instituti",
    "shortName": "NamDPI",
    "aliases": [
      "namangan dpi",
      "namdpi",
      "namangan pedagogika"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NDPI",
    "emblemBg": "#4F46E5",
    "faculties": [
      "Aniq va tabiiy fanlar fakulteti",
      "Ijtimoiy-gumanitar fanlar fakulteti",
      "Boshlang‘ich va maktabgacha ta'lim fakulteti"
    ]
  },
  {
    "id": "namangan-toqimachilik",
    "name": "Namangan To‘qimachilik Sanoati Instituti",
    "shortName": "NTSI",
    "aliases": [
      "namangan toqimachilik sanoati",
      "ntsi",
      "namangan yengil sanoat"
    ],
    "city": "Namangan",
    "category": "Davlat OTM",
    "emblemText": "NTSI",
    "emblemBg": "#9333EA",
    "faculties": [
      "To‘qimachilik texnologiyalari fakulteti",
      "Dizayn va tikuvchilik sanoati fakulteti"
    ]
  },
  {
    "id": "buxdu",
    "name": "Buxoro Davlat Universiteti (BuxDU)",
    "shortName": "BuxDU",
    "aliases": [
      "buxdu",
      "buxsu",
      "buxoro davlat",
      "bukhara state"
    ],
    "city": "Buxoro",
    "category": "Davlat OTM",
    "emblemText": "BuxDU",
    "emblemBg": "#0284C7",
    "logoUrl": "/resources/universities/buxdu.svg",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Kimyo-biologiya fakulteti",
      "Tarix va yuridik fakulteti",
      "Filologiya fakulteti",
      "Xorijiy tillar fakulteti",
      "Iqtisodiyot va turizm fakulteti",
      "Pedagogika va sport fakulteti"
    ]
  },
  {
    "id": "bmti",
    "name": "Buxoro Muhandislik-Texnologiya Instituti (BMTI)",
    "shortName": "BMTI",
    "aliases": [
      "bmti",
      "buxoro texnologiya",
      "buxoro neft gaz"
    ],
    "city": "Buxoro",
    "category": "Davlat OTM",
    "emblemText": "BMTI",
    "emblemBg": "#0369A1",
    "faculties": [
      "Neft va gaz kimyosi fakulteti",
      "Texnologik mashinalar va jihozlar fakulteti",
      "To‘qimachilik va yengil sanoat fakulteti",
      "Energetika va avtomatika fakulteti",
      "Menejment va iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "bdti",
    "name": "Buxoro Davlat Tibbiyot Instituti (BDTI)",
    "shortName": "BDTI",
    "aliases": [
      "bdti",
      "abu ali ibn sino nomidagi bdti",
      "buxoro tibbiyot",
      "buxoro med"
    ],
    "city": "Buxoro",
    "category": "Davlat OTM",
    "emblemText": "BDTI",
    "emblemBg": "#0D9488",
    "faculties": [
      "Davolash ishi fakulteti",
      "Pediatriya va oliy hamshiralik fakulteti",
      "Stomatologiya fakulteti",
      "Farmatsiya va biotibbiyot muhandisligi fakulteti"
    ]
  },
  {
    "id": "buxoro-pedagogika",
    "name": "Buxoro Davlat Pedagogika Instituti",
    "shortName": "BuxDPI",
    "aliases": [
      "buxoro dpi",
      "buxdpi",
      "buxoro pedagogika"
    ],
    "city": "Buxoro",
    "category": "Davlat OTM",
    "emblemText": "BDPI",
    "emblemBg": "#4F46E5",
    "logoUrl": "/resources/universities/buxdu.svg",
    "faculties": [
      "Tabiiy va aniq fanlar fakulteti",
      "Gumanitar fanlar fakulteti",
      "Boshlang‘ich va maktabgacha ta'lim fakulteti",
      "San'at va sport fakulteti"
    ]
  },
  {
    "id": "qardu",
    "name": "Qarshi Davlat Universiteti (QarDU)",
    "shortName": "QarDU",
    "aliases": [
      "qardu",
      "qarshi davlat",
      "qarshi state",
      "karshi state"
    ],
    "city": "Qarshi",
    "category": "Davlat OTM",
    "emblemText": "QarDU",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Fizika fakulteti",
      "Matematika va amaliy informatika fakulteti",
      "Kimyo-biologiya fakulteti",
      "Geografiya va agronomiya fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Xorijiy tillar fakulteti",
      "Iqtisodiyot va pedagogika fakulteti"
    ]
  },
  {
    "id": "qmii",
    "name": "Qarshi Muhandislik-Iqtisodiyot Instituti (QMII)",
    "shortName": "QMII",
    "aliases": [
      "qmii",
      "qarshi muhandislik",
      "qarshi iqtisodiyot",
      "qarshi neft gaz"
    ],
    "city": "Qarshi",
    "category": "Davlat OTM",
    "emblemText": "QMII",
    "emblemBg": "#B45309",
    "faculties": [
      "Neft va gaz fakulteti",
      "Geologiya va konchilik fakulteti",
      "Energetika fakulteti",
      "Muhandislik texnikasi fakulteti",
      "Iqtisodiyot va biznes boshqaruvi fakulteti"
    ]
  },
  {
    "id": "shahrisabz-dpi",
    "name": "Shahrisabz Davlat Pedagogika Instituti",
    "shortName": "ShDPI",
    "aliases": [
      "shahrisabz dpi",
      "shdpi",
      "shahrisabz pedagogika"
    ],
    "city": "Shahrisabz",
    "category": "Davlat OTM",
    "emblemText": "ShDPI",
    "emblemBg": "#6366F1",
    "faculties": [
      "Aniq va tabiiy fanlar fakulteti",
      "O‘zbek tili va gumanitar fanlar fakulteti",
      "Boshlang‘ich ta'lim va jismoniy tarbiya fakulteti"
    ]
  },
  {
    "id": "terdu",
    "name": "Termiz Davlat Universiteti (TerDU)",
    "shortName": "TerDU",
    "aliases": [
      "terdu",
      "termiz davlat",
      "termiz state",
      "surxondaryo davlat"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TerDU",
    "emblemBg": "#047857",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Kimyo va biologiya fakulteti",
      "Tarix fakulteti",
      "O‘zbek filologiyasi fakulteti",
      "Xorijiy filologiya fakulteti",
      "Iqtisodiyot va turizm fakulteti"
    ]
  },
  {
    "id": "terdpi",
    "name": "Termiz Davlat Pedagogika Instituti",
    "shortName": "TerDPI",
    "aliases": [
      "terdpi",
      "termiz dpi",
      "termiz pedagogika"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TDPI",
    "emblemBg": "#4338CA",
    "faculties": [
      "Aniq fanlar fakulteti",
      "Tabiiy fanlar fakulteti",
      "Boshlang‘ich ta'lim va maktabgacha ta'lim fakulteti",
      "Milliy libos va san'at fakulteti"
    ]
  },
  {
    "id": "denov-dpi",
    "name": "Denov Tadbirkorlik va Pedagogika Instituti",
    "shortName": "DTPI",
    "aliases": [
      "denov instituti",
      "dtpi",
      "denov tadbirkorlik",
      "denov pedagogika"
    ],
    "city": "Denov",
    "category": "Davlat OTM",
    "emblemText": "DTPI",
    "emblemBg": "#0891B2",
    "faculties": [
      "Tadbirkorlik va boshqaruv fakulteti",
      "Aniq va tabiiy fanlar fakulteti",
      "Xorijiy tillar va gumanitar fanlar fakulteti"
    ]
  },
  {
    "id": "termiz-muhandislik",
    "name": "Termiz Muhandislik-Texnologiya Instituti",
    "shortName": "TMTI",
    "aliases": [
      "termiz muhandislik",
      "tmti",
      "termiz texnologiya"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TMTI",
    "emblemBg": "#B45309",
    "faculties": [
      "Konchilik va metallurgiya fakulteti",
      "Mexanika va avtotransport fakulteti",
      "Qurilish va energetika fakulteti",
      "Qishloq xo‘jaligi texnologiyalari fakulteti"
    ]
  },
  {
    "id": "termiz-med",
    "name": "Termiz Jamoat Salomatligi Tibbiyot Instituti",
    "shortName": "TJSTI",
    "aliases": [
      "tjsti",
      "termiz tibbiyot",
      "termiz med",
      "termiz jamoat salomatligi"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TJSTI",
    "emblemBg": "#059669",
    "faculties": [
      "Davolash ishi fakulteti",
      "Pediatriya fakulteti",
      "Jamoat salomatligi va farmatsiya fakulteti"
    ]
  },
  {
    "id": "termiz-agrar",
    "name": "Termiz Davlat Muhandislik va Agrotexnologiyalar Universiteti",
    "shortName": "TDMAU",
    "aliases": [
      "tdmau",
      "termiz agrotexnologiyalar",
      "termiz agrar"
    ],
    "city": "Termiz",
    "category": "Davlat OTM",
    "emblemText": "TMAU",
    "emblemBg": "#16A34A",
    "faculties": [
      "Agrobiologiya va biotexnologiya fakulteti",
      "Suv xo‘jaligi va melioratsiya fakulteti",
      "Agromuhandislik fakulteti"
    ]
  },
  {
    "id": "ndktu",
    "name": "Navoiy Davlat Konchilik va Texnologiyalar Universiteti (NDKTU)",
    "shortName": "NDKTU",
    "aliases": [
      "ndktu",
      "ndki",
      "navoiy konchilik",
      "navoi mining"
    ],
    "city": "Navoiy",
    "category": "Davlat OTM",
    "emblemText": "NDKTU",
    "emblemBg": "#C2410C",
    "faculties": [
      "Konchilik ishi fakulteti",
      "Metallurgiya fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Energetika va avtomatlashtirish fakulteti",
      "Mashinasozlik texnologiyasi fakulteti"
    ]
  },
  {
    "id": "ndktu-zarafshon",
    "name": "NDKTU Zarafshon filiali",
    "shortName": "NDKTU ZF",
    "aliases": [
      "ndktu zarafshon",
      "zarafshon konchilik",
      "zarafshon ndki"
    ],
    "city": "Zarafshon",
    "category": "Davlat OTM",
    "emblemText": "NDKTU",
    "emblemBg": "#9A3412",
    "faculties": [
      "Konchilik ishi fakulteti",
      "Metallurgiya va elektrogazpayvandlash fakulteti"
    ]
  },
  {
    "id": "navdpi",
    "name": "Navoiy Davlat Pedagogika Instituti (NavDPI)",
    "shortName": "NavDPI",
    "aliases": [
      "navdpi",
      "navoiy dpi",
      "navoiy pedagogika"
    ],
    "city": "Navoiy",
    "category": "Davlat OTM",
    "emblemText": "NDPI",
    "emblemBg": "#4F46E5",
    "faculties": [
      "Fizika va texnologik ta'lim fakulteti",
      "Matematika va informatika fakulteti",
      "Tabiiy fanlar fakulteti",
      "O‘zbek tili va adabiyoti fakulteti",
      "Tarix fakulteti",
      "Chet tillari fakulteti"
    ]
  },
  {
    "id": "navdu",
    "name": "Navoiy Davlat Universiteti (NavDU)",
    "shortName": "NavDU",
    "aliases": [
      "navdu",
      "navoiy davlat universiteti",
      "navoiy universiteti"
    ],
    "city": "Navoiy",
    "category": "Davlat OTM",
    "emblemText": "NavDU",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Aniq va tabiiy fanlar fakulteti",
      "Ijtimoiy-gumanitar fanlar fakulteti",
      "Iqtisodiyot va axborot tizimlari fakulteti"
    ]
  },
  {
    "id": "urdu",
    "name": "Urganch Davlat Universiteti (UrDU)",
    "shortName": "UrDU",
    "aliases": [
      "urdu",
      "urganch davlat",
      "urgench state",
      "xorazm universiteti"
    ],
    "city": "Urganch",
    "category": "Davlat OTM",
    "emblemText": "UrDU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Texnika fakulteti",
      "Kimyoviy texnologiyalar fakulteti",
      "Bio-muhandislik va oziq-ovqat xavfsizligi fakulteti",
      "Tabiiy fanlar fakulteti",
      "Filologiya fakulteti",
      "Tarix fakulteti",
      "Xorijiy filologiya fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "urganch-pedagogika",
    "name": "Urganch Davlat Pedagogika Instituti",
    "shortName": "UrDPI",
    "aliases": [
      "urganch dpi",
      "urdpi",
      "urganch pedagogika",
      "xorazm pedagogika"
    ],
    "city": "Urganch",
    "category": "Davlat OTM",
    "emblemText": "UrDPI",
    "emblemBg": "#6366F1",
    "faculties": [
      "Aniq va tabiiy fanlar fakulteti",
      "Gumanitar fanlar va san'at fakulteti",
      "Boshlang‘ich ta'lim va jismoniy madaniyat fakulteti"
    ]
  },
  {
    "id": "jizpi",
    "name": "Jizzax Politexnika Instituti (JizPI)",
    "shortName": "JizPI",
    "aliases": [
      "jizpi",
      "jizzax politexnika",
      "jizzax politex"
    ],
    "city": "Jizzax",
    "category": "Davlat OTM",
    "emblemText": "JizPI",
    "emblemBg": "#C2410C",
    "faculties": [
      "Avtotransport fakulteti",
      "Energetika va radioelektronika fakulteti",
      "Qurilish materiallari va muhandislik texnologiyalari fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Arxitektura va qurilish fakulteti",
      "Servis va axborot texnologiyalari fakulteti"
    ]
  },
  {
    "id": "jizdpu",
    "name": "Jizzax Davlat Pedagogika Universiteti (JizDPU)",
    "shortName": "JizDPU",
    "aliases": [
      "jizdpu",
      "jdpu",
      "jizzax pedagogika",
      "abdulla qodiriy nomidagi jdpu"
    ],
    "city": "Jizzax",
    "category": "Davlat OTM",
    "emblemText": "JDPU",
    "emblemBg": "#4338CA",
    "faculties": [
      "Fizika va texnologik ta'lim fakulteti",
      "Matematika va informatika fakulteti",
      "Tabiiy fanlar fakulteti",
      "O‘zbek tili va adabiyoti fakulteti",
      "Tarix fakulteti",
      "Xorijiy tillar fakulteti"
    ]
  },
  {
    "id": "guldu",
    "name": "Guliston Davlat Universiteti (GulDU)",
    "shortName": "GulDU",
    "aliases": [
      "guldu",
      "gulsu",
      "guliston davlat",
      "sirdaryo universiteti"
    ],
    "city": "Guliston",
    "category": "Davlat OTM",
    "emblemText": "GulDU",
    "emblemBg": "#0F766E",
    "faculties": [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Tabiiy fanlar fakulteti",
      "Filologiya fakulteti",
      "Tarix va ijtimoiy fanlar fakulteti",
      "San'atshunoslik fakulteti",
      "Ishlab chiqarish texnologiyalari fakulteti"
    ]
  },
  {
    "id": "guliston-pedagogika",
    "name": "Guliston Davlat Pedagogika Instituti",
    "shortName": "GulDPI",
    "aliases": [
      "guliston dpi",
      "guldpi",
      "guliston pedagogika"
    ],
    "city": "Guliston",
    "category": "Davlat OTM",
    "emblemText": "GDPI",
    "emblemBg": "#6366F1",
    "faculties": [
      "Aniq fanlar fakulteti",
      "Gumanitar fanlar fakulteti",
      "Maktabgacha va boshlang‘ich ta'lim fakulteti"
    ]
  },
  {
    "id": "chdpi",
    "name": "Toshkent viloyati Chirchiq Davlat Pedagogika Universiteti (ChDPI)",
    "shortName": "ChDPI",
    "aliases": [
      "chdpi",
      "chirchiq pedagogika",
      "toshkent viloyati pedagogika"
    ],
    "city": "Chirchiq",
    "category": "Davlat OTM",
    "emblemText": "ChDPI",
    "emblemBg": "#4338CA",
    "faculties": [
      "Fizika va kimyo fakulteti",
      "Matematika va informatika fakulteti",
      "Biologiya va geografiya fakulteti",
      "Gumanitar fanlar fakulteti",
      "Boshlang‘ich ta'lim fakulteti",
      "Xorijiy tillar fakulteti",
      "Sport va chaqiriqqacha ta'lim fakulteti"
    ]
  },
  {
    "id": "qdu",
    "name": "Berdaq nomidagi Qoraqalpoq Davlat Universiteti (QDU)",
    "shortName": "QDU",
    "aliases": [
      "qdu",
      "karsu",
      "qoraqalpoq davlat",
      "karakalpak state",
      "berdaq"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "QDU",
    "emblemBg": "#0284C7",
    "logoUrl": "/resources/universities/qdu.png",
    "faculties": [
      "Fizika fakulteti",
      "Matematika va amaliy informatika fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Biologiya fakulteti",
      "Geografiya va gidrometeorologiya fakulteti",
      "Tarix fakulteti",
      "Qoraqalpoq filologiyasi va jurnalistika fakulteti",
      "O‘zbek filologiyasi fakulteti",
      "Chet tillari fakulteti",
      "Iqtisodiyot fakulteti",
      "Yuridik fakulteti"
    ]
  },
  {
    "id": "nmpi",
    "name": "Ajiniyoz nomidagi Nukus Davlat Pedagogika Instituti (NMPI)",
    "shortName": "NMPI",
    "aliases": [
      "nmpi",
      "ndpi",
      "nukus pedagogika",
      "ajiniyoz nomidagi ndpi"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "NMPI",
    "emblemBg": "#3B82F6",
    "faculties": [
      "Fizika va matematika fakulteti",
      "Tabiiy fanlar fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Xorijiy tillar fakulteti",
      "Boshlang‘ich ta'lim fakulteti"
    ]
  },
  {
    "id": "qoraqalpoq-med",
    "name": "Qoraqalpog‘iston Tibbiyot Instituti",
    "shortName": "QTI",
    "aliases": [
      "qti",
      "nukus med",
      "qoraqalpoq tibbiyot",
      "nukus tibbiyot"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "QTI",
    "emblemBg": "#059669",
    "faculties": [
      "Davolash ishi fakulteti",
      "Pediatriya fakulteti",
      "Stomatologiya fakulteti",
      "Xalqaro fakultet"
    ]
  },
  {
    "id": "qoraqalpoq-agrar",
    "name": "Qoraqalpog‘iston Qishloq Xo‘jaligi va Agrotexnologiyalar Instituti",
    "shortName": "QQXAI",
    "aliases": [
      "qqxai",
      "nukus agrar",
      "qoraqalpoq qishloq xojaligi"
    ],
    "city": "Nukus",
    "category": "Davlat OTM",
    "emblemText": "QQXI",
    "emblemBg": "#16A34A",
    "faculties": [
      "Agrobiologiya fakulteti",
      "Agromuhandislik va gidromelioratsiya fakulteti",
      "Iqtisodiyot va buxgalteriya fakulteti"
    ]
  },
  {
    "id": "ttpu",
    "name": "Toshkent shahridagi Turin Politexnika Universiteti (TTPU)",
    "shortName": "Turin",
    "aliases": [
      "turin",
      "ttpu",
      "politecnico di torino",
      "turin politexnika"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "TTPU",
    "emblemBg": "#991B1B",
    "logoUrl": "/resources/universities/ttpu.png",
    "faculties": [
      "Mashinasozlik va aerokosmik injiniring fakulteti",
      "Axborot texnologiyalari va dasturlash fakulteti",
      "Avtomobilsozlik va mexatronika fakulteti",
      "Sanoat-fuqaro qurilishi va arxitektura fakulteti"
    ]
  },
  {
    "id": "inha",
    "name": "Toshkent shahridagi Inha Universiteti (IUT)",
    "shortName": "Inha",
    "aliases": [
      "inha",
      "iut",
      "inha university in tashkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "IUT",
    "emblemBg": "#1D4ED8",
    "logoUrl": "/resources/universities/inha.png",
    "faculties": [
      "Kompyuter va dasturiy injiniring maktabi (SOCIE)",
      "Logistika va biznes boshqaruvi maktabi (SBL)"
    ]
  },
  {
    "id": "wiut",
    "name": "Toshkent shahridagi Vestminster Xalqaro Universiteti (WIUT)",
    "shortName": "WIUT",
    "aliases": [
      "wiut",
      "westminster",
      "vestminster"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "WIUT",
    "emblemBg": "#3730A3",
    "logoUrl": "/resources/universities/wiut.svg",
    "faculties": [
      "Axborot tizimlari va raqamli texnologiyalar (BIS)",
      "Iqtisodiyot va moliya fakulteti",
      "Biznes boshqaruvi fakulteti",
      "Xalqaro tijorat huquqi fakulteti"
    ]
  },
  {
    "id": "amity",
    "name": "Toshkent shahridagi Amiti Universiteti (Amity Tashkent)",
    "shortName": "Amity",
    "aliases": [
      "amity",
      "amiti",
      "amity university tashkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "AMTY",
    "emblemBg": "#EAB308",
    "logoUrl": "/resources/universities/amity.png",
    "faculties": [
      "Axborot texnologiyalari va kompyuter injiniringi maktabi",
      "Muhandislik va texnologiyalar maktabi",
      "Menejment va biznes boshqaruvi maktabi",
      "Turizm va mehmondo‘stlik maktabi"
    ]
  },
  {
    "id": "bucheon",
    "name": "Toshkent shahridagi Puchon Universiteti (BUT)",
    "shortName": "Bucheon",
    "aliases": [
      "bucheon",
      "puchon",
      "bucheon university in tashkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "BUT",
    "emblemBg": "#BE123C",
    "faculties": [
      "Maktabgacha ta'lim fakulteti",
      "Arxitektura va bino qurilishi fakulteti",
      "Koreys tili va biznes boshqaruvi fakulteti",
      "Axborot-kommunikatsiya texnologiyalari fakulteti"
    ]
  },
  {
    "id": "mdis",
    "name": "Toshkent shahridagi Singapur Menejmentni Rivojlantirish Instituti (MDIS Tashkent)",
    "shortName": "MDIS",
    "aliases": [
      "mdis",
      "mdis tashkent",
      "singapur instituti",
      "singapore"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "MDIS",
    "emblemBg": "#831843",
    "logoUrl": "/resources/universities/mdis.png",
    "faculties": [
      "Biznes va boshqaruv maktabi",
      "Bank ishi va moliya fakulteti",
      "Turizm va mehmondo‘stlik fakulteti",
      "Axborot texnologiyalari maktabi"
    ]
  },
  {
    "id": "webster",
    "name": "Toshkent shahridagi Webster Universiteti",
    "shortName": "Webster",
    "aliases": [
      "webster",
      "webster university",
      "vebster"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "WU",
    "emblemBg": "#1E40AF",
    "logoUrl": "/resources/universities/webster.png",
    "faculties": [
      "Kompyuter fanlari va axborot texnologiyalari (George Herbert Walker School)",
      "Biznes boshqaruvi va moliya fakulteti",
      "Ta'lim va gumanitar fanlar maktabi",
      "Media kommunikatsiyalari fakulteti"
    ]
  },
  {
    "id": "mephi",
    "name": "MIFI Milliy Tadqiqot Yadro Universiteti Toshkent filiali",
    "shortName": "MIFI",
    "aliases": [
      "mifi",
      "mephi",
      "yadro universiteti",
      "mifi toshkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "MIFI",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Yadro fizikasi va texnologiyalari fakulteti",
      "Yadro energetikasi va issiqlik fizikasi fakulteti",
      "Materialshunoslik va elektronika fakulteti"
    ]
  },
  {
    "id": "gubkin",
    "name": "Gubkin nomidagi Rossiya Davlat Neft va Gaz Universiteti Toshkent filiali",
    "shortName": "Gubkin",
    "aliases": [
      "gubkin",
      "gubkina",
      "rossiya neft gaz"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "GUBK",
    "emblemBg": "#B45309",
    "faculties": [
      "Neft va gaz quduqlarini burg‘ilash fakulteti",
      "Neft va gaz konlarini ishlatish fakulteti",
      "Quvur transporti inshootlari fakulteti",
      "Neft-gaz sohasi iqtisodiyoti fakulteti"
    ]
  },
  {
    "id": "mgu",
    "name": "Lomonosov nomidagi Moskva Davlat Universiteti (MGU) Toshkent filiali",
    "shortName": "MGU",
    "aliases": [
      "mgu",
      "msu",
      "lomonosov",
      "mgu toshkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "MGU",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Amaliy matematika va informatika fakulteti",
      "Psixologiya fakulteti",
      "Filologiya fakulteti"
    ]
  },
  {
    "id": "spbgu",
    "name": "Sankt-Peterburg Davlat Universiteti Toshkent filiali",
    "shortName": "SPbDU",
    "aliases": [
      "spbgu",
      "spbdu",
      "piter universiteti",
      "sankt peterburg"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "SPbU",
    "emblemBg": "#0369A1",
    "faculties": [
      "Sharq tillari va xalqaro munosabatlar fakulteti",
      "Biotibbiyot va biologiya fakulteti",
      "Huquqshunoslik fakulteti"
    ]
  },
  {
    "id": "mgimo",
    "name": "MGIMO Universiteti Toshkent filiali",
    "shortName": "MGIMO",
    "aliases": [
      "mgimo",
      "mgimo toshkent",
      "mgimo tashkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "MGM",
    "emblemBg": "#0F172A",
    "faculties": [
      "Xalqaro xususiy va fuqarolik huquqi fakulteti",
      "Xalqaro biznes va savdo boshqaruvi fakulteti"
    ]
  },
  {
    "id": "plekhanov",
    "name": "G.V. Plexanov nomidagi Rossiya Iqtisodiyot Universiteti Toshkent filiali",
    "shortName": "Plexanov",
    "aliases": [
      "plexanov",
      "reu",
      "plekhanov",
      "rea"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "REU",
    "emblemBg": "#1E40AF",
    "faculties": [
      "Iqtisodiyot va moliya fakulteti",
      "Biznes-informatika fakulteti",
      "Savdo ishi va marketing fakulteti"
    ]
  },
  {
    "id": "kfu-jizzax",
    "name": "Qozon Federal Universiteti Jizzax filiali",
    "shortName": "KFU",
    "aliases": [
      "kfu",
      "kfu jizzax",
      "qozon universiteti"
    ],
    "city": "Jizzax",
    "category": "Xalqaro / Filial",
    "emblemText": "KFU",
    "emblemBg": "#1D4ED8",
    "faculties": [
      "Dasturiy injiniring va IT fakulteti",
      "Tibbiy biokimyo va biotibbiyot fakulteti",
      "Geologiya va yer osti boyliklari fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "gerzen",
    "name": "A.I. Gertsena nomidagi Rossiya Davlat Pedagogika Universiteti Toshkent filiali",
    "shortName": "Gertsena",
    "aliases": [
      "gerzen",
      "gertsena",
      "rgpu",
      "rossiya pedagogika"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "RGPU",
    "emblemBg": "#6D28D9",
    "faculties": [
      "Psixologiya va defektologiya fakulteti",
      "Boshlang‘ich ta'lim metodikasi fakulteti",
      "Rus tili va madaniyati fakulteti"
    ]
  },
  {
    "id": "misis-olmaliq",
    "name": "MISiS Milliy Tadqiqot Texnologik Universiteti Olmaliq filiali",
    "shortName": "MISiS",
    "aliases": [
      "misis",
      "misis olmaliq",
      "misis toshkent"
    ],
    "city": "Olmaliq",
    "category": "Xalqaro / Filial",
    "emblemText": "MISiS",
    "emblemBg": "#B45309",
    "faculties": [
      "Metallurgiya fakulteti",
      "Konchilik ishi fakulteti",
      "Materialshunoslik va yangi materiallar texnologiyasi fakulteti"
    ]
  },
  {
    "id": "bntu-tashkent",
    "name": "Belorussiya-O‘zbekiston Qo‘shma Tarmoqlararo Amaliy Texnik Kvalifikatsiyalar Instituti",
    "shortName": "BNTU-TDTU",
    "aliases": [
      "bntu",
      "belorussiya instituti",
      "bntu toshkent"
    ],
    "city": "Toshkent",
    "category": "Xalqaro / Filial",
    "emblemText": "BNTU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Mashinasozlik texnologiyalari fakulteti",
      "Axborot texnologiyalari va dasturlash fakulteti",
      "Biotibbiyot muhandisligi fakulteti"
    ]
  },
  {
    "id": "sharda-andijon",
    "name": "Sharda Universiteti O‘zbekiston (Andijon)",
    "shortName": "Sharda",
    "aliases": [
      "sharda",
      "sharda university",
      "sharda andijon"
    ],
    "city": "Andijon",
    "category": "Xalqaro / Filial",
    "emblemText": "SHRD",
    "emblemBg": "#0284C7",
    "faculties": [
      "School of Engineering and Technology (IT va Dasturlash)",
      "School of Business Studies (Biznes va Menejment)",
      "School of Basic and Applied Sciences"
    ]
  },
  {
    "id": "sambhram-jizzax",
    "name": "Sambhram Universiteti Jizzax filiali",
    "shortName": "Sambhram",
    "aliases": [
      "sambhram",
      "sambhram jizzax",
      "sambram university"
    ],
    "city": "Jizzax",
    "category": "Xalqaro / Filial",
    "emblemText": "SMBR",
    "emblemBg": "#1E40AF",
    "faculties": [
      "Computer Science and Engineering (Kompyuter injiniringi)",
      "Business Administration (Biznes boshqaruvi)"
    ]
  },
  {
    "id": "cau",
    "name": "Central Asian University (CAU, sobiq Akfa Universiteti)",
    "shortName": "CAU",
    "aliases": [
      "cau",
      "akfa",
      "akfa university",
      "central asian university",
      "akfa universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "CAU",
    "emblemBg": "#0F766E",
    "logoUrl": "/resources/universities/cau.svg",
    "faculties": [
      "School of Engineering & Computer Science",
      "School of Medicine (Tibbiyot fakulteti)",
      "School of Business (Biznes va Moliya)",
      "School of Architecture and Design",
      "School of Dentistry (Stomatologiya)",
      "School of Education & English"
    ]
  },
  {
    "id": "kiut",
    "name": "Toshkent Kimyo Xalqaro Universiteti (KIUT, sobiq Yeoju)",
    "shortName": "KIUT",
    "aliases": [
      "kiut",
      "yeoju",
      "ytit",
      "yeoju technical institute",
      "kimyo xalqaro"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "KIUT",
    "emblemBg": "#1E3A8A",
    "logoUrl": "/resources/universities/kiut.svg",
    "faculties": [
      "Dasturiy injiniring va axborot tizimlari fakulteti",
      "Arxitektura va shaharsozlik fakulteti",
      "Mashinasozlik va avtomobilsozlik fakulteti",
      "Biznes boshqaruvi va xalqaro marketing fakulteti",
      "Moliya va xalqaro iqtisodiy munosabatlar fakulteti",
      "Davolash ishi va farmatsiya fakulteti",
      "Stomatologiya fakulteti",
      "Koreys filologiyasi fakulteti",
      "Liboslar dizayni va tasviriy san'at fakulteti",
      "Boshlang‘ich va maktabgacha ta'lim fakulteti"
    ]
  },
  {
    "id": "pdp-university",
    "name": "PDP University",
    "shortName": "PDP Uni",
    "aliases": [
      "pdp",
      "pdp university",
      "pdp akademiya",
      "pdp it"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "PDP",
    "emblemBg": "#059669",
    "logoUrl": "/resources/universities/pdp.svg",
    "faculties": [
      "School of Software Engineering (Dasturiy injiniring)",
      "School of Artificial Intelligence and Data Science",
      "School of Cybersecurity (Kiberxavfsizlik)",
      "School of Product Management and IT-Business"
    ]
  },
  {
    "id": "it-park-uni",
    "name": "IT Park University",
    "shortName": "ITPU",
    "aliases": [
      "it park",
      "it park university",
      "itpu",
      "itpark"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "ITPU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Software Engineering (Dasturiy injiniring)",
      "Cybersecurity (Kiberxavfsizlik)",
      "Data Science and AI (Sun'iy intellekt)",
      "Digital Business and Product Management"
    ]
  },
  {
    "id": "tiue",
    "name": "Tashkent International University of Education (TIUE)",
    "shortName": "TIUE",
    "aliases": [
      "tiue",
      "tiue university",
      "tashkent international university of education"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TIUE",
    "emblemBg": "#2563EB",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Ta'limni boshqarish va pedagogika fakulteti",
      "Biznes boshqaruvi fakulteti"
    ]
  },
  {
    "id": "bmu",
    "name": "British Management University in Tashkent (BMU)",
    "shortName": "BMU",
    "aliases": [
      "bmu",
      "british management",
      "british university"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "BMU",
    "emblemBg": "#831843",
    "faculties": [
      "BSc in Accounting and Finance",
      "BSc in Project Management",
      "BSc in Banking and Finance",
      "BSc in Digital Marketing and Business"
    ]
  },
  {
    "id": "team-uni",
    "name": "TEAM University",
    "shortName": "TEAM",
    "aliases": [
      "team",
      "team university",
      "team uni"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TEAM",
    "emblemBg": "#EA580C",
    "faculties": [
      "Entrepreneurship and Innovation (Tadbirkorlik va innovatsiyalar)",
      "Digital Marketing (Raqamli marketing)",
      "International Hospitality Management",
      "Fintech and Financial Analytics"
    ]
  },
  {
    "id": "nordic",
    "name": "Nordic International University",
    "shortName": "Nordic",
    "aliases": [
      "nordic",
      "nordic university",
      "shimoliy xalqaro",
      "finland"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "NIU",
    "emblemBg": "#1D4ED8",
    "faculties": [
      "Axborot texnologiyalari va raqamli innovatsiyalar",
      "Pedagogika va psixologiya (Fin modeli)",
      "Xalqaro iqtisodiyot va moliya fakulteti",
      "Boshlang‘ich ta'lim va filologiya fakulteti"
    ]
  },
  {
    "id": "isft",
    "name": "ISFT Instituti (International School of Finance Technology and Science)",
    "shortName": "ISFT",
    "aliases": [
      "isft",
      "isft instituti",
      "isft institute"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "ISFT",
    "emblemBg": "#047857",
    "faculties": [
      "Xalqaro amaliy buxgalteriya va moliya (ACCA)",
      "Axborot tizimlari va dasturlash fakulteti",
      "Xalqaro biznes boshqaruvi va menejment",
      "Xorijiy filologiya va tarjima fakulteti"
    ]
  },
  {
    "id": "cambridge-uni",
    "name": "Cambridge International University (CIU)",
    "shortName": "Cambridge",
    "aliases": [
      "cambridge",
      "ciu",
      "cambridge tashkent",
      "cambridge international"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "CIU",
    "emblemBg": "#991B1B",
    "faculties": [
      "Business Administration and Management",
      "Computer Science and Applied AI",
      "Educational Leadership and Pedagogy"
    ]
  },
  {
    "id": "alfraganus",
    "name": "Alfraganus University",
    "shortName": "Alfraganus",
    "aliases": [
      "alfraganus",
      "alfraganus university",
      "al-farg'oniy"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "ALFR",
    "emblemBg": "#4338CA",
    "faculties": [
      "Tibbiyot fakulteti",
      "Raqamli texnologiyalar va injiniring fakulteti",
      "Iqtisodiyot va moliya fakulteti",
      "Filologiya va pedagogika fakulteti",
      "Huquqshunoslik fakulteti",
      "Jismoniy tarbiya va sport fakulteti"
    ]
  },
  {
    "id": "renessans",
    "name": "Renessans Ta'lim Universiteti",
    "shortName": "Renessans",
    "aliases": [
      "renessans",
      "renessans university",
      "renaissance"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "REN",
    "emblemBg": "#C2410C",
    "faculties": [
      "Axborot texnologiyalari va raqamli iqtisodiyot",
      "Iqtisodiyot va bank ishi fakulteti",
      "Filologiya va tillarni o‘qitish fakulteti",
      "Pedagogika va boshlang‘ich ta'lim fakulteti",
      "Yurisprudensiya fakulteti"
    ]
  },
  {
    "id": "utas",
    "name": "Toshkent Amaliy Fanlar Universiteti (UTAS)",
    "shortName": "UTAS",
    "aliases": [
      "utas",
      "toshkent amaliy fanlar",
      "university of applied sciences"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "UTAS",
    "emblemBg": "#0284C7",
    "faculties": [
      "Kompyuter injiniringi va axborot xavfsizligi fakulteti",
      "Iqtisodiyot va moliya fakulteti",
      "Pedagogika va gumanitar fanlar fakulteti",
      "Dizayn va san'at fakulteti"
    ]
  },
  {
    "id": "qoqon-uni",
    "name": "Qo‘qon Universiteti",
    "shortName": "QU",
    "aliases": [
      "qoqon universiteti",
      "kokand university",
      "qu"
    ],
    "city": "Qo‘qon",
    "category": "Nodavlat / Xususiy",
    "emblemText": "QU",
    "emblemBg": "#1E40AF",
    "faculties": [
      "Raqamli texnologiyalar fakulteti",
      "Xalqaro turizm va servis fakulteti",
      "Iqtisodiyot va menejment fakulteti",
      "Xorijiy tillar va boshlang‘ich ta'lim fakulteti"
    ]
  },
  {
    "id": "oxu",
    "name": "Osiyo Xalqaro Universiteti (OXU)",
    "shortName": "OXU",
    "aliases": [
      "oxu",
      "osiyo xalqaro",
      "asia international university",
      "buxoro oxu"
    ],
    "city": "Buxoro",
    "category": "Nodavlat / Xususiy",
    "emblemText": "OXU",
    "emblemBg": "#0D9488",
    "faculties": [
      "Davolash ishi va stomatologiya fakulteti",
      "Axborot texnologiyalari va dasturlash fakulteti",
      "Iqtisodiyot va biznes boshqaruvi fakulteti",
      "Pedagogika va filologiya fakulteti"
    ]
  },
  {
    "id": "bittu",
    "name": "Buxoro Innovatsiyalar Universiteti (BITTU)",
    "shortName": "BITTU",
    "aliases": [
      "bittu",
      "buxoro innovatsiya",
      "bukhara innovation"
    ],
    "city": "Buxoro",
    "category": "Nodavlat / Xususiy",
    "emblemText": "BITT",
    "emblemBg": "#2563EB",
    "faculties": [
      "Kompyuter tizimlari va dasturlash fakulteti",
      "Moliya va buxgalteriya hisobi fakulteti",
      "Xorijiy filologiya fakulteti",
      "Pedagogika fakulteti"
    ]
  },
  {
    "id": "zarmed",
    "name": "Zarmed Universiteti",
    "shortName": "Zarmed",
    "aliases": [
      "zarmed",
      "zarmed university",
      "zarmed buxoro",
      "zarmed samarqand"
    ],
    "city": "Buxoro",
    "category": "Nodavlat / Xususiy",
    "emblemText": "ZMD",
    "emblemBg": "#059669",
    "faculties": [
      "Davolash ishi fakulteti",
      "Farmatsiya fakulteti",
      "Stomatologiya fakulteti",
      "Axborot texnologiyalari va iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "tmc",
    "name": "TMC Institute Tashkent",
    "shortName": "TMC",
    "aliases": [
      "tmc",
      "tmc institute",
      "tmc toshkent"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TMC",
    "emblemBg": "#0891B2",
    "faculties": [
      "Computing and Information Technology",
      "Business and Management",
      "Digital Accounting and Finance"
    ]
  },
  {
    "id": "emu-uni",
    "name": "EMU University (Eurasian Medical University)",
    "shortName": "EMU",
    "aliases": [
      "emu",
      "emu university",
      "eurasian medical",
      "yevroosiyo tibbiyot"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "EMU",
    "emblemBg": "#047857",
    "faculties": [
      "Davolash ishi fakulteti",
      "Stomatologiya fakulteti",
      "Pediatriya fakulteti",
      "Farmatsiya fakulteti"
    ]
  },
  {
    "id": "turon-uni",
    "name": "Turon Fanlar Akademiyasi Universiteti",
    "shortName": "Turon",
    "aliases": [
      "turon",
      "turon university",
      "turon universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TRN",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Axborot texnologiyalari va muhandislik",
      "Iqtisodiyot va biznes boshqaruvi",
      "Filologiya va pedagogika fakulteti"
    ]
  },
  {
    "id": "al-buxoriy",
    "name": "Al-Buxoriy Universiteti (Samarqand)",
    "shortName": "Al-Buxoriy",
    "aliases": [
      "al buxoriy",
      "albuxoriy",
      "buxoriy universiteti"
    ],
    "city": "Samarqand",
    "category": "Nodavlat / Xususiy",
    "emblemText": "BUX",
    "emblemBg": "#15803D",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Moliya va bank ishi fakulteti",
      "Filologiya va tarjimashunoslik fakulteti"
    ]
  },
  {
    "id": "fiu",
    "name": "Farg‘ona Xalqaro Universiteti (FIU)",
    "shortName": "FIU",
    "aliases": [
      "fiu",
      "fargona xalqaro",
      "fergana international"
    ],
    "city": "Farg‘ona",
    "category": "Nodavlat / Xususiy",
    "emblemText": "FIU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Iqtisodiyot va biznes fakulteti",
      "Pedagogika va chet tillari fakulteti"
    ]
  },
  {
    "id": "stars-uni",
    "name": "STARS International University",
    "shortName": "STARS",
    "aliases": [
      "stars",
      "stars university",
      "stars international"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "STR",
    "emblemBg": "#B45309",
    "faculties": [
      "Accounting and Finance (ACCA)",
      "Global Business and International Logistics",
      "AI, Computing and Data Science"
    ]
  },
  {
    "id": "diplomat-uni",
    "name": "Diplomat University",
    "shortName": "Diplomat",
    "aliases": [
      "diplomat",
      "diplomat university",
      "diplomat universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "DIP",
    "emblemBg": "#1E3A8A",
    "faculties": [
      "Xalqaro munosabatlar va diplomatiya",
      "Xalqaro iqtisodiyot fakulteti",
      "Axborot xavfsizligi va IT fakulteti"
    ]
  },
  {
    "id": "proactive-uni",
    "name": "Proactive University",
    "shortName": "Proactive",
    "aliases": [
      "proactive",
      "proactive university"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "PRO",
    "emblemBg": "#4F46E5",
    "faculties": [
      "Kompyuter texnologiyalari fakulteti",
      "Menejment va marketing fakulteti",
      "Pedagogika fakulteti"
    ]
  },
  {
    "id": "aifu",
    "name": "Aniq va Ijtimoiy Fanlar Universiteti (AIFU)",
    "shortName": "AIFU",
    "aliases": [
      "aifu",
      "aniq va ijtimoiy",
      "aniq fanlar universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "AIFU",
    "emblemBg": "#0369A1",
    "faculties": [
      "Dasturiy ta'minot injiniringi fakulteti",
      "Raqamli moliya va buxgalteriya fakulteti",
      "Filologiya va gumanitar fanlar fakulteti"
    ]
  },
  {
    "id": "jdu",
    "name": "Yaponiya Raqamli Universiteti (Japan Digital University - JDU)",
    "shortName": "JDU",
    "aliases": [
      "jdu",
      "japan digital",
      "yaponiya raqamli"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "JDU",
    "emblemBg": "#DC2626",
    "faculties": [
      "Dasturiy ta'minot injiniringi fakulteti",
      "Yapon tili va xalqaro biznes fakulteti"
    ]
  },
  {
    "id": "european-uni",
    "name": "Yevropa Universiteti (European University Tashkent)",
    "shortName": "European",
    "aliases": [
      "european university",
      "yevropa universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "EU",
    "emblemBg": "#1D4ED8",
    "faculties": [
      "Xalqaro biznes va savdo fakulteti",
      "Axborot texnologiyalari fakulteti"
    ]
  },
  {
    "id": "yangi-asr",
    "name": "Yangi Asr Universiteti",
    "shortName": "Yangi Asr",
    "aliases": [
      "yangi asr",
      "yangi asr universiteti"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "YAU",
    "emblemBg": "#059669",
    "faculties": [
      "Kompyuter injiniringi fakulteti",
      "Moliya va audit fakulteti",
      "Pedagogika fakulteti"
    ]
  },
  {
    "id": "tipi",
    "name": "Toshkent Iqtisodiyot va Pedagogika Instituti (TIPI)",
    "shortName": "TIPI",
    "aliases": [
      "tipi",
      "toshkent iqtisodiyot pedagogika"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TIPI",
    "emblemBg": "#2563EB",
    "faculties": [
      "Pedagogika va psixologiya fakulteti",
      "Iqtisodiyot va axborot texnologiyalari fakulteti",
      "Boshlang‘ich ta'lim fakulteti"
    ]
  },
  {
    "id": "tgfu",
    "name": "Toshkent Gumanitar Fanlar Universiteti (TGFU)",
    "shortName": "TGFU",
    "aliases": [
      "tgfu",
      "toshkent gumanitar"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "TGFU",
    "emblemBg": "#7C3AED",
    "faculties": [
      "Filologiya va tillar fakulteti",
      "Ijtimoiy-gumanitar fanlar fakulteti",
      "Axborot texnologiyalari fakulteti"
    ]
  },
  {
    "id": "mamun-uni",
    "name": "Ma'mun Universiteti (Xiva)",
    "shortName": "Ma'mun",
    "aliases": [
      "mamun",
      "ma'mun",
      "mamun universiteti",
      "xiva mamun"
    ],
    "city": "Xiva",
    "category": "Nodavlat / Xususiy",
    "emblemText": "MAM",
    "emblemBg": "#B45309",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Filologiya fakulteti",
      "Tabiiy fanlar fakulteti",
      "Iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "ranch-uni",
    "name": "Urganch Ranch Texnologiya Universiteti",
    "shortName": "Ranch",
    "aliases": [
      "ranch",
      "ranch university",
      "urganch ranch"
    ],
    "city": "Urganch",
    "category": "Nodavlat / Xususiy",
    "emblemText": "RNCH",
    "emblemBg": "#C2410C",
    "faculties": [
      "IT va axborot texnologiyalari fakulteti",
      "Iqtisodiyot fakulteti",
      "Muhandislik fakulteti"
    ]
  },
  {
    "id": "siut",
    "name": "Samarqand Xalqaro Texnologiya Universiteti (SIUT)",
    "shortName": "SIUT",
    "aliases": [
      "siut",
      "samarkand international university of technology",
      "siut samarqand"
    ],
    "city": "Samarqand",
    "category": "Nodavlat / Xususiy",
    "emblemText": "SIUT",
    "emblemBg": "#0E7490",
    "faculties": [
      "Computer Science and AI (Kompyuter fanlari va SI)",
      "Petroleum and Gas Engineering (Neft va gaz muhandisligi)",
      "Chemical Engineering (Kimyoviy injiniring)",
      "Green Energy and Renewable Power (Yashil energetika)"
    ]
  },
  {
    "id": "farobi-uni",
    "name": "Farobi Universiteti",
    "shortName": "Farobi",
    "aliases": [
      "farobi",
      "farobi university",
      "al-forobiy"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "FRB",
    "emblemBg": "#047857",
    "faculties": [
      "Davolash ishi fakulteti",
      "Farmatsiya fakulteti",
      "IT va menejment fakulteti"
    ]
  },
  {
    "id": "rohat-uni",
    "name": "Rohat Universiteti",
    "shortName": "Rohat",
    "aliases": [
      "rohat",
      "rohat university"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "ROH",
    "emblemBg": "#2563EB",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Iqtisodiyot fakulteti",
      "Filologiya fakulteti"
    ]
  },
  {
    "id": "perfect-uni",
    "name": "Perfect University",
    "shortName": "Perfect",
    "aliases": [
      "perfect",
      "perfect university"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "PRF",
    "emblemBg": "#7C3AED",
    "faculties": [
      "Dasturiy ta'minot injiniringi fakulteti",
      "Iqtisodiyot va moliya fakulteti",
      "Xorijiy filologiya fakulteti"
    ]
  },
  {
    "id": "aiqi",
    "name": "Andijon Iqtisodiyot va Qurilish Instituti (AIQI)",
    "shortName": "AIQI",
    "aliases": [
      "aiqi",
      "andijon iqtisodiyot qurilish",
      "andijon xususiy"
    ],
    "city": "Andijon",
    "category": "Nodavlat / Xususiy",
    "emblemText": "AIQI",
    "emblemBg": "#D97706",
    "faculties": [
      "Qurilish va arxitektura fakulteti",
      "Iqtisodiyot va boshqaruv fakulteti",
      "Axborot tizimlari fakulteti"
    ]
  },
  {
    "id": "ntu",
    "name": "Milliy Texnologiyalar Universiteti (NTU)",
    "shortName": "NTU",
    "aliases": [
      "ntu",
      "milliy texnologiyalar",
      "national technologies university"
    ],
    "city": "Toshkent",
    "category": "Nodavlat / Xususiy",
    "emblemText": "NTU",
    "emblemBg": "#0284C7",
    "faculties": [
      "Sun'iy intellekt va dasturiy ta'minot",
      "Kiberxavfsizlik va tarmoq texnologiyalari",
      "Raqamli iqtisodiyot fakulteti"
    ]
  },
  {
    "id": "smart-uni",
    "name": "Smart Universiteti (Farg‘ona)",
    "shortName": "Smart",
    "aliases": [
      "smart",
      "smart university",
      "smart fargona"
    ],
    "city": "Farg‘ona",
    "category": "Nodavlat / Xususiy",
    "emblemText": "SMRT",
    "emblemBg": "#059669",
    "faculties": [
      "Dasturiy injiniring fakulteti",
      "Moliya va biznes boshqaruvi",
      "Pedagogika va chet tillari"
    ]
  },
  {
    "id": "renessans-samarqand",
    "name": "Renessans Ta'lim Universiteti Samarqand filiali",
    "shortName": "Renessans Sam",
    "aliases": [
      "renessans samarqand",
      "samarqand renessans"
    ],
    "city": "Samarqand",
    "category": "Nodavlat / Xususiy",
    "emblemText": "REN",
    "emblemBg": "#C2410C",
    "faculties": [
      "Axborot texnologiyalari fakulteti",
      "Iqtisodiyot va moliya fakulteti",
      "Filologiya va tillarni o‘qitish fakulteti"
    ]
  }
];

/**
 * Normalizes a search string: lowercases, removes apostrophes/accents, trims whitespace
 */
export function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[‘'’`ʻʼ]/g, "")
    .replace(/o‘/g, "o")
    .replace(/g‘/g, "g")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/[\s\-_.,()]+/g, " ")
    .trim();
}

/**
 * Searches universities by query with relevance scoring and emblem badge support.
 * Searches across name, shortName, aliases, and city.
 */
export function searchUniversities(
  query: string,
  limit: number = 25
): University[] {
  const norm = normalizeSearch(query);
  if (!norm) {
    return UZBEKISTAN_UNIVERSITIES.slice(0, limit);
  }

  const results: { uni: University; score: number }[] = [];

  for (const uni of UZBEKISTAN_UNIVERSITIES) {
    const normName = normalizeSearch(uni.name);
    const normShort = normalizeSearch(uni.shortName);
    const normCity = normalizeSearch(uni.city);
    let score = 0;

    // Exact match on shortName (e.g. "TATU", "OzMU")
    if (normShort === norm) {
      score += 200;
    } else if (normShort.startsWith(norm)) {
      score += 120;
    } else if (normShort.includes(norm)) {
      score += 80;
    }

    // Exact match on name
    if (normName === norm) {
      score += 180;
    } else if (normName.startsWith(norm)) {
      score += 100;
    } else if (normName.includes(norm)) {
      score += 50;
    }

    // Match on aliases
    for (const alias of uni.aliases) {
      const a = normalizeSearch(alias);
      if (a === norm) {
        score += 160;
        break;
      }
      if (a.startsWith(norm)) {
        score += 70;
        break;
      }
      if (a.includes(norm)) {
        score += 40;
        break;
      }
    }

    // Match on city
    if (normCity.includes(norm)) {
      score += 30;
    }

    if (score > 0) {
      results.push({ uni, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.uni);
}

/**
 * Finds a university by exact name, shortName, id, or alias
 */
export function findUniversity(input: string): University | undefined {
  const norm = normalizeSearch(input);
  if (!norm) return undefined;

  return UZBEKISTAN_UNIVERSITIES.find((u) => {
    if (normalizeSearch(u.name) === norm) return true;
    if (normalizeSearch(u.shortName) === norm) return true;
    if (u.id.toLowerCase() === norm) return true;
    return u.aliases.some((a) => normalizeSearch(a) === norm);
  });
}

/**
 * Validates whether a university string corresponds to a verified real university
 */
export function isValidUniversityName(input: string): boolean {
  return findUniversity(input) !== undefined;
}

/**
 * Gets list of faculties for a university
 */
export function getFacultiesForUniversity(universityInput: string): string[] {
  const uni = findUniversity(universityInput);
  return uni ? uni.faculties : [];
}

/**
 * Validates whether a faculty belongs to the selected university.
 * Supports exact matches and prefix matches (e.g. "Kiberxavfsizlik" matching "Kiberxavfsizlik fakulteti").
 */
export function isValidFacultyForUniversity(
  universityInput: string,
  facultyInput: string
): boolean {
  const uni = findUniversity(universityInput);
  if (!uni) return false;
  const normFaculty = normalizeSearch(facultyInput);
  if (!normFaculty) return false;

  return uni.faculties.some((f) => {
    const normF = normalizeSearch(f);
    if (normF === normFaculty) return true;
    // Strip "fakulteti" or "maktabi" suffixes
    const strippedF = normF.replace(/\s*(fakulteti|maktabi)\s*$/, "").trim();
    const strippedInput = normFaculty.replace(/\s*(fakulteti|maktabi)\s*$/, "").trim();
    if (strippedF && strippedInput && strippedF === strippedInput) return true;
    return normF.includes(normFaculty) || normFaculty.includes(normF);
  });
}
