/**
 * SG Forge Micro-App Submodule - Dev System Test Data Seeder (2026 LTS)
 * Populates realistic goal boards, deliverables, and review stages
 * specifically for existing dev system employees across management hierarchy.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb } from '../../src/db';
import { devUsers, getDevProjects, getDevBoards, devItems, getDevComments, getDevReminders } from './seed-fixtures';

export function seedDevSystemData(orgId: string = 'org_default'): void {
  const now = Date.now();

  goalsDb.run('BEGIN TRANSACTION;');

  try {
    // 1. Seed Real Dev System Employees & Managers
    const usersStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO users (
        id, email, display_name, roles, department,
        manager_id, manager_name, manager_email, job_title, employee_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of devUsers) {
      usersStmt.run(
        u.id, u.email, u.displayName, u.roles, u.department,
        u.managerId, u.managerName, u.managerEmail, u.jobTitle, u.employeeCode, now
      );
    }

    // 2. Seed Projects
    const projStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO projects (id, org_id, name, code, description, manager_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const projects = getDevProjects(orgId);
    for (const p of projects) {
      projStmt.run(p.id, p.orgId, p.name, p.code, p.description, p.managerId, now);
    }

    // 3. Seed Goal Boards
    const boardStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO goal_boards (
        id, org_id, project_id, owner_id, owner_name, owner_email, owner_department,
        title, cycle, status, lock_version, revision_number, submission_deadline,
        submitted_at, approved_at, approved_by, unlocked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const boards = getDevBoards(orgId, now);
    for (const b of boards) {
      boardStmt.run(
        b.id, b.orgId, b.projectId, b.ownerId, b.ownerName, b.ownerEmail, b.ownerDepartment,
        b.title, b.cycle, b.status, b.lockVersion, b.revisionNumber, b.submissionDeadline,
        b.submittedAt, b.approvedAt, b.approvedBy, b.unlockedAt, now, now
      );
    }

    // 4. Seed Goal Items (Milestones)
    const itemStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO goal_items (
        id, board_id, title, description, category, target_date,
        weight, progress_percent, status, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of devItems) {
      itemStmt.run(
        item.id, item.boardId, item.title, item.description, item.category,
        item.targetDate, item.weight, item.progressPercent, item.status,
        item.sortOrder, now, now
      );
    }

    // 5. Seed Review Timeline Comments
    const commentStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO review_comments (
        id, board_id, item_id, author_id, author_name, author_role,
        comment_text, type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const comments = getDevComments(now);
    for (const c of comments) {
      commentStmt.run(
        c.id, c.boardId, c.itemId, c.authorId, c.authorName, c.authorRole,
        c.commentText, c.type, c.createdAt
      );
    }

    // 6. Seed Action Alerts & Reminders
    const remStmt = goalsDb.prepare(`
      INSERT OR REPLACE INTO reminders (
        id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reminders = getDevReminders(orgId, now);
    for (const r of reminders) {
      remStmt.run(r.id, r.orgId, r.userId, r.boardId, r.type, r.message, r.dueDate, 0, now);
    }

    goalsDb.run('COMMIT;');
    console.log(`[seed] Successfully seeded test data for ${devUsers.length} dev employees and ${boards.length} goal boards into goals.db.`);
  } catch (err) {
    goalsDb.run('ROLLBACK;');
    console.error('[seed] Error seeding test data:', err);
    throw err;
  }
}

if (import.meta.main) {
  seedDevSystemData();
}
