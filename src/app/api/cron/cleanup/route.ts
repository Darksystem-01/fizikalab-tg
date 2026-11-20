import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { otpCodes, sessions } from "@/db/schema";
import { lt, or, isNotNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify Vercel Cron authorization header if secret is configured
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Ruxsatsiz so'rov" }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();

    // 1. Delete expired or consumed OTP codes older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const deletedOtps = await db
      .delete(otpCodes)
      .where(or(lt(otpCodes.expiresAt, oneDayAgo), isNotNull(otpCodes.consumedAt)));

    // 2. Delete expired sessions
    const deletedSessions = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, now));

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      message: "Tozalash muvaffaqiyatli bajarildi",
    });
  } catch (error: any) {
    console.error("[Cron Cleanup] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
