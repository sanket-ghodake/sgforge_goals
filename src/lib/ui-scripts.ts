/**
 * SG Forge Micro-App Submodule - Client UI Runtime Scripts (2026 LTS)
 * 100% Isolated & Autonomous: Zero imports from central platform monorepo.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */

import { icons } from './icons';

/**
 * getHeadStateScript
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getHeadStateScript(options: { defaultTheme?: 'dark' | 'light' } = {}): string {
  const theme = options.defaultTheme || 'dark';
  return `
    <script>
      (function() {
        /* 1. Theme Initialization */
        try {
          const theme = localStorage.getItem('forge_theme') || '${theme}';
          document.documentElement.setAttribute('data-theme', theme);
        } catch(e) {}

        /* 2. Real-Time Cross-Tab & Expired Token Auto-Logout Engine */
        try {
          const isLoginPage = window.location.pathname.startsWith('/auth/login') || window.location.pathname.startsWith('/login');
          if (!isLoginPage) {
            let loggingOut = false;
            var onCrossTabLogout = function(msg) {
              if (loggingOut) return;
              loggingOut = true;
              try { sessionStorage.clear(); } catch(e) {}
              if (window.astryxToast || window.modernToast) {
                (window.astryxToast || window.modernToast)('Session expired. Redirecting to login...', 'error', 2500);
              }
              var curr = window.location.pathname + window.location.search;
              setTimeout(function() {
                window.location.href = '/auth/login?return_url=' + encodeURIComponent(curr);
              }, 300);
            };

            // A. BroadcastChannel Listener
            if (typeof BroadcastChannel !== 'undefined') {
              var authBc = new BroadcastChannel('forge_auth_channel');
              authBc.onmessage = function(ev) {
                if (ev && ev.data && ev.data.type === 'LOGOUT') {
                  onCrossTabLogout('channel_logout');
                }
              };
            }

            // B. LocalStorage Sync Listener
            window.addEventListener('storage', function(ev) {
              if (ev && ev.key === 'forge_logout_event' && ev.newValue) {
                onCrossTabLogout('storage_logout');
              }
            });

            // C. Proactive Fetch 401 Interceptor
            if (typeof window.fetch === 'function') {
              var origFetch = window.fetch;
              window.fetch = function() {
                return origFetch.apply(this, arguments).then(function(res) {
                  if (res && res.status === 401 && !window.location.pathname.startsWith('/auth/login')) {
                    try {
                      localStorage.setItem('forge_logout_event', String(Date.now()));
                      if (typeof BroadcastChannel !== 'undefined') {
                        var bc = new BroadcastChannel('forge_auth_channel');
                        bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
                        bc.close();
                      }
                    } catch(e) {}
                    onCrossTabLogout('401_fetch');
                  }
                  return res;
                });
              };
            }

            // D. Background Active Session Heartbeat (Every 30s)
            setInterval(function() {
              if (document.visibilityState === 'visible') {
                origFetch('/api/auth/me', { headers: { 'Accept': 'application/json' } })
                  .then(function(res) {
                    if (res && res.status === 401) {
                      onCrossTabLogout('session_heartbeat_expired');
                    }
                  })
                  .catch(function() {});
              }
            }, 30000);
          }
        } catch(e) {}
      })();
    </script>
  `;
}

/**
 * getModernToastScript
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
/**
 * getModernToastScript
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getModernToastScript(): string {
  return `
    <div id="astryx-toast-container" class="modern-toast-container"></div>
    <script>
      (function() {
        const ICONS = {
          success: '${icons.checkCircle.replace(/'/g, "\\'")}',
          error: '${icons.alertCircle.replace(/'/g, "\\'")}',
          warning: '${icons.clock.replace(/'/g, "\\'")}',
          info: '${icons.infoCircle.replace(/'/g, "\\'")}'
        };
        const CLOSE_ICON = '${icons.close.replace(/'/g, "\\'")}';

        window.modernToast = function(msg, type = 'info', duration = 3500) {
          const c = document.getElementById('astryx-toast-container');
          if (!c) return;
          const t = document.createElement('div');
          const typeVar = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary';
          t.className = 'modern-toast modern-toast-' + type;
          t.style.borderLeft = '3.5px solid var(--forge-' + typeVar + ')';
          t.style.position = 'relative';
          t.style.overflow = 'hidden';

          const iconHtml = ICONS[type] || ICONS.info;
          t.innerHTML = '<span style="display:flex;align-items:center;color:var(--forge-' + typeVar + ');flex-shrink:0;">' + iconHtml + '</span>' +
            '<span style="flex:1;min-width:0;line-height:1.4;">' + msg + '</span>' +
            '<button type="button" class="modern-toast-close" style="background:none;border:none;color:var(--forge-text-muted);cursor:pointer;display:inline-flex;align-items:center;padding:2px;border-radius:4px;flex-shrink:0;" aria-label="Dismiss notification">' + CLOSE_ICON + '</button>' +
            '<div class="modern-toast-progress" style="position:absolute;bottom:0;left:0;height:2.5px;background:var(--forge-' + typeVar + ');width:100%;transition:width ' + (duration / 1000) + 's linear;"></div>';

          const closeBtn = t.querySelector('.modern-toast-close');
          const progressBar = t.querySelector('.modern-toast-progress');
          c.appendChild(t);

          // Animate progress bar shrinkage
          requestAnimationFrame(() => {
            if (progressBar) progressBar.style.width = '0%';
          });

          let timerId = null;
          const dismiss = () => {
            if (timerId) clearTimeout(timerId);
            t.style.opacity = '0';
            t.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            t.style.transform = 'translateY(6px)';
            setTimeout(() => t.remove(), 200);
          };

          if (closeBtn) closeBtn.onclick = dismiss;
          timerId = setTimeout(dismiss, duration);
        };
        window.astryxToast = window.modernToast;
      })();
    </script>
  `;
}

export const getAstryxToastScript = getModernToastScript;

/**
 * getModernSelectAndConfirmScripts
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getModernSelectAndConfirmScripts(): string {
  return `
    <script>
      (function() {
        // Universal Modern Select Engine
        window.toggleModernSelect = function(id) {
          const wrap = document.getElementById(id);
          if (!wrap) return;
          const menu = wrap.querySelector('.modern-select-menu');
          const trigger = wrap.querySelector('.modern-select-trigger');
          const isOpen = menu && menu.classList.contains('open');

          // Close all open dropdowns
          document.querySelectorAll('.modern-select-menu.open').forEach(m => m.classList.remove('open'));
          document.querySelectorAll('.modern-select-trigger.open').forEach(tr => tr.classList.remove('open'));

          if (!isOpen && menu && trigger) {
            menu.classList.add('open');
            trigger.classList.add('open');
          }
        };

        window.selectModernOption = function(selectId, val, label) {
          const wrap = document.getElementById(selectId);
          if (!wrap) return;
          const hiddenInput = wrap.querySelector('input[type="hidden"]');
          const labelSpan = wrap.querySelector('.modern-select-label');
          const menu = wrap.querySelector('.modern-select-menu');
          const trigger = wrap.querySelector('.modern-select-trigger');

          if (hiddenInput) {
            hiddenInput.value = val;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (labelSpan) labelSpan.textContent = label;

          wrap.querySelectorAll('.modern-select-option').forEach(opt => {
            if (opt.dataset.value === String(val)) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });

          if (menu) menu.classList.remove('open');
          if (trigger) trigger.classList.remove('open');
        };

        window.updateModernSelectOptions = function(selectId, options, placeholder = 'Select an option...') {
          const wrap = document.getElementById(selectId);
          if (!wrap) return;
          const menu = wrap.querySelector('.modern-select-menu');
          const labelSpan = wrap.querySelector('.modern-select-label');
          const hiddenInput = wrap.querySelector('input[type="hidden"]');
          if (!menu) return;

          if (!options || options.length === 0) {
            menu.innerHTML = '<div style="padding:10px 12px;font-size:0.8rem;color:var(--forge-text-muted);text-align:center;">No options available</div>';
            if (labelSpan) labelSpan.textContent = placeholder;
            if (hiddenInput) hiddenInput.value = '';
            return;
          }

          let html = '';
          let selectedLabel = placeholder;
          let selectedValue = '';

          options.forEach((opt, idx) => {
            const isSel = opt.selected || idx === 0;
            if (isSel && !selectedValue) {
              selectedValue = opt.value;
              selectedLabel = opt.label;
            }
            html += '<div class="modern-select-option ' + (isSel ? 'selected' : '') + '" data-value="' + opt.value + '" onclick="selectModernOption(\\'' + selectId + '\\', \\'' + opt.value.replace(/'/g, "\\\\'") + '\\', \\'' + opt.label.replace(/'/g, "\\\\'") + '\\')">' + opt.label + '</div>';
          });

          menu.innerHTML = html;
          if (labelSpan) labelSpan.textContent = selectedLabel;
          if (hiddenInput) hiddenInput.value = selectedValue;
        };

        // Close on Click Outside or Escape
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.modern-select-wrap')) {
            document.querySelectorAll('.modern-select-menu.open').forEach(m => m.classList.remove('open'));
            document.querySelectorAll('.modern-select-trigger.open').forEach(tr => tr.classList.remove('open'));
          }
        });

        // Universal Modern Confirm Modal Engine
        let _confirmCallback = null;
        window.showModernConfirm = function(opts) {
          const modal = document.getElementById('universalConfirmModal');
          if (!modal) return;
          const titleEl = document.getElementById('confirmModalTitle');
          const msgEl = document.getElementById('confirmModalMsg');
          const btnConfirm = document.getElementById('confirmModalActionBtn');
          const btnCancel = document.getElementById('confirmModalCancelBtn');

          if (titleEl) titleEl.textContent = opts.title || 'Confirm Action';
          if (msgEl) msgEl.textContent = opts.message || 'Are you sure you want to proceed?';
          if (btnConfirm) {
            btnConfirm.textContent = opts.confirmText || 'Confirm';
            btnConfirm.className = 'btn-action btn-primary ' + (opts.confirmVariant === 'destructive' ? 'btn-danger' : opts.confirmVariant === 'success' ? 'btn-success' : '');
            if (opts.confirmVariant === 'destructive') {
              btnConfirm.style.background = 'var(--forge-error)';
              btnConfirm.style.color = '#fff';
            } else if (opts.confirmVariant === 'success') {
              btnConfirm.style.background = 'var(--forge-success)';
              btnConfirm.style.color = '#fff';
            } else {
              btnConfirm.style.background = '';
              btnConfirm.style.color = '';
            }
          }
          _confirmCallback = opts.onConfirm || null;
          modal.classList.add('open');
        };

        window.closeModernConfirm = function() {
          const modal = document.getElementById('universalConfirmModal');
          if (modal) modal.classList.remove('open');
          _confirmCallback = null;
        };

        window.executeModernConfirm = function() {
          const cb = _confirmCallback;
          closeModernConfirm();
          if (typeof cb === 'function') cb();
        };
      })();
    </script>
  `;
}

/**
 * getModernTooltipScript
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getModernTooltipScript(): string {
  return `
    <div id="astryx-tooltip"></div>
    <script>
      (function() {
        const tt = document.getElementById('astryx-tooltip');
        if (!tt) return;
        document.addEventListener('mouseover', function(e) {
          const el = e.target.closest('[data-astryx-tooltip], [data-tooltip]');
          if (!el) return;
          const text = el.getAttribute('data-astryx-tooltip') || el.getAttribute('data-tooltip');
          if (!text) return;
          tt.textContent = text;
          tt.style.opacity = '1';
          const rect = el.getBoundingClientRect();
          let top = rect.bottom + 6;
          let left = rect.left + (rect.width / 2) - (tt.offsetWidth / 2);
          if (top + tt.offsetHeight > window.innerHeight - 8) {
            top = rect.top - tt.offsetHeight - 6;
          }
          if (left + tt.offsetWidth > window.innerWidth - 8) {
            left = window.innerWidth - tt.offsetWidth - 8;
          }
          if (left < 8) left = 8;
          tt.style.top = top + 'px';
          tt.style.left = left + 'px';
        });
        document.addEventListener('mouseout', function(e) {
          const el = e.target.closest('[data-astryx-tooltip], [data-tooltip]');
          if (el) tt.style.opacity = '0';
        });
      })();
    </script>
  `;
}

export const getAstryxTooltipScript = getModernTooltipScript;

/**
 * getModernHeaderHtml
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getModernHeaderHtml(title: string, badgeText: string = 'FORGE APP'): string {
  return `
    <header class="modern-header">
      <div class="modern-header-left">
        <span class="modern-header-title">${title}</span>
        <span class="modern-header-badge">${badgeText}</span>
      </div>
      <div class="modern-header-actions">
        <button class="astryx-btn" onclick="toggleTheme()" data-astryx-tooltip="Toggle Theme" aria-label="Toggle Theme" style="padding: 0.4rem 0.6rem;">
          ${icons.sunMoon}
        </button>
      </div>
    </header>
    <script>
      function toggleTheme() {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('forge_theme', next);
      }
    </script>
  `;
}

export const getAstryxHeaderHtml = getModernHeaderHtml;
