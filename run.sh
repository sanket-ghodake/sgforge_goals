#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Autonomous Microservice CLI (2026 LTS)
# 100% Independent: Works standalone or embedded within SG Forge Monorepo
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Add local portables to PATH if present
export PATH="$DIR/portables/bin:$DIR/../../portables/bin:$DIR/../../portables/bun/bin:$PATH"

# Auto-copy .env.example to .env if .env is missing
if [ ! -f "$DIR/.env" ] && [ -f "$DIR/.env.example" ]; then
  echo "ℹ️ Auto-generating .env from .env.example..."
  cp "$DIR/.env.example" "$DIR/.env"
fi

CMD="${1:-help}"
shift || true

# Resolve Bun Runtime via 3-tier cascade (with autonomous setup bootstrap)
if [ -f "$DIR/portables/bun/bin/bun" ]; then
  BUN_BIN="$DIR/portables/bun/bin/bun"
elif [ -f "$DIR/../../portables/bun/bin/bun" ]; then
  BUN_BIN="$DIR/../../portables/bun/bin/bun"
elif command -v bun >/dev/null 2>&1; then
  BUN_BIN="bun"
elif [ "$CMD" = "setup" ]; then
  echo "📥 Bun runtime not detected on isolated machine. Auto-installing portable Bun..."
  if command -v curl >/dev/null 2>&1; then
    mkdir -p "$DIR/portables/bun"
    curl -fsSL https://bun.sh/install | BUN_INSTALL="$DIR/portables/bun" bash >/dev/null 2>&1 || true
  fi
  if [ -f "$DIR/portables/bun/bin/bun" ]; then
    BUN_BIN="$DIR/portables/bun/bin/bun"
  elif command -v bun >/dev/null 2>&1; then
    BUN_BIN="bun"
  else
    echo "❌ Error: Could not auto-install Bun. Please install Bun from https://bun.sh"
    exit 1
  fi
else
  echo "❌ Error: Bun runtime not found. Run './run.sh setup' to bootstrap or install Bun from https://bun.sh"
  exit 1
fi

ensure_gateway_network() {
  local net_name="${FORGE_APPS_NETWORK:-${CONTAINER_PREFIX:-ag}_forge_apps_net}"
  if ! docker network inspect "$net_name" >/dev/null 2>&1; then
    echo "🌐 Creating standalone gateway network: $net_name..."
    docker network create "$net_name" >/dev/null 2>&1 || true
  fi
}

case "$CMD" in
  setup)
    echo "⚡ [Forge App] Bootstrapping autonomous micro-app environment..."
    if [ ! -f "$DIR/.env" ] && [ -f "$DIR/.env.example" ]; then
      echo "📄 Provisioning .env from .env.example..."
      cp "$DIR/.env.example" "$DIR/.env"
    fi
    echo "⚓ Hardening script permissions & Git configuration..."
    chmod +x "$DIR"/run.sh "$DIR"/env.sh "$DIR"/portables/bin/* "$DIR"/.githooks/* 2>/dev/null || true
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git config core.filemode false
      git config core.autocrlf false
      git config core.hooksPath .githooks
    fi
    echo "📦 Installing microservice dependencies with Bun..."
    "$BUN_BIN" install
    APP_NAME="$(grep -E '^APP_NAME=' "$DIR/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo 'template')"
    DB_FILE="$DIR/data/${APP_NAME}.db"
    if [ ! -f "$DB_FILE" ]; then
      echo "🌱 Bootstrapping dedicated local Turso DB ($DB_FILE)..."
      mkdir -p "$DIR/data"
      "$BUN_BIN" -e "
        import { Database } from 'bun:sqlite';
        const db = new Database('$DB_FILE');
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA foreign_keys = ON;');
        db.run('CREATE TABLE IF NOT EXISTS ${APP_NAME.replace(/-/g, '_')}_records (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT \"ACTIVE\", created_at INTEGER NOT NULL);');
        db.close();
      " 2>/dev/null || true
    fi
    "$BUN_BIN" run scripts/sync-ignores.ts
    mkdir -p "$DIR/logs"
    [ ! -f "$DIR/logs/WORKLOGS.md" ] && echo "# WORKLOGS" > "$DIR/logs/WORKLOGS.md"
    [ ! -f "$DIR/logs/commits.jsonl" ] && touch "$DIR/logs/commits.jsonl"
    [ ! -f "$DIR/logs/token-ledger.jsonl" ] && touch "$DIR/logs/token-ledger.jsonl"
    echo "✅ Using Bun: $($BUN_BIN --version)"
    echo "💡 Tips for IDE & Terminal PATH:"
    echo "   ├─ VS Code / Cursor: Terminal PATH is pre-configured via .vscode/settings.json"
    echo "   ├─ External Shells:  run 'source env.sh'"
    echo "   └─ Direct Fallback:  run './portables/bin/rtk <command>'"
    echo "✨ Setup completed successfully! Run './run.sh dev' to start."
    ;;
  dev)
    echo "🚀 Starting standalone micro-app in watch mode..."
    exec "$BUN_BIN" --watch src/server.ts "$@"
    ;;
  docs:dev|docs)
    echo "📖 Starting standalone micro-app with Living Documentation Engine..."
    echo "   ├─ App Interface:   http://localhost:${PORT:-8099}"
    echo "   ├─ Docs Hub:        http://localhost:${PORT:-8099}/docs"
    echo "   └─ OpenAPI 3.1:     http://localhost:${PORT:-8099}/docs/api"
    exec "$BUN_BIN" --watch src/server.ts "$@"
    ;;
  docs:coverage|doc-coverage)
    echo "📑 Running Living Documentation & Traceability Gate..."
    exec "$BUN_BIN" run scripts/verify-gate.ts "$@"
    ;;
  start)
    echo "⚡ Starting standalone micro-app..."
    exec "$BUN_BIN" src/server.ts "$@"
    ;;
  test)
    echo "🧪 Running 5-tier microservice tests..."
    exec "$BUN_BIN" test "$@"
    ;;
  verify)
    echo "🛡️ Running pre-commit quality verification gate..."
    exec "$BUN_BIN" run scripts/verify-gate.ts "$@"
    ;;
  backup)
    echo "💾 Running autonomous database backup..."
    exec "$BUN_BIN" run scripts/backup-db.ts "$@"
    ;;
  build)
    echo "🐳 Building standalone Docker image..."
    exec docker build -f docker/Dockerfile -t "${PWD##*/}" "$@" .
    ;;
  compose|docker|up)
    ensure_gateway_network
    if [ $# -eq 0 ]; then
      set -- up -d
    fi
    echo "🐳 Running standalone Docker Compose ($*)..."
    exec docker compose "$@"
    ;;
  graft)
    echo "🧠 Running Graft Code Context Graph..."
    exec "$DIR/portables/bin/graft" "$@"
    ;;
  tokens)
    SUB_CMD="${1:-dashboard}"
    shift || true
    case "$SUB_CMD" in
      sync)
        exec "$BUN_BIN" run scripts/sync-tokens.ts "$@"
        ;;
      tui)
        exec "$DIR/portables/bin/codeburn" "$@"
        ;;
      dashboard|*)
        exec "$BUN_BIN" run scripts/display-tokens.ts "$@"
        ;;
    esac
    ;;
  headroom)
    exec "$DIR/portables/bin/headroom" "$@"
    ;;
  council)
    exec "$DIR/portables/bin/council" "$@"
    ;;
  worklog)
    if [ $# -eq 0 ]; then
      echo "❌ Usage: ./run.sh worklog <message>"
      exit 1
    fi
    exec "$BUN_BIN" run scripts/append-worklog.ts "$*"
    ;;
  spectral|contracts)
    if [ $# -eq 0 ]; then
      set -- docs/api/openapi.yaml
    fi
    exec "$DIR/portables/bin/spectral" lint "$@"
    ;;
  doctor)
    echo "🩺 [Forge App] Running Diagnostics..."
    echo "1. Bun Runtime:     $($BUN_BIN --version)"
    echo "2. RTK Tool:        $(rtk --version 2>/dev/null || ./portables/bin/rtk --version 2>/dev/null || echo 'Ready')"
    echo "3. Dedicated DB:    $(ls -lh data/*.db 2>/dev/null || echo 'Not initialized (run ./run.sh setup)')"
    echo "4. Git Hooks:       $(git config core.hooksPath || echo 'Not configured')"
    echo "✅ Diagnostics Completed."
    ;;
  clean)
    echo "🧹 [Forge App] Cleaning caches and temporary build artifacts..."
    rm -rf .cache dist *.tsbuildinfo
    echo "✨ Cleaned."
    ;;
  setup-hooks)
    echo "⚓ Configuring Git hooks (.githooks)..."
    git config core.hooksPath .githooks
    chmod +x .githooks/* 2>/dev/null || true
    echo "✅ Git hooks activated! Pre-commit gate will verify tests before committing."
    ;;
  help|*)
    echo "
SG Forge Autonomous Micro-App Submodule CLI

Usage:
  ./run.sh setup          Bootstrap environment, permissions, DB, and dependencies
  ./run.sh dev            Start local server in hot-reload watch mode
  ./run.sh start          Start server in production mode
  ./run.sh test           Execute local 5-tier test suites
  ./run.sh verify         Run quality verification gate (18 checks)
  ./run.sh backup         Run isolated database snapshot (VACUUM INTO)
  ./run.sh compose [cmd]  Run standalone docker compose (e.g. up -d, down)
  ./run.sh build          Build standalone Docker container image
  ./run.sh graft [cmd]    Run Graft code context graph (skeleton, callers, blast)
  ./run.sh tokens [cmd]   Display lifetime spend, sync ledger, or launch TUI
  ./run.sh headroom [cmd] Run Headroom context compression engine
  ./run.sh council [idea] Run Council of AI multi-agent decision framework
  ./run.sh contracts      Lint OpenAPI 3.1 contracts via Spectral
  ./run.sh doctor         Inspect toolchain and database status
  ./run.sh clean          Clean temporary build caches
  ./run.sh worklog <msg>  Append task completion to logs/WORKLOGS.md
  ./run.sh setup-hooks    Activate git hooks (.githooks)
  ./run.sh help           Show this banner
"
    ;;
esac
