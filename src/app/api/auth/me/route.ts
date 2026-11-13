import { NextResponse } from "next/server";
import {
  getSessionUser,
  rotateSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionClearCookieOptions,
  shouldRotateSession,
  type UserRole,
} from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
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

  // Auto-rotate session token every 30 seconds
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
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, getSessionCookieOptions());
  }

  return res;
}
