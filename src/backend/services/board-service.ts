/**
 * Individual Goal Center - Board Lifecycle & Transactional Lock Conductor
 * Enforces server-side lock guarantees, multi-tenant isolation, and state machine transitions.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb } from '../../db';
import type { AuthUser, CreateBoardInput, GoalBoard, GoalBoardRow, GoalItem, GoalItemRow, Project, ProjectRow, UpdateGoalItemsInput } from '../../lib/types';

export class BoardLockedError extends Error {
  readonly status = 423;
  readonly code = 'BOARD_LOCKED';
  constructor(message: string) {
    super(message);
    this.name = 'BoardLockedError';
  }
}

export class ValidationError extends Error {
  readonly status = 400;
  readonly code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  readonly code = 'FORBIDDEN';
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  readonly code = 'NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function listProjects(orgId: string): Project[] {
  return goalsDb.query<ProjectRow, [string, string]>('SELECT * FROM projects WHERE org_id = ? OR org_id = ? ORDER BY name ASC').all(orgId, 'org_default').map(p => ({
    id: p.id,
    orgId: p.org_id,
    name: p.name,
    code: p.code,
    description: p.description,
    managerId: p.manager_id,
    createdAt: p.created_at,
  }));
}

export function listBoards(orgId: string, filter?: { ownerId?: string; projectId?: string; cycle?: string }): GoalBoard[] {
  let query = `
    SELECT b.*, p.name as project_name, u.manager_name as manager_name
    FROM goal_boards b 
    LEFT JOIN projects p ON b.project_id = p.id 
    LEFT JOIN users u ON b.owner_id = u.id
    WHERE b.org_id = ?
  `;
  const params: any[] = [orgId];

  if (filter?.ownerId) {
    query += ' AND b.owner_id = ?';
    params.push(filter.ownerId);
  }
  if (filter?.projectId) {
    query += ' AND b.project_id = ?';
    params.push(filter.projectId);
  }
  if (filter?.cycle) {
    query += ' AND b.cycle = ?';
    params.push(filter.cycle);
  }

  query += ' ORDER BY b.updated_at DESC';

  const rows = goalsDb.query<GoalBoardRow & { manager_name?: string }, any[]>(query).all(...params);
  const boardIds = rows.map(r => r.id);
  const itemsByBoardId: Record<string, GoalItem[]> = {};

  if (boardIds.length > 0) {
    const placeholders = boardIds.map(() => '?').join(',');
    const allItems = goalsDb.query<GoalItemRow, any[]>(`
      SELECT * FROM goal_items WHERE board_id IN (${placeholders}) ORDER BY sort_order ASC
    `).all(...boardIds);

    allItems.forEach(i => {
      const item: GoalItem = {
        id: i.id,
        boardId: i.board_id,
        title: i.title,
        description: i.description,
        category: i.category,
        targetDate: i.target_date,
        weight: i.weight,
        progressPercent: i.progress_percent,
        status: i.status,
        sortOrder: i.sort_order,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      };
      if (!itemsByBoardId[i.board_id]) itemsByBoardId[i.board_id] = [];
      itemsByBoardId[i.board_id].push(item);
    });
  }

  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    projectId: r.project_id,
    projectName: r.project_name,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    ownerEmail: r.owner_email,
    ownerDepartment: r.owner_department,
    managerName: r.manager_name || r.approved_by || 'Sarah Connor',
    title: r.title,
    cycle: r.cycle,
    status: r.status,
    lockVersion: r.lock_version,
    revisionNumber: r.revision_number,
    submissionDeadline: r.submission_deadline,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
    approvedBy: r.approved_by,
    unlockedAt: r.unlocked_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: itemsByBoardId[r.id] || [],
  }));
}

export function getBoardById(boardId: string, orgId: string, requestingUser?: AuthUser): GoalBoard {
  const row = goalsDb.query<any, [string, string]>(`
    SELECT b.*, p.name as project_name, u.manager_name as manager_name
    FROM goal_boards b 
    LEFT JOIN projects p ON b.project_id = p.id 
    LEFT JOIN users u ON b.owner_id = u.id
    WHERE b.id = ? AND b.org_id = ?
  `).get(boardId, orgId);

  if (!row) {
    throw new NotFoundError(`Goal Board "${boardId}" not found in this organization.`);
  }

  // Security Authorization Check: Timeline comments accessible ONLY by board owner or manager/admin
  const isOwner = requestingUser ? requestingUser.id === row.owner_id : true;
  const isManager = requestingUser ? (requestingUser.roles.some((r: string) => r === 'roles/manager' || r === 'roles/admin' || r === 'roles/super_admin') || requestingUser.id === 'usr_manager' || row.manager_id === requestingUser.id) : true;
  const allowedTimeline = isOwner || isManager;

  // Auto-lock check for overdue submission deadlines
  let currentStatus = row.status;
  if (row.submission_deadline && (currentStatus === 'DRAFT' || currentStatus === 'REWORK_REQUESTED')) {
    const deadlineTime = new Date(`${row.submission_deadline}T23:59:59`).getTime();
    if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
      currentStatus = 'LOCKED_OVERDUE';
      goalsDb.run(`UPDATE goal_boards SET status = 'LOCKED_OVERDUE', updated_at = ? WHERE id = ?`, [Date.now(), boardId]);
    }
  }

  const items = goalsDb.query<any, [string]>(`
    SELECT * FROM goal_items WHERE board_id = ? ORDER BY sort_order ASC, created_at ASC
  `).all(boardId).map(i => ({
    id: i.id,
    boardId: i.board_id,
    title: i.title,
    description: i.description,
    category: i.category,
    targetDate: i.target_date,
    weight: i.weight,
    progressPercent: i.progress_percent,
    status: i.status,
    sortOrder: i.sort_order,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  }));

  const rawComments = allowedTimeline ? goalsDb.query<any, [string]>(`
    SELECT * FROM review_comments WHERE board_id = ? ORDER BY created_at ASC
  `).all(boardId) : [];

  const comments = rawComments.map(c => ({
    id: c.id,
    boardId: c.board_id,
    itemId: c.item_id,
    authorId: c.author_id,
    authorName: c.author_name,
    authorRole: c.author_role,
    commentText: c.comment_text,
    type: c.type,
    createdAt: c.created_at,
  }));

  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    projectName: row.project_name,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    ownerDepartment: row.owner_department,
    managerName: row.manager_name || row.approved_by || 'Sarah Connor',
    title: row.title,
    cycle: row.cycle,
    status: currentStatus,
    lockVersion: row.lock_version,
    revisionNumber: row.revision_number,
    submissionDeadline: row.submission_deadline,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    unlockedAt: row.unlocked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    comments,
  };
}

export function assertBoardMutable(board: GoalBoard, user: AuthUser): void {
  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner can edit milestones.');
  }

  if (board.status === 'SUBMITTED') {
    throw new BoardLockedError('This board has been submitted to your manager and is locked against modifications.');
  }

  if (board.status === 'APPROVED') {
    throw new BoardLockedError('This board has been approved and sealed. Request unlock to make modifications.');
  }

  if (board.status === 'LOCKED_OVERDUE') {
    throw new BoardLockedError('Submission deadline passed. Board is auto-locked. Request manager unlock to continue editing.');
  }
}

export function createBoard(input: CreateBoardInput, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const now = Date.now();
  const id = `board_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // Verify project belongs to org or is an org_default baseline project
  const project = goalsDb.query<any, [string, string, string]>('SELECT * FROM projects WHERE id = ? AND (org_id = ? OR org_id = ?)').get(input.projectId, orgId, 'org_default');
  if (!project) {
    throw new NotFoundError('Selected project not found in this organization.');
  }

  goalsDb.run(`
    INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, ?, ?)
  `, [
    id,
    orgId,
    input.projectId,
    user.id,
    user.displayName,
    user.email,
    user.department || 'Engineering Squad',
    input.title.trim(),
    input.cycle.trim(),
    now,
    now,
  ]);

  // Insert an initial starter milestone
  goalsDb.run(`
    INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at)
    VALUES (?, ?, 'Define initial milestone deliverables', 'Outline project deliverables and target verification metrics.', 'DELIVERABLE', '2026-03-31', 100, 0, 'PENDING', 1, ?, ?)
  `, [`item_${id}_1`, id, now, now]);

  return getBoardById(id, orgId);
}

export function updateGoalItems(boardId: string, input: UpdateGoalItemsInput, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);
  assertBoardMutable(board, user);

  if (!input.items || input.items.length === 0) {
    throw new ValidationError('A goal board must have at least one milestone item.');
  }

  const now = Date.now();

  // Atomically rewrite items
  goalsDb.transaction(() => {
    goalsDb.run('DELETE FROM goal_items WHERE board_id = ?', [boardId]);
    input.items.forEach((item, index) => {
      const itemId = item.id && item.id.startsWith('item_') ? item.id : `item_${boardId}_${index + 1}`;
      goalsDb.run(`
        INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        itemId,
        boardId,
        item.title.trim(),
        item.description?.trim() || '',
        item.category || 'DELIVERABLE',
        item.targetDate || '2026-03-31',
        Number(item.weight) || 0,
        Number(item.progressPercent) || 0,
        item.status || 'PENDING',
        index + 1,
        now,
        now,
      ]);
    });

    goalsDb.run('UPDATE goal_boards SET updated_at = ? WHERE id = ?', [now, boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function submitBoard(boardId: string, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner can submit for review.');
  }

  if (board.status !== 'DRAFT' && board.status !== 'REWORK_REQUESTED') {
    throw new ValidationError(`Board cannot be submitted in status "${board.status}". Must be DRAFT or REWORK_REQUESTED.`);
  }

  const items = board.items || [];
  if (items.length === 0) {
    throw new ValidationError('Cannot submit an empty goal board. Add at least one milestone.');
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight !== 100) {
    throw new ValidationError(`Total milestone weight must equal 100%. Current total is ${totalWeight}%.`);
  }

  const now = Date.now();

  goalsDb.transaction(() => {
    goalsDb.run(`
      UPDATE goal_boards 
      SET status = 'SUBMITTED', submitted_at = ?, updated_at = ? 
      WHERE id = ?
    `, [now, now, boardId]);

    const targetManagerId = user.managerId || 'usr_admin';
    const hasManager = Boolean(user.managerId);
    const remId = `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const notificationMsg = hasManager
      ? `${board.ownerName} submitted "${board.title}" (${board.cycle}) for manager review.`
      : `${board.ownerName} submitted "${board.title}" (${board.cycle}) for review (No manager assigned - routed to Admin).`;

    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'PENDING_APPROVAL', ?, null, 0, ?)
    `, [
      remId,
      orgId,
      targetManagerId,
      boardId,
      notificationMsg,
      now,
    ]);

    if (!hasManager) {
      const commId = `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      goalsDb.run(`
        INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
        VALUES (?, ?, null, 'sys_auth', 'System Guard', 'System Audit', 'Board submitted for approval. Contributor has no assigned manager — routed for Admin review.', 'FEEDBACK', ?)
      `, [commId, boardId, now]);
    }

    goalsDb.run(`
      UPDATE reminders SET is_dismissed = 1 
      WHERE board_id = ? AND type IN ('SUBMISSION_DUE', 'REWORK_REQUIRED')
    `, [boardId]);
  })();

  return getBoardById(boardId, orgId);
}

export function updateItemProgress(boardId: string, itemId: string, progressPercent: number, status: string, user: AuthUser): GoalBoard {
  const orgId = user.orgId || 'org_default';
  const board = getBoardById(boardId, orgId);

  if (board.ownerId !== user.id && !user.roles.includes('roles/admin')) {
    throw new ForbiddenError('Only the goal board owner can update milestone progress.');
  }

  const validProgress = Math.max(0, Math.min(100, Math.round(Number(progressPercent) || 0)));
  const nextStatus = status || (validProgress >= 100 ? 'COMPLETED' : validProgress > 0 ? 'IN_PROGRESS' : 'PENDING');
  const now = Date.now();

  goalsDb.run(`
    UPDATE goal_items 
    SET progress_percent = ?, status = ?, updated_at = ? 
    WHERE id = ? AND board_id = ?
  `, [validProgress, nextStatus, now, itemId, boardId]);

  goalsDb.run(`
    UPDATE goal_boards 
    SET updated_at = ? 
    WHERE id = ?
  `, [now, boardId]);

  return getBoardById(boardId, orgId);
}
