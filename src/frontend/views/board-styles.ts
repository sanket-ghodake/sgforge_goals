/**
 * Individual Goal Center - Board Tri-Deck Styles (2026 LTS)
 * Modular CSS styles for the 3-column tri-deck layout, colored header banners,
 * 3-priority badges (Critical, Medium, Low), action toolbar, and notes container.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

export function getBoardStyles(): string {
  return `
    .board-canvas-wrap {
      margin-bottom: 32px;
      animation: fadeIn 0.2s ease-out;
    }

    /* Top Bar with Board Switcher & Action Buttons */
    .board-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border);
      border-radius: 14px;
    }

    .board-switcher-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .board-switcher-label {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--forge-text-muted);
    }

    .board-switcher-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 10px;
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border-medium);
      color: var(--forge-text-main);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .board-switcher-badge:hover {
      border-color: var(--forge-primary);
      transform: translateY(-1px);
    }

    .board-switcher-container {
      position: relative;
    }

    .board-switcher-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 320px;
      max-width: 420px;
      max-height: 380px;
      overflow-y: auto;
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border-medium);
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
      z-index: 100;
      backdrop-filter: blur(16px);
      padding: 8px;
      display: none;
      flex-direction: column;
      gap: 4px;
    }

    .board-switcher-menu.open {
      display: flex;
      animation: fadeIn 0.15s ease-out;
    }

    .board-switcher-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      color: var(--forge-text-main);
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .board-switcher-item:hover {
      background: rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.2);
    }

    .board-switcher-item.active {
      background: rgba(99, 102, 241, 0.14);
      border-color: rgba(99, 102, 241, 0.35);
    }

    .board-action-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .board-btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      border: 1px solid var(--forge-border);
      background: var(--forge-bg-surface);
      color: var(--forge-text-main);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .board-btn-icon:hover {
      border-color: var(--forge-border-medium);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .board-btn-icon.green {
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }

    .board-btn-icon.green:hover {
      background: rgba(16, 185, 129, 0.16);
      border-color: #10b981;
    }

    .board-btn-icon.red {
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.08);
    }

    .board-btn-icon.red:hover {
      background: rgba(239, 68, 68, 0.16);
      border-color: #ef4444;
    }

    /* 3-Column Tri-Deck Grid Layout */
    .tri-deck-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 22px;
    }

    @media (max-width: 1024px) {
      .tri-deck-grid {
        grid-template-columns: 1fr;
      }
    }

    .tri-deck-card {
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .tri-deck-header {
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .tri-deck-header.blue { background: #1d4ed8; }
    .tri-deck-header.red { background: #dc2626; }
    .tri-deck-header.green { background: #15803d; }

    .tri-deck-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
      white-space: nowrap;
    }

    .tri-deck-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex: 1;
    }

    .tri-deck-section-title {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .tri-deck-section-title.blue { color: #2563eb; }
    .tri-deck-section-title.red { color: #dc2626; }
    .tri-deck-section-title.green { color: #16a34a; }

    [data-theme="dark"] .tri-deck-section-title.blue { color: #60a5fa; }
    [data-theme="dark"] .tri-deck-section-title.red { color: #f87171; }
    [data-theme="dark"] .tri-deck-section-title.green { color: #4ade80; }

    /* The 3 Priority Badges (Strict Standard) */
    .tri-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 5px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      line-height: 1.2;
      flex-shrink: 0;
    }

    .badge-critical { background: #dc2626; color: #ffffff; }
    .badge-medium { background: #d97706; color: #ffffff; }
    .badge-low { background: #2563eb; color: #ffffff; }

    /* Item Elements */
    .tri-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border);
      transition: all 0.15s ease;
    }

    .tri-item-row:hover {
      border-color: var(--forge-border-medium);
      transform: translateX(2px);
    }

    .tri-item-left {
      display: flex;
      align-items: center;
      gap: 9px;
      min-width: 0;
    }

    .tri-item-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--forge-text-main);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tri-plan-card {
      background: var(--forge-bg-surface);
      border: 1px solid var(--forge-border);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.15s ease;
    }

    .tri-plan-card:hover {
      border-color: var(--forge-border-medium);
    }

    .tri-plan-card.completed {
      opacity: 0.72;
      border-color: rgba(16, 185, 129, 0.35);
    }

    .tri-plan-card.completed .tri-item-title {
      text-decoration: line-through;
      color: var(--forge-text-muted);
    }

    .btn-add-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--forge-text-muted);
      background: transparent;
      border: 1px dashed var(--forge-border-medium);
      border-radius: 8px;
      padding: 7px 12px;
      cursor: pointer;
      width: 100%;
      justify-content: center;
      transition: all 0.18s ease;
      margin-top: 4px;
    }

    .btn-add-action:hover {
      color: var(--forge-primary);
      border-color: var(--forge-primary);
      background: rgba(99, 102, 241, 0.05);
    }

    /* Bottom Notes Bar */
    .board-notes-card {
      background: var(--forge-bg-card);
      border: 1px solid var(--forge-border);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .notes-label {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--forge-text-muted);
      margin-top: 6px;
      white-space: nowrap;
    }

    .notes-textarea {
      flex: 1;
      min-height: 48px;
      background: transparent;
      border: none;
      color: var(--forge-text-main);
      font-size: 0.86rem;
      font-family: var(--font-family);
      line-height: 1.45;
      resize: vertical;
      outline: none;
    }

    .notes-textarea:focus {
      background: rgba(255, 255, 255, 0.02);
    }
  `;
}
