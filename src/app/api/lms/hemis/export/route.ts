import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, isAdminOrDarksystem } from "@/lib/auth";
import {
  calculateHemisGrade,
  generateHemisGradebookCsv,
  HemisStudentRating,
} from "@/lib/hemis";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "teacher" && !isAdminOrDarksystem(user))) {
      return NextResponse.json({ error: "Kirish taqiqlangan (Faqat ustoz va adminlar uchun)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const groupName = searchParams.get("group") || "";
    const format = searchParams.get("format") || "csv";

    const db = await getDb();

    // Query students
    const studentsQuery = groupName
      ? "SELECT id, full_name, email, student_group, university, faculty FROM users WHERE role = 'student' AND student_group = $1 ORDER BY full_name ASC"
      : "SELECT id, full_name, email, student_group, university, faculty FROM users WHERE role = 'student' ORDER BY student_group ASC, full_name ASC";
    const studentsParams = groupName ? [groupName] : [];
    const students = await db.queryAll<{
      id: number;
      full_name: string;
      email: string;
      student_group: string;
      university: string;
      faculty: string;
    }>(studentsQuery, studentsParams);

    // Query all graded lab reports
    const reports = await db.queryAll<{
      user_id: number;
      lab_key: string;
      grade: number | null;
    }>("SELECT user_id, lab_key, grade FROM lab_reports WHERE grade IS NOT NULL");

    const reportsByUser: Record<number, Record<string, number>> = {};
    reports.forEach((r) => {
      if (!reportsByUser[r.user_id]) reportsByUser[r.user_id] = {};
      if (r.grade !== null) {
        reportsByUser[r.user_id][r.lab_key] = r.grade;
      }
    });

    const ratings: HemisStudentRating[] = students.map((s) => {
      const userLabs = reportsByUser[s.id] || {};
      const labKeys = Object.keys(userLabs);
      const totalScore =
        labKeys.length > 0
          ? labKeys.reduce((acc, k) => acc + (userLabs[k] || 0), 0) / labKeys.length
          : 0;

      const hemis = calculateHemisGrade(totalScore);

      return {
        studentId: `HEMIS-${s.id.toString().padStart(5, "0")}`,
        fullName: s.full_name,
        groupName: s.student_group || "Noma'lum",
        university: s.university || "O‘zbekiston Milliy Universiteti",
        faculty: s.faculty || "Fizika fakulteti",
        labScores: userLabs,
        attendancePct: 95,
        totalJnScore: totalScore,
        letterGrade: hemis.letter,
        status: hemis.status,
      };
    });

    if (format === "json") {
      return NextResponse.json({
        totalStudents: ratings.length,
        groupName: groupName || "Barcha guruhlar",
        exportedAt: new Date().toISOString(),
        ratings,
      });
    }

    const csvData = generateHemisGradebookCsv(ratings);
    const filename = `HEMIS_Jurnal_${groupName ? groupName.replace(/\s+/g, "_") : "Barcha_Guruhlar"}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Ichki server xatoligi";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
