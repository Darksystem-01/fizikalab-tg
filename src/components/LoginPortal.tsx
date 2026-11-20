"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Script from "next/script";
import Link from "next/link";
import { UniversitySelect } from "./UniversitySelect";
import {
  Atom,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  FlaskConical,
  X,
  PlayCircle,
  ExternalLink,
} from "lucide-react";

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
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

function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.18 3.35-1.39 3.73-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Telegram?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTelegramAuth?: (user: any) => void;
  }
}

interface PendingGoogleProfile {
  credential?: string;
  accessToken?: string;
  onboardingToken?: string;
  email: string;
  fullName: string;
  googleId: string;
}

export function LoginPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return p.get("name") || "";
  });
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search);
    return p.get("google_error") || null;
  });

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [telegramAuth, setTelegramAuth] = useState<{
    token: string;
    botUrl: string;
    verified: boolean;
  } | null>(null);

  // Real-time Telegram Deep-Link Login Poller
  useEffect(() => {
    if (!telegramAuth || telegramAuth.verified) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check_token", token: telegramAuth.token }),
        });
        const data = await res.json();
        if (data.verified && data.user) {
          setTelegramAuth((prev) => (prev ? { ...prev, verified: true } : null));
          clearInterval(timer);
          const role = data.user.role;
          let target = "/labs/metrology";
          if (role === "admin" || role === "darksystem") target = "/darksystem";
          else if (role === "teacher") target = "/teacher";
          window.location.assign(target);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(timer);
  }, [telegramAuth]);

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleProfile | null>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search);
    if (p.get("google_onboarding") === "1") {
      return {
        email: p.get("email") || "",
        fullName: p.get("name") || "",
        googleId: p.get("google_id") || "",
        onboardingToken: p.get("token") || "",
      };
    }
    return null;
  });
  const gisMountedRef = useRef(false);

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

  // Client-side hydration sync for URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("google_onboarding") === "1") {
      setPendingGoogleUser({
        email: p.get("email") || "",
        fullName: p.get("name") || "",
        googleId: p.get("google_id") || "",
        onboardingToken: p.get("token") || "",
      });
      if (p.get("name")) {
        setFullName(p.get("name") || "");
      }
    }
    if (p.get("google_error")) {
      setError(p.get("google_error"));
    }
  }, []);

  const processGoogleAuth = useCallback(
    async (payload: {
      credential?: string;
      accessToken?: string;
      onboardingToken?: string;
      fullName?: string;
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
            onboardingToken: data.onboardingToken || payload.onboardingToken,
            email: data.email,
            fullName: data.fullName || "",
            googleId: data.googleId || "",
          });
          if (data.fullName && !fullName) {
            setFullName(data.fullName);
          }
          setLoading(false);
          return;
        }

        const role = data.user?.role;
        let target = "/labs/metrology";
        if (role === "admin" || role === "darksystem") {
          target = "/darksystem";
        } else if (role === "teacher") {
          target = "/teacher";
        }
        window.location.assign(target);
      } catch {
        setError("Server bilan aloqa o‘rnatilmadi.");
        setLoading(false);
      }
    },
    [fullName]
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
        gisMountedRef.current = true;
      } catch {
        // Fallback gracefully
      }
    }
  }, [googleClientId, processGoogleAuth]);

  function handleGoogleButtonClick() {
    setLoading(true);
    if (typeof window !== "undefined") {
      document.cookie = "fizikalab_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/api/auth/google/start");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.onTelegramAuth = async (user: any) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Telegram orqali kirishda xatolik yuz berdi.");
          setLoading(false);
          return;
        }
        const role = data.user?.role;
        let target = "/labs/metrology";
        if (role === "admin" || role === "darksystem") {
          target = "/darksystem";
        } else if (role === "teacher") {
          target = "/teacher";
        }
        window.location.assign(target);
      } catch {
        setError("Telegram orqali kirishda server bilan aloqa o‘rnatilmadi.");
        setLoading(false);
      }
    };
  }, []);

  async function handleTelegramButtonClick() {
    setLoading(true);
    setError(null);

    // 1. Agar foydalanuvchi Telegram WebApp (Mini App) ichida bo'lsa
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
        });
        const data = await res.json();
        if (res.ok) {
          window.location.assign("/labs/metrology");
          return;
        } else {
          setError(data.error || "Telegram WebApp orqali kirishda xatolik yuz berdi.");
          setLoading(false);
          return;
        }
      } catch {
        setError("Telegram serveriga ulanishda xatolik yuz berdi.");
        setLoading(false);
        return;
      }
    }

    // 2. Oddiy veb-brauzerda: Telegram Bot orqali real vaqt parolsiz kirish (Deep-Link token)
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_token" }),
      });
      const data = await res.json();
      if (data.ok && data.token && data.botUrl) {
        setTelegramAuth({
          token: data.token,
          botUrl: data.botUrl,
          verified: false,
        });
        // Botni alohida oynada ochish
        window.open(data.botUrl, "_blank");
      } else {
        window.location.assign("https://t.me/Fizikatuitbot?start=login");
      }
    } catch {
      window.location.assign("https://t.me/Fizikatuitbot?start=login");
    } finally {
      setLoading(false);
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
      onboardingToken: pendingGoogleUser.onboardingToken,
      fullName: fullName.trim(),
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
        if (!fullName.trim()) {
          setError("Iltimos, to'liq ism-sharifingizni kiriting.");
          setLoading(false);
          return;
        }
        if (!studentGroup.trim()) {
          setError("Akademik guruhingizni kiriting.");
          setLoading(false);
          return;
        }
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
          ? { email: email.trim(), password }
          : {
              fullName: fullName.trim(),
              university,
              faculty,
              studentGroup: studentGroup.trim(),
              email: email.trim(),
              password,
            };
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
      let target = "/labs/metrology";
      if (role === "admin" || role === "darksystem") {
        target = "/darksystem";
      } else if (role === "teacher") {
        target = "/teacher";
      }
      window.location.assign(target);
    } catch {
      setError("Server bilan aloqa o‘rnatilmadi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-slate-900 font-sans antialiased">
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
              gisMountedRef.current = true;
            } catch {
              // fallback
            }
          }
        }}
      />

      {/* Modern Zoom-Style Header */}
      <header className="w-full bg-white border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4">
          {/* Brand Logo - Stylized Zoom-inspired Wordmark */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E71EB] text-white shadow-sm transition group-hover:bg-[#0B5CFF]">
              <Atom className="h-5 w-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div className="flex items-baseline tracking-tight">
              <span className="text-2xl sm:text-[26px] font-black tracking-tighter text-[#0E71EB]">
                fizika
              </span>
              <span className="text-2xl sm:text-[26px] font-bold tracking-tighter text-slate-800">
                lab
              </span>
            </div>
          </Link>

          {/* Top Right Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="text-slate-600 hidden sm:inline-block">
              {tab === "login" ? (
                <>
                  Yangi foydalanuvchimisiz?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      setError(null);
                    }}
                    className="font-semibold text-[#0E71EB] hover:text-[#0B5CFF] hover:underline cursor-pointer ml-1"
                  >
                    Ro‘yxatdan o‘tish
                  </button>
                </>
              ) : (
                <>
                  Hisobingiz bormi?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("login");
                      setError(null);
                    }}
                    className="font-semibold text-[#0E71EB] hover:text-[#0B5CFF] hover:underline cursor-pointer ml-1"
                  >
                    Tizimga kirish
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-600 hover:text-slate-900 transition font-medium cursor-pointer"
            >
              Yordam
            </button>

            <div className="flex items-center gap-1 text-slate-600 cursor-pointer font-medium hover:text-slate-900">
              <span>O‘zbekcha</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Spacious 2-Column Workbench */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: High-Tech Modern Promotional Card (Zoom 2026 Style) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E71EB] via-[#0B5CFF] to-[#043CB5] p-7 sm:p-10 text-white shadow-xl min-h-[460px] flex flex-col justify-between">
              {/* Atmospheric Glow Elements */}
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-400/25 blur-3xl pointer-events-none" />
              <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

              {/* Card Header & Badges */}
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-semibold tracking-wide text-white border border-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                  <span>FizikaLab 2026: Yangi Avlod</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight leading-tight text-white">
                  Yangi avlod virtual laboratoriyalari bilan tanishing
                </h2>

                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-lg">
                  Mexanika, Elektromagnetizm, Optika va Kvant fizikasi bo‘yicha 100% interaktiv
                  2D/3D simulyatsiyalar, video qo‘llanmalar va real vaqt matematik hisob-kitoblari.
                </p>
              </div>

              {/* Interactive Apparatus Preview Banner */}
              <div className="relative z-10 my-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-white shadow-inner">
                <div className="flex items-center justify-between text-xs font-medium text-blue-100 mb-2.5">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Jonli Stendlar va Video Darslar
                  </span>
                  <span className="font-mono text-[11px] text-cyan-200">8 ta yo‘nalish</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-black/15 p-2 border border-white/10">
                    <div className="font-semibold text-white">2D/3D Simulyator</div>
                    <div className="text-blue-200 text-[10px]">RK4 & MNA dvijogi</div>
                  </div>
                  <div className="rounded-lg bg-black/15 p-2 border border-white/10">
                    <div className="font-semibold text-white">Universitet Standarti</div>
                    <div className="text-blue-200 text-[10px]">HEMIS & ECTS moslik</div>
                  </div>
                </div>
              </div>

              {/* Call-to-action button */}
              <div className="relative z-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/video-labs"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#0E71EB] shadow-md transition hover:bg-blue-50 hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4 text-[#0E71EB]" />
                  <span>Laboratoriyalarni ko‘rish</span>
                </Link>

                <div className="text-[11px] text-blue-200 flex items-center gap-1.5 ml-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span>Xavfsiz va sertifikatlangan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Zoom-Style Sign-in Box */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center max-w-md mx-auto w-full">
            {pendingGoogleUser ? (
              /* Google Academic Profile Onboarding */
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Akademik ma‘lumotlar
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Laboratoriya topshiriqlari va baholaringizni biriktirish uchun universitetingizni
                    tanlang.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Google hisobi tasdiqlandi:
                  </div>
                  <div className="mt-1 font-mono text-xs text-emerald-700">
                    {pendingGoogleUser.email}
                  </div>
                </div>

                <form onSubmit={handleCompleteGoogleProfile} className="space-y-3.5">
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
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
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingGoogleUser(null)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E71EB] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B5CFF] disabled:opacity-50 cursor-pointer"
                    >
                      <FlaskConical className="h-4 w-4" />
                      {loading ? "Saqlanmoqda..." : "Ro‘yxatdan o‘tishni yakunlash"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Title */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-slate-900 leading-snug">
                    {tab === "login" ? "Tizimga kirish" : "Ro‘yxatdan o‘tish"}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    {tab === "login"
                      ? "Elektron pochta va parolingiz orqali shaxsiy kabinetga kiring."
                      : "Talaba hisobini ochish uchun ma'lumotlarni to'ldiring."}
                  </p>
                </div>

                {/* Main Email & Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {tab === "register" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          F.I.Sh. (Ism va Familiya) *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Karimov Jasur"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
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
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
                        />
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

                  {/* Email Input Field */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Elektron pochta (email)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Elektron pochta manzilingiz"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
                    />
                  </div>

                  {/* Password Input Field with toggle */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Parol
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Parolingizni kiriting"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-11 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0E71EB] focus:outline-none focus:ring-4 focus:ring-blue-100 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        aria-label="Parolni ko'rsatish"
                      >
                        {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  {/* Primary Solid Action Button (Zoom Style) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0E71EB] hover:bg-[#0B5CFF] text-white font-semibold text-base shadow-sm transition hover:shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-99"
                  >
                    <span>
                      {loading
                        ? "Tekshirilmoqda..."
                        : tab === "login"
                        ? "Kirish"
                        : "Ro‘yxatdan o‘tish"}
                    </span>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>

                {/* Or Sign In With Divider */}
                <div className="relative my-7 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full absolute" />
                  <span className="bg-white px-3 text-xs text-slate-400 font-medium relative">
                    yoki quyidagilar orqali kiring
                  </span>
                </div>

                {/* Social Login Buttons: ONLY Google and Telegram as explicitly commanded */}
                <div className="flex items-center justify-center gap-8">
                  {/* Google Button */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleGoogleButtonClick}
                      disabled={loading}
                      title="Google orqali kirish"
                      className="h-14 w-14 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 bg-white"
                    >
                      <GoogleIcon className="h-6 w-6" />
                    </button>
                    <span className="text-xs text-slate-600 font-medium mt-1.5">Google</span>
                  </div>

                  {/* Telegram Button */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleTelegramButtonClick}
                      disabled={loading}
                      title="Telegram orqali kirish"
                      className="h-14 w-14 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 bg-white"
                    >
                      <TelegramIcon className="h-7 w-7 text-[#24A1DE]" />
                    </button>
                    <span className="text-xs text-slate-600 font-medium mt-1.5">Telegram</span>
                  </div>
                </div>

                {/* Sub-links */}
                <div className="mt-7 text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs sm:text-sm text-[#0E71EB] hover:text-[#0B5CFF] hover:underline font-medium cursor-pointer"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>

                {/* Mobile view switch tab link */}
                <div className="mt-4 pt-4 border-t border-slate-100 text-center sm:hidden text-xs text-slate-600">
                  {tab === "login" ? (
                    <>
                      Hisobingiz yo‘qmi?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setTab("register");
                          setError(null);
                        }}
                        className="font-semibold text-[#0E71EB] hover:underline cursor-pointer"
                      >
                        Ro‘yxatdan o‘tish
                      </button>
                    </>
                  ) : (
                    <>
                      Hisobingiz bormi?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setTab("login");
                          setError(null);
                        }}
                        className="font-semibold text-[#0E71EB] hover:underline cursor-pointer"
                      >
                        Tizimga kirish
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Zoom-Style Clean Footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-6 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Yordam
            </button>
            <span>·</span>
            <span className="hover:text-slate-900 cursor-pointer">Foydalanish shartlari</span>
            <span>·</span>
            <span className="hover:text-slate-900 cursor-pointer">Maxfiylik siyosati</span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            FizikaLab 2026 — Oliy ta‘lim muassasalari uchun raqamli fizika laboratoriya majmuasi.
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <HelpCircle className="h-5 w-5 text-[#0E71EB]" />
                <span>Yordam va Yo‘riqnoma</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <b>FizikaLab platformasiga kirish:</b>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <b>Google hisobi:</b> Universitet yoki shaxsiy Gmail orqali bir bosishda kiring.
                </li>
                <li>
                  <b>Telegram bot:</b> @Fizikatuitbot orqali hisobingizni tasdiqlang va parolsiz
                  kiring.
                </li>
                <li>
                  <b>Email va parol:</b> Agar ro‘yxatdan o‘tgan bo‘lsangiz, pochta va parolingizni
                  kiriting.
                </li>
              </ul>
              <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
                Savollar va texnik yordam uchun:{" "}
                <a
                  href="https://t.me/Fizikatuitbot"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#0E71EB] underline"
                >
                  @Fizikatuitbot
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <span>Parolni qayta tiklash</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Akademik xavfsizlik qoidalariga ko‘ra, talaba va o‘qituvchilarning parollari
                universitet dekanati yoki HEMIS administratori orqali tasdiqlanadi.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <div className="font-semibold text-slate-900">Tezkor kirish usullari:</div>
                <div className="text-xs text-slate-600">
                  1. <b>Google orqali kirish</b> tugmasini bosing (parol talab etilmaydi).
                </div>
                <div className="text-xs text-slate-600">
                  2. <b>Telegram orqali kirish</b> tugmasini bosing yoki{" "}
                  <a
                    href="https://t.me/Fizikatuitbot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0E71EB] underline font-medium"
                  >
                    @Fizikatuitbot
                  </a>{" "}
                  ga kiring.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-xl bg-[#0E71EB] py-2.5 text-xs font-semibold text-white hover:bg-[#0B5CFF] transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
      {/* Telegram Deep-Link Login Modal */}
      {telegramAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
                <div className="h-8 w-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <TelegramIcon className="h-5 w-5 text-[#24A1DE]" />
                </div>
                <span>Telegram orqali kirish</span>
              </div>
              <button
                type="button"
                onClick={() => setTelegramAuth(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Parolsiz xavfsiz kirish uchun quyidagi tugma orqali rasmiy Telegram botimizga o‘ting va <b>«Boshlash» (Start)</b> tugmasini bosing:
              </p>

              <div className="py-2">
                <a
                  href={telegramAuth.botUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1E88C7] text-white py-3.5 px-4 font-semibold text-sm shadow-md transition hover:shadow-lg active:scale-98"
                >
                  <TelegramIcon className="h-5 w-5" />
                  <span>@Fizikatuitbot-da tasdiqlash</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Real-time Status Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
                {telegramAuth.verified ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Tasdiqlandi! Shaxsiy kabinetingizga yo‘naltirilmoqda...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 text-slate-600">
                    <span className="h-4 w-4 border-2 border-slate-300 border-t-[#24A1DE] rounded-full animate-spin" />
                    <span className="font-medium">Telegram botdan tasdiq kutilmoqda...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTelegramAuth(null)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
