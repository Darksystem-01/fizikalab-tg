"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Atom,
  BookOpen,
  Compass,
  Eye,
  EyeOff,
  FileCheck2,
  FlaskConical,
  Lock,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wrench,
} from "lucide-react";

const MODULES = [
  { num: "01", name: "Metrologiya va Asboblar", desc: "Verniy, Mikrometr, Sferometr, t'-mezoni" },
  { num: "02", name: "Kinematika & Ballistika", desc: "RK4 trayektoriya, havo qarshiligi, erkin tushish" },
  { num: "03", name: "Dinamika & Mayatniklar", desc: "Qiya tekislik, Kater mayatnigi, Guk, to'qnashuv" },
  { num: "04", name: "Statika & Muvozanat", desc: "360° kuchlar stoli, balka momentlari, polispast" },
  { num: "05", name: "Elektromagnetizm", desc: "MNA matritsa, Metr ko'prigi, KRO, Faradey" },
  { num: "06", name: "Geometrik & To'lqin Optika", desc: "Linzalar, Koshi prizmasi, Difraksiya panjarasi" },
];

export function LoginPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setPhase(((now - start) / 1000) * 2.1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { email, password }
          : { fullName, university, faculty, studentGroup, email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kirishda xatolik yuz berdi");
        setLoading(false);
        return;
      }
      const role = data.user?.role;
      if (role === "admin" || role === "darksystem") {
        router.push("/darksystem");
      } else if (role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/labs/metrology");
      }
      router.refresh();
    } catch {
      setError("Server bilan aloqa o‘rnatilmadi.");
      setLoading(false);
    }
  }

  const pendAngle = 0.38 * Math.cos(phase);
  const bobX = 110 + 58 * Math.sin(pendAngle);
  const bobY = 20 + 58 * Math.cos(pendAngle);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Institutional Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1E3A8A] text-white shadow-xs">
              <Atom className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                FizikaLab — Akademik Virtual Laboratoriya Platformasi
              </div>
              <div className="text-[11px] text-slate-500">
                Oliy ta’lim muassasalari uchun raqamli fizika tajriba majmuasi
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Auth Workbench */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="grid w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12">
          {/* Left Panel: Academic Syllabus & Live Apparatus Schematic */}
          <div className="flex flex-col justify-between border-b border-slate-200 bg-slate-50/70 p-6 sm:p-8 lg:col-span-7 lg:border-b-0 lg:border-r">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Rasmiy Ilmiy-O‘quv Laboratoriya Muhiti
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  75 ta Asbob · 100+ Formula
                </span>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Fizika fanidan interaktiv laboratoriya va hisob-kitob majmuasi
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Har bir tajriba server tomonida differensial tenglama yechuvchisi (RK4),
                  elektr zanjir matritsasi (MNA), Snellius va Koshi optik modellashtirishi hamda
                  statistik xatoliklar tahlili asosida hisoblanadi.
                </p>
              </div>

              {/* Compact Dual Apparatus Preview Card */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="lab-grid rounded-lg border border-slate-200 p-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-[#1E3A8A]" />
                      Jonli Mexanik Model
                    </span>
                    <span className="font-mono text-[#1E3A8A]">RK4</span>
                  </div>
                  <svg viewBox="0 0 220 96" className="h-24 w-full">
                    <line x1={30} y1={16} x2={190} y2={16} stroke="#334155" strokeWidth="2.5" />
                    <line x1={110} y1={16} x2={110} y2={88} stroke="#CBD5E1" strokeDasharray="3 3" />
                    <line x1={110} y1={16} x2={bobX} y2={bobY} stroke="#1E3A8A" strokeWidth="2" />
                    <circle cx={110} cy={16} r={3.5} fill="#0F172A" />
                    <circle cx={bobX} cy={bobY} r={9} fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="lab-grid rounded-lg border border-slate-200 p-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#1E3A8A]" />
                      Prizma & Optik Skameyka
                    </span>
                    <span className="font-mono text-[#1E3A8A]">Koshi n(λ)</span>
                  </div>
                  <svg viewBox="0 0 220 96" className="h-24 w-full">
                    <polygon points="110,16 74,80 146,80" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2" />
                    <line x1={20} y1={58} x2={89} y2={52} stroke="#0F172A" strokeWidth="2" />
                    <line x1={89} y1={52} x2={132} y2={56} stroke="#475569" strokeWidth="1.5" />
                    <line x1={132} y1={56} x2={200} y2={76} stroke="#6D28D9" strokeWidth="1.8" />
                    <line x1={132} y1={56} x2={200} y2={67} stroke="#15803D" strokeWidth="1.8" />
                    <line x1={132} y1={56} x2={200} y2={59} stroke="#B91C1C" strokeWidth="1.8" />
                  </svg>
                </div>
              </div>

              {/* 6 Modules Compact Grid */}
              <div className="grid gap-2 sm:grid-cols-2">
                {MODULES.map((m) => (
                  <div
                    key={m.num}
                    className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1E3A8A]">
                      {m.num}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">{m.name}</div>
                      <div className="truncate text-[11px] text-slate-500">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-[#1E3A8A]" /> 75 ta qurilma katalogi
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-[#1E3A8A]" /> 100+ KaTeX formulalar
              </span>
              <span className="inline-flex items-center gap-1">
                <FileCheck2 className="h-3.5 w-3.5 text-[#1E3A8A]" /> Hisobot va baholash tizimi
              </span>
            </div>
          </div>

          {/* Right Panel: Clean Institutional Login / Student Registration */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-5">
            <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition cursor-pointer ${
                  tab === "login"
                    ? "bg-white text-[#1E3A8A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Tizimga kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition cursor-pointer ${
                  tab === "register"
                    ? "bg-white text-[#1E3A8A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Ro‘yxatdan o‘tish
              </button>
            </div>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {tab === "login"
                  ? "Shaxsiy kabinetga kirish"
                  : "Talaba hisobini yaratish"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {tab === "login"
                  ? "Elektron pochta va parolingizni kiriting."
                  : "Universitet, fakultet va akademik guruhingizni to‘liq kiriting."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "register" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        F.I.Sh. *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Karimov Jasur"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Akademik guruh *
                      </label>
                      <input
                        type="text"
                        required
                        value={studentGroup}
                        onChange={(e) => setStudentGroup(e.target.value)}
                        placeholder="Masalan: FI-202"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Universitet / OTM *
                      </label>
                      <input
                        type="text"
                        required
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Masalan: O‘zMU"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Fakultet *
                      </label>
                      <input
                        type="text"
                        required
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        placeholder="Masalan: Fizika fakulteti"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Elektron pochta (Email)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ism@university.uz"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-9 text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Parolni ko'rsatish"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554] disabled:opacity-50 cursor-pointer"
              >
                <FlaskConical className="h-4 w-4" />
                {loading
                  ? "Tekshirilmoqda..."
                  : tab === "login"
                  ? "Tizimga kirish"
                  : "Ro‘yxatdan o‘tish"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-[11px] text-slate-500">
        FizikaLab · Akademik Virtual Fizika Laboratoriyasi
      </footer>
    </div>
  );
}
