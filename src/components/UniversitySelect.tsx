"use client";

import { useEffect, useRef, useState } from "react";
import {
  findUniversity,
  searchUniversities,
  type University,
} from "@/lib/universities";
import { Check, ChevronDown, GraduationCap, MapPin, Search } from "lucide-react";

interface UniversitySelectProps {
  university: string;
  onUniversityChange: (uniName: string, faculties: string[]) => void;
  faculty: string;
  onFacultyChange: (facultyName: string) => void;
  required?: boolean;
}

export function UniversitySelect({
  university,
  onUniversityChange,
  faculty,
  onFacultyChange,
  required = true,
}: UniversitySelectProps) {
  const [openUni, setOpenUni] = useState(false);
  const [typedQuery, setTypedQuery] = useState<string | null>(null);
  const [openFaculty, setOpenFaculty] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const facultyRef = useRef<HTMLDivElement>(null);

  const selectedUni = findUniversity(university) || null;
  const currentSearchQuery = typedQuery !== null ? typedQuery : university;

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenUni(false);
        setTypedQuery(null);
      }

      if (
        facultyRef.current &&
        !facultyRef.current.contains(event.target as Node)
      ) {
        setOpenFaculty(false);
        setFacultySearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUnis = searchUniversities(currentSearchQuery, 25);
  const availableFaculties = selectedUni ? selectedUni.faculties : [];
  const displayedFaculties = facultySearch
    ? availableFaculties.filter((f) =>
        f.toLowerCase().includes(facultySearch.toLowerCase())
      )
    : availableFaculties;

  function handleSelectUniversity(u: University) {
    setTypedQuery(null);
    setOpenUni(false);
    onUniversityChange(u.name, u.faculties);
    // Reset faculty if it does not belong to new university
    if (!u.faculties.includes(faculty)) {
      onFacultyChange("");
    }
    // Auto-open faculty selector for seamless workflow
    setTimeout(() => {
      setOpenFaculty(true);
      setFacultySearch("");
    }, 100);
  }

  function handleSelectFaculty(f: string) {
    onFacultyChange(f);
    setOpenFaculty(false);
    setFacultySearch("");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* 1. LinkedIn-Style University Autocomplete */}
      <div className="relative" ref={containerRef}>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">
            Universitet / OTM {required && "*"}
          </label>
          {selectedUni && (
            <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-0.5">
              <Check className="h-3 w-3" /> Tasdiqlangan OTM
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            {selectedUni ? (
              selectedUni.logoUrl ? (
                <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-2xs">
                  <img
                    src={selectedUni.logoUrl}
                    alt={selectedUni.shortName}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
              ) : (
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: selectedUni.emblemBg }}
                >
                  {selectedUni.emblemText.slice(0, 3)}
                </div>
              )
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
          <input
            type="text"
            required={required}
            value={currentSearchQuery}
            onFocus={() => setOpenUni(true)}
            onChange={(e) => {
              const val = e.target.value;
              setTypedQuery(val);
              setOpenUni(true);
              const exact = findUniversity(val);
              if (exact) {
                onUniversityChange(exact.name, exact.faculties);
              } else if (university) {
                onUniversityChange("", []);
                onFacultyChange("");
              }
            }}
            placeholder="Toshkent, TATU, O‘zMU, SamDU..."
            className={`w-full rounded-md border bg-white pl-9 pr-7 py-2 text-xs text-slate-900 transition-colors focus:outline-none focus:ring-1 ${
              selectedUni
                ? "border-emerald-500 focus:border-emerald-600 focus:ring-emerald-600"
                : "border-slate-300 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            }`}
          />
          <button
            type="button"
            onClick={() => setOpenUni(!openUni)}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Suggestion Dropdown */}
        {openUni && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-68 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
            <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>O‘zbekiston OTMlari katalogi</span>
              <span>{filteredUnis.length} ta topildi</span>
            </div>

            {filteredUnis.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Bunday OTM topilmadi. Iltimos, O‘zbekistondagi rasmiy universitet nomini yoki qisqartmasini kiriting (masalan: TATU, O‘zMU, SamDU).
              </div>
            ) : (
              filteredUnis.map((u) => {
                const isSelected = selectedUni?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUniversity(u)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer hover:bg-blue-50/70 ${
                      isSelected ? "bg-blue-50 font-medium" : "bg-white"
                    }`}
                  >
                    {/* Official University Logo or Styled Emblem Badge */}
                    {u.logoUrl ? (
                      <div className="w-8 h-8 rounded-md flex shrink-0 items-center justify-center bg-white border border-slate-200/90 shadow-xs p-0.5 overflow-hidden">
                        <img
                          src={u.logoUrl}
                          alt={u.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-md flex shrink-0 items-center justify-center text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: u.emblemBg }}
                      >
                        {u.emblemText.slice(0, 4)}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {u.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {u.city}
                        </span>
                        <span>•</span>
                        <span
                          className={`px-1 rounded text-[9px] font-medium ${
                            u.category === "Davlat OTM"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : u.category === "Xalqaro / Filial"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {u.category}
                        </span>
                        <span>•</span>
                        <span>{u.faculties.length} ta fakultet</span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Cascading Scrollable Faculty Dropdown */}
      <div className="relative" ref={facultyRef}>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">
            Fakultet {required && "*"}
          </label>
          {faculty && (
            <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-0.5">
              <Check className="h-3 w-3" /> Tanlandi
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <GraduationCap className="h-4 w-4" />
          </div>

          <button
            type="button"
            disabled={!selectedUni}
            onClick={() => setOpenFaculty(!openFaculty)}
            className={`w-full text-left rounded-md border pl-9 pr-7 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer focus:outline-none focus:ring-1 ${
              !selectedUni
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : faculty
                ? "bg-white text-slate-900 border-emerald-500 focus:border-emerald-600 focus:ring-emerald-600"
                : "bg-white text-slate-500 border-slate-300 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]"
            }`}
          >
            <span className="truncate">
              {faculty ||
                (selectedUni
                  ? "Fakultetni ro‘yxatdan tanlang..."
                  : "Avval OTMni tanlang")}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Scrollable Faculty Dropdown List */}
        {openFaculty && selectedUni && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
            <div className="sticky top-0 bg-white z-10 border-b border-slate-200">
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{selectedUni.shortName} fakultetlari</span>
                <span>{availableFaculties.length} ta</span>
              </div>
              {availableFaculties.length > 5 && (
                <div className="p-1.5 bg-white border-b border-slate-100">
                  <input
                    type="text"
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    placeholder="Fakultet nomini qidirish..."
                    className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:border-[#1E3A8A]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            {displayedFaculties.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Mos keluvchi fakultet topilmadi.
              </div>
            ) : (
              displayedFaculties.map((f, idx) => {
                const isSelected = faculty === f;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectFaculty(f)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer hover:bg-blue-50/70 ${
                      isSelected
                        ? "bg-blue-50 font-semibold text-[#1E3A8A]"
                        : "text-slate-800"
                    }`}
                  >
                    <span className="truncate">{f}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
