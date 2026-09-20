/**
 * Individual Goal Center - Review Timeline Client Script Module
 * Provides global window handlers for the WhatsApp-style Review Timeline drawer and Rework modal.
 * @requirements [HLR-UI-201] [LLR-SUB-001]
 */

import { icons } from '../../lib/icons';

/**
 * Returns the client-side JavaScript string that powers the global Review Timeline drawer.
 */
export function getReviewDrawerScript(): string {
  return `
    function escapeHtml(unsafe) {
      if (!unsafe) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    window.openReviewDrawer = function(boardId) {
      const drawerBackdrop = document.getElementById('reviewTimelineDrawer');
      const drawerPane = document.getElementById('reviewDrawerPane');
      if (!drawerBackdrop || !drawerPane) return;

      drawerBackdrop.classList.add('open');
      drawerPane.innerHTML = '<div style="padding:40px; text-align:center; color:var(--forge-text-muted);">Loading review timeline...</div>';

      fetch('api/boards/' + encodeURIComponent(boardId))
        .then(function(res) {
          if (!res.ok) throw new Error('Board not found');
          return res.json();
        })
        .then(function(board) {
          renderDrawerContent(board);
        })
        .catch(function(err) {
          drawerPane.innerHTML = '<div style="padding:40px; text-align:center; color:var(--forge-error);">' + escapeHtml(err.message) + '</div>';
        });
    };

    window.closeReviewDrawer = function() {
      const drawerBackdrop = document.getElementById('reviewTimelineDrawer');
      if (drawerBackdrop) drawerBackdrop.classList.remove('open');
    };

    function renderDrawerContent(board) {
      const drawerPane = document.getElementById('reviewDrawerPane');
      if (!drawerPane) return;

      const isSubmitted = board.status === 'SUBMITTED';
      const isApproved = board.status === 'APPROVED';
      const isRework = board.status === 'REWORK_REQUESTED';

      let chatHtml = '';

      // 1. Initial Board Created System Event
      chatHtml += \`<div class="chat-bubble chat-bubble-system">Goal Board Created for \${escapeHtml(board.projectName || 'Project')} (\${escapeHtml(board.cycle)})</div>\`;

      // 2. Board Submitted Event if submittedAt exists
      if (board.submittedAt || board.status !== 'DRAFT') {
        const timeStr = board.submittedAt ? new Date(board.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Submitted';
        const itemLen = board.items ? board.items.length : 0;
        chatHtml += \`
          <div class="chat-bubble chat-bubble-employee">
            <div class="chat-author">
              <span>\${escapeHtml(board.ownerName)} (\${escapeHtml(board.ownerDepartment)})</span>
              <span class="chat-timestamp">\${escapeHtml(timeStr)}</span>
            </div>
            <div style="font-weight: 600; margin-bottom: 4px;">Submitted Board for Manager Review</div>
            <div style="font-size: 0.8rem; color: var(--forge-text-muted);">
              Revision \${Number(board.revisionNumber) || 1} submitted with \${itemLen} committed milestones.
            </div>
          </div>
        \`;
      }

      // 3. Comments & Rework Thread Stream
      if (board.comments && board.comments.length > 0) {
        board.comments.forEach(function(c) {
          const isReworkMsg = c.type === 'REWORK_REQUEST';
          const isApprovalMsg = c.type === 'APPROVAL_NOTE';
          const msgTime = new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const msgDate = new Date(c.createdAt).toLocaleDateString();

          if (isReworkMsg) {
            chatHtml += \`
              <div class="chat-bubble chat-bubble-rework">
                <div class="chat-author" style="color: var(--forge-warning);">
                  <span>\${escapeHtml(c.authorName)} (\${escapeHtml(c.authorRole)})</span>
                  <span class="chat-timestamp">\${escapeHtml(msgTime)}</span>
                </div>
                <div style="font-weight: 700; margin-bottom: 4px;">Revision Requested</div>
                <div>\${escapeHtml(c.commentText)}</div>
              </div>
            \`;
          } else if (isApprovalMsg) {
            chatHtml += \`
              <div class="chat-bubble chat-bubble-approved">
                <div style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">Sealed & Approved</div>
                <div style="font-size: 0.85rem; color: var(--forge-text-main); margin-bottom: 6px;">\${escapeHtml(c.commentText)}</div>
                <div class="chat-timestamp">Approved by \${escapeHtml(c.authorName)} &bull; \${escapeHtml(msgDate)}</div>
              </div>
            \`;
          } else if (c.type === 'UNLOCK_REQUEST') {
            chatHtml += \`
              <div class="chat-bubble chat-bubble-rework" style="border-color: rgba(245, 158, 11, 0.4);">
                <div class="chat-author" style="color: var(--forge-warning);">
                  <span>\${escapeHtml(c.authorName)} (\${escapeHtml(c.authorRole)})</span>
                  <span class="chat-timestamp">\${escapeHtml(msgTime)}</span>
                </div>
                <div>\${escapeHtml(c.commentText)}</div>
              </div>
            \`;
          } else if (c.type === 'UNLOCKED') {
            chatHtml += \`
              <div class="chat-bubble chat-bubble-system">
                Unlocked by \${escapeHtml(c.authorName)} &bull; \${escapeHtml(msgTime)}
              </div>
            \`;
          } else if (c.type === 'DEADLINE_SET') {
            chatHtml += \`
              <div class="chat-bubble chat-bubble-system">
                \${escapeHtml(c.commentText)}
              </div>
            \`;
          } else {
            const bubbleClass = c.authorName === board.ownerName ? 'chat-bubble-employee' : 'chat-bubble-manager';
            const matchedItem = c.itemId && board.items ? board.items.find(function(i) { return i.id === c.itemId; }) : null;
            const itemBadgeHtml = matchedItem ? '<div style="margin-bottom: 4px;"><span style="font-size:0.7rem; font-weight:700; background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); border-radius:4px; padding:2px 6px;">' + escapeHtml(matchedItem.title) + '</span></div>' : '';
            chatHtml += \`
              <div class="chat-bubble \${bubbleClass}">
                <div class="chat-author">
                  <span>\${escapeHtml(c.authorName)} (\${escapeHtml(c.authorRole)})</span>
                  <span class="chat-timestamp">\${escapeHtml(msgTime)}</span>
                </div>
                \${itemBadgeHtml}
                <div>\${escapeHtml(c.commentText)}</div>
              </div>
            \`;
          }
        });
      }

      // 4. Approval Seal if approved and no approval note
      if (isApproved && (!board.comments || !board.comments.some(function(c) { return c.type === 'APPROVAL_NOTE'; }))) {
        chatHtml += \`
          <div class="chat-bubble chat-bubble-approved">
            <div style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">Formally Sealed & Approved</div>
            <div style="font-size: 0.825rem; color: var(--forge-text-muted);">Signed by \${escapeHtml(board.approvedBy || 'Manager')}</div>
          </div>
        \`;
      }

      const statusBadgeLabel = isApproved ? 'Approved & Sealed' : isSubmitted ? 'Under Review' : isRework ? 'Revisions Requested' : board.status === 'LOCKED_OVERDUE' ? 'Auto-Locked (Overdue)' : board.status === 'UNLOCK_REQUESTED' ? 'Unlock Requested' : 'Draft';
      const statusBadgeColor = isApproved ? 'var(--forge-success)' : isSubmitted ? 'var(--forge-warning)' : isRework ? 'var(--forge-error)' : 'var(--forge-text-muted)';
      const safeTitle = escapeHtml(board.title || '').replace(/'/g, "\\'");
      const isOverdue = board.status === 'LOCKED_OVERDUE';
      const isUnlockReq = board.status === 'UNLOCK_REQUESTED';
      const actionButtons = \`
        \${isSubmitted || isRework || isOverdue || isUnlockReq ? \`
          <button class="btn-action btn-outline" style="font-size: 0.75rem; color: var(--forge-warning); border-color: rgba(245, 158, 11, 0.3);" onclick="openReworkModal('\${escapeHtml(board.id)}', '\${safeTitle}')">
            ${icons.alertCircle} Request Rework
          </button>
          <button class="btn-action btn-primary" style="font-size: 0.75rem;" onclick="handleApproveBoard('\${escapeHtml(board.id)}')">
            ${icons.award} Approve Board
          </button>
        \` : isApproved ? \`
          <button class="btn-action btn-outline" style="font-size: 0.75rem; color: var(--forge-warning); border-color: rgba(245, 158, 11, 0.3);" onclick="openReworkModal('\${escapeHtml(board.id)}', '\${safeTitle}')">
            ${icons.alertCircle} Move to Rework
          </button>
          <button class="btn-action btn-outline" style="font-size: 0.75rem;" onclick="handleUnlockBoard('\${escapeHtml(board.id)}')">
            ${icons.lock} Unlock Board
          </button>
        \` : ''}
      \`;

      const itemOptionsHtml = (board.items || []).map(function(item) {
        return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + '</option>';
      }).join('');

      drawerPane.innerHTML = \`
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--forge-primary);">
                \${escapeHtml(board.projectName || 'Project')} &bull; \${escapeHtml(board.cycle)}
              </span>
              <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: rgba(255,255,255,0.06); color: \${statusBadgeColor};">
                \${statusBadgeLabel}
              </span>
            </div>
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 2px 0;">\${escapeHtml(board.title)}</h3>
            <div style="font-size: 0.775rem; color: var(--forge-text-muted);">
              Contributor: <strong style="color: var(--forge-text-main);">\${escapeHtml(board.ownerName)}</strong> &bull; Rev \${Number(board.revisionNumber) || 1}
            </div>
          </div>
          <button class="btn-icon" onclick="closeReviewDrawer()">${icons.close}</button>
        </div>

        <!-- Drawer Timeline Chat Body -->
        <div class="drawer-body" id="drawerChatStream">
          \${chatHtml}
        </div>

        <!-- Drawer Footer Action & Reply Bar -->
        <div class="drawer-footer">
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <select id="drawerCommentItemSelect" class="shadcn-select" style="height: 38px; max-width: 150px; font-size: 0.8rem; text-overflow: ellipsis;">
              <option value="">Whole Board</option>
              \${itemOptionsHtml}
            </select>
            <input id="drawerCommentInput" type="text" placeholder="Write feedback or critique..." style="flex: 1; height: 38px; border-radius: 10px; background: var(--forge-bg-card); border: 1px solid var(--forge-border); color: var(--forge-text-main); padding: 0 14px; font-size: 0.85rem;" onkeydown="if(event.key==='Enter') submitDrawerComment('\${escapeHtml(board.id)}')" />
            <button class="btn-action btn-primary" style="height: 38px;" onclick="submitDrawerComment('\${escapeHtml(board.id)}')">
              ${icons.send} Send
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--forge-border);">
            <a href="?tab=board&id=\${encodeURIComponent(board.id)}" onclick="closeReviewDrawer(); navigateSpa('board', '\${escapeHtml(board.id)}', event)" class="btn-action btn-outline" style="font-size: 0.775rem;">
              ${icons.layers} Inspect Canvas
            </a>
            <div style="display: flex; gap: 8px;">
              \${actionButtons}
            </div>
          </div>
        </div>
      \`;

      // Auto-scroll chat stream to bottom
      setTimeout(function() {
        const stream = document.getElementById('drawerChatStream');
        if (stream) stream.scrollTop = stream.scrollHeight;
      }, 50);
    }

    window.submitDrawerComment = function(boardId) {
      const input = document.getElementById('drawerCommentInput');
      const select = document.getElementById('drawerCommentItemSelect');
      if (!input || !input.value.trim()) return;

      const text = input.value.trim();
      const itemId = select ? select.value : '';
      input.value = '';

      fetch('api/boards/' + boardId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: text, itemId: itemId || undefined })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to post comment');
        return res.json();
      })
      .then(function(board) {
        renderDrawerContent(board);
        if (window.astryxToast) window.astryxToast('Feedback comment added to review timeline', 'info');
      })
      .catch(function(err) {
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      });
    };

    window.openReworkModal = function(boardId, title) {
      const el = document.getElementById('reworkBoardId');
      if (el) el.value = boardId;
      const commentInput = document.getElementById('reworkCommentText');
      if (commentInput) commentInput.value = '';
      const modal = document.getElementById('reworkModal');
      if (modal) modal.classList.add('open');
    };

    window.closeReworkModal = function() {
      const modal = document.getElementById('reworkModal');
      if (modal) modal.classList.remove('open');
    };

    window.submitReworkRequest = function(e) {
      e.preventDefault();
      const boardId = document.getElementById('reworkBoardId').value;
      const comment = document.getElementById('reworkCommentText').value;

      fetch('api/boards/' + boardId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REWORK', comment: comment })
      })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(errObj) { throw new Error(errObj.detail || 'Rework request failed'); });
        return res.json();
      })
      .then(function() {
        window.closeReworkModal();
        window.closeReviewDrawer();
        if (window.astryxToast) window.astryxToast('Rework requested. Board unlocked for contributor revision.', 'info');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(function(err) { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };

    window.handleApproveBoard = function(boardId) {
      fetch('api/boards/' + boardId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'APPROVE', comment: 'Approved with formal manager signoff.' })
      })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(errObj) { throw new Error(errObj.detail || 'Approval failed'); });
        return res.json();
      })
      .then(function() {
        window.closeReviewDrawer();
        if (window.astryxToast) window.astryxToast('Board has been approved and permanently sealed.', 'success');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(function(err) { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };

    window.handleUnlockBoard = function(boardId) {
      fetch('api/boards/' + boardId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'UNLOCK', comment: 'Manager unlocked board for editing.' })
      })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(errObj) { throw new Error(errObj.detail || 'Unlock failed'); });
        return res.json();
      })
      .then(function() {
        window.closeReviewDrawer();
        if (window.astryxToast) window.astryxToast('Board unlocked for editing.', 'success');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(function(err) { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };
  `;
}
