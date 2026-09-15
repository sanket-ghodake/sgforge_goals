/**
 * Individual Goal Center - Master Shell Layout (2026 LTS)
 * Full-width top header bar, sub-header sidebar, responsive drawer,
 * and strict Single Page Application (SPA) client routing engine.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { getLayoutStyles } from './layout-styles';
import { getAstryxToastScript, getAstryxTooltipScript } from '../../lib/ui';
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
  const isManager = user.roles.includes('roles/manager') || user.id === 'usr_manager';
  const unreadAlerts = reminders.filter(r => !r.isDismissed).length;

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/apps/goals/">
  <title>SG Forge - Individual Goal Center</title>
  <script>
    (function() {
      const theme = localStorage.getItem('forge_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      const isPinned = localStorage.getItem('goals_sidebar_pinned') === 'true';
      if (isPinned) document.documentElement.classList.add('sidebar-pinned');
    })();
  </script>
  <style>
    ${getLayoutStyles()}
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
      <!-- Role Persona Switcher -->
      <button class="btn-action btn-outline" onclick="togglePersonaSpa()" data-astryx-tooltip="Switch between Contributor and Manager persona for demo testing">
        ${icons.user} <span id="personaLabel">${isManager ? 'Manager (Sarah)' : 'Employee (Jane)'}</span>
      </button>

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
          <span class="sb-nav-label">Manager Reviews</span>
          <span class="sb-badge" id="sbBadgeReviews" style="display: ${unreadAlerts > 0 ? 'inline-block' : 'none'};">${unreadAlerts}</span>
        </a>

        <a href="?tab=explore" onclick="navigateSpa('explore', null, event)" class="sb-nav-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
          <span class="sb-nav-icon">${icons.compass}</span>
          <span class="sb-nav-label">Hall of Impact</span>
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
      </div>
    </aside>

    <!-- Main Content Area Container -->
    <main class="app-viewport">
      <div class="content-area astryx-container aceternity-hero-grid" id="appMainContent">
        ${contentHtml}
      </div>
    </main>
  </div>

  <!-- 3. MODALS & DRAWERS -->
  <!-- New Board Modal -->
  <div class="modal-backdrop" id="newBoardModal" onclick="if(event.target === this) closeNewBoardModal()">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Create Project Goal Board</h3>
        <button class="btn-icon" onclick="closeNewBoardModal()">${icons.close}</button>
      </div>

      <form id="newBoardForm" onsubmit="handleCreateBoard(event)">
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Assigned Project</label>
          <select id="boardProjectSelect" class="shadcn-select" required>
            <option value="proj_titan">Project Titan (Core API Gateway)</option>
            <option value="proj_apollo">Project Apollo (Telemetry Agent)</option>
            <option value="proj_hermes">Project Hermes (Edge Storage Fabric)</option>
          </select>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Board Title</label>
          <input id="boardTitleInput" type="text" placeholder="e.g. Q1 Distributed Mesh Resilience" required style="width: 100%; height: 38px; border-radius: 7px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.875rem;" />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Evaluation Cycle</label>
          <select id="boardCycleSelect" class="shadcn-select" required>
            <option value="2026-Q1">2026-Q1 (Current Active)</option>
            <option value="2026-Q2">2026-Q2 (Upcoming)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-action btn-outline" onclick="closeNewBoardModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary">${icons.plus} Create Board</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Reminders Slide-Over Drawer -->
  <div class="modal-backdrop" id="remindersDrawer" onclick="if(event.target === this) closeRemindersDrawer()">
    <div class="modal-box" style="margin-left: auto; max-width: 440px; height: 100vh; border-radius: 0; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--forge-warning);">${icons.bell}</span>
          <h3 style="font-size: 1.1rem; font-weight: 700;">Action Alerts & Reminders</h3>
        </div>
        <button class="btn-icon" onclick="closeRemindersDrawer()">${icons.close}</button>
      </div>

      <div id="remindersListContainer" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
        ${reminders.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: var(--forge-text-muted); font-size: 0.875rem;">
            ${icons.checkCircle} All caught up! Zero pending actions.
          </div>
        ` : reminders.map(r => `
          <div id="reminder-card-${r.id}" style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px; position: relative;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: ${r.type === 'REWORK_REQUIRED' ? 'var(--forge-warning)' : r.type === 'PENDING_APPROVAL' ? 'var(--forge-primary)' : 'var(--forge-accent)'};">
                ${r.type.replace('_', ' ')}
              </span>
              <button onclick="dismissReminderSpa('${r.id}')" style="background:none; border:none; color:var(--forge-text-muted); cursor:pointer; font-size:0.75rem;">Dismiss</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--forge-text-main); margin-bottom: 8px; line-height: 1.4;">${r.message}</p>
            <a href="?tab=board&id=${r.boardId}" onclick="navigateSpa('board', '${r.boardId}', event)" class="btn-action btn-outline" style="height: 26px; font-size: 0.75rem; padding: 0 8px;">
              View Board ${icons.arrowRight}
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  ${getAstryxToastScript()}
  ${getAstryxTooltipScript()}

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
            if (el.dataset.tab === data.activeTab) {
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

    window.addEventListener('popstate', function(e) {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') || 'cockpit';
      const boardId = urlParams.get('id');
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

    function togglePersonaSpa() {
      fetch('api/persona/toggle', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          const label = document.getElementById('personaLabel');
          if (label) label.textContent = data.persona === 'manager' ? 'Manager (Sarah)' : 'Employee (Jane)';
          if (window.astryxToast) window.astryxToast('Switched to ' + data.persona.toUpperCase() + ' persona', 'info');
          const urlParams = new URLSearchParams(window.location.search);
          loadSpaView(urlParams.get('tab') || 'cockpit', urlParams.get('id'));
        });
    }

    function openNewBoardModal() {
      document.getElementById('newBoardModal').classList.add('open');
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
      const projectId = document.getElementById('boardProjectSelect').value;
      const title = document.getElementById('boardTitleInput').value;
      const cycle = document.getElementById('boardCycleSelect').value;

      fetch('api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title, cycle })
      })
      .then(res => res.json())
      .then(board => {
        closeNewBoardModal();
        if (window.astryxToast) window.astryxToast('Goal Board created successfully!', 'success');
        navigateSpa('board', board.id);
      })
      .catch(err => {
        if (window.astryxToast) window.astryxToast('Failed to create board: ' + err.message, 'error');
      });
    }
  </script>
</body>
</html>`;
}
