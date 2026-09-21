/**
 * Individual Goal Center - Board Live Suggestions Runtime Script (2026 LTS)
 * Real-time organization-wide suggestions for skills, gaps, and training plans.
 * Provides debounced search, keyboard navigation (Up/Down/Enter/Esc), and category awareness.
 * Zero Emojis and Zero Browser Defaults compliant.
 * @requirements [HLR-UI-201] [LLR-GOALS-001] [LLR-GOALS-002]
 */

export function getBoardSuggestionsScript(): string {
  return `
    (function() {
      const categoryMeta = {
        CORE_SKILL: { label: 'Key Skill', class: 'core', selectLabel: '1. Key Skills: Core / Technical Skill' },
        STRATEGIC_SKILL: { label: 'Strategic Skill', class: 'strategic', selectLabel: '1. Key Skills: Transformation / Strategic Skill' },
        SKILL_GAP: { label: 'Skill Gap', class: 'gap', selectLabel: '2. Skill Gaps: Identified Gap' },
        STRATEGIC_PLAN: { label: 'Strategic Plan', class: 'plan', selectLabel: '3. Training Plans: Strategic Plan' },
        TACTICAL_PLAN: { label: 'Tactical Plan', class: 'plan', selectLabel: '3. Training Plans: Tactical Plan' },
        DELIVERABLE: { label: 'Deliverable', class: 'core', selectLabel: '1. Key Skills: Core / Technical Skill' },
        METRIC: { label: 'Metric', class: 'strategic', selectLabel: '1. Key Skills: Transformation / Strategic Skill' },
        LEARNING: { label: 'Training Plan', class: 'plan', selectLabel: '3. Training Plans: Strategic Plan' }
      };

      function escapeText(str) {
        return (str || '').replace(/[&<>"']/g, function(m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
      }

      window.initLiveSuggestions = function(inputEl, dropdownEl, options) {
        if (!inputEl || !dropdownEl) return;
        options = options || {};
        let debounceTimer = null;
        let activeIdx = -1;
        let currentSuggestions = [];

        function renderDropdown(items) {
          currentSuggestions = items || [];
          activeIdx = -1;
          if (!currentSuggestions.length) {
            dropdownEl.innerHTML = '<div class="tri-suggestion-hint"><span>No existing skills in db. Type your own.</span></div>';
            dropdownEl.style.display = 'flex';
            return;
          }

          let html = '<div class="tri-suggestion-hint"><span>Org Live Suggestions (' + currentSuggestions.length + ')</span><span>↵ to select</span></div>';
          currentSuggestions.forEach(function(item, idx) {
            const meta = categoryMeta[item.category] || { label: item.category || 'Skill', class: 'core' };
            html += '<div class="tri-suggestion-item" data-idx="' + idx + '">' +
              '<span class="tri-suggestion-title">' + escapeText(item.title) + '</span>' +
              '<span class="tri-suggestion-badge ' + meta.class + '">' + escapeText(meta.label) + '</span>' +
              '<span class="tri-suggestion-count">' + (item.usageCount || 1) + 'x in org</span>' +
            '</div>';
          });
          dropdownEl.innerHTML = html;
          dropdownEl.style.display = 'flex';

          const itemEls = dropdownEl.querySelectorAll('.tri-suggestion-item');
          itemEls.forEach(function(el) {
            el.addEventListener('mousedown', function(e) {
              e.preventDefault();
              e.stopPropagation();
              const idx = parseInt(el.getAttribute('data-idx'), 10);
              chooseSuggestion(currentSuggestions[idx]);
            });
          });
        }

        function chooseSuggestion(item) {
          if (!item) return;
          inputEl.value = item.title;
          if (options.onSelect) {
            options.onSelect(item);
          }
          if (options.syncCategorySelect && window.selectModernOption && item.category) {
            const meta = categoryMeta[item.category];
            if (meta && meta.selectLabel) {
              window.selectModernOption(options.syncCategorySelect, item.category, meta.selectLabel);
            }
          }
          closeDropdown();
        }

        function closeDropdown() {
          dropdownEl.style.display = 'none';
          dropdownEl.innerHTML = '';
          currentSuggestions = [];
          activeIdx = -1;
        }

        function updateActiveHighlight() {
          const itemEls = dropdownEl.querySelectorAll('.tri-suggestion-item');
          itemEls.forEach(function(el, i) {
            if (i === activeIdx) {
              el.classList.add('active');
              el.scrollIntoView({ block: 'nearest' });
            } else {
              el.classList.remove('active');
            }
          });
        }

        function queryLive(query) {
          const cat = options.getCategory ? options.getCategory() : '';
          const url = 'api/suggestions?q=' + encodeURIComponent(query || '') + (cat ? '&category=' + encodeURIComponent(cat) : '');
          fetch(url)
            .then(function(r) { return r.ok ? r.json() : []; })
            .then(function(data) {
              if (inputEl === document.activeElement) {
                renderDropdown(data);
              }
            })
            .catch(function() {
              closeDropdown();
            });
        }

        inputEl.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          const q = inputEl.value.trim();
          if (!q) {
            closeDropdown();
            return;
          }
          debounceTimer = setTimeout(function() {
            queryLive(q);
          }, 160);
        });

        inputEl.addEventListener('focus', function() {
          const q = inputEl.value.trim();
          if (q) {
            queryLive(q);
          }
        });

        inputEl.addEventListener('keydown', function(e) {
          if (dropdownEl.style.display !== 'flex' || !currentSuggestions.length) {
            if (e.key === 'ArrowDown' && !inputEl.value.trim()) {
              e.preventDefault();
              queryLive('');
            }
            return;
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = (activeIdx + 1) % currentSuggestions.length;
            updateActiveHighlight();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = (activeIdx - 1 + currentSuggestions.length) % currentSuggestions.length;
            updateActiveHighlight();
          } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && activeIdx < currentSuggestions.length) {
              e.preventDefault();
              chooseSuggestion(currentSuggestions[activeIdx]);
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeDropdown();
          }
        });

        document.addEventListener('click', function(e) {
          if (!dropdownEl.contains(e.target) && e.target !== inputEl) {
            closeDropdown();
          }
        });
      };

      window.setupQuickAddSuggestions = function() {
        const input = document.getElementById('quickAddTitleInput');
        const dropdown = document.getElementById('quickAddSuggestionsDropdown');
        if (input && dropdown && !input.dataset.suggestionsBound) {
          input.dataset.suggestionsBound = 'true';
          window.initLiveSuggestions(input, dropdown, {
            syncCategorySelect: 'quickAddCategorySelect',
            getCategory: function() {
              const hidden = document.querySelector('#quickAddCategorySelect input[type="hidden"]');
              return hidden ? hidden.value : '';
            }
          });
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.setupQuickAddSuggestions);
      } else {
        window.setupQuickAddSuggestions();
      }
    })();
  `;
}
