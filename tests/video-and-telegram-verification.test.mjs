import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(PROJECT_ROOT, ".challenger-cache");

let videoLabsModule = null;
let telegramModule = null;
let baseUrl = process.env.TEST_BASE_URL || "";
let serverProc = null;

const BOT_TOKEN = "9257020130:AAFDvOzhqary1N_fGt3Fb_kphQwF6GaBk4w";

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

  // Compile videoLabs, telegram and telegramLoginTokens
  execSync(
    `npx tsc --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --outDir "${CACHE_DIR}" src/lib/videoLabs.ts src/lib/telegramLoginTokens.ts src/lib/telegram.ts`,
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
          TELEGRAM_BOT_TOKEN: BOT_TOKEN,
          FIZIKALAB_TEST: "1",
        },
        shell: process.platform === "win32",
        stdio: "ignore",
      }
    );
    try {
      await waitForHealth(baseUrl, 8000);
    } catch {
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
  try {
    execSync("fuser -k 3197/tcp 2>/dev/null || true");
  } catch {}
});

test("VT-1: Video Labs Catalog schema and all 8 disciplines completeness with Google Drive", () => {
  const { VIDEO_LABS_CATALOG, getVideoLabByKey, getVideoLabById, getGoogleDriveViewUrl } = videoLabsModule;
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

    // Google Drive integration verification
    assert.ok(vid.googleDrivePreviewUrl, `Must define Google Drive preview link for ${key}`);
    assert.ok(
      vid.googleDrivePreviewUrl.includes("drive.google.com"),
      `Google Drive link must point to drive.google.com for ${key}`
    );

    const viewUrl = getGoogleDriveViewUrl(vid);
    assert.ok(viewUrl.endsWith("/view"), `getGoogleDriveViewUrl must convert preview to view URL for ${key}`);

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

  // Test notification builders gracefully return boolean without unhandled rejection
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

test("VT-4: Telegram Webhook Update Handler (/start, /labs, /video, /grades, /syllabus, /profile, /help)", async () => {
  const { handleTelegramWebhookUpdate } = telegramModule;

  const updates = [
    { message: { chat: { id: 8881 }, text: "/start", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8882 }, text: "/labs", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8883 }, text: "/video", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8883 }, text: "/video kinematics", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8883 }, text: "/video 2", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8884 }, text: "/grades", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8885 }, text: "/syllabus", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8886 }, text: "/profile", from: { first_name: "Mahmudjon" } } },
    { message: { chat: { id: 8887 }, text: "/help", from: { first_name: "Mahmudjon" } } },
    // Callback queries
    { callback_query: { id: "cq_1", message: { chat: { id: 8888 } }, data: "cmd_labs", from: { first_name: "Mahmudjon" } } },
    { callback_query: { id: "cq_2", message: { chat: { id: 8888 } }, data: "cmd_video", from: { first_name: "Mahmudjon" } } },
    { callback_query: { id: "cq_3", message: { chat: { id: 8888 } }, data: "vid_optics", from: { first_name: "Mahmudjon" } } },
  ];

  for (const update of updates) {
    await assert.doesNotReject(async () => {
      await handleTelegramWebhookUpdate(update);
    });
  }
});

test("VT-5: Telegram Login Widget HMAC-SHA256 signature verification", () => {
  const { verifyTelegramWidgetData } = telegramModule;

  const authDate = Math.floor(Date.now() / 1000);
  const widgetData = {
    id: 99887766,
    first_name: "Mahmudjon",
    last_name: "Tolqinov",
    username: "tolqinov",
    auth_date: authDate,
  };

  // Generate authentic HMAC-SHA256 hash using BOT_TOKEN
  const keys = Object.keys(widgetData).sort();
  const dataCheckString = keys.map((k) => `${k}=${widgetData[k]}`).join("\n");
  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const validHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // 1. Valid signature passes
  const validResult = verifyTelegramWidgetData({ ...widgetData, hash: validHash }, BOT_TOKEN);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.user?.id, 99887766);
  assert.equal(validResult.user?.username, "tolqinov");

  // 2. Tampered hash fails
  const tamperedResult = verifyTelegramWidgetData(
    { ...widgetData, hash: validHash.replace(/^[0-9a-f]{4}/, "0000") },
    BOT_TOKEN
  );
  assert.equal(tamperedResult.valid, false);

  // 3. Tampered data fails
  const tamperedDataResult = verifyTelegramWidgetData(
    { ...widgetData, first_name: "Hacker", hash: validHash },
    BOT_TOKEN
  );
  assert.equal(tamperedDataResult.valid, false);

  // 4. Missing required fields fails
  assert.equal(verifyTelegramWidgetData({ hash: validHash }, BOT_TOKEN).valid, false);

  // 5. Expired auth_date fails
  const expiredDate = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days ago
  const expiredData = { ...widgetData, auth_date: expiredDate };
  const expCheckString = Object.keys(expiredData).sort().map((k) => `${k}=${expiredData[k]}`).join("\n");
  const expHash = crypto.createHmac("sha256", secretKey).update(expCheckString).digest("hex");
  const expiredResult = verifyTelegramWidgetData({ ...expiredData, hash: expHash }, BOT_TOKEN);
  assert.equal(expiredResult.valid, false);
});

test("VT-6: Telegram WebApp initData HMAC-SHA256 signature verification", () => {
  const { verifyTelegramWebAppData } = telegramModule;

  const authDate = String(Math.floor(Date.now() / 1000));
  const rawParams = {
    auth_date: authDate,
    query_id: "AAG12345678",
    user: JSON.stringify({ id: 55443322, first_name: "Dilshod", username: "dilshod_phys" }),
  };

  const params = new URLSearchParams(rawParams);
  const entries = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const validHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  params.set("hash", validHash);
  const initData = params.toString();

  // 1. Valid initData passes
  const validResult = verifyTelegramWebAppData(initData, BOT_TOKEN);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.user?.id, 55443322);
  assert.equal(validResult.user?.username, "dilshod_phys");

  // 2. Tampered initData fails
  const tamperedInitData = initData.replace("dilshod_phys", "intruder");
  const tamperedResult = verifyTelegramWebAppData(tamperedInitData, BOT_TOKEN);
  assert.equal(tamperedResult.valid, false);

  // 3. Missing hash fails
  params.delete("hash");
  assert.equal(verifyTelegramWebAppData(params.toString(), BOT_TOKEN).valid, false);
});

test("VT-7: buildLabVideoCard generates rich academic video cards with YouTube and Google Drive", async () => {
  const { buildLabVideoCard } = telegramModule;

  const card = await buildLabVideoCard("kinematics", "https://fizika-lab-eta.vercel.app");
  assert.ok(card, "Card must not be null");
  assert.ok(card.text.includes("2D Ballistik To'p"), "Text must contain lab title");
  assert.ok(card.text.includes("Mexanika & Kinematika"), "Text must contain discipline");
  assert.ok(card.text.includes("Asosiy asbob-uskunalar"), "Text must describe apparatus");

  // Verify inline buttons have both YouTube and Google Drive URLs
  const buttons = card.replyMarkup.inline_keyboard.flat();
  const ytBtn = buttons.find((b) => b.text.includes("YouTube"));
  const driveBtn = buttons.find((b) => b.text.includes("Google Drive"));
  const webAppBtn = buttons.find((b) => b.text.includes("WebApp"));

  assert.ok(ytBtn && ytBtn.url && ytBtn.url.includes("youtube.com"), "Must provide YouTube URL");
  assert.ok(driveBtn && driveBtn.url && driveBtn.url.includes("drive.google.com"), "Must provide Google Drive URL");
  assert.ok(webAppBtn && webAppBtn.web_app?.url, "Must provide WebApp deep-link URL");
});

test("VT-8: Telegram Login API route /api/auth/telegram authentication and session issuance", async (t) => {
  if (!baseUrl) {
    t.skip("HTTP server is not running; skipping live endpoint test");
    return;
  }

  // 1. Authenticate with valid widget data
  const authDate = Math.floor(Date.now() / 1000);
  const testTgId = 11223344;
  const widgetData = {
    id: testTgId,
    first_name: "Azamat",
    last_name: "Karimov",
    username: "azamat_tuit",
    auth_date: authDate,
  };
  const keys = Object.keys(widgetData).sort();
  const dataCheckString = keys.map((k) => `${k}=${widgetData[k]}`).join("\n");
  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const validHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const res = await fetch(`${baseUrl}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...widgetData, hash: validHash }),
  });

  assert.equal(res.status, 200, "Must authenticate successfully with HTTP 200");
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.user?.fullName, "Azamat Karimov");

  // Verify session cookie was issued
  const sessionCookie = extractSessionCookie(res);
  assert.ok(sessionCookie, "Must set fizikalab_session cookie");

  // 2. Reject invalid hash
  const badRes = await fetch(`${baseUrl}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...widgetData, hash: "00112233445566778899aabbccddeeff" }),
  });
  assert.equal(badRes.status, 401, "Must reject invalid hash with 401");
});

test("VT-9: Telegram Deep-Link Login Token Generation, Bot Confirmation & Automatic Web Session Issuance", async () => {
  // 1. Web client requests a login token
  const tokenRes = await fetch(`${baseUrl}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_token" }),
  });
  assert.equal(tokenRes.status, 200);
  const tokenData = await tokenRes.json();
  assert.equal(tokenData.ok, true);
  assert.ok(tokenData.token, "Must return random login token");
  assert.ok(tokenData.botUrl.includes(tokenData.token), "botUrl must embed token");

  // 2. Checking before bot confirmation must return verified: false
  const unconfirmedRes = await fetch(`${baseUrl}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check_token", token: tokenData.token }),
  });
  assert.equal(unconfirmedRes.status, 200);
  const unconfirmedData = await unconfirmedRes.json();
  assert.equal(unconfirmedData.verified, false);

  // 3. User taps /start auth_<token> in Telegram Bot (processed by server webhook endpoint)
  const hookRes = await fetch(`${baseUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      update_id: 999991,
      message: {
        message_id: 101,
        from: {
          id: 77766655,
          first_name: "Sherzod",
          last_name: "Olimov",
          username: "sherzod_physics",
        },
        chat: { id: 77766655, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text: `/start auth_${tokenData.token}`,
      },
    }),
  });
  assert.equal(hookRes.status, 200);

  // 4. Web client polls check_token again, now verified and issues session cookie
  const verifiedRes = await fetch(`${baseUrl}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check_token", token: tokenData.token }),
  });
  assert.equal(verifiedRes.status, 200);
  const verifiedJson = await verifiedRes.json();
  assert.equal(verifiedJson.ok, true);
  assert.equal(verifiedJson.user?.fullName, "Sherzod Olimov");
  const cookie = extractSessionCookie(verifiedRes);
  assert.ok(cookie.includes("fizikalab_session="), "Must set session cookie for authenticated user");
});

test("VT-10: Dedicated /api/auth/telegram/session-token POST generation, polling pending, webhook /start login_<token>, and session issuance", async (t) => {
  if (!baseUrl) {
    t.skip("HTTP server is not running; skipping live endpoint test");
    return;
  }

  // 1. Generate 32-byte secure session token via POST /api/auth/telegram/session-token
  const postRes = await fetch(`${baseUrl}/api/auth/telegram/session-token`, {
    method: "POST",
  });
  assert.equal(postRes.status, 200, "Must return HTTP 200 on token generation");
  const postData = await postRes.json();
  assert.equal(postData.ok, true);
  assert.ok(postData.token, "Must return token string");
  assert.equal(postData.token.length, 64, "Token must be 32 bytes (64 hex characters)");
  assert.ok(postData.deepLink, "Must return deepLink");
  assert.ok(postData.deepLink.includes(`start=login_${postData.token}`), "Deep link must include login_<token>");

  // 2. Poll GET /api/auth/telegram/session-token?token=... before verification (pending status)
  const poll1Res = await fetch(`${baseUrl}/api/auth/telegram/session-token?token=${postData.token}`);
  assert.equal(poll1Res.status, 200);
  const poll1Data = await poll1Res.json();
  assert.equal(poll1Data.ok, true);
  assert.equal(poll1Data.status, "pending", "Status must be pending before user authorizes in bot");

  // 3. User opens Telegram bot with /start login_<token>
  const testUserId = 88990011;
  const webhookRes = await fetch(`${baseUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      update_id: 999992,
      message: {
        message_id: 102,
        from: {
          id: testUserId,
          first_name: "Farrux",
          last_name: "Turgunov",
          username: "farrux_phys_tuit",
        },
        chat: { id: testUserId, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text: `/start login_${postData.token}`,
      },
    }),
  });
  assert.equal(webhookRes.status, 200, "Webhook must acknowledge update with HTTP 200");

  // 4. Web client polls GET /api/auth/telegram/session-token?token=... again (now verified)
  const poll2Res = await fetch(`${baseUrl}/api/auth/telegram/session-token?token=${postData.token}`);
  assert.equal(poll2Res.status, 200);
  const poll2Data = await poll2Res.json();
  assert.equal(poll2Data.ok, true);
  assert.equal(poll2Data.status, "verified", "Status must become verified after Telegram webhook authorization");
  assert.ok(poll2Data.user, "Must return user object");
  assert.equal(poll2Data.user.fullName, "Farrux Turgunov");
  assert.equal(poll2Data.redirectUrl, "/labs/metrology", "Must provide redirect target");

  const sessionCookie = extractSessionCookie(poll2Res);
  assert.ok(sessionCookie.includes("fizikalab_session="), "Must issue secure fizikalab_session cookie");

  // 5. Replay attack prevention: second verification poll on claimed token must fail
  const replayRes = await fetch(`${baseUrl}/api/auth/telegram/session-token?token=${postData.token}`);
  assert.equal(replayRes.status, 400, "Claimed token must not be reusable and must reject with 400");
  const replayData = await replayRes.json();
  assert.equal(replayData.ok, false);
  assert.equal(replayData.status, "expired");
});

test("VT-11: Rejection of invalid, missing, and non-existent tokens on /api/auth/telegram/session-token", async (t) => {
  if (!baseUrl) {
    t.skip("HTTP server is not running; skipping live endpoint test");
    return;
  }

  // Missing token
  const noTokenRes = await fetch(`${baseUrl}/api/auth/telegram/session-token`);
  assert.equal(noTokenRes.status, 400, "Must return 400 when token query is missing");

  // Non-existent token
  const fakeTokenRes = await fetch(`${baseUrl}/api/auth/telegram/session-token?token=non_existent_token_1234567890`);
  assert.equal(fakeTokenRes.status, 400, "Must return 400 for non-existent token");
  const fakeData = await fakeTokenRes.json();
  assert.equal(fakeData.ok, false);
  assert.equal(fakeData.status, "expired");
});

test("VT-12: Telegram Callback Query Login Confirmation (confirm_login_<token>), Dual-Domain Host Headers & Expired Token Rejection", async (t) => {
  if (!baseUrl) {
    t.skip("HTTP server is not running; skipping live endpoint test");
    return;
  }

  // 1. Generate session token
  const postRes = await fetch(`${baseUrl}/api/auth/telegram/session-token`, {
    method: "POST",
  });
  assert.equal(postRes.status, 200);
  const { token } = await postRes.json();

  // 2. User confirms via Telegram Inline Button: callback_data = confirm_login_<token>
  // Simulate dual-domain environment via x-forwarded-host
  const cbUserId = 99887766;
  const cbWebhookRes = await fetch(`${baseUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-host": "fizika-lab.vercel.app",
      "x-forwarded-proto": "https",
    },
    body: JSON.stringify({
      update_id: 999993,
      callback_query: {
        id: "cb_query_test_123",
        from: {
          id: cbUserId,
          first_name: "Azizbek",
          last_name: "Qodirov",
          username: "azizbek_phys_bot",
        },
        message: {
          message_id: 105,
          chat: { id: cbUserId, type: "private" },
        },
        data: `confirm_login_${token}`,
      },
    }),
  });
  assert.equal(cbWebhookRes.status, 200, "Webhook must acknowledge callback query update");

  // 3. Web client polling gets verified status and cookie
  const pollRes = await fetch(`${baseUrl}/api/auth/telegram/session-token?token=${token}`);
  assert.equal(pollRes.status, 200);
  const pollData = await pollRes.json();
  assert.equal(pollData.ok, true);
  assert.equal(pollData.status, "verified");
  assert.equal(pollData.user?.fullName, "Azizbek Qodirov");
  assert.equal(pollData.user?.telegramUsername, "azizbek_phys_bot");
  const cookie = extractSessionCookie(pollRes);
  assert.ok(cookie.includes("fizikalab_session="), "Must set session cookie");

  // 4. Webhook with expired or invalid token gracefully sends notice without throwing
  const expiredWebhookRes = await fetch(`${baseUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      update_id: 999994,
      message: {
        message_id: 106,
        from: { id: cbUserId, first_name: "Azizbek" },
        chat: { id: cbUserId, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text: `/start login_expired_fake_token_random_123`,
      },
    }),
  });
  assert.equal(expiredWebhookRes.status, 200, "Expired token webhook must be acknowledged gracefully");
});

test("VT-13: Dual-Track (Uzbek OTM & English MIT/Pasco) Video Catalog and Google Drive verification", () => {
  const { VIDEO_LABS_CATALOG, getVideoLabByKey, getVideoLabTrack } = videoLabsModule;
  assert.equal(VIDEO_LABS_CATALOG.length, 8, "Must contain all 8 disciplines");

  for (const lab of VIDEO_LABS_CATALOG) {
    assert.ok(lab.tracks, `Lab '${lab.labKey}' must contain dual tracks`);
    assert.ok(lab.tracks.uz, `Lab '${lab.labKey}' must have Uzbek track`);
    assert.ok(lab.tracks.en, `Lab '${lab.labKey}' must have English track`);

    // Uzbek track checks
    const uz = lab.tracks.uz;
    assert.equal(uz.language, "uz");
    assert.ok(uz.title && uz.title.length > 5, `Uzbek track title must exist for ${lab.labKey}`);
    assert.ok(uz.institution && uz.institution.length > 3, `Uzbek institution must exist for ${lab.labKey}`);
    assert.ok(uz.youtubeId && uz.youtubeId.length > 5, `Uzbek YouTube ID must exist for ${lab.labKey}`);
    assert.ok(uz.googleDrivePreviewUrl.includes("drive.google.com"), `Uzbek Drive preview must exist for ${lab.labKey}`);
    assert.ok(uz.timestamps.length >= 4, `Uzbek track must have >= 4 timestamps for ${lab.labKey}`);

    // English track checks
    const en = lab.tracks.en;
    assert.equal(en.language, "en");
    assert.ok(en.title && en.title.length > 5, `English track title must exist for ${lab.labKey}`);
    assert.ok(en.institution && en.institution.length > 3, `English institution must exist for ${lab.labKey}`);
    assert.ok(en.youtubeId && en.youtubeId.length > 5, `English YouTube ID must exist for ${lab.labKey}`);
    assert.ok(en.googleDrivePreviewUrl.includes("drive.google.com"), `English Drive preview must exist for ${lab.labKey}`);
    assert.ok(en.timestamps.length >= 4, `English track must have >= 4 timestamps for ${lab.labKey}`);

    // Helper function getVideoLabTrack
    if (getVideoLabTrack) {
      const helperUz = getVideoLabTrack(lab, "uz");
      assert.equal(helperUz.language, "uz");
      const helperEn = getVideoLabTrack(lab, "en");
      assert.equal(helperEn.language, "en");
    }
  }
});

