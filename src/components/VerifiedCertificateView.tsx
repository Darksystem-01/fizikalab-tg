"use client";

import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  Download,
  GraduationCap,
  Printer,
  QrCode,
  ShieldCheck,
} from "lucide-react";

interface VerifiedCertificateViewProps {
  certificateId: string;
}

export function VerifiedCertificateView({ certificateId }: VerifiedCertificateViewProps) {
  const student = {
    fullName: "Javohir Toshmatov",
    university: "O‘zbekiston Milliy Universiteti",
    faculty: "Fizika fakulteti",
    group: "FIZ-21/04",
    courseTitle: "Umumiy Fizika I: Klassik Mexanika va Termodinamika",
    courseCode: "FIZ-101 (5 ECTS Kredit)",
    completionDate: "2026-yil 15-noyabr",
    finalGrade: 94,
    letterGrade: "A (A'lo)",
    verifierUuid: certificateId || "CERT-2026-FIZ101-9842F",
    instructorName: "Prof. A. S. Karimov, Fizika-matematika fanlari doktori",
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/courses"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Kurslarga qaytish</span>
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Chop etish / PDF saqlash</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="relative rounded-2xl border-8 border-double border-amber-600/30 bg-radial from-amber-50/40 via-white to-amber-50/20 p-8 sm:p-12 shadow-2xl text-center overflow-hidden">
        {/* Subtle Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <GraduationCap className="h-96 w-96 text-slate-900" />
        </div>

        {/* Certificate Header */}
        <div className="relative z-10 space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-50 text-amber-700 shadow-inner">
            <Award className="h-8 w-8" />
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-800">
            O‘zbekiston Respublikasi Oliy Ta'lim, Fan va Innovatsiyalar Vazirligi
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-wide text-slate-900 sm:text-4xl">
            AKADEMIK SERTIFIKAT
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            FizikaLab Virtual Laboratoriya LMS Tizimi
          </p>
        </div>

        {/* Certificate Body */}
        <div className="relative z-10 my-8 space-y-4">
          <p className="text-xs text-slate-600 italic">
            Ushbu hujjat tasdiqlaydiki, quyidagi talaba dastur talablarini to‘liq bajardi:
          </p>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-blue-950 underline decoration-amber-500/50 underline-offset-8">
            {student.fullName}
          </div>
          <p className="text-xs font-medium text-slate-700">
            {student.university} · {student.faculty} ({student.group})
          </p>

          <div className="mx-auto my-6 max-w-xl rounded-xl border border-slate-200 bg-white/80 p-4 shadow-xs">
            <p className="text-xs text-slate-500">Tamomlagan fan kursi:</p>
            <div className="text-sm font-bold text-slate-900">{student.courseTitle}</div>
            <div className="mt-1 flex items-center justify-center gap-3 text-xs text-slate-600">
              <span>Kurs kodi: <strong>{student.courseCode}</strong></span>
              <span>·</span>
              <span>Yakuniy baho: <strong className="text-emerald-700">{student.finalGrade} ball ({student.letterGrade})</strong></span>
            </div>
          </div>

          <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-600">
            Talaba mazkur kurs doirasidagi barcha virtual laboratoriya stendlarida o‘lchashlarni amalga oshirdi, asboblar xatoligi va statistik tahlilni to‘liq bajardi hamda hisobotlarni a'lo darajada himoya qildi.
          </p>
        </div>

        {/* Certificate Footer: Signatures & QR Verification */}
        <div className="relative z-10 mt-10 grid grid-cols-1 sm:grid-cols-3 items-end border-t border-slate-200 pt-6 gap-6 text-left">
          {/* Instructor Signature */}
          <div>
            <div className="font-serif text-xs italic text-slate-800 border-b border-slate-400 pb-1">
              Prof. A. S. Karimov
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Kafedra mudiri / Mas'ul o‘qituvchi
            </div>
          </div>

          {/* Verification Stamp & QR Code */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-slate-300 bg-white p-1 shadow-xs">
              <QrCode className="h-full w-full text-slate-800" />
            </div>
            <div className="mt-1 font-mono text-[9px] text-slate-500">
              ID: {student.verifierUuid}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>Raqamli tasdiqlangan</span>
            </div>
          </div>

          {/* Date & Registry */}
          <div className="text-right">
            <div className="font-semibold text-xs text-slate-800 border-b border-slate-400 pb-1">
              {student.completionDate}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Rasmiy berilgan sana · Toshkent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
