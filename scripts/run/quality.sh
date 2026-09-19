#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Quality, Security & Toolchain Module (2026 LTS)
# Handles verification gates, AST linters, security scanners, licenses, SBOM
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
    verify)
        echo "🛡️ [${BRAND_NAME}] Running Autonomous Micro-App Verification Gate (19 Deterministic Checks)..."
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/verify-gate.ts" "$@"
        ;;

    lint)
        exec "$REPO_ROOT/portables/bin/biome" "$@"
        ;;

    deadcode)
        exec "$REPO_ROOT/portables/bin/knip" "$@"
        ;;

    secrets)
        exec "$REPO_ROOT/portables/bin/gitleaks" "$@"
        ;;

    typecheck)
        echo "📘 [${BRAND_NAME}] Running TypeScript strict compilation check..."
        exec "$PORTABLE_BUN" x tsc --noEmit "$@"
        ;;

    shellcheck)
        exec "$REPO_ROOT/portables/bin/shellcheck" "$@"
        ;;

    semgrep)
        exec "$REPO_ROOT/portables/bin/semgrep" "$@"
        ;;

    spectral|contracts)
        if [ $# -ge 1 ]; then
            exec "$REPO_ROOT/portables/bin/spectral" "$@"
        else
            exec "$REPO_ROOT/portables/bin/spectral" lint "$REPO_ROOT/docs/api/openapi.yaml"
        fi
        ;;

    complexity)
        if [ $# -ge 1 ]; then
            exec "$REPO_ROOT/portables/bin/lizard" "$@"
        else
            exec "$REPO_ROOT/portables/bin/lizard" "$REPO_ROOT/src"
        fi
        ;;

    check-pkg)
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/check-package-health.ts" "$@"
        ;;

    licenses)
        echo "⚖️ [${BRAND_NAME}] Auditing package licenses against OSI permissive allowlist..."
        exec "$PORTABLE_BUN" -e '
            import { readFileSync, existsSync } from "node:fs";
            import { join } from "node:path";
            const pkgPath = join(process.cwd(), "package.json");
            const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, "utf8")) : {};
            const lic = pkg.license || "UNKNOWN";
            const allowed = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense", "MPL-2.0", "CC0-1.0"];
            if (allowed.includes(lic)) {
                console.log(`✅ [License Audit] License "${lic}" is OSI-permissive and compliant.`);
                process.exit(0);
            } else {
                console.error(`❌ [License Audit] Non-permissive or unknown license detected: "${lic}"`);
                process.exit(1);
            }
        '
        ;;

    vuln)
        exec "$REPO_ROOT/portables/bin/osv-scanner" "$@"
        ;;

    trivy)
        exec "$REPO_ROOT/portables/bin/trivy" "$@"
        ;;

    sbom)
        exec "$REPO_ROOT/scripts/generate-sbom.sh" "$@"
        ;;

    lhci)
        exec "$REPO_ROOT/portables/bin/lhci" "$@"
        ;;

    fuzz|schemathesis)
        exec "$REPO_ROOT/portables/bin/schemathesis" "$@"
        ;;

    loadtest|k6)
        exec "$REPO_ROOT/portables/bin/k6" "$@"
        ;;

    benchmark)
        exec "$REPO_ROOT/portables/bin/autocannon" "$@"
        ;;

    pack)
        exec "$REPO_ROOT/portables/bin/repomix" "$@"
        ;;

    graft)
        exec "$REPO_ROOT/portables/bin/graft" "$@"
        ;;

    tokens|tokscale)
        SUB_CMD="${1:-dashboard}"
        shift || true
        case "$SUB_CMD" in
            sync)
                exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/sync-tokens.ts" "$@"
                ;;
            tui)
                exec "$REPO_ROOT/portables/bin/codeburn" "$@"
                ;;
            dashboard|*)
                exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/display-tokens.ts" "$@"
                ;;
        esac
        ;;

    headroom)
        exec "$REPO_ROOT/portables/bin/headroom" "$@"
        ;;

    council)
        exec "$REPO_ROOT/portables/bin/council" "$@"
        ;;

    docs:coverage|doc-coverage)
        echo "📑 [${BRAND_NAME}] Running Living Documentation & Traceability Gate..."
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/verify-gate.ts" "$@"
        ;;

    docs:dev|docs|docs:build)
        echo "📖 [${BRAND_NAME}] Starting standalone micro-app with Living Documentation Engine..."
        echo "   ├─ App Interface:   http://localhost:${PORT:-8090}"
        echo "   ├─ Docs Hub:        http://localhost:${PORT:-8090}/docs"
        echo "   └─ OpenAPI 3.1:     http://localhost:${PORT:-8090}/docs/api"
        exec "$PORTABLE_BUN" --watch src/server.ts "$@"
        ;;

    verify-tools)
        exec "$PORTABLE_BUN" run "$REPO_ROOT/scripts/verify-all-tools.ts" "$@"
        ;;

    *)
        echo "❌ Unknown quality/toolchain command: $CMD" >&2
        exit 1
        ;;
esac
