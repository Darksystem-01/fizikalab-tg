import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  diagnoseAdminConfigStatus,
  getConfiguredAdminCredentials,
  isConfiguredAdminEmail,
  performDummyPasswordCheck,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  signSessionToken,
  verifyConfiguredAdminCredentials,
  verifyPassword,
} from "@/lib/auth";
import {
  ensureConfiguredAdminRecord,
  getDb as getLegacyDb,
  writeAuditLog,
  type DbUser,
} from "@/lib/db";
import { checkRateLimit as checkLegacyRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeEmail } from "@/lib/emailValidation";
import { validateAndFormatPhone } from "@/lib/auth/phone";
import { hashPhoneHmac } from "@/lib/crypto";
import { verifyPasswordArgon2, dummyArgon2Verify } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = (await req.json()) as {
      email?: string;
      phone?: string;
      login?: string;
      password?: string;
    };

    const loginIdentifier = (body.login || body.phone || body.email || "").trim();
    const password = body.password || "";

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Email va parol kiritilishi shart." },
        { status: 400 }
      );
    }

    // 1. Check if user is attempting to login via Neon Drizzle (FizikaLab Reels Phone or Nickname)
    const phoneParsed = validateAndFormatPhone(loginIdentifier);
    if (phoneParsed.valid && phoneParsed.e164) {
      const db = getDb();
      const phoneHmac = hashPhoneHmac(phoneParsed.e164);
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.phoneHmac, phoneHmac))
        .limit(1);

      if (u) {
        const isPasswordValid = await verifyPasswordArgon2(password, u.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json({ error: "Telefon raqam yoki parol noto‘g‘ri." }, { status: 401 });
        }

        if (u.status === "pending") {
          return NextResponse.json(
            { error: "Akkauntingiz hali tasdiqlanmagan. Iltimos, SMS kod orqali tasdiqlang.", pendingOtp: true },
            { status: 403 }
          );
        }

        if (u.status === "banned" || u.status === "deleted") {
          return NextResponse.json({ error: "Ushbu hisob qoidabuzarlik sababli bloklangan." }, { status: 403 });
        }

        await db
          .update(users)
          .set({ lastSeenAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, u.id));

        const userAgent = req.headers.get("user-agent") || undefined;
        await createSession(u.id, userAgent, ip);

        return NextResponse.json({
          success: true,
          user: { id: u.id, nickname: u.nickname, role: u.role },
        });
      }
    }

    // 2. Legacy Email & Admin flow
    const ipRl = checkLegacyRateLimit(`login_ip:${ip}`, 40, 5 * 60 * 1000);
    if (!ipRl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${ipRl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429, headers: { "Retry-After": String(ipRl.retryAfterSec) } }
      );
    }

    const rawEmail = (body.email || loginIdentifier).trim();
    const email = rawEmail.includes("@") ? sanitizeEmail(rawEmail) : rawEmail.toLowerCase();

    const rl = checkLegacyRateLimit(`login:${ip}:${email}`, 20, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${rl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    let user: DbUser | null = null;

    if (isConfiguredAdminEmail(email)) {
      if (!verifyConfiguredAdminCredentials(email, password)) {
        performDummyPasswordCheck(password);
        return NextResponse.json(
          { error: "Email yoki parol noto‘g‘ri." },
          { status: 401 }
        );
      }
      const adminCfg = getConfiguredAdminCredentials();
      const adminEmail =
        adminCfg && (email === "admin" || email === "administrator")
          ? adminCfg.email
          : email;
      user = await ensureConfiguredAdminRecord(adminEmail, password);
    } else {
      if (email === "admin" || email === "administrator") {
        performDummyPasswordCheck(password);
        const status = diagnoseAdminConfigStatus();
        return NextResponse.json(
          {
            error:
              status === "email_only"
                ? "Production muhitida admin paroli topilmadi (ADMIN_PASSWORD faqat Preview da qolgan bo‘lishi mumkin)."
                : status === "password_only"
                ? "Production muhitida admin email topilmadi. To‘liq email bilan kiring."
                : "Qisqa 'admin' login uchun ADMIN_SECRET sozlanmagan; iltimos to‘liq admin emailingiz bilan kiring.",
          },
          { status: 401 }
        );
      }
      const legacyDb = await getLegacyDb();
      const found = await legacyDb.queryOne<DbUser>(
        "SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 AND role <> 'admin'",
        [email]
      );

      if (!found) {
        performDummyPasswordCheck(password);
        return NextResponse.json(
          { error: "Email yoki parol noto‘g‘ri." },
          { status: 401 }
        );
      }

      if (!verifyPassword(password, found.password_hash)) {
        return NextResponse.json(
          { error: "Email yoki parol noto‘g‘ri." },
          { status: 401 }
        );
      }

      if (found.is_banned === 1 || found.is_active !== 1) {
        return NextResponse.json(
          { error: "Hisobingiz administrator tomonidan bloklangan." },
          { status: 403 }
        );
      }

      user = found;
    }

    const isDarksystem = user.role === "admin";
    const clientRole = isDarksystem ? "darksystem" : user.role;
    const clientEmail = isDarksystem ? "darksystem@internal" : user.email;
    const clientFullName = isDarksystem ? "Darksystem Administrator" : user.full_name;

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
      "LOGIN",
      `${isDarksystem ? "Darksystem Administrator" : user.email} (${clientRole}) tizimga kirdi`
    );

    const res = NextResponse.json({
      user: {
        id: isDarksystem ? crypto.randomUUID() : user.id,
        fullName: clientFullName,
        email: clientEmail,
        role: clientRole,
        studentGroup: user.student_group,
        university: user.university || "",
        faculty: user.faculty || "",
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[Login] Exception:", err);
    return NextResponse.json({ error: "Kutilmagan server xatoligi." }, { status: 500 });
  }
}
