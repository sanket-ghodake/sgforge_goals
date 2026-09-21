/**
 * Individual Goal Center - Team Reviews Employee List & Sublist Views
 * Enterprise 2026 LTS Component: Fuses shadcn UI, Magic UI, Aceternity, and Luxe.
 * Groups team goal boards by employee in dense List and Cards sublist views with Organization Directory API verification.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import { escapeHtml, getStatusBadge } from '../../lib/ui';
import type { AuthUser, GoalBoard } from '../../lib/types';

export interface EmployeeGroup {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerDepartment: string;
  boards: GoalBoard[];
  pendingCount: number;
  reworkCount: number;
  approvedCount: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'EM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function groupBoardsByEmployee(boards: GoalBoard[]): EmployeeGroup[] {
  const map = new Map<string, EmployeeGroup>();
  for (const b of boards) {
    const key = b.ownerId || b.ownerName || 'unassigned';
    if (!map.has(key)) {
      map.set(key, {
        ownerId: b.ownerId,
        ownerName: b.ownerName || 'Direct Report',
        ownerEmail: b.ownerEmail || '',
        ownerDepartment: b.ownerDepartment || 'Engineering',
        boards: [],
        pendingCount: 0,
        reworkCount: 0,
        approvedCount: 0,
      });
    }
    const group = map.get(key)!;
    group.boards.push(b);
    if (b.status === 'SUBMITTED' || b.status === 'UNLOCK_REQUESTED' || b.status === 'LOCKED_OVERDUE') {
      group.pendingCount++;
    } else if (b.status === 'REWORK_REQUESTED') {
      group.reworkCount++;
    } else if (b.status === 'APPROVED') {
      group.approvedCount++;
    }
  }
  return Array.from(map.values());
}

function renderEmptyReviewsCard(iconSvg: string, badgeText: string, titleText: string, descText: string, subtext?: string): string {
  return `
    <div style="padding: 48px 24px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 16px; margin-top: 8px;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(99, 102, 241, 0.12); color: var(--forge-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.25);">
        ${iconSvg}
      </div>
      <div style="display: inline-block; padding: 3px 12px; border-radius: 9999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--forge-primary); font-size: 0.72rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
        ${badgeText}
      </div>
      <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; color: var(--forge-text-main);">${titleText}</h3>
      <p style="color: var(--forge-text-muted); font-size: 0.875rem; max-width: 540px; margin: 0 auto ${subtext ? '10px' : '20px'} auto; line-height: 1.6;">
        ${descText}
      </p>
      ${subtext ? `<p style="color: var(--forge-text-muted); font-size: 0.8rem; max-width: 500px; margin: 0 auto 20px auto; line-height: 1.5; opacity: 0.85;">${subtext}</p>` : ''}
      <button class="btn-action btn-outline" onclick="switchReviewsTab('my-reviews')">
        ${icons.user} Switch to My Submissions
      </button>
    </div>
  `;
}

function renderNoTeamUnderView(): string {
  return renderEmptyReviewsCard(
    icons.users,
    'Directory Verified',
    'No Team Under You',
    'The organization directory confirms that you currently have zero direct reports or subordinate team members assigned under your hierarchy. When employees report to you and submit goal plans, they will appear here.'
  );
}

function renderNoSubordinateManagersEmptyView(): string {
  return renderEmptyReviewsCard(
    icons.shieldCheck,
    'Frontline Leadership • Directory Verified',
    'No Team of Managers Under You',
    'Your direct reports in the organization directory are individual contributors. None of your direct reports hold people management roles, and no team goal plans have been submitted for review yet.',
    'When your team members submit their goal boards for review, they will appear here for evaluation and signoff.'
  );
}

function renderNoTeamBoardsEmptyView(): string {
  return renderEmptyReviewsCard(
    icons.folder,
    'Multi-Tier Leadership',
    'No Team Goal Plans Submitted',
    'Your team in the organization directory has not submitted any goal boards for your review yet. When team members publish goal plans, they will appear here.'
  );
}

function renderNoSubordinateManagersBanner(): string {
  return `
    <div style="background: rgba(99, 102, 241, 0.07); border: 1px solid rgba(99, 102, 241, 0.22); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.15); color: var(--forge-primary); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${icons.shieldCheck}
        </span>
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--forge-text-main);">No Team of Managers Under You</div>
          <div style="font-size: 0.775rem; color: var(--forge-text-muted); line-height: 1.4;">
            Your direct reports in the organization directory are individual contributors. None of your direct reports hold people management roles. Direct team reviews are shown below.
          </div>
        </div>
      </div>
      <span style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; background: rgba(99, 102, 241, 0.12); color: var(--forge-primary); border: 1px solid rgba(99, 102, 241, 0.25);">
        Frontline Leadership
      </span>
    </div>
  `;
}

function getStatusIndicatorColor(status: string): string {
  if (status === 'APPROVED') return 'var(--forge-success, #10b981)';
  if (status === 'REWORK_REQUESTED') return 'var(--forge-error, #ef4444)';
  if (status === 'SUBMITTED' || status === 'UNLOCK_REQUESTED' || status === 'LOCKED_OVERDUE') return 'var(--forge-warning, #f59e0b)';
  return 'var(--forge-primary, #6366f1)';
}

function renderSublistRowCard(b: GoalBoard): string {
  const statusBadge = getStatusBadge(b.status);
  const indicatorColor = getStatusIndicatorColor(b.status);
  const isActionable = b.status === 'SUBMITTED' || b.status === 'UNLOCK_REQUESTED' || b.status === 'LOCKED_OVERDUE' || b.status === 'REWORK_REQUESTED';
  const isApproved = b.status === 'APPROVED';

  return `
    <div class="team-board-row-card" data-status="${escapeHtml(b.status)}" data-title="${escapeHtml(b.title.toLowerCase())}" style="--status-accent: ${indicatorColor};">
      <div class="board-card-body">
        <div class="board-card-title-line">
          <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" class="board-card-title">
            ${escapeHtml(b.title)}
          </a>
          <span class="board-card-status-pill" style="${statusBadge.style}">
            ${statusBadge.label}
          </span>
        </div>
        <div class="board-card-meta-line">
          <span class="board-chip">${icons.target} Milestone Blueprint</span>
          <span class="board-chip hide-mobile">Rev ${Number(b.revisionNumber) || 1}</span>
          <span class="board-chip hide-mobile">${icons.clock} ${new Date(b.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="board-card-actions">
        <button class="btn-action btn-primary card-action-btn" onclick="openReviewDrawer('${escapeHtml(b.id)}')">
          ${icons.messageSquare} Timeline
        </button>
        ${isActionable ? `
          <button class="btn-action btn-outline card-action-btn rework-btn" data-board-id="${escapeHtml(b.id)}" onclick="openReworkModal(this.dataset.boardId)">
            ${icons.alertCircle} Rework
          </button>
          <button class="btn-action btn-outline card-action-btn approve-btn" onclick="handleApproveBoard('${escapeHtml(b.id)}')">
            ${icons.award} Approve
          </button>
        ` : isApproved ? `
          <button class="btn-action btn-outline card-action-btn rework-btn" data-board-id="${escapeHtml(b.id)}" onclick="openReworkModal(this.dataset.boardId)">
            ${icons.alertCircle} Move to Rework
          </button>
        ` : ''}
        <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" class="btn-action btn-outline card-action-btn">
          Canvas ${icons.arrowRight}
        </a>
      </div>
    </div>
  `;
}

function renderSublistCard(b: GoalBoard): string {
  const statusBadge = getStatusBadge(b.status);
  const isActionable = b.status === 'SUBMITTED' || b.status === 'UNLOCK_REQUESTED' || b.status === 'LOCKED_OVERDUE' || b.status === 'REWORK_REQUESTED';
  const isApproved = b.status === 'APPROVED';

  return `
    <div class="team-board-card" data-status="${escapeHtml(b.status)}" data-title="${escapeHtml(b.title.toLowerCase())}" style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary);">${icons.target} Blueprint</span>
        <span style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 9999px; ${statusBadge.style}">
          ${statusBadge.label}
        </span>
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0; line-height: 1.3;">
        <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" style="color: var(--forge-text-main); text-decoration: none;">${escapeHtml(b.title)}</a>
      </h4>

      <div style="font-size: 0.75rem; color: var(--forge-text-muted); display: flex; gap: 10px;">
        <span>Rev ${Number(b.revisionNumber) || 1}</span>
        <span>${icons.clock} ${new Date(b.updatedAt).toLocaleDateString()}</span>
      </div>

      <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--forge-border); display: flex; gap: 6px; flex-wrap: wrap;">
        <button class="btn-action btn-primary" style="height: 28px; font-size: 0.72rem; flex: 1; min-width: 100px;" onclick="openReviewDrawer('${escapeHtml(b.id)}')">
          ${icons.messageSquare} Timeline
        </button>
        ${isActionable ? `
          <button class="btn-action btn-outline" style="height: 28px; font-size: 0.72rem; color: var(--forge-warning);" data-board-id="${escapeHtml(b.id)}" onclick="openReworkModal(this.dataset.boardId)">
            ${icons.alertCircle} Rework
          </button>
          <button class="btn-action btn-outline" style="height: 28px; font-size: 0.72rem; color: var(--forge-success);" onclick="handleApproveBoard('${escapeHtml(b.id)}')">
            ${icons.award} Approve
          </button>
        ` : isApproved ? `
          <button class="btn-action btn-outline" style="height: 28px; font-size: 0.72rem; color: var(--forge-warning);" data-board-id="${escapeHtml(b.id)}" onclick="openReworkModal(this.dataset.boardId)">
            ${icons.alertCircle} Move to Rework
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEmployeeAccordion(group: EmployeeGroup, index: number): string {
  const initials = getInitials(group.ownerName);
  const safeOwnerId = escapeHtml(group.ownerId || `emp_${index}`);

  return `
    <div class="team-employee-card" id="empGroup_${safeOwnerId}" data-owner-id="${safeOwnerId}" data-owner-name="${escapeHtml(group.ownerName.toLowerCase())}" data-department="${escapeHtml(group.ownerDepartment.toLowerCase())}" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 16px; margin-bottom: 16px; overflow: hidden; backdrop-filter: blur(12px); transition: border-color 0.2s ease;">
      <!-- Employee Header Row -->
      <div class="team-employee-header" onclick="toggleEmployeeAccordion('${safeOwnerId}')" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; background: rgba(255, 255, 255, 0.015); border-bottom: 1px solid var(--forge-border); gap: 14px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25)); border: 1px solid rgba(139, 92, 246, 0.35); display: flex; align-items: center; justify-content: center; color: #c4b5fd; font-weight: 800; font-size: 1rem; flex-shrink: 0;">
            ${initials}
          </div>
          <div style="min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--forge-text-main); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>${escapeHtml(group.ownerName)}</span>
              <span style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.1); color: var(--forge-primary); border: 1px solid rgba(99, 102, 241, 0.25);">
                ${escapeHtml(group.ownerDepartment)}
              </span>
            </div>
            ${group.ownerEmail ? `<div style="font-size: 0.75rem; color: var(--forge-text-muted);">${escapeHtml(group.ownerEmail)}</div>` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span class="emp-total-badge" style="font-size: 0.75rem; font-weight: 600; padding: 3px 9px; border-radius: 9999px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--forge-border); color: var(--forge-text-muted);">
            ${group.boards.length} ${group.boards.length === 1 ? 'Goal Plan' : 'Goal Plans'}
          </span>
          ${group.pendingCount > 0 ? `
            <span style="font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: rgba(245, 158, 11, 0.12); color: var(--forge-warning); border: 1px solid rgba(245, 158, 11, 0.3);">
              ${icons.lock} ${group.pendingCount} Needs Review
            </span>
          ` : ''}
          ${group.reworkCount > 0 ? `
            <span style="font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: rgba(239, 68, 68, 0.12); color: var(--forge-error); border: 1px solid rgba(239, 68, 68, 0.3);">
              ${icons.alertCircle} ${group.reworkCount} In Revision
            </span>
          ` : ''}
          ${group.approvedCount > 0 ? `
            <span style="font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: rgba(16, 185, 129, 0.12); color: var(--forge-success); border: 1px solid rgba(16, 185, 129, 0.3);">
              ${icons.award} ${group.approvedCount} Approved
            </span>
          ` : ''}
          <span id="chevron_${safeOwnerId}" style="color: var(--forge-text-muted); display: inline-flex; transition: transform 0.2s ease;">
            ${icons.chevronDown}
          </span>
        </div>
      </div>

      <!-- Sublist Container (Expanded by default) -->
      <div class="team-employee-sublist" id="sublist_${safeOwnerId}" style="display: block;">
        <!-- Mode 1: Dense List View (Responsive Row Cards) -->
        <div class="team-sublist-table-view team-sublist-cards-list" style="display: flex;">
          ${group.boards.map(b => renderSublistRowCard(b)).join('')}
        </div>

        <!-- Mode 2: Cards Grid View -->
        <div class="team-sublist-cards-view" style="display: none; padding: 14px 16px 16px 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
          ${group.boards.map(b => renderSublistCard(b)).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderTeamReviewsSection(user: AuthUser, teamBoards: GoalBoard[]): string {
  const reportsCount = Number(user.directReportsCount ?? 0);
  const subMgrsCount = Number(user.subordinateManagersCount ?? 0);

  if (teamBoards.length === 0) {
    if (reportsCount === 0 || !user.isManagerInDirectory) {
      return renderNoTeamUnderView();
    }
    if (subMgrsCount === 0) {
      return renderNoSubordinateManagersEmptyView();
    }
    return renderNoTeamBoardsEmptyView();
  }

  const employeeGroups = groupBoardsByEmployee(teamBoards);
  const isNoSubordinateManagers = subMgrsCount === 0;

  const teamPendingCount = teamBoards.filter(b => b.status === 'SUBMITTED' || b.status === 'UNLOCK_REQUESTED' || b.status === 'LOCKED_OVERDUE').length;
  const teamReworkCount = teamBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const teamApprovedCount = teamBoards.filter(b => b.status === 'APPROVED').length;

  return `
    <style>
      .team-sublist-cards-list { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 16px 16px; }
      .team-board-row-card {
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        padding: 12px 16px; background: var(--forge-bg-surface);
        border: 1px solid var(--forge-border); border-left: 3.5px solid var(--status-accent);
        border-radius: 12px; transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
      }
      .team-board-row-card:hover {
        background: rgba(255, 255, 255, 0.02); border-color: rgba(99, 102, 241, 0.35);
        transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
      .board-card-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
      .board-card-title-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .board-card-title { font-size: 0.92rem; font-weight: 700; color: var(--forge-text-main); text-decoration: none; transition: color 0.15s ease; }
      .board-card-title:hover { color: var(--forge-primary); }
      .board-card-status-pill { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.03em; }
      .board-card-meta-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .board-chip {
        font-size: 0.72rem; color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 6px; border-radius: 5px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--forge-border);
      }
      .board-card-actions { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
      .card-action-btn { height: 30px; font-size: 0.74rem; padding: 0 10px; }
      .rework-btn { color: var(--forge-warning) !important; border-color: rgba(245, 158, 11, 0.3) !important; }
      .rework-btn:hover { background: rgba(245, 158, 11, 0.1) !important; }
      .approve-btn { color: var(--forge-success) !important; border-color: rgba(16, 185, 129, 0.3) !important; }
      .approve-btn:hover { background: rgba(16, 185, 129, 0.1) !important; }
      @media (max-width: 960px) {
        .team-board-row-card { flex-direction: column; align-items: stretch; gap: 12px; }
        .board-card-actions { justify-content: flex-start; border-top: 1px solid var(--forge-border); padding-top: 8px; }
      }
      @media (max-width: 640px) {
        .hide-mobile { display: none !important; }
        .board-card-actions { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
        .board-card-actions .btn-action { justify-content: center; }
      }
    </style>

    ${isNoSubordinateManagers ? renderNoSubordinateManagersBanner() : ''}

    <!-- Toolbar: Search, Filters & View Mode Toggles -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 260px; max-width: 440px; position: relative;">
        <span style="position: absolute; left: 12px; color: var(--forge-text-muted); display: flex;">${icons.search}</span>
        <input id="teamReviewsSearch" type="text" oninput="filterTeamReviews()" placeholder="Search contributor, board, or project..." style="width: 100%; height: 38px; border-radius: 10px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px 0 36px; font-size: 0.85rem;" />
      </div>

      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- Status Filters -->
        <div style="display: flex; gap: 6px; background: var(--forge-bg-surface); padding: 3px; border-radius: 10px; border: 1px solid var(--forge-border);" id="teamFilterGroup">
          <button class="btn-action btn-outline active-filter" id="filterBtnAll" style="height: 30px; font-size: 0.75rem; padding: 0 10px;" onclick="setTeamStatusFilter('ALL', this)">All (${teamBoards.length})</button>
          <button class="btn-action btn-outline" id="filterBtnPending" style="height: 30px; font-size: 0.75rem; padding: 0 10px;" onclick="setTeamStatusFilter('SUBMITTED', this)">Needs Review (${teamPendingCount})</button>
          <button class="btn-action btn-outline" id="filterBtnRework" style="height: 30px; font-size: 0.75rem; padding: 0 10px;" onclick="setTeamStatusFilter('REWORK_REQUESTED', this)">In Revision (${teamReworkCount})</button>
          <button class="btn-action btn-outline" id="filterBtnApproved" style="height: 30px; font-size: 0.75rem; padding: 0 10px;" onclick="setTeamStatusFilter('APPROVED', this)">Approved (${teamApprovedCount})</button>
        </div>

        <!-- View Switcher -->
        <div style="display: inline-flex; gap: 2px; background: var(--forge-bg-surface); padding: 3px; border-radius: 10px; border: 1px solid var(--forge-border);">
          <button class="btn-action btn-outline active-view" id="btnTeamListView" data-astryx-tooltip="List View" style="height: 30px; padding: 0 10px; font-size: 0.75rem;" onclick="switchTeamViewMode('list')">
            ${icons.layers} List
          </button>
          <button class="btn-action btn-outline" id="btnTeamCardsView" data-astryx-tooltip="Cards View" style="height: 30px; padding: 0 10px; font-size: 0.75rem;" onclick="switchTeamViewMode('cards')">
            ${icons.target} Cards
          </button>
        </div>

        <!-- Expand / Collapse Master -->
        <button class="btn-action btn-outline" id="btnTeamToggleAll" style="height: 32px; font-size: 0.75rem; padding: 0 10px;" onclick="toggleAllEmployeeAccordions()">
          ${icons.sliders} Toggle All
        </button>
      </div>
    </div>

    <!-- Employee List & Nested Sublists -->
    <div id="teamEmployeesListContainer">
      ${employeeGroups.map((g, idx) => renderEmployeeAccordion(g, idx)).join('')}
    </div>

    <script>
      (function() {
        let currentStatusFilter = 'ALL';
        let currentViewMode = 'list';
        let areAllExpanded = true;

        window.toggleEmployeeAccordion = function(ownerId) {
          const sublist = document.getElementById('sublist_' + ownerId);
          const chevron = document.getElementById('chevron_' + ownerId);
          if (!sublist) return;
          const isClosed = sublist.style.display === 'none';
          sublist.style.display = isClosed ? 'block' : 'none';
          if (chevron) {
            chevron.style.transform = isClosed ? 'rotate(0deg)' : 'rotate(-90deg)';
          }
        };

        window.toggleAllEmployeeAccordions = function() {
          areAllExpanded = !areAllExpanded;
          document.querySelectorAll('.team-employee-sublist').forEach(el => {
            el.style.display = areAllExpanded ? 'block' : 'none';
          });
          document.querySelectorAll('[id^="chevron_"]').forEach(ch => {
            ch.style.transform = areAllExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
          });
        };

        window.switchTeamViewMode = function(mode) {
          currentViewMode = mode;
          const btnList = document.getElementById('btnTeamListView');
          const btnCards = document.getElementById('btnTeamCardsView');
          if (btnList && btnCards) {
            if (mode === 'list') {
              btnList.classList.add('active-view');
              btnCards.classList.remove('active-view');
            } else {
              btnList.classList.remove('active-view');
              btnCards.classList.add('active-view');
            }
          }
          document.querySelectorAll('.team-sublist-table-view').forEach(v => {
            v.style.display = mode === 'list' ? 'flex' : 'none';
          });
          document.querySelectorAll('.team-sublist-cards-view').forEach(v => {
            v.style.display = mode === 'cards' ? 'grid' : 'none';
          });
        };

        window.setTeamStatusFilter = function(status, btnElement) {
          currentStatusFilter = status;
          if (btnElement) {
            document.querySelectorAll('#teamFilterGroup button').forEach(b => b.classList.remove('active-filter'));
            btnElement.classList.add('active-filter');
          }
          window.filterTeamReviews();
        };

        window.filterTeamReviews = function() {
          const searchInput = document.getElementById('teamReviewsSearch');
          const query = (searchInput ? searchInput.value || '' : '').toLowerCase().trim();

          const employeeCards = document.querySelectorAll('.team-employee-card');
          employeeCards.forEach(empCard => {
            const empName = empCard.dataset.ownerName || '';
            const empDept = empCard.dataset.department || '';
            let visibleReviewCount = 0;

            const rowCards = empCard.querySelectorAll('.team-board-row-card');
            const gridCards = empCard.querySelectorAll('.team-board-card');

            rowCards.forEach(r => {
              const rStatus = r.dataset.status || '';
              const rTitle = r.dataset.title || '';
              const statusMatch = currentStatusFilter === 'ALL' || 
                (currentStatusFilter === 'SUBMITTED' && (rStatus === 'SUBMITTED' || rStatus === 'UNLOCK_REQUESTED' || rStatus === 'LOCKED_OVERDUE')) ||
                rStatus === currentStatusFilter;
              const textMatch = !query || empName.includes(query) || empDept.includes(query) || rTitle.includes(query);
              const show = statusMatch && textMatch;
              r.style.display = show ? 'flex' : 'none';
              if (show) visibleReviewCount++;
            });

            gridCards.forEach(c => {
              const cStatus = c.dataset.status || '';
              const cTitle = c.dataset.title || '';
              const statusMatch = currentStatusFilter === 'ALL' || 
                (currentStatusFilter === 'SUBMITTED' && (cStatus === 'SUBMITTED' || cStatus === 'UNLOCK_REQUESTED' || cStatus === 'LOCKED_OVERDUE')) ||
                cStatus === currentStatusFilter;
              const textMatch = !query || empName.includes(query) || empDept.includes(query) || cTitle.includes(query);
              c.style.display = statusMatch && textMatch ? 'flex' : 'none';
            });

            empCard.style.display = visibleReviewCount > 0 ? 'block' : 'none';
          });
        };
      })();
    </script>
  `;
}
