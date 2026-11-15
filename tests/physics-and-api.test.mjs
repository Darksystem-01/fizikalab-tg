import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ci-admin@example.test";
const TEST_ADMIN_PASS = process.env.ADMIN_PASSWORD || "CiAdminTestPass!2026";

let baseUrl = process.env.TEST_BASE_URL || "";
let serverProc = null;

async function waitForHealth(url, timeoutMs = 20000) {
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
    const port = 3199;
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: "production",
        // Test single combined ADMIN_SECRET without separate ADMIN_EMAIL / ADMIN_PASSWORD
        ADMIN_SECRET: `${TEST_ADMIN_EMAIL}:${TEST_ADMIN_PASS}`,
        ADMIN_EMAIL: "",
        ADMIN_PASSWORD: "",
        AUTH_SECRET: process.env.AUTH_SECRET || "ci-test-auth-secret-minimum-32-chars-ok",
        FIZIKALAB_TEST: "1",
      },
      stdio: "ignore",
    });
    await waitForHealth(baseUrl);
  }
});

test.after(() => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
  }
});

test("1. Health check non-leakage, security headers, formula catalog >= 100, and unauth RBAC", async () => {
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, "ok");
  assert.equal(health.database, undefined, "/api/health must NOT leak DB backend");
  assert.equal(healthRes.headers.get("x-frame-options"), "DENY");
  assert.equal(healthRes.headers.get("x-content-type-options"), "nosniff");

  // Verify 100+ formulas catalog exists in src/lib/formulas.ts
  const formulasSrc = fs.readFileSync(
    path.join(PROJECT_ROOT, "src/lib/formulas.ts"),
    "utf8"
  );
  const formulaIds = formulasSrc.match(/id:\s*"[a-z]+-\d+"/g) || [];
  assert.ok(formulaIds.length >= 100, `Expected >= 100 formulas, found ${formulaIds.length}`);

  const reportsUnauth = await fetch(`${baseUrl}/api/reports`);
  assert.equal(reportsUnauth.status, 401);

  const simUnauth = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labKey: "kinematics", params: {} }),
  });
  assert.equal(simUnauth.status, 401);

  const adminUnauth = await fetch(`${baseUrl}/api/darksystem/overview`);
  assert.equal(adminUnauth.status, 404, "Unauth darksystem API must return 404 Not Found");

  const adminOldApi = await fetch(`${baseUrl}/api/admin/overview`);
  assert.equal(adminOldApi.status, 404, "Deprecated /api/admin/* must return 404 Not Found");

  const darksystemPageUnauth = await fetch(`${baseUrl}/darksystem`);
  assert.equal(darksystemPageUnauth.status, 404, "Unauth /darksystem page must return 404 Not Found");

  const adminPageDead = await fetch(`${baseUrl}/admin`);
  assert.equal(adminPageDead.status, 404, "Deprecated /admin page must return 404 Not Found");

  const teacherUnauth = await fetch(`${baseUrl}/api/teacher/overview`);
  assert.equal(teacherUnauth.status, 403);
});

let sharedStudentCookie = "";
let sharedStudentEmail = "";

test("2. Student registration validation (university/faculty/group), role lock, and 6 backend physics solvers", async () => {
  const ts = Date.now();
  sharedStudentEmail = `talaba_${ts}@example.test`;

  // Reject registration without university / faculty
  const missingUni = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Talaba",
      email: sharedStudentEmail,
      password: "Password123!",
      studentGroup: "FI-202",
    }),
  });
  assert.equal(missingUni.status, 400);

  // Reject junk / fake university
  const fakeUni = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Talaba",
      university: "1234 Soxta Universitet",
      faculty: "Fizika fakulteti",
      studentGroup: "FI-202",
      email: sharedStudentEmail,
      password: "Password123!",
    }),
  });
  assert.equal(fakeUni.status, 400);

  // Reject mismatched faculty for selected university
  const mismatchedFaculty = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Talaba",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Tibbiyot va Jarrohlik fakulteti", // not in TATU
      studentGroup: "FI-202",
      email: `mismatch-${Date.now()}@example.test`,
      password: "Password123!",
    }),
  });
  assert.equal(mismatchedFaculty.status, 400);

  // Successfully register student with TATU 2026 Kiberxavfsizlik faculty
  const tatuStudent = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Kiberxavfsizlik Mutaxassisi",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: `tatu-${Date.now()}@example.test`,
      password: "Password123!",
    }),
  });
  assert.equal(tatuStudent.status, 201);
  const tatuBody = await tatuStudent.json();
  assert.equal(tatuBody.user.faculty, "Kiberxavfsizlik fakulteti");

  // Even if body attempts role escalation to admin/teacher, server forces role="student"
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Talaba",
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "FI-202",
      email: sharedStudentEmail,
      password: "Password123!",
      role: "admin",
    }),
  });
  assert.equal(regRes.status, 201);
  const regBody = await regRes.json();
  assert.equal(regBody.user.role, "student");
  assert.ok(
    regBody.user.university.includes("O‘zMU") ||
      regBody.user.university.includes("O'zMU")
  );
  assert.equal(regBody.user.faculty, "Fizika fakulteti");

  sharedStudentCookie = extractSessionCookie(regRes);
  assert.ok(sharedStudentCookie.startsWith("fizikalab_session="));

  // Student blocked from darksystem & teacher endpoints (stealth 404 for darksystem)
  const forbiddenAdmin = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: sharedStudentCookie },
  });
  assert.equal(forbiddenAdmin.status, 404);

  const forbiddenAdminOld = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Cookie: sharedStudentCookie },
  });
  assert.equal(forbiddenAdminOld.status, 404);

  const forbiddenTeacher = await fetch(`${baseUrl}/api/teacher/overview`, {
    headers: { Cookie: sharedStudentCookie },
  });
  assert.equal(forbiddenTeacher.status, 403);

  const sim = async (labKey, params, saveRun = false) => {
    const res = await fetch(`${baseUrl}/api/physics/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sharedStudentCookie,
      },
      body: JSON.stringify({ labKey, params, saveRun }),
    });
    assert.equal(res.status, 200, `${labKey} simulation failed`);
    return (await res.json()).result;
  };

  // Lab 1: Metrology
  const metRes = await sim("metrology", {
    mode: "vernier",
    trueValueMm: 24.64,
    leastCountMm: 0.02,
    zeroErrorMm: 0,
  });
  assert.ok(Math.abs(metRes.correctedReadingMm - 24.64) < 0.001);

  const analyzeRes = await fetch(`${baseUrl}/api/physics/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sharedStudentCookie },
    body: JSON.stringify({
      values: [10, 12, 14],
      points: [
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
      ],
      compareWith: { mean: 12, stdError: 0.1 },
    }),
  });
  assert.equal(analyzeRes.status, 200);
  const analyzed = await analyzeRes.json();
  assert.equal(analyzed.stats.mean, 12);
  assert.equal(analyzed.stats.stdDev, 2);
  assert.ok(Math.abs(analyzed.regression.slope - 2) < 1e-4);
  assert.equal(analyzed.tTest.consistent, true);

  // Lab 2: Kinematics (RK4 + unrestricted custom duration on air_track)
  const kinVac = await sim(
    "kinematics",
    { mode: "projectile", v0: 20, angleDeg: 45, y0: 0, gravity: 9.80665, airDrag: false },
    true
  );
  const analyticalRange = (20 * 20) / 9.80665;
  assert.ok(Math.abs(kinVac.rangeM - analyticalRange) < 0.15);

  const kinCustom = await sim("kinematics", {
    mode: "air_track",
    v0: 10,
    accelX: 1,
    durationS: 300,
    massKg: 2,
  });
  assert.equal(kinCustom.flightTimeS, 300);

  // Lab 3: Dynamics
  const pendSmall = await sim("dynamics", {
    subMode: "pendulum",
    pendulumLengthM: 1.0,
    initialAngleDeg: 5,
    gravity: 9.80665,
  });
  const idealPeriod = 2 * Math.PI * Math.sqrt(1.0 / 9.80665);
  assert.ok(Math.abs(pendSmall.summary.nonlinearPeriodS - idealPeriod) < 0.02);

  const colRes = await sim("dynamics", {
    subMode: "collision",
    mass1Kg: 2,
    v1InitialMs: 4,
    mass2Kg: 2,
    v2InitialMs: 0,
    restitutionE: 1,
  });
  assert.ok(Math.abs(colRes.summary.v1FinalMs) < 0.01);
  assert.ok(Math.abs(colRes.summary.v2FinalMs - 4) < 0.01);

  // Lab 4: Statics
  const statRes = await sim("statics", {
    subMode: "force_table",
    forces: [
      { label: "F1", magnitudeN: 15, angleDeg: 0 },
      { label: "F2", magnitudeN: 15, angleDeg: 180 },
    ],
  });
  assert.equal(statRes.summary.inEquilibrium, true);

  // Lab 5: Electromagnetism
  const emBridge = await sim("electromagnetism", {
    subMode: "wheatstone_meter_bridge",
    bridgeType: "meter_bridge",
    supplyV: 6,
    rKnownOhm: 10,
    rUnknownOhm: 15,
    jockeyCm: 40,
  });
  assert.equal(emBridge.summary.nullPointCm, 40);
  assert.equal(emBridge.summary.balanced, true);

  // Lab 6: Optics
  const optLens = await sim("optics", {
    subMode: "optical_bench",
    elementType: "converging_lens",
    focalLengthCm: 15,
    objectDistanceCm: 30,
    objectHeightCm: 5,
  });
  assert.equal(optLens.summary.imageDistanceCm, 30);
  assert.equal(optLens.summary.magnification, -1);

  // Student submits report
  const repRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sharedStudentCookie },
    body: JSON.stringify({
      labKey: "kinematics",
      title: "Ballistika Tajriba Hisoboti (Test)",
      measurements: [{ label: "v0=20, 45deg", primaryValue: kinVac.rangeM, unit: "m" }],
      errorAnalysis: { n: 1, mean: kinVac.rangeM, stdDev: 0, stdError: 0, relativeErrorPct: 0 },
      conclusion: "RK4 sonli natija nazariy qiymat bilan 0.1% aniqlikda mos keldi.",
    }),
  });
  assert.equal(repRes.status, 201);

  for (const route of [
    "/labs/metrology",
    "/labs/kinematics",
    "/labs/dynamics",
    "/labs/statics",
    "/labs/electromagnetism",
    "/labs/optics",
    "/instruments",
    "/reference",
    "/reports",
  ]) {
    const pageRes = await fetch(`${baseUrl}${route}`, {
      headers: { Cookie: sharedStudentCookie },
      redirect: "manual",
    });
    assert.equal(pageRes.status, 200, `Route ${route} returned ${pageRes.status}`);
  }
});

test("3. Three-tier RBAC: Sole Admin -> Teacher creation -> Teacher group & grading -> User ban & delete", async () => {
  // Wrong admin password rejected
  const badAdminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: "WrongPassword123",
    }),
  });
  assert.equal(badAdminRes.status, 401);

  // Correct admin login via configured email
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASS,
    }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.role, "darksystem", "Admin role must be darksystem in response");
  assert.equal(loginData.user.email, "darksystem@internal", "Real email must never be exposed to frontend");
  const adminCookie = extractSessionCookie(loginRes);
  assert.ok(adminCookie.startsWith("fizikalab_session="));
  const rawCookieVal = adminCookie.replace("fizikalab_session=", "").split(";")[0];
  assert.ok(rawCookieVal.startsWith("enc."), "Cookie must be opaque AES-256-GCM encrypted");
  assert.ok(!rawCookieVal.includes("email"), "Opaque cookie must not leak plaintext email");
  assert.ok(!rawCookieVal.includes("darksystem"), "Opaque cookie must not leak plaintext role");

  // Also verify 'admin' alias login with password
  const adminAliasRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin",
      password: TEST_ADMIN_PASS,
    }),
  });
  assert.equal(adminAliasRes.status, 200);

  // Admin access to /darksystem page must succeed (200)
  const darksystemPageRes = await fetch(`${baseUrl}/darksystem`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(darksystemPageRes.status, 200);

  // Admin creates a teacher account via /api/darksystem/users
  const teacherEmail = `ustoz_${Date.now()}@example.test`;
  const createTeacherRes = await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Ustoz Karim",
      email: teacherEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "O'zMU",
      faculty: "Fizika fakulteti",
      studentGroup: "Kafedra",
    }),
  });
  assert.equal(createTeacherRes.status, 201);
  const createdTeacher = await createTeacherRes.json();
  assert.equal(createdTeacher.role, "teacher");

  // Teacher logs in
  const tLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: teacherEmail,
      password: "TeacherPass!2026",
    }),
  });
  assert.equal(tLoginRes.status, 200);
  const teacherCookie = extractSessionCookie(tLoginRes);

  // Teacher CANNOT access /api/darksystem/* or /darksystem page -> MUST BE 404 (stealth)
  const tForbiddenAdminApi = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: teacherCookie },
  });
  assert.equal(tForbiddenAdminApi.status, 404, "Teacher hitting /api/darksystem/* must get 404 Not Found");

  const tForbiddenAdminPage = await fetch(`${baseUrl}/darksystem`, {
    headers: { Cookie: teacherCookie },
    redirect: "manual",
  });
  assert.equal(tForbiddenAdminPage.status, 404, "Teacher hitting /darksystem page must get 404 Not Found");

  // Teacher CAN access /teacher page and /api/teacher/overview
  const teacherPage = await fetch(`${baseUrl}/teacher`, {
    headers: { Cookie: teacherCookie },
    redirect: "manual",
  });
  assert.equal(teacherPage.status, 200);

  const tOverviewRes = await fetch(`${baseUrl}/api/teacher/overview`, {
    headers: { Cookie: teacherCookie },
  });
  assert.equal(tOverviewRes.status, 200);
  const tOverview = await tOverviewRes.json();
  assert.ok(tOverview.reports.length >= 1);

  // Teacher creates an academic group and assignment
  const grpRes = await fetch(`${baseUrl}/api/teacher/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      name: `FI-${Date.now() % 1000}`,
      university: "O'zMU",
      faculty: "Fizika",
      description: "Test guruhi",
    }),
  });
  assert.equal(grpRes.status, 201);

  const assignRes = await fetch(`${baseUrl}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      title: "Mustaqil ish: Optika",
      labKey: "optics",
      assignmentType: "independent",
      groupName: "FI-202",
      description: "Koshi dispersiyasini tekshiring.",
      tolerancePct: 3,
    }),
  });
  assert.equal(assignRes.status, 201);

  // Teacher grades report
  const targetReportId = tOverview.reports[0].id;
  const gradeRes = await fetch(`${baseUrl}/api/teacher/reports/${targetReportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      grade: 97,
      status: "graded",
      adminFeedback: "Ustoz tomonidan tekshirildi.",
    }),
  });
  assert.equal(gradeRes.status, 200);

  // Admin bans the student and confirms existing session cookie is immediately invalidated
  const adminOvRes = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(adminOvRes.status, 200);
  const adminOv = await adminOvRes.json();
  const studentRow = adminOv.users.find((u) => u.email === sharedStudentEmail);
  assert.ok(studentRow);

  const banRes = await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ userId: studentRow.id, isBanned: true }),
  });
  assert.equal(banRes.status, 200);

  // Banned student's existing cookie must be rejected on /api/auth/me!
  const meAfterBan = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: sharedStudentCookie },
  });
  assert.equal(meAfterBan.status, 401);

  // Admin deletes test teacher and test student
  const delStudent = await fetch(`${baseUrl}/api/darksystem/users?userId=${studentRow.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.equal(delStudent.status, 200);

  const delTeacher = await fetch(`${baseUrl}/api/darksystem/users?userId=${createdTeacher.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.equal(delTeacher.status, 200);
});

test("8. Strict Email Sanitization, Validation & Google OAuth Sign-in flow", async () => {
  // 1. Rejection of disposable fake email on registration
  const disposableRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Fake User",
      email: "hacker@tempmail.com",
      password: "TestPassword123!",
      university: "O'zbekiston Milliy universiteti (O'zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "FI-101",
    }),
  });
  assert.equal(disposableRes.status, 400);
  const dispJson = await disposableRes.json();
  assert.match(dispJson.error, /vaqtinchalik/i);

  // 2. Rejection of CRLF / header injection in email
  const crlfRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Injection Test",
      email: "user@example.com\r\nBcc:admin@secret.uz",
      password: "TestPassword123!",
      university: "O'zbekiston Milliy universiteti (O'zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "FI-101",
    }),
  });
  assert.equal(crlfRes.status, 400);

  // 3. Google GET endpoint returns config
  const gGetRes = await fetch(`${baseUrl}/api/auth/google`);
  assert.equal(gGetRes.status, 200);
  const gGetData = await gGetRes.json();
  assert.equal(gGetData.enabled, true);
  assert.ok(gGetData.clientId);

  // 3b. Google Start route redirects to Google OAuth accounts.google.com
  const gStartRes = await fetch(`${baseUrl}/api/auth/google/start`, { redirect: "manual" });
  assert.equal(gStartRes.status, 302);
  const startLoc = gStartRes.headers.get("location");
  assert.match(startLoc, /accounts\.google\.com/);

  // 4. Strict Security Rule: Google Auth is FORBIDDEN from granting administrator access
  const gAdminRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: "tolqinovmahmudjon72@gmail.com",
        name: "Mahmudjon Tolqinov",
        googleId: `google-admin-${Date.now()}`,
        emailVerified: true,
      },
    }),
  });
  assert.equal(gAdminRes.status, 403, "Google auth must reject admin sign-in attempt with 403");
  const gAdminErr = await gAdminRes.json();
  assert.match(gAdminErr.error, /Administrator/);

  // Exclusive Admin Access: ONLY Form Input Login with exact credentials grants darksystem access
  const inputAdminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "tolqinovmahmudjon72@gmail.com",
      password: "Mahmudjon2009.",
    }),
  });
  assert.equal(inputAdminRes.status, 200, "Valid input credentials must log into admin");
  const inputAdminData = await inputAdminRes.json();
  assert.equal(inputAdminData.user.role, "darksystem");
  assert.equal(inputAdminData.user.email, "darksystem@internal");
  const gAdminCookie = extractSessionCookie(inputAdminRes);
  assert.ok(gAdminCookie);

  // Wrong password on admin email must fail with 401
  const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "tolqinovmahmudjon72@gmail.com",
      password: "WrongPassword999!",
    }),
  });
  assert.equal(wrongPassRes.status, 401, "Invalid password on admin email must return 401");

  // Admin cookie grants access to /api/darksystem/overview
  const gAdminOv = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: gAdminCookie },
  });
  assert.equal(gAdminOv.status, 200);
  const gAdminOvData = await gAdminOv.json();
  const adminEntry = gAdminOvData.users.find((u) => u.role === "admin");
  assert.ok(adminEntry);
  assert.equal(adminEntry.email, "darksystem@internal");

  // Verify Information Disclosure Prevention: Homepage HTML has zero leak of admin email
  const homeHtmlRes = await fetch(`${baseUrl}/`);
  assert.equal(homeHtmlRes.status, 200);
  const homeHtml = await homeHtmlRes.text();
  assert.equal(homeHtml.includes("tolqinovmahmudjon72"), false, "Admin email must never be exposed on frontend");
  assert.equal(homeHtml.includes("Bosh Administrator (tolqinovmahmudjon72@gmail.com)"), false, "Admin helper link must be removed");

  // 5. Google Auth: New student needs academic profile first
  const testTs = Date.now();
  const newGoogleEmail = `student.google.${testTs}@example.com`;
  const newGoogleId = `google-stud-${testTs}`;
  const gNewStudentRes1 = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: newGoogleEmail,
        name: "Google Yangi Talaba",
        googleId: newGoogleId,
        emailVerified: true,
      },
    }),
  });
  assert.equal(gNewStudentRes1.status, 200);
  const gNewData1 = await gNewStudentRes1.json();
  assert.equal(gNewData1.needsAcademicProfile, true);
  assert.equal(gNewData1.email, newGoogleEmail.toLowerCase());

  // 6. Complete registration with verified university and faculty from catalog
  const gNewStudentRes2 = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: newGoogleEmail,
        name: "Google Yangi Talaba",
        googleId: newGoogleId,
        emailVerified: true,
      },
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Dasturiy injiniring fakulteti",
      studentGroup: "988-1",
    }),
  });
  assert.equal(gNewStudentRes2.status, 201);
  const gNewData2 = await gNewStudentRes2.json();
  assert.equal(gNewData2.user.role, "student");
  assert.equal(gNewData2.user.studentGroup, "988-1");
  const gStudentCookie = extractSessionCookie(gNewStudentRes2);
  assert.ok(gStudentCookie);

  // 7. Existing Google student logging in directly on subsequent visits
  const gExistingRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: newGoogleEmail,
        name: "Google Yangi Talaba",
        googleId: newGoogleId,
        emailVerified: true,
      },
    }),
  });
  assert.equal(gExistingRes.status, 200);
  const gExistingData = await gExistingRes.json();
  assert.equal(gExistingData.user.email, newGoogleEmail.toLowerCase());
  assert.equal(gExistingData.user.role, "student");
});
