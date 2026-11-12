import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Faqat bosh administrator kirishi mumkin." },
      { status: 403 }
    );
  }

  const db = await getDb();
  const users = await db.queryAll(
    `SELECT id, full_name, email, role, student_group, university, faculty, is_active, is_banned, created_at
     FROM users
     ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'teacher' THEN 1 ELSE 2 END, id DESC`
  );
  const groups = await db.queryAll(
    `SELECT g.*, u.full_name AS teacher_name, u.email AS teacher_email
     FROM academic_groups g
     JOIN users u ON u.id = g.teacher_id
     ORDER BY g.id DESC`
  );
  const reports = await db.queryAll(
    `SELECT r.*, u.full_name AS student_name, u.email AS student_email, u.student_group, u.university, u.faculty
     FROM lab_reports r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.submitted_at DESC`
  );
  const assignments = await db.queryAll(
    `SELECT a.*, u.full_name AS creator_name, u.role AS creator_role
     FROM assignments a
     JOIN users u ON u.id = a.created_by
     ORDER BY a.id DESC`
  );
  const runs = await db.queryAll(
    `SELECT e.id, e.lab_key, e.created_at, u.full_name AS student_name, u.student_group
     FROM experiment_runs e
     JOIN users u ON u.id = e.user_id
     ORDER BY e.created_at DESC
     LIMIT 30`
  );
  const logs = await db.queryAll(
    `SELECT l.*, u.email AS user_email
     FROM audit_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.id DESC
     LIMIT 50`
  );

  return NextResponse.json({
    users,
    groups,
    reports,
    assignments,
    runs,
    logs,
  });
}
