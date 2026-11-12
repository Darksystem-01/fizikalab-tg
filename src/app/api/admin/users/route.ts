import { NextResponse } from "next/server";
import { getSessionUser, hashPassword, isConfiguredAdminEmail } from "@/lib/auth";
import { getDb, writeAuditLog, type DbUser } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Faqat administrator kirishi mumkin" }, { status: 403 });
  }

  const body = (await req.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    role?: "teacher" | "student";
    studentGroup?: string;
    university?: string;
    faculty?: string;
  };

  const fullName = (body.fullName || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  // Admin cannot create secondary admin accounts; sole admin comes strictly from env
  const role: "teacher" | "student" = body.role === "teacher" ? "teacher" : "student";
  const university = (body.university || "").trim();
  const faculty = (body.faculty || "").trim();
  const studentGroup = (body.studentGroup || (role === "teacher" ? "Kafedra" : "")).trim();

  if (
    fullName.length < 2 ||
    !EMAIL_RE.test(email) ||
    password.length < 6 ||
    (role === "student" && (!university || !faculty || !studentGroup))
  ) {
    return NextResponse.json(
      {
        error:
          "F.I.Sh., to‘g‘ri email, kamida 6 belgili parol va talaba bo‘lsa universitet/fakultet/guruh majburiy.",
      },
      { status: 400 }
    );
  }

  if (isConfiguredAdminEmail(email)) {
    return NextResponse.json({ error: "Bu email tizim administratori uchun band." }, { status: 409 });
  }

  const db = await getDb();
  const existing = await db.queryOne("SELECT id FROM users WHERE email = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "Bu email allaqachon mavjud." }, { status: 409 });
  }

  const inserted = await db.execute(
    `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9) RETURNING id`,
    [
      fullName,
      email,
      hashPassword(password),
      role,
      studentGroup,
      university,
      faculty,
      admin.userId,
      new Date().toISOString(),
    ]
  );

  await writeAuditLog(
    admin.userId,
    role === "teacher" ? "ADMIN_CREATE_TEACHER" : "ADMIN_CREATE_STUDENT",
    `Yangi ${role === "teacher" ? "ustoz" : "talaba"} yaratildi: ${email} (${university || "-"})`
  );

  return NextResponse.json({ id: inserted.lastInsertId, role }, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Faqat administrator ruxsatiga ega" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId: number;
    isActive?: boolean;
    isBanned?: boolean;
    studentGroup?: string;
    university?: string;
    faculty?: string;
    newPassword?: string;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "userId ko‘rsatilmagan" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [
    body.userId,
  ]);
  if (!target) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (target.role === "admin" || target.id === admin.userId) {
    return NextResponse.json(
      { error: "Administrator hisobini bloklash yoki o‘zgartirish mumkin emas." },
      { status: 400 }
    );
  }

  const banToggle =
    typeof body.isBanned === "boolean"
      ? body.isBanned
      : typeof body.isActive === "boolean"
      ? !body.isActive
      : undefined;

  if (typeof banToggle === "boolean") {
    await db.execute(
      "UPDATE users SET is_banned = $1, is_active = $2 WHERE id = $3",
      [banToggle ? 1 : 0, banToggle ? 0 : 1, body.userId]
    );
  }

  if (typeof body.studentGroup === "string" && body.studentGroup.trim()) {
    await db.execute("UPDATE users SET student_group = $1 WHERE id = $2", [
      body.studentGroup.trim(),
      body.userId,
    ]);
  }
  if (typeof body.university === "string") {
    await db.execute("UPDATE users SET university = $1 WHERE id = $2", [
      body.university.trim(),
      body.userId,
    ]);
  }
  if (typeof body.faculty === "string") {
    await db.execute("UPDATE users SET faculty = $1 WHERE id = $2", [
      body.faculty.trim(),
      body.userId,
    ]);
  }
  if (typeof body.newPassword === "string" && body.newPassword.length >= 6) {
    await db.execute("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashPassword(body.newPassword),
      body.userId,
    ]);
  }

  await writeAuditLog(
    admin.userId,
    typeof banToggle === "boolean" ? (banToggle ? "BAN_USER" : "UNBAN_USER") : "ADMIN_UPDATE_USER",
    `Foydalanuvchi #${body.userId} (${target.email}) yangilandi`
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Faqat administrator o‘chira oladi" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  let userId = Number(searchParams.get("userId") || 0);
  if (!userId) {
    try {
      const body = (await req.json()) as { userId?: number };
      userId = Number(body.userId || 0);
    } catch {
      userId = 0;
    }
  }

  if (!Number.isFinite(userId) || userId <= 0 || userId === admin.userId) {
    return NextResponse.json({ error: "Noto‘g‘ri foydalanuvchi ID" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!target) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Administrator hisobini o‘chirish taqiqlangan" }, { status: 403 });
  }

  await db.execute("DELETE FROM users WHERE id = $1", [userId]);
  await writeAuditLog(
    admin.userId,
    "ADMIN_DELETE_USER",
    `Foydalanuvchi o‘chirildi: ${target.email} (${target.role})`
  );

  return NextResponse.json({ ok: true });
}
