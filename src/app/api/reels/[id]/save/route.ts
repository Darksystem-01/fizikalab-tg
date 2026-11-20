import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reelSaves } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Check if already saved
    const [existingSave] = await db
      .select()
      .from(reelSaves)
      .where(and(eq(reelSaves.reelId, reelId), eq(reelSaves.userId, currentUser.id)))
      .limit(1);

    if (existingSave) {
      await db
        .delete(reelSaves)
        .where(and(eq(reelSaves.reelId, reelId), eq(reelSaves.userId, currentUser.id)));

      return NextResponse.json({ saved: false });
    } else {
      await db.insert(reelSaves).values({
        reelId,
        userId: currentUser.id,
      });

      return NextResponse.json({ saved: true });
    }
  } catch (err) {
    console.error("[Reel Save API] Exception:", err);
    return NextResponse.json({ error: "Server xatosi." }, { status: 500 });
  }
}
