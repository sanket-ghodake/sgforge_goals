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

    function getStatusBadge(board) {
      const isApproved = board.status === 'APPROVED';
      const isSubmitted = board.status === 'SUBMITTED';
      const isRework = board.status === 'REWORK_REQUESTED';
      const isOverdue = board.status === 'LOCKED_OVERDUE';
      const isUnlockReq = board.status === 'UNLOCK_REQUESTED';
      const label = isApproved ? 'Approved & Sealed' : isSubmitted ? 'Under Review' : isRework ? 'Revisions Requested' : isOverdue ? 'Auto-Locked (Overdue)' : isUnlockReq ? 'Unlock Requested' : 'Draft';
      const color = isApproved ? 'var(--forge-success)' : isSubmitted ? 'var(--forge-warning)' : isRework ? 'var(--forge-error)' : 'var(--forge-text-subtle)';
      return { label, color, isApproved, isSubmitted, isRework, isOverdue, isUnlockReq };
    }

    function getActionButtonsHtml(board, currentUser) {
      const isOwner = Boolean(
        (currentUser.id && currentUser.id === board.ownerId) ||
        (currentUser.displayName && board.ownerName && currentUser.displayName.toLowerCase() === board.ownerName.toLowerCase())
      );
      const isReviewer = !isOwner && Boolean(
        currentUser.roles && (
          currentUser.roles.includes('roles/admin') ||
          currentUser.roles.includes('roles/super_admin') ||
          currentUser.roles.includes('roles/manager')
        )
      );
      const { label, color, isApproved, isSubmitted, isRework, isOverdue, isUnlockReq } = getStatusBadge(board);
      const safeTitle = escapeHtml(board.title || '').replace(/'/g, "\\'");

      if (isReviewer) {
        if (isSubmitted || isRework || isOverdue || isUnlockReq) {
          return \`<button class="drawer-action-btn drawer-action-btn-neutral" onclick="openReworkModal('\${escapeHtml(board.id)}', '\${safeTitle}')">${icons.alertCircle} Request Rework</button><button class="drawer-action-btn drawer-action-btn-primary" onclick="handleApproveBoard('\${escapeHtml(board.id)}')">${icons.award} Approve Board</button>\`;
        }
        if (isApproved) {
          return \`<button class="drawer-action-btn drawer-action-btn-neutral" onclick="openReworkModal('\${escapeHtml(board.id)}', '\${safeTitle}')">${icons.alertCircle} Move to Rework</button><button class="drawer-action-btn drawer-action-btn-neutral" onclick="handleUnlockBoard('\${escapeHtml(board.id)}')">${icons.lock} Unlock Board</button>\`;
        }
      } else if (isOwner) {
        if (isSubmitted || isOverdue) {
          return \`<button class="drawer-action-btn drawer-action-btn-neutral" onclick="handleRequestUnlock('\${escapeHtml(board.id)}')">${icons.lock} Request Unlock</button>\`;
        }
        if (isApproved) {
          return \`<span class="drawer-action-status-label">${icons.award} Approved</span>\`;
        }
        if (isRework) {
          return \`<a href="?tab=board&id=\${encodeURIComponent(board.id)}" onclick="closeReviewDrawer(); navigateSpa('board', '\${escapeHtml(board.id)}', event)" class="drawer-action-btn drawer-action-btn-primary">${icons.edit} Edit & Resubmit</a>\`;
        }
      }
      return '';
    }

    function renderSingleBubble(c, currentUser, board) {
      const isSystem = c.type === 'UNLOCKED' || c.type === 'DEADLINE_SET' || c.authorId === 'sys_auth' || c.authorRole === 'System Audit';
      const isReworkMsg = c.type === 'REWORK_REQUEST';
      const isApprovalMsg = c.type === 'APPROVAL_NOTE';
      const msgTime = new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      const isMe = Boolean(
        (currentUser.id && c.authorId === currentUser.id) ||
        (!c.authorId && currentUser.email && c.authorEmail && currentUser.email.toLowerCase() === c.authorEmail.toLowerCase())
      );
      const isReviewerComment = !isMe && Boolean(
        c.authorRole && /manager|admin|reviewer/i.test(c.authorRole)
      );

      if (isSystem) {
        return \`<div class="timeline-event-card" data-cid="\${escapeHtml(c.id)}"><span>\${escapeHtml(c.commentText)}</span> &bull; <span class="timeline-card-time">\${escapeHtml(msgTime)}</span></div>\`;
      }
      if (isApprovalMsg) {
        return \`
          <div class="timeline-card timeline-card-approved" data-cid="\${escapeHtml(c.id)}">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700; font-size:0.875rem; color:var(--forge-success); margin-bottom:2px;">${icons.award} Formally Sealed & Approved</div>
            <div class="timeline-card-body" style="text-align:center; font-weight:500;">\${escapeHtml(c.commentText)}</div>
            <div class="timeline-card-time" style="margin-top:2px;">Approved by \${escapeHtml(c.authorName)} &bull; \${escapeHtml(msgTime)}</div>
          </div>
        \`;
      }
      if (isReworkMsg) {
        const reworkSide = isMe ? 'timeline-card-me' : 'timeline-card-other';
        return \`
          <div class="timeline-card \${reworkSide} timeline-card-rework" data-cid="\${escapeHtml(c.id)}">
            <div class="timeline-card-header">
              <span class="timeline-card-author">\${escapeHtml(c.authorName)}</span>
              <span class="timeline-card-time">\${escapeHtml(msgTime)}</span>
            </div>
            <div style="font-size:0.75rem; font-weight:700; color:var(--forge-warning); display:flex; align-items:center; gap:5px;">${icons.alertCircle} Revision Requested</div>
            <div class="timeline-card-body">\${escapeHtml(c.commentText)}</div>
          </div>
        \`;
      }

      const cardSide = isMe ? 'timeline-card-me' : 'timeline-card-other';
      const matchedItem = c.itemId && board.items ? board.items.find(function(i) { return i.id === c.itemId; }) : null;
      const itemBadgeHtml = matchedItem ? \`<div class="timeline-milestone-badge">${icons.target} <span>Milestone:</span> <strong>\${escapeHtml(matchedItem.title)}</strong></div>\` : '';

      return \`
        <div class="timeline-card \${cardSide} \${isReviewerComment ? 'timeline-card-reviewer' : ''}" data-cid="\${escapeHtml(c.id)}">
          <div class="timeline-card-header">
            <span class="timeline-card-author">\${escapeHtml(c.authorName || 'User')}</span>
            <span class="timeline-card-time">\${escapeHtml(msgTime)}</span>
          </div>
          \${itemBadgeHtml}
          <div class="timeline-card-body">\${escapeHtml(c.commentText)}</div>
        </div>
      \`;
    }

    function renderDrawerShell(board) {
      const drawerPane = document.getElementById('reviewDrawerPane');
      if (!drawerPane) return;

      const currentUser = window.__CURRENT_USER__ || {};
      const isOwner = Boolean(
        (currentUser.id && currentUser.id === board.ownerId) ||
        (currentUser.displayName && board.ownerName && currentUser.displayName.toLowerCase() === board.ownerName.toLowerCase())
      );
      const peerName = isOwner ? (board.managerName || 'Assigned Manager') : board.ownerName;
      const peerRole = isOwner ? 'Manager / Approver' : ('Contributor &bull; ' + escapeHtml(board.ownerDepartment || 'Team'));
      const peerInitial = (peerName || 'M').charAt(0).toUpperCase();
      const { label, color } = getStatusBadge(board);
      const cycleText = board.cycle ? ' (' + escapeHtml(board.cycle) + ')' : '';

      drawerPane.innerHTML = \`
        <div class="drawer-header">
          <div class="drawer-peer-header">
            <div class="drawer-peer-avatar">
              \${escapeHtml(peerInitial)}
            </div>
            <div style="min-width:0; overflow:hidden;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:1px;">
                <span class="drawer-peer-name">
                  \${escapeHtml(peerName)}
                </span>
                <span id="drawerStatusBadge" class="drawer-status-pill">
                  <span class="drawer-status-beacon" style="background:\${color};"></span>
                  <span>\${label}</span>
                </span>
              </div>
              <div class="drawer-peer-sub">
                \${peerRole} &bull; <span>\${escapeHtml(board.title)}</span>\${cycleText}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <a href="?tab=board&id=\${encodeURIComponent(board.id)}" onclick="closeReviewDrawer(); navigateSpa('board', '\${escapeHtml(board.id)}', event)" class="drawer-action-btn drawer-action-btn-neutral" data-astryx-tooltip="Inspect Canvas">
              ${icons.layers} <span>Inspect</span>
            </a>
            <button class="drawer-close-btn" onclick="closeReviewDrawer()" aria-label="Close drawer">${icons.close}</button>
          </div>
        </div>

        <div class="drawer-body" id="drawerChatStream"></div>

        <div class="drawer-footer">
          <div id="drawerActionButtons" style="display:flex; align-items:center; justify-content:flex-end; gap:6px; flex-wrap:wrap;">
            \${getActionButtonsHtml(board, currentUser)}
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="drawerCommentInput" class="drawer-comment-input" type="text" placeholder="Add note or message \${escapeHtml(peerName)}..." onkeydown="if(event.key==='Enter') submitDrawerComment('\${escapeHtml(board.id)}')" />
            <button class="drawer-send-btn" onclick="submitDrawerComment('\${escapeHtml(board.id)}')">
              ${icons.send} <span>Send</span>
            </button>
          </div>
        </div>
      \`;

      window._renderedCommentIds = new Set();
      window._lastRenderedDate = '';
      window._lastBoardStatus = board.status;
      window._renderedBoardId = board.id;
    }

    function updateDrawerMessages(board, isPolling) {
      const stream = document.getElementById('drawerChatStream');
      if (!stream) return;

      const currentUser = window.__CURRENT_USER__ || {};

      if (board.status !== window._lastBoardStatus) {
        window._lastBoardStatus = board.status;
        const { label, color } = getStatusBadge(board);
        const badge = document.getElementById('drawerStatusBadge');
        if (badge) {
          badge.innerHTML = \`<span class="drawer-status-beacon" style="background:\${color};"></span><span>\${label}</span>\`;
        }
        const actionsContainer = document.getElementById('drawerActionButtons');
        if (actionsContainer) {
          actionsContainer.innerHTML = getActionButtonsHtml(board, currentUser);
        }
      }

      if (!isPolling) {
        stream.innerHTML = '';
        window._renderedCommentIds = new Set();
        window._lastRenderedDate = '';
      }

      const isNearBottom = stream.scrollHeight - stream.scrollTop <= stream.clientHeight + 120;
      let newHtml = '';

      function checkDateDivider(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        if (dateStr !== window._lastRenderedDate) {
          window._lastRenderedDate = dateStr;
          return '<div class="timeline-date-divider">' + escapeHtml(dateStr) + '</div>';
        }
        return '';
      }

      if (!window._renderedCommentIds.has('sys_created')) {
        newHtml += checkDateDivider(board.createdAt);
        newHtml += \`<div class="timeline-event-card">Goal Board Created &bull; <strong>\${escapeHtml(board.title)}</strong></div>\`;
        window._renderedCommentIds.add('sys_created');
      }

      const subKey = 'sys_sub_' + (board.revisionNumber || 1);
      if ((board.submittedAt || board.status !== 'DRAFT') && !window._renderedCommentIds.has(subKey)) {
        const subTime = board.submittedAt || board.createdAt;
        newHtml += checkDateDivider(subTime);
        const timeStr = new Date(subTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const itemLen = board.items ? board.items.length : 0;
        newHtml += \`
          <div class="timeline-event-card">
            <strong>\${escapeHtml(board.ownerName)}</strong> submitted for Manager Review &bull; Revision \${Number(board.revisionNumber) || 1} (\${itemLen} milestones) &bull; <span class="timeline-card-time">\${escapeHtml(timeStr)}</span>
          </div>
        \`;
        window._renderedCommentIds.add(subKey);
      }

      if (board.comments && board.comments.length > 0) {
        board.comments.forEach(function(c) {
          if (!window._renderedCommentIds.has(c.id)) {
            newHtml += checkDateDivider(c.createdAt);
            newHtml += renderSingleBubble(c, currentUser, board);
            window._renderedCommentIds.add(c.id);
          }
        });
      }

      if (board.status === 'APPROVED' && (!board.comments || !board.comments.some(function(c) { return c.type === 'APPROVAL_NOTE'; })) && !window._renderedCommentIds.has('sys_appr_badge')) {
        newHtml += \`
          <div class="timeline-card timeline-card-approved">
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700; font-size:0.875rem; color:var(--forge-success); margin-bottom:2px;">${icons.award} Formally Sealed & Approved</div>
            <div class="timeline-card-time">Signed by \${escapeHtml(board.approvedBy || 'Manager')}</div>
          </div>
        \`;
        window._renderedCommentIds.add('sys_appr_badge');
      }

      if (newHtml) {
        stream.insertAdjacentHTML('beforeend', newHtml);
        if (isNearBottom || !isPolling) {
          setTimeout(function() {
            stream.scrollTo({ top: stream.scrollHeight, behavior: isPolling ? 'smooth' : 'auto' });
          }, 30);
        }
      }
    }

    function fetchBoardAndSync(boardId, isPolling) {
      fetch('api/boards/' + encodeURIComponent(boardId))
        .then(function(res) {
          if (!res.ok) throw new Error('Board not found');
          return res.json();
        })
        .then(function(board) {
          if (window._renderedBoardId !== board.id || !document.getElementById('drawerChatStream')) {
            renderDrawerShell(board);
          }
          updateDrawerMessages(board, isPolling);
        })
        .catch(function(err) {
          if (!isPolling) {
            const pane = document.getElementById('reviewDrawerPane');
            if (pane) pane.innerHTML = '<div style="padding:40px; text-align:center; color:var(--forge-error);">' + escapeHtml(err.message) + '</div>';
          }
        });
    }

    window.openReviewDrawer = function(boardId) {
      const drawerBackdrop = document.getElementById('reviewTimelineDrawer');
      const drawerPane = document.getElementById('reviewDrawerPane');
      if (!drawerBackdrop || !drawerPane) return;

      window._activeReviewBoardId = boardId;

      drawerBackdrop.classList.add('open');

      if (window._renderedBoardId !== boardId || !document.getElementById('drawerChatStream')) {
        drawerPane.innerHTML = '<div style="padding:40px; text-align:center; color:var(--forge-text-muted);">Loading review timeline...</div>';
      }

      fetchBoardAndSync(boardId, false);

      if (window._reviewPollInterval) clearInterval(window._reviewPollInterval);
      window._reviewPollInterval = setInterval(function() {
        if (!document.getElementById('reviewTimelineDrawer')?.classList.contains('open')) {
          clearInterval(window._reviewPollInterval);
          return;
        }
        fetchBoardAndSync(boardId, true);
      }, 4000);
    };

    window.closeReviewDrawer = function() {
      const drawerBackdrop = document.getElementById('reviewTimelineDrawer');
      if (drawerBackdrop) drawerBackdrop.classList.remove('open');
      if (window._reviewPollInterval) {
        clearInterval(window._reviewPollInterval);
        window._reviewPollInterval = null;
      }
      window._activeReviewBoardId = null;
    };

    window.submitDrawerComment = function(boardId) {
      const input = document.getElementById('drawerCommentInput');
      if (!input || !input.value.trim()) return;

      const text = input.value.trim();
      input.value = '';
      input.focus();

      fetch('api/boards/' + boardId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: text })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to post comment');
        return res.json();
      })
      .then(function(board) {
        updateDrawerMessages(board, false);
        const postInput = document.getElementById('drawerCommentInput');
        if (postInput) postInput.focus();
        if (window.astryxToast) window.astryxToast('Comment sent', 'info');
      })
      .catch(function(err) {
        if (window.astryxToast) window.astryxToast(err.message, 'error');
      });
    };

    window.handleRequestUnlock = function(boardId) {
      fetch('api/boards/' + boardId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REQUEST_UNLOCK', comment: 'Requesting board unlock for revisions.' })
      })
      .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Unlock request failed'); }); return res.json(); })
      .then(board => {
        updateDrawerMessages(board, false);
        if (window.astryxToast) window.astryxToast('Unlock requested. Manager notified.', 'info');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
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
      .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Rework request failed'); }); return res.json(); })
      .then(board => {
        window.closeReworkModal();
        updateDrawerMessages(board, false);
        if (window.astryxToast) window.astryxToast('Rework requested. Board moved to revision.', 'info');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };

    window.handleApproveBoard = function(boardId) {
      const executeApproval = function() {
        const noteInput = document.getElementById('drawerCommentInput');
        const customNote = noteInput && noteInput.value.trim() ? noteInput.value.trim() : 'Approved with formal manager signoff.';
        if (noteInput) noteInput.value = '';

        fetch('api/boards/' + boardId + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'APPROVE', comment: customNote })
        })
        .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Approval failed'); }); return res.json(); })
        .then(board => {
          updateDrawerMessages(board, false);
          if (window.astryxToast) window.astryxToast('Board has been approved and permanently sealed.', 'success');
          const urlParams = new URLSearchParams(window.location.search);
          loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
        })
        .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
      };

      if (window.showModernConfirm) {
        window.showModernConfirm({
          title: 'Approve & Seal Goal Plan',
          message: 'Are you sure you want to approve and seal this goal board? Once approved, the milestones become an immutable operational blueprint.',
          confirmText: 'Approve & Seal',
          confirmVariant: 'success',
          onConfirm: executeApproval
        });
      } else {
        executeApproval();
      }
    };

    window.handleUnlockBoard = function(boardId) {
      fetch('api/boards/' + boardId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'UNLOCK', comment: 'Manager unlocked board for editing.' })
      })
      .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Unlock failed'); }); return res.json(); })
      .then(board => {
        updateDrawerMessages(board, false);
        if (window.astryxToast) window.astryxToast('Board unlocked for editing.', 'success');
        const urlParams = new URLSearchParams(window.location.search);
        loadSpaView(urlParams.get('tab') || 'dashboard', urlParams.get('id'));
      })
      .catch(err => { if (window.astryxToast) window.astryxToast(err.message, 'error'); });
    };
  `;
}
