"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Film,
  PlusCircle,
  FileText,
  Clock,
  ArrowLeft,
  Flame,
  Award,
  Layers,
  Search,
} from "lucide-react";

interface AdminDashboardClientProps {
  currentUser: {
    id: string;
    nickname: string;
    role: string;
  };
}

export function AdminDashboardClient({ currentUser }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "upload" | "reels" | "audit">("pending");
  const [pendingReels, setPendingReels] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Upload Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("top_mexanika");
  const [videoUrl, setVideoUrl] = useState("");
  const [difficulty, setDifficulty] = useState<"oson" | "orta" | "qiyin">("orta");
  const [durationSec, setDurationSec] = useState(60);
  const [problemText, setProblemText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [hint, setHint] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string }>({});

  const fetchModeration = () => {
    setLoading(true);
    fetch("/api/admin/moderation")
      .then((res) => res.json())
      .then((data) => {
        if (data.pendingReels) setPendingReels(data.pendingReels);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchModeration();
  }, []);

  const handleReview = (reelId: string, action: "approve" | "reject", reason?: string) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/moderation/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reelId, action, rejectReason: reason }),
        });
        if (res.ok) {
          setPendingReels((prev) => prev.filter((r) => r.id !== reelId));
          setRejectingId(null);
          setRejectReason("");
          fetchModeration();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus({});

    startTransition(async () => {
      try {
        const res = await fetch("/api/reels/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            topicId,
            videoUrl,
            difficulty,
            durationSec: Number(durationSec),
            problemText,
            answerText,
            hint,
            termsAccepted,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setUploadStatus({ success: true, message: data.message });
          setTitle("");
          setDescription("");
          setVideoUrl("");
          setProblemText("");
          setAnswerText("");
          setHint("");
          fetchModeration();
        } else {
          setUploadStatus({ success: false, message: data.error || "Xatolik yuz berdi." });
        }
      } catch {
        setUploadStatus({ success: false, message: "Tarmoq bilan aloqa uzildi." });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                FizikaLab CMS & Moderatsiya Markazi
              </h1>
              <p className="text-xs text-slate-400">
                Moderator: <span className="text-blue-400 font-semibold">@{currentUser.nickname}</span> ({currentUser.role})
              </p>
            </div>
          </div>
          <Link
            href="/legacy-labs"
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Legacy Labs &rarr;
          </Link>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            Moderatsiya Navbati ({pendingReels.length})
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "upload"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Yangi Reel Qo&apos;shish
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: PENDING QUEUE */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">Navbat tekshirilmoqda...</div>
            ) : pendingReels.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
                🎉 Moderatsiya navbati bo&apos;sh! Barcha yuklangan videolar ko&apos;rib chiqilgan.
              </div>
            ) : (
              pendingReels.map((reel) => (
                <div
                  key={reel.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Video preview */}
                    <div className="w-full sm:w-48 aspect-[9/16] rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800">
                      <video
                        src={reel.videoUrl}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/50 text-blue-300 border border-blue-700/50">
                            {reel.topic.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {reel.durationSec}s • {reel.difficulty}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-white mt-1">{reel.title}</h2>
                        {reel.description && (
                          <p className="text-xs text-slate-400 mt-1">{reel.description}</p>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        Muallif: <span className="font-semibold text-slate-200">@{reel.author.nickname}</span>
                        {reel.author.university && ` (${reel.author.university})`}
                      </div>

                      {/* Problem text if present */}
                      {reel.problemText && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> Masala sharti:
                          </div>
                          <p>{reel.problemText}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReview(reel.id, "approve")}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Tasdiqlash & Lenta
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(reel.id)}
                          className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-4 h-4" /> Rad etish...
                        </button>
                      </div>

                      {/* Reject reason input */}
                      {rejectingId === reel.id && (
                        <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 space-y-2 animate-in fade-in">
                          <label className="text-[11px] font-semibold text-red-300 block">
                            Rad etish sababini yozing:
                          </label>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Mualliflik huquqi / noaniq video / talabga mos emas"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-red-800/60 text-xs text-white focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleReview(reel.id, "reject", rejectReason)}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
                            >
                              Rad etishni tasdiqlash
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Bekor qilish
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD REEL */}
        {activeTab === "upload" && (
          <form
            onSubmit={handleUploadSubmit}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl max-w-2xl"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" /> Yangi Fizika Reels Yuklash
            </h2>

            {uploadStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  uploadStatus.success
                    ? "bg-emerald-950/60 border border-emerald-800/80 text-emerald-300"
                    : "bg-red-950/60 border border-red-800/80 text-red-300"
                }`}
              >
                {uploadStatus.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reel Sarlavhasi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="masalan: 2D Ballistika burchaklari tajribasi"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fizika Bo&apos;limi *
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="top_mexanika">Mexanika</option>
                  <option value="top_termodinamika">Molekulyar & Termodinamika</option>
                  <option value="top_elektr">Elektr</option>
                  <option value="top_magnetizm">Magnetizm</option>
                  <option value="top_tebranishlar">Tebranishlar & To&apos;lqinlar</option>
                  <option value="top_optika">Optika</option>
                  <option value="top_kvant">Kvant fizikasi</option>
                  <option value="top_atom_yadro">Atom va yadro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qiyinlik Darajasi
                </label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="oson">Oson</option>
                  <option value="orta">O&apos;rta</option>
                  <option value="qiyin">Qiyin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Davomiyligi (sekund, max 90s)
                </label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Video Fayl URL (Direct / Blob) *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://...mp4 yoki storage havolasi"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Masala Sharti (Ixtiyoriy)
              </label>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Fizika masalasining to'liq matni va berilgan parametrlar"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yechim & To&apos;g&apos;ri Javob
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Yechimning formulalari va oxirgi sonli natijasi"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maslahat (Hint)
                </label>
                <textarea
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Yechish uchun formula yoki uslubiy ko'rsatma"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ack"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                required
              />
              <label htmlFor="ack" className="text-xs text-slate-400">
                Bu kontent ta&apos;lim qoidalariga mos kelishini va mualliflik huquqini buzmasligini tasdiqlayman.
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg disabled:opacity-50"
            >
              {isPending ? "Yuklanmoqda..." : "Videoni E'lon Qilish"}
            </button>
          </form>
        )}

        {/* TAB 3: AUDIT LOG */}
        {activeTab === "audit" && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Tizim Audit Jurnali (O&apos;zgarmas)
            </h2>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Hozircha audit yozuvlari mavjud emas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Amal</th>
                      <th className="py-2 px-3">Nishon</th>
                      <th className="py-2 px-3">Tafsilotlar</th>
                      <th className="py-2 px-3">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-950/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-blue-400">{log.action}</td>
                        <td className="py-2.5 px-3">
                          {log.targetType}:{log.targetId.slice(0, 10)}...
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                          {log.metadata || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString("uz-UZ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
