import { NextResponse } from "next/server";
import { getSessionUser as getModernSessionUser } from "@/lib/auth/session";
import {
  getSessionUser as getLegacySessionUser,
  rotateSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionClearCookieOptions,
  shouldRotateSession,
  type UserRole,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  // 1. Check modern FizikaLab Reels session
  const modernUser = await getModernSessionUser();
  if (modernUser) {
    return NextResponse.json({
      user: {
        id: modernUser.id,
        nickname: modernUser.nickname,
        role: modernUser.role,
        maskedPhone: modernUser.maskedPhone,
        phoneVerified: modernUser.phoneVerified,
        avatarUrl: modernUser.avatarUrl,
        bio: modernUser.bio,
        university: modernUser.university,
        faculty: modernUser.faculty,
        course: modernUser.course,
      },
    });
  }

  // 2. Check legacy session for backward compatibility
  const user = await getLegacySessionUser(req);
  if (!user || !user.sessionId) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set(SESSION_COOKIE_NAME, "", getSessionClearCookieOptions());
    return res;
  }

  const isDarksystem = user.role === "darksystem" || user.role === "admin";
  const clientUser = {
    id: isDarksystem ? crypto.randomUUID() : user.userId,
    fullName: isDarksystem ? "Darksystem Administrator" : user.fullName,
    email: isDarksystem ? "darksystem@internal" : user.email,
    role: isDarksystem ? "darksystem" : user.role,
    studentGroup: user.studentGroup,
    university: user.university || "",
    faculty: user.faculty || "",
  };

  const res = NextResponse.json({ user: clientUser });

  // Auto-rotate session token every 30 seconds for legacy
  if (shouldRotateSession(user)) {
    const freshToken = await rotateSessionToken(
      user.sessionId,
      {
        userId: Number(user.userId),
        email: clientUser.email,
        fullName: clientUser.fullName,
        role: clientUser.role as UserRole,
        studentGroup: user.studentGroup,
        university: user.university,
        faculty: user.faculty,
      },
      req
    );
    if (freshToken) {
      res.cookies.set(SESSION_COOKIE_NAME, freshToken, getSessionCookieOptions());
    }
  }

  return res;
}
