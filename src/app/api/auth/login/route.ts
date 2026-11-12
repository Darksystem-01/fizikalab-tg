import { NextResponse } from "next/server";
import {
  getConfiguredAdminCredentials,
  isConfiguredAdminEmail,
  performDummyPasswordCheck,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyConfiguredAdminCredentials,
  verifyPassword,
} from "@/lib/auth";
import {
  ensureConfiguredAdminRecord,
  getDb,
  writeAuditLog,
  type DbUser,
} from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const rl = checkRateLimit(`login:${ip}:${email}`, 20, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${rl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email va parol kiritilishi shart." },
        { status: 400 }
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
      const adminCfg = getConfiguredAdminCredentials()!;
      user = await ensureConfiguredAdminRecord(adminCfg.email, adminCfg.password);
    } else {
      const db = await getDb();
      const found = await db.queryOne<DbUser>(
        "SELECT * FROM users WHERE email = $1 AND role <> 'admin'",
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

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      studentGroup: user.student_group,
      university: user.university || "",
      faculty: user.faculty || "",
    });

    await writeAuditLog(user.id, "LOGIN", `${user.email} (${user.role}) tizimga kirdi`);

    const res = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        studentGroup: user.student_group,
        university: user.university || "",
        faculty: user.faculty || "",
      },
    });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Kirish jarayonida server xatosi yuz berdi." },
      { status: 500 }
    );
  }
}
