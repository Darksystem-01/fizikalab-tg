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
  google_id?: string | null;
  created_by: number | null;
  created_at: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  degree?: string;
  education_type?: string;
  education_payment?: string;
  course_year?: string;
  tutor_name?: string;
  scholarship_status?: string;
  avatar_url?: string;
  student_id_code?: string;
  bio?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
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
  lesson_type?: "laboratoriya" | "mustaqil_ish" | "maqola" | "amaliyot" | "referat";
  max_score?: number;
  rubric_json?: string;
  attachment_url?: string;
  attachment_name?: string;
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
  status: "submitted" | "reviewed" | "graded" | "needs_revision";
  grade: number | null;
  admin_feedback: string | null;
  graded_by: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  article_content?: string | null;
  submission_type?: "report" | "file" | "article" | null;
}

export interface DbAuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  created_at: string;
}

export interface DbActiveSession {
  session_id: string;
  user_id: number;
  client_fingerprint: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  is_revoked: number;
}

export interface CreateActiveSessionParams {
  sessionId: string;
  userId: number;
  clientFingerprint: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string | Date;
  lastSeenAt?: string | Date;
  expiresAt: string | Date | number;
  isRevoked?: number | boolean;
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
    process.env.STORAGE_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pgPool: any = null;
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
      // @ts-ignore
      const { Pool } = await import("pg");
      pgPool = new Pool({
        connectionString: pgUrl,
        ssl: pgUrl.includes("localhost")
          ? false
          : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
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
    // @ts-ignore
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
  const userProfileCols = [
    { name: "phone", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "birth_date", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "gender", pgType: "TEXT NOT NULL DEFAULT 'erkak'", sqType: "TEXT NOT NULL DEFAULT 'erkak'" },
    { name: "address", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "degree", pgType: "TEXT NOT NULL DEFAULT 'Bakalavr'", sqType: "TEXT NOT NULL DEFAULT 'Bakalavr'" },
    { name: "education_type", pgType: "TEXT NOT NULL DEFAULT 'Kunduzgi'", sqType: "TEXT NOT NULL DEFAULT 'Kunduzgi'" },
    { name: "education_payment", pgType: "TEXT NOT NULL DEFAULT 'Davlat granti'", sqType: "TEXT NOT NULL DEFAULT 'Davlat granti'" },
    { name: "course_year", pgType: "TEXT NOT NULL DEFAULT '1-kurs'", sqType: "TEXT NOT NULL DEFAULT '1-kurs'" },
    { name: "tutor_name", pgType: "TEXT NOT NULL DEFAULT 'Alimuradov Lochinbek'", sqType: "TEXT NOT NULL DEFAULT 'Alimuradov Lochinbek'" },
    { name: "scholarship_status", pgType: "TEXT NOT NULL DEFAULT 'Bor'", sqType: "TEXT NOT NULL DEFAULT 'Bor'" },
    { name: "avatar_url", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "student_id_code", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "bio", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "telegram_chat_id", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "telegram_username", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
  ];

  const assignExtCols = [
    { name: "lesson_type", pgType: "TEXT NOT NULL DEFAULT 'laboratoriya'", sqType: "TEXT NOT NULL DEFAULT 'laboratoriya'" },
    { name: "max_score", pgType: "REAL NOT NULL DEFAULT 5.0", sqType: "REAL NOT NULL DEFAULT 5.0" },
    { name: "rubric_json", pgType: "TEXT NOT NULL DEFAULT '[]'", sqType: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "attachment_url", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
    { name: "attachment_name", pgType: "TEXT NOT NULL DEFAULT ''", sqType: "TEXT NOT NULL DEFAULT ''" },
  ];

  const reportExtCols = [
    { name: "file_url", pgType: "TEXT DEFAULT ''", sqType: "TEXT DEFAULT ''" },
    { name: "file_name", pgType: "TEXT DEFAULT ''", sqType: "TEXT DEFAULT ''" },
    { name: "file_size", pgType: "INTEGER DEFAULT 0", sqType: "INTEGER DEFAULT 0" },
    { name: "article_content", pgType: "TEXT DEFAULT ''", sqType: "TEXT DEFAULT ''" },
    { name: "submission_type", pgType: "TEXT DEFAULT 'report'", sqType: "TEXT DEFAULT 'report'" },
  ];

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
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`
    );
    for (const c of userProfileCols) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c.name} ${c.pgType}`);
    }

    await adapter.execute(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS group_name TEXT`
    );
    await adapter.execute(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type TEXT NOT NULL DEFAULT 'lab'`
    );
    for (const c of assignExtCols) {
      await adapter.execute(`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ${c.name} ${c.pgType}`);
    }

    await adapter.execute(
      `ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS graded_by INTEGER`
    );
    for (const c of reportExtCols) {
      await adapter.execute(`ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS ${c.name} ${c.pgType}`);
    }

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
        google_id TEXT,
        created_by INTEGER,
        created_at TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        birth_date TEXT NOT NULL DEFAULT '',
        gender TEXT NOT NULL DEFAULT 'erkak',
        address TEXT NOT NULL DEFAULT '',
        degree TEXT NOT NULL DEFAULT 'Bakalavr',
        education_type TEXT NOT NULL DEFAULT 'Kunduzgi',
        education_payment TEXT NOT NULL DEFAULT 'Davlat granti',
        course_year TEXT NOT NULL DEFAULT '1-kurs',
        tutor_name TEXT NOT NULL DEFAULT 'Alimuradov Lochinbek',
        scholarship_status TEXT NOT NULL DEFAULT 'Bor',
        avatar_url TEXT NOT NULL DEFAULT '',
        student_id_code TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL DEFAULT ''
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
    if (!colSet.has("google_id")) {
      await adapter.execute(`ALTER TABLE users ADD COLUMN google_id TEXT`);
    }
    for (const c of userProfileCols) {
      if (!colSet.has(c.name)) {
        await adapter.execute(`ALTER TABLE users ADD COLUMN ${c.name} ${c.sqType}`);
      }
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
    for (const c of assignExtCols) {
      if (!aSet.has(c.name)) {
        await adapter.execute(`ALTER TABLE assignments ADD COLUMN ${c.name} ${c.sqType}`);
      }
    }
  }

  const reportCols = await adapter.queryAll<{ name: string }>(`PRAGMA table_info(lab_reports)`);
  if (reportCols.length > 0) {
    const rSet = new Set(reportCols.map((c) => c.name));
    if (!rSet.has("graded_by")) {
      await adapter.execute(`ALTER TABLE lab_reports ADD COLUMN graded_by INTEGER`);
    }
    for (const c of reportExtCols) {
      if (!rSet.has(c.name)) {
        await adapter.execute(`ALTER TABLE lab_reports ADD COLUMN ${c.name} ${c.sqType}`);
      }
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
          google_id TEXT,
          created_by INTEGER,
          created_at TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          birth_date TEXT NOT NULL DEFAULT '',
          gender TEXT NOT NULL DEFAULT 'erkak',
          address TEXT NOT NULL DEFAULT '',
          degree TEXT NOT NULL DEFAULT 'Bakalavr',
          education_type TEXT NOT NULL DEFAULT 'Kunduzgi',
          education_payment TEXT NOT NULL DEFAULT 'Davlat granti',
          course_year TEXT NOT NULL DEFAULT '1-kurs',
          tutor_name TEXT NOT NULL DEFAULT 'Alimuradov Lochinbek',
          scholarship_status TEXT NOT NULL DEFAULT 'Bor',
          avatar_url TEXT NOT NULL DEFAULT '',
          student_id_code TEXT NOT NULL DEFAULT '',
          bio TEXT NOT NULL DEFAULT '',
          telegram_chat_id TEXT NOT NULL DEFAULT '',
          telegram_username TEXT NOT NULL DEFAULT ''
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
          lesson_type TEXT NOT NULL DEFAULT 'laboratoriya',
          max_score REAL NOT NULL DEFAULT 5.0,
          rubric_json TEXT NOT NULL DEFAULT '[]',
          attachment_url TEXT NOT NULL DEFAULT '',
          attachment_name TEXT NOT NULL DEFAULT '',
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
          reviewed_at TEXT,
          file_url TEXT DEFAULT '',
          file_name TEXT DEFAULT '',
          file_size INTEGER DEFAULT 0,
          article_content TEXT DEFAULT '',
          submission_type TEXT DEFAULT 'report'
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS active_sessions (
          session_id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          client_fingerprint TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          is_revoked INTEGER NOT NULL DEFAULT 0
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
          google_id TEXT,
          created_by INTEGER,
          created_at TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          birth_date TEXT NOT NULL DEFAULT '',
          gender TEXT NOT NULL DEFAULT 'erkak',
          address TEXT NOT NULL DEFAULT '',
          degree TEXT NOT NULL DEFAULT 'Bakalavr',
          education_type TEXT NOT NULL DEFAULT 'Kunduzgi',
          education_payment TEXT NOT NULL DEFAULT 'Davlat granti',
          course_year TEXT NOT NULL DEFAULT '1-kurs',
          tutor_name TEXT NOT NULL DEFAULT 'Alimuradov Lochinbek',
          scholarship_status TEXT NOT NULL DEFAULT 'Bor',
          avatar_url TEXT NOT NULL DEFAULT '',
          student_id_code TEXT NOT NULL DEFAULT '',
          bio TEXT NOT NULL DEFAULT '',
          telegram_chat_id TEXT NOT NULL DEFAULT '',
          telegram_username TEXT NOT NULL DEFAULT ''
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
          lesson_type TEXT NOT NULL DEFAULT 'laboratoriya',
          max_score REAL NOT NULL DEFAULT 5.0,
          rubric_json TEXT NOT NULL DEFAULT '[]',
          attachment_url TEXT NOT NULL DEFAULT '',
          attachment_name TEXT NOT NULL DEFAULT '',
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
          reviewed_at TEXT,
          file_url TEXT DEFAULT '',
          file_name TEXT DEFAULT '',
          file_size INTEGER DEFAULT 0,
          article_content TEXT DEFAULT '',
          submission_type TEXT DEFAULT 'report'
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS active_sessions (
          session_id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          client_fingerprint TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          is_revoked INTEGER NOT NULL DEFAULT 0
        )`,
      ];

  for (const stmt of schemaStatements) {
    await adapter.execute(stmt);
  }

  await adapter.execute(
    `CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id)`
  );
  await adapter.execute(
    `CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at)`
  );

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
        `INSERT INTO assignments (title, lab_key, description, target_params_json, tolerance_pct, group_name, assignment_type, lesson_type, max_score, rubric_json, created_by, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NULL, 'lab', 'laboratoriya', 5.0, '[]', $6, $7, $8)`,
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

  // Ensure HEMIS diversified assignments (independent work, article writing, practical seminar, referat)
  const articleCheck = await adapter.queryOne<{ cnt: number | string }>(
    "SELECT COUNT(*) AS cnt FROM assignments WHERE lesson_type = 'maqola'"
  );
  if (Number(articleCheck?.cnt || 0) === 0) {
    const now = new Date().toISOString();
    const hemisAssignments = [
      {
        title: "Ilmiy maqola: Gravitatsion maydon, sun'iy yo'ldoshlar harakati va relyativistik mexanika tahlili",
        lab_key: "kinematics",
        description:
          "Talaba kosmik apparatlarning Kepler orbitalari va Eynshteynning umumiy nisbiylik nazariyasi doirasidagi trayektoriyalar bo'yicha mustaqil ilmiy maqola tayyorlaydi. Maqolada annotatsiya, kirish, hisob-kitoblar, tahlil va xulosa to'liq yoritilishi lozim.",
        lesson_type: "maqola",
        max_score: 10.0,
        due_date: "2026-12-01T23:59:59.000Z",
        rubric: JSON.stringify([
          { criterion: "Annotatsiya va ilmiy dolzarblik", weight: 20 },
          { criterion: "Nazariy apparat va matematik modellashtirish", weight: 40 },
          { criterion: "Grafiklar, tahliliy natijalar va xulosa", weight: 30 },
          { criterion: "Adabiyotlar ro'yxati va rasmiylashtirish", weight: 10 },
        ]),
      },
      {
        title: "Mustaqil ish: Klassik mexanika qonunlarining zamonaviy texnologiyalardagi o'rni va tadbiqlari",
        lab_key: "dynamics",
        description:
          "Mexanika qonunlarining robototexnika, avtomobil xavfsizlik tizimlari va gidravlik mexanizmlardagi o'rni bo'yicha mustaqil hisobot tayyorlash va topshirish.",
        lesson_type: "mustaqil_ish",
        max_score: 5.0,
        due_date: "2026-11-28T23:59:59.000Z",
        rubric: JSON.stringify([
          { criterion: "Mavzuning to'liq yoritilishi", weight: 40 },
          { criterion: "Amaliy hisob-kitoblar va misollar", weight: 40 },
          { criterion: "Xulosa va adabiyotlar", weight: 20 },
        ]),
      },
      {
        title: "Amaliy mashg'ulot: Kuchlar momenti va statik muvozanat tenglamalari bo'yicha masalalar yechish",
        lab_key: "statics",
        description:
          "400 ta masala bankidan statika bo'yicha 5 ta murakkab masalani to'liq analitik va grafik usulda yechib, hisobot shaklida topshirish.",
        lesson_type: "amaliyot",
        max_score: 4.0,
        due_date: "2026-11-25T23:59:59.000Z",
        rubric: JSON.stringify([
          { criterion: "Masalalarning to'g'ri yechimi", weight: 60 },
          { criterion: "Chizma va kuchlar diagrammasi", weight: 40 },
        ]),
      },
      {
        title: "Referat: O'zgaruvchan tok zanjirlari, RLC rezonansi va texnikada qo'llanilishi",
        lab_key: "electromagnetism",
        description:
          "Radiotexnika va telekommunikatsiyada RLC tebranish konturlarining roli va rezonans hodisasining fizik mohiyati bo'yicha referat yozish.",
        lesson_type: "referat",
        max_score: 5.0,
        due_date: "2026-12-05T23:59:59.000Z",
        rubric: JSON.stringify([
          { criterion: "Nazariy mazmun", weight: 50 },
          { criterion: "Formulalar va sxemalar", weight: 30 },
          { criterion: "Fikrning mustaqilligi va xulosalar", weight: 20 },
        ]),
      },
    ];

    for (const h of hemisAssignments) {
      await adapter.execute(
        `INSERT INTO assignments (title, lab_key, description, target_params_json, tolerance_pct, group_name, assignment_type, lesson_type, max_score, rubric_json, created_by, due_date, created_at)
         VALUES ($1, $2, $3, '{}', 5.0, NULL, 'independent', $4, $5, $6, $7, $8, $9)`,
        [
          h.title,
          h.lab_key,
          h.description,
          h.lesson_type,
          h.max_score,
          h.rubric,
          admin ? admin.id : null,
          h.due_date,
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

function normalizeIsoDate(d: string | number | Date | undefined, fallback: string): string {
  if (!d) return fallback;
  if (typeof d === "string") return d;
  if (typeof d === "number") return new Date(d).toISOString();
  if (d instanceof Date) return d.toISOString();
  return fallback;
}

/**
 * Inserts or updates an active session record in the database.
 * Supports dual dialect (SQLite and PostgreSQL) via ON CONFLICT DO UPDATE.
 */
export async function createActiveSession(
  params: CreateActiveSessionParams
): Promise<DbActiveSession> {
  if (!params.sessionId || !params.userId || !params.clientFingerprint) {
    throw new Error("Missing required session parameters (sessionId, userId, clientFingerprint)");
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const createdAt = normalizeIsoDate(params.createdAt, now);
  const lastSeenAt = normalizeIsoDate(params.lastSeenAt, createdAt);
  const expiresAt = normalizeIsoDate(params.expiresAt, now);
  const ipAddress = params.ipAddress ?? null;
  const userAgent = params.userAgent ? String(params.userAgent).slice(0, 512) : null;
  const isRevoked = params.isRevoked ? 1 : 0;

  const sql = `
    INSERT INTO active_sessions (
      session_id, user_id, client_fingerprint, ip_address, user_agent,
      created_at, last_seen_at, expires_at, is_revoked
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT(session_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      client_fingerprint = EXCLUDED.client_fingerprint,
      ip_address = EXCLUDED.ip_address,
      user_agent = EXCLUDED.user_agent,
      last_seen_at = EXCLUDED.last_seen_at,
      expires_at = EXCLUDED.expires_at,
      is_revoked = EXCLUDED.is_revoked
  `;

  await db.execute(sql, [
    params.sessionId,
    params.userId,
    params.clientFingerprint,
    ipAddress,
    userAgent,
    createdAt,
    lastSeenAt,
    expiresAt,
    isRevoked,
  ]);

  return {
    session_id: params.sessionId,
    user_id: params.userId,
    client_fingerprint: params.clientFingerprint,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: createdAt,
    last_seen_at: lastSeenAt,
    expires_at: expiresAt,
    is_revoked: isRevoked,
  };
}

/**
 * Retrieves an active session by sessionId and verifies that it is not revoked or expired.
 * Set options.includeRevokedOrExpired = true to bypass the validity check.
 */
export async function getActiveSession(
  sessionId: string,
  options?: { includeRevokedOrExpired?: boolean }
): Promise<DbActiveSession | null> {
  if (!sessionId || typeof sessionId !== "string") return null;
  const db = await getDb();
  const session = await db.queryOne<DbActiveSession>(
    "SELECT * FROM active_sessions WHERE session_id = $1",
    [sessionId]
  );
  if (!session) return null;

  if (!options?.includeRevokedOrExpired) {
    if (session.is_revoked !== 0) return null;
    const expTime = new Date(session.expires_at).getTime();
    if (isNaN(expTime) || expTime <= Date.now()) return null;
  }

  return session;
}

/**
 * Updates the last_seen_at timestamp for a valid, non-revoked session.
 */
export async function touchActiveSession(
  sessionId: string,
  lastSeenAt?: string | Date
): Promise<boolean> {
  if (!sessionId || typeof sessionId !== "string") return false;
  const db = await getDb();
  const now = normalizeIsoDate(lastSeenAt, new Date().toISOString());
  await db.execute(
    "UPDATE active_sessions SET last_seen_at = $1 WHERE session_id = $2 AND is_revoked = 0",
    [now, sessionId]
  );
  return true;
}

/**
 * Revokes a single session by sessionId.
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  if (!sessionId || typeof sessionId !== "string") return false;
  const db = await getDb();
  await db.execute(
    "UPDATE active_sessions SET is_revoked = 1 WHERE session_id = $1",
    [sessionId]
  );
  return true;
}

/**
 * Revokes all active sessions for a specific user (e.g. on ban or password change).
 */
export async function revokeAllUserSessions(userId: number): Promise<boolean> {
  if (!userId || typeof userId !== "number") return false;
  const db = await getDb();
  await db.execute(
    "UPDATE active_sessions SET is_revoked = 1 WHERE user_id = $1 AND is_revoked = 0",
    [userId]
  );
  return true;
}

/**
 * Prunes expired sessions from the database.
 */
export async function cleanupExpiredSessions(nowIso?: string | Date): Promise<void> {
  const db = await getDb();
  const threshold = normalizeIsoDate(nowIso, new Date().toISOString());
  await db.execute("DELETE FROM active_sessions WHERE expires_at < $1", [threshold]);
}

