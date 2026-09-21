/**
 * Individual Goal Center - Inline Item Creation Runtime Script (2026 LTS)
 * Directly injects inline item rows for skills, gaps, and plans without disruptive modal popups.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';

export function getBoardInlineItemScript(): string {
  return `
    window.startInlineAddItem = function(boardId, category, triggerBtn) {
      if (window.cancelInlineNewItem) window.cancelInlineNewItem();

      const listContainer = triggerBtn.previousElementSibling;
      const isPlan = category === 'STRATEGIC_PLAN' || category === 'TACTICAL_PLAN';
      const isGap = category === 'SKILL_GAP';

      const row = document.createElement('div');
      row.id = 'inlineNewItemRow';
      row.className = isPlan ? 'tri-plan-card inline-new-row' : 'tri-item-row inline-new-row';
      row.dataset.category = category;
      row.dataset.priority = isGap ? 'CRITICAL' : 'MEDIUM';
      row.dataset.quarter = 'Q2';

      const defaultPrio = row.dataset.priority;
      const prioClass = defaultPrio === 'CRITICAL' ? 'badge-critical' : (defaultPrio === 'LOW' ? 'badge-low' : 'badge-medium');

      let innerHtml = '';
      if (isPlan) {
        innerHtml = '<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
          '<div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">' +
            '<span style="color: var(--forge-text-muted); display: flex; flex-shrink: 0;">${icons.circleDot}</span>' +
            '<span class="tri-badge ' + prioClass + ' clickable" id="inlineNewItemBadge" onclick="window.cycleInlineNewPriority(this)" data-astryx-tooltip="Click to change priority">' + defaultPrio + '</span>' +
            '<div style="position: relative; flex: 1; min-width: 0;">' +
              '<input type="text" id="inlineNewItemInput" class="tri-item-title-input" placeholder="Type training plan title..." maxlength="120" autocomplete="off" />' +
              '<div id="inlineNewItemSuggestions" class="tri-suggestions-dropdown" style="display: none;"></div>' +
            '</div>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: 6px;">' +
            '<button type="button" class="btn-icon" onclick="window.saveInlineNewItem(\\'' + boardId + '\\')" data-astryx-tooltip="Save plan (Enter)" style="color: var(--forge-primary); width: 22px; height: 22px;">' +
              '${icons.check}' +
            '</button>' +
            '<button type="button" class="btn-icon" onclick="window.cancelInlineNewItem()" data-astryx-tooltip="Cancel (Esc)" style="color: var(--forge-text-muted); width: 22px; height: 22px;">' +
              '${icons.close}' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div style="padding-left: 24px; margin-top: 4px; display: flex; align-items: center; gap: 8px;">' +
          '<span id="inlineNewQuarterBadge" class="clickable" onclick="window.cycleInlineNewQuarter(this)" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-muted); display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" data-astryx-tooltip="Click to cycle quarter (Q1-Q4)">' +
            'Q2 ${icons.chevronDown}' +
          '</span>' +
        '</div>';
      } else {
        const placeholder = isGap ? 'Type identified skill gap...' : 'Type skill title...';
        innerHtml = '<div class="tri-item-left" style="flex: 1; min-width: 0;">' +
          '<span class="tri-badge ' + prioClass + ' clickable" id="inlineNewItemBadge" onclick="window.cycleInlineNewPriority(this)" data-astryx-tooltip="Click to change priority">' + defaultPrio + '</span>' +
          '<div style="position: relative; flex: 1; min-width: 0;">' +
            '<input type="text" id="inlineNewItemInput" class="tri-item-title-input" placeholder="' + placeholder + '" maxlength="120" autocomplete="off" />' +
            '<div id="inlineNewItemSuggestions" class="tri-suggestions-dropdown" style="display: none;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: 6px;">' +
          '<button type="button" class="btn-icon" onclick="window.saveInlineNewItem(\\'' + boardId + '\\')" data-astryx-tooltip="Save (Enter)" style="color: var(--forge-primary); width: 22px; height: 22px;">' +
            '${icons.check}' +
          '</button>' +
          '<button type="button" class="btn-icon" onclick="window.cancelInlineNewItem()" data-astryx-tooltip="Cancel (Esc)" style="color: var(--forge-text-muted); width: 22px; height: 22px;">' +
            '${icons.close}' +
          '</button>' +
        '</div>';
      }

      row.innerHTML = innerHtml;
      triggerBtn.style.display = 'none';
      triggerBtn.setAttribute('data-was-hidden', 'true');

      if (listContainer) {
        listContainer.appendChild(row);
      } else {
        triggerBtn.parentNode.insertBefore(row, triggerBtn);
      }

      const input = document.getElementById('inlineNewItemInput');
      const suggestions = document.getElementById('inlineNewItemSuggestions');
      if (input) {
        input.focus();
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            window.saveInlineNewItem(boardId);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            window.cancelInlineNewItem();
          }
        });

        if (window.initLiveSuggestions && suggestions) {
          window.initLiveSuggestions(input, suggestions, {
            getCategory: function() { return category; },
            onSelect: function(selected) {
              input.value = selected.title;
              window.saveInlineNewItem(boardId);
            }
          });
        }
      }
    };

    window.saveInlineNewItem = function(boardId) {
      const row = document.getElementById('inlineNewItemRow');
      if (!row) return;
      const input = document.getElementById('inlineNewItemInput');
      if (!input) return;

      const title = input.value.trim();
      if (!title) {
        if (window.astryxToast) window.astryxToast('Please enter a title', 'warning');
        input.focus();
        return;
      }

      const category = row.dataset.category || 'CORE_SKILL';
      const priority = row.dataset.priority || 'MEDIUM';
      const targetQtr = row.dataset.quarter || 'Q2';

      fetch('api/boards/' + boardId + '/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          category: category,
          priority: priority,
          targetQtr: (category === 'STRATEGIC_PLAN' || category === 'TACTICAL_PLAN') ? targetQtr : null,
          weight: 10,
          progressPercent: 0
        })
      })
      .then(function(r) {
        if (!r.ok) throw new Error('Failed to create item');
        return r.json();
      })
      .then(function() {
        if (window.astryxToast) {
          const label = category === 'SKILL_GAP' ? 'Skill gap' : (category.includes('PLAN') ? 'Training plan' : 'Skill');
          window.astryxToast(label + ' added successfully', 'success');
        }
        window.cancelInlineNewItem();
        if (window.loadSpaView) window.loadSpaView('board', boardId);
      })
      .catch(function(err) {
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      });
    };

    window.cancelInlineNewItem = function() {
      const row = document.getElementById('inlineNewItemRow');
      if (row) row.remove();
      const hiddenButtons = document.querySelectorAll('.btn-add-action[data-was-hidden="true"]');
      hiddenButtons.forEach(function(b) {
        b.style.display = '';
        b.removeAttribute('data-was-hidden');
      });
    };

    window.cycleInlineNewPriority = function(badgeEl) {
      const row = document.getElementById('inlineNewItemRow');
      if (!row || !badgeEl) return;
      const levels = ['CRITICAL', 'MEDIUM', 'LOW'];
      const cur = row.dataset.priority || 'MEDIUM';
      const next = levels[(levels.indexOf(cur) + 1) % levels.length];
      row.dataset.priority = next;
      badgeEl.textContent = next;
      badgeEl.className = 'tri-badge clickable ' + (next === 'CRITICAL' ? 'badge-critical' : (next === 'LOW' ? 'badge-low' : 'badge-medium'));
    };

    window.cycleInlineNewQuarter = function(qtrEl) {
      const row = document.getElementById('inlineNewItemRow');
      if (!row || !qtrEl) return;
      const qtrs = ['Q1', 'Q2', 'Q3', 'Q4'];
      const cur = row.dataset.quarter || 'Q2';
      const next = qtrs[(qtrs.indexOf(cur) + 1) % qtrs.length];
      row.dataset.quarter = next;
      qtrEl.innerHTML = next + ' ' + '${icons.chevronDown}';
    };
  `;
}
