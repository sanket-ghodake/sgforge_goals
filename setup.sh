#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Autonomous Universal Setup Entrypoint (2026 LTS)
# Single-step, zero-install setup for any fresh machine or clone.
# Strictly uses in-repo portable toolchain without checking host installations.
# Usage: bash setup.sh   (or: ./setup.sh)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "⚡ [SG Forge Submodule] Initializing standalone in-repo environment setup..."

# 1. Hardened self-healing execution permissions across all entrypoints
echo "⚓ Hardening script and portable toolchain executable permissions..."
chmod +x "$DIR/run.sh" "$DIR/env.sh" "$DIR/setup.sh" "$DIR/portables/bin/"* "$DIR/.githooks/"* 2>/dev/null || true

# 2. Auto-provision local .env if missing
if [ ! -f "$DIR/.env" ] && [ -f "$DIR/.env.example" ]; then
  echo "📄 Provisioning local .env configuration from .env.example..."
  cp "$DIR/.env.example" "$DIR/.env"
fi

# 3. Delegate to run.sh setup using in-repo portable toolchain
exec "$DIR/run.sh" setup "$@"
