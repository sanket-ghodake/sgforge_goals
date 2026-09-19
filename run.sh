#!/usr/bin/env bash
# ==============================================================================
# SG Forge Submodule - Autonomous Microservice CLI (2026 LTS)
# 100% Dynamically Configured from .env (Brand, Docker, Ports & Microservices)
# Clean Architecture Modular Dispatcher (<100 Lines, Zero Host Modifications)
# ==============================================================================
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export REPO_ROOT

# Source cross-platform environment & portable runtime resolver
source "$REPO_ROOT/scripts/run/env.sh"

CMD="${1:-help}"

case "$CMD" in
    # Help & Documentation
    help|-h|--help)
        "$REPO_ROOT/scripts/run/help.sh"
        ;;

    # Core Development, Scaffolding & Testing
    setup|dev|start|test|reset-db|doctor|clean|sync-ignores|setup-hooks|worklog)
        "$REPO_ROOT/scripts/run/core.sh" "$@"
        ;;

    # Docker Stack Lifecycle & Real-Time Ergonomic Aliases
    docker)
        shift || true
        "$REPO_ROOT/scripts/run/docker.sh" "$@"
        ;;
    up|down|ps|status|top|ctop|monitor|logs|restart|compose|build|purge|reset-data)
        "$REPO_ROOT/scripts/run/docker.sh" "$@"
        ;;

    # Quality Gates, Linters, SAST & Security Toolchain
    verify|lint|deadcode|secrets|typecheck|shellcheck|semgrep|spectral|contracts|complexity|check-pkg|licenses|vuln|trivy|sbom|lhci|fuzz|schemathesis|loadtest|k6|benchmark|pack|graft|tokens|tokscale|headroom|council|docs:coverage|doc-coverage|docs:dev|docs:build|docs|verify-tools)
        "$REPO_ROOT/scripts/run/quality.sh" "$@"
        ;;

    # Production Deployment, Database Snapshots, Hardening & Cryptography
    deploy-prod|rollback-prod|prod-status|backup|backup-daemon|backup-verify|harden|gen-key)
        "$REPO_ROOT/scripts/run/ops.sh" "$@"
        ;;

    *)
        echo "❌ Unknown command: $CMD" >&2
        echo "Run './run.sh help' to inspect all available microservice orchestration commands." >&2
        exit 1
        ;;
esac
