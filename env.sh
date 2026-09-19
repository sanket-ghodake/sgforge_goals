#!/usr/bin/env bash
# ==============================================================================
# SG Forge Micro-App Submodule - Shell Environment Activator (2026 LTS)
# Sources portable toolchain into current interactive shell session.
# Usage: source env.sh   (or: . env.sh)
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export APP_ROOT="$SCRIPT_DIR"

# Self-heal executable permissions across entrypoints
chmod +x "$APP_ROOT/run.sh" "$APP_ROOT/setup.sh" "$APP_ROOT/env.sh" "$APP_ROOT/portables/bin/"* "$APP_ROOT/.githooks/"* 2>/dev/null || true

# Prepend submodule in-repo portables and parent monorepo portables to PATH
export PATH="$APP_ROOT/portables/bin:$APP_ROOT/portables/bun/bin:$APP_ROOT/../../portables/bin:$APP_ROOT/../../portables/bun/bin:$PATH"

# Enterprise Air-Gap & Zero-Telemetry Invariants (100% Fully Local & Offline-Safe)
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

echo "⚡ [Forge App] In-repo portable toolchain activated on PATH:"
echo "   ├─ RTK:     $("$APP_ROOT/portables/bin/rtk" --version 2>/dev/null || echo 'Ready')"
echo "   ├─ Bun:     $("$APP_ROOT/portables/bin/bun" --version 2>/dev/null || echo 'Ready')"
echo "   └─ Bin:     $APP_ROOT/portables/bin"
