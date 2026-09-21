/**
 * Individual Goal Center - Board Tri-Deck Styles (2026 LTS)
 * Modular CSS styles for the 3-column tri-deck layout, colored header banners,
 * 3-priority badges (Critical, Medium, Low), action toolbar, and notes container.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

export function getBoardStyles(): string {
  return `
    .board-canvas-wrap { margin-bottom: 32px; animation: fadeIn 0.2s ease-out; }

    /* Top Bar with Board Switcher & Action Buttons */
    .board-top-bar {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 14px; margin-bottom: 20px; padding: 12px 16px;
      background: var(--forge-bg-card); border: 1px solid var(--forge-border); border-radius: 14px;
    }
    .board-switcher-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .board-switcher-label {
      font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--forge-text-muted);
    }
    .board-switcher-badge {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
      border-radius: 10px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border-medium);
      color: var(--forge-text-main); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
    }
    .board-switcher-badge:hover { border-color: var(--forge-primary); transform: translateY(-1px); }
    .board-switcher-container { position: relative; }
    .board-switcher-menu {
      position: absolute; top: calc(100% + 8px); left: 0; min-width: 320px; max-width: 420px;
      max-height: 380px; overflow-y: auto; background: var(--forge-bg-card);
      border: 1px solid var(--forge-border-medium); border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25); z-index: 100; backdrop-filter: blur(16px);
      padding: 8px; display: none; flex-direction: column; gap: 4px;
    }
    .board-switcher-menu.open { display: flex; animation: fadeIn 0.15s ease-out; }
    .board-switcher-item {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 9px 12px; border-radius: 8px; cursor: pointer; text-decoration: none;
      color: var(--forge-text-main); transition: all 0.15s ease; border: 1px solid transparent;
    }
    .board-switcher-item:hover { background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.2); }
    .board-switcher-item.active { background: rgba(99, 102, 241, 0.14); border-color: rgba(99, 102, 241, 0.35); }

    .board-action-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .board-btn-icon {
      width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--forge-border);
      background: var(--forge-bg-surface); color: var(--forge-text-main); display: inline-flex;
      align-items: center; justify-content: center; cursor: pointer; transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .board-btn-icon:hover { border-color: var(--forge-border-medium); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
    .board-btn-icon.green { color: #10b981; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.08); }
    .board-btn-icon.green:hover { background: rgba(16, 185, 129, 0.16); border-color: #10b981; }
    .board-btn-icon.red { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); }
    .board-btn-icon.red:hover { background: rgba(239, 68, 68, 0.16); border-color: #ef4444; }

    /* 3-Column Tri-Deck Grid Layout */
    .tri-deck-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 22px; }
    @media (max-width: 1024px) { .tri-deck-grid { grid-template-columns: 1fr; } }

    .tri-deck-card {
      background: var(--forge-bg-card); border: 1px solid var(--forge-border);
      border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
    .tri-deck-header {
      padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;
      color: #ffffff; font-size: 0.92rem; font-weight: 800; letter-spacing: 0.02em;
    }
    .tri-deck-header.blue { background: #1d4ed8; }
    .tri-deck-header.red { background: #dc2626; }
    .tri-deck-header.green { background: #15803d; }
    .tri-deck-pill {
      font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 9999px;
      background: rgba(255, 255, 255, 0.22); color: #ffffff; white-space: nowrap;
    }

    .tri-deck-body { padding: 18px; display: flex; flex-direction: column; gap: 20px; flex: 1; }
    .tri-deck-section-title {
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em;
      text-transform: uppercase; margin-bottom: 10px;
    }
    .tri-deck-section-title.blue { color: #2563eb; }
    .tri-deck-section-title.red { color: #dc2626; }
    .tri-deck-section-title.green { color: #16a34a; }
    [data-theme="dark"] .tri-deck-section-title.blue { color: #60a5fa; }
    [data-theme="dark"] .tri-deck-section-title.red { color: #f87171; }
    [data-theme="dark"] .tri-deck-section-title.green { color: #4ade80; }

    /* The 3 Priority Badges */
    .tri-badge {
      font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
      letter-spacing: 0.04em; text-transform: uppercase; display: inline-flex;
      align-items: center; line-height: 1.2; flex-shrink: 0;
    }
    .badge-critical { background: #dc2626; color: #ffffff; }
    .badge-medium { background: #d97706; color: #ffffff; }
    .badge-low { background: #2563eb; color: #ffffff; }
    .tri-badge.clickable {
      cursor: pointer; user-select: none;
      transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, filter 0.15s ease;
    }
    .tri-badge.clickable:hover { transform: translateY(-1px) scale(1.05); filter: brightness(1.12); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22); }
    .tri-badge.clickable:active { transform: scale(0.95); }

    /* Item Elements */
    .tri-item-row {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 8px 12px; border-radius: 8px; background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border); transition: all 0.15s ease;
    }
    .tri-item-row:hover { border-color: var(--forge-border-medium); transform: translateX(2px); }
    .tri-item-left { display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; }
    .tri-item-title {
      font-size: 0.85rem; font-weight: 600; color: var(--forge-text-main);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .tri-item-title.editable {
      cursor: pointer; border-radius: 4px; padding: 1px 4px; margin: -1px -4px;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .tri-item-title.editable:hover {
      background: rgba(99, 102, 241, 0.1); color: var(--forge-primary);
      text-decoration: underline dotted var(--forge-primary);
    }
    .tri-item-title-input {
      font-size: 0.85rem; font-weight: 600; font-family: inherit; color: var(--forge-text-main);
      background: var(--forge-bg-card); border: 1.5px solid var(--forge-primary);
      border-radius: 6px; padding: 2px 8px; outline: none; flex: 1; min-width: 80px;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    .tri-item-title-input:focus { border-color: var(--forge-primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25); }

    .tri-plan-card {
      background: var(--forge-bg-surface); border: 1px solid var(--forge-border);
      border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column;
      gap: 8px; transition: all 0.15s ease;
    }
    .tri-plan-card:hover { border-color: var(--forge-border-medium); }
    .tri-plan-card.completed { opacity: 0.72; border-color: rgba(16, 185, 129, 0.35); }
    .tri-plan-card.completed .tri-item-title { text-decoration: line-through; color: var(--forge-text-muted); }

    .btn-add-action {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600;
      color: var(--forge-text-muted); background: transparent; border: 1px dashed var(--forge-border-medium);
      border-radius: 8px; padding: 7px 12px; cursor: pointer; width: 100%; justify-content: center;
      transition: all 0.18s ease; margin-top: 4px;
    }
    .btn-add-action:hover { color: var(--forge-primary); border-color: var(--forge-primary); background: rgba(99, 102, 241, 0.05); }

    /* Bottom Notes & Strategic Context Deck */
    .board-notes-card {
      background: var(--forge-bg-card); border: 1px solid var(--forge-border);
      border-radius: 14px; padding: 16px 20px; display: flex; flex-direction: column;
      gap: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }
    .board-notes-header {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    }
    .board-notes-title-group { display: flex; align-items: center; gap: 9px; }
    .board-notes-icon {
      width: 28px; height: 28px; border-radius: 7px; background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.22); color: var(--forge-primary);
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .board-notes-title { font-size: 0.86rem; font-weight: 800; color: var(--forge-text-main); letter-spacing: 0.02em; }
    .board-notes-subtitle { font-size: 0.71rem; color: var(--forge-text-muted); }
    .board-notes-meta { display: flex; align-items: center; gap: 8px; }
    .board-notes-status {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700;
      padding: 2px 9px; border-radius: 9999px; background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; user-select: none;
    }
    .board-notes-beacon {
      width: 6px; height: 6px; border-radius: 50%; background: #10b981;
      box-shadow: 0 0 6px #10b981; transition: all 0.2s ease;
    }
    .board-notes-beacon.saving { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }

    /* Dedicated Inner Text Box */
    .board-notes-box {
      background: var(--forge-bg-surface); border: 1px solid var(--forge-border);
      border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column;
      gap: 8px; transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .board-notes-box:focus-within {
      border-color: var(--forge-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      background: var(--forge-bg-card);
    }
    .notes-textarea {
      width: 100%; min-height: 54px; max-height: 200px; background: transparent;
      border: none; color: var(--forge-text-main); font-size: 0.86rem; font-family: inherit;
      line-height: 1.5; resize: vertical; outline: none; padding: 0;
    }
    .board-notes-footer {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid var(--forge-border); padding-top: 6px; font-size: 0.72rem; color: var(--forge-text-muted);
    }
    .board-notes-hint { display: inline-flex; align-items: center; gap: 5px; }
    .board-notes-counter { font-family: var(--font-mono); font-size: 0.7rem; color: var(--forge-text-muted); }

    /* Live Suggestions Autocomplete Dropdown */
    .tri-suggestions-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--forge-bg-card); border: 1px solid var(--forge-border);
      border-radius: 10px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      z-index: 1200; max-height: 240px; overflow-y: auto; padding: 5px;
      display: flex; flex-direction: column; gap: 3px;
      backdrop-filter: blur(16px);
    }
    .tri-suggestion-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 7px 11px; border-radius: 7px; cursor: pointer;
      font-size: 0.84rem; color: var(--forge-text-main);
      transition: background 0.15s ease, color 0.15s ease;
      user-select: none;
    }
    .tri-suggestion-item:hover, .tri-suggestion-item.active {
      background: rgba(99, 102, 241, 0.14);
      color: var(--forge-primary);
    }
    .tri-suggestion-title {
      font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .tri-suggestion-badge {
      display: inline-flex; align-items: center; font-size: 0.68rem; font-weight: 700;
      padding: 2px 7px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    .tri-suggestion-badge.core { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25); }
    .tri-suggestion-badge.strategic { background: rgba(139, 92, 246, 0.12); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.25); }
    .tri-suggestion-badge.gap { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }
    .tri-suggestion-badge.plan { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
    .tri-suggestion-count {
      font-size: 0.7rem; color: var(--forge-text-muted); font-family: var(--font-mono); flex-shrink: 0;
    }
    .tri-suggestion-hint {
      font-size: 0.72rem; color: var(--forge-text-muted); padding: 5px 9px; border-bottom: 1px solid var(--forge-border);
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;
    }

    /* Skill Gap - Plan Link Counters & Animations */
    @keyframes gapZoomPulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 0 16px 2px rgba(245, 158, 11, 0.28);
      }
    }
    .tri-gap-unlinked {
      border: 1px dashed rgba(245, 158, 11, 0.55) !important;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%) !important;
      animation: gapZoomPulse 2.8s ease-in-out infinite;
    }
    .gap-plans-count-badge {
      display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700;
      padding: 3px 9px; border-radius: 9999px; cursor: pointer; border: 1px solid transparent;
      transition: all 0.18s ease; user-select: none; background: transparent;
    }
    .gap-plans-count-badge.unlinked {
      background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.35);
    }
    .gap-plans-count-badge.unlinked:hover {
      background: rgba(245, 158, 11, 0.28); border-color: #f59e0b; transform: scale(1.06);
    }
    .gap-plans-count-badge.linked {
      background: rgba(16, 185, 129, 0.12); color: #34d399; border-color: rgba(16, 185, 129, 0.25);
    }
    .gap-plans-count-badge.linked:hover {
      background: rgba(16, 185, 129, 0.22); border-color: #10b981; transform: scale(1.06);
    }

    /* Microsoft Teams Meeting-Style Linked Gaps Circles on Training Plans */
    .teams-avatar-stack {
      display: inline-flex; align-items: center; position: relative; padding-left: 2px;
    }
    .teams-avatar-circle {
      width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--forge-bg-card);
      margin-left: -7px; display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); transition: transform 0.18s ease, z-index 0.18s ease;
      cursor: pointer; position: relative; user-select: none;
    }
    .teams-avatar-circle:first-child { margin-left: 0; }
    .teams-avatar-circle:hover { transform: scale(1.24) translateY(-2px); z-index: 10; }
    .teams-avatar-circle.critical { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; }
    .teams-avatar-circle.medium { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
    .teams-avatar-circle.low { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; }
    .teams-avatar-circle.overflow {
      background: var(--forge-bg-surface); color: var(--forge-text-muted);
      border-color: var(--forge-border); font-size: 0.6rem;
    }
    .teams-add-circle-btn {
      width: 22px; height: 22px; border-radius: 50%; border: 1px dashed rgba(99, 102, 241, 0.5);
      background: rgba(99, 102, 241, 0.08); color: var(--forge-primary); margin-left: 6px;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.18s ease; padding: 0;
    }
    .teams-add-circle-btn:hover {
      background: var(--forge-primary); color: #fff; border-style: solid; transform: scale(1.18);
    }

    /* Unlinked Training Plan Highlight Button */
    @keyframes buttonPulseHighlight {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
        border-color: rgba(245, 158, 11, 0.35);
      }
      50% {
        box-shadow: 0 0 10px 2px rgba(245, 158, 11, 0.35);
        border-color: rgba(245, 158, 11, 0.75);
      }
    }
    .plan-unlinked-highlight-btn {
      display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700;
      padding: 3px 10px; border-radius: 7px; background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.45); color: #fbbf24; cursor: pointer;
      transition: all 0.2s ease; animation: buttonPulseHighlight 2.4s ease-in-out infinite;
    }
    .plan-unlinked-highlight-btn:hover {
      background: rgba(245, 158, 11, 0.25); border-color: #f59e0b; transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
    }

    /* Link Candidate Popover & Items */
    .link-gap-plan-popover {
      position: fixed; z-index: 99999;
      background: var(--forge-bg-card); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--forge-border-medium);
      box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 24px rgba(99, 102, 241, 0.15);
      border-radius: 12px; padding: 12px 14px; box-sizing: border-box;
      display: flex; flex-direction: column; gap: 8px;
      animation: popoverFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      color: var(--forge-text-main);
    }
    @keyframes popoverFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(-4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .link-candidate-item {
      display: flex; align-items: center; justify-content: space-between; padding: 8px 10px;
      border-radius: 8px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border);
      transition: all 0.15s ease; cursor: pointer; gap: 8px;
    }
    .link-candidate-item:hover {
      border-color: var(--forge-primary); background: rgba(99, 102, 241, 0.05);
    }
    .link-candidate-item.linked {
      border-color: var(--forge-primary); background: rgba(99, 102, 241, 0.1);
    }

    /* Inline Item Creation & Cancel Icon */
    .inline-new-row {
      animation: inlineItemSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border-color: var(--forge-primary) !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18) !important;
    }
    @keyframes inlineItemSlideIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .btn-item-cancel:hover, .tri-edit-cancel-btn:hover {
      color: var(--forge-error) !important;
      background: rgba(239, 68, 68, 0.12) !important;
    }
  `;
}

