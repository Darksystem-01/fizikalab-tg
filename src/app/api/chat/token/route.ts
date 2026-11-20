import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createAblyTokenRequest } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
  }

  const tokenRequest = await createAblyTokenRequest(user.id);
  if (!tokenRequest) {
    return NextResponse.json({
      enabled: false,
      message: "Ably sozlanmagan, HTTP polling ishlatiladi",
    });
  }

  return NextResponse.json({
    enabled: true,
    tokenRequest,
  });
}
