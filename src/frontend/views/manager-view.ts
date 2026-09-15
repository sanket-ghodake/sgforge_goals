/**
 * Individual Goal Center - Manager Review Center (Tab 3)
 * Provides review queues, inline critique tools, rework request dialogues, and final signoff seals.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import type { AuthUser, GoalBoard } from '../../lib/types';

export function renderManagerView(user: AuthUser, pendingBoards: GoalBoard[], approvedBoards: GoalBoard[]): string {
  return `
    <div style="margin-bottom: 32px;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">Manager Review Center</h1>
        <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
          Verify team milestone commitments, request item revisions with inline guidance, or seal approved flight plans.
        </p>
      </div>

      <!-- Pending Submissions Queue -->
      <div style="margin-bottom: 36px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <h2 style="font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--forge-warning);">${icons.lock}</span>
            Pending Manager Review Queue (${pendingBoards.length})
          </h2>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${pendingBoards.length === 0 ? `
            <div style="padding: 40px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 10px; color: var(--forge-text-muted); font-size: 0.875rem;">
              ${icons.checkCircle} No boards currently pending your review. All submissions are processed!
            </div>
          ` : pendingBoards.map(b => `
            <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary);">${b.projectName || 'Project'}</span>
                  <span style="font-size: 0.75rem; background: var(--forge-warning-bg); color: var(--forge-warning); padding: 2px 8px; border-radius: 9999px; font-weight: 600;">
                    ${icons.lock} Locked for Review
                  </span>
                  <span style="font-size: 0.75rem; color: var(--forge-text-muted);">${b.cycle} &bull; Rev ${b.revisionNumber}</span>
                </div>
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">
                  <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${b.title}</a>
                </h3>
                <div style="font-size: 0.825rem; color: var(--forge-text-muted);">
                  Submitted by <strong style="color: var(--forge-text-main);">${b.ownerName}</strong> (${b.ownerDepartment}) &bull; ${b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : 'Recent'}
                </div>
              </div>

              <div style="display: flex; gap: 10px; align-items: center;">
                <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" class="btn-action btn-outline">
                  ${icons.layers} Inspect Canvas
                </a>
                <button class="btn-action btn-outline" style="color: var(--forge-warning); border-color: rgba(251, 191, 36, 0.3);" onclick="openReworkModal('${b.id}', '${b.title}')">
                  ${icons.alertCircle} Request Rework
                </button>
                <button class="btn-action btn-primary" onclick="handleApproveBoard('${b.id}')">
                  ${icons.award} Approve & Seal
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Approved Historical Boards -->
      <div>
        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--forge-success);">${icons.award}</span>
          Recently Approved Flight Plans (${approvedBoards.length})
        </h2>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
          ${approvedBoards.map(b => `
            <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 8px;">
                <span>${b.projectName || 'Project'}</span>
                <span style="color: var(--forge-success); font-weight: 600;">Approved</span>
              </div>
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">
                <a href="?tab=board&id=${b.id}" style="color: var(--forge-text-main); text-decoration: none;">${b.title}</a>
              </h4>
              <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 12px;">
                ${b.ownerName} &bull; ${b.cycle}
              </div>
              <div style="font-size: 0.75rem; color: var(--forge-text-subtle);">
                Sealed by: ${b.approvedBy || 'Manager'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Request Rework Modal Dialog -->
    <div class="modal-backdrop" id="reworkModal">
      <div class="modal-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--forge-warning);">Request Board Revision</h3>
          <button class="btn-icon" onclick="closeReworkModal()">${icons.close}</button>
        </div>

        <p style="font-size: 0.85rem; color: var(--forge-text-muted); margin-bottom: 14px;">
          Providing actionable feedback unlocks the board for the employee as a new revision and sends an urgent notification.
        </p>

        <form id="reworkForm" onsubmit="submitReworkRequest(event)">
          <input type="hidden" id="reworkBoardId" />
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Revision Feedback & Guidance</label>
            <textarea id="reworkCommentText" required rows="4" placeholder="e.g. Please clarify milestone #2 metrics and specify testing tools before final approval." style="width: 100%; border-radius: 6px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 10px; font-size: 0.875rem;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn-action btn-outline" onclick="closeReworkModal()">Cancel</button>
            <button type="submit" class="btn-action btn-primary" style="background: var(--forge-warning); color: var(--forge-text-main);">
              ${icons.send} Send Rework Request
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
      window.openReworkModal = function(boardId) {
        document.getElementById('reworkBoardId').value = boardId;
        document.getElementById('reworkModal').classList.add('open');
      };

      window.closeReworkModal = function() {
        document.getElementById('reworkModal').classList.remove('open');
      };

      window.submitReworkRequest = function(e) {
        e.preventDefault();
        const boardId = document.getElementById('reworkBoardId').value;
        const comment = document.getElementById('reworkCommentText').value;

        fetch('api/boards/' + boardId + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'REJECT', comment })
        })
        .then(res => {
          if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Rework request failed'); });
          return res.json();
        })
        .then(() => {
          window.closeReworkModal();
          if (window.astryxToast) window.astryxToast('Rework request submitted. Board unlocked for employee revision.', 'info');
          setTimeout(() => { loadSpaView('reviews'); }, 800);
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.handleApproveBoard = function(boardId) {
        fetch('api/boards/' + boardId + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'APPROVE', comment: 'Approved with formal manager signoff.' })
        })
        .then(res => {
          if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Approval failed'); });
          return res.json();
        })
        .then(() => {
          if (window.astryxToast) window.astryxToast('Board has been approved and permanently sealed.', 'success');
          setTimeout(() => { loadSpaView('reviews'); }, 800);
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };
    </script>
  `;
}
