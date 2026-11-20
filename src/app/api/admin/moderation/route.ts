import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reels, users, topics, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    // Strict Server-side RBAC: Only admin or moderator
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Kirish taqiqlangan." }, { status: 403 });
    }

    const db = getDb();

    // 1. Pending reels queue
    const pendingReels = await db
      .select({
        id: reels.id,
        title: reels.title,
        description: reels.description,
        problemText: reels.problemText,
        difficulty: reels.difficulty,
        videoUrl: reels.videoUrl,
        durationSec: reels.durationSec,
        createdAt: reels.createdAt,
        author: {
          id: users.id,
          nickname: users.nickname,
          university: users.university,
        },
        topic: {
          id: topics.id,
          title: topics.title,
        },
      })
      .from(reels)
      .innerJoin(users, eq(reels.authorId, users.id))
      .innerJoin(topics, eq(reels.topicId, topics.id))
      .where(eq(reels.status, "pending"))
      .orderBy(desc(reels.createdAt));

    // 2. Published reels count & stats
    const allReels = await db
      .select({
        id: reels.id,
        title: reels.title,
        status: reels.status,
        viewsCount: reels.viewsCount,
        likesCount: reels.likesCount,
        publishedAt: reels.publishedAt,
      })
      .from(reels)
      .orderBy(desc(reels.createdAt))
      .limit(30);

    // 3. Recent audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    return NextResponse.json({
      pendingReels,
      allReels,
      auditLogs: logs,
      stats: {
        totalPending: pendingReels.length,
        totalReels: allReels.length,
      },
    });
  } catch (err) {
    console.error("[Admin Moderation API] Exception:", err);
    return NextResponse.json({ error: "Server xatosi." }, { status: 500 });
  }
}
