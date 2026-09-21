/**
 * Individual Goal Center - Master Shell Layout (2026 LTS)
 * Full-width top header bar, sub-header sidebar, responsive drawer,
 * and strict Single Page Application (SPA) client routing engine.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { getModernSelectAndConfirmScripts, cleanDisplayName, escapeHtml } from '../../lib/ui';
import { getAstryxToastScript, getAstryxTooltipScript, getHeadStateScript } from '../../lib/ui';
import { getReviewDrawerScript } from './review-drawer';
import { renderNewBoardModal, renderRemindersDrawer, renderReworkModal, renderLogoutModal, renderUniversalConfirmModal } from './modals';
import type { AuthUser, Reminder } from '../../lib/types';

export interface LayoutOptions {
  activeTab: 'dashboard' | 'boards' | 'cockpit' | 'board' | 'reviews' | 'explore' | 'reminders';
  activeBoardId?: string;
  user: AuthUser;
  reminders: Reminder[];
  contentHtml: string;
  title?: string;
}

export function renderLayout(options: LayoutOptions): string {
  const { activeTab, user, reminders, contentHtml } = options;
  const isManager = user.roles.includes('roles/manager') || user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin');
  const unreadAlerts = reminders.filter(r => !r.isDismissed).length;

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/apps/goals/">
  <title>Individual Goal Center</title>
  <script>
    (function() {
      const theme = localStorage.getItem('forge_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      const isPinned = localStorage.getItem('goals_sidebar_pinned') === 'true';
      if (isPinned) document.documentElement.classList.add('sidebar-pinned');
      window.__CURRENT_USER__ = {
        id: ${JSON.stringify(user.id)},
        displayName: ${JSON.stringify(user.displayName)},
        email: ${JSON.stringify(user.email)},
        roles: ${JSON.stringify(user.roles || [])},
        department: ${JSON.stringify(user.department || '')},
        managerId: ${JSON.stringify(user.managerId || '')},
        managerName: ${JSON.stringify(user.managerName || '')}
      };
    })();
  </script>
  ${getHeadStateScript()}
  <link rel="stylesheet" href="assets/app.css">
  <style>
    /* Critical CSS fallback variables */
    :root { color-scheme: dark light; }
  </style>
</head>
<body>
  <!-- 1. TOP FULL-WIDTH HEADER BAR (100% Window Width Edge-to-Edge) -->
  <header class="app-header-full">
    <div class="header-left">
      <button class="mobile-nav-toggle" onclick="toggleMobileSidebar()" aria-label="Toggle Navigation">
        ${icons.layers}
      </button>

      <a href="javascript:void(0)" onclick="navigateSpa('dashboard', null, event)" class="header-brand">
        <div class="brand-icon">${icons.target}</div>
        <span class="brand-title">Goal Center</span>
      </a>
    </div>

    <div class="header-right">
      <!-- Action Alerts Bell with Unread Count -->
      <button class="btn-icon" onclick="openRemindersDrawer()" data-astryx-tooltip="Action Alerts & Reminders">
        ${icons.bell}
        <span id="unreadAlertDot" style="display: ${unreadAlerts > 0 ? 'block' : 'none'}; position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; background: var(--forge-warning); border-radius: 50%;"></span>
      </button>

      <!-- Theme Toggle -->
      <button class="btn-icon" onclick="toggleTheme()" data-astryx-tooltip="Toggle Theme">
        ${icons.sunMoon}
      </button>
    </div>
  </header>

  <!-- 2. SUB-HEADER LAYOUT BODY (Sidebar Starts Below Header at top: 58px) -->
  <div class="app-layout-body">
    <!-- Sub-Header Hover-Expanding Sidebar -->
    <aside class="sb-sidebar" id="sbSidebar">
      <nav class="sb-nav-group">
        <a href="?tab=dashboard" onclick="navigateSpa('dashboard', null, event)" class="sb-nav-item ${activeTab === 'dashboard' || activeTab === 'cockpit' ? 'active' : ''}" data-tab="dashboard">
          <span class="sb-nav-icon">${icons.activity}</span>
          <span class="sb-nav-label">Dashboard</span>
        </a>

        <a href="?tab=boards" onclick="navigateSpa('boards', null, event)" class="sb-nav-item ${activeTab === 'boards' ? 'active' : ''}" data-tab="boards">
          <span class="sb-nav-icon">${icons.target}</span>
          <span class="sb-nav-label">Goal Boards</span>
        </a>

        <a href="?tab=reviews" onclick="navigateSpa('reviews', null, event)" class="sb-nav-item ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
          <span class="sb-nav-icon">${icons.shieldAlert}</span>
          <span class="sb-nav-label">Reviews Hub</span>
          <span class="sb-badge" id="sbBadgeReviews" style="display: ${unreadAlerts > 0 ? 'inline-block' : 'none'};">${unreadAlerts}</span>
        </a>

        <a href="?tab=explore" onclick="navigateSpa('explore', null, event)" class="sb-nav-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
          <span class="sb-nav-icon">${icons.compass}</span>
          <span class="sb-nav-label">Org Impact Directory</span>
        </a>

        <a href="javascript:void(0)" onclick="openRemindersDrawer()" class="sb-nav-item" data-tab="reminders">
          <span class="sb-nav-icon">${icons.bell}</span>
          <span class="sb-nav-label">Action Alerts</span>
          <span class="sb-badge" id="sbBadgeAlerts" style="display: ${unreadAlerts > 0 ? 'inline-block' : 'none'};">${unreadAlerts}</span>
        </a>
      </nav>

      <div class="sb-footer">
        <button class="sb-nav-item" style="border:none; width: 100%; text-align: left; cursor: pointer; background: transparent;" onclick="togglePinSidebar()">
          <span class="sb-nav-icon">${icons.pin}</span>
          <span class="sb-nav-label">Pin Sidebar</span>
        </button>

        <button class="sb-nav-item" style="border:none; width: 100%; text-align: left; cursor: pointer; background: transparent; color: var(--forge-error);" onclick="openLogoutModal()" data-astryx-tooltip="Logout from session">
          <span class="sb-nav-icon">${icons.logOut}</span>
          <span class="sb-nav-label">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area Container -->
    <main class="app-viewport">
      <div class="content-area astryx-container" id="appMainContent">
        ${contentHtml}
      </div>
    </main>
  </div>

  <!-- 3. MODALS & DRAWERS -->
  ${renderNewBoardModal()}
  ${renderRemindersDrawer(reminders)}
  ${renderReworkModal()}

  <!-- Right-Sliding WhatsApp-Style Review Timeline Drawer -->
  <div class="drawer-backdrop" id="reviewTimelineDrawer" onclick="if(event.target === this) closeReviewDrawer()">
    <div class="drawer-pane" id="reviewDrawerPane">
      <!-- Dynamically populated by openReviewDrawer(boardId) script -->
    </div>
  </div>

  ${renderLogoutModal(user)}
  ${renderUniversalConfirmModal()}

  ${getAstryxToastScript()}
  ${getAstryxTooltipScript()}
  ${getModernSelectAndConfirmScripts()}

  <!-- 4. STRICT SPA CLIENT ROUTER & RESPONSIVE ENGINE -->
  <script>
    function navigateSpa(tab, boardId, e) {
      if (e) e.preventDefault();
      const targetUrl = '?tab=' + tab + (boardId ? '&id=' + boardId : '');
      history.pushState({ tab, boardId }, '', targetUrl);
      loadSpaView(tab, boardId);
    }

    function loadSpaView(tab, boardId) {
      const mainContainer = document.getElementById('appMainContent');
      if (!mainContainer) return;

      mainContainer.style.opacity = '0.5';
      mainContainer.style.transition = 'opacity 0.15s ease';

      const fetchUrl = 'api/views?tab=' + tab + (boardId ? '&id=' + boardId : '');
      fetch(fetchUrl)
        .then(res => res.json())
        .then(data => {
          mainContainer.innerHTML = data.html;
          mainContainer.style.opacity = '1';

          // Re-evaluate script tags inside dynamic view HTML for SPA execution
          Array.from(mainContainer.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.textContent || ''));
            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(newScript, oldScript);
            }
          });

          // Update Breadcrumbs & Active Nav Item
          const bcTab = document.getElementById('breadcrumbActiveTab');
          if (bcTab) bcTab.textContent = data.activeTab || tab;

          document.querySelectorAll('.sb-nav-item').forEach(el => {
            const isBoardMatch = (data.activeTab === 'board' || data.activeTab === 'boards') && el.dataset.tab === 'boards';
            if (el.dataset.tab === data.activeTab || isBoardMatch) {
              el.classList.add('active');
            } else {
              el.classList.remove('active');
            }
          });

          // Close Mobile Sidebar Drawer if Open
          const sb = document.getElementById('sbSidebar');
          if (sb) sb.classList.remove('mobile-open');
        })
        .catch(err => {
          mainContainer.style.opacity = '1';
          if (window.astryxToast) window.astryxToast('Failed to load view: ' + err.message, 'error');
        });
    }

    // Real User Monitoring (RUM) & Observability Telemetry Bridge
    window.__astryxBreadcrumbs = [];
    function addBreadcrumb(type, target, details) {
      if (window.__astryxBreadcrumbs.length >= 10) window.__astryxBreadcrumbs.shift();
      window.__astryxBreadcrumbs.push({ type, target, timestamp: Date.now(), details });
    }
    document.addEventListener('click', function(e) {
      var el = e.target.closest('button, a, .modern-select');
      if (el) addBreadcrumb('click', el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
    }, { passive: true });

    function sendBrowserTelemetry(eventType, message, stack, meta) {
      try {
        fetch('api/logs/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: eventType,
            message: message,
            stack: stack || '',
            url: window.location.href,
            breadcrumbs: window.__astryxBreadcrumbs,
            meta: meta || {}
          })
        }).catch(function() {});
      } catch (err) {}
    }

    window.addEventListener('error', function(e) {
      sendBrowserTelemetry('error', e.message, e.error ? e.error.stack : '', { filename: e.filename, lineno: e.lineno });
    });
    window.addEventListener('unhandledrejection', function(e) {
      sendBrowserTelemetry('unhandledrejection', e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection', e.reason ? e.reason.stack : '');
    });

    window.addEventListener('popstate', function(e) {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') || 'dashboard';
      const boardId = urlParams.get('id');
      addBreadcrumb('navigation', tab, { boardId: boardId });
      loadSpaView(tab, boardId);
    });

    function toggleMobileSidebar() {
      const sb = document.getElementById('sbSidebar');
      if (sb) sb.classList.toggle('mobile-open');
    }

    function togglePinSidebar() {
      const isPinned = document.documentElement.classList.toggle('sidebar-pinned');
      localStorage.setItem('goals_sidebar_pinned', isPinned ? 'true' : 'false');
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('forge_theme', next);
    }

    function openLogoutModal() {
      const modal = document.getElementById('logoutModal');
      if (modal) modal.classList.add('open');
    }

    function closeLogoutModal() {
      const modal = document.getElementById('logoutModal');
      if (modal) modal.classList.remove('open');
    }

    function confirmLogout() {
      fetch('api/auth/logout', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          closeLogoutModal();
          if (window.astryxToast) window.astryxToast('Session invalidated. Redirecting...', 'info');
          setTimeout(() => {
            window.location.href = data.redirectUrl || '/auth/login';
          }, 400);
        })
        .catch(() => {
          window.location.href = '/auth/login';
        });
    }

    function toggleQuickProjectCreation() {
      const container = document.getElementById('quickProjectContainer');
      if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
      }
    }

    function handleQuickCreateProject() {
      const nameInput = document.getElementById('quickProjectName');
      const codeInput = document.getElementById('quickProjectCode');
      const name = nameInput ? nameInput.value.trim() : '';
      const code = codeInput ? codeInput.value.trim() : '';
      if (!name || !code) {
        if (window.astryxToast) window.astryxToast('Please provide both Project Name and Code', 'error');
        return;
      }

      fetch('api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create project');
        return res.json();
      })
      .then(newProj => {
        fetch('api/projects')
          .then(r => r.json())
          .then(projects => {
            if (window.updateModernSelectOptions) {
              window.updateModernSelectOptions('boardProjectSelect', projects.map(p => ({
                value: p.id,
                label: p.name + ' (' + p.code + ')',
                selected: p.id === newProj.id
              })));
            }
          });
        if (nameInput) nameInput.value = '';
        if (codeInput) codeInput.value = '';
        toggleQuickProjectCreation();
        if (window.astryxToast) window.astryxToast('Project ' + newProj.name + ' created!', 'success');
      })
      .catch(err => {
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      });
    }

    function openNewBoardModal() {
      const modal = document.getElementById('newBoardModal');
      if (modal) {
        const input = document.getElementById('boardTitleInput');
        if (input) input.value = '';
        modal.classList.add('open');
        setTimeout(() => { if (input) input.focus(); }, 80);
      }
    }

    function closeNewBoardModal() {
      document.getElementById('newBoardModal').classList.remove('open');
    }

    function openRemindersDrawer() {
      document.getElementById('remindersDrawer').classList.add('open');
    }

    function closeRemindersDrawer() {
      document.getElementById('remindersDrawer').classList.remove('open');
    }

    function dismissReminderSpa(id) {
      fetch('api/reminders/' + id + '/dismiss', { method: 'POST' })
        .then(() => {
          const card = document.getElementById('reminder-card-' + id);
          if (card) card.remove();
          if (window.astryxToast) window.astryxToast('Alert dismissed', 'info');
        });
    }

    function handleCreateBoard(e) {
      e.preventDefault();
      const titleInput = document.getElementById('boardTitleInput');
      const title = titleInput ? titleInput.value.trim() : '';

      if (!title) {
        if (window.astryxToast) window.astryxToast('Please provide a title for the goal board.', 'warning');
        return;
      }

      fetch('api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.detail || data.error || 'Failed to create board'); });
        }
        return res.json();
      })
      .then(board => {
        closeNewBoardModal();
        if (window.astryxToast) window.astryxToast('Goal Board created successfully!', 'success');
        navigateSpa('board', board.id);
      })
      .catch(err => {
        if (window.astryxToast) window.astryxToast('Failed to create board: ' + err.message, 'error');
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (typeof closeNewBoardModal === 'function') closeNewBoardModal();
        if (typeof closeReworkModal === 'function') closeReworkModal();
        if (typeof closeReviewDrawer === 'function') closeReviewDrawer();
        if (typeof closeRemindersDrawer === 'function') closeRemindersDrawer();
        if (typeof closeModernConfirm === 'function') closeModernConfirm();
      }
    });

    ${getReviewDrawerScript()}
  </script>
</body>
</html>`;
}

