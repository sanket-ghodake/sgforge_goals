/**
 * Individual Goal Center - My Goal Boards View (Tab 2)
 * Enterprise 2026 LTS Component: Fuses shadcn UI, Magic UI, Aceternity, and Luxe.
 * Dedicated strictly to the authenticated user's own goal boards and personal goal plans.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { escapeHtml, getStatusBadge } from '../../lib/ui';
import type { AuthUser, GoalBoard, Project } from '../../lib/types';

function renderBoardCard(b: GoalBoard): string {
  const statusBadge = getStatusBadge(b.status);
  const lockIcon = b.status === 'SUBMITTED' ? icons.lock : b.status === 'APPROVED' ? icons.award : icons.unlock;
  const itemCount = Array.isArray(b.items) ? b.items.length : 0;

  return `
    <div class="my-board-card" data-title="${escapeHtml(b.title.toLowerCase())}" data-status="${escapeHtml(b.status)}" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 14px; padding: 22px; display: flex; flex-direction: column; backdrop-filter: blur(12px); transition: border-color 0.2s ease, transform 0.2s ease;" onmouseover="this.style.borderColor='var(--forge-border-medium)'" onmouseout="this.style.borderColor='var(--forge-border)'">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 6px;">
          ${icons.target} Milestone Blueprint
        </span>
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 600; padding: 3px 9px; border-radius: 9999px; ${statusBadge.style}">
          ${lockIcon} ${statusBadge.label}
        </span>
      </div>

      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">
        <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" style="color: var(--forge-text-main); text-decoration: none;" onmouseover="this.style.color='var(--forge-primary)'" onmouseout="this.style.color='var(--forge-text-main)'">
          ${escapeHtml(b.title)}
        </a>
      </h3>

      <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 18px; display: flex; gap: 12px; flex-wrap: wrap;">
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.layers} Rev ${Number(b.revisionNumber) || 1}</span>
        ${itemCount > 0 ? `<span style="display: inline-flex; align-items: center; gap: 4px;">${icons.target} ${itemCount} Milestones</span>` : ''}
        ${b.submissionDeadline ? `
          <span style="display: inline-flex; align-items: center; gap: 4px; color: var(--forge-warning);">
            ${icons.clock} Due ${escapeHtml(b.submissionDeadline)}
          </span>
        ` : ''}
        <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.clock} ${new Date(b.updatedAt).toLocaleDateString()}</span>
      </div>

      <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <button class="btn-action btn-outline" style="height: 32px; font-size: 0.75rem; padding: 0 11px;" onclick="openReviewDrawer('${escapeHtml(b.id)}')">
          ${icons.messageSquare} Timeline
        </button>
        <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" class="btn-action btn-primary" style="height: 32px; font-size: 0.75rem; padding: 0 12px;">
          Open Canvas ${icons.arrowRight}
        </a>
      </div>
    </div>
  `;
}

function renderBoardRow(b: GoalBoard): string {
  const statusBadge = getStatusBadge(b.status);
  const itemCount = Array.isArray(b.items) ? b.items.length : 0;

  return `
    <tr class="my-board-row" data-title="${escapeHtml(b.title.toLowerCase())}" data-status="${escapeHtml(b.status)}" style="border-bottom: 1px solid var(--forge-border); transition: background-color 0.15s ease;">
      <td style="padding: 14px 18px; vertical-align: middle;">
        <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" style="color: var(--forge-text-main); font-weight: 700; font-size: 0.92rem; text-decoration: none;" onmouseover="this.style.color='var(--forge-primary)'" onmouseout="this.style.color='var(--forge-text-main)'">
          ${escapeHtml(b.title)}
        </a>
      </td>
      <td style="padding: 14px 18px; vertical-align: middle; white-space: nowrap;">
        <span style="padding: 2px 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--forge-border); font-family: var(--font-mono); font-size: 0.75rem; color: var(--forge-text-muted);">
          Rev ${Number(b.revisionNumber) || 1}
        </span>
      </td>
      <td style="padding: 14px 18px; vertical-align: middle; white-space: nowrap; font-size: 0.775rem; color: var(--forge-text-muted);">
        ${itemCount > 0 ? `${itemCount} Milestones` : 'Draft Stage'}
      </td>
      <td style="padding: 14px 18px; vertical-align: middle; white-space: nowrap;">
        <span style="font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 9999px; ${statusBadge.style}">
          ${statusBadge.label}
        </span>
      </td>
      <td style="padding: 14px 18px; vertical-align: middle; white-space: nowrap; font-size: 0.775rem; color: var(--forge-text-muted);">
        ${icons.clock} ${new Date(b.updatedAt).toLocaleDateString()}
      </td>
      <td style="padding: 14px 18px; vertical-align: middle; text-align: right; white-space: nowrap;">
        <div style="display: inline-flex; gap: 8px; justify-content: flex-end;">
          <button class="btn-action btn-outline" style="height: 30px; font-size: 0.75rem; padding: 0 10px;" onclick="openReviewDrawer('${escapeHtml(b.id)}')">
            ${icons.messageSquare} Timeline
          </button>
          <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" class="btn-action btn-primary" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">
            Canvas ${icons.arrowRight}
          </a>
        </div>
      </td>
    </tr>
  `;
}

export function renderBoardsView(user: AuthUser, boards: GoalBoard[], projects: Project[]): string {
  // Tab 2 is strictly for the user's OWN goal boards
  const myBoards = boards.filter(b => b.ownerId === user.id);
  const hasNoManagerAbove = !user.hasManagerAbove && !user.managerId && !user.managerName;

  const submittedCount = myBoards.filter(b => b.status === 'SUBMITTED' || b.status === 'UNLOCK_REQUESTED' || b.status === 'LOCKED_OVERDUE').length;
  const reworkCount = myBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const approvedCount = myBoards.filter(b => b.status === 'APPROVED').length;
  const draftCount = myBoards.filter(b => b.status === 'DRAFT').length;

  return `
    <div style="margin-bottom: 32px;">
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">
            My Goal Boards
          </h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            Design and execute your personal milestone commitment blueprints, track deliverable progress, and manage review stages.
          </p>
        </div>
        <button class="btn-action btn-primary" onclick="openNewBoardModal()">
          ${icons.plus} Create Goal Board
        </button>
      </div>

      ${hasNoManagerAbove ? `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: var(--forge-primary); display: flex;">${icons.infoCircle}</span>
            <div style="font-size: 0.825rem; color: var(--forge-text-muted);">
              Apex Contributor Mode: Your goal plans are self-governed and do not require manager approval submission cycles.
            </div>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; padding: 2px 10px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); color: var(--forge-primary);">
            Self-Governed
          </span>
        </div>
      ` : ''}

      <!-- Luxe HUD Metric Cards for Personal Boards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>ACTIVE GOAL PLANS</span>
            <span style="color: var(--forge-primary);">${icons.target}</span>
          </div>
          <div class="luxe-metric-val">${myBoards.length}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Personal goal boards</div>
        </div>

        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>UNDER REVIEW</span>
            <span style="color: var(--forge-warning);">${icons.lock}</span>
          </div>
          <div class="luxe-metric-val" style="color: var(--forge-warning);">${submittedCount}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">${hasNoManagerAbove ? 'Self-directed' : 'Locked for review'}</div>
        </div>

        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>REVISIONS NEEDED</span>
            <span style="color: var(--forge-error);">${icons.alertCircle}</span>
          </div>
          <div class="luxe-metric-val" style="color: ${reworkCount > 0 ? 'var(--forge-error)' : 'var(--forge-text-main)'};">${reworkCount}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Action required by you</div>
        </div>

        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>APPROVED & SEALED</span>
            <span style="color: var(--forge-success);">${icons.award}</span>
          </div>
          <div class="luxe-metric-val" style="color: var(--forge-success);">${approvedCount}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Formally approved</div>
        </div>

        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>DRAFTS</span>
            <span style="color: var(--forge-accent);">${icons.edit}</span>
          </div>
          <div class="luxe-metric-val">${draftCount}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">In-progress blueprints</div>
        </div>
      </div>

      <!-- Search, Status Filter Pills & View Switcher -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div style="flex: 1; min-width: 240px; max-width: 440px; position: relative;">
          <input id="boardsSearchInput" type="text" oninput="window.filterMyBoards && window.filterMyBoards()" placeholder="Search my boards by title, project, or cycle..." style="width: 100%; height: 38px; border-radius: 10px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px 0 36px; font-size: 0.85rem;" />
          <span style="position: absolute; left: 12px; top: 11px; color: var(--forge-text-muted); display: flex;">${icons.search}</span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; gap: 6px; background: var(--forge-bg-surface); padding: 3px; border-radius: 10px; border: 1px solid var(--forge-border);" id="boardStatusPills">
            <button class="btn-action btn-outline active-filter" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('ALL', this)" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">All (${myBoards.length})</button>
            <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('DRAFT', this)" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Drafts (${draftCount})</button>
            <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('SUBMITTED', this)" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Under Review (${submittedCount})</button>
            <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('REWORK_REQUESTED', this)" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Revisions (${reworkCount})</button>
            <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('APPROVED', this)" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Approved (${approvedCount})</button>
          </div>

          <div style="display: inline-flex; gap: 2px; background: var(--forge-bg-surface); padding: 3px; border-radius: 10px; border: 1px solid var(--forge-border);">
            <button class="btn-action btn-outline active-view" id="btnBoardsCardsView" data-astryx-tooltip="Cards View" style="height: 30px; padding: 0 10px; font-size: 0.75rem;" onclick="window.switchBoardsViewMode && window.switchBoardsViewMode('cards')">
              ${icons.target} Cards
            </button>
            <button class="btn-action btn-outline" id="btnBoardsTableView" data-astryx-tooltip="List View" style="height: 30px; padding: 0 10px; font-size: 0.75rem;" onclick="window.switchBoardsViewMode && window.switchBoardsViewMode('table')">
              ${icons.layers} List
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      ${myBoards.length === 0 ? `
        <div style="padding: 48px 24px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 16px;">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(99, 102, 241, 0.12); color: var(--forge-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.25);">
            ${icons.target}
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px; color: var(--forge-text-main);">No Goal Boards Found</h3>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem; max-width: 460px; margin: 0 auto 20px auto; line-height: 1.5;">
            You have not created any goal plans for this cycle yet. Create your first goal board to track milestones, weights, and progress.
          </p>
          <button class="btn-action btn-primary" onclick="openNewBoardModal()">
            ${icons.plus} Create Goal Board
          </button>
        </div>
      ` : `
        <!-- Mode A: Cards Grid -->
        <div id="myBoardsCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">
          ${myBoards.map(b => renderBoardCard(b)).join('')}
        </div>

        <!-- Mode B: Table List -->
        <div id="myBoardsTableWrapper" style="display: none; background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 14px; overflow: hidden; backdrop-filter: blur(12px);">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--forge-border); font-size: 0.7rem; font-weight: 700; color: var(--forge-text-muted); letter-spacing: 0.05em; text-transform: uppercase;">
                  <th style="padding: 12px 18px;">Goal Board Title</th>
                  <th style="padding: 12px 18px;">Revision</th>
                  <th style="padding: 12px 18px;">Milestones</th>
                  <th style="padding: 12px 18px;">Status</th>
                  <th style="padding: 12px 18px;">Updated</th>
                  <th style="padding: 12px 18px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${myBoards.map(b => renderBoardRow(b)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>

    <script>
      (function() {
        let activeStatus = 'ALL';
        let currentMode = 'cards';

        window.setBoardStatusFilter = function(status, btn) {
          activeStatus = status;
          document.querySelectorAll('#boardStatusPills button').forEach(b => {
            b.classList.remove('active-filter');
          });
          if (btn) btn.classList.add('active-filter');
          window.filterMyBoards();
        };

        window.switchBoardsViewMode = function(mode) {
          currentMode = mode;
          const grid = document.getElementById('myBoardsCardsGrid');
          const table = document.getElementById('myBoardsTableWrapper');
          const btnCards = document.getElementById('btnBoardsCardsView');
          const btnTable = document.getElementById('btnBoardsTableView');

          if (btnCards && btnTable) {
            if (mode === 'cards') {
              btnCards.classList.add('active-view');
              btnTable.classList.remove('active-view');
            } else {
              btnCards.classList.remove('active-view');
              btnTable.classList.add('active-view');
            }
          }
          if (grid) grid.style.display = mode === 'cards' ? 'grid' : 'none';
          if (table) table.style.display = mode === 'table' ? 'block' : 'none';
        };

        window.filterMyBoards = function() {
          const searchInput = document.getElementById('boardsSearchInput');
          const query = (searchInput ? searchInput.value || '' : '').toLowerCase().trim();

          const cards = document.querySelectorAll('.my-board-card');
          cards.forEach(card => {
            const title = card.dataset.title || '';
            const status = card.dataset.status || '';

            const matchesQuery = !query || title.includes(query);
            const matchesStatus = activeStatus === 'ALL' || 
              (activeStatus === 'SUBMITTED' && (status === 'SUBMITTED' || status === 'UNLOCK_REQUESTED' || status === 'LOCKED_OVERDUE')) ||
              status === activeStatus;

            card.style.display = matchesQuery && matchesStatus ? 'flex' : 'none';
          });

          const rows = document.querySelectorAll('.my-board-row');
          rows.forEach(row => {
            const title = row.dataset.title || '';
            const status = row.dataset.status || '';

            const matchesQuery = !query || title.includes(query);
            const matchesStatus = activeStatus === 'ALL' || 
              (activeStatus === 'SUBMITTED' && (status === 'SUBMITTED' || status === 'UNLOCK_REQUESTED' || status === 'LOCKED_OVERDUE')) ||
              status === activeStatus;

            row.style.display = matchesQuery && matchesStatus ? '' : 'none';
          });
        };
      })();
    </script>
  `;
}
