/**
 * Individual Goal Center - My Cockpit View (Tab 1)
 * Executive dashboard presenting milestone progress HUDs, project boards, and status chips.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import type { AuthUser, GoalBoard, Project } from '../../lib/types';

export function renderCockpitView(user: AuthUser, boards: GoalBoard[], projects: Project[]): string {
  const myBoards = boards.filter(b => b.ownerId === user.id);
  const totalGoals = myBoards.reduce((acc, b) => acc + (b.items?.length || 0), 0);
  const submittedCount = myBoards.filter(b => b.status === 'SUBMITTED').length;
  const reworkCount = myBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const approvedCount = myBoards.filter(b => b.status === 'APPROVED').length;

  return `
    <div style="margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">My Goals Cockpit</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            Individual milestone velocity, locked review stages, and project commitments.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="magic-pulse-beacon">
            Cycle 2026-Q1 Active
          </span>
        </div>
      </div>

      <!-- Luxe Developer HUD Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>ACTIVE BOARDS</span>
            <span style="color: var(--forge-primary);">${icons.target}</span>
          </div>
          <div class="luxe-metric-val">${myBoards.length}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">${totalGoals} committed milestones</div>
        </div>

        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>UNDER REVIEW (LOCKED)</span>
            <span style="color: var(--forge-warning);">${icons.lock}</span>
          </div>
          <div class="luxe-metric-val" style="color: var(--forge-warning);">${submittedCount}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Awaiting manager approval</div>
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
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Immutable snapshots</div>
        </div>
      </div>

      <!-- Project Boards Grid -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h2 style="font-size: 1.15rem; font-weight: 700; letter-spacing: -0.01em;">My Project Goal Boards</h2>
        <button class="btn-action btn-outline" onclick="openNewBoardModal()">${icons.plus} Create Board</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">
        ${myBoards.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 12px;">
            <div style="color: var(--forge-primary); margin-bottom: 12px; display: inline-flex;">${icons.target}</div>
            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">No Goal Boards Yet</h3>
            <p style="color: var(--forge-text-muted); font-size: 0.85rem; margin-bottom: 16px;">Create your first project milestone board for the active 2026-Q1 cycle.</p>
            <button class="btn-action btn-primary" onclick="openNewBoardModal()">${icons.plus} Create First Board</button>
          </div>
        ` : myBoards.map(board => {
          const statusBadge = getStatusBadge(board.status);
          const lockIcon = board.status === 'SUBMITTED' ? icons.lock : board.status === 'APPROVED' ? icons.award : icons.unlock;
          return `
            <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; backdrop-filter: blur(12px); transition: transform 0.15s, border-color 0.15s;" onmouseover="this.style.borderColor='var(--forge-border-medium)'" onmouseout="this.style.borderColor='var(--forge-border)'">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 6px;">
                  ${icons.folder} ${board.projectName || 'Assigned Project'}
                </span>
                <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 9999px; ${statusBadge.style}">
                  ${lockIcon} ${statusBadge.label}
                </span>
              </div>

              <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">
                <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${board.title}</a>
              </h3>

              <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 16px; display: flex; gap: 12px;">
                <span>${icons.calendar} ${board.cycle}</span>
                <span>${icons.layers} Rev ${board.revisionNumber}</span>
              </div>

              <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: var(--forge-text-subtle);">Updated ${new Date(board.updatedAt).toLocaleDateString()}</span>
                <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" class="btn-action btn-outline" style="height: 30px; font-size: 0.8rem;">
                  Open Board ${icons.arrowRight}
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getStatusBadge(status: string): { label: string; style: string } {
  switch (status) {
    case 'SUBMITTED':
      return {
        label: 'Under Review (Locked)',
        style: 'background: var(--forge-warning-bg); color: var(--forge-warning); border: 1px solid rgba(251, 191, 36, 0.3);',
      };
    case 'REWORK_REQUESTED':
      return {
        label: 'Revisions Requested',
        style: 'background: var(--forge-error-bg); color: var(--forge-error); border: 1px solid rgba(248, 113, 113, 0.3);',
      };
    case 'APPROVED':
      return {
        label: 'Approved & Sealed',
        style: 'background: var(--forge-success-bg); color: var(--forge-success); border: 1px solid rgba(52, 211, 153, 0.3);',
      };
    default:
      return {
        label: 'Draft (Editable)',
        style: 'background: rgba(255, 255, 255, 0.05); color: var(--forge-text-muted); border: 1px solid var(--forge-border);',
      };
  }
}
