"use client";

import React, { useState } from "react";
import { X, HelpCircle, Eye, EyeOff, Lightbulb, CheckCircle2, Award } from "lucide-react";

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemText?: string | null;
  answerText?: string | null;
  hint?: string | null;
  difficulty?: string;
  topicTitle?: string;
}

export function ProblemModal({
  isOpen,
  onClose,
  problemText,
  answerText,
  hint,
  difficulty = "orta",
  topicTitle = "Fizika Masalasi",
}: ProblemModalProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{topicTitle}</h2>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Qiyinlik:{" "}
                <span
                  className={
                    difficulty === "oson"
                      ? "text-emerald-400"
                      : difficulty === "qiyin"
                      ? "text-red-400"
                      : "text-amber-400"
                  }
                >
                  {difficulty}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Problem Body */}
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Masala Sharti:
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-mono">
              {problemText || "Ushbu videoga hali masala sharti kiritilmagan."}
            </div>
          </div>

          {/* Hint Section */}
          {hint && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition font-medium"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHint ? "Maslahatni yashirish" : "Yechish uchun maslahat (Formula)"}
              </button>
              {showHint && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 font-mono">
                  💡 {hint}
                </div>
              )}
            </div>
          )}

          {/* Answer Toggle Section */}
          {answerText && (
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <button
                type="button"
                onClick={() => setShowAnswer(!showAnswer)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {showAnswer ? (
                  <>
                    <EyeOff className="w-4 h-4 text-slate-400" /> Javobni Yashirish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-blue-400" /> To&apos;g&apos;ri Javob va Yechimni Ko&apos;rish
                  </>
                )}
              </button>

              {showAnswer && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs font-mono leading-relaxed space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 pb-1">
                    <CheckCircle2 className="w-4 h-4" /> To&apos;g&apos;ri Yechim:
                  </div>
                  <p>{answerText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
