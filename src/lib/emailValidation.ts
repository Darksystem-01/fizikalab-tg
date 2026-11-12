/**
 * Enterprise Email Sanitization & Validation Module
 * Defends against:
 * 1. CRLF / Header Injection (\r, \n)
 * 2. SQL Injection / NoSQL Injection payloads in email fields
 * 3. Throwaway / Disposable Temporary Email fraud (mailinator, 10minutemail, tempmail, etc.)
 * 4. Invalid RFC 5322 local-part / domain length abuse
 * 5. Unicode homograph & control character attacks
 */

// Comprehensive blocklist of disposable / throwaway email service domains
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "10minutemail.com",
  "10minutemail.net",
  "10minemail.com",
  "20minutemail.com",
  "burnermail.io",
  "crazymailing.com",
  "disposablemail.com",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "fakemailgenerator.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "generator.email",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "mohmal.com",
  "mohmal.im",
  "mohmal.in",
  "mytemp.email",
  "nada.ltd",
  "nada.email",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "temp-mail.org",
  "temp-mail.ru",
  "tempail.com",
  "tempmail.com",
  "tempmail.net",
  "tempmailaddress.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "zoemail.org",
]);

// Strict RFC 5322 simplified standard email regex
// Ensures valid local-part, single @, valid domain labels, and 2-24 char TLD
const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface EmailValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Sanitizes an incoming email string:
 * - Trims external whitespace
 * - Strips ASCII control characters (0x00-0x1F, 0x7F) including \r, \n, \t
 * - Strips HTML/script injection tokens (<, >, ", ', `)
 * - Converts domain and address to lowercase
 */
export function sanitizeEmail(raw: string): string {
  if (typeof raw !== "string") return "";

  return raw
    .trim()
    // Strip control characters & newlines (prevents header & CRLF injection)
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Strip angle brackets, quotes, backticks
    .replace(/[<>"'`]/g, "")
    .toLowerCase();
}

/**
 * Performs rigorous multi-layer validation on an email address
 */
export function validateAndSanitizeEmail(rawEmail: string): EmailValidationResult {
  const sanitized = sanitizeEmail(rawEmail);

  if (!sanitized) {
    return {
      isValid: false,
      sanitized: "",
      error: "Elektron pochta manzili kiritilishi shart.",
    };
  }

  // RFC 5321 length limits: total max 254 chars
  if (sanitized.length > 254) {
    return {
      isValid: false,
      sanitized,
      error: "Email manzili juda uzun (maksimal 254 belgi).",
    };
  }

  if (sanitized.length < 5) {
    return {
      isValid: false,
      sanitized,
      error: "Email manzili juda qisqa.",
    };
  }

  // Exactly one '@' character
  const parts = sanitized.split("@");
  if (parts.length !== 2) {
    return {
      isValid: false,
      sanitized,
      error: "Email formatida bitta '@' belgisi bo‘lishi kerak.",
    };
  }

  const [localPart, domain] = parts;

  // Local-part checks (RFC 5321: max 64 characters)
  if (!localPart || localPart.length > 64) {
    return {
      isValid: false,
      sanitized,
      error: "Emailning '@' dan oldingi qismi 1 dan 64 belgigacha bo‘lishi shart.",
    };
  }

  // Prevent consecutive dots or leading/trailing dots in local-part
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return {
      isValid: false,
      sanitized,
      error: "Email manzilida ketma-ket yoki chetdagi nuqtalar ruxsat etilmaydi.",
    };
  }

  // Domain checks
  if (!domain || domain.length > 253) {
    return {
      isValid: false,
      sanitized,
      error: "Email domen nomi noto‘g‘ri yoki juda uzun.",
    };
  }

  // Domain must contain at least one dot separating name and TLD
  if (!domain.includes(".")) {
    return {
      isValid: false,
      sanitized,
      error: "Email domenida haqiqiy yuqori darajali zona (masalan .uz, .com) bo‘lishi shart.",
    };
  }

  // TLD validation: minimum 2 chars, letters only
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return {
      isValid: false,
      sanitized,
      error: "Email domeni yuqori darajali zonasi (.uz, .com va h.k.) noto‘g‘ri.",
    };
  }

  // Standard regex syntax validation
  if (!STRICT_EMAIL_REGEX.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: "Email formati noto‘g‘ri. Haqiqiy email kiriting (masalan: talaba@tatu.uz).",
    };
  }

  // Block temporary / disposable throwaway fake email providers
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      sanitized,
      error:
        "Vaqtinchalik (bir martalik) soxta pochta xizmatlaridan foydalanish taqiqlangan. Iltimos, haqiqiy shaxsiy yoki universitet emailingizni kiriting.",
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}
