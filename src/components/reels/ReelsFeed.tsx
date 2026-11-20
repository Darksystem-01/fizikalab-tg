"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ReelCard, ReelData } from "./ReelCard";
import {
  Flame,
  MessageSquare,
  PlusCircle,
  User,
  FlaskConical,
  Search,
  Filter,
} from "lucide-react";

const TOPIC_FILTERS = [
  { slug: "all", title: "Barchasi" },
  { slug: "mexanika", title: "Mexanika" },
  { slug: "molekulyar-fizika", title: "Molekulyar" },
  { slug: "elektr", title: "Elektr" },
  { slug: "magnetizm", title: "Magnetizm" },
  { slug: "tebranishlar-tolqinlar", title: "To'lqinlar" },
  { slug: "optika", title: "Optika" },
  { slug: "kvant-fizikasi", title: "Kvant" },
  { slug: "atom-yadro", title: "Atom & Yadro" },
];

export function ReelsFeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Fetch reels
  useEffect(() => {
    setLoading(true);
    const url =
      selectedTopic === "all"
        ? "/api/reels"
        : `/api/reels?topic=${encodeURIComponent(selectedTopic)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.reels) {
          setReels(data.reels);
          setActiveIndex(0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTopic]);

  // Track active reel on scroll via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const height = container.clientHeight;
      const index = Math.round(container.scrollTop / height);
      if (index !== activeIndex && index >= 0 && index < reels.length) {
        setActiveIndex(index);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reels.length]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col justify-between">
      {/* Top Floating Topic Filter Pills */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 pb-3 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white font-extrabold text-sm tracking-tight bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
          >
            <Flame className="w-4 h-4 text-blue-500 fill-blue-500" /> FizikaLab
          </Link>
        </div>

        {/* Topic Horizontal Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[70%] pointer-events-auto pl-2">
          {TOPIC_FILTERS.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedTopic(t.slug)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition backdrop-blur-md ${
                selectedTopic === t.slug
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-black/40 text-slate-300 hover:text-white border border-white/10"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Snap Vertical Scroll Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Reels yuklanmoqda...</p>
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-6 text-center">
            <FlaskConical className="w-12 h-12 text-slate-600" />
            <h2 className="text-base font-bold text-white">Bu bo&apos;limda hozircha reels yo&apos;q</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Birinchi bo&apos;lib tajriba yoki masala yechimi videosini yuklang!
            </p>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Video yuklash &rarr;
            </Link>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="w-full h-screen snap-start snap-always relative flex items-center justify-center bg-black"
            >
              <ReelCard
                reel={reel}
                isActive={index === activeIndex}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            </div>
          ))
        )}
      </div>

      {/* Bottom Sticky Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-16 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-6 flex items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-blue-500 transition group"
        >
          <Flame className="w-5 h-5 fill-blue-500" />
          <span className="text-[10px] font-bold">Lenta</span>
        </Link>

        <Link
          href="/chat"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition group"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Chat</span>
        </Link>

        {/* Direct Upload Trigger */}
        <Link
          href="/admin"
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="p-3 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition">
            <PlusCircle className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/legacy-labs"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition group"
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Laboratoriya</span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition group"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Profil</span>
        </Link>
      </div>
    </div>
  );
}
