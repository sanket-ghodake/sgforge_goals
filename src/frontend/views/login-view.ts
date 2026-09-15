/**
 * Individual Goal Center - Standalone App Login View (2026 LTS)
 * Premium Vercel / Supabase obsidian dark aesthetic login page.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { icons } from '../../lib/icons';
import { getLayoutStyles } from './layout-styles';

export function renderLoginView(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/apps/goals/">
  <title>Sign In - Individual Goal Center</title>
  <style>
    ${getLayoutStyles()}

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #09090b;
      margin: 0;
      padding: 20px;
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      background: rgba(18, 18, 21, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 20px;
      padding: 32px 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      animation: loginFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes loginFadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .login-brand-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      margin: 0 auto 14px auto;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }

    .login-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--forge-text-main);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .login-subtitle {
      font-size: 0.85rem;
      color: var(--forge-text-muted);
      line-height: 1.4;
    }

    .persona-card {
      background: rgba(24, 24, 27, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      margin-bottom: 10px;
    }

    .persona-card:hover {
      border-color: var(--forge-primary);
      background: rgba(32, 32, 38, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    }

    .persona-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--forge-text-main);
    }

    .persona-dept {
      font-size: 0.75rem;
      color: var(--forge-text-muted);
      margin-top: 2px;
    }

    .divider-text {
      display: flex;
      align-items: center;
      margin: 20px 0;
      font-size: 0.75rem;
      color: var(--forge-text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .divider-text::before, .divider-text::after {
      content: "";
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
    }
    .divider-text span { padding: 0 12px; }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--forge-text-muted);
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      height: 40px;
      border-radius: 10px;
      background: rgba(24, 24, 27, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--forge-text-main);
      padding: 0 14px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--forge-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <div class="login-brand-icon">
        ${icons.target}
      </div>
      <h1 class="login-title">Individual Goal Center</h1>
      <p class="login-subtitle">
        Sign in to access your goal boards, milestone velocity, and review flight plans.
      </p>
    </div>

    <!-- Central SG Forge SSO Authentication -->
    <div style="margin-bottom: 20px;">
      <a href="/auth/login" class="btn-action btn-primary" style="width: 100%; height: 44px; justify-content: center; font-size: 0.9rem; text-decoration: none; display: flex; align-items: center; border-radius: 10px;">
        ${icons.shieldCheck} Authenticate via SG Forge SSO
      </a>
    </div>

    <div class="divider-text">
      <span>Or Sign In with Corporate Credentials</span>
    </div>

    <form id="directLoginForm" onsubmit="handleDirectLogin(event)">
      <div class="form-group">
        <label class="form-label">Corporate Email Address</label>
        <input type="email" id="loginEmail" class="form-input" placeholder="e.g. user@forge.internal" required value="" />
      </div>

      <div class="form-group" style="margin-bottom: 22px;">
        <label class="form-label">Session Token / Secret</label>
        <input type="password" id="loginToken" class="form-input" placeholder="Enter session token..." value="" required />
      </div>

      <button type="submit" class="btn-action btn-outline" style="width: 100%; height: 42px; justify-content: center; font-size: 0.9rem;">
        ${icons.logIn} Access Goal Center
      </button>
    </form>
  </div>

  <script>
    function loginWithPersona(persona) {
      fetch('api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: persona })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        window.location.href = '?tab=dashboard';
      })
      .catch(function(err) {
        if (window.astryxToast) {
          window.astryxToast('Authentication failed: ' + err.message, 'error');
        } else {
          console.error('Authentication failed: ' + err.message);
        }
      });
    }

    function handleDirectLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const persona = email.includes('sarah') ? 'manager' : email.includes('morgan') ? 'solo' : 'employee';
      loginWithPersona(persona);
    }
  </script>
</body>
</html>`;
}
