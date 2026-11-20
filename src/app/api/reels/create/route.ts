import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reels, topics, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

const createReelSchema = z.object({
  title: z.string().min(5, "Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak").max(150),
  description: z.string().max(1000).optional(),
  topicId: z.string().min(1, "Fizika bo'limini tanlang"),
  videoUrl: z.string().url("Video URL manzili to'g'ri bo'lishi kerak"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  durationSec: z.number().int().min(1).max(90, "Video davomiyligi 90 soniyadan oshmasligi kerak").default(60),
  difficulty: z.enum(["oson", "orta", "qiyin"]).default("orta"),
  problemText: z.string().max(2000).optional(),
  answerText: z.string().max(2000).optional(),
  hint: z.string().max(1000).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Mualliflik huquqi va qoidalariga rozilik bildirishingiz kerak",
  }),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Avval tizimga kiring." }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsed = createReelSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Kiritilgan ma'lumotlar noto'g'ri." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const db = getDb();

    // Verify topic exists
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, data.topicId))
      .limit(1);

    if (!topic) {
      return NextResponse.json({ error: "Tanlangan fizika mavzusi topilmadi." }, { status: 404 });
    }

    // Role-based status: Creator and Admin get immediate published status; students go to pending queue
    const isAutoApproved = user.role === "admin" || user.role === "creator";
    const status = isAutoApproved ? "published" : "pending";
    const publishedAt = isAutoApproved ? new Date() : null;
    const newReelId = `reel_${crypto.randomUUID().slice(0, 12)}`;

    await db.insert(reels).values({
      id: newReelId,
      authorId: user.id,
      topicId: topic.id,
      title: data.title,
      description: data.description || null,
      problemText: data.problemText || null,
      answerText: data.answerText || null,
      hint: data.hint || null,
      difficulty: data.difficulty,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      durationSec: data.durationSec,
      status,
      publishedAt,
    });

    // Write audit log
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        actorId: user.id,
        action: "REEL_CREATE",
        targetType: "reel",
        targetId: newReelId,
        metadata: JSON.stringify({ title: data.title, status }),
      });
    } catch {
      // audit log best-effort
    }

    return NextResponse.json({
      success: true,
      message: isAutoApproved
        ? "Video muvaffaqiyatli e'lon qilindi!"
        : "Video moderatsiya navbatiga yuborildi. Moderator tasdiqlaganidan so'ng lentada ko'rinadi.",
      reelId: newReelId,
      status,
    });
  } catch (err) {
    console.error("[Create Reel API] Exception:", err);
    return NextResponse.json({ error: "Serverda xatolik yuz berdi." }, { status: 500 });
  }
}
