import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

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
    status?: "reviewed" | "graded";
    adminFeedback?: string;
  };

  const grade =
    typeof body.grade === "number"
      ? Math.min(100, Math.max(0, Math.round(body.grade)))
      : null;
  const status = body.status === "reviewed" ? "reviewed" : "graded";
  const feedback = (body.adminFeedback || "").trim();

  const db = await getDb();
  await db.execute(
    `UPDATE lab_reports
     SET grade = $1, status = $2, admin_feedback = $3, graded_by = $4, reviewed_at = $5
     WHERE id = $6`,
    [grade, status, feedback, user.userId, new Date().toISOString(), reportId]
  );

  await writeAuditLog(
    user.userId,
    "TEACHER_GRADE_REPORT",
    `Hisobot #${reportId} (${user.email}) baholandi: ${grade ?? "-"}/100`
  );

  return NextResponse.json({ ok: true });
}
