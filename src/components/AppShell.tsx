"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Atom,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  FlaskConical,
  Gauge,
  GraduationCap,
  LogOut,
  Menu,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Radiation,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";

export interface NavUser {
  userId?: number | string;
  id?: number | string;
  fullName: string;
  email: string;
  role: "admin" | "darksystem" | "teacher" | "student";
  studentGroup: string;
  university?: string;
  faculty?: string;
}

const HEMIS_ITEMS = [
  { href: "/profile", label: "Talaba Profili (HEMIS)", icon: User },
  { href: "/syllabus", label: "O'quv Rejasi & Sillabus", icon: GraduationCap },
  { href: "/assignments", label: "Topshiriqlar & Maqolalar", icon: FileText },
];

const NAV_ITEMS = [
  { href: "/labs/metrology", label: "1. Metrologiya va Asboblar", icon: Ruler },
  { href: "/labs/kinematics", label: "2. Kinematika & Ballistika", icon: Compass },
  { href: "/labs/dynamics", label: "3. Dinamika & Mayatniklar", icon: Gauge },
  { href: "/labs/statics", label: "4. Statika & Muvozanat", icon: Scale },
  { href: "/labs/electromagnetism", label: "5. Elektromagnetizm", icon: Zap },
  { href: "/labs/optics", label: "6. Geometrik & To‘lqin Optika", icon: Sparkles },
  { href: "/labs/thermodynamics", label: "7. Molekulyar & Termodinamika", icon: Thermometer },
  { href: "/labs/atomic", label: "8. Atom & Yadro Fizikasi", icon: Radiation },
];

const SECONDARY_ITEMS = [
  { href: "/interactive-labs", label: "16 ta Interaktiv Stendlar", icon: FlaskConical },
  { href: "/practice", label: "400 ta Masala & Mashqlar", icon: CheckCircle2 },
  { href: "/instruments", label: "75 ta Qurilma Katalogi", icon: Wrench },
  { href: "/reference", label: "100+ Formulalar & CODATA", icon: BookOpen },
  { href: "/reports", label: "Hisobotlarim & Topshiriqlar", icon: FileText },
];

export function AppShell({
  user,
  title,
  subtitle,
  children,
}: {
  user: NavUser;
  dbKind?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  const roleLabel =
    user.role === "admin"
      ? "Administrator"
      : user.role === "teacher"
      ? "Ustoz"
      : "Talaba";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-50 border-r border-slate-200">
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div className="mb-4 border-b border-slate-200 pb-3 px-1">
          <Link
            href={
              user.role === "admin" || user.role === "darksystem"
                ? "/darksystem"
                : user.role === "teacher"
                ? "/teacher"
                : "/labs/metrology"
            }
            className="flex items-center gap-2 text-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-blue-900 bg-blue-900 text-white">
              <Atom className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">FizikaLab</div>
              <div className="text-[11px] text-slate-500">Akademik Laboratoriya</div>
            </div>
          </Link>
        </div>

        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          HEMIS O&apos;quv Portali
        </div>
        <nav className="space-y-0.5 mb-4">
          {HEMIS_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors border-l-2 ${
                  active
                    ? "border-blue-900 bg-white text-blue-900 font-semibold shadow-2xs"
                    : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Laboratoriya Stendlari
        </div>
        <nav className="space-y-0.5 mb-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors border-l-2 ${
                  active
                    ? "border-blue-900 bg-white text-blue-900 font-semibold shadow-2xs"
                    : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Ma’lumotnoma & Jurnal
        </div>
        <nav className="space-y-0.5 mb-5">
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors border-l-2 ${
                  active
                    ? "border-blue-900 bg-white text-blue-900 font-semibold shadow-2xs"
                    : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {(user.role === "admin" || user.role === "darksystem" || user.role === "teacher") && (
          <>
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {user.role === "admin" || user.role === "darksystem"
                ? "Boshqaruv & Ustozlar"
                : "O‘qituvchi Paneli"}
            </div>
            <nav className="space-y-0.5">
              {(user.role === "admin" || user.role === "darksystem") && (
                <Link
                  href="/darksystem"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors border-l-2 ${
                    pathname === "/darksystem"
                      ? "border-blue-900 bg-white text-blue-900 font-semibold shadow-2xs"
                      : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Darksystem Boshqaruvi</span>
                </Link>
              )}
              <Link
                href="/teacher"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors border-l-2 ${
                  pathname === "/teacher"
                    ? "border-blue-900 bg-white text-blue-900 font-semibold shadow-2xs"
                    : "border-transparent text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span>Ustoz & Guruhlar Paneli</span>
              </Link>
            </nav>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="mb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-900">
              {user.role === "admin" || user.role === "darksystem"
                ? "Bosh Administrator"
                : user.fullName}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${
                user.role === "admin" || user.role === "darksystem"
                  ? "border-blue-900 text-blue-900 bg-blue-50"
                  : user.role === "teacher"
                  ? "border-emerald-700 text-emerald-800 bg-emerald-50"
                  : "border-slate-300 text-slate-700 bg-slate-50"
              }`}
            >
              {user.role === "admin" || user.role === "darksystem" ? "DARKSYSTEM" : roleLabel}
            </span>
          </div>
          <div className="truncate text-[11px] text-slate-500">
            {user.role === "admin" || user.role === "darksystem"
              ? "Maxsus Himoyalangan Konsol"
              : [user.university, user.studentGroup].filter(Boolean).join(" · ") || user.email}
          </div>
          <div className="truncate text-[10px] text-slate-400">
            {user.role === "admin" || user.role === "darksystem"
              ? "ID: [HIMOYALANGAN]"
              : user.email}
          </div>
          {user.role !== "admin" && user.role !== "darksystem" && (
            <Link
              href="/profile"
              className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
            >
              <User className="h-3 w-3" />
              HEMIS Profilim →
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-1.5 border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Tizimdan chiqish
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div className="w-68 bg-slate-50 shadow-xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-slate-900/30"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="border border-slate-300 p-1.5 text-slate-700 lg:hidden"
              aria-label="Menyu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
