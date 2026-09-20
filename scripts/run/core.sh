#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Core Development Module (2026 LTS)
# Handles workspace setup, dev servers, testing, DB reset, doctor, clean
# ==============================================================================
set -e

# Ensure environment is sourced
if [ -z "$PORTABLE_BUN" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    source "$SCRIPT_DIR/env.sh"
fi

CMD="$1"
shift || true

case "$CMD" in
    setup)
        echo "⚡ [${BRAND_NAME}] Bootstrapping autonomous micro-app environment (${APP_NAME})..."
        if [ ! -f "$REPO_ROOT/.env" ] && [ -f "$REPO_ROOT/.env.example" ]; then
            echo "📄 Provisioning .env from .env.example..."
            cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
        fi

        echo "⚓ Hardening script permissions & Git configuration..."
        chmod +x "$REPO_ROOT"/run.sh "$REPO_ROOT"/env.sh "$REPO_ROOT"/setup.sh "$REPO_ROOT"/scripts/run/*.sh "$REPO_ROOT"/portables/bin/* "$REPO_ROOT"/.githooks/* 2>/dev/null || true
        if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
            git config core.filemode false
            git config core.autocrlf false
            git config core.hooksPath .githooks
        fi

        echo "📦 Installing microservice dependencies with Bun..."
        "$PORTABLE_BUN" install

        DB_FILE="$REPO_ROOT/data/${APP_NAME}.db"
        TABLE_NAME="$(echo "${APP_NAME:-goals}" | tr '-' '_')_records"
        if [ ! -f "$DB_FILE" ]; then
            echo "🌱 Bootstrapping dedicated local Turso DB ($DB_FILE)..."
            mkdir -p "$REPO_ROOT/data"
            "$PORTABLE_BUN" -e "
                import { Database } from 'bun:sqlite';
                const db = new Database('$DB_FILE');
                db.run('PRAGMA journal_mode = WAL;');
                db.run('PRAGMA foreign_keys = ON;');
                db.run('CREATE TABLE IF NOT EXISTS $TABLE_NAME (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT \"ACTIVE\", created_at INTEGER NOT NULL);');
                db.close();
            " 2>/dev/null || true
        fi

        "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/sync-ignores.ts"

        mkdir -p "$REPO_ROOT/logs"
        [ ! -f "$REPO_ROOT/logs/WORKLOGS.md" ] && echo "# WORKLOGS" > "$REPO_ROOT/logs/WORKLOGS.md"
        [ ! -f "$REPO_ROOT/logs/commits.jsonl" ] && touch "$REPO_ROOT/logs/commits.jsonl"
        [ ! -f "$REPO_ROOT/logs/token-ledger.jsonl" ] && touch "$REPO_ROOT/logs/token-ledger.jsonl"

        echo "✅ Using Bun: $($PORTABLE_BUN --version)"
        echo "✅ Using Portable RTK: $($RTK --version 2>/dev/null || echo 'Ready')"
        echo "💡 Tips for Terminal PATH:"
        echo "   ├─ Shell Activation: run 'source env.sh'"
        echo "   └─ Direct Fallback:  run './portables/bin/rtk <command>'"
        echo "✨ Setup completed successfully! Run './run.sh dev' to start."
        ;;

    dev)
        echo "🚀 Starting standalone micro-app in watch mode..."
        exec "$PORTABLE_BUN" --watch src/server.ts "$@"
        ;;

    start)
        echo "⚡ Starting standalone micro-app in production mode..."
        exec "$PORTABLE_BUN" src/server.ts "$@"
        ;;

    test)
        echo "🧪 Running 5-tier microservice tests..."
        exec env NODE_ENV=test BUN_ENV=test "$PORTABLE_BUN" test "$@"
        ;;

    reset-db)
        echo "🔄 [${BRAND_NAME}] Resetting local development database (${APP_NAME}.db)..."
        DB_FILE="$REPO_ROOT/data/${APP_NAME}.db"
        TABLE_NAME="$(echo "${APP_NAME:-goals}" | tr '-' '_')_records"
        rm -f "$DB_FILE" "${DB_FILE}-wal" "${DB_FILE}-shm" "${DB_FILE}-journal"
        mkdir -p "$REPO_ROOT/data"
        "$PORTABLE_BUN" -e "
            import { Database } from 'bun:sqlite';
            const db = new Database('$DB_FILE');
            db.run('PRAGMA journal_mode = WAL;');
            db.run('PRAGMA foreign_keys = ON;');
            db.run('CREATE TABLE IF NOT EXISTS $TABLE_NAME (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT \"ACTIVE\", created_at INTEGER NOT NULL);');
            db.close();
        "
        echo "✅ Development database reset to pristine state."
        ;;

    seed)
        echo "🌱 [${BRAND_NAME}] Seeding realistic test data for dev system employees..."
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/seed-data.ts" "$@"
        ;;

    doctor)
        echo "🩺 [${BRAND_NAME}] Running Diagnostics for ${APP_NAME}..."
        echo "1. Bun Runtime:     $($PORTABLE_BUN --version)"
        echo "2. RTK Tool:        $($RTK --version 2>/dev/null || echo 'Ready')"
        echo "3. Dedicated DB:    $(ls -lh data/*.db 2>/dev/null || echo 'Not initialized (run ./run.sh setup)')"
        echo "4. Git Hooks:       $(git config core.hooksPath 2>/dev/null || echo 'Not configured')"
        echo "5. Network:         ${FORGE_APPS_NETWORK}"
        echo "6. Port:            ${PORT}"
        echo "✅ Diagnostics Completed."
        ;;

    clean)
        echo "🧹 [${BRAND_NAME}] Cleaning caches and temporary build artifacts..."
        rm -rf "$REPO_ROOT/.cache" "$REPO_ROOT/dist" "$REPO_ROOT"/*.tsbuildinfo "$REPO_ROOT"/.turbo
        echo "✨ Cleaned."
        ;;

    sync-ignores)
        "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/sync-ignores.ts" "$@"
        ;;

    setup-hooks)
        echo "⚓ Configuring Git hooks (.githooks)..."
        git config core.hooksPath .githooks
        chmod +x "$REPO_ROOT"/.githooks/* 2>/dev/null || true
        echo "✅ Git hooks activated! Pre-commit gate will verify tests before committing."
        ;;

    worklog)
        if [ $# -eq 0 ]; then
            echo "❌ Usage: ./run.sh worklog <message>" >&2
            exit 1
        fi
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/append-worklog.ts" "$*"
        ;;

    *)
        echo "❌ Unknown core command: $CMD" >&2
        exit 1
        ;;
esac
