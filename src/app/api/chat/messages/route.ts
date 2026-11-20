import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { messages, messageReactions, channels, users, mentions, notifications } from "@/db/schema";
import { eq, and, desc, sql, lt, isNull } from "drizzle-orm";
import { publishToChannel, getEventsSince } from "@/lib/realtime";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const postMessageSchema = z.object({
  channelId: z.string().min(1, "Kanal identifikatori talab qilinadi"),
  body: z.string().min(1, "Xabar bo'sh bo'lishi mumkin emas").max(2000, "Xabar 2000 belgidan oshmasligi kerak"),
  replyToId: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

// Seed sample chat messages if channel is empty
const INITIAL_CHANNEL_MESSAGES: Record<string, any[]> = {
  chan_umumiy: [
    {
      id: "msg_sample_1",
      channelId: "chan_umumiy",
      userId: "user_seed_1",
      body: "Assalomu alaykum hurmatli talabalar va bo'lajak muhandislar! FizikaLab ilmiy chatiga xush kelibsiz! 👋",
      replyToId: null,
      attachmentUrl: null,
      editedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      author: {
        id: "user_seed_1",
        nickname: "fizik_tatu",
        university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
        role: "creator",
        avatarUrl: null,
      },
      reactions: [{ emoji: "👋", count: 7, users: ["user_seed_1"] }],
    },
    {
      id: "msg_sample_2",
      channelId: "chan_umumiy",
      userId: "user_seed_2",
      body: "Va alaykum assalom! Bu yerda umumiy fizika, laboratoriya ishlari va HEMIS topshiriqlari bo'yicha muhokama o'tkazsak bo'ladimi?",
      replyToId: "msg_sample_1",
      attachmentUrl: null,
      editedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      author: {
        id: "user_seed_2",
        nickname: "talaba_uz",
        university: "O'zbekiston Milliy Universiteti (O'zMU)",
        role: "student",
        avatarUrl: null,
      },
      reactions: [{ emoji: "🔥", count: 4, users: [] }],
    },
  ],
  chan_savol_javob: [
    {
      id: "msg_sample_3",
      channelId: "chan_savol_javob",
      userId: "user_seed_2",
      body: "Savol: Karno siklining FIK formulasida harorat Kelvin yoki Selsiyda olinishi kerakmi? Formula: η = (T1 - T2) / T1",
      replyToId: null,
      attachmentUrl: null,
      editedAt: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      author: {
        id: "user_seed_2",
        nickname: "talaba_uz",
        university: "TDTU",
        role: "student",
        avatarUrl: null,
      },
      reactions: [{ emoji: "❓", count: 3, users: [] }],
    },
    {
      id: "msg_sample_4",
      channelId: "chan_savol_javob",
      userId: "user_seed_1",
      body: "Har doim mutlaq harorat (Kelvin shkalasi: T = t + 273.15 K) da olinadi! Chunki termodinamik harorat nol nuqtasi absolut nolga bog'liq.",
      replyToId: "msg_sample_3",
      attachmentUrl: null,
      editedAt: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      author: {
        id: "user_seed_1",
        nickname: "fizik_tatu",
        university: "TATU",
        role: "creator",
        avatarUrl: null,
      },
      reactions: [{ emoji: "✅", count: 5, users: [] }, { emoji: "👍", count: 6, users: [] }],
    },
  ],
};

// In-memory messages store for fast fallback in test/dev mode
const memoryMessagesStore = new Map<string, any[]>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const since = searchParams.get("since");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 30), 1), 50);

    if (!channelId) {
      return NextResponse.json({ error: "channelId talab qilinadi" }, { status: 400 });
    }

    // If client is polling for incremental updates
    if (since) {
      const sinceTimestamp = Number(since);
      if (!isNaN(sinceTimestamp)) {
        const events = getEventsSince(channelId, sinceTimestamp);
        return NextResponse.json({ events });
      }
    }

    // Try fetching from Neon database
    try {
      const db = getDb();
      const conditions = [
        eq(messages.channelId, channelId),
        isNull(messages.deletedAt),
      ];

      if (cursor) {
        conditions.push(lt(messages.createdAt, new Date(cursor)));
      }

      const rows = await db
        .select({
          id: messages.id,
          channelId: messages.channelId,
          userId: messages.userId,
          body: messages.body,
          replyToId: messages.replyToId,
          attachmentUrl: messages.attachmentUrl,
          editedAt: messages.editedAt,
          createdAt: messages.createdAt,
          authorNickname: users.nickname,
          authorUniversity: users.university,
          authorRole: users.role,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(limit);

      if (rows && rows.length > 0) {
        // Fetch reactions for these messages
        const messageIds = rows.map((r) => r.id);
        const reactionsRows = await db
          .select({
            messageId: messageReactions.messageId,
            emoji: messageReactions.emoji,
            userId: messageReactions.userId,
          })
          .from(messageReactions)
          .where(sql`${messageReactions.messageId} IN ${messageIds}`);

        const reactionsMap = new Map<string, Map<string, string[]>>();
        for (const r of reactionsRows) {
          if (!reactionsMap.has(r.messageId)) {
            reactionsMap.set(r.messageId, new Map());
          }
          const emojis = reactionsMap.get(r.messageId)!;
          if (!emojis.has(r.emoji)) emojis.set(r.emoji, []);
          emojis.get(r.emoji)!.push(r.userId);
        }

        const formatted = rows.map((r) => {
          const mReactions = reactionsMap.get(r.id);
          const reactionsList = mReactions
            ? Array.from(mReactions.entries()).map(([emoji, uIds]) => ({
                emoji,
                count: uIds.length,
                users: uIds,
              }))
            : [];

          return {
            id: r.id,
            channelId: r.channelId,
            userId: r.userId,
            body: r.body,
            replyToId: r.replyToId,
            attachmentUrl: r.attachmentUrl,
            editedAt: r.editedAt ? r.editedAt.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
            author: {
              id: r.userId,
              nickname: r.authorNickname || "Talaba",
              university: r.authorUniversity || "OTM",
              role: r.authorRole || "student",
              avatarUrl: r.authorAvatarUrl,
            },
            reactions: reactionsList,
          };
        });

        // Reverse to return in chronological order (oldest to newest)
        return NextResponse.json({
          messages: formatted.reverse(),
          nextCursor: rows.length === limit ? rows[rows.length - 1].createdAt.toISOString() : null,
        });
      }
    } catch (dbErr) {
      console.warn("[Chat Messages GET] Neon fallback:", dbErr);
    }

    // Memory / Seed fallback
    const memList = memoryMessagesStore.get(channelId) || INITIAL_CHANNEL_MESSAGES[channelId] || [];
    return NextResponse.json({
      messages: memList,
      nextCursor: null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Xabar yozish uchun tizimga kiring" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = postMessageSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Noto'g'ri ma'lumot" },
        { status: 400 }
      );
    }

    const { channelId, body, replyToId, attachmentUrl } = parsed.data;

    // 1. Spam Rate Limiting (5 messages per 10s per user)
    const rateKey = `chat_limit:${user.id}`;
    const rateRes = await checkRateLimit(rateKey, 5, 10);
    if (!rateRes.success) {
      return NextResponse.json(
        { error: "Juda ko'p xabar yubordingiz. Iltimos, 10 soniya kuting." },
        { status: 429 }
      );
    }

    // 2. Check channel permissions
    const db = getDb();
    try {
      const ch = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId))
        .limit(1);

      if (ch.length > 0 && ch[0].type === "announcement") {
        if (user.role !== "admin" && user.role !== "moderator") {
          return NextResponse.json(
            { error: "Bu kanal faqat e'lonlar uchun. Faqat ma'murlar yoza oladi." },
            { status: 403 }
          );
        }
      }
    } catch (ignore) {}

    const messageId = `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const nowIso = new Date().toISOString();

    const newMessage = {
      id: messageId,
      channelId,
      userId: user.id,
      body: body.trim(),
      replyToId: replyToId || null,
      attachmentUrl: attachmentUrl || null,
      editedAt: null,
      createdAt: nowIso,
      author: {
        id: user.id,
        nickname: user.nickname,
        university: user.university || "OTM",
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      reactions: [],
    };

    // 3. Persist to Neon DB
    try {
      await db.insert(messages).values({
        id: messageId,
        channelId,
        userId: user.id,
        body: body.trim(),
        replyToId: replyToId || null,
        attachmentUrl: attachmentUrl || null,
      });

      // 4. Handle @mentions
      const mentionMatches = body.match(/@([a-zA-Z0-9_]{3,30})/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const cleanNicknames = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));
        for (const nick of cleanNicknames) {
          try {
            const foundUser = await db
              .select({ id: users.id })
              .from(users)
              .where(sql`lower(${users.nickname}) = ${nick}`)
              .limit(1);

            if (foundUser.length > 0 && foundUser[0].id !== user.id) {
              const targetId = foundUser[0].id;
              await db.insert(mentions).values({
                id: `men_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
                messageId,
                mentionedUserId: targetId,
              });

              await db.insert(notifications).values({
                id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
                userId: targetId,
                type: "mention",
                data: JSON.stringify({
                  actorId: user.id,
                  actorNickname: user.nickname,
                  targetId: messageId,
                  content: `@${user.nickname} sizni xabarda eslatib o'tdi`,
                }),
              });
            }
          } catch (mErr) {
            console.warn("[Mentions] Error processing mention:", mErr);
          }
        }
      }
    } catch (dbErr) {
      console.warn("[Chat Messages POST] DB write fallback:", dbErr);
    }

    // Save in memory store
    const currentMem = memoryMessagesStore.get(channelId) || [...(INITIAL_CHANNEL_MESSAGES[channelId] || [])];
    currentMem.push(newMessage);
    memoryMessagesStore.set(channelId, currentMem);

    // 5. Broadcast to realtime subscribers (Ably + Polling buffer)
    await publishToChannel(channelId, "new_message", newMessage);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server xatosi" }, { status: 500 });
  }
}
