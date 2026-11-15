"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Printer,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

interface AssignmentItem {
  id: number;
  title: string;
  lab_key: string;
  description: string;
  tolerance_pct: number;
  due_date: string | null;
  creator_name: string;
}

interface ReportItem {
  id: number;
  assignment_id: number | null;
  lab_key: string;
  title: string;
  conclusion: string;
  measurements_json: string;
  error_analysis_json: string;
  status: string;
  grade: number | null;
  admin_feedback: string;
  submitted_at: string;
  reviewed_at: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  article_content?: string | null;
  submission_type?: "report" | "file" | "article" | null;
}

const ALL_LABS = [
  { key: "metrology", label: "1. Metrologiya & Asboblar", desc: "Nonius, mikrometr, xatoliklar nazariyasi" },
  { key: "kinematics", label: "2. Kinematika & Ballistika", desc: "RK4 trayektoriya, havo qarshiligi" },
  { key: "dynamics", label: "3. Dinamika & Mayatniklar", desc: "Qiya tekislik, Kater mayatnigi, Guk qonuni" },
  { key: "statics", label: "4. Statika & Muvozanat", desc: "Kuchlar stoli, richag momentlari, polispast" },
  { key: "electromagnetism", label: "5. Elektromagnetizm", desc: "Metr ko‘prigi, MNA matritsa, KRO" },
  { key: "optics", label: "6. Geometrik & To‘lqin Optika", desc: "Linzalar, Koshi dispersiyasi, difraksiya" },
  { key: "thermodynamics", label: "7. Molekulyar & Termodinamika", desc: "Ideal gaz, adiabata, karnot sikli" },
  { key: "atomic", label: "8. Atom & Yadro Fizikasi", desc: "Fotoeffekt, Frank-Gerts, radioaktiv yemirilish" },
];

const LAB_NAMES: Record<string, string> = {
  metrology: "1. Metrologiya & Asboblar",
  kinematics: "2. Kinematika & Ballistika",
  dynamics: "3. Dinamika & Mayatniklar",
  statics: "4. Statika & Muvozanat",
  electromagnetism: "5. Elektromagnetizm",
  optics: "6. Geometrik & To‘lqin Optika",
  thermodynamics: "7. Molekulyar & Termodinamika",
  atomic: "8. Atom & Yadro Fizikasi",
};

export function StudentReportsView() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "graded" | "pending" | "revision">("all");
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { assignments: [] }
      ),
      fetch("/api/reports", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { reports: [] }
      ),
    ])
      .then(([aData, rData]) => {
        setAssignments(aData.assignments || []);
        setReports(rData.reports || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Student metrics
  const stats = useMemo(() => {
    const graded = reports.filter((r) => r.grade !== null);
    const sum = graded.reduce((acc, r) => acc + (r.grade || 0), 0);
    const avg = graded.length > 0 ? (sum / graded.length).toFixed(1) : "0";

    // unique labs passed (grade >= 60)
    const passedLabKeys = new Set(
      graded.filter((r) => (r.grade || 0) >= 60).map((r) => r.lab_key)
    );

    const revisionCount = reports.filter((r) => r.status === "needs_revision").length;
    const pendingCount = reports.filter(
      (r) => r.status === "submitted" || r.status === "reviewed"
    ).length;

    return {
      totalAssigned: assignments.length,
      totalSubmitted: reports.length,
      gradedCount: graded.length,
      avgGpa: avg,
      passedLabsCount: passedLabKeys.size,
      progressPct: Math.round((passedLabKeys.size / 8) * 100),
      revisionCount,
      pendingCount,
    };
  }, [assignments, reports]);

  const filteredReports = useMemo(() => {
    if (filter === "graded") return reports.filter((r) => r.grade !== null);
    if (filter === "pending")
      return reports.filter((r) => r.status === "submitted" || r.status === "reviewed");
    if (filter === "revision") return reports.filter((r) => r.status === "needs_revision");
    return reports;
  }, [reports, filter]);

  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
        Akademik ma&apos;lumotlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revision Notice Banner */}
      {stats.revisionCount > 0 && (
        <div className="flex items-center justify-between border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Diqqat: <strong>{stats.revisionCount} ta</strong> laboratoriya hisobotingiz ustoz tomonidan qayta ishlashga qaytarilgan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilter("revision")}
            className="underline font-semibold text-amber-900 hover:text-amber-950 cursor-pointer text-[11px]"
          >
            Ko‘rish va qayta topshirish
          </button>
        </div>
      )}

      {/* LMS Academic Progress KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">O‘rtacha Ball (GPA)</div>
          <div className="font-mono text-xl font-bold text-emerald-700">{stats.avgGpa} / 100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Baholangan: {stats.gradedCount} ta</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Laboratoriya O‘zlashtirishi</div>
          <div className="font-mono text-xl font-bold text-[#1E3A8A]">
            {stats.passedLabsCount} / 8 ta
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.progressPct}% yakunlandi</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Berilgan Topshiriqlar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{stats.totalAssigned} ta</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kutilayotgan: {stats.pendingCount} ta</div>
        </div>
        <div className="border border-slate-200 bg-white p-3 flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Akademik Ma‘lumotnoma</div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">Rasmiy Transkript</div>
          </div>
          <button
            type="button"
            onClick={() => setShowTranscript(true)}
            className="mt-2 inline-flex items-center justify-center gap-1 border border-[#1E3A8A] bg-blue-50/50 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:bg-blue-100/50 cursor-pointer"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Transkriptni ko‘rish
          </button>
        </div>
      </div>

      {/* 8-Chapter Academic Laboratory Progress Bar */}
      <section className="border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#1E3A8A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              8 ta Bosh Kurs Laboratoriyasi Bo‘yicha Taraqqiyot
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-[#1E3A8A]">
            {stats.passedLabsCount} / 8 ({stats.progressPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden bg-slate-100">
          <div
            className="h-full bg-[#1E3A8A] transition-all duration-500"
            style={{ width: `${stats.progressPct}%` }}
          />
        </div>

        {/* 8 Laboratory Badges */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
          {ALL_LABS.map((lab) => {
            const report = reports.find((r) => r.lab_key === lab.key);
            const isGraded = report?.grade !== null && report?.grade !== undefined;
            const isRevision = report?.status === "needs_revision";
            const isPending = report && !isGraded && !isRevision;

            return (
              <Link
                key={lab.key}
                href={`/labs/${lab.key}`}
                className={`flex flex-col justify-between border p-2.5 transition-colors ${
                  isGraded
                    ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                    : isRevision
                    ? "border-amber-300 bg-amber-50/50 hover:bg-amber-100/50"
                    : isPending
                    ? "border-blue-200 bg-blue-50/30 hover:bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-900 truncate">
                    {lab.label}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {lab.desc}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px]">
                  {isGraded ? (
                    <span className="font-mono font-bold text-emerald-800">
                      ✓ {report.grade} ball
                    </span>
                  ) : isRevision ? (
                    <span className="font-semibold text-amber-800 flex items-center gap-0.5">
                      <RotateCcw className="h-2.5 w-2.5" /> Qayta topshirish
                    </span>
                  ) : isPending ? (
                    <span className="text-blue-700 font-medium">Tekshiruvda</span>
                  ) : (
                    <span className="text-slate-400">Topshirilmagan</span>
                  )}
                  <span className="font-medium text-[#1E3A8A] underline">Stend →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Assigned Labs & Independent Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardList className="h-4 w-4 text-[#1E3A8A]" />
            O‘qituvchi Tomonidan Berilgan Vazifalar ({assignments.length})
          </div>
          <Link
            href="/assignments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            HEMIS Topshiriqlar & Maqola Topshirish Jadvali →
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600">
            Hozircha o‘qituvchi tomonidan biriktirilgan maxsus topshiriqlar mavjud emas.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.map((a) => {
              const matchedReport = reports.find((r) => r.assignment_id === a.id);
              const isSubmitted = Boolean(matchedReport);
              const isGraded = matchedReport?.grade !== null && matchedReport?.grade !== undefined;
              const isOverdue =
                a.due_date && new Date(a.due_date).getTime() < Date.now();

              return (
                <div
                  key={a.id}
                  className="flex flex-col justify-between border border-slate-200 bg-white p-4"
                >
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                      <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#1E3A8A]">
                        {LAB_NAMES[a.lab_key] || a.lab_key}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Xatolik: ±{a.tolerance_pct}%
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">{a.description}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                    <span className="text-slate-500">
                      Ustoz: {a.creator_name}
                      {a.due_date ? (
                        <span className={isOverdue ? "text-red-600 font-semibold ml-1" : "ml-1"}>
                          • Muddat: {a.due_date.slice(0, 10)}
                        </span>
                      ) : (
                        ""
                      )}
                    </span>

                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isGraded ? `Baholangan (${matchedReport?.grade}/100)` : "Topshirilgan (Tekshiruvda)"}
                      </span>
                    ) : (
                      <Link
                        href={`/labs/${a.lab_key}?assignmentId=${a.id}&title=${encodeURIComponent(a.title)}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Bajarish va Topshirish <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Submitted Reports */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="h-4 w-4 text-[#1E3A8A]" />
            Topshirilgan Laboratoriya Hisobotlarim ({reports.length})
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(
              [
                { id: "all", label: "Barchasi" },
                { id: "graded", label: "Baholanganlar" },
                { id: "pending", label: "Kutilayotganlar" },
                { id: "revision", label: "Qayta topshirish" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={`border px-2.5 py-1 font-medium cursor-pointer ${
                  filter === btn.id
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600">
            {filter === "all"
              ? "Hali birorta laboratoriya hisoboti yuborilmagan. Istalgan stendda o‘lchovlarni o‘tkazib hisobot yuboring."
              : "Tanlangan mezon bo‘yicha hisobotlar mavjud emas."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((rep) => {
              let count = 0;
              try {
                const parsed = JSON.parse(rep.measurements_json);
                if (Array.isArray(parsed)) count = parsed.length;
              } catch {
                count = 0;
              }

              const isRevision = rep.status === "needs_revision";

              return (
                <div
                  key={rep.id}
                  className={`border bg-white p-4 transition-colors ${
                    isRevision ? "border-amber-400 bg-amber-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-[#1E3A8A]">
                          #{rep.id}
                        </span>
                        <span>{LAB_NAMES[rep.lab_key] || rep.lab_key}</span>
                        <span>• {rep.submitted_at.slice(0, 16).replace("T", " ")}</span>
                        <span>• {count} ta o‘lchov qaydnomasi</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{rep.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRevision ? (
                        <span className="inline-flex items-center gap-1 border border-amber-400 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Qayta topshirish talab qilinadi
                        </span>
                      ) : rep.grade !== null ? (
                        <span className="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Baho: {rep.grade}/100
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                          <Clock className="h-3.5 w-3.5" />
                          Tekshirilmoqda
                        </span>
                      )}
                    </div>
                  </div>

                  {rep.file_url && (
                    <div className="mt-2 flex items-center justify-between border border-blue-200 bg-blue-50/50 p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-[#1E3A8A]" />
                        <span className="font-semibold text-slate-900">
                          {rep.file_name || "Biriktirilgan fayl"}
                        </span>
                        {rep.file_size ? (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({(rep.file_size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        ) : null}
                      </div>
                      <a
                        href={rep.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-[#1E3A8A] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-50"
                      >
                        Faylni ochish / Yuklash
                      </a>
                    </div>
                  )}

                  {rep.article_content ? (
                    <div className="mt-2 border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800">
                      <strong className="text-[#1E3A8A] block mb-1">
                        Ilmiy Maqola / Mustaqil ish matni:
                      </strong>
                      <div className="whitespace-pre-wrap max-h-36 overflow-y-auto bg-white p-2 border border-slate-100 font-mono text-[11px]">
                        {rep.article_content}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700">
                      <strong className="text-slate-900">Talaba xulosasi:</strong> {rep.conclusion}
                    </div>
                  )}

                  {rep.admin_feedback && (
                    <div className="mt-2 border border-blue-200 bg-blue-50/60 p-2.5 text-xs text-slate-800">
                      <strong className="text-[#1E3A8A]">Ustoz taqrizi:</strong>{" "}
                      {rep.admin_feedback}
                    </div>
                  )}

                  {isRevision && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/labs/${rep.lab_key}?retest=${rep.id}&title=${encodeURIComponent(rep.title)}`}
                        className="inline-flex items-center gap-1.5 bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Laboratoriyaga o‘tib qayta topshirish
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Official Academic Transcript Modal */}
      {showTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-2xl border border-slate-300 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#1E3A8A]" />
                <h2 className="text-base font-bold text-slate-900">
                  Akademik Baholar Transkripti & Ma‘lumotnoma
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 border border-slate-200 bg-slate-50 p-3">
                <div>
                  <span className="text-slate-500">Fan:</span>{" "}
                  <strong className="text-slate-900">Umumiy Fizika (Virtual Laboratoriya)</strong>
                </div>
                <div>
                  <span className="text-slate-500">O‘rtacha Baho (GPA):</span>{" "}
                  <strong className="text-emerald-700 font-mono text-sm">{stats.avgGpa} / 100</strong>
                </div>
                <div>
                  <span className="text-slate-500">Bajarilgan Kurslar:</span>{" "}
                  <strong className="text-slate-900">{stats.passedLabsCount} / 8 ta laboratoriya</strong>
                </div>
                <div>
                  <span className="text-slate-500">Berilgan sana:</span>{" "}
                  <strong className="text-slate-900">{new Date().toLocaleDateString("uz-UZ")}</strong>
                </div>
              </div>

              <div className="border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">№</th>
                      <th className="p-2">Laboratoriya Kursi</th>
                      <th className="p-2 text-center">Baho</th>
                      <th className="p-2 text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ALL_LABS.map((l, i) => {
                      const rep = reports.find((r) => r.lab_key === l.key);
                      const g = rep?.grade;
                      return (
                        <tr key={l.key}>
                          <td className="p-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-2 font-medium text-slate-900">{l.label}</td>
                          <td className="p-2 text-center font-mono font-bold">
                            {g !== null && g !== undefined ? `${g} ball` : "-"}
                          </td>
                          <td className="p-2 text-center">
                            {g !== null && g !== undefined && g >= 60 ? (
                              <span className="text-emerald-700 font-semibold">Hisoblandi</span>
                            ) : rep ? (
                              <span className="text-blue-700">Tekshiruvda</span>
                            ) : (
                              <span className="text-slate-400">Topshirilmagan</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-[10px] text-slate-400 font-mono">
                Tasdiq ID: FIZIKALAB-TR-{Date.now().toString(36).toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Chop etish (Print)
                </button>
                <button
                  type="button"
                  onClick={() => setShowTranscript(false)}
                  className="border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
