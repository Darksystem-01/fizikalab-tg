import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSessionUser,
  verifySessionTokenStateless,
  SESSION_COOKIE_NAME,
  getSessionClearCookieOptions,
} from "@/lib/auth";
import { writeAuditLog, revokeSession } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (user && user.sessionId) {
    await revokeSession(user.sessionId);
    await writeAuditLog(user.userId, "LOGOUT", `${user.email} tizimdan chiqdi`);
  } else {
    try {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
      let token = match ? decodeURIComponent(match[1]) : undefined;
      if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      }
      if (token) {
        const stateless = verifySessionTokenStateless(token);
        if (stateless?.sessionId) {
          await revokeSession(stateless.sessionId);
        }
      }
    } catch {
      // Best-effort session revocation
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", getSessionClearCookieOptions());
  return res;
}
