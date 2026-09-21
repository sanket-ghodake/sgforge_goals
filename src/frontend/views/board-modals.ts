/**
 * Individual Goal Center - Board Canvas Modals (2026 LTS)
 * Modular dialogs for Quick Add Item, Board Settings, and Export.
 * Fused with shadcn UI, Magic UI, Aceternity, and Luxe aesthetic standards.
 * Zero Emojis & Zero Browser Defaults compliant.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { escapeHtml, renderModernSelectHtml } from '../../lib/ui';
import type { GoalBoard } from '../../lib/types';

/**
 * renderQuickAddModal
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderQuickAddModal(boardId: string): string {
  return `
    <div class="modal-backdrop" id="quickAddItemModal" onclick="if(event.target === this) closeQuickAddModal()">
      <div class="modal-box" style="max-width: 480px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--forge-primary); display: flex;">${icons.plus}</span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--forge-text-main);">Add Tri-Deck Item</h3>
          </div>
          <button type="button" class="btn-icon" onclick="closeQuickAddModal()">${icons.close}</button>
        </div>

        <form onsubmit="handleQuickAddSubmit(event)">
          <input type="hidden" id="quickAddBoardId" value="${escapeHtml(boardId)}" />
          
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Target Column & Category</label>
            ${renderModernSelectHtml({
              id: 'quickAddCategorySelect',
              value: 'CORE_SKILL',
              inputClassName: 'quick-add-category-input',
              options: [
                { value: 'CORE_SKILL', label: '1. Key Skills: Core / Technical Skill' },
                { value: 'STRATEGIC_SKILL', label: '1. Key Skills: Transformation / Strategic Skill' },
                { value: 'SKILL_GAP', label: '2. Skill Gaps: Identified Gap' },
                { value: 'STRATEGIC_PLAN', label: '3. Training Plans: Strategic Plan' },
                { value: 'TACTICAL_PLAN', label: '3. Training Plans: Tactical Plan' },
              ]
            })}
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Priority Badge</label>
            ${renderModernSelectHtml({
              id: 'quickAddPrioritySelect',
              value: 'MEDIUM',
              inputClassName: 'quick-add-priority-input',
              options: [
                { value: 'CRITICAL', label: 'CRITICAL (Rich Crimson)' },
                { value: 'MEDIUM', label: 'MEDIUM (Vibrant Amber)' },
                { value: 'LOW', label: 'LOW (Sapphire Blue)' },
              ]
            })}
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Item Title</label>
            <input type="text" id="quickAddTitleInput" required placeholder="e.g. Fastify API Framework..." style="width: 100%; height: 38px; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.9rem;" />
          </div>

          <div id="quickAddQuarterContainer" style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Target Quarter</label>
            ${renderModernSelectHtml({
              id: 'quickAddQuarterSelect',
              value: 'Target Qtr',
              inputClassName: 'quick-add-quarter-input',
              options: [
                { value: 'Target Qtr', label: 'Target Qtr (Flexible)' },
                { value: 'Q1', label: 'Q1' },
                { value: 'Q2', label: 'Q2' },
                { value: 'Q3', label: 'Q3' },
                { value: 'Q4', label: 'Q4' },
              ]
            })}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="btn-action btn-outline" onclick="closeQuickAddModal()">Cancel</button>
            <button type="submit" class="btn-action btn-primary">${icons.check} Add to Board</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * renderEditBoardModal
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderEditBoardModal(board: GoalBoard): string {
  return `
    <div class="modal-backdrop" id="editBoardModal" onclick="if(event.target === this) closeEditBoardModal()">
      <div class="modal-box" style="max-width: 440px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--forge-primary); display: flex;">${icons.edit}</span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--forge-text-main);">Edit Board Details</h3>
          </div>
          <button type="button" class="btn-icon" onclick="closeEditBoardModal()">${icons.close}</button>
        </div>

        <form onsubmit="handleEditBoardSubmit(event)">
          <input type="hidden" id="editBoardId" value="${escapeHtml(board.id)}" />
          
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--forge-text-muted);">Board Title</label>
            <input type="text" id="editBoardTitleInput" required value="${escapeHtml(board.title)}" style="width: 100%; height: 40px; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.9rem;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="btn-action btn-outline" onclick="closeEditBoardModal()">Cancel</button>
            <button type="submit" class="btn-action btn-primary">${icons.check} Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * renderExportModal
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderExportModal(board: GoalBoard): string {
  const jsonSummary = JSON.stringify({
    id: board.id,
    title: board.title,
    status: board.status,
    notes: board.notes,
    items: board.items
  }, null, 2);

  return `
    <div class="modal-backdrop" id="exportBoardModal" onclick="if(event.target === this) closeExportModal()">
      <div class="modal-box" style="max-width: 520px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--forge-primary); display: flex;">${icons.download}</span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--forge-text-main);">Export Goal Board</h3>
          </div>
          <button type="button" class="btn-icon" onclick="closeExportModal()">${icons.close}</button>
        </div>

        <div style="margin-bottom: 14px; font-size: 0.85rem; color: var(--forge-text-muted);">
          Export structured JSON representation of <strong>${escapeHtml(board.title)}</strong>.
        </div>

        <textarea readonly id="exportJsonDisplay" rows="10" style="width: 100%; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 10px; font-family: var(--font-mono); font-size: 0.78rem; resize: none; margin-bottom: 16px;">${escapeHtml(jsonSummary)}</textarea>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn-action btn-outline" onclick="copyExportJson()">${icons.copy} Copy JSON</button>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn-action btn-outline" onclick="closeExportModal()">Close</button>
            <button type="button" class="btn-action btn-primary" onclick="downloadBoardJson('${escapeHtml(board.id)}')">${icons.download} Download JSON</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
