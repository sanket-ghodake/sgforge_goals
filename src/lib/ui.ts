/**
 * SG Forge Micro-App Submodule - Portable Modern UI Engine (2026 LTS)
 * Fused with shadcn UI, Magic UI, Aceternity, and Luxe design primitives.
 * 100% Isolated & Autonomous: Zero imports from central platform monorepo.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */

import { icons } from './icons';

export function getModernUiStyles(): string {
  return `
    :root {
      /* shadcn zinc/slate foundation palette */
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 10% 4.9%;
      --card-foreground: 0 0% 98%;
      --popover: 240 10% 4.9%;
      --popover-foreground: 0 0% 98%;
      --primary: 217.2 91.2% 59.8%;
      --primary-foreground: 0 0% 100%;
      --secondary: 240 3.7% 15.9%;
      --secondary-foreground: 0 0% 98%;
      --muted: 240 3.7% 15.9%;
      --muted-foreground: 240 5% 64.9%;
      --accent: 240 3.7% 15.9%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 3.7% 15.9%;
      --input: 240 3.7% 15.9%;
      --ring: 217.2 91.2% 59.8%;
      --radius: 0.5rem;

      /* Canonical --forge-* tokens for 100% backward compatibility */
      --forge-bg-root: #09090b;
      --forge-bg-surface: #121215;
      --forge-bg-card: rgba(18, 18, 21, 0.85);
      --forge-bg-card-hover: rgba(24, 24, 28, 0.95);
      --forge-bg-elevated: #18181b;
      --forge-border: rgba(255, 255, 255, 0.08);
      --forge-border-medium: rgba(255, 255, 255, 0.14);
      --forge-primary: #38bdf8;
      --forge-primary-hover: #0ea5e9;
      --forge-accent: #818cf8;
      --forge-text-main: #f8fafc;
      --forge-text-muted: #94a3b8;
      --forge-text-subtle: #64748b;
      --forge-success: #34d399;
      --forge-success-bg: rgba(52, 211, 153, 0.12);
      --forge-warning: #fbbf24;
      --forge-error: #f87171;
      --forge-radius: 8px;
      --forge-radius-sm: 6px;
      --forge-radius-full: 9999px;
      --font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
    }

    [data-theme="light"] {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 240 10% 3.9%;
      --primary: 221.2 83.2% 53.3%;
      --primary-foreground: 0 0% 98%;
      --secondary: 240 4.8% 95.9%;
      --secondary-foreground: 240 5.9% 10%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 240 4.8% 95.9%;
      --accent-foreground: 240 5.9% 10%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 221.2 83.2% 53.3%;

      --forge-bg-root: #f8fafc;
      --forge-bg-surface: #ffffff;
      --forge-bg-card: rgba(255, 255, 255, 0.95);
      --forge-bg-card-hover: #f1f5f9;
      --forge-bg-elevated: #ffffff;
      --forge-border: #e2e8f0;
      --forge-border-medium: #cbd5e1;
      --forge-primary: #0284c7;
      --forge-primary-hover: #0369a1;
      --forge-accent: #6366f1;
      --forge-text-main: #0f172a;
      --forge-text-muted: #64748b;
      --forge-text-subtle: #94a3b8;
      --forge-success: #059669;
      --forge-success-bg: rgba(5, 150, 105, 0.12);
      --forge-warning: #d97706;
      --forge-error: #dc2626;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--forge-bg-root);
      color: var(--forge-text-main);
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    /* Modern Slim Scrollbar (Zero OS Default) */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--forge-border-medium); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--forge-primary); }

    /* Layout Primitives */
    .astryx-container, .modern-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }

    /* shadcn Card Primitives */
    .astryx-card, .shadcn-card {
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border);
      border-radius: var(--forge-radius);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .astryx-card:hover, .shadcn-card:hover {
      border-color: var(--forge-border-medium);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12);
    }

    /* Luxe Developer HUD Metric Cards */
    .luxe-hud-card {
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border);
      border-radius: var(--forge-radius);
      padding: 1.25rem;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .luxe-metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--forge-text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .luxe-metric-val {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--forge-text-main);
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    /* Magic UI Micro-Interactions & Pulse Beacons */
    .magic-pulse-beacon {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--forge-success);
    }
    .magic-pulse-beacon::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--forge-success);
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
      animation: magicPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes magicPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
    }

    /* Aceternity Hero Grid & Spotlights */
    .aceternity-hero-grid {
      background-image: radial-gradient(var(--forge-border) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    [data-theme="light"] .aceternity-hero-grid {
      background-image: none;
    }

    /* Buttons & Interactive Elements */
    .astryx-btn, .shadcn-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: var(--forge-radius-sm);
      border: 1px solid var(--forge-border);
      background: var(--forge-bg-surface);
      color: var(--forge-text-main);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .astryx-btn:hover, .shadcn-btn:hover {
      background: var(--forge-bg-card-hover);
      border-color: var(--forge-border-medium);
      transform: translateY(-1px);
    }
    .astryx-btn-primary, .shadcn-btn-primary {
      background: var(--forge-primary);
      border-color: var(--forge-primary);
      color: #ffffff;
    }
    .astryx-btn-primary:hover, .shadcn-btn-primary:hover {
      background: var(--forge-primary-hover);
      border-color: var(--forge-primary-hover);
    }

    /* Header Nav Bar */
    .modern-header {
      position: sticky;
      top: 0;
      z-index: 40;
      width: 100%;
      background: var(--forge-bg-card);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--forge-border);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modern-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .modern-header-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--forge-text-main);
    }
    .modern-header-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      background: var(--forge-bg-root);
      border: 1px solid var(--forge-border);
      color: var(--forge-text-muted);
    }
    .modern-header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Universal Floating Toast Engine */
    .astryx-toast-container, .modern-toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    .astryx-toast, .modern-toast {
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border-medium);
      color: var(--forge-text-main);
      padding: 0.75rem 1rem;
      border-radius: var(--forge-radius-sm);
      font-size: 0.85rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      pointer-events: auto;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideIn {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Universal Floating Tooltip */
    #astryx-tooltip, #modern-tooltip {
      position: fixed;
      pointer-events: none;
      z-index: 100000;
      background: var(--forge-bg-surface);
      color: var(--forge-text-main);
      border: 1px solid var(--forge-border-medium);
      padding: 0.4rem 0.7rem;
      font-size: 0.75rem;
      border-radius: var(--forge-radius-sm);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.12s ease;
    }
  `;
}

export const getAstryxStyles = getModernUiStyles;

export {
  getHeadStateScript,
  getModernToastScript,
  getAstryxToastScript,
  getModernTooltipScript,
  getAstryxTooltipScript,
  getModernHeaderHtml,
  getAstryxHeaderHtml,
} from './ui-scripts';

export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips parenthetical designations or roles from display names (e.g. "Arjun Nair (Design Engineer)" -> "Arjun Nair").
 */
export function cleanDisplayName(name?: string | null): string {
  if (!name) return '';
  return String(name).replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getStatusBadge(status: string): { label: string; style: string } {
  switch (status) {
    case 'SUBMITTED':
      return {
        label: 'Under Review (Locked)',
        style: 'background: var(--forge-warning-bg); color: var(--forge-warning); border: 1px solid rgba(245, 158, 11, 0.35);',
      };
    case 'REWORK_REQUESTED':
      return {
        label: 'Revisions Requested',
        style: 'background: var(--forge-error-bg); color: var(--forge-error); border: 1px solid rgba(239, 68, 68, 0.35);',
      };
    case 'APPROVED':
      return {
        label: 'Approved & Sealed',
        style: 'background: var(--forge-success-bg); color: var(--forge-success); border: 1px solid rgba(16, 185, 129, 0.35);',
      };
    case 'LOCKED_OVERDUE':
      return {
        label: 'Deadline Passed (Locked)',
        style: 'background: var(--forge-error-bg); color: var(--forge-error); border: 1px solid rgba(239, 68, 68, 0.35);',
      };
    case 'UNLOCK_REQUESTED':
      return {
        label: 'Unlock Pending',
        style: 'background: var(--forge-warning-bg); color: var(--forge-warning); border: 1px solid rgba(245, 158, 11, 0.35);',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        style: 'background: var(--forge-success-bg); color: var(--forge-success); border: 1px solid rgba(16, 185, 129, 0.35);',
      };
    default:
      return {
        label: 'Draft (Editable)',
        style: 'background: rgba(255, 255, 255, 0.05); color: var(--forge-text-muted); border: 1px solid var(--forge-border);',
      };
  }
}

