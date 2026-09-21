/**
 * Individual Goal Center - Executive Dashboard View (Tab 1)
 * Executive summary presenting milestone progress HUDs, velocity metrics, and cycle health.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { cleanDisplayName, escapeHtml } from '../../lib/ui';
import type { AuthUser, GoalBoard, Project } from '../../lib/types';

export function renderDashboardView(user: AuthUser, boards: GoalBoard[], projects: Project[]): string {
  const myBoards = boards.filter(b => b.ownerId === user.id);
  const totalMilestones = myBoards.reduce((acc, b) => acc + (b.items?.length || 0), 0);
  const submittedCount = myBoards.filter(b => b.status === 'SUBMITTED').length;
  const reworkCount = myBoards.filter(b => b.status === 'REWORK_REQUESTED').length;
  const approvedCount = myBoards.filter(b => b.status === 'APPROVED').length;

  // Calculate overall milestone progress velocity
  let completedMilestones = 0;
  let deliverableCount = 0;
  let metricCount = 0;
  let learningCount = 0;

  myBoards.forEach(b => {
    (b.items || []).forEach(item => {
      if (item.status === 'COMPLETED' || item.progressPercent >= 100) completedMilestones++;
      if (item.category === 'DELIVERABLE') deliverableCount++;
      else if (item.category === 'METRIC') metricCount++;
      else if (item.category === 'LEARNING') learningCount++;
    });
  });

  const completionPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const now = new Date();
  const activeCycle = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

  return `
    <div style="margin-bottom: 28px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">Executive Dashboard</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            Individual milestone velocity, cycle commitments, and overall alignment metrics.
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <a href="?tab=boards" onclick="navigateSpa('boards', null, event)" class="btn-action btn-primary">
            ${icons.layers} Manage Goal Boards ${icons.arrowRight}
          </a>
        </div>
      </div>

      <!-- Employee Identity & Organizational Alignment Spotlight Banner (2026 LTS Standards) -->
      <div class="profile-hero-card">
        <div class="profile-hero-left">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar">
              ${escapeHtml((cleanDisplayName(user.displayName) || user.email || 'E').charAt(0).toUpperCase())}
            </div>
            <div class="profile-avatar-badge" data-astryx-tooltip="Active Directory Sync"></div>
          </div>
          <div style="min-width: 0;">
            <div class="profile-hero-title-row">
              <span class="profile-user-name">${escapeHtml(cleanDisplayName(user.displayName))}</span>
              ${user.employeeCode ? `<span class="profile-emp-code">${escapeHtml(user.employeeCode)}</span>` : ''}
              <span class="profile-role-badge">
                ${icons.zap} ${escapeHtml(user.jobTitle || 'Team Member')}
              </span>
            </div>
            <div class="profile-meta-row">
              <span class="profile-meta-item">${icons.user} ${escapeHtml(user.email)}</span>
              <span style="color: var(--forge-border-medium);">&bull;</span>
              <span class="profile-meta-item">${icons.shieldCheck} ${escapeHtml(user.orgId || 'org_default')}</span>
              <span style="color: var(--forge-border-medium);">&bull;</span>
              <span class="magic-pulse-beacon" style="font-size: 0.72rem;">Directory Sync</span>
            </div>
          </div>
        </div>

        <div class="profile-pods-group">
          <div class="profile-hud-pod">
            <div class="profile-pod-icon indigo">
              ${icons.compass}
            </div>
            <div>
              <div class="profile-pod-label">ASSIGNED DEPARTMENT</div>
              <div class="profile-pod-val">${escapeHtml(user.department || 'Organization')}</div>
            </div>
          </div>

          <div class="profile-hud-pod">
            <div class="profile-pod-icon violet">
              ${icons.users}
            </div>
            <div>
              <div class="profile-pod-label">REPORTING MANAGER</div>
              <div class="profile-pod-val" style="color: ${user.managerName ? 'var(--forge-text-main)' : 'var(--forge-text-muted)'};">
                ${escapeHtml(cleanDisplayName(user.managerName) || 'Direct Admin Oversight')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Luxe HUD Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <div class="luxe-hud-card">
          <div class="luxe-metric-label">
            <span>ACTIVE BOARDS</span>
            <span style="color: var(--forge-primary);">${icons.target}</span>
          </div>
          <div class="luxe-metric-val">${myBoards.length}</div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted);">${totalMilestones} committed milestones</div>
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

      <!-- Cycle Velocity & Progress Card -->
      <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 14px; padding: 24px; margin-bottom: 28px; backdrop-filter: blur(12px);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--forge-primary);">${icons.activity}</span> ${escapeHtml(activeCycle)} Milestone Velocity
            </h2>
            <p style="font-size: 0.8rem; color: var(--forge-text-muted);">
              Overall progress across ${totalMilestones} milestones across all assigned goal plans.
            </p>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--forge-primary);">
            ${completionPercent}%
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="width: 100%; height: 10px; background: rgba(255, 255, 255, 0.06); border-radius: 9999px; overflow: hidden; margin-bottom: 20px;">
          <div style="height: 100%; width: ${completionPercent}%; background: linear-gradient(90deg, var(--forge-primary), var(--forge-accent)); transition: width 0.3s ease;"></div>
        </div>

        <!-- Category Breakdown Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px;">
            <div style="font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 4px;">DELIVERABLES</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--forge-text-main);">${deliverableCount} items</div>
          </div>
          <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px;">
            <div style="font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 4px;">KEY METRICS</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--forge-text-main);">${metricCount} items</div>
          </div>
          <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px;">
            <div style="font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 4px;">LEARNING GOALS</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--forge-text-main);">${learningCount} items</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
