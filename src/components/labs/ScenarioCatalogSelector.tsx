"use client";

import { useState, useMemo } from "react";
import {
  getScenariosByChapter,
  type ScenarioDefinition,
} from "@/lib/physics/catalog";
import type { LabKey } from "@/app/api/physics/simulate/route";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";

interface ScenarioCatalogSelectorProps {
  chapter: LabKey;
  activeScenarioId?: string;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
}

export function ScenarioCatalogSelector({
  chapter,
  activeScenarioId,
  onSelectScenario,
}: ScenarioCatalogSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const allScenarios = useMemo(() => {
    return getScenariosByChapter(chapter);
  }, [chapter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allScenarios.forEach((s) => set.add(s.categoryUz));
    return ["all", ...Array.from(set)];
  }, [allScenarios]);

  const filteredScenarios = useMemo(() => {
    return allScenarios.filter((s) => {
      const matchCat =
        selectedCategory === "all" || s.categoryUz === selectedCategory;
      const matchSearch =
        search.trim() === "" ||
        s.titleUz.toLowerCase().includes(search.toLowerCase()) ||
        s.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        s.descriptionUz.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allScenarios, selectedCategory, search]);

  const activeScenario = useMemo(() => {
    return (
      allScenarios.find((s) => s.id === activeScenarioId) || allScenarios[0]
    );
  }, [allScenarios, activeScenarioId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Active Preset Header & Collapse Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A] text-white">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1E3A8A]">
                {activeScenario ? `№ ${String(activeScenario.orderIndex).padStart(2, "0")}` : "Mavzu"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {activeScenario?.categoryUz || "Tajriba stendi"}
              </span>
            </div>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">
              {activeScenario?.titleUz || "Standart laboratoriya tajribasi"}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
        >
          <BookOpen className="h-4 w-4 text-[#1E3A8A]" />
          <span>
            {isExpanded
              ? "Katalogni yashirish"
              : `Barcha 30 ta stendni ko‘rish (${allScenarios.length})`}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded Catalog Grid */}
      {isExpanded && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="30 ta laboratoriya ichidan qidirish (nomi, formula, asbob)..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A8A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#1E3A8A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "Barchasi (30)" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredScenarios.map((sc) => {
              const isActive = sc.id === activeScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc);
                    setIsExpanded(false);
                  }}
                  className={`group relative flex flex-col justify-between rounded-lg border p-3 text-left transition cursor-pointer ${
                    isActive
                      ? "border-[#1E3A8A] bg-blue-50/50 ring-1 ring-[#1E3A8A]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#1E3A8A]">
                        № {String(sc.orderIndex).padStart(2, "0")} · {sc.id}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          sc.difficulty === "Boshlang'ich"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : sc.difficulty === "O'rta"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {sc.difficulty}
                      </span>
                    </div>

                    <h4 className="mt-1.5 text-xs font-semibold text-slate-900 group-hover:text-[#1E3A8A]">
                      {sc.titleUz}
                    </h4>

                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                      {sc.descriptionUz}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="truncate font-mono text-slate-500">
                      {sc.theoryFormulaTex.slice(0, 32)}...
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A]">
                        <CheckCircle2 className="h-3 w-3" /> Tanlangan
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-[#1E3A8A]">
                        O‘rnatish →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
