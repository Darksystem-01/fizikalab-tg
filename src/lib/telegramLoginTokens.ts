import crypto from "crypto";

export interface TelegramLoginTokenData {
  token: string;
  createdAt: number;
  expiresAt?: number;
  verified: boolean;
  claimed?: boolean;
  user?: {
    id: number | string;
    firstName: string;
    lastName: string;
    username: string;
    photoUrl?: string;
    authDate?: number;
  };
}

// Global in-memory cache for login tokens across serverless invocations within memory TTL
const tokenStore = new Map<string, TelegramLoginTokenData>();

// Cleanup expired tokens older than 10 minutes
function cleanupOldTokens() {
  const now = Date.now();
  for (const [key, item] of tokenStore.entries()) {
    if (now - item.createdAt > 10 * 60 * 1000) {
      tokenStore.delete(key);
    }
  }
}

/**
 * Creates a unique 32-byte login token for Telegram bot deep-link authentication
 */
export function createTelegramLoginToken(): string {
  cleanupOldTokens();
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;

  tokenStore.set(token, {
    token,
    createdAt: now,
    expiresAt,
    verified: false,
    claimed: false,
  });

  // Asynchronously persist to DB if available
  (async () => {
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      await db.execute(
        `INSERT INTO telegram_login_tokens (token, status, telegram_id, first_name, last_name, username, photo_url, auth_date, created_at, expires_at)
         VALUES ($1, 'pending', '', '', '', '', '', 0, $2, $3)`,
        [token, new Date(now).toISOString(), new Date(expiresAt).toISOString()]
      );
    } catch {
      // Memory store is active fallback
    }
  })();

  return token;
}

/**
 * Async helper to create and return session token metadata
 */
export async function createTelegramLoginSession(): Promise<{
  token: string;
  botUsername: string;
  deepLink: string;
  expiresInSeconds: number;
}> {
  const token = createTelegramLoginToken();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "Fizikatuitbot";
  const deepLink = `https://t.me/${botUsername}?start=login_${token}`;

  return {
    token,
    botUsername,
    deepLink,
    expiresInSeconds: 300,
  };
}

/**
 * Called by Telegram webhook when a user sends `/start login_<token>` or clicks login confirmation
 */
export function confirmTelegramLoginToken(
  token: string,
  user: {
    id: number | string;
    firstName: string;
    lastName: string;
    username: string;
    photoUrl?: string;
    authDate?: number;
  }
): boolean {
  cleanupOldTokens();
  const now = Date.now();
  let entry = tokenStore.get(token);

  if (entry) {
    if (entry.expiresAt ? now > entry.expiresAt : now - entry.createdAt > 5 * 60 * 1000) {
      tokenStore.delete(token);
      return false;
    }
    entry.verified = true;
    entry.user = user;
    tokenStore.set(token, entry);
  } else {
    // If not in memory store, create verified record in memory
    entry = {
      token,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000,
      verified: true,
      user,
    };
    tokenStore.set(token, entry);
  }

  // Update DB asynchronously
  (async () => {
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      await db.execute(
        `UPDATE telegram_login_tokens
         SET status = 'verified',
             telegram_id = $1,
             first_name = $2,
             last_name = $3,
             username = $4,
             photo_url = $5,
             auth_date = $6
         WHERE token = $7 AND status = 'pending'`,
        [
          String(user.id),
          user.firstName || "",
          user.lastName || "",
          user.username || "",
          user.photoUrl || "",
          user.authDate || Math.floor(now / 1000),
          token,
        ]
      );
    } catch {
      // Memory store already updated
    }
  })();

  return true;
}

/**
 * Checks verification status of a login token (sync version)
 */
export function checkTelegramLoginToken(token: string, consume = false): TelegramLoginTokenData | null {
  cleanupOldTokens();
  const entry = tokenStore.get(token);
  if (!entry) return null;

  const now = Date.now();
  if (entry.expiresAt ? now > entry.expiresAt : now - entry.createdAt > 5 * 60 * 1000) {
    tokenStore.delete(token);
    return null;
  }

  if (entry.claimed) {
    return null;
  }

  if (consume && entry.verified) {
    entry.claimed = true;
    tokenStore.set(token, entry);
    (async () => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        await db.execute(`UPDATE telegram_login_tokens SET status = 'claimed' WHERE token = $1`, [token]);
      } catch {}
    })();
  }

  return entry;
}

/**
 * Checks verification status of a login token (async version with DB fallback)
 */
export async function checkTelegramLoginTokenAsync(
  token: string,
  consume = false
): Promise<TelegramLoginTokenData | null> {
  cleanupOldTokens();
  let entry = tokenStore.get(token);
  const now = Date.now();

  // If not in memory, check database
  if (!entry) {
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      const row = await db.queryOne<{
        token: string;
        status: string;
        telegram_id: string;
        first_name: string;
        last_name: string;
        username: string;
        photo_url: string;
        auth_date: number;
        created_at: string;
        expires_at: string;
      }>(`SELECT * FROM telegram_login_tokens WHERE token = $1`, [token]);

      if (row) {
        const createdMs = new Date(row.created_at).getTime();
        const expiresMs = new Date(row.expires_at).getTime();
        if (now > expiresMs) {
          return null;
        }
        entry = {
          token: row.token,
          createdAt: createdMs,
          expiresAt: expiresMs,
          verified: row.status === "verified",
          claimed: row.status === "claimed",
          user: row.telegram_id
            ? {
                id: row.telegram_id,
                firstName: row.first_name,
                lastName: row.last_name,
                username: row.username,
                photoUrl: row.photo_url,
                authDate: row.auth_date,
              }
            : undefined,
        };
        tokenStore.set(token, entry);
      }
    } catch {
      // Memory store is fallback
    }
  }

  if (!entry) return null;

  if (entry.expiresAt ? now > entry.expiresAt : now - entry.createdAt > 5 * 60 * 1000) {
    tokenStore.delete(token);
    return null;
  }

  if (entry.claimed) {
    return null;
  }

  if (consume && entry.verified) {
    entry.claimed = true;
    tokenStore.set(token, entry);
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      await db.execute(`UPDATE telegram_login_tokens SET status = 'claimed' WHERE token = $1`, [token]);
    } catch {}
  }

  return entry;
}
