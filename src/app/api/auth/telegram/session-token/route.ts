import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth";
import {
  getDb,
  writeAuditLog,
  type DbUser,
} from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  createTelegramLoginSession,
  checkTelegramLoginTokenAsync,
} from "@/lib/telegramLoginTokens";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/auth/telegram/session-token
 * Generates a secure random 32-byte login token with 5-minute expiry.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`telegram_session_token:${ip}`, 30, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${rl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429 }
      );
    }

    const session = await createTelegramLoginSession();

    return NextResponse.json({
      ok: true,
      token: session.token,
      botUsername: session.botUsername,
      deepLink: session.deepLink,
      expiresInSeconds: session.expiresInSeconds,
    });
  } catch (err: any) {
    console.error("[TelegramSessionToken POST] Xatolik:", err);
    return NextResponse.json(
      { error: "Telegram login tokenini yaratishda server xatosi yuz berdi." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/telegram/session-token?token=...
 * Checks verification status. Once verified, automatically registers/authenticates user,
 * sets the fizikalab_session cookie, and returns user payload & redirectUrl.
 */
export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`telegram_poll:${ip}`, 120, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `So‘rovlar soni me’yordan oshdi. Iltimos kuting.` },
        { status: 429 }
      );
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Token parametri ko‘rsatilmadi." },
        { status: 400 }
      );
    }

    // Check token status (consume=true when verified to prevent replay attacks)
    const tokenData = await checkTelegramLoginTokenAsync(token, true);

    if (!tokenData) {
      return NextResponse.json(
        {
          ok: false,
          status: "expired",
          error: "Login tokeni topilmadi, muddati tugagan yoki allaqachon foydalanilgan.",
        },
        { status: 400 }
      );
    }

    if (!tokenData.verified || !tokenData.user) {
      return NextResponse.json({
        ok: true,
        status: "pending",
        message: "Telegram botingizdan tasdiq kutilmoqda...",
      });
    }

    // Token has been verified via Telegram Bot!
    const verifiedUser = tokenData.user;
    const telegramId = String(verifiedUser.id);
    const username = (verifiedUser.username || "").replace(/^@/, "");
    const fullName =
      [verifiedUser.firstName, verifiedUser.lastName].filter(Boolean).join(" ").trim() ||
      (username ? `@${username}` : `Talaba #${telegramId}`);

    const db = await getDb();

    // Foydalanuvchini bazadan qidiramiz
    let user = await db.queryOne<DbUser>(
      "SELECT * FROM users WHERE telegram_chat_id = $1 OR (telegram_username != '' AND telegram_username = $2)",
      [telegramId, username || "NONE"]
    );

    // Agar topilmasa, email orqali tekshiramiz
    if (!user && username) {
      user = await db.queryOne<DbUser>(
        "SELECT * FROM users WHERE LOWER(TRIM(email)) = $1",
        [`${username.toLowerCase()}@telegram.fizikalab.uz`]
      );
    }

    const now = new Date().toISOString();

    if (user) {
      if (user.is_banned === 1 || user.is_active !== 1) {
        return NextResponse.json(
          { error: "Hisobingiz administrator tomonidan bloklangan." },
          { status: 403 }
        );
      }

      // telegram_chat_id yoki telegram_username yangilanmagan bo'lsa yangilab qo'yamiz
      if (user.telegram_chat_id !== telegramId || (username && user.telegram_username !== username)) {
        await db.execute(
          "UPDATE users SET telegram_chat_id = $1, telegram_username = $2 WHERE id = $3",
          [telegramId, username || user.telegram_username || "", user.id]
        );
      }
    } else {
      // Yangi talaba hisobini yaratamiz
      const userEmail = username
        ? `${username.toLowerCase()}@telegram.fizikalab.uz`
        : `tg_${telegramId}@telegram.fizikalab.uz`;

      const university = "Toshkent axborot texnologiyalari universiteti";
      const faculty = "Kompyuter injiniringi";
      const studentGroup = "TG-2026";
      const dummyPassword = crypto.randomBytes(32).toString("hex");

      const insertRes = await db.execute(
        `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, telegram_chat_id, telegram_username, created_at)
         VALUES ($1, $2, $3, 'student', $4, $5, $6, 1, 0, $7, $8, $9) RETURNING id`,
        [
          fullName,
          userEmail,
          dummyPassword,
          studentGroup,
          university,
          faculty,
          telegramId,
          username,
          now,
        ]
      );

      const newId = Number(insertRes.lastInsertId);
      user = {
        id: newId,
        full_name: fullName,
        email: userEmail,
        password_hash: dummyPassword,
        role: "student",
        student_group: studentGroup,
        university,
        faculty,
        is_active: 1,
        is_banned: 0,
        telegram_chat_id: telegramId,
        telegram_username: username,
        created_by: null,
        created_at: now,
      };

      await writeAuditLog(
        newId,
        "TELEGRAM_REGISTER",
        `Yangi talaba Telegram Deep-Link orqali ro‘yxatdan o‘tdi: ${fullName} (@${username || telegramId})`
      );
    }

    const clientRole = user.role === "teacher" ? "teacher" : (user.role === "admin" ? "admin" : "student");
    const clientEmail = user.email;
    const clientFullName = user.full_name;

    const sessionToken = await signSessionToken(
      {
        userId: user.id,
        email: clientEmail,
        fullName: clientFullName,
        role: clientRole,
        studentGroup: user.student_group,
        university: user.university || "",
        faculty: user.faculty || "",
      },
      req
    );

    await writeAuditLog(
      user.id,
      "TELEGRAM_LOGIN",
      `${clientFullName} Telegram Deep-Link orqali tizimga kirdi (@${username || telegramId})`
    );

    const redirectUrl =
      user.role === "admin" || (user.role as any) === "darksystem"
        ? "/darksystem"
        : user.role === "teacher"
        ? "/teacher"
        : "/labs/metrology";

    const res = NextResponse.json({
      ok: true,
      status: "verified",
      redirectUrl,
      user: {
        id: user.id,
        fullName: clientFullName,
        email: clientEmail,
        role: clientRole,
        studentGroup: user.student_group,
        university: user.university || "",
        faculty: user.faculty || "",
        telegramId,
        telegramUsername: username,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

    return res;
  } catch (err: any) {
    console.error("[TelegramSessionToken GET] Xatolik:", err);
    return NextResponse.json(
      { error: "Telegram autentifikatsiya holatini tekshirishda server xatosi yuz berdi." },
      { status: 500 }
    );
  }
}
