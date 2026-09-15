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
} from './lib/sdk';
import { handleDocsRoute } from './lib/docs-viewer';
import type { AuthUser } from './lib/types';
import { renderLayout } from './frontend/views/layout';
import { renderDashboardView } from './frontend/views/dashboard-view';
import { renderBoardsView } from './frontend/views/boards-view';
import { renderBoardView } from './frontend/views/board-view';
import { renderManagerView } from './frontend/views/manager-view';
import { renderExploreView } from './frontend/views/explore-view';
import { renderLoginView } from './frontend/views/login-view';
import { getUserById, listUsers, upsertUser } from './db';
import { createBoard, getBoardById, listBoards, listProjects, submitBoard, updateGoalItems, updateItemProgress } from './backend/services/board-service';
import { approveBoard, addReviewComment, requestRework, requestBoardUnlock, unlockBoard, setSubmissionDeadline } from './backend/services/review-service';
import { dismissReminder, listUserReminders } from './backend/services/reminder-service';

const LOG_DIR = join(import.meta.dir, '..', 'logs');
const DOCS_DIR = join(import.meta.dir, '..', 'docs');
const logger = createLogger('goals', LOG_DIR);
const PORT = Number(process.env.PORT || 8090);

function getEffectiveUser(baseUser: AuthUser, req: Request): AuthUser {
  const cookieHeader = req.headers.get('cookie') || '';
  
  // Dev persona override for explicit testing toggles
  if (cookieHeader.includes('goals_persona=manager')) {
    const mgr = getUserById('usr_manager');
    if (mgr) return mgr;
  } else if (cookieHeader.includes('goals_persona=solo')) {
    const solo = getUserById('usr_solo');
    if (solo) return solo;
  } else if (cookieHeader.includes('goals_persona=employee')) {
    const emp = getUserById('usr_employee');
    if (emp) return emp;
  }

  if (baseUser && baseUser.id) {
    return upsertUser(baseUser);
  }

  const targetUserId = 'usr_employee';
  const dbUser = getUserById(targetUserId);
  if (dbUser) return dbUser;

  return {
    id: 'usr_employee',
    email: 'jane.doe@forge.internal',
    displayName: 'Jane Doe',
    roles: ['roles/employee'],
    department: 'Platform Engineering',
    orgId: 'org_default',
    managerId: 'usr_manager',
    managerName: 'Sarah Connor',
    managerEmail: 'sarah.connor@forge.internal',
  };
}

function resolveViewContent(tabParam: string, boardIdParam: string | null, user: AuthUser, orgId: string) {
  const allBoards = listBoards(orgId);
  const allProjects = listProjects(orgId);

  let contentHtml = '';
  let activeTab: string = tabParam;

  if (tabParam === 'board' && boardIdParam) {
    const board = getBoardById(boardIdParam, orgId);
    contentHtml = renderBoardView(user, board);
    activeTab = 'board';
  } else if (tabParam === 'boards') {
    contentHtml = renderBoardsView(user, allBoards, allProjects);
    activeTab = 'boards';
  } else if (tabParam === 'reviews') {
    contentHtml = renderManagerView(user, allBoards, allProjects);
    activeTab = 'reviews';
  } else if (tabParam === 'explore') {
    contentHtml = renderExploreView(user, allBoards);
    activeTab = 'explore';
  } else {
    contentHtml = renderDashboardView(user, allBoards, allProjects);
    activeTab = 'dashboard';
  }

  return { contentHtml, activeTab, allBoards, allProjects };
}

export function startgoalsServer(portOverride?: number) {
  const activePort = portOverride !== undefined ? portOverride : PORT;

  const server = Bun.serve({
    port: activePort,
    fetch: createSafeHandler('goals', async (req: Request): Promise<Response> => {
      const url = new URL(req.url);
      const pathname = url.pathname;

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

      // 3. Telemetry Log Bridge
      if (pathname.endsWith('/api/logs/browser')) {
        return new Response(JSON.stringify({ status: 'received' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 4. Public Auth & Persona Endpoints
      if (pathname.endsWith('/api/auth/logout') && req.method === 'POST') {
        const authBase = process.env.AUTH_SERVICE_URL?.trim().replace(/\/+$/, '') || '';
        const redirectUrl = authBase ? `${authBase}/login` : '/auth/login';
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.append('Set-Cookie', 'goals_logged_out=true; Path=/; HttpOnly; SameSite=Lax');
        headers.append('Set-Cookie', 'goals_persona=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        headers.append('Set-Cookie', 'forge_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        return new Response(JSON.stringify({ success: true, message: 'Logged out successfully', redirectUrl }), { status: 200, headers });
      }

      if (pathname.endsWith('/api/auth/login') && req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const persona = body.persona || 'employee';
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.append('Set-Cookie', `goals_persona=${persona}; Path=/; HttpOnly; SameSite=Lax`);
        headers.append('Set-Cookie', 'goals_logged_out=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
        return new Response(JSON.stringify({ success: true, persona }), { status: 200, headers });
      }

      if (pathname.endsWith('/api/auth/users') && req.method === 'GET') {
        const users = listUsers();
        return new Response(JSON.stringify(users), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 5. Zero-Trust Auth Guard
      const auth = await authGuard(req, {
        appName: 'goals',
        requiredRoles: ['roles/employee', 'roles/admin', 'roles/manager'],
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
        return new Response(renderLoginView(), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const user = getEffectiveUser(auth.user, req);
      const orgId = user.orgId || 'org_default';

      if (pathname.endsWith('/api/persona/toggle') && req.method === 'POST') {
        if (process.env.NODE_ENV === 'production' && !user.roles.includes('roles/admin') && !user.roles.includes('roles/manager')) {
          return new Response(JSON.stringify({ error: 'Forbidden: Persona toggling restricted' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const cookieHeader = req.headers.get('cookie') || '';
        let nextVal = 'employee';
        if (cookieHeader.includes('goals_persona=employee')) {
          nextVal = 'solo';
        } else if (cookieHeader.includes('goals_persona=solo')) {
          nextVal = 'manager';
        } else if (cookieHeader.includes('goals_persona=manager')) {
          nextVal = 'employee';
        } else {
          nextVal = 'solo';
        }

        return new Response(JSON.stringify({ persona: nextVal }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `goals_persona=${nextVal}; Path=/; HttpOnly; SameSite=Lax`,
          },
        });
      }

      // 6. REST API Endpoints
      // GET /api/projects
      if (pathname.endsWith('/api/projects') && req.method === 'GET') {
        const projects = listProjects(orgId);
        return new Response(JSON.stringify(projects), { headers: { 'Content-Type': 'application/json' } });
      }

      if (pathname.includes('/api/boards')) {
        const parts = pathname.split('/').filter(Boolean);
        const boardId = parts[parts.indexOf('boards') + 1];
        const action = parts[parts.indexOf('boards') + 2];

        // GET /api/boards
        if (!boardId && req.method === 'GET') {
          const boards = listBoards(orgId);
          return new Response(JSON.stringify(boards), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards
        if (!boardId && req.method === 'POST') {
          const body = await req.json();
          const board = createBoard(body, user);
          return new Response(JSON.stringify(board), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        // GET /api/boards/:id
        if (boardId && !action && req.method === 'GET') {
          const board = getBoardById(boardId, orgId, user);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PUT /api/boards/:id/items (Guarded by server-side lock)
        if (boardId && action === 'items' && req.method === 'PUT') {
          const body = await req.json();
          const board = updateGoalItems(boardId, body, user);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PATCH /api/boards/:id/items/:itemId/progress (Execution phase progress update)
        if (boardId && action === 'items' && req.method === 'PATCH') {
          const partsList = pathname.split('/');
          const itemId = partsList[partsList.indexOf('items') + 1];
          const body = await req.json();
          const board = updateItemProgress(boardId, itemId, body.progressPercent, body.status, user);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/submit (Locks board)
        if (boardId && action === 'submit' && req.method === 'POST') {
          const board = submitBoard(boardId, user);
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
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/comments (Post feedback comment to review timeline)
        if (boardId && action === 'comments' && req.method === 'POST') {
          const body = await req.json();
          const board = addReviewComment(boardId, user, body.commentText, body.itemId);
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
          dismissReminder(remId, user.id, orgId);
          return new Response(JSON.stringify({ success: true, id: remId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const reminders = listUserReminders(user.id, orgId);
        return new Response(JSON.stringify(reminders), { headers: { 'Content-Type': 'application/json' } });
      }

      // 7. SPA View Fragment REST API
      if (pathname.endsWith('/api/views') && req.method === 'GET') {
        const tabParam = url.searchParams.get('tab') || 'dashboard';
        const boardIdParam = url.searchParams.get('id');

        const { contentHtml, activeTab } = resolveViewContent(tabParam, boardIdParam, user, orgId);

        return new Response(JSON.stringify({
          html: contentHtml,
          activeTab,
          title: activeTab,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 8. Full UI View Controller (Initial Page Load)
      const tabParam = url.searchParams.get('tab') || 'dashboard';
      const boardIdParam = url.searchParams.get('id');
      const reminders = listUserReminders(user.id, orgId);

      const { contentHtml, activeTab } = resolveViewContent(tabParam, boardIdParam, user, orgId);

      const fullHtml = renderLayout({
        activeTab: activeTab as any,
        user,
        reminders,
        contentHtml,
      });

      return new Response(fullHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }, LOG_DIR),
  });

  logger.info(`Goal Center service running on port ${server.port}`);
  return server;
}

if (import.meta.main) {
  startgoalsServer();
}
