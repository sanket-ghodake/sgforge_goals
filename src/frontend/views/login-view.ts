/**
 * Individual Goal Center - Session Logged Out & Authentication Gateway View (2026 LTS)
 * Modern Glassmorphic Screen: Informs employee that session is logged out,
 * provides explicit "Log In Again" action button, and automatically redirects to Central Auth.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { getLayoutStyles } from './layout-styles';
import { escapeHtml } from '../../lib/ui';

export function resolveBrowserLoginUrl(req?: Request): string {
  const returnParam = encodeURIComponent('/apps/goals/');

  if (req) {
    const hostHeader = req.headers.get('host') || '';
    const forwardedHost = req.headers.get('x-forwarded-host') || '';
    const effectiveHost = forwardedHost || hostHeader;

    // If accessed through reverse proxy (e.g. localhost:8080 or port 80/443)
    if (effectiveHost.includes(':8080') || (!effectiveHost.includes(':8090') && effectiveHost)) {
      return `/auth/login?return_url=${returnParam}`;
    }
  }

  const envUrl = process.env.AUTH_SERVICE_URL || process.env.FORGE_GATEWAY_URL;
  if (envUrl) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.includes('proxy')) {
      clean = clean.replace('proxy', 'localhost');
    }
    const base = clean.endsWith('/auth') ? clean : `${clean}/auth`;
    return `${base}/login?return_url=${returnParam}`;
  }

  return `/auth/login?return_url=${returnParam}`;
}

export function renderSessionLoggedOutView(req?: Request): string {
  const loginUrl = resolveBrowserLoginUrl(req);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/apps/goals/">
  <title>Session Logged Out - Goal Center</title>
  <style>
    ${getLayoutStyles()}

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #09090b;
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--forge-text-main);
    }

    .logout-card {
      width: 100%;
      max-width: 460px;
      background: rgba(18, 18, 21, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      text-align: center;
      animation: logoutFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes logoutFadeIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .logout-icon-beacon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2));
      border: 1px solid rgba(245, 158, 11, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--forge-warning);
      margin: 0 auto 20px auto;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #f87171;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }

    .logout-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0 0 8px 0;
    }

    .logout-desc {
      font-size: 0.875rem;
      color: var(--forge-text-muted);
      line-height: 1.5;
      margin: 0 0 24px 0;
    }

    .btn-login-again {
      width: 100%;
      height: 46px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent));
      color: #ffffff;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.35);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-login-again:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(99, 102, 241, 0.5);
      filter: brightness(1.08);
    }

    .redirect-box {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.8125rem;
      color: var(--forge-text-muted);
    }

    .progress-bar-container {
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 9999px;
      margin-top: 10px;
      overflow: hidden;
    }

    .progress-bar-fill {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, var(--forge-primary), var(--forge-accent));
      transition: width 3s linear;
    }
  </style>
</head>
<body>
  <div class="logout-card">
    <div class="logout-icon-beacon">
      ${icons.lock}
    </div>

    <div class="status-badge">
      <span class="pulse-dot"></span>
      <span>Session Logged Out</span>
    </div>

    <h1 class="logout-title">Session Expired</h1>
    <p class="logout-desc">
      Your session is no longer active. To protect your corporate account and access your goal boards, please log in again.
    </p>

    <a href="${escapeHtml(loginUrl)}" class="btn-login-again" id="loginNowBtn">
      ${icons.logIn} Log In Again ${icons.arrowRight}
    </a>

    <div class="redirect-box">
      <div>Redirecting to Central Authentication in <strong id="countdown" style="color: #ffffff;">3</strong>s...</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="progressFill"></div>
      </div>
      <div style="margin-top: 10px; font-size: 0.75rem;">
        <a href="${escapeHtml(loginUrl)}" style="color: var(--forge-primary); text-decoration: none;">Click here if you are not redirected automatically</a>
      </div>
    </div>
  </div>

  <script>
    (function() {
      // Clear any stale persona or expired session residue
      document.cookie = 'goals_persona=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'forge_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

      var target = ${JSON.stringify(loginUrl)};
      var seconds = 3;
      var countEl = document.getElementById('countdown');
      var fillEl = document.getElementById('progressFill');

      setTimeout(function() {
        if (fillEl) fillEl.style.width = '0%';
      }, 50);

      var timer = setInterval(function() {
        seconds--;
        if (countEl) countEl.textContent = String(seconds);
        if (seconds <= 0) {
          clearInterval(timer);
          window.location.href = target;
        }
      }, 1000);
    })();
  </script>
</body>
</html>`;
}

export function renderLoginView(req?: Request): string {
  return renderSessionLoggedOutView(req);
}

export function renderLeadershipRestrictedView(user?: { email?: string | null; displayName?: string | null; jobTitle?: string | null }, req?: Request): string {
  const loginUrl = resolveBrowserLoginUrl(req);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/apps/goals/">
  <title>Leadership Clearance Required - Goal Center</title>
  <style>
    ${getLayoutStyles()}

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #09090b;
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--forge-text-main);
    }

    .clearance-card {
      width: 100%;
      max-width: 480px;
      background: rgba(18, 18, 21, 0.95);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 20px;
      padding: 36px 32px;
      text-align: center;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.08);
      backdrop-filter: blur(16px);
      position: relative;
    }

    .clearance-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .clearance-title {
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 10px 0;
      color: #ffffff;
    }

    .clearance-desc {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--forge-text-muted);
      margin: 0 0 24px 0;
    }

    .account-badge-box {
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }

    .account-badge-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--forge-text-muted);
    }

    .btn-clearance-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 42px;
      background: var(--forge-primary);
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
      margin-bottom: 10px;
    }

    .btn-clearance-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .btn-clearance-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 40px;
      background: transparent;
      border: 1px solid var(--forge-border);
      color: var(--forge-text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }

    .btn-clearance-secondary:hover {
      color: var(--forge-text-main);
      border-color: var(--forge-border-medium);
    }
  </style>
</head>
<body>
  <div class="clearance-card">
    <div class="clearance-badge">
      ${icons.shieldAlert}
      <span>Leadership Clearance Required</span>
    </div>

    <h1 class="clearance-title">Manager Access Only</h1>
    <p class="clearance-desc">
      Individual Goal Center oversight and review workspaces are restricted to People Managers, Department Leads, and Executive Leadership.
    </p>

    ${user?.email ? `
      <div class="account-badge-box">
        <div class="account-badge-avatar">
          ${escapeHtml((user.displayName || user.email || 'U').charAt(0).toUpperCase())}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: 600; font-size: 0.85rem; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(user.displayName || 'Current User')}
          </div>
          <div style="font-size: 0.75rem; color: var(--forge-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(user.email)} &bull; ${escapeHtml(user.jobTitle || 'Individual Contributor')}
          </div>
        </div>
      </div>
    ` : ''}

    <a href="${escapeHtml(loginUrl)}" class="btn-clearance-primary">
      ${icons.logIn} Switch to Manager Account
    </a>

    <a href="/portal" class="btn-clearance-secondary">
      ${icons.arrowRight} Return to Forge Platform Portal
    </a>
  </div>
</body>
</html>`;
}
