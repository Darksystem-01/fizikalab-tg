"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  Save,
  School,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

export interface StudentProfile {
  id: number | string;
  fullName: string;
  email: string;
  role: string;
  studentGroup: string;
  university: string;
  faculty: string;
  specialty?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  degree?: string;
  educationType?: string;
  educationPayment?: string;
  courseYear?: string;
  tutorName?: string;
  scholarshipStatus?: string;
  avatarUrl?: string;
  studentIdCode?: string;
  bio?: string;
  academicYear?: string;
  semester?: string;
}

export function ProfileView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editGender, setEditGender] = useState("erkak");
  const [editAddress, setEditAddress] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editGroup, setEditGroup] = useState("");

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
          populateForm(data.profile);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function populateForm(p: StudentProfile) {
    setEditFullName(p.fullName || "");
    setEditPhone(p.phone || "");
    setEditBirthDate(p.birthDate || "");
    setEditGender(p.gender || "erkak");
    setEditAddress(p.address || "");
    setEditBio(p.bio || "");
    setEditAvatarUrl(p.avatarUrl || "");
    setEditStudentId(p.studentIdCode || "");
    setEditGroup(p.studentGroup || "");
  }

  async function handleSave() {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName,
          phone: editPhone,
          birthDate: editBirthDate,
          gender: editGender,
          address: editAddress,
          bio: editBio,
          avatarUrl: editAvatarUrl,
          studentIdCode: editStudentId,
          studentGroup: editGroup,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditing(false);
        setNotice("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
        setTimeout(() => setNotice(null), 4000);
      } else {
        alert("Saqlashda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyId(idCode: string) {
    navigator.clipboard.writeText(idCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
        HEMIS talaba profili yuklanmoqda...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 text-xs text-red-700">
        Profil ma'lumotlarini yuklab bo'lmadi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main HEMIS Profile Card */}
      <div className="border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Top Header Background Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Student Photo */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-950 text-white text-2xl font-bold">
                    {profile.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-blue-950/80 py-0.5 text-center text-[9px] font-bold text-white uppercase tracking-wider">
                  HEMIS
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="rounded bg-blue-500/30 px-2 py-0.5 text-[11px] font-semibold text-blue-100 uppercase tracking-wider border border-blue-400/30">
                    {profile.role === "student" ? "Talaba" : profile.role}
                  </span>
                  <span className="rounded bg-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-400/30">
                    Faol talaba
                  </span>
                  <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                    {profile.educationPayment || "Davlat granti"}
                  </span>
                </div>

                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {profile.fullName}
                </h1>

                <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-blue-100/90 font-mono">
                  <span className="flex items-center gap-1">
                    <strong>ID:</strong> {profile.studentIdCode || "310242100806"}
                    <button
                      type="button"
                      onClick={() => handleCopyId(profile.studentIdCode || "310242100806")}
                      className="ml-1 text-blue-200 hover:text-white cursor-pointer"
                      title="Nusxalash"
                    >
                      <Copy className="h-3 w-3 inline" />
                      {copied && <span className="text-[10px] ml-1 text-emerald-300">Nusxalandi!</span>}
                    </button>
                  </span>
                  <span>•</span>
                  <span><strong>Guruh:</strong> {profile.studentGroup}</span>
                  <span>•</span>
                  <span>{profile.courseYear || "1-kurs"}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  populateForm(profile);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-sm bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-900 shadow-xs hover:bg-slate-100 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Profilni tahrirlash
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-sm bg-blue-950/60 px-3.5 py-1.5 text-xs font-medium text-white border border-white/20 hover:bg-blue-950 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Chop etish (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Academic Overview Quick Bar */}
        <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 sm:grid-cols-4 border-b border-slate-200 bg-slate-50 text-slate-700 text-xs">
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              O&apos;quv yili & Semestr
            </span>
            <span className="font-semibold text-slate-800 text-sm">
              {profile.academicYear || "2026-2027"} · {profile.semester || "2-semestr"}
            </span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ta&apos;lim darajasi va shakli
            </span>
            <span className="font-semibold text-slate-800 text-sm">
              {profile.degree || "Bakalavr"} ({profile.educationType || "Kunduzgi"})
            </span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Guruh Tyutori
            </span>
            <span className="font-semibold text-slate-800 text-sm">
              {profile.tutorName || "Alimuradov Lochinbek"}
            </span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Stipendiya
            </span>
            <span className="font-semibold text-emerald-700 text-sm flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {profile.scholarshipStatus || "Mavjud (Bor)"}
            </span>
          </div>
        </div>

        {/* Detailed Sections: Academic & Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Section 1: Academic Data */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <GraduationCap className="h-4 w-4 text-blue-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Akademik Ma&apos;lumotlar (HEMIS)
              </h2>
            </div>

            <dl className="grid grid-cols-1 gap-y-2.5 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[11px] text-slate-500">Oliy ta&apos;lim muassasasi (OTM)</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{profile.university}</dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Fakultet</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{profile.faculty}</dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Ta&apos;lim yo&apos;nalishi</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {profile.specialty || "60610500 - Dasturiy injiniring"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Akademik guruh</dt>
                <dd className="font-semibold text-blue-900 font-mono mt-0.5">
                  {profile.studentGroup}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">O&apos;quv tili</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">O&apos;zbek tili</dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Ta&apos;lim turi va to&apos;lov shakli</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {profile.educationPayment || "Davlat granti"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Joriy kursi</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {profile.courseYear || "1-kurs"} (Bakalavriat)
                </dd>
              </div>
            </dl>
          </div>

          {/* Section 2: Personal & Contact Data */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <User className="h-4 w-4 text-blue-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Shaxsiy va Bog&apos;lanish Ma&apos;lumotlari
              </h2>
            </div>

            <dl className="grid grid-cols-1 gap-y-2.5 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[11px] text-slate-500">Tug&apos;ilgan sanasi</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {profile.birthDate || "10-05-2009"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Jinsi</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 capitalize">
                  {profile.gender || "erkak"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Telefon raqami</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {profile.phone || "+998 90 123 45 67"}
                </dd>
              </div>

              <div>
                <dt className="text-[11px] text-slate-500">Elektron pochta</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {profile.email}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-[11px] text-slate-500">Doimiy yashash manzili</dt>
                <dd className="font-semibold text-slate-900 mt-0.5 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {profile.address || "Toshkent shahri, Yunusobod tumani, Bog'ishamol ko'chasi, 12-uy"}
                  </span>
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-[11px] text-slate-500">Qisqacha izoh / Bio</dt>
                <dd className="text-slate-700 mt-0.5 italic">
                  &ldquo;{profile.bio || "Fizika fani va interaktiv stendlar bilan ilmiy tajribalar o'tkazuvchi talaba."}&rdquo;
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Profil Ma&apos;lumotlarini Tahrirlash
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  F.I.Sh. (To&apos;liq ism-sharifingiz)
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Telefon raqam
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tug&apos;ilgan sana
                  </label>
                  <input
                    type="text"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jinsi
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                  >
                    <option value="erkak">Erkak</option>
                    <option value="ayol">Ayol</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Talaba ID raqami
                  </label>
                  <input
                    type="text"
                    value={editStudentId}
                    onChange={(e) => setEditStudentId(e.target.value)}
                    placeholder="310242100806"
                    className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Doimiy yashash manzili
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Toshkent shahri, Yunusobod tumani..."
                  className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Avatar / Rasm URL manzili
                </label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://... yoki bo'sh qoldiring"
                  className="w-full border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bio / Qisqacha o&apos;zingiz haqingizda
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Fizika va dasturiy injiniring bo'yicha ilmiy qiziqishlaringiz..."
                  className="w-full border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-blue-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
