import { NextResponse } from "next/server";
import {
  ensureConfiguredAdminRecord,
  getDb,
  writeAuditLog,
  type DbUser,
} from "@/lib/db";
import {
  hashPassword,
  isConfiguredAdminEmail,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { validateAndSanitizeEmail } from "@/lib/emailValidation";
import { findUniversity, isValidFacultyForUniversity } from "@/lib/universities";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import crypto from "crypto";

export const DEFAULT_GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1094080295210-1nrn1j6spn5cse3n493ufavftdcj2mjc.apps.googleusercontent.com";

export async function GET() {
  const clientId = DEFAULT_GOOGLE_CLIENT_ID;

  return NextResponse.json({
    clientId,
    enabled: true,
  });
}

interface GoogleTokenInfo {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  error_description?: string;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`google_auth:${ip}`, 30, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Juda ko‘p urinish. ${rl.retryAfterSec} soniyadan keyin qayta urinib ko‘ring.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      credential?: string;
      accessToken?: string;
      code?: string;
      mockGoogleUser?: {
        email: string;
        name: string;
        googleId: string;
        emailVerified: boolean;
      };
      university?: string;
      faculty?: string;
      studentGroup?: string;
    };

    let googleEmail = "";
    let googleName = "";
    let googleId = "";

    // 1. Verify Google credential if provided via Google Identity Services or OAuth2 token
    if (body.credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
            body.credential
          )}`,
          { headers: { Accept: "application/json" } }
        );

        if (!verifyRes.ok) {
          return NextResponse.json(
            { error: "Google identifikatsiya tokeni yaroqsiz yoki muddati o‘tgan." },
            { status: 401 }
          );
        }

        const tokenData = (await verifyRes.json()) as GoogleTokenInfo;

        const isVerified =
          tokenData.email_verified === "true" ||
          tokenData.email_verified === true;

        if (!isVerified || !tokenData.email) {
          return NextResponse.json(
            {
              error:
                "Google hisobidagi elektron pochta tasdiqlanmagan. Iltimos, tasdiqlangan Google hisob bilan kiring.",
            },
            { status: 400 }
          );
        }

        googleEmail = tokenData.email;
        googleName = tokenData.name || tokenData.email.split("@")[0];
        googleId = tokenData.sub || "";
      } catch {
        return NextResponse.json(
          { error: "Google xizmatiga ulanishda xatolik yuz berdi." },
          { status: 502 }
        );
      }
    } else if (body.accessToken) {
      try {
        const userinfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${body.accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!userinfoRes.ok) {
          return NextResponse.json(
            { error: "Google kirish tokeni (access token) yaroqsiz yoki muddati o‘tgan." },
            { status: 401 }
          );
        }

        const tokenData = (await userinfoRes.json()) as GoogleTokenInfo;

        const isVerified =
          tokenData.email_verified === "true" ||
          tokenData.email_verified === true;

        if (!isVerified || !tokenData.email) {
          return NextResponse.json(
            {
              error:
                "Google hisobidagi elektron pochta tasdiqlanmagan. Iltimos, tasdiqlangan Google hisob bilan kiring.",
            },
            { status: 400 }
          );
        }

        googleEmail = tokenData.email;
        googleName = tokenData.name || tokenData.email.split("@")[0];
        googleId = tokenData.sub || "";
      } catch {
        return NextResponse.json(
          { error: "Google xizmatiga ulanishda xatolik yuz berdi." },
          { status: 502 }
        );
      }
    } else if (
      body.mockGoogleUser &&
      (process.env.NODE_ENV !== "production" ||
        process.env.CI ||
        process.env.FIZIKALAB_TEST === "1")
    ) {
      // Authorized test harness path for CI / development
      if (!body.mockGoogleUser.emailVerified) {
        return NextResponse.json(
          { error: "Google hisobidagi elektron pochta tasdiqlanmagan." },
          { status: 400 }
        );
      }
      googleEmail = body.mockGoogleUser.email;
      googleName = body.mockGoogleUser.name;
      googleId = body.mockGoogleUser.googleId;
    } else {
      return NextResponse.json(
        { error: "Google credential tokeni yuborilmadi." },
        { status: 400 }
      );
    }

    // 2. Multi-layer validation and sanitization of the verified Google email
    const emailResult = validateAndSanitizeEmail(googleEmail);
    if (!emailResult.isValid) {
      return NextResponse.json(
        { error: emailResult.error || "Email manzili yaroqsiz." },
        { status: 400 }
      );
    }
    const cleanEmail = emailResult.sanitized;

    // 3. Check if this is the Bosh Administrator
    if (isConfiguredAdminEmail(cleanEmail)) {
      const adminUser = await ensureConfiguredAdminRecord(
        cleanEmail,
        crypto.randomBytes(24).toString("hex")
      );

      const token = signSessionToken({
        userId: adminUser.id,
        email: "darksystem@internal",
        fullName: "Darksystem Administrator",
        role: "darksystem",
        studentGroup: "Boshqaruv",
        university: "FizikaLab",
        faculty: "Ma'muriyat",
      });

      await writeAuditLog(
        adminUser.id,
        "GOOGLE_ADMIN_LOGIN",
        `Bosh Administrator Google orqali tizimga kirdi: ${cleanEmail}`
      );

      const res = NextResponse.json({
        user: {
          id: crypto.randomUUID(),
          fullName: "Darksystem Administrator",
          email: "darksystem@internal",
          role: "darksystem",
          studentGroup: "Boshqaruv",
          university: "FizikaLab",
          faculty: "Ma'muriyat",
        },
      });

      res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    // 4. Query database for existing user (by email or google_id)
    const db = await getDb();
    const existing = await db.queryOne<DbUser>(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 OR (google_id IS NOT NULL AND google_id = $2)",
      [cleanEmail, googleId || "NONE"]
    );

    if (existing) {
      if (existing.is_banned === 1 || existing.is_active !== 1) {
        return NextResponse.json(
          { error: "Hisobingiz administrator tomonidan bloklangan." },
          { status: 403 }
        );
      }

      // Link google_id if not present
      if (!existing.google_id && googleId) {
        await db.execute(
          "UPDATE users SET google_id = $1 WHERE id = $2",
          [googleId, existing.id]
        );
      }

      const clientRole = existing.role === "admin" ? "darksystem" : existing.role;
      const clientEmail = clientRole === "darksystem" ? "darksystem@internal" : existing.email;
      const clientFullName = clientRole === "darksystem" ? "Darksystem Administrator" : existing.full_name;

      const token = signSessionToken({
        userId: existing.id,
        email: clientEmail,
        fullName: clientFullName,
        role: clientRole,
        studentGroup: existing.student_group,
        university: existing.university || "",
        faculty: existing.faculty || "",
      });

      await writeAuditLog(
        existing.id,
        "GOOGLE_LOGIN",
        `${existing.email} Google orqali tizimga kirdi (${clientRole})`
      );

      const res = NextResponse.json({
        user: {
          id: clientRole === "darksystem" ? crypto.randomUUID() : existing.id,
          fullName: clientFullName,
          email: clientEmail,
          role: clientRole,
          studentGroup: existing.student_group,
          university: existing.university || "",
          faculty: existing.faculty || "",
        },
      });

      res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    // 5. New user registering via Google: Requires academic verification (University, Faculty, Group)
    const university = (body.university || "").trim();
    const faculty = (body.faculty || "").trim();
    const studentGroup = (body.studentGroup || "").trim();

    if (!university || !faculty || !studentGroup) {
      // Tell client that Google identity is verified but academic profile must be completed
      return NextResponse.json({
        needsAcademicProfile: true,
        email: cleanEmail,
        fullName: googleName,
        googleId,
        message:
          "Google hisobingiz muvaffaqiyatli tasdiqlandi. Laboratoriya jurnaliga biriktirish uchun Universitet, Fakultet va Guruhingizni tanlang.",
      });
    }

    // Validate university & faculty against official catalog
    const matchedUni = findUniversity(university);
    if (!matchedUni) {
      return NextResponse.json(
        {
          error:
            "Iltimos, ro‘yxatdan O‘zbekistondagi haqiqiy universitet (OTM)ni tanlang.",
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

    // Create student account
    const dummyPass = crypto.randomBytes(32).toString("hex");
    const now = new Date().toISOString();

    const inserted = await db.execute(
      `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, google_id, created_at)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, 1, 0, $7, $8) RETURNING id`,
      [
        googleName,
        cleanEmail,
        hashPassword(dummyPass),
        studentGroup,
        matchedUni.name,
        faculty,
        googleId || null,
        now,
      ]
    );

    const newUserId = Number(inserted.lastInsertId);

    const token = signSessionToken({
      userId: newUserId,
      email: cleanEmail,
      fullName: googleName,
      role: "student",
      studentGroup,
      university: matchedUni.name,
      faculty,
    });

    await writeAuditLog(
      newUserId,
      "GOOGLE_REGISTER",
      `Yangi talaba Google orqali ro‘yxatdan o‘tdi: ${cleanEmail} (${matchedUni.shortName})`
    );

    const res = NextResponse.json(
      {
        user: {
          id: newUserId,
          fullName: googleName,
          email: cleanEmail,
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json(
      { error: "Google orqali kirishda kutilmagan server xatoligi yuz berdi." },
      { status: 500 }
    );
  }
}
