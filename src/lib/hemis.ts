/**
 * FizikaLab HEMIS Integration & Gradebook Export Adapter
 * Formats student laboratory grades and attendance according to Uzbekistan
 * Higher Education Management Information System (HEMIS) standards.
 */

export interface HemisStudentRating {
  studentId: string;
  fullName: string;
  groupName: string;
  university: string;
  faculty: string;
  labScores: Record<string, number>; // e.g. { "lab1": 85, "lab2": 90, ... }
  attendancePct: number; // e.g. 95%
  totalJnScore: number; // Joriy Nazorat balli (max 100 or max 40 depending on OTM)
  letterGrade: "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  status: "O‘tdi" | "Qayta topshirish (Debt)";
}

/**
 * Calculates HEMIS letter grade based on European Credit Transfer System (ECTS) / HEMIS standard:
 * 90-100: A
 * 85-89: B+
 * 80-84: B
 * 75-79: C+
 * 70-74: C
 * 60-69: D
 * 0-59: F (Qarz / Akademik qarzdorlik)
 */
export function calculateHemisGrade(score: number): {
  letter: "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  status: "O‘tdi" | "Qayta topshirish (Debt)";
} {
  const s = Math.round(score);
  if (s >= 90) return { letter: "A", status: "O‘tdi" };
  if (s >= 85) return { letter: "B+", status: "O‘tdi" };
  if (s >= 80) return { letter: "B", status: "O‘tdi" };
  if (s >= 75) return { letter: "C+", status: "O‘tdi" };
  if (s >= 70) return { letter: "C", status: "O‘tdi" };
  if (s >= 60) return { letter: "D", status: "O‘tdi" };
  return { letter: "F", status: "Qayta topshirish (Debt)" };
}

/**
 * Generates CSV string conforming to HEMIS Gradebook Import schema.
 * Can be directly imported into HEMIS or opened in Microsoft Excel.
 */
export function generateHemisGradebookCsv(ratings: HemisStudentRating[]): string {
  const header = [
    "№",
    "Talaba ID (HEMIS)",
    "F.I.SH",
    "Akademik Guruh",
    "Fakultet",
    "Metrologiya (JN-1)",
    "Kinematika (JN-2)",
    "Dinamika (JN-3)",
    "Statika (JN-4)",
    "Elektromagnetizm (JN-5)",
    "Optika (JN-6)",
    "Termodinamika (JN-7)",
    "Atom Fizikasi (JN-8)",
    "Jami O‘rtacha Ball",
    "Harfiy Baho",
    "Akademik Holati",
  ].join(",");

  const rows = ratings.map((r, idx) => {
    const scores = [
      r.labScores["metrology"] ?? "-",
      r.labScores["kinematics"] ?? "-",
      r.labScores["dynamics"] ?? "-",
      r.labScores["statics"] ?? "-",
      r.labScores["electromagnetism"] ?? "-",
      r.labScores["optics"] ?? "-",
      r.labScores["thermodynamics"] ?? "-",
      r.labScores["atomic"] ?? "-",
    ];

    return [
      idx + 1,
      `"${r.studentId}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.groupName}"`,
      `"${r.faculty}"`,
      ...scores,
      r.totalJnScore.toFixed(1),
      r.letterGrade,
      `"${r.status}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
