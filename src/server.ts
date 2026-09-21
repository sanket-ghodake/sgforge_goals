/**
 * Individual Goal Center - HTTP Dispatcher & Server (2026 LTS)
 * Dedicated Turso SQLite Database Instance with Isolated Observability & Scoped Hierarchy
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { join } from 'node:path';
import {
  authGuard,
  createLogger,
  createSafeHandler,
  fetchEmployeesList,
  ingestBrowserTelemetry,
} from './lib/sdk';
import { handleDocsRoute } from './lib/docs-viewer';
import type { AuthUser } from './lib/types';
import { renderLayout } from './frontend/views/layout';
import { getLayoutStyles } from './frontend/views/layout-styles';
import { getAstryxStyles } from './lib/ui';
import { renderLeadershipRestrictedView, renderLoginView } from './frontend/views/login-view';
import { listUsers } from './db';
import { createBoard, createProjectRecord, getBoardById, listBoards, listProjects, submitBoard, updateGoalItems, updateItemProgress } from './backend/services/board-service';
import { cloneBoard, deleteBoard, getSkillSuggestions, patchGoalItem, renameBoard, toggleGapPlanLink, togglePlanCompletion, updateBoardNotes } from './backend/services/board-actions-service';
import { exportBoardAsJson, exportBoardAsPdfHtml, exportBoardAsPpt } from './backend/services/export-service';
import { approveBoard, addReviewComment, requestRework, requestBoardUnlock, unlockBoard, setSubmissionDeadline } from './backend/services/review-service';
import { dismissReminder, listUserReminders } from './backend/services/reminder-service';
import { getCachedManagerStatus, resolveViewContent, syncEmployeeProfile } from './server-helpers';
import { handleSessionRefresh } from './lib/auth-refresh';

const LOG_DIR = join(import.meta.dir, '..', 'logs');
const DOCS_DIR = join(import.meta.dir, '..', 'docs');
const logger = createLogger('goals', LOG_DIR);
const PORT = Number(process.env.PORT || 8090);

function logUserAction(action: string, user: AuthUser, details?: Record<string, any>): void {
  logger.info(`[ACTION:${action}] user=${user.id}`, { action, userId: user.id, ...details });
}

async function getEffectiveUser(baseUser: AuthUser, req: Request): Promise<AuthUser> {
  if (baseUser && baseUser.id) {
    return await syncEmployeeProfile(baseUser, req);
  }

  return {
    id: 'usr_current',
    email: 'user@forge.internal',
    displayName: 'Current User',
    roles: ['roles/employee'],
    department: 'General',
    orgId: 'org_default',
    managerId: null,
    managerName: null,
    managerEmail: null,
  };
}

export function startgoalsServer(portOverride?: number) {
  const activePort = portOverride !== undefined ? portOverride : PORT;

  const server = Bun.serve({
    port: activePort,
    fetch: createSafeHandler('goals', async (req: Request): Promise<Response> => {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // 0. Static Asset Route (Immutable CSS Caching for 10k users bandwidth optimization)
      if (pathname === '/assets/app.css' || pathname.endsWith('/assets/app.css')) {
        return new Response(`${getLayoutStyles()}\n${getAstryxStyles()}`, {
          status: 200,
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      // 1. Health Probe
      if (pathname === '/health' || pathname === '/apps/goals/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          app: 'app-goals',
          service: 'goals',
          port: activePort,
          livez: true,
          readyz: true,
          uptime: process.uptime(),
          memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          timestamp: new Date().toISOString(),
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 2. Documentation Hub
      if (pathname.startsWith('/docs') || pathname.startsWith('/apps/goals/docs')) {
        const docsRes = handleDocsRoute(req, 'goals', 'Individual Goal Center', DOCS_DIR);
        return docsRes || new Response('Docs Not Found', { status: 404 });
      }

      // 3. Telemetry Log Bridge (Ingests Real User Monitoring & client breadcrumbs)
      if (pathname.endsWith('/api/logs/browser')) {
        if (req.method === 'POST') {
          try {
            const body = await req.json();
            const isCrash = body.eventType === 'error' || body.eventType === 'unhandledrejection';
            if (isCrash) {
              logger.error(`[BROWSER_CRASH] ${body.message || 'Unknown browser crash'}`, body);
            } else {
              logger.logBrowserEvent(body.severity || 'INFO', body.message || 'Browser event', body);
            }
            const traceId = body?.traceId || req.headers.get('x-trace-id') || 'trace_default';
            return new Response(JSON.stringify({ ok: true, status: 'received', traceId }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (e: any) {
            logger.warn('Failed to parse browser telemetry payload', { error: e?.message });
            return new Response(JSON.stringify({ ok: false, status: 'error', error: e?.message || 'Invalid telemetry payload' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
        return new Response(JSON.stringify({ status: 'ready' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 4. Public Auth Endpoints
      if (pathname.endsWith('/api/auth/logout') && req.method === 'POST') {
        const authBase = process.env.AUTH_SERVICE_URL?.trim().replace(/\/+$/, '') || '';
        const redirectUrl = authBase ? `${authBase}/login` : '/auth/login';
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.append('Set-Cookie', 'goals_logged_out=true; Path=/; HttpOnly; SameSite=Lax');
        headers.append('Set-Cookie', 'forge_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        return new Response(JSON.stringify({ success: true, message: 'Logged out successfully', redirectUrl }), { status: 200, headers });
      }

      if (pathname.endsWith('/api/auth/login') && req.method === 'POST') {
        const authBase = process.env.AUTH_SERVICE_URL?.trim().replace(/\/+$/, '') || '';
        const redirectUrl = authBase ? `${authBase}/login` : '/auth/login';
        return new Response(JSON.stringify({ success: true, redirectUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.endsWith('/api/auth/users') && req.method === 'GET') {
        const users = listUsers();
        return new Response(JSON.stringify(users), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.endsWith('/api/auth/refresh') && req.method === 'POST') {
        return await handleSessionRefresh(req);
      }

      // 5. Zero-Trust Auth Guard (Identity & Session Signature Validation)
      const auth = await authGuard(req, {
        appName: 'goals',
      });

      if (!auth.authenticated || !auth.user) {
        if (auth.response) {
          return auth.response;
        }
        if (pathname.includes('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized', authenticated: false, code: 'UNAUTHORIZED' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(renderLoginView(req), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 5.1 Manager & Leadership Clearance via SG Forge Dedicated Hierarchy API
      const baseRoles = auth.user.roles || [];
      const hasDirectRole = baseRoles.includes('roles/manager') || baseRoles.includes('roles/admin') || baseRoles.includes('roles/super_admin');

      let isVerifiedManager = hasDirectRole;
      if (!isVerifiedManager) {
        isVerifiedManager = await getCachedManagerStatus(auth.user.id, req);
        if (isVerifiedManager) {
          auth.user.roles = Array.from(new Set([...baseRoles, 'roles/manager']));
        }
      }

      if (!isVerifiedManager) {
        const isApi = pathname.includes('/api/') || (req.headers.get('accept') || '').includes('application/json');
        if (isApi) {
          return new Response(JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Forbidden: Leadership Clearance Required',
            status: 403,
            detail: 'Individual Goal Center is restricted to People Managers, Department Leads, and Executive Leadership.',
            code: 'FORBIDDEN_MANAGER_ONLY',
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/problem+json' },
          });
        }
        return new Response(renderLeadershipRestrictedView(auth.user, req), {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const user = await getEffectiveUser(auth.user, req);
      const orgId = req.headers.get('x-user-org') || user.orgId || 'org_default';
      user.orgId = orgId;

      if (pathname.endsWith('/api/auth/me') && req.method === 'GET') {
        return new Response(JSON.stringify({ ok: true, user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (pathname.endsWith('/api/org/employees') && req.method === 'GET') {
        const centralList = await fetchEmployeesList({ incomingReq: req });
        if (centralList && centralList.items) {
          return new Response(JSON.stringify(centralList), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const users = listUsers();
        return new Response(JSON.stringify({ ok: true, items: users, total: users.length, departments: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (pathname.endsWith('/api/org/manager-check') && req.method === 'GET') {
        return new Response(JSON.stringify({
          ok: true,
          userId: user.id,
          hasManagerAbove: user.hasManagerAbove ?? Boolean(user.managerId || user.managerName),
          directReportsCount: user.directReportsCount ?? 0,
          subordinateManagersCount: user.subordinateManagersCount ?? 0,
          isManagerInDirectory: user.isManagerInDirectory ?? false,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 6. REST API Endpoints
      // GET /api/projects
      if (pathname.endsWith('/api/projects') && req.method === 'GET') {
        const projects = listProjects(orgId);
        return new Response(JSON.stringify(projects), { headers: { 'Content-Type': 'application/json' } });
      }

      // POST /api/projects
      if (pathname.endsWith('/api/projects') && req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        if (!body.name || !body.code) {
          return new Response(JSON.stringify({ error: 'Project name and code are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const newProj = createProjectRecord({ orgId, name: body.name, code: body.code, description: body.description || '', managerId: user.managerId || user.id });
        return new Response(JSON.stringify(newProj), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }

      // Suggestions API (Org-wide live skill / gap / plan search)
      if (pathname.endsWith('/api/suggestions') && req.method === 'GET') {
        const q = url.searchParams.get('q') || '';
        const cat = url.searchParams.get('category') || undefined;
        const suggestions = getSkillSuggestions(orgId, q, cat);
        logUserAction('SUGGESTIONS_FETCH', user, { q, count: suggestions.length });
        return new Response(JSON.stringify(suggestions), { headers: { 'Content-Type': 'application/json' } });
      }

      if (pathname.includes('/api/boards')) {
        const parts = pathname.split('/').filter(Boolean);
        const boardId = parts[parts.indexOf('boards') + 1];
        const action = parts[parts.indexOf('boards') + 2];

        // GET /api/boards
        if (!boardId && req.method === 'GET') {
          const boards = listBoards(orgId);
          logUserAction('BOARDS_LIST', user, { count: boards.length });
          return new Response(JSON.stringify(boards), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards
        if (!boardId && req.method === 'POST') {
          const body = await req.json();
          const board = createBoard(body, user);
          logUserAction('BOARD_CREATE', user, { boardId: board.id, title: board.title });
          return new Response(JSON.stringify(board), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        // GET /api/boards/:id
        if (boardId && !action && req.method === 'GET') {
          const board = getBoardById(boardId, orgId, user);
          logUserAction('BOARD_FETCH', user, { boardId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PATCH /api/boards/:id (Rename board title)
        if (boardId && !action && req.method === 'PATCH') {
          const body = await req.json();
          const board = renameBoard(boardId, body.title, user);
          logUserAction('BOARD_RENAME', user, { boardId, title: body.title });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // GET /api/boards/:id/export?format=json|ppt|pdf
        if (boardId && action === 'export' && req.method === 'GET') {
          const board = getBoardById(boardId, orgId, user);
          const format = url.searchParams.get('format') || 'json';
          logUserAction('BOARD_EXPORT', user, { boardId, format });
          if (format === 'ppt' || format === 'pptx') {
            const ppt = exportBoardAsPpt(board);
            return new Response(ppt, {
              headers: {
                'Content-Type': 'application/vnd.ms-powerpoint',
                'Content-Disposition': `attachment; filename="goal-board-${boardId}.ppt"`,
              },
            });
          }
          if (format === 'pdf' || format === 'html') {
            const pdfHtml = exportBoardAsPdfHtml(board);
            return new Response(pdfHtml, {
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
              },
            });
          }
          const jsonStr = exportBoardAsJson(board);
          return new Response(jsonStr, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="goal-board-${boardId}.json"`,
            },
          });
        }

        // PUT /api/boards/:id/items (Guarded by server-side lock)
        if (boardId && action === 'items' && req.method === 'PUT') {
          const body = await req.json();
          const board = updateGoalItems(boardId, body, user);
          logUserAction('BOARD_ITEMS_UPDATE', user, { boardId, count: Array.isArray(body) ? body.length : 0 });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PATCH /api/boards/:id/items/:itemId/toggle (Toggle plan completion)
        if (boardId && action === 'items' && req.method === 'PATCH' && pathname.endsWith('/toggle')) {
          const partsList = pathname.split('/');
          const itemId = partsList[partsList.indexOf('items') + 1];
          const board = togglePlanCompletion(boardId, itemId, user);
          logUserAction('ITEM_TOGGLE', user, { boardId, itemId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PATCH /api/boards/:id/items/:itemId (Progress update or Item title/priority patch)
        if (boardId && action === 'items' && req.method === 'PATCH') {
          const partsList = pathname.split('/');
          const itemId = partsList[partsList.indexOf('items') + 1];
          const body = await req.json();
          if (body.progressPercent !== undefined || pathname.endsWith('/progress')) {
            const board = updateItemProgress(boardId, itemId, body.progressPercent, body.status, user);
            logUserAction('ITEM_PROGRESS_UPDATE', user, { boardId, itemId, progressPercent: body.progressPercent });
            return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
          }
          const board = patchGoalItem(boardId, itemId, body, user);
          logUserAction('ITEM_PATCH', user, { boardId, itemId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/submit (Locks board)
        if (boardId && action === 'submit' && req.method === 'POST') {
          const board = submitBoard(boardId, user);
          logUserAction('BOARD_SUBMIT', user, { boardId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/review (Manager & Contributor review decisions)
        if (boardId && action === 'review' && req.method === 'POST') {
          const body = await req.json();
          let board;
          if (body.decision === 'APPROVE') {
            board = approveBoard(boardId, user, body.comment);
          } else if (body.decision === 'REWORK') {
            board = requestRework(boardId, user, body.comment, body.itemId);
          } else if (body.decision === 'REQUEST_UNLOCK') {
            board = requestBoardUnlock(boardId, user, body.comment);
          } else if (body.decision === 'UNLOCK') {
            board = unlockBoard(boardId, user, body.comment);
          } else if (body.decision === 'SET_DEADLINE') {
            board = setSubmissionDeadline(boardId, user, body.deadline);
          } else {
            board = requestRework(boardId, user, body.comment, body.itemId);
          }
          logUserAction('REVIEW_DECISION', user, { boardId, decision: body.decision });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // DELETE /api/boards/:id
        if (boardId && !action && req.method === 'DELETE') {
          const result = deleteBoard(boardId, orgId, user);
          logUserAction('BOARD_DELETE', user, { boardId });
          return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
        }

        // PATCH /api/boards/:id/notes (Real-time autosave)
        if (boardId && action === 'notes' && req.method === 'PATCH') {
          const body = await req.json();
          const board = updateBoardNotes(boardId, body.notes, user);
          logUserAction('BOARD_NOTES_SAVE', user, { boardId, length: body.notes?.length });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/clone (Duplicate board)
        if (boardId && action === 'clone' && req.method === 'POST') {
          const board = cloneBoard(boardId, user);
          logUserAction('BOARD_CLONE', user, { sourceBoardId: boardId, newBoardId: board.id });
          return new Response(JSON.stringify(board), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/comments (Post feedback comment to review timeline)
        if (boardId && action === 'comments' && req.method === 'POST') {
          const body = await req.json();
          const board = addReviewComment(boardId, user, body.commentText, body.itemId);
          logUserAction('REVIEW_COMMENT_POST', user, { boardId, itemId: body.itemId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/links (Link / Unlink skill gap and training plan)
        if (boardId && action === 'links' && req.method === 'POST') {
          const body = await req.json();
          const board = toggleGapPlanLink(boardId, body.gapId, body.planId, user);
          logUserAction('GAP_PLAN_LINK_TOGGLE', user, { boardId, gapId: body.gapId, planId: body.planId });
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Reminders API
      if (pathname.includes('/api/reminders')) {
        const parts = pathname.split('/').filter(Boolean);
        const remIndex = parts.indexOf('reminders');
        const remId = parts[remIndex + 1];
        const subAction = parts[remIndex + 2];

        if (remId && subAction === 'dismiss' && req.method === 'POST') {
          dismissReminder(remId, user, orgId);
          logUserAction('REMINDER_DISMISS', user, { reminderId: remId });
          return new Response(JSON.stringify({ success: true, id: remId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const reminders = listUserReminders(user, orgId);
        logUserAction('REMINDERS_FETCH', user, { count: reminders.length });
        return new Response(JSON.stringify(reminders), { headers: { 'Content-Type': 'application/json' } });
      }

      // 7. SPA View Fragment REST API
      if (pathname.endsWith('/api/views') && req.method === 'GET') {
        const tabParam = url.searchParams.get('tab') || 'dashboard';
        const boardIdParam = url.searchParams.get('id');

        const { contentHtml, activeTab } = resolveViewContent(tabParam, boardIdParam, user, orgId);

        return new Response(JSON.stringify({ html: contentHtml, activeTab, title: activeTab }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 8. Full UI View Controller (Initial Page Load)
      const tabParam = url.searchParams.get('tab') || 'dashboard';
      const boardIdParam = url.searchParams.get('id');
      const reminders = listUserReminders(user.id, orgId);

      const { contentHtml, activeTab } = resolveViewContent(tabParam, boardIdParam, user, orgId);

      const fullHtml = renderLayout({ activeTab: activeTab as any, user, reminders, contentHtml });
      return new Response(fullHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }, LOG_DIR),
  });

  logger.info(`Goal Center service running on port ${server.port}`);
  return server;
}

if (import.meta.main) {
  startgoalsServer();
}
