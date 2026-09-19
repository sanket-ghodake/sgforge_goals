#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Docker Lifecycle Module (2026 LTS)
# Handles container stacks, hot reload, logs, metrics HUD & cleanups
# Zero-dangling containers: Enforces named containers and deterministic projects
# ==============================================================================
set -e

# Ensure environment is sourced
if [ -z "$PORTABLE_BUN" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    source "$SCRIPT_DIR/env.sh"
fi

CMD="${1:-up}"
shift || true

ensure_gateway_network() {
    local net_name="${FORGE_APPS_NETWORK:-${CONTAINER_PREFIX:-ag}_forge_apps_net}"
    if ! docker network inspect "$net_name" >/dev/null 2>&1; then
        echo "🌐 Creating standalone gateway network: $net_name..."
        docker network create "$net_name" >/dev/null 2>&1 || true
    fi
}

case "$CMD" in
    up)
        ensure_gateway_network
        echo "🐳 [${BRAND_NAME}] Starting ${APP_NAME} via Docker Compose..."
        if [ $# -eq 0 ]; then
            set -- -d
        fi
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" up "$@"
        ;;

    down)
        echo "🛑 [${BRAND_NAME}] Stopping ${APP_NAME} Docker containers..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" down --remove-orphans "$@"
        echo "✨ Containers stopped."
        ;;

    restart)
        echo "🔄 [${BRAND_NAME}] Restarting ${APP_NAME} Docker containers..."
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" restart "$@"
        ;;

    ps|status)
        echo "📊 [${BRAND_NAME}] Live Container Status for ${APP_NAME}:"
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" ps "$@"
        ;;

    logs)
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" logs --tail=100 "$@"
        ;;

    build)
        echo "🐳 [${BRAND_NAME}] Building standalone Docker image for ${APP_NAME}..."
        exec docker build -f "$REPO_ROOT/docker/Dockerfile" -t "${CONTAINER_PREFIX}-${APP_NAME}" "$@" "$REPO_ROOT"
        ;;

    compose|docker)
        ensure_gateway_network
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" "$@"
        ;;

    top|ctop)
        exec "$REPO_ROOT/portables/bin/ctop" "$@"
        ;;

    monitor)
        echo "📊 [${BRAND_NAME}] Monitoring active ${APP_NAME} container..."
        exec docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        ;;

    purge)
        echo "⚠️ [${BRAND_NAME}] Purging stopped containers and dangling images for ${APP_NAME}..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" down --remove-orphans 2>/dev/null || true
        docker container prune -f --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" 2>/dev/null || true
        docker image prune -f 2>/dev/null || true
        echo "✨ Cleaned."
        ;;

    reset-data)
        echo "⚠️ [${BRAND_NAME}] FULL RESET: Stopping containers and removing persistent volumes..."
        docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$REPO_ROOT/.env" -f "$REPO_ROOT/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
        docker volume prune -f 2>/dev/null || true
        echo "✨ Containers and volumes purged."
        ;;

    *)
        echo "❌ Unknown docker command: $CMD" >&2
        echo "Usage: ./run.sh docker [up|down|restart|ps|status|logs|build|compose|top|ctop|monitor|purge|reset-data]" >&2
        exit 1
        ;;
esac
