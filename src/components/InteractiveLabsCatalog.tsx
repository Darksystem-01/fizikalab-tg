"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FlaskConical,
  Compass,
  Waves,
  Zap,
  Flame,
  Eye,
  Thermometer,
  Maximize2,
  ExternalLink,
  Search,
  CheckCircle2,
  Award,
  Layers,
  X,
  Play,
  RotateCcw
} from "lucide-react";

export interface InteractiveLabItem {
  id: string;
  file: string;
  titleUz: string;
  category: "Gidrostatika" | "Kinematika" | "Tebranishlar & To‘lqinlar" | "Termodinamika" | "Elektrodinamika" | "Optika";
  descUz: string;
  equipment: string[];
  difficulty: "Boshlang‘ich" | "O‘rta" | "Murakkab";
  topics: string;
}

const INTERACTIVE_LABS: InteractiveLabItem[] = [
  {
    id: "arhimed",
    file: "arhimed.html",
    titleUz: "Arximed qonuni va ko‘tarish kuchi",
    category: "Gidrostatika",
    descUz: "Dinamometr va menzurka yordamida jismga ta’sir etuvchi Arximed kuchi va siqib chiqarilgan suyuqlik og‘irligini o‘lchash hamda taqqoslash.",
    equipment: ["Dinamometr", "Menzurka", "Metall jismlar (№1, №2)", "Suv, sho‘r suv, moy"],
    difficulty: "Boshlang‘ich",
    topics: "F_A = \\rho_s g V, \\quad F_A = P_0 - P"
  },
  {
    id: "tygyzdyq",
    file: "tygyzdyq.html",
    titleUz: "Qattiq jism va suyuqliklar zichligini aniqlash",
    category: "Gidrostatika",
    descUz: "Elektron tarozi orqali jism massasini, menzurka orqali hajmini o‘lchash va moddaning solishtirma zichligini topish.",
    equipment: ["Laboratoriya tarozisi", "O‘lchov menzurkasi", "Har xil metall namunalar"],
    difficulty: "Boshlang‘ich",
    topics: "\\rho = \\frac{m}{V}, \\quad \\Delta\\rho = \\sqrt{(\\Delta m/m)^2 + (\\Delta V/V)^2}"
  },
  {
    id: "juzu",
    file: "juzu.html",
    titleUz: "Jismlarning suyuqlikda suzish shartlari",
    category: "Gidrostatika",
    descUz: "Og‘irlik kuchi va ko‘tarish kuchi nisbati: jismning suv, moy va glitserinda suzishi, cho‘kishi yoki sirtga qalqib chiqishini tadqiq qilish.",
    equipment: ["Suyuqlik idishlari", "Har xil zichlikdagi jismlar", "Dinamometr"],
    difficulty: "O‘rta",
    topics: "F_A > mg \\text{ (qalqish)}, \\quad F_A = mg \\text{ (suzish)}, \\quad F_A < mg \\text{ (cho‘kish)}"
  },
  {
    id: "laqtyru",
    file: "laqtyru.html",
    titleUz: "Gorizontal va burchak ostida otilgan jism harakati",
    category: "Kinematika",
    descUz: "Boshlang‘ich tezlik va otilish burchagining uchish masofasi, trayektoriya shakli va maksimal ko‘tarilish balandligiga ta’sirini tahlil qilish.",
    equipment: ["Ballistik to‘p apparati", "Chizg‘ich", "Burchak o‘lchagich (transportir)", "Elektron sekundomer"],
    difficulty: "O‘rta",
    topics: "L = \\frac{v_0^2 \\sin(2\\alpha)}{g}, \\quad H = \\frac{v_0^2 \\sin^2\\alpha}{2g}"
  },
  {
    id: "mayatnik",
    file: "mayatnik.html",
    titleUz: "Matematik mayatnik yordamida erkin tushish tezlanishini aniqlash",
    category: "Tebranishlar & To‘lqinlar",
    descUz: "Turli uzunlikdagi iplarda tebranishlar davrini o‘lchab, Yerning gravitatsiya tezlanishi g qiymatini yuqori aniqlikda hisoblash.",
    equipment: ["Shtativ", "Mayatnik sharchasi", "Chizg‘ich (1 m)", "Sekundomer"],
    difficulty: "O‘rta",
    topics: "T = 2\\pi \\sqrt{\\frac{l}{g}} \\implies g = \\frac{4\\pi^2 l}{T^2}"
  },
  {
    id: "tolqyn",
    file: "tolqyn.html",
    titleUz: "Suyuqlik sirtidagi mexanik to‘lqinlar va tebranishlar",
    category: "Tebranishlar & To‘lqinlar",
    descUz: "To‘lqin vannasida sirtqi to‘lqinlarning tarqalishi, to‘lqin uzunligi va chastotasining to‘lqin tezligi bilan bog‘liqligi.",
    equipment: ["To‘lqin vannasi", "Tebranish generatori", "Stroboskop", "O‘lchov shkalasi"],
    difficulty: "Murakkab",
    topics: "v = \\lambda \\cdot \\nu = \\frac{\\lambda}{T}"
  },
  {
    id: "jylu",
    file: "jylu.html",
    titleUz: "Issiqlik miqdori va solishtirma issiqlik sig‘imini aniqlash",
    category: "Termodinamika",
    descUz: "Kalorimetriya usuli: qizdirilgan jism suvga solinganda issiqlik almashinuvini o‘rganish va metallning solishtirma issiqlik sig‘imini topish.",
    equipment: ["Kalorimetr", "Termometr", "Qizdirilgan metall silindr", "Tarozi"],
    difficulty: "O‘rta",
    topics: "Q_1 = Q_2 \\implies c_m m_m (t_m - \\theta) = c_w m_w (\\theta - t_w) + C_k (\\theta - t_w)"
  },
  {
    id: "muz",
    file: "muz.html",
    titleUz: "Muzning solishtirma erish issiqligini aniqlash",
    category: "Termodinamika",
    descUz: "0 °C haroratdagi muzning erishida yutiladigan issiqlik miqdorini kalorimetr orqali o‘lchab, solishtirma erish issiqligi lambda ni hisoblash.",
    equipment: ["Izolyatsiyalangan kalorimetr", "Muz bo‘laklari", "Termometr", "Suv"],
    difficulty: "Murakkab",
    topics: "Q_{\\text{erish}} = \\lambda m_{\\text{muz}}, \\quad \\lambda = \\frac{c_w m_w (t_1 - t_2) - c_w m_{\\text{muz}} t_2}{m_{\\text{muz}}}"
  },
  {
    id: "om",
    file: "om.html",
    titleUz: "Zanjir qismi uchun Om qonunini tekshirish",
    category: "Elektrodinamika",
    descUz: "Reostat orqali tok kuchi va kuchlanishni rostlab, qarshilikning o‘zgarmasligi va volt-amper xarakteristikasining to‘g‘ri chiziqliligini isbotlash.",
    equipment: ["O‘zgarmas tok manbayi", "Voltmetr", "Ampermetr", "Reostat", "Rezistor"],
    difficulty: "Boshlang‘ich",
    topics: "I = \\frac{U}{R} \\implies R = \\frac{U}{I} = \\text{const}"
  },
  {
    id: "tizbek",
    file: "tizbek.html",
    titleUz: "Elektr zanjiri elementlari va o‘lchash asboblari",
    category: "Elektrodinamika",
    descUz: "Elektr zanjirini yig‘ish, tok kuchi va kuchlanishni xavfsiz o‘lchash, lampochkaning elektr quvvatini hisoblash.",
    equipment: ["Tok manbayi (4.5V)", "Lampochka", "Kalit", "Ampermetr", "Voltmetr"],
    difficulty: "Boshlang‘ich",
    topics: "P = U \\cdot I, \\quad A = P \\cdot t"
  },
  {
    id: "tizbektey",
    file: "tizbektey.html",
    titleUz: "O‘tkazgichlarni ketma-ket ulash qonuniyatlari",
    category: "Elektrodinamika",
    descUz: "Ketma-ket ulangan ikki rezistorda tok kuchining tengligi, kuchlanishlarning qo‘shilishi va to‘liq qarshilik formulalarini tekshirish.",
    equipment: ["Tok manbayi", "2 ta rezistor", "Voltmetr", "Ampermetr", "Ulagich simlar"],
    difficulty: "O‘rta",
    topics: "I = I_1 = I_2, \\quad U = U_1 + U_2, \\quad R = R_1 + R_2"
  },
  {
    id: "parallel",
    file: "parallel.html",
    titleUz: "O‘tkazgichlarni parallel ulash qonuniyatlari",
    category: "Elektrodinamika",
    descUz: "Parallel tarmoqlarda kuchlanishlar tengligi, tarmoqlardagi toklarning yig‘indisi va ekvivalent o‘tkazuvchanlik qonuniyatlari.",
    equipment: ["Tok manbayi", "2 ta rezistor", "Voltmetr", "Ampermetr", "Tugunli simlar"],
    difficulty: "O‘rta",
    topics: "U = U_1 = U_2, \\quad I = I_1 + I_2, \\quad \\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}"
  },
  {
    id: "emagnit",
    file: "emagnit.html",
    titleUz: "Elektromagnit xususiyatlari va elektromagnit induksiya",
    category: "Elektrodinamika",
    descUz: "O‘zakli g‘altakda tok kuchi va o‘ramlar sonining magnit maydon kuchiga va temir bo‘laklarini tortish qobiliyatiga ta’siri.",
    equipment: ["Elektromagnit g‘altagi", "Po‘lat o‘zak", "Reostat", "Ampermetr", "Tok manbayi"],
    difficulty: "O‘rta",
    topics: "B = \\mu \\mu_0 \\frac{N I}{L}, \\quad F_{\\text{tortish}} \\propto (N I)^2"
  },
  {
    id: "magnit",
    file: "magnit.html",
    titleUz: "Doimiy magnit maydon chiziqlarini tadqiq qilish",
    category: "Elektrodinamika",
    descUz: "Chiziqli va taqasimon doimiy magnitlar atrofidagi maydon kuch chiziqlarini kompas millari va temir qipiqlari orqali xaritalash.",
    equipment: ["Chiziqli doimiy magnit", "Taqasimon magnit", "Magnit millari", "Qipiqlar paneli"],
    difficulty: "Boshlang‘ich",
    topics: "\\oint \\vec{B} \\cdot d\\vec{A} = 0, \\quad \\vec{B} \\text{ yo‘nalishi: } N \\to S"
  },
  {
    id: "linza",
    file: "linza.html",
    titleUz: "Yupqa linzaning fokus masofasi va optik kuchini aniqlash",
    category: "Optika",
    descUz: "Optik skameykada yig‘uvchi linza orqali ekranda ravshan haqiqiy tasvir hosil qilish, fokus masofasi F va optik kuch D ni topish.",
    equipment: ["Optik skameyka", "Yorug‘lik manbayi (buyum)", "Yig‘uvchi linza", "Oq ekran", "Shkala"],
    difficulty: "O‘rta",
    topics: "\\frac{1}{F} = \\frac{1}{d} + \\frac{1}{f}, \\quad D = \\frac{1}{F} \\text{ [dptr]}, \\quad \\Gamma = \\frac{f}{d}"
  },
  {
    id: "synu",
    file: "synu.html",
    titleUz: "Yorug‘likning sinish ko‘rsatkichini aniqlash (Snellius)",
    category: "Optika",
    descUz: "Parallel yoqli shisha plastinka orqali nur yo‘lini o‘rganish, tushish va sinish burchaklarini o‘lchab shishaning n ko‘rsatkichini topish.",
    equipment: ["Yorug‘lik nurlatgichi", "Shisha plastinka", "Aylana shkala (limba)", "Nishon ignalari"],
    difficulty: "O‘rta",
    topics: "n = \\frac{\\sin\\alpha}{\\sin\\beta}, \\quad v = \\frac{c}{n}"
  }
];

export function InteractiveLabsCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Barchasi");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalLab, setActiveModalLab] = useState<InteractiveLabItem | null>(null);
  const [lastSubmission, setLastSubmission] = useState<{
    title: string;
    score: number;
    grade: number;
    time: string;
  } | null>(null);

  // Listen to postMessage from embedded labs
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "FIZIKA_LAB_REPORT_SUBMIT") {
        setLastSubmission({
          title: e.data.title,
          score: e.data.score,
          grade: e.data.grade,
          time: new Date().toLocaleTimeString(),
        });
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const categories = ["Barchasi", "Gidrostatika", "Kinematika", "Tebranishlar & To‘lqinlar", "Termodinamika", "Elektrodinamika", "Optika"];

  const filteredLabs = useMemo(() => {
    return INTERACTIVE_LABS.filter((lab) => {
      const matchCat = selectedCategory === "Barchasi" || lab.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        lab.titleUz.toLowerCase().includes(q) ||
        lab.descUz.toLowerCase().includes(q) ||
        lab.category.toLowerCase().includes(q) ||
        lab.equipment.some((eq) => eq.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Gidrostatika":
        return <Waves className="h-4 w-4 text-sky-600" />;
      case "Kinematika":
        return <Compass className="h-4 w-4 text-indigo-600" />;
      case "Tebranishlar & To‘lqinlar":
        return <Waves className="h-4 w-4 text-teal-600" />;
      case "Termodinamika":
        return <Flame className="h-4 w-4 text-amber-600" />;
      case "Elektrodinamika":
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case "Optika":
        return <Eye className="h-4 w-4 text-purple-600" />;
      default:
        return <FlaskConical className="h-4 w-4 text-[#1E3A8A]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Submission Alert Banner */}
      {lastSubmission && (
        <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50/90 p-4 shadow-xs rounded-none">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                Laboratoriya ishi muvaffaqiyatli topshirildi: {lastSubmission.title}
              </h4>
              <p className="text-[11px] text-emerald-800">
                To‘plangan ball: <strong>{lastSubmission.score}/10</strong> · Baho:{" "}
                <span className="font-bold text-emerald-900">«{lastSubmission.grade}»</span> · Vaqti: {lastSubmission.time}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastSubmission(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Hero Overview */}
      <div className="border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center bg-[#1E3A8A] text-white">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                16 ta Interaktiv Virtual Laboratoriya Stendlari
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600 max-w-3xl">
              Haqiqiy asboblar (menzurka, dinamometr, tarozi, optik skameyka, elektr elementlari) bilan to‘liq
              HTML5 Canvas asosida ishlovchi o‘quv-amaliy tajriba xonasi. Har bir talaba o‘z varianti bo‘yicha
              o‘lchovlar o‘tkazadi, xatoliklarni hisoblaydi va avtomatlashtirilgan tizimga hisobot topshiradi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase text-slate-500 font-sans">Jami stendlar</div>
              <div className="font-bold text-[#1E3A8A]">16 ta</div>
            </div>
            <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase text-slate-500 font-sans">Bo‘limlar</div>
              <div className="font-bold text-emerald-700">6 ta</div>
            </div>
            <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase text-slate-500 font-sans">Format</div>
              <div className="font-bold text-purple-700">Canvas 2D / Vector</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs transition cursor-pointer border ${
                selectedCategory === cat
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white font-semibold"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Stend nomi yoki asbob bo‘yicha qidiruv..."
            className="w-full border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A8A] focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Laboratories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLabs.map((lab, index) => (
          <div
            key={lab.id}
            className="flex flex-col justify-between border border-slate-200 bg-white p-4 shadow-xs hover:border-[#1E3A8A]/60 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                  {getCategoryIcon(lab.category)}
                  <span>{lab.category}</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 border ${
                    lab.difficulty === "Boshlang‘ich"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : lab.difficulty === "O‘rta"
                      ? "border-blue-300 bg-blue-50 text-blue-800"
                      : "border-purple-300 bg-purple-50 text-purple-800"
                  }`}
                >
                  {lab.difficulty}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                #{index + 1}. {lab.titleUz}
              </h3>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                {lab.descUz}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Asosiy asbob-uskunalar:
                </div>
                <div className="flex flex-wrap gap-1">
                  {lab.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveModalLab(lab)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1E3A8A] text-white py-1.5 px-3 text-xs font-semibold hover:bg-[#172554] transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" /> Stendni ochish
              </button>

              <a
                href={`/interactive-labs/${lab.file}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Alohida to‘liq oynada ochish"
                className="inline-flex items-center justify-center border border-slate-300 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modal Viewer */}
      {activeModalLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs">
          <div className="relative flex flex-col h-[92vh] w-full max-w-6xl border border-slate-700 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#1E3A8A] px-4 py-2.5 text-white">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                <span className="text-xs font-bold">{activeModalLab.titleUz}</span>
                <span className="text-xs text-blue-200">•</span>
                <span className="text-xs text-blue-200">{activeModalLab.category}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/interactive-labs/${activeModalLab.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-100 hover:text-white px-2 py-1 rounded-sm hover:bg-blue-800 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> To‘liq ekranda
                </a>
                <button
                  type="button"
                  onClick={() => setActiveModalLab(null)}
                  className="p-1 text-blue-100 hover:text-white hover:bg-blue-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="flex-1 w-full bg-slate-100 overflow-hidden">
              <iframe
                src={`/interactive-labs/${activeModalLab.file}`}
                title={activeModalLab.titleUz}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
