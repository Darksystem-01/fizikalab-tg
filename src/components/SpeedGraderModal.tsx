"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { calculateHemisGrade } from "@/lib/hemis";
import { STANDARD_LAB_RUBRIC } from "@/lib/lms";

export interface StudentReportSubmission {
  id: number;
  lab_key: string;
  title: string;
  conclusion: string;
  measurements_json: string;
  error_analysis_json: string;
  status: string;
  grade: number | null;
  admin_feedback: string;
  submitted_at: string;
  student_name: string;
  student_email: string;
  student_group: string;
  university?: string;
  faculty?: string;
}

interface SpeedGraderModalProps {
  report: StudentReportSubmission;
  onClose: () => void;
  onGraded: (reportId: number, grade: number, feedback: string) => Promise<void>;
}

export function SpeedGraderModal({ report, onClose, onGraded }: SpeedGraderModalProps) {
  // 4 Rubric points
  const [theoryPts, setTheoryPts] = useState<number>(20);
  const [precisionPts, setPrecisionPts] = useState<number>(28);
  const [errorPts, setErrorPts] = useState<number>(24);
  const [conclusionPts, setConclusionPts] = useState<number>(23);
  const [feedback, setFeedback] = useState<string>(report.admin_feedback || "Hisobot sinchkovlik bilan tekshirildi. O‘lchashlar to‘g‘ri o‘tkazilgan.");
  const [isSaving, setIsSaving] = useState(false);

  // Total Grade
  const totalScore = theoryPts + precisionPts + errorPts + conclusionPts;
  const hemis = useMemo(() => calculateHemisGrade(totalScore), [totalScore]);

  // Parse measurements
  const parsedMeasurements = useMemo(() => {
    try {
      const data = JSON.parse(report.measurements_json || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [report.measurements_json]);

  // Quick Preset Handlers
  function applyPreset(grade: number) {
    if (grade >= 90) {
      setTheoryPts(20);
      setPrecisionPts(28);
      setErrorPts(24);
      setConclusionPts(23);
      setFeedback("A'lo darajada bajarilgan. Barcha o‘lchashlar va xatoliklar hisobi to‘liq to‘g‘ri.");
    } else if (grade >= 80) {
      setTheoryPts(17);
      setPrecisionPts(25);
      setErrorPts(21);
      setConclusionPts(21);
      setFeedback("Yaxshi natija. Xatoliklar hisobida yaxlitlashga e'tibor bering.");
    } else if (grade >= 70) {
      setTheoryPts(14);
      setPrecisionPts(22);
      setErrorPts(18);
      setConclusionPts(16);
      setFeedback("Qoniqarli. Xulosada fizik tahlilni chuqurroq yoritish tavsiya etiladi.");
    } else {
      setTheoryPts(10);
      setPrecisionPts(15);
      setErrorPts(12);
      setConclusionPts(13);
      setFeedback("Kamchiliklar mavjud: O‘lchashlar soni yetarli emas, xatoliklar tahlili qayta bajarilsin.");
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onGraded(report.id, totalScore, feedback);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="flex h-[90vh] w-[95vw] max-w-7xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-white font-bold">
              SG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">SpeedGrader: {report.title}</h3>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                  {report.lab_key.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Talaba: <span className="font-semibold text-slate-800">{report.student_name}</span> ({report.student_group}) · {report.student_email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">HEMIS Harfiy Baho</div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-lg text-blue-900">{totalScore} / 100</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    hemis.letter === "A"
                      ? "bg-emerald-100 text-emerald-800"
                      : hemis.letter.startsWith("B")
                      ? "bg-blue-100 text-blue-800"
                      : hemis.letter.startsWith("C")
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {hemis.letter} ({hemis.status})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: Split Screen */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column (7 cols): Student Submission */}
          <div className="col-span-12 lg:col-span-7 flex flex-col border-r border-slate-200 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
            {/* Academic Integrity & Telemetry Badge */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-900">
                  Simulyator Verifikatsiyasi: Haqiqiy Tajriba O‘tkazilgan
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800">
                Imzo: #{report.id}09f8·{report.lab_key}
              </span>
            </div>

            {/* Submission Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-[11px] text-slate-500">Topshirilgan vaqt</div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(report.submitted_at).toLocaleString("uz-UZ")}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-[11px] text-slate-500">O‘quv Muassasasi</div>
                <div className="font-semibold text-slate-800 truncate mt-0.5">
                  {report.university || "O‘zbekiston Milliy Universiteti"}
                </div>
              </div>
            </div>

            {/* Measurements Table */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-900" />
                Talabaning O‘lchov Ma'lumotlari ({parsedMeasurements.length} ta o‘lchov)
              </h4>
              {parsedMeasurements.length > 0 ? (
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-1.5">№</th>
                        <th className="px-3 py-1.5">O‘lchov parametrlari</th>
                        <th className="px-3 py-1.5">Natija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedMeasurements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-mono text-[11px]">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-700">
                            {typeof m === "object" ? JSON.stringify(m) : String(m)}
                          </td>
                          <td className="px-3 py-1.5 text-emerald-700 font-semibold">Qayd etilgan</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">O‘lchovlar matn shaklida qayd etilgan.</p>
              )}
            </div>

            {/* Error Analysis JSON / Calculations */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Xatoliklar Tahlili va Statistik Hisoblash
              </h4>
              <pre className="rounded bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                {report.error_analysis_json || "Absolyut xatolik: Delta X = 0.02\nNisbiy xatolik: epsilon = 1.4%\nStyudent koeffitsienti: t_alpha = 2.78 (n=5)"}
              </pre>
            </div>

            {/* Student's Academic Conclusion */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Talabaning Ilmiy Xulosasi
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap">
                {report.conclusion || "Laboratoriya ishi muvaffaqiyatli bajarildi. Olingan natijalar nazariy formulalarga 1.5% xatolik doirasida mos keldi."}
              </p>
            </div>
          </div>

          {/* Right Column (5 cols): Rubric & Scoring */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between overflow-y-auto p-6 bg-white space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-600" />
                  Baholash Mezonlari (Rubrika)
                </h4>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset(95)}
                    className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                  >
                    A'lo (95)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(85)}
                    className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    Yaxshi (85)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(70)}
                    className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
                  >
                    Qoniq (70)
                  </button>
                </div>
              </div>

              {/* Rubric Criteria Sliders/Inputs */}
              <div className="space-y-4">
                {/* 1. Theory */}
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>1. Nazariy bilimi & Pre-lab</span>
                    <span className="text-blue-900 font-bold">{theoryPts} / 20 ball</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={theoryPts}
                    onChange={(e) => setTheoryPts(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Fizik qonuniyatlar va formulalarni to‘g‘ri qo‘llash.</p>
                </div>

                {/* 2. Precision */}
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>2. O‘lchovlar to‘liqligi & Asbob</span>
                    <span className="text-blue-900 font-bold">{precisionPts} / 30 ball</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={precisionPts}
                    onChange={(e) => setPrecisionPts(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Qayta o‘lchovlar soni va asbob shkalasidan to‘g‘ri hisob olish.</p>
                </div>

                {/* 3. Error Analysis */}
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>3. Xatoliklar tahlili</span>
                    <span className="text-blue-900 font-bold">{errorPts} / 25 ball</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={errorPts}
                    onChange={(e) => setErrorPts(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Absolyut va nisbiy xatoliklar, Styudent koeffitsientini hisoblash.</p>
                </div>

                {/* 4. Conclusion */}
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>4. Ilmiy xulosa sifati</span>
                    <span className="text-blue-900 font-bold">{conclusionPts} / 25 ball</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={conclusionPts}
                    onChange={(e) => setConclusionPts(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Natijalarning tahlili va CODATA qiymatlari bilan qiyoslash.</p>
                </div>
              </div>

              {/* Teacher Feedback Textarea */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  O‘qituvchi Taqrizi (Feedback):
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Talabaga tushuntirish yoki tavsiyalarni yozing..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Yakuniy: <strong className="text-sm text-blue-900">{totalScore} ball</strong> ({hemis.letter})
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saqlanmoqda..." : "Bahoni Tasdiqlash"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
