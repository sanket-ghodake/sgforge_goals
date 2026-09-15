@echo off
REM ==============================================================================
REM SG Forge Micro-App Submodule - Windows Shim for Bunx Runner
REM ==============================================================================

set "LOCAL_BUNX=%~dp0..\bun\bin\bunx.exe"
set "PARENT_BUNX=%~dp0..\..\..\portables\bun\bin\bunx.exe"

if exist "%LOCAL_BUNX%" (
    "%LOCAL_BUNX%" %*
    exit /b %ERRORLEVEL%
)

if exist "%PARENT_BUNX%" (
    "%PARENT_BUNX%" %*
    exit /b %ERRORLEVEL%
)

call "%~dp0bun.cmd" x %*
exit /b %ERRORLEVEL%
