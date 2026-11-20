"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Heart, CornerDownRight, MessageSquare } from "lucide-react";

interface CommentItem {
  id: string;
  body: string;
  likesCount: number;
  parentId: string | null;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
    university?: string | null;
  };
  replies?: CommentItem[];
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reelId: string;
}

export function CommentsSheet({ isOpen, onClose, reelId }: CommentsSheetProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && reelId) {
      setLoading(true);
      fetch(`/api/reels/${reelId}/comments`)
        .then((res) => res.json())
        .then((data) => {
          if (data.comments) setComments(data.comments);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, reelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reels/${reelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentText.trim(),
          parentId: replyingTo ? replyingTo.id : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.comment) {
        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), data.comment] }
                : c
            )
          );
        } else {
          setComments((prev) => [data.comment, ...prev]);
        }
        setCommentText("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("[Comments] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl relative flex flex-col h-[75vh] max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Izohlar ({comments.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/40 border border-blue-900/40 rounded-lg my-2 text-xs text-blue-300">
            <span>
              @{replyingTo.author.nickname} ga javob yozilmoqda...
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Bekor qilish
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">Yuklanmoqda...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Hali izohlar yo&apos;q. Birinchi bo&apos;lib fikr bildiring!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {comment.author.nickname.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        @{comment.author.nickname}
                      </span>
                      {comment.author.university && (
                        <span className="text-[10px] text-slate-400 truncate">
                          • {comment.author.university}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                      {comment.body}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        onClick={() => setReplyingTo(comment)}
                        className="text-[11px] text-slate-400 hover:text-blue-400 transition font-medium"
                      >
                        Javob berish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested 1-level replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-8 space-y-2 pt-1 border-l border-slate-800 ml-3.5">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-300">
                              @{reply.author.nickname}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
                            {reply.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? "Javobingizni yozing..." : "Izoh qoldiring..."}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
