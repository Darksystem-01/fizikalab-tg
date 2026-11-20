import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";
import { sendGradeNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
    return NextResponse.json(
      { error: "Faqat ustoz yoki administrator hisobotni baholay oladi." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Noto‘g‘ri hisobot ID" }, { status: 400 });
  }

  const body = (await req.json()) as {
    grade?: number;
    status?: "reviewed" | "graded" | "needs_revision";
    adminFeedback?: string;
  };

  const grade =
    typeof body.grade === "number" && !isNaN(body.grade)
      ? Math.min(100, Math.max(0, Math.round(body.grade * 10) / 10))
      : null;
  const status =
    body.status === "needs_revision"
      ? "needs_revision"
      : body.status === "reviewed"
      ? "reviewed"
      : "graded";
  const feedback = (body.adminFeedback || "").trim();

  const db = await getDb();
  await db.execute(
    `UPDATE lab_reports
     SET grade = $1, status = $2, admin_feedback = $3, graded_by = $4, reviewed_at = $5
     WHERE id = $6`,
    [grade, status, feedback, user.userId, new Date().toISOString(), reportId]
  );

  // Talabaning Telegram hisobi bog'langan bo'lsa, tezkor push bildirishnoma yuboramiz
  try {
    const student = await db.queryOne<{ full_name: string; telegram_chat_id: string }>(
      `SELECT u.full_name, u.telegram_chat_id
       FROM users u
       JOIN lab_reports r ON r.user_id = u.id
       WHERE r.id = $1`,
      [reportId]
    );
    if (student?.telegram_chat_id && grade !== null) {
      const reportInfo = await db.queryOne<{ title: string }>(
        `SELECT title FROM lab_reports WHERE id = $1`,
        [reportId]
      );
      void sendGradeNotification({
        chatId: student.telegram_chat_id,
        studentName: student.full_name,
        labTitle: reportInfo?.title || "Laboratoriya hisoboti",
        grade,
        maxGrade: 100,
        feedback,
        gradedBy: user.fullName || "Kafedra o‘qituvchisi",
      });
    }
  } catch (tgErr) {
    console.warn("[TelegramBot] Bildirishnoma yuborishda ogohlantirish:", tgErr);
  }

  await writeAuditLog(
    user.userId,
    "TEACHER_GRADE_REPORT",
    `Hisobot #${reportId} (${user.email}) baholandi: ${grade ?? "-"}/100`
  );

  return NextResponse.json({ ok: true });
}
