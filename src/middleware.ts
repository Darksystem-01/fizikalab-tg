import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Strip spoofed / injected client headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-role");
  requestHeaders.delete("x-admin");
  requestHeaders.delete("role");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Enforce defense-in-depth security headers
  // For API routes, keep strict X-Frame-Options: DENY to prevent API framing attacks and satisfy security audits.
  // For web pages and Telegram WebApp routes, allow framing from Telegram while retaining full CSP frame-ancestors.
  if (request.nextUrl.pathname.startsWith("/api")) {
    response.headers.set("X-Frame-Options", "DENY");
  } else {
    response.headers.delete("X-Frame-Options");
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
