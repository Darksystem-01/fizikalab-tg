"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UniversitySelect } from "./UniversitySelect";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ClipboardCopy,
  ClipboardPlus,
  FileCheck2,
  GraduationCap,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

interface AdminOverviewData {
  dbBackend?: "postgres" | "sqlite-local" | "sqlite-tmp";
  users: {
    id: number;
    full_name: string;
    email: string;
    role: "admin" | "teacher" | "student";
    student_group: string;
    university: string;
    faculty: string;
    is_active: number;
    is_banned: number;
    created_at: string;
  }[];
  groups: {
    id: number;
    name: string;
    university: string;
    faculty: string;
    description: string;
    teacher_name: string;
    teacher_email: string;
    created_at: string;
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
  runs: {
    id: number;
    lab_key: string;
    created_at: string;
    student_name: string;
    student_group: string;
  }[];
  logs: {
    id: number;
    action: string;
    details: string;
    created_at: string;
    user_email: string | null;
  }[];
}

export function AdminDashboard() {
  const [tab, setTab] = useState<"users" | "groups" | "reports_overview" | "audit">("users");
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Grading state (preserved for fallback APIs)
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});

  // Assignment form (preserved for API compatibility)
  const [asTitle, setAsTitle] = useState("");
  const [asLabKey, setAsLabKey] = useState("dynamics");
  const [asType, setAsType] = useState<"lab" | "independent">("lab");
  const [asGroup, setAsGroup] = useState("");
  const [asDesc, setAsDesc] = useState("");
  const [asTolerance, setAsTolerance] = useState("5");
  const [asDueDate, setAsDueDate] = useState("");

  // Create teacher / student form
  const [uRole, setURole] = useState<"teacher" | "student">("teacher");
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uUniversity, setUUniversity] = useState("");
  const [uFaculty, setUFaculty] = useState("");
  const [uGroup, setUGroup] = useState("");

  // Copyable Telegram snippet shown immediately after creating a teacher account
  const [createdSnippet, setCreatedSnippet] = useState<string | null>(null);

  // Search / role filter
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "student">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/darksystem/overview");
      if (res.ok) {
        const json = (await res.json()) as AdminOverviewData;
        setData(json);
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

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = userSearch.trim().toLowerCase();
    return data.users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.student_group.toLowerCase().includes(q) ||
        u.university.toLowerCase().includes(q) ||
        u.faculty.toLowerCase().includes(q)
      );
    });
  }, [data, userSearch, roleFilter]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setCreatedSnippet(null);

    const res = await fetch("/api/darksystem/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: uName,
        email: uEmail,
        password: uPassword,
        role: uRole,
        university: uUniversity,
        faculty: uFaculty,
        studentGroup: uGroup || (uRole === "teacher" ? "Kafedra" : ""),
      }),
    });
    const json = await res.json();
    if (res.ok) {
      const roleWord = uRole === "teacher" ? "Ustoz" : "Talaba";
      setNotice({ type: "ok", text: `Yangi ${roleWord} hisobi (#${json.id}) muvaffaqiyatli yaratildi.` });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCreatedSnippet(
        `Assalomu alaykum, ${uName}!\nFizikaLab ${roleWord} kabinetingiz tayyor:\nHavola: ${origin}\nLogin (Email): ${uEmail}\nParol: ${uPassword}`
      );
      setUName("");
      setUEmail("");
      setUPassword("");
      setUUniversity("");
      setUFaculty("");
      setUGroup("");
      loadData();
    } else {
      setNotice({ type: "err", text: json.error || "Foydalanuvchi qo'shishda xatolik." });
    }
  }

  async function toggleUserBan(userId: number, isBanned: number, isActive: number) {
    setNotice(null);
    const currentlyBanned = isBanned === 1 || isActive !== 1;
    const res = await fetch("/api/darksystem/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBanned: !currentlyBanned }),
    });
    if (res.ok) {
      setNotice({
        type: "ok",
        text: currentlyBanned ? "Foydalanuvchi blokdan chiqarildi." : "Foydalanuvchi tizimdan bloklandi.",
      });
      loadData();
    } else {
      const json = await res.json();
      setNotice({ type: "err", text: json.error || "Holatni o'zgartirib bo'lmadi." });
    }
  }

  async function deleteUser(userId: number, fullName: string) {
    setNotice(null);
    const res = await fetch(`/api/darksystem/users?userId=${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotice({ type: "ok", text: `Foydalanuvchi "${fullName}" tizimdan o'chirildi.` });
      loadData();
    } else {
      const json = await res.json();
      setNotice({ type: "err", text: json.error || "O'chirishda xatolik." });
    }
  }

  async function submitGrade(reportId: number) {
    setNotice(null);
    const gradeNum = Number(grades[reportId] ?? 0);
    const res = await fetch(`/api/darksystem/reports/${reportId}`, {
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
      const err = await res.json();
      setNotice({ type: "err", text: err.error || "Baholashda xatolik." });
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
      setNotice({ type: "ok", text: `Yangi topshiriq (#${json.id}) e'lon qilindi.` });
      setAsTitle("");
      setAsDesc("");
      setAsGroup("");
      loadData();
    } else {
      setNotice({ type: "err", text: json.error || "Topshiriq yaratishda xatolik." });
    }
  }

  if (loading && !data) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-xs text-slate-600">
        Administrator boshqaruv markazi yuklanmoqda...
      </div>
    );
  }

  if (!data) return null;

  const teacherCount = data.users.filter((u) => u.role === "teacher").length;
  const studentCount = data.users.filter((u) => u.role === "student").length;

  return (
    <div className="space-y-5">
      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Ustozlar</div>
          <div className="font-mono text-xl font-bold text-emerald-700">{teacherCount}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Talabalar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{studentCount}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Akademik guruhlar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{data.groups.length}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Hisobotlar</div>
          <div className="font-mono text-xl font-bold text-[#1E3A8A]">{data.reports.length}</div>
        </div>
        <div className="border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Topshiriqlar</div>
          <div className="font-mono text-xl font-bold text-slate-900">{data.assignments.length}</div>
        </div>
      </div>

      {/* Database status banner */}
      {data.dbBackend === "sqlite-tmp" && (
        <div className="border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span>Baza holati: Vercel Serverless (Vaqtinchalik /tmp xotira)</span>
              <span className="bg-amber-200/80 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono">ephemeral</span>
            </div>
            <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
              Vercel Serverless arxitekturasida har bir API so‘rov alohida konteynerda ishlaydi va har bir necha daqiqada konteynerlar yangilanadi. Yangi ro‘yxatdan o‘tgan talabalar, ustozlar va hisobotlar barcha konteynerlarda doimiy va abadiy saqlanib qolishi uchun Vercel panelida <strong>Storage → Neon (Serverless Postgres)</strong> bepul bazasini 1 marta ulab qo‘ying.
            </p>
          </div>
        </div>
      )}
      {data.dbBackend === "postgres" && (
        <div className="border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Doimiy Cloud PostgreSQL (Neon) bazasi faol.</strong> Barcha foydalanuvchilar, hisobotlar va ma&apos;lumotlar xavfsiz va doimiy saqlanadi.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border border-slate-200 bg-slate-50 p-2">
        {[
          { id: "users", label: "Foydalanuvchilar Boshqaruvi", icon: Users },
          { id: "groups", label: "Guruhlar & OTM Tuzilmasi", icon: GraduationCap },
          { id: "reports_overview", label: "Akademik Monitoring", icon: FileCheck2 },
          { id: "audit", label: "Tizim Xavfsizligi & Audit", icon: Activity },
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

      {/* TAB 1: USERS & TEACHERS */}
      {tab === "users" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <form
              onSubmit={createUser}
              className="space-y-3 border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <UserPlus className="h-4 w-4 text-[#1E3A8A]" />
                Yangi Ustoz / Talaba Hisobi Ochish
              </div>
              <p className="text-[11px] text-slate-500">
                Ustozlar mustaqil ro‘yxatdan o‘ta olmaydi. Ustoz hisobini faqat administrator ochib,
                login va parolni Telegram orqali yuboradi.
              </p>

              <div className="text-xs">
                <label className="mb-1 block font-medium text-slate-700">Hisob turi (Rol)</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as "teacher" | "student")}
                  className="w-full border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-[#1E3A8A]"
                >
                  <option value="teacher">Ustoz (O‘qituvchi)</option>
                  <option value="student">Talaba</option>
                </select>
              </div>

              <div className="text-xs">
                <label className="mb-1 block font-medium text-slate-700">F.I.Sh. *</label>
                <input
                  type="text"
                  required
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="Masalan: Rahimov Azizbek"
                  className="w-full border border-slate-300 px-2.5 py-1.5"
                />
              </div>

              <UniversitySelect
                university={uUniversity}
                onUniversityChange={(uName) => setUUniversity(uName)}
                faculty={uFaculty}
                onFacultyChange={(fName) => setUFaculty(fName)}
                required={uRole === "student"}
              />

              <div className="text-xs">
                <label className="mb-1 block font-medium text-slate-700">
                  {uRole === "teacher" ? "Kafedra / Yo‘nalish" : "Akademik guruh *"}
                </label>
                <input
                  type="text"
                  required={uRole === "student"}
                  value={uGroup}
                  onChange={(e) => setUGroup(e.target.value)}
                  placeholder={uRole === "teacher" ? "Umumiy fizika kafedrasi" : "FI-202"}
                  className="w-full border border-slate-300 px-2.5 py-1.5"
                />
              </div>

              <div className="text-xs">
                <label className="mb-1 block font-medium text-slate-700">Email *</label>
                <input
                  type="email"
                  required
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  placeholder="ustoz@university.uz"
                  className="w-full border border-slate-300 px-2.5 py-1.5"
                />
              </div>

              <div className="text-xs">
                <label className="mb-1 block font-medium text-slate-700">Parol (min 6 belgi) *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                  placeholder="Kuchli parol kiriting"
                  className="w-full border border-slate-300 px-2.5 py-1.5 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E3A8A] py-2 text-xs font-semibold text-white hover:bg-[#172554] cursor-pointer"
              >
                {uRole === "teacher" ? "Ustoz Hisobini Ochish" : "Talaba Hisobini Ochish"}
              </button>
            </form>

            {createdSnippet && (
              <div className="border border-emerald-300 bg-emerald-50 p-3 text-xs">
                <div className="mb-1 font-semibold text-emerald-900">
                  Telegram orqali yuborish uchun tayyor matn:
                </div>
                <pre className="whitespace-pre-wrap border border-emerald-200 bg-white p-2 font-mono text-[11px] text-slate-800">
                  {createdSnippet}
                </pre>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(createdSnippet)}
                  className="mt-2 inline-flex items-center gap-1 border border-emerald-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" /> Nusxa olish
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3">
              <div className="flex gap-1">
                {[
                  { id: "all", label: "Barchasi" },
                  { id: "teacher", label: "Ustozlar" },
                  { id: "student", label: "Talabalar" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRoleFilter(f.id as typeof roleFilter)}
                    className={`border px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      roleFilter === f.id
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ism, universitet, guruh qidirish..."
                  className="w-full border border-slate-300 py-1 pl-8 pr-2.5 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Ism / Email</th>
                    <th className="px-3 py-2">Universitet / Fakultet</th>
                    <th className="px-3 py-2">Guruh</th>
                    <th className="px-3 py-2">Rol</th>
                    <th className="px-3 py-2">Holat</th>
                    <th className="px-3 py-2 text-right">Boshqaruv</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isBanned = u.is_banned === 1 || u.is_active !== 1;
                    return (
                      <tr key={u.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-slate-800">{u.university || "—"}</div>
                          <div className="text-[11px] text-slate-500">{u.faculty || "—"}</div>
                        </td>
                        <td className="px-3 py-2 font-mono">{u.student_group || "—"}</td>
                        <td className="px-3 py-2">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A]">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : u.role === "teacher" ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <GraduationCap className="h-3 w-3" /> Ustoz
                            </span>
                          ) : (
                            "Talaba"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`border px-1.5 py-0.5 text-[10px] font-semibold ${
                              !isBanned
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-red-300 bg-red-50 text-red-800"
                            }`}
                          >
                            {!isBanned ? "Faol" : "Bloklangan"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {u.role !== "admin" && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleUserBan(u.id, u.is_banned, u.is_active)}
                                className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                {isBanned ? (
                                  <>
                                    <UserCheck className="h-3 w-3 text-emerald-700" /> Tiklash
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3 w-3 text-amber-700" /> Bloklash
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteUser(u.id, u.full_name)}
                                title="Hisobni o'chirish"
                                className="border border-red-200 bg-white p-1 text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS & STRUCTURE */}
      {tab === "groups" && (
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Universitet va Fakultetlar Kesimidagi Guruhlar ({data.groups.length} ta)
            </h3>
            {data.groups.length === 0 ? (
              <div className="text-xs text-slate-500">Hozircha akademik guruhlar mavjud emas.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.groups.map((g) => {
                  const studentCount = data.users.filter(
                    (u) =>
                      u.student_group &&
                      u.student_group.trim().toLowerCase() === g.name.trim().toLowerCase()
                  ).length;
                  return (
                    <div key={g.id} className="border border-slate-200 bg-white p-3 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-[#1E3A8A]">{g.name}</div>
                        <span className="font-mono text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 font-semibold">
                          {studentCount} talaba
                        </span>
                      </div>
                      <div className="mt-1 text-slate-700 font-medium">
                        {g.university || "TATU"} · {g.faculty || "DIF"}
                      </div>
                      {g.description && (
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{g.description}</p>
                      )}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Biriktirilgan ustoz:</span>
                        <strong className="text-slate-800">{g.teacher_name}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS OVERVIEW (MONITORING) */}
      {tab === "reports_overview" && (
        <div className="space-y-4">
          {/* Institutional KPI Breakdown */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">Jami hisobotlar</div>
              <div className="font-mono text-xl font-bold text-slate-900">{data.reports.length} ta</div>
            </div>
            <div className="border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">Baholangan hisobotlar</div>
              <div className="font-mono text-xl font-bold text-emerald-700">
                {data.reports.filter((r) => r.grade !== null).length} ta
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">Kutilayotgan hisobotlar</div>
              <div className="font-mono text-xl font-bold text-amber-700">
                {data.reports.filter((r) => r.grade === null).length} ta
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">O‘rtacha platforma bali</div>
              <div className="font-mono text-xl font-bold text-[#1E3A8A]">
                {(() => {
                  const graded = data.reports.filter((r) => r.grade !== null);
                  if (graded.length === 0) return "—";
                  return (graded.reduce((acc, r) => acc + (r.grade || 0), 0) / graded.length).toFixed(1);
                })()} / 100
              </div>
            </div>
          </div>

          {/* Submissions Monitoring Table */}
          <div className="border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Talabalar Yuborgan Oxirgi Laboratoriya Hisobotlari Monitoringi
            </h3>
            {data.reports.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 border border-dashed border-slate-200 text-center">
                Hali talabalar tomonidan hisobot yuborilmagan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Talaba</th>
                      <th className="px-3 py-2">Guruh / OTM</th>
                      <th className="px-3 py-2">Laboratoriya</th>
                      <th className="px-3 py-2">Vaqt</th>
                      <th className="px-3 py-2">Holat & Baho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((rep) => (
                      <tr key={rep.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-mono text-[#1E3A8A] font-semibold">#{rep.id}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{rep.student_name}</div>
                          <div className="text-[11px] text-slate-500">{rep.student_email}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono font-semibold text-slate-800">{rep.student_group}</span>
                          <div className="text-[11px] text-slate-500">{rep.university}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-800">{rep.lab_key}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {rep.submitted_at.slice(0, 16).replace("T", " ")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`border px-2 py-0.5 font-mono text-xs font-semibold ${
                              rep.grade !== null
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-amber-300 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {rep.grade !== null ? `${rep.grade} ball` : "Tekshirilmoqda"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT & RUNS */}
      {tab === "audit" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Oxirgi Server Tajribalari ({data.runs.length})
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-1.5">ID</th>
                    <th className="px-2 py-1.5">Talaba</th>
                    <th className="px-2 py-1.5">Bo&apos;lim</th>
                    <th className="px-2 py-1.5">Vaqt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="px-2 py-1.5 font-mono">#{r.id}</td>
                      <td className="px-2 py-1.5">
                        {r.student_name} ({r.student_group})
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[#1E3A8A]">{r.lab_key}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-500">
                        {r.created_at.slice(0, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Tizim Audit Jurnali ({data.logs.length})
            </h3>
            <div className="max-h-96 space-y-1.5 overflow-y-auto text-xs">
              {data.logs.map((l) => (
                <div key={l.id} className="border border-slate-100 bg-slate-50 p-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                    <span className="font-semibold text-[#1E3A8A]">{l.action}</span>
                    <span>{l.created_at.slice(0, 19).replace("T", " ")}</span>
                  </div>
                  <div className="mt-0.5 text-slate-800">{l.details}</div>
                  {l.user_email && (
                    <div className="text-[10px] text-slate-500">Subyekt: {l.user_email}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
