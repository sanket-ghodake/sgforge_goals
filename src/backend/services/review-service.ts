/**
 * Individual Goal Center - Manager Review & Rework Conductor
 * Orchestrates approval flows, item-specific feedback threads, revision increments, and lock sealing.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb } from '../../db';
import type { AuthUser, GoalBoard, GoalBoardRow, GoalBoardStatus } from '../../lib/types';
import { ForbiddenError, getBoardById, ValidationError } from './board-service';

function assertManagerOrAdmin(user: AuthUser, board?: GoalBoard): void {
  if (board && board.ownerId === user.id) {
    throw new ForbiddenError('Segregation of Duties Violation: You cannot review, rework, or approve your own goal board. Review must be executed by your assigned manager.');
  }

  const isAdmin = user.roles.some(r => r === 'roles/admin' || r === 'roles/super_admin');
  if (isAdmin) return;

  const hasManagerRole = user.roles.some(r => r === 'roles/manager');
  if (!hasManagerRole) {
    throw new ForbiddenError('Only managers or admins can execute review operations.');
  }

  if (board) {
    const isAssignedManager = Boolean(
      (board.managerId && board.managerId === user.id) ||
      (board.managerName && user.displayName && board.managerName.toLowerCase() === user.displayName.toLowerCase()) ||
      (board.ownerDepartment && user.department && board.ownerDepartment.toLowerCase() === user.department.toLowerCase())
    );
    if (!isAssignedManager && !isAdmin) {
      throw new ForbiddenError('You are not authorized to review goal boards outside your assigned reporting chain or department.');
    }
  }
}

export function listPendingReviews(orgId: string): GoalBoard[] {
  const query = `
    SELECT b.*, p.name as project_name 
    FROM goal_boards b 
    LEFT JOIN projects p ON b.project_id = p.id 
    WHERE b.org_id = ? AND b.status = 'SUBMITTED'
    ORDER BY b.submitted_at ASC
  `;
  const rows = goalsDb.query<GoalBoardRow, [string]>(query).all(orgId);
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
  assertManagerOrAdmin(managerUser, board);

  const allowedStatuses: GoalBoardStatus[] = ['SUBMITTED', 'APPROVED', 'UNLOCK_REQUESTED', 'LOCKED_OVERDUE', 'REWORK_REQUESTED'];
  if (!allowedStatuses.includes(board.status)) {
    throw new ValidationError(`Cannot request rework for board in status "${board.status}". Board must be SUBMITTED, APPROVED, UNLOCK_REQUESTED, LOCKED_OVERDUE, or REWORK_REQUESTED.`);
  }

  if (!commentText || commentText.trim().length === 0) {
    throw new ValidationError('A comment explaining the requested revisions is mandatory.');
  }

  const now = Date.now();
  const nextRev = board.revisionNumber + 1;
  const commentId = `comm_${crypto.randomUUID()}`;
  const reminderId = `rem_${crypto.randomUUID()}`;
  const authorRole = managerUser.jobTitle || managerUser.roles[0] || 'Manager';

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'REWORK_REQUESTED', revision_number = ?, lock_version = lock_version + 1, updated_at = ? 
      WHERE id = ?
    `, [nextRev, now, boardId]);

    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'REWORK_REQUEST', ?)
    `, [
      commentId,
      boardId,
      itemId || null,
      managerUser.id,
      managerUser.displayName,
      authorRole,
      commentText.trim(),
      now,
    ]);

    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'REWORK_REQUIRED', ?, null, 0, ?)
    `, [
      reminderId,
      orgId,
      board.ownerId,
      boardId,
      `${managerUser.displayName} moved board "${board.title}" to Rework (Rev ${nextRev}): "${commentText.slice(0, 80)}${commentText.length > 80 ? '...' : ''}"`,
      now,
    ]);

    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type IN ('PENDING_APPROVAL', 'UNLOCK_REQUESTED')
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function approveBoard(boardId: string, managerUser: AuthUser, note?: string): GoalBoard {
  const orgId = managerUser.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);
  assertManagerOrAdmin(managerUser, board);

  if (board.status !== 'SUBMITTED' && board.status !== 'REWORK_REQUESTED' && board.status !== 'LOCKED_OVERDUE' && board.status !== 'UNLOCK_REQUESTED') {
    throw new ValidationError(`Cannot approve board in status "${board.status}".`);
  }

  const now = Date.now();
  const approverRole = managerUser.jobTitle || managerUser.roles[0] || 'Manager';
  const approverSignature = `${managerUser.displayName} (${approverRole})`;

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'APPROVED', approved_at = ?, approved_by = ?, lock_version = lock_version + 1, updated_at = ? 
      WHERE id = ?
    `, [now, approverSignature, now, boardId]);

    if (note && note.trim()) {
      const commentId = `comm_${crypto.randomUUID()}`;
      goalsDb.run(`
        INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
        VALUES (?, ?, null, ?, ?, ?, ?, 'APPROVAL_NOTE', ?)
      `, [
        commentId,
        boardId,
        managerUser.id,
        managerUser.displayName,
        approverRole,
        note.trim(),
        now,
      ]);
    }

    const approvalRemId = `rem_${crypto.randomUUID()}`;
    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'BOARD_APPROVED', ?, null, 0, ?)
    `, [
      approvalRemId,
      orgId,
      board.ownerId,
      boardId,
      `${managerUser.displayName} approved your goal board "${board.title}"${note ? `: "${note.slice(0, 80)}"` : '.'}`,
      now,
    ]);

    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type IN ('PENDING_APPROVAL', 'UNLOCK_REQUESTED')
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function requestBoardUnlock(boardId: string, user: AuthUser, reason?: string): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.some(r => r === 'roles/admin' || r === 'roles/super_admin')) {
    throw new ForbiddenError('Only the goal board owner can request an unlock.');
  }

  const now = Date.now();
  const commentId = `comm_${crypto.randomUUID()}`;
  const reminderId = `rem_${crypto.randomUUID()}`;
  const reasonText = reason?.trim() || 'Contributor requested board unlock for further milestone revisions.';

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards SET status = 'UNLOCK_REQUESTED', updated_at = ? WHERE id = ?
    `, [now, boardId]);

    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, null, ?, ?, 'Contributor', ?, 'UNLOCK_REQUEST', ?)
    `, [
      commentId,
      boardId,
      user.id,
      user.displayName,
      `Unlock Requested: ${reasonText}`,
      now,
    ]);

    let targetManagerId: string = board.managerId || user.managerId || '';
    if (!targetManagerId) {
      const adminRow = goalsDb.query<{ id: string }, []>("SELECT id FROM users WHERE roles LIKE '%roles/admin%' OR roles LIKE '%roles/super_admin%' LIMIT 1").get();
      targetManagerId = adminRow?.id || 'admin';
    }
    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'UNLOCK_REQUESTED', ?, null, 0, ?)
    `, [
      reminderId,
      orgId,
      targetManagerId,
      boardId,
      `${user.displayName} requested unlock for board "${board.title}": "${reasonText}"`,
      now,
    ]);
  })();

  return getBoardById(boardId, orgId);
}

export function unlockBoard(boardId: string, managerUser: AuthUser, reason?: string): GoalBoard {
  const orgId = managerUser.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);
  assertManagerOrAdmin(managerUser, board);

  const now = Date.now();
  const commentId = `comm_${crypto.randomUUID()}`;
  const noteText = reason?.trim() || 'Board unlocked by manager for contributor editing.';
  const nextRev = board.revisionNumber + 1;
  const unlockAuthorRole = managerUser.jobTitle || managerUser.roles[0] || 'Manager';

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'REWORK_REQUESTED', unlocked_at = ?, revision_number = ?, lock_version = lock_version + 1, updated_at = ? 
      WHERE id = ?
    `, [now, nextRev, now, boardId]);

    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, null, ?, ?, ?, ?, 'UNLOCKED', ?)
    `, [
      commentId,
      boardId,
      managerUser.id,
      managerUser.displayName,
      unlockAuthorRole,
      `Unlocked for Editing: ${noteText}`,
      now,
    ]);

    const unlockRemId = `rem_${crypto.randomUUID()}`;
    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'BOARD_UNLOCKED', ?, null, 0, ?)
    `, [
      unlockRemId,
      orgId,
      board.ownerId,
      boardId,
      `${managerUser.displayName} unlocked your goal board "${board.title}" for revisions: "${noteText.slice(0, 80)}"`,
      now,
    ]);

    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type IN ('PENDING_APPROVAL', 'UNLOCK_REQUESTED')
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function setSubmissionDeadline(boardId: string, managerUser: AuthUser, deadlineDate: string): GoalBoard {
  const orgId = managerUser.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);
  assertManagerOrAdmin(managerUser, board);

  if (!deadlineDate || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate.trim())) {
    throw new ValidationError('A valid submission deadline date in YYYY-MM-DD format is required.');
  }

  const now = Date.now();
  const commentId = `comm_${crypto.randomUUID()}`;
  const cleanDeadline = deadlineDate.trim();
  const deadlineAuthorRole = managerUser.jobTitle || managerUser.roles[0] || 'Manager';

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards SET submission_deadline = ?, updated_at = ? WHERE id = ?
    `, [cleanDeadline, now, boardId]);

    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, null, ?, ?, ?, ?, 'DEADLINE_SET', ?)
    `, [
      commentId,
      boardId,
      managerUser.id,
      managerUser.displayName,
      deadlineAuthorRole,
      `Submission Deadline set to ${cleanDeadline}`,
      now,
    ]);
  })();

  return getBoardById(boardId, orgId);
}

export function addReviewComment(boardId: string, user: AuthUser, commentText: string, itemId?: string): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  const isOwner = user.id === board.ownerId;
  const isManager = user.roles.some(r => r === 'roles/manager' || r === 'roles/admin' || r === 'roles/super_admin');

  if (!isOwner && !isManager) {
    throw new ForbiddenError("Security Restricted: Review timeline comments can only be created by the board owner or assigned manager.");
  }

  if (!commentText || commentText.trim().length === 0) {
    throw new ValidationError('Comment text is required.');
  }
  if (commentText.length > 2000) {
    throw new ValidationError('Comment exceeds maximum allowed length of 2000 characters.');
  }

  const now = Date.now();
  const commentId = `comm_${crypto.randomUUID()}`;
  const authorRole = user.id === board.ownerId ? (user.jobTitle || 'Contributor') : (user.jobTitle || user.roles[0] || 'Reviewer');

  goalsDb.transaction(() => {
    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'FEEDBACK', ?)
    `, [
      commentId,
      boardId,
      itemId || null,
      user.id,
      user.displayName,
      authorRole,
      commentText.trim(),
      now,
    ]);

    const recipientId: string = (user.id === board.ownerId
      ? (board.managerId || user.managerId)
      : board.ownerId) || '';

    if (recipientId) {
      const reminderId = `rem_${crypto.randomUUID()}`;
      goalsDb.run(`
        INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
        VALUES (?, ?, ?, ?, 'FEEDBACK_RECEIVED', ?, null, 0, ?)
      `, [
        reminderId,
        orgId,
        recipientId,
        boardId,
        `${user.displayName} commented on "${board.title}": "${commentText.slice(0, 80)}${commentText.length > 80 ? '...' : ''}"`,
        now,
      ]);
    }
  })();

  return getBoardById(boardId, orgId);
}

