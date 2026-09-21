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

          <div style="margin-bottom: 14px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--forge-text-muted);">Item Title</label>
              <span style="font-size: 0.72rem; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 4px;">${icons.search} Org Live Suggestions</span>
            </div>
            <input type="text" id="quickAddTitleInput" required placeholder="e.g. Fastify API Framework..." autocomplete="off" style="width: 100%; height: 38px; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.9rem;" />
            <div id="quickAddSuggestionsDropdown" class="tri-suggestions-dropdown" style="display: none;"></div>
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
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--forge-text-main);">Rename Goal Board</h3>
          </div>
          <button type="button" class="btn-icon" onclick="closeEditBoardModal()">${icons.close}</button>
        </div>

        <form onsubmit="handleEditBoardSubmit(event)">
          <input type="hidden" id="editBoardId" value="${escapeHtml(board.id)}" />
          
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--forge-text-muted);">Board Name</label>
            <input type="text" id="editBoardTitleInput" required value="${escapeHtml(board.title)}" style="width: 100%; height: 40px; border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.9rem;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="btn-action btn-outline" onclick="closeEditBoardModal()">Cancel</button>
            <button type="submit" class="btn-action btn-primary">${icons.check} Rename Board</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * renderExportModal
 * Multi-format export dialog: JSON Blueprint, Microsoft PowerPoint (PPT), and Landscape PDF.
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function renderExportModal(board: GoalBoard): string {
  const jsonSummary = JSON.stringify({
    id: board.id,
    title: board.title,
    status: board.status,
    revisionNumber: board.revisionNumber,
    notes: board.notes,
    items: board.items
  }, null, 2);

  return `
    <div class="modal-backdrop" id="exportBoardModal" onclick="if(event.target === this) closeExportModal()">
      <div class="modal-box" style="max-width: 560px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--forge-primary); display: flex;">${icons.download}</span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--forge-text-main);">Download & Export Blueprint</h3>
          </div>
          <button type="button" class="btn-icon" onclick="closeExportModal()">${icons.close}</button>
        </div>

        <div style="margin-bottom: 18px; font-size: 0.85rem; color: var(--forge-text-muted);">
          Choose an export format for <strong>${escapeHtml(board.title)}</strong>:
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
          <!-- Option 1: Landscape PDF -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border-radius: 10px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 8px; background: rgba(220, 38, 38, 0.1); color: #dc2626; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${icons.fileText}
              </span>
              <div style="min-width: 0;">
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--forge-text-main);">PDF Document (Landscape)</div>
                <div style="font-size: 0.74rem; color: var(--forge-text-muted);">Exact visual fit of tri-deck canvas in landscape orientation</div>
              </div>
            </div>
            <button type="button" class="btn-action btn-primary" onclick="exportBoardFormat('${escapeHtml(board.id)}', 'pdf')" style="flex-shrink: 0;">
              ${icons.download} Export PDF
            </button>
          </div>

          <!-- Option 2: Microsoft PowerPoint (PPT) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border-radius: 10px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 8px; background: rgba(217, 119, 6, 0.1); color: #d97706; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${icons.layers}
              </span>
              <div style="min-width: 0;">
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--forge-text-main);">Microsoft PowerPoint (PPT)</div>
                <div style="font-size: 0.74rem; color: var(--forge-text-muted);">Executive slide deck with skills, gaps, and roadmap slides</div>
              </div>
            </div>
            <button type="button" class="btn-action btn-primary" onclick="exportBoardFormat('${escapeHtml(board.id)}', 'ppt')" style="flex-shrink: 0;">
              ${icons.download} Download PPT
            </button>
          </div>

          <!-- Option 3: JSON Blueprint -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border-radius: 10px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border);">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: var(--forge-primary); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${icons.database}
              </span>
              <div style="min-width: 0;">
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--forge-text-main);">JSON Blueprint Data</div>
                <div style="font-size: 0.74rem; color: var(--forge-text-muted);">Machine-readable schema for backups and automation</div>
              </div>
            </div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
              <button type="button" class="btn-action btn-outline" onclick="copyExportJson()" data-astryx-tooltip="Copy to clipboard">
                ${icons.copy} Copy
              </button>
              <button type="button" class="btn-action btn-primary" onclick="exportBoardFormat('${escapeHtml(board.id)}', 'json')">
                ${icons.download} Download
              </button>
            </div>
          </div>
        </div>

        <textarea readonly id="exportJsonDisplay" style="display: none;">${escapeHtml(jsonSummary)}</textarea>

        <div style="display: flex; justify-content: flex-end;">
          <button type="button" class="btn-action btn-outline" onclick="closeExportModal()">Close</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * renderLinkGapPlanModal
 * Modal for linking and unlinking skill gaps with training plans
 * @requirements [HLR-UI-201] [LLR-GOALS-001] [LLR-GOALS-002]
 */
export function renderLinkGapPlanModal(): string {
  return `
    <div id="linkGapPlanModal" class="link-gap-plan-popover" style="display: none;" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--forge-border); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 7px;">
          <span style="color: var(--forge-primary); display: flex;">${icons.link}</span>
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--forge-text-main); margin: 0;" id="linkModalHeading">Link Milestones</h4>
        </div>
        <button type="button" class="btn-icon" onclick="closeLinkGapPlanModal()" data-astryx-tooltip="Close" style="width: 20px; height: 20px; color: var(--forge-text-muted);">
          ${icons.close}
        </button>
      </div>

      <div style="padding: 8px 10px; border-radius: 8px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2);">
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--forge-primary); text-transform: uppercase; letter-spacing: 0.04em;" id="linkModalSubjectType">Active Item</div>
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--forge-text-main); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" id="linkModalSubjectTitle">Selected Item</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--forge-text-muted);">
        <span id="linkModalCandidatesCount" style="font-weight: 600;">Available Candidates</span>
        <span>Click to toggle</span>
      </div>

      <div id="linkModalCandidatesContainer" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px;">
        <!-- Candidates populated dynamically -->
      </div>

      <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--forge-border); padding-top: 8px;">
        <button type="button" class="btn-action btn-primary" onclick="closeLinkGapPlanModal()" style="padding: 4px 12px; font-size: 0.78rem;">
          ${icons.check} Done
        </button>
      </div>
    </div>
  `;
}

