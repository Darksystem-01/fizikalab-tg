"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  BookOpen,
  Award,
  Check,
} from "lucide-react";
import { ProblemModal } from "./ProblemModal";
import { CommentsSheet } from "./CommentsSheet";

export interface ReelData {
  id: string;
  title: string;
  description?: string | null;
  problemText?: string | null;
  answerText?: string | null;
  hint?: string | null;
  difficulty?: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  hasLiked?: boolean;
  hasSaved?: boolean;
  author: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
    university?: string | null;
  };
  topic: {
    id: string;
    slug: string;
    title: string;
  };
}

interface ReelCardProps {
  reel: ReelData;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function ReelCard({ reel, isActive, isMuted, onToggleMute }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [liked, setLiked] = useState(reel.hasLiked || false);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [saved, setSaved] = useState(reel.hasSaved || false);
  const [commentsCount, setCommentsCount] = useState(reel.commentsCount || 0);
  const [showProblem, setShowProblem] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [expandDesc, setExpandDesc] = useState(false);

  // Play / Pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video
        .play()
        .catch(() => {
          // Autoplay was prevented by browser policy until user interacts
        });
    } else {
      video.pause();
    }
  }, [isActive]);

  // Keep muted state in sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle Like
  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await fetch(`/api/reels/${reel.id}/like`, { method: "POST" });
    } catch {
      // rollback on error
      setLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Handle Save
  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      await fetch(`/api/reels/${reel.id}/save`, { method: "POST" });
    } catch {
      setSaved(!newSaved);
    }
  };

  // Handle Share
  const handleShare = () => {
    const permalink = `${window.location.origin}/r/${reel.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(permalink);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-full max-w-[450px] mx-auto bg-black flex items-center justify-center overflow-hidden select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        onClick={onToggleMute}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Audio Mute Indicator Overlay (top right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="absolute top-16 right-4 z-20 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
      </button>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top duration-150">
          <Check className="w-4 h-4" /> Havola nusxalandi!
        </div>
      )}

      {/* Right Action Bar */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* Like Button */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleLike}
            className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-75 ${
              liked ? "bg-red-500/20 text-red-500" : "bg-black/40 text-white hover:text-red-400"
            }`}
          >
            <Heart className={`w-7 h-7 ${liked ? "fill-red-500" : ""}`} />
          </button>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {likesCount}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-blue-400 transition transform active:scale-75"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {commentsCount}
          </span>
        </div>

        {/* Physics Problem Drawer Button */}
        {reel.problemText && (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowProblem(true)}
              className="p-3 rounded-full bg-amber-500/30 border border-amber-400/50 backdrop-blur-md text-amber-300 hover:text-white transition transform active:scale-75 shadow-lg shadow-amber-500/20"
            >
              <Award className="w-7 h-7 text-amber-400" />
            </button>
            <span className="text-[10px] font-bold text-amber-300 mt-1 uppercase tracking-tight">
              Masala
            </span>
          </div>
        )}

        {/* Save / Bookmark Button */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleSave}
            className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-75 ${
              saved ? "bg-amber-500/20 text-amber-400" : "bg-black/40 text-white hover:text-amber-400"
            }`}
          >
            <Bookmark className={`w-6 h-6 ${saved ? "fill-amber-400" : ""}`} />
          </button>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            Saqlash
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-emerald-400 transition transform active:scale-75"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            Ulashish
          </span>
        </div>
      </div>

      {/* Bottom Metadata & Info Overlay */}
      <div className="absolute left-0 bottom-0 right-0 z-10 p-4 pb-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 pointer-events-none">
        <div className="pointer-events-auto space-y-2 max-w-[80%]">
          {/* Author info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/20">
              {reel.author.nickname.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white drop-shadow">
                @{reel.author.nickname}
              </span>
              {reel.author.university && (
                <div className="text-[11px] text-blue-300 truncate font-medium">
                  {reel.author.university}
                </div>
              )}
            </div>
          </div>

          {/* Topic Badge & Title */}
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/80 text-white backdrop-blur-sm mb-1">
              {reel.topic.title}
            </span>
            <h2 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug drop-shadow">
              {reel.title}
            </h2>
          </div>

          {/* Collapsible description */}
          {reel.description && (
            <p
              onClick={() => setExpandDesc(!expandDesc)}
              className={`text-xs text-slate-300 cursor-pointer ${
                expandDesc ? "" : "line-clamp-1"
              }`}
            >
              {reel.description}
            </p>
          )}

          {/* Problem quick trigger pill */}
          {reel.problemText && (
            <button
              type="button"
              onClick={() => setShowProblem(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" /> Masala sharti va yechimi &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProblemModal
        isOpen={showProblem}
        onClose={() => setShowProblem(false)}
        problemText={reel.problemText}
        answerText={reel.answerText}
        hint={reel.hint}
        difficulty={reel.difficulty}
        topicTitle={reel.topic.title}
      />

      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        reelId={reel.id}
      />
    </div>
  );
}
