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
  <link rel="stylesheet" href="assets/app.css?v=20260921_0915">
  <style>
    /* Critical CSS fallback variables & Review Drawer Engine */
    :root { color-scheme: dark light; }
    .drawer-backdrop { display: none; position: fixed; top: 58px; left: 0; right: 0; bottom: 0; height: calc(100vh - 58px); background: rgba(0, 0, 0, 0.25); z-index: 210; animation: fadeIn 0.2s ease; }
    [data-theme="light"] .drawer-backdrop { background: rgba(0, 0, 0, 0.12); }
    .drawer-backdrop.open { display: block; }
    .drawer-pane { position: absolute; top: 0; right: 0; bottom: 0; width: 460px; max-width: 100vw; height: 100%; background: var(--forge-glass-surface); border-left: 1px solid var(--forge-glass-border); border-radius: 18px 0 0 18px; box-shadow: -14px 0 44px rgba(0, 0, 0, 0.4); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); z-index: 220; display: flex; flex-direction: column; overflow: hidden; transform: translateX(100%); transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
    .drawer-backdrop.open .drawer-pane { transform: translateX(0); }
    [data-theme="light"] .drawer-pane { background: rgba(255, 255, 255, 0.96); border-left: 1px solid var(--forge-border); box-shadow: -14px 0 44px rgba(0, 0, 0, 0.08); }
    @media (max-width: 640px) { .drawer-backdrop { top: 0; height: 100vh; } .drawer-pane { width: 100vw; max-width: 100vw; border-radius: 0; border-left: none; } }
    .drawer-header { height: 60px; padding: 0 18px; border-bottom: 1px solid var(--forge-border); background: var(--forge-bg-surface); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-shrink: 0; }
    [data-theme="light"] .drawer-header { background: #ffffff; border-bottom-color: var(--forge-border); }
    .drawer-body { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; background: var(--forge-bg-root); }
    [data-theme="light"] .drawer-body { background: #f8f8fc; }
    .drawer-footer { padding: 12px 18px; border-top: 1px solid var(--forge-border); background: var(--forge-bg-surface); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
    [data-theme="light"] .drawer-footer { background: #ffffff; border-top-color: var(--forge-border); }
    #drawerActionButtons:empty { display: none; margin: 0; }
    .drawer-peer-header { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .drawer-peer-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent)); color: #fff; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25); }
    .drawer-peer-name { font-size: 0.875rem; font-weight: 600; color: var(--forge-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drawer-peer-sub { font-size: 0.72rem; color: var(--forge-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drawer-status-pill { font-size: 0.68rem; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--forge-border); color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
    [data-theme="light"] .drawer-status-pill { background: rgba(0, 0, 0, 0.04); }
    .drawer-status-beacon { width: 6px; height: 6px; border-radius: 50%; position: relative; display: inline-block; }
    .drawer-status-beacon::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; background: inherit; opacity: 0.45; animation: beaconPulse 2s infinite ease-out; }
    @keyframes beaconPulse { 0% { transform: scale(0.8); opacity: 0.8; } 70% { transform: scale(2.3); opacity: 0; } 100% { transform: scale(2.3); opacity: 0; } }
    .drawer-close-btn { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: transparent; color: var(--forge-text-muted); transition: all 0.15s ease; }
    .drawer-close-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--forge-text-main); }
    [data-theme="light"] .drawer-close-btn:hover { background: rgba(0, 0, 0, 0.05); color: var(--forge-text-main); }
    .timeline-card { width: fit-content; max-width: 84%; border-radius: 12px; padding: 10px 14px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); word-break: break-word; animation: timelineSlide 0.18s ease; display: flex; flex-direction: column; gap: 4px; }
    .timeline-card-me { align-self: flex-end; background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.32); }
    [data-theme="light"] .timeline-card-me { background: #eef2ff; border-color: rgba(79, 70, 229, 0.28); color: #1e1b4b; }
    .timeline-card-other { align-self: flex-start; background: var(--forge-bg-card); border-color: var(--forge-border); }
    [data-theme="light"] .timeline-card-other { background: #ffffff; border-color: var(--forge-border); color: var(--forge-text-main); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04); }
    .timeline-card-reviewer { border-color: rgba(99, 102, 241, 0.35); background: rgba(99, 102, 241, 0.04); }
    [data-theme="light"] .timeline-card-reviewer { border-color: rgba(79, 70, 229, 0.28); background: rgba(79, 70, 229, 0.03); }
    .timeline-card-rework { border-left: 3px solid var(--forge-warning); background: var(--forge-warning-bg); }
    .timeline-card-approved { align-self: center; width: fit-content; max-width: 90%; border: 1px solid rgba(16, 185, 129, 0.4); background: var(--forge-success-bg); text-align: center; padding: 12px 16px; align-items: center; }
    .timeline-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.75rem; }
    .timeline-card-author { font-weight: 600; color: var(--forge-text-main); display: inline-flex; align-items: center; gap: 6px; }
    .timeline-card-time { font-size: 0.68rem; color: var(--forge-text-subtle); font-family: var(--font-mono); font-feature-settings: "tnum"; }
    .timeline-card-body { font-size: 0.8125rem; line-height: 1.45; color: var(--forge-text-main); }
    .timeline-milestone-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; padding: 2px 7px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--forge-border); color: var(--forge-text-muted); width: fit-content; }
    [data-theme="light"] .timeline-milestone-badge { background: #f1f5f9; color: #475569; }
    .timeline-event-card, .timeline-date-divider { align-self: center; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--forge-border); border-radius: 9999px; padding: 3px 12px; font-size: 0.68rem; color: var(--forge-text-muted); text-align: center; margin: 3px 0; max-width: 90%; }
    [data-theme="light"] .timeline-event-card, [data-theme="light"] .timeline-date-divider { background: #ffffff; color: #64748b; }
    .timeline-date-divider { font-family: var(--font-mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.65rem; border: none; background: transparent; color: var(--forge-text-subtle); }
    [data-theme="light"] .timeline-date-divider { background: transparent; }
    .drawer-comment-input { flex: 1; min-width: 0; height: 38px; border-radius: 8px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.8125rem; outline: none; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
    .drawer-comment-input::placeholder { color: var(--forge-text-subtle); }
    .drawer-comment-input:focus { border-color: var(--forge-primary); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18); }
    [data-theme="light"] .drawer-comment-input { background: #ffffff; border-color: var(--forge-border); }
    .drawer-send-btn { height: 38px; padding: 0 14px; font-size: 0.8125rem; font-weight: 600; flex-shrink: 0; border-radius: 8px; border: none; background: var(--forge-primary); color: #fff; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: background 0.15s, transform 0.1s; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25); }
    .drawer-send-btn:hover { background: var(--forge-primary-hover); transform: translateY(-1px); }
    .drawer-send-btn:active { transform: scale(0.98); }
    .drawer-action-btn { height: 30px; padding: 0 10px; font-size: 0.75rem; font-weight: 500; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; text-decoration: none; border: none; transition: all 0.15s ease; }
    .drawer-action-btn-neutral { background: var(--forge-bg-card); color: var(--forge-text-main); border: 1px solid var(--forge-border); }
    .drawer-action-btn-neutral:hover { background: var(--forge-bg-card-hover); border-color: var(--forge-border-medium); }
    [data-theme="light"] .drawer-action-btn-neutral { background: #ffffff; color: var(--forge-text-main); border-color: var(--forge-border); }
    [data-theme="light"] .drawer-action-btn-neutral:hover { background: #f8fafc; border-color: #cbd5e1; }
    .drawer-action-btn-primary { background: var(--forge-primary); color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25); }
    .drawer-action-btn-primary:hover { background: var(--forge-primary-hover); }
    .drawer-action-status-label { font-size: 0.725rem; font-weight: 500; color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 4px; }
    [data-theme="light"] .drawer-action-status-label { color: #64748b; }
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

          const p = new URLSearchParams(window.location.search);
          if ((p.get('review') === '1' || p.get('openReview') === '1') && boardId) {
            setTimeout(() => { if (typeof openReviewDrawer === 'function') openReviewDrawer(boardId); }, 120);
          }
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
        const severity = (eventType === 'error' || eventType === 'unhandledrejection') ? 'ERROR' : 'INFO';
        fetch('api/logs/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: eventType,
            severity: severity,
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

    const initParams = new URLSearchParams(window.location.search);
    if ((initParams.get('review') === '1' || initParams.get('openReview') === '1') && initParams.get('id')) {
      setTimeout(() => { if (typeof openReviewDrawer === 'function') openReviewDrawer(initParams.get('id')); }, 200);
    }

    ${getReviewDrawerScript()}
  </script>
</body>
</html>`;
}
