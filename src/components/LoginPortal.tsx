"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Script from "next/script";
import { UniversitySelect } from "./UniversitySelect";
import {
  Atom,
  BookOpen,
  CheckCircle2,
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
  X,
} from "lucide-react";

const MODULES = [
  { num: "01", name: "Metrologiya va Asboblar", desc: "Verniy, Mikrometr, Sferometr, t'-mezoni" },
  { num: "02", name: "Kinematika & Ballistika", desc: "RK4 trayektoriya, havo qarshiligi, erkin tushish" },
  { num: "03", name: "Dinamika & Mayatniklar", desc: "Qiya tekislik, Kater mayatnigi, Guk, to'qnashuv" },
  { num: "04", name: "Statika & Muvozanat", desc: "360° kuchlar stoli, balka momentlari, polispast" },
  { num: "05", name: "Elektromagnetizm", desc: "MNA matritsa, Metr ko'prigi, KRO, Faradey" },
  { num: "06", name: "Geometrik & To'lqin Optika", desc: "Linzalar, Koshi prizmasi, Difraksiya panjarasi" },
];

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

interface PendingGoogleProfile {
  credential?: string;
  accessToken?: string;
  email: string;
  fullName: string;
  googleId: string;
}

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

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleProfile | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const gisMountedRef = useRef(false);

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

  // Fetch configured Google Client ID from backend
  useEffect(() => {
    fetch("/api/auth/google")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.clientId === "string") {
          setGoogleClientId(data.clientId);
        }
      })
      .catch(() => {});
  }, []);

  const processGoogleAuth = useCallback(
    async (payload: {
      credential?: string;
      accessToken?: string;
      university?: string;
      faculty?: string;
      studentGroup?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Google orqali kirishda xatolik yuz berdi.");
          setLoading(false);
          return;
        }

        if (data.needsAcademicProfile) {
          setPendingGoogleUser({
            credential: payload.credential,
            accessToken: payload.accessToken,
            email: data.email,
            fullName: data.fullName || "",
            googleId: data.googleId || "",
          });
          if (data.fullName) {
            setFullName(data.fullName);
          }
          setGoogleModalOpen(false);
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
    },
    [router]
  );

  // Initialize Google Identity Services when script loads & client_id is available
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.google?.accounts?.id &&
      googleClientId &&
      !gisMountedRef.current
    ) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              processGoogleAuth({ credential: response.credential });
            }
          },
          auto_select: false,
        });

        const btnDiv = document.getElementById("google-gis-button-slot");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 320,
          });
        }
        gisMountedRef.current = true;
      } catch {
        // Fallback gracefully
      }
    }
  }, [googleClientId, processGoogleAuth]);

  function handleGoogleButtonClick() {
    if (typeof window !== "undefined" && window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.prompt();
      } catch {
        setGoogleModalOpen(true);
      }
    } else {
      setGoogleModalOpen(true);
    }
  }

  async function handleCompleteGoogleProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    if (!university) {
      setError("Iltimos, O‘zbekistondagi tasdiqlangan OTMni tanlang.");
      return;
    }
    if (!faculty) {
      setError("Iltimos, ushbu universitetning tasdiqlangan fakultetini tanlang.");
      return;
    }
    if (!studentGroup.trim()) {
      setError("Akademik guruhingizni kiriting.");
      return;
    }

    await processGoogleAuth({
      credential: pendingGoogleUser.credential,
      accessToken: pendingGoogleUser.accessToken,
      university,
      faculty,
      studentGroup: studentGroup.trim(),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === "register") {
        if (!university) {
          setError("Iltimos, O‘zbekistondagi tasdiqlangan OTMni tanlang.");
          setLoading(false);
          return;
        }
        if (!faculty) {
          setError("Iltimos, ushbu universitetning tasdiqlangan fakultetini tanlang.");
          setLoading(false);
          return;
        }
      }

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
      {/* Official Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (googleClientId && window.google?.accounts?.id && !gisMountedRef.current) {
            try {
              window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response: { credential?: string }) => {
                  if (response.credential) {
                    processGoogleAuth({ credential: response.credential });
                  }
                },
                auto_select: false,
              });
              const btnDiv = document.getElementById("google-gis-button-slot");
              if (btnDiv) {
                window.google.accounts.id.renderButton(btnDiv, {
                  theme: "outline",
                  size: "large",
                  text: "continue_with",
                  shape: "rectangular",
                  width: 320,
                });
              }
              gisMountedRef.current = true;
            } catch {
              // fallback
            }
          }
        }}
      />

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

          {/* Right Panel: Clean Institutional Login / Student Registration / Academic Onboarding */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-5">
            {pendingGoogleUser ? (
              /* Google Academic Profile Onboarding */
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Google hisobi tasdiqlandi
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-emerald-700">
                    {pendingGoogleUser.email}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                    Laboratoriya topshiriqlari va baholaringizni biriktirish uchun ta’lim
                    muassasangiz hamda guruhingizni bir marta belgilang.
                  </p>
                </div>

                <form onSubmit={handleCompleteGoogleProfile} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      F.I.Sh. (Ism va Familiya) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masalan: Mahmudjon Tolqinov"
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

                  <UniversitySelect
                    university={university}
                    onUniversityChange={(uName) => setUniversity(uName)}
                    faculty={faculty}
                    onFacultyChange={(fName) => setFaculty(fName)}
                    required
                  />

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPendingGoogleUser(null)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#172554] disabled:opacity-50 cursor-pointer"
                    >
                      <FlaskConical className="h-4 w-4" />
                      {loading ? "Saqlanmoqda..." : "Ro‘yxatdan o‘tishni yakunlash"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
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
                      ? "Elektron pochta va parolingizni yoki Google hisobingizni ishlating."
                      : "Universitet, fakultet va guruhingizni to‘liq tanlang."}
                  </p>
                </div>

                {/* Google Sign-in Prominent Button */}
                <div className="mb-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleButtonClick}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400 cursor-pointer disabled:opacity-50"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>Google orqali kirish</span>
                  </button>
                  <div
                    id="google-gis-button-slot"
                    className="flex justify-center empty:hidden"
                  />
                </div>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium">
                      yoki pochta orqali
                    </span>
                  </div>
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
                      <UniversitySelect
                        university={university}
                        onUniversityChange={(uName) => setUniversity(uName)}
                        faculty={faculty}
                        onFacultyChange={(fName) => setFaculty(fName)}
                        required
                      />
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Google Sign-in Verification Modal (When GIS prompt needs token input or direct connection) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <GoogleIcon className="h-4 w-4" />
                Google orqali kirish
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Google hisobingiz xavfsiz OAuth 2.0 protokoli orqali tekshiriladi.
                Agar brauzeringizda Google Identity Services avtomatik ochilmagan bo‘lsa,
                Google ID token yoki kirish tokenini quyiga kiritib tizimga kirishingiz mumkin:
              </p>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Google Token (ID token yoki Access token)
                </label>
                <textarea
                  rows={3}
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                  className="w-full rounded-md border border-slate-300 font-mono text-[11px] p-2 focus:border-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  disabled={loading || !manualToken.trim()}
                  onClick={() => {
                    const token = manualToken.trim();
                    if (token.startsWith("ya29.")) {
                      processGoogleAuth({ accessToken: token });
                    } else {
                      processGoogleAuth({ credential: token });
                    }
                  }}
                  className="rounded-md bg-[#1E3A8A] px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-[#172554] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Tekshirilmoqda..." : "Tasdiqlash & Kirish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-[11px] text-slate-500">
        FizikaLab · Akademik Virtual Fizika Laboratoriyasi
      </footer>
    </div>
  );
}
