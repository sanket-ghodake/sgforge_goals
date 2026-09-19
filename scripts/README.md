# Submodule Engineering Scripts (`scripts/`)

Enterprise Clean Architecture & Autonomous Micro-App Submodule (2026 LTS Baseline).
All scripts are organized into modular, purpose-driven subdirectories with zero host system dependencies.

---

## 📁 Directory Architecture

```
scripts/
├── run/                  # Modular CLI Runner Dispatchers (delegated by ./run.sh)
│   ├── env.sh            # Global submodule environment, zero-telemetry flags & paths
│   ├── core.sh           # Core lifecycle (setup, dev, start, test, reset-db, doctor, clean)
│   ├── docker.sh         # Standalone Docker & Compose lifecycle management
│   ├── quality.sh        # Quality gate, linters, SAST, SBOM, complexity, tokens
│   ├── ops.sh            # Production ops (database backup, permission hardening, gen-key)
│   └── help.sh           # Command catalog and contextual help manual
│
├── quality/              # Verification Gate, AST Analyzers, Security & SBOM
│   ├── verify-gate.ts    # 19-check pre-commit & CI verification quality gate
│   ├── verify-all-tools.ts # Comprehensive verification and timing for all 32 portable tools
│   ├── ast-complexity.ts # Local AST cyclomatic complexity (CCN <= 10) & line limits
│   ├── check-package-health.ts # Anti-slopsquatting, package age & permissive license defense
│   ├── exec-watchdog.ts  # Child process timeout watchdog & deadlock prevention engine
│   ├── generate-sbom.ts  # CycloneDX 1.5 JSON Software Bill of Materials generator
│   └── generate-sbom.sh  # Portable shell wrapper for SBOM generation
│
├── ai/                   # AI Tokens, Spend Analytics, Compression & Multi-Agent Council
│   ├── tokscale-runner.ts # Local Tokscale runner for token budgeting & CLI integration
│   ├── display-tokens.ts # Terminal visualizer for submodule token ledger
│   ├── sync-tokens.ts    # Ledger synchronizer ingesting session metrics to logs/token-ledger.jsonl
│   ├── council-runner.ts # The Council of AI 3-model multi-agent deliberation engine
│   └── headroom-runner.ts # Context compression & prompt optimization engine
│
└── ops/                  # Database Administration, File Sync & Pre-Commit Logging
    ├── backup-db.ts      # Zero-lock SQLite/Turso VACUUM snapshot backup engine
    ├── sync-ignores.ts   # Synchronizer for .gitignore, .dockerignore, .antigravityignore, etc.
    ├── append-worklog.ts # Atomic single-line task completion logger for logs/WORKLOGS.md
    └── log-commit.ts     # Pre-commit logger staging commit metadata in logs/commits.jsonl
```

---

## ⚡ Execution

All scripts are executed through the modular submodule CLI:
- `./run.sh <command>` (delegates directly to `scripts/run/*.sh`)
- Or via portable Bun: `bun run scripts/<category>/<script>.ts`
