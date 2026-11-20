"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Film,
  FlaskConical,
  Gauge,
  Layers,
  Play,
  Radiation,
  Ruler,
  Scale,
  Search,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";
import {
  VIDEO_LABS_CATALOG,
  type VideoLabDefinition,
} from "@/lib/videoLabs";
import { VideoLabModal } from "@/components/VideoLabModal";

const DISCIPLINE_ICONS: Record<string, any> = {
  metrology: Ruler,
  kinematics: Compass,
  dynamics: Gauge,
  statics: Scale,
  electromagnetism: Zap,
  optics: Sparkles,
  thermodynamics: Thermometer,
  atomic: Radiation,
};

export function VideoLabView() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<VideoLabDefinition | null>(null);

  const filteredVideos = VIDEO_LABS_CATALOG.filter((vid) => {
    const matchDisc =
      selectedDiscipline === "all" || vid.labKey === selectedDiscipline;
    const matchSearch =
      search.trim() === "" ||
      vid.titleUz.toLowerCase().includes(search.toLowerCase()) ||
      vid.discipline.toLowerCase().includes(search.toLowerCase()) ||
      vid.summaryUz.toLowerCase().includes(search.toLowerCase());
    return matchDisc && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/20 bg-linear-to-r from-[#1E3A8A] via-[#172554] to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
            <Film className="h-3.5 w-3.5" />
            <span>Haqiqiy Universitet Tajriba Stendlari</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl text-white">
            Jonli Fizik Tajribalar & Video Laboratoriya
          </h1>
          <p className="mt-2 text-sm text-blue-100 sm:text-base leading-relaxed">
            Hech qanday tashqi saytlarga o‘tmasdan, barcha 8 ta laboratoriya mavzusi bo‘yicha
            haqiqiy fizik asbob-uskunalar, o‘lchash usullari va fotodatchiklar orqali
            o‘tkazilgan real tajribalarni bevosita ushbu oynada tomosha qiling va
            olingan qiymatlarni virtual simulyatorimiz bilan taqqoslang.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tajriba nomi yoki asbob bo‘yicha qidirish..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-blue-900 focus:outline-hidden"
          />
        </div>

        {/* Discipline Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDiscipline("all")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              selectedDiscipline === "all"
                ? "bg-blue-900 text-white shadow-xs"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Barchasi ({VIDEO_LABS_CATALOG.length})
          </button>
          {VIDEO_LABS_CATALOG.map((vid) => {
            const Icon = DISCIPLINE_ICONS[vid.labKey] || FlaskConical;
            const isSel = selectedDiscipline === vid.labKey;
            return (
              <button
                key={vid.labKey}
                type="button"
                onClick={() => setSelectedDiscipline(vid.labKey)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isSel
                    ? "bg-blue-900 text-white shadow-xs font-semibold"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="capitalize">{vid.labKey}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {filteredVideos.map((vid) => {
          const Icon = DISCIPLINE_ICONS[vid.labKey] || FlaskConical;
          return (
            <div
              key={vid.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:border-blue-300 hover:shadow-md"
            >
              <div>
                {/* Thumbnail & Play Overlay */}
                <div
                  onClick={() => setActiveVideo(vid)}
                  className="relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-900"
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.titleUz}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition transform group-hover:scale-110">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    {vid.duration}
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-blue-900/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Icon className="h-3 w-3" />
                    <span className="capitalize">{vid.labKey}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    onClick={() => setActiveVideo(vid)}
                    className="cursor-pointer font-bold text-slate-900 line-clamp-2 hover:text-blue-900 text-sm"
                  >
                    {vid.titleUz}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {vid.summaryUz}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {vid.timestamps.slice(0, 3).map((ts, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                      >
                        {ts.timeLabel}
                      </span>
                    ))}
                    {vid.timestamps.length > 3 && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        +{vid.timestamps.length - 3} ta
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVideo(vid)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 py-1.5 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 shadow-xs"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Jonli Ko‘rish</span>
                </button>
                <Link
                  href={`/labs/${vid.labKey}`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:bg-slate-100 hover:text-blue-900"
                  title="Virtual Simulyatorga o'tish"
                >
                  <FlaskConical className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Modal */}
      {activeVideo && (
        <VideoLabModal
          video={activeVideo}
          isOpen={Boolean(activeVideo)}
          onClose={() => setActiveVideo(null)}
          onApplySimulatorPreset={() => {
            window.location.assign(`/labs/${activeVideo.labKey}`);
          }}
        />
      )}
    </div>
  );
}
