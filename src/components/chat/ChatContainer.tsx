"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Hash,
  Volume2,
  Lock,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Check,
  ChevronLeft,
  Users,
  Search,
  X,
  Compass,
  PlusSquare,
  MessageSquare,
  User,
  Shield,
  Sparkles,
  Info,
} from "lucide-react";

interface Channel {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: string;
  isArchived: boolean;
  sortOrder: number;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  body: string;
  replyToId?: string | null;
  attachmentUrl?: string | null;
  editedAt?: string | null;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    university: string;
    role: string;
    avatarUrl?: string | null;
  };
  reactions: MessageReaction[];
}

interface CurrentUser {
  id: string;
  nickname: string;
  role: string;
  university?: string;
  avatarUrl?: string | null;
}

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "💡", "❓", "✅", "👏", "🔬", "⚛️"];

export function ChatContainer({ currentUser }: { currentUser: CurrentUser | null }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mobile sidebar toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Reply & Edit state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<number>(Date.now());

  // 1. Fetch Channels
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/chat/channels");
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels);
          const first = data.channels.find((c: Channel) => c.slug === "umumiy") || data.channels[0];
          setActiveChannelId(first.id);
        }
      } catch (err) {
        console.error("Channels fetch error:", err);
      } finally {
        setLoadingChannels(false);
      }
    }
    loadChannels();
  }, []);

  // 2. Fetch Messages when activeChannel changes
  useEffect(() => {
    if (!activeChannelId) return;

    let isMounted = true;
    async function loadMessages() {
      setLoadingMessages(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(activeChannelId)}`);
        const data = await res.json();
        if (isMounted && data.messages) {
          setMessages(data.messages);
          lastTimestampRef.current = Date.now();
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } catch (err) {
        console.error("Messages fetch error:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadMessages();

    // 3. Polling fallback every 3.5 seconds
    const interval = setInterval(async () => {
      try {
        const pollRes = await fetch(
          `/api/chat/messages?channelId=${encodeURIComponent(activeChannelId)}&since=${lastTimestampRef.current}`
        );
        const pollData = await pollRes.json();
        if (pollData.events && pollData.events.length > 0) {
          lastTimestampRef.current = Date.now();
          // Apply events
          for (const ev of pollData.events) {
            if (ev.event === "new_message") {
              setMessages((prev) => {
                if (prev.some((m) => m.id === ev.data.id)) return prev;
                return [...prev, ev.data];
              });
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            } else if (ev.event === "edit_message") {
              setMessages((prev) =>
                prev.map((m) => (m.id === ev.data.id ? { ...m, body: ev.data.body, editedAt: ev.data.editedAt } : m))
              );
            } else if (ev.event === "delete_message") {
              setMessages((prev) => prev.filter((m) => m.id !== ev.data.id));
            } else if (ev.event === "reaction_toggle") {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== ev.data.messageId) return m;
                  const existingReaction = m.reactions.find((r) => r.emoji === ev.data.emoji);
                  let updatedReactions = [...m.reactions];
                  if (ev.data.added) {
                    if (existingReaction) {
                      updatedReactions = updatedReactions.map((r) =>
                        r.emoji === ev.data.emoji ? { ...r, count: r.count + 1, users: [...r.users, ev.data.userId] } : r
                      );
                    } else {
                      updatedReactions.push({ emoji: ev.data.emoji, count: 1, users: [ev.data.userId] });
                    }
                  } else {
                    if (existingReaction) {
                      if (existingReaction.count <= 1) {
                        updatedReactions = updatedReactions.filter((r) => r.emoji !== ev.data.emoji);
                      } else {
                        updatedReactions = updatedReactions.map((r) =>
                          r.emoji === ev.data.emoji
                            ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== ev.data.userId) }
                            : r
                        );
                      }
                    }
                  }
                  return { ...m, reactions: updatedReactions };
                })
              );
            }
          }
        }
      } catch (err) {
        // Polling error silently ignored
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeChannelId]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Group channels by category
  const officialChannels = channels.filter((c) => ["umumiy", "savol-javob", "elonlar"].includes(c.slug));
  const physicsChannels = channels.filter(
    (c) => ["mexanika", "termodinamika", "elektr-magnetizm", "optika", "kvant-yadro"].includes(c.slug)
  );
  const otherChannels = channels.filter(
    (c) => !officialChannels.some((o) => o.id === c.id) && !physicsChannels.some((p) => p.id === c.id)
  );

  // Send message
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    if (!currentUser) {
      setErrorMsg("Xabar yozish uchun iltimos, tizimga kiring!");
      return;
    }

    if (editingMessage) {
      // Save Edit
      try {
        setSending(true);
        const res = await fetch(`/api/chat/messages/${editingMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: inputText.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Tahrirlashda xatolik");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id ? { ...m, body: inputText.trim(), editedAt: data.editedAt } : m
          )
        );
        setEditingMessage(null);
        setInputText("");
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setSending(false);
      }
      return;
    }

    try {
      setSending(true);
      setErrorMsg(null);
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannelId,
          body: inputText.trim(),
          replyToId: replyingTo?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xabar yuborishda xatolik");

      setMessages((prev) => [...prev, data.message]);
      setInputText("");
      setReplyingTo(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  }

  // Delete message
  async function handleDeleteMessage(msgId: string) {
    if (!confirm("Haqiqatan ham ushbu xabarni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/chat/messages/${msgId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "O'chirishda xatolik");
      }
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err: any) {
      alert(err.message);
    }
  }

  // React to message
  async function handleToggleReaction(messageId: string, emoji: string) {
    if (!currentUser) {
      alert("Reaksiya bildirish uchun tizimga kiring!");
      return;
    }
    setShowEmojiPickerFor(null);
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reaksiya qo'yishda xatolik");

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const exists = m.reactions.find((r) => r.emoji === emoji);
          let updated = [...m.reactions];
          if (data.added) {
            if (exists) {
              updated = updated.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, currentUser.id] } : r
              );
            } else {
              updated.push({ emoji, count: 1, users: [currentUser.id] });
            }
          } else {
            if (exists) {
              if (exists.count <= 1) {
                updated = updated.filter((r) => r.emoji !== emoji);
              } else {
                updated = updated.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== currentUser.id) }
                    : r
                );
              }
            }
          }
          return { ...m, reactions: updated };
        })
      );
    } catch (err: any) {
      console.warn("Reaction toggle error:", err);
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. LEFT SIDEBAR (CHANNELS) - Desktop fixed, Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
              ⚛️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                FizikaLab Chat
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-slate-400">Akademik Discord zali</div>
            </div>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs select-none">
          {/* Section: Rasmiy Kanallar */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1 flex items-center justify-between">
              <span>📢 RASMIY KANALLAR</span>
            </div>
            <div className="space-y-0.5">
              {officialChannels.map((c) => {
                const isActive = c.id === activeChannelId;
                const isAnnouncement = c.type === "announcement";
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChannelId(c.id);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {isAnnouncement ? (
                      <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Hash className="w-4 h-4 shrink-0 text-slate-500" />
                    )}
                    <span className="truncate">{c.title}</span>
                    {isAnnouncement && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                        info
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Fizika Bo'limlari */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1">
              🔬 FIZIKA BO'LIMLARI
            </div>
            <div className="space-y-0.5">
              {physicsChannels.map((c) => {
                const isActive = c.id === activeChannelId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChannelId(c.id);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">{c.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Erkin Kanallar */}
          {otherChannels.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1">
                💬 ERKIN MULOQOT
              </div>
              <div className="space-y-0.5">
                {otherChannels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChannelId(c.id);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-600/20 text-blue-400 font-semibold"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <Hash className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="truncate">{c.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current User Bottom Bar */}
        <div className="h-14 px-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          {currentUser ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-300">
                {currentUser.nickname.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                  @{currentUser.nickname}
                  {currentUser.role === "admin" && (
                    <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold">Admin</span>
                  )}
                  {currentUser.role === "moderator" && (
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold">Mod</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{currentUser.university || "Talaba"}</div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium text-center transition-colors"
            >
              Kirish / Ro'yxatdan o'tish
            </Link>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {showMobileSidebar && (
        <div
          onClick={() => setShowMobileSidebar(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 2. CENTER CHAT FEED */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Navbar */}
        <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            >
              <Hash className="w-5 h-5 text-blue-400" />
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 font-bold text-base">#</span>
              <h1 className="text-sm font-bold text-slate-100 truncate">
                {activeChannel?.title || "Yuklanmoqda..."}
              </h1>
            </div>
            {activeChannel?.description && (
              <span className="hidden sm:inline-block text-xs text-slate-500 truncate max-w-md border-l border-slate-800 pl-2.5">
                {activeChannel.description}
              </span>
            )}
          </div>

          {/* Quick links & Online indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-full text-[11px] text-emerald-400 border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Realtime
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors text-xs font-medium"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Reels</span>
            </Link>
          </div>
        </header>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Xabarlar yuklanmoqda...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
                💬
              </div>
              <div className="text-sm font-semibold text-slate-300">
                #{activeChannel?.title} kanaliga xush kelibsiz!
              </div>
              <div className="text-xs max-w-sm">
                Bu kanalda hozircha xabarlar yo'q. Birinchi bo'lib fikr bildiring yoki fizika bo'yicha savol bering!
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = currentUser?.id === m.userId;
              const isStaff = currentUser?.role === "admin" || currentUser?.role === "moderator";
              const repliedMessage = m.replyToId ? messages.find((x) => x.id === m.replyToId) : null;

              return (
                <div
                  key={m.id}
                  className="group relative flex gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-900/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex shrink-0 items-center justify-center text-xs font-bold text-slate-300 mt-0.5">
                    {m.author.avatarUrl ? (
                      <img
                        src={m.author.avatarUrl}
                        alt={m.author.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      m.author.nickname.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Body & Actions */}
                  <div className="flex-1 min-w-0">
                    {/* Reply quote banner if replying */}
                    {repliedMessage && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 pl-2 border-l-2 border-blue-500/60 italic truncate">
                        <Reply className="w-3 h-3 rotate-180 text-blue-400" />
                        <span className="font-semibold text-slate-400">@{repliedMessage.author.nickname}:</span>
                        <span className="truncate">{repliedMessage.body}</span>
                      </div>
                    )}

                    {/* Author line */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${m.author.nickname}`}
                        className="text-xs font-bold text-slate-200 hover:text-blue-400 transition-colors"
                      >
                        @{m.author.nickname}
                      </Link>

                      {m.author.role === "creator" && (
                        <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Creator
                        </span>
                      )}
                      {m.author.role === "admin" && (
                        <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Admin
                        </span>
                      )}
                      {m.author.role === "moderator" && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Mod
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {m.author.university}
                      </span>

                      <span className="text-[10px] text-slate-600 ml-auto">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Message text */}
                    <div className="text-xs text-slate-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                      {m.body}
                      {m.editedAt && (
                        <span className="text-[9px] text-slate-500 ml-1 italic">(tahrirlangan)</span>
                      )}
                    </div>

                    {/* Attachment image if present */}
                    {m.attachmentUrl && (
                      <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-slate-800">
                        <img src={m.attachmentUrl} alt="Biriktirilgan rasm" className="w-full object-cover max-h-60" />
                      </div>
                    )}

                    {/* Emoji Reactions List */}
                    {m.reactions && m.reactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {m.reactions.map((r) => {
                          const userReacted = currentUser && r.users.includes(currentUser.id);
                          return (
                            <button
                              key={r.emoji}
                              onClick={() => handleToggleReaction(m.id, r.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-colors cursor-pointer ${
                                userReacted
                                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="font-semibold text-[10px]">{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hover Floating Actions Menu */}
                  <div className="absolute top-1 right-2 hidden group-hover:flex items-center gap-0.5 bg-slate-900 border border-slate-700/60 rounded-md p-0.5 shadow-lg z-20">
                    {/* Quick Reactions */}
                    <button
                      onClick={() => handleToggleReaction(m.id, "👍")}
                      className="p-1 text-xs hover:bg-slate-800 rounded transition-colors"
                      title="Yoqdi"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleToggleReaction(m.id, "🔥")}
                      className="p-1 text-xs hover:bg-slate-800 rounded transition-colors"
                      title="Olov"
                    >
                      🔥
                    </button>

                    {/* Reply */}
                    <button
                      onClick={() => {
                        setReplyingTo(m);
                        setEditingMessage(null);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                      title="Javob qaytarish"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit (if owner) */}
                    {isMe && (
                      <button
                        onClick={() => {
                          setEditingMessage(m);
                          setInputText(m.body);
                          setReplyingTo(null);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete (if owner or staff) */}
                    {(isMe || isStaff) && (
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-blue-950/40 border-t border-blue-900/60 text-xs text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <Reply className="w-3.5 h-3.5 rotate-180 text-blue-400" />
              <span>Javob berilmoqda:</span>
              <strong className="text-white">@{replyingTo.author.nickname}</strong>
              <span className="text-slate-400 italic truncate max-w-xs">"{replyingTo.body}"</span>
            </span>
            <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing banner */}
        {editingMessage && (
          <div className="px-4 py-1.5 bg-amber-950/40 border-t border-amber-900/60 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Xabarni tahrirlash rejimi</span>
            </span>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText("");
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800">
          {activeChannel?.type === "announcement" &&
          currentUser?.role !== "admin" &&
          currentUser?.role !== "moderator" ? (
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Bu kanal faqat e'lonlar uchun mo'ljallangan. Faqat ma'murlar yoza oladi.
            </div>
          ) : currentUser ? (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-end gap-2 bg-slate-950 rounded-xl border border-slate-800 focus-within:border-blue-500/80 px-3 py-2 transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`#${activeChannel?.title || "kanal"}ga xabar yuborish...`}
                  rows={1}
                  className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 resize-none outline-none max-h-32 min-h-[24px]"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Emojis strip */}
              <div className="flex items-center gap-1 text-xs text-slate-400 overflow-x-auto py-0.5">
                <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline">Tezkor:</span>
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((prev) => prev + emoji)}
                    className="hover:scale-125 transition-transform px-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400">
              Chatda fikr bildirish va savol berish uchun{" "}
              <Link href="/auth" className="text-blue-400 font-bold hover:underline">
                tizimga kiring
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
