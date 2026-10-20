@echo off
setlocal
title J Apps Media Studio - Private
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 serve.py
  goto finished
)
where python >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto finished
)
echo.
echo Python 3 is not installed or not in PATH.
echo Install Python from https://www.python.org/downloads/ and run this again.
:finished
echo.
echo Press any key to close this window.
pause >nul
