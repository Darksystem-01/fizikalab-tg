"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileCode,
  FileText,
  FileUp,
  FlaskConical,
  HelpCircle,
  Info,
  PenTool,
  Printer,
  RotateCcw,
  Send,
  Upload,
  X,
} from "lucide-react";

export interface AssignmentItem {
  id: number;
  title: string;
  lab_key: string;
  description: string;
  target_params_json?: string;
  tolerance_pct: number;
  group_name: string | null;
  assignment_type: "lab" | "independent";
  lesson_type?: "laboratoriya" | "mustaqil_ish" | "maqola" | "amaliyot" | "referat";
  max_score?: number;
  rubric_json?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_by: number;
  creator_name: string;
  due_date: string | null;
  created_at: string;
}

export interface ReportItem {
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

export function HemisAssignmentsView() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Submit Modal state
  const [activeAssignment, setActiveAssignment] = useState<AssignmentItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ url: string; name: string; size: number } | null>(null);

  // Article writing state
  const [articleTitle, setArticleTitle] = useState("");
  const [articleAbstract, setArticleAbstract] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [articleConclusion, setArticleConclusion] = useState("");
  const [articleRefs, setArticleRefs] = useState("");

  // Rubric Modal state
  const [activeRubricAssignment, setActiveRubricAssignment] = useState<AssignmentItem | null>(null);

  // View Submitted Details Modal state
  const [viewReport, setViewReport] = useState<ReportItem | null>(null);

  const loadData = () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute HEMIS KPI metrics
  const kpis = useMemo(() => {
    // Total max score from all assignments
    const maxScoreSum = assignments.reduce((acc, a) => acc + (a.max_score || 5.0), 0) || 34.0;

    // Total earned score from graded submissions
    const earnedScoreSum = reports.reduce((acc, r) => {
      if (r.grade !== null && r.grade !== undefined) {
        // Find matching assignment to scale grade if needed
        const match = assignments.find((a) => a.id === r.assignment_id);
        const maxScore = match?.max_score || 5.0;
        // If grade is on 0-100 scale, normalize to maxScore
        const actualBall = r.grade > maxScore ? (r.grade / 100) * maxScore : r.grade;
        return acc + actualBall;
      }
      return acc;
    }, 0);

    const masteryPct = maxScoreSum > 0 ? (earnedScoreSum / maxScoreSum) * 100 : 0;

    // Current Grade on 5-point university scale:
    // 86-100% => 5 (A'lo)
    // 71-85%  => 4 (Yaxshi)
    // 55-70%  => 3 (Qoniqarli)
    // < 55%   => 2 (Qoniqarsiz)
    let currentGrade = "2 (Qoniqarsiz)";
    let gradeBadgeColor = "text-red-700 bg-red-50 border-red-200";

    if (masteryPct >= 86) {
      currentGrade = "5 (A'lo)";
      gradeBadgeColor = "text-emerald-800 bg-emerald-50 border-emerald-300";
    } else if (masteryPct >= 71) {
      currentGrade = "4 (Yaxshi)";
      gradeBadgeColor = "text-blue-800 bg-blue-50 border-blue-300";
    } else if (masteryPct >= 55) {
      currentGrade = "3 (Qoniqarli)";
      gradeBadgeColor = "text-amber-800 bg-amber-50 border-amber-300";
    }

    return {
      earnedScore: Number(earnedScoreSum.toFixed(1)),
      maxScore: Number(maxScoreSum.toFixed(1)),
      masteryPct: Number(masteryPct.toFixed(1)),
      currentGrade,
      gradeBadgeColor,
      totalAssignments: assignments.length,
      submittedCount: reports.length,
    };
  }, [assignments, reports]);

  const handleOpenSubmit = (a: AssignmentItem) => {
    setActiveAssignment(a);
    setUploadFile(null);
    setUploadedFileMeta(null);
    setArticleTitle(a.title);
    setArticleAbstract("");
    setArticleBody("");
    setArticleConclusion("");
    setArticleRefs("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        alert("Fayl hajmi 50 MB dan oshmasligi kerak!");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!activeAssignment) return;
    setSubmitting(true);
    setNotice(null);

    try {
      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;

      // 1. If file selected, upload via /api/upload
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          alert(errData.error || "Fayl yuklashda xatolik yuz berdi.");
          setSubmitting(false);
          return;
        }

        const uploaded = await uploadRes.json();
        fileUrl = uploaded.url;
        fileName = uploaded.fileName;
        fileSize = uploaded.fileSize;
      }

      // 2. Prepare article or combined content
      const fullArticleContent = [
        articleTitle ? `# ${articleTitle}` : "",
        articleAbstract ? `### Annotatsiya / Kirish\n${articleAbstract}` : "",
        articleBody ? `### Asosiy Qism & Tahlil\n${articleBody}` : "",
        articleConclusion ? `### Ilmiy Xulosa\n${articleConclusion}` : "",
        articleRefs ? `### Adabiyotlar Ro'yxati\n${articleRefs}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      if (!fileUrl && !fullArticleContent.trim()) {
        alert("Iltimos, topshiriq uchun fayl yuklang YOKI maqola matnini yozing.");
        setSubmitting(false);
        return;
      }

      // 3. Submit report / article
      const submitRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          labKey: activeAssignment.lab_key,
          title: articleTitle.trim() || activeAssignment.title,
          conclusion: articleConclusion.trim() || fullArticleContent || "Topshiriq yuborildi",
          measurements: [],
          errorAnalysis: {},
          fileUrl,
          fileName,
          fileSize,
          articleContent: fullArticleContent,
          submissionType: fullArticleContent ? "article" : "file",
        }),
      });

      if (submitRes.ok) {
        setNotice({
          type: "ok",
          msg: "Topshiriq / Ilmiy maqola muvaffaqiyatli qabul qilindi va tekshirishga yuborildi!",
        });
        setActiveAssignment(null);
        loadData();
      } else {
        const err = await submitRes.json();
        setNotice({ type: "err", msg: err.error || "Topshirishda xatolik yuz berdi." });
      }
    } catch {
      setNotice({ type: "err", msg: "Server bilan bog'lanishda xatolik." });
    } finally {
      setSubmitting(false);
    }
  };

  const getLessonTypeBadge = (type?: string) => {
    switch (type) {
      case "maqola":
        return {
          label: "Ilmiy maqola yozish",
          className: "bg-purple-50 text-purple-800 border-purple-200",
        };
      case "mustaqil_ish":
        return {
          label: "Mustaqil ish",
          className: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "amaliyot":
        return {
          label: "Amaliy mashg'ulot",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "referat":
        return {
          label: "Referat / Taqriz",
          className: "bg-indigo-50 text-indigo-800 border-indigo-200",
        };
      default:
        return {
          label: "Laboratoriya ishi",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
        HEMIS topshiriqlar jurnali yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`flex items-center gap-2 border px-4 py-3 text-xs font-semibold ${
            notice.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {notice.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* HEMIS Top KPI Cards (Screenshot 4 & 5 alignment) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: To'plangan ball */}
        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            To&apos;plangan Ball
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-extrabold text-blue-900">
              {kpis.earnedScore}
            </span>
            <span className="text-xs text-slate-400">ball</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Jami {kpis.submittedCount} ta topshiriqdan
          </div>
        </div>

        {/* Card 2: Maksimal ball */}
        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Maksimal Ball
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-extrabold text-slate-800">
              {kpis.maxScore}
            </span>
            <span className="text-xs text-slate-400">ball</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">Semestr o&apos;quv rejasida</div>
        </div>

        {/* Card 3: O'zlashtirish foizi */}
        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            O&apos;zlashtirish
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-extrabold text-blue-900">
              {kpis.masteryPct}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-slate-100">
            <div
              className="h-full bg-blue-900 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.masteryPct)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Joriy bahosi */}
        <div className="border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Hozirgi Bahosi
            </div>
            <div className="mt-1">
              <span
                className={`inline-block border px-2.5 py-0.5 text-xs font-bold ${kpis.gradeBadgeColor}`}
              >
                {kpis.currentGrade}
              </span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Milliy 5 ballik reyting tizimi
          </div>
        </div>
      </div>

      {/* HEMIS Assignments Table */}
      <div className="border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Topshiriqlar Ro&apos;yxati ({assignments.length} ta)
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Guruh: 310-24 DIF
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-4 py-3">Dars turi</th>
                <th className="px-4 py-3">O&apos;qituvchi</th>
                <th className="px-4 py-3">Topshiriq va Uslubiy yo&apos;riqnoma</th>
                <th className="px-4 py-3">Topshiriq muddati</th>
                <th className="px-4 py-3 text-center">Ball</th>
                <th className="px-4 py-3 text-center">Maks</th>
                <th className="px-4 py-3 text-right">Fayl / Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {assignments.map((a) => {
                const report = reports.find((r) => r.assignment_id === a.id);
                const badge = getLessonTypeBadge(a.lesson_type);
                const isOverdue = a.due_date && new Date(a.due_date).getTime() < Date.now();
                const isGraded = report?.grade !== null && report?.grade !== undefined;
                const isSubmitted = Boolean(report);
                const isRevision = report?.status === "needs_revision";

                return (
                  <tr key={a.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Column 1: DARS TURI */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Column 2: O'QITUVCHI */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {a.creator_name || "Dots. Alimuradov Lochinbek"}
                      </div>
                      <div className="text-[10px] text-slate-400">Umumiy fizika kafedrasi</div>
                    </td>

                    {/* Column 3: TOPSHIRIQ NOMI VA YO'RIQNOMA */}
                    <td className="px-4 py-3.5 align-top max-w-md">
                      <div className="font-bold text-slate-900 leading-snug">{a.title}</div>
                      <div className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {a.description}
                      </div>
                      {a.attachment_url && (
                        <div className="mt-2">
                          <a
                            href={a.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            Yo&apos;riqnoma faylini yuklab olish ({a.attachment_name || "PDF"})
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Column 4: TOPSHIRIQ MUDDATI */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap font-mono text-[11px]">
                      {a.due_date ? (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue && !isSubmitted ? "text-red-600 font-bold" : "text-slate-600"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {a.due_date.slice(0, 10)} 23:59:59
                        </span>
                      ) : (
                        <span className="text-slate-400">Cheklovsiz</span>
                      )}
                    </td>

                    {/* Column 5: BALL / HOLAT */}
                    <td className="px-4 py-3.5 align-top text-center font-mono">
                      {isGraded ? (
                        <span className="inline-block rounded-xs bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                          {report.grade} ball
                        </span>
                      ) : isRevision ? (
                        <span className="inline-block rounded-xs bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                          Qayta ishlashda
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-block rounded-xs bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 border border-blue-200">
                          Tekshiruvda
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Baholanmagan</span>
                      )}
                    </td>

                    {/* Column 6: MAKS / ME'ZON */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800">
                        {a.max_score || 5.0} ball
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveRubricAssignment(a)}
                        className="mt-1 text-[10px] font-medium text-blue-900 underline hover:text-blue-950 cursor-pointer block mx-auto"
                      >
                        Me&apos;zon
                      </button>
                    </td>

                    {/* Column 7: FAYL / TOPSHIRISH */}
                    <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                      {isSubmitted ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewReport(report || null)}
                            className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            Ko&apos;rish
                          </button>
                          {isRevision && (
                            <button
                              type="button"
                              onClick={() => handleOpenSubmit(a)}
                              className="inline-flex items-center gap-1 border border-amber-400 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              Qayta topshirish
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSubmit(a)}
                          className="inline-flex items-center gap-1 bg-blue-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-950 cursor-pointer shadow-2xs"
                        >
                          <Upload className="h-3 w-3" />
                          Topshirish
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Mashqlarni Yuborish / Maqola Topshirish" Modal (HEMIS Screenshot 5 alignment) */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-900 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Mashqlarni Yuborish / Maqola Topshirish
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAssignment(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Selected Assignment Info */}
              <div className="border border-slate-200 bg-slate-50 p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Topshiriq nomi
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {activeAssignment.title}
                </span>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Maksimal ball: {activeAssignment.max_score || 5.0} ball</span>
                  <span>•</span>
                  <span>Dars turi: {getLessonTypeBadge(activeAssignment.lesson_type).label}</span>
                </div>
              </div>

              {/* HEMIS Blue Information Notice Block (from Screenshot 5) */}
              <div className="rounded-xs border border-blue-200 bg-blue-50/70 p-3.5 text-blue-900">
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold text-blue-950">
                      Maks. fayl hajmi: 50 MB; Turi: jpg, png, doc, docx, pdf, ppt, pptx, zip, rar.
                    </p>
                    <p className="mt-1 text-blue-800">
                      Agar ilmiy maqola yoki mustaqil ish tayyorlagan bo&apos;lsangiz, tayyor faylni
                      quyidagi tugma orqali yuklashingiz YOKI maqola matnini bevosita quyidagi matn
                      muharririga yozib yuborishingiz mumkin.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. File Upload section */}
              <div className="border border-slate-200 bg-white p-3.5 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Fayl yuklash (PDF, DOCX, ZIP, PPTX va h.k.)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.doc,.docx,.pdf,.ppt,.pptx,.zip,.rar"
                  className="w-full border border-slate-300 p-2 text-xs text-slate-700 file:mr-3 file:border-0 file:bg-blue-900 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-950 cursor-pointer"
                />
                {uploadFile && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 border border-slate-200 font-mono">
                    <span>Tanlangan fayl: <strong>{uploadFile.name}</strong></span>
                    <span>{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
              </div>

              {/* 2. Direct Article / Text Editor section */}
              <div className="border border-slate-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    2. Maqola matnini bevosita yozish (Ilmiy maqola / Mustaqil ish)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Ixtiyoriy</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Maqola sarlavhasi
                  </label>
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="Masalan: Gravitatsion maydon va relyativistik mexanika tahlili"
                    className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Annotatsiya / Kirish qismi
                  </label>
                  <textarea
                    rows={2}
                    value={articleAbstract}
                    onChange={(e) => setArticleAbstract(e.target.value)}
                    placeholder="Maqolaning qisqacha mazmuni va tadqiqot dolzarbligi..."
                    className="w-full border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Asosiy qism (Nazariy apparat, formulalar, hisob-kitoblar va tahlil)
                  </label>
                  <textarea
                    rows={4}
                    value={articleBody}
                    onChange={(e) => setArticleBody(e.target.value)}
                    placeholder="Ilmiy tahlil, formulalar, tajriba natijalari..."
                    className="w-full border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ilmiy xulosa
                    </label>
                    <textarea
                      rows={2}
                      value={articleConclusion}
                      onChange={(e) => setArticleConclusion(e.target.value)}
                      placeholder="Olingan natijalarning ilmiy xulosasi..."
                      className="w-full border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Foydalanilgan adabiyotlar
                    </label>
                    <textarea
                      rows={2}
                      value={articleRefs}
                      onChange={(e) => setArticleRefs(e.target.value)}
                      placeholder="1. Sultonov O. Umumiy fizika kursi, 2024..."
                      className="w-full border border-slate-300 p-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setActiveAssignment(null)}
                className="border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSubmitAssignment}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 bg-blue-900 px-5 py-1.5 text-xs font-bold text-white hover:bg-blue-950 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Jo'natilmoqda..." : "Jo'natish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rubric Criteria Modal */}
      {activeRubricAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-900 px-4 py-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider">
                Baholash Mezonlari (Maks: {activeRubricAssignment.max_score || 5.0} ball)
              </span>
              <button
                type="button"
                onClick={() => setActiveRubricAssignment(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="font-semibold text-slate-900">
                {activeRubricAssignment.title}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200">
                {(() => {
                  let parsedRubric: { criterion: string; weight: number }[] = [];
                  try {
                    parsedRubric = JSON.parse(activeRubricAssignment.rubric_json || "[]");
                  } catch {
                    parsedRubric = [];
                  }

                  if (parsedRubric.length === 0) {
                    parsedRubric = [
                      { criterion: "Nazariy asoslar va tushunchalar", weight: 30 },
                      { criterion: "Amaliy o'lchovlar / Maqola asosiy qismi", weight: 40 },
                      { criterion: "Ilmiy xulosalar va tahlil", weight: 20 },
                      { criterion: "Rasmiylashtirish va adabiyotlar", weight: 10 },
                    ];
                  }

                  return parsedRubric.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5">
                      <span className="text-slate-800">{item.criterion}</span>
                      <span className="font-mono font-bold text-blue-900">
                        {item.weight}% (
                        {(((activeRubricAssignment.max_score || 5.0) * item.weight) / 100).toFixed(1)} ball)
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <button
                type="button"
                onClick={() => setActiveRubricAssignment(null)}
                className="bg-blue-900 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-950 cursor-pointer"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Submitted Report Details Modal */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-900 px-4 py-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider">
                Topshirilgan Ish: {viewReport.title}
              </span>
              <button
                type="button"
                onClick={() => setViewReport(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-500">Holati:</span>{" "}
                  <span className="font-bold text-slate-900 uppercase">{viewReport.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Qo&apos;yilgan ball:</span>{" "}
                  <span className="font-mono font-bold text-emerald-700">
                    {viewReport.grade !== null ? `${viewReport.grade} ball` : "Baholanmagan"}
                  </span>
                </div>
              </div>

              {viewReport.admin_feedback && (
                <div className="border border-blue-200 bg-blue-50/50 p-3">
                  <span className="font-bold text-blue-950 block mb-1">
                    Ustoz taqrizi (Feedback):
                  </span>
                  <p className="text-blue-900">{viewReport.admin_feedback}</p>
                </div>
              )}

              {viewReport.file_url && (
                <div className="border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">
                        {viewReport.file_name || "Biriktirilgan fayl"}
                      </div>
                      {viewReport.file_size && (
                        <div className="text-[10px] text-slate-400">
                          {(viewReport.file_size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={viewReport.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border border-blue-900 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50"
                  >
                    <Download className="h-3 w-3" />
                    Yuklab olish
                  </a>
                </div>
              )}

              {viewReport.article_content && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">
                    Maqola / Mustaqil ish matni:
                  </span>
                  <div className="border border-slate-200 bg-slate-50 p-3 whitespace-pre-wrap font-sans leading-relaxed text-slate-800">
                    {viewReport.article_content}
                  </div>
                </div>
              )}

              {!viewReport.article_content && viewReport.conclusion && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Xulosa:</span>
                  <p className="border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                    {viewReport.conclusion}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <button
                type="button"
                onClick={() => setViewReport(null)}
                className="bg-blue-900 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-950 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
