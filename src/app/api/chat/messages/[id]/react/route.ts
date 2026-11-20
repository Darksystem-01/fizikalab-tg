import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { messages, messageReactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { publishToChannel } from "@/lib/realtime";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const reactSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const json = await req.json();
    const parsed = reactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri emoji formati" }, { status: 400 });
    }

    const emoji = parsed.data.emoji;
    const db = getDb();

    // Check message exists and get channelId
    const msg = await db
      .select({ id: messages.id, channelId: messages.channelId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (msg.length === 0) {
      return NextResponse.json({ error: "Xabar topilmadi" }, { status: 404 });
    }

    const channelId = msg[0].channelId;

    // Check existing reaction
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, user.id),
          eq(messageReactions.emoji, emoji)
        )
      )
      .limit(1);

    let added = false;
    if (existing.length > 0) {
      // Toggle off: remove
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existing[0].id));
      added = false;
    } else {
      // Toggle on: insert
      await db.insert(messageReactions).values({
        id: `react_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        messageId,
        userId: user.id,
        emoji,
      });
      added = true;
    }

    // Broadcast reaction update
    await publishToChannel(channelId, "reaction_toggle", {
      messageId,
      userId: user.id,
      emoji,
      added,
    });

    return NextResponse.json({ success: true, added, emoji });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server xatosi" }, { status: 500 });
  }
}
