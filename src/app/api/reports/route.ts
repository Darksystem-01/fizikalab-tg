import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      labKey?: string;
      title: string;
      measurements?: unknown[];
      errorAnalysis?: Record<string, unknown>;
      conclusion?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      articleContent?: string;
      submissionType?: "report" | "file" | "article";
    };

    const labKey = (body.labKey || "general").trim();
    const conclusion = (
      body.conclusion ||
      body.articleContent ||
      (body.fileUrl ? `Biriktirilgan fayl: ${body.fileName || "Hujjat"}` : "")
    ).trim();

    if (!body.title?.trim() || !conclusion) {
      return NextResponse.json(
        { error: "Sarlavha hamda hisobot xulosasi, ilmiy maqola matni yoki yuklangan fayl kiritilishi shart." },
        { status: 400 }
      );
    }

    const fileUrl = (body.fileUrl || "").trim();
    const fileName = (body.fileName || "").trim();
    const fileSize = Number(body.fileSize || 0);
    const articleContent = (body.articleContent || "").trim();
    const submissionType = body.submissionType || (articleContent ? "article" : fileUrl ? "file" : "report");

    const db = await getDb();
    const now = new Date().toISOString();
    const inserted = await db.execute(
      `INSERT INTO lab_reports
       (user_id, assignment_id, lab_key, title, measurements_json, error_analysis_json, conclusion, status, file_url, file_name, file_size, article_content, submission_type, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        user.userId,
        body.assignmentId ?? null,
        labKey,
        body.title.trim(),
        JSON.stringify(body.measurements ?? []),
        JSON.stringify(body.errorAnalysis ?? {}),
        conclusion,
        fileUrl,
        fileName,
        fileSize,
        articleContent,
        submissionType,
        now,
      ]
    );

    await writeAuditLog(
      user.userId,
      "SUBMIT_REPORT",
      `Topshiriq/maqola yuborildi (#${inserted.lastInsertId}) [${submissionType}]: ${labKey} - ${body.title}`
    );

    return NextResponse.json({ id: inserted.lastInsertId, status: "submitted" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Hisobotni saqlashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
