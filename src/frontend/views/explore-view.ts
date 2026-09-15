/**
 * Individual Goal Center - The Hall of Impact (Tab 4)
 * Org-wide transparent directory enabling cross-team alignment and milestone discovery.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import type { AuthUser, GoalBoard } from '../../lib/types';

export function renderExploreView(user: AuthUser, boards: GoalBoard[]): string {
  return `
    <div style="margin-bottom: 32px;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">The Hall of Impact</h1>
        <p style="color: var(--forge-text-muted); font-size: 0.875rem;">
          Radical transparency across the organization. Discover what cross-functional colleagues are building and align on targets.
        </p>
      </div>

      <!-- Search & Filter Bar -->
      <div style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; position: relative;">
          <input id="exploreSearchInput" type="text" oninput="window.filterExploreBoards && window.filterExploreBoards()" placeholder="Search by colleague name, project, or milestone keywords..." style="width: 100%; height: 38px; border-radius: 6px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border-medium); color: var(--forge-text-main); padding: 0 12px 0 34px; font-size: 0.875rem;" />
          <span style="position: absolute; left: 10px; top: 11px; color: var(--forge-text-muted); display: flex;">${icons.search}</span>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="deptFilterPills">
          <button class="btn-action btn-primary" onclick="window.setDeptFilter && window.setDeptFilter('ALL', this)" style="height: 32px; font-size: 0.75rem;">All Squads</button>
          <button class="btn-action btn-outline" onclick="window.setDeptFilter && window.setDeptFilter('Platform Engineering', this)" style="height: 32px; font-size: 0.75rem;">Platform Engineering</button>
          <button class="btn-action btn-outline" onclick="window.setDeptFilter && window.setDeptFilter('Core Systems', this)" style="height: 32px; font-size: 0.75rem;">Core Systems</button>
          <button class="btn-action btn-outline" onclick="window.setDeptFilter && window.setDeptFilter('Security & SRE', this)" style="height: 32px; font-size: 0.75rem;">Security & SRE</button>
        </div>
      </div>

      <!-- Boards Explorer Grid -->
      <div id="exploreGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${boards.map(b => `
          <div class="explore-board-card" data-title="${b.title.toLowerCase()}" data-owner="${b.ownerName.toLowerCase()}" data-dept="${b.ownerDepartment}" data-project="${(b.projectName || '').toLowerCase()}" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 6px;">
                ${icons.folder} ${b.projectName || 'Project'}
              </span>
              <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.06); color: var(--forge-text-muted); font-weight: 600;">
                ${b.cycle}
              </span>
            </div>

            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 8px;">
              <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${b.title}</a>
            </h3>

            <div style="font-size: 0.8rem; color: var(--forge-text-muted); margin-bottom: 16px;">
              By <strong style="color: var(--forge-text-main);">${b.ownerName}</strong> &bull; ${b.ownerDepartment}
            </div>

            <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: ${b.status === 'APPROVED' ? 'var(--forge-success)' : b.status === 'SUBMITTED' ? 'var(--forge-warning)' : 'var(--forge-text-subtle)'}; font-weight: 600;">
                ${b.status === 'APPROVED' ? icons.award + ' Approved' : b.status === 'SUBMITTED' ? icons.lock + ' Under Review' : icons.unlock + ' Draft'}
              </span>
              <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" class="btn-action btn-outline" style="height: 28px; font-size: 0.75rem;">
                Explore Canvas ${icons.arrowRight}
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <script>
      (function() {
        let activeDept = 'ALL';

        window.setDeptFilter = function(dept, btn) {
          activeDept = dept;
          document.querySelectorAll('#deptFilterPills button').forEach(b => {
            b.className = 'btn-action btn-outline';
          });
          if (btn) btn.className = 'btn-action btn-primary';
          window.filterExploreBoards();
        };

        window.filterExploreBoards = function() {
          const searchInput = document.getElementById('exploreSearchInput');
          const query = (searchInput ? searchInput.value || '' : '').toLowerCase();
          const cards = document.querySelectorAll('.explore-board-card');

          cards.forEach(card => {
            const title = card.dataset.title || '';
            const owner = card.dataset.owner || '';
            const dept = card.dataset.dept || '';
            const proj = card.dataset.project || '';

            const matchesQuery = !query || title.includes(query) || owner.includes(query) || proj.includes(query);
            const matchesDept = activeDept === 'ALL' || dept === activeDept;

            card.style.display = matchesQuery && matchesDept ? 'flex' : 'none';
          });
        };
      })();
    </script>
  `;
}
