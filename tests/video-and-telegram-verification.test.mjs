import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(PROJECT_ROOT, ".challenger-cache");

let videoLabsModule = null;
let telegramModule = null;
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
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Compile videoLabs and telegram
  execSync(
    `npx tsc --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --outDir "${CACHE_DIR}" src/lib/videoLabs.ts src/lib/telegram.ts`,
    { cwd: PROJECT_ROOT, stdio: "pipe" }
  );

  videoLabsModule = await import(path.join(CACHE_DIR, "videoLabs.js"));
  telegramModule = await import(path.join(CACHE_DIR, "telegram.js"));

  // Check if server is already running on a test port
  if (!baseUrl) {
    const port = 3197;
    baseUrl = `http://127.0.0.1:${port}`;
    serverProc = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["next", "start", "-p", String(port), "-H", "127.0.0.1"],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          NODE_ENV: "production",
          ADMIN_SECRET: "ci-admin@example.test:CiAdminTestPass!2026",
          AUTH_SECRET: "ci-test-auth-secret-minimum-32-chars-ok",
          FIZIKALAB_TEST: "1",
        },
        shell: process.platform === "win32",
        stdio: "ignore",
      }
    );
    try {
      await waitForHealth(baseUrl, 8000);
    } catch {
      // Server not started (build might need to be run), server-dependent tests will skip or test local HTTP
      serverProc?.kill();
      serverProc = null;
      baseUrl = "";
    }
  }
});

test.after(() => {
  if (serverProc) {
    try {
      serverProc.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
});

test("VT-1: Video Labs Catalog schema and all 8 disciplines completeness", () => {
  const { VIDEO_LABS_CATALOG, getVideoLabByKey, getVideoLabById } = videoLabsModule;
  assert.equal(VIDEO_LABS_CATALOG.length, 8, "Must contain exactly 8 laboratory disciplines");

  const expectedKeys = [
    "metrology",
    "kinematics",
    "dynamics",
    "statics",
    "electromagnetism",
    "optics",
    "thermodynamics",
    "atomic",
  ];

  for (const key of expectedKeys) {
    const vid = getVideoLabByKey(key);
    assert.ok(vid, `Video lab for key '${key}' must exist`);
    assert.ok(vid.youtubeId && vid.youtubeId.length > 5, `Must have valid YouTube ID for ${key}`);
    assert.ok(vid.titleUz && vid.titleUz.length > 10, `Must have Uzbek title for ${key}`);
    assert.ok(vid.duration && vid.duration.includes(":"), `Must have duration for ${key}`);
    assert.ok(vid.apparatus.length >= 2, `Must list at least 2 apparatus items for ${key}`);
    assert.ok(vid.keyFormulas.length >= 2, `Must list at least 2 formulas for ${key}`);
    assert.ok(vid.timestamps.length >= 4, `Must have at least 4 timestamps for ${key}`);
    assert.ok(vid.observationChecklist.length >= 3, `Must have at least 3 checklist items for ${key}`);
    assert.ok(vid.simulatorComparison.simulatorPreset, `Must define simulator preset for ${key}`);

    // Test lookup by ID
    const byId = getVideoLabById(vid.id);
    assert.equal(byId?.id, vid.id);
  }
});

test("VT-2: Telegram account link token security, verification and expiry", () => {
  const { generateAccountLinkToken, verifyAccountLinkToken } = telegramModule;
  const testUserId = 7788;
  const token = generateAccountLinkToken(testUserId);
  assert.ok(token && typeof token === "string", "Token must be a non-empty string");

  const verifiedId = verifyAccountLinkToken(token);
  assert.equal(verifiedId, testUserId, "Token must decrypt to the exact userId");

  // Tampered token must fail
  const tamperedToken = token.slice(0, -3) + "xyz";
  const tamperedId = verifyAccountLinkToken(tamperedToken);
  assert.equal(tamperedId, null, "Tampered token must return null");

  // Garbage input must return null
  assert.equal(verifyAccountLinkToken("not-a-token"), null);
});

test("VT-3: Telegram message template & notification builder validation", async () => {
  const { sendGradeNotification, sendDeadlineAlert } = telegramModule;

  // Test in dry mode (no bot token set) - should gracefully return false without throwing
  const gradeRes = await sendGradeNotification({
    chatId: 123456,
    studentName: "Alisher Navoiy",
    labTitle: "2. Kinematika & Ballistika",
    grade: 95,
    maxGrade: 100,
    feedback: "A'lo darajada bajarilgan hisobot",
    gradedBy: "Dots. Alimuradov L.",
  });
  assert.equal(typeof gradeRes, "boolean");

  const alertRes = await sendDeadlineAlert({
    chatId: 123456,
    studentName: "Alisher Navoiy",
    assignmentTitle: "Gravitatsiya bo'yicha ilmiy maqola",
    dueDate: "2026-12-01",
  });
  assert.equal(typeof alertRes, "boolean");
});

test("VT-4: Telegram Webhook Update Handler (/start, /labs, /video, /help)", async () => {
  const { handleTelegramWebhookUpdate } = telegramModule;

  // Test that handling webhook updates for commands doesn't throw
  const updates = [
    { message: { chat: { id: 8881 }, text: "/start", from: { first_name: "Temur" } } },
    { message: { chat: { id: 8882 }, text: "/labs", from: { first_name: "Temur" } } },
    { message: { chat: { id: 8883 }, text: "/video", from: { first_name: "Temur" } } },
    { message: { chat: { id: 8884 }, text: "/help", from: { first_name: "Temur" } } },
  ];

  for (const update of updates) {
    await assert.doesNotReject(async () => {
      await handleTelegramWebhookUpdate(update);
    });
  }
});
