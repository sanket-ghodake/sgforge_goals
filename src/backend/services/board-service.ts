/**
 * Individual Goal Center - Board Lifecycle & Transactional Lock Conductor
 * Enforces server-side lock guarantees, multi-tenant isolation, and state machine transitions.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { goalsDb, upsertUser } from '../../db';
import type { AuthUser, CreateBoardInput, GoalBoard, GoalBoardRow, GoalItem, GoalItemRow, PriorityLevel, Project, ProjectRow, UpdateGoalItemsInput } from '../../lib/types';

export class BoardLockedError extends Error {
  readonly status = 423;
  readonly code = 'BOARD_LOCKED';
  constructor(message: string) { super(message); this.name = 'BoardLockedError'; }
}
export class ValidationError extends Error {
  readonly status = 400;
  readonly code = 'VALIDATION_ERROR';
  constructor(message: string) { super(message); this.name = 'ValidationError'; }
}
export class ForbiddenError extends Error {
  readonly status = 403;
  readonly code = 'FORBIDDEN';
  constructor(message: string) { super(message); this.name = 'ForbiddenError'; }
}
export class NotFoundError extends Error {
  readonly status = 404;
  readonly code = 'NOT_FOUND';
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export function getCycleDefaultTargetDate(cycle?: string): string {
  const now = new Date();
  if (cycle && /^\d{4}-Q[1-4]$/.test(cycle.trim())) {
    const [yearStr, qStr] = cycle.trim().split('-Q');
    const year = parseInt(yearStr, 10);
    const q = parseInt(qStr, 10);
    const endMonth = q * 3;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
  const endMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
  const lastDay = new Date(now.getFullYear(), endMonth, 0).getDate();
  return `${now.getFullYear()}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function listProjects(orgId: string): Project[] {
  return goalsDb.query<ProjectRow, [string]>('SELECT * FROM projects WHERE org_id = ? ORDER BY name ASC').all(orgId).map(p => ({
    id: p.id,
    orgId: p.org_id,
    name: p.name,
    code: p.code,
    description: p.description,
    managerId: p.manager_id,
    createdAt: p.created_at,
  }));
}

export function listBoards(orgId: string, filter?: { ownerId?: string }): GoalBoard[] {
  let query = `
    SELECT b.*, u.manager_name as manager_name, u.manager_id as manager_id
    FROM goal_boards b 
    LEFT JOIN users u ON b.owner_id = u.id
    WHERE b.org_id = ?
  `;
  const params: any[] = [orgId];

  if (filter?.ownerId) {
    query += ' AND b.owner_id = ?';
    params.push(filter.ownerId);
  }

  query += ' ORDER BY b.updated_at DESC';

  const rows = goalsDb.query<GoalBoardRow & { manager_name?: string; manager_id?: string }, any[]>(query).all(...params);
  const boardIds = rows.map(r => r.id);
  const itemsByBoardId: Record<string, GoalItem[]> = {};

  if (boardIds.length > 0) {
    const placeholders = boardIds.map(() => '?').join(',');
    const allItems = goalsDb.query<GoalItemRow, any[]>(`
      SELECT * FROM goal_items WHERE board_id IN (${placeholders}) ORDER BY sort_order ASC
    `).all(...boardIds);

    allItems.forEach(i => {
      (itemsByBoardId[i.board_id] ??= []).push({
        id: i.id, boardId: i.board_id, title: i.title, description: i.description, category: i.category,
        targetDate: i.target_date, weight: i.weight, progressPercent: i.progress_percent, status: i.status,
        sortOrder: i.sort_order, priority: (i.priority as any) || 'MEDIUM', targetQtr: i.target_qtr || null,
        plansCount: Number(i.plans_count) || 0, createdAt: i.created_at, updatedAt: i.updated_at,
      });
    });
  }

  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    ownerEmail: r.owner_email,
    ownerDepartment: r.owner_department,
    managerId: r.manager_id || null,
    managerName: r.manager_name || r.approved_by || null,
    title: r.title,
    status: r.status,
    lockVersion: r.lock_version,
    revisionNumber: r.revision_number,
    submissionDeadline: r.submission_deadline,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
    approvedBy: r.approved_by,
    unlockedAt: r.unlocked_at,
    notes: r.notes || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: itemsByBoardId[r.id] || [],
  }));
}

export function createProjectRecord(project: {
  id?: string;
  orgId: string;
  name: string;
  code: string;
  description?: string;
  managerId: string;
}): Project {
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

export function getBoardById(boardId: string, orgId: string, requestingUser?: AuthUser): GoalBoard {
  const row = goalsDb.query<any, [string, string]>(`
    SELECT b.*, u.manager_name as manager_name, u.manager_id as manager_id
    FROM goal_boards b 
    LEFT JOIN users u ON b.owner_id = u.id
    WHERE b.id = ? AND b.org_id = ?
  `).get(boardId, orgId);

  if (!row) {
    throw new NotFoundError(`Goal Board "${boardId}" not found in this organization.`);
  }

  // Security Authorization Check: Timeline comments accessible by board owner or manager/admin
  const isOwner = requestingUser ? Boolean(
    requestingUser.id === row.owner_id ||
    (requestingUser.email && row.owner_email && requestingUser.email.toLowerCase() === row.owner_email.toLowerCase())
  ) : true;
  const isManager = requestingUser ? Boolean(
    requestingUser.roles.some((r: string) => /manager|admin|reviewer/i.test(r)) ||
    row.manager_id === requestingUser.id ||
    (row.manager_email && requestingUser.email && row.manager_email.toLowerCase() === requestingUser.email.toLowerCase()) ||
    (row.owner_department && requestingUser.department && row.owner_department.toLowerCase() === requestingUser.department.toLowerCase())
  ) : true;
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

  const rawLinks = goalsDb.query<any, [string]>(`
    SELECT gap_id, plan_id FROM goal_gap_plan_links WHERE board_id = ?
  `).all(boardId);

  const rawItems = goalsDb.query<any, [string]>(`
    SELECT * FROM goal_items WHERE board_id = ? ORDER BY sort_order ASC, created_at ASC
  `).all(boardId);

  const items = rawItems.map(i => {
    const linkedPlanIds = rawLinks.filter(l => l.gap_id === i.id).map(l => l.plan_id);
    const linkedGapIds = rawLinks.filter(l => l.plan_id === i.id).map(l => l.gap_id);
    const linkedGaps: Array<{ id: string; title: string; priority?: PriorityLevel }> = [];
    for (const gid of linkedGapIds) {
      const g = rawItems.find(x => x.id === gid);
      if (g) linkedGaps.push({ id: g.id, title: g.title, priority: (g.priority as any) || 'MEDIUM' });
    }

    return {
      id: i.id, boardId: i.board_id, title: i.title, description: i.description, category: i.category,
      targetDate: i.target_date, weight: i.weight, progressPercent: i.progress_percent, status: i.status,
      sortOrder: i.sort_order, priority: (i.priority as any) || 'MEDIUM', targetQtr: i.target_qtr || null,
      plansCount: linkedPlanIds.length,
      linkedPlanIds,
      linkedGapIds,
      linkedGaps,
      createdAt: i.created_at, updatedAt: i.updated_at,
    };
  });

  const rawComments = allowedTimeline ? goalsDb.query<any, [string]>(`
    SELECT * FROM review_comments WHERE board_id = ? ORDER BY created_at ASC
  `).all(boardId) : [];

  const comments = rawComments.map(c => ({
    id: c.id, boardId: c.board_id, itemId: c.item_id, authorId: c.author_id, authorName: c.author_name,
    authorRole: c.author_role, commentText: c.comment_text, type: c.type, createdAt: c.created_at,
  }));

  return {
    id: row.id,
    orgId: row.org_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    ownerDepartment: row.owner_department,
    managerId: row.manager_id || null,
    managerName: row.manager_name || row.approved_by || null,
    title: row.title,
    status: currentStatus,
    lockVersion: row.lock_version,
    revisionNumber: row.revision_number,
    submissionDeadline: row.submission_deadline,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    unlockedAt: row.unlocked_at,
    notes: row.notes || null,
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
    throw new BoardLockedError('This board is locked due to an expired submission deadline. Request unlock from manager.');
  }

  if (board.status === 'UNLOCK_REQUESTED') {
    throw new BoardLockedError('Unlock request is pending manager review.');
  }
}

export function createBoard(input: CreateBoardInput, user: AuthUser): GoalBoard {
  if (!input.title || input.title.trim().length === 0) {
    throw new ValidationError('Goal board title is required.');
  }

  const id = `board_${crypto.randomUUID()}`;
  const now = Date.now();
  const orgId = user.orgId || 'org_default';

  if (user && user.id) {
    try { upsertUser(user); } catch (_) {}
  }

  const defaultNotes = input.notes || 'Targeting completion of strategic goals by end of next quarter. Regular 1:1 check-ins established with manager.';
  goalsDb.run(`
    INSERT INTO goal_boards (id, org_id, owner_id, owner_name, owner_email, owner_department, title, status, lock_version, revision_number, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, ?, ?, ?)
  `, [
    id, orgId, user.id, user.displayName, user.email,
    user.department || 'General', input.title.trim(), defaultNotes, now, now,
  ]);

  const defaultTargetDate = getCycleDefaultTargetDate();

  // Seed starter tri-deck items (matching the showcase standard)
  const starterItems = [
    { title: 'Fastify API Framework', cat: 'CORE_SKILL', prio: 'MEDIUM', weight: 25, qtr: null, plans: 0 },
    { title: 'Docker Containers', cat: 'CORE_SKILL', prio: 'CRITICAL', weight: 25, qtr: null, plans: 0 },
    { title: 'TypeScript Integration', cat: 'STRATEGIC_SKILL', prio: 'CRITICAL', weight: 25, qtr: null, plans: 0 },
    { title: 'PostgreSQL Architecture', cat: 'STRATEGIC_SKILL', prio: 'LOW', weight: 25, qtr: null, plans: 0 },
    { title: 'GraphQL Federation', cat: 'SKILL_GAP', prio: 'LOW', weight: 0, qtr: null, plans: 0 },
    { title: 'OpenTelemetry Deep Dive', cat: 'STRATEGIC_PLAN', prio: 'MEDIUM', weight: 0, qtr: 'Q2', plans: 0 }
  ];

  starterItems.forEach((st, idx) => {
    goalsDb.run(`
      INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, priority, target_qtr, plans_count, created_at, updated_at)
      VALUES (?, ?, ?, '', ?, ?, ?, 0, 'PENDING', ?, ?, ?, ?, ?, ?)
    `, [`item_${id}_${idx + 1}`, id, st.title, st.cat, defaultTargetDate, st.weight, idx + 1, st.prio, st.qtr, st.plans, now, now]);
  });

  // Persist BOARD_CREATED activity in timeline
  const createCommId = `comm_${crypto.randomUUID()}`;
  goalsDb.run(`
    INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
    VALUES (?, ?, null, ?, ?, ?, ?, 'BOARD_CREATED', ?)
  `, [createCommId, id, user.id, user.displayName, user.jobTitle || 'Contributor', `Goal Board created: ${input.title.trim()}.`, now]);

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

  // Reconcile and update items without dropping IDs to preserve comment thread references
  goalsDb.transaction(() => {
    const existingItems = goalsDb.query<any, [string]>('SELECT id FROM goal_items WHERE board_id = ?').all(boardId);
    const existingIds = new Set(existingItems.map(i => i.id));
    const submittedIds = new Set<string>();

    input.items.forEach((item, index) => {
      const sanitizedWeight = Math.max(0, Math.min(100, Math.round(Number(item.weight) || 0)));
      const sanitizedProgress = Math.max(0, Math.min(100, Math.round(Number(item.progressPercent) || 0)));
      const itemId = item.id && existingIds.has(item.id) ? item.id : (item.id && item.id.startsWith('item_') ? item.id : `item_${boardId}_${index + 1}`);
      submittedIds.add(itemId);

      if (existingIds.has(itemId)) {
        goalsDb.run(`
          UPDATE goal_items 
          SET title = ?, description = ?, category = ?, target_date = ?, weight = ?, progress_percent = ?, status = ?, sort_order = ?, priority = ?, target_qtr = ?, plans_count = ?, updated_at = ?
          WHERE id = ? AND board_id = ?
        `, [
          item.title.trim(), item.description?.trim() || '', item.category || 'CORE_SKILL',
          item.targetDate || getCycleDefaultTargetDate(), sanitizedWeight, sanitizedProgress,
          item.status || 'PENDING', index + 1, item.priority || 'MEDIUM', item.targetQtr || null,
          Number(item.plansCount) || 0, now, itemId, boardId,
        ]);
      } else {
        goalsDb.run(`
          INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, sort_order, priority, target_qtr, plans_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          itemId, boardId, item.title.trim(), item.description?.trim() || '', item.category || 'CORE_SKILL',
          item.targetDate || getCycleDefaultTargetDate(), sanitizedWeight, sanitizedProgress,
          item.status || 'PENDING', index + 1, item.priority || 'MEDIUM', item.targetQtr || null,
          Number(item.plansCount) || 0, now, now,
        ]);
      }
    });

    // Remove deleted items that were omitted
    existingItems.forEach(i => {
      if (!submittedIds.has(i.id)) {
        goalsDb.run('DELETE FROM goal_items WHERE id = ? AND board_id = ?', [i.id, boardId]);
      }
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

    let targetManagerId: string = user.managerId || '';
    if (!targetManagerId) {
      const adminRow = goalsDb.query<{ id: string }, []>("SELECT id FROM users WHERE roles LIKE '%roles/admin%' OR roles LIKE '%roles/super_admin%' LIMIT 1").get();
      targetManagerId = adminRow?.id || 'admin';
    }
    const hasManager = Boolean(user.managerId);
    const remId = `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const notificationMsg = hasManager
      ? `${board.ownerName} submitted "${board.title}" for manager review.`
      : `${board.ownerName} submitted "${board.title}" for review (No manager assigned - routed to Admin).`;

    goalsDb.run(`
      INSERT INTO reminders (id, org_id, user_id, board_id, type, message, due_date, is_dismissed, created_at)
      VALUES (?, ?, ?, ?, 'PENDING_APPROVAL', ?, null, 0, ?)
    `, [remId, orgId, targetManagerId, boardId, notificationMsg, now]);

    // Record SUBMISSION activity in review timeline for all submissions
    const subCommId = `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const subText = `Submitted Board (Revision ${Number(board.revisionNumber) || 1}) with ${items.length} committed milestones for manager review.`;
    goalsDb.run(`
      INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
      VALUES (?, ?, null, ?, ?, ?, ?, 'SUBMISSION', ?)
    `, [subCommId, boardId, user.id, user.displayName, user.jobTitle || 'Contributor', subText, now]);

    if (!hasManager) {
      const guardCommId = `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      goalsDb.run(`
        INSERT INTO review_comments (id, board_id, item_id, author_id, author_name, author_role, comment_text, type, created_at)
        VALUES (?, ?, null, 'sys_auth', 'System Guard', 'System Audit', 'Board submitted for approval. Contributor has no assigned manager — routed for Admin review.', 'FEEDBACK', ?)
      `, [guardCommId, boardId, now]);
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

  if (board.status !== 'APPROVED' && board.status !== 'COMPLETED') {
    throw new ValidationError(`Milestone progress can only be updated on APPROVED or COMPLETED boards. Current status is ${board.status}.`);
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
