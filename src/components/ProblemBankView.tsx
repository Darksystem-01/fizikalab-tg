"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PHYSICS_PROBLEMS,
  type PhysicsChapter,
  type PhysicsProblem,
  checkProblemAnswer,
} from "@/lib/physics/problems";
import { MathFormula } from "@/components/MathFormula";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Trophy,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const CHAPTERS: { key: PhysicsChapter; label: string; count: number; labUrl: string }[] = [
  { key: "metrology", label: "1. Metrologiya & Xatoliklar", count: 50, labUrl: "/labs/metrology" },
  { key: "kinematics", label: "2. Kinematika & Trayektoriyalar", count: 50, labUrl: "/labs/kinematics" },
  { key: "dynamics", label: "3. Dinamika & Nyuton Qonunlari", count: 50, labUrl: "/labs/dynamics" },
  { key: "statics", label: "4. Statika & Muvozanat", count: 50, labUrl: "/labs/statics" },
  { key: "electromagnetism", label: "5. Elektromagnetizm & Zanjirlar", count: 50, labUrl: "/labs/electromagnetism" },
  { key: "optics", label: "6. To‘lqinlar & Optika", count: 50, labUrl: "/labs/optics" },
  { key: "thermodynamics", label: "7. Molekulyar & Termodinamika", count: 50, labUrl: "/labs/thermodynamics" },
  { key: "atomic", label: "8. Atom & Yadro Fizikasi", count: 50, labUrl: "/labs/atomic" },
];

export function ProblemBankView({ initialChapter }: { initialChapter?: PhysicsChapter }) {
  const [selectedChapter, setSelectedChapter] = useState<PhysicsChapter>(
    initialChapter || "metrology"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // User input answers state
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  // Verification results state
  const [results, setResults] = useState<
    Record<
      string,
      {
        isCorrect: boolean;
        userAnswer: number;
        correctAnswer: number;
        errorPct: number;
        tolerancePct: number;
        feedbackUz: string;
      }
    >
  >({});
  // Expanded solutions / hints
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const filteredProblems = useMemo(() => {
    return PHYSICS_PROBLEMS.filter((p) => {
      if (p.chapter !== selectedChapter) return false;
      if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inStatement = p.statement.toLowerCase().includes(q);
        const inTopic = p.topic.toLowerCase().includes(q);
        if (!inTitle && !inStatement && !inTopic) return false;
      }
      return true;
    });
  }, [selectedChapter, difficultyFilter, searchQuery]);

  // Statistics for the selected chapter
  const chapterProblems = useMemo(() => {
    return PHYSICS_PROBLEMS.filter((p) => p.chapter === selectedChapter);
  }, [selectedChapter]);

  const solvedCount = useMemo(() => {
    return chapterProblems.filter((p) => results[p.id]?.isCorrect).length;
  }, [chapterProblems, results]);

  function handleCheckAnswer(prob: PhysicsProblem) {
    const raw = userInputs[prob.id];
    if (raw === undefined || raw.trim() === "") return;
    const num = parseFloat(raw.replace(",", "."));
    if (isNaN(num)) return;

    const res = checkProblemAnswer(prob.id, num);
    setResults((prev) => ({ ...prev, [prob.id]: res }));
    if (res.isCorrect) {
      // automatically open step-by-step solution to reinforce learning
      setOpenSolutions((prev) => ({ ...prev, [prob.id]: true }));
    }
  }

  function handleReset(probId: string) {
    setUserInputs((prev) => {
      const copy = { ...prev };
      delete copy[probId];
      return copy;
    });
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[probId];
      return copy;
    });
    setOpenSolutions((prev) => {
      const copy = { ...prev };
      delete copy[probId];
      return copy;
    });
  }

  const activeChapObj = CHAPTERS.find((c) => c.key === selectedChapter)!;

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-[#1E3A8A] px-2.5 py-0.5 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" /> 400 ta Universitet Masalalari
              </span>
              <span className="text-xs text-slate-500">Irodov, Savelyev, Sivuxin me’yorlari</span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Interaktiv Fizika Masalalar va Mashqlar Markazi
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">
              Nazariy hisob-kitoblarni amalga oshiring, javobingizni avto-tekshiring va bosqichma-bosqich yechim orqali bilimlaringizni mustahkamlang.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="border border-blue-200 bg-blue-50/70 px-4 py-2 text-right">
              <div className="text-[11px] font-medium text-slate-600">Joriy bobdagi natija</div>
              <div className="flex items-center justify-end gap-1.5 font-mono text-base font-bold text-[#1E3A8A]">
                <Trophy className="h-4 w-4 text-amber-600" />
                {solvedCount} / {chapterProblems.length} ta yechildi
              </div>
            </div>
            <Link
              href={activeChapObj.labUrl}
              className="flex items-center gap-1.5 border border-[#1E3A8A] bg-[#1E3A8A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#172554] transition"
            >
              <FlaskConical className="h-4 w-4" />
              Laboratoriya Stendi
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1.5 w-full bg-slate-100 overflow-hidden rounded-full">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(solvedCount / chapterProblems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Chapter Selection Pills */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {CHAPTERS.map((ch) => {
          const isSelected = ch.key === selectedChapter;
          return (
            <button
              key={ch.key}
              onClick={() => {
                setSelectedChapter(ch.key);
                setSearchQuery("");
              }}
              className={`flex flex-col items-start p-2.5 text-left border text-xs transition cursor-pointer ${
                isSelected
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="truncate w-full font-medium">{ch.label.split(". ")[1]}</span>
              <span className={`mt-1 font-mono text-[10px] ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                50 ta masala
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">Murakkablik:</span>
          {["all", "oson", "o'rta", "murakkab"].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-2.5 py-1 text-xs border cursor-pointer ${
                difficultyFilter === diff
                  ? "border-slate-900 bg-slate-900 text-white font-semibold"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {diff === "all" ? "Barchasi" : diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mavzu yoki kalit so‘z bo‘yicha qidirish..."
            className="w-full border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A8A] focus:outline-none"
          />
        </div>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Qidiruv mezonlariga mos keladigan masala topilmadi.
          </div>
        ) : (
          filteredProblems.map((prob, idx) => {
            const res = results[prob.id];
            const isSolved = res?.isCorrect;
            const hasAttempt = res !== undefined;
            const isSolutionOpen = openSolutions[prob.id];
            const isHintsOpen = openHints[prob.id];

            return (
              <div
                key={prob.id}
                className={`border bg-white transition shadow-xs ${
                  isSolved
                    ? "border-emerald-300 bg-emerald-50/20"
                    : hasAttempt
                    ? "border-amber-300"
                    : "border-slate-200"
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1E3A8A]">
                      #{idx + 1} ({prob.id})
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">{prob.topic}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-semibold ${
                        prob.difficulty === "oson"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : prob.difficulty === "o'rta"
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-purple-300 bg-purple-50 text-purple-800"
                      }`}
                    >
                      {prob.difficulty.toUpperCase()}
                    </span>

                    {isSolved && (
                      <span className="flex items-center gap-1 border border-emerald-300 bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> To‘g‘ri yechildi
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">{prob.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                    {prob.statement}
                  </p>

                  {/* Given variables badge tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="font-medium text-slate-500">Berilgan kattaliklar:</span>
                    {Object.entries(prob.given).map(([k, item]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-800 font-mono"
                      >
                        <span>{item.symbol} =</span>
                        <strong className="text-slate-900">{item.value}</strong>
                        <span>{item.unit}</span>
                      </span>
                    ))}
                  </div>

                  {/* Formula Preview with KaTeX */}
                  <div className="bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-600">
                      Asosiy qonuniyat formulasi:
                    </div>
                    <div className="font-mono text-xs text-[#1E3A8A]">
                      <MathFormula tex={prob.formulaLatex} display={false} />
                    </div>
                  </div>

                  {/* Student Answer Input & Verification */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Javobingiz ({prob.targetSymbol}, {prob.targetUnit}):
                      </label>
                      <input
                        type="text"
                        value={userInputs[prob.id] ?? ""}
                        onChange={(e) =>
                          setUserInputs((prev) => ({ ...prev, [prob.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCheckAnswer(prob);
                        }}
                        placeholder={`Masalan: ${prob.correctAnswer}`}
                        className="w-32 border border-slate-300 px-2.5 py-1 text-xs font-mono text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                      />
                      <span className="text-xs font-mono text-slate-500">{prob.targetUnit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckAnswer(prob)}
                      className="border border-[#1E3A8A] bg-[#1E3A8A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#172554] transition cursor-pointer"
                    >
                      Tekshirish
                    </button>

                    {hasAttempt && (
                      <button
                        type="button"
                        onClick={() => handleReset(prob.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" /> Qayta urinish
                      </button>
                    )}

                    {/* Simulation stend quick link */}
                    {prob.simulationPresetId && (
                      <Link
                        href={`${activeChapObj.labUrl}?scenario=${prob.simulationPresetId}`}
                        className="ml-auto text-xs text-[#1E3A8A] hover:underline flex items-center gap-1"
                      >
                        <FlaskConical className="h-3.5 w-3.5" /> Stendda simulyatsiya qilish
                      </Link>
                    )}
                  </div>

                  {/* Feedback Box */}
                  {res && (
                    <div
                      className={`p-3 text-xs border flex items-start gap-2 ${
                        res.isCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-red-300 bg-red-50 text-red-900"
                      }`}
                    >
                      {res.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold">{res.feedbackUz}</div>
                        {!res.isCorrect && (
                          <div className="mt-1 text-[11px] text-slate-600">
                            Maslahat: O‘lchov birliklarini SI sistemasiga to‘g‘ri o‘tkazganingizni va formulalarni tekshiring.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hints Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenHints((prev) => ({ ...prev, [prob.id]: !prev[prob.id] }))
                      }
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                      {isHintsOpen ? "Ko‘rsatmani yashirish" : "Ko‘rsatma (Maslahat)"}
                      {isHintsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {isHintsOpen && (
                      <div className="mt-2 border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950 space-y-1">
                        {prob.hints.map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="font-bold">•</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step Solution Toggle */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSolutions((prev) => ({ ...prev, [prob.id]: !prev[prob.id] }))
                      }
                      className="flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
                    >
                      {isSolutionOpen
                        ? "Bosqichma-bosqich yechimni yashirish"
                        : "To‘liq bosqichma-bosqich yechimni ko‘rish"}
                      {isSolutionOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {isSolutionOpen && (
                      <div className="mt-2.5 border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-800 space-y-2">
                        <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1">
                          Masalaning to‘liq analitik yechimi:
                        </div>
                        {prob.stepByStepSolution.map((step, sIdx) => (
                          <div key={sIdx} className="leading-relaxed font-mono text-[11px]">
                            {step}
                          </div>
                        ))}
                        <div className="pt-2 text-right text-[11px] font-bold text-slate-900 border-t border-slate-200">
                          To‘g‘ri javob: {prob.targetSymbol} = {prob.correctAnswer} {prob.targetUnit} (±{prob.tolerancePct}%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
