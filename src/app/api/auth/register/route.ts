import { NextResponse } from "next/server";
import crypto from "crypto";
import { registerSchema } from "@/lib/validation/auth";
import { validateAndFormatPhone } from "@/lib/auth/phone";
import { validatePasswordPolicy, hashPasswordArgon2 } from "@/lib/auth/password";
import { hashPhoneHmac, hashOtpHmac, encryptPii } from "@/lib/crypto";
import { getSmsProvider } from "@/lib/sms";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getDb } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Retain legacy helpers for legacy test compatibility
import {
  hashPassword,
  isConfiguredAdminEmail,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth";
import { getDb as getLegacyDb, writeAuditLog, type DbUser } from "@/lib/db";
import { checkRateLimit as checkLegacyRateLimit, getClientIp } from "@/lib/rateLimit";
import { findUniversity, isValidFacultyForUniversity } from "@/lib/universities";
import { validateAndSanitizeEmail } from "@/lib/emailValidation";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // Check if this is a legacy email registration request (for backward compatibility with existing tests)
    if (rawBody.email && !rawBody.phone) {
      const ip = getClientIp(req);
      const rl = checkLegacyRateLimit(`register:${ip}`, 15, 10 * 60 * 1000);
      if (!rl.allowed) {
        return NextResponse.json(
          {
            error: `Ro‘yxatdan o‘tish so‘rovlari limiti tugadi. ${rl.retryAfterSec} soniyadan keyin urinib ko‘ring.`,
          },
          { status: 429 }
        );
      }

      const fullName = (rawBody.fullName || "").trim();
      const emailResult = validateAndSanitizeEmail(rawBody.email || "");
      if (!emailResult.isValid) {
        return NextResponse.json(
          { error: emailResult.error || "Elektron pochta manzili noto‘g‘ri." },
          { status: 400 }
        );
      }
      const email = emailResult.sanitized;
      const password = rawBody.password || "";
      const university = (rawBody.university || "").trim();
      const faculty = (rawBody.faculty || "").trim();
      const studentGroup = (rawBody.studentGroup || "").trim();

      if (
        fullName.length < 3 ||
        password.length < 6 ||
        university.length < 2 ||
        faculty.length < 2 ||
        studentGroup.length < 2
      ) {
        return NextResponse.json(
          {
            error:
              "F.I.Sh., Universitet, Fakultet, Guruh, to‘g‘ri email va kamida 6 belgili parol to‘liq kiritilishi shart.",
          },
          { status: 400 }
        );
      }

      const matchedUni = findUniversity(university);
      if (!matchedUni) {
        return NextResponse.json(
          {
            error:
              "Iltimos, ro‘yxatdan O‘zbekistondagi haqiqiy universitet (OTM)ni tanlang. Noto‘g‘ri yoki soxta universitet qabul qilinmaydi.",
          },
          { status: 400 }
        );
      }

      if (!isValidFacultyForUniversity(matchedUni.name, faculty)) {
        return NextResponse.json(
          {
            error: `"${matchedUni.shortName}" uchun tasdiqlangan haqiqiy fakultetni tanlang.`,
          },
          { status: 400 }
        );
      }

      if (isConfiguredAdminEmail(email)) {
        return NextResponse.json(
          { error: "Bu email allaqachon ro‘yxatdan o‘tgan." },
          { status: 409 }
        );
      }

      const legacyDb = await getLegacyDb();
      const existing = await legacyDb.queryOne<DbUser>(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = $1",
        [email]
      );
      if (existing) {
        return NextResponse.json(
          { error: "Bu email allaqachon ro‘yxatdan o‘tgan." },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const inserted = await legacyDb.execute(
        `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, created_at)
         VALUES ($1, $2, $3, 'student', $4, $5, $6, 1, 0, $7) RETURNING id`,
        [fullName, email, hashPassword(password), studentGroup, matchedUni.name, faculty, now]
      );

      const newId = inserted.lastInsertId!;
      await writeAuditLog(
        newId,
        "REGISTER",
        `Yangi talaba: ${email} (${matchedUni.name} / ${faculty} / ${studentGroup})`
      );

      const token = await signSessionToken(
        {
          userId: newId,
          email,
          fullName,
          role: "student",
          studentGroup,
          university: matchedUni.name,
          faculty,
        },
        req
      );

      const res = NextResponse.json(
        {
          user: {
            id: newId,
            fullName,
            email,
            role: "student",
            studentGroup,
            university: matchedUni.name,
            faculty,
          },
        },
        { status: 201 }
      );
      res.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
      return res;
    }

    // Modern FizikaLab Reels Phone + SMS OTP Registration
    const parseResult = registerSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Kiritilgan ma'lumotlar noto'g'ri.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { nickname, phone, password, university, faculty, course } = parseResult.data;

    // Validate and normalize phone
    const phoneResult = validateAndFormatPhone(phone);
    if (!phoneResult.valid || !phoneResult.e164) {
      return NextResponse.json({ error: phoneResult.error || "Telefon raqami noto'g'ri." }, { status: 400 });
    }
    const e164 = phoneResult.e164;

    // Validate password policy
    const passResult = validatePasswordPolicy(password, { nickname, phone: e164 });
    if (!passResult.valid) {
      return NextResponse.json({ error: passResult.error }, { status: 400 });
    }

    // Rate limit SMS per phone (max 1 per 60s, max 5 per hour)
    const phoneCooldownKey = `sms_cooldown:${e164}`;
    const rlCooldown = await checkRateLimit(phoneCooldownKey, 1, 60);
    if (!rlCooldown.success) {
      return NextResponse.json(
        { error: `SMS yaqinda yuborilgan. Iltimos, ${rlCooldown.resetSeconds} soniyadan keyin qayta urinib ko'ring.` },
        { status: 429 }
      );
    }

    const phoneHourlyKey = `sms_hourly:${e164}`;
    const rlHourly = await checkRateLimit(phoneHourlyKey, 5, 3600);
    if (!rlHourly.success) {
      return NextResponse.json(
        { error: "Bir soatlik SMS limiti tugadi. Iltimos, keyinroq urinib ko'ring." },
        { status: 429 }
      );
    }

    const db = getDb();
    const phoneHmac = hashPhoneHmac(e164);

    // Check if phone already registered and active
    try {
      const [existingPhone] = await db
        .select()
        .from(users)
        .where(eq(users.phoneHmac, phoneHmac))
        .limit(1);

      if (existingPhone && existingPhone.status === "active") {
        return NextResponse.json(
          { error: "Ushbu telefon raqami bilan akkaunt allaqachon mavjud. Iltimos, tizimga kiring." },
          { status: 409 }
        );
      }

      // Check if nickname already taken
      const [existingNick] = await db
        .select()
        .from(users)
        .where(sql`lower(${users.nickname}) = lower(${nickname})`)
        .limit(1);

      if (existingNick && existingNick.id !== existingPhone?.id) {
        return NextResponse.json(
          { error: "Ushbu taxallus (nickname) allaqachon band. Boshqa taxallus tanlang." },
          { status: 409 }
        );
      }

      // Generate 6-digit cryptographically secure OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const codeHmac = hashOtpHmac(otp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP
      await db.insert(otpCodes).values({
        id: crypto.randomUUID(),
        phoneHmac,
        codeHmac,
        purpose: "register",
        attempts: 0,
        expiresAt,
      });

      // Prepare user record
      const passwordHash = await hashPasswordArgon2(password);
      const phoneEncrypted = encryptPii(e164);

      if (existingPhone) {
        // Update pending user
        await db
          .update(users)
          .set({
            nickname,
            passwordHash,
            phoneEncrypted,
            university: university || null,
            faculty: faculty || null,
            course: course || null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingPhone.id));
      } else {
        // Create new pending user
        await db.insert(users).values({
          id: crypto.randomUUID(),
          nickname,
          phoneHmac,
          phoneEncrypted,
          passwordHash,
          role: "student",
          status: "pending",
          university: university || null,
          faculty: faculty || null,
          course: course || null,
        });
      }

      // Send SMS via provider
      const smsProvider = getSmsProvider();
      const smsMessage = `FizikaLab tasdiqlash kodi: ${otp}. Hech kimga bermang. 5 daqiqa amal qiladi.`;
      await smsProvider.sendSms(e164, smsMessage);

      return NextResponse.json({
        success: true,
        message: "Tasdiqlash kodi telefon raqamingizga SMS orqali yuborildi.",
        phone: e164,
      });
    } catch (dbError) {
      console.error("[Auth Register] DB Error:", dbError);
      return NextResponse.json({ error: "Tizimda ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
    }
  } catch (err) {
    console.error("[Auth Register] Exception:", err);
    return NextResponse.json({ error: "Kutilmagan server xatoligi." }, { status: 500 });
  }
}
