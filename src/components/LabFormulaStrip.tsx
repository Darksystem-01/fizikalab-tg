"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { MathFormula } from "@/components/MathFormula";
import { FORMULA_CATALOG, type FormulaSection } from "@/lib/formulas";

export function LabFormulaStrip({ section }: { section: FormulaSection }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const sectionCount = useMemo(
    () => FORMULA_CATALOG.filter((f) => f.section === section).length,
    [section]
  );

  const visibleFormulas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FORMULA_CATALOG.filter((f) => {
      if (!showAll && !q && f.section !== section) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.section.toLowerCase().includes(q) ||
        f.latex.toLowerCase().includes(q)
      );
    });
  }, [section, showAll, query]);

  return (
    <section className="mt-4 border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 text-left text-xs hover:bg-slate-100 cursor-pointer"
      >
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <BookOpen className="h-4 w-4 text-[#1E3A8A]" />
          <span>
            {section} formulalari ({sectionCount} ta) va umumiy baza ({FORMULA_CATALOG.length} ta)
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-medium text-[#1E3A8A]">
          {open ? "Yopish" : "Ochish"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className={`border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                  !showAll
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {section} ({sectionCount})
              </button>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={`border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                  showAll
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Barcha formulalar ({FORMULA_CATALOG.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Formula qidirish..."
                  className="w-full border border-slate-300 bg-white py-1 pl-7 pr-2 text-xs"
                />
              </div>
              <Link
                href="/reference"
                className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-[#1E3A8A] hover:bg-slate-50"
              >
                To‘liq ma’lumotnoma <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {visibleFormulas.map((f) => (
              <div key={f.id} className="border border-slate-200 bg-slate-50/50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900">{f.title}</div>
                  <span className="border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#1E3A8A]">
                    {f.section}
                  </span>
                </div>
                <div className="my-1.5 overflow-x-auto border border-slate-200 bg-white p-2">
                  <MathFormula tex={f.latex} />
                </div>
                <p className="text-[11px] text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
