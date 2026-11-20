"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Smartphone,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Flame,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isPending, startTransition] = useTransition();

  // Registration state
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpPhone, setOtpPhone] = useState("");

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [hasMinLength, hasUpper && hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!termsAccepted) {
      setErrorMessage("Foydalanish shartlariga rozilik bildirishingiz kerak.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Kiritilgan parollar bir-biriga mos kelmadi.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname,
            phone,
            password,
            termsAccepted,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Ro'yxatdan o'tishda xatolik.");
          return;
        }

        setSuccessMessage("Tasdiqlash kodi yuborildi!");
        setOtpPhone(data.phone || phone);
        setOtpStep(true);
      } catch {
        setErrorMessage("Internet bilan aloqa uzildi.");
      }
    });
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: otpPhone,
            code: otpCode,
            purpose: "register",
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || "Kod xato kiritildi.");
          return;
        }

        setSuccessMessage("Muvaffaqiyatli! Lenta ochilmoqda...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } catch {
        setErrorMessage("Tasdiqlashda xatolik yuz berdi.");
      }
    });
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: loginIdentifier,
            password: loginPassword,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.pendingOtp) {
            setOtpPhone(loginIdentifier);
            setOtpStep(true);
            setErrorMessage("Akkauntingiz hali tasdiqlanmagan. Iltimos, SMS kodni tasdiqlang.");
            return;
          }
          setErrorMessage(data.error || "Login yoki parol noto'g'ri.");
          return;
        }

        setSuccessMessage("Xush kelibsiz! Lenta yuklanmoqda...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500);
      } catch {
        setErrorMessage("Aloqa xatosi yuz berdi.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">FizikaLab Reels</h1>
          <p className="text-xs text-slate-400 mt-1">Fizika har bir talabaning ekranida — 60 soniyada!</p>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* OTP Step Modal/Overlay */}
        {otpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">SMS Kodni Kiriting</h2>
              <p className="text-xs text-slate-400">
                <span className="text-blue-400 font-medium">{otpPhone}</span> raqamiga yuborilgan 6 xonali tasdiqlash
                kodini kiriting.
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg disabled:opacity-50"
            >
              {isPending ? "Tekshirilmoqda..." : "Kodni Tasdiqlash"}
            </button>

            <button
              type="button"
              onClick={() => setOtpStep(false)}
              className="w-full text-xs text-slate-400 hover:text-slate-300 transition text-center"
            >
              &larr; Raqamni o&apos;zgartirish
            </button>
          </form>
        ) : (
          <>
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setErrorMessage("");
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  tab === "login" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMessage("");
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  tab === "register" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Ro&apos;yxatdan o&apos;tish
              </button>
            </div>

            {/* Login Tab */}
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telefon raqam yoki Nickname
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="+998 90 123 45 67 yoki student_nick"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Parol</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? "Tekshirilmoqda..." : "Kirish"} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Register Tab */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Taxallus (Nickname) *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="masalan: fizika_talaba"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefon raqam *</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Parol *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kamida 8 belgi, raqam va simvol"
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strengthScore <= 1
                              ? "w-1/4 bg-red-500"
                              : strengthScore === 2
                              ? "w-2/4 bg-amber-500"
                              : strengthScore === 3
                              ? "w-3/4 bg-yellow-400"
                              : "w-full bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                        <span className={hasMinLength ? "text-emerald-400" : ""}>
                          {hasMinLength ? "✓" : "○"} 8+ belgi
                        </span>
                        <span className={hasUpper && hasLower ? "text-emerald-400" : ""}>
                          {hasUpper && hasLower ? "✓" : "○"} Katta & kichik harf
                        </span>
                        <span className={hasNumber ? "text-emerald-400" : ""}>
                          {hasNumber ? "✓" : "○"} Raqam (0-9)
                        </span>
                        <span className={hasSpecial ? "text-emerald-400" : ""}>
                          {hasSpecial ? "✓" : "○"} Maxsus simvol (!@#$)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Parolni takrorlang *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Parolni qayta kiriting"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                  {confirmPassword.length > 0 && !isMatch && (
                    <span className="text-[10px] text-red-400 mt-1 block">Parollar mos kelmadi</span>
                  )}
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                    required
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight">
                    FizikaLab qoidalariga va universitet akademik mezonlariga to&apos;liq roziman.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !termsAccepted || strengthScore < 3}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? "Kutilmoqda..." : "SMS Kod Olish"} &rarr;
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <Link
            href="/legacy-labs"
            className="text-xs text-slate-500 hover:text-slate-400 transition inline-flex items-center gap-1"
          >
            Klassik simulyatsiya stendlari arxivi &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
