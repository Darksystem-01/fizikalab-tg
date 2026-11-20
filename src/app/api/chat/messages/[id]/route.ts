import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publishToChannel } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const editSchema = z.object({
  body: z.string().min(1, "Xabar bo'sh bo'lishi mumkin emas").max(2000, "Xabar 2000 belgidan oshmasligi kerak"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = editSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Xabar topilmadi" }, { status: 404 });
    }

    const msg = existing[0];
    if (msg.userId !== user.id) {
      return NextResponse.json({ error: "Faqat o'z xabaringizni tahrirlashingiz mumkin" }, { status: 403 });
    }

    const now = new Date();
    await db
      .update(messages)
      .set({
        body: parsed.data.body.trim(),
        editedAt: now,
      })
      .where(eq(messages.id, id));

    await publishToChannel(msg.channelId, "edit_message", {
      id,
      channelId: msg.channelId,
      body: parsed.data.body.trim(),
      editedAt: now.toISOString(),
    });

    return NextResponse.json({ success: true, editedAt: now.toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server xatosi" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const existing = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Xabar topilmadi" }, { status: 404 });
    }

    const msg = existing[0];
    const isOwner = msg.userId === user.id;
    const isStaff = user.role === "admin" || user.role === "moderator";

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Ushbu xabarni o'chirish huquqingiz yo'q" }, { status: 403 });
    }

    const now = new Date();
    await db
      .update(messages)
      .set({
        deletedAt: now,
        body: "[Xabar o'chirildi]",
      })
      .where(eq(messages.id, id));

    await publishToChannel(msg.channelId, "delete_message", {
      id,
      channelId: msg.channelId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server xatosi" }, { status: 500 });
  }
}
