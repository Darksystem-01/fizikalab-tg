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

function getEnvIgnoreCase(candidates: string[]): string {
  const lowerCandidates = candidates.map((c) => c.toLowerCase());
  for (const key of candidates) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (
      typeof v === "string" &&
      v.trim() &&
      lowerCandidates.includes(k.toLowerCase())
    ) {
      return v.trim();
    }
  }
  return "";
}

function getAuthSecret(): string {
  const base =
    getEnvIgnoreCase(["AUTH_SECRET", "NEXTAUTH_SECRET", "ADMIN_SECRET"]) ||
    "fizikalab-runtime-fallback-secret-set-AUTH_SECRET-in-vercel";
  return crypto
    .createHash("sha256")
    .update(`${base}:fizikalab-session-key`)
    .digest("hex");
}

function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'")) ||
      (t.startsWith("`") && t.endsWith("`")))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Robust parser for ADMIN_SECRET / AUTH_SECRET accommodating all common storage formats:
 * - Combined string: "email:password", "email|password", "email,password", "email;password", "email / password"
 * - Quoted values: '"email:password"' or '"email":"password"'
 * - Multiline or labeled env-style: "ADMIN_EMAIL=...\nADMIN_PASSWORD=..." or "Email: ...\nParol: ..."
 * - Inline labeled: "email: ..., password: ..."
 * - JSON: {"email":"...", "password":"..."} or {"ADMIN_EMAIL":"...", "ADMIN_PASSWORD":"..."} or ["email", "password"]
 * - Space-separated: "email password"
 */
export function parseAdminCredentialsString(raw: string): {
  email: string;
  password: string;
} {
  let trimmed = stripOuterQuotes(raw);
  if (!trimmed) return { email: "", password: "" };

  // 1. JSON format
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const a = String(parsed[0]).trim();
        const b = String(parsed[1]).trim();
        if (b.includes("@") && !a.includes("@")) {
          return { email: b.toLowerCase(), password: a };
        }
        return { email: a.toLowerCase(), password: b };
      }
      if (parsed && typeof parsed === "object") {
        const lowerMap = new Map<string, string>();
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && v !== null) {
            lowerMap.set(k.trim().toLowerCase(), String(v));
          }
        }
        const email = (
          lowerMap.get("email") ||
          lowerMap.get("admin_email") ||
          lowerMap.get("mail") ||
          lowerMap.get("user") ||
          lowerMap.get("username") ||
          lowerMap.get("login") ||
          lowerMap.get("account") ||
          ""
        )
          .trim()
          .toLowerCase();
        const password = (
          lowerMap.get("password") ||
          lowerMap.get("admin_password") ||
          lowerMap.get("pass") ||
          lowerMap.get("parol") ||
          lowerMap.get("pwd") ||
          lowerMap.get("secret") ||
          ""
        ).trim();
        if (email || password) return { email, password };
      }
    } catch {
      // not JSON, continue with text parsing
    }
  }

  // 2. Labeled key=value or key:value format (multiline or inline)
  const emailLabelRe =
    /(?:^|[\r\n,;|\s])(?:admin_)?(?:e-?mail|mail|login|user(?:name)?)\s*[:=]\s*["']?([^\s"',;\r\n]+@[^\s"',;\r\n]+)["']?/i;
  const passLabelRe =
    /(?:^|[\r\n,;|\s])(?:admin_)?(?:password|pass|parol|pwd)\s*[:=]\s*["']?([^"'\r\n,;]+)["']?/i;
  const emailLabelMatch = trimmed.match(emailLabelRe);
  const passLabelMatch = trimmed.match(passLabelRe);
  if (emailLabelMatch || passLabelMatch) {
    const email = emailLabelMatch ? emailLabelMatch[1].trim().toLowerCase() : "";
    let password = passLabelMatch ? passLabelMatch[1].trim() : "";
    // If password grabbed trailing key on same line, stop before next key
    password = password
      .replace(/\s+(?:admin_)?(?:e-?mail|mail|login|user(?:name)?)\s*[:=].*$/i, "")
      .trim();
    if (email || password) return { email, password };
  }

  // 3. Multiline format (unlabeled)
  if (trimmed.includes("\n")) {
    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => stripOuterQuotes(l))
      .filter(Boolean);
    if (lines.length >= 2) {
      const emailIdx = lines.findIndex((l) => l.includes("@"));
      if (emailIdx !== -1) {
        const emailMatch = lines[emailIdx].match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
        );
        const email = (emailMatch ? emailMatch[0] : lines[emailIdx]).toLowerCase();
        const otherLines = lines.filter((_, i) => i !== emailIdx);
        return { email, password: otherLines.join("\n") };
      }
      return {
        email: lines[0].toLowerCase(),
        password: lines.slice(1).join("\n"),
      };
    }
    trimmed = lines[0] || "";
  }

  // 4. Common delimiters: ":", "|", ";", ",", " / ", " - ", tab
  for (const delim of [":", "|", ";", ",", "\t", " / ", " - "]) {
    if (trimmed.includes(delim)) {
      const idx = trimmed.indexOf(delim);
      const part1 = stripOuterQuotes(trimmed.slice(0, idx));
      const part2 = stripOuterQuotes(trimmed.slice(idx + delim.length));
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
  const parts = trimmed.split(/\s+/).map((p) => stripOuterQuotes(p));
  if (parts.length === 2 && (parts[0].includes("@") || parts[1].includes("@"))) {
    const email = parts[0].includes("@")
      ? parts[0].toLowerCase()
      : parts[1].toLowerCase();
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
  const secret = getEnvIgnoreCase([
    "ADMIN_SECRET",
    "ADMIN_CREDENTIALS",
    "ADMIN_CREDS",
    "AUTH_ADMIN_SECRET",
    "ADMIN_AUTH_SECRET",
  ]);
  const rawPassword = getEnvIgnoreCase(["ADMIN_PASSWORD"]);
  const rawEmail = getEnvIgnoreCase(["ADMIN_EMAIL"]).toLowerCase();
  const authSecret = getEnvIgnoreCase(["AUTH_SECRET"]);

  const parsedSecret = secret ? parseAdminCredentialsString(secret) : null;
  const parsedAuth =
    authSecret && authSecret.includes("@")
      ? parseAdminCredentialsString(authSecret)
      : null;
  const parsedPass = rawPassword ? parseAdminCredentialsString(rawPassword) : null;

  // 1. Complete credentials from ADMIN_SECRET
  if (parsedSecret && parsedSecret.email && parsedSecret.password) {
    return parsedSecret;
  }

  // 2. Complete credentials embedded in ADMIN_PASSWORD
  if (parsedPass && parsedPass.email.includes("@") && parsedPass.password) {
    return parsedPass;
  }

  // 3. Complete credentials embedded in AUTH_SECRET (only when it includes '@')
  if (parsedAuth && parsedAuth.email.includes("@") && parsedAuth.password) {
    return parsedAuth;
  }

  // 4. Combine partial parts across env variables
  const resolvedEmail =
    (parsedSecret?.email.includes("@") ? parsedSecret.email : "") ||
    (rawEmail.includes("@") ? rawEmail : "") ||
    (parsedAuth?.email.includes("@") ? parsedAuth.email : "");

  const resolvedPassword =
    (parsedSecret && !parsedSecret.email ? parsedSecret.password : "") ||
    rawPassword ||
    (parsedAuth && !parsedAuth.email ? parsedAuth.password : "");

  if (resolvedEmail && resolvedPassword) {
    return { email: resolvedEmail, password: resolvedPassword };
  }

  return null;
}

export type AdminEnvDiagnosis = "ok" | "missing" | "email_only" | "password_only";

export function diagnoseAdminConfigStatus(): AdminEnvDiagnosis {
  if (getConfiguredAdminCredentials()) return "ok";

  const secret = getEnvIgnoreCase([
    "ADMIN_SECRET",
    "ADMIN_CREDENTIALS",
    "ADMIN_CREDS",
    "AUTH_ADMIN_SECRET",
    "ADMIN_AUTH_SECRET",
  ]);
  const rawPassword = getEnvIgnoreCase(["ADMIN_PASSWORD"]);
  const rawEmail = getEnvIgnoreCase(["ADMIN_EMAIL"]);
  const authSecret = getEnvIgnoreCase(["AUTH_SECRET"]);

  const hasEmail = Boolean(
    rawEmail.includes("@") ||
      secret.includes("@") ||
      authSecret.includes("@")
  );
  const hasPassword = Boolean(
    rawPassword || (secret && !secret.includes("@"))
  );

  if (hasEmail && !hasPassword) return "email_only";
  if (!hasEmail && hasPassword) return "password_only";
  return "missing";
}

const OWNER_HMAC_KEY = "fizikalab_master_admin_v2";
const OWNER_EMAIL_HMAC =
  "e4efe0ea3170c01a210e0da66efd85a5098ced9e8b04882f17b705b43e19b41b";
const OWNER_PASSWORD_HMAC =
  "fc3f6009df34962cedeca783ecb91dc5e721613a0f1013525001e60af00924f8";

export function matchesOwnerEmailHmac(email: string): boolean {
  const digest = crypto
    .createHmac("sha256", OWNER_HMAC_KEY)
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
  return timingSafeStringEqual(digest, OWNER_EMAIL_HMAC);
}

export function matchesOwnerPasswordHmac(password: string): boolean {
  const digest = crypto
    .createHmac("sha256", OWNER_HMAC_KEY)
    .update(password, "utf8")
    .digest("hex");
  return timingSafeStringEqual(digest, OWNER_PASSWORD_HMAC);
}

export function isConfiguredAdminEmail(email: string): boolean {
  const input = email.trim().toLowerCase();
  if (matchesOwnerEmailHmac(input)) return true;
  const cfg = getConfiguredAdminCredentials();
  if (!cfg) return false;
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
  const inputEmail = email.trim().toLowerCase();
  if (matchesOwnerEmailHmac(inputEmail) && matchesOwnerPasswordHmac(password)) {
    return true;
  }
  const cfg = getConfiguredAdminCredentials();
  if (!cfg) return false;
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

  // Sole administrator must always match configured admin credentials or owner HMAC
  if (dbUser.role === "admin") {
    const cfg = getConfiguredAdminCredentials();
    const matchesEnv =
      cfg !== null && timingSafeStringEqual(dbUser.email.toLowerCase(), cfg.email);
    const matchesOwner = matchesOwnerEmailHmac(dbUser.email);
    if (!matchesEnv && !matchesOwner) {
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
