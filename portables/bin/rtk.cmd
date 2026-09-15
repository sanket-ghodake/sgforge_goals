@echo off
REM ==============================================================================
REM SG Forge Micro-App Submodule - Windows Shim for RTK Utility
REM ==============================================================================

set "LOCAL_RTK=%~dp0..\rtk\bin\rtk.exe"
set "PARENT_RTK=%~dp0..\..\..\portables\rtk\bin\rtk.exe"
set "HOST_RTK=%USERPROFILE%\.local\bin\rtk.exe"

if exist "%LOCAL_RTK%" (
    "%LOCAL_RTK%" %*
    exit /b %ERRORLEVEL%
)

if exist "%PARENT_RTK%" (
    "%PARENT_RTK%" %*
    exit /b %ERRORLEVEL%
)

if exist "%HOST_RTK%" (
    "%HOST_RTK%" %*
    exit /b %ERRORLEVEL%
)

where rtk >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    rtk %*
    exit /b %ERRORLEVEL%
)

REM Fall through to direct command execution if rtk is not installed
%*
exit /b %ERRORLEVEL%
