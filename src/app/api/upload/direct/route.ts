import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getDb } from "@/db";
import { reels } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Video yuklash uchun avval tizimga kiring." }, { status: 401 });
    }

    if (!user.phoneVerified) {
      return NextResponse.json(
        { error: "Video yuklashdan oldin telefon raqamingizni SMS orqali tasdiqlang." },
        { status: 403 }
      );
    }

    // Rate limit: Max 5 uploads per day for students
    if (user.role === "student") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const db = getDb();
      const [todayCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reels)
        .where(and(eq(reels.authorId, user.id), gte(reels.createdAt, today)));

      if (Number(todayCount?.count || 0) >= 5) {
        return NextResponse.json(
          { error: "Kunlik yuklash kvotasi (maks. 5 ta video) tugadi. Ertaga yana urinib ko'ring." },
          { status: 429 }
        );
      }
    }

    // Direct upload token architecture (Vercel Blob / R2)
    const uploadId = crypto.randomUUID();
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    return NextResponse.json({
      success: true,
      uploadId,
      maxSizeBytes: 100 * 1024 * 1024, // 100 MB
      maxDurationSec: 90,
      allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
      hasBlobStorage: Boolean(token),
    });
  } catch (err) {
    console.error("[Direct Upload API] Exception:", err);
    return NextResponse.json({ error: "Server xatosi." }, { status: 500 });
  }
}
