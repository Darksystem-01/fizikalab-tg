import { NextResponse } from "next/server";
import { DEFAULT_GOOGLE_CLIENT_ID } from "../route";
import {
  ensureConfiguredAdminRecord,
  getDb,
  writeAuditLog,
  type DbUser,
} from "@/lib/db";
import {
  isConfiguredAdminEmail,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { validateAndSanitizeEmail } from "@/lib/emailValidation";
import crypto from "crypto";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "https";
  const host = req.headers.get("x-forwarded-host") || url.host;
  const baseUrl = `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${baseUrl}/?google_error=${encodeURIComponent(
        "Google orqali kirish bekor qilindi yoki xatolik yuz berdi."
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/?google_error=${encodeURIComponent("Google avtorizatsiya kodi topilmadi.")}`
    );
  }

  const clientId = DEFAULT_GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    "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";

  let googleEmail = "";
  let googleName = "";
  let googleId = "";

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok || (!tokenData.id_token && !tokenData.access_token)) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.redirect(
        `${baseUrl}/?google_error=${encodeURIComponent(
          "Google autentifikatsiya serveridan token olishda xatolik yuz berdi."
        )}`
      );
    }

    if (tokenData.access_token) {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userinfoRes.ok) {
        const u = (await userinfoRes.json()) as GoogleUserInfo;
        googleEmail = u.email || "";
        googleName = u.name || u.email?.split("@")[0] || "";
        googleId = u.sub || "";
      }
    } else if (tokenData.id_token) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
          tokenData.id_token
        )}`
      );
      if (verifyRes.ok) {
        const u = (await verifyRes.json()) as GoogleUserInfo;
        googleEmail = u.email || "";
        googleName = u.name || u.email?.split("@")[0] || "";
        googleId = u.sub || "";
      }
    }
  } catch (err) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(
      `${baseUrl}/?google_error=${encodeURIComponent("Google xizmatiga ulanib bo‘lmadi.")}`
    );
  }

  const emailRes = validateAndSanitizeEmail(googleEmail);
  if (!emailRes.isValid || !emailRes.sanitized) {
    return NextResponse.redirect(
      `${baseUrl}/?google_error=${encodeURIComponent("Google hisobidagi email manzili yaroqsiz.")}`
    );
  }
  const cleanEmail = emailRes.sanitized;

  // 1. Check if Administrator
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
      "Bosh Administrator Google OAuth orqali kirdi: darksystem@internal"
    );

    const res = NextResponse.redirect(`${baseUrl}/darksystem`, { status: 302 });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  }

  // 2. Query database for existing user
  const db = await getDb();
  const existing = await db.queryOne<DbUser>(
    "SELECT * FROM users WHERE LOWER(TRIM(email)) = $1 OR (google_id IS NOT NULL AND google_id = $2)",
    [cleanEmail, googleId || "NONE"]
  );

  if (existing) {
    if (existing.is_banned === 1 || existing.is_active !== 1) {
      return NextResponse.redirect(
        `${baseUrl}/?google_error=${encodeURIComponent(
          "Hisobingiz administrator tomonidan bloklangan."
        )}`
      );
    }

    if (!existing.google_id && googleId) {
      await db.execute("UPDATE users SET google_id = $1 WHERE id = $2", [
        googleId,
        existing.id,
      ]);
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
      `${existing.email} Google OAuth orqali kirdi (${clientRole})`
    );

    const redirectPath =
      clientRole === "darksystem"
        ? "/darksystem"
        : clientRole === "teacher"
        ? "/teacher"
        : "/labs/metrology";

    const res = NextResponse.redirect(`${baseUrl}${redirectPath}`, { status: 302 });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  }

  // 3. New student: redirect to frontend onboarding with prefilled Google verified info
  const onboardingUrl = new URL(`${baseUrl}/`);
  onboardingUrl.searchParams.set("google_onboarding", "1");
  onboardingUrl.searchParams.set("email", cleanEmail);
  onboardingUrl.searchParams.set("name", googleName);
  if (googleId) onboardingUrl.searchParams.set("google_id", googleId);

  return NextResponse.redirect(onboardingUrl.toString(), { status: 302 });
}
