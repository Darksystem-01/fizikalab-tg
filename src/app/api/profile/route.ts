import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, writeAuditLog, type DbUser } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const db = await getDb();
  const dbUser = await db.queryOne<DbUser>(
    "SELECT * FROM users WHERE id = $1",
    [Number(sessionUser.userId)]
  );

  // Default HEMIS academic attributes if not explicitly populated
  const profile = {
    id: dbUser?.id ?? sessionUser.userId,
    fullName: dbUser?.full_name || sessionUser.fullName || "To'lqinov Mahmudjon Umid o'g'li",
    email: dbUser?.email || sessionUser.email,
    role: dbUser?.role || sessionUser.role,
    studentGroup: dbUser?.student_group || sessionUser.studentGroup || "310-24 DIF",
    university:
      dbUser?.university ||
      sessionUser.university ||
      "Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti (TATU)",
    faculty: dbUser?.faculty || sessionUser.faculty || "Dasturiy injiniring",
    specialty: "60610500 - Dasturiy injiniring (sohalar bo'yicha)",
    phone: dbUser?.phone || "+998 90 123 45 67",
    birthDate: dbUser?.birth_date || "10-05-2009",
    gender: dbUser?.gender || "erkak",
    address:
      dbUser?.address ||
      "Toshkent shahri, Yunusobod tumani, Bog'ishamol ko'chasi, 12-uy",
    degree: dbUser?.degree || "Bakalavr",
    educationType: dbUser?.education_type || "Kunduzgi",
    educationPayment: dbUser?.education_payment || "Davlat granti",
    courseYear: dbUser?.course_year || "1-kurs",
    tutorName: dbUser?.tutor_name || "Alimuradov Lochinbek",
    scholarshipStatus: dbUser?.scholarship_status || "Bor",
    avatarUrl: dbUser?.avatar_url || "",
    studentIdCode: dbUser?.student_id_code || "310242100806",
    bio:
      dbUser?.bio ||
      "TATU Dasturiy injiniring yo'nalishi 1-kurs talabasi. Fizika va modellashtirishga qiziquvchi.",
    telegramChatId: dbUser?.telegram_chat_id || "",
    telegramUsername: dbUser?.telegram_username || "",
    academicYear: "2026-2027",
    semester: "2-semestr",
  };

  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const body = (await req.json()) as {
    fullName?: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    degree?: string;
    educationType?: string;
    educationPayment?: string;
    courseYear?: string;
    tutorName?: string;
    scholarshipStatus?: string;
    avatarUrl?: string;
    studentIdCode?: string;
    bio?: string;
    studentGroup?: string;
    university?: string;
    faculty?: string;
  };

  const db = await getDb();
  const userId = Number(sessionUser.userId);

  // If user exists in DB, update
  const existing = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
  if (existing) {
    await db.execute(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        birth_date = COALESCE($3, birth_date),
        gender = COALESCE($4, gender),
        address = COALESCE($5, address),
        degree = COALESCE($6, degree),
        education_type = COALESCE($7, education_type),
        education_payment = COALESCE($8, education_payment),
        course_year = COALESCE($9, course_year),
        tutor_name = COALESCE($10, tutor_name),
        scholarship_status = COALESCE($11, scholarship_status),
        avatar_url = COALESCE($12, avatar_url),
        student_id_code = COALESCE($13, student_id_code),
        bio = COALESCE($14, bio),
        student_group = COALESCE($15, student_group),
        university = COALESCE($16, university),
        faculty = COALESCE($17, faculty)
      WHERE id = $18`,
      [
        body.fullName ? body.fullName.trim() : null,
        body.phone ? body.phone.trim() : null,
        body.birthDate ? body.birthDate.trim() : null,
        body.gender ? body.gender.trim() : null,
        body.address ? body.address.trim() : null,
        body.degree ? body.degree.trim() : null,
        body.educationType ? body.educationType.trim() : null,
        body.educationPayment ? body.educationPayment.trim() : null,
        body.courseYear ? body.courseYear.trim() : null,
        body.tutorName ? body.tutorName.trim() : null,
        body.scholarshipStatus ? body.scholarshipStatus.trim() : null,
        body.avatarUrl !== undefined ? body.avatarUrl.trim() : null,
        body.studentIdCode ? body.studentIdCode.trim() : null,
        body.bio !== undefined ? body.bio.trim() : null,
        body.studentGroup ? body.studentGroup.trim() : null,
        body.university ? body.university.trim() : null,
        body.faculty ? body.faculty.trim() : null,
        userId,
      ]
    );

    await writeAuditLog(
      userId,
      "UPDATE_PROFILE",
      `Profil ma'lumotlari yangilandi: ${sessionUser.email}`
    );
  }

  // Return fresh profile
  const updatedDbUser = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);

  return NextResponse.json({
    ok: true,
    profile: {
      id: updatedDbUser?.id ?? userId,
      fullName: updatedDbUser?.full_name || body.fullName || sessionUser.fullName,
      email: updatedDbUser?.email || sessionUser.email,
      role: updatedDbUser?.role || sessionUser.role,
      studentGroup: updatedDbUser?.student_group || body.studentGroup || sessionUser.studentGroup,
      university: updatedDbUser?.university || body.university || sessionUser.university,
      faculty: updatedDbUser?.faculty || body.faculty || sessionUser.faculty,
      specialty: "60610500 - Dasturiy injiniring (sohalar bo'yicha)",
      phone: updatedDbUser?.phone || body.phone || "+998 90 123 45 67",
      birthDate: updatedDbUser?.birth_date || body.birthDate || "10-05-2009",
      gender: updatedDbUser?.gender || body.gender || "erkak",
      address: updatedDbUser?.address || body.address || "",
      degree: updatedDbUser?.degree || body.degree || "Bakalavr",
      educationType: updatedDbUser?.education_type || body.educationType || "Kunduzgi",
      educationPayment: updatedDbUser?.education_payment || body.educationPayment || "Davlat granti",
      courseYear: updatedDbUser?.course_year || body.courseYear || "1-kurs",
      tutorName: updatedDbUser?.tutor_name || body.tutorName || "Alimuradov Lochinbek",
      scholarshipStatus: updatedDbUser?.scholarship_status || body.scholarshipStatus || "Bor",
      avatarUrl: updatedDbUser?.avatar_url || body.avatarUrl || "",
      studentIdCode: updatedDbUser?.student_id_code || body.studentIdCode || "310242100806",
      bio: updatedDbUser?.bio || body.bio || "",
      academicYear: "2026-2027",
      semester: "2-semestr",
    },
  });
}
