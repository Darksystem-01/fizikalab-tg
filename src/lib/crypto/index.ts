import crypto from "crypto";

const DEFAULT_HMAC_SECRET = process.env.PHONE_HMAC_SECRET || process.env.SESSION_SECRET || "fizikalab-fallback-dev-hmac-salt-secure-998";
const DEFAULT_OTP_SECRET = process.env.OTP_HMAC_SECRET || process.env.SESSION_SECRET || "fizikalab-fallback-dev-otp-salt-secure-998";
const DEFAULT_ENC_KEY = process.env.PHONE_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

/**
 * Computes deterministic HMAC-SHA256 blind index for phone numbers.
 * Allows uniqueness checks and lookups without storing plaintext phone numbers.
 */
export function hashPhoneHmac(phone: string): string {
  const normalized = phone.trim().replace(/\s+/g, "");
  return crypto.createHmac("sha256", DEFAULT_HMAC_SECRET).update(normalized).digest("hex");
}

/**
 * Computes HMAC-SHA256 for OTP codes.
 */
export function hashOtpHmac(code: string): string {
  return crypto.createHmac("sha256", DEFAULT_OTP_SECRET).update(code.trim()).digest("hex");
}

/**
 * Encrypts sensitive PII (e.g. phone number) using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptPii(plainText: string): string {
  const key = Buffer.from(DEFAULT_ENC_KEY.slice(0, 64), "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted PII.
 */
export function decryptPii(encryptedPayload: string): string {
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted payload format");
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const key = Buffer.from(DEFAULT_ENC_KEY.slice(0, 64), "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[Crypto] Decryption failure:", err);
    return "";
  }
}

/**
 * Timing-safe string equality comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Masks phone number for student display (e.g. +998 90 123 45 67 -> +998 ** *** ** 67).
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length < 9) return "+998 ** *** ** **";
  const last2 = clean.slice(-2);
  return `+998 ** *** ** ${last2}`;
}
