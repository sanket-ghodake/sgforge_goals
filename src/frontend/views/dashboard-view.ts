/**
 * Individual Goal Center - Executive Dashboard View (Tab 1)
 * Executive summary presenting milestone progress HUDs, velocity metrics, and cycle health.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
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

  return `
    <div style="margin-bottom: 28px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">Executive Dashboard</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
            Individual milestone velocity, cycle commitments, and overall alignment metrics.
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span class="magic-pulse-beacon">
            Cycle 2026-Q1 Active
          </span>
          <a href="?tab=boards" onclick="navigateSpa('boards', null, event)" class="btn-action btn-primary">
            ${icons.layers} Manage Goal Boards ${icons.arrowRight}
          </a>
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
              <span style="color: var(--forge-primary);">${icons.activity}</span> 2026-Q1 Milestone Velocity
            </h2>
            <p style="font-size: 0.8rem; color: var(--forge-text-muted);">
              Overall progress across ${totalMilestones} milestones across all assigned flight plans.
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

      <!-- Quick Shortcuts & Recent Overview -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="font-size: 1.05rem; font-weight: 700;">Active Board Highlights</h3>
        <a href="?tab=boards" onclick="navigateSpa('boards', null, event)" style="font-size: 0.8rem; color: var(--forge-primary); text-decoration: none; font-weight: 600;">
          View All Boards (${myBoards.length}) ${icons.arrowRight}
        </a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${myBoards.slice(0, 3).map(board => `
          <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary);">${board.projectName || 'Project'}</span>
              <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.06); color: var(--forge-text-muted); font-weight: 600;">
                ${board.cycle}
              </span>
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">
              <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${board.title}</a>
            </h4>
            <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-top: auto; padding-top: 12px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between;">
              <span>Status: <strong style="color: var(--forge-text-main);">${board.status}</strong></span>
              <a href="?tab=board&id=${board.id}" onclick="navigateSpa('board', '${board.id}', event)" style="color: var(--forge-primary); text-decoration: none; font-weight: 600;">Open ${icons.arrowRight}</a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
