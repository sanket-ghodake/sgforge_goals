/**
 * Individual Goal Center - Board Client-Side Runtime Scripts (2026 LTS)
 * Modular runtime scripts for switcher, quick-add, plan toggling, notes autosave,
 * 3-priority cycling (Critical -> Medium -> Low), and inline title editing.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { icons } from '../../lib/icons';
import { getBoardSuggestionsScript } from './board-suggestions-script';
import { getBoardLinkScript } from './board-link-script';
import { getBoardInlineItemScript } from './board-inline-item-script';

export function getBoardScripts(boardId: string): string {
  return `
    window.currentBoardId = "${boardId}";
    ${getBoardSuggestionsScript()}
    ${getBoardLinkScript()}
    ${getBoardInlineItemScript()}

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
      if (modal) {
        modal.classList.add('open');
        if (window.setupQuickAddSuggestions) window.setupQuickAddSuggestions();
        const input = document.getElementById('quickAddTitleInput');
        if (input) setTimeout(function() { input.focus(); }, 60);
      }
    };

    window.closeQuickAddModal = function() {
      const modal = document.getElementById('quickAddItemModal');
      if (modal) modal.classList.remove('open');
      const dropdown = document.getElementById('quickAddSuggestionsDropdown');
      if (dropdown) dropdown.style.display = 'none';
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

    window.handleEditBoardSubmit = function(e) {
      e.preventDefault();
      const input = document.getElementById('editBoardTitleInput');
      const newTitle = input ? input.value.trim() : '';
      if (!newTitle) return;

      fetch('api/boards/' + window.currentBoardId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.detail || err.title || 'Rename failed'); });
        return r.json();
      })
      .then(() => {
        window.closeEditBoardModal();
        if (window.astryxToast) window.astryxToast('Board renamed to ' + newTitle, 'success');
        loadSpaView('board', window.currentBoardId);
      })
      .catch(err => {
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      });
    };

    window.exportBoardFormat = function(bId, format) {
      if (format === 'pdf') {
        const printUrl = 'api/boards/' + bId + '/export?format=pdf&print=true';
        const win = window.open(printUrl, '_blank');
        if (win) {
          if (window.astryxToast) window.astryxToast('Opening Landscape PDF Print Canvas...', 'info');
        } else {
          window.location.href = printUrl;
        }
        return;
      }
      if (format === 'ppt') {
        const a = document.createElement('a');
        a.href = 'api/boards/' + bId + '/export?format=ppt';
        a.download = 'goal-board-' + bId + '.ppt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (window.astryxToast) window.astryxToast('PowerPoint presentation downloading...', 'success');
        return;
      }
      if (format === 'json') {
        const a = document.createElement('a');
        a.href = 'api/boards/' + bId + '/export?format=json';
        a.download = 'goal-board-' + bId + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (window.astryxToast) window.astryxToast('JSON blueprint downloading...', 'success');
        return;
      }
    };

    window.downloadBoardJson = function(bId) {
      window.exportBoardFormat(bId, 'json');
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

    window.togglePlan = function(bId, itemId) {
      fetch('api/boards/' + bId + '/items/' + itemId + '/toggle', { method: 'PATCH' })
        .then(r => {
          if (!r.ok) throw new Error('Toggle failed');
          return r.json();
        })
        .then(() => {
          loadSpaView('board', bId);
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };

    window.handleDeleteItem = function(bId, itemId) {
      const row = document.querySelector('[data-item-id="' + itemId + '"]');
      const titleEl = row ? row.querySelector('.tri-item-title') : null;
      if (titleEl && titleEl.dataset.editing === 'true') {
        if (window._activeCancelEdit) {
          window._activeCancelEdit();
          return;
        }
      }
      if (!window.showModernConfirm) return;
      window.showModernConfirm({
        title: 'Remove Item',
        message: 'Remove this item from the board blueprint?',
        confirmText: 'Remove',
        confirmVariant: 'destructive',
        onConfirm: () => {
          fetch('api/boards/' + bId)
            .then(r => r.json())
            .then(board => {
              const items = (board.items || []).filter(i => i.id !== itemId).map(i => ({
                id: i.id, title: i.title, description: i.description || '', category: i.category,
                targetDate: i.targetDate, weight: Number(i.weight) || 0, progressPercent: Number(i.progressPercent) || 0,
                status: i.status || 'PENDING', priority: i.priority || 'MEDIUM', targetQtr: i.targetQtr || null,
                plansCount: Number(i.plansCount) || 0
              }));
              return fetch('api/boards/' + bId + '/items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
              });
            })
            .then(() => {
              if (window.astryxToast) window.astryxToast('Item removed', 'info');
              loadSpaView('board', bId);
            });
        }
      });
    };

    window.handleNotesChange = function(bId, notes) {
      const counter = document.getElementById('boardNotesCounter');
      if (counter) counter.textContent = (notes ? notes.length : 0) + ' chars';

      const statusText = document.getElementById('boardNotesStatusText');
      const beacon = document.querySelector('.board-notes-beacon');
      if (statusText) statusText.textContent = 'Saving...';
      if (beacon) beacon.classList.add('saving');

      clearTimeout(window.boardNotesTimeout);
      window.boardNotesTimeout = setTimeout(() => {
        fetch('api/boards/' + bId + '/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        }).then(() => {
          if (statusText) statusText.textContent = 'Auto-saved';
          if (beacon) beacon.classList.remove('saving');
          if (window.astryxToast) window.astryxToast('Notes auto-saved', 'info');
        }).catch(() => {
          if (statusText) statusText.textContent = 'Save failed';
          if (beacon) beacon.classList.remove('saving');
        });
      }, 600);
    };

    window.handleCloneBoard = function(bId) {
      fetch('api/boards/' + bId + '/clone', { method: 'POST' })
        .then(r => r.json())
        .then(newBoard => {
          if (window.astryxToast) window.astryxToast('Board duplicated successfully', 'success');
          navigateSpa('board', newBoard.id);
        });
    };

    window.handleDeleteBoard = function(bId) {
      if (!window.showModernConfirm) return;
      window.showModernConfirm({
        title: 'Delete Draft Board',
        message: 'Permanently remove this goal board and all milestones?',
        confirmText: 'Delete Board',
        confirmVariant: 'destructive',
        onConfirm: () => {
          fetch('api/boards/' + bId, { method: 'DELETE' })
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

    window.cycleItemPriority = function(bId, itemId, badgeEl) {
      if (!badgeEl || badgeEl.dataset.cycling === 'true') return;
      badgeEl.dataset.cycling = 'true';

      const currentPrio = (badgeEl.textContent || '').trim().toUpperCase();
      const nextMap = { CRITICAL: 'MEDIUM', MEDIUM: 'LOW', LOW: 'CRITICAL' };
      const nextPrio = nextMap[currentPrio] || 'CRITICAL';
      const prevText = badgeEl.textContent;
      const prevClass = badgeEl.className;

      // Optimistic update badge appearance
      badgeEl.textContent = nextPrio;
      badgeEl.classList.remove('badge-critical', 'badge-medium', 'badge-low');
      badgeEl.classList.add(nextPrio === 'CRITICAL' ? 'badge-critical' : (nextPrio === 'LOW' ? 'badge-low' : 'badge-medium'));

      // If in column 2 (Skill Gaps), dynamically update header pill counters
      const gapCard = badgeEl.closest('.tri-deck-card');
      if (gapCard && gapCard.querySelector('.tri-deck-header.red')) {
        const allBadges = Array.from(gapCard.querySelectorAll('.tri-item-row .tri-badge'));
        const crit = allBadges.filter(b => b.textContent.trim().toUpperCase() === 'CRITICAL').length;
        const med = allBadges.filter(b => b.textContent.trim().toUpperCase() === 'MEDIUM').length;
        const low = allBadges.filter(b => b.textContent.trim().toUpperCase() === 'LOW').length;
        const pill = gapCard.querySelector('.tri-deck-pill');
        if (pill) pill.innerHTML = crit + ' Critical &bull; ' + med + ' Medium &bull; ' + low + ' Low';
      }

      fetch('api/boards/' + bId + '/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPrio })
      })
      .then(r => {
        if (!r.ok) throw new Error('Failed to update priority');
        if (window.astryxToast) window.astryxToast('Priority changed to ' + nextPrio, 'info');
      })
      .catch(err => {
        badgeEl.textContent = prevText;
        badgeEl.className = prevClass;
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      })
      .finally(() => {
        delete badgeEl.dataset.cycling;
      });
    };

    window.startItemTitleEdit = function(bId, itemId, titleEl) {
      if (!titleEl || titleEl.dataset.editing === 'true') return;
      titleEl.dataset.editing = 'true';

      const originalTitle = (titleEl.textContent || '').trim();
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'tri-item-title-input';
      input.value = originalTitle;
      input.maxLength = 120;

      const wrap = document.createElement('div');
      wrap.className = 'tri-edit-pane-wrap';
      wrap.style.position = 'relative';
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.width = '100%';

      const dropdown = document.createElement('div');
      dropdown.className = 'tri-suggestions-dropdown';
      dropdown.style.display = 'none';

      titleEl.style.display = 'none';
      titleEl.parentNode.insertBefore(wrap, titleEl.nextSibling);
      wrap.appendChild(input);
      wrap.appendChild(dropdown);
      input.focus();
      input.select();

      if (window.initLiveSuggestions) {
        window.initLiveSuggestions(input, dropdown, {
          onSelect: function(item) {
            input.value = item.title;
            completeEdit(false);
          }
        });
      }

      let finished = false;
      const completeEdit = function(cancelled) {
        if (finished) return;
        finished = true;
        window._activeCancelEdit = null;
        const newTitle = input.value.trim();
        wrap.remove();
        titleEl.style.display = '';
        delete titleEl.dataset.editing;

        if (cancelled || !newTitle || newTitle === originalTitle) {
          if (!cancelled && !newTitle && window.astryxToast) {
            window.astryxToast('Title cannot be empty', 'warning');
          }
          return;
        }

        titleEl.textContent = newTitle;

        fetch('api/boards/' + bId + '/items/' + itemId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        })
        .then(r => {
          if (!r.ok) throw new Error('Failed to update title');
          if (window.astryxToast) window.astryxToast('Item title updated', 'success');
        })
        .catch(err => {
          titleEl.textContent = originalTitle;
          if (window.astryxToast) window.astryxToast(err.message, 'error');
        });
      };
      window._activeCancelEdit = function() { completeEdit(true); };

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          completeEdit(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          completeEdit(true);
        }
      });

      input.addEventListener('blur', function() {
        setTimeout(function() { completeEdit(false); }, 180);
      });
    };
  `;
}
