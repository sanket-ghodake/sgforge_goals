/**
 * Individual Goal Center - Master Shell Layout Styles (2026 LTS)
 * Option 2: Deep Indigo + Electric Violet Palette.
 * Ultra-modern, premium, futuristic executive aesthetics.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

export function getLayoutStyles(): string {
  return `
    :root {
      /* Dark Theme: Premium Vercel / Supabase Dark Obsidian Palette */
      --forge-bg-root: #09090b;
      --forge-bg-surface: #121215;
      --forge-bg-header: rgba(18, 18, 21, 0.85);
      --forge-bg-card: rgba(24, 24, 27, 0.75);
      --forge-bg-card-hover: rgba(32, 32, 38, 0.90);
      --forge-border: rgba(255, 255, 255, 0.08);
      --forge-border-medium: rgba(255, 255, 255, 0.16);
      --forge-primary: #6366f1;
      --forge-primary-hover: #4f46e5;
      --forge-accent: #8b5cf6;
      --forge-text-main: #f4f4f5;
      --forge-text-muted: #a1a1aa;
      --forge-text-subtle: #71717a;
      --forge-success: #10b981;
      --forge-success-bg: rgba(16, 185, 129, 0.12);
      --forge-warning: #f59e0b;
      --forge-warning-bg: rgba(245, 158, 11, 0.12);
      --forge-error: #ef4444;
      --forge-error-bg: rgba(239, 68, 68, 0.12);
      --font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      --radius-card: 16px;
      --radius-btn: 12px;
      --radius-modal: 20px;
      --forge-glass-surface: rgba(18, 18, 21, 0.88);
      --forge-glass-border: rgba(255, 255, 255, 0.10);
    }

    [data-theme="light"] {
      /* Light Theme: Deep Indigo + Electric Violet (Requested Option 2) */
      --forge-bg-root: #f8f8fc;
      --forge-bg-surface: #ffffff;
      --forge-bg-header: rgba(255, 255, 255, 0.90);
      --forge-bg-card: rgba(255, 255, 255, 0.96);
      --forge-bg-card-hover: #eef2ff;
      --forge-border: #e5e5ef;
      --forge-border-medium: #c7c7db;
      --forge-primary: #4f46e5;
      --forge-primary-hover: #4338ca;
      --forge-accent: #7c3aed;
      --forge-text-main: #111126;
      --forge-text-muted: #6b6b80;
      --forge-text-subtle: #8e8ea8;
      --forge-success: #059669;
      --forge-success-bg: #ecfdf5;
      --forge-warning: #d97706;
      --forge-warning-bg: #fffbeb;
      --forge-error: #dc2626;
      --forge-error-bg: #fef2f2;
      --forge-glass-surface: rgba(255, 255, 255, 0.88);
      --forge-glass-border: rgba(0, 0, 0, 0.08);
    }

    [data-theme="light"] .aceternity-hero-grid {
      background-image: none;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-family);
      background-color: var(--forge-bg-root);
      color: var(--forge-text-main);
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--forge-border-medium); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--forge-primary); }

    /* Top Full-Width Header Bar */
    .app-header-full {
      position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 58px;
      background: var(--forge-bg-header); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--forge-border); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      z-index: 250; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .mobile-nav-toggle {
      display: none; width: 36px; height: 36px; border-radius: var(--radius-btn); border: 1px solid var(--forge-border);
      background: transparent; color: var(--forge-text-main); align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;
    }
    .mobile-nav-toggle:hover { background: rgba(124, 58, 237, 0.08); transform: scale(1.05); }
    .header-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; }
    .brand-icon {
      width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent));
      display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 2px 12px rgba(79, 70, 229, 0.35);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .header-brand:hover .brand-icon { transform: rotate(8deg) scale(1.08); }
    .brand-title { font-size: 1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--forge-text-main); }
    .header-breadcrumbs {
      display: flex; align-items: center; gap: 8px; font-size: 0.825rem; color: var(--forge-text-muted);
      margin-left: 10px; padding-left: 12px; border-left: 1px solid var(--forge-border);
    }
    .header-breadcrumbs a { color: var(--forge-text-muted); text-decoration: none; transition: color 0.15s; }
    .header-breadcrumbs a:hover { color: var(--forge-text-main); }
    .header-right { display: flex; align-items: center; gap: 10px; }

    /* Sub-Header Layout & Curvy Floating Sidebar */
    .app-layout-body { margin-top: 58px; display: flex; min-height: calc(100vh - 58px); width: 100%; }
    .sb-sidebar {
      position: fixed; top: 66px; left: 10px; bottom: 10px; width: 68px; height: calc(100vh - 76px);
      background: var(--forge-bg-surface); border: 1px solid var(--forge-border); border-radius: 18px; z-index: 50;
      transition: width 0.28s cubic-bezier(0.34, 1.25, 0.64, 1), box-shadow 0.28s ease, border-color 0.2s ease;
      overflow-x: hidden; overflow-y: auto; display: flex; flex-direction: column; backdrop-filter: blur(16px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
    }
    .sb-sidebar:hover, html.sidebar-pinned .sb-sidebar {
      width: 240px; box-shadow: 0 14px 40px rgba(79, 70, 229, 0.18); border-color: var(--forge-border-medium);
    }

    .sb-nav-group { padding: 12px 9px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .sb-nav-item {
      display: flex; align-items: center; gap: 14px; height: 44px; padding: 0 12px; border-radius: 12px;
      color: var(--forge-text-muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative;
    }
    .sb-nav-item:hover { background: rgba(79, 70, 229, 0.08); color: var(--forge-text-main); transform: translateX(2px); }
    [data-theme="light"] .sb-nav-item:hover { background: #eef2ff; color: #4f46e5; }
    .sb-nav-item.active {
      background: rgba(79, 70, 229, 0.15); color: var(--forge-primary); font-weight: 600;
      border: 1px solid rgba(79, 70, 229, 0.28); box-shadow: 0 3px 12px rgba(79, 70, 229, 0.18);
    }
    [data-theme="light"] .sb-nav-item.active { background: #eef2ff; color: #4f46e5; border-color: rgba(79, 70, 229, 0.3); }

    .sb-nav-icon {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.15s ease;
    }
    .sb-nav-item:hover .sb-nav-icon { transform: scale(1.16); color: var(--forge-primary); }
    .sb-nav-label { opacity: 0; transition: opacity 0.18s ease; }
    .sb-sidebar:hover .sb-nav-label, html.sidebar-pinned .sb-sidebar .sb-nav-label { opacity: 1; }

    .sb-badge {
      margin-left: auto; font-size: 0.7rem; padding: 2px 7px; border-radius: 9999px; background: var(--forge-primary);
      color: #ffffff; font-weight: 700; opacity: 0; transition: opacity 0.18s ease;
    }
    .sb-sidebar:hover .sb-badge, html.sidebar-pinned .sb-sidebar .sb-badge { opacity: 1; }
    .sb-footer { padding: 12px 9px; border-top: 1px solid var(--forge-border); display: flex; flex-direction: column; gap: 4px; }

    /* Main Viewport Container */
    .app-viewport { margin-left: 86px; flex: 1; display: flex; flex-direction: column; min-width: 0; transition: margin-left 0.28s cubic-bezier(0.34, 1.25, 0.64, 1); }
    html.sidebar-pinned .app-viewport { margin-left: 258px; }
    .content-area { padding: 28px 24px; flex: 1; max-width: 1360px; width: 100%; margin: 0 auto; }

    /* 4-Library Modern UI Primitives (Vercel / Supabase Premium Dark Palette) */
    .aceternity-hero-grid { background-image: none; }
    
    .luxe-hud-card {
      background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: var(--radius-card); padding: 20px;
      position: relative; overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .luxe-hud-card:hover {
      border-color: rgba(124, 58, 237, 0.4); transform: translateY(-4px) scale(1.01);
      box-shadow: 0 16px 36px -6px rgba(79, 70, 229, 0.22), 0 0 0 1px rgba(124, 58, 237, 0.2);
    }
    .luxe-metric-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--forge-text-muted); display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .luxe-metric-val { font-size: 2rem; font-weight: 700; color: var(--forge-text-main); font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 6px; }
    .luxe-tag { font-family: var(--font-mono); font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; background: rgba(124, 58, 237, 0.08); border: 1px solid var(--forge-border); color: var(--forge-accent); font-weight: 600; }

    .magic-pulse-beacon { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; color: var(--forge-success); }
    .magic-pulse-beacon::before {
      content: ""; width: 8px; height: 8px; border-radius: 50%; background-color: var(--forge-success);
      box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); animation: magicPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes magicPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(5, 150, 105, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
    }

    .btn-icon {
      width: 36px; height: 36px; border-radius: var(--radius-btn); border: 1px solid var(--forge-border); background: transparent;
      color: var(--forge-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-icon:hover { background: rgba(79, 70, 229, 0.1); color: var(--forge-text-main); border-color: var(--forge-border-medium); transform: scale(1.05); }
    .btn-icon:active { transform: scale(0.95); }

    .btn-action {
      height: 36px; padding: 0 16px; border-radius: var(--radius-btn); font-size: 0.825rem; font-weight: 600; display: inline-flex;
      align-items: center; gap: 7px; cursor: pointer; border: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
    }
    .btn-action svg { transition: transform 0.2s ease; }
    .btn-action:hover svg { transform: translateX(2px); }
    .btn-primary { background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent)); color: #ffffff; box-shadow: 0 3px 14px rgba(79, 70, 229, 0.35); }
    .btn-primary:hover { background: linear-gradient(135deg, var(--forge-primary-hover), var(--forge-accent)); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45); }
    .btn-primary:active { transform: translateY(0) scale(0.97); }

    .btn-outline { border: 1px solid var(--forge-border); background: rgba(255, 255, 255, 0.02); color: var(--forge-text-main); }
    .btn-outline:hover { background: rgba(79, 70, 229, 0.08); border-color: var(--forge-border-medium); transform: translateY(-1px); }
    .btn-outline:active { transform: scale(0.97); }

    .shadcn-select, select.milestone-category-select, select#drawerCommentItemSelect {
      width: 100%; height: 40px; border-radius: var(--radius-btn); background-color: var(--forge-bg-surface);
      border: 1px solid var(--forge-border-medium); color: var(--forge-text-main); padding: 0 34px 0 14px;
      font-size: 0.875rem; font-weight: 500; appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238b8b9e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .shadcn-select:hover, select.milestone-category-select:hover, select#drawerCommentItemSelect:hover {
      border-color: var(--forge-primary); background-color: var(--forge-bg-card);
    }
    .shadcn-select:focus, select.milestone-category-select:focus, select#drawerCommentItemSelect:focus {
      outline: none; border-color: var(--forge-primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
    }
    .shadcn-select option, select option {
      background-color: var(--forge-bg-surface); color: var(--forge-text-main); padding: 10px; font-size: 0.875rem;
    }

    .modal-backdrop {
      display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px); z-index: 300; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.18s ease;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: var(--forge-bg-surface); border: 1px solid var(--forge-border-medium); border-radius: 20px;
      width: 100%; max-width: 540px; max-height: calc(100vh - 80px); overflow-y: auto; padding: 28px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1); position: relative;
      animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalPop { from { transform: scale(0.95) translateY(14px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    /* Segmented Dual-View Switcher */
    .segmented-nav {
      display: inline-flex; gap: 4px; background: var(--forge-bg-surface); padding: 4px;
      border-radius: 14px; border: 1px solid var(--forge-border); backdrop-filter: blur(12px);
    }
    .segmented-nav-btn {
      padding: 8px 20px; border-radius: 10px; border: none; background: transparent;
      color: var(--forge-text-muted); cursor: pointer; font-size: 0.85rem; font-weight: 600;
      display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .segmented-nav-btn:hover { color: var(--forge-text-main); background: rgba(255, 255, 255, 0.04); }
    .segmented-nav-btn.active {
      background: linear-gradient(135deg, var(--forge-primary), var(--forge-accent));
      color: #ffffff; box-shadow: 0 3px 12px rgba(79, 70, 229, 0.35);
    }

    /* Right-Sliding Curvy Glassmorphic Review & Alerts Drawers (Starting below header bar at top: 58px) */
    .drawer-backdrop {
      display: none; position: fixed; top: 58px; left: 0; right: 0; bottom: 0; height: calc(100vh - 58px);
      background: rgba(0, 0, 0, 0.22); backdrop-filter: none; -webkit-backdrop-filter: none;
      z-index: 210; animation: fadeIn 0.2s ease;
    }
    .drawer-backdrop.open { display: block; }
    .drawer-pane {
      position: absolute; top: 0; right: 0; bottom: 0; width: 100%; max-width: 560px; height: 100%;
      background: var(--forge-glass-surface, rgba(18, 18, 34, 0.85));
      backdrop-filter: blur(28px) saturate(190%); -webkit-backdrop-filter: blur(28px) saturate(190%);
      border-left: 1px solid var(--forge-glass-border, rgba(255, 255, 255, 0.12)); border-top: none; border-bottom: none;
      border-radius: 24px 0 0 24px; box-shadow: -20px 0 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      z-index: 220; display: flex; flex-direction: column; overflow: hidden;
      transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drawer-backdrop.open .drawer-pane { transform: translateX(0); }

    .drawer-header {
      padding: 20px 24px; border-bottom: 1px solid var(--forge-border);
      background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-radius: 24px 0 0 0; display: flex; justify-content: space-between; align-items: center;
    }

    .drawer-body {
      flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px;
      background-image: none;
    }

    .drawer-footer {
      padding: 16px 20px; border-top: 1px solid var(--forge-border);
      background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-radius: 0 0 0 24px; display: flex; flex-direction: column; gap: 10px;
    }

    /* Chat & Review Timeline Bubbles */
    .chat-bubble {
      max-width: 88%; border-radius: 18px; padding: 14px 18px; font-size: 0.875rem;
      line-height: 1.45; position: relative; box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
      animation: slideUp 0.2s ease;
    }

    .chat-bubble-employee {
      align-self: flex-start; background: var(--forge-bg-card); border: 1px solid var(--forge-border);
      color: var(--forge-text-main); border-bottom-left-radius: 4px;
    }

    .chat-bubble-manager {
      align-self: flex-end; background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.25));
      border: 1px solid rgba(124, 58, 237, 0.35); color: var(--forge-text-main); border-bottom-right-radius: 4px;
    }

    .chat-bubble-rework {
      align-self: flex-start; background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35); color: var(--forge-text-main); border-bottom-left-radius: 4px;
    }

    .chat-bubble-approved {
      align-self: center; width: 100%; max-width: 100%; background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35); color: var(--forge-success); text-align: center;
      border-radius: 16px; padding: 16px;
    }

    .chat-bubble-system {
      align-self: center; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--forge-border);
      color: var(--forge-text-muted); font-size: 0.775rem; font-weight: 600; border-radius: 9999px;
      padding: 6px 16px; margin: 4px 0;
    }

    .chat-author {
      font-size: 0.75rem; font-weight: 700; color: var(--forge-primary); margin-bottom: 4px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .chat-timestamp { font-size: 0.7rem; font-weight: 400; color: var(--forge-text-subtle); }

    /* Executive Data Table & Org Impact Directory Styles */
    .explore-table-card {
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border);
      border-radius: var(--radius-card);
      overflow: hidden;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14);
    }
    .explore-table-wrapper {
      width: 100%;
      overflow-x: auto;
    }
    .explore-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    .explore-table th {
      background: rgba(255, 255, 255, 0.03);
      padding: 14px 18px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--forge-text-muted);
      border-bottom: 1px solid var(--forge-border-medium);
      white-space: nowrap;
    }
    .explore-table td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--forge-border);
      vertical-align: middle;
    }
    .explore-table-row {
      transition: background 0.15s ease;
    }
    .explore-table-row:hover {
      background: var(--forge-bg-card-hover);
    }
    .explore-table-row:last-child td {
      border-bottom: none;
    }
    /* Supabase-inspired Database View & Column Filter Styles */
    .db-col-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .db-col-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .db-col-type {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(124, 58, 237, 0.12);
      color: var(--forge-accent);
      font-weight: 600;
      text-transform: lowercase;
    }
    .db-col-filter {
      width: 100%;
      height: 28px;
      border-radius: 6px;
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border);
      color: var(--forge-text-main);
      padding: 0 8px;
      font-size: 0.72rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .db-col-filter:focus {
      outline: none;
      border-color: var(--forge-primary);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
    }
    select.db-col-filter {
      appearance: none;
      -webkit-appearance: none;
      padding-right: 20px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 6px center;
      cursor: pointer;
    }
    .db-row-index {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--forge-text-subtle);
      padding-right: 4px;
    }

    /* 2026 LTS Executive Profile Spotlight Hero & HUD Alignment Pods */
    .profile-hero-card {
      position: relative; background: var(--forge-bg-card); border: 1px solid var(--forge-border);
      border-radius: 20px; padding: 22px 26px; margin-bottom: 28px; display: flex;
      justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow: hidden; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .profile-hero-card::before {
      content: ""; position: absolute; top: -50px; left: -50px; width: 220px; height: 220px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, transparent 70%); pointer-events: none;
    }
    .profile-hero-card:hover {
      border-color: rgba(99, 102, 241, 0.35);
      box-shadow: 0 12px 36px -6px rgba(79, 70, 229, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }
    .profile-hero-left { display: flex; align-items: center; gap: 18px; min-width: 0; }
    .profile-avatar-wrap { position: relative; flex-shrink: 0; }
    .profile-avatar {
      width: 58px; height: 58px; border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
      display: flex; align-items: center; justify-content: center; color: #ffffff;
      font-weight: 800; font-size: 1.45rem; letter-spacing: -0.02em;
      box-shadow: 0 8px 24px -4px rgba(79, 70, 229, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35);
    }
    .profile-avatar-badge {
      position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%;
      background: #10b981; border: 2.5px solid var(--forge-bg-card); box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4);
    }
    .profile-hero-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
    .profile-user-name { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.025em; color: var(--forge-text-main); line-height: 1.2; }
    .profile-emp-code {
      font-family: var(--font-mono); font-size: 0.72rem; font-weight: 600; padding: 2px 8px;
      border-radius: 6px; background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.22);
      color: var(--forge-accent); letter-spacing: 0.04em;
    }
    .profile-role-badge {
      font-size: 0.75rem; font-weight: 600; padding: 2px 10px; border-radius: 9999px;
      background: rgba(79, 70, 229, 0.12); border: 1px solid rgba(79, 70, 229, 0.28);
      color: var(--forge-primary); display: inline-flex; align-items: center; gap: 5px;
    }
    .profile-meta-row { display: flex; align-items: center; gap: 14px; font-size: 0.8125rem; color: var(--forge-text-muted); flex-wrap: wrap; }
    .profile-meta-item { display: inline-flex; align-items: center; gap: 5px; }
    .profile-pods-group { display: flex; align-items: stretch; gap: 14px; flex-wrap: wrap; }
    .profile-hud-pod {
      background: var(--forge-bg-surface); border: 1px solid var(--forge-border);
      border-radius: 14px; padding: 12px 18px; display: flex; align-items: center;
      gap: 14px; min-width: 210px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .profile-hud-pod:hover { border-color: var(--forge-border-medium); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08); }
    .profile-pod-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .profile-pod-icon.indigo { background: rgba(79, 70, 229, 0.12); color: var(--forge-primary); border: 1px solid rgba(79, 70, 229, 0.2); }
    .profile-pod-icon.violet { background: rgba(124, 58, 237, 0.12); color: var(--forge-accent); border: 1px solid rgba(124, 58, 237, 0.2); }
    .profile-pod-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--forge-text-muted); margin-bottom: 2px; }
    .profile-pod-val { font-size: 0.875rem; font-weight: 700; color: var(--forge-text-main); white-space: nowrap; }
  `;
}
