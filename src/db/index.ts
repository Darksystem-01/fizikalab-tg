import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Disable websocket warnings in serverless environments if needed
if (typeof window === "undefined" && !process.env.DATABASE_URL) {
  // neonConfig can be configured if needed
}

let _db: ReturnType<typeof drizzleNeon> | null = null;
let _pool: Pool | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    "postgres://postgres:postgres@localhost:5432/fizikalab";

  try {
    _pool = new Pool({ connectionString });
    _db = drizzleNeon(_pool, { schema });
    return _db;
  } catch (error) {
    console.warn("[DB] Neon Pool initialization warning:", error);
    // Return typed instance even if offline
    _db = drizzleNeon(_pool || ({} as Pool), { schema });
    return _db;
  }
}

export const db = getDb();
export { schema };
