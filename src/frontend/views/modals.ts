/**
 * Individual Goal Center - Dialog Modals & Slide-Over Drawers (2026 LTS)
 * Modular UI dialogs for project creation, rework requests, alerts, login, and logout.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { escapeHtml } from '../../lib/ui';
import type { AuthUser, Reminder } from '../../lib/types';

export function renderNewBoardModal(): string {
  return `
  <!-- New Board Modal -->
  <div class="modal-backdrop" id="newBoardModal" onclick="if(event.target === this) closeNewBoardModal()">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Create Project Goal Board</h3>
        <button class="btn-icon" onclick="closeNewBoardModal()">${icons.close}</button>
      </div>

      <form id="newBoardForm" onsubmit="handleCreateBoard(event)">
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Assigned Project</label>
          <select id="boardProjectSelect" class="shadcn-select" required>
            <option value="proj_titan">Project Titan (Core API Gateway)</option>
            <option value="proj_apollo">Project Apollo (Telemetry Agent)</option>
            <option value="proj_hermes">Project Hermes (Edge Storage Fabric)</option>
          </select>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Board Title</label>
          <input id="boardTitleInput" type="text" placeholder="e.g. Q1 Distributed Mesh Resilience" required style="width: 100%; height: 38px; border-radius: 7px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 12px; font-size: 0.875rem;" />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Evaluation Cycle</label>
          <select id="boardCycleSelect" class="shadcn-select" required>
            <option value="2026-Q1">2026-Q1 (Current Active)</option>
            <option value="2026-Q2">2026-Q2 (Upcoming)</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-action btn-outline" onclick="closeNewBoardModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary">${icons.plus} Create Board</button>
        </div>
      </form>
    </div>
  </div>`;
}

export function renderRemindersDrawer(reminders: Reminder[]): string {
  return `
  <!-- Reminders Sub-Header Slide-Over Drawer -->
  <div class="drawer-backdrop" id="remindersDrawer" onclick="if(event.target === this) closeRemindersDrawer()">
    <div class="drawer-pane" style="max-width: 460px;">
      <div class="drawer-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--forge-warning); display: flex; align-items: center;">${icons.bell}</span>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Action Alerts & Reminders</h3>
        </div>
        <button class="btn-icon" onclick="closeRemindersDrawer()">${icons.close}</button>
      </div>

      <div class="drawer-body" id="remindersListContainer">
        ${reminders.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: var(--forge-text-muted); font-size: 0.875rem;">
            ${icons.checkCircle} All caught up! Zero pending actions.
          </div>
        ` : reminders.map(r => `
          <div id="reminder-card-${r.id}" style="background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: ${r.type === 'REWORK_REQUIRED' ? 'var(--forge-warning)' : r.type === 'PENDING_APPROVAL' ? 'var(--forge-primary)' : 'var(--forge-accent)'};">
                ${r.type.replace('_', ' ')}
              </span>
              <button onclick="dismissReminderSpa('${r.id}')" style="background:none; border:none; color:var(--forge-text-muted); cursor:pointer; font-size:0.75rem;">Dismiss</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--forge-text-main); margin-bottom: 8px; line-height: 1.4;">${r.message}</p>
            <a href="?tab=board&id=${r.boardId}" onclick="closeRemindersDrawer(); navigateSpa('board', '${r.boardId}', event)" class="btn-action btn-outline" style="height: 28px; font-size: 0.75rem; padding: 0 10px;">
              View Board ${icons.arrowRight}
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

export function renderReworkModal(): string {
  return `
  <!-- Request Rework Modal Dialog -->
  <div class="modal-backdrop" id="reworkModal" onclick="if(event.target === this) closeReworkModal()">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--forge-warning);">Request Board Revision</h3>
        <button class="btn-icon" onclick="closeReworkModal()">${icons.close}</button>
      </div>

      <p style="font-size: 0.85rem; color: var(--forge-text-muted); margin-bottom: 14px;">
        Providing actionable feedback unlocks the board for the contributor to make revisions.
      </p>

      <form id="reworkForm" onsubmit="submitReworkRequest(event)">
        <input type="hidden" id="reworkBoardId" />
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; color: var(--forge-text-muted);">Revision Guidance & Critique</label>
          <textarea id="reworkCommentText" required rows="4" placeholder="e.g. Please clarify milestone #2 metrics and specify testing tools before final signoff." style="width: 100%; border-radius: 8px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 10px; font-size: 0.875rem;"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-action btn-outline" onclick="closeReworkModal()">Cancel</button>
          <button type="submit" class="btn-action btn-primary" style="background: var(--forge-warning); color: #000; font-weight: 700;">
            ${icons.send} Send Rework Request
          </button>
        </div>
      </form>
    </div>
  </div>`;
}

export function renderLogoutModal(user: AuthUser): string {
  return `
  <!-- Logout Confirmation Modal Dialog -->
  <div class="modal-backdrop" id="logoutModal" onclick="if(event.target === this) closeLogoutModal()">
    <div class="modal-box" style="max-width: 420px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--forge-error); display: flex; align-items: center; gap: 8px;">
          ${icons.logOut} Sign Out of Goal Center
        </h3>
        <button class="btn-icon" onclick="closeLogoutModal()">${icons.close}</button>
      </div>

      <p style="font-size: 0.875rem; color: var(--forge-text-muted); margin-bottom: 20px; line-height: 1.5;">
        Are you sure you want to end your active session as <strong style="color: var(--forge-text-main);">${escapeHtml(user.displayName)}</strong> (${escapeHtml(user.department || 'Engineering')})?
      </p>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn-action btn-outline" onclick="closeLogoutModal()">Cancel</button>
        <button type="button" class="btn-action btn-primary" style="background: var(--forge-error); color: #fff;" onclick="confirmLogout()">
          ${icons.logOut} Sign Out
        </button>
      </div>
    </div>
  </div>`;
}

export function renderLoginModal(): string {
  return `
  <!-- Login / Persona Switcher Modal Dialog -->
  <div class="modal-backdrop" id="loginModal" onclick="if(event.target === this) closeLoginModal()">
    <div class="modal-box" style="max-width: 480px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--forge-primary); display: flex; align-items: center; gap: 8px;">
          ${icons.logIn} Select Persona Account / Login
        </h3>
        <button class="btn-icon" onclick="closeLoginModal()">${icons.close}</button>
      </div>

      <p style="font-size: 0.85rem; color: var(--forge-text-muted); margin-bottom: 16px;">
        Select an employee profile to simulate real-time hierarchy permissions and review workflows:
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        <div onclick="selectPersona('employee')" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--forge-primary)'" onmouseout="this.style.borderColor='var(--forge-border)'">
          <div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--forge-text-main);">Jane Doe (Contributor)</div>
            <div style="font-size: 0.75rem; color: var(--forge-text-muted);">Platform Engineering &bull; Manager: Sarah Connor</div>
          </div>
          <span class="btn-action btn-outline" style="font-size: 0.75rem;">Select</span>
        </div>

        <div onclick="selectPersona('solo')" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--forge-warning)'" onmouseout="this.style.borderColor='var(--forge-border)'">
          <div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--forge-text-main);">Morgan Lee (No Manager)</div>
            <div style="font-size: 0.75rem; color: var(--forge-warning);">Independent Operations &bull; Manager: Unassigned</div>
          </div>
          <span class="btn-action btn-outline" style="font-size: 0.75rem;">Select</span>
        </div>

        <div onclick="selectPersona('manager')" style="background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--forge-success)'" onmouseout="this.style.borderColor='var(--forge-border)'">
          <div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--forge-text-main);">Sarah Connor (Engineering Lead)</div>
            <div style="font-size: 0.75rem; color: var(--forge-success);">Platform Engineering &bull; 3 Direct Reports</div>
          </div>
          <span class="btn-action btn-outline" style="font-size: 0.75rem;">Select</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button type="button" class="btn-action btn-outline" onclick="closeLoginModal()">Close</button>
      </div>
    </div>
  </div>`;
}
