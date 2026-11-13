import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
    return NextResponse.json(
      { error: "Faqat ustozlar va administrator uchun ruxsat etilgan." },
      { status: 403 }
    );
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

  const students = await db.queryAll(
    `SELECT id, full_name, email, student_group, university, faculty, is_active, is_banned, created_at
     FROM users
     WHERE role = 'student'
     ORDER BY student_group ASC, full_name ASC`
  );

  const assignments =
    isAdminOrDarksystem(user)
      ? await db.queryAll(
          `SELECT a.*, u.full_name AS creator_name
           FROM assignments a
           JOIN users u ON u.id = a.created_by
           ORDER BY a.id DESC`
        )
      : await db.queryAll(
          `SELECT a.*, u.full_name AS creator_name
           FROM assignments a
           JOIN users u ON u.id = a.created_by
           WHERE a.created_by = $1 OR a.group_name IS NULL OR a.group_name = ''
           ORDER BY a.id DESC`,
          [user.userId]
        );

  const reports = await db.queryAll(
    `SELECT r.*, u.full_name AS student_name, u.email AS student_email, u.student_group, u.university, u.faculty
     FROM lab_reports r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.submitted_at DESC`
  );

  return NextResponse.json({
    groups,
    students,
    assignments,
    reports,
  });
}
