import { parsePhoneNumberFromString } from "libphonenumber-js";

export type UzbekMobileOperator =
  | "Uztelecom"
  | "Mobiuz"
  | "Beeline"
  | "Ucell"
  | "Humans"
  | "Oq Mobile"
  | "O'zbekiston Ruxsat Etilgan Tarmoq";

export interface PhoneValidationResult {
  valid: boolean;
  e164?: string;
  cleanDigits?: string;
  operator?: UzbekMobileOperator;
  operatorColor?: string;
  error?: string;
}

/**
 * Detects the specific Uzbekistan mobile network operator from the 2-digit prefix.
 */
export function getUzbekistanOperator(nationalNumber: string): {
  operator: UzbekMobileOperator;
  color: string;
} {
  // nationalNumber starts after +998 (e.g. "770963610" or "901234567")
  const prefix2 = nationalNumber.slice(0, 2);

  switch (prefix2) {
    case "90":
    case "91":
      return { operator: "Beeline", color: "#FBBF24" }; // Amber/Yellow
    case "93":
    case "94":
    case "50":
      return { operator: "Ucell", color: "#8B5CF6" }; // Purple
    case "97":
    case "88":
      return { operator: "Mobiuz", color: "#EF4444" }; // Red
    case "99":
    case "95":
    case "77":
      return { operator: "Uztelecom", color: "#06B6D4" }; // Cyan/Blue
    case "33":
      return { operator: "Humans", color: "#F97316" }; // Orange
    case "20":
      return { operator: "Oq Mobile", color: "#10B981" }; // Emerald
    default:
      return { operator: "O'zbekiston Ruxsat Etilgan Tarmoq", color: "#64748B" }; // Slate
  }
}

/**
 * Validates and normalizes Uzbekistan phone numbers across all mobile providers
 * (Uztelecom, Mobiuz, Beeline, Ucell, Humans, Oq Mobile).
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
      error: "Telefon raqami noto'g'ri. Iltimos, haqiqiy O'zbekiston raqamini kiriting (masalan: +998 77 096 36 10 yoki +998 90 123 45 67).",
    };
  }

  if (parsed.country !== "UZ") {
    return {
      valid: false,
      error: "Hozirda faqat O'zbekiston telefon tarmoqlari (+998) orqali ro'yxatdan o'tish mumkin.",
    };
  }

  const e164 = parsed.format("E.164"); // e.g. +998770963610
  const national = parsed.nationalNumber; // e.g. 770963610
  const opInfo = getUzbekistanOperator(national);

  return {
    valid: true,
    e164,
    cleanDigits: e164.replace(/\D/g, ""), // e.g. 998770963610
    operator: opInfo.operator,
    operatorColor: opInfo.color,
  };
}
