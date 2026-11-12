"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, Wrench } from "lucide-react";
import { PHYSICS_INSTRUMENTS, type InstrumentCategory } from "@/lib/instruments";

const CATEGORIES: { id: "all" | InstrumentCategory; label: string }[] = [
  { id: "all", label: "Barchasi (75 ta)" },
  { id: "mexanika", label: "Mexanika" },
  { id: "elektromagnetizm", label: "Elektromagnetizm" },
  { id: "optika", label: "Optika" },
  { id: "klassik", label: "Klassik / Termodinamika" },
];

export function InstrumentsCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | InstrumentCategory>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PHYSICS_INSTRUMENTS.filter((inst) => {
      if (category !== "all" && inst.category !== category) return false;
      if (!q) return true;
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.purpose.toLowerCase().includes(q) ||
        inst.precisionOrFormula.toLowerCase().includes(q) ||
        String(inst.id).includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`border px-3 py-1.5 text-xs font-medium ${
                category === c.id
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qurilma nomi, raqami yoki vazifasi..."
            className="w-full border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          Jami topildi: <strong className="text-slate-900">{filtered.length}</strong> ta laboratoriya
          qurilmasi (Manba: <em>fizika_qurilmalari_.pdf</em>)
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((inst) => (
          <div
            key={inst.id}
            className="flex flex-col justify-between border border-slate-200 bg-white p-4"
          >
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-[28px] items-center justify-center border border-slate-300 bg-slate-50 px-1.5 font-mono text-xs font-bold text-[#1E3A8A]">
                    #{inst.id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{inst.name}</h3>
                </div>
                <span className="shrink-0 border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {inst.categoryLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">{inst.purpose}</p>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{inst.precisionOrFormula}</span>
              </div>
              {inst.labRoute ? (
                <Link
                  href={inst.labRoute}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Laboratoriya stendida ochish
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Ma&apos;lumotnoma qurilmasi
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
