import { hash, verify } from "@node-rs/argon2";

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "qwerty123",
  "parol123",
  "admin123",
  "fizika123",
  "student123",
  "welcome123",
  "secret123",
  "toshkent123",
  "samarqand123",
  "fargona123",
]);

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePasswordPolicy(
  password: string,
  context?: { nickname?: string; phone?: string }
): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Parol kiritilishi shart." };
  }

  if (password.length < 8) {
    return { valid: false, error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." };
  }

  if (password.length > 128) {
    return { valid: false, error: "Parol uzunligi 128 belgidan oshmasligi kerak." };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      error: "Parol kamida 1 ta katta harf, 1 ta kichik harf, 1 ta raqam va 1 ta maxsus belgini o'z ichiga olishi shart.",
    };
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return { valid: false, error: "Bu parol juda keng tarqalgan va xavfli. Iltimos, mustahkamroq parol tanlang." };
  }

  if (context?.nickname && context.nickname.length >= 3) {
    if (lower.includes(context.nickname.toLowerCase())) {
      return { valid: false, error: "Parol foydalanuvchi taxallusi (nickname)ni o'z ichiga olmasligi kerak." };
    }
  }

  if (context?.phone) {
    const rawDigits = context.phone.replace(/\D/g, "");
    if (rawDigits.length >= 7 && lower.includes(rawDigits.slice(-7))) {
      return { valid: false, error: "Parol telefon raqamingizni o'z ichiga olmasligi kerak." };
    }
  }

  return { valid: true };
}

/**
 * Hashes password using argon2id with OWASP-recommended parameters.
 */
export async function hashPasswordArgon2(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verifies password against argon2id hash.
 */
export async function verifyPasswordArgon2(
  password: string,
  hashString: string
): Promise<boolean> {
  try {
    return await verify(hashString, password);
  } catch (err) {
    console.error("[Argon2] Verification error:", err);
    return false;
  }
}

/**
 * Dummy argon2 verification to equalize timing differences when a requested user does not exist.
 */
export async function dummyArgon2Verify(): Promise<void> {
  const dummyHash =
    "$argon2id$v=19$m=19456,t=2,p=1$eW91cnNhbHRzZWN1cmUxMg$e0D9M0tE6BfqoK50f+q8BsmE3+J8r7nZ92vXpQ2v1m8";
  await verifyPasswordArgon2("dummy-password-timing-defense", dummyHash);
}
