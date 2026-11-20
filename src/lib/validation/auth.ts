import { z } from "zod";

export const registerSchema = z.object({
  nickname: z
    .string()
    .min(3, "Taxallus kamida 3 ta belgidan iborat bo'lishi kerak")
    .max(24, "Taxallus 24 belgidan oshmasligi kerak")
    .regex(/^[a-zA-Z0-9_]+$/, "Taxallus faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo'lishi kerak"),
  phone: z.string().min(9, "Telefon raqamini to'liq kiriting"),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak").max(128),
  university: z.string().optional(),
  faculty: z.string().optional(),
  course: z.number().int().min(1).max(7).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Platformadan foydalanish shartlariga rozilik bildirishingiz kerak",
  }),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(9, "Telefon raqami talab qilinadi"),
  code: z.string().length(6, "Tasdiqlash kodi 6 xonali raqam bo'lishi kerak").regex(/^\d{6}$/),
  purpose: z.enum(["register", "reset", "login2fa"]).default("register"),
});

export const loginSchema = z.object({
  login: z.string().min(3, "Telefon raqami yoki taxallus kiritilishi shart"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

export const resetPasswordRequestSchema = z.object({
  phone: z.string().min(9, "Telefon raqami talab qilinadi"),
});

export const resetPasswordConfirmSchema = z.object({
  phone: z.string().min(9, "Telefon raqami talab qilinadi"),
  code: z.string().length(6).regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128),
});
