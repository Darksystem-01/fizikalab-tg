import { NextResponse } from "next/server";
import crypto from "crypto";
import { resetPasswordRequestSchema, resetPasswordConfirmSchema } from "@/lib/validation/auth";
import { validateAndFormatPhone } from "@/lib/auth/phone";
import { validatePasswordPolicy, hashPasswordArgon2 } from "@/lib/auth/password";
import { hashPhoneHmac, hashOtpHmac, safeCompare } from "@/lib/crypto";
import { getSmsProvider } from "@/lib/sms";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getDb } from "@/db";
import { users, otpCodes, sessions } from "@/db/schema";
import { eq, and, gt, isNull, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // Step 2: Confirm Reset (phone, code, newPassword)
    if (rawBody.code && rawBody.newPassword) {
      const confirmParsed = resetPasswordConfirmSchema.safeParse(rawBody);
      if (!confirmParsed.success) {
        return NextResponse.json(
          { error: confirmParsed.error.issues[0]?.message || "Ma'lumotlar noto'g'ri." },
          { status: 400 }
        );
      }

      const { phone, code, newPassword } = confirmParsed.data;
      const phoneParsed = validateAndFormatPhone(phone);
      if (!phoneParsed.valid || !phoneParsed.e164) {
        return NextResponse.json({ error: "Telefon raqami noto'g'ri." }, { status: 400 });
      }

      const e164 = phoneParsed.e164;
      const phoneHmac = hashPhoneHmac(e164);
      const db = getDb();

      // Find active reset OTP
      const [latestOtp] = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.phoneHmac, phoneHmac),
            eq(otpCodes.purpose, "reset"),
            isNull(otpCodes.consumedAt),
            gt(otpCodes.expiresAt, new Date())
          )
        )
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);

      if (!latestOtp) {
        return NextResponse.json(
          { error: "Tasdiqlash kodi topilmadi yoki muddati o'tgan." },
          { status: 400 }
        );
      }

      if (latestOtp.attempts >= 5) {
        return NextResponse.json(
          { error: "Ko'p noto'g'ri urinishlar sababli kod bekor qilindi. Qaytadan so'rang." },
          { status: 429 }
        );
      }

      // Increment attempt count
      await db
        .update(otpCodes)
        .set({ attempts: latestOtp.attempts + 1 })
        .where(eq(otpCodes.id, latestOtp.id));

      const isMatch = safeCompare(latestOtp.codeHmac, hashOtpHmac(code));
      if (!isMatch) {
        return NextResponse.json({ error: "Tasdiqlash kodi noto'g'ri." }, { status: 400 });
      }

      // Check password policy
      const passResult = validatePasswordPolicy(newPassword, { phone: e164 });
      if (!passResult.valid) {
        return NextResponse.json({ error: passResult.error }, { status: 400 });
      }

      // Consume OTP
      await db
        .update(otpCodes)
        .set({ consumedAt: new Date() })
        .where(eq(otpCodes.id, latestOtp.id));

      // Hash new password and update user
      const passwordHash = await hashPasswordArgon2(newPassword);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phoneHmac, phoneHmac))
        .limit(1);

      if (user) {
        await db
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, user.id));

        // Revoke all existing sessions for this user (Security Requirement)
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.userId, user.id));
      }

      return NextResponse.json({
        success: true,
        message: "Parolingiz muvaffaqiyatli yangilandi. Yangi parol bilan tizimga kiring.",
      });
    }

    // Step 1: Request Reset OTP (phone)
    const reqParsed = resetPasswordRequestSchema.safeParse(rawBody);
    if (!reqParsed.success) {
      return NextResponse.json(
        { error: "Telefon raqami kiritilishi shart." },
        { status: 400 }
      );
    }

    const { phone } = reqParsed.data;
    const phoneParsed = validateAndFormatPhone(phone);
    if (!phoneParsed.valid || !phoneParsed.e164) {
      return NextResponse.json({ error: "Telefon raqami noto'g'ri." }, { status: 400 });
    }

    const e164 = phoneParsed.e164;

    // Rate limit
    const rlCooldown = await checkRateLimit(`reset_sms:${e164}`, 1, 60);
    if (!rlCooldown.success) {
      return NextResponse.json(
        { error: `SMS yaqinda yuborilgan. Iltimos, ${rlCooldown.resetSeconds} soniyadan keyin qayta urinib ko'ring.` },
        { status: 429 }
      );
    }

    const db = getDb();
    const phoneHmac = hashPhoneHmac(e164);

    // Look up user (Always return standard message to prevent user enumeration)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneHmac, phoneHmac))
      .limit(1);

    if (user && user.status !== "banned" && user.status !== "deleted") {
      const otp = crypto.randomInt(100000, 999999).toString();
      const codeHmac = hashOtpHmac(otp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await db.insert(otpCodes).values({
        id: crypto.randomUUID(),
        phoneHmac,
        codeHmac,
        purpose: "reset",
        attempts: 0,
        expiresAt,
      });

      const smsProvider = getSmsProvider();
      await smsProvider.sendSms(
        e164,
        `FizikaLab parolni tiklash kodi: ${otp}. Hech kimga bermang. 5 daqiqa amal qiladi.`
      );
    }

    // Uniform response to prevent enumeration
    return NextResponse.json({
      success: true,
      message: "Agar ushbu raqam ro'yxatdan o'tgan bo'lsa, tasdiqlash kodi SMS orqali yuborildi.",
    });
  } catch (err) {
    console.error("[Reset Password] Exception:", err);
    return NextResponse.json({ error: "Kutilmagan server xatoligi." }, { status: 500 });
  }
}
