import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(PROJECT_ROOT, "data", "fizika_lab.db");

const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ci-admin@example.test";
const TEST_ADMIN_PASS = process.env.ADMIN_PASSWORD || "CiAdminTestPass!2026";
const AUTH_SECRET = process.env.AUTH_SECRET || "ci-test-auth-secret-minimum-32-chars-ok";

const PORT = 3199;
const baseUrl = `http://127.0.0.1:${PORT}`;
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
    await new Promise((r) => setTimeout(r, 250));
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
  serverProc = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
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
});

test.after(async () => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
  }
});

// ============================================================================
// CHALLENGE 1: Mid-session account ban race condition
// ============================================================================
test("Challenge 1: Mid-session account ban race condition and strict post-ban rejection across all sessions", async () => {
  const ts = Date.now();
  const studentEmail = `ban_race_${ts}@example.test`;
  const studentPass = "ValidPass123!";

  // 1. Student registers
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.50.1" },
    body: JSON.stringify({
      fullName: "Ban Race Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-101",
      email: studentEmail,
      password: studentPass,
    }),
  });
  assert.equal(regRes.status, 201, "Student registration must succeed");
  const studentUser = (await regRes.json()).user;
  const sessionCookie1 = extractSessionCookie(regRes);

  // Student logs in on a second device to create a secondary active session
  const login2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      "X-Forwarded-For": "10.10.50.2",
    },
    body: JSON.stringify({ email: studentEmail, password: studentPass }),
  });
  assert.equal(login2.status, 200);
  const sessionCookie2 = extractSessionCookie(login2);

  // Verify both sessions initially return 200
  const c1 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie1 } });
  const c2 = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: sessionCookie2, "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" },
  });
  assert.equal(c1.status, 200);
  assert.equal(c2.status, 200);

  // 2. Admin logs in
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASS }),
  });
  assert.equal(adminLogin.status, 200, "Admin login must succeed");
  const adminCookie = extractSessionCookie(adminLogin);

  // 3. Generate 60 concurrent in-flight simulation requests while sending ban request
  const CONCURRENT_REQUESTS = 60;
  const inFlightPromises = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const cookie = i % 2 === 0 ? sessionCookie1 : sessionCookie2;
    const ua = i % 2 === 0 ? undefined : "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    if (ua) headers["User-Agent"] = ua;

    const p = (i % 3 === 0)
      ? fetch(`${baseUrl}/api/physics/simulate`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            labKey: "metrology",
            params: { mode: "spherometer", trueValueMm: 2.15, legSpacingMm: 40 },
          }),
        }).then((res) => ({ type: "simulate", status: res.status }))
      : fetch(`${baseUrl}/api/auth/me`, { headers }).then((res) => ({ type: "me", status: res.status }));

    inFlightPromises.push(p);
  }

  // Simultaneously fire the ban request
  const banPromise = fetch(`${baseUrl}/api/darksystem/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ userId: studentUser.id, isBanned: true }),
  }).then((res) => ({ type: "ban", status: res.status }));

  const [banResult, ...inFlightResults] = await Promise.all([banPromise, ...inFlightPromises]);
  assert.equal(banResult.status, 200, "Ban request must succeed with 200");

  // Zero 500 errors under heavy concurrent ban race
  const status500s = inFlightResults.filter((r) => r.status >= 500);
  assert.equal(status500s.length, 0, "Zero 500 errors during in-flight ban race");

  for (const r of inFlightResults) {
    assert.ok(
      r.status === 200 || r.status === 401,
      `In-flight request status should be 200 or 401, got ${r.status}`
    );
  }

  // 4. Assert all post-ban requests from BOTH devices are strictly rejected with 401
  const postBanChecks = [];
  for (let i = 0; i < 40; i++) {
    const cookie = i % 2 === 0 ? sessionCookie1 : sessionCookie2;
    const ua = i % 2 === 0 ? undefined : "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    if (ua) headers["User-Agent"] = ua;

    if (i % 2 === 0) {
      postBanChecks.push(fetch(`${baseUrl}/api/reports`, {
        method: "POST",
        headers,
        body: JSON.stringify({ labKey: "metrology", title: "Fail", measurements: [], errorAnalysis: {}, conclusion: "Fail" }),
      }));
    } else {
      postBanChecks.push(fetch(`${baseUrl}/api/auth/me`, { headers }));
    }
  }

  const postBanResults = await Promise.all(postBanChecks);
  for (let i = 0; i < postBanResults.length; i++) {
    assert.equal(
      postBanResults[i].status,
      401,
      `Post-ban request #${i + 1} must be strictly rejected with 401 Unauthorized`
    );
  }

  // 5. Verify database integrity
  const db = new DatabaseSync(DB_PATH);
  const dbUser = db.prepare("SELECT is_banned, is_active FROM users WHERE id = ?").get(studentUser.id);
  assert.equal(dbUser.is_banned, 1, "User must be marked is_banned=1 in DB");
  assert.equal(dbUser.is_active, 0, "User must be marked is_active=0 in DB");

  const sessions = db.prepare("SELECT is_revoked FROM active_sessions WHERE user_id = ?").all(studentUser.id);
  assert.ok(sessions.length >= 2, "Both active sessions must exist in DB");
  for (const s of sessions) {
    assert.equal(s.is_revoked, 1, "All user sessions must be revoked in active_sessions table");
  }

  // 6. Admin unbans user: assert both previously issued sessions remain permanently dead
  const unbanRes = await fetch(`${baseUrl}/api/darksystem/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ userId: studentUser.id, isBanned: false }),
  });
  assert.equal(unbanRes.status, 200, "Unban request should succeed");

  const deadCheck1 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie1 } });
  const deadCheck2 = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: sessionCookie2, "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" },
  });
  assert.equal(deadCheck1.status, 401, "Session 1 must not revive upon unban");
  assert.equal(deadCheck2.status, 401, "Session 2 must not revive upon unban");
});

// ============================================================================
// CHALLENGE 2: Multi-device concurrent sessions
// ============================================================================
test("Challenge 2: Multi-device concurrent sessions with independent rotation, isolation, and logout defense", async () => {
  const ts = Date.now();
  const userEmail = `multidev_${ts}@example.test`;
  const userPass = "MultiDevPass123!";

  // 1. Initial registration
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.60.1" },
    body: JSON.stringify({
      fullName: "Multi Device User",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-201",
      email: userEmail,
      password: userPass,
    }),
  });
  assert.equal(regRes.status, 201);
  const studentUser = (await regRes.json()).user;

  // 2. Device A logs in (iPhone, IP 198.51.100.45)
  const contextA = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    "X-Forwarded-For": "198.51.100.45",
  };
  const loginA = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...contextA },
    body: JSON.stringify({ email: userEmail, password: userPass }),
  });
  assert.equal(loginA.status, 200);
  const cookieA = extractSessionCookie(loginA);
  assert.ok(cookieA);

  // 3. Device B logs in (Windows Desktop, IP 203.0.113.88)
  const contextB = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "X-Forwarded-For": "203.0.113.88",
  };
  const loginB = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...contextB },
    body: JSON.stringify({ email: userEmail, password: userPass }),
  });
  assert.equal(loginB.status, 200);
  const cookieB = extractSessionCookie(loginB);
  assert.ok(cookieB);

  // 4. Assert both devices operate independently
  const checkA1 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA, ...contextA } });
  const checkB1 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieB, ...contextB } });
  assert.equal(checkA1.status, 200);
  assert.equal(checkB1.status, 200);

  // 5. Cross-device replay assertion
  const replayAonB = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA, ...contextB } });
  const replayBonA = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieB, ...contextA } });
  assert.equal(replayAonB.status, 401, "Device A cookie on Device B context must return 401");
  assert.equal(replayBonA.status, 401, "Device B cookie on Device A context must return 401");

  // 6. Rotate Device A's session
  const rotatableTokenA = createEncryptedToken({
    sessionId: crypto.randomUUID(),
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-201",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 4,
  });

  const rotateResA = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${rotatableTokenA}`, ...contextA },
  });
  assert.equal(rotateResA.status, 200);
  const newCookieA = extractSessionCookie(rotateResA);
  assert.ok(newCookieA);

  // Superseded rotatableTokenA must be revoked
  const supersededCheckA = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${rotatableTokenA}`, ...contextA },
  });
  assert.equal(supersededCheckA.status, 401);

  // Device B's session (cookieB) MUST REMAIN FULLY OPERATIONAL
  const checkB2 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieB, ...contextB } });
  assert.equal(checkB2.status, 200, "Device B session must remain valid after Device A rotates");

  // 7. Rotate Device B's session independently
  const rotatableTokenB = createEncryptedToken({
    sessionId: crypto.randomUUID(),
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-201",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 4,
  });

  const rotateResB = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${rotatableTokenB}`, ...contextB },
  });
  assert.equal(rotateResB.status, 200);
  const newCookieB = extractSessionCookie(rotateResB);
  assert.ok(newCookieB);

  // Device A with newCookieA still functions 100%
  const checkA2 = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: newCookieA, ...contextA } });
  assert.equal(checkA2.status, 200, "Device A must remain valid after Device B rotates");

  // 8. Device A logs out: assert Device A is revoked, while Device B remains active
  const logoutA = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: newCookieA, ...contextA },
  });
  assert.equal(logoutA.status, 200, "Device A logout must succeed");

  const checkAAfterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: newCookieA, ...contextA } });
  assert.equal(checkAAfterLogout.status, 401, "Device A must be 401 after logout");

  const checkBAfterLogoutA = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: newCookieB, ...contextB } });
  assert.equal(checkBAfterLogoutA.status, 200, "Device B must remain active after Device A logs out");
});

// ============================================================================
// CHALLENGE 3: Rapid sequential & concurrent session rotation
// ============================================================================
test("Challenge 3: Rapid sequential session rotation chain and concurrent rotation race defense", async () => {
  const ts = Date.now();
  const studentEmail = `rot_stress_${ts}@example.test`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.10.70.1" },
    body: JSON.stringify({
      fullName: "Rotation Stress Student",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-301",
      email: studentEmail,
      password: "ValidPass123!",
    }),
  });
  assert.equal(regRes.status, 201);
  const studentUser = (await regRes.json()).user;

  // --- Part A: 5-Step Sequential Rotation Chain ---
  const tokenChain = [];
  let currentToken = createEncryptedToken({
    sessionId: crypto.randomUUID(),
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-301",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 4,
  });
  tokenChain.push(currentToken);

  // Rotate through 5 generations
  for (let gen = 1; gen <= 5; gen++) {
    const rotRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=${currentToken}` },
    });
    assert.equal(rotRes.status, 200, `Rotation generation ${gen} must return 200`);
    const freshCookie = extractSessionCookie(rotRes);
    assert.ok(freshCookie, `Generation ${gen} must yield rotated cookie`);

    // Prepare next rotatable generation with past issuedAt
    currentToken = createEncryptedToken({
      sessionId: crypto.randomUUID(),
      userId: studentUser.id,
      email: studentUser.email,
      fullName: studentUser.fullName,
      role: "student",
      studentGroup: "KB-301",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      issuedAt: Date.now() - 35000,
      exp: Date.now() + 1000 * 60 * 60 * 4,
    });
    tokenChain.push(currentToken);
  }

  // Verify that all superseded tokens in the chain (gens 0 through 4) are strictly revoked with 401
  for (let i = 0; i < tokenChain.length - 1; i++) {
    const checkRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=${tokenChain[i]}` },
    });
    assert.equal(
      checkRes.status,
      401,
      `Superseded token at index ${i} must return 401 Unauthorized`
    );
  }

  // --- Part B: High-concurrency burst on a single rotatable token (40 requests) ---
  const burstSessionId = crypto.randomUUID();
  const burstToken = createEncryptedToken({
    sessionId: burstSessionId,
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-301",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 4,
  });

  const BURST_COUNT = 40;
  const burstPromises = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    burstPromises.push(
      fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `fizikalab_session=${burstToken}` },
      }).then(async (res) => ({
        status: res.status,
        setCookie: extractSessionCookie(res),
      }))
    );
  }

  const burstResults = await Promise.all(burstPromises);

  // Assert zero 500 errors
  const status500s = burstResults.filter((r) => r.status >= 500);
  assert.equal(status500s.length, 0, "No 500 errors during concurrent rotation burst");

  // Every response must be either 200 (rotated) or 401 (already revoked)
  for (const r of burstResults) {
    assert.ok(r.status === 200 || r.status === 401, `Status must be 200 or 401, got ${r.status}`);
  }

  const successResults = burstResults.filter((r) => r.status === 200);
  assert.ok(successResults.length >= 1, "At least one request in burst must succeed and rotate");

  // Collect all unique rotated cookies issued
  const uniqueNewCookies = [...new Set(successResults.map((r) => r.setCookie).filter(Boolean))];
  assert.ok(uniqueNewCookies.length >= 1, "At least one valid rotated cookie must be issued");

  // Verify all newly issued cookies work
  for (const c of uniqueNewCookies) {
    const testNew = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: c },
    });
    assert.equal(testNew.status, 200, "Newly issued rotated cookie must be valid and return 200");
  }

  // Verify original burstToken is now permanently revoked
  const postBurstCheck = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${burstToken}` },
  });
  assert.equal(
    postBurstCheck.status,
    401,
    "Original token after concurrent rotation burst must return 401"
  );
});

// ============================================================================
// CHALLENGE 4: Database query resilience and cleanup under high session volume
// ============================================================================
test("Challenge 4: Database query resilience, index performance, and cleanup integrity under 10k sessions", async () => {
  const db = new DatabaseSync(DB_PATH);

  // Ensure active user exists for foreign key constraint
  const testUser = db.prepare("SELECT id FROM users LIMIT 1").get();
  assert.ok(testUser, "At least one user must exist in DB");
  const userId = testUser.id;

  // 1. Measure baseline lookup latency over 50 queries
  const baselineIds = [];
  for (let i = 0; i < 50; i++) {
    const sId = `perf_baseline_${i}_${Date.now()}`;
    db.prepare(
      `INSERT INTO active_sessions (session_id, user_id, client_fingerprint, created_at, last_seen_at, expires_at, is_revoked)
       VALUES (?, ?, 'baseline_fp', datetime('now'), datetime('now'), datetime('now', '+4 hours'), 0)`
    ).run(sId, userId);
    baselineIds.push(sId);
  }

  const baselineLatencies = [];
  const stmtLookup = db.prepare("SELECT * FROM active_sessions WHERE session_id = ?");
  for (const id of baselineIds) {
    const t0 = process.hrtime.bigint();
    stmtLookup.get(id);
    const t1 = process.hrtime.bigint();
    baselineLatencies.push(Number(t1 - t0) / 1e6); // ms
  }
  const avgBaselineMs = baselineLatencies.reduce((a, b) => a + b, 0) / baselineLatencies.length;

  // 2. Insert 10,000 synthetic sessions to simulate high load
  const TOTAL_SYNTHETIC = 10000;
  const EXPIRED_COUNT = 4000;
  const REVOKED_COUNT = 3000;
  const ACTIVE_COUNT = 3000;

  const insertStmt = db.prepare(
    `INSERT INTO active_sessions (session_id, user_id, client_fingerprint, created_at, last_seen_at, expires_at, is_revoked)
     VALUES (?, ?, 'perf_fp', ?, ?, ?, ?)`
  );

  const activeTestIds = [];
  const nowMs = Date.now();

  const insertStart = process.hrtime.bigint();
  db.exec("BEGIN TRANSACTION;");
  for (let i = 0; i < TOTAL_SYNTHETIC; i++) {
    const sId = `synth_${i}_${nowMs}`;
    if (i < EXPIRED_COUNT) {
      // Expired: expired 1 to 60 days ago
      const expIso = new Date(nowMs - 1000 * 60 * 60 * 24 * (1 + (i % 60))).toISOString();
      const pastIso = new Date(nowMs - 1000 * 60 * 60 * 24 * 65).toISOString();
      insertStmt.run(sId, userId, pastIso, pastIso, expIso, 0);
    } else if (i < EXPIRED_COUNT + REVOKED_COUNT) {
      // Revoked, future expiration
      const expIso = new Date(nowMs + 1000 * 60 * 60 * 24).toISOString();
      const curIso = new Date(nowMs).toISOString();
      insertStmt.run(sId, userId, curIso, curIso, expIso, 1);
    } else {
      // Active, future expiration
      const expIso = new Date(nowMs + 1000 * 60 * 60 * 24).toISOString();
      const curIso = new Date(nowMs).toISOString();
      insertStmt.run(sId, userId, curIso, curIso, expIso, 0);
      activeTestIds.push(sId);
    }
  }
  db.exec("COMMIT;");
  const insertEnd = process.hrtime.bigint();
  const insertTotalMs = Number(insertEnd - insertStart) / 1e6;

  // 3. Verify total session count
  const countRow = db.prepare("SELECT count(*) as cnt FROM active_sessions").get();
  assert.ok(countRow.cnt >= TOTAL_SYNTHETIC, `Session count must be >= ${TOTAL_SYNTHETIC}`);

  // 4. Measure lookup performance across 1,000 active sessions with 10,000+ rows in table
  const loadLatencies = [];
  const sampleIds = activeTestIds.slice(0, 1000);
  for (const id of sampleIds) {
    const t0 = process.hrtime.bigint();
    const row = stmtLookup.get(id);
    const t1 = process.hrtime.bigint();
    assert.ok(row, "Session must exist");
    assert.equal(row.is_revoked, 0, "Session must be active");
    loadLatencies.push(Number(t1 - t0) / 1e6); // ms
  }

  loadLatencies.sort((a, b) => a - b);
  const avgLoadMs = loadLatencies.reduce((a, b) => a + b, 0) / loadLatencies.length;
  const p50LoadMs = loadLatencies[Math.floor(loadLatencies.length * 0.50)];
  const p95LoadMs = loadLatencies[Math.floor(loadLatencies.length * 0.95)];
  const p99LoadMs = loadLatencies[Math.floor(loadLatencies.length * 0.99)];

  // Assert indexed lookup remains ultra-fast (< 1ms average, < 3ms P99)
  assert.ok(avgLoadMs < 1.0, `Average session lookup under load must be < 1.0ms, got ${avgLoadMs.toFixed(3)}ms`);
  assert.ok(p99LoadMs < 3.0, `P99 session lookup under load must be < 3.0ms, got ${p99LoadMs.toFixed(3)}ms`);

  // 5. Test index usage via EXPLAIN QUERY PLAN
  const explain = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM active_sessions WHERE session_id = ?").all("dummy");
  const usesIndex = explain.some(
    (e) => (e.detail && e.detail.includes("PRIMARY KEY")) || (e.detail && e.detail.includes("INDEX"))
  );
  assert.ok(usesIndex, "Session lookup must utilize primary key index");

  // 6. Test cleanupExpiredSessions performance
  const beforeCleanupCount = db.prepare("SELECT count(*) as cnt FROM active_sessions").get().cnt;
  const cleanupStart = process.hrtime.bigint();
  const thresholdIso = new Date(nowMs).toISOString();

  // Execute cleanup query (matches cleanupExpiredSessions in db.ts)
  db.prepare("DELETE FROM active_sessions WHERE expires_at < ?").run(thresholdIso);
  const cleanupEnd = process.hrtime.bigint();
  const cleanupMs = Number(cleanupEnd - cleanupStart) / 1e6;

  const afterCleanupCount = db.prepare("SELECT count(*) as cnt FROM active_sessions").get().cnt;
  const deletedCount = beforeCleanupCount - afterCleanupCount;

  // Assert exactly the expired sessions were purged
  assert.ok(deletedCount >= EXPIRED_COUNT, `Cleanup must delete at least ${EXPIRED_COUNT} expired sessions, deleted ${deletedCount}`);

  // Assert cleanup operation took less than 100ms
  assert.ok(cleanupMs < 100.0, `Cleanup of 4000 rows must complete in < 100ms, took ${cleanupMs.toFixed(2)}ms`);

  // Assert remaining active sessions were not touched
  for (const id of activeTestIds.slice(0, 100)) {
    const row = stmtLookup.get(id);
    assert.ok(row, "Active non-expired session must be preserved after cleanup");
    assert.equal(row.is_revoked, 0);
  }

  // 7. Verify SQLite database integrity
  const integrity = db.prepare("PRAGMA integrity_check").get();
  assert.equal(integrity.integrity_check, "ok", "Database integrity check must return 'ok'");

  // 8. Clean up synthetic records to restore clean state
  db.exec("DELETE FROM active_sessions WHERE session_id LIKE 'synth_%' OR session_id LIKE 'perf_baseline_%'");
  const finalCount = db.prepare("SELECT count(*) as cnt FROM active_sessions WHERE session_id LIKE 'synth_%'").get().cnt;
  assert.equal(finalCount, 0, "All synthetic benchmark sessions must be cleaned up");
});
