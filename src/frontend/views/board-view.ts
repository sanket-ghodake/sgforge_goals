/**
 * Individual Goal Center - Board Canvas View (2026 LTS)
 * Tri-Deck Canvas: Active Program Bar, 1. Key Skills, 2. Skill Gaps, 3. Training Plans, and Notes.
 * Strict Zero-Emojis Standard, 3-Priority Badges (Critical, Medium, Low), and Zero Browser Defaults.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import { escapeHtml } from '../../lib/ui';
import type { AuthUser, GoalBoard, GoalItem } from '../../lib/types';
import { getBoardStyles } from './board-styles';
import { renderEditBoardModal, renderExportModal, renderQuickAddModal } from './board-modals';
import { renderGapRow, renderLockBanner, renderPlanCard, renderSkillRow } from './board-components';

/**
 * renderBoardView
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderBoardView(user: AuthUser, board: GoalBoard, userBoards: GoalBoard[] = []): string {
  const isOwner = board.ownerId === user.id;
  const isReviewer = !isOwner && (user.roles.includes('roles/manager') || user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin'));
  const canAccessReview = isOwner || isReviewer;

  const isSubmitted = board.status === 'SUBMITTED';
  const isApproved = board.status === 'APPROVED';
  const isOverdue = board.status === 'LOCKED_OVERDUE';
  const isUnlockRequested = board.status === 'UNLOCK_REQUESTED';
  const isRework = board.status === 'REWORK_REQUESTED';
  const isLocked = isSubmitted || isApproved || isOverdue || isUnlockRequested;
  const canEdit = isOwner && !isLocked;

  const items: GoalItem[] = board.items || [];
  const safeBoardTitle = escapeHtml(board.title);
  const effectiveBoards = userBoards.length > 0 ? userBoards : [board];
  const safeNotes = escapeHtml(board.notes || 'Targeting completion of strategic goals by end of next quarter. Regular 1:1 check-ins established with manager.');

  // Categorize tri-deck items
  const coreSkills = items.filter(i => i.category === 'CORE_SKILL' || i.category === 'DELIVERABLE');
  const strategicSkills = items.filter(i => i.category === 'STRATEGIC_SKILL' || i.category === 'METRIC');
  const skillGaps = items.filter(i => i.category === 'SKILL_GAP');
  const strategicPlans = items.filter(i => i.category === 'STRATEGIC_PLAN' || i.category === 'LEARNING');
  const tacticalPlans = items.filter(i => i.category === 'TACTICAL_PLAN');
  const allPlans = [...strategicPlans, ...tacticalPlans];
  const donePlans = allPlans.filter(i => i.status === 'COMPLETED').length;

  // Compute gap severities
  const gapCrit = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'CRITICAL').length;
  const gapMed = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'MEDIUM').length;
  const gapLow = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'LOW').length;

  return `
    <style>${getBoardStyles()}</style>

    <div class="board-canvas-wrap">
      <!-- 1. Top Bar: Board / Program Switcher & Action Buttons -->
      <div class="board-top-bar">
        <div class="board-switcher-group">
          <span class="board-switcher-label">Active Program:</span>
          <div class="board-switcher-container">
            <button type="button" class="board-switcher-badge" onclick="window.toggleBoardSwitcherMenu && window.toggleBoardSwitcherMenu()" data-astryx-tooltip="Switch between available goal boards">
              <span style="display:flex; color: var(--forge-primary);">${icons.folder}</span>
              <span style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeBoardTitle}</span>
              <span style="display:flex; color: var(--forge-text-muted);">${icons.chevronDown}</span>
            </button>

            <!-- Dropdown Menu of User's Boards -->
            <div class="board-switcher-menu" id="boardSwitcherMenu">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--forge-text-muted); padding: 4px 10px 8px; border-bottom: 1px solid var(--forge-border); text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center;">
                <span>My Goal Boards</span>
                <span style="background: rgba(99, 102, 241, 0.12); color: var(--forge-primary); padding: 1px 6px; border-radius: 9999px; font-size: 0.7rem;">${effectiveBoards.length}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px; max-height: 240px; overflow-y: auto; padding: 4px 0;">
                ${effectiveBoards.map(b => {
                  const isActive = b.id === board.id;
                  return `
                    <div class="board-switcher-item ${isActive ? 'active' : ''}" onclick="window.toggleBoardSwitcherMenu(false); navigateSpa('board', '${escapeHtml(b.id)}', event);">
                      <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                        <span style="color: ${isActive ? 'var(--forge-primary)' : 'var(--forge-text-muted)'}; display: flex;">${icons.fileText}</span>
                        <div style="min-width: 0;">
                          <div style="font-size: 0.82rem; font-weight: ${isActive ? '700' : '600'}; color: var(--forge-text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(b.title)}</div>
                          <div style="font-size: 0.7rem; color: var(--forge-text-muted); display: flex; gap: 6px; align-items: center;">
                            <span>Rev ${Number(b.revisionNumber) || 1}</span>
                            <span>&bull;</span>
                            <span>${escapeHtml(b.status)}</span>
                          </div>
                        </div>
                      </div>
                      ${isActive ? `<span style="color: var(--forge-primary); display: flex;">${icons.check}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="border-top: 1px solid var(--forge-border); padding-top: 6px; margin-top: 2px; display: flex; justify-content: space-between; align-items: center;">
                <button type="button" class="btn-action btn-outline" style="height: 28px; font-size: 0.72rem; padding: 0 8px;" onclick="window.toggleBoardSwitcherMenu(false); openNewBoardModal();">
                  ${icons.plus} New Board
                </button>
                <button type="button" class="btn-action btn-outline" style="height: 28px; font-size: 0.72rem; padding: 0 8px;" onclick="window.toggleBoardSwitcherMenu(false); navigateSpa('boards', null, event);">
                  All Boards ${icons.arrowRight}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="board-action-toolbar">
          ${canEdit ? `
            <button class="board-btn-icon green" onclick="openQuickAddModal('CORE_SKILL')" data-astryx-tooltip="Add Item (Skill, Gap, Plan)">
              ${icons.plus}
            </button>
            <button class="board-btn-icon" onclick="openEditBoardModal()" data-astryx-tooltip="Edit Board Title & Cycle">
              ${icons.edit}
            </button>
          ` : ''}

          <button class="board-btn-icon" onclick="handleCloneBoard('${board.id}')" data-astryx-tooltip="Duplicate Goal Plan">
            ${icons.copy}
          </button>

          <button class="board-btn-icon" onclick="openExportModal()" data-astryx-tooltip="Export or Download Summary">
            ${icons.download}
          </button>

          ${canAccessReview ? `
            <button class="board-btn-icon" onclick="openReviewDrawer('${board.id}')" data-astryx-tooltip="Open Live Review Timeline & Audit Log">
              ${icons.rotateCcw}
            </button>
          ` : ''}

          ${canEdit ? `
            <button class="board-btn-icon green" onclick="submitBoardForReview()" data-astryx-tooltip="${isRework ? 'Resubmit for Review' : 'Submit Goal Plan'}">
              ${icons.send}
            </button>
            <button class="board-btn-icon red" onclick="handleDeleteBoard('${board.id}')" data-astryx-tooltip="Delete Draft Board">
              ${icons.trash}
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Lock & Status Banner -->
      ${renderLockBanner(board)}

      <!-- 2. Three Column Tri-Deck Grid -->
      <div class="tri-deck-grid">
        <!-- COLUMN 1: KEY SKILLS REQUIRED -->
        <div class="tri-deck-card">
          <div class="tri-deck-header blue">
            <span>1. KEY SKILLS REQUIRED</span>
            <span class="tri-deck-pill">${coreSkills.length} Core &bull; ${strategicSkills.length} Strategic</span>
          </div>
          <div class="tri-deck-body">
            <div>
              <div class="tri-deck-section-title blue">Core / Technical Skills</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                ${coreSkills.map(s => renderSkillRow(board.id, s, canEdit)).join('')}
              </div>
              ${canEdit ? `
                <button class="btn-add-action" onclick="openQuickAddModal('CORE_SKILL')">
                  ${icons.plus} Add skill
                </button>
              ` : ''}
            </div>

            <div>
              <div class="tri-deck-section-title blue">Transformation / Strategic Skills</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                ${strategicSkills.map(s => renderSkillRow(board.id, s, canEdit)).join('')}
              </div>
              ${canEdit ? `
                <button class="btn-add-action" onclick="openQuickAddModal('STRATEGIC_SKILL')">
                  ${icons.plus} Add skill
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- COLUMN 2: SKILL GAPS -->
        <div class="tri-deck-card">
          <div class="tri-deck-header red">
            <span>2. SKILL GAPS</span>
            <span class="tri-deck-pill">${gapCrit} Critical &bull; ${gapMed} Medium &bull; ${gapLow} Low</span>
          </div>
          <div class="tri-deck-body" style="justify-content: space-between;">
            <div>
              <div class="tri-deck-section-title red">Gaps Identified</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                ${skillGaps.map(g => renderGapRow(board.id, g, canEdit)).join('')}
              </div>
            </div>
            ${canEdit ? `
              <button class="btn-add-action" onclick="openQuickAddModal('SKILL_GAP')">
                ${icons.plus} Add gap
              </button>
            ` : ''}
          </div>
        </div>

        <!-- COLUMN 3: TRAINING PLANS -->
        <div class="tri-deck-card">
          <div class="tri-deck-header green">
            <span>3. TRAINING PLANS</span>
            <span class="tri-deck-pill">${donePlans}/${allPlans.length} Done</span>
          </div>
          <div class="tri-deck-body">
            <div>
              <div class="tri-deck-section-title green">Strategic Plan</div>
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px;">
                ${strategicPlans.length > 0 ? strategicPlans.map(p => renderPlanCard(board.id, p, canEdit)).join('') : `
                  <div style="font-size: 0.8rem; color: var(--forge-text-muted); font-style: italic; padding: 4px 0;">No strategic plans scheduled.</div>
                `}
              </div>
              ${canEdit ? `
                <button class="btn-add-action" onclick="openQuickAddModal('STRATEGIC_PLAN')">
                  ${icons.plus} Add item
                </button>
              ` : ''}
            </div>

            <div>
              <div class="tri-deck-section-title green">Tactical Plan</div>
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px;">
                ${tacticalPlans.length > 0 ? tacticalPlans.map(p => renderPlanCard(board.id, p, canEdit)).join('') : `
                  <div style="font-size: 0.8rem; color: var(--forge-text-muted); font-style: italic; padding: 4px 0;">No tactical plans scheduled.</div>
                `}
              </div>
              ${canEdit ? `
                <button class="btn-add-action" onclick="openQuickAddModal('TACTICAL_PLAN')">
                  ${icons.plus} Add item
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Bottom Notes Bar -->
      <div class="board-notes-card">
        <span class="notes-label">Notes:</span>
        <textarea class="notes-textarea" id="boardNotesInput" ${!canEdit ? 'readonly' : ''} oninput="handleNotesChange('${board.id}', this.value)" placeholder="Strategic goal notes, milestones context, or 1:1 check-in cadence...">${safeNotes}</textarea>
      </div>
    </div>

    <!-- Modals -->
    ${renderQuickAddModal(board.id)}
    ${renderEditBoardModal(board)}
    ${renderExportModal(board)}

    <!-- Client-Side Runtime Engine -->
    <script>
      window.currentBoardId = "${board.id}";

      window.toggleBoardSwitcherMenu = function(forceState) {
        const menu = document.getElementById('boardSwitcherMenu');
        if (!menu) return;
        if (forceState !== undefined) {
          if (forceState) menu.classList.add('open');
          else menu.classList.remove('open');
        } else {
          menu.classList.toggle('open');
        }
      };

      if (!window._boardSwitcherClickBound) {
        window._boardSwitcherClickBound = true;
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.board-switcher-container')) {
            const menu = document.getElementById('boardSwitcherMenu');
            if (menu) menu.classList.remove('open');
          }
        });
      }

      window.openQuickAddModal = function(defaultCat) {
        const modal = document.getElementById('quickAddItemModal');
        if (defaultCat && window.selectModernOption) {
          const labels = {
            CORE_SKILL: '1. Key Skills: Core / Technical Skill',
            STRATEGIC_SKILL: '1. Key Skills: Transformation / Strategic Skill',
            SKILL_GAP: '2. Skill Gaps: Identified Gap',
            STRATEGIC_PLAN: '3. Training Plans: Strategic Plan',
            TACTICAL_PLAN: '3. Training Plans: Tactical Plan'
          };
          window.selectModernOption('quickAddCategorySelect', defaultCat, labels[defaultCat] || defaultCat);
        }
        if (modal) modal.classList.add('open');
      };

      window.closeQuickAddModal = function() {
        const modal = document.getElementById('quickAddItemModal');
        if (modal) modal.classList.remove('open');
      };

      window.openEditBoardModal = function() {
        const modal = document.getElementById('editBoardModal');
        if (modal) modal.classList.add('open');
      };

      window.closeEditBoardModal = function() {
        const modal = document.getElementById('editBoardModal');
        if (modal) modal.classList.remove('open');
      };

      window.openExportModal = function() {
        const modal = document.getElementById('exportBoardModal');
        if (modal) modal.classList.add('open');
      };

      window.closeExportModal = function() {
        const modal = document.getElementById('exportBoardModal');
        if (modal) modal.classList.remove('open');
      };

      window.copyExportJson = function() {
        const textarea = document.getElementById('exportJsonDisplay');
        if (textarea) {
          navigator.clipboard.writeText(textarea.value);
          if (window.astryxToast) window.astryxToast('Board JSON copied to clipboard', 'info');
        }
      };

      window.downloadBoardJson = function(boardId) {
        const textarea = document.getElementById('exportJsonDisplay');
        if (!textarea) return;
        const blob = new Blob([textarea.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'goal-board-' + boardId + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      window.handleQuickAddSubmit = function(e) {
        e.preventDefault();
        const cat = document.querySelector('#quickAddCategorySelect input[type="hidden"]')?.value || 'CORE_SKILL';
        const prio = document.querySelector('#quickAddPrioritySelect input[type="hidden"]')?.value || 'MEDIUM';
        const qtr = document.querySelector('#quickAddQuarterSelect input[type="hidden"]')?.value || 'Target Qtr';
        const title = document.getElementById('quickAddTitleInput').value.trim();
        if (!title) return;

        fetch('api/boards/' + window.currentBoardId)
          .then(r => r.json())
          .then(board => {
            const items = (board.items || []).map(i => ({
              id: i.id,
              title: i.title,
              description: i.description || '',
              category: i.category,
              targetDate: i.targetDate,
              weight: Number(i.weight) || 0,
              progressPercent: Number(i.progressPercent) || 0,
              status: i.status || 'PENDING',
              priority: i.priority || 'MEDIUM',
              targetQtr: i.targetQtr || null,
              plansCount: Number(i.plansCount) || 0
            }));

            items.push({
              title,
              description: '',
              category: cat,
              targetDate: '2026-03-31',
              weight: 0,
              progressPercent: 0,
              status: 'PENDING',
              priority: prio,
              targetQtr: qtr,
              plansCount: 0
            });

            return fetch('api/boards/' + window.currentBoardId + '/items', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items })
            });
          })
          .then(r => {
            if (!r.ok) throw new Error('Failed to add item');
            window.closeQuickAddModal();
            if (window.astryxToast) window.astryxToast('Item added to board', 'success');
            loadSpaView('board', window.currentBoardId);
          })
          .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.togglePlan = function(boardId, itemId) {
        fetch('api/boards/' + boardId + '/items/' + itemId + '/toggle', { method: 'PATCH' })
          .then(r => {
            if (!r.ok) throw new Error('Toggle failed');
            return r.json();
          })
          .then(() => {
            loadSpaView('board', boardId);
          })
          .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      window.handleDeleteItem = function(boardId, itemId) {
        if (!window.showModernConfirm) return;
        window.showModernConfirm({
          title: 'Remove Item',
          message: 'Remove this item from the board blueprint?',
          confirmText: 'Remove',
          confirmVariant: 'destructive',
          onConfirm: () => {
            fetch('api/boards/' + boardId)
              .then(r => r.json())
              .then(board => {
                const items = (board.items || []).filter(i => i.id !== itemId).map(i => ({
                  id: i.id, title: i.title, description: i.description || '', category: i.category,
                  targetDate: i.targetDate, weight: Number(i.weight) || 0, progressPercent: Number(i.progressPercent) || 0,
                  status: i.status || 'PENDING', priority: i.priority || 'MEDIUM', targetQtr: i.targetQtr || null,
                  plansCount: Number(i.plansCount) || 0
                }));
                return fetch('api/boards/' + boardId + '/items', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items })
                });
              })
              .then(() => {
                if (window.astryxToast) window.astryxToast('Item removed', 'info');
                loadSpaView('board', boardId);
              });
          }
        });
      };

      window.handleNotesChange = function(boardId, notes) {
        clearTimeout(window.boardNotesTimeout);
        window.boardNotesTimeout = setTimeout(() => {
          fetch('api/boards/' + boardId + '/notes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
          }).then(() => {
            if (window.astryxToast) window.astryxToast('Notes auto-saved', 'info');
          });
        }, 600);
      };

      window.handleCloneBoard = function(boardId) {
        fetch('api/boards/' + boardId + '/clone', { method: 'POST' })
          .then(r => r.json())
          .then(newBoard => {
            if (window.astryxToast) window.astryxToast('Board duplicated successfully', 'success');
            navigateSpa('board', newBoard.id);
          });
      };

      window.handleDeleteBoard = function(boardId) {
        if (!window.showModernConfirm) return;
        window.showModernConfirm({
          title: 'Delete Draft Board',
          message: 'Permanently remove this goal board and all milestones?',
          confirmText: 'Delete Board',
          confirmVariant: 'destructive',
          onConfirm: () => {
            fetch('api/boards/' + boardId, { method: 'DELETE' })
              .then(r => {
                if (!r.ok) throw new Error('Deletion failed');
                if (window.astryxToast) window.astryxToast('Board deleted', 'info');
                navigateSpa('boards', null);
              })
              .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
          }
        });
      };

      window.submitBoardForReview = function() {
        fetch('api/boards/' + window.currentBoardId + '/submit', { method: 'POST' })
          .then(r => {
            if (!r.ok) return r.json().then(e => { throw new Error(e.detail || e.title || 'Submission failed'); });
            return r.json();
          })
          .then(() => {
            if (window.astryxToast) window.astryxToast('Board submitted for manager review.', 'success');
            setTimeout(() => { loadSpaView('board', window.currentBoardId); }, 600);
          })
          .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };
    </script>
  `;
}
