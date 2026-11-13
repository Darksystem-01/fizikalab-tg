"use client";

import { useEffect, useRef } from "react";
import { MathFormula } from "@/components/MathFormula";
import { Download, FileText, Printer, X, CheckCircle2 } from "lucide-react";

export interface AcademicReportData {
  id?: number | string;
  university?: string;
  faculty?: string;
  studentName?: string;
  studentGroup?: string;
  labTitle?: string;
  labKey?: string;
  scenarioId?: string;
  objective?: string;
  theoryFormulaTex?: string;
  theoryExplanation?: string;
  apparatusList?: { name: string; model?: string; leastCount?: string }[];
  measurements?: Array<Record<string, unknown>>;
  errorAnalysis?: {
    mean?: number | string;
    stdDev?: number | string;
    absError?: number | string;
    relErrorPct?: number | string;
    studentConfidencePct?: number | string;
  };
  conclusion?: string;
  grade?: number | null;
  teacherFeedback?: string;
  teacherName?: string;
  submissionDate?: string;
}

export function AcademicReportModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: AcademicReportData;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const uniName =
    data.university || "Toshkent Axborot Texnologiyalari Universiteti (TATU)";
  const facultyName = data.faculty || "Dasturiy injiniring fakulteti";
  const studentName = data.studentName || "Talaba";
  const groupName = data.studentGroup || "Guruh ko'rsatilmagan";
  const subDate =
    data.submissionDate ||
    new Date().toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl print:max-h-none print:w-full print:border-none print:shadow-none">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <FileText className="h-4 w-4 text-[#1E3A8A]" />
            <span>Rasmiy Akademik Laboratoriya Protokoli (A4 PDF)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Chop etish / PDF saqlash</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto p-8 text-slate-900 print:p-6 print:overflow-visible font-serif"
        >
          {/* Official Ministry Header */}
          <div className="border-b-2 border-slate-800 pb-5 text-center">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-700">
              O‘zbekiston Respublikasi Oliy Ta’lim, Fan va Innovatsiyalar Vazirligi
            </div>
            <div className="mt-1 text-base font-extrabold uppercase text-slate-900 tracking-wide">
              {uniName}
            </div>
            <div className="text-xs font-medium text-slate-600">
              {facultyName} · Umumiy va Eksperimental Fizika Kafedrasi
            </div>
          </div>

          {/* Protocol Title & Academic Metadata */}
          <div className="my-6 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-[#1E3A8A] font-bold">
              Laboratoriya Ishi Protokoli
            </div>
            <h1 className="mt-1 text-xl font-black uppercase text-slate-900 tracking-tight">
              {data.labTitle || "Fizikaviy Tadqiqot Tajribasi"}
            </h1>
          </div>

          {/* Student & Course Identification Grid */}
          <div className="my-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-300 p-4 text-xs font-sans">
            <div>
              <span className="font-semibold text-slate-600">Bajaruvchi talaba:</span>{" "}
              <span className="font-bold text-slate-900">{studentName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Akademik guruh:</span>{" "}
              <span className="font-bold font-mono text-slate-900">{groupName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Topshirilgan sana:</span>{" "}
              <span className="text-slate-800">{subDate}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Tekshiruvchi o‘qituvchi:</span>{" "}
              <span className="text-slate-800">{data.teacherName || "Fizika kafedrasi assistenti"}</span>
            </div>
          </div>

          {/* 1. Ishning Maqsadi */}
          <div className="mt-6 space-y-1.5 font-sans">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              1. Ishning Maqsadi va Vazifalari
            </h2>
            <p className="text-xs leading-relaxed text-slate-700 font-serif">
              {data.objective ||
                "Fizikaviy jarayon parametrlarini zamonaviy laboratoriya stendida bevosita va bilvosita o‘lchash, o‘lchov noaniqliklarini baholash hamda nazariy qonuniyatlar bilan taqqoslash."}
            </p>
          </div>

          {/* 2. Nazariy Asoslar va Formulalar */}
          {data.theoryFormulaTex && (
            <div className="mt-5 space-y-2 font-sans">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                2. Nazariy Asoslar va Hisoblash Formulalari
              </h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-center">
                <MathFormula tex={data.theoryFormulaTex} display={true} />
              </div>
              {data.theoryExplanation && (
                <p className="text-[11px] leading-relaxed text-slate-600 font-serif">
                  {data.theoryExplanation}
                </p>
              )}
            </div>
          )}

          {/* 3. O'lchov Asboblari */}
          {data.apparatusList && data.apparatusList.length > 0 && (
            <div className="mt-5 space-y-2 font-sans">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                3. Ishlatilgan O‘lchov Asboblari va Qurilmalar
              </h2>
              <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-800">
                    <th className="border border-slate-300 px-3 py-1.5">№</th>
                    <th className="border border-slate-300 px-3 py-1.5">Asbob nomi</th>
                    <th className="border border-slate-300 px-3 py-1.5">Modeli / Turi</th>
                    <th className="border border-slate-300 px-3 py-1.5">Aniqlik darajasi (Least Count)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.apparatusList.map((app, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="border border-slate-300 px-3 py-1 font-mono text-[11px]">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-1">{app.name}</td>
                      <td className="border border-slate-300 px-3 py-1 text-slate-600">{app.model || "Standart"}</td>
                      <td className="border border-slate-300 px-3 py-1 font-mono text-slate-700">{app.leastCount || "0.01 mm / birlik"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Tajriba O'lchov Natijalari Jadvali */}
          {data.measurements && data.measurements.length > 0 && (
            <div className="mt-5 space-y-2 font-sans">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                4. Tajriba O‘lchov Natijalari
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border border-slate-300 px-2.5 py-1.5 font-mono text-[11px]">Tajriba №</th>
                      {Object.keys(data.measurements[0] || {}).map((k) => (
                        <th key={k} className="border border-slate-300 px-2.5 py-1.5 capitalize">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.measurements.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-2.5 py-1 font-mono font-bold text-slate-700">
                          {rIdx + 1}
                        </td>
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="border border-slate-300 px-2.5 py-1 font-mono text-slate-800">
                            {typeof val === "number" ? val.toFixed(3) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Statistik Xatoliklar Tahlili */}
          {data.errorAnalysis && (
            <div className="mt-5 space-y-2 font-sans">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                5. Statistik Noaniqliklar va Xatoliklar Byudjeti (GUM Standarti)
              </h2>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs sm:grid-cols-4">
                {data.errorAnalysis.mean !== undefined && (
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium">O‘rtacha arifmetik qiymat (X̄):</span>
                    <span className="font-mono font-bold text-slate-900">{String(data.errorAnalysis.mean)}</span>
                  </div>
                )}
                {data.errorAnalysis.absError !== undefined && (
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium">Mutlaq xatolik (ΔX):</span>
                    <span className="font-mono font-bold text-slate-900">± {String(data.errorAnalysis.absError)}</span>
                  </div>
                )}
                {data.errorAnalysis.relErrorPct !== undefined && (
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium">Nisbiy xatolik (ε):</span>
                    <span className="font-mono font-bold text-[#1E3A8A]">{String(data.errorAnalysis.relErrorPct)} %</span>
                  </div>
                )}
                {data.errorAnalysis.studentConfidencePct !== undefined && (
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium">Ishonchlilik ehtimoli (α):</span>
                    <span className="font-mono font-bold text-emerald-700">{String(data.errorAnalysis.studentConfidencePct)} %</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Xulosalar */}
          {data.conclusion && (
            <div className="mt-5 space-y-1.5 font-sans">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                6. Ilmiy Xulosalar
              </h2>
              <p className="text-xs leading-relaxed text-slate-800 font-serif">
                {data.conclusion}
              </p>
            </div>
          )}

          {/* Teacher Evaluation & Signature Seal Box */}
          <div className="mt-8 border-t-2 border-slate-800 pt-4 font-sans">
            <div className="grid grid-cols-2 gap-6 items-end">
              <div>
                <div className="text-[11px] font-semibold text-slate-700">O‘qituvchi xulosasi va bahosi:</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1 font-mono text-sm font-black text-slate-900">
                    Baho: {data.grade !== null && data.grade !== undefined ? `${data.grade} ball` : "___ ball"}
                  </span>
                  {data.teacherFeedback && (
                    <span className="text-[11px] text-slate-600 italic">
                      &quot;{data.teacherFeedback}&quot;
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600">Tekshirdi va qabul qildi:</div>
                <div className="mt-4 border-b border-dashed border-slate-400 inline-block w-48 text-center text-xs text-slate-500">
                  (Imzo va muhr o‘rni)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
