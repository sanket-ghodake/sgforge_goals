/**
 * Individual Goal Center - Board Canvas View (Tab 2)
 * Renders the interactive milestone editor, transactional lock banners, and review threads.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import type { AuthUser, GoalBoard } from '../../lib/types';

export function renderBoardView(user: AuthUser, board: GoalBoard): string {
  const isOwner = board.ownerId === user.id || user.roles.includes('roles/admin');
  const isLocked = board.status === 'SUBMITTED' || board.status === 'APPROVED';
  const canEdit = isOwner && !isLocked;
  const items = board.items || [];
  const comments = board.comments || [];
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;

  return `
    <div style="margin-bottom: 32px;">
      <!-- Navigation Back & Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <a href="?tab=cockpit" onclick="navigateSpa('cockpit', null, event)" class="btn-action btn-outline" style="height: 28px; padding: 0 8px; font-size: 0.75rem;">
              ${icons.arrowLeft} Back to Cockpit
            </a>
            <span style="font-size: 0.75rem; color: var(--forge-text-muted);">${board.projectName || 'Project'} &bull; ${board.cycle} &bull; Rev ${board.revisionNumber}</span>
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">${board.title}</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.85rem;">
            Owner: <strong style="color: var(--forge-text-main);">${board.ownerName}</strong> (${board.ownerEmail}) &bull; Dept: ${board.ownerDepartment}
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          ${canEdit ? `
            <button class="btn-action btn-outline" onclick="addMilestoneRow()">${icons.plus} Add Milestone</button>
            <button class="btn-action btn-outline" onclick="saveBoardDraft()">${icons.check} Save Changes</button>
            <button class="btn-action btn-primary" onclick="submitBoardForReview()" ${!isWeightValid ? 'disabled title="Total weight must equal 100%" style="opacity: 0.5; cursor: not-allowed;"' : ''}>
              ${icons.send} ${board.status === 'REWORK_REQUESTED' ? 'Resubmit for Approval' : 'Submit to Manager'}
            </button>
          ` : isOwner && board.status === 'SUBMITTED' ? `
            <span style="font-size: 0.825rem; color: var(--forge-warning); display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
              ${icons.lock} Locked under Manager Review
            </span>
          ` : board.status === 'APPROVED' ? `
            <span style="font-size: 0.825rem; color: var(--forge-success); display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
              ${icons.award} Approved by ${board.approvedBy || 'Manager'}
            </span>
          ` : `
            <span style="font-size: 0.825rem; color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 6px;">
              ${icons.infoCircle} Read-Only View (Org Transparency)
            </span>
          `}
        </div>
      </div>

      <!-- Lock State Banner -->
      ${renderLockBanner(board)}

      <!-- Weight Sum Meter -->
      <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="color: ${isWeightValid ? 'var(--forge-success)' : 'var(--forge-warning)'}; display: flex;">
            ${isWeightValid ? icons.checkCircle : icons.alertCircle}
          </span>
          <div>
            <div style="font-size: 0.875rem; font-weight: 600; color: var(--forge-text-main);">
              Total Milestone Weight Allocation: <span id="totalWeightDisplay" style="color: ${isWeightValid ? 'var(--forge-success)' : 'var(--forge-warning)'};">${totalWeight}%</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">
              ${isWeightValid ? 'All 100% of cycle effort is balanced across milestones.' : 'Total weight must sum exactly to 100% before submission.'}
            </div>
          </div>
        </div>

        <div style="width: 180px; height: 8px; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow: hidden;">
          <div id="weightProgressBar" style="height: 100%; width: ${Math.min(totalWeight, 100)}%; background: ${isWeightValid ? 'var(--forge-success)' : 'var(--forge-warning)'}; transition: width 0.2s ease;"></div>
        </div>
      </div>

      <!-- Milestone Items Form Canvas -->
      <form id="milestonesForm" onsubmit="event.preventDefault()">
        <div id="milestonesContainer" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
          ${items.map((item, index) => renderMilestoneCard(item, index + 1, canEdit)).join('')}
        </div>
      </form>

      <!-- Review Feedback & Audit History -->
      ${comments.length > 0 ? `
        <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
            <span style="color: var(--forge-primary);">${icons.messageSquare}</span>
            <h3 style="font-size: 1rem; font-weight: 700;">Manager Review Notes & Revisions</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${comments.map(c => `
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--forge-border); border-radius: 8px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 6px;">
                  <span><strong style="color: var(--forge-text-main);">${c.authorName}</strong> (${c.authorRole})</span>
                  <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--forge-text-main); line-height: 1.4;">${c.commentText}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
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

      window.addMilestoneRow = function() {
        const container = document.getElementById('milestonesContainer');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'milestone-card';
        div.style = 'background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 18px; position: relative;';
        div.innerHTML = \`
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--forge-primary);">Milestone #\${count}</span>
            <button type="button" onclick="this.closest('.milestone-card').remove(); window.recalculateWeights();" class="btn-icon" style="width:24px; height:24px;">${icons.trash}</button>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Title</label>
              <input type="text" class="milestone-title-input" required placeholder="Milestone objective" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Category</label>
              <select class="milestone-category-select" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;">
                <option value="DELIVERABLE">Deliverable</option>
                <option value="METRIC">Metric</option>
                <option value="LEARNING">Learning</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Weight (%)</label>
              <input type="number" class="milestone-weight-input" min="5" max="100" value="25" oninput="window.recalculateWeights && window.recalculateWeights()" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
            </div>
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Description & Verification Evidence</label>
            <textarea class="milestone-desc-input" rows="2" placeholder="Specify deliverables, links, or measurement criteria" style="width:100%; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:6px 8px; font-size:0.85rem;"></textarea>
          </div>
        \`;
        container.appendChild(div);
        window.recalculateWeights();
      };

      window.getMilestonesPayload = function() {
        const cards = document.querySelectorAll('.milestone-card');
        const items = [];
        cards.forEach((card, idx) => {
          const title = card.querySelector('.milestone-title-input').value;
          const desc = card.querySelector('.milestone-desc-input').value;
          const category = card.querySelector('.milestone-category-select').value;
          const weight = Number(card.querySelector('.milestone-weight-input').value) || 0;
          const progressInput = card.querySelector('.milestone-progress-input');
          const progressPercent = progressInput ? Number(progressInput.value) || 0 : 0;
          items.push({
            id: card.dataset.id || ('item_' + window.currentBoardId + '_' + (idx + 1)),
            title,
            description: desc,
            category,
            targetDate: '2026-03-31',
            weight,
            progressPercent,
            status: progressPercent >= 100 ? 'COMPLETED' : progressPercent > 0 ? 'IN_PROGRESS' : 'PENDING'
          });
        });
        return items;
      };

      window.saveBoardDraft = function() {
        const items = window.getMilestonesPayload();
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
          if (window.astryxToast) window.astryxToast('Changes saved successfully.', 'success');
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.submitBoardForReview = function() {
        window.saveBoardDraft();
        fetch('api/boards/' + window.currentBoardId + '/submit', {
          method: 'POST',
        })
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
    </script>
  `;
}

function renderLockBanner(board: GoalBoard): string {
  if (board.status === 'SUBMITTED') {
    return `
      <div style="background: var(--forge-warning-bg); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;">
        <span style="color: var(--forge-warning); display: flex;">${icons.lock}</span>
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--forge-warning); margin-bottom: 2px;">
            Goal Board is Locked Under Manager Review
          </h4>
          <p style="font-size: 0.8rem; color: var(--forge-text-main);">
            This board was submitted on ${board.submittedAt ? new Date(board.submittedAt).toLocaleDateString() : 'recently'}. Modifications are temporarily locked while your manager conducts the review.
          </p>
        </div>
      </div>
    `;
  }

  if (board.status === 'REWORK_REQUESTED') {
    return `
      <div style="background: var(--forge-error-bg); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;">
        <span style="color: var(--forge-error); display: flex;">${icons.alertCircle}</span>
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--forge-error); margin-bottom: 2px;">
            Revisions Requested by Manager (Revision ${board.revisionNumber})
          </h4>
          <p style="font-size: 0.8rem; color: var(--forge-text-main);">
            Your manager reviewed your goals and requested updates. Editing is unlocked so you can incorporate the feedback and resubmit.
          </p>
        </div>
      </div>
    `;
  }

  if (board.status === 'APPROVED') {
    return `
      <div style="background: var(--forge-success-bg); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px;">
        <span style="color: var(--forge-success); display: flex;">${icons.award}</span>
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--forge-success); margin-bottom: 2px;">
            Approved & Sealed Milestone Blueprint
          </h4>
          <p style="font-size: 0.8rem; color: var(--forge-text-main);">
            Formally approved on ${board.approvedAt ? new Date(board.approvedAt).toLocaleDateString() : 'Cycle Active'}. Snapshot is immutable.
          </p>
        </div>
      </div>
    `;
  }

  return `
    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
      <span style="color: var(--forge-primary); display: flex;">${icons.infoCircle}</span>
      <div style="font-size: 0.825rem; color: var(--forge-text-muted);">
        Draft Mode: Add project milestones, set relative weights (must total 100%), and submit to your manager for formal approval.
      </div>
    </div>
  `;
}

function renderMilestoneCard(item: any, index: number, canEdit: boolean): string {
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

      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Title</label>
          <input type="text" class="milestone-title-input" ${!canEdit ? 'readonly' : ''} value="${item.title}" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Category</label>
          <select class="milestone-category-select" ${!canEdit ? 'disabled' : ''} style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;">
            <option value="DELIVERABLE" ${item.category === 'DELIVERABLE' ? 'selected' : ''}>Deliverable</option>
            <option value="METRIC" ${item.category === 'METRIC' ? 'selected' : ''}>Metric</option>
            <option value="LEARNING" ${item.category === 'LEARNING' ? 'selected' : ''}>Learning</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Weight (%)</label>
          <input type="number" class="milestone-weight-input" ${!canEdit ? 'readonly' : ''} min="5" max="100" value="${item.weight}" oninput="window.recalculateWeights && window.recalculateWeights()" style="width:100%; height:34px; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:0 8px; font-size:0.85rem;" />
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display:block; font-size:0.75rem; color:var(--forge-text-muted); margin-bottom:4px;">Description</label>
        <textarea class="milestone-desc-input" ${!canEdit ? 'readonly' : ''} rows="2" style="width:100%; border-radius:6px; background:var(--forge-bg-surface); border:1px solid var(--forge-border-medium); color:var(--forge-text-main); padding:6px 8px; font-size:0.85rem;">${item.description || ''}</textarea>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--forge-border); padding-top: 10px; font-size: 0.8rem;">
        <span style="color: var(--forge-text-muted);">${icons.calendar} Target: ${item.targetDate}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--forge-text-muted);">Progress: ${item.progressPercent}%</span>
          <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.06); border-radius: 9999px; overflow:hidden;">
            <div style="width: ${item.progressPercent}%; height: 100%; background: var(--forge-primary);"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
