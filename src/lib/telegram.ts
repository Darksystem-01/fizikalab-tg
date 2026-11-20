/**
 * FizikaLab - Telegram Bot Integratsiya Moduli
 *
 * O'zbekiston oliy ta'lim tizimi (HEMIS / universitetlar) uchun Telegram
 * orqali talabalarga tezkor baholar, topshiriq eslatmalari, yangiliklar va
 * Telegram WebApp (Mini App) orqali simulyatorlarni to'g'ridan-to'g'ri ochish.
 */

import crypto from "crypto";

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

export function getTelegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://fizika-lab-eta.vercel.app"
  );
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
    // Agar bot tokeni o'rnatilmagan bo'lsa (masalan test yoki dev muhitida)
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
 * Ustoz hisobotni baholaganida (SpeedGrader) talabaga Telegram orqali push bildirishnoma yuborish
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
🔔 <b>Laboratoriya hisoboti baholandi!</b>

Hurmatli <b>${studentName}</b>, ustozingiz sizning laboratoriya ishingizni tekshirdi:

📚 <b>Mavzu:</b> ${labTitle}
🎯 <b>Baho:</b> <code>${grade} / ${maxGrade} ball (${gradePct}%)</code> — <b>${gradeBadge}</b>
👨‍🏫 <b>Tekshiruvchi:</b> ${gradedBy || "Kafedra o‘qituvchisi"}

${feedback ? `💬 <b>Ustoz izohi:</b>\n<i>«${feedback}»</i>\n` : ""}
👉 <i>Batafsil natija va to‘liq hisobotni platformada ko‘rishingiz mumkin:</i>
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
 * Topshiriq muddati (deadline) yaqinlashganda eslatma
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
⏳ <b>Eslatma: Topshiriq topshirish muddati yaqinlashmoqda!</b>

Hurmatli <b>${studentName}</b>!
Quyidagi akademik topshiriqning oxirgi topshirish muddati:

📝 <b>Topshiriq:</b> ${assignmentTitle}
📅 <b>Oxirgi muddat:</b> <code>${dueDate}</code>

Iltimos, o‘z vaqtida hisobot va o‘lchov natijalarini FizikaLab tizimiga yuklang!
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
 * Telegram Webhook orqali kelgan buyruqlarni qayta ishlash
 */
export async function handleTelegramWebhookUpdate(update: any): Promise<void> {
  if (!update || !update.message) return;
  const msg = update.message;
  const chatId = msg.chat?.id;
  const text = msg.text?.trim() || "";
  const username = msg.from?.username || "";
  const firstName = msg.from?.first_name || "Foydalanuvchi";
  const appUrl = getAppUrl();

  if (!chatId) return;

  const db = await getDatabase();

  // 1. /start [link_token]
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const param = parts[1];

    if (param && param.startsWith("link_")) {
      const token = param.replace("link_", "");
      const userId = verifyAccountLinkToken(token);

      if (userId && db) {
        // Foydalanuvchini bazada yangilaymiz
        await db.execute(
          `UPDATE users SET telegram_chat_id = $1, telegram_username = $2 WHERE id = $3`,
          [String(chatId), username, userId]
        );

        const user = await db.queryOne<{ full_name: string }>(
          `SELECT full_name FROM users WHERE id = $1`,
          [userId]
        );

        const welcomeLinked = `
🎉 <b>Muvaffaqiyatli ulandi!</b>

Assalomu alaykum, <b>${user?.full_name || firstName}</b>!
Sizning Telegram profilingiz <b>FizikaLab Akademik Portali</b> bilan muvaffaqiyatli bog'landi.

Endi siz:
🔔 Barcha laboratoriya baholaringizni;
💬 Ustozlarning xulosalari va taqrizlarini;
⏳ Topshiriqlar muddatlari va eslatmalarni
to'g'ridan-to'g'ri Telegram orqali qabul qilasiz!
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
🔬 <b>FizikaLab Akademik Virtual Laboratoriyasi</b>

Assalomu alaykum, <b>${firstName}</b>!
FizikaLab — Oliy ta'lim muassasalari talabalari va o'qituvchilari uchun mo'ljallangan zamonaviy 2D/3D interaktiv fizik stendlar va HEMIS integratsiyalashgan platformadir.

<b>Mavjud buyruqlar:</b>
/labs — Barcha 8 ta laboratoriya stendlari ro'yxati
/video — Haqiqiy fizik tajribalar video darslari
/grades — Joriy baholaringiz va hisobotlar holati
/help — Yordam va yo'riqnoma

Quyidagi tugma orqali platformani bevosita Telegram ichida ochishingiz mumkin:
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
              text: "📚 Sillabus",
              web_app: { url: `${appUrl}/syllabus` },
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
📚 <b>FizikaLab Akademik Laboratoriya Stendlari:</b>

1. <b>Metrologiya va Asboblar</b> — Shtangensirkul, mikrometr, sferometr
2. <b>Kinematika & Ballistika</b> — 2D trayektoriya, havo qarshiligi (RK4)
3. <b>Dinamika & Mayatniklar</b> — Qiya tekislik, Atvud va Kater mayatnigi
4. <b>Statika & Muvozanat</b> — Kuchlar stoli, richag va balka muvozanati
5. <b>Elektromagnetizm</b> — Uitston ko'prigi, RLC tebranish konturi
6. <b>Optika</b> — Yupqa linzalar, prizma dispersiyasi, Nyuton halqalari
7. <b>Termodinamika</b> — Ideal gaz qonunlari, Karno sikli, Van-der-Vaals
8. <b>Atom & Yadro</b> — Tashqi fotoeffekt, Plank doimiysi, radioaktivlik

Quyidagi tugma orqali stendni tanlang:
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

  // 3. /video
  if (text === "/video") {
    const videoMsg = `
🎥 <b>Haqiqiy Universitet Tajriba Stendlari Videolari</b>

Barcha 8 ta laboratoriya mavzusi bo'yicha real laboratoriya apparatlari, sozlash bosqichlari va o'lchash jarayonlari ko'rsatilgan professional video darslar:

👉 <i>Hech qanday tashqi saytga o'tmasdan to'g'ridan-to'g'ri ilovamizda tomosha qiling:</i>
`;
    await sendTelegramMessage(chatId, videoMsg.trim(), {
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "🎬 Video Laboratoriyani Ochish",
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

    const linkedUser = await db.queryOne<{ id: number; full_name: string }>(
      `SELECT id, full_name FROM users WHERE telegram_chat_id = $1`,
      [String(chatId)]
    );

    if (!linkedUser) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Sizning Telegram profilingiz hali FizikaLab hisobiga ulanmagan.\n\nProfilingizni ulash uchun FizikaLab saytida <b>Talaba Profili</b> bo'limiga kiring va «Telegramni Ulash» tugmasini bosing!`,
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
        `📊 Hurmatli <b>${linkedUser.full_name}</b>, sizda hali topshirilgan laboratoriya hisobotlari mavjud emas.`,
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: "✍️ Laboratoriyani Boshlash", web_app: { url: `${appUrl}/labs/kinematics` } }],
            ],
          },
        }
      );
      return;
    }

    let reportListText = `📊 <b>${linkedUser.full_name}</b>ning so‘nggi hisobotlari:\n\n`;
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

  // 5. /help
  if (text === "/help") {
    const helpText = `
ℹ️ <b>FizikaLab Bot Yo'riqnomasi</b>

Ushbu bot orqali siz:
1. <b>Telegram WebApp</b> orqali simulyatorlarni to'liq mobil rejimda ochishingiz;
2. Ustoz baho qo'ygan zahoti uning izohlari bilan push xabar olishingiz;
3. Topshiriqlar muddatlari haqida eslatmalar olishingiz mumkin.

<b>Mavjud buyruqlar:</b>
/start — Botni ishga tushirish
/labs — 8 ta laboratoriya stendini ko'rish
/video — Haqiqiy video darslarni ochish
/grades — Baholar va o'zlashtirishni tekshirish
/help — Qo'llanma

Savollar yoki texnik muammolar bo'yicha kafedra ma'muriyatiga murojaat qiling.
`;
    await sendTelegramMessage(chatId, helpText.trim());
    return;
  }
}
