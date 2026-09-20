/**
 * Individual Goal Center - My Goal Boards View (Tab 2)
 * Interactive management canvas for project flight plans, milestone boards, and review stages.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { escapeHtml, getStatusBadge } from '../../lib/ui';
import type { AuthUser, GoalBoard, Project } from '../../lib/types';

export function renderBoardsView(user: AuthUser, boards: GoalBoard[], projects: Project[]): string {
  const isManager = user.roles.includes('roles/manager') || user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin');
  
  // For managers/leadership: show all relevant team boards plus own boards
  const displayBoards = isManager ? boards : boards.filter(b => b.ownerId === user.id);

  // Extract unique employee owners for the filter dropdown
  const employeeOwners = Array.from(
    new Map(displayBoards.map(b => [b.ownerId, { id: b.ownerId, name: b.ownerName }])).values()
  );

  return `
    <div style="margin-bottom: 32px;">
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">
            ${isManager ? 'Team & Milestone Goal Boards' : 'My Goal Boards'}
          </h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            ${isManager 
              ? 'Inspect employee commitment flight plans, review milestone deliverables, and audit approval readiness.'
              : 'Manage milestone commitment blueprints, inspect locked review stages, and draft flight plans.'}
          </p>
        </div>
        <button class="btn-action btn-primary" onclick="openNewBoardModal()">
          ${icons.plus} Create Goal Board
        </button>
      </div>

      <!-- Search & Filter Controls -->
      <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 220px; position: relative;">
          <input id="boardsSearchInput" type="text" oninput="window.filterMyBoards && window.filterMyBoards()" placeholder="Search goal boards by title, project, or employee..." style="width: 100%; height: 38px; border-radius: 6px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border-medium); color: var(--forge-text-main); padding: 0 12px 0 34px; font-size: 0.875rem;" />
          <span style="position: absolute; left: 10px; top: 11px; color: var(--forge-text-muted); display: flex;">${icons.search}</span>
        </div>

        ${isManager && employeeOwners.length > 1 ? `
          <div style="min-width: 180px;">
            <select id="boardEmployeeSelect" class="shadcn-select" onchange="window.filterMyBoards && window.filterMyBoards()" style="height: 38px; font-size: 0.85rem;">
              <option value="ALL">All Team Members (${displayBoards.length} boards)</option>
              <option value="${user.id}">My Own Boards</option>
              ${employeeOwners.filter(e => e.id !== user.id).map(e => `
                <option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="boardStatusPills">
          <button class="btn-action btn-primary" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('ALL', this)" style="height: 32px; font-size: 0.75rem;">All Boards</button>
          <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('SUBMITTED', this)" style="height: 32px; font-size: 0.75rem;">Under Review</button>
          <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('REWORK_REQUESTED', this)" style="height: 32px; font-size: 0.75rem;">Revisions</button>
          <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('APPROVED', this)" style="height: 32px; font-size: 0.75rem;">Approved</button>
          <button class="btn-action btn-outline" onclick="window.setBoardStatusFilter && window.setBoardStatusFilter('DRAFT', this)" style="height: 32px; font-size: 0.75rem;">Drafts</button>
        </div>
      </div>

      <!-- Boards Grid -->
      <div id="myBoardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">
        ${displayBoards.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 12px;">
            <div style="color: var(--forge-primary); margin-bottom: 12px; display: inline-flex;">${icons.target}</div>
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">No Goal Boards Found</h3>
            <p style="color: var(--forge-text-muted); font-size: 0.85rem; margin-bottom: 16px;">No flight plans currently created for this cycle.</p>
            <button class="btn-action btn-primary" onclick="openNewBoardModal()">${icons.plus} Create Goal Board</button>
          </div>
        ` : displayBoards.map(board => {
          const statusBadge = getStatusBadge(board.status);
          const lockIcon = board.status === 'SUBMITTED' ? icons.lock : board.status === 'APPROVED' ? icons.award : icons.unlock;
          return `
            <div class="my-board-card" data-title="${board.title.toLowerCase()}" data-project="${(board.projectName || '').toLowerCase()}" data-owner="${board.ownerId}" data-ownername="${(board.ownerName || '').toLowerCase()}" data-status="${board.status}" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; backdrop-filter: blur(12px); transition: transform 0.15s, border-color 0.15s;" onmouseover="this.style.borderColor='var(--forge-border-medium)'" onmouseout="this.style.borderColor='var(--forge-border)'">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 6px;">
                    ${icons.folder} ${board.projectName || 'Assigned Project'}
                  </span>
                  ${isManager ? `
                    <span style="font-size: 0.72rem; font-weight: 600; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 4px;">
                      ${icons.user} ${escapeHtml(board.ownerName)}
                    </span>
                  ` : ''}
                </div>
                <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 9999px; ${statusBadge.style}">
                  ${lockIcon} ${statusBadge.label}
                </span>
              </div>

              <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">
                <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${escapeHtml(board.title)}</a>
              </h3>

              <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.calendar} ${escapeHtml(board.cycle)}</span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.layers} Rev ${board.revisionNumber}</span>
                ${board.submissionDeadline ? `
                  <span style="display: inline-flex; align-items: center; gap: 4px; color: var(--forge-warning);">
                    ${icons.clock} Due ${escapeHtml(board.submissionDeadline)}
                  </span>
                ` : ''}
              </div>

              <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <button class="btn-action btn-outline" style="height: 30px; font-size: 0.775rem; padding: 0 10px;" onclick="openReviewDrawer('${board.id}')">
                  ${icons.messageSquare} Timeline
                </button>
                <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" class="btn-action btn-outline" style="height: 30px; font-size: 0.775rem; padding: 0 10px;">
                  Open Board ${icons.arrowRight}
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <script>
      (function() {
        let activeStatus = 'ALL';

        window.setBoardStatusFilter = function(status, btn) {
          activeStatus = status;
          document.querySelectorAll('#boardStatusPills button').forEach(b => {
            b.className = 'btn-action btn-outline';
          });
          if (btn) btn.className = 'btn-action btn-primary';
          window.filterMyBoards();
        };

        window.filterMyBoards = function() {
          const searchInput = document.getElementById('boardsSearchInput');
          const empSelect = document.getElementById('boardEmployeeSelect');
          const query = (searchInput ? searchInput.value || '' : '').toLowerCase();
          const selectedOwner = empSelect ? empSelect.value : 'ALL';
          const cards = document.querySelectorAll('.my-board-card');

          cards.forEach(card => {
            const title = card.dataset.title || '';
            const proj = card.dataset.project || '';
            const owner = card.dataset.owner || '';
            const ownerName = card.dataset.ownername || '';
            const status = card.dataset.status || '';

            const matchesQuery = !query || title.includes(query) || proj.includes(query) || ownerName.includes(query);
            const matchesStatus = activeStatus === 'ALL' || status === activeStatus;
            const matchesOwner = selectedOwner === 'ALL' || owner === selectedOwner;

            card.style.display = matchesQuery && matchesStatus && matchesOwner ? 'flex' : 'none';
          });
        };
      })();
    </script>
  `;
}
