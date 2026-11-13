import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ci-admin@example.test";
const TEST_ADMIN_PASS = process.env.ADMIN_PASSWORD || "CiAdminTestPass!2026";
const AUTH_SECRET = process.env.AUTH_SECRET || "ci-test-auth-secret-minimum-32-chars-ok";

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
  if (typeof res.headers.getSetCookie === "function") {
    const cookies = res.headers.getSetCookie();
    for (const c of cookies) {
      const match = c.match(/fizikalab_session=[^;]+/);
      if (match) return match[0];
    }
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  const match = raw.match(/fizikalab_session=[^;]+/);
  return match ? match[0] : "";
}

function getRawCookieValue(cookieHeader) {
  return cookieHeader.replace("fizikalab_session=", "").split(";")[0];
}

function getTestEncryptionKey(secret = AUTH_SECRET) {
  const hashedSecret = crypto
    .createHash("sha256")
    .update(`${secret}:fizikalab-session-key`)
    .digest("hex");
  return crypto
    .createHash("sha256")
    .update(`fizikalab-aes256gcm:${hashedSecret}`)
    .digest();
}

function createEncryptedToken(payload, secret = AUTH_SECRET) {
  const key = getTestEncryptionKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plainText = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${tag.toString("base64url")}`;
}

test.before(async () => {
  if (!baseUrl) {
    const port = 3198;
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: "production",
        ADMIN_SECRET: `${TEST_ADMIN_EMAIL}:${TEST_ADMIN_PASS}`,
        ADMIN_EMAIL: "",
        ADMIN_PASSWORD: "",
        AUTH_SECRET,
        FIZIKALAB_TEST: "1",
      },
      stdio: "ignore",
    });
    await waitForHealth(baseUrl);
  }
});

test.after(async () => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
  }
});

// ============================================================================
// TIER 1: Feature Coverage (Core User Journeys & Baseline Regression)
// ============================================================================

test("Tier 1.1: Health probe non-leakage, security headers, and unauthenticated route defense", async () => {
  // 1. Health check must not leak database internals
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, "ok");
  assert.equal(health.database, undefined, "/api/health must never leak DB engine or connection status");

  // 2. Security headers
  assert.equal(healthRes.headers.get("x-frame-options"), "DENY");
  assert.equal(healthRes.headers.get("x-content-type-options"), "nosniff");

  // 3. Unauthenticated access control
  const unauthReports = await fetch(`${baseUrl}/api/reports`);
  assert.equal(unauthReports.status, 401, "Unauthenticated /api/reports must return 401");

  const unauthSim = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labKey: "kinematics", params: {} }),
  });
  assert.equal(unauthSim.status, 401, "Unauthenticated /api/physics/simulate must return 401");

  const unauthTeacher = await fetch(`${baseUrl}/api/teacher/overview`);
  assert.equal(unauthTeacher.status, 403, "Unauthenticated /api/teacher/overview must return 403");

  // 4. Stealth route concealment (must return 404 Not Found to conceal existence)
  const unauthDarkApi = await fetch(`${baseUrl}/api/darksystem/overview`);
  assert.equal(unauthDarkApi.status, 404, "Unauthenticated darksystem API must return 404 Not Found (stealth)");

  const unauthDarkPage = await fetch(`${baseUrl}/darksystem`);
  assert.equal(unauthDarkPage.status, 404, "Unauthenticated darksystem page must return 404 Not Found (stealth)");

  const unauthAdminApi = await fetch(`${baseUrl}/api/admin/overview`);
  assert.equal(unauthAdminApi.status, 404, "Deprecated /api/admin/* must return 404 Not Found");

  const unauthAdminPage = await fetch(`${baseUrl}/admin`);
  assert.equal(unauthAdminPage.status, 404, "Deprecated /admin page must return 404 Not Found");
});

test("Tier 1.2: Student complete lifecycle (registration, solvers, report submission)", async () => {
  const ts = Date.now();
  const studentEmail = `student_t1_${ts}@example.test`;

  // 1. Register student with valid TATU Kiberxavfsizlik faculty
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.1.2" },
    body: JSON.stringify({
      fullName: "Alisher Navoiy",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-201",
      email: studentEmail,
      password: "StudentPass!2026",
    }),
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.user.role, "student");
  assert.equal(regData.user.faculty, "Kiberxavfsizlik fakulteti");

  const studentCookie = extractSessionCookie(regRes);
  assert.ok(studentCookie.startsWith("fizikalab_session="));
  assert.match(regRes.headers.get("set-cookie") || "", /HttpOnly/i, "Session cookie header must include HttpOnly");

  // 2. Run Metrology simulation
  const metRes = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "metrology",
      params: { mode: "vernier", trueValueMm: 24.64, leastCountMm: 0.02, zeroErrorMm: 0 },
    }),
  });
  assert.equal(metRes.status, 200);
  const metData = await metRes.json();
  assert.ok(Math.abs(metData.result.correctedReadingMm - 24.64) < 0.001);

  // 3. Run Kinematics simulation
  const kinRes = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "kinematics",
      params: { mode: "projectile", v0: 20, angleDeg: 45, y0: 0, gravity: 9.80665, airDrag: false },
    }),
  });
  assert.equal(kinRes.status, 200);
  const kinData = await kinRes.json();
  const analyticalRange = (20 * 20) / 9.80665;
  assert.ok(Math.abs(kinData.result.rangeM - analyticalRange) < 0.15);

  // 4. Run Statics force table simulation
  const statRes = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "statics",
      params: {
        subMode: "force_table",
        forces: [
          { label: "F1", magnitudeN: 15, angleDeg: 0 },
          { label: "F2", magnitudeN: 15, angleDeg: 180 },
        ],
      },
    }),
  });
  assert.equal(statRes.status, 200);
  const statData = await statRes.json();
  assert.equal(statData.result.summary.inEquilibrium, true);

  // 5. Submit laboratory report
  const repRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "kinematics",
      title: "Ballistika Bo'yicha Tajriba Hisoboti",
      measurements: [{ label: "v0=20m/s", primaryValue: kinData.result.rangeM, unit: "m" }],
      errorAnalysis: { n: 1, mean: kinData.result.rangeM, stdDev: 0, stdError: 0, relativeErrorPct: 0 },
      conclusion: "RK4 sonli yechimi nazariy natija bilan mos tushdi.",
    }),
  });
  assert.equal(repRes.status, 201);
  const repData = await repRes.json();
  assert.ok(Number.isFinite(repData.id));
  assert.equal(repData.status, "submitted");

  // 6. Student blocked from darksystem and teacher endpoints
  const darkCheck = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(darkCheck.status, 404, "Student accessing darksystem must receive 404 (stealth)");

  const teacherCheck = await fetch(`${baseUrl}/api/teacher/overview`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(teacherCheck.status, 403, "Student accessing teacher overview must receive 403");
});

test("Tier 1.3: Teacher complete lifecycle (provisioning, group creation, assignment, grading)", async () => {
  const ts = Date.now();

  // 1. Admin logs in
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  assert.equal(adminLogin.status, 200);
  const adminCookie = extractSessionCookie(adminLogin);

  // 2. Admin provisions teacher account
  const teacherEmail = `teacher_t1_${ts}@example.test`;
  const provRes = await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Ustoz Karim",
      email: teacherEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "Kafedra",
    }),
  });
  assert.equal(provRes.status, 201);
  const teacherData = await provRes.json();
  assert.equal(teacherData.role, "teacher");

  // 3. Teacher logs in
  const teacherLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "TeacherPass!2026" }),
  });
  assert.equal(teacherLogin.status, 200);
  const teacherCookie = extractSessionCookie(teacherLogin);

  // 4. Teacher accesses teacher pages
  const teacherPage = await fetch(`${baseUrl}/teacher`, {
    headers: { Cookie: teacherCookie },
    redirect: "manual",
  });
  assert.equal(teacherPage.status, 200);

  const tOverviewRes = await fetch(`${baseUrl}/api/teacher/overview`, {
    headers: { Cookie: teacherCookie },
  });
  assert.equal(tOverviewRes.status, 200);

  // 5. Teacher creates an academic group
  const grpRes = await fetch(`${baseUrl}/api/teacher/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      name: `FI-${ts % 1000}`,
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      description: "Tier 1 guruhi",
    }),
  });
  assert.equal(grpRes.status, 201);
  const grpData = await grpRes.json();
  assert.ok(Number.isFinite(grpData.id));

  // 6. Teacher creates an assignment (description is required)
  const assignRes = await fetch(`${baseUrl}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      title: "Mustaqil Laboratoriya Ishtiroki",
      labKey: "metrology",
      description: "Metrologiya xatoliklarini hisoblash topshirig'i",
      assignmentType: "independent",
      groupName: `FI-${ts % 1000}`,
      tolerancePct: 5,
    }),
  });
  assert.equal(assignRes.status, 201);

  // 7. Teacher is blocked from darksystem endpoints
  const darkAttempt = await fetch(`${baseUrl}/darksystem`, {
    headers: { Cookie: teacherCookie },
    redirect: "manual",
  });
  assert.equal(darkAttempt.status, 404, "Teacher accessing darksystem must receive 404 (stealth)");
});

test("Tier 1.4: Sole Administrator complete lifecycle (alias login, darksystem dashboard, account management)", async () => {
  // 1. Alias login using 'admin' with configured password
  const aliasLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin", password: TEST_ADMIN_PASS }),
  });
  assert.equal(aliasLogin.status, 200);
  const aliasData = await aliasLogin.json();
  assert.equal(aliasData.user.role, "darksystem");
  assert.equal(aliasData.user.email, "darksystem@internal");

  const adminCookie = extractSessionCookie(aliasLogin);
  assert.ok(adminCookie);

  // 2. Admin accesses /darksystem page
  const darkPage = await fetch(`${baseUrl}/darksystem`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(darkPage.status, 200);

  // 3. Admin accesses /api/darksystem/overview
  const darkOverview = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(darkOverview.status, 200);
  const darkOverviewData = await darkOverview.json();
  assert.ok(Array.isArray(darkOverviewData.users));
});

test("Tier 1.5: Google OAuth student onboarding and role restriction", async () => {
  const ts = Date.now();
  const oauthEmail = `google_student_${ts}@example.com`;
  const googleId = `gid-${ts}`;

  // 1. Google config check
  const gGet = await fetch(`${baseUrl}/api/auth/google`);
  assert.equal(gGet.status, 200);
  const gConfig = await gGet.json();
  assert.equal(gConfig.enabled, true);

  // 2. Google OAuth Step 1: New user requires academic profile completion
  const step1Res = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: oauthEmail,
        name: "Google Yangi Talaba",
        googleId,
        emailVerified: true,
      },
    }),
  });
  assert.equal(step1Res.status, 200);
  const step1Data = await step1Res.json();
  assert.equal(step1Data.needsAcademicProfile, true);

  // 3. Google OAuth Step 2: Onboard with accredited university catalog
  const step2Res = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: oauthEmail,
        name: "Google Yangi Talaba",
        googleId,
        emailVerified: true,
      },
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Dasturiy injiniring fakulteti",
      studentGroup: "DI-301",
    }),
  });
  assert.equal(step2Res.status, 201);
  const step2Data = await step2Res.json();
  assert.equal(step2Data.user.role, "student");
  assert.equal(step2Data.user.faculty, "Dasturiy injiniring fakulteti");
});

// ============================================================================
// TIER 2: Boundary & Negative Testing
// ============================================================================

test("Tier 2.1: Authentication input boundary & negative validation", async () => {
  // 1. Empty body on register -> 400
  const emptyReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.1" },
    body: JSON.stringify({}),
  });
  assert.equal(emptyReg.status, 400);

  // 2. Short password (< 6 chars) -> 400
  const shortPass = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.2" },
    body: JSON.stringify({
      fullName: "Qisqa Parol",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: `shortpass_${Date.now()}@example.test`,
      password: "123",
    }),
  });
  assert.equal(shortPass.status, 400);

  // 3. Login with missing email or password -> 400
  const missingLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "someone@example.test" }),
  });
  assert.equal(missingLogin.status, 400);

  // 4. Login with non-existent user -> 401
  const badUserLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `nonexistent_${Date.now()}@example.test`, password: "SomePassword123!" }),
  });
  assert.equal(badUserLogin.status, 401);

  // 5. Login with wrong admin password -> 401
  const badAdminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: "IncorrectPassword123!" }),
  });
  assert.equal(badAdminLogin.status, 401);

  // 6. Registration with disposable / burner email domain -> 400
  const dispReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.3" },
    body: JSON.stringify({
      fullName: "Burner Account",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: `burner_${Date.now()}@tempmail.com`,
      password: "ValidPass123!",
    }),
  });
  assert.equal(dispReg.status, 400);
  const dispData = await dispReg.json();
  assert.match(dispData.error, /vaqtinchalik/i);

  // 7. Registration with CRLF injection in email -> 400
  const crlfReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.4" },
    body: JSON.stringify({
      fullName: "CRLF Attack",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: "victim@example.test\r\nBcc:attacker@example.test",
      password: "ValidPass123!",
    }),
  });
  assert.equal(crlfReg.status, 400);
});

test("Tier 2.2: University & faculty catalog boundary validation", async () => {
  const ts = Date.now();

  // 1. Fake / unregistered university -> 400
  const fakeUni = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.5" },
    body: JSON.stringify({
      fullName: "Fake University User",
      university: "999 Soxta Universitet",
      faculty: "Fizika fakulteti",
      studentGroup: "KB-101",
      email: `fakeuni_${ts}@example.test`,
      password: "ValidPass123!",
    }),
  });
  assert.equal(fakeUni.status, 400);

  // 2. Mismatched faculty for valid university (TATU does not have Medical faculty) -> 400
  const mismatchFaculty = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.6" },
    body: JSON.stringify({
      fullName: "Mismatch Faculty User",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Stomatologiya fakulteti",
      studentGroup: "KB-101",
      email: `mismatch_${ts}@example.test`,
      password: "ValidPass123!",
    }),
  });
  assert.equal(mismatchFaculty.status, 400);

  // 3. Registration role lock: client requesting role="admin" must be forced to "student"
  const escalateReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.7" },
    body: JSON.stringify({
      fullName: "Role Escalation Tester",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: `escalate_${ts}@example.test`,
      password: "ValidPass123!",
      role: "admin",
    }),
  });
  assert.equal(escalateReg.status, 201);
  const escalateData = await escalateReg.json();
  assert.equal(escalateData.user.role, "student", "Public registration must force role to student");
});

test("Tier 2.3: Physics simulation boundary & numerical edge cases", async () => {
  // First obtain student session
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.2.8" },
    body: JSON.stringify({
      fullName: "Physics Boundary Tester",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: `sim_boundary_${Date.now()}@example.test`,
      password: "ValidPass123!",
    }),
  });
  const studentCookie = extractSessionCookie(regRes);

  // 1. Metrology analysis with empty values array -> 200 without divide-by-zero crash
  const emptyStats = await fetch(`${baseUrl}/api/physics/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ values: [], points: [] }),
  });
  assert.equal(emptyStats.status, 200);
  const emptyStatsData = await emptyStats.json();
  assert.equal(emptyStatsData.stats.mean, 0);

  // 2. Metrology analysis with single point -> regression handled without NaN or crash
  const singlePoint = await fetch(`${baseUrl}/api/physics/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ values: [10], points: [{ x: 1, y: 1 }] }),
  });
  assert.equal(singlePoint.status, 200);

  // 3. Kinematics projectile at boundary angle 0 degrees -> range is near 0 (< 0.2m)
  const zeroDeg = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "kinematics",
      params: { mode: "projectile", v0: 20, angleDeg: 0, y0: 0, gravity: 9.80665, airDrag: false },
    }),
  });
  assert.equal(zeroDeg.status, 200);
  const zeroDegData = await zeroDeg.json();
  assert.ok(zeroDegData.result.rangeM < 0.2, "Range at 0 deg must be near 0");

  // 4. Kinematics air track with long duration (300 seconds) -> computes without timeout
  const longTrack = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "kinematics",
      params: { mode: "air_track", v0: 5, accelX: 0.5, durationS: 300, massKg: 1 },
    }),
  });
  assert.equal(longTrack.status, 200);
  const longTrackData = await longTrack.json();
  assert.equal(longTrackData.result.flightTimeS, 300);

  // 5. Dynamics pendulum at small initial angle (5 deg) -> period consistent with analytical formula
  const pendRes = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "dynamics",
      params: { subMode: "pendulum", pendulumLengthM: 1.0, initialAngleDeg: 5, gravity: 9.80665 },
    }),
  });
  assert.equal(pendRes.status, 200);
  const pendData = await pendRes.json();
  const analyticalT = 2 * Math.PI * Math.sqrt(1.0 / 9.80665);
  assert.ok(Math.abs(pendData.result.summary.nonlinearPeriodS - analyticalT) < 0.05);
});

test("Tier 2.4: Malformed payloads, empty bodies, and non-numeric route parameters", async () => {
  // Obtain teacher cookie to test teacher route validation
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  const adminCookie = extractSessionCookie(adminLogin);

  const tEmail = `t_neg_${Date.now()}@example.test`;
  await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Ustoz Neg",
      email: tEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "Kafedra",
    }),
  });

  const tLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: tEmail, password: "TeacherPass!2026" }),
  });
  const teacherCookie = extractSessionCookie(tLogin);

  // 1. Non-numeric report ID to teacher grading route -> 400
  const nonNumGrade = await fetch(`${baseUrl}/api/teacher/reports/invalid-id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({ grade: 90 }),
  });
  assert.equal(nonNumGrade.status, 400, "Non-numeric report ID must return 400 Bad Request");

  // 2. Non-numeric report ID to darksystem report route -> 400 or 404
  const nonNumDark = await fetch(`${baseUrl}/api/darksystem/reports/invalid-id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ grade: 90 }),
  });
  assert.ok(nonNumDark.status === 400 || nonNumDark.status === 404);

  // 3. Broken JSON syntax to API route -> handled gracefully without crashing server
  const brokenJson = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: "{ broken: json string ... ",
  });
  assert.ok(brokenJson.status === 400 || brokenJson.status === 500);

  // 4. Missing required labKey to physics simulate -> 400
  const missingLabKey = await fetch(`${baseUrl}/api/physics/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({ params: {} }),
  });
  assert.equal(missingLabKey.status, 400, "Missing labKey must return 400 Bad Request");
});

// ============================================================================
// TIER 3: Cross-Feature State & Concurrency Interactions
// ============================================================================

test("Tier 3.1: Mid-session account ban and instant session revocation", async () => {
  const ts = Date.now();
  const banEmail = `ban_target_${ts}@example.test`;

  // 1. Student registers and verifies active session
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.3.1" },
    body: JSON.stringify({
      fullName: "Ban Target Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: banEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const targetUser = (await regRes.json()).user;
  const targetCookie = extractSessionCookie(regRes);

  const meBefore = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: targetCookie },
  });
  assert.equal(meBefore.status, 200, "Active student session must return 200 on /api/auth/me");

  // 2. Admin logs in and bans the student
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  const adminCookie = extractSessionCookie(adminLogin);

  const banRes = await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ userId: targetUser.id, isBanned: true }),
  });
  assert.equal(banRes.status, 200);

  // 3. Immediately verify the banned student's existing session is revoked
  const meAfter = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: targetCookie },
  });
  assert.equal(meAfter.status, 401, "Banned student session must be immediately rejected on /api/auth/me with 401");

  const reportAfter = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: targetCookie },
    body: JSON.stringify({ labKey: "metrology", title: "Test", measurements: [], errorAnalysis: {}, conclusion: "Test" }),
  });
  assert.equal(reportAfter.status, 401, "Banned student report submission must be rejected with 401");
});

test("Tier 3.2: Multi-actor collaborative workflow (student submission -> teacher grading -> student review)", async () => {
  const ts = Date.now();
  const studentEmail = `collab_student_${ts}@example.test`;

  // 1. Student registers and submits a report
  const studentReg = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.3.2" },
    body: JSON.stringify({
      fullName: "Collab Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-301",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(studentReg.status, 201);
  const studentCookie = extractSessionCookie(studentReg);

  const submitRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "metrology",
      title: "Collab Metrologiya Tajribasi",
      measurements: [{ label: "d", primaryValue: 12.5, unit: "mm" }],
      errorAnalysis: { n: 1, mean: 12.5 },
      conclusion: "Hisob-kitoblar bajarildi.",
    }),
  });
  assert.equal(submitRes.status, 201);
  const reportId = (await submitRes.json()).id;

  // 2. Admin provisions teacher
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  const adminCookie = extractSessionCookie(adminLogin);

  const teacherEmail = `collab_teacher_${ts}@example.test`;
  await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Ustoz Anvar",
      email: teacherEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "Kafedra",
    }),
  });

  const teacherLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "TeacherPass!2026" }),
  });
  const teacherCookie = extractSessionCookie(teacherLogin);

  // 3. Teacher inspects report and grades it
  const gradeRes = await fetch(`${baseUrl}/api/teacher/reports/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      grade: 96,
      status: "graded",
      adminFeedback: "Nazariy tahlil to‘liq va aniq bajarilgan.",
    }),
  });
  assert.equal(gradeRes.status, 200);

  // 4. Student queries their reports and observes teacher grade and feedback
  const studentReportsRes = await fetch(`${baseUrl}/api/reports`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(studentReportsRes.status, 200);
  const studentReportsData = await studentReportsRes.json();
  const gradedReport = studentReportsData.reports.find((r) => r.id === reportId);
  assert.ok(gradedReport);
  assert.equal(gradedReport.grade, 96);
  assert.equal(gradedReport.status, "graded");
  const feedback = gradedReport.admin_feedback || gradedReport.adminFeedback;
  assert.equal(feedback, "Nazariy tahlil to‘liq va aniq bajarilgan.");
});

test("Tier 3.3: Automatic session token rotation and seamless client handoff", async () => {
  const ts = Date.now();
  const studentEmail = `rotate_test_${ts}@example.test`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.3.3" },
    body: JSON.stringify({
      fullName: "Rotate Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const studentUser = (await regRes.json()).user;

  // 2. Generate token with issuedAt > 30s in the past to trigger auto-rotation
  const oldToken = createEncryptedToken({
    sessionId: crypto.randomUUID(),
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-101",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  // 3. Client calls /api/auth/me with old token
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${oldToken}` },
  });
  assert.equal(meRes.status, 200);

  // 4. Server issues fresh rotated Set-Cookie
  const freshCookie = extractSessionCookie(meRes);
  assert.ok(freshCookie.length > 0, "Server must issue rotated Set-Cookie when token is older than 30s");

  // 5. Subsequent request with fresh token succeeds seamlessly
  const nextRes = await fetch(`${baseUrl}/api/reports`, {
    headers: { Cookie: freshCookie },
  });
  assert.equal(nextRes.status, 200);
});

test("Tier 3.4: Teacher horizontal group isolation and IDOR defense", async () => {
  const ts = Date.now();

  // Admin logs in
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  const adminCookie = extractSessionCookie(adminLogin);

  // 1. Provision Teacher A and Teacher B
  const teacherAEmail = `teacher_a_${ts}@example.test`;
  const teacherBEmail = `teacher_b_${ts}@example.test`;

  await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Teacher Alpha",
      email: teacherAEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "Kafedra",
    }),
  });

  await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "Teacher Beta",
      email: teacherBEmail,
      password: "TeacherPass!2026",
      role: "teacher",
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      studentGroup: "Kafedra",
    }),
  });

  // Login Teacher A and create Group A
  const tALogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherAEmail, password: "TeacherPass!2026" }),
  });
  const tACookie = extractSessionCookie(tALogin);

  const grpARes = await fetch(`${baseUrl}/api/teacher/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: tACookie },
    body: JSON.stringify({
      name: `GRP-A-${ts % 1000}`,
      university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
      faculty: "Fizika fakulteti",
      description: "Teacher A group",
    }),
  });
  const groupAId = (await grpARes.json()).id;

  // Login Teacher B
  const tBLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherBEmail, password: "TeacherPass!2026" }),
  });
  const tBCookie = extractSessionCookie(tBLogin);

  // Teacher B attempts to delete Teacher A's group -> 403 Forbidden
  const deleteAttempt = await fetch(`${baseUrl}/api/teacher/groups?id=${groupAId}`, {
    method: "DELETE",
    headers: { Cookie: tBCookie },
  });
  assert.equal(deleteAttempt.status, 403, "Teacher B must not be permitted to delete Teacher A's group (IDOR)");

  // Teacher B lists groups -> Group A must not be visible in Teacher B's group list
  const tBGroups = await fetch(`${baseUrl}/api/teacher/groups`, {
    headers: { Cookie: tBCookie },
  });
  const tBGroupsData = await tBGroups.json();
  const hasGroupA = tBGroupsData.groups.some((g) => g.id === groupAId);
  assert.equal(hasGroupA, false, "Teacher B must not see Teacher A's isolated groups");
});

// ============================================================================
// TIER 4: Real-World Security & Attack Scenarios
// ============================================================================

test("Tier 4.1: Burp Suite proxy replay attack with modified User-Agent and IP (M1 target)", async () => {
  const ts = Date.now();
  const studentEmail = `replay_target_${ts}@example.test`;

  // 1. Legitimate user logs in with Client Context A
  const legitHeaders = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-Forwarded-For": "198.51.100.10",
  };

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: legitHeaders,
    body: JSON.stringify({
      fullName: "Legitimate User",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const legitCookie = extractSessionCookie(regRes);

  // 2. Legitimate request from same Client Context A succeeds
  const legitCheck = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: legitCookie,
      "User-Agent": legitHeaders["User-Agent"],
      "X-Forwarded-For": legitHeaders["X-Forwarded-For"],
    },
  });
  assert.equal(legitCheck.status, 200);

  // 3. Attacker (Burp Suite proxy replay) replays cookie from Client Context B (different User-Agent and IP)
  const attackerHeaders = {
    Cookie: legitCookie,
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) BurpSuite/2026.1",
    "X-Forwarded-For": "203.0.113.88",
  };

  const replayRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: attackerHeaders,
  });

  // Under M1 session hardening, client context mismatch must return 401 Unauthorized
  assert.equal(
    replayRes.status,
    401,
    "Burp Suite proxy cookie replay across mismatched client context must return 401 Unauthorized"
  );
});

test("Tier 4.2: Session token tampering (AES-256-GCM ciphertext, IV, tag bit-flip)", async () => {
  const ts = Date.now();
  const studentEmail = `tamper_target_${ts}@example.test`;

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.4.2" },
    body: JSON.stringify({
      fullName: "Tamper Target",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const rawCookie = getRawCookieValue(extractSessionCookie(regRes));
  assert.ok(rawCookie.startsWith("enc."));

  const parts = rawCookie.slice(4).split(".");
  assert.equal(parts.length, 3, "Encrypted cookie must contain iv.cipher.tag");
  const [iv, cipher, tag] = parts;

  // 1. Bit-flip in ciphertext
  const flippedCipher = cipher.slice(0, -1) + (cipher.slice(-1) === "a" ? "b" : "a");
  const tamperedCipherCookie = `fizikalab_session=enc.${iv}.${flippedCipher}.${tag}`;
  const cipherRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: tamperedCipherCookie },
  });
  assert.equal(cipherRes.status, 401, "Bit-flipped ciphertext must fail AES-GCM verification and return 401");

  // 2. Bit-flip in authentication tag
  const flippedTag = (tag[0] === "a" ? "b" : "a") + tag.slice(1);
  const tamperedTagCookie = `fizikalab_session=enc.${iv}.${cipher}.${flippedTag}`;
  const tagRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: tamperedTagCookie },
  });
  assert.equal(tagRes.status, 401, "Bit-flipped authentication tag must fail decryption and return 401");

  // 3. Corrupted / truncated IV
  const tamperedIvCookie = `fizikalab_session=enc.badiv.${cipher}.${tag}`;
  const ivRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: tamperedIvCookie },
  });
  assert.equal(ivRes.status, 401, "Corrupted IV must fail decryption and return 401");

  // 4. Plain forged non-GCM token
  const forgedRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: "fizikalab_session=forged-plain-token-string" },
  });
  assert.equal(forgedRes.status, 401, "Forged non-GCM token must return 401");
});

test("Tier 4.3: Token rotation reuse attack (replaying superseded rotated token) (M1 target)", async () => {
  const ts = Date.now();
  const studentEmail = `rotation_reuse_${ts}@example.test`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.4.3" },
    body: JSON.stringify({
      fullName: "Rotation Reuse Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const studentUser = (await regRes.json()).user;

  // 2. Generate token v1 with issuedAt 35s in the past to trigger rotation
  const tokenV1 = createEncryptedToken({
    sessionId: crypto.randomUUID(),
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-101",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  // 3. Call /api/auth/me with token v1 -> rotation occurs, issuing token v2
  const rotateMe = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${tokenV1}` },
  });
  assert.equal(rotateMe.status, 200);
  const tokenV2 = extractSessionCookie(rotateMe);
  assert.ok(tokenV2.length > 0);

  // 4. Attacker attempts to replay superseded token v1
  const reuseRes = await fetch(`${baseUrl}/api/reports`, {
    headers: { Cookie: `fizikalab_session=${tokenV1}` },
  });

  // Under M1 session rotation hardening, superseded token must be invalidated and return 401
  assert.equal(
    reuseRes.status,
    401,
    "Replaying superseded session token after rotation must return 401 Unauthorized"
  );
});

test("Tier 4.4: Role header injection and privilege escalation defense", async () => {
  const ts = Date.now();
  const studentEmail = `hdr_inject_${ts}@example.test`;

  // Authenticate as student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.4.4" },
    body: JSON.stringify({
      fullName: "Header Injection Tester",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  const studentCookie = extractSessionCookie(regRes);

  // Attempt privilege escalation to darksystem by injecting various administrative role headers
  const spoofedHeaders = {
    Cookie: studentCookie,
    "X-User-Role": "admin",
    "X-Role": "darksystem",
    "Role": "admin",
    "X-Forwarded-User": "admin",
  };

  const darkApiRes = await fetch(`${baseUrl}/api/darksystem/overview`, {
    headers: spoofedHeaders,
  });
  assert.equal(
    darkApiRes.status,
    404,
    "Role header injection attempt against darksystem API must be rejected with 404 (stealth)"
  );

  const darkPageRes = await fetch(`${baseUrl}/darksystem`, {
    headers: spoofedHeaders,
  });
  assert.equal(
    darkPageRes.status,
    404,
    "Role header injection attempt against darksystem page must be rejected with 404 (stealth)"
  );
});

test("Tier 4.5: Anti-admin Google OAuth privilege escalation rejection", async () => {
  // Google OAuth is strictly prohibited from authenticating the administrator email
  const gAdminRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockGoogleUser: {
        email: "tolqinovmahmudjon72@gmail.com",
        name: "Mahmudjon Tolqinov",
        googleId: `google-admin-hijack-${Date.now()}`,
        emailVerified: true,
      },
    }),
  });
  assert.equal(gAdminRes.status, 403, "Google Auth attempt with admin email must return 403 Forbidden");
  const gAdminData = await gAdminRes.json();
  assert.match(gAdminData.error, /Administrator/);
});

test("Tier 4.6: Credential stuffing burst attack and rate limit enforcement", async () => {
  const ts = Date.now();
  const targetEmail = `victim_brute_${ts}@example.test`;
  const attackerIp = "198.51.100.99";

  // Rapid burst of 25 failed login attempts with wrong password
  const burstResults = [];
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": attackerIp,
      },
      body: JSON.stringify({
        email: targetEmail,
        password: `WrongPassAttempt_${i}`,
      }),
    });
    burstResults.push(res.status);
  }

  // Requests exceeding threshold (limit 20) must trigger 429 Too Many Requests
  const has429 = burstResults.includes(429);
  assert.ok(
    has429,
    `Credential stuffing burst attack must trigger 429 Too Many Requests. Got statuses: ${burstResults.slice(-5).join(",")}`
  );
});

test("Tier 4.7: Stored and reflected XSS payload defense", async () => {
  const ts = Date.now();
  const xssEmail = `xss_tester_${ts}@example.test`;
  const xssScript = "<script>alert('xss-attack')</script>";
  const xssImg = "<img src=x onerror=alert('xss')>";

  // 1. Register student with script tag in fullName using isolated IP
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.4.7" },
    body: JSON.stringify({
      fullName: `Alisher ${xssScript}`,
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: xssEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const studentCookie = extractSessionCookie(regRes);

  // 2. Submit report with XSS payload in title and conclusion
  const repRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      labKey: "metrology",
      title: `Vernier ${xssScript}`,
      measurements: [],
      errorAnalysis: {},
      conclusion: `Xulosa: ${xssImg}`,
    }),
  });
  assert.equal(repRes.status, 201);

  // 3. Verify API returns Content-Type: application/json with nosniff header
  const getRep = await fetch(`${baseUrl}/api/reports`, {
    headers: { Cookie: studentCookie },
  });
  assert.equal(getRep.status, 200);
  assert.match(getRep.headers.get("content-type") || "", /application\/json/);
  assert.equal(getRep.headers.get("x-content-type-options"), "nosniff");
});

test("Tier 4.8: Information disclosure and reconnaissance defense", async () => {
  // 1. Probe health check: zero DB engine details
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  assert.equal(health.database, undefined, "/api/health must never disclose DB engine");

  // 2. Probe homepage HTML: zero leak of personal admin email
  const homeRes = await fetch(`${baseUrl}/`);
  assert.equal(homeRes.status, 200);
  const homeHtml = await homeRes.text();
  assert.equal(homeHtml.includes("tolqinovmahmudjon72@gmail.com"), false, "Admin email must not be in frontend HTML");
  assert.equal(homeHtml.includes("tolqinovmahmudjon72"), false, "Admin identifier must not leak");

  // 3. Probe non-existent API endpoint: zero leak of server directories or stack traces
  const deadRes = await fetch(`${baseUrl}/api/non-existent-secret-path`);
  const deadText = await deadRes.text();
  assert.equal(deadText.includes("/home/cyborg"), false, "Server filesystem paths must not be disclosed in errors");
});
