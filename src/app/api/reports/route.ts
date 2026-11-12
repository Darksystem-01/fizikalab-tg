import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const db = await getDb();
  if (user.role === "admin" || user.role === "teacher") {
    const reports = await db.queryAll(
      `SELECT r.*, u.full_name AS student_name, u.email AS student_email, u.student_group, u.university, u.faculty
       FROM lab_reports r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.submitted_at DESC`
    );
    return NextResponse.json({ reports });
  }

  const reports = await db.queryAll(
    `SELECT r.*, u.full_name AS student_name, u.email AS student_email, u.student_group, u.university, u.faculty
     FROM lab_reports r
     JOIN users u ON u.id = r.user_id
     WHERE r.user_id = $1
     ORDER BY r.submitted_at DESC`,
    [user.userId]
  );
  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
    }

    const body = (await req.json()) as {
      assignmentId?: number | null;
      labKey: string;
      title: string;
      measurements: unknown[];
      errorAnalysis: Record<string, unknown>;
      conclusion: string;
    };

    if (!body.labKey || !body.title?.trim() || !body.conclusion?.trim()) {
      return NextResponse.json(
        { error: "Laboratoriya nomi, sarlavha va ilmiy xulosa kiritilishi shart." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const inserted = await db.execute(
      `INSERT INTO lab_reports
       (user_id, assignment_id, lab_key, title, measurements_json, error_analysis_json, conclusion, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', $8) RETURNING id`,
      [
        user.userId,
        body.assignmentId ?? null,
        body.labKey,
        body.title.trim(),
        JSON.stringify(body.measurements ?? []),
        JSON.stringify(body.errorAnalysis ?? {}),
        body.conclusion.trim(),
        now,
      ]
    );

    await writeAuditLog(
      user.userId,
      "SUBMIT_REPORT",
      `Hisobot topshirildi (#${inserted.lastInsertId}): ${body.labKey} - ${body.title}`
    );

    return NextResponse.json({ id: inserted.lastInsertId, status: "submitted" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Hisobotni saqlashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
