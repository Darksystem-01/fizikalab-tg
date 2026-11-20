import { NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { validateAndFormatPhone } from "@/lib/auth/phone";
import { hashPhoneHmac, hashOtpHmac, safeCompare } from "@/lib/crypto";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, and, gt, isNull, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = verifyOtpSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Tasdiqlash kodi noto'g'ri.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { phone, code, purpose } = parseResult.data;
    const phoneResult = validateAndFormatPhone(phone);
    if (!phoneResult.valid || !phoneResult.e164) {
      return NextResponse.json({ error: "Telefon raqami noto'g'ri." }, { status: 400 });
    }
    const e164 = phoneResult.e164;
    const phoneHmac = hashPhoneHmac(e164);

    const db = getDb();

    // Find the latest pending OTP for this phone and purpose
    const [latestOtp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneHmac, phoneHmac),
          eq(otpCodes.purpose, purpose),
          isNull(otpCodes.consumedAt),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!latestOtp) {
      return NextResponse.json(
        { error: "Tasdiqlash kodi topilmadi yoki uning amal qilish muddati tugagan." },
        { status: 400 }
      );
    }

    if (latestOtp.attempts >= 5) {
      return NextResponse.json(
        { error: "Ko'p noto'g'ri urinishlar tufayli kod bekor qilindi. Yangi kod so'rang." },
        { status: 429 }
      );
    }

    // Increment attempts
    await db
      .update(otpCodes)
      .set({ attempts: latestOtp.attempts + 1 })
      .where(eq(otpCodes.id, latestOtp.id));

    // Timing-safe HMAC verification
    const inputCodeHmac = hashOtpHmac(code);
    const isMatch = safeCompare(latestOtp.codeHmac, inputCodeHmac);

    if (!isMatch) {
      const remaining = 4 - latestOtp.attempts;
      return NextResponse.json(
        {
          error: `Kiritilgan tasdiqlash kodi noto'g'ri. ${remaining > 0 ? `Qolgan urinishlar: ${remaining}` : "Kodni qaytadan so'rang."}`,
        },
        { status: 400 }
      );
    }

    // Mark OTP as consumed
    await db
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(eq(otpCodes.id, latestOtp.id));

    // If purpose is register: activate user and create session
    if (purpose === "register") {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phoneHmac, phoneHmac))
        .limit(1);

      if (!user) {
        return NextResponse.json({ error: "Foydalanuvchi hisobi topilmadi." }, { status: 404 });
      }

      await db
        .update(users)
        .set({
          status: "active",
          phoneVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const userAgent = req.headers.get("user-agent") || undefined;
      const ip = req.headers.get("x-forwarded-for") || undefined;
      await createSession(user.id, userAgent, ip);

      return NextResponse.json({
        success: true,
        message: "Akkauntingiz muvaffaqiyatli faollashtirildi!",
        user: {
          id: user.id,
          nickname: user.nickname,
          role: user.role,
        },
      });
    }

    // If reset password
    return NextResponse.json({
      success: true,
      message: "Kod tasdiqlandi. Endi yangi parolni o'rnatishingiz mumkin.",
      verified: true,
    });
  } catch (err) {
    console.error("[Verify OTP] Exception:", err);
    return NextResponse.json({ error: "Serverda xatolik yuz berdi." }, { status: 500 });
  }
}
