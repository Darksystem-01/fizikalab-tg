import { NextResponse } from "next/server";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import { getDb, writeAuditLog } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const db = await getDb();
  if (isAdminOrDarksystem(user) || user.role === "teacher") {
    const assignments = await db.queryAll(
      `SELECT a.*, u.full_name AS creator_name
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       ORDER BY a.id DESC`
    );
    return NextResponse.json({ assignments });
  }

  // Students receive global assignments OR assignments targeted to their student group
  const assignments = await db.queryAll(
    `SELECT a.*, u.full_name AS creator_name
     FROM assignments a
     JOIN users u ON u.id = a.created_by
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

  const db = await getDb();
  const inserted = await db.execute(
    `INSERT INTO assignments (title, lab_key, description, target_params_json, tolerance_pct, group_name, assignment_type, created_by, due_date, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      body.title.trim(),
      body.labKey,
      body.description.trim(),
      JSON.stringify(body.targetParams ?? {}),
      Number(body.tolerancePct ?? 5),
      groupName,
      assignmentType,
      user.userId,
      body.dueDate || null,
      new Date().toISOString(),
    ]
  );

  await writeAuditLog(
    user.userId,
    "CREATE_ASSIGNMENT",
    `Yangi ${assignmentType === "independent" ? "mustaqil ish" : "laboratoriya"} (#${inserted.lastInsertId}): ${body.title}${groupName ? ` [${groupName}]` : ""}`
  );

  return NextResponse.json({ id: inserted.lastInsertId }, { status: 201 });
}
