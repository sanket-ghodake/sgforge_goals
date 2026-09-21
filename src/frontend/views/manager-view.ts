/**
 * Individual Goal Center - Reviews & Approvals Hub (Tab 3)
 * Provides dual-view navigation (My Submissions vs Team Reviews) and a right-sliding
 * WhatsApp-style review timeline pane for real-time critique, rework tracking, and signoff seals.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import { escapeHtml, getStatusBadge } from '../../lib/ui';
import type { AuthUser, GoalBoard, Project } from '../../lib/types';
import { renderTeamReviewsSection } from './team-reviews-list';

export function renderManagerView(user: AuthUser, boards: GoalBoard[], projects: Project[]): string {
  const isManagerOrAdmin = user.roles.includes('roles/manager') || user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin') || Boolean(user.isManagerInDirectory);
  const myBoards = boards.filter(b => b.ownerId === user.id);
  const hasNoManagerAbove = !user.hasManagerAbove && !user.managerId && !user.managerName;

  // Real team boards: only non-draft boards submitted for review or approval
  const teamBoards = isManagerOrAdmin ? boards.filter(b => {
    if (b.ownerId === user.id) return false;
    // Private drafts are strictly private to the author until submitted
    if (b.status === 'DRAFT') return false;
    if (user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin')) return true;
    if (b.managerId && b.managerId === user.id) return true;
    if (b.managerName && user.displayName && b.managerName.toLowerCase() === user.displayName.toLowerCase()) return true;
    if (b.ownerDepartment && user.department && b.ownerDepartment.toLowerCase() === user.department.toLowerCase()) return true;
    return false;
  }) : [];

  // Metric counts for My Submissions
  const mySubmittedCount = myBoards.filter(b => b.status === 'SUBMITTED').length;
  const myReworkCount = myBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const myApprovedCount = myBoards.filter(b => b.status === 'APPROVED').length;
  const myDraftCount = myBoards.filter(b => b.status === 'DRAFT').length;

  // Metric counts for Team Reviews
  const teamPendingCount = teamBoards.filter(b => b.status === 'SUBMITTED').length;
  const teamReworkCount = teamBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const teamApprovedCount = teamBoards.filter(b => b.status === 'APPROVED').length;

  return `
    <div style="margin-bottom: 32px;">
      <!-- Main Header & Dual-View Segmented Switcher -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">Reviews & Approvals Hub</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            Track your own board submission progress, or inspect and review team goal plans with real-time feedback timelines.
          </p>
        </div>

        <!-- Segmented Navigation Pill Switcher -->
        <div class="segmented-nav">
          <button class="segmented-nav-btn active" id="btnTabMyReviews" onclick="switchReviewsTab('my-reviews')">
            ${icons.user} My Submissions (${myBoards.length})
          </button>
          <button class="segmented-nav-btn" id="btnTabTeamReviews" onclick="switchReviewsTab('team-reviews')">
            ${icons.users} Team Reviews (${teamBoards.length})
            ${teamPendingCount > 0 ? `<span style="background: var(--forge-warning); color: #000; font-size: 0.68rem; padding: 1px 6px; border-radius: 9999px; font-weight: 700;">${teamPendingCount}</span>` : ''}
          </button>
        </div>
      </div>

      <!-- VIEW 1: MY SUBMISSIONS -->
      <div id="myReviewsContainer">
        ${hasNoManagerAbove ? `
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 14px; padding: 18px 22px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; backdrop-filter: blur(12px);">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.18); color: var(--forge-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${icons.infoCircle}
              </div>
              <div>
                <div style="font-size: 0.95rem; font-weight: 700; color: var(--forge-text-main); margin-bottom: 3px;">
                  Apex Leadership • No Upward Manager Assigned • No Submission Cycle
                </div>
                <div style="font-size: 0.8rem; color: var(--forge-text-muted); line-height: 1.4;">
                  You currently have no reporting manager mapped in the organization directory. As an apex leader, your goal plans do not enter a manager submission review cycle and remain self-governed.
                </div>
              </div>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 9999px; background: rgba(99, 102, 241, 0.14); color: var(--forge-primary); border: 1px solid rgba(99, 102, 241, 0.3);">
              Self-Governed
            </span>
          </div>
        ` : ''}

        <!-- Luxe HUD Metric Cards for My Submissions -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>UNDER REVIEW (LOCKED)</span>
              <span style="color: var(--forge-warning);">${icons.lock}</span>
            </div>
            <div class="luxe-metric-val" style="color: var(--forge-warning);">${mySubmittedCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">${hasNoManagerAbove ? 'Self-directed' : 'Awaiting manager review'}</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>REVISIONS NEEDED</span>
              <span style="color: var(--forge-error);">${icons.alertCircle}</span>
            </div>
            <div class="luxe-metric-val" style="color: ${myReworkCount > 0 ? 'var(--forge-error)' : 'var(--forge-text-main)'};">${myReworkCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Action required by you</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>APPROVED & SEALED</span>
              <span style="color: var(--forge-success);">${icons.award}</span>
            </div>
            <div class="luxe-metric-val" style="color: var(--forge-success);">${myApprovedCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Immutable goal plans</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>ACTIVE DRAFTS</span>
              <span style="color: var(--forge-primary);">${icons.target}</span>
            </div>
            <div class="luxe-metric-val">${myDraftCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">In-progress goal boards</div>
          </div>
        </div>

        <!-- My Boards List -->
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.15rem; font-weight: 700;">My Goal Boards & Review Statuses</h2>
          <span style="font-size: 0.8rem; color: var(--forge-text-muted);">${myBoards.length} total boards</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">
          ${myBoards.length === 0 ? `
            <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 16px;">
              <div style="color: var(--forge-primary); margin-bottom: 12px;">${icons.target}</div>
              <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">No Goal Boards Submitted Yet</h3>
              <p style="color: var(--forge-text-muted); font-size: 0.85rem; margin-bottom: 16px;">Create and submit your first project goal board to begin the review process.</p>
              <button class="btn-action btn-primary" onclick="openNewBoardModal()">${icons.plus} Create Goal Board</button>
            </div>
          ` : myBoards.map(b => {
            const statusBadge = getStatusBadge(b.status);
            return `
              <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; backdrop-filter: blur(12px); transition: border-color 0.2s ease, transform 0.2s ease;" onmouseover="this.style.borderColor='var(--forge-border-medium)'" onmouseout="this.style.borderColor='var(--forge-border)'">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 6px;">${icons.target} Milestone Blueprint</span>
                  <span style="font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 9999px; ${statusBadge.style}">
                    ${statusBadge.label}
                  </span>
                </div>

                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">
                  <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" style="color: var(--forge-text-main); text-decoration: none;">${escapeHtml(b.title)}</a>
                </h3>

                <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 18px; display: flex; gap: 14px;">
                  <span>${icons.layers} Rev ${Number(b.revisionNumber) || 1}</span>
                  <span>${icons.clock} ${new Date(b.updatedAt).toLocaleDateString()}</span>
                </div>

                <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                  <button class="btn-action btn-outline" style="font-size: 0.775rem;" onclick="openReviewDrawer('${escapeHtml(b.id)}')">
                    ${icons.messageSquare} Review Timeline
                  </button>
                  <a href="?tab=board&id=${encodeURIComponent(b.id)}" onclick="navigateSpa('board', '${escapeHtml(b.id)}', event)" class="btn-action btn-primary" style="font-size: 0.775rem;">
                    Canvas ${icons.arrowRight}
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- VIEW 2: TEAM REVIEWS -->
      <div id="teamReviewsContainer" style="display: none;">
        <!-- Luxe HUD Metric Cards for Team Reviews -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>PENDING MY REVIEW</span>
              <span style="color: var(--forge-warning);">${icons.lock}</span>
            </div>
            <div class="luxe-metric-val" style="color: var(--forge-warning);">${teamPendingCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Action required by manager</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>REVISIONS IN PROGRESS</span>
              <span style="color: var(--forge-accent);">${icons.alertCircle}</span>
            </div>
            <div class="luxe-metric-val">${teamReworkCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Unlocked for contributor edits</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>SEALED & APPROVED</span>
              <span style="color: var(--forge-success);">${icons.award}</span>
            </div>
            <div class="luxe-metric-val" style="color: var(--forge-success);">${teamApprovedCount}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Formally approved goal plans</div>
          </div>

          <div class="luxe-hud-card">
            <div class="luxe-metric-label">
              <span>TEAM BOARDS</span>
              <span style="color: var(--forge-primary);">${icons.users}</span>
            </div>
            <div class="luxe-metric-val">${teamBoards.length}</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Total direct report boards</div>
          </div>
        </div>

        ${renderTeamReviewsSection(user, teamBoards)}
      </div>
    </div>

    <script>
      window.switchReviewsTab = function(tab) {
        const myC = document.getElementById('myReviewsContainer');
        const teamC = document.getElementById('teamReviewsContainer');
        const btnMy = document.getElementById('btnTabMyReviews');
        const btnTeam = document.getElementById('btnTabTeamReviews');

        if (tab === 'team-reviews') {
          if (myC) myC.style.display = 'none';
          if (teamC) teamC.style.display = 'block';
          if (btnMy) btnMy.classList.remove('active');
          if (btnTeam) btnTeam.classList.add('active');
        } else {
          if (myC) myC.style.display = 'block';
          if (teamC) teamC.style.display = 'none';
          if (btnMy) btnMy.classList.add('active');
          if (btnTeam) btnTeam.classList.remove('active');
        }
      };
    </script>
  `;
}
