import crypto from "crypto";
import { cookies } from "next/headers";

export type UserRole = "admin" | "teacher" | "student";

export interface SessionPayload {
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  studentGroup: string;
  university?: string;
  faculty?: string;
  exp: number;
}

export const SESSION_COOKIE_NAME = "fizikalab_session";

function getAuthSecret(): string {
  const base =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.ADMIN_SECRET ||
    "fizikalab-runtime-fallback-secret-set-AUTH_SECRET-in-vercel";
  return crypto
    .createHash("sha256")
    .update(`${base}:fizikalab-session-key`)
    .digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Robust parser for ADMIN_SECRET accommodating all common storage formats:
 * - Combined string: "email:password", "email|password", "email,password", "email;password"
 * - Multiline or env-style: "ADMIN_EMAIL=...\nADMIN_PASSWORD=..." or "email\npassword"
 * - JSON: {"email":"...", "password":"..."} or ["email", "password"]
 * - Space-separated: "email password"
 */
export function parseAdminCredentialsString(raw: string): {
  email: string;
  password: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { email: "", password: "" };

  // 1. JSON format
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return {
          email: String(parsed[0]).trim().toLowerCase(),
          password: String(parsed[1]),
        };
      }
      if (parsed && typeof parsed === "object") {
        const email = String(
          parsed.email || parsed.user || parsed.username || ""
        )
          .trim()
          .toLowerCase();
        const password = String(
          parsed.password || parsed.pass || parsed.secret || ""
        );
        if (email || password) return { email, password };
      }
    } catch {
      // not JSON, continue with text parsing
    }
  }

  // 2. Env file format (e.g. pasted ADMIN_EMAIL=... \n ADMIN_PASSWORD=...)
  if (/ADMIN_EMAIL\s*=/i.test(trimmed) || /ADMIN_PASSWORD\s*=/i.test(trimmed)) {
    const emailMatch = trimmed.match(/ADMIN_EMAIL\s*=\s*["']?([^"'\r\n]+)["']?/i);
    const passMatch = trimmed.match(/ADMIN_PASSWORD\s*=\s*["']?([^"'\r\n]+)["']?/i);
    const email = emailMatch ? emailMatch[1].trim().toLowerCase() : "";
    const password = passMatch ? passMatch[1].trim() : "";
    if (email || password) return { email, password };
  }

  // 3. Multiline format
  if (trimmed.includes("\n")) {
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      const emailIdx = lines.findIndex((l) => l.includes("@"));
      if (emailIdx !== -1) {
        const email = lines[emailIdx].toLowerCase();
        const otherLines = lines.filter((_, i) => i !== emailIdx);
        return { email, password: otherLines.join("\n") };
      }
      return {
        email: lines[0].toLowerCase(),
        password: lines.slice(1).join("\n"),
      };
    }
  }

  // 4. Common delimiters: ":", "|", ";", ","
  for (const delim of [":", "|", ";", ","]) {
    if (trimmed.includes(delim)) {
      const idx = trimmed.indexOf(delim);
      const part1 = trimmed.slice(0, idx).trim();
      const part2 = trimmed.slice(idx + delim.length).trim();
      if (part1 && part2) {
        if (part1.includes("@")) {
          return { email: part1.toLowerCase(), password: part2 };
        } else if (part2.includes("@")) {
          return { email: part2.toLowerCase(), password: part1 };
        }
        return { email: part1.toLowerCase(), password: part2 };
      }
    }
  }

  // 5. Whitespace separated: "email password"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2 && (parts[0].includes("@") || parts[1].includes("@"))) {
    const email = parts[0].includes("@") ? parts[0].toLowerCase() : parts[1].toLowerCase();
    const pass = parts[0].includes("@") ? parts[1] : parts[0];
    return { email, password: pass };
  }

  // 6. Single value
  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase(), password: "" };
  }
  return { email: "", password: trimmed };
}

export function getConfiguredAdminCredentials(): {
  email: string;
  password: string;
} | null {
  // Check ADMIN_SECRET (or admin_secret) first
  const secret = (
    process.env.ADMIN_SECRET ||
    process.env.admin_secret ||
    ""
  ).trim();

  const rawPassword = (
    process.env.ADMIN_PASSWORD ||
    process.env.admin_password ||
    ""
  ).trim();

  const rawEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.admin_email ||
    ""
  ).trim().toLowerCase();

  if (secret) {
    const fromSecret = parseAdminCredentialsString(secret);
    if (fromSecret.email && fromSecret.password) {
      return fromSecret;
    }
    // If secret provided password and rawEmail exists
    if (!fromSecret.email && fromSecret.password && rawEmail) {
      return { email: rawEmail, password: fromSecret.password };
    }
    // If secret provided email and rawPassword exists
    if (fromSecret.email && !fromSecret.password && rawPassword) {
      return { email: fromSecret.email, password: rawPassword };
    }
  }

  // Check if rawPassword itself contains combined credentials (e.g. "email:password")
  if (rawPassword) {
    const fromPass = parseAdminCredentialsString(rawPassword);
    if (fromPass.email && fromPass.password) {
      return fromPass;
    }
  }

  // Fallback to traditional separate ADMIN_EMAIL and ADMIN_PASSWORD
  if (rawEmail && rawPassword) {
    return { email: rawEmail, password: rawPassword };
  }

  // Fallback: if AUTH_SECRET itself was populated with admin email/credentials (contains '@')
  const authSecret = (process.env.AUTH_SECRET || "").trim();
  if (authSecret && authSecret.includes("@")) {
    const fromAuth = parseAdminCredentialsString(authSecret);
    if (fromAuth.email.includes("@") && fromAuth.password) {
      return fromAuth;
    }
    if (fromAuth.email.includes("@") && !fromAuth.password && rawPassword) {
      return { email: fromAuth.email, password: rawPassword };
    }
  }

  return null;
}

export function isConfiguredAdminEmail(email: string): boolean {
  const cfg = getConfiguredAdminCredentials();
  if (!cfg) return false;
  const input = email.trim().toLowerCase();
  return (
    timingSafeStringEqual(input, cfg.email) ||
    timingSafeStringEqual(input, "admin") ||
    timingSafeStringEqual(input, "administrator")
  );
}

export function verifyConfiguredAdminCredentials(
  email: string,
  password: string
): boolean {
  const cfg = getConfiguredAdminCredentials();
  if (!cfg) return false;
  const inputEmail = email.trim().toLowerCase();
  const emailMatch =
    timingSafeStringEqual(inputEmail, cfg.email) ||
    timingSafeStringEqual(inputEmail, "admin") ||
    timingSafeStringEqual(inputEmail, "administrator");
  const passMatch = timingSafeStringEqual(password, cfg.password);
  return emailMatch && passMatch;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, "hex");
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function performDummyPasswordCheck(password: string): void {
  const dummySalt = "00112233445566778899aabbccddeeff";
  crypto.scryptSync(password || "dummy", dummySalt, 64);
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const data = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (
      parsed.role !== "admin" &&
      parsed.role !== "teacher" &&
      parsed.role !== "student"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const { getActiveSessionUserById } = await import("./db");
  const dbUser = await getActiveSessionUserById(payload.userId);
  if (!dbUser || dbUser.is_active !== 1 || dbUser.is_banned === 1) {
    return null;
  }

  // Sole administrator must always match configured admin credentials
  if (dbUser.role === "admin") {
    const cfg = getConfiguredAdminCredentials();
    if (!cfg || !timingSafeStringEqual(dbUser.email.toLowerCase(), cfg.email)) {
      return null;
    }
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    role: dbUser.role,
    studentGroup: dbUser.student_group,
    university: dbUser.university || "",
    faculty: dbUser.faculty || "",
    exp: payload.exp,
  };
}
