#!/usr/bin/env bash
# ==============================================================================
# SG Forge - Software Bill of Materials (SBOM) Generator (2026 LTS)
# CycloneDX 1.5 Specification Compliant
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${REPO_ROOT}/docs/security/sbom"
OUTPUT_FILE="${OUTPUT_DIR}/cyclonedx-sbom.json"

mkdir -p "${OUTPUT_DIR}"

# Execute deterministic CycloneDX 1.5 TypeScript generator
bun run "${REPO_ROOT}/scripts/generate-sbom.ts" "$@"
