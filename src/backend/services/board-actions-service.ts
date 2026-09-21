/**
 * Individual Goal Center - Board Companion Actions Service (2026 LTS)
 * Modular companion service for board cloning, deletion, plan completion toggling, and note autosave.
 * Strictly adheres to <= 500 lines per file cap and zero monorepo bleed.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb } from '../../db';
import type { AuthUser, GoalBoard } from '../../lib/types';
import { assertBoardMutable, ForbiddenError, getBoardById, NotFoundError } from './board-service';

/**
 * Updates board notes in real-time
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001]
 */
export function updateBoardNotes(boardId: string, notes: string, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner can update notes.');
  }

  assertBoardMutable(board, user);

  const now = Date.now();
  goalsDb.run(`
    UPDATE goal_boards 
    SET notes = ?, updated_at = ? 
    WHERE id = ?
  `, [notes || '', now, boardId]);

  return getBoardById(boardId, orgId);
}

/**
 * Toggles training plan item completion status (PENDING <-> COMPLETED)
 * @requirements [HLR-GOALS-001] [LLR-GOALS-002]
 */
export function togglePlanCompletion(boardId: string, itemId: string, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner can toggle plan status.');
  }

  const item = (board.items || []).find(i => i.id === itemId);
  if (!item) {
    throw new NotFoundError(`Item "${itemId}" not found on this board.`);
  }

  const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
  const nextProgress = nextStatus === 'COMPLETED' ? 100 : 0;
  const now = Date.now();

  goalsDb.run(`
    UPDATE goal_items 
    SET status = ?, progress_percent = ?, updated_at = ? 
    WHERE id = ? AND board_id = ?
  `, [nextStatus, nextProgress, now, itemId, boardId]);

  goalsDb.run(`UPDATE goal_boards SET updated_at = ? WHERE id = ?`, [now, boardId]);

  return getBoardById(boardId, orgId);
}

/**
 * Duplicates / clones an existing goal board with its skills, gaps, plans, and notes
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001]
 */
export function cloneBoard(boardId: string, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const source = getBoardById(boardId, orgId);

  const newId = `board_${crypto.randomUUID()}`;
  const now = Date.now();
  const clonedTitle = `${source.title} (Copy)`;

  goalsDb.transaction(() => {
    goalsDb.run(`
      INSERT INTO goal_boards (
        id, org_id, owner_id, owner_name, owner_email, owner_department,
        title, status, lock_version, revision_number, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, ?, ?, ?)
    `, [
      newId, orgId, user.id, user.displayName, user.email,
      user.department || 'General', clonedTitle, source.notes || null, now, now
    ]);

    const sourceItems = source.items || [];
    sourceItems.forEach((item, idx) => {
      const newItemId = `item_${newId}_${idx + 1}`;
      goalsDb.run(`
        INSERT INTO goal_items (
          id, board_id, title, description, category, target_date, weight, progress_percent,
          status, sort_order, priority, target_qtr, plans_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newItemId, newId, item.title, item.description || '', item.category, item.targetDate,
        item.weight, 0, 'PENDING', idx + 1, item.priority || 'MEDIUM', item.targetQtr || null,
        item.plansCount || 0, now, now
      ]);
    });

    const commId = `comm_${crypto.randomUUID()}`;
    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, null, ?, ?, ?, ?, 'BOARD_CREATED', ?)
    `, [commId, newId, user.id, user.displayName, user.jobTitle || 'Contributor', `Goal Board cloned from "${source.title}".`, now]);
  })();

  return getBoardById(newId, orgId);
}

/**
 * Deletes a draft board safely with RBAC ownership checks
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001]
 */
export function deleteBoard(boardId: string, orgId: string, user: AuthUser): { success: boolean } {
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner or an administrator can delete this board.');
  }

  if (board.status !== 'DRAFT') {
    throw new ForbiddenError(`Cannot delete board in status "${board.status}". Only DRAFT boards can be deleted.`);
  }

  goalsDb.transaction(() => {
    goalsDb.run('DELETE FROM goal_items WHERE board_id = ?', [boardId]);
    goalsDb.run('DELETE FROM review_comments WHERE board_id = ?', [boardId]);
    goalsDb.run('DELETE FROM reminders WHERE board_id = ?', [boardId]);
    goalsDb.run('DELETE FROM goal_boards WHERE id = ?', [boardId]);
  })();

  return { success: true };
}
