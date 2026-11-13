import { NextResponse } from "next/server";
import { DEFAULT_GOOGLE_CLIENT_ID } from "../route";
import { SESSION_COOKIE_NAME, getSessionClearCookieOptions } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  const clientId = DEFAULT_GOOGLE_CLIENT_ID;

  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "https";
  const host = req.headers.get("x-forwarded-host") || url.host;
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  const state = crypto.randomBytes(16).toString("hex");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(googleAuthUrl.toString(), { status: 302 });
  // Always clear any existing session cookie so new Google auth starts with a clean slate
  res.cookies.set(SESSION_COOKIE_NAME, "", getSessionClearCookieOptions());
  res.cookies.set("fizikalab_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
