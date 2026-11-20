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
  verifyTelegramWidgetData,
  verifyTelegramWebAppData,
} from "@/lib/telegram";
import {
  createTelegramLoginToken,
  checkTelegramLoginToken,
} from "@/lib/telegramLoginTokens";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TelegramAuthRequestBody {
  initData?: string;
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number | string;
  hash?: string;
  widgetData?: Record<string, any>;
  telegramUser?: Record<string, any>;
  mockTelegramUser?: {
    id: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  university?: string;
  faculty?: string;
  studentGroup?: string;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`telegram_auth:${ip}`, 40, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${rl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as TelegramAuthRequestBody;

    // 0. Telegram Deep-Link Login Token yaratish
    if ((body as any).action === "create_token") {
      const token = createTelegramLoginToken();
      const botUrl = `https://t.me/Fizikatuitbot?start=auth_${token}`;
      return NextResponse.json({ ok: true, token, botUrl });
    }

    let verifiedUser: {
      id: number | string;
      firstName: string;
      lastName: string;
      username: string;
      photoUrl: string;
    } | null = null;

    // 0.1 Telegram Deep-Link Login Token holatini tekshirish
    if ((body as any).action === "check_token") {
      const token = String((body as any).token || "");
      if (!token) {
        return NextResponse.json({ error: "Token ko‘rsatilmadi" }, { status: 400 });
      }
      const tokenData = checkTelegramLoginToken(token, true);
      if (!tokenData || !tokenData.verified || !tokenData.user) {
        return NextResponse.json({ verified: false });
      }
      verifiedUser = {
        id: tokenData.user.id,
        firstName: tokenData.user.firstName,
        lastName: tokenData.user.lastName,
        username: tokenData.user.username,
        photoUrl: tokenData.user.photoUrl || "",
      };
    }

    // 1. WebApp initData, Widget hash yoki mock orqali tekshirish
    if (!verifiedUser) {
      if (body.initData) {
        const res = verifyTelegramWebAppData(body.initData);
        if (!res.valid || !res.user) {
          return NextResponse.json(
            { error: res.error || "Telegram WebApp imzosi noto‘g‘ri yoki eskirgan." },
            { status: 401 }
          );
        }
        verifiedUser = res.user;
      } else if (body.hash || body.widgetData?.hash || body.telegramUser?.hash) {
        const data = body.widgetData || body.telegramUser || body;
        const res = verifyTelegramWidgetData(data);
        if (!res.valid || !res.user) {
          return NextResponse.json(
            { error: res.error || "Telegram widget imzosi noto‘g‘ri yoki eskirgan." },
            { status: 401 }
          );
        }
        verifiedUser = res.user;
      } else if (
        body.mockTelegramUser &&
        (process.env.FIZIKALAB_TEST === "1" ||
          process.env.CI ||
          process.env.NODE_ENV !== "production")
      ) {
        verifiedUser = {
          id: body.mockTelegramUser.id,
          firstName: body.mockTelegramUser.first_name || "Test",
          lastName: body.mockTelegramUser.last_name || "User",
          username: body.mockTelegramUser.username || "testuser",
          photoUrl: "",
        };
      } else {
        return NextResponse.json(
          {
            error:
              "Telegram autentifikatsiya ma’lumotlari (initData yoki widget hash) topilmadi.",
          },
          { status: 400 }
        );
      }
    }

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

      const university = body.university || "Toshkent axborot texnologiyalari universiteti";
      const faculty = body.faculty || "Kompyuter injiniringi";
      const studentGroup = body.studentGroup || "TG-2026";
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
        `Yangi talaba Telegram orqali ro‘yxatdan o‘tdi: ${fullName} (@${username || telegramId})`
      );
    }

    const clientRole = user.role === "teacher" ? "teacher" : "student";
    const clientEmail = user.email;
    const clientFullName = user.full_name;

    const token = await signSessionToken(
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
      `${clientFullName} Telegram orqali tizimga kirdi (@${username || telegramId})`
    );

    const res = NextResponse.json({
      ok: true,
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

    res.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return res;
  } catch (err: any) {
    console.error("[TelegramAuth] Server xatosi:", err);
    return NextResponse.json(
      { error: "Telegram orqali kirishda server xatosi yuz berdi." },
      { status: 500 }
    );
  }
}

/**
 * Telegram Login Widget brauzer orqali to'g'ridan-to'g'ri GET redirect qilganda
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    if (!searchParams.hash || !searchParams.id) {
      return NextResponse.redirect(new URL("/?error=telegram_params_missing", req.url));
    }

    const verifyRes = verifyTelegramWidgetData(searchParams);
    if (!verifyRes.valid || !verifyRes.user) {
      return NextResponse.redirect(new URL("/?error=telegram_auth_invalid", req.url));
    }

    const verifiedUser = verifyRes.user;
    const telegramId = String(verifiedUser.id);
    const username = (verifiedUser.username || "").replace(/^@/, "");
    const fullName =
      [verifiedUser.firstName, verifiedUser.lastName].filter(Boolean).join(" ").trim() ||
      (username ? `@${username}` : `Talaba #${telegramId}`);

    const db = await getDb();
    let user = await db.queryOne<DbUser>(
      "SELECT * FROM users WHERE telegram_chat_id = $1 OR (telegram_username != '' AND telegram_username = $2)",
      [telegramId, username || "NONE"]
    );

    const now = new Date().toISOString();

    if (!user) {
      const userEmail = username
        ? `${username.toLowerCase()}@telegram.fizikalab.uz`
        : `tg_${telegramId}@telegram.fizikalab.uz`;

      const insertRes = await db.execute(
        `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, telegram_chat_id, telegram_username, created_at)
         VALUES ($1, $2, $3, 'student', 'TG-2026', 'Toshkent axborot texnologiyalari universiteti', 'Kompyuter injiniringi', 1, 0, $4, $5, $6) RETURNING id`,
        [
          fullName,
          userEmail,
          crypto.randomBytes(32).toString("hex"),
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
        password_hash: "",
        role: "student",
        student_group: "TG-2026",
        university: "Toshkent axborot texnologiyalari universiteti",
        faculty: "Kompyuter injiniringi",
        is_active: 1,
        is_banned: 0,
        telegram_chat_id: telegramId,
        telegram_username: username,
        created_by: null,
        created_at: now,
      };
    }

    const clientRole = user.role === "teacher" ? "teacher" : "student";
    const token = await signSessionToken(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: clientRole,
        studentGroup: user.student_group,
        university: user.university || "",
        faculty: user.faculty || "",
      },
      req
    );

    const redirectTarget = user.role === "teacher" ? "/teacher" : "/labs/metrology";
    const redirectRes = NextResponse.redirect(new URL(redirectTarget, req.url));
    redirectRes.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return redirectRes;
  } catch (err) {
    console.error("[TelegramAuth GET] Xatolik:", err);
    return NextResponse.redirect(new URL("/?error=telegram_auth_error", req.url));
  }
}
