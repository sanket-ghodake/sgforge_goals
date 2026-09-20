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
export function getModernToastScript(): string {
  return `
    <div id="astryx-toast-container" class="modern-toast-container"></div>
    <script>
      (function() {
        const ICONS = {
          success: '${icons.checkCircle.replace(/'/g, "\\'")}',
          error: '${icons.alertCircle.replace(/'/g, "\\'")}',
          info: '${icons.infoCircle.replace(/'/g, "\\'")}'
        };
        window.modernToast = function(msg, type = 'info', duration = 3500) {
          const c = document.getElementById('astryx-toast-container');
          if (!c) return;
          const t = document.createElement('div');
          t.className = 'modern-toast';
          const iconHtml = ICONS[type] || ICONS.info;
          t.innerHTML = '<span style="display:flex;align-items:center;color:var(--forge-' + (type === 'error' ? 'error' : type === 'success' ? 'success' : 'primary') + ');">' + iconHtml + '</span><span>' + msg + '</span>';
          c.appendChild(t);
          setTimeout(() => {
            t.style.opacity = '0';
            t.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            t.style.transform = 'translateY(6px)';
            setTimeout(() => t.remove(), 200);
          }, duration);
        };
        window.astryxToast = window.modernToast;
      })();
    </script>
  `;
}

export const getAstryxToastScript = getModernToastScript;

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
