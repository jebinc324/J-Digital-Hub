@echo off
setlocal
title J Apps Media Studio - Private
cd /d "%~dp0"

REM Check that we can really run Python, not just find a Microsoft Store alias.
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>&1
if not errorlevel 1 goto launch_py

python -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>&1
if not errorlevel 1 goto launch_python

python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>&1
if not errorlevel 1 goto launch_python3

echo.
echo [J Apps Media Studio] Python 3.9+ was not detected.
echo.
echo 1. Install Python for Windows from:
echo    https://www.python.org/downloads/windows/
echo 2. If the installer offers "Add Python to PATH", enable it.
echo 3. Close this window, then launch START_MEDIA_STUDIO.bat again.
echo.
echo If Python is installed but the Microsoft Store shortcut interferes:
echo Settings - Apps - Advanced app settings - App execution aliases
echo Disable python.exe and python3.exe aliases, then reopen this tool.
goto finished

:launch_py
py -3 serve.py
goto finished

:launch_python
python serve.py
goto finished

:launch_python3
python3 serve.py

:finished
echo.
echo Press any key to close this window.
pause >nul
