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
    "%BUN_BIN%" run scripts\sync-ignores.ts
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

if "%CMD%"=="docs:dev" goto :do_docs
if "%CMD%"=="docs" goto :do_docs
goto :not_docs
:do_docs
echo 📖 Starting standalone micro-app with Living Documentation Engine...
"%BUN_BIN%" --watch src\server.ts
goto :eof
:not_docs

if "%CMD%"=="docs:coverage" goto :do_doc_coverage
if "%CMD%"=="doc-coverage" goto :do_doc_coverage
goto :not_doc_coverage
:do_doc_coverage
echo 📑 Running Living Documentation & Traceability Gate...
"%BUN_BIN%" run scripts\verify-gate.ts
goto :eof
:not_doc_coverage

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

if "%CMD%"=="verify" (
    echo 🛡️ Running pre-commit quality verification gate...
    "%BUN_BIN%" run scripts\verify-gate.ts
    goto :eof
)

if "%CMD%"=="backup" (
    echo 💾 Running autonomous database backup...
    "%BUN_BIN%" run scripts\backup-db.ts
    goto :eof
)

if "%CMD%"=="build" (
    echo 🐳 Building standalone Docker image...
    for %%I in ("%CD%") do set "CURRENT_DIR=%%~nxI"
    docker build -f docker\Dockerfile -t !CURRENT_DIR! .
    goto :eof
)

if "%CMD%"=="compose" goto :do_compose
if "%CMD%"=="docker" goto :do_compose
goto :not_compose

:do_compose
echo 🐳 Running standalone Docker Compose...
shift
set "DOCKER_ARGS=%*"
if "%DOCKER_ARGS%"=="" set "DOCKER_ARGS=up -d"
docker compose %DOCKER_ARGS%
goto :eof

:not_compose

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

if "%CMD%"=="graft" (
    echo 🧠 Running Graft Code Context Graph...
    shift
    "%BUN_BIN%" run portables\bin\graft %*
    goto :eof
)

if "%CMD%"=="tokens" (
    set "SUB_CMD=%~2"
    if "!SUB_CMD!"=="sync" (
        "%BUN_BIN%" run scripts\sync-tokens.ts
    ) else if "!SUB_CMD!"=="tui" (
        bun x --bun codeburn
    ) else (
        "%BUN_BIN%" run scripts\display-tokens.ts
    )
    goto :eof
)

if "%CMD%"=="headroom" (
    shift
    "%BUN_BIN%" run scripts\headroom-runner.ts %*
    goto :eof
)

if "%CMD%"=="council" (
    shift
    "%BUN_BIN%" run scripts\council-runner.ts %*
    goto :eof
)

if "%CMD%"=="worklog" (
    shift
    "%BUN_BIN%" run scripts\append-worklog.ts %*
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
echo   run.bat setup          Bootstrap environment, permissions, DB, and dependencies
echo   run.bat dev            Start local server in hot-reload watch mode
echo   run.bat start          Start server in production mode
echo   run.bat test           Execute local 5-tier test suites
echo   run.bat verify         Run quality verification gate (18 checks)
echo   run.bat backup         Run isolated database snapshot (VACUUM INTO)
echo   run.bat compose [cmd]  Run standalone docker compose (e.g. up -d, down)
echo   run.bat build          Build standalone Docker container
echo   run.bat graft [cmd]    Run Graft code context graph
echo   run.bat tokens [cmd]   Display lifetime spend, sync ledger, or launch TUI
echo   run.bat headroom [cmd] Run Headroom context compression engine
echo   run.bat council [idea] Run Council of AI multi-agent decision framework
echo   run.bat doctor         Inspect toolchain status
echo   run.bat clean          Clean temporary build caches
echo   run.bat worklog [msg]  Append task completion to logs\WORKLOGS.md
echo   run.bat setup-hooks    Activate git hooks (.githooks)
echo   run.bat help           Show this banner
echo.
