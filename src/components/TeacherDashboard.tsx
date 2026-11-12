"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardPlus,
  FileCheck2,
  FolderPlus,
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
    creator_name: string;
    due_date: string | null;
  }[];
  reports: {
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
    university: string;
    faculty: string;
  }[];
}

export function TeacherDashboard() {
  const [tab, setTab] = useState<"groups" | "assignments" | "reports">("groups");
  const [data, setData] = useState<TeacherOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Selected group for dedicated group panel
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  // New group form
  const [grpName, setGrpName] = useState("");
  const [grpUniv, setGrpUniv] = useState("");
  const [grpFaculty, setGrpFaculty] = useState("");
  const [grpDesc, setGrpDesc] = useState("");

  // New assignment / independent work form
  const [asTitle, setAsTitle] = useState("");
  const [asLabKey, setAsLabKey] = useState("dynamics");
  const [asType, setAsType] = useState<"lab" | "independent">("independent");
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
      const res = await fetch("/api/teacher/overview");
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
    if (!selectedGroupName) return data.students;
    return data.students.filter(
      (s) => s.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
    );
  }, [data, selectedGroupName]);

  const groupReports = useMemo(() => {
    if (!data) return [];
    if (!selectedGroupName) return data.reports;
    return data.reports.filter(
      (r) => r.student_group.trim().toLowerCase() === selectedGroupName.trim().toLowerCase()
    );
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
      setSelectedGroupName(grpName.trim());
      setGrpName("");
      setGrpUniv("");
      setGrpFaculty("");
      setGrpDesc("");
      loadData();
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
      loadData();
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
        groupName: asGroup || null,
        description: asDesc,
        tolerancePct: Number(asTolerance) || 5,
        dueDate: asDueDate || null,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setNotice({ type: "ok", text: `Topshiriq (#${json.id}) guruhga yuborildi.` });
      setAsTitle("");
      setAsDesc("");
      loadData();
    } else {
      setNotice({ type: "err", text: json.error || "Topshiriq yaratishda xatolik." });
    }
  }

  async function submitGrade(reportId: number) {
    setNotice(null);
    const gradeNum = Number(grades[reportId] ?? 0);
    const res = await fetch(`/api/teacher/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade: gradeNum,
        status: "graded",
        adminFeedback: feedbacks[reportId] ?? "",
      }),
    });
    if (res.ok) {
      setNotice({ type: "ok", text: `Hisobot #${reportId} baholandi (${gradeNum}/100).` });
      loadData();
    } else {
      const json = await res.json();
      setNotice({ type: "err", text: json.error || "Baholashda xatolik." });
    }
  }

  if (loading && !data) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
        Ustoz boshqaruv paneli yuklanmoqda...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Mening guruhlarim</div>
          <div className="font-mono text-xl font-bold text-[#1E3A8A]">{data.groups.length}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Ro‘yxatdan o‘tgan talabalar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{data.students.length}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Berilgan topshiriqlar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{data.assignments.length}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Kelgan hisobotlar</div>
          <div className="font-mono text-xl font-bold text-emerald-700">{data.reports.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border border-slate-200 bg-slate-50 p-2">
        {[
          { id: "groups", label: "Guruhlar & Talabalar Nazorati", icon: Users },
          { id: "assignments", label: "Mustaqil Ish & Laboratoriya Berish", icon: ClipboardPlus },
          { id: "reports", label: "Hisobotlarni Baholash", icon: FileCheck2 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium cursor-pointer ${
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

      {/* TAB 1: GROUPS */}
      {tab === "groups" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <form
            onSubmit={createGroup}
            className="space-y-3 border border-slate-200 bg-white p-4 lg:col-span-4"
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <FolderPlus className="h-4 w-4 text-[#1E3A8A]" />
              Yangi Guruh Ochish
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Guruh nomi *</label>
              <input
                type="text"
                required
                value={grpName}
                onChange={(e) => setGrpName(e.target.value)}
                placeholder="Masalan: FI-202"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Universitet</label>
              <input
                type="text"
                value={grpUniv}
                onChange={(e) => setGrpUniv(e.target.value)}
                placeholder="O‘zMU"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Fakultet</label>
              <input
                type="text"
                value={grpFaculty}
                onChange={(e) => setGrpFaculty(e.target.value)}
                placeholder="Fizika fakulteti"
                className="w-full border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Izoh</label>
              <textarea
                rows={2}
                value={grpDesc}
                onChange={(e) => setGrpDesc(e.target.value)}
                placeholder="Guruh bo‘yicha qisqa ma’lumot..."
                className="w-full border border-slate-300 p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1E3A8A] py-2 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
            >
              Guruhni Yaratish
            </button>
          </form>

          <div className="space-y-4 lg:col-span-8">
            {/* Group selector cards */}
            <div className="border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Alohida Guruh Panellari
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedGroupName("")}
                  className={`border px-2 py-1 text-[11px] font-medium cursor-pointer ${
                    selectedGroupName === ""
                      ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                      : "border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  Barcha talabalar ({data.students.length})
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {data.groups.map((g) => {
                  const cnt = data.students.filter(
                    (s) => s.student_group.trim().toLowerCase() === g.name.trim().toLowerCase()
                  ).length;
                  const active = selectedGroupName === g.name;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupName(g.name)}
                      className={`cursor-pointer border p-3 text-xs transition ${
                        active
                          ? "border-[#1E3A8A] bg-blue-50/60"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-[#1E3A8A]">{g.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteGroup(g.id, g.name);
                          }}
                          className="text-slate-400 hover:text-red-700"
                          title="Guruhni o'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-600">
                        {g.university || "—"} · {g.faculty || "—"}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-semibold text-slate-800">
                        {cnt} ta talaba
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Students in selected group */}
            <div className="overflow-x-auto border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                {selectedGroupName
                  ? `${selectedGroupName} guruhi talabalari (${groupStudents.length})`
                  : `Barcha talabalar (${groupStudents.length})`}
              </div>
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-white text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Talaba</th>
                    <th className="px-3 py-2">Universitet / Fakultet</th>
                    <th className="px-3 py-2">Guruh</th>
                    <th className="px-3 py-2">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                        Bu guruhda hali ro‘yxatdan o‘tgan talaba yo‘q.
                      </td>
                    </tr>
                  ) : (
                    groupStudents.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{s.full_name}</div>
                          <div className="text-[11px] text-slate-500">{s.email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div>{s.university || "—"}</div>
                          <div className="text-[11px] text-slate-500">{s.faculty || "—"}</div>
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-[#1E3A8A]">
                          {s.student_group}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`border px-1.5 py-0.5 text-[10px] font-semibold ${
                              s.is_banned === 0 && s.is_active === 1
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-red-300 bg-red-50 text-red-800"
                            }`}
                          >
                            {s.is_banned === 0 && s.is_active === 1 ? "Faol" : "Bloklangan"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
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
                <label className="mb-1 block font-medium text-slate-700">Turi</label>
                <select
                  value={asType}
                  onChange={(e) => setAsType(e.target.value as "lab" | "independent")}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5"
                >
                  <option value="independent">Mustaqil ish</option>
                  <option value="lab">Laboratoriya ishi</option>
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
                <label className="mb-1 block font-medium text-slate-700">Laboratoriya</label>
                <select
                  value={asLabKey}
                  onChange={(e) => setAsLabKey(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-2 py-1.5"
                >
                  <option value="metrology">1. Metrologiya</option>
                  <option value="kinematics">2. Kinematika</option>
                  <option value="dynamics">3. Dinamika</option>
                  <option value="statics">4. Statika</option>
                  <option value="electromagnetism">5. Elektromagnetizm</option>
                  <option value="optics">6. Optika</option>
                </select>
              </div>
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
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Muddat (ixtiyoriy)</label>
              <input
                type="date"
                value={asDueDate}
                onChange={(e) => setAsDueDate(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div className="text-xs">
              <label className="mb-1 block font-medium text-slate-700">Topshiriq sharti *</label>
              <textarea
                rows={3}
                required
                value={asDesc}
                onChange={(e) => setAsDesc(e.target.value)}
                className="w-full border border-slate-300 p-2"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS */}
      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3 text-xs">
            <span className="font-semibold text-slate-800">
              Guruh bo‘yicha filtrlash:
            </span>
            <select
              value={selectedGroupName}
              onChange={(e) => setSelectedGroupName(e.target.value)}
              className="border border-slate-300 bg-white px-2.5 py-1 text-xs"
            >
              <option value="">Barcha guruhlar ({data.reports.length})</option>
              {data.groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {groupReports.length === 0 ? (
            <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
              Tanlangan guruh bo‘yicha hali hisobot topshirilmagan.
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
                      rep.grade !== null
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {rep.grade !== null ? `Baholangan: ${rep.grade}/100` : "Baholanmagan"}
                  </span>
                </div>
                <p className="mt-2 bg-slate-50 p-2.5 text-xs text-slate-700">{rep.conclusion}</p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="w-28">
                    <label className="mb-1 block text-[11px] font-medium text-slate-700">
                      Baho (0–100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={grades[rep.id] ?? "90"}
                      onChange={(e) =>
                        setGrades((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      className="w-full border border-slate-300 px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block text-[11px] font-medium text-slate-700">
                      Ustoz taqrizi
                    </label>
                    <input
                      type="text"
                      value={feedbacks[rep.id] ?? ""}
                      onChange={(e) =>
                        setFeedbacks((prev) => ({ ...prev, [rep.id]: e.target.value }))
                      }
                      className="w-full border border-slate-300 px-2.5 py-1 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => submitGrade(rep.id)}
                    className="bg-[#1E3A8A] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#172554] cursor-pointer"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
