import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb, writeAuditLog, type DbAcademicGroup } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
    return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  }

  const db = await getDb();
  const groups =
    isAdminOrDarksystem(user)
      ? await db.queryAll(
          `SELECT g.*, u.full_name AS teacher_name
           FROM academic_groups g
           JOIN users u ON u.id = g.teacher_id
           ORDER BY g.id DESC`
        )
      : await db.queryAll(
          `SELECT g.*, u.full_name AS teacher_name
           FROM academic_groups g
           JOIN users u ON u.id = g.teacher_id
           WHERE g.teacher_id = $1
           ORDER BY g.id DESC`,
          [user.userId]
        );

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
    return NextResponse.json(
      { error: "Faqat ustoz yoki administrator guruh yarata oladi." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    name?: string;
    university?: string;
    faculty?: string;
    description?: string;
  };

  const name = (body.name || "").trim();
  const university = (body.university || user.university || "").trim();
  const faculty = (body.faculty || user.faculty || "").trim();
  const description = (body.description || "").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Guruh nomi kamida 2 ta belgidan iborat bo‘lishi kerak." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const dup = await db.queryOne<DbAcademicGroup>(
    `SELECT id FROM academic_groups WHERE LOWER(name) = LOWER($1) AND teacher_id = $2`,
    [name, user.userId]
  );
  if (dup) {
    return NextResponse.json(
      { error: "Sizda bunday nomli guruh allaqachon mavjud." },
      { status: 409 }
    );
  }

  const inserted = await db.execute(
    `INSERT INTO academic_groups (name, university, faculty, description, teacher_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, university, faculty, description, user.userId, new Date().toISOString()]
  );

  await writeAuditLog(
    user.userId,
    "CREATE_GROUP",
    `Yangi o‘quv guruhi ochildi: ${name} (${university || "-"})`
  );

  return NextResponse.json({ id: inserted.lastInsertId }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
    return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || 0);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Noto‘g‘ri guruh ID" }, { status: 400 });
  }

  const db = await getDb();
  const grp = await db.queryOne<DbAcademicGroup>(
    "SELECT * FROM academic_groups WHERE id = $1",
    [id]
  );
  if (!grp) {
    return NextResponse.json({ error: "Guruh topilmadi" }, { status: 404 });
  }
  if (!isAdminOrDarksystem(user) && grp.teacher_id !== user.userId) {
    return NextResponse.json(
      { error: "Faqat o‘zingiz yaratgan guruhni o‘chira olasiz." },
      { status: 403 }
    );
  }

  await db.execute("DELETE FROM academic_groups WHERE id = $1", [id]);
  await writeAuditLog(user.userId, "DELETE_GROUP", `Guruh o‘chirildi: ${grp.name}`);
  return NextResponse.json({ ok: true });
}
