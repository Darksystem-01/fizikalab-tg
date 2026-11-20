import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ci-admin@example.test";
const TEST_ADMIN_PASS = process.env.ADMIN_PASSWORD || "CiAdminTestPass!2026";

let baseUrl = process.env.TEST_BASE_URL || "";
let serverProc = null;

async function waitForHealth(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}

function extractSessionCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  const match = raw.match(/fizikalab_session=[^;]+/);
  return match ? match[0] : "";
}

test.before(async () => {
  if (!baseUrl) {
    const port = 3196;
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["next", "start", "-p", String(port), "-H", "127.0.0.1"],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          NODE_ENV: "production",
          ADMIN_SECRET: `${TEST_ADMIN_EMAIL}:${TEST_ADMIN_PASS}`,
          ADMIN_EMAIL: "",
          ADMIN_PASSWORD: "",
          AUTH_SECRET: "ci-test-auth-secret-minimum-32-chars-ok",
          FIZIKALAB_TEST: "1",
        },
        shell: process.platform === "win32",
        stdio: "ignore",
      }
    );
    await waitForHealth(baseUrl);
  }
});

test.after(() => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
  }
});

test("HEMIS 1: Student Profile lifecycle, API retrieval and profile modification", async () => {
  const studentEmail = `student_hemis_${Date.now()}@example.test`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "To'lqinov Mahmudjon Umid o'g'li",
      email: studentEmail,
      password: "StudentPass!2026",
      university: "TATU",
      faculty: "Dasturiy injiniring",
      studentGroup: "310-24 DIF",
    }),
  });
  assert.equal(regRes.status, 201, "Student registration should succeed");
  const studentCookie = extractSessionCookie(regRes);
  assert.ok(studentCookie, "Session cookie must be issued");

  // 1. GET /api/profile
  const getProfRes = await fetch(`${baseUrl}/api/profile`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(getProfRes.status, 200, "/api/profile should return 200");
  const profData = await getProfRes.json();
  assert.ok(profData.profile, "profile object must exist");
  assert.equal(profData.profile.fullName, "To'lqinov Mahmudjon Umid o'g'li");
  assert.equal(profData.profile.studentGroup, "310-24 DIF");
  assert.equal(profData.profile.degree, "Bakalavr");

  // 2. PATCH /api/profile
  const patchRes = await fetch(`${baseUrl}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      phone: "+998 90 999 88 77",
      address: "Toshkent shahri, Yunusobod 19-mavze, 45-uy",
      bio: "Fizika fani va avtomatlashtirishga qiziquvchi dasturchi talaba.",
      studentIdCode: "310242100806",
    }),
  });
  assert.equal(patchRes.status, 200, "PATCH /api/profile should return 200");
  const updatedProf = await patchRes.json();
  assert.equal(updatedProf.profile.phone, "+998 90 999 88 77");
  assert.equal(updatedProf.profile.address, "Toshkent shahri, Yunusobod 19-mavze, 45-uy");
  assert.equal(updatedProf.profile.studentIdCode, "310242100806");

  // 3. GET /profile page route
  const profPageRes = await fetch(`${baseUrl}/profile`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(profPageRes.status, 200, "/profile HTML page must return 200");
});

test("HEMIS 2: Course Syllabus 3-tab curriculum (20 lectures, 8 labs, 7 practices)", async () => {
  const studentEmail = `student_syl_${Date.now()}@example.test`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Nazarov Bobur Alisher o'g'li",
      email: studentEmail,
      password: "StudentPass!2026",
      university: "TATU",
      faculty: "Dasturiy injiniring",
      studentGroup: "310-24 DIF",
    }),
  });
  const studentCookie = extractSessionCookie(regRes);

  // 1. GET /api/syllabus
  const sylRes = await fetch(`${baseUrl}/api/syllabus`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(sylRes.status, 200, "/api/syllabus must return 200");
  const sylData = await sylRes.json();

  assert.ok(sylData.courseInfo);
  assert.equal(sylData.courseInfo.ects, 6);
  assert.equal(sylData.courseInfo.totalHours, 180);

  // 20 lecture topics
  assert.equal(sylData.lectures.length, 20, "Must have exactly 20 lecture topics");
  assert.ok(sylData.lectures[0].title.includes("kinematika"));
  assert.ok(sylData.lectures[19].title.includes("Kvant"));

  // 7-8 lab sessions (7 formal examined labs, metrology as instrument reference)
  assert.ok(sylData.labs.length >= 7 && sylData.labs.length <= 8, "Must have 7 or 8 laboratory modules");

  // 7 practice sessions
  assert.equal(sylData.practices.length, 7, "Must have exactly 7 practice seminars");

  // 2. GET /syllabus page route
  const sylPageRes = await fetch(`${baseUrl}/syllabus`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(sylPageRes.status, 200, "/syllabus HTML page must return 200");
});

test("HEMIS 3: Diversified assignments, file upload, article submission and teacher grading", async () => {
  // Login as admin to act as teacher/grader
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASS,
    }),
  });
  assert.equal(adminLoginRes.status, 200);
  const adminCookie = extractSessionCookie(adminLoginRes);

  // Register student
  const studentEmail = `student_assign_${Date.now()}@example.test`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Husanov Sardor Bekzod o'g'li",
      email: studentEmail,
      password: "StudentPass!2026",
      university: "TATU",
      faculty: "Dasturiy injiniring",
      studentGroup: "310-24 DIF",
    }),
  });
  const studentCookie = extractSessionCookie(regRes);

  // 1. Check GET /api/assignments
  const assignRes = await fetch(`${baseUrl}/api/assignments`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(assignRes.status, 200);
  const assignData = await assignRes.json();
  assert.ok(assignData.assignments.length >= 4, "Must have at least 4 active assignments");

  // 2. Test File Upload via /api/upload
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      fileName: "gravitatsiya_maqola_hisobot.pdf",
      fileData: Buffer.from("PDF-1.4 DUMMY CONTENT FOR ACADEMIC TESTING").toString("base64"),
      mimeType: "application/pdf",
    }),
  });
  assert.equal(uploadRes.status, 200, "File upload should return 200");
  const uploadData = await uploadRes.json();
  assert.ok(uploadData.url, "Upload must return a file URL");
  assert.equal(uploadData.fileName, "gravitatsiya_maqola_hisobot.pdf");

  // Verify file is retrievable via HTTP GET and content matches
  const downloadRes = await fetch(`${baseUrl}${uploadData.url}`);
  assert.equal(downloadRes.status, 200, "Uploaded file must be retrievable via GET");
  const downloadedText = await downloadRes.text();
  assert.ok(downloadedText.includes("PDF-1.4 DUMMY CONTENT"), "Downloaded content must match uploaded content");

  // Path traversal defense
  const traversalRes = await fetch(`${baseUrl}/uploads/..%2fpackage.json`);
  assert.notEqual(traversalRes.status, 200, "Directory traversal on /uploads must be rejected");

  // Verify lecture resource route works without 404
  const lectureRes = await fetch(`${baseUrl}/resources/lectures/1-maruza.pdf`);
  assert.equal(lectureRes.status, 200, "Lecture resource route must return 200");
  const lectureHtml = await lectureRes.text();
  assert.ok(lectureHtml.includes("TATU"), "Lecture resource should contain TATU header");

  // 3. Student submits an Article + File via /api/reports
  const targetAssignment = assignData.assignments[0];
  const submitReportRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      assignmentId: targetAssignment.id,
      labKey: targetAssignment.lab_key,
      title: "Gravitatsiya va relyativistik mexanika tahlili",
      articleContent: "# Gravitatsion maydon tahlili\n\nUshbu maqolada koinot mexanikasi va Eynshteyn tenglamalari o'rganildi.",
      fileUrl: uploadData.url,
      fileName: uploadData.fileName,
      fileSize: uploadData.fileSize,
      submissionType: "article",
    }),
  });
  assert.equal(submitReportRes.status, 201, "Article submission must return 201");
  const reportCreated = await submitReportRes.json();
  assert.ok(reportCreated.id, "Report ID must be returned");

  // 4. Teacher reviews and grades the submitted article via PATCH /api/teacher/reports/[id]
  const gradeRes = await fetch(`${baseUrl}/api/teacher/reports/${reportCreated.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      grade: 95,
      status: "graded",
      adminFeedback: "A'lo darajada bajarilgan ilmiy maqola. Tahlil va xulosalar aniq.",
    }),
  });
  assert.equal(gradeRes.status, 200, "Teacher grading must return 200");

  // 5. Student checks /api/reports and sees graded report
  const checkReportsRes = await fetch(`${baseUrl}/api/reports`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(checkReportsRes.status, 200);
  const checkReportsData = await checkReportsRes.json();
  const myReport = checkReportsData.reports.find((r) => r.id === reportCreated.id);
  assert.ok(myReport);
  assert.equal(myReport.grade, 95);
  assert.equal(myReport.status, "graded");
  assert.equal(myReport.admin_feedback, "A'lo darajada bajarilgan ilmiy maqola. Tahlil va xulosalar aniq.");
  assert.equal(myReport.file_name, "gravitatsiya_maqola_hisobot.pdf");
  assert.ok(myReport.article_content.includes("Gravitatsion maydon tahlili"));

  // 6. Check /assignments page route HTML
  const assignPageRes = await fetch(`${baseUrl}/assignments`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(assignPageRes.status, 200, "/assignments HTML page must return 200");

  // 7. Teacher creates a new scientific article assignment with custom rubric
  const createAssignRes = await fetch(`${baseUrl}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "Ilmiy maqola: Kvant optikasi va fotonlar interferensiyasi",
      labKey: "optics",
      description: "Yung tajribasi va bitta fotonli interferensiya bo'yicha ilmiy maqola tayyorlash.",
      lessonType: "maqola",
      maxScore: 10.0,
      rubric: [
        { criterion: "Nazariy apparat", weight: 50 },
        { criterion: "Tajriba tahlili", weight: 50 },
      ],
      groupName: "310-24 DIF",
    }),
  });
  assert.equal(createAssignRes.status, 201, "Teacher should be able to create scientific article assignment");
  const createAssignData = await createAssignRes.json();
  assert.ok(createAssignData.id);

  // Student fetches assignments and sees the new scientific article assignment
  const studentRefreshedRes = await fetch(`${baseUrl}/api/assignments`, {
    headers: { Cookie: studentCookie },
  });
  const studentRefreshedData = await studentRefreshedRes.json();
  const foundNew = studentRefreshedData.assignments.find((a) => a.id === createAssignData.id);
  assert.ok(foundNew, "Student must see the teacher's newly created scientific article assignment");
  assert.equal(foundNew.lesson_type, "maqola");
  assert.equal(foundNew.max_score, 10.0);
});
