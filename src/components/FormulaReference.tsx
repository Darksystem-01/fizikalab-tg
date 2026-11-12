"use client";

import { useMemo, useState } from "react";
import { Calculator, Search } from "lucide-react";
import { MathFormula } from "@/components/MathFormula";
import { CODATA_REFERENCE, FORMULA_CATALOG } from "@/lib/formulas";

const SECTIONS = [
  "Barchasi",
  "Kinematika",
  "Dinamika",
  "Statika",
  "Termodinamika",
  "Elektromagnetizm",
  "Optika",
  "Noaniqliklar",
] as const;

export function FormulaReference() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Barchasi");
  const [query, setQuery] = useState("");

  // Quick statistical calculator
  const [rawValues, setRawValues] = useState("9.79, 9.81, 9.83, 9.78, 9.82");
  const [refMean, setRefMean] = useState("9.80665");
  const [refErr, setRefErr] = useState("0.001");
  const [analysisResult, setAnalysisResult] = useState<{
    stats: { n: number; mean: number; stdDev: number; stdError: number; relativeErrorPct: number };
    tTest: { tPrime: number; consistent: boolean } | null;
  } | null>(null);
  const [calcError, setCalcError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FORMULA_CATALOG.filter((f) => {
      if (section !== "Barchasi" && f.section !== section) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.section.toLowerCase().includes(q) ||
        f.latex.toLowerCase().includes(q)
      );
    });
  }, [section, query]);

  async function runQuickAnalysis() {
    setCalcError("");
    const values = rawValues
      .split(/[,\s;]+/)
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));
    if (values.length < 2) {
      setCalcError("Kamida 2 ta haqiqiy son kiriting (vergul yoki bo'sh joy bilan).");
      return;
    }

    const res = await fetch("/api/physics/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values,
        compareWith: {
          mean: Number(refMean) || 0,
          stdError: Math.max(0, Number(refErr) || 0),
        },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setAnalysisResult(data);
    } else {
      setCalcError(data.error || "Hisoblashda xatolik yuz berdi.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick statistical calculator */}
      <div className="border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calculator className="h-4 w-4 text-[#1E3A8A]" />
            Tezkor Statistik Xatolik va Styudent t&apos;-Mezoni Kalkulyatori (Backend)
          </div>
          <span className="border border-blue-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1E3A8A]">
            Jami: {FORMULA_CATALOG.length} ta formula · {CODATA_REFERENCE.length} ta CODATA doimiysi
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs text-slate-700">
              O&apos;lchangan qiymatlar qatori (vergul bilan ajratilgan)
            </label>
            <input
              type="text"
              value={rawValues}
              onChange={(e) => setRawValues(e.target.value)}
              className="w-full border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-700">Nazariy qiymat μ_ref</label>
            <input
              type="text"
              value={refMean}
              onChange={(e) => setRefMean(e.target.value)}
              className="w-full border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-700">Nazariy δ_ref</label>
            <input
              type="text"
              value={refErr}
              onChange={(e) => setRefErr(e.target.value)}
              className="w-full border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
            />
          </div>
          <div className="flex items-end md:col-span-2">
            <button
              type="button"
              onClick={runQuickAnalysis}
              className="w-full bg-[#1E3A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#172554] cursor-pointer"
            >
              Hisoblash
            </button>
          </div>
        </div>
        {calcError && <div className="mt-2 text-xs text-red-700">{calcError}</div>}
        {analysisResult && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-xs sm:grid-cols-5">
            <div className="border border-slate-200 bg-white p-2">
              <div className="text-[10px] text-slate-500">N / O&apos;rtacha μ</div>
              <div className="font-mono font-semibold text-slate-900">
                {analysisResult.stats.n} / {analysisResult.stats.mean}
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-2">
              <div className="text-[10px] text-slate-500">Standart og&apos;ish σ</div>
              <div className="font-mono font-semibold text-slate-900">
                {analysisResult.stats.stdDev}
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-2">
              <div className="text-[10px] text-slate-500">O&apos;rtacha xatoligi δ</div>
              <div className="font-mono font-semibold text-[#1E3A8A]">
                ±{analysisResult.stats.stdError}
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-2">
              <div className="text-[10px] text-slate-500">Nisbiy xatolik</div>
              <div className="font-mono font-semibold text-slate-900">
                {analysisResult.stats.relativeErrorPct}%
              </div>
            </div>
            {analysisResult.tTest && (
              <div className="border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Styudent t&apos; mezoni</div>
                <div
                  className={`font-mono font-semibold ${
                    analysisResult.tTest.consistent ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  t&apos; = {analysisResult.tTest.tPrime} (
                  {analysisResult.tTest.consistent ? "Mos (t'≤2)" : "Farqli"})
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formula Filter */}
      <div className="flex flex-col gap-3 border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map((sec) => {
            const count =
              sec === "Barchasi"
                ? FORMULA_CATALOG.length
                : FORMULA_CATALOG.filter((f) => f.section === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSection(sec)}
                className={`border px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  section === sec
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Formula qidirish..."
            className="w-full border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* Formula Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.id} className="border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-[#1E3A8A]">
                {item.section}
              </span>
            </div>
            <div className="my-2 overflow-x-auto border border-slate-100 bg-slate-50 p-2.5">
              <MathFormula tex={item.latex} display />
            </div>
            <p className="text-xs text-slate-700">{item.description}</p>
            <div className="mt-2 text-[11px] text-slate-400">Manba: {item.source}</div>
          </div>
        ))}
      </div>

      {/* CODATA Table */}
      <div className="border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Fundamental Fizik Doimiylar Jadvali (CODATA 2022)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Kattalik nomi</th>
                <th className="px-3 py-2">Belgisi</th>
                <th className="px-3 py-2">Qiymati</th>
                <th className="px-3 py-2">SI birligi</th>
              </tr>
            </thead>
            <tbody>
              {CODATA_REFERENCE.map((c) => (
                <tr key={c.symbol} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                  <td className="px-3 py-2 font-mono font-bold text-[#1E3A8A]">{c.symbol}</td>
                  <td className="px-3 py-2 font-mono text-slate-800">{c.value}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{c.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
