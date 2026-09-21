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
import { renderEditBoardModal, renderExportModal, renderLinkGapPlanModal, renderQuickAddModal } from './board-modals';
import { renderGapRow, renderLockBanner, renderPlanCard, renderSkillRow } from './board-components';
import { getBoardScripts } from './board-scripts';

/**
 * renderBoardView
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderBoardView(user: AuthUser, board: GoalBoard, userBoards: GoalBoard[] = []): string {
  const isOwner = board.ownerId === user.id ||
    Boolean(user.email && board.ownerEmail && user.email.toLowerCase() === board.ownerEmail.toLowerCase()) ||
    Boolean(user.displayName && board.ownerName && user.displayName.toLowerCase() === board.ownerName.toLowerCase());
  const isReviewer = !isOwner && (
    user.roles.some(r => /manager|admin|reviewer/i.test(r)) ||
    Boolean(board.managerId && board.managerId === user.id) ||
    Boolean(board.managerName && user.displayName && board.managerName.toLowerCase() === user.displayName.toLowerCase())
  );
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
            <button class="board-btn-icon green" onclick="openNewBoardModal()" data-astryx-tooltip="Create New Goal Board">
              ${icons.plus}
            </button>
            <button class="board-btn-icon" onclick="openEditBoardModal()" data-astryx-tooltip="Rename Board">
              ${icons.edit}
            </button>
          ` : ''}

          <button class="board-btn-icon" onclick="handleCloneBoard('${board.id}')" data-astryx-tooltip="Duplicate Goal Plan">
            ${icons.copy}
          </button>

          <button class="board-btn-icon" onclick="openExportModal()" data-astryx-tooltip="Download / Export Options">
            ${icons.download}
          </button>

          ${canAccessReview ? `
            <button class="board-btn-icon" onclick="openReviewDrawer('${board.id}')" data-astryx-tooltip="Open Live Review Timeline & Audit Log">
              ${icons.clipboardCheck}
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
                <button class="btn-add-action" onclick="window.startInlineAddItem && window.startInlineAddItem('${board.id}', 'CORE_SKILL', this)">
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
                <button class="btn-add-action" onclick="window.startInlineAddItem && window.startInlineAddItem('${board.id}', 'STRATEGIC_SKILL', this)">
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
              <button class="btn-add-action" onclick="window.startInlineAddItem && window.startInlineAddItem('${board.id}', 'SKILL_GAP', this)">
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
                <button class="btn-add-action" onclick="window.startInlineAddItem && window.startInlineAddItem('${board.id}', 'STRATEGIC_PLAN', this)">
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
                <button class="btn-add-action" onclick="window.startInlineAddItem && window.startInlineAddItem('${board.id}', 'TACTICAL_PLAN', this)">
                  ${icons.plus} Add item
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Bottom Notes & Strategic Context Deck -->
      <div class="board-notes-card">
        <div class="board-notes-header">
          <div class="board-notes-title-group">
            <span class="board-notes-icon">${icons.fileText}</span>
            <div>
              <div class="board-notes-title">Strategic Notes & Context</div>
              <div class="board-notes-subtitle">Shared milestone context, strategic alignment, and manager 1:1 check-in records</div>
            </div>
          </div>
          <div class="board-notes-meta">
            <span class="board-notes-status" id="boardNotesStatus" data-astryx-tooltip="Real-time autosave active">
              <span class="board-notes-beacon"></span>
              <span id="boardNotesStatusText">Auto-saved</span>
            </span>
          </div>
        </div>

        <div class="board-notes-box">
          <textarea class="notes-textarea" id="boardNotesInput" ${!canEdit ? 'readonly' : ''} oninput="handleNotesChange('${board.id}', this.value)" placeholder="Enter strategic goal notes, milestone dependencies, manager 1:1 cadence, or execution context...">${safeNotes}</textarea>
          <div class="board-notes-footer">
            <span class="board-notes-hint">
              ${icons.infoCircle} <span>Markdown supported &bull; Synced with review audits</span>
            </span>
            <span class="board-notes-counter" id="boardNotesCounter">${safeNotes.length} chars</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    ${renderQuickAddModal(board.id)}
    ${renderEditBoardModal(board)}
    ${renderExportModal(board)}
    ${renderLinkGapPlanModal()}

    <!-- Client-Side Runtime Engine -->
    <script>
      ${getBoardScripts(board.id)}
    </script>
  `;
}
