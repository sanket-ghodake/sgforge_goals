/**
 * Individual Goal Center - Manager Review & Rework Conductor
 * Orchestrates approval flows, item-specific feedback threads, revision increments, and lock sealing.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb } from '../../db';
import type { AuthUser, GoalBoard } from '../../lib/types';
import { getBoardById, ValidationError } from './board-service';

export function listPendingReviews(orgId: string): GoalBoard[] {
  const query = `
    SELECT b.*, p.name as project_name 
    FROM goal_boards b 
    LEFT JOIN projects p ON b.project_id = p.id 
    WHERE b.org_id = ? AND b.status = 'SUBMITTED'
    ORDER BY b.submitted_at ASC
  `;
  const rows = goalsDb.query<any, [string]>(query).all(orgId);
  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    projectId: r.project_id,
    projectName: r.project_name,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    ownerEmail: r.owner_email,
    ownerDepartment: r.owner_department,
    title: r.title,
    cycle: r.cycle,
    status: r.status,
    lockVersion: r.lock_version,
    revisionNumber: r.revision_number,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
    approvedBy: r.approved_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function requestRework(boardId: string, managerUser: AuthUser, commentText: string, itemId?: string): GoalBoard {
  const orgId = managerUser.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.status !== 'SUBMITTED') {
    throw new ValidationError(`Cannot request rework for board in status "${board.status}". Board must be SUBMITTED.`);
  }

  if (!commentText || commentText.trim().length === 0) {
    throw new ValidationError('A comment explaining the requested revisions is mandatory.');
  }

  const now = Date.now();
  const nextRev = board.revisionNumber + 1;
  const commentId = `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  const reminderId = `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

  goalsDb.transaction(() => {
    // 1. Update board status & increment revision
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'REWORK_REQUESTED', revision_number = ?, lock_version = lock_version + 1, updated_at = ? 
      WHERE id = ?
    `, [nextRev, now, boardId]);

    // 2. Insert Review Comment
    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'REWORK_REQUEST', ?)
    `, [
      commentId,
      boardId,
      itemId || null,
      managerUser.id,
      managerUser.displayName,
      managerUser.roles[0] || 'Manager Reviewer',
      commentText.trim(),
      now,
    ]);

    // 3. Create Rework Notification for Employee
    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'REWORK_REQUIRED', ?, null, 0, ?)
    `, [
      reminderId,
      orgId,
      board.ownerId,
      boardId,
      `${managerUser.displayName} requested revisions on "${board.title}" (Rev ${nextRev}): "${commentText.slice(0, 80)}${commentText.length > 80 ? '...' : ''}"`,
      now,
    ]);

    // 4. Dismiss manager's pending approval reminder
    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type = 'PENDING_APPROVAL'
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function approveBoard(boardId: string, managerUser: AuthUser, note?: string): GoalBoard {
  const orgId = managerUser.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.status !== 'SUBMITTED') {
    throw new ValidationError(`Cannot approve board in status "${board.status}". Board must be SUBMITTED.`);
  }

  const now = Date.now();
  const approverSignature = `${managerUser.displayName} (${managerUser.roles[0] || 'Engineering Lead'})`;

  goalsDb.transaction(() => {
    // 1. Seal and permanently lock board
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'APPROVED', approved_at = ?, approved_by = ?, lock_version = lock_version + 1, updated_at = ? 
      WHERE id = ?
    `, [now, approverSignature, now, boardId]);

    // 2. Optional approval note comment
    if (note && note.trim()) {
      const commentId = `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
      goalsDb.run(`
        INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
        VALUES (?, ?, null, ?, ?, ?, ?, 'APPROVAL_NOTE', ?)
      `, [
        commentId,
        boardId,
        managerUser.id,
        managerUser.displayName,
        managerUser.roles[0] || 'Manager Reviewer',
        note.trim(),
        now,
      ]);
    }

    // 3. Dismiss manager's pending approval reminder
    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type = 'PENDING_APPROVAL'
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}
