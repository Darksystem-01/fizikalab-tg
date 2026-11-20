import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { users, reels, follows } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, User, GraduationCap, Flame, Play, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ nickname: string }>;
}

export default async function UserPublicProfilePage({ params }: Props) {
  const { nickname } = await params;
  const db = getDb();

  const [targetUser] = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      university: users.university,
      faculty: users.faculty,
      course: users.course,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`lower(${users.nickname}) = lower(${nickname})`)
    .limit(1);

  if (!targetUser) {
    notFound();
  }

  // Fetch author's published reels
  const authorReels = await db
    .select({
      id: reels.id,
      title: reels.title,
      viewsCount: reels.viewsCount,
      likesCount: reels.likesCount,
      thumbnailUrl: reels.thumbnailUrl,
    })
    .from(reels)
    .where(and(eq(reels.authorId, targetUser.id), eq(reels.status, "published")))
    .limit(20);

  // Followers count
  const [followersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, targetUser.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top nav */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Lenta
          </Link>
          <span className="text-xs font-bold text-slate-400">@{targetUser.nickname}</span>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg shadow-blue-600/20">
              {targetUser.nickname.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white truncate">
                  @{targetUser.nickname}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50 uppercase">
                  {targetUser.role}
                </span>
              </div>
              {targetUser.university && (
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  {targetUser.university}
                </div>
              )}
              {targetUser.faculty && (
                <div className="text-[11px] text-slate-500">
                  {targetUser.faculty} {targetUser.course ? `• ${targetUser.course}-kurs` : ""}
                </div>
              )}
            </div>
          </div>

          {targetUser.bio && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              {targetUser.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/40">
              <div className="text-base font-extrabold text-white">{authorReels.length}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Yuklangan Reels</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40">
              <div className="text-base font-extrabold text-white">
                {Number(followersCount?.count || 0)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Obunachilar</div>
            </div>
          </div>
        </div>

        {/* User's Reels Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-blue-400" /> Talabaning Videolari
          </h2>
          {authorReels.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-500">
              Hali tasdiqlangan videolar mavjud emas.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {authorReels.map((reel) => (
                <Link
                  key={reel.id}
                  href={`/r/${reel.id}`}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition flex flex-col justify-end p-2.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <div className="relative z-20 space-y-1">
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                      {reel.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                      <span className="flex items-center gap-0.5">
                        <Play className="w-3 h-3 text-blue-400" /> {reel.viewsCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
