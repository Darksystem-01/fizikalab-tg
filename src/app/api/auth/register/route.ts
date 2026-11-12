import { NextResponse } from "next/server";
import {
  hashPassword,
  isConfiguredAdminEmail,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { getDb, writeAuditLog, type DbUser } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  findUniversity,
  isValidFacultyForUniversity,
} from "@/lib/universities";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 15, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Ro‘yxatdan o‘tish so‘rovlari limiti tugadi. ${rl.retryAfterSec} soniyadan keyin urinib ko‘ring.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      university?: string;
      faculty?: string;
      studentGroup?: string;
      role?: string;
    };

    // Public registration is strictly limited to student role regardless of payload
    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const university = (body.university || "").trim();
    const faculty = (body.faculty || "").trim();
    const studentGroup = (body.studentGroup || "").trim();

    if (
      fullName.length < 3 ||
      !EMAIL_RE.test(email) ||
      password.length < 6 ||
      university.length < 2 ||
      faculty.length < 2 ||
      studentGroup.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "F.I.Sh., Universitet, Fakultet, Guruh, to‘g‘ri email va kamida 6 belgili parol to‘liq kiritilishi shart.",
        },
        { status: 400 }
      );
    }

    const matchedUni = findUniversity(university);
    if (!matchedUni) {
      return NextResponse.json(
        {
          error:
            "Iltimos, ro‘yxatdan O‘zbekistondagi haqiqiy universitet (OTM)ni tanlang. Noto‘g‘ri yoki soxta universitet qabul qilinmaydi.",
        },
        { status: 400 }
      );
    }

    if (!isValidFacultyForUniversity(matchedUni.name, faculty)) {
      return NextResponse.json(
        {
          error: `"${matchedUni.shortName}" uchun tasdiqlangan haqiqiy fakultetni tanlang.`,
        },
        { status: 400 }
      );
    }

    if (isConfiguredAdminEmail(email)) {
      return NextResponse.json(
        { error: "Bu email bilan ro‘yxatdan o‘tish mumkin emas." },
        { status: 403 }
      );
    }

    const db = await getDb();
    const existing = await db.queryOne<DbUser>(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = $1",
      [email]
    );
    if (existing) {
      return NextResponse.json(
        { error: "Bu email allaqachon ro‘yxatdan o‘tgan." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const inserted = await db.execute(
      `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, created_at)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, 1, 0, $7) RETURNING id`,
      [fullName, email, hashPassword(password), studentGroup, matchedUni.name, faculty, now]
    );

    const newId = inserted.lastInsertId!;
    await writeAuditLog(
      newId,
      "REGISTER",
      `Yangi talaba: ${email} (${matchedUni.name} / ${faculty} / ${studentGroup})`
    );

    const token = signSessionToken({
      userId: newId,
      email,
      fullName,
      role: "student",
      studentGroup,
      university: matchedUni.name,
      faculty,
    });

    const res = NextResponse.json(
      {
        user: {
          id: newId,
          fullName,
          email,
          role: "student",
          studentGroup,
          university: matchedUni.name,
          faculty,
        },
      },
      { status: 201 }
    );
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
      { error: "Ro‘yxatdan o‘tishda server xatosi yuz berdi." },
      { status: 500 }
    );
  }
}
