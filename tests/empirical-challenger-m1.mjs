import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const TEST_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ci-admin@example.test";
const TEST_ADMIN_PASS = process.env.ADMIN_PASSWORD || "CiAdminTestPass!2026";
const AUTH_SECRET = process.env.AUTH_SECRET || "ci-test-auth-secret-minimum-32-chars-ok";

const PORT = 3198;
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
  // Check if server is already running on port
  try {
    const check = await fetch(`${baseUrl}/api/health`);
    if (check.ok) return;
  } catch {
    // not running, spawn
  }

  serverProc = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
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
    shell: process.platform === "win32",
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
// ATTACK 1: Burp Suite Cookie Replay Across Client Contexts
// ============================================================================

test("Attack 1: Burp Suite cookie replay across different client contexts", async (t) => {
  const ts = Date.now();
  const studentEmail = `challenger_replay_${ts}@example.test`;

  const legitContext = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ip: "198.51.100.10",
  };

  // 1. Legitimate user registers from Context A
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": legitContext.userAgent,
      "X-Forwarded-For": legitContext.ip,
    },
    body: JSON.stringify({
      fullName: "Legit Challenger",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-401",
      email: studentEmail,
      password: "StrongChallengerPass!2026",
    }),
  });
  assert.equal(regRes.status, 201, `Registration must succeed (got ${regRes.status})`);
  const legitCookie = extractSessionCookie(regRes);
  assert.ok(legitCookie.startsWith("fizikalab_session=enc."));

  // 2. Legitimate request from same Context A succeeds
  const meLegit = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: legitCookie,
      "User-Agent": legitContext.userAgent,
      "X-Forwarded-For": legitContext.ip,
    },
  });
  assert.equal(meLegit.status, 200, "Legitimate request must return HTTP 200");
  const meLegitData = await meLegit.json();
  assert.equal(meLegitData.user.email, studentEmail.toLowerCase());

  // Sub-attack 1.1: Burp Suite altered User-Agent
  await t.test("1.1 Altered User-Agent (BurpSuite signature) with same IP", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) BurpSuite/2026.1",
        "X-Forwarded-For": legitContext.ip,
      },
    });
    assert.equal(res.status, 401, "Altered User-Agent must be rejected with 401");
  });

  // Sub-attack 1.2: Python requests automated replay
  await t.test("1.2 Altered User-Agent (python-requests script) with same IP", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": "python-requests/2.31.0",
        "X-Forwarded-For": legitContext.ip,
      },
    });
    assert.equal(res.status, 401, "Altered User-Agent (python-requests) must be rejected with 401");
  });

  // Sub-attack 1.3: Completely empty User-Agent
  await t.test("1.3 Stripped / Empty User-Agent with same IP", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": "",
        "X-Forwarded-For": legitContext.ip,
      },
    });
    assert.equal(res.status, 401, "Empty User-Agent must be rejected with 401");
  });

  // Sub-attack 1.4: Altered Public IP in X-Forwarded-For (different public /24 subnet)
  await t.test("1.4 Altered Public IP (203.0.113.88) with same User-Agent", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": legitContext.userAgent,
        "X-Forwarded-For": "203.0.113.88",
      },
    });
    assert.equal(res.status, 401, "Altered Public IP must be rejected with 401");
  });

  // Sub-attack 1.5: Altered Public IP in same AS but different /24 subnet (198.51.200.10)
  await t.test("1.5 Altered Public IP in different subnet (198.51.200.10)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": legitContext.userAgent,
        "X-Forwarded-For": "198.51.200.10",
      },
    });
    assert.equal(res.status, 401, "Different subnet IP must be rejected with 401");
  });

  // Sub-attack 1.6: Dual altered User-Agent and Public IP
  await t.test("1.6 Dual altered User-Agent and Public IP", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "X-Forwarded-For": "198.18.0.5",
      },
    });
    assert.equal(res.status, 401, "Dual altered context must be rejected with 401");
  });

  // Sub-attack 1.7: Replay against protected business route /api/reports
  await t.test("1.7 Stolen cookie replayed against /api/reports from attacker context", async () => {
    const res = await fetch(`${baseUrl}/api/reports`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) BurpSuite/2026.1",
        "X-Forwarded-For": "203.0.113.88",
      },
    });
    assert.equal(res.status, 401, "Replay against /api/reports must return 401");
  });

  // Sub-attack 1.8: Replay against /api/physics/simulate from attacker context
  await t.test("1.8 Stolen cookie replayed against /api/physics/simulate from attacker context", async () => {
    const res = await fetch(`${baseUrl}/api/physics/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: legitCookie,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) BurpSuite/2026.1",
        "X-Forwarded-For": "203.0.113.88",
      },
      body: JSON.stringify({
        labKey: "kinematics",
        params: { mode: "projectile", v0: 10, angleDeg: 45, y0: 0, gravity: 9.8 },
      }),
    });
    assert.equal(res.status, 401, "Replay against /api/physics/simulate must return 401");
  });

  // Sub-attack 1.9: Verify legitimate user is NOT locked out after attacker's replay attempts
  await t.test("1.9 Legitimate user access succeeds after attack (No False-Positive Lockout)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: legitCookie,
        "User-Agent": legitContext.userAgent,
        "X-Forwarded-For": legitContext.ip,
      },
    });
    assert.equal(res.status, 200, "Legitimate client context must still return 200");
  });
});

// ============================================================================
// ATTACK 2: Token Tampering (Bit-flip Ciphertext, Tag, Corrupt IV)
// ============================================================================

test("Attack 2: Token tampering (bit-flip ciphertext, auth tag, corrupted IV, malformed)", async (t) => {
  const ts = Date.now();
  const studentEmail = `challenger_tamper_${ts}@example.test`;

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.20.1.1" },
    body: JSON.stringify({
      fullName: "Tamper Challenger",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-402",
      email: studentEmail,
      password: "StrongChallengerPass!2026",
    }),
  });
  assert.equal(regRes.status, 201);
  const rawCookie = getRawCookieValue(extractSessionCookie(regRes));
  assert.ok(rawCookie.startsWith("enc."));

  const [iv, cipher, tag] = rawCookie.slice(4).split(".");
  assert.ok(iv && cipher && tag);

  // 2.1 Ciphertext bit-flipping
  await t.test("2.1.1 Flip last character of ciphertext", async () => {
    const flipped = cipher.slice(0, -1) + (cipher.slice(-1) === "a" ? "b" : "a");
    const tampered = `fizikalab_session=enc.${iv}.${flipped}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Flipped ciphertext must fail AES-GCM decryption with 401");
  });

  await t.test("2.1.2 Flip first character of ciphertext", async () => {
    const flipped = (cipher[0] === "a" ? "b" : "a") + cipher.slice(1);
    const tampered = `fizikalab_session=enc.${iv}.${flipped}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Flipped first ciphertext character must return 401");
  });

  await t.test("2.1.3 Flip middle character of ciphertext", async () => {
    const mid = Math.floor(cipher.length / 2);
    const flipped = cipher.slice(0, mid) + (cipher[mid] === "x" ? "y" : "x") + cipher.slice(mid + 1);
    const tampered = `fizikalab_session=enc.${iv}.${flipped}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Flipped middle ciphertext character must return 401");
  });

  // 2.2 Auth Tag character flipping
  await t.test("2.2.1 Flip first character of authentication tag", async () => {
    const flipped = (tag[0] === "a" ? "b" : "a") + tag.slice(1);
    const tampered = `fizikalab_session=enc.${iv}.${cipher}.${flipped}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Flipped authentication tag character must return 401");
  });

  await t.test("2.2.2 Flip last character of authentication tag", async () => {
    const flipped = tag.slice(0, -1) + (tag.slice(-1) === "z" ? "0" : "z");
    const tampered = `fizikalab_session=enc.${iv}.${cipher}.${flipped}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Flipped last tag character must return 401");
  });

  await t.test("2.2.3 Truncate authentication tag", async () => {
    const truncatedTag = tag.slice(0, 10);
    const tampered = `fizikalab_session=enc.${iv}.${cipher}.${truncatedTag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Truncated tag must return 401");
  });

  // 2.3 Corrupt IV
  await t.test("2.3.1 Truncate IV", async () => {
    const badIv = "short";
    const tampered = `fizikalab_session=enc.${badIv}.${cipher}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Truncated IV must return 401");
  });

  await t.test("2.3.2 Corrupt IV bytes with invalid base64 characters", async () => {
    const badIv = "inv@lid-iv!#$";
    const tampered = `fizikalab_session=enc.${badIv}.${cipher}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Invalid base64 characters in IV must return 401");
  });

  await t.test("2.3.3 Bit-flip in valid IV", async () => {
    const flippedIv = (iv[0] === "A" ? "B" : "A") + iv.slice(1);
    const tampered = `fizikalab_session=enc.${flippedIv}.${cipher}.${tag}`;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: tampered } });
    assert.equal(res.status, 401, "Bit-flipped IV must return 401");
  });

  // 2.4 Structural tampering and non-canonical payloads
  await t.test("2.4.1 Forged plain token string without enc. prefix", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: "fizikalab_session=eyJhbGciOiJIUzI1NiJ9.plain.token" },
    });
    assert.equal(res.status, 401, "Non-enc prefix token must return 401");
  });

  await t.test("2.4.2 Incomplete parts (enc.iv.cipher with missing tag)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=enc.${iv}.${cipher}` },
    });
    assert.equal(res.status, 401, "Incomplete 2-part token must return 401");
  });

  await t.test("2.4.3 Extra parts (enc.iv.cipher.tag.extra)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=enc.${iv}.${cipher}.${tag}.extra` },
    });
    assert.equal(res.status, 401, "4-part token must return 401");
  });

  await t.test("2.4.4 Empty session cookie value", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: "fizikalab_session=" },
    });
    assert.equal(res.status, 401, "Empty cookie must return 401");
  });
});

// ============================================================================
// ATTACK 3: Token Rotation Reuse Attack
// ============================================================================

test("Attack 3: Token rotation reuse attack (replay old token after rotation)", async (t) => {
  const ts = Date.now();
  const studentEmail = `challenger_rotation_${ts}@example.test`;

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.20.1.2" },
    body: JSON.stringify({
      fullName: "Rotation Challenger",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-403",
      email: studentEmail,
      password: "StrongChallengerPass!2026",
    }),
  });
  assert.equal(regRes.status, 201);
  const studentUser = (await regRes.json()).user;

  // 2. Generate token V1 with issuedAt 35s in the past (exceeding 30s rotation window)
  const sessionIdV1 = crypto.randomUUID();
  const tokenV1 = createEncryptedToken({
    sessionId: sessionIdV1,
    userId: studentUser.id,
    email: studentUser.email,
    fullName: studentUser.fullName,
    role: "student",
    studentGroup: "KB-403",
    university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
    faculty: "Kiberxavfsizlik fakulteti",
    issuedAt: Date.now() - 35000,
    exp: Date.now() + 1000 * 60 * 60 * 4,
  });

  // 3. Trigger rotation by calling /api/auth/me with Token V1
  const rotateMe = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `fizikalab_session=${tokenV1}` },
  });
  assert.equal(rotateMe.status, 200, "Rotation request with Token V1 must return 200");
  const tokenV2Cookie = extractSessionCookie(rotateMe);
  assert.ok(tokenV2Cookie.startsWith("fizikalab_session="), "Server must issue new rotated session token");
  const tokenV2 = getRawCookieValue(tokenV2Cookie);
  assert.notEqual(tokenV1, tokenV2, "Token V2 must be different from Token V1");

  // 4. Attack 3.1: Attacker attempts to replay superseded Token V1 on /api/auth/me
  await t.test("3.1 Replay superseded Token V1 on /api/auth/me", async () => {
    const reuseRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=${tokenV1}` },
    });
    assert.equal(
      reuseRes.status,
      401,
      `Superseded Token V1 on /api/auth/me must return 401 Unauthorized (got ${reuseRes.status})`
    );
  });

  // 5. Attack 3.2: Attacker attempts to replay superseded Token V1 on /api/reports
  await t.test("3.2 Replay superseded Token V1 on /api/reports", async () => {
    const reuseRes = await fetch(`${baseUrl}/api/reports`, {
      headers: { Cookie: `fizikalab_session=${tokenV1}` },
    });
    assert.equal(
      reuseRes.status,
      401,
      `Superseded Token V1 on /api/reports must return 401 Unauthorized (got ${reuseRes.status})`
    );
  });

  // 6. Attack 3.3: Attacker attempts to replay superseded Token V1 on /api/physics/simulate
  await t.test("3.3 Replay superseded Token V1 on /api/physics/simulate", async () => {
    const reuseRes = await fetch(`${baseUrl}/api/physics/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `fizikalab_session=${tokenV1}`,
      },
      body: JSON.stringify({
        labKey: "metrology",
        params: { mode: "vernier", trueValueMm: 10, leastCountMm: 0.02, zeroErrorMm: 0 },
      }),
    });
    assert.equal(
      reuseRes.status,
      401,
      `Superseded Token V1 on /api/physics/simulate must return 401 Unauthorized (got ${reuseRes.status})`
    );
  });

  // 7. Legitimate client uses newly issued Token V2
  await t.test("3.4 Legitimate client uses newly issued Token V2 successfully", async () => {
    const legitRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=${tokenV2}` },
    });
    assert.equal(legitRes.status, 200, `Legitimate client with Token V2 must return 200 (got ${legitRes.status})`);
    const legitData = await legitRes.json();
    assert.equal(legitData.user.email, studentEmail.toLowerCase());
  });

  // 8. Repeated replay of superseded Token V1 continues to be rejected
  await t.test("3.5 Repeated replay of superseded Token V1 still returns 401", async () => {
    const repeatRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `fizikalab_session=${tokenV1}` },
    });
    assert.equal(repeatRes.status, 401, "Repeated replay of Token V1 must consistently return 401");
  });
});

// ============================================================================
// ATTACK 4: Post-Logout Replay
// ============================================================================

test("Attack 4: Post-logout replay (capture cookie, call /api/auth/logout, then replay)", async (t) => {
  const ts = Date.now();
  const studentEmail = `challenger_logout_${ts}@example.test`;

  // 1. Register student and capture session cookie
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.20.1.3" },
    body: JSON.stringify({
      fullName: "Logout Challenger",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-404",
      email: studentEmail,
      password: "StrongChallengerPass!2026",
    }),
  });
  assert.equal(regRes.status, 201);
  const capturedCookie = extractSessionCookie(regRes);
  assert.ok(capturedCookie.startsWith("fizikalab_session=enc."));

  // 2. Confirm cookie is valid prior to logout
  const meBefore = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: capturedCookie },
  });
  assert.equal(meBefore.status, 200, "Cookie must be valid before logout (got 200)");

  // 3. Perform logout
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: capturedCookie },
  });
  assert.equal(logoutRes.status, 200, "Logout endpoint must return 200 OK");
  const clearCookieHeader = logoutRes.headers.get("set-cookie") || "";
  assert.match(clearCookieHeader, /Max-Age=0/i, "Logout must return Set-Cookie with Max-Age=0");

  // 4. Attack 4.1: Replay captured cookie to /api/auth/me
  await t.test("4.1 Replay captured cookie to /api/auth/me after logout", async () => {
    const replayMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: capturedCookie },
    });
    assert.equal(
      replayMe.status,
      401,
      `Replaying logged-out cookie to /api/auth/me must return 401 Unauthorized (got ${replayMe.status})`
    );
  });

  // 5. Attack 4.2: Replay captured cookie to /api/reports
  await t.test("4.2 Replay captured cookie to /api/reports after logout", async () => {
    const replayReports = await fetch(`${baseUrl}/api/reports`, {
      headers: { Cookie: capturedCookie },
    });
    assert.equal(
      replayReports.status,
      401,
      `Replaying logged-out cookie to /api/reports must return 401 Unauthorized (got ${replayReports.status})`
    );
  });

  // 6. Attack 4.3: Replay captured cookie to /api/physics/simulate
  await t.test("4.3 Replay captured cookie to /api/physics/simulate after logout", async () => {
    const replaySim = await fetch(`${baseUrl}/api/physics/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: capturedCookie,
      },
      body: JSON.stringify({
        labKey: "kinematics",
        params: { mode: "projectile", v0: 15, angleDeg: 30, y0: 0, gravity: 9.8 },
      }),
    });
    assert.equal(
      replaySim.status,
      401,
      `Replaying logged-out cookie to /api/physics/simulate must return 401 Unauthorized (got ${replaySim.status})`
    );
  });
});

// ============================================================================
// BASELINE & FALSE-POSITIVE PREVENTION
// ============================================================================

test("Baseline: Legitimate client continuity and false-positive immunity", async (t) => {
  const ts = Date.now();
  const studentEmail = `challenger_legit_${ts}@example.test`;

  const clientUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
  const initialIp = "198.51.100.12";

  // 1. Register student
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": clientUA,
      "X-Forwarded-For": initialIp,
    },
    body: JSON.stringify({
      fullName: "Immunity Challenger",
      university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
      faculty: "Kiberxavfsizlik fakulteti",
      studentGroup: "KB-405",
      email: studentEmail,
      password: "StrongChallengerPass!2026",
    }),
  });
  assert.equal(regRes.status, 201);
  const cookie = extractSessionCookie(regRes);

  // 2. Sequential requests from exact same client context
  await t.test("5.1 Sequential requests from same client context succeed without lockouts", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: cookie,
          "User-Agent": clientUA,
          "X-Forwarded-For": initialIp,
        },
      });
      assert.equal(res.status, 200, `Sequential request ${i + 1} must return 200`);
    }
  });

  // 3. Intra-subnet roaming within same /24 network (e.g. 198.51.100.12 -> 198.51.100.88)
  await t.test("5.2 Client roaming within same /24 subnet does not trigger false positive lockout", async () => {
    const roamingIp = "198.51.100.88";
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: cookie,
        "User-Agent": clientUA,
        "X-Forwarded-For": roamingIp,
      },
    });
    assert.equal(res.status, 200, "Intra-subnet roaming must succeed with HTTP 200 without false positive");
  });

  // 4. Access protected functional endpoints
  await t.test("5.3 Access protected report submission and simulation", async () => {
    const simRes = await fetch(`${baseUrl}/api/physics/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "User-Agent": clientUA,
        "X-Forwarded-For": initialIp,
      },
      body: JSON.stringify({
        labKey: "metrology",
        params: { mode: "micrometer", trueValueMm: 15.25, zeroErrorMm: 0 },
      }),
    });
    assert.equal(simRes.status, 200);

    const reportRes = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "User-Agent": clientUA,
        "X-Forwarded-For": initialIp,
      },
      body: JSON.stringify({
        labKey: "metrology",
        title: "False-Positive Test Report",
        measurements: [{ label: "d", primaryValue: 15.25, unit: "mm" }],
        errorAnalysis: { n: 1, mean: 15.25 },
        conclusion: "Sessiya faol va barqaror.",
      }),
    });
    assert.equal(reportRes.status, 201);
  });
});
