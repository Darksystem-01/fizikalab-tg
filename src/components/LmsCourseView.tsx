"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Lock,
  PlayCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  calculateStudentRank,
  checkModuleUnlockStatus,
  UNIVERSITY_COURSES,
  UniversityCourse,
} from "@/lib/lms";

interface LmsCourseViewProps {
  userRole: string;
  userName: string;
}

export function LmsCourseView({ userRole, userName }: LmsCourseViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("phys-101");
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(["m1-item-1", "m1-item-2", "m1-item-3", "m1-item-4", "m2-item-1"])
  );
  const [totalXp, setTotalXp] = useState<number>(1420);
  const [streakDays, setStreakDays] = useState<number>(5);

  const currentCourse = useMemo(() => {
    return (
      UNIVERSITY_COURSES.find((c) => c.id === selectedCourseId) ||
      UNIVERSITY_COURSES[0]
    );
  }, [selectedCourseId]);

  const rank = useMemo(() => calculateStudentRank(totalXp), [totalXp]);

  // Overall course progress
  const totalItemsCount = useMemo(() => {
    return currentCourse.modules.reduce((acc, m) => acc + m.items.length, 0);
  }, [currentCourse]);

  const completedInCurrentCourse = useMemo(() => {
    let count = 0;
    currentCourse.modules.forEach((m) => {
      m.items.forEach((item) => {
        if (completedItems.has(item.id)) count++;
      });
    });
    return count;
  }, [currentCourse, completedItems]);

  const progressPercent = Math.round((completedInCurrentCourse / totalItemsCount) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner: Student Mastery & Gamification */}
      <div className="rounded-xl border border-blue-900/20 bg-linear-to-r from-blue-950 via-slate-900 to-blue-900 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
              <GraduationCap className="h-4 w-4" />
              <span>Oliy Ta'lim Davlat Standartlari Asosidagi LMS</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Universitet Fizika Kurslari & Akademik Sillabus
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Kredit-modul tizimi (HEMIS) talablariga mos ketma-ketlik. Har bir modul nazariy tayyorgarlik, kirish testi, virtual laboratoriya eksperimenti va xatoliklar tahlilini qamrab oladi.
            </p>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
            {/* Streak */}
            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Flame className="h-5 w-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold">{streakDays} kun</div>
                <div className="text-[10px] text-slate-300">Faollik zanjiri</div>
              </div>
            </div>

            {/* XP & Level */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="h-5 w-5 fill-emerald-400 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold">{totalXp} XP · {rank.level}-daraja</div>
                <div className="text-[10px] text-slate-300 font-medium">{rank.title}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Selection Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {UNIVERSITY_COURSES.map((course) => {
            const active = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-blue-950 shadow-md font-bold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{course.code}: {course.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Overview & Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-900">
              {currentCourse.code} · {currentCourse.semester}-semestr ({currentCourse.totalCredits} ECTS kredit)
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {completedInCurrentCourse} / {totalItemsCount} topshiriq yakunlandi ({progressPercent}%)
            </span>
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900">{currentCourse.title}</h2>
          <p className="mt-1 text-xs text-slate-600 leading-normal">{currentCourse.description}</p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Certificate Eligibility Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Award className="h-4 w-4 text-amber-600" />
              <span>Akademik Sertifikat</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
              Barcha 4 ta asosiy laboratoriya topshiriqlarini kamida 60 ball bilan yakunlang va verifikatsiyalangan QR-sertifikatga ega bo‘ling.
            </p>
          </div>
          <Link
            href="/verify/cert-phys101-demo"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/60 shadow-2xs transition-colors"
          >
            <span>Namunaviy Sertifikatni ko‘rish</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Modules List with Prerequisite Locks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>O‘quv Modullari va Amaliy Topshiriqlar</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-normal">
            {currentCourse.modules.length} ta modul
          </span>
        </h3>

        <div className="space-y-4">
          {currentCourse.modules.map((mod, modIdx) => {
            const unlockStatus = checkModuleUnlockStatus(currentCourse, modIdx, completedItems);
            const isUnlocked = unlockStatus.isUnlocked;

            return (
              <div
                key={mod.id}
                className={`rounded-xl border transition-all ${
                  isUnlocked
                    ? "border-slate-200 bg-white shadow-2xs"
                    : "border-slate-200 bg-slate-50 opacity-75"
                }`}
              >
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 p-5 gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                        isUnlocked
                          ? "bg-blue-900 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isUnlocked ? mod.orderIndex : <Lock className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                        {!isUnlocked && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Qulflangan
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 leading-normal">{mod.description}</p>
                    </div>
                  </div>

                  {!isUnlocked && unlockStatus.reason && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 border border-amber-200 max-w-sm">
                      ⚠️ {unlockStatus.reason}
                    </div>
                  )}
                </div>

                {/* Module Items (Theory, Pre-quiz, Lab, Post-quiz) */}
                <div className="divide-y divide-slate-100 p-2">
                  {mod.items.map((item) => {
                    const isDone = completedItems.has(item.id);
                    const itemHref =
                      item.itemType === "lab"
                        ? `/labs/${item.refKey}`
                        : item.itemType === "problem"
                        ? `/practice#${item.refKey}`
                        : `/labs/${mod.labKey}`;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : isUnlocked ? (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  item.itemType === "lab"
                                    ? "bg-purple-50 text-purple-700"
                                    : item.itemType === "pre_quiz"
                                    ? "bg-amber-50 text-amber-700"
                                    : item.itemType === "theory"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {item.itemType === "lab"
                                  ? "Virtual Laboratoriya"
                                  : item.itemType === "pre_quiz"
                                  ? "Kirish Testi"
                                  : item.itemType === "theory"
                                  ? "Nazariya"
                                  : "Masala"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <span className="text-[11px] text-slate-400">{item.estimatedMinutes} daqiqa</span>
                          {isUnlocked ? (
                            <Link
                              href={itemHref}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isDone
                              ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                              : "bg-blue-900 text-white hover:bg-blue-800"
                          }`}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>{isDone ? "Qayta ko‘rish" : "Boshlash"}</span>
                        </Link>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium px-3 py-1.5">
                              Yopiq
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
