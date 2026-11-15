"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardPlus,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FolderPlus,
  GraduationCap,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";

interface TeacherOverviewData {
  groups: {
    id: number;
    name: string;
    university: string;
    faculty: string;
    description: string;
    teacher_name: string;
    created_at: string;
  }[];
  students: {
    id: number;
    full_name: string;
    email: string;
    student_group: string;
    university: string;
    faculty: string;
    is_active: number;
    is_banned: number;
    created_at: string;
  }[];
  assignments: {
    id: number;
    title: string;
    lab_key: string;
    description: string;
    tolerance_pct: number;
    group_name: string | null;
    assignment_type: "lab" | "independent";
    lesson_type?: "laboratoriya" | "mustaqil_ish" | "maqola" | "amaliyot" | "referat";
    max_score?: number;
    rubric_json?: string;
    attachment_url?: string;
    attachment_name?: string;
    creator_name: string;
    due_date: string | null;
  }[];
  reports: {
    id: number;
    assignment_id?: number | null;
    lab_key: string;
    title: string;
    conclusion: string;
    measurements_json: string;
    error_analysis_json: string;
    status: string;
    grade: number | null;
    admin_feedback: string;
    submitted_at: string;
    file_url?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    article_content?: string | null;
    submission_type?: "report" | "file" | "article" | null;
    student_name: string;
    student_email: string;
    student_group: string;
    university: string;
    faculty: string;
  }[];
}

const LAB_KEYS = [
  { key: "metrology", label: "1. Metrologiya", short: "M-1" },
  { key: "kinematics", label: "2. Kinematika", short: "K-2" },
  { key: "dynamics", label: "3. Dinamika", short: "D-3" },
  { key: "statics", label: "4. Statika", short: "S-4" },
  { key: "electromagnetism", label: "5. EM", short: "EM-5" },
  { key: "optics", label: "6. Optika", short: "O-6" },
  { key: "thermodynamics", label: "7. Termodinamika", short: "T-7" },
  { key: "atomic", label: "8. Atom/Yadro", short: "A-8" },
];

const FEEDBACK_TEMPLATES = [
  "O‘lchovlar va statistik hisob-kitoblar to‘g‘ri bajarilgan. Xulosangiz asoslangan. Barakalla!",
  "Tajriba o‘tkazilgan, ammo xatoliklar tahlilida noaniqlik bor. Formulalarni tekshiring.",
  "Asbobning nol xatosi va standart og‘ish hisobga olinmagan. Qaytadan hisoblang.",
  "Xulosa qismida ilmiy dalillar kam. Tajriba grafigini tahlil qilib, qayta topshiring.",
];

export function TeacherDashboard() {
  const [tab, setTab] = useState<"groups" | "assignments" | "reports" | "gradebook">("groups");
  const [data, setData] = useState<TeacherOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Selected group for filtering
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Reports status filter
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "pending" | "graded" | "revision">("all");

  // New group form
  const [grpName, setGrpName] = useState("");
  const [grpUniv, setGrpUniv] = useState("");
  const [grpFaculty, setGrpFaculty] = useState("");
  const [grpDesc, setGrpDesc] = useState("");

  // New assignment form
  const [asTitle, setAsTitle] = useState("");
  const [asLabKey, setAsLabKey] = useState("metrology");
  const [asType, setAsType] = useState<"lab" | "independent">("independent");
  const [asLessonType, setAsLessonType] = useState<"laboratoriya" | "mustaqil_ish" | "maqola" | "amaliyot" | "referat">("mustaqil_ish");
  const [asMaxScore, setAsMaxScore] = useState("5.0");
  const [asGroup, setAsGroup] = useState("");
  const [asDesc, setAsDesc] = useState("");
  const [asTolerance, setAsTolerance] = useState("5");
  const [asDueDate, setAsDueDate] = useState("");

  // Grading state
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/overview", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as TeacherOverviewData;
        setData(json);
        setSelectedGroupName((prev) => prev || json.groups[0]?.name || "");
        const gInit: Record<number, string> = {};
        const fInit: Record<number, string> = {};
        json.reports.forEach((r) => {
          gInit[r.id] = r.grade !== null ? String(r.grade) : "90";
          fInit[r.id] = r.admin_feedback || "";
        });
        setGrades(gInit);
        setFeedbacks(fInit);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 10);
    return () => clearTimeout(timer);
  }, [loadData]);

  const groupStudents = useMemo(() => {
    if (!data) return [];
    let list = selectedGroupName
      ? data.students.filter(
          (s) => s.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
        )
      : data.students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.student_group.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, selectedGroupName, searchQuery]);

  const groupReports = useMemo(() => {
    if (!data) return [];
    let list = selectedGroupName
      ? data.reports.filter(
          (r) => r.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
        )
      : data.reports;

    if (reportStatusFilter === "pending") {
      list = list.filter((r) => r.status === "submitted" || r.status === "reviewed");
    } else if (reportStatusFilter === "graded") {
      list = list.filter((r) => r.status === "graded" && r.grade !== null);
    } else if (reportStatusFilter === "revision") {
      list = list.filter((r) => r.status === "needs_revision");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.student_group.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, selectedGroupName, reportStatusFilter, searchQuery]);

  // Overall Group KPI
  const groupStats = useMemo(() => {
    if (!data) return { totalStudents: 0, totalReports: 0, gradedCount: 0, avgGpa: "0" };
    const relevantStudents = selectedGroupName
      ? data.students.filter(
          (s) => s.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
        )
      : data.students;
    const relevantReports = selectedGroupName
      ? data.reports.filter(
          (r) => r.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
        )
      : data.reports;
    const graded = relevantReports.filter((r) => r.grade !== null);
    const sum = graded.reduce((acc, r) => acc + (r.grade || 0), 0);
    const avg = graded.length > 0 ? (sum / graded.length).toFixed(1) : "0";

    return {
      totalStudents: relevantStudents.length,
      totalReports: relevantReports.length,
      gradedCount: graded.length,
      avgGpa: avg,
    };
  }, [data, selectedGroupName]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/teacher/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: grpName,
        university: grpUniv,
        faculty: grpFaculty,
        description: grpDesc,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setNotice({ type: "ok", text: `Yangi guruh "${grpName}" muvaffaqiyatli ochildi.` });
      const createdName = grpName.trim();
      setSelectedGroupName(createdName);
      setGrpName("");
      setGrpUniv("");
      setGrpFaculty("");
      setGrpDesc("");
      // Immediate optimistic update
      setData((prev) =>
        prev
          ? {
              ...prev,
              groups: [
                {
                  id: json.id || Date.now(),
                  name: createdName,
                  university: grpUniv,
                  faculty: grpFaculty,
                  description: grpDesc,
                  teacher_name: "Siz",
                  created_at: new Date().toISOString(),
                },
                ...prev.groups,
              ],
            }
          : prev
      );
      void loadData();
    } else {
      setNotice({ type: "err", text: json.error || "Guruh yaratib bo'lmadi." });
    }
  }

  async function deleteGroup(id: number, name: string) {
    setNotice(null);
    const res = await fetch(`/api/teacher/groups?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotice({ type: "ok", text: `Guruh "${name}" o'chirildi.` });
      if (selectedGroupName === name) setSelectedGroupName("");
      void loadData();
    } else {
      const json = await res.json();
      setNotice({ type: "err", text: json.error || "Guruhni o'chirishda xatolik." });
    }
  }

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: asTitle,
        labKey: asLabKey,
        assignmentType: asType,
        lessonType: asLessonType,
        maxScore: Number(asMaxScore || (asLessonType === "maqola" ? 10 : 5)),
        groupName: asGroup || null,
        description: asDesc,
        tolerancePct: Number(asTolerance) || 5,
        dueDate: asDueDate || null,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setNotice({ type: "ok", text: `Topshiriq (#${json.id}) e'lon qilindi va guruhga biriktirildi.` });
      setAsTitle("");
      setAsDesc("");
      void loadData();
    } else {
      setNotice({ type: "err", text: json.error || "Topshiriq yaratishda xatolik." });
    }
  }

  async function submitGrade(reportId: number, status: "graded" | "needs_revision" = "graded") {
    setNotice(null);
    const targetRep = data?.reports.find((r) => r.id === reportId);
    const defaultGrade = targetRep?.grade !== null && targetRep?.grade !== undefined ? String(targetRep.grade) : "90";
    const gradeNum = Number(grades[reportId] ?? defaultGrade);
    const feedbackText = feedbacks[reportId] ?? (targetRep?.admin_feedback || "");

    const res = await fetch(`/api/teacher/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade: status === "needs_revision" ? null : gradeNum,
        status,
        adminFeedback: feedbackText,
      }),
    });
    if (res.ok) {
      setNotice({
        type: "ok",
        text:
          status === "needs_revision"
            ? `Hisobot #${reportId} talabaga qayta ishlash uchun qaytarildi.`
            : `Hisobot #${reportId} baholandi (${gradeNum}/100 ball).`,
      });
      void loadData();
    } else {
      const json = await res.json();
      setNotice({ type: "err", text: json.error || "Baholashda xatolik." });
    }
  }

  function exportVedomostCsv() {
    if (!data) return;
    const header = [
      "№",
      "Talaba F.I.Sh",
      "Akademik Guruh",
      "OTM / Universitet",
      ...LAB_KEYS.map((l) => l.label),
      "O'rtacha Ball (GPA)",
      "Bajarilgan Laboratoriyalar (8 dan)",
      "O'zlashtirish Foizi",
    ];

    const rows = groupStudents.map((st, idx) => {
      const stReports = data.reports.filter((r) => r.student_email === st.email);
      const gradesList: number[] = [];
      const labCells = LAB_KEYS.map((lk) => {
        const r = stReports.find((rep) => rep.lab_key === lk.key);
        if (r && r.grade !== null) {
          gradesList.push(r.grade);
          return String(r.grade);
        }
        if (r && r.status === "needs_revision") return "Qayta topshirish";
        if (r) return "Tekshiruvda";
        return "-";
      });
      const avg = gradesList.length > 0 ? (gradesList.reduce((a, b) => a + b, 0) / gradesList.length).toFixed(1) : "-";
      const progress = `${gradesList.length}/8 (${((gradesList.length / 8) * 100).toFixed(0)}%)`;

      return [
        idx + 1,
        `"${st.full_name.replace(/"/g, '""')}"`,
        `"${st.student_group}"`,
        `"${st.university}"`,
        ...labCells,
        avg,
        gradesList.length,
        progress,
      ];
    });

    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `FizikaLab_Vedomost_${selectedGroupName || "Barcha"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && !data) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
        Ustoz LMS boshqaruv paneli yuklanmoqda...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Mening guruhlarim</div>
          <div className="font-mono text-xl font-bold text-[#1E3A8A]">{data.groups.length} ta</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Guruh talabalari</div>
          <div className="font-mono text-xl font-bold text-slate-900">{groupStats.totalStudents} nafar</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Topshiriqlar / Lablar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{data.assignments.length} ta</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">O‘rtacha o‘zlashtirish (GPA)</div>
          <div className="font-mono text-xl font-bold text-emerald-700">{groupStats.avgGpa} / 100</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "groups", label: "Guruhlar & Talabalar", icon: Users },
            { id: "gradebook", label: "Akademik Jurnal (Vedomost)", icon: FileSpreadsheet },
            { id: "assignments", label: "Topshiriq & Mustaqil Ish", icon: ClipboardPlus },
            { id: "reports", label: "Hisobotlarni Baholash", icon: FileCheck2 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                  tab === t.id
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Global Group Selector in Toolbar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-600">Guruh:</span>
          <select
            value={selectedGroupName}
            onChange={(e) => setSelectedGroupName(e.target.value)}
            className="border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="">Barcha guruhlar</option>
            {data.groups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name} ({g.university || "TATU"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 border px-3 py-2 text-xs ${
            notice.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* TAB 1: GROUPS & STUDENTS */}
      {tab === "groups" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <form
            onSubmit={createGroup}
            className="space-y-3 border border-slate-200 bg-white p-4 lg:col-span-5"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FolderPlus className="h-4 w-4 text-[#1E3A8A]" />
              Yangi Akademik Guruh Ochish
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Guruh nomi *</label>
              <input
                type="text"
                required
                value={grpName}
                onChange={(e) => setGrpName(e.target.value)}
                placeholder="Masalan: FI-202, DI-310"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">OTM (Universitet)</label>
              <input
                type="text"
                value={grpUniv}
                onChange={(e) => setGrpUniv(e.target.value)}
                placeholder="Toshkent Axborot Texnologiyalari Universiteti"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Fakultet / Kafedra</label>
              <input
                type="text"
                value={grpFaculty}
                onChange={(e) => setGrpFaculty(e.target.value)}
                placeholder="Fizika kafedrasi / DIF"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Tavsif (ixtiyoriy)</label>
              <textarea
                rows={2}
                value={grpDesc}
                onChange={(e) => setGrpDesc(e.target.value)}
                placeholder="2026-o‘quv yili umumiy fizika kursi"
                className="w-full border border-slate-300 p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1E3A8A] py-2 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
            >
              Guruhni Saqlash
            </button>
          </form>

          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between border border-slate-200 bg-white p-3">
              <span className="text-xs font-semibold text-slate-800">
                Guruhdagi Talabalar Ro‘yxati ({groupStudents.length})
              </span>
              <div className="relative w-48">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Talaba qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 pl-7 pr-2 py-1 text-xs"
                />
              </div>
            </div>

            {groupStudents.length === 0 ? (
              <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
                Ushbu guruhga hali talabalar biriktirilmagan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 bg-white">
                {groupStudents.map((st) => {
                  const studentReports = data.reports.filter((r) => r.student_email === st.email);
                  const graded = studentReports.filter((r) => r.grade !== null);
                  const avg =
                    graded.length > 0
                      ? (graded.reduce((a, b) => a + (b.grade || 0), 0) / graded.length).toFixed(0)
                      : "-";

                  return (
                    <div key={st.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{st.full_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {st.email} • Guruh: <span className="font-mono font-medium">{st.student_group}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-emerald-700">
                            {avg !== "-" ? `${avg} ball` : "Baholanmagan"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {graded.length} / 8 ta lab topshirilgan
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List of My Groups */}
            <div className="border border-slate-200 bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-slate-800">Mening guruhlarim ro‘yxati:</div>
              <div className="flex flex-wrap gap-2">
                {data.groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
                  >
                    <span className="font-semibold text-[#1E3A8A]">{g.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteGroup(g.id, g.name)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                      title="Guruhni o'chirish"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRADEBOOK (AKADEMIK JURNAL & BAHOLAR VEDOMOSTI) */}
      {tab === "gradebook" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Akademik Baholar Jurnali (Vedomost)
              </h3>
              <p className="text-[11px] text-slate-500">
                {selectedGroupName ? `Guruh: ${selectedGroupName}` : "Barcha akademik guruhlar"} · O‘rtacha GPA: {groupStats.avgGpa}/100
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportVedomostCsv}
                className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                Vedomostni CSV yuklash
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-[#1E3A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#172554] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Chop etish (Print)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">№</th>
                  <th className="p-2.5">Talaba F.I.Sh</th>
                  <th className="p-2.5">Guruh</th>
                  {LAB_KEYS.map((l) => (
                    <th key={l.key} className="p-2 text-center" title={l.label}>
                      {l.short}
                    </th>
                  ))}
                  <th className="p-2.5 text-center">O‘rtacha</th>
                  <th className="p-2.5 text-center">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {groupStudents.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-6 text-center text-xs text-slate-500">
                      Guruh bo‘yicha talabalar topilmadi.
                    </td>
                  </tr>
                ) : (
                  groupStudents.map((st, idx) => {
                    const stReports = data.reports.filter((r) => r.student_email === st.email);
                    const stGrades: number[] = [];

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-900">
                          {st.full_name}
                        </td>
                        <td className="p-2.5 text-slate-600">{st.student_group}</td>
                        {LAB_KEYS.map((lk) => {
                          const r = stReports.find((rep) => rep.lab_key === lk.key);
                          if (r && r.grade !== null) {
                            stGrades.push(r.grade);
                            return (
                              <td key={lk.key} className="p-2 text-center">
                                <span className="inline-block rounded-xs bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                                  {r.grade}
                                </span>
                              </td>
                            );
                          }
                          if (r && r.status === "needs_revision") {
                            return (
                              <td key={lk.key} className="p-2 text-center" title="Qayta topshirish so'ralgan">
                                <span className="inline-block bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-300">
                                  QAYTA
                                </span>
                              </td>
                            );
                          }
                          if (r) {
                            return (
                              <td key={lk.key} className="p-2 text-center" title="Tekshiruv kutilmoqda">
                                <span className="inline-block bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-800 border border-blue-200">
                                  KUTIL
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={lk.key} className="p-2 text-center text-slate-300">
                              -
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-center font-bold text-slate-900">
                          {stGrades.length > 0
                            ? (stGrades.reduce((a, b) => a + b, 0) / stGrades.length).toFixed(1)
                            : "-"}
                        </td>
                        <td className="p-2.5 text-center font-sans text-[11px]">
                          {stGrades.length >= 8 ? (
                            <span className="text-emerald-700 font-semibold">Tugallangan</span>
                          ) : (
                            <span className="text-slate-500">{stGrades.length}/8 ta</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS & INDEPENDENT WORK */}
      {tab === "assignments" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <form
            onSubmit={createAssignment}
            className="space-y-3 border border-slate-200 bg-white p-4 lg:col-span-5"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Topshiriq / Mustaqil Ish Yuborish
            </h3>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Sarlavha *</label>
              <input
                type="text"
                required
                value={asTitle}
                onChange={(e) => setAsTitle(e.target.value)}
                placeholder="Masalan: Mustaqil ish #2 — Koshi dispersiyasi"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Dars turi</label>
                <select
                  value={asLessonType}
                  onChange={(e) => {
                    const val = e.target.value as typeof asLessonType;
                    setAsLessonType(val);
                    setAsType(val === "laboratoriya" ? "lab" : "independent");
                    if (val === "maqola") setAsMaxScore("10.0");
                    else setAsMaxScore("5.0");
                  }}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5"
                >
                  <option value="laboratoriya">Laboratoriya ishi</option>
                  <option value="mustaqil_ish">Mustaqil ish</option>
                  <option value="maqola">Ilmiy maqola yozish</option>
                  <option value="amaliyot">Amaliy mashg&apos;ulot</option>
                  <option value="referat">Referat / Taqriz</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Maksimal ball</label>
                <input
                  type="number"
                  step={0.5}
                  value={asMaxScore}
                  onChange={(e) => setAsMaxScore(e.target.value)}
                  className="w-full border border-slate-300 px-2 py-1.5 font-mono"
                  placeholder="5.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Laboratoriya bo&apos;limi</label>
                <select
                  value={asLabKey}
                  onChange={(e) => setAsLabKey(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5"
                >
                  <option value="metrology">1. Metrologiya & Asboblar</option>
                  <option value="kinematics">2. Kinematika & Ballistika</option>
                  <option value="dynamics">3. Dinamika & Mayatniklar</option>
                  <option value="statics">4. Statika & Muvozanat</option>
                  <option value="electromagnetism">5. Elektromagnetizm</option>
                  <option value="optics">6. Geometrik & To‘lqin Optika</option>
                  <option value="thermodynamics">7. Molekulyar & Termodinamika</option>
                  <option value="atomic">8. Atom & Yadro Fizikasi</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Maqsadli guruh</label>
                <input
                  type="text"
                  list="teacher-groups-datalist"
                  value={asGroup}
                  onChange={(e) => setAsGroup(e.target.value)}
                  placeholder="Bo‘sh = barcha"
                  className="w-full border border-slate-300 px-2 py-1.5"
                />
                <datalist id="teacher-groups-datalist">
                  {data.groups.map((g) => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Xatolik limiti (%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={asTolerance}
                  onChange={(e) => setAsTolerance(e.target.value)}
                  className="w-full border border-slate-300 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Muddat (Deadline)</label>
                <input
                  type="date"
                  value={asDueDate}
                  onChange={(e) => setAsDueDate(e.target.value)}
                  className="w-full border border-slate-300 px-2 py-1.5 font-mono"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Topshiriq sharti & yo‘riqnoma *</label>
              <textarea
                rows={3}
                required
                value={asDesc}
                onChange={(e) => setAsDesc(e.target.value)}
                className="w-full border border-slate-300 p-2"
                placeholder="Topshiriq uchun talab qilinadigan parametrlar va hisob-kitoblar..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1E3A8A] py-2 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
            >
              Topshiriqni E&apos;lon Qilish
            </button>
          </form>

          <div className="space-y-2 lg:col-span-7">
            <div className="text-xs font-semibold text-slate-800">
              Mavjud Topshiriqlar Ro‘yxati ({data.assignments.length})
            </div>
            {data.assignments.map((a) => (
              <div key={a.id} className="border border-slate-200 bg-white p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[#1E3A8A]">
                    #{a.id} • {a.lab_key} •{" "}
                    {a.assignment_type === "independent" ? "Mustaqil ish" : "Laboratoriya"}
                  </span>
                  <span className="font-mono text-slate-500">
                    {a.group_name ? `Guruh: ${a.group_name}` : "Barcha guruhlar"} · ±{a.tolerance_pct}%
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{a.title}</div>
                <p className="mt-1 text-slate-700">{a.description}</p>
                {a.due_date && (
                  <div className="mt-2 text-[11px] font-mono text-slate-500">
                    Muddat: {a.due_date.slice(0, 10)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & GRADING */}
      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Filtrlash:</span>
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as typeof reportStatusFilter)}
                className="border border-slate-300 bg-white px-2 py-1 text-xs"
              >
                <option value="all">Barcha hisobotlar ({data.reports.length})</option>
                <option value="pending">Kutilayotgan (Tekshirilmagan)</option>
                <option value="graded">Baholanganlar</option>
                <option value="revision">Qayta topshirishdagilar</option>
              </select>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Talaba yoki mavzu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 pl-7 pr-2 py-1 text-xs"
              />
            </div>
          </div>

          {groupReports.length === 0 ? (
            <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
              Tanlangan mezon bo‘yicha hisobotlar mavjud emas.
            </div>
          ) : (
            groupReports.map((rep) => (
              <div key={rep.id} className="border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <div className="text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-[#1E3A8A]">#{rep.id}</span> •{" "}
                      <strong className="text-slate-900">{rep.student_name}</strong> (
                      {[rep.university, rep.student_group].filter(Boolean).join(" / ")}) •{" "}
                      {rep.submitted_at.slice(0, 16).replace("T", " ")}
                    </div>
                    <h3 className="mt-0.5 text-sm font-semibold text-slate-900">{rep.title}</h3>
                  </div>
                  <span
                    className={`border px-2 py-0.5 font-mono text-xs font-semibold ${
                      rep.status === "needs_revision"
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : rep.grade !== null
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-blue-300 bg-blue-50 text-blue-800"
                    }`}
                  >
                    {rep.status === "needs_revision"
                      ? "Qayta topshirish so‘ralgan"
                      : rep.grade !== null
                      ? `Baholangan: ${rep.grade}/100`
                      : "Tekshirilmoqda"}
                  </span>
                </div>

                {/* Attached File if student uploaded one */}
                {rep.file_url && (
                  <div className="mt-2 flex items-center justify-between border border-blue-200 bg-blue-50/50 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-blue-900" />
                      <div>
                        <span className="font-semibold text-slate-900">
                          {rep.file_name || "Biriktirilgan fayl"}
                        </span>
                        {rep.file_size && (
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">
                            ({(rep.file_size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={rep.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-blue-900 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50"
                    >
                      Faylni ochish / Yuklash
                    </a>
                  </div>
                )}

                {/* Article Content if student submitted text */}
                {rep.article_content ? (
                  <div className="mt-2 bg-slate-50 p-2.5 text-xs text-slate-800 border border-slate-200">
                    <div className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                      Ilmiy Maqola / Mustaqil ish matni:
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white p-2.5 border border-slate-100">
                      {rep.article_content}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 bg-slate-50 p-2.5 text-xs text-slate-700">
                    <div className="font-semibold text-slate-800 mb-0.5">Talaba Ilmiy Xulosasi:</div>
                    {rep.conclusion}
                  </div>
                )}

                {/* Quick Feedback Suggestions */}
                <div className="mt-2.5">
                  <div className="mb-1 text-[10px] font-medium text-slate-500">
                    Tezkor taqriz shablonlari:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {FEEDBACK_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setFeedbacks((prev) => ({ ...prev, [rep.id]: tpl }))
                        }
                        className="truncate max-w-xs border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:border-blue-500 hover:text-blue-900 cursor-pointer"
                        title={tpl}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grading Controls */}
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2.5">
                  <div className="w-24">
                    <label className="mb-1 block text-[11px] font-medium text-slate-700">
                      Baho (0–100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={grades[rep.id] ?? (rep.grade !== null && rep.grade !== undefined ? String(rep.grade) : "90")}
                      onChange={(e) =>
                        setGrades((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      className="w-full border border-slate-300 px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block text-[11px] font-medium text-slate-700">
                      Ustoz Taqrizi & Izohi
                    </label>
                    <input
                      type="text"
                      placeholder="Talabaga tavsiya yoki baho izohi..."
                      value={feedbacks[rep.id] ?? (rep.admin_feedback || "")}
                      onChange={(e) =>
                        setFeedbacks((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      className="w-full border border-slate-300 px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => submitGrade(rep.id, "graded")}
                      className="bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Baholash
                    </button>
                    <button
                      type="button"
                      onClick={() => submitGrade(rep.id, "needs_revision")}
                      className="border border-amber-500 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1"
                      title="Hisobotni xatolarini tuzatish uchun talabaga qaytarish"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Qayta topshirish
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
