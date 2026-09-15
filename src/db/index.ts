/**
 * Individual Goal Center - Dedicated Turso SQLite Database Client (2026 LTS)
 * Strict Per-App Database Isolation (Enterprise Multi-Tenant Standard)
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { createLogger, getDatabaseClient } from '../lib/sdk';

const logger = createLogger('goals-db');

export const goalsDb = getDatabaseClient('goals.db');

// Initialize isolated tables
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
    submitted_at INTEGER,
    approved_at INTEGER,
    approved_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

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

// Seed initial realistic data if empty
export function seedDefaultData(defaultOrgId = 'org_default'): void {
  const projectCount = goalsDb.query<{ count: number }, []>('SELECT count(*) as count FROM projects').get();
  if (projectCount && projectCount.count > 0) return;

  const now = Date.now();

  // 1. Projects
  goalsDb.run(
    `INSERT INTO projects (id, org_id, name, code, description, manager_id, created_at) VALUES 
     ('proj_titan', ?, 'Project Titan', 'TITAN', 'Core API Gateway & Zero-Trust Reverse Proxy Infrastructure', 'usr_manager', ?),
     ('proj_apollo', ?, 'Project Apollo', 'APOLLO', 'High-Performance Observability & Telemetry Processing Engine', 'usr_manager', ?),
     ('proj_hermes', ?, 'Project Hermes', 'HERMES', 'Next-Generation Multi-Tenant Edge Storage & Distributed Cache', 'usr_manager', ?)`,
    [defaultOrgId, now, defaultOrgId, now, defaultOrgId, now]
  );

  // 2. Sample Goal Boards in various states
  // Board 1: DRAFT (Jane Doe, Titan, 2026-Q1) - Editable
  goalsDb.run(
    `INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at) VALUES
     ('board_titan_q1', ?, 'proj_titan', 'usr_employee', 'Jane Doe', 'jane.doe@forge.internal', 'Platform Engineering', 'Q1 Titan Architecture & Edge Performance', '2026-Q1', 'DRAFT', 1, 1, ?, ?)`,
    [defaultOrgId, now - 86400000 * 5, now - 86400000 * 2]
  );

  // Goals for Board 1
  goalsDb.run(
    `INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at) VALUES
     ('item_1_1', 'board_titan_q1', 'Implement RFC 7807 problem details across all proxy endpoints', 'Standardize structured error payloads with trace IDs and actionable error URIs.', 'DELIVERABLE', '2026-02-15', 35, 60, 'IN_PROGRESS', 1, ?, ?),
     ('item_1_2', 'board_titan_q1', 'Optimize edge gateway p99 latency to under 30ms', 'Conduct load test benchmarks and fine-tune Bun socket concurrency buffers.', 'METRIC', '2026-03-01', 35, 20, 'IN_PROGRESS', 2, ?, ?),
     ('item_1_3', 'board_titan_q1', 'Complete Advanced Zero-Trust Architecture Certification', 'Advance infrastructure resilience and multi-tenant boundary compliance.', 'LEARNING', '2026-03-25', 30, 0, 'PENDING', 3, ?, ?)`,
    [now, now, now, now, now, now]
  );

  // Board 2: SUBMITTED (Jane Doe, Apollo, 2026-Q1) - Locked under Manager Review
  goalsDb.run(
    `INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, submitted_at, created_at, updated_at) VALUES
     ('board_apollo_q1', ?, 'proj_apollo', 'usr_employee', 'Jane Doe', 'jane.doe@forge.internal', 'Platform Engineering', 'Q1 Apollo Telemetry Pipeline Scale', '2026-Q1', 'SUBMITTED', 1, 1, ?, ?, ?)`,
    [defaultOrgId, now - 86400000 * 1, now - 86400000 * 4, now - 86400000 * 1]
  );

  goalsDb.run(
    `INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at) VALUES
     ('item_2_1', 'board_apollo_q1', 'Deploy Zero-Egress In-Memory Trace Collector', 'Stream telemetry internally without outbound cloud dependencies.', 'DELIVERABLE', '2026-02-28', 50, 0, 'PENDING', 1, ?, ?),
     ('item_2_2', 'board_apollo_q1', 'Achieve 100k events/sec sustained ingestion rate', 'Benchmark memory footprint under high ingestion stress.', 'METRIC', '2026-03-15', 50, 0, 'PENDING', 2, ?, ?)`,
    [now, now, now, now]
  );

  // Board 3: REWORK_REQUESTED (Alex Rivera, Hermes, 2026-Q1) - Unlocked for Revision (v2)
  goalsDb.run(
    `INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at) VALUES
     ('board_hermes_q1', ?, 'proj_hermes', 'usr_alex', 'Alex Rivera', 'alex.rivera@forge.internal', 'Core Systems', 'Q1 Distributed Cache Layer Rollout', '2026-Q1', 'REWORK_REQUESTED', 2, 2, ?, ?)`,
    [defaultOrgId, now - 86400000 * 8, now - 86400000 * 1]
  );

  goalsDb.run(
    `INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at) VALUES
     ('item_3_1', 'board_hermes_q1', 'Design Shared SQLite WAL Cache Buffer', 'Enable concurrent reads without lock contention.', 'DELIVERABLE', '2026-02-20', 50, 30, 'IN_PROGRESS', 1, ?, ?),
     ('item_3_2', 'board_hermes_q1', 'Attain 99.95% cache hit ratio across micro-apps', 'Requires concrete measurement tool specification.', 'METRIC', '2026-03-20', 50, 10, 'IN_PROGRESS', 2, ?, ?)`,
    [now, now, now, now]
  );

  goalsDb.run(
    `INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at) VALUES
     ('comm_3_1', 'board_hermes_q1', 'item_3_2', 'usr_manager', 'Sarah Connor', 'Engineering Lead', 'Please specify the exact measurement harness we will use for the 99.95% cache hit calculation before final signoff.', 'REWORK_REQUEST', ?)`,
    [now - 86400000 * 1]
  );

  // Board 4: APPROVED (Devon Vance, Titan, 2025-Q4) - Sealed Immutable History
  goalsDb.run(
    `INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, submitted_at, approved_at, approved_by, created_at, updated_at) VALUES
     ('board_titan_q4', ?, 'proj_titan', 'usr_devon', 'Devon Vance', 'devon.vance@forge.internal', 'Security & SRE', 'Q4 Zero-Trust Token Verification Suite', '2025-Q4', 'APPROVED', 2, 1, ?, ?, 'Sarah Connor (Engineering Lead)', ?, ?)`,
    [defaultOrgId, now - 86400000 * 90, now - 86400000 * 85, now - 86400000 * 95, now - 86400000 * 85]
  );

  goalsDb.run(
    `INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at) VALUES
     ('item_4_1', 'board_titan_q4', 'Implement HMAC-SHA256 Token Signature Verification', 'Completed and passed 100% branch test coverage.', 'DELIVERABLE', '2025-11-15', 50, 100, 'COMPLETED', 1, ?, ?),
     ('item_4_2', 'board_titan_q4', 'Zero Security Regressions on Core Gateway', 'Verified via automated nightly SAST pipeline.', 'METRIC', '2025-12-15', 50, 100, 'COMPLETED', 2, ?, ?)`,
    [now, now, now, now]
  );

  // 3. In-App Reminders
  goalsDb.run(
    `INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at) VALUES
     ('rem_1', ?, 'usr_employee', 'board_titan_q1', 'SUBMISSION_DUE', 'Q1 Goal Submission cycle closing in 4 days. Finalize and submit Project Titan board.', '2026-01-20', 0, ?),
     ('rem_2', ?, 'usr_manager', 'board_apollo_q1', 'PENDING_APPROVAL', 'Jane Doe submitted Project Apollo Q1 Board for manager review.', '2026-01-22', 0, ?),
     ('rem_3', ?, 'usr_alex', 'board_hermes_q1', 'REWORK_REQUIRED', 'Sarah Connor requested revisions on your Q1 Hermes Board. Review feedback.', '2026-01-18', 0, ?)`,
    [defaultOrgId, now, defaultOrgId, now, defaultOrgId, now]
  );

  logger.info('Database initialized with realistic projects, goal boards, and reminders');
}

// Auto-seed on startup
seedDefaultData();
