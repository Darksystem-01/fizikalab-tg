import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const db = await getDb();
  if (isAdminOrDarksystem(user) || user.role === "teacher") {
    const assignments = await db.queryAll(
      `SELECT a.*, COALESCE(u.full_name, 'Bosh O‘qituvchi') AS creator_name
       FROM assignments a
       LEFT JOIN users u ON u.id = a.created_by
       ORDER BY a.id DESC`
    );
    return NextResponse.json({ assignments });
  }

  // Students receive global assignments OR assignments targeted to their student group
  const assignments = await db.queryAll(
    `SELECT a.*, COALESCE(u.full_name, 'Bosh O‘qituvchi') AS creator_name
     FROM assignments a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.group_name IS NULL
        OR TRIM(a.group_name) = ''
        OR LOWER(TRIM(a.group_name)) = LOWER(TRIM($1))
     ORDER BY a.id ASC`,
    [user.studentGroup || ""]
  );
  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user || (!isAdminOrDarksystem(user) && user.role !== "teacher")) {
    return NextResponse.json(
      { error: "Faqat ustoz yoki administrator laboratoriya topshirig‘i yarata oladi." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    title?: string;
    labKey?: string;
    description?: string;
    targetParams?: Record<string, unknown>;
    tolerancePct?: number;
    groupName?: string | null;
    assignmentType?: "lab" | "independent";
    lessonType?: "laboratoriya" | "mustaqil_ish" | "maqola" | "amaliyot" | "referat";
    maxScore?: number;
    rubric?: unknown;
    attachmentUrl?: string;
    attachmentName?: string;
    dueDate?: string | null;
  };

  if (!body.title?.trim() || !body.labKey || !body.description?.trim()) {
    return NextResponse.json(
      { error: "Topshiriq sarlavhasi, laboratoriya bo‘limi va tavsifi majburiy." },
      { status: 400 }
    );
  }

  const groupName = body.groupName?.trim() ? body.groupName.trim() : null;
  const assignmentType = body.assignmentType === "independent" ? "independent" : "lab";
  const lessonType = body.lessonType || (assignmentType === "independent" ? "mustaqil_ish" : "laboratoriya");
  const maxScore = typeof body.maxScore === "number" && body.maxScore > 0 ? body.maxScore : (lessonType === "maqola" ? 10.0 : 5.0);
  const rubricJson = typeof body.rubric === "string" ? body.rubric : JSON.stringify(body.rubric ?? []);
  const attachmentUrl = (body.attachmentUrl || "").trim();
  const attachmentName = (body.attachmentName || "").trim();

  const db = await getDb();
  const inserted = await db.execute(
    `INSERT INTO assignments (
      title, lab_key, description, target_params_json, tolerance_pct, group_name,
      assignment_type, lesson_type, max_score, rubric_json, attachment_url, attachment_name,
      created_by, due_date, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
    [
      body.title.trim(),
      body.labKey,
      body.description.trim(),
      JSON.stringify(body.targetParams ?? {}),
      Number(body.tolerancePct ?? 5),
      groupName,
      assignmentType,
      lessonType,
      maxScore,
      rubricJson,
      attachmentUrl,
      attachmentName,
      user.userId,
      body.dueDate || null,
      new Date().toISOString(),
    ]
  );

  await writeAuditLog(
    user.userId,
    "CREATE_ASSIGNMENT",
    `Yangi topshiriq [${lessonType}] (#${inserted.lastInsertId}): ${body.title}${groupName ? ` [${groupName}]` : ""}`
  );

  return NextResponse.json({ id: inserted.lastInsertId }, { status: 201 });
}
