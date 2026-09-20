#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Environment & Runtime Resolver (2026 LTS)
# 100% Dynamically Configured from .env (Brand, Docker, Ports & Microservices)
# Cross-Platform: Linux (x86_64/ARM64), macOS (Darwin), Windows (WSL/Git Bash)
# ==============================================================================
set -e

# Resolve Repository Root
if [ -z "$REPO_ROOT" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

HOST_OS="$(uname -s)"
HOST_ARCH="$(uname -m)"
RTK="$REPO_ROOT/portables/bin/rtk"

# Cross-platform Bun resolution:
# 1. Linux x86_64: execute standalone ELF binary from portables
# 2. Parent monorepo portable bun if present
# 3. Linux ARM64, macOS (Darwin), or Windows (Git Bash/MSYS2): execute system bun
if [ "$HOST_OS" = "Linux" ] && [ "$HOST_ARCH" = "x86_64" ] && [ -x "$REPO_ROOT/portables/bun/bin/bun" ]; then
    PORTABLE_BUN="$REPO_ROOT/portables/bun/bin/bun"
    export PATH="$REPO_ROOT/portables/bin:$REPO_ROOT/portables/bun/bin:$PATH"
elif [ -x "$REPO_ROOT/../../portables/bun/bin/bun" ]; then
    PORTABLE_BUN="$REPO_ROOT/../../portables/bun/bin/bun"
    export PATH="$REPO_ROOT/portables/bin:$REPO_ROOT/../../portables/bin:$REPO_ROOT/../../portables/bun/bin:$PATH"
elif command -v bun >/dev/null 2>&1; then
    PORTABLE_BUN="bun"
    export PATH="$REPO_ROOT/portables/bin:$PATH"
elif [ -x "$REPO_ROOT/portables/bun/bin/bun.exe" ]; then
    PORTABLE_BUN="$REPO_ROOT/portables/bun/bin/bun.exe"
    export PATH="$REPO_ROOT/portables/bin:$PATH"
else
    echo "❌ [SG Forge] Bun runtime not detected on $HOST_OS ($HOST_ARCH)." >&2
    if [ "$HOST_OS" = "Darwin" ]; then
        echo "   👉 Install Bun on macOS: brew install oven-sh/bun/bun (or: curl -fsSL https://bun.sh/install | bash)" >&2
    elif [[ "$HOST_OS" == MINGW* ]] || [[ "$HOST_OS" == MSYS* ]] || [[ "$HOST_OS" == CYGWIN* ]]; then
        echo "   👉 Install Bun on Windows (PowerShell): powershell -c \"irm bun.sh/install.ps1 | iex\"" >&2
    elif [ "$HOST_ARCH" = "aarch64" ] || [ "$HOST_ARCH" = "arm64" ]; then
        echo "   👉 Install ARM64 Bun on Linux: curl -fsSL https://bun.sh/install | bash" >&2
    else
        echo "   👉 Install Bun from https://bun.sh" >&2
    fi
    exit 1
fi

# Auto-generate .env from .env.example if missing
if [ ! -f "$REPO_ROOT/.env" ] && [ -f "$REPO_ROOT/.env.example" ]; then
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
fi

# Dynamically resolve branding and container variables from .env
if [ -f "$REPO_ROOT/.env" ]; then
    APP_NAME="$(grep -E '^APP_NAME=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    PORT="$(grep -E '^PORT=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    NODE_ENV="$(grep -E '^NODE_ENV=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    BRAND_NAME="$(grep -E '^BRAND_NAME=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    CONTAINER_PREFIX="$(grep -E '^CONTAINER_PREFIX=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    FORGE_APPS_NETWORK="$(grep -E '^FORGE_APPS_NETWORK=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    COMPOSE_PROJECT_NAME="$(grep -E '^COMPOSE_PROJECT_NAME=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    FORGE_GATEWAY_URL="$(grep -E '^FORGE_GATEWAY_URL=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    AUTH_SERVICE_URL="$(grep -E '^AUTH_SERVICE_URL=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
    JWT_SECRET="$(grep -E '^JWT_SECRET=' "$REPO_ROOT/.env" 2>/dev/null | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)"
fi

APP_NAME="${APP_NAME:-goals}"
PORT="${PORT:-8090}"
NODE_ENV="${NODE_ENV:-development}"
BRAND_NAME="${BRAND_NAME:-SG Forge}"
CONTAINER_PREFIX="${CONTAINER_PREFIX:-forge}"
FORGE_APPS_NETWORK="${FORGE_APPS_NETWORK:-${CONTAINER_PREFIX}_apps_net}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${CONTAINER_PREFIX}-app-${APP_NAME}}"
FORGE_GATEWAY_URL="${FORGE_GATEWAY_URL:-http://localhost:8080}"
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:8080/auth}"

# ==============================================================================
# Enterprise Air-Gap & Zero-Telemetry Invariants (100% Fully Local & Offline-Safe)
# ==============================================================================
export DO_NOT_TRACK=1
export SCARF_NO_ANALYTICS=true
export SEMGREP_SEND_METRICS=off
export AST_NO_TELEMETRY=1
export TOKSCALE_NO_TELEMETRY=1
export NEXT_TELEMETRY_DISABLED=1
export HEADROOM_TELEMETRY=0
export TRIVY_NO_PROGRESS=true
export OSV_SCANNER_TELEMETRY=0
export CHECKPOINT_DISABLE=1

export REPO_ROOT HOST_OS HOST_ARCH RTK PORTABLE_BUN
export APP_NAME PORT NODE_ENV BRAND_NAME CONTAINER_PREFIX FORGE_APPS_NETWORK COMPOSE_PROJECT_NAME
export FORGE_GATEWAY_URL AUTH_SERVICE_URL JWT_SECRET
