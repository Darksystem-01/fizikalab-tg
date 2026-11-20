import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { decryptPii, maskPhoneNumber } from "@/lib/crypto";

export const SESSION_COOKIE_NAME = "fizikalab_session";
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthenticatedUser {
  id: string;
  nickname: string;
  role: "student" | "creator" | "moderator" | "admin" | string;
  status: "pending" | "active" | "banned" | "deleted" | string;
  maskedPhone: string;
  phoneVerified: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  university?: string | null;
  faculty?: string | null;
  course?: number | null;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  userAgent?: string,
  ip?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null;

  const db = getDb();
  try {
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      userAgent: userAgent ? userAgent.slice(0, 255) : null,
      ipHash,
      expiresAt,
    });
  } catch (err) {
    console.warn("[Session] DB insert warning:", err);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    const db = getDb();
    try {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.tokenHash, tokenHash));
    } catch (err) {
      console.warn("[Session] DB revoke warning:", err);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const db = getDb();

    const [foundSession] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
          isNull(sessions.revokedAt)
        )
      )
      .limit(1);

    if (!foundSession) return null;

    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, foundSession.userId))
      .limit(1);

    if (!foundUser || foundUser.status === "banned" || foundUser.status === "deleted") {
      return null;
    }

    // Mask phone number
    let plainPhone = "";
    if (foundUser.phoneEncrypted) {
      plainPhone = decryptPii(foundUser.phoneEncrypted);
    }

    return {
      id: foundUser.id,
      nickname: foundUser.nickname,
      role: foundUser.role,
      status: foundUser.status,
      maskedPhone: maskPhoneNumber(plainPhone),
      phoneVerified: Boolean(foundUser.phoneVerifiedAt),
      avatarUrl: foundUser.avatarUrl,
      bio: foundUser.bio,
      university: foundUser.university,
      faculty: foundUser.faculty,
      course: foundUser.course,
    };
  } catch (err) {
    console.error("[Session] getSessionUser exception:", err);
    return null;
  }
}
