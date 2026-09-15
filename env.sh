#!/usr/bin/env bash
# ==============================================================================
# SG Forge Micro-App Submodule - Shell Environment Activator (2026 LTS)
# Sources portable toolchain into current interactive shell session.
# Usage: source env.sh   (or: . env.sh)
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export APP_ROOT="$SCRIPT_DIR"

# Prepend submodule portables and parent monorepo portables to PATH
export PATH="$APP_ROOT/portables/bin:$APP_ROOT/../../portables/bin:$APP_ROOT/../../portables/bun/bin:$PATH"

echo "⚡ [Forge App] Portable toolchain activated on PATH:"
echo "   ├─ RTK:     $(rtk --version 2>/dev/null || ./portables/bin/rtk --version 2>/dev/null || echo 'Ready')"
echo "   ├─ Bun:     $(bun --version 2>/dev/null || ./portables/bin/bun --version 2>/dev/null || echo 'Ready')"
echo "   └─ Bin:     $APP_ROOT/portables/bin"
