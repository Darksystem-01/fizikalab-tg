import { NextResponse } from "next/server";
import {
  diagnoseAdminConfigStatus,
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

    const isDarksystem = user.role === "admin";
    const clientRole = isDarksystem ? "darksystem" : user.role;
    const clientEmail = isDarksystem ? "darksystem@internal" : user.email;
    const clientFullName = isDarksystem ? "Darksystem Administrator" : user.full_name;

    const token = signSessionToken({
      userId: user.id,
      email: clientEmail,
      fullName: clientFullName,
      role: clientRole,
      studentGroup: user.student_group,
      university: user.university || "",
      faculty: user.faculty || "",
    });

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
