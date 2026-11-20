import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface PhoneValidationResult {
  valid: boolean;
  e164?: string;
  error?: string;
}

/**
 * Validates and normalizes Uzbekistan phone numbers to E.164 format (+998XXXXXXXXX).
 */
export function validateAndFormatPhone(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, error: "Telefon raqami kiritilishi shart." };
  }

  const clean = rawPhone.trim().replace(/\s+/g, "");

  // Ensure default country UZ if not prefixed
  const parsed = parsePhoneNumberFromString(clean, "UZ");

  if (!parsed || !parsed.isValid()) {
    return {
      valid: false,
      error: "Telefon raqami noto'g'ri. Iltimos, haqiqiy O'zbekiston raqamini kiriting (masalan: +998 90 123 45 67).",
    };
  }

  if (parsed.country !== "UZ") {
    return {
      valid: false,
      error: "Hozirda faqat O'zbekiston telefon raqamlari (+998) orqali ro'yxatdan o'tish mumkin.",
    };
  }

  const e164 = parsed.format("E.164"); // e.g. +998901234567

  return {
    valid: true,
    e164,
  };
}
