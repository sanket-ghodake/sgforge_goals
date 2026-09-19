# ANTIGRAVITY & MULTI-AGENT MASTER DIRECTIVES - INDIVIDUAL GOAL CENTER SUBMODULE (2026 LTS)

> ⚠️ **CRITICAL SUBMODULE GOVERNANCE NOTICE FOR ALL AI AGENTS & SESSIONS**
> This repository is an INDEPENDENT, STANDALONE INDIVIDUAL GOAL CENTER SUBMODULE (`@forge-apps/goals`).
> It builds, runs, tests, and deploys autonomously without relying on central monorepo infrastructure.
> Antigravity, Gemini, GitHub Copilot, and every session agent MUST strictly adhere to these rules without exception.

---

## ⚡ 1. PRE-FLIGHT & PRE-COMMIT VERIFICATION GATE (15 CHECKS)

Before writing code, running commands, or staging changes in this microservice:

1. [ ] **Command Execution via Submodule Runner & RTK**: Always execute commands using `./run.sh <command>` (e.g. `./run.sh test`, `./run.sh dev`, `./run.sh verify`, `./run.sh doctor`) or portable binaries (`./portables/bin/*`). Always prefix commands with `rtk` or `./portables/bin/rtk` for CLI tasks to compress token consumption.
2. [ ] **Zero Monorepo Bleed**: All code, files, and dependencies MUST be strictly self-contained within this repository. ZERO relative traversal imports to `../../apps/src/*` or central monorepo folders.
3. [ ] **500-Line Soft File Cap**: Source files must remain cohesive and **<= 500 lines** (<= 300 lines ideal).
4. [ ] **Modern Portable Design System (shadcn + Magic UI + Aceternity + Luxe)**:
   - User interfaces MUST strictly use the self-contained design system fusing **shadcn UI** (foundations, forms, dialogs, tables), **Magic UI** (animations, pulse beacons), **Aceternity UI** (ambient glass cards, spotlights), and **Luxe** (high-craft developer typography, HUD cards).
   - **Zero Emojis Standard**: All icons must be rendered as 100% crisp vector SVGs (zero emojis in UI, tables, toasts, modals, badges, or scripts).
   - **Zero Browser/OS Defaults**: Raw browser `alert()`, `confirm()`, `prompt()`, and native OS `<select>` dropdowns are STRICTLY FORBIDDEN. Use custom glassmorphic toasts and custom themed dropdowns.
   - **Strict SPA & Responsive Layout**: Operate as a Single Page Application with dynamic client-side hydration, full-width header (`top: 0`), sidebar starting below header (`top: 58px`), and adaptive viewport handling down to 320px.
5. [ ] **Dedicated Turso DB Isolation**: Operates exclusively with its own local database in `data/goals.db` via `getDatabaseClient`. Querying another app's DB or central DBs is strictly forbidden.
6. [ ] **Autonomous Outbound Network & Air-Gap Invariant**: Core platform networks enforce `internal: true`. This micro-app is 100% responsible for its own egress calls with strict timeout, retry, and secret management.
7. [ ] **5-Tier Microservice Test Governance**: Maintain all 5 test tiers in `test/` (`unit/`, `integration/`, `security/`, `contracts/`, `e2e/`). Run via `./run.sh test`.
8. [ ] **Structured Logging & RFC 7807 Error Boundaries**: Use local `createLogger` and `createSafeHandler` from `./src/lib/sdk`. Return RFC 7807 problem responses with trace IDs.
9. [ ] **Named Container & Guaranteed Trap Invariant (Zero Orphan Containers/Volumes)**:
   - Any script, tool wrapper, test, or process invoking Docker MUST strictly use a deterministic container name (`--name "<tool>-<purpose>-$$"`).
   - Must register an active cleanup trap: `_cleanup() { docker rm -f "$_CID" >/dev/null 2>&1 || true; }; trap _cleanup EXIT INT TERM`.
   - Never run anonymous ad-hoc `docker run` commands that leave dangling containers or orphan volumes upon unexpected exit or timeout.
10. [ ] **Supply Chain & Anti-Slopsquatting Guard**: Zero unverified npm dependencies. Audit packages via `./run.sh check-pkg <pkg>`.
11. [ ] **Cyclomatic Complexity Cap**: Source functions must satisfy Cyclomatic Complexity $\text{CCN} \le 10$ and modular line limits, audited via `./run.sh complexity`.
12. [ ] **Permissive License Governance**: Package manifest must declare `"license": "Apache-2.0"`. Zero copyleft (GPL/AGPL) dependencies.
13. [ ] **Automated CycloneDX 1.5 SBOM**: Continuous SBOM generation via `./run.sh sbom`.
14. [ ] **System Traceability & Living Documentation**: All exported functions must carry `@requirements [LLR-...]` TSDoc tags matching documents in `docs/llr/`. OpenAPI 3.1 specifications in `docs/api/openapi.yaml`.
15. [ ] **ABSOLUTE ZERO AUTO-COMMITS (HARD BLOCKED)**: AI agents are STRICTLY FORBIDDEN from running `git commit` unless the user explicitly types `"commit changes"` or `"git commit"` in the CURRENT prompt. At the end of every task, append strictly ONE line to `logs/WORKLOGS.md` via `./run.sh worklog "<summary>"`.

---

## 🛠️ LOCAL TECH STACK & PORTABLE TOOLCHAIN

- **Runtime**: Portable Bun in `./portables/bun/bin/bun` activated via `./run.sh setup` (zero host reliance)
- **Modular CLI Runner**: `./run.sh <command>` delegating to `scripts/run/` (`env.sh`, `core.sh`, `docker.sh`, `quality.sh`, `ops.sh`, `help.sh`)
- **Database**: Local Turso libSQL (`bun:sqlite`) in WAL mode (`data/goals.db`)
- **Container**: Standalone Alpine-based container (`docker/Dockerfile`) with `context: .`
- **Testing**: Bun Test 5-Tier test suites (`./run.sh test`)
- **Quality Gate**: Pre-commit verification gate (`./run.sh verify`)
- **Static Analysis**: Biome (`./run.sh lint`), Knip (`./run.sh deadcode`), Gitleaks (`./run.sh secrets`), ShellCheck (`./run.sh shellcheck`), Semgrep (`./run.sh semgrep`)
- **Vulnerability & Compliance**: Trivy (`./run.sh trivy`), OSV-Scanner (`./run.sh vuln`), Syft SBOM (`./run.sh sbom`)
- **API Contracts**: Spectral (`./run.sh contracts`), Schemathesis (`./run.sh fuzz`)
- **Performance & Load**: Autocannon (`./run.sh benchmark`), k6 (`./run.sh loadtest`), Hyperfine (`./run.sh hyperfine`)
- **Monitoring & Metrics**: ctop (`./run.sh ctop`), Docker stats (`./run.sh monitor`), Lizard complexity (`./run.sh complexity`)
- **AI Tooling & Tokens**: Graft (`./run.sh graft`), Tokscale & CodeBurn (`./run.sh tokens`), Headroom (`./run.sh headroom`), Council (`./run.sh council`), Repomix (`./run.sh pack`)
- **Hooks**: Git hooks in `.githooks/` activated via `./run.sh setup-hooks`
