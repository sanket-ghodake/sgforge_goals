@echo off
REM ==============================================================================
REM SG Forge Micro-App Submodule - Windows Shim for Bun Runtime
REM 3-Tier Resolution: Local Submodule -> Parent Monorepo -> Host System
REM ==============================================================================

set "LOCAL_BUN=%~dp0..\bun\bin\bun.exe"
set "PARENT_BUN=%~dp0..\..\..\portables\bun\bin\bun.exe"

if exist "%LOCAL_BUN%" (
    "%LOCAL_BUN%" %*
    exit /b %ERRORLEVEL%
)

if exist "%PARENT_BUN%" (
    "%PARENT_BUN%" %*
    exit /b %ERRORLEVEL%
)

where bun >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    bun %*
    exit /b %ERRORLEVEL%
)

echo [Forge App] Bun runtime not detected on PATH or portable toolchain.
echo Please install Bun for Windows via PowerShell: powershell -c "irm bun.sh/install.ps1 | iex"
exit /b 1
