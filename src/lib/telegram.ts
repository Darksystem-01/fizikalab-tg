/**
 * FizikaLab - Telegram Bot Integratsiya Moduli
 *
 * O'zbekiston oliy ta'lim tizimi (TATU / HEMIS / universitetlar) uchun Telegram
 * orqali talabalarga akademik baholar, topshiriq eslatmalari, yangiliklar va
 * Telegram WebApp (Mini App) orqali simulyatorlar hamda tajriba stendlari
 * videolarini (YouTube & Google Drive) to'g'ridan-to'g'ri taqdim etish.
 */

import crypto from "crypto";
import type { VideoLabDefinition } from "./videoLabs";

async function confirmTelegramLoginTokenAsync(
  token: string,
  user: {
    id: number | string;
    firstName: string;
    lastName: string;
    username: string;
    photoUrl?: string;
  }
): Promise<boolean> {
  try {
    const mod = await import("./telegramLoginTokens");
    if (typeof mod.confirmTelegramLoginTokenAsync === "function") {
      return await mod.confirmTelegramLoginTokenAsync(token, user);
    }
    return mod.confirmTelegramLoginToken(token, user);
  } catch {
    try {
      const dynamicImport = new Function("p", "return import(p)");
      const mod = await dynamicImport("./telegramLoginTokens.js");
      if (typeof mod.confirmTelegramLoginTokenAsync === "function") {
        return await mod.confirmTelegramLoginTokenAsync(token, user);
      }
      return mod.confirmTelegramLoginToken(token, user);
    } catch {
      return false;
    }
  }
}

async function getVideoLabByKeyAsync(labKey: string): Promise<VideoLabDefinition | null> {
  try {
    const mod = await import("./videoLabs");
    return mod.getVideoLabByKey(labKey) || null;
  } catch {
    try {
      const dynamicImport = new Function("p", "return import(p)");
      const mod = await dynamicImport("./videoLabs.js");
      return mod.getVideoLabByKey(labKey) || null;
    } catch {
      return null;
    }
  }
}

async function getDatabase() {
  try {
    const mod = await import("./db");
    return await mod.getDb();
  } catch {
    return null;
  }
}

export interface TelegramSendMessageOptions {
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}

export interface TelegramWidgetAuthData {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
}

export interface TelegramVerificationResult {
  valid: boolean;
  user?: {
    id: number | string;
    firstName: string;
    lastName: string;
    username: string;
    photoUrl: string;
    authDate: number;
  };
  error?: string;
}

export function getTelegramBotToken(): string {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    return token.slice(1, -1).trim();
  }
  return token;
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }
  return "https://fizika-lab-eta.vercel.app";
}

/**
 * Xavfsiz bir martalik hisob bog'lash (Account Linking) tokenini yaratadi
 */
export function generateAccountLinkToken(userId: number): string {
  const secret = process.env.SESSION_SECRET || "fizikalab-default-secret-token-2026";
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Account linking tokenini tekshiradi va userId ni qaytaradi
 */
export function verifyAccountLinkToken(token: string): number | null {
  try {
    const secret = process.env.SESSION_SECRET || "fizikalab-default-secret-token-2026";
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userIdStr, timestampStr, hmac] = decoded.split(":");
    if (!userIdStr || !timestampStr || !hmac) return null;

    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(userId) || isNaN(timestamp)) return null;

    // Token 24 soat amal qiladi
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;

    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(`${userId}:${timestamp}`)
      .digest("hex")
      .slice(0, 16);

    if (hmac !== expectedHmac) return null;
    return userId;
  } catch {
    return null;
  }
}

const ALLOWED_WIDGET_KEYS = new Set([
  "auth_date",
  "first_name",
  "id",
  "last_name",
  "photo_url",
  "username",
]);

/**
 * Telegram Login Widget ma'lumotlarini HMAC-SHA256 orqali tekshirish
 * https://core.telegram.org/widgets/login
 */
export function verifyTelegramWidgetData(
  data: Record<string, any>,
  botTokenOverride?: string
): TelegramVerificationResult {
  const token = botTokenOverride || getTelegramBotToken();
  if (!token) {
    return { valid: false, error: "Bot token sozlanmagan" };
  }

  const hash = String(data.hash || "");
  if (!hash || data.id === undefined || data.id === null || !data.auth_date) {
    return { valid: false, error: "Majburiy maydonlar (id, auth_date, hash) yetishmaydi" };
  }

  // auth_date tekshiruvi (0 bo'lmasligi, kelajakdagi soxta vaqt va 7 kundan oshmasligi kerak)
  const authTimestamp = Number(data.auth_date);
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    isNaN(authTimestamp) ||
    authTimestamp <= 0 ||
    authTimestamp > nowSec + 300 ||
    nowSec - authTimestamp > 86400 * 7
  ) {
    return { valid: false, error: "Telegram autentifikatsiya muddati o'tgan yoki yaroqsiz" };
  }

  // Tartiblangan data-check-string (faqat Telegram tomonidan imzolangan ruxsat etilgan kalitlar)
  const keys = Object.keys(data).filter(
    (k) =>
      ALLOWED_WIDGET_KEYS.has(k) &&
      data[k] !== undefined &&
      data[k] !== null &&
      data[k] !== ""
  );
  keys.sort();

  const dataCheckString = keys.map((k) => `${k}=${data[k]}`).join("\n");
  const secretKey = crypto.createHash("sha256").update(token).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash.length !== hash.length || !/^[0-9a-fA-F]{64}$/.test(hash)) {
    return { valid: false, error: "Imzo (hash) uzunligi yoki formati mos kelmadi" };
  }

  const hashBuf = Buffer.from(hash, "hex");
  const calcBuf = Buffer.from(calculatedHash, "hex");
  if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
    return { valid: false, error: "Telegram imzosi haqiqiy emas" };
  }

  return {
    valid: true,
    user: {
      id: data.id,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      username: data.username || "",
      photoUrl: data.photo_url || "",
      authDate: authTimestamp,
    },
  };
}

/**
 * Telegram WebApp (Mini App) initData ma'lumotlarini HMAC-SHA256 orqali tekshirish
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function verifyTelegramWebAppData(
  initData: string,
  botTokenOverride?: string
): TelegramVerificationResult {
  const token = botTokenOverride || getTelegramBotToken();
  if (!token) {
    return { valid: false, error: "Bot token sozlanmagan" };
  }

  if (!initData || typeof initData !== "string") {
    return { valid: false, error: "initData bo'sh" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-fA-F]{64}$/.test(hash)) {
    return { valid: false, error: "initData ichida hash parametri topilmadi yoki yaroqsiz" };
  }

  const authDate = Number(params.get("auth_date") || 0);
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    !authDate ||
    isNaN(authDate) ||
    authDate <= 0 ||
    authDate > nowSec + 300 ||
    nowSec - authDate > 86400 * 7
  ) {
    return { valid: false, error: "Telegram WebApp ma'lumotlar muddati o'tgan yoki yaroqsiz" };
  }

  params.delete("hash");
  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    entries.push([key, value]);
  });
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash.length !== hash.length) {
    return { valid: false, error: "Imzo (hash) uzunligi mos kelmadi" };
  }

  const hashBuf = Buffer.from(hash, "hex");
  const calcBuf = Buffer.from(calculatedHash, "hex");
  if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
    return { valid: false, error: "Telegram WebApp imzosi haqiqiy emas" };
  }

  let userObj: any = null;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      userObj = JSON.parse(userRaw);
    } catch {}
  }

  if (!userObj || !userObj.id) {
    return {
      valid: false,
      error: "Telegram WebApp foydalanuvchi ma'lumotlari (user obyekti) topilmadi",
    };
  }

  return {
    valid: true,
    user: {
      id: userObj.id,
      firstName: userObj.first_name || "",
      lastName: userObj.last_name || "",
      username: userObj.username || "",
      photoUrl: userObj.photo_url || "",
      authDate,
    },
  };
}

/**
 * Har bir laboratoriya uchun akademik video kartasi va tugmalari (YouTube & Google Drive)
 */
export async function buildLabVideoCard(
  labKey: string,
  appUrl: string
): Promise<{ text: string; replyMarkup: any } | null> {
  const vid = await getVideoLabByKeyAsync(labKey);
  if (!vid) return null;

  const apparatusList = vid.apparatus
    .slice(0, 3)
    .map((a) => `• <b>${a.name}</b> — <i>${a.purpose}</i>`)
    .join("\n");

  const driveViewUrl =
    vid.googleDrivePreviewUrl?.replace(/\/preview$/, "/view") || "https://drive.google.com";
  const youtubeUrl = `https://www.youtube.com/watch?v=${vid.youtubeId}`;

  const text = `
🎥 <b>Laboratoriya Tajriba Stendi: ${vid.titleUz}</b>

🏛 <b>Yo‘nalish:</b> ${vid.discipline}
⏱ <b>Davomiyligi:</b> ${vid.duration}

📋 <b>Eksperiment qisqacha mazmuni:</b>
${vid.summaryUz}

🔬 <b>Asosiy asbob-uskunalar va stend elementlari:</b>
${apparatusList}

🎯 <b>Akademik maqsad:</b>
<i>«${vid.academicObjective}»</i>

📁 <b>Google Drive to‘g‘ridan-to‘g‘ri havola:</b> <a href="${driveViewUrl}">${driveViewUrl}</a>
🎥 <b>YouTube video dars:</b> <a href="${youtubeUrl}">${youtubeUrl}</a>

💡 <i>Ushbu tajribani YouTube yoki Google Drive orqali tomosha qilishingiz, yoki FizikaLab WebApp-da virtual simulyator bilan parallel bajarishingiz mumkin:</i>
`.trim();

  const uzTrack = vid.tracks?.uz;
  const enTrack = vid.tracks?.en;
  const uzYtUrl = uzTrack?.youtubeId ? `https://www.youtube.com/watch?v=${uzTrack.youtubeId}` : youtubeUrl;
  const enYtUrl = enTrack?.youtubeId ? `https://www.youtube.com/watch?v=${enTrack.youtubeId}` : youtubeUrl;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "🇺🇿 O‘zbekcha Dars", url: uzYtUrl },
        { text: "🇬🇧 English Lab (MIT)", url: enYtUrl },
      ],
      [
        { text: "🎥 YouTube orqali", url: youtubeUrl },
        { text: "📁 Google Drive orqali", url: driveViewUrl },
      ],
      [
        {
          text: "🚀 WebApp-da Stendni Ochish",
          web_app: { url: `${appUrl}/labs/${vid.labKey}` },
        },
      ],
    ],
  };

  return { text, replyMarkup };
}

/**
 * Telegram Bot API orqali xabar yuborish
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<boolean> {
  const token = getTelegramBotToken();
  if (!token) {
    console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN o‘rnatilmagan. Xabar yuborilmadi:", {
      chatId,
      preview: text.slice(0, 60),
    });
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    };

    if (options?.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }
    if (options?.disableWebPagePreview !== undefined) {
      body.disable_web_page_preview = options.disableWebPagePreview;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.error("[TelegramBot] sendMessage xatosi:", err);
    return false;
  }
}

/**
 * Ustoz hisobotni baholaganida talabaga akademik push bildirishnoma yuborish
 */
export async function sendGradeNotification({
  chatId,
  studentName,
  labTitle,
  grade,
  maxGrade = 100,
  feedback,
  gradedBy,
}: {
  chatId: string | number;
  studentName: string;
  labTitle: string;
  grade: number;
  maxGrade?: number;
  feedback?: string;
  gradedBy?: string;
}): Promise<boolean> {
  const appUrl = getAppUrl();
  const gradePct = Math.round((grade / maxGrade) * 100);
  const gradeBadge =
    gradePct >= 90
      ? "🌟 A'lo (A)"
      : gradePct >= 80
      ? "✅ Yaxshi (B)"
      : gradePct >= 70
      ? "⚠️ Qoniqarli (C)"
      : "❌ Qayta topshirish talab etiladi";

  const message = `
🔔 <b>Laboratoriya hisoboti tekshirildi va baholandi!</b>

Hurmatli <b>${studentName}</b>, ustozingiz sizning laboratoriya ishingizni tekshirdi:

📚 <b>Mavzu:</b> ${labTitle}
🎯 <b>Baho:</b> <code>${grade} / ${maxGrade} ball (${gradePct}%)</code> — <b>${gradeBadge}</b>
👨‍🏫 <b>Tekshiruvchi o‘qituvchi:</b> ${gradedBy || "Fizika kafedrasi o‘qituvchisi"}

${feedback ? `💬 <b>Ustoz taqrizi va izohi:</b>\n<i>«${feedback}»</i>\n` : ""}
👉 <i>Batafsil tahlil, xatoliklar taqsimoti va yakuniy xulosani WebApp orqali ko‘rishingiz mumkin:</i>
`;

  return sendTelegramMessage(chatId, message.trim(), {
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Natijani WebApp-da Ochish",
            web_app: { url: `${appUrl}/reports` },
          },
        ],
        [
          {
            text: "🌐 Brauzerda Ko‘rish",
            url: `${appUrl}/reports`,
          },
        ],
      ],
    },
  });
}

/**
 * Topshiriq topshirish muddati (deadline) yaqinlashganda eslatma
 */
export async function sendDeadlineAlert({
  chatId,
  studentName,
  assignmentTitle,
  dueDate,
}: {
  chatId: string | number;
  studentName: string;
  assignmentTitle: string;
  dueDate: string;
}): Promise<boolean> {
  const appUrl = getAppUrl();
  const message = `
⏳ <b>Akademik eslatma: Laboratoriya hisobotini topshirish muddati yaqinlashmoqda!</b>

Hurmatli <b>${studentName}</b>!
Kafedra o‘quv grafigiga muvofiq, quyidagi topshiriqning yakuniy muddati belgilangan:

📝 <b>Topshiriq mavzusi:</b> ${assignmentTitle}
📅 <b>Oxirgi muddat:</b> <code>${dueDate}</code>

Iltimos, o‘z vaqtida o‘lchov protokoli, xatoliklar tahlili va yakuniy xulosani FizikaLab tizimiga yuklang!
`;

  return sendTelegramMessage(chatId, message.trim(), {
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "✍️ Topshiriqni Bajarish (WebApp)",
            web_app: { url: `${appUrl}/assignments` },
          },
        ],
      ],
    },
  });
}

/**
 * Telegram Webhook orqali kelgan buyruqlar va hodisalarni qayta ishlash
 */
export async function handleTelegramWebhookUpdate(
  update: any,
  appUrlOverride?: string
): Promise<void> {
  if (!update) return;

  const appUrl = (appUrlOverride || getAppUrl()).replace(/\/$/, "");
  const db = await getDatabase();

  // 1. Callback Query qayta ishlash
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id || cb.from?.id;
    const data = String(cb.data || "");
    const token = getTelegramBotToken();

    if (token && cb.id) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cb.id }),
        });
      } catch {}
    }

    if (!chatId) return;

    if (data.startsWith("confirm_login_")) {
      const loginToken = data.replace("confirm_login_", "");
      await confirmTelegramLoginTokenAsync(loginToken, {
        id: chatId,
        firstName: cb.from?.first_name || "Talaba",
        lastName: cb.from?.last_name || "",
        username: cb.from?.username || "",
      });
      await sendTelegramMessage(
        chatId,
        "✅ <b>FizikaLab platformasiga kirish tasdiqlandi!</b>\n\nBrauzeringizdagi oyna orqali shaxsiy kabinetga ulanishingiz mumkin.",
        {
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 FizikaLab WebApp-ni Ochish",
                  web_app: { url: appUrl },
                },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data.startsWith("vid_")) {
      const key = data.replace("vid_", "");
      const card = await buildLabVideoCard(key, appUrl);
      if (card) {
        await sendTelegramMessage(chatId, card.text, { replyMarkup: card.replyMarkup });
      }
      return;
    }

    if (data === "cmd_labs") {
      update.message = { chat: { id: chatId }, text: "/labs", from: cb.from };
    } else if (data === "cmd_video") {
      update.message = { chat: { id: chatId }, text: "/video", from: cb.from };
    } else if (data === "cmd_grades") {
      update.message = { chat: { id: chatId }, text: "/grades", from: cb.from };
    } else if (data === "cmd_syllabus") {
      update.message = { chat: { id: chatId }, text: "/syllabus", from: cb.from };
    } else if (data === "cmd_profile") {
      update.message = { chat: { id: chatId }, text: "/profile", from: cb.from };
    } else if (data === "cmd_help") {
      update.message = { chat: { id: chatId }, text: "/help", from: cb.from };
    } else if (data === "cmd_start") {
      update.message = { chat: { id: chatId }, text: "/start", from: cb.from };
    }
  }

  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat?.id;
  const rawText = msg.text?.trim() || "";
  // Buyruq oxiridagi @botname suffiksini olib tashlaymiz (masalan: /labs@Fizikatuitbot -> /labs)
  const text = rawText.replace(/^(\/[a-zA-Z0-9_]+)@[a-zA-Z0-9_]+bot\b/i, "$1");
  const username = msg.from?.username || "";
  const firstName = msg.from?.first_name || "Talaba";

  if (!chatId) return;

  // 1. /start [link_token | auth_token]
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const param = parts[1];

    // Saytga parolsiz kirish (Deep-Link login token tasdiqlash)
    if (param && (param.startsWith("auth_") || param.startsWith("login_"))) {
      const token = param.replace(/^(auth_|login_)/, "");
      const ok = await confirmTelegramLoginTokenAsync(token, {
        id: chatId,
        firstName: firstName,
        lastName: msg.from?.last_name || "",
        username: username,
      });

      if (ok) {
        const authConfirmMsg = `
🔐 <b>FizikaLab — Saytga Kirish Muvaffaqiyatli Tasdiqlandi!</b>

Assalomu alaykum, <b>${firstName}</b>!
Brauzeringizdagi FizikaLab platformasiga kirish so‘rovingiz qabul qilindi va tasdiqlandi.

Sizning brauzeringiz avtomatik tarzda shaxsiy kabinetga ulanmoqda.
`;
        await sendTelegramMessage(chatId, authConfirmMsg.trim(), {
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "✅ FizikaLab platformasiga kirishni tasdiqlaysizmi?",
                  callback_data: `confirm_login_${token}`,
                },
              ],
              [
                {
                  text: "🚀 FizikaLab WebApp-ni Ochish",
                  web_app: { url: appUrl },
                },
              ],
            ],
          },
        });
        return;
      } else {
        await sendTelegramMessage(
          chatId,
          "⚠️ <b>Kirish kodi eskirgan yoki allaqachon foydalanilgan.</b>\n\nIltimos, FizikaLab saytida «Yangi kod olish» tugmasini bosing va qaytadan kiring.",
          {
            replyMarkup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 FizikaLab Saytiga O‘tish",
                    web_app: { url: appUrl },
                  },
                ],
              ],
            },
          }
        );
        return;
      }
    }

    if (param && param.startsWith("link_")) {
      const token = param.replace("link_", "");
      const userId = verifyAccountLinkToken(token);

      if (userId && db) {
        await db.execute(
          `UPDATE users SET telegram_chat_id = $1, telegram_username = $2 WHERE id = $3`,
          [String(chatId), username, userId]
        );

        const user = await db.queryOne<{
          full_name: string;
          university: string;
          faculty: string;
          student_group: string;
        }>(
          `SELECT full_name, university, faculty, student_group FROM users WHERE id = $1`,
          [userId]
        );

        const welcomeLinked = `
🏛 <b>FizikaLab Akademik Portali — Profil Bog‘landi</b>

Assalomu alaykum, <b>${user?.full_name || firstName}</b>!
Sizning Telegram hisobingiz <b>FizikaLab Akademik Tizimi</b> bilan muvaffaqiyatli bog‘landi.

🏛 <b>OTM:</b> ${user?.university || "Toshkent axborot texnologiyalari universiteti"}
🏢 <b>Fakultet:</b> ${user?.faculty || "Kompyuter injiniringi"}
👥 <b>Akademik guruh:</b> ${user?.student_group || "Talaba"}

Endi siz:
🔔 Barcha laboratoriya baholaringiz va ustoz taqrizlarini;
⏳ Topshiriq muddatlari (deadline) va eslatmalarini;
🎥 Haqiqiy tajriba stendlari video darslari hamda o‘lchov protokollarini
to‘g‘ridan-to‘g‘ri Telegram orqali qabul qilasiz.
`;
        await sendTelegramMessage(chatId, welcomeLinked.trim(), {
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 FizikaLab WebApp-ni Ochish",
                  web_app: { url: appUrl },
                },
              ],
              [
                {
                  text: "📊 Baholarim",
                  callback_data: "cmd_grades",
                },
                {
                  text: "🔬 Laboratoriyalar",
                  callback_data: "cmd_labs",
                },
              ],
            ],
          },
        });
        return;
      }
    }

    // Oddiy /start
    const welcomeGeneral = `
🏛 <b>FizikaLab — Akademik Virtual Fizika Laboratoriyasi</b>

Assalomu alaykum, <b>${firstName}</b>!
Toshkent axborot texnologiyalari universiteti (TATU) va O‘zbekiston OTMlari talabalari uchun yaratilgan FizikaLab rasmiy ilmiy-o‘quv botiga xush kelibsiz.

Ushbu platforma orqali siz umumiy fizika kursining barcha bo‘limlari bo‘yicha 2D/3D interaktiv stendlarda tajribalar o‘tkazishingiz, real asboblar videolarini tomosha qilishingiz va hisobot topshirishingiz mumkin.

<b>Akademik buyruqlar:</b>
/labs — Barcha 8 ta laboratoriya stendlari katalogi
/video — Haqiqiy tajriba stendlari videolari (YouTube & Google Drive)
/grades — Talaba laboratoriya baholari va hisobotlar arxivi
/syllabus — Fizika fani rasmiy sillabusi va adabiyotlar
/profile — Akademik profil ma’lumotlari va guruh
/help — Yo‘riqnoma va kafedra ma’lumotlari

Platformani bevosita Telegram ichida to‘liq ochishingiz mumkin:
`;
    await sendTelegramMessage(chatId, welcomeGeneral.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "🚀 FizikaLab WebApp-ni Ochish",
              web_app: { url: appUrl },
            },
          ],
          [
            {
              text: "🎥 Real Video Darslar",
              web_app: { url: `${appUrl}/video-labs` },
            },
            {
              text: "📚 O‘quv Sillabusi",
              web_app: { url: `${appUrl}/syllabus` },
            },
          ],
          [
            {
              text: "🔬 Laboratoriyalar",
              callback_data: "cmd_labs",
            },
            {
              text: "📊 Baholarim",
              callback_data: "cmd_grades",
            },
          ],
        ],
      },
    });
    return;
  }

  // 2. /labs
  if (text === "/labs") {
    const labsMsg = `
📚 <b>FizikaLab Akademik Laboratoriya Stendlari Ro‘yxati:</b>

1. <b>Metrologiya va Asboblar</b> — Shtangensirkul (0.02 mm), mikrometr (0.01 mm), sferometr va Styudent statistik noaniqlik tahlili
2. <b>Kinematika & Ballistika</b> — 2D trayektoriya, gorizontga burchak ostida otilgan jism, Runge-Kutta (RK4) havo qarshiligi modeli
3. <b>Dinamika & Mayatniklar</b> — Qiya tekislikda ishqalanish, Atvud stendi, Kater mayatnigi va erkin tushish tezlanishi (g)
4. <b>Statika & Muvozanat</b> — 360° kuchlar stoli, vektorlar yig‘indisi va nuqtaviy jism barqaror muvozanat shartlari
5. <b>Elektromagnetizm</b> — Uitston va Metrli ko‘prik, MNA elektr matritsasi, moddalarning solishtirma qarshiligi (ρ)
6. <b>Optika & Interferensiya</b> — Yupqa linzalar, Nyuton halqalari interferensiyasi, Koshi dispersiyasi n(λ)
7. <b>Molekulyar Fizika & Termodinamika</b> — Ideal gaz qonunlari, Boyl-Mariott izotermik siqilish apparati, Karno sikli
8. <b>Kvant & Atom Fizikasi</b> — Tashqi fotoeffekt hodisasi, Eynshteyn tenglamasi va Plank doimiysi (h)

Stendni tanlang va bevosita simulyatorga kiring:
`;
    await sendTelegramMessage(chatId, labsMsg.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "1. Metrologiya", web_app: { url: `${appUrl}/labs/metrology` } },
            { text: "2. Kinematika", web_app: { url: `${appUrl}/labs/kinematics` } },
          ],
          [
            { text: "3. Dinamika", web_app: { url: `${appUrl}/labs/dynamics` } },
            { text: "4. Statika", web_app: { url: `${appUrl}/labs/statics` } },
          ],
          [
            { text: "5. Elektr", web_app: { url: `${appUrl}/labs/electromagnetism` } },
            { text: "6. Optika", web_app: { url: `${appUrl}/labs/optics` } },
          ],
          [
            { text: "7. Termodinamika", web_app: { url: `${appUrl}/labs/thermodynamics` } },
            { text: "8. Atom/Yadro", web_app: { url: `${appUrl}/labs/atomic` } },
          ],
        ],
      },
    });
    return;
  }

  // 3. /video [key]
  if (text.startsWith("/video")) {
    const parts = text.split(" ");
    const requestedKey = parts[1]?.toLowerCase();

    // Agar ma'lum laboratoriya so'ralgan bo'lsa (masalan: /video kinematics yoki /video 2)
    const keyMap: Record<string, string> = {
      "1": "metrology",
      "2": "kinematics",
      "3": "dynamics",
      "4": "statics",
      "5": "electromagnetism",
      "6": "optics",
      "7": "thermodynamics",
      "8": "atomic",
    };

    const targetKey = requestedKey ? keyMap[requestedKey] || requestedKey : null;

    if (targetKey) {
      const card = await buildLabVideoCard(targetKey, appUrl);
      if (card) {
        await sendTelegramMessage(chatId, card.text, { replyMarkup: card.replyMarkup });
        return;
      }
    }

    // Umumiy /video ro'yxati va stendlari
    const videoOverview = `
🎥 <b>Haqiqiy Universitet Tajriba Stendlari Video Darslari</b>

FizikaLab platformasidagi barcha 8 ta laboratoriya mavzusi bo‘yicha real laboratoriya xonalarida olingan yuqori aniqlikdagi tajriba videolari:
• O‘lchash asboblarining kalibrovkasi va nol xatolikni tuzatish;
• Datchiklar va fototaymerlar ko‘rsatkichlarini fiksatsiya qilish;
• Eksperimental ma’lumotlarni virtual simulyator modellari bilan taqqoslash.

Barcha videolarni <b>YouTube</b> yoki <b>Google Drive</b> orqali ko‘rishingiz, yoki FizikaLab WebApp-da simulyator bilan yonma-yon ishlatishingiz mumkin:
`;
    await sendTelegramMessage(chatId, videoOverview.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "1. Metrologiya", callback_data: "vid_metrology" },
            { text: "2. Kinematika", callback_data: "vid_kinematics" },
          ],
          [
            { text: "3. Dinamika", callback_data: "vid_dynamics" },
            { text: "4. Statika", callback_data: "vid_statics" },
          ],
          [
            { text: "5. Elektr", callback_data: "vid_electromagnetism" },
            { text: "6. Optika", callback_data: "vid_optics" },
          ],
          [
            { text: "7. Termodinamika", callback_data: "vid_thermodynamics" },
            { text: "8. Atom/Yadro", callback_data: "vid_atomic" },
          ],
          [
            {
              text: "🎬 To‘liq Video Laboratoriyani Ochish",
              web_app: { url: `${appUrl}/video-labs` },
            },
          ],
        ],
      },
    });
    return;
  }

  // 4. /grades
  if (text === "/grades") {
    if (!db) {
      await sendTelegramMessage(chatId, "⚠️ Ma'lumotlar bazasi vaqtincha mavjud emas.");
      return;
    }

    const linkedUser = await db.queryOne<{
      id: number;
      full_name: string;
      university: string;
      student_group: string;
    }>(
      `SELECT id, full_name, university, student_group FROM users WHERE telegram_chat_id = $1`,
      [String(chatId)]
    );

    if (!linkedUser) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Sizning Telegram profilingiz hali FizikaLab talaba hisobiga ulanmagan.\n\nProfilingizni ulash uchun FizikaLab saytida <b>Talaba Profili</b> bo'limiga kiring va «Telegramni Ulash» tugmasini bosing!`,
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: "🔑 Profilga O‘tish", web_app: { url: `${appUrl}/profile` } }],
            ],
          },
        }
      );
      return;
    }

    const reports = await db.queryAll<{
      title: string;
      grade: number | null;
      status: string;
      submitted_at: string;
    }>(
      `SELECT title, grade, status, submitted_at
       FROM lab_reports
       WHERE user_id = $1
       ORDER BY id DESC
       LIMIT 5`,
      [linkedUser.id]
    );

    if (reports.length === 0) {
      await sendTelegramMessage(
        chatId,
        `📊 Hurmatli <b>${linkedUser.full_name}</b> (${linkedUser.student_group}), sizda hali topshirilgan laboratoriya hisobotlari mavjud emas.`,
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: "✍️ Laboratoriyani Boshlash", web_app: { url: `${appUrl}/labs/metrology` } }],
            ],
          },
        }
      );
      return;
    }

    let reportListText = `📊 <b>${linkedUser.full_name}</b>ning so‘nggi laboratoriya hisobotlari:\n\n`;
    for (const r of reports) {
      const statusIcon = r.grade !== null ? "✅" : "⏳";
      const gradeStr = r.grade !== null ? `<b>${r.grade} ball</b>` : "<i>Tekshirilmoqda</i>";
      reportListText += `${statusIcon} <b>${r.title}</b>\n   Natija: ${gradeStr}\n\n`;
    }

    await sendTelegramMessage(chatId, reportListText.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [{ text: "📑 Barcha Baholarni Ko‘rish", web_app: { url: `${appUrl}/reports` } }],
        ],
      },
    });
    return;
  }

  // 5. /syllabus
  if (text === "/syllabus") {
    const syllabusMsg = `
📚 <b>Umumiy Fizika Fani Akademik O‘quv Dasturi (Sillabus)</b>

🏛 <b>Kafedra:</b> Umumiy va nazariy fizika kafedrasi
🎯 <b>Kredit hajmi:</b> 4 ECTS krediti (120 akademik soat)
⏳ <b>Taqsimot:</b> 30 soat ma’ruza, 30 soat laboratoriya amaliyoti, 60 soat mustaqil ta’lim

<b>Semestr o‘quv modullari:</b>
1. <b>Metrologiya va o‘lchash texnikasi:</b> Asboblar noaniqligi, tasodifiy va tizimli xatoliklar, Styudent koeffitsiyenti.
2. <b>Kinematika va dinamika asoslari:</b> Moddiy nuqta harakati, 2D ballistik trayektoriya, havo qarshiligi differensial tenglamasi (RK4).
3. <b>Statik muvozanat va tebranishlar:</b> Kuchlar stoli, vektorlar muvozanati, garmonik va so‘nuvchi tebranishlar, Kater mayatnigi.
4. <b>Elektromagnetizm:</b> O‘zgarmas tok qonunlari, Uitston va metrli ko‘prik, MNA elektr zanjirlari, solishtirma qarshilik.
5. <b>To‘lqin optikasi:</b> Yorug‘lik interferensiyasi, yupqa qatlamlar va Nyuton halqalari, dispersiya va difraksiya panjarasi.
6. <b>Molekulyar fizika va termodinamika:</b> Gaz qonunlari, Boyl-Mariott izotermasi, p-V diagrammalar, termodinamikaning 1- va 2-qonunlari.
7. <b>Kvant va yadro fizikasi:</b> Fotoeffekt hodisasi, Eynshteyn tenglamasi, Plank doimiysi va chiqish ishi.

📖 <b>Asosiy o‘quv adabiyotlari:</b>
• I.V. Savelyev — Umumiy fizika kursi (1, 2, 3-jildlar)
• D. Halliday, R. Resnick, J. Walker — Fundamentals of Physics (10th ed.)
• O‘zbekiston OTMlari uchun tasdiqlangan fizika laboratoriya qo‘llanmalari
`;
    await sendTelegramMessage(chatId, syllabusMsg.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "📚 To‘liq Sillabusni WebApp-da Ochish",
              web_app: { url: `${appUrl}/syllabus` },
            },
          ],
          [
            {
              text: "🔬 Laboratoriya Stendlari",
              callback_data: "cmd_labs",
            },
          ],
        ],
      },
    });
    return;
  }

  // 6. /profile
  if (text === "/profile") {
    if (!db) {
      await sendTelegramMessage(chatId, "⚠️ Ma'lumotlar bazasi vaqtincha mavjud emas.");
      return;
    }

    const linkedUser = await db.queryOne<{
      id: number;
      full_name: string;
      email: string;
      university: string;
      faculty: string;
      student_group: string;
      student_id_code?: string;
      telegram_username?: string;
    }>(
      `SELECT id, full_name, email, university, faculty, student_group, student_id_code, telegram_username
       FROM users
       WHERE telegram_chat_id = $1`,
      [String(chatId)]
    );

    if (!linkedUser) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Profil bog‘lanmagan</b>\n\nSizning Telegram hisobingiz FizikaLab platformasidagi talaba profiliga ulanmagan.\n\nHisobingizni ulash uchun platformaga kiring va «Profil» sahifasida <b>Telegramni Ulash</b> tugmasini bosing.`,
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: "🔑 Profilga O‘tish", web_app: { url: `${appUrl}/profile` } }],
            ],
          },
        }
      );
      return;
    }

    const profileText = `
🎓 <b>Talaba Shaxsiy Akademik Ma’lumotnomasi</b>

👤 <b>F.I.Sh.:</b> ${linkedUser.full_name}
🏛 <b>Universitet:</b> ${linkedUser.university || "Toshkent axborot texnologiyalari universiteti"}
🏢 <b>Fakultet:</b> ${linkedUser.faculty || "Kompyuter injiniringi"}
👥 <b>Akademik guruh:</b> ${linkedUser.student_group}
📧 <b>Pochta:</b> ${linkedUser.email}
🆔 <b>Talaba ID:</b> ${linkedUser.student_id_code || `#${linkedUser.id}`}
📱 <b>Telegram:</b> @${username || linkedUser.telegram_username || "ulangan"}
📊 <b>Holat:</b> Faol talaba
`;
    await sendTelegramMessage(chatId, profileText.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "👤 Profilni WebApp-da Ochish", web_app: { url: `${appUrl}/profile` } },
            { text: "📑 Baholarim", web_app: { url: `${appUrl}/reports` } },
          ],
        ],
      },
    });
    return;
  }

  // 7. /help
  if (text === "/help") {
    const helpText = `
ℹ️ <b>FizikaLab Akademik Tizimi — Foydalanish Yo‘riqnomasi</b>

Ushbu bot Toshkent axborot texnologiyalari universiteti (TATU) va O‘zbekiston OTMlari talabalari hamda professor-o‘qituvchilari uchun mo‘ljallangan rasmiy ilmiy-amaliy ko‘makchidir.

<b>Mavjud buyruqlar:</b>
/start — Botni ishga tushirish va tizim bilan bog‘lash
/labs — Barcha 8 ta laboratoriya stendlari ro‘yxati
/video — Haqiqiy tajriba stendlari videolari (YouTube & Google Drive)
/grades — Olingan baholar va ustoz taqrizlari
/syllabus — Rasmiy o‘quv dasturi va adabiyotlar
/profile — Talabaning shaxsiy akademik ma’lumotlari
/help — Yo‘riqnoma va kafedra ma’lumotlari

<b>Qo‘llab-quvvatlash va murojaat:</b>
Laboratoriya hisobotlari, o‘lchov xatoliklari yoki texnik muammolar bo‘yicha universitet fizika kafedrasiga murojaat qilishingiz mumkin.
`;
    await sendTelegramMessage(chatId, helpText.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "🚀 FizikaLab WebApp-ni Ochish",
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    });
    return;
  }
}
