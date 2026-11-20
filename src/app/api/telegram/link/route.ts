import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateAccountLinkToken } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const token = generateAccountLinkToken(Number(user.userId));
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "FizikaLabBot";
  const deepLink = `https://t.me/${botUsername}?start=link_${token}`;

  const db = await getDb();
  const dbUser = await db.queryOne<{ telegram_chat_id: string; telegram_username: string }>(
    `SELECT telegram_chat_id, telegram_username FROM users WHERE id = $1`,
    [user.userId]
  );

  return NextResponse.json({
    token,
    deepLink,
    botUsername,
    isLinked: Boolean(dbUser?.telegram_chat_id && dbUser.telegram_chat_id.trim() !== ""),
    telegramChatId: dbUser?.telegram_chat_id || "",
    telegramUsername: dbUser?.telegram_username || "",
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const db = await getDb();

  if (body.action === "unlink") {
    await db.execute(
      `UPDATE users SET telegram_chat_id = '', telegram_username = '' WHERE id = $1`,
      [user.userId]
    );
    return NextResponse.json({ success: true, message: "Telegram hisob ajratildi" });
  }

  return NextResponse.json({ error: "Noto‘g‘ri amaliyot" }, { status: 400 });
}
