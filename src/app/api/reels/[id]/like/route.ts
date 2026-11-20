import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reels, reelLikes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Avval tizimga kiring." }, { status: 401 });
    }

    const { id: reelId } = await params;
    const db = getDb();

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(reelLikes)
      .where(and(eq(reelLikes.reelId, reelId), eq(reelLikes.userId, currentUser.id)))
      .limit(1);

    if (existingLike) {
      // Unlike
      await db
        .delete(reelLikes)
        .where(and(eq(reelLikes.reelId, reelId), eq(reelLikes.userId, currentUser.id)));

      await db
        .update(reels)
        .set({
          likesCount: sql`GREATEST(0, ${reels.likesCount} - 1)`,
        })
        .where(eq(reels.id, reelId));

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.insert(reelLikes).values({
        reelId,
        userId: currentUser.id,
      });

      await db
        .update(reels)
        .set({
          likesCount: sql`${reels.likesCount} + 1`,
        })
        .where(eq(reels.id, reelId));

      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("[Reel Like API] Exception:", err);
    return NextResponse.json({ error: "Server xatosi." }, { status: 500 });
  }
}
