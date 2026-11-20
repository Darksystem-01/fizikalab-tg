"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";

interface SocraticAiAssistantProps {
  labKey: string;
  labTitle: string;
}

interface SocraticKnowledge {
  title: string;
  level1Question: string; // Guides thinking
  level2Formula: string; // Reminds equation
  level3Remediation: string; // Explains common pitfall
}

const SOCRATIC_KNOWLEDGE: Record<string, SocraticKnowledge> = {
  dynamics: {
    title: "Qiya Tekislik va Bog‘langan Jismlar Dinamikasi",
    level1Question:
      "Jismning qiyalikdan pastga yoki yuqoriga harakatlanishini qaysi kuchlar hal qiladi? m1*g*sin(theta) va m2*g qiymatlarini solishtirib ko‘rdingizmi?",
    level2Formula:
      "Nyutonning II qonuni: m2*g - m1*g*sin(theta) - F_k = (m1 + m2)*a. Ishqalanish kuchi F_k = mu * m1 * g * cos(theta).",
    level3Remediation:
      "Keng tarqalgan xatolik: Agar jism siljimayotgan bo‘lsa (a = 0), demak harakatlantiruvchi kuch tinchlikdagi maksimal ishqalanishdan kichik. Massani yoki qiyalik burchagini oshirib ko‘ring!",
  },
  kinematics: {
    title: "Ballistika va Traektoriya Dinamikasi",
    level1Question:
      "Uchish masofasi maksimal bo‘lishi uchun burchak necha gradus bo‘lishi kerak deb o‘ylaysiz? Havo qarshiligi hisobga olinsa-chi?",
    level2Formula:
      "Vakuumdagi uchish uzoqligi: L = (v_0^2 * sin(2*alpha)) / g. Havoda esa havo zichligi va tezlik kvadratiga proporsional qarshilik kuchi ta'sir qiladi.",
    level3Remediation:
      "Esda tuting: Havo qarshiligi kiritilganda maksimal masofaga erishish burchagi 45 gradusdan kichikroq (~38-42 gradus) bo‘ladi, chunki vertikal tushishda qarshilik energiyani yutadi.",
  },
  metrology: {
    title: "Asboblar Xatoligi va Vernier O‘lchash",
    level1Question:
      "Nol xatolik (Zero Error) asbob ko‘rsatkichiga qanday ta'sir qiladi? Uni o‘lchangan natijaga qo‘shish kerakmi yoki ayirishmi?",
    level2Formula:
      "Haqiqiy qiymat = O‘lchangan qiymat - (Nol xatolik). Nonius aniqligi: C = Asosiy_bo‘linma / Nonius_bo‘linmalar_soni.",
    level3Remediation:
      "Ehtiyot bo‘ling: Agar asbob jag‘lari yopilganda nonius noli asosiy shkala nolidan o‘ngda tursa, xatolik musbat (+), shuning uchun yakuniy natijadan uni ayirish shart!",
  },
  electromagnetism: {
    title: "Vitston Ko‘prigi va Qarshilikni O‘lchash",
    level1Question:
      "Galvanometr orqali tok o‘tmasligi (muvozanat holati) uchun diagonal yelkalar qarshiliklari qanday nisbatda bo‘lishi kerak?",
    level2Formula:
      "Muvozanat sharti: R_x / R_1 = R_2 / R_3 => R_x = (R_1 * R_2) / R_3.",
    level3Remediation:
      "Amaliy maslahat: Agar galvanometr mili bir tomonga keskin og‘sa, reostat yordamida R1 va R2 nisbatlarini asta-sekin o‘zgartirib nolga keltiring.",
  },
  optics: {
    title: "Nyuton Halqalari Interferometri",
    level1Question:
      "Markaziy halqa qorong‘i bo‘lishining sababi nima? Havo va shisha chegarasidagi yarim to‘lqin yo‘qolishi (pi faza siljishi) haqida o‘ylab ko‘rdingizmi?",
    level2Formula:
      "Qorong‘i halqalar radiusi: r_m = sqrt(m * lambda * R), bu yerda m - tartib raqami, R - linza egrilik radiusi.",
    level3Remediation:
      "Linza egrilik radiusini aniqlashda bitta halqadan emas, m va k tartibli halqalar diametrlari kvadratlari farqidan foydalaning: R = (d_m^2 - d_k^2) / (4*(m - k)*lambda). Bu markaziy siljish xatosini yo‘qotadi.",
  },
  thermodynamics: {
    title: "Karno Sikli va Termodinamik Jarayonlar",
    level1Question:
      "Ideal issiqlik mashinasining FIKini 100% ga yetkazish mumkinmi? Nega sovitgich harorati mutlaq nolga (0 K) teng bo‘la olmaydi?",
    level2Formula:
      "Karno FIKi: eta = (T_H - T_C) / T_H = 1 - T_C / T_H. Jarayon ishi p-V diagrammasidagi sikl egri chizig‘i yuzasiga teng.",
    level3Remediation:
      "Izotermik jarayonda ichki energiya o‘zgarmaydi (delta U = 0), shuning uchun gazga berilgan barcha issiqlik foydali ishga sarflanadi (Q = A).",
  },
  atomic: {
    title: "Fotoeffekt va Kvantlar Nazariyasi",
    level1Question:
      "To‘xtatuvchi potensial yorug‘lik intensivligiga bog‘liqmi yoki chastotasigami? Nega yorug‘lik kuchli bo‘lsa ham fotoelektronlar uchib chiqmasligi mumkin?",
    level2Formula:
      "Eynshteyn tenglamasi: h * nu = A_chiqish + e * V_0, bu yerda V_0 - to‘xtatuvchi potensial.",
    level3Remediation:
      "Qizil chegara sharti: Agar h*nu < A bo‘lsa, yorug‘lik intensivligi qanchalik yuqori bo‘lmasin, fotoeffekt kuzatilmaydi. Katod metallini o‘zgartirib ko‘ring!",
  },
};

export function SocraticAiAssistant({ labKey, labTitle }: SocraticAiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);

  const knowledge = SOCRATIC_KNOWLEDGE[labKey] || SOCRATIC_KNOWLEDGE["dynamics"];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-blue-600 bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-800 cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>AI Virtual Laborant</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        ) : null}
      </div>

      {/* Socratic Dialog Drawer */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Al-Xorazmiy AI (Sokratik Tutor)</h4>
                <p className="text-[10px] text-slate-500">{labTitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="my-3 space-y-3">
            <div className="rounded-lg bg-blue-50/70 p-3 text-[11px] leading-relaxed text-blue-900">
              💡 <strong>Pedagogik qoida:</strong> Men sizga tayyor javobni aytmayman, balki fikrlab o‘zingiz to‘g‘ri fizik xulosaga kelishingizga yordam beraman!
            </div>

            {/* Hint Level Selector */}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setHintLevel(1)}
                className={`flex-1 rounded py-1 font-medium transition-colors ${
                  hintLevel === 1 ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Yo‘naltiruvchi
              </button>
              <button
                type="button"
                onClick={() => setHintLevel(2)}
                className={`flex-1 rounded py-1 font-medium transition-colors ${
                  hintLevel === 2 ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Qonuniyat
              </button>
              <button
                type="button"
                onClick={() => setHintLevel(3)}
                className={`flex-1 rounded py-1 font-medium transition-colors ${
                  hintLevel === 3 ? "bg-white text-blue-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Tahlil
              </button>
            </div>

            {/* Dynamic Content Display */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              {hintLevel === 1 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1.5">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>O‘ylab ko‘rish uchun savol:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-normal">{knowledge.level1Question}</p>
                </div>
              )}

              {hintLevel === 2 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Asosiy formula va qonuniyat:</span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 mb-1">
                    {knowledge.level2Formula}
                  </p>
                </div>
              )}

              {hintLevel === 3 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Keng tarqalgan xatolik va maslahat:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-normal">{knowledge.level3Remediation}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 text-center text-[10px] text-slate-400">
            FizikaLab Akademik AI Yordamchisi · Sokratik Ta’lim Modeli
          </div>
        </div>
      )}
    </>
  );
}
