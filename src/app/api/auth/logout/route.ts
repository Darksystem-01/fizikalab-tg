import { NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { writeAuditLog } from "@/lib/db";

export async function POST() {
  const user = await getSessionUser();
  if (user) {
    await writeAuditLog(user.userId, "LOGOUT", `${user.email} tizimdan chiqdi`);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
