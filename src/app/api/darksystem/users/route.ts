import { NextResponse } from "next/server";
import { getSessionUser, hashPassword, isConfiguredAdminEmail } from "@/lib/auth";
import { getDb, writeAuditLog, type DbUser } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const admin = await getSessionUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "darksystem")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const existing = await db.queryOne("SELECT id FROM users WHERE LOWER(TRIM(email)) = $1", [email]);
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
    Number(admin.userId),
    role === "teacher" ? "ADMIN_CREATE_TEACHER" : "ADMIN_CREATE_STUDENT",
    `Yangi ${role === "teacher" ? "ustoz" : "talaba"} yaratildi: ${email} (${university || "-"})`
  );

  return NextResponse.json({ id: inserted.lastInsertId, role }, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await getSessionUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "darksystem")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  if (target.role === "admin" || target.id === Number(admin.userId)) {
    return NextResponse.json(
      { error: "Bosh administrator hisobini o‘zgartirib bo‘lmaydi." },
      { status: 400 }
    );
  }

  if (typeof body.isBanned === "boolean") {
    const isBannedInt = body.isBanned ? 1 : 0;
    const isActiveInt = body.isBanned ? 0 : 1;
    await db.execute(
      "UPDATE users SET is_banned = $1, is_active = $2 WHERE id = $3",
      [isBannedInt, isActiveInt, target.id]
    );
    await writeAuditLog(
      Number(admin.userId),
      body.isBanned ? "ADMIN_BAN_USER" : "ADMIN_UNBAN_USER",
      `${target.email} (#${target.id}) administrator tomonidan ${body.isBanned ? "bloklandi" : "blokdan chiqarildi"}`
    );
  }

  if (body.newPassword && body.newPassword.length >= 6) {
    await db.execute("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashPassword(body.newPassword),
      target.id,
    ]);
    await writeAuditLog(
      Number(admin.userId),
      "ADMIN_RESET_PASSWORD",
      `${target.email} (#${target.id}) paroli yangilandi`
    );
  }

  if (body.studentGroup) {
    await db.execute("UPDATE users SET student_group = $1 WHERE id = $2", [
      body.studentGroup.trim(),
      target.id,
    ]);
  }

  if (body.university || body.faculty) {
    await db.execute(
      "UPDATE users SET university = COALESCE($1, university), faculty = COALESCE($2, faculty) WHERE id = $3",
      [body.university?.trim() || null, body.faculty?.trim() || null, target.id]
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const admin = await getSessionUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "darksystem")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "userId ko‘rsatilmagan" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!target) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }
  if (target.role === "admin" || target.id === Number(admin.userId)) {
    return NextResponse.json(
      { error: "Bosh administrator hisobini o‘chirib bo‘lmaydi." },
      { status: 400 }
    );
  }

  await db.execute("DELETE FROM users WHERE id = $1", [target.id]);
  await writeAuditLog(
    Number(admin.userId),
    "ADMIN_DELETE_USER",
    `${target.email} (#${target.id}, ${target.role}) tizimdan butunlay o‘chirildi`
  );

  return NextResponse.json({ success: true });
}
