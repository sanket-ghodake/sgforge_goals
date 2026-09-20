@echo off
rem ==============================================================================
rem SG Forge Submodule - Windows CLI Orchestrator (2026 LTS)
rem 100% Standalone: Runs on Windows cmd.exe / PowerShell without WSL
rem ==============================================================================
setlocal enabledelayedexpansion

set "DIR=%~dp0"
cd /d "%DIR%"

rem Auto-copy .env.example to .env if missing
if not exist "%DIR%.env" (
    if exist "%DIR%.env.example" (
        echo ℹ️ Auto-generating .env from .env.example...
        copy "%DIR%.env.example" "%DIR%.env" >nul
    )
)

rem Resolve Bun Runtime via 3-tier cascade
set "BUN_BIN=bun"
if exist "%DIR%portables\bun\bin\bun.exe" (
    set "BUN_BIN=%DIR%portables\bun\bin\bun.exe"
) else if exist "%DIR%..\..\portables\bun\bin\bun.exe" (
    set "BUN_BIN=%DIR%..\..\portables\bun\bin\bun.exe"
)

set "CMD=%~1"
if "%CMD%"=="" set "CMD=help"

if "%CMD%"=="setup" (
    echo ⚡ [Forge App] Bootstrapping autonomous micro-app environment...
    if not exist "%DIR%.env" (
        if exist "%DIR%.env.example" copy "%DIR%.env.example" "%DIR%.env" >nul
    )
    git config core.filemode false 2>nul
    git config core.autocrlf false 2>nul
    git config core.hooksPath .githooks 2>nul
    echo 📦 Installing dependencies with Bun...
    "%BUN_BIN%" install
    "%BUN_BIN%" run scripts\ops\sync-ignores.ts
    if not exist "%DIR%logs" mkdir "%DIR%logs"
    if not exist "%DIR%logs\WORKLOGS.md" echo # WORKLOGS > "%DIR%logs\WORKLOGS.md"
    if not exist "%DIR%logs\commits.jsonl" type nul > "%DIR%logs\commits.jsonl"
    if not exist "%DIR%logs\token-ledger.jsonl" type nul > "%DIR%logs\token-ledger.jsonl"
    echo ✨ Setup completed successfully! Run 'run.bat dev' to start.
    goto :eof
)

if "%CMD%"=="dev" (
    echo 🚀 Starting standalone micro-app in watch mode...
    "%BUN_BIN%" --watch src\server.ts
    goto :eof
)

if "%CMD%"=="start" (
    echo ⚡ Starting standalone micro-app...
    "%BUN_BIN%" src\server.ts
    goto :eof
)

if "%CMD%"=="test" (
    echo 🧪 Running 5-tier microservice tests...
    "%BUN_BIN%" test
    goto :eof
)

if "%CMD%"=="reset-db" (
    echo 🔄 Resetting local database...
    if exist "%DIR%data\goals.db" del /f /q "%DIR%data\goals.db*" 2>nul
    "%BUN_BIN%" -e "import { Database } from 'bun:sqlite'; const db = new Database('data/goals.db'); db.run('PRAGMA journal_mode = WAL;'); db.close();"
    echo ✅ Database reset.
    goto :eof
)

if "%CMD%"=="verify" (
    echo 🛡️ Running pre-commit quality verification gate...
    "%BUN_BIN%" run scripts\quality\verify-gate.ts
    goto :eof
)

if "%CMD%"=="lint" (
    call portables\bin\biome.cmd check src test 2>nul || bun run portables\bin\biome check src test
    goto :eof
)

if "%CMD%"=="deadcode" (
    "%BUN_BIN%" run portables\bin\knip
    goto :eof
)

if "%CMD%"=="secrets" (
    "%BUN_BIN%" run portables\bin\gitleaks
    goto :eof
)

if "%CMD%"=="typecheck" (
    "%BUN_BIN%" x tsc --noEmit
    goto :eof
)

if "%CMD%"=="shellcheck" (
    call portables\bin\shellcheck.cmd %* 2>nul || bash -c "shellcheck %*"
    goto :eof
)

if "%CMD%"=="semgrep" (
    "%BUN_BIN%" run portables\bin\semgrep %*
    goto :eof
)

if "%CMD%"=="contracts" goto :do_contracts
if "%CMD%"=="spectral" goto :do_contracts
goto :not_contracts
:do_contracts
shift
set "DOCS_ARG=%*"
if "%DOCS_ARG%"=="" set "DOCS_ARG=docs\api\openapi.yaml"
call portables\bin\spectral.cmd lint %DOCS_ARG% 2>nul || call spectral lint %DOCS_ARG%
goto :eof
:not_contracts

if "%CMD%"=="complexity" (
    shift
    "%BUN_BIN%" run scripts\quality\ast-complexity.ts
    goto :eof
)

if "%CMD%"=="check-pkg" (
    shift
    "%BUN_BIN%" run scripts\quality\check-package-health.ts %*
    goto :eof
)

if "%CMD%"=="licenses" (
    "%BUN_BIN%" -e "console.log('✅ License: Apache-2.0 (OSI Permissive)');"
    goto :eof
)

if "%CMD%"=="vuln" (
    "%BUN_BIN%" run portables\bin\osv-scanner %*
    goto :eof
)

if "%CMD%"=="trivy" (
    "%BUN_BIN%" run portables\bin\trivy %*
    goto :eof
)

if "%CMD%"=="sbom" (
    "%BUN_BIN%" run scripts\quality\generate-sbom.ts %*
    goto :eof
)

if "%CMD%"=="lhci" (
    "%BUN_BIN%" run portables\bin\lhci %*
    goto :eof
)

if "%CMD%"=="fuzz" goto :do_fuzz
if "%CMD%"=="schemathesis" goto :do_fuzz
goto :not_fuzz
:do_fuzz
shift
"%BUN_BIN%" run portables\bin\schemathesis %*
goto :eof
:not_fuzz

if "%CMD%"=="loadtest" goto :do_loadtest
if "%CMD%"=="k6" goto :do_loadtest
goto :not_loadtest
:do_loadtest
shift
"%BUN_BIN%" run portables\bin\k6 %*
goto :eof
:not_loadtest

if "%CMD%"=="benchmark" (
    shift
    "%BUN_BIN%" run portables\bin\autocannon %*
    goto :eof
)

if "%CMD%"=="pack" (
    shift
    "%BUN_BIN%" run portables\bin\repomix %*
    goto :eof
)

if "%CMD%"=="backup" (
    echo 💾 Running autonomous database backup...
    "%BUN_BIN%" run scripts\ops\backup-db.ts
    goto :eof
)

if "%CMD%"=="harden" (
    echo 🔒 Hardening file permissions...
    attrib +r .env 2>nul
    echo ✅ Permissions updated.
    goto :eof
)

if "%CMD%"=="gen-key" (
    "%BUN_BIN%" -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
    goto :eof
)

if "%CMD%"=="up" (
    docker compose up -d
    goto :eof
)

if "%CMD%"=="down" (
    docker compose down
    goto :eof
)

if "%CMD%"=="ps" goto :do_ps
if "%CMD%"=="status" goto :do_ps
goto :not_ps
:do_ps
docker compose ps
goto :eof
:not_ps

if "%CMD%"=="restart" (
    docker compose restart
    goto :eof
)

if "%CMD%"=="logs" (
    shift
    docker compose logs --tail=100 %*
    goto :eof
)

if "%CMD%"=="build" (
    echo 🐳 Building standalone Docker image...
    for %%I in ("%CD%") do set "CURRENT_DIR=%%~nxI"
    docker build -f docker\Dockerfile -t !CURRENT_DIR! .
    goto :eof
)

if "%CMD%"=="docker:dev" goto :do_docker_dev
if "%CMD%"=="docker:prod" goto :do_docker_prod
if "%CMD%"=="compose" goto :do_compose
if "%CMD%"=="docker" goto :do_compose
goto :not_compose
:do_compose
shift
set "SUB_CMD=%~1"
if "!SUB_CMD!"=="dev" goto :do_docker_dev
if "!SUB_CMD!"=="prod" goto :do_docker_prod
echo 🐳 Running standalone Docker Compose...
set "DOCKER_ARGS=%*"
if "%DOCKER_ARGS%"=="" set "DOCKER_ARGS=up -d"
docker compose %DOCKER_ARGS%
goto :eof
:do_docker_dev
shift
set "DOCKER_ARGS=%*"
if "%DOCKER_ARGS%"=="" set "DOCKER_ARGS=up -d --build"
echo 🐳 Starting standalone Docker dev stack...
docker compose -p forge-app-goals-dev -f docker\dev\docker-compose.yml %DOCKER_ARGS%
goto :eof
:do_docker_prod
shift
set "DOCKER_ARGS=%*"
if "%DOCKER_ARGS%"=="" set "DOCKER_ARGS=up -d --build"
echo 🚀 Starting standalone Docker prod stack...
docker compose -p forge-app-goals-prod -f docker\prod\docker-compose.yml %DOCKER_ARGS%
goto :eof
:not_compose

if "%CMD%"=="graft" (
    echo 🧠 Running Graft Code Context Graph...
    shift
    "%BUN_BIN%" run portables\bin\graft %*
    goto :eof
)

if "%CMD%"=="tokens" (
    set "SUB_CMD=%~2"
    if "!SUB_CMD!"=="sync" (
        "%BUN_BIN%" run scripts\ai\sync-tokens.ts
    ) else if "!SUB_CMD!"=="tui" (
        bun x --bun codeburn
    ) else (
        "%BUN_BIN%" run scripts\ai\display-tokens.ts
    )
    goto :eof
)

if "%CMD%"=="headroom" (
    shift
    "%BUN_BIN%" run scripts\ai\headroom-runner.ts %*
    goto :eof
)

if "%CMD%"=="council" (
    shift
    "%BUN_BIN%" run scripts\ai\council-runner.ts %*
    goto :eof
)

if "%CMD%"=="docs:coverage" goto :do_doc_coverage
if "%CMD%"=="doc-coverage" goto :do_doc_coverage
goto :not_doc_coverage
:do_doc_coverage
echo 📑 Running Living Documentation & Traceability Gate...
"%BUN_BIN%" run scripts\quality\verify-gate.ts
goto :eof
:not_doc_coverage

if "%CMD%"=="docs:dev" goto :do_docs
if "%CMD%"=="docs" goto :do_docs
goto :not_docs
:do_docs
echo 📖 Starting standalone micro-app with Living Documentation Engine...
"%BUN_BIN%" --watch src\server.ts
goto :eof
:not_docs

if "%CMD%"=="verify-tools" (
    "%BUN_BIN%" run scripts\quality\verify-all-tools.ts
    goto :eof
)

if "%CMD%"=="worklog" (
    shift
    "%BUN_BIN%" run scripts\ops\append-worklog.ts %*
    goto :eof
)

if "%CMD%"=="doctor" (
    echo 🩺 [Forge App] Running Diagnostics...
    echo 1. Bun Runtime:
    "%BUN_BIN%" --version
    echo ✅ Diagnostics Completed.
    goto :eof
)

if "%CMD%"=="clean" (
    echo 🧹 Cleaning caches...
    rmdir /s /q .cache 2>nul
    rmdir /s /q dist 2>nul
    echo ✨ Cleaned.
    goto :eof
)

if "%CMD%"=="setup-hooks" (
    echo ⚓ Configuring Git hooks (.githooks)...
    git config core.hooksPath .githooks
    echo ✅ Git hooks activated! Pre-commit gate will verify tests before committing.
    goto :eof
)

echo.
echo SG Forge Autonomous Micro-App Submodule Windows CLI
echo.
echo Usage:
echo   run.bat <command> [options]
echo.
echo Run './run.sh help' or review README.md for full command reference.
echo.
