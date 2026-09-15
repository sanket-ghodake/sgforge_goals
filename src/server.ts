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
import { renderCockpitView } from './frontend/views/cockpit-view';
import { renderBoardView } from './frontend/views/board-view';
import { renderManagerView } from './frontend/views/manager-view';
import { renderExploreView } from './frontend/views/explore-view';
import { createBoard, getBoardById, listBoards, listProjects, submitBoard, updateGoalItems } from './backend/services/board-service';
import { approveBoard, listPendingReviews, requestRework } from './backend/services/review-service';
import { dismissReminder, listUserReminders } from './backend/services/reminder-service';

const LOG_DIR = join(import.meta.dir, '..', 'logs');
const DOCS_DIR = join(import.meta.dir, '..', 'docs');
const logger = createLogger('goals', LOG_DIR);
const PORT = Number(process.env.PORT || 8090);

function getEffectiveUser(baseUser: AuthUser, req: Request): AuthUser {
  const cookieHeader = req.headers.get('cookie') || '';
  const isManagerMode = cookieHeader.includes('goals_persona=manager');

  if (isManagerMode) {
    return {
      id: 'usr_manager',
      email: 'sarah.connor@forge.internal',
      displayName: 'Sarah Connor',
      roles: ['roles/manager', 'roles/employee'],
      department: 'Platform Engineering',
      orgId: baseUser.orgId || 'org_default',
    };
  }

  return {
    id: baseUser.id || 'usr_employee',
    email: baseUser.email || 'jane.doe@forge.internal',
    displayName: baseUser.displayName || 'Jane Doe',
    roles: baseUser.roles && baseUser.roles.length > 0 ? baseUser.roles : ['roles/employee'],
    department: baseUser.department || 'Platform Engineering',
    orgId: baseUser.orgId || 'org_default',
  };
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

      // 4. Zero-Trust Auth Guard
      const auth = await authGuard(req, {
        appName: 'goals',
        requiredRoles: ['roles/employee', 'roles/admin', 'roles/manager'],
      });

      if (!auth.authenticated || !auth.user) {
        return auth.response || new Response('Unauthorized', { status: 401 });
      }

      const user = getEffectiveUser(auth.user, req);
      const orgId = user.orgId || 'org_default';

      // 5. Persona Switcher Toggle (for demo testing)
      if (pathname.endsWith('/api/persona/toggle') && req.method === 'POST') {
        const cookieHeader = req.headers.get('cookie') || '';
        const isManager = cookieHeader.includes('goals_persona=manager');
        const nextVal = isManager ? 'employee' : 'manager';
        return new Response(JSON.stringify({ persona: nextVal }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `goals_persona=${nextVal}; Path=/; HttpOnly; SameSite=Lax`,
          },
        });
      }

      // 6. REST API Endpoints
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
          const board = getBoardById(boardId, orgId);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // PUT /api/boards/:id/items (Guarded by server-side lock)
        if (boardId && action === 'items' && req.method === 'PUT') {
          const body = await req.json();
          const board = updateGoalItems(boardId, body, user);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/submit (Locks board)
        if (boardId && action === 'submit' && req.method === 'POST') {
          const board = submitBoard(boardId, user);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }

        // POST /api/boards/:id/review (Manager approval or rework)
        if (boardId && action === 'review' && req.method === 'POST') {
          const body = await req.json();
          const board = body.decision === 'APPROVE'
            ? approveBoard(boardId, user, body.comment)
            : requestRework(boardId, user, body.comment, body.itemId);
          return new Response(JSON.stringify(board), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Reminders API
      if (pathname.includes('/api/reminders')) {
        const reminders = listUserReminders(user.id, orgId);
        return new Response(JSON.stringify(reminders), { headers: { 'Content-Type': 'application/json' } });
      }

      // 7. SPA View Fragment REST API
      if (pathname.endsWith('/api/views') && req.method === 'GET') {
        const tabParam = url.searchParams.get('tab') || 'dashboard';
        const boardIdParam = url.searchParams.get('id');
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
          const pending = listPendingReviews(orgId);
          const approved = allBoards.filter(b => b.status === 'APPROVED');
          contentHtml = renderManagerView(user, pending, approved);
        } else if (tabParam === 'explore') {
          contentHtml = renderExploreView(user, allBoards);
        } else {
          contentHtml = renderDashboardView(user, allBoards, allProjects);
          activeTab = 'dashboard';
        }

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
      const allBoards = listBoards(orgId);
      const allProjects = listProjects(orgId);
      const reminders = listUserReminders(user.id, orgId);

      let contentHtml = '';
      let activeTab: any = tabParam;

      if (tabParam === 'board' && boardIdParam) {
        const board = getBoardById(boardIdParam, orgId);
        contentHtml = renderBoardView(user, board);
        activeTab = 'board';
      } else if (tabParam === 'boards') {
        contentHtml = renderBoardsView(user, allBoards, allProjects);
        activeTab = 'boards';
      } else if (tabParam === 'reviews') {
        const pending = listPendingReviews(orgId);
        const approved = allBoards.filter(b => b.status === 'APPROVED');
        contentHtml = renderManagerView(user, pending, approved);
      } else if (tabParam === 'explore') {
        contentHtml = renderExploreView(user, allBoards);
      } else {
        contentHtml = renderDashboardView(user, allBoards, allProjects);
        activeTab = 'dashboard';
      }

      const fullHtml = renderLayout({
        activeTab,
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
