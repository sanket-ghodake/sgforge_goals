import { icons } from '../../lib/icons';
import { escapeHtml } from '../../lib/ui';
import type { AuthUser, GoalBoard } from '../../lib/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function getAvatarGradient(name: string): string {
  const gradients = ['linear-gradient(135deg, #ec4899, #8b5cf6)', 'linear-gradient(135deg, #3b82f6, #06b6d4)', 'linear-gradient(135deg, #f59e0b, #ef4444)', 'linear-gradient(135deg, #10b981, #3b82f6)', 'linear-gradient(135deg, #8b5cf6, #6366f1)'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * renderExploreView - Renders the organizational Org Impact Directory board discovery tab
 * @requirements [HLR-UI-201] [LLR-EXPLORE-001]
 */
export function renderExploreView(user: AuthUser, boards: GoalBoard[]): string {
  const publicBoards = boards.filter(b => b.status === 'SUBMITTED' || b.status === 'APPROVED' || b.status === 'COMPLETED' || b.ownerId === user.id);
  const departments = Array.from(new Set(publicBoards.map(b => b.ownerDepartment).filter(Boolean))).sort();
  const cycles = Array.from(new Set(publicBoards.map(b => b.cycle).filter(Boolean))).sort();

  const totalBoards = publicBoards.length;
  const totalSquads = departments.length;
  const approvedCount = publicBoards.filter(b => b.status === 'APPROVED' || b.status === 'COMPLETED').length;
  const inReviewCount = publicBoards.filter(b => b.status === 'SUBMITTED').length;

  const deptCounts = departments.map(d => ({
    name: d,
    count: publicBoards.filter(b => b.ownerDepartment === d).length,
    percent: Math.round((publicBoards.filter(b => b.ownerDepartment === d).length / (totalBoards || 1)) * 100),
  }));

  return `
    <div style="margin-bottom: 24px;">
      <!-- Page Header with Search Bar Placed Right Next to 3-Tab Switcher -->
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 1.65rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px;">Org Impact Directory</h1>
          <p style="color: var(--forge-text-muted); font-size: 0.875rem;">Organization-wide transparency. Explore and track impact boards across all squads.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="position: relative; width: 240px;">
            <input id="exploreSearchInput" type="text" oninput="window.filterExploreBoards && window.filterExploreBoards()" placeholder="Global search across boards..." style="width: 100%; height: 38px; border-radius: 12px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px 0 34px; font-size: 0.825rem;" />
            <span style="position: absolute; left: 11px; top: 11px; color: var(--forge-text-muted); display: flex;">${icons.search}</span>
          </div>

          <div class="segmented-nav">
            <button id="tabBtnOverview" class="segmented-nav-btn active" onclick="window.switchExploreTab && window.switchExploreTab('overview', this)">${icons.activity} Impact Overview</button>
            <button id="tabBtnTable" class="segmented-nav-btn" onclick="window.switchExploreTab && window.switchExploreTab('table', this)">${icons.layers} Table View</button>
            <button id="tabBtnGrid" class="segmented-nav-btn" onclick="window.switchExploreTab && window.switchExploreTab('grid', this)">${icons.target} Grid View</button>
          </div>
        </div>
      </div>

      <!-- TAB 1: IMPACT OVERVIEW -->
      <div id="exploreOverviewView">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="luxe-hud-card"><div class="luxe-metric-label"><span>Total Org Boards</span><span style="color: var(--forge-primary);">${icons.compass}</span></div><div class="luxe-metric-val">${totalBoards}</div><div style="font-size: 0.75rem; color: var(--forge-text-muted);">Active org framework cards</div></div>
          <div class="luxe-hud-card"><div class="luxe-metric-label"><span>Active Squads</span><span style="color: var(--forge-accent);">${icons.layers}</span></div><div class="luxe-metric-val">${totalSquads}</div><div style="font-size: 0.75rem; color: var(--forge-text-muted);">Cross-functional departments</div></div>
          <div class="luxe-hud-card"><div class="luxe-metric-label"><span>Approved & Sealed</span><span style="color: var(--forge-success);">${icons.check}</span></div><div class="luxe-metric-val" style="color: var(--forge-success);">${approvedCount}</div><div style="font-size: 0.75rem; color: var(--forge-text-muted);">Formally verified targets</div></div>
          <div class="luxe-hud-card"><div class="luxe-metric-label"><span>In Review Queue</span><span style="color: var(--forge-warning);">${icons.shieldAlert}</span></div><div class="luxe-metric-val" style="color: var(--forge-warning);">${inReviewCount}</div><div style="font-size: 0.75rem; color: var(--forge-text-muted);">Awaiting manager sign-off</div></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px;">
          <div class="luxe-hud-card" style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"><h3 style="font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">${icons.layers} Board Count by Squad</h3><span class="luxe-tag">${totalSquads} Squads</span></div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${deptCounts.map(d => `<div><div style="display: flex; justify-content: space-between; font-size: 0.825rem; margin-bottom: 6px;"><span style="font-weight: 600; color: var(--forge-text-main);">${escapeHtml(d.name)}</span><span style="color: var(--forge-text-muted); font-family: var(--font-mono);">${d.count} boards (${d.percent}%)</span></div><div style="width: 100%; height: 6px; border-radius: 9999px; background: rgba(255,255,255,0.06); overflow: hidden;"><div style="width: ${d.percent}%; height: 100%; border-radius: 9999px; background: linear-gradient(90deg, var(--forge-primary), var(--forge-accent));"></div></div></div>`).join('')}
            </div>
          </div>
          <div class="luxe-hud-card" style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"><h3 style="font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">${icons.target} Review Status & Cycle Distribution</h3><span class="luxe-tag">${totalBoards} Cards Total</span></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px;"><div style="font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 4px;">Approved Ratio</div><div style="font-size: 1.4rem; font-weight: 700; color: var(--forge-success);">${Math.round((approvedCount / (totalBoards || 1)) * 100)}%</div></div>
              <div style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px;"><div style="font-size: 0.75rem; color: var(--forge-text-muted); margin-bottom: 4px;">Active Cycles</div><div style="font-size: 1.4rem; font-weight: 700; color: var(--forge-primary);">${cycles.length}</div></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--forge-border);"><span style="font-size: 0.8rem; color: var(--forge-text-muted);">Ready to inspect data grid?</span><button class="btn-action btn-primary" onclick="window.switchExploreTab && window.switchExploreTab('table', document.getElementById('tabBtnTable'))" style="height: 32px; font-size: 0.775rem;">Open Table View ${icons.arrowRight}</button></div>
          </div>
        </div>
      </div>

      <!-- TAB 2: DEVELOPER-FRIENDLY CLEAN TABLE VIEW (3 Core Data Columns + Action) -->
      <div id="exploreTableView" style="display: none;">
        <div class="explore-table-card">
          <div class="explore-table-wrapper">
            <table class="explore-table">
              <thead>
                <tr>
                  <th style="padding: 16px 20px;">User Name</th>
                  <th style="padding: 16px 20px;">Board Name</th>
                  <th style="padding: 16px 20px;">Manager Name</th>
                  <th style="padding: 16px 20px; text-align: right; width: 140px;">Action</th>
                </tr>
              </thead>
              <tbody id="exploreTableBody">
                ${publicBoards.map((b, idx) => {
                  const safeTitle = escapeHtml(b.title);
                  const safeOwner = escapeHtml(b.ownerName);
                  const safeDept = escapeHtml(b.ownerDepartment);
                  const safeProject = escapeHtml(b.projectName || 'General Project');
                  const safeManager = escapeHtml(b.managerName || b.approvedBy || 'Sarah Connor');
                  const initials = getInitials(b.ownerName);
                  const avatarGradient = getAvatarGradient(b.ownerName);

                  return `
                    <tr class="explore-table-row" data-index="${idx}" data-title="${safeTitle.toLowerCase()}" data-owner="${safeOwner.toLowerCase()}" data-project="${safeProject.toLowerCase()}" data-manager="${safeManager.toLowerCase()}">
                      <td style="padding: 16px 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarGradient}; color: #ffffff; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.25); flex-shrink: 0;">${initials}</div>
                          <div>
                            <div style="font-weight: 700; color: var(--forge-text-main); font-size: 0.875rem;">${safeOwner}</div>
                            <div style="font-size: 0.75rem; color: var(--forge-text-subtle);">${safeDept}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding: 16px 20px;">
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                          <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" style="color: var(--forge-text-main); font-weight: 700; text-decoration: none; font-size: 0.9rem;" onmouseover="this.style.color='var(--forge-primary)'" onmouseout="this.style.color='var(--forge-text-main)'">${safeTitle}</a>
                          <span style="font-size: 0.75rem; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 4px;">${icons.folder} ${safeProject}</span>
                        </div>
                      </td>
                      <td style="padding: 16px 20px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: var(--forge-accent); font-size: 0.85rem;">${icons.user}</span>
                          <span style="font-weight: 600; color: var(--forge-text-main); font-size: 0.85rem;">${safeManager}</span>
                        </div>
                      </td>
                      <td style="padding: 16px 20px; text-align: right;">
                        <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" class="btn-action btn-primary" style="height: 32px; font-size: 0.775rem; padding: 0 14px;">
                          Open Board ${icons.arrowRight}
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Dynamic SPA Multi-Page Table Footer Pagination -->
          <div style="padding: 16px 24px; border-top: 1px solid var(--forge-border); background: rgba(255,255,255,0.01); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--forge-text-muted); flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>Rows per page:</span>
              <select id="pageSizeSelect" class="db-col-filter" style="width: 70px; height: 32px;" onchange="window.changePageSize && window.changePageSize(this.value)">
                <option value="5" selected>5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
            </div>

            <div id="tablePaginationControls" style="display: flex; align-items: center; gap: 6px;">
              <!-- Dynamically rendered SPA page buttons -->
            </div>

            <div id="tableStatusText">
              Showing 1-5 of ${totalBoards} boards
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: GRID CARD VIEW -->
      <div id="exploreGridView" style="display: none; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${publicBoards.map(b => {
          const safeTitle = escapeHtml(b.title);
          const safeOwner = escapeHtml(b.ownerName);
          const safeDept = escapeHtml(b.ownerDepartment);
          const safeProject = escapeHtml(b.projectName || 'General Project');
          const initials = getInitials(b.ownerName);
          const avatarGradient = getAvatarGradient(b.ownerName);
          return `
            <div class="explore-board-card luxe-hud-card" data-title="${safeTitle.toLowerCase()}" data-owner="${safeOwner.toLowerCase()}" data-project="${safeProject.toLowerCase()}" style="display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <span style="font-size: 0.75rem; font-weight: 600; color: var(--forge-primary); display: inline-flex; align-items: center; gap: 6px;">${icons.folder} ${safeProject}</span>
                <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.06); color: var(--forge-text-muted); font-weight: 600;">${escapeHtml(b.cycle)}</span>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px;"><a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" style="color: var(--forge-text-main); text-decoration: none;">${safeTitle}</a></h3>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: ${avatarGradient}; color: #ffffff; font-weight: 700; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">${initials}</div>
                <div style="font-size: 0.8rem; color: var(--forge-text-muted);">By <strong style="color: var(--forge-text-main);">${safeOwner}</strong> &bull; ${safeDept}</div>
              </div>
              <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--forge-border); display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <a href="?tab=board&id=${b.id}" onclick="navigateSpa('board', '${b.id}', event)" class="btn-action btn-outline" style="height: 28px; font-size: 0.75rem; padding: 0 8px;">Explore Canvas ${icons.arrowRight}</a>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Zero Results State Container -->
      <div id="exploreZeroState" style="display: none; padding: 48px 24px; text-align: center; background: var(--forge-bg-card); border: 1px dashed var(--forge-border); border-radius: 16px; margin-top: 20px;">
        <div style="font-size: 2rem; color: var(--forge-text-muted); margin-bottom: 8px;">${icons.search}</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">No matching boards found</h3>
        <p style="font-size: 0.85rem; color: var(--forge-text-muted);">Try adjusting your search query.</p>
      </div>
    </div>

    <script>
      (function() {
        let activeTab = 'overview';
        let currentPage = 1;
        let pageSize = 5;

        window.switchExploreTab = function(tabId, btn) {
          activeTab = tabId;
          const overviewV = document.getElementById('exploreOverviewView');
          const tableV = document.getElementById('exploreTableView');
          const gridV = document.getElementById('exploreGridView');

          document.querySelectorAll('.segmented-nav-btn').forEach(b => b.classList.remove('active'));
          if (btn) btn.classList.add('active');

          if (overviewV) overviewV.style.display = tabId === 'overview' ? 'block' : 'none';
          if (tableV) tableV.style.display = tabId === 'table' ? 'block' : 'none';
          if (gridV) gridV.style.display = tabId === 'grid' ? 'grid' : 'none';

          if (tabId === 'table' || tabId === 'grid') {
            window.filterExploreBoards();
          }
        };

        window.changePageSize = function(size) {
          pageSize = parseInt(size, 10) || 5;
          currentPage = 1;
          window.filterExploreBoards();
        };

        window.goToPage = function(p) {
          currentPage = p;
          window.filterExploreBoards();
        };

        window.filterExploreBoards = function() {
          const globalQuery = (document.getElementById('exploreSearchInput')?.value || '').toLowerCase();
          const rows = Array.from(document.querySelectorAll('.explore-table-row'));
          const cards = Array.from(document.querySelectorAll('.explore-board-card'));

          const matchingRows = rows.filter(row => {
            const title = row.dataset.title || '';
            const owner = row.dataset.owner || '';
            const proj = row.dataset.project || '';
            const manager = row.dataset.manager || '';
            return !globalQuery || title.includes(globalQuery) || owner.includes(globalQuery) || proj.includes(globalQuery) || manager.includes(globalQuery);
          });

          cards.forEach(card => {
            const title = card.dataset.title || '';
            const owner = card.dataset.owner || '';
            const proj = card.dataset.project || '';
            card.style.display = !globalQuery || title.includes(globalQuery) || owner.includes(globalQuery) || proj.includes(globalQuery) ? 'flex' : 'none';
          });

          const totalMatching = matchingRows.length;
          const totalPages = Math.ceil(totalMatching / pageSize) || 1;
          if (currentPage > totalPages) currentPage = totalPages;
          if (currentPage < 1) currentPage = 1;

          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, totalMatching);

          rows.forEach(row => { row.style.display = 'none'; });
          matchingRows.slice(startIndex, endIndex).forEach(row => { row.style.display = ''; });

          // Render Dynamic Pagination Controls
          const paginationControls = document.getElementById('tablePaginationControls');
          if (paginationControls) {
            let btnsHtml = '<button class="btn-icon" style="width: 30px; height: 30px;" ' + (currentPage === 1 ? 'disabled' : 'onclick="window.goToPage(1)"') + '>${icons.arrowLeft}</button>';
            
            for (let i = 1; i <= totalPages; i++) {
              if (i === currentPage) {
                btnsHtml += '<span style="font-weight: 700; color: #ffffff; background: var(--forge-primary); width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem;">' + i + '</span>';
              } else {
                btnsHtml += '<button class="btn-icon" style="width: 30px; height: 30px; font-size: 0.8rem;" onclick="window.goToPage(' + i + ')">' + i + '</button>';
              }
            }

            btnsHtml += '<button class="btn-icon" style="width: 30px; height: 30px;" ' + (currentPage === totalPages ? 'disabled' : 'onclick="window.goToPage(' + totalPages + ')"') + '>${icons.arrowRight}</button>';
            paginationControls.innerHTML = btnsHtml;
          }

          const statusText = document.getElementById('tableStatusText');
          if (statusText) {
            statusText.innerText = totalMatching === 0 ? '0 matching boards' : 'Showing ' + (startIndex + 1) + '-' + endIndex + ' of ' + totalMatching + ' boards';
          }

          const zeroState = document.getElementById('exploreZeroState');
          if (zeroState) {
            zeroState.style.display = totalMatching === 0 && (activeTab === 'table' || activeTab === 'grid') ? 'block' : 'none';
          }
        };
      })();
    </script>
  `;
}
