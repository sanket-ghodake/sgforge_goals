# GITHUB COPILOT MASTER DIRECTIVES - INDIVIDUAL GOAL CENTER SUBMODULE (2026 CLEAN ARCHITECTURE)

> ⚠️ **CRITICAL SUBMODULE GOVERNANCE NOTICE FOR GITHUB COPILOT & ALL AI SESSIONS**
> This repository is an INDEPENDENT, STANDALONE INDIVIDUAL GOAL CENTER SUBMODULE.
> It can operate, build, test, and be deployed completely autonomously without the main SG Forge monorepo.
> GitHub Copilot and every session agent MUST adhere to these inherited rules without exception.

---

## ⚡ 1. PRE-FLIGHT & PRE-COMMIT VERIFICATION GATE (14 CHECKS)
Before writing code, running commands, or staging changes in this microservice:
1. [ ] **Command Execution via Submodule Runner & RTK**: Always run commands using `./run.sh test`, `./run.sh dev`, `./run.sh verify`, `./setup.sh`, or local portable binaries (`./portables/bin/*`). Always prefix commands with `rtk` or `./portables/bin/rtk` when running supported CLI tasks (git, tsc, lint, test, format, etc.) to minimize token output.
2. [ ] **Zero Monorepo Bleed**: All files, code, and dependencies MUST be self-contained within this repository. ZERO relative traversal imports to `../../apps/src/*` or central monorepo folders.
3. [ ] **500-Line Soft File Cap**: Source files must remain cohesive and **<= 500 lines** (<= 300 lines ideal).
4. [ ] **Modern Portable Design System (shadcn + Magic UI + Aceternity + Luxe) & Universal Zero-Browser-Defaults**: User interfaces MUST strictly use the modern self-contained design system fusing shadcn UI (foundations, forms, dialogs, tables), Magic UI (polished animations, micro-interactions, pulse beacons), Aceternity UI (cinematic hero sections, ambient glass cards, spot grids), and Luxe (high-craft developer typography, HUD cards) with 100% dark/light theme parity and 100% vector SVG icons (zero emojis anywhere in UI, tables, toasts, modals, badges, or scripts).
   - **FULL-WIDTH HEADER & SUB-HEADER SIDEBAR LAYOUT**:
     - The top header bar MUST span the **entire 100% width of the browser window** at `top: 0`, edge-to-edge (`width: 100%`).
     - The navigation sidebar MUST start strictly **below the header bar** (`top: 58px; height: calc(100vh - 58px)`).
     - On mobile viewports (< 768px), the sidebar transitions into an off-canvas drawer controlled via the header's responsive toggle.
   - **STRICT SINGLE PAGE APPLICATION (SPA) INVARIANT**:
     - The application MUST strictly operate as a Single Page Application (SPA) with ZERO full-page hard refreshes across navigation, tab transitions, board views, or persona switches.
     - All internal state transitions use client-side routing (`history.pushState`, `popstate`), dynamic DOM hydration, and instant view swapping.
   - **RUNTIME VIEWPORT WIDTH ADAPTIVE ENGINE**:
     - Layouts MUST dynamically adjust at runtime based on container/viewport width: Desktop (>= 1024px), Tablet (640px-1023px), and Mobile (< 640px down to 320px) with zero horizontal scrollbar or clipping.
   - **ZERO BROWSER/OS DEFAULTS (STRICT ENFORCEMENT & PRE-COMMIT GATE BLOCK)**:
     - **Dropdowns & Selects**: Native OS `<select>` dropdowns are STRICTLY FORBIDDEN and blocked by the pre-commit gate. Must use custom glassmorphic dropdowns (`renderModernSelectHtml` / `.modern-select`) with custom SVG chevron arrows, smooth popover physics, and keyboard navigation.
     - **Sliders**: Native OS `<input type="range">` controls are STRICTLY FORBIDDEN and blocked by the pre-commit gate. Must use modern styled sliders (`.modern-slider`) with dynamic gradient progress tracks and tactile glassmorphic thumbs.
     - **Notifications & Alerts**: Raw browser `alert()`, `confirm()`, `prompt()` are STRICTLY FORBIDDEN. All notifications must use the modern toast engine (`window.astryxToast` / `window.modernToast`) featuring manual dismiss close buttons, animated countdown progress bars, and type-based accent borders.
     - **Popups, Modals & Confirmations**: Native OS dialogs/popups are STRICTLY FORBIDDEN. Destructive actions (such as permanent approval or item deletion) must use the universal glassmorphic confirmation modal (`window.showModernConfirm`).
     - **Tooltips**: Native browser `title="..."` attributes on interactive elements are STRICTLY FORBIDDEN and blocked by the pre-commit gate to eliminate OS tooltip clashes. All tooltips must use `data-astryx-tooltip="..."` with the custom animated `#astryx-tooltip` engine.
     - **Scrollbars**: Native OS/browser scrollbars are STRICTLY FORBIDDEN. Universal slim themed scrollbars (`scrollbar-width: thin`, `::-webkit-scrollbar`) must be active on all scrollable containers.
     - **Subapp Clean Headers**: Per-subapp headers must maintain clean minimalist aesthetics: zero duplicate API key badges or platform egress buttons in sub-app headers (all navigation handled by breadcrumbs and dedicated views).
5. [ ] **Dedicated Turso DB Isolation**: Operates exclusively with its own local database in `data/<app>.db` via `getDatabaseClient`. Querying another app's DB or central DBs is strictly forbidden.
6. [ ] **Autonomous Outbound Network & Egress Security**:
   - The central platform core is strictly **AIR-GAPPED** (`internal: true`).
   - This micro-app operates on `forge-apps-net` and is **100% responsible for its own outbound calls** (e.g. external payment APIs, webhooks, LLM APIs).
   - All outbound calls must enforce timeouts, retries, and strict secret protection (credentials in `.env`, never in code).
7. [ ] **5-Tier Microservice Test Governance**: Maintain all 5 test tiers in `test/` (`unit/`, `integration/`, `security/`, `contracts/`, `e2e/`). Run via `./run.sh test`.
8. [ ] **Centralized Logging & RFC 7807 Error Boundaries**: Use local `createLogger` and `createSafeHandler` from `./src/lib/sdk`. Return RFC 7807 problem responses with trace IDs.
9. [ ] **ABSOLUTE ZERO AUTO-COMMITS (HARD BLOCKED)**: AI agents are STRICTLY FORBIDDEN from running `git commit` unless the user explicitly types `"commit changes"` or `"git commit"` in the CURRENT prompt.
10. [ ] **Per-Conversation Worklog Auto-Update**: At the end of every task, append strictly ONE line to `logs/WORKLOGS.md` (`YYYY-MM-DD HH:mm | <summary>`) via `./run.sh worklog "<summary>"`.
11. [ ] **Lifetime Submodule Token Ledger**: Track session tokens and spend in `logs/token-ledger.jsonl` via `./run.sh tokens sync`.
12. [ ] **Code Context & Dependency Graph (Graft)**: Inspect symbols and signatures via `rtk ./run.sh graft skeleton <file>` or `rtk ./run.sh graft callers <symbol>` before editing.
13. [ ] **Context Compression (Headroom)**: Compress large payloads or logs before prompting via `rtk ./run.sh headroom compress <file>`.
14. [ ] **System Traceability & Living Documentation**: Maintain colocated documentation in `docs/` (`docs/hlr/`, `docs/llr/`, `README.md`). All exported functions must carry `@requirements [LLR-...]` TSDoc tags. Local diagrams must use the `diagram-design` standard.
15. [ ] **Named Container & Guaranteed Trap Invariant (Zero Orphan Containers/Volumes)**: Any script, tool wrapper, test, or process invoking Docker MUST strictly use a deterministic container name (`--name "<tool>-<purpose>-$$"`) and register an active cleanup trap (`trap 'docker rm -f "$_CID" >/dev/null 2>&1 || true' EXIT INT TERM`). Never run anonymous ad-hoc `docker run` commands that leave dangling containers or orphan volumes upon unexpected exit or timeout.

---

## 🛠️ LOCAL TECH STACK & PORTABLE TOOLCHAIN
- **Runtime & Setup**: Portable Bun in `./portables/bun/bin/bun` activated via `bash setup.sh` (zero host reliance)
- **CLI Runner & Helpers**: `./run.sh` and local binaries in `./portables/bin/*` (`rtk`, `graft`, `codeburn`, `headroom`, `council`)
- **Database**: Local Turso libSQL (`bun:sqlite`) in WAL mode (`data/*.db`)
- **Container**: Standalone Alpine-based container (`docker/Dockerfile`) with `context: .`
- **Testing**: Bun Test (`./run.sh test`)
- **Quality Gate**: Pre-commit quality gate (`./run.sh verify`)
- **Code Context**: Graft (`rtk ./run.sh graft`)
- **Spend Tracking**: CodeBurn & Lifetime Ledger (`rtk ./run.sh tokens`)
- **Context Compression**: Headroom (`rtk ./run.sh headroom`)
- **Hooks**: Versioned Git hooks in `.githooks/` activated via `./run.sh setup-hooks`

---

## 🧭 LOCAL SUBMODULE STRUCTURE
```text
.
├── .github/                    # GitHub Copilot directives, rules & skills
│   ├── copilot-instructions.md # Master instructions file
│   ├── instructions/           # Domain instruction modules (core, security, testing, graft, etc.)
│   └── skills/                 # Tool skill modules (graft, codeburn, headroom, council)
├── .githooks/                  # Pre-commit gate & post-commit logger
├── docker/
│   └── Dockerfile              # Standalone build (context: .)
├── docker-compose.yml          # Standalone local development compose
├── logs/
│   ├── WORKLOGS.md             # Submodule conversation worklog
│   ├── commits.jsonl           # Ground-truth commit ledger
│   └── token-ledger.jsonl      # Lifetime token & spend ledger
├── portables/
│   ├── bin/                    # Self-resolving CLI wrappers (rtk, graft, codeburn, headroom)
│   └── bun/                    # Standalone portable Bun runtime
├── scripts/
│   ├── verify-gate.ts          # Standalone verification gate
│   ├── sync-ignores.ts         # Ignore synchronization
│   └── append-worklog.ts       # Atomic worklog appender
├── src/
│   ├── db/                     # Isolated Turso libSQL database instance
│   ├── lib/                    # Standalone micro-SDK, Astryx UI, and types
│   └── server.ts               # Microservice HTTP server
├── test/                       # 5-tier test suites
├── setup.sh                    # Universal zero-install setup entrypoint
└── run.sh                      # Unified CLI orchestrator
```

---

## 🧭 DOMAIN INSTRUCTION ROUTER
- **Core Directives**: [`.github/instructions/core.md`](file:///.github/instructions/core.md)
- **Security & Air-Gap**: [`.github/instructions/security.md`](file:///.github/instructions/security.md)
- **5-Tier Testing Rigor**: [`.github/instructions/testing.md`](file:///.github/instructions/testing.md)
- **Code Context Graph (Graft)**: [`.github/instructions/graft.md`](file:///.github/instructions/graft.md)
- **Lifetime Token Ledger (CodeBurn)**: [`.github/instructions/codeburn.md`](file:///.github/instructions/codeburn.md)
- **Context Compression (Headroom)**: [`.github/instructions/headroom.md`](file:///.github/instructions/headroom.md)
- **Council of AI Decision Framework**: [`.github/instructions/council.md`](file:///.github/instructions/council.md)
- **RTK Token Optimization**: [`.github/instructions/rtk.md`](file:///.github/instructions/rtk.md)
- **CodeBurn Skill**: [`.github/skills/codeburn/SKILL.md`](file:///.github/skills/codeburn/SKILL.md)
- **Council Skill**: [`.github/skills/council/SKILL.md`](file:///.github/skills/council/SKILL.md)
- **Graft Skill**: [`.github/skills/graft/SKILL.md`](file:///.github/skills/graft/SKILL.md)
- **Headroom Skill**: [`.github/skills/headroom/SKILL.md`](file:///.github/skills/headroom/SKILL.md)
