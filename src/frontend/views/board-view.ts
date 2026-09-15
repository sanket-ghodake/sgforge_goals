/**
 * Individual Goal Center - Board Canvas View (Tab 2)
 * Renders the interactive milestone editor, role-scoped review controls, and lock state banners.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import { escapeHtml } from '../../lib/ui';
import type { AuthUser, GoalBoard, GoalItem } from '../../lib/types';

/**
 * renderBoardView
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderBoardView(user: AuthUser, board: GoalBoard): string {
  const isOwner = board.ownerId === user.id || user.roles.includes('roles/admin');
  const isManager = user.roles.includes('roles/manager') || user.id === 'usr_manager';
  const isTeamMember = isManager && (board.ownerId !== user.id);
  const canAccessReview = isOwner || isTeamMember;

  const isSubmitted = board.status === 'SUBMITTED';
  const isApproved = board.status === 'APPROVED';
  const isOverdue = board.status === 'LOCKED_OVERDUE';
  const isUnlockRequested = board.status === 'UNLOCK_REQUESTED';
  const isRework = board.status === 'REWORK_REQUESTED';
  const isLocked = isSubmitted || isApproved || isOverdue || isUnlockRequested;
  const canEdit = isOwner && !isLocked;

  const items = board.items || [];
  const comments = board.comments || [];
  const totalWeight = items.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;
  const safeBoardTitle = escapeHtml(board.title);
  const safeOwnerName = escapeHtml(board.ownerName);

  return `
    <div style="margin-bottom: 28px;">
      <!-- Breadcrumb & Top Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--forge-text-muted);">
          <a href="?tab=boards" onclick="navigateSpa('boards', null, event)" style="color: var(--forge-text-muted); text-decoration: none;">Goal Boards</a>
          <span>/</span>
          <span style="color: var(--forge-text-main); font-weight: 600;">${safeBoardTitle}</span>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          ${canAccessReview ? `
            <button class="btn-action btn-outline" onclick="openReviewDrawer('${board.id}')" data-astryx-tooltip="Open live review timeline & feedback history">
              ${icons.messageSquare} Review Timeline (${comments.length})
            </button>
          ` : ''}

          ${isManager ? `
            <button class="btn-action btn-outline" onclick="handleSetDeadlinePrompt('${board.id}')" data-astryx-tooltip="Set or extend submission deadline date">
              ${icons.calendar} Set Deadline (${escapeHtml(board.submissionDeadline || 'None')})
            </button>
          ` : ''}

          ${canEdit ? `
            <button class="btn-action btn-outline" onclick="autoDistributeWeights()" data-astryx-tooltip="Auto-distribute milestone weights equally to 100%">
              ${icons.target} Auto-Balance 100%
            </button>
            <button class="btn-action btn-outline" onclick="saveBoardDraft()">
              ${icons.check} Save Draft
            </button>
            <button class="btn-action btn-primary" onclick="submitBoardForReview()" ${!isWeightValid ? 'disabled title="Total weight must equal 100%" style="opacity: 0.5; cursor: not-allowed;"' : ''}>
              ${icons.send} ${isRework ? 'Resubmit for Approval' : 'Submit Board'}
            </button>
          ` : ''}

          ${isOwner && isLocked ? `
            <button class="btn-action btn-outline" style="color: var(--forge-warning); border-color: rgba(245, 158, 11, 0.4);" onclick="handleRequestUnlock('${board.id}')">
              ${icons.lock} Request Unlock
            </button>
          ` : ''}

          ${isManager && isLocked ? `
            <button class="btn-action btn-outline" style="color: var(--forge-success); border-color: rgba(16, 185, 129, 0.4);" onclick="handleUnlockBoard('${board.id}')">
              ${icons.lock} Manager Unlock
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Lock & Status Banner -->
      ${renderLockBanner(board)}

      <!-- Board Header Card -->
      <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary); font-family: monospace;">${escapeHtml(board.projectName || 'Project')}</span>
              <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-weight: 600;">${escapeHtml(board.cycle)}</span>
              <span style="font-size: 0.75rem; color: var(--forge-text-muted);">Rev ${board.revisionNumber}</span>
            </div>
            <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 6px;">${safeBoardTitle}</h2>
            <div style="font-size: 0.85rem; color: var(--forge-text-muted); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px;">
              <span>Contributor: <strong style="color: var(--forge-text-main);">${safeOwnerName}</strong></span>
              <span>&bull;</span>
              <span>Dept: <strong style="color: var(--forge-text-main);">${escapeHtml(board.ownerDepartment)}</strong></span>
              <span>&bull;</span>
              <span>
                Assigned Manager: ${user.managerName ? `
                  <strong style="color: var(--forge-text-main);">${escapeHtml(user.managerName)}</strong>
                ` : `
                  <span style="color: var(--forge-warning); font-size: 0.75rem; background: rgba(245, 158, 11, 0.12); padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600;">
                    No Manager Assigned (Admin Review Mode)
                  </span>
                `}
              </span>
            </div>
          </div>

          <!-- Total Weight Progress Indicator -->
          <div style="min-width: 220px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px 18px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">
              <span style="color: var(--forge-text-muted);">Total Milestone Weight:</span>
              <span id="totalWeightDisplay" style="color: ${isWeightValid ? 'var(--forge-success)' : 'var(--forge-warning)'};">${totalWeight}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden;">
              <div id="weightProgressBar" style="height: 100%; width: ${Math.min(totalWeight, 100)}%; background: ${isWeightValid ? 'var(--forge-success)' : 'var(--forge-warning)'}; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 0.7rem; color: var(--forge-text-muted); margin-top: 6px; text-align: right;">
              ${isWeightValid ? 'Valid 100% allocation' : 'Must equal 100% to submit'}
            </div>
          </div>
        </div>
      </div>

      <!-- Milestone Items List Section -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Milestones & Target Metrics</h3>
          ${canEdit ? `
            <button class="btn-action btn-outline" onclick="addMilestoneRow()" style="font-size: 0.8rem;">
              ${icons.plus} Add Milestone Card
            </button>
          ` : ''}
        </div>

        <div id="milestonesContainer" style="display: flex; flex-direction: column; gap: 14px;">
          ${items.map((item, index) => renderMilestoneCard(item, index + 1, canEdit)).join('')}
        </div>
      </div>

      <!-- Review Feedback Stream Preview Card -->
      ${comments.length > 0 ? `
        <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 16px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--forge-text-main);">Recent Review Critique & Notes</h4>
            <button class="btn-action btn-outline" onclick="openReviewDrawer('${board.id}')" style="font-size: 0.775rem;">
              ${icons.messageSquare} Open Live Review Timeline
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${comments.slice(-3).map(c => `
              <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 8px; padding: 10px 14px; font-size: 0.825rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-weight: 700; color: var(--forge-primary);">${escapeHtml(c.authorName)} (${escapeHtml(c.authorRole)})</span>
                  <span style="color: var(--forge-text-muted); font-size: 0.75rem;">${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div style="color: var(--forge-text-main);">${escapeHtml(c.commentText)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Deadline Selection Modal (Zero Browser Default) -->
    <div class="modal-backdrop" id="deadlineModal" onclick="if(event.target === this) closeDeadlineModal()">
      <div class="modal-box" style="max-width: 420px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Set Submission Deadline</h3>
          <button class="btn-icon" onclick="closeDeadlineModal()">${icons.close}</button>
        </div>
        <form onsubmit="submitSetDeadline(event)">
          <input type="hidden" id="deadlineBoardId" />
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Deadline Date (YYYY-MM-DD)</label>
            <input type="date" id="deadlineInput" required value="2026-03-31" style="width: 100%; height: 38px; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.9rem;" />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn-action btn-outline" onclick="closeDeadlineModal()">Cancel</button>
            <button type="submit" class="btn-action btn-primary">${icons.check} Save Deadline</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      window.currentBoardId = "${board.id}";

      window.recalculateWeights = function() {
        const weightInputs = document.querySelectorAll('.milestone-weight-input');
        let total = 0;
        weightInputs.forEach(input => {
          total += Number(input.value) || 0;
        });
        const display = document.getElementById('totalWeightDisplay');
        const bar = document.getElementById('weightProgressBar');
        if (display) display.innerText = total + '%';
        if (bar) {
          bar.style.width = Math.min(total, 100) + '%';
          bar.style.background = total === 100 ? 'var(--forge-success)' : 'var(--forge-warning)';
        }
      };

      window.autoDistributeWeights = function() {
        const weightInputs = document.querySelectorAll('.milestone-weight-input');
        if (weightInputs.length === 0) return;
        const baseWeight = Math.floor(100 / weightInputs.length);
        const remainder = 100 - (baseWeight * weightInputs.length);
        weightInputs.forEach((input, index) => {
          input.value = index === 0 ? baseWeight + remainder : baseWeight;
        });
        window.recalculateWeights();
        if (window.astryxToast) window.astryxToast('Milestone weights auto-distributed to 100%', 'info');
      };

      window.addMilestoneRow = function() {
        const container = document.getElementById('milestonesContainer');
        if (!container) return;
        const index = container.querySelectorAll('.milestone-card').length + 1;
        const div = document.createElement('div');
        div.innerHTML = \`
          <div class="milestone-card" data-id="" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 18px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary);">Milestone #\${index}</span>
                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-weight: 600;">DELIVERABLE</span>
              </div>
              <button type="button" onclick="this.closest('.milestone-card').remove(); window.recalculateWeights();" class="btn-icon" style="width:24px; height:24px;">${icons.trash}</button>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Title</label>
                <input type="text" class="milestone-title-input" value="" placeholder="New deliverable title..." style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Category</label>
                <select class="milestone-category-select" style="height:34px;">
                  <option value="DELIVERABLE">Deliverable</option>
                  <option value="METRIC">Metric</option>
                  <option value="LEARNING">Learning</option>
                </select>
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Target Date</label>
                <input type="date" class="milestone-target-date-input" value="2026-03-31" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 6px; font-size:0.8rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Weight (%)</label>
                <input type="number" class="milestone-weight-input" min="5" max="100" value="10" oninput="window.recalculateWeights && window.recalculateWeights()" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
              </div>
            </div>
            <div style="margin-bottom: 12px;">
              <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Description</label>
              <textarea class="milestone-desc-input" rows="2" style="width:100%; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:6px 8px; font-size:0.85rem;"></textarea>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--forge-border); padding-top: 10px; font-size: 0.8rem;">
              <span style="color: var(--forge-text-muted);">${icons.calendar} Target: 2026-03-31</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--forge-text-muted);">Progress:</span>
                <input type="range" min="0" max="100" value="0" class="milestone-progress-input" style="width: 80px; accent-color: var(--forge-primary);" />
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary); min-width: 32px;">0%</span>
              </div>
            </div>
          </div>
        \`;
        container.appendChild(div.firstElementChild);
        window.recalculateWeights();
      };

      window.saveBoardDraft = function() {
        const cards = document.querySelectorAll('.milestone-card');
        const items = [];
        cards.forEach((card) => {
          items.push({
            id: card.dataset.id || undefined,
            title: card.querySelector('.milestone-title-input').value,
            description: card.querySelector('.milestone-desc-input').value,
            category: card.querySelector('.milestone-category-select').value,
            targetDate: card.querySelector('.milestone-target-date-input').value,
            weight: Number(card.querySelector('.milestone-weight-input').value) || 0,
            progressPercent: Number(card.querySelector('.milestone-progress-input').value) || 0,
            status: 'PENDING'
          });
        });

        fetch('api/boards/' + window.currentBoardId + '/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        })
        .then(res => {
          if (!res.ok) return res.json().then(e => { throw new Error(e.detail || e.title || 'Save failed'); });
          return res.json();
        })
        .then(() => {
          if (window.astryxToast) window.astryxToast('Draft saved successfully', 'success');
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.submitBoardForReview = function() {
        fetch('api/boards/' + window.currentBoardId + '/submit', { method: 'POST' })
        .then(res => {
          if (!res.ok) return res.json().then(e => { throw new Error(e.detail || e.title || 'Submission failed'); });
          return res.json();
        })
        .then(() => {
          if (window.astryxToast) window.astryxToast('Board submitted to manager. It is now locked against further edits.', 'success');
          setTimeout(() => { loadSpaView('board', window.currentBoardId); }, 800);
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.handleRequestUnlock = function(boardId) {
        fetch('api/boards/' + boardId + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'REQUEST_UNLOCK', comment: 'Requesting board unlock for milestone revisions.' })
        })
        .then(res => res.json())
        .then(() => {
          if (window.astryxToast) window.astryxToast('Unlock requested. Manager notified.', 'info');
          loadSpaView('board', boardId);
        });
      };

      window.handleSetDeadlinePrompt = function(boardId) {
        const modal = document.getElementById('deadlineModal');
        const hiddenId = document.getElementById('deadlineBoardId');
        if (hiddenId) hiddenId.value = boardId;
        if (modal) modal.classList.add('open');
      };

      window.closeDeadlineModal = function() {
        const modal = document.getElementById('deadlineModal');
        if (modal) modal.classList.remove('open');
      };

      window.submitSetDeadline = function(e) {
        e.preventDefault();
        const boardId = document.getElementById('deadlineBoardId').value;
        const deadline = document.getElementById('deadlineInput').value;
        fetch('api/boards/' + boardId + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'SET_DEADLINE', deadline })
        })
        .then(res => {
          if (!res.ok) return res.json().then(err => { throw new Error(err.detail || 'Deadline update failed'); });
          return res.json();
        })
        .then(() => {
          window.closeDeadlineModal();
          if (window.astryxToast) window.astryxToast('Submission deadline set to ' + deadline, 'info');
          loadSpaView('board', boardId);
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.updateItemProgress = function(boardId, itemId, progressPercent) {
        const val = Number(progressPercent) || 0;
        const valSpan = document.getElementById('progressVal_' + itemId);
        if (valSpan) valSpan.innerText = val + '%';

        fetch('api/boards/' + boardId + '/items/' + itemId + '/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progressPercent: val })
        })
        .then(res => res.json())
        .then(() => {
          if (window.astryxToast) window.astryxToast('Milestone progress updated to ' + val + '%', 'success');
        });
      };
    </script>
  `;
}

function renderLockBanner(board: GoalBoard): string {
  const statusBanners: Record<string, { bg: string; border: string; icon: string; color: string; title: string; text: string }> = {
    SUBMITTED: {
      bg: 'var(--forge-warning-bg)', border: 'rgba(251, 191, 36, 0.3)', icon: icons.lock, color: 'var(--forge-warning)',
      title: 'Goal Board is Locked Under Manager Review',
      text: `This board was submitted on ${board.submittedAt ? new Date(board.submittedAt).toLocaleDateString() : 'recently'}. Modifications are temporarily locked while your manager conducts the review.`
    },
    REWORK_REQUESTED: {
      bg: 'var(--forge-error-bg)', border: 'rgba(248, 113, 113, 0.3)', icon: icons.alertCircle, color: 'var(--forge-error)',
      title: `Revisions Requested by Manager (Revision ${board.revisionNumber})`,
      text: 'Your manager reviewed your goals and requested updates. Editing is unlocked so you can incorporate the feedback and resubmit.'
    },
    APPROVED: {
      bg: 'var(--forge-success-bg)', border: 'rgba(52, 211, 153, 0.3)', icon: icons.award, color: 'var(--forge-success)',
      title: 'Approved & Sealed Milestone Blueprint',
      text: `Formally approved on ${board.approvedAt ? new Date(board.approvedAt).toLocaleDateString() : 'Cycle Active'}. Snapshot is sealed. Click "Request Unlock" if revisions are needed.`
    },
    LOCKED_OVERDUE: {
      bg: 'var(--forge-error-bg)', border: 'rgba(248, 113, 113, 0.3)', icon: icons.lock, color: 'var(--forge-error)',
      title: 'Submission Deadline Passed (Auto-Locked)',
      text: `The deadline (${escapeHtml(board.submissionDeadline)}) has passed without submission. Click "Request Unlock" to ask your manager to extend the deadline and unlock editing.`
    },
    UNLOCK_REQUESTED: {
      bg: 'var(--forge-warning-bg)', border: 'rgba(251, 191, 36, 0.3)', icon: icons.infoCircle, color: 'var(--forge-warning)',
      title: 'Unlock Request Pending Manager Approval',
      text: 'An unlock request has been submitted to your manager. You will be notified when your manager unlocks editing.'
    }
  };

  const b = statusBanners[board.status];
  if (!b) {
    return `<div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;"><span style="color: var(--forge-primary); display: flex;">${icons.infoCircle}</span><div style="font-size: 0.825rem; color: var(--forge-text-muted);">Draft Mode: Add project milestones, set relative weights (must total 100%), and submit to your manager for formal approval.</div></div>`;
  }

  return `<div style="background: ${b.bg}; border: 1px solid ${b.border}; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;"><span style="color: ${b.color}; display: flex;">${b.icon}</span><div><h4 style="font-size: 0.95rem; font-weight: 700; color: ${b.color}; margin-bottom: 2px;">${b.title}</h4><p style="font-size: 0.8rem; color: var(--forge-text-main);">${b.text}</p></div></div>`;
}

function renderMilestoneCard(item: GoalItem, index: number, canEdit: boolean): string {
  const safeTitle = escapeHtml(item.title);
  const safeDesc = escapeHtml(item.description);
  const safeTargetDate = escapeHtml(item.targetDate || '2026-03-31');

  return `
    <div class="milestone-card" data-id="${item.id}" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 18px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary);">Milestone #${index}</span>
          <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-weight: 600;">${item.category}</span>
        </div>
        ${canEdit ? `
          <button type="button" onclick="this.closest('.milestone-card').remove(); recalculateWeights();" class="btn-icon" style="width:24px; height:24px;">${icons.trash}</button>
        ` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Title</label>
          <input type="text" class="milestone-title-input" ${!canEdit ? 'readonly' : ''} value="${safeTitle}" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Category</label>
          <select class="milestone-category-select" ${!canEdit ? 'disabled' : ''} style="height:34px;">
            <option value="DELIVERABLE" ${item.category === 'DELIVERABLE' ? 'selected' : ''}>Deliverable</option>
            <option value="METRIC" ${item.category === 'METRIC' ? 'selected' : ''}>Metric</option>
            <option value="LEARNING" ${item.category === 'LEARNING' ? 'selected' : ''}>Learning</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Target Date</label>
          <input type="date" class="milestone-target-date-input" ${!canEdit ? 'readonly' : ''} value="${safeTargetDate}" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 6px; font-size:0.8rem;" />
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Weight (%)</label>
          <input type="number" class="milestone-weight-input" ${!canEdit ? 'readonly' : ''} min="5" max="100" value="${item.weight}" oninput="window.recalculateWeights && window.recalculateWeights()" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Description</label>
        <textarea class="milestone-desc-input" ${!canEdit ? 'readonly' : ''} rows="2" style="width:100%; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:6px 8px; font-size:0.85rem;">${safeDesc}</textarea>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--forge-border); padding-top: 10px; font-size: 0.8rem;">
        <span style="color: var(--forge-text-muted);">${icons.calendar} Target: ${safeTargetDate}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--forge-text-muted);">Progress:</span>
          <input type="range" min="0" max="100" value="${item.progressPercent}" class="milestone-progress-input" oninput="window.updateItemProgress && window.updateItemProgress('${item.boardId}', '${item.id}', this.value)" style="width: 80px; accent-color: var(--forge-primary);" />
          <span id="progressVal_${item.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary); min-width: 32px;">${item.progressPercent}%</span>
        </div>
      </div>
    </div>
  `;
}
