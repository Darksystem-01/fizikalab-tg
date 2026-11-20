import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { reels, users, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ReelCard, ReelData } from "@/components/reels/ReelCard";
import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const db = getDb();

  const [reel] = await db
    .select({
      title: reels.title,
      description: reels.description,
      thumbnailUrl: reels.thumbnailUrl,
      videoUrl: reels.videoUrl,
    })
    .from(reels)
    .where(eq(reels.id, id))
    .limit(1);

  if (!reel) {
    return { title: "Reel Topilmadi — FizikaLab Reels" };
  }

  return {
    title: `${reel.title} — FizikaLab Reels`,
    description: reel.description || "Fizika masalasi va laboratoriya videosi",
    openGraph: {
      title: reel.title,
      description: reel.description || "FizikaLab qisqa video",
      videos: [{ url: reel.videoUrl }],
      images: reel.thumbnailUrl ? [{ url: reel.thumbnailUrl }] : [],
    },
  };
}

export default async function ReelPermalinkPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();

  const [rawReel] = await db
    .select({
      id: reels.id,
      title: reels.title,
      description: reels.description,
      problemText: reels.problemText,
      answerText: reels.answerText,
      hint: reels.hint,
      difficulty: reels.difficulty,
      videoUrl: reels.videoUrl,
      thumbnailUrl: reels.thumbnailUrl,
      durationSec: reels.durationSec,
      viewsCount: reels.viewsCount,
      likesCount: reels.likesCount,
      commentsCount: reels.commentsCount,
      author: {
        id: users.id,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        university: users.university,
      },
      topic: {
        id: topics.id,
        slug: topics.slug,
        title: topics.title,
      },
    })
    .from(reels)
    .innerJoin(users, eq(reels.authorId, users.id))
    .innerJoin(topics, eq(reels.topicId, topics.id))
    .where(eq(reels.id, id))
    .limit(1);

  if (!rawReel) {
    notFound();
  }

  const reelData: ReelData = {
    ...rawReel,
    hasLiked: false,
    hasSaved: false,
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center relative">
      {/* Top Bar */}
      <div className="w-full max-w-lg p-4 flex items-center justify-between z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Barcha Reels
        </Link>
        <div className="flex items-center gap-1 text-white font-extrabold text-sm tracking-tight">
          <Flame className="w-4 h-4 text-blue-500 fill-blue-500" /> FizikaLab
        </div>
      </div>

      {/* Reel Card Container */}
      <div className="w-full max-w-[450px] h-[85vh] relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <ReelCard
          reel={reelData}
          isActive={true}
          isMuted={false}
          onToggleMute={() => {}}
        />
      </div>

      <div className="py-4 text-xs text-slate-500">
        FizikaLab Reels &copy; 2026. Barcha huquqlar himoyalangan.
      </div>
    </div>
  );
}
