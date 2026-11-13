"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Clock, FileText } from "lucide-react";

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
}

const LAB_NAMES: Record<string, string> = {
  metrology: "1. Metrologiya & Asboblar",
  kinematics: "2. Kinematika & Ballistika",
  dynamics: "3. Dinamika & Mayatniklar",
  statics: "4. Statika & Muvozanat",
  electromagnetism: "5. Elektromagnetizm",
  optics: "6. Geometrik & To'lqin Optika",
  thermodynamics: "7. Molekulyar & Termodinamika",
  atomic: "8. Atom & Yadro Fizikasi",
};

export function StudentReportsView() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => (r.ok ? r.json() : { assignments: [] })),
      fetch("/api/reports").then((r) => (r.ok ? r.json() : { reports: [] })),
    ])
      .then(([aData, rData]) => {
        setAssignments(aData.assignments || []);
        setReports(rData.reports || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
        Ma&apos;lumotlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assigned Labs */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClipboardList className="h-4 w-4 text-[#1E3A8A]" />
          O&apos;qituvchi (Administrator) Tomonidan Berilgan Laboratoriya Topshiriqlari
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex flex-col justify-between border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-[#1E3A8A]">
                    {LAB_NAMES[a.lab_key] || a.lab_key}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Ruxsat etilgan xatolik: ±{a.tolerance_pct}%
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{a.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                <span className="text-slate-500">
                  Ustoz: {a.creator_name}
                  {a.due_date ? ` • Muddat: ${a.due_date.slice(0, 10)}` : ""}
                </span>
                <Link
                  href={`/labs/${a.lab_key}`}
                  className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A] hover:underline"
                >
                  Stendga o&apos;tish <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submitted Reports */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileText className="h-4 w-4 text-[#1E3A8A]" />
          Topshirilgan Laboratoriya Hisobotlarim ({reports.length})
        </div>

        {reports.length === 0 ? (
          <div className="border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600">
            Hali birorta laboratoriya hisoboti yuborilmagan. Istalgan laboratoriya stendida
            o&apos;lchovlarni qayd etib, &quot;Hisobotni Bazaga Yuborish&quot; tugmasini bosing.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              let count = 0;
              try {
                const parsed = JSON.parse(rep.measurements_json);
                if (Array.isArray(parsed)) count = parsed.length;
              } catch {
                count = 0;
              }
              return (
                <div key={rep.id} className="border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-[#1E3A8A]">
                          #{rep.id}
                        </span>
                        <span>{LAB_NAMES[rep.lab_key] || rep.lab_key}</span>
                        <span>• {rep.submitted_at.slice(0, 16).replace("T", " ")}</span>
                        <span>• {count} ta o&apos;lchov qaydnomasi</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{rep.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.grade !== null ? (
                        <span className="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Baho: {rep.grade}/100
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <Clock className="h-3.5 w-3.5" />
                          Tekshirilmoqda
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700">
                    <strong className="text-slate-900">Talaba xulosasi:</strong> {rep.conclusion}
                  </div>

                  {rep.admin_feedback && (
                    <div className="mt-2 border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-slate-800">
                      <strong className="text-[#1E3A8A]">Ustoz taqrizi:</strong>{" "}
                      {rep.admin_feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
