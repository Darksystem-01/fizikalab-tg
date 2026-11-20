"use client";

import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Film,
  FlaskConical,
  HelpCircle,
  Layers,
  Maximize2,
  Play,
  RotateCcw,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import type { VideoLabDefinition, VideoTimestampBookmark } from "@/lib/videoLabs";

interface VideoLabModalProps {
  video: VideoLabDefinition;
  isOpen: boolean;
  onClose: () => void;
  onApplySimulatorPreset?: () => void;
}

export function VideoLabModal({
  video,
  isOpen,
  onClose,
  onApplySimulatorPreset,
}: VideoLabModalProps) {
  const [activeTab, setActiveTab] = useState<
    "stages" | "apparatus" | "formulas" | "comparison" | "checklist"
  >("stages");
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [useGoogleDrive, setUseGoogleDrive] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentEmbedUrl =
    useGoogleDrive && video.googleDrivePreviewUrl
      ? video.googleDrivePreviewUrl
      : `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&start=${activeSeconds}`;

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const totalChecks = video.observationChecklist.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-400">
                  {video.discipline}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" /> {video.duration}
                </span>
              </div>
              <h2 className="line-clamp-1 text-sm font-bold text-white sm:text-base">
                {video.titleUz}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {video.googleDrivePreviewUrl && (
              <button
                type="button"
                onClick={() => setUseGoogleDrive((v) => !v)}
                className={`hidden rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:inline-flex items-center gap-1.5 border ${
                  useGoogleDrive
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Google Drive / YouTube o'rtasida almashtirish"
              >
                <span>{useGoogleDrive ? "Google Drive Pleeri" : "YouTube Pleeri"}</span>
              </button>
            )}

            {onApplySimulatorPreset && (
              <button
                type="button"
                onClick={() => {
                  onApplySimulatorPreset();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Simulyatorda Qaytarish</span>
                <span className="sm:hidden">Simulyator</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Yopish"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Split Player and Interactive Control Panel */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left Column: Embedded Zero-Redirect Video Player */}
          <div className="flex flex-col bg-black lg:col-span-7 xl:col-span-8">
            <div className="relative aspect-video w-full bg-slate-950">
              <iframe
                key={`${currentEmbedUrl}-${activeSeconds}`}
                src={currentEmbedUrl}
                title={video.titleUz}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            {/* Quick Bookmark Toolbar */}
            <div className="border-t border-slate-800 bg-slate-900/95 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  ⏱ Tezkor Tajriba Bosqichlariga O‘tish:
                </span>
                <span className="text-[11px] text-slate-400">
                  Bosqichni tanlang: video bevosita shu daqiqadan boshlanadi
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {video.timestamps.map((ts, idx) => {
                  const isSelected = activeSeconds === ts.seconds;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSeconds(ts.seconds)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs font-semibold"
                          : "border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span className="font-mono text-[11px] text-blue-300">
                        [{ts.timeLabel}]
                      </span>
                      <span className="line-clamp-1 max-w-[130px] sm:max-w-[200px]">
                        {ts.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Academic Summary Strip */}
            <div className="hidden border-t border-slate-800/80 bg-slate-950/60 p-3 sm:block">
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-blue-400">Akademik Maqsad: </strong>
                {video.academicObjective}
              </p>
            </div>
          </div>

          {/* Right Column: Tabbed Information, Checklist, Apparatus & Formulas */}
          <div className="flex flex-col border-t border-slate-800 bg-slate-900 lg:col-span-5 lg:border-t-0 lg:border-l xl:col-span-4">
            {/* Tab Buttons */}
            <div className="flex shrink-0 border-b border-slate-800 bg-slate-950/40 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("stages")}
                className={`flex-1 py-2.5 px-2 text-center font-medium transition border-b-2 ${
                  activeTab === "stages"
                    ? "border-blue-500 text-blue-400 bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Bosqichlar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("apparatus")}
                className={`flex-1 py-2.5 px-2 text-center font-medium transition border-b-2 ${
                  activeTab === "apparatus"
                    ? "border-blue-500 text-blue-400 bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Jihozlar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("formulas")}
                className={`flex-1 py-2.5 px-2 text-center font-medium transition border-b-2 ${
                  activeTab === "formulas"
                    ? "border-blue-500 text-blue-400 bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Formulalar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("comparison")}
                className={`flex-1 py-2.5 px-2 text-center font-medium transition border-b-2 ${
                  activeTab === "comparison"
                    ? "border-blue-500 text-blue-400 bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Solishtirish
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("checklist")}
                className={`flex-1 py-2.5 px-2 text-center font-medium transition border-b-2 ${
                  activeTab === "checklist"
                    ? "border-blue-500 text-blue-400 bg-slate-800/50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Nazorat ({completedChecks}/{totalChecks})
              </button>
            </div>

            {/* Tab Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* STAGES TAB */}
              {activeTab === "stages" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Eksperiment Xronologiyasi & Asosiy Kuzatishlar
                  </div>
                  {video.timestamps.map((ts, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSeconds(ts.seconds)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        activeSeconds === ts.seconds
                          ? "border-blue-500 bg-blue-950/40 text-white"
                          : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {ts.timeLabel}
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {idx + 1}-bosqich
                        </span>
                      </div>
                      <h4 className="mt-1 text-xs font-semibold text-white">
                        {ts.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                        {ts.description}
                      </p>
                      <div className="mt-2 rounded-md bg-slate-900/80 p-2 text-[11px] text-slate-300 border border-slate-800">
                        <strong className="text-emerald-400">🔬 Asosiy kuzatuv: </strong>
                        {ts.keyObservation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* APPARATUS TAB */}
              {activeTab === "apparatus" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tajribada Foydalanilgan Haqiqiy Fizik Jihozlar
                  </div>
                  {video.apparatus.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-800/40 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Wrench className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            {item.name}
                          </h4>
                          <div className="mt-1 text-[11px] font-mono text-amber-300/90">
                            {item.specification}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-300">
                            <strong>Vazifasi: </strong>
                            {item.purpose}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FORMULAS TAB */}
              {activeTab === "formulas" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nazariy Modellar & Ishchi Formulalar
                  </div>
                  {video.keyFormulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 space-y-1.5"
                    >
                      <span className="text-[11px] font-medium text-slate-400">
                        {f.description}
                      </span>
                      <div className="overflow-x-auto rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-blue-300 text-center">
                        {f.latex}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* COMPARISON TAB */}
              {activeTab === "comparison" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Real Tajriba va Virtual Stend Solishtirmasi
                  </div>

                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3">
                    <span className="text-[11px] font-bold uppercase text-blue-400">
                      Tegishli Virtual Preset
                    </span>
                    <div className="mt-1 text-xs font-semibold text-white">
                      {video.simulatorComparison.simulatorPreset}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300">
                      <strong>Haqiqiy parametrlar: </strong>
                      <span className="font-mono text-blue-300">
                        {video.simulatorComparison.realParameters}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">
                      <strong>Kutilayotgan nisbiy og‘ish: </strong>
                      <span className="font-semibold text-emerald-400">
                        {video.simulatorComparison.expectedDeviationPct}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                    <span className="text-[11px] font-semibold text-amber-400">
                      Eksperimental Xatoliklar Manbalari (Real sharoit):
                    </span>
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                      {video.simulatorComparison.errorSources.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>

                  {onApplySimulatorPreset && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplySimulatorPreset();
                        onClose();
                      }}
                      className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 shadow-md flex items-center justify-center gap-2"
                    >
                      <FlaskConical className="h-4 w-4" />
                      Ushbu parametrlarni simulyatorga o‘rnatish
                    </button>
                  )}
                </div>
              )}

              {/* CHECKLIST TAB */}
              {activeTab === "checklist" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Kuzatuv Nazorat Savollari
                    </span>
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      {completedChecks} / {totalChecks} bajarildi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Videoni tomosha qilish davomida quyidagi mezonlarni tekshirib chiqing:
                  </p>

                  <div className="space-y-2">
                    {video.observationChecklist.map((item, idx) => {
                      const isDone = Boolean(checkedItems[idx]);
                      return (
                        <label
                          key={idx}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition ${
                            isDone
                              ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-200"
                              : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleCheck(idx)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs leading-snug">{item}</span>
                        </label>
                      );
                    })}
                  </div>

                  {completedChecks === totalChecks && totalChecks > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>
                        Barcha kuzatish mezonlari bajarildi! Endi simulyatorda hisobot topshirishingiz mumkin.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-800 bg-slate-950/80 p-3 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Id: <span className="font-mono text-slate-300">{video.id}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
