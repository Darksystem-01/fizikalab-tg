import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser();
  if (!admin || (admin.role !== "admin" && admin.role !== "darksystem")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    typeof body.grade === "number"
      ? Math.min(100, Math.max(0, Math.round(body.grade)))
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
    [grade, status, feedback, Number(admin.userId), new Date().toISOString(), reportId]
  );

  await writeAuditLog(
    Number(admin.userId),
    "GRADE_REPORT",
    `Hisobot #${reportId} darksystem tomonidan baholandi: ${grade ?? "-"}/100`
  );

  return NextResponse.json({ ok: true });
}
