/**
 * Individual Goal Center - Dedicated Turso SQLite Database Client (2026 LTS)
 * Strict Per-App Database Isolation (Enterprise Multi-Tenant Standard)
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { createLogger, getDatabaseClient } from '../lib/sdk';
import type { AuthUser } from '../lib/types';

const logger = createLogger('goals-db');

const dbFilename = `${process.env.APP_NAME || 'goals'}.db`;
export const goalsDb = getDatabaseClient(dbFilename);

// Set SQLite performance & concurrency pragmas
goalsDb.run('PRAGMA journal_mode = WAL;');
goalsDb.run('PRAGMA busy_timeout = 5000;');
goalsDb.run('PRAGMA foreign_keys = ON;');

// Initialize isolated tables
goalsDb.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    roles TEXT NOT NULL,
    department TEXT NOT NULL,
    manager_id TEXT,
    manager_name TEXT,
    manager_email TEXT,
    job_title TEXT,
    employee_code TEXT,
    created_at INTEGER NOT NULL
  );
`);

try { goalsDb.run('ALTER TABLE users ADD COLUMN job_title TEXT'); } catch (_) {}
try { goalsDb.run('ALTER TABLE users ADD COLUMN employee_code TEXT'); } catch (_) {}

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS goals_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    manager_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS goal_boards (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_department TEXT NOT NULL,
    title TEXT NOT NULL,
    cycle TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    lock_version INTEGER NOT NULL DEFAULT 1,
    revision_number INTEGER NOT NULL DEFAULT 1,
    submission_deadline TEXT,
    submitted_at INTEGER,
    approved_at INTEGER,
    approved_by TEXT,
    unlocked_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

try { goalsDb.run('ALTER TABLE goal_boards ADD COLUMN submission_deadline TEXT'); } catch (_) {}
try { goalsDb.run('ALTER TABLE goal_boards ADD COLUMN unlocked_at INTEGER'); } catch (_) {}

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS goal_items (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'DELIVERABLE',
    target_date TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 25,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES goal_boards(id) ON DELETE CASCADE
  );
`);

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS review_comments (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    item_id TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'FEEDBACK',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES goal_boards(id) ON DELETE CASCADE
  );
`);

goalsDb.run(`
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date TEXT,
    is_dismissed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES goal_boards(id) ON DELETE CASCADE
  );
`);

// Add query optimization indexes
goalsDb.run('CREATE INDEX IF NOT EXISTS idx_goal_boards_org_owner ON goal_boards(org_id, owner_id);');
goalsDb.run('CREATE INDEX IF NOT EXISTS idx_goal_items_board_id ON goal_items(board_id);');
goalsDb.run('CREATE INDEX IF NOT EXISTS idx_review_comments_board_id ON review_comments(board_id);');
goalsDb.run('CREATE INDEX IF NOT EXISTS idx_reminders_org_user ON reminders(org_id, user_id, is_dismissed);');

// Seed initial data if explicitly requested (Strict Zero-Dummy Invariant)
export function seedDefaultData(defaultOrgId = 'org_default'): void {
  // Pure production zero-seed invariant: data is dynamically created by users or synced from central directory
}

/**
 * createProject
 * @requirements [LLR-GOALS-001]
 */
export function createProject(project: {
  id?: string;
  orgId: string;
  name: string;
  code: string;
  description?: string;
  managerId: string;
}): { id: string; orgId: string; name: string; code: string; description: string; managerId: string; createdAt: number } {
  const id = project.id || `proj_${crypto.randomUUID()}`;
  const now = Date.now();
  const desc = project.description || '';

  goalsDb.run(
    `INSERT INTO projects (id, org_id, name, code, description, manager_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, project.orgId, project.name.trim(), project.code.trim().toUpperCase(), desc.trim(), project.managerId, now]
  );

  return {
    id,
    orgId: project.orgId,
    name: project.name.trim(),
    code: project.code.trim().toUpperCase(),
    description: desc.trim(),
    managerId: project.managerId,
    createdAt: now,
  };
}

/**
  * getUserById
  * @requirements [LLR-SUB-001]
  */
export function getUserById(userId: string): AuthUser | null {
  const row = goalsDb.query<any, [string]>('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    roles: (row.roles || '').split(',').map((r: string) => r.trim()),
    department: row.department,
    managerId: row.manager_id || null,
    managerName: row.manager_name || null,
    managerEmail: row.manager_email || null,
    jobTitle: row.job_title || null,
    employeeCode: row.employee_code || null,
  };
}

/**
  * listUsers
  * @requirements [LLR-SUB-001]
  */
export function listUsers(): AuthUser[] {
  const rows = goalsDb.query<any, []>('SELECT * FROM users ORDER BY display_name ASC').all();
  return rows.map(r => ({
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    roles: (r.roles || '').split(',').map((s: string) => s.trim()),
    department: r.department,
    managerId: r.manager_id || null,
    managerName: r.manager_name || null,
    managerEmail: r.manager_email || null,
    jobTitle: r.job_title || null,
    employeeCode: r.employee_code || null,
  }));
}

/**
  * upsertUser
  * @requirements [LLR-SUB-001]
  */
export function upsertUser(user: { id: string; email: string; displayName: string; roles?: string[]; department?: string; managerId?: string | null; managerName?: string | null; managerEmail?: string | null; jobTitle?: string | null; employeeCode?: string | null }): AuthUser {
  const existing = getUserById(user.id);
  const now = Date.now();
  const rolesStr = Array.isArray(user.roles) ? user.roles.join(',') : (user.roles || 'roles/employee');
  const dept = user.department || 'General';
  const mgrId = user.managerId || null;
  const mgrName = user.managerName || null;
  const mgrEmail = user.managerEmail || null;
  const jobTitle = user.jobTitle || null;
  const employeeCode = user.employeeCode || null;

  if (existing) {
    goalsDb.run(
      `UPDATE users SET email = ?, display_name = ?, roles = ?, department = ?, manager_id = ?, manager_name = ?, manager_email = ?, job_title = ?, employee_code = ? WHERE id = ?`,
      [user.email, user.displayName, rolesStr, dept, mgrId, mgrName, mgrEmail, jobTitle, employeeCode, user.id]
    );
  } else {
    goalsDb.run(
      `INSERT INTO users (id, email, display_name, roles, department, manager_id, manager_name, manager_email, job_title, employee_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.displayName, rolesStr, dept, mgrId, mgrName, mgrEmail, jobTitle, employeeCode, now]
    );
  }

  return getUserById(user.id)!;
}

/**
 * Checks whether a user has subordinates registered locally in goals.db
 * @requirements [HLR-AUTH-102] [LLR-GOALS-001]
 */
export function isLocalManager(userId: string): boolean {
  if (!userId) return false;
  try {
    const row = goalsDb.query(`SELECT COUNT(*) as c FROM users WHERE manager_id = ?`).get(userId) as { c: number } | null;
    return Number(row?.c || 0) > 0;
  } catch {
    return false;
  }
}

