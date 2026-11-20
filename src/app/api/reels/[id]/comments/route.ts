import { NextResponse } from "next/server";
import crypto from "crypto";
import { addCommentSchema } from "@/lib/validation/reels";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { comments, users, reels } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reelId } = await params;
    const db = getDb();

    // Query top-level comments with authors
    const topLevelComments = await db
      .select({
        id: comments.id,
        body: comments.body,
        likesCount: comments.likesCount,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          nickname: users.nickname,
          avatarUrl: users.avatarUrl,
          university: users.university,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.reelId, reelId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt))
      .limit(50);

    // Query 1-level replies
    const replies = await db
      .select({
        id: comments.id,
        body: comments.body,
        likesCount: comments.likesCount,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          nickname: users.nickname,
          avatarUrl: users.avatarUrl,
          university: users.university,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.reelId, reelId), sql`${comments.parentId} IS NOT NULL`))
      .orderBy(comments.createdAt);

    // Group replies by parentId
    const replyMap = new Map<string, typeof replies>();
    for (const r of replies) {
      if (r.parentId) {
        const list = replyMap.get(r.parentId) || [];
        list.push(r);
        replyMap.set(r.parentId, list);
      }
    }

    const structured = topLevelComments.map((c) => ({
      ...c,
      replies: replyMap.get(c.id) || [],
    }));

    return NextResponse.json({ comments: structured });
  } catch (err) {
    console.error("[Comments GET] Exception:", err);
    return NextResponse.json({ error: "Izohlarni yuklashda xatolik." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Izoh qoldirish uchun tizimga kiring." }, { status: 401 });
    }

    const { id: reelId } = await params;
    const bodyRaw = await req.json();
    const parsed = addCommentSchema.safeParse(bodyRaw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Izoh matni noto'g'ri." },
        { status: 400 }
      );
    }

    const { body, parentId } = parsed.data;
    const db = getDb();
    const newId = crypto.randomUUID();

    await db.insert(comments).values({
      id: newId,
      reelId,
      userId: currentUser.id,
      parentId: parentId || null,
      body,
    });

    // Increment comments count on reel
    await db
      .update(reels)
      .set({
        commentsCount: sql`${reels.commentsCount} + 1`,
      })
      .where(eq(reels.id, reelId));

    return NextResponse.json({
      success: true,
      comment: {
        id: newId,
        body,
        parentId: parentId || null,
        likesCount: 0,
        createdAt: new Date(),
        author: {
          id: currentUser.id,
          nickname: currentUser.nickname,
          avatarUrl: currentUser.avatarUrl,
          university: currentUser.university,
        },
      },
    });
  } catch (err) {
    console.error("[Comments POST] Exception:", err);
    return NextResponse.json({ error: "Izoh yozishda xatolik." }, { status: 500 });
  }
}
