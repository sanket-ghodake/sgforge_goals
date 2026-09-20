#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Production & Database Ops Module (2026 LTS)
# Handles database backups, file hardening, cryptography, deployment
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
    backup)
        echo "💾 [${BRAND_NAME}] Running isolated database backup snapshot..."
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/backup-db.ts" "$@"
        ;;

    backup-daemon)
        echo "⏰ [${BRAND_NAME}] Starting continuous background hourly backup daemon..."
        while true; do
            "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/backup-db.ts" || true
            echo "💤 Next snapshot in 3600 seconds. Press Ctrl+C to terminate."
            sleep 3600
        done
        ;;

    backup-verify)
        echo "🔍 [${BRAND_NAME}] Verifying database integrity..."
        DB_FILE="$REPO_ROOT/data/${APP_NAME}.db"
        if [ -f "$DB_FILE" ]; then
            "$PORTABLE_BUN" -e "
                import { Database } from 'bun:sqlite';
                const db = new Database('$DB_FILE');
                const row = db.query('PRAGMA integrity_check;').get();
                console.log('✅ Integrity Check:', JSON.stringify(row));
                db.close();
            "
        else
            echo "⚠️ No database found at $DB_FILE"
        fi
        ;;

    harden)
        echo "🔒 [${BRAND_NAME}] Hardening database and secret file permissions..."
        chmod 600 "$REPO_ROOT"/data/*.db 2>/dev/null || true
        chmod 600 "$REPO_ROOT"/.env 2>/dev/null || true
        chmod 700 "$REPO_ROOT"/data "$REPO_ROOT"/logs 2>/dev/null || true
        echo "✅ Permissions hardened (data/*.db 600, .env 600, data/ 700, logs/ 700)."
        ;;

    gen-key)
        if command -v openssl >/dev/null 2>&1; then
            KEY="$(openssl rand -hex 32)"
        else
            KEY="$("$PORTABLE_BUN" -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
        fi
        echo "🔑 Generated Cryptographically Secure 256-Bit Key:"
        echo "   $KEY"
        ;;

    blast-radius|triage)
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/ops/blast-radius.ts" "$@"
        ;;

    deploy-prod)
        echo "🚀 [${BRAND_NAME}] Deploying ${APP_NAME} in production mode..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker/prod/docker-compose.yml" up -d --build
        echo "✨ Production deployment active."
        ;;

    rollback-prod)
        echo "⏪ [${BRAND_NAME}] Rolling back production deployment..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker/prod/docker-compose.yml" down
        echo "✨ Rollback completed."
        ;;

    prod-status)
        echo "🩺 [${BRAND_NAME}] Checking production service health..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker/prod/docker-compose.yml" ps
        if command -v curl >/dev/null 2>&1; then
            curl -s "http://localhost:${PORT:-8090}/health" || true
            echo ""
        fi
        ;;

    *)
        echo "❌ Unknown ops command: $CMD" >&2
        exit 1
        ;;
esac
