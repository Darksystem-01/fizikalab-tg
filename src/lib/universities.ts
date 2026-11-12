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
}

export const UZBEKISTAN_UNIVERSITIES: University[] = [
  // 1. O‘zbekiston Milliy Universiteti
  {
    id: "ozmu",
    name: "O‘zbekiston Milliy Universiteti (O‘zMU)",
    shortName: "O‘zMU",
    aliases: ["ozmu", "o'zmu", "nuu", "nuuz", "milliy", "national university", "toshkent milliy"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "O‘zMU",
    emblemBg: "#1E3A8A",
    faculties: [
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
    ],
  },

  // 2. Toshkent Axborot Texnologiyalari Universiteti
  {
    id: "tatu",
    name: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    shortName: "TATU",
    aliases: ["tatu", "tuit", "al-xorazmiy", "axborot texnologiyalari", "aloqa instituti"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TATU",
    emblemBg: "#0284C7",
    faculties: [
      "Kompyuter injiniringi fakulteti",
      "Dasturiy injiniring fakulteti",
      "Kiberxavfsizlik fakulteti",
      "Telekommunikatsiya texnologiyalari fakulteti",
      "Televizion texnologiyalar fakulteti",
      "Radio va mobil aloqa fakulteti",
      "AKT sohasida iqtisodiyot va menejment fakulteti",
      "Raqamli ta'lim va sun'iy intellekt fakulteti",
      "TATU — BGUIR qo‘shma axborot texnologiyalari fakulteti",
    ],
  },

  // 3. Toshkent Davlat Texnika Universiteti
  {
    id: "tdtu",
    name: "Toshkent Davlat Texnika Universiteti (TDTU)",
    shortName: "TDTU",
    aliases: ["tdtu", "tstu", "politex", "politexnika", "islom karimov nomidagi tdtu", "texnika universiteti"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TDTU",
    emblemBg: "#B45309",
    faculties: [
      "Mashinasozlik fakulteti",
      "Energetika fakulteti",
      "Elektronika va avtomatika fakulteti",
      "Geologiya-qidiruv va kon-metallurgiya fakulteti",
      "Mexanika-mashinasozlik fakulteti",
      "Muhandislik texnologiyalari fakulteti",
      "Neft va gaz fakulteti",
      "Biotibbiyot muhandisligi fakulteti",
      "Issiqlik energetikasi fakulteti",
    ],
  },

  // 4. Samarqand Davlat Universiteti
  {
    id: "samdu",
    name: "Samarqand Davlat Universiteti (SamDU)",
    shortName: "SamDU",
    aliases: ["samdu", "samsu", "samarkand state", "sharof rashidov nomidagi samdu"],
    city: "Samarqand",
    category: "Davlat OTM",
    emblemText: "SamDU",
    emblemBg: "#0F766E",
    faculties: [
      "Fizika fakulteti",
      "Matematika fakulteti",
      "Muhandislik fizikasi instituti",
      "Raqamli texnologiyalar fakulteti",
      "Kimyo fakulteti",
      "Biologiya fakulteti",
      "Geografiya va ekologiya fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
      "Xalqaro ta'lim dasturlari fakulteti",
    ],
  },

  // 5. Yangi O‘zbekiston Universiteti
  {
    id: "new-uzb",
    name: "Yangi O‘zbekiston Universiteti (New Uzbekistan University)",
    shortName: "NewUz",
    aliases: ["new uzbekistan", "yangi ozbekiston", "newuz", "prezident universiteti", "yangi o'zbekiston"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "NUU",
    emblemBg: "#4338CA",
    faculties: [
      "Tabiiy fanlar maktabi (Fizika va Matematika)",
      "Muhandislik maktabi (Mechanical & Chemical Engineering)",
      "Kompyuter fanlari va Sun'iy intellekt maktabi",
      "Boshqaruv va Innovatsiyalar maktabi",
    ],
  },

  // 6. Toshkentdagi Turin Politexnika Universiteti
  {
    id: "ttpu",
    name: "Toshkent shahridagi Turin Politexnika Universiteti (TTPU)",
    shortName: "Turin",
    aliases: ["turin", "ttpu", "politecnico di torino", "turin politexnika"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "TTPU",
    emblemBg: "#991B1B",
    faculties: [
      "Mashinasozlik va aerokosmik injiniring fakulteti",
      "Axborot texnologiyalari va dasturlash fakulteti",
      "Avtomobilsozlik va mexatronika fakulteti",
      "Sanoat-fuqaro qurilishi va arxitektura fakulteti",
    ],
  },

  // 7. Toshkent shahridagi Inha Universiteti
  {
    id: "inha",
    name: "Toshkent shahridagi Inha Universiteti (IUT)",
    shortName: "Inha",
    aliases: ["inha", "iut", "inha university in tashkent"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "IUT",
    emblemBg: "#1D4ED8",
    faculties: [
      "Kompyuter va dasturiy injiniring maktabi (SOCIE)",
      "Logistika va biznes boshqaruvi maktabi (SBL)",
    ],
  },

  // 8. Toshkent shahridagi Vestminster Xalqaro Universiteti
  {
    id: "wiut",
    name: "Toshkent shahridagi Vestminster Xalqaro Universiteti (WIUT)",
    shortName: "WIUT",
    aliases: ["wiut", "westminster", "vestminster"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "WIUT",
    emblemBg: "#3730A3",
    faculties: [
      "Axborot tizimlari va raqamli texnologiyalar (BIS)",
      "Iqtisodiyot va moliya fakulteti",
      "Biznes boshqaruvi fakulteti",
      "Xalqaro tijorat huquqi fakulteti",
    ],
  },

  // 9. “TIQXMMI” Milliy Tadqiqot Universiteti
  {
    id: "tiiame",
    name: "“TIQXMMI” Milliy Tadqiqot Universiteti",
    shortName: "TIQXMMI",
    aliases: ["tiqxmmi", "tiiame", "irrigatsiya", "irrigatsiya instituti", "qishloq xojaligi muhandislari"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TIQXMMI",
    emblemBg: "#047857",
    faculties: [
      "Gidromelioratsiya fakulteti",
      "Gidrotexnika qurilishi fakulteti",
      "Qishloq xo‘jaligini mexanizatsiyalash fakulteti",
      "Energetika va elektrotexnologiyalar fakulteti",
      "Yer resurslarini boshqarish fakulteti",
      "Ekologiya va atrof-muhit muhofazasi fakulteti",
    ],
  },

  // 10. Farg‘ona Davlat Universiteti
  {
    id: "fardu",
    name: "Farg‘ona Davlat Universiteti (FarDU)",
    shortName: "FarDU",
    aliases: ["fardu", "farsu", "fargona davlat", "farg'ona davlat universiteti"],
    city: "Farg‘ona",
    category: "Davlat OTM",
    emblemText: "FarDU",
    emblemBg: "#0E7490",
    faculties: [
      "Fizika-matematika fakulteti",
      "Raqamli ta'lim texnologiyalari fakulteti",
      "Tabiiy fanlar fakulteti",
      "Kimyo-texnologiya fakulteti",
      "Tarix va ijtimoiy fanlar fakulteti",
      "Filologiya fakulteti",
    ],
  },

  // 11. Andijon Davlat Universiteti
  {
    id: "adu",
    name: "Andijon Davlat Universiteti (ADU)",
    shortName: "ADU",
    aliases: ["adu", "andsu", "andijon davlat universiteti", "zahiriddin muhammad bobur nomidagi adu"],
    city: "Andijon",
    category: "Davlat OTM",
    emblemText: "ADU",
    emblemBg: "#15803D",
    faculties: [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari va kompyuter injiniringi fakulteti",
      "Tabiiy fanlar fakulteti",
      "Tarix fakulteti",
      "Filologiya fakulteti",
    ],
  },

  // 12. Buxoro Davlat Universiteti
  {
    id: "buxdu",
    name: "Buxoro Davlat Universiteti (BuxDU)",
    shortName: "BuxDU",
    aliases: ["buxdu", "bukhsu", "buxoro davlat universiteti"],
    city: "Buxoro",
    category: "Davlat OTM",
    emblemText: "BuxDU",
    emblemBg: "#A16207",
    faculties: [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Agronomiya va biotexnologiya fakulteti",
      "Tabiiy fanlar fakulteti",
      "Tarix va yuridik fakulteti",
    ],
  },

  // 13. Urganch Davlat Universiteti
  {
    id: "urdu",
    name: "Urganch Davlat Universiteti (UrDU)",
    shortName: "UrDU",
    aliases: ["urdu", "urganch davlat", "xorazm universiteti"],
    city: "Urganch",
    category: "Davlat OTM",
    emblemText: "UrDU",
    emblemBg: "#0369A1",
    faculties: [
      "Fizika-matematika fakulteti",
      "Texnika fakulteti",
      "Tabiiy fanlar fakulteti",
      "Kimyoviy texnologiyalar fakulteti",
      "Tarix fakulteti",
    ],
  },

  // 14. Qarshi Davlat Universiteti
  {
    id: "qardu",
    name: "Qarshi Davlat Universiteti (QarDU)",
    shortName: "QarDU",
    aliases: ["qardu", "qarshi davlat", "qashqadaryo universiteti"],
    city: "Qarshi",
    category: "Davlat OTM",
    emblemText: "QarDU",
    emblemBg: "#4D7C0F",
    faculties: [
      "Fizika-matematika fakulteti",
      "Muhandislik-texnika fakulteti",
      "Kimyo-biologiya fakulteti",
      "Geografiya va agrotibbiyot fakulteti",
      "Tarix fakulteti",
    ],
  },

  // 15. Namangan Davlat Universiteti
  {
    id: "namdu",
    name: "Namangan Davlat Universiteti (NamDU)",
    shortName: "NamDU",
    aliases: ["namdu", "namangan davlat"],
    city: "Namangan",
    category: "Davlat OTM",
    emblemText: "NamDU",
    emblemBg: "#15803D",
    faculties: [
      "Fizika-matematika fakulteti",
      "Axborot texnologiyalari fakulteti",
      "Tabiiy fanlar fakulteti",
      "Biotexnologiya fakulteti",
    ],
  },

  // 16. Navoiy Davlat Konchilik va Texnologiyalar Universiteti
  {
    id: "ndktu",
    name: "Navoiy Davlat Konchilik va Texnologiyalar Universiteti (NDKTU)",
    shortName: "NDKTU",
    aliases: ["ndktu", "konchilik", "navoiy konchilik instituti", "navoiy texnologiyalar"],
    city: "Navoiy",
    category: "Davlat OTM",
    emblemText: "NDKTU",
    emblemBg: "#C2410C",
    faculties: [
      "Konchilik ishi fakulteti",
      "Metallurgiya va kimyo texnologiyalari fakulteti",
      "Energetika va mashinasozlik fakulteti",
      "Avtomatlashtirish va raqamli boshqaruv fakulteti",
    ],
  },

  // 17. Toshkent Davlat Pedagogika Universiteti
  {
    id: "tdpu",
    name: "Toshkent Davlat Pedagogika Universiteti (TDPU - Nizomiy)",
    shortName: "TDPU",
    aliases: ["tdpu", "nizomiy", "pedagogika universiteti"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TDPU",
    emblemBg: "#4F46E5",
    faculties: [
      "Fizika va astronomiya o‘qitish metodikasi fakulteti",
      "Matematika va informatika fakulteti",
      "Tabiiy fanlar fakulteti",
      "Professional ta'lim fakulteti",
    ],
  },

  // 18. Toshkent Kimyo-Texnologiya Instituti
  {
    id: "tkti",
    name: "Toshkent Kimyo-Texnologiya Instituti (TKTI)",
    shortName: "TKTI",
    aliases: ["tkti", "kimyo texnologiya", "tashkent chemical technology"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TKTI",
    emblemBg: "#7C2D12",
    faculties: [
      "Yoqilg‘i va organik birikmalar kimyoviy texnologiyasi",
      "Noorganik moddalar kimyoviy texnologiyasi",
      "Oziq-ovqat mahsulotlari texnologiyasi",
      "Menejment va kasb ta'limi fakulteti",
      "Vinochilik texnologiyasi va sanoat uzumchiligi fakulteti",
    ],
  },

  // 19. Qoraqalpoq Davlat Universiteti
  {
    id: "qdu",
    name: "Qoraqalpoq Davlat Universiteti (QDU - Berdaq)",
    shortName: "QDU",
    aliases: ["qdu", "karsu", "berdaq", "qoraqalpoq davlat universiteti", "nukus"],
    city: "Nukus",
    category: "Davlat OTM",
    emblemText: "QDU",
    emblemBg: "#0F766E",
    faculties: [
      "Fizika fakulteti",
      "Matematika fakulteti",
      "Muhandislik-texnika fakulteti",
      "Biologiya va ekologiya fakulteti",
      "Kimyo-texnologiya fakulteti",
    ],
  },

  // 20. Farg‘ona Politexnika Instituti
  {
    id: "farpi",
    name: "Farg‘ona Politexnika Instituti (FarPI)",
    shortName: "FarPI",
    aliases: ["farpi", "ferpi", "fargona politexnika"],
    city: "Farg‘ona",
    category: "Davlat OTM",
    emblemText: "FarPI",
    emblemBg: "#EA580C",
    faculties: [
      "Energetika fakulteti",
      "Mexanika-mashinasozlik fakulteti",
      "Kompyuter texnikasi va boshqaruv tizimlari fakulteti",
      "Qurilish fakulteti",
      "Kimyo-texnologiya fakulteti",
    ],
  },

  // 21. Andijon Mashinasozlik Instituti
  {
    id: "andmi",
    name: "Andijon Mashinasozlik Instituti (AndMI)",
    shortName: "AndMI",
    aliases: ["andmi", "mashinasozlik instituti andijon", "avtomobilsozlik"],
    city: "Andijon",
    category: "Davlat OTM",
    emblemText: "AndMI",
    emblemBg: "#B91C1C",
    faculties: [
      "Mashinasozlik texnologiyasi fakulteti",
      "Avtomobilsozlik fakulteti",
      "Elektrotexnika va avtomatlashtirish fakulteti",
      "Transport va logistika fakulteti",
    ],
  },

  // 22. Jizzax Politexnika Instituti
  {
    id: "jizpi",
    name: "Jizzax Politexnika Instituti (JizPI)",
    shortName: "JizPI",
    aliases: ["jizpi", "jizzax politexnika"],
    city: "Jizzax",
    category: "Davlat OTM",
    emblemText: "JizPI",
    emblemBg: "#0369A1",
    faculties: [
      "Elektromexanika va radioelektronika fakulteti",
      "Sanoat texnologiyalari fakulteti",
      "Avtotransport fakulteti",
      "Arxitektura va qurilish fakulteti",
    ],
  },

  // 23. Toshkent Davlat Transport Universiteti
  {
    id: "tdtru",
    name: "Toshkent Davlat Transport Universiteti (TDTU Transport)",
    shortName: "Transport",
    aliases: ["transport universiteti", "tashit", "temir yol", "avtomobil yollari instituti"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TDTU-T",
    emblemBg: "#1E40AF",
    faculties: [
      "Temir yo‘l transporti muhandisligi fakulteti",
      "Avtomobil transporti muhandisligi fakulteti",
      "Aviatsiya transporti muhandisligi fakulteti",
      "Elektr ta'minoti va avtomatika fakulteti",
      "Transport tizimlari boshqaruvi fakulteti",
    ],
  },

  // 24. Toshkent Arxitektura-Qurilish Universiteti
  {
    id: "taqu",
    name: "Toshkent Arxitektura-Qurilish Universiteti (TAQU)",
    shortName: "TAQU",
    aliases: ["taqu", "tasi", "arxitektura qurilish", "toshkent arxitektura"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TAQU",
    emblemBg: "#D97706",
    faculties: [
      "Bino va inshootlar qurilishi fakulteti",
      "Muhandislik tizimlari va texnologiyalari fakulteti",
      "Arxitektura fakulteti",
      "Qurilishni boshqarish fakulteti",
    ],
  },

  // 25. Toshkent Davlat Iqtisodiyot Universiteti
  {
    id: "tdiu",
    name: "Toshkent Davlat Iqtisodiyot Universiteti (TDIU)",
    shortName: "TDIU",
    aliases: ["tdiu", "tsue", "narxoz", "iqtisodiyot universiteti"],
    city: "Toshkent",
    category: "Davlat OTM",
    emblemText: "TDIU",
    emblemBg: "#059669",
    faculties: [
      "Raqamli iqtisodiyot va axborot texnologiyalari fakulteti",
      "Moliya va buxgalteriya hisobi fakulteti",
      "Iqtisodiyot fakulteti",
      "Xalqaro turizm va xizmat ko‘rsatish fakulteti",
    ],
  },

  // 26. Toshkent shahridagi Amiti Universiteti
  {
    id: "amity",
    name: "Toshkent shahridagi Amiti Universiteti (Amity)",
    shortName: "Amity",
    aliases: ["amity", "amity university in tashkent", "amiti"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "AMITY",
    emblemBg: "#CA8A04",
    faculties: [
      "Axborot texnologiyalari va dasturiy injiniring",
      "Sun'iy intellekt va kiberxavfsizlik fakulteti",
      "Kompyuter injiniringi va tarmoqlar",
      "Biznes boshqaruvi va moliya fakulteti",
    ],
  },

  // 27. Toshkent shahridagi Vebster Universiteti
  {
    id: "webster",
    name: "Toshkent shahridagi Vebster Universiteti (Webster)",
    shortName: "Webster",
    aliases: ["webster", "webster university tashkent", "vebster"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "WU",
    emblemBg: "#1E3A8A",
    faculties: [
      "Kompyuter fanlari (Computer Science)",
      "Boshqaruv axborot tizimlari (MIS)",
      "Biznes boshqaruvi (Business Administration)",
      "Media kommunikatsiyalari",
    ],
  },

  // 28. Toshkent shahridagi Singapur Menejmentni Rivojlantirish Instituti
  {
    id: "mdis",
    name: "Toshkent shahridagi Singapur Menejmentni Rivojlantirish Instituti (MDIST)",
    shortName: "MDIST",
    aliases: ["mdis", "mdist", "singapur instituti"],
    city: "Toshkent",
    category: "Xalqaro / Filial",
    emblemText: "MDIS",
    emblemBg: "#B91C1C",
    faculties: [
      "Amaliy texnologiyalar va axborot xavfsizligi fakulteti",
      "Bank ishi va moliya fakulteti",
      "Biznes va marketing fakulteti",
      "Sanoat boshqaruvi fakulteti",
    ],
  },

  // 29. Central Asian University (sobiq Akfa Universiteti)
  {
    id: "cau",
    name: "Central Asian University (CAU - sobiq Akfa Universiteti)",
    shortName: "CAU",
    aliases: ["cau", "akfa", "akfa university", "central asian university"],
    city: "Toshkent",
    category: "Nodavlat / Xususiy",
    emblemText: "CAU",
    emblemBg: "#2563EB",
    faculties: [
      "Muhandislik maktabi (School of Engineering)",
      "Kompyuter fanlari maktabi (School of Computer Science)",
      "Tibbiyot maktabi (School of Medicine)",
      "Biznes maktabi (Business School)",
    ],
  },

  // 30. Toshkent Kimyo Xalqaro Universiteti
  {
    id: "kiut",
    name: "Toshkent Kimyo Xalqaro Universiteti (KIUT - sobiq Yeoju)",
    shortName: "KIUT",
    aliases: ["kiut", "yeoju", "ytit", "kimyo xalqaro universiteti"],
    city: "Toshkent",
    category: "Nodavlat / Xususiy",
    emblemText: "KIUT",
    emblemBg: "#4C1D95",
    faculties: [
      "Axborot texnologiyalari va dasturiy injiniring fakulteti",
      "Mashinasozlik va lift muhandisligi fakulteti",
      "Arxitektura va shaharsozlik fakulteti",
      "Muqobil energiya manbalari va elektrotexnika",
      "Iqtisodiyot va xalqaro moliya fakulteti",
    ],
  },

  // 31. Toshkent Amaliy Fanlar Universiteti
  {
    id: "utas",
    name: "Toshkent Amaliy Fanlar Universiteti (UTAS)",
    shortName: "UTAS",
    aliases: ["utas", "amaliy fanlar", "toshkent amaliy fanlar"],
    city: "Toshkent",
    category: "Nodavlat / Xususiy",
    emblemText: "UTAS",
    emblemBg: "#0284C7",
    faculties: [
      "Axborot texnologiyalari va intellektual tizimlar fakulteti",
      "Fizika va muhandislik texnologiyalari fakulteti",
      "Pedagogika va tabiiy fanlar fakulteti",
      "Iqtisodiyot va moliya fakulteti",
    ],
  },

  // 32. TEAM Universiteti
  {
    id: "team",
    name: "TEAM Universiteti",
    shortName: "TEAM",
    aliases: ["team", "team university", "tim universiteti"],
    city: "Toshkent",
    category: "Nodavlat / Xususiy",
    emblemText: "TEAM",
    emblemBg: "#0F172A",
    faculties: [
      "Raqamli innovatsiyalar va texnologiyalar maktabi",
      "Tadbirkorlik va biznes boshqaruvi maktabi",
      "Marketing va raqamli media fakulteti",
    ],
  },

  // 33. Sharda Universiteti (Andijon)
  {
    id: "sharda",
    name: "O‘zbekistondagi Sharda Universiteti (Andijon)",
    shortName: "Sharda",
    aliases: ["sharda", "sharda university uzbekistan", "sharda andijon"],
    city: "Andijon",
    category: "Xalqaro / Filial",
    emblemText: "SHARDA",
    emblemBg: "#B45309",
    faculties: [
      "Kompyuter injiniringi va axborot texnologiyalari fakulteti",
      "Biotexnologiya va amaliy fanlar fakulteti",
      "Muhandislik va texnologiya fakulteti",
      "Biznes va iqtisodiyot fakulteti",
    ],
  },

  // 34. TATU Farg‘ona filiali
  {
    id: "tatu-far",
    name: "TATU Farg‘ona filiali",
    shortName: "TATU FF",
    aliases: ["tatu fargona", "tuit fergana", "tatu ff"],
    city: "Farg‘ona",
    category: "Davlat OTM",
    emblemText: "TATU-FF",
    emblemBg: "#0369A1",
    faculties: [
      "Kompyuter injiniringi fakulteti",
      "Telekommunikatsiya texnologiyalari fakulteti",
      "Dasturiy injiniring fakulteti",
    ],
  },

  // 35. TATU Samarqand filiali
  {
    id: "tatu-sam",
    name: "TATU Samarqand filiali",
    shortName: "TATU SF",
    aliases: ["tatu samarqand", "tuit samarkand", "tatu sf"],
    city: "Samarqand",
    category: "Davlat OTM",
    emblemText: "TATU-SF",
    emblemBg: "#0E7490",
    faculties: [
      "Kompyuter injiniringi fakulteti",
      "Telekommunikatsiya va axborot xavfsizligi fakulteti",
      "Dasturiy injiniring fakulteti",
    ],
  },

  // 36. TATU Urganch filiali
  {
    id: "tatu-urg",
    name: "TATU Urganch filiali",
    shortName: "TATU UF",
    aliases: ["tatu urganch", "tuit urgench", "tatu uf"],
    city: "Urganch",
    category: "Davlat OTM",
    emblemText: "TATU-UF",
    emblemBg: "#0284C7",
    faculties: [
      "Kompyuter injiniringi fakulteti",
      "Telekommunikatsiya texnologiyalari fakulteti",
    ],
  },

  // 37. TATU Qarshi filiali
  {
    id: "tatu-qar",
    name: "TATU Qarshi filiali",
    shortName: "TATU QF",
    aliases: ["tatu qarshi", "tuit qarshi", "tatu qf"],
    city: "Qarshi",
    category: "Davlat OTM",
    emblemText: "TATU-QF",
    emblemBg: "#0F766E",
    faculties: [
      "Kompyuter injiniringi va dasturlash fakulteti",
      "Axborot-kommunikatsiya texnologiyalari fakulteti",
    ],
  },

  // 38. Buxoro Muhandislik-Texnologiya Instituti
  {
    id: "bmti",
    name: "Buxoro Muhandislik-Texnologiya Instituti (BMNTI)",
    shortName: "BMNTI",
    aliases: ["bmti", "bmnti", "buxoro muhandislik texnologiya"],
    city: "Buxoro",
    category: "Davlat OTM",
    emblemText: "BMNTI",
    emblemBg: "#B45309",
    faculties: [
      "Energetika va avtomatika fakulteti",
      "Neft-gaz kimyo sanoati texnologiyalari fakulteti",
      "Mexanika va texnologik mashinalar fakulteti",
      "Muhandislik texnikasi fakulteti",
    ],
  },

  // 39. Namangan Muhandislik-Qurilish Instituti
  {
    id: "nammqi",
    name: "Namangan Muhandislik-Qurilish Instituti (NamMQI)",
    shortName: "NamMQI",
    aliases: ["nammqi", "namangan muhandislik qurilish"],
    city: "Namangan",
    category: "Davlat OTM",
    emblemText: "NamMQI",
    emblemBg: "#D97706",
    faculties: [
      "Sanoatni axborotlashtirish va energetika fakulteti",
      "Muhandislik kommunikatsiyalari fakulteti",
      "Mashinasozlik fakulteti",
      "Qurilish fakulteti",
    ],
  },

  // 40. Qo‘qon Universiteti
  {
    id: "qou",
    name: "Qo‘qon Universiteti",
    shortName: "Qo‘qonU",
    aliases: ["qoqon universiteti", "kokand university", "qou"],
    city: "Qo‘qon",
    category: "Nodavlat / Xususiy",
    emblemText: "KOKAND",
    emblemBg: "#312E81",
    faculties: [
      "Raqamli texnologiyalar va matematika fakulteti",
      "Iqtisodiyot va biznes boshqaruvi fakulteti",
      "Pedagogika va xorijiy tillar fakulteti",
    ],
  },

  // 41. Osiyo Xalqaro Universiteti
  {
    id: "oxu",
    name: "Osiyo Xalqaro Universiteti (Buxoro)",
    shortName: "OXU",
    aliases: ["oxu", "osiyo xalqaro", "asian international university", "buxoro xususiy"],
    city: "Buxoro",
    category: "Nodavlat / Xususiy",
    emblemText: "AIU",
    emblemBg: "#1E3A8A",
    faculties: [
      "Muhandislik va axborot texnologiyalari fakulteti",
      "Tibbiyot fakulteti",
      "Iqtisodiyot va pedagogika fakulteti",
    ],
  },

  // 42. Stars International University
  {
    id: "stars",
    name: "Stars International University",
    shortName: "Stars",
    aliases: ["stars", "stars university", "stars international"],
    city: "Toshkent",
    category: "Nodavlat / Xususiy",
    emblemText: "STARS",
    emblemBg: "#831843",
    faculties: [
      "Axborot texnologiyalari va dasturlash fakulteti",
      "Moliya va xalqaro buxgalteriya (ACCA)",
      "Global menejment va marketing",
    ],
  },
];

/**
 * Normalizes query string for fuzzy matching (lowercases, removes diacritics/apostrophes)
 */
function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘'`ʻʼ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches universities by name, shortName, city, or aliases with smart ranking
 */
export function searchUniversities(query: string, limit = 8): University[] {
  const norm = normalizeSearch(query);
  if (!norm) {
    return UZBEKISTAN_UNIVERSITIES.slice(0, limit);
  }

  const results: { uni: University; score: number }[] = [];

  for (const uni of UZBEKISTAN_UNIVERSITIES) {
    const normName = normalizeSearch(uni.name);
    const normShort = normalizeSearch(uni.shortName);
    const normCity = normalizeSearch(uni.city);
    const normAliases = uni.aliases.map(normalizeSearch);

    let score = 0;

    // Exact match on acronym
    if (normShort === norm) {
      score += 100;
    } else if (normShort.startsWith(norm)) {
      score += 70;
    } else if (normShort.includes(norm)) {
      score += 50;
    }

    // Exact/Prefix match on full name
    if (normName.startsWith(norm)) {
      score += 80;
    } else if (normName.includes(norm)) {
      score += 40;
    }

    // Match on aliases
    for (const a of normAliases) {
      if (a === norm) {
        score += 90;
        break;
      }
      if (a.startsWith(norm)) {
        score += 60;
        break;
      }
      if (a.includes(norm)) {
        score += 30;
        break;
      }
    }

    // Match on city
    if (normCity.includes(norm)) {
      score += 25;
    }

    if (score > 0) {
      results.push({ uni, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.uni);
}

/**
 * Finds a university by exact name, shortName, or id
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
 * Validates whether a faculty belongs to the selected university
 */
export function isValidFacultyForUniversity(
  universityInput: string,
  facultyInput: string
): boolean {
  const uni = findUniversity(universityInput);
  if (!uni) return false;
  const normFaculty = normalizeSearch(facultyInput);
  return uni.faculties.some((f) => normalizeSearch(f) === normFaculty);
}
