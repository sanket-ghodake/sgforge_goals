/**
 * Individual Goal Center - Board Tri-Deck Item Components (2026 LTS)
 * Modular item card renderers for Skills, Gaps, Training Plans, and Lock Banners.
 * Fused with 3-Priority Badges (Critical, Medium, Low) and Zero-Emojis Standard.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { escapeHtml } from '../../lib/ui';
import type { GoalBoard, GoalItem, PriorityLevel } from '../../lib/types';

/**
 * getPriorityBadgeClass
 */
export function getPriorityBadgeClass(priority: PriorityLevel | string): string {
  if (priority === 'CRITICAL') return 'badge-critical';
  if (priority === 'LOW') return 'badge-low';
  return 'badge-medium';
}

/**
 * renderSkillRow
 */
export function renderSkillRow(boardId: string, item: GoalItem, canEdit: boolean): string {
  const badgeClass = getPriorityBadgeClass(item.priority || 'MEDIUM');
  return `
    <div class="tri-item-row" data-item-id="${item.id}">
      <div class="tri-item-left">
        <span class="tri-badge ${badgeClass} ${canEdit ? 'clickable' : ''}" ${canEdit ? `onclick="cycleItemPriority('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to change priority (Critical, Medium, Low)"` : ''}>${escapeHtml(item.priority || 'MEDIUM')}</span>
        <span class="tri-item-title ${canEdit ? 'editable' : ''}" ${canEdit ? `onclick="startItemTitleEdit('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to modify text"` : ''}>${escapeHtml(item.title)}</span>
      </div>
      ${canEdit ? `
        <button type="button" class="btn-icon btn-item-cancel" onclick="handleDeleteItem('${boardId}', '${item.id}')" data-astryx-tooltip="Remove skill" style="width:22px; height:22px; color: var(--forge-text-muted); flex-shrink: 0;">
          ${icons.close}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * renderGapRow
 */
export function renderGapRow(boardId: string, item: GoalItem, canEdit: boolean): string {
  const badgeClass = getPriorityBadgeClass(item.priority || 'LOW');
  const count = item.plansCount || 0;
  const isUnlinked = count === 0;

  return `
    <div class="tri-item-row ${isUnlinked ? 'tri-gap-unlinked' : ''}" data-item-id="${item.id}">
      <div class="tri-item-left">
        <span class="tri-badge ${badgeClass} ${canEdit ? 'clickable' : ''}" ${canEdit ? `onclick="cycleItemPriority('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to change priority (Critical, Medium, Low)"` : ''}>${escapeHtml(item.priority || 'LOW')}</span>
        <span class="tri-item-title ${canEdit ? 'editable' : ''}" ${canEdit ? `onclick="startItemTitleEdit('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to modify text"` : ''}>${escapeHtml(item.title)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
        <button type="button" class="gap-plans-count-badge ${isUnlinked ? 'unlinked' : 'linked'}" 
          ${canEdit ? `onclick="window.openLinkGapPlanModal && window.openLinkGapPlanModal('${boardId}', '${item.id}', 'GAP', this)"` : ''}
          data-astryx-tooltip="${isUnlinked ? '0 Plans Linked • Click to link an action plan' : `${count} plan(s) linked • Click to manage`}">
          <span style="display: flex;">${icons.link}</span>
          <span>${count} ${count === 1 ? 'plan' : 'plans'}</span>
        </button>
        ${canEdit ? `
          <button type="button" class="btn-icon btn-item-cancel" onclick="handleDeleteItem('${boardId}', '${item.id}')" data-astryx-tooltip="Remove gap" style="width:22px; height:22px; color: var(--forge-text-muted); flex-shrink: 0;">
            ${icons.close}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * renderPlanCard
 */
export function renderPlanCard(boardId: string, item: GoalItem, canEdit: boolean): string {
  const isDone = item.status === 'COMPLETED';
  const badgeClass = getPriorityBadgeClass(item.priority || 'MEDIUM');
  const linkedGaps = item.linkedGaps || [];

  return `
    <div class="tri-plan-card ${isDone ? 'completed' : ''}" data-item-id="${item.id}">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <button type="button" onclick="togglePlan('${boardId}', '${item.id}')" style="background: none; border: none; cursor: pointer; color: ${isDone ? 'var(--forge-success)' : 'var(--forge-text-muted)'}; display: flex; align-items: center; padding: 0; flex-shrink: 0;" data-astryx-tooltip="${isDone ? 'Mark Incomplete' : 'Mark Completed'}">
            ${isDone ? icons.checkCircle2 : icons.circleDot}
          </button>
          <span class="tri-badge ${badgeClass} ${canEdit ? 'clickable' : ''}" ${canEdit ? `onclick="cycleItemPriority('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to change priority (Critical, Medium, Low)"` : ''}>${escapeHtml(item.priority || 'MEDIUM')}</span>
          <span class="tri-item-title ${canEdit ? 'editable' : ''}" ${canEdit ? `onclick="startItemTitleEdit('${boardId}', '${item.id}', this)" data-astryx-tooltip="Click to modify text"` : ''}>${escapeHtml(item.title)}</span>
        </div>
        ${canEdit ? `
          <button type="button" class="btn-icon btn-item-cancel" onclick="handleDeleteItem('${boardId}', '${item.id}')" data-astryx-tooltip="Remove plan" style="width:22px; height:22px; color: var(--forge-text-muted); flex-shrink: 0;">
            ${icons.close}
          </button>
        ` : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 24px; margin-top: 6px; flex-wrap: wrap; gap: 6px;">
        <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 4px;">
          ${escapeHtml(item.targetQtr || 'Target Qtr')} ${icons.chevronDown}
        </span>
        
        <div style="display: flex; align-items: center; gap: 6px;">
          ${linkedGaps.length === 0 ? `
            <button type="button" class="plan-unlinked-highlight-btn" 
              ${canEdit ? `onclick="window.openLinkGapPlanModal && window.openLinkGapPlanModal('${boardId}', '${item.id}', 'PLAN', this)"` : ''}
              data-astryx-tooltip="No Skill Gap Linked • Click to link an identified gap">
              <span style="display: flex;">${icons.link}</span>
              <span>+ Link Gap</span>
            </button>
          ` : `
            <div class="teams-avatar-stack">
              ${linkedGaps.slice(0, 3).map(g => {
                const words = g.title.trim().split(/\s+/);
                const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'GP';
                const prio = (g.priority || 'MEDIUM').toLowerCase();
                return `<div class="teams-avatar-circle ${prio}" data-astryx-tooltip="Linked Gap: ${escapeHtml(g.title)} (${g.priority || 'MEDIUM'})" ${canEdit ? `onclick="window.openLinkGapPlanModal && window.openLinkGapPlanModal('${boardId}', '${item.id}', 'PLAN', this)"` : ''}>${initials}</div>`;
              }).join('')}
              ${linkedGaps.length > 3 ? `
                <div class="teams-avatar-circle overflow" data-astryx-tooltip="+${linkedGaps.length - 3} more gaps linked" ${canEdit ? `onclick="window.openLinkGapPlanModal && window.openLinkGapPlanModal('${boardId}', '${item.id}', 'PLAN', this)"` : ''}>+${linkedGaps.length - 3}</div>
              ` : ''}
              ${canEdit ? `
                <button type="button" class="teams-add-circle-btn" onclick="window.openLinkGapPlanModal && window.openLinkGapPlanModal('${boardId}', '${item.id}', 'PLAN', this)" data-astryx-tooltip="Link another skill gap">
                  ${icons.plus}
                </button>
              ` : ''}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * renderLockBanner
 */
export function renderLockBanner(board: GoalBoard): string {
  const banners: Record<string, { bg: string; border: string; icon: string; color: string; title: string; text: string }> = {
    SUBMITTED: { bg: 'var(--forge-warning-bg)', border: 'rgba(251, 191, 36, 0.3)', icon: icons.lock, color: 'var(--forge-warning)', title: 'Goal Board is Locked Under Manager Review', text: `Submitted on ${board.submittedAt ? new Date(board.submittedAt).toLocaleDateString() : 'recently'}. Locked while manager reviews.` },
    REWORK_REQUESTED: { bg: 'var(--forge-error-bg)', border: 'rgba(248, 113, 113, 0.3)', icon: icons.alertCircle, color: 'var(--forge-error)', title: `Revisions Requested by Manager (Revision ${board.revisionNumber})`, text: 'Manager requested updates. Editing unlocked to incorporate feedback.' },
    APPROVED: { bg: 'var(--forge-success-bg)', border: 'rgba(52, 211, 153, 0.3)', icon: icons.award, color: 'var(--forge-success)', title: 'Approved & Sealed Milestone Blueprint', text: `Approved on ${board.approvedAt ? new Date(board.approvedAt).toLocaleDateString() : 'Cycle Active'}. Sealed snapshot.` },
    LOCKED_OVERDUE: { bg: 'var(--forge-error-bg)', border: 'rgba(248, 113, 113, 0.3)', icon: icons.lock, color: 'var(--forge-error)', title: 'Submission Deadline Passed (Auto-Locked)', text: `Deadline (${escapeHtml(board.submissionDeadline || '')}) passed without submission. Request unlock to extend.` },
    UNLOCK_REQUESTED: { bg: 'var(--forge-warning-bg)', border: 'rgba(251, 191, 36, 0.3)', icon: icons.infoCircle, color: 'var(--forge-warning)', title: 'Unlock Request Pending Manager Approval', text: 'Unlock request submitted. You will be notified when unlocked.' }
  };
  const b = banners[board.status];
  if (!b) {
    if (!board.managerId && !board.managerName) {
      return `<div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;"><div style="display: flex; align-items: center; gap: 12px;"><span style="color: var(--forge-primary); display: flex;">${icons.infoCircle}</span><div><div style="font-size: 0.9rem; font-weight: 700; color: var(--forge-text-main);">Apex Profile: No Manager Above • No Submission Cycle</div><div style="font-size: 0.8rem; color: var(--forge-text-muted);">Self-governed milestone goal plan.</div></div></div><span style="font-family: var(--font-mono); font-size: 0.72rem; padding: 3px 10px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); color: var(--forge-primary); font-weight: 700;">Self-Governed</span></div>`;
    }
    return '';
  }
  return `<div style="background: ${b.bg}; border: 1px solid ${b.border}; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;"><span style="color: ${b.color}; display: flex;">${b.icon}</span><div><h4 style="font-size: 0.9rem; font-weight: 700; color: ${b.color}; margin-bottom: 2px;">${b.title}</h4><p style="font-size: 0.78rem; color: var(--forge-text-main);">${b.text}</p></div></div>`;
}
