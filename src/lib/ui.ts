/**
 * SG Forge Micro-App Submodule - Portable Modern UI Engine (2026 LTS)
 * Fused with shadcn UI, Magic UI, Aceternity, and Luxe design primitives.
 * 100% Isolated & Autonomous: Zero imports from central platform monorepo.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */

import { icons } from './icons';
import { getModernUiStyles } from './ui-styles';

export { getModernUiStyles };
export const getAstryxStyles = getModernUiStyles;

export {
  getHeadStateScript,
  getModernToastScript,
  getAstryxToastScript,
  getModernTooltipScript,
  getAstryxTooltipScript,
  getModernSelectAndConfirmScripts,
  getModernHeaderHtml,
  getAstryxHeaderHtml,
} from './ui-scripts';

export interface ModernSelectOptionItem {
  value: string;
  label: string;
  selected?: boolean;
}

export function renderModernSelectHtml(opts: {
  id: string;
  name?: string;
  value?: string;
  placeholder?: string;
  options: ModernSelectOptionItem[];
  style?: string;
  triggerStyle?: string;
  inputClassName?: string;
  onChange?: string;
}): string {
  const selectedOpt = opts.options.find(o => o.selected || (opts.value !== undefined && o.value === opts.value)) || opts.options[0];
  const currentVal = selectedOpt ? selectedOpt.value : (opts.value || '');
  const currentLabel = selectedOpt ? selectedOpt.label : (opts.placeholder || 'Select...');

  return `
    <div class="modern-select-wrap" id="${opts.id}" style="${opts.style || ''}">
      <button type="button" class="modern-select-trigger" onclick="window.toggleModernSelect && window.toggleModernSelect('${opts.id}')" style="${opts.triggerStyle || ''}">
        <span class="modern-select-label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(currentLabel)}</span>
        <span class="modern-select-arrow">${icons.chevronDown}</span>
      </button>
      <div class="modern-select-menu">
        ${opts.options.map(opt => `
          <div class="modern-select-option ${opt.value === currentVal ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}" onclick="window.selectModernOption && window.selectModernOption('${opts.id}', '${escapeHtml(opt.value)}', '${escapeHtml(opt.label)}') ${opts.onChange ? '; ' + opts.onChange : ''}">
            ${escapeHtml(opt.label)}
          </div>
        `).join('')}
      </div>
      <input type="hidden" name="${opts.name || opts.id}" id="${opts.id}_input" class="${opts.inputClassName || ''}" value="${escapeHtml(currentVal)}" />
    </div>
  `;
}

export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips parenthetical designations or roles from display names (e.g. "Arjun Nair (Design Engineer)" -> "Arjun Nair").
 */
export function cleanDisplayName(name?: string | null): string {
  if (!name) return '';
  return String(name).replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getStatusBadge(status: string): { label: string; style: string } {
  switch (status) {
    case 'SUBMITTED':
      return {
        label: 'Under Review (Locked)',
        style: 'background: var(--forge-warning-bg); color: var(--forge-warning); border: 1px solid rgba(245, 158, 11, 0.35);',
      };
    case 'REWORK_REQUESTED':
      return {
        label: 'Revisions Requested',
        style: 'background: var(--forge-error-bg); color: var(--forge-error); border: 1px solid rgba(239, 68, 68, 0.35);',
      };
    case 'APPROVED':
      return {
        label: 'Approved & Sealed',
        style: 'background: var(--forge-success-bg); color: var(--forge-success); border: 1px solid rgba(16, 185, 129, 0.35);',
      };
    case 'LOCKED_OVERDUE':
      return {
        label: 'Deadline Passed (Locked)',
        style: 'background: var(--forge-error-bg); color: var(--forge-error); border: 1px solid rgba(239, 68, 68, 0.35);',
      };
    case 'UNLOCK_REQUESTED':
      return {
        label: 'Unlock Pending',
        style: 'background: var(--forge-warning-bg); color: var(--forge-warning); border: 1px solid rgba(245, 158, 11, 0.35);',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        style: 'background: var(--forge-success-bg); color: var(--forge-success); border: 1px solid rgba(16, 185, 129, 0.35);',
      };
    default:
      return {
        label: 'Draft (Editable)',
        style: 'background: rgba(255, 255, 255, 0.05); color: var(--forge-text-muted); border: 1px solid var(--forge-border);',
      };
  }
}
