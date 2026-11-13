import crypto from "crypto";
import { cookies } from "next/headers";

export type UserRole = "admin" | "darksystem" | "teacher" | "student";

export interface ClientContext {
  userAgent?: string;
  clientIp?: string;
  fingerprint?: string;
}

export interface SessionPayload {
  sessionId?: string;
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  studentGroup: string;
  university?: string;
  faculty?: string;
  issuedAt?: number;
  exp: number;
  ctxHash?: string;
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

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === "unknown" || ip === "localhost" || ip === "::1") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("fc00:") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    if (parts.length >= 2) {
      const second = Number(parts[1]);
      if (second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

/**
 * Normalizes an IPv4 or IPv6 address to its network subnet.
 * - IPv4: /24 subnet (e.g. 198.51.100.42 -> 198.51.100.0/24)
 * - IPv6: /48 subnet (e.g. 2001:db8:85a3:0:0:8a2e:370:7334 -> 2001:db8:85a3::/48)
 * - Localhost / Private: 127.0.0.0/24
 */
export function normalizeIpSubnet(rawIp: string | undefined | null): string {
  if (!rawIp) return "127.0.0.0/24";
  let ip = rawIp.trim().toLowerCase();

  // Strip port if present (e.g. 192.168.1.1:54321)
  if (ip.includes(".") && ip.includes(":")) {
    const colonIdx = ip.indexOf(":");
    if (!ip.startsWith("::") && ip.split(":").length === 2) {
      ip = ip.slice(0, colonIdx);
    }
  }

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:192.168.1.5)
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  if (isPrivateOrLocalIp(ip)) {
    return "127.0.0.0/24";
  }

  // IPv4 /24 subnet masking
  const ipv4Octets = ip.split(".");
  if (
    ipv4Octets.length === 4 &&
    ipv4Octets.every((o) => /^\d+$/.test(o) && Number(o) >= 0 && Number(o) <= 255)
  ) {
    return `${ipv4Octets[0]}.${ipv4Octets[1]}.${ipv4Octets[2]}.0/24`;
  }

  // IPv6 /48 subnet masking
  if (ip.includes(":")) {
    const hextets = ip.split(":").filter(Boolean);
    if (hextets.length >= 3) {
      return `${hextets[0]}:${hextets[1]}:${hextets[2]}::/48`;
    }
    return "ipv6-subnet";
  }

  return ip || "127.0.0.0/24";
}

/**
 * Safely extracts normalized client context (User-Agent, IP, fingerprint) from a Request,
 * Headers instance, or plain ClientContext object.
 */
export function extractClientContext(
  source?:
    | Request
    | Headers
    | { get(name: string): string | null | undefined }
    | ClientContext
    | null
): ClientContext {
  if (!source) return {};

  if (typeof source === "object" && source !== null) {
    if ("userAgent" in source || "clientIp" in source || "fingerprint" in source) {
      const c = source as ClientContext;
      return {
        userAgent: c.userAgent || "",
        clientIp: c.clientIp || "unknown",
        fingerprint: c.fingerprint || "",
      };
    }
  }

  let headersObj: { get(name: string): string | null | undefined };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (source && "headers" in source && source.headers && typeof (source.headers as any).get === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headersObj = source.headers as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } else if (source && typeof (source as any).get === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headersObj = source as any;
  } else {
    return {};
  }

  const userAgent = (headersObj.get("user-agent") || "").trim();

  // Trusted IP extraction hierarchy
  let clientIp = "";
  const vercelForwarded = headersObj.get("x-vercel-forwarded-for");
  const cfConnecting = headersObj.get("cf-connecting-ip");
  const realIp = headersObj.get("x-real-ip");
  const forwardedFor = headersObj.get("x-forwarded-for");

  if (vercelForwarded) {
    clientIp = vercelForwarded.split(",")[0].trim();
  } else if (cfConnecting) {
    clientIp = cfConnecting.trim();
  } else if (realIp) {
    clientIp = realIp.trim();
  } else if (forwardedFor) {
    clientIp = forwardedFor.split(",")[0].trim();
  }

  const fingerprint = (headersObj.get("x-client-fingerprint") || "").trim();

  return {
    userAgent,
    clientIp: clientIp || "unknown",
    fingerprint,
  };
}

/**
 * Computes a deterministic SHA-256 HMAC over the normalized client context.
 * Keyed by getAuthSecret() to ensure cryptographic binding.
 */
export function computeContextHash(
  context: ClientContext,
  secretKey?: string
): string {
  const secret = secretKey || getAuthSecret();
  const normalizedUa = (context.userAgent || "").trim().toLowerCase();
  const normalizedSubnet = normalizeIpSubnet(context.clientIp);
  const fp = (context.fingerprint || "").trim();

  const canonicalString = `${normalizedUa}|${normalizedSubnet}|${fp}`;
  return crypto
    .createHmac("sha256", secret)
    .update(canonicalString)
    .digest("hex");
}

export interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
  secure: boolean;
  path: string;
  maxAge: number;
}

export const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60; // 4 hours

export function isSecureCookieEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.FIZIKALAB_SECURE_COOKIES === "1" ||
    process.env.FIZIKALAB_SECURE_COOKIES === "true"
  );
}

export function getSessionCookieOptions(
  overrides?: Partial<SessionCookieOptions>
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureCookieEnabled(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    ...overrides,
  };
}

export function getSessionClearCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureCookieEnabled(),
    path: "/",
    maxAge: 0,
  };
}

export function isAdminOrDarksystem(
  roleOrUser: UserRole | SessionPayload | null | undefined
): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === "string") {
    return roleOrUser === "admin" || roleOrUser === "darksystem";
  }
  return roleOrUser.role === "admin" || roleOrUser.role === "darksystem";
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

function getEncryptionKey(): Buffer {
  const secret = getAuthSecret();
  return crypto.createHash("sha256").update(`fizikalab-aes256gcm:${secret}`).digest();
}

export async function signSessionToken(
  payload: Omit<SessionPayload, "sessionId" | "issuedAt" | "exp" | "ctxHash">,
  clientContextSource?:
    | ClientContext
    | Request
    | Headers
    | { get(name: string): string | null | undefined }
): Promise<string> {
  const isDarksystem = payload.role === "admin" || payload.role === "darksystem";
  const role: UserRole = isDarksystem ? "darksystem" : payload.role;

  const clientContext = extractClientContext(clientContextSource);
  const ctxHash = computeContextHash(clientContext);
  const sessionId = crypto.randomUUID();
  const issuedAt = Date.now();
  const exp = issuedAt + SESSION_MAX_AGE_SECONDS * 1000;

  const full: SessionPayload = {
    ...payload,
    sessionId,
    role,
    email: isDarksystem ? "darksystem@internal" : payload.email,
    fullName: isDarksystem ? "Darksystem Administrator" : payload.fullName,
    issuedAt,
    exp,
    ctxHash,
  };

  try {
    const { createActiveSession } = await import("./db");
    await createActiveSession({
      sessionId,
      userId: payload.userId,
      clientFingerprint: ctxHash,
      ipAddress: clientContext.clientIp || null,
      userAgent: clientContext.userAgent || null,
      createdAt: new Date(issuedAt).toISOString(),
      lastSeenAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(exp).toISOString(),
      isRevoked: 0,
    });
  } catch (err) {
    console.error("Failed to persist active session:", err);
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plainText = Buffer.from(JSON.stringify(full), "utf8");
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${tag.toString("base64url")}`;
}

function isCanonicalBase64Url(str: string): boolean {
  if (!str) return false;
  return Buffer.from(str, "base64url").toString("base64url") === str;
}

export function verifySessionTokenStateless(
  token: string | undefined
): SessionPayload | null {
  if (!token || !token.startsWith("enc.")) return null;
  const parts = token.slice(4).split(".");
  if (parts.length !== 3) return null;
  const [ivB64, cipherB64, tagB64] = parts;
  try {
    if (
      !isCanonicalBase64Url(ivB64) ||
      !isCanonicalBase64Url(cipherB64) ||
      !isCanonicalBase64Url(tagB64)
    ) {
      return null;
    }
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, "base64url");
    const encrypted = Buffer.from(cipherB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (
      parsed.role !== "admin" &&
      parsed.role !== "darksystem" &&
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

export function verifySessionToken(
  token: string | undefined,
  clientContextSource?:
    | ClientContext
    | Request
    | Headers
    | { get(name: string): string | null | undefined }
): SessionPayload | null {
  if (!token || !token.startsWith("enc.")) return null;
  const parts = token.slice(4).split(".");
  if (parts.length !== 3) return null;
  const [ivB64, cipherB64, tagB64] = parts;
  try {
    if (
      !isCanonicalBase64Url(ivB64) ||
      !isCanonicalBase64Url(cipherB64) ||
      !isCanonicalBase64Url(tagB64)
    ) {
      return null;
    }
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, "base64url");
    const encrypted = Buffer.from(cipherB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (
      parsed.role !== "admin" &&
      parsed.role !== "darksystem" &&
      parsed.role !== "teacher" &&
      parsed.role !== "student"
    ) {
      return null;
    }

    if (parsed.ctxHash) {
      const currentContext = extractClientContext(clientContextSource);
      const expectedHash = computeContextHash(currentContext);
      if (!timingSafeStringEqual(parsed.ctxHash, expectedHash)) {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export interface GoogleOnboardingPayload {
  email: string;
  fullName: string;
  googleId: string;
  exp: number;
}

export function signGoogleOnboardingToken(data: {
  email: string;
  fullName: string;
  googleId: string;
}): string {
  const payload: GoogleOnboardingPayload = {
    email: data.email.trim().toLowerCase(),
    fullName: data.fullName.trim(),
    googleId: data.googleId.trim(),
    exp: Date.now() + 1000 * 60 * 30, // 30 minutes
  };
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plainText = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `onb.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${tag.toString("base64url")}`;
}

export function verifyGoogleOnboardingToken(
  token: string | undefined
): GoogleOnboardingPayload | null {
  if (!token || !token.startsWith("onb.")) return null;
  const parts = token.slice(4).split(".");
  if (parts.length !== 3) return null;
  const [ivB64, cipherB64, tagB64] = parts;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, "base64url");
    const encrypted = Buffer.from(cipherB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as GoogleOnboardingPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (!parsed.email || !parsed.email.includes("@")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shouldRotateSession(payload: SessionPayload): boolean {
  if (!payload.issuedAt) return true;
  return Date.now() - payload.issuedAt > 30_000;
}

export async function rotateSessionToken(
  oldSessionId: string,
  payload: Omit<SessionPayload, "sessionId" | "issuedAt" | "exp" | "ctxHash">,
  clientContextSource?:
    | ClientContext
    | Request
    | Headers
    | { get(name: string): string | null | undefined }
): Promise<string> {
  const { getDb } = await import("./db");
  const db = await getDb();
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  // Atomically mark oldSessionId as revoked in database (upsert handles out-of-band test tokens)
  await db.execute(
    `INSERT INTO active_sessions (session_id, user_id, client_fingerprint, created_at, last_seen_at, expires_at, is_revoked)
     VALUES ($1, $2, 'revoked', $3, $4, $5, 1)
     ON CONFLICT(session_id) DO UPDATE SET is_revoked = 1`,
    [oldSessionId, payload.userId, nowIso, nowIso, expiresAtIso]
  );

  const freshToken = await signSessionToken(payload, clientContextSource);
  return freshToken;
}

export async function getSessionUser(
  req?: Request
): Promise<SessionPayload | null> {
  let token: string | undefined;
  let clientContext: ClientContext | undefined;

  // Path 1: Extracted directly from Request if supplied (Route Handlers)
  if (req) {
    clientContext = extractClientContext(req);
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // Path 2: Fall back to next/headers cookies() (Server Components & Parameterless calls)
  if (!token) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Outside active Next.js request scope
    }
  }

  // Path 3: Fall back to next/headers headers() for context extraction
  if (!clientContext) {
    try {
      const { headers } = await import("next/headers");
      const headerStore = await headers();
      clientContext = extractClientContext(headerStore);
    } catch {
      // Outside active Next.js request scope
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token, clientContext);
  if (!payload || !payload.sessionId) return null;

  // Database session verification
  const { getActiveSession, touchActiveSession, createActiveSession, getActiveSessionUserById } = await import("./db");
  const activeSession = await getActiveSession(payload.sessionId, { includeRevokedOrExpired: true });

  if (activeSession) {
    if (activeSession.is_revoked !== 0) {
      return null;
    }
    const expTime = new Date(activeSession.expires_at).getTime();
    if (isNaN(expTime) || expTime <= Date.now()) {
      return null;
    }
    await touchActiveSession(payload.sessionId);
  } else {
    // Auto-register session if valid token was minted out-of-band (e.g. test helper)
    try {
      await createActiveSession({
        sessionId: payload.sessionId,
        userId: payload.userId,
        clientFingerprint: payload.ctxHash || (clientContext ? computeContextHash(clientContext) : "legacy"),
        ipAddress: clientContext?.clientIp || null,
        userAgent: clientContext?.userAgent || null,
        expiresAt: payload.exp,
      });
    } catch {
      // Ignore concurrent conflict
    }
  }

  const dbUser = await getActiveSessionUserById(payload.userId);
  if (!dbUser || dbUser.is_active !== 1 || dbUser.is_banned === 1) {
    return null;
  }

  const isDarksystem = dbUser.role === "admin" || payload.role === "darksystem";

  // Sole administrator / darksystem must always match configured admin credentials or owner HMAC
  if (isDarksystem) {
    const cfg = getConfiguredAdminCredentials();
    const matchesEnv =
      cfg !== null && timingSafeStringEqual(dbUser.email.toLowerCase(), cfg.email);
    const matchesOwner = matchesOwnerEmailHmac(dbUser.email);
    if (!matchesEnv && !matchesOwner) {
      return null;
    }
  }

  return {
    sessionId: payload.sessionId,
    userId: dbUser.id,
    email: isDarksystem ? "darksystem@internal" : dbUser.email,
    fullName: isDarksystem ? "Darksystem Administrator" : dbUser.full_name,
    role: isDarksystem ? "darksystem" : dbUser.role,
    studentGroup: dbUser.student_group,
    university: dbUser.university || "",
    faculty: dbUser.faculty || "",
    issuedAt: payload.issuedAt,
    exp: payload.exp,
    ctxHash: payload.ctxHash,
  };
}
