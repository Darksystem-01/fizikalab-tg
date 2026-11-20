import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { channels } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { INITIAL_CHANNELS } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(channels)
      .where(eq(channels.isArchived, false))
      .orderBy(asc(channels.sortOrder));

    if (rows && rows.length > 0) {
      return NextResponse.json({
        channels: rows.map((c) => ({
          ...c,
          unreadCount: 0,
        })),
      });
    }

    // Fallback to default channels
    return NextResponse.json({
      channels: INITIAL_CHANNELS.map((c) => ({
        ...c,
        isArchived: false,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[Chat Channels] Falling back to default channels:", error);
    return NextResponse.json({
      channels: INITIAL_CHANNELS.map((c) => ({
        ...c,
        isArchived: false,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      })),
    });
  }
}
