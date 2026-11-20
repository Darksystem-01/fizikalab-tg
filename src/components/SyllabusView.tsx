"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  MapPin,
  PlayCircle,
  Presentation,
  Sparkles,
  User,
  X,
} from "lucide-react";

interface LectureResource {
  name: string;
  type: string;
  size?: string;
  url: string;
}

interface LectureItem {
  id: number;
  number: number;
  title: string;
  summary: string;
  date: string;
  time: string;
  room: string;
  lecturer: string;
  resources: LectureResource[];
}

interface LabItem {
  id: number;
  key: string;
  number: number;
  title: string;
  hours: number;
  teacher: string;
  simulatorUrl: string;
  status: string;
}

interface PracticeItem {
  id: number;
  number: number;
  title: string;
  hours: number;
  teacher: string;
  practiceUrl: string;
  taskCount: number;
}

interface CourseInfo {
  title: string;
  code: string;
  department: string;
  lecturer: string;
  tutor: string;
  ects: number;
  totalHours: number;
  lectureHours: number;
  labHours: number;
  practiceHours: number;
  independentHours: number;
  academicYear: string;
  semester: string;
  curriculum: string;
}

export function SyllabusView() {
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [practices, setPractices] = useState<PracticeItem[]>([]);
  const [activeTab, setActiveTab] = useState<"lectures" | "labs" | "practices">("lectures");
  const [loading, setLoading] = useState(true);

  // Modal for previewing lecture material
  const [selectedLecture, setSelectedLecture] = useState<LectureItem | null>(null);

  useEffect(() => {
    fetch("/api/syllabus", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCourseInfo(data.courseInfo);
          setLectures(data.lectures || []);
          setLabs(data.labs || []);
          setPractices(data.practices || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
        Fan o&apos;quv rejasi va sillabus yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header Banner */}
      <div className="border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded bg-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-100 uppercase tracking-wider border border-blue-400/30">
                  {courseInfo?.code || "FIZ-101"}
                </span>
                <span className="rounded bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-400/30">
                  {courseInfo?.ects || 6} ECTS Kredit
                </span>
                <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                  Jami {courseInfo?.totalHours || 180} soat
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {courseInfo?.title || "Umumiy Fizika"}
              </h1>
              <p className="mt-1 text-xs text-blue-100/90">
                {courseInfo?.department} · Dotsent {courseInfo?.lecturer}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/assignments"
                className="inline-flex items-center gap-1.5 rounded-sm bg-white px-3.5 py-2 font-semibold text-blue-900 shadow-xs hover:bg-slate-100"
              >
                Topshiriqlar jadvaliga o&apos;tish →
              </Link>
            </div>
          </div>
        </div>

        {/* Hours breakdown bar */}
        <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 sm:grid-cols-4 border-b border-slate-200 bg-slate-50 text-slate-700 text-xs">
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ma&apos;ruza mashg&apos;uloti
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              {courseInfo?.lectureHours || 40} soat (20 ta mavzu)
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Laboratoriya ishlari
            </span>
            <span className="font-semibold text-blue-900 text-sm">
              {courseInfo?.labHours || 32} soat (8 ta stend)
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Amaliy seminar
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              {courseInfo?.practiceHours || 28} soat (7 ta seminar)
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Mustaqil ta&apos;lim
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              {courseInfo?.independentHours || 80} soat
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main HEMIS Tabs */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("lectures")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "lectures"
                ? "border-blue-900 text-blue-900 bg-blue-50/40"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Ma&apos;ruza ({lectures.length} ta)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "labs"
                ? "border-blue-900 text-blue-900 bg-blue-50/40"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Laboratoriya ({labs.length} ta)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("practices")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "practices"
                ? "border-blue-900 text-blue-900 bg-blue-50/40"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Amaliyot ({practices.length} ta)</span>
          </button>
        </div>

        {/* TAB 1: Lectures (20 topics) */}
        {activeTab === "lectures" && (
          <div className="space-y-3">
            {lectures.map((lec) => (
              <div
                key={lec.id}
                className="border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-bold text-blue-900">
                        {lec.number}-MAVZU
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {lec.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {lec.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {lec.room}
                      </span>
                      <span>•</span>
                      <span>{lec.lecturer}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{lec.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{lec.summary}</p>
                  </div>

                  {/* Actions & Resources */}
                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLecture(lec)}
                      className="inline-flex items-center gap-1.5 border border-blue-900 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Materiallarni ko&apos;rish
                    </button>
                  </div>
                </div>

                {/* Resource Links strip */}
                {lec.resources && lec.resources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                      Fayllar:
                    </span>
                    {lec.resources.map((res, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLecture(lec)}
                        className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        {res.type === "pdf" ? (
                          <FileText className="h-3 w-3 text-red-600" />
                        ) : res.type === "pptx" ? (
                          <Presentation className="h-3 w-3 text-amber-600" />
                        ) : res.type === "video" ? (
                          <PlayCircle className="h-3 w-3 text-blue-600" />
                        ) : (
                          <BookOpen className="h-3 w-3 text-emerald-600" />
                        )}
                        <span>{res.name}</span>
                        {res.size && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({res.size})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Labs (8 topics) */}
        {activeTab === "labs" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="flex flex-col justify-between border border-slate-200 bg-white p-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-bold text-blue-900">{lab.number}-LABORATORIYA</span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
                      {lab.hours} soat
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{lab.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">O&apos;qituvchi: {lab.teacher}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Interaktiv stend faol
                  </span>
                  <Link
                    href={lab.simulatorUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:underline"
                  >
                    Stendga o&apos;tish <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Practices (7 topics) */}
        {activeTab === "practices" && (
          <div className="space-y-3">
            {practices.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-slate-200 bg-white p-4 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                    <span className="font-bold text-blue-900">{pr.number}-AMALIYOT</span>
                    <span>•</span>
                    <span>{pr.hours} soat</span>
                    <span>•</span>
                    <span>{pr.teacher}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{pr.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Masalalar bankida ushbu bo&apos;lim bo&apos;yicha {pr.taskCount} ta masala mavjud
                  </p>
                </div>

                <Link
                  href={pr.practiceUrl}
                  className="inline-flex items-center gap-1.5 shrink-0 bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-950"
                >
                  Masalalar bankiga o&apos;tish <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Material View Modal */}
      {selectedLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Dars Materiallari: {selectedLecture.number}-Mavzu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLecture(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedLecture.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Sana: {selectedLecture.date}</span>
                  <span>Vaqt: {selectedLecture.time}</span>
                  <span>Xona: {selectedLecture.room}</span>
                  <span>O&apos;qituvchi: {selectedLecture.lecturer}</span>
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Mavzu Rejasi va Qisqacha Mazmuni
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedLecture.summary}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                  Biriktirilgan Resurslar va Qo&apos;llanmalar
                </span>
                <div className="space-y-2">
                  {selectedLecture.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {res.type === "pdf" ? (
                          <FileText className="h-5 w-5 text-red-600" />
                        ) : res.type === "pptx" ? (
                          <Presentation className="h-5 w-5 text-amber-600" />
                        ) : res.type === "video" ? (
                          <PlayCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-emerald-600" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{res.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Format: {res.type.toUpperCase()} {res.size ? `· ${res.size}` : ""}
                          </div>
                        </div>
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Download className="h-3 w-3" />
                        Yuklab olish
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedLecture(null)}
                className="bg-blue-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-950 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
