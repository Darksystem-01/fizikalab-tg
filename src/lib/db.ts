import fs from "fs";
import path from "path";
import {
  getConfiguredAdminCredentials,
  hashPassword,
  type UserRole,
} from "./auth";

export interface DbUser {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  student_group: string;
  university: string;
  faculty: string;
  is_active: number;
  is_banned: number;
  created_by: number | null;
  created_at: string;
}

export interface DbAcademicGroup {
  id: number;
  name: string;
  university: string;
  faculty: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

export interface DbAssignment {
  id: number;
  title: string;
  lab_key: string;
  description: string;
  target_params_json: string;
  tolerance_pct: number;
  group_name: string | null;
  assignment_type: "lab" | "independent";
  created_by: number;
  due_date: string | null;
  created_at: string;
}

export interface DbExperimentRun {
  id: number;
  user_id: number;
  lab_key: string;
  params_json: string;
  results_json: string;
  measurements_json: string;
  created_at: string;
}

export interface DbLabReport {
  id: number;
  user_id: number;
  assignment_id: number | null;
  lab_key: string;
  title: string;
  measurements_json: string;
  error_analysis_json: string;
  conclusion: string;
  status: "submitted" | "reviewed" | "graded";
  grade: number | null;
  admin_feedback: string | null;
  graded_by: number | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface DbAuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  created_at: string;
}

export type DbBackendKind = "postgres" | "sqlite-local" | "sqlite-tmp";

export function getPostgresUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

export function getDbBackendKind(): DbBackendKind {
  if (getPostgresUrl()) return "postgres";
  if (process.env.VERCEL) return "sqlite-tmp";
  return "sqlite-local";
}

interface DbAdapter {
  queryAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<{ lastInsertId?: number }>;
}

let pgPool: import("pg").Pool | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqliteDb: any = null;
let initPromise: Promise<void> | null = null;

function convertPlaceholdersToSqlite(sql: string): string {
  return sql.replace(/\$\d+/g, "?");
}

async function getAdapter(): Promise<DbAdapter> {
  const pgUrl = getPostgresUrl();
  if (pgUrl) {
    if (!pgPool) {
      const { Pool } = await import("pg");
      pgPool = new Pool({
        connectionString: pgUrl,
        ssl: pgUrl.includes("localhost")
          ? false
          : { rejectUnauthorized: false },
      });
    }
    const pool = pgPool;
    return {
      async queryAll<T>(sql: string, params: unknown[] = []) {
        const res = await pool.query(sql, params);
        return res.rows as T[];
      },
      async queryOne<T>(sql: string, params: unknown[] = []) {
        const res = await pool.query(sql, params);
        return (res.rows[0] as T | undefined) ?? null;
      },
      async execute(sql: string, params: unknown[] = []) {
        const res = await pool.query(sql, params);
        const insertedId =
          res.rows[0] && typeof res.rows[0].id === "number"
            ? (res.rows[0].id as number)
            : undefined;
        return { lastInsertId: insertedId };
      },
    };
  }

  if (!sqliteDb) {
    const { DatabaseSync } = await import("node:sqlite");
    const dbFile = process.env.VERCEL
      ? "/tmp/fizika_lab.db"
      : path.join(process.cwd(), "data", "fizika_lab.db");
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    sqliteDb = new DatabaseSync(dbFile);
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
  }

  const db = sqliteDb;
  return {
    async queryAll<T>(sql: string, params: unknown[] = []) {
      const s = convertPlaceholdersToSqlite(sql);
      return db.prepare(s).all(...params) as T[];
    },
    async queryOne<T>(sql: string, params: unknown[] = []) {
      const s = convertPlaceholdersToSqlite(sql);
      return (db.prepare(s).get(...params) as T | undefined) ?? null;
    },
    async execute(sql: string, params: unknown[] = []) {
      const cleanSql = convertPlaceholdersToSqlite(
        sql.replace(/\s+RETURNING\s+id\s*;?\s*$/i, "")
      );
      const info = db.prepare(cleanSql).run(...params);
      return {
        lastInsertId:
          typeof info.lastInsertRowid === "bigint"
            ? Number(info.lastInsertRowid)
            : Number(info.lastInsertRowid || 0),
      };
    },
  };
}

async function migrateExistingTables(adapter: DbAdapter, isPg: boolean): Promise<void> {
  if (isPg) {
    await adapter.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS university TEXT NOT NULL DEFAULT ''`
    );
    await adapter.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty TEXT NOT NULL DEFAULT ''`
    );
    await adapter.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned INTEGER NOT NULL DEFAULT 0`
    );
    await adapter.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER`
    );
    await adapter.execute(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS group_name TEXT`
    );
    await adapter.execute(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type TEXT NOT NULL DEFAULT 'lab'`
    );
    await adapter.execute(
      `ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS graded_by INTEGER`
    );
    // Update Postgres role CHECK constraint to allow 'teacher'
    await adapter.execute(`
      DO $$
      BEGIN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','teacher','student'));
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
    return;
  }

  // SQLite incremental migrations
  const usersMeta = await adapter.queryOne<{ sql: string }>(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`
  );
  if (usersMeta && !usersMeta.sql.includes("'teacher'")) {
    // Rebuild users table cleanly to upgrade CHECK constraint + add new columns
    await adapter.execute(`PRAGMA foreign_keys = OFF;`);
    await adapter.execute(`DROP TABLE IF EXISTS users_migrated;`);
    await adapter.execute(`
      CREATE TABLE users_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
        student_group TEXT NOT NULL DEFAULT '',
        university TEXT NOT NULL DEFAULT '',
        faculty TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        is_banned INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER,
        created_at TEXT NOT NULL
      )
    `);
    await adapter.execute(`
      INSERT INTO users_migrated (id, full_name, email, password_hash, role, student_group, is_active, created_at)
      SELECT id, full_name, email, password_hash, role, student_group, is_active, created_at FROM users
    `);
    await adapter.execute(`DROP TABLE users;`);
    await adapter.execute(`ALTER TABLE users_migrated RENAME TO users;`);
    await adapter.execute(`PRAGMA foreign_keys = ON;`);
  } else if (usersMeta) {
    const cols = await adapter.queryAll<{ name: string }>(`PRAGMA table_info(users)`);
    const colSet = new Set(cols.map((c) => c.name));
    if (!colSet.has("university")) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN university TEXT NOT NULL DEFAULT ''`);
    }
    if (!colSet.has("faculty")) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN faculty TEXT NOT NULL DEFAULT ''`);
    }
    if (!colSet.has("is_banned")) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
    }
    if (!colSet.has("created_by")) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN created_by INTEGER`);
    }
  }

  const assignCols = await adapter.queryAll<{ name: string }>(`PRAGMA table_info(assignments)`);
  if (assignCols.length > 0) {
    const aSet = new Set(assignCols.map((c) => c.name));
    if (!aSet.has("group_name")) {
      await adapter.execute(`ALTER TABLE assignments ADD COLUMN group_name TEXT`);
    }
    if (!aSet.has("assignment_type")) {
      await adapter.execute(
        `ALTER TABLE assignments ADD COLUMN assignment_type TEXT NOT NULL DEFAULT 'lab'`
      );
    }
  }

  const reportCols = await adapter.queryAll<{ name: string }>(`PRAGMA table_info(lab_reports)`);
  if (reportCols.length > 0) {
    const rSet = new Set(reportCols.map((c) => c.name));
    if (!rSet.has("graded_by")) {
      await adapter.execute(`ALTER TABLE lab_reports ADD COLUMN graded_by INTEGER`);
    }
  }
}

async function ensureSchemaAndSeed() {
  const adapter = await getAdapter();
  const isPg = Boolean(getPostgresUrl());

  const schemaStatements = isPg
    ? [
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
          student_group TEXT NOT NULL DEFAULT '',
          university TEXT NOT NULL DEFAULT '',
          faculty TEXT NOT NULL DEFAULT '',
          is_active INTEGER NOT NULL DEFAULT 1,
          is_banned INTEGER NOT NULL DEFAULT 0,
          created_by INTEGER,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS academic_groups (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          university TEXT NOT NULL DEFAULT '',
          faculty TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          lab_key TEXT NOT NULL,
          description TEXT NOT NULL,
          target_params_json TEXT NOT NULL,
          tolerance_pct REAL NOT NULL DEFAULT 5.0,
          group_name TEXT,
          assignment_type TEXT NOT NULL DEFAULT 'lab',
          created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          due_date TEXT,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS experiment_runs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          lab_key TEXT NOT NULL,
          params_json TEXT NOT NULL,
          results_json TEXT NOT NULL,
          measurements_json TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS lab_reports (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
          lab_key TEXT NOT NULL,
          title TEXT NOT NULL,
          measurements_json TEXT NOT NULL,
          error_analysis_json TEXT NOT NULL,
          conclusion TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'submitted',
          grade INTEGER,
          admin_feedback TEXT,
          graded_by INTEGER,
          submitted_at TEXT NOT NULL,
          reviewed_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
          student_group TEXT NOT NULL DEFAULT '',
          university TEXT NOT NULL DEFAULT '',
          faculty TEXT NOT NULL DEFAULT '',
          is_active INTEGER NOT NULL DEFAULT 1,
          is_banned INTEGER NOT NULL DEFAULT 0,
          created_by INTEGER,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS academic_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          university TEXT NOT NULL DEFAULT '',
          faculty TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          lab_key TEXT NOT NULL,
          description TEXT NOT NULL,
          target_params_json TEXT NOT NULL,
          tolerance_pct REAL NOT NULL DEFAULT 5.0,
          group_name TEXT,
          assignment_type TEXT NOT NULL DEFAULT 'lab',
          created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          due_date TEXT,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS experiment_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          lab_key TEXT NOT NULL,
          params_json TEXT NOT NULL,
          results_json TEXT NOT NULL,
          measurements_json TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS lab_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
          lab_key TEXT NOT NULL,
          title TEXT NOT NULL,
          measurements_json TEXT NOT NULL,
          error_analysis_json TEXT NOT NULL,
          conclusion TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'submitted',
          grade INTEGER,
          admin_feedback TEXT,
          graded_by INTEGER,
          submitted_at TEXT NOT NULL,
          reviewed_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
      ];

  for (const stmt of schemaStatements) {
    await adapter.execute(stmt);
  }

  await migrateExistingTables(adapter, isPg);

  // Sync sole configured administrator from encrypted environment variables (zero hardcoded creds)
  const adminCfg = getConfiguredAdminCredentials();
  let admin: DbUser | null = null;

  if (adminCfg) {
    // Ensure no legacy/rogue admin accounts remain active in persistent storage
    await adapter.execute(
      `DELETE FROM users WHERE role = 'admin' AND email <> $1`,
      [adminCfg.email]
    );
    await adapter.execute(
      `DELETE FROM users WHERE email IN ('admin@fizikalab.uz', 'talaba@fizikalab.uz')`
    );

    admin = await adapter.queryOne<DbUser>(
      "SELECT * FROM users WHERE email = $1",
      [adminCfg.email]
    );

    const now = new Date().toISOString();
    if (!admin) {
      const res = await adapter.execute(
        `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, created_at)
         VALUES ($1, $2, $3, 'admin', 'Boshqaruv', 'FizikaLab', 'Ma''muriyat', 1, 0, $4) RETURNING id`,
        ["Bosh Administrator", adminCfg.email, hashPassword(adminCfg.password), now]
      );
      admin = await adapter.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [
        res.lastInsertId,
      ]);
    } else if (admin.role !== "admin" || admin.is_banned === 1 || admin.is_active !== 1) {
      await adapter.execute(
        `UPDATE users SET role = 'admin', is_active = 1, is_banned = 0 WHERE id = $1`,
        [admin.id]
      );
    }
  } else {
    // Without configured ADMIN_EMAIL/ADMIN_PASSWORD, remove any legacy demo admin
    await adapter.execute(`DELETE FROM users WHERE email IN ('admin@fizikalab.uz', 'talaba@fizikalab.uz')`);
  }

  const assignCountRow = await adapter.queryOne<{ cnt: number | string }>(
    "SELECT COUNT(*) AS cnt FROM assignments"
  );
  if (Number(assignCountRow?.cnt || 0) === 0) {
    const now = new Date().toISOString();
    const initialAssignments = [
      {
        title: "1-lab: Shtangensirkul, mikrometr va sferometr yordamida aniq o‘lchash",
        lab_key: "metrology",
        description:
          "Sferometr yordamida linza sirtining egrilik radiusi R ni 5 marta takroriy o‘lchab, o‘rtacha kvadratik xatolik δ = σ/√N ni hisoblang.",
        target_params_json: JSON.stringify({
          mode: "spherometer",
          trueValueMm: 2.15,
          legSpacingMm: 40,
        }),
        tolerance_pct: 5.0,
      },
      {
        title: "2-lab: Havo qarshiligi bilan parabolik harakat (Kinematika)",
        lab_key: "kinematics",
        description:
          "v₀ = 25 m/s va θ = 45° burchak ostida otilgan jism uchun vakuum va havo qarshiligidagi uchish uzoqligi farqini RK4 yordamida aniqlang.",
        target_params_json: JSON.stringify({
          mode: "projectile",
          v0: 25,
          angleDeg: 45,
          airDrag: true,
        }),
        tolerance_pct: 5.0,
      },
      {
        title: "3-lab: Qiya tekislik va Kater mayatnigi (Dinamika)",
        lab_key: "dynamics",
        description:
          "θ = 30° qiya tekislikda μₖ = 0.25 sirpanish ishqalanishida tezlanishni o‘lchang hamda Kater mayatnigi orqali g ni 0.5% aniqlikda toping.",
        target_params_json: JSON.stringify({
          subMode: "inclined_plane",
          angleDeg: 30,
          muKinetic: 0.25,
        }),
        tolerance_pct: 4.0,
      },
      {
        title: "4-lab: Balka muvozanati va kuchlar jadvali (Statika)",
        lab_key: "statics",
        description:
          "4 metrli balkada tayanch reaksiyalari R_A va R_B ni momentlar muvozanati ∑τ = 0 shartidan hisoblang va tekshiring.",
        target_params_json: JSON.stringify({
          subMode: "beam_moments",
          beamLengthM: 4.0,
        }),
        tolerance_pct: 3.0,
      },
      {
        title: "5-lab: Metr ko‘pigi va RLC rezonans (Elektromagnetizm)",
        lab_key: "electromagnetism",
        description:
          "Metr ko‘pigida galvanometr nol-muvozanat nuqtasini topib noma’lum qarshilik X ni aniqlang va KRO osiloskopda RLC rezonans chastotasini o‘lchang.",
        target_params_json: JSON.stringify({
          subMode: "wheatstone_meter_bridge",
          rKnownOhm: 100,
        }),
        tolerance_pct: 3.0,
      },
      {
        title: "6-lab: Optik stend va prizma spektrometri (Optika)",
        lab_key: "optics",
        description:
          "Yig‘uvchi linza fokus masofasini o‘lchang hamda 60° prizma orqali Koshi dispersiyasida minimal og‘ish burchagi δ_min ni aniqlang.",
        target_params_json: JSON.stringify({
          subMode: "prism_slab",
          prismApexDeg: 60,
        }),
        tolerance_pct: 4.0,
      },
    ];

    for (const a of initialAssignments) {
      await adapter.execute(
        `INSERT INTO assignments (title, lab_key, description, target_params_json, tolerance_pct, group_name, assignment_type, created_by, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NULL, 'lab', $6, $7, $8)`,
        [
          a.title,
          a.lab_key,
          a.description,
          a.target_params_json,
          a.tolerance_pct,
          admin ? admin.id : null,
          null,
          now,
        ]
      );
    }
  }
}

export async function getDb(): Promise<DbAdapter> {
  if (!initPromise) {
    initPromise = ensureSchemaAndSeed().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return getAdapter();
}

export async function getActiveSessionUserById(userId: number): Promise<DbUser | null> {
  const db = await getDb();
  return db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
}

export async function ensureConfiguredAdminRecord(
  email: string,
  password: string
): Promise<DbUser> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  let user = await db.queryOne<DbUser>("SELECT * FROM users WHERE email = $1", [
    normalized,
  ]);
  if (!user) {
    const res = await db.execute(
      `INSERT INTO users (full_name, email, password_hash, role, student_group, university, faculty, is_active, is_banned, created_at)
       VALUES ($1, $2, $3, 'admin', 'Boshqaruv', 'FizikaLab', 'Ma''muriyat', 1, 0, $4) RETURNING id`,
      ["Bosh Administrator", normalized, hashPassword(password), new Date().toISOString()]
    );
    user = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [
      res.lastInsertId,
    ]);
  } else {
    await db.execute(
      `UPDATE users SET role = 'admin', is_active = 1, is_banned = 0, password_hash = $1 WHERE id = $2`,
      [hashPassword(password), user.id]
    );
    user = await db.queryOne<DbUser>("SELECT * FROM users WHERE id = $1", [user.id]);
  }
  return user!;
}

export async function writeAuditLog(
  userId: number | null,
  action: string,
  details: string
): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, $4)`,
      [userId, action, details, new Date().toISOString()]
    );
  } catch {
    // Non-blocking audit log
  }
}
