import { NextResponse } from "next/server";
import { handleTelegramWebhookUpdate } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const appUrlOverride = host ? `${proto}://${host}` : undefined;
    await handleTelegramWebhookUpdate(update, appUrlOverride);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[TelegramWebhook] Xatolik:", err);
    // Telegram doimo 200 kutadi, aks holda qayta-qayta yuboradi
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "FizikaLab Telegram Webhook Service",
    timestamp: new Date().toISOString(),
  });
}
