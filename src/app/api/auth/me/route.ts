import { NextResponse } from "next/server";
import {
  getSessionUser,
  SESSION_COOKIE_NAME,
  shouldRotateSession,
  signSessionToken,
  type UserRole,
} from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
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
    const freshToken = signSessionToken({
      userId: Number(user.userId),
      email: clientUser.email,
      fullName: clientUser.fullName,
      role: clientUser.role as UserRole,
      studentGroup: user.studentGroup,
      university: user.university,
      faculty: user.faculty,
    });
    res.cookies.set(SESSION_COOKIE_NAME, freshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}
