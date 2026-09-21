/**
 * Individual Goal Center - Board Gap-Plan Linking Runtime Script (2026 LTS)
 * Client runtime for interactive linking between Skill Gaps and Training Plans.
 * Renders candidate selection with real-time API sync and zero browser defaults.
 * @requirements [HLR-UI-201] [LLR-GOALS-001] [LLR-GOALS-002]
 */

export function getBoardLinkScript(): string {
  return `
    window.openLinkGapPlanModal = function(boardId, itemId, type, triggerEl) {
      const modal = document.getElementById('linkGapPlanModal');
      if (!modal) return;

      const heading = document.getElementById('linkModalHeading');
      const subType = document.getElementById('linkModalSubjectType');
      const subTitle = document.getElementById('linkModalSubjectTitle');
      const countEl = document.getElementById('linkModalCandidatesCount');
      const container = document.getElementById('linkModalCandidatesContainer');

      if (!container) return;
      container.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--forge-text-muted); font-size: 0.82rem;">Loading candidates...</div>';

      function positionPopover() {
        if (!triggerEl) {
          modal.style.position = 'fixed';
          modal.style.top = '50%';
          modal.style.left = '50%';
          modal.style.transform = 'translate(-50%, -50%)';
          modal.style.display = 'flex';
          return;
        }

        modal.style.position = 'fixed';
        modal.style.transform = 'none';

        const rect = triggerEl.getBoundingClientRect();
        const pad = 12;
        const popWidth = Math.min(380, window.innerWidth - pad * 2);
        modal.style.width = popWidth + 'px';

        modal.style.visibility = 'hidden';
        modal.style.display = 'flex';
        const popHeight = modal.offsetHeight || 320;
        modal.style.visibility = 'visible';

        // In-window clamping: horizontally
        let left = rect.left;
        if (left + popWidth > window.innerWidth - pad) {
          left = rect.right - popWidth;
        }
        if (left + popWidth > window.innerWidth - pad) {
          left = window.innerWidth - popWidth - pad;
        }
        if (left < pad) left = pad;

        // In-window clamping: vertically
        let top = rect.bottom + 6;
        if (top + popHeight > window.innerHeight - pad) {
          const topAbove = rect.top - popHeight - 6;
          if (topAbove >= pad) {
            top = topAbove;
          } else {
            top = Math.max(pad, window.innerHeight - popHeight - pad);
          }
        }
        if (top < pad) top = pad;

        modal.style.left = Math.round(left) + 'px';
        modal.style.top = Math.round(top) + 'px';
      }

      positionPopover();

      function onOutside(e) {
        if (!modal.contains(e.target) && (!triggerEl || !triggerEl.contains(e.target))) {
          window.closeLinkGapPlanModal();
        }
      }
      function onKey(e) {
        if (e.key === 'Escape') {
          window.closeLinkGapPlanModal();
        }
      }

      if (window._activeLinkOutsideHandler) {
        document.removeEventListener('pointerdown', window._activeLinkOutsideHandler);
        document.removeEventListener('keydown', window._activeLinkKeyHandler);
      }
      window._activeLinkOutsideHandler = onOutside;
      window._activeLinkKeyHandler = onKey;
      setTimeout(function() {
        document.addEventListener('pointerdown', onOutside);
        document.addEventListener('keydown', onKey);
      }, 30);

      fetch('api/boards/' + boardId)
        .then(function(r) { return r.json(); })
        .then(function(board) {
          const items = board.items || [];
          const subject = items.find(function(i) { return i.id === itemId; });
          if (!subject) {
            container.innerHTML = '<div style="color: var(--forge-error); font-size: 0.85rem; padding: 10px;">Item not found.</div>';
            return;
          }

          function escapeText(s) {
            return (s || '').replace(/[&<>"']/g, function(m) {
              return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
          }

          function toggleLink(bId, gapId, planId) {
            return fetch('api/boards/' + bId + '/links', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gapId: gapId, planId: planId })
            })
            .then(function(r) {
              if (!r.ok) throw new Error('Failed to update link');
              if (window.astryxToast) window.astryxToast('Milestone link updated', 'success');
            })
            .catch(function(err) {
              if (window.astryxToast) window.astryxToast(err.message, 'error');
            });
          }

          function renderCandidates(list, linkedSet, onToggle) {
            let html = '';
            list.forEach(function(cand) {
              const isLinked = linkedSet.has(cand.id);
              const prio = (cand.priority || 'MEDIUM').toUpperCase();
              const prioClass = prio === 'CRITICAL' ? 'badge-critical' : (prio === 'LOW' ? 'badge-low' : 'badge-medium');
              html += '<div class="link-candidate-item ' + (isLinked ? 'linked' : '') + '" data-candidate-id="' + cand.id + '">' +
                '<div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">' +
                  '<input type="checkbox" style="accent-color: var(--forge-primary); width: 15px; height: 15px; cursor: pointer; flex-shrink: 0;" ' + (isLinked ? 'checked' : '') + ' />' +
                  '<span class="tri-badge ' + prioClass + '" style="font-size: 0.65rem; padding: 1px 6px;">' + prio + '</span>' +
                  '<span style="font-size: 0.84rem; font-weight: 600; color: var(--forge-text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeText(cand.title) + '</span>' +
                '</div>' +
                '<span style="font-size: 0.68rem; color: var(--forge-text-muted); padding: 1px 6px; border-radius: 4px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); flex-shrink: 0;">' +
                  (cand.category === 'SKILL_GAP' ? 'Gap' : (cand.targetQtr || 'Plan')) +
                '</span>' +
              '</div>';
            });
            container.innerHTML = html;

            const rowEls = container.querySelectorAll('.link-candidate-item');
            rowEls.forEach(function(row) {
              const candId = row.getAttribute('data-candidate-id');
              const cb = row.querySelector('input[type="checkbox"]');

              row.addEventListener('click', function(e) {
                if (e.target !== cb) {
                  cb.checked = !cb.checked;
                }
                const nextChecked = cb.checked;
                if (nextChecked) {
                  row.classList.add('linked');
                  linkedSet.add(candId);
                } else {
                  row.classList.remove('linked');
                  linkedSet.delete(candId);
                }
                onToggle(candId, nextChecked);
              });
            });

            positionPopover();
          }

          if (type === 'GAP') {
            if (heading) heading.textContent = 'Link Training Plans';
            if (subType) subType.textContent = 'Skill Gap';
            if (subTitle) subTitle.textContent = subject.title + ' (' + (subject.priority || 'LOW') + ')';
            
            const candidates = items.filter(function(i) {
              return i.category === 'STRATEGIC_PLAN' || i.category === 'TACTICAL_PLAN' || i.category === 'LEARNING';
            });
            const linkedIds = new Set(subject.linkedPlanIds || []);

            if (countEl) countEl.textContent = candidates.length + ' Training Plan(s)';

            if (!candidates.length) {
              container.innerHTML = '<div style="padding: 14px; text-align: center; color: var(--forge-text-muted); font-size: 0.8rem; border: 1px dashed var(--forge-border); border-radius: 8px;">No training plans on board yet.</div>';
              positionPopover();
              return;
            }

            renderCandidates(candidates, linkedIds, function(candidateId) {
              return toggleLink(boardId, subject.id, candidateId);
            });
          } else {
            if (heading) heading.textContent = 'Link Skill Gaps';
            if (subType) subType.textContent = 'Training Plan';
            if (subTitle) subTitle.textContent = subject.title + ' (' + (subject.priority || 'MEDIUM') + ')';

            const candidates = items.filter(function(i) {
              return i.category === 'SKILL_GAP';
            });
            const linkedIds = new Set(subject.linkedGapIds || []);

            if (countEl) countEl.textContent = candidates.length + ' Identified Skill Gap(s)';

            if (!candidates.length) {
              container.innerHTML = '<div style="padding: 14px; text-align: center; color: var(--forge-text-muted); font-size: 0.8rem; border: 1px dashed var(--forge-border); border-radius: 8px;">No skill gaps on board yet.</div>';
              positionPopover();
              return;
            }

            renderCandidates(candidates, linkedIds, function(candidateId) {
              return toggleLink(boardId, candidateId, subject.id);
            });
          }
        })
        .catch(function(err) {
          container.innerHTML = '<div style="color: var(--forge-error); font-size: 0.82rem; padding: 10px;">Failed to load items: ' + (err.message || String(err)) + '</div>';
        });
    };

    window.closeLinkGapPlanModal = function() {
      const modal = document.getElementById('linkGapPlanModal');
      if (modal) {
        modal.style.display = 'none';
      }
      if (window._activeLinkOutsideHandler) {
        document.removeEventListener('pointerdown', window._activeLinkOutsideHandler);
        document.removeEventListener('keydown', window._activeLinkKeyHandler);
        window._activeLinkOutsideHandler = null;
        window._activeLinkKeyHandler = null;
      }
      if (window.currentBoardId && typeof window.loadSpaView === 'function') {
        window.loadSpaView('board', window.currentBoardId);
      }
    };
  `;
}
