import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reels, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Kirish taqiqlangan." }, { status: 403 });
    }

    const body = (await req.json()) as {
      reelId: string;
      action: "approve" | "reject";
      rejectReason?: string;
    };

    if (!body.reelId || !body.action) {
      return NextResponse.json({ error: "Reel ID va amal talab qilinadi." }, { status: 400 });
    }

    const db = getDb();
    const newStatus = body.action === "approve" ? "published" : "rejected";
    const publishedAt = body.action === "approve" ? new Date() : null;

    await db
      .update(reels)
      .set({
        status: newStatus,
        publishedAt,
        rejectReason: body.rejectReason || null,
        updatedAt: new Date(),
      })
      .where(eq(reels.id, body.reelId));

    // Audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: user.id,
      action: body.action === "approve" ? "REEL_APPROVE" : "REEL_REJECT",
      targetType: "reel",
      targetId: body.reelId,
      metadata: JSON.stringify({ action: body.action, reason: body.rejectReason }),
    });

    return NextResponse.json({
      success: true,
      message: body.action === "approve" ? "Video tasdiqlandi va lentaga chiqarildi!" : "Video rad etildi.",
    });
  } catch (err) {
    console.error("[Admin Review API] Exception:", err);
    return NextResponse.json({ error: "Server xatosi." }, { status: 500 });
  }
}
