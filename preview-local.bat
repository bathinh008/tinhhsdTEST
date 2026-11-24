@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (echo Can cai Python 3 de chay website cuc bo.& pause & exit /b 1)
start "" http://localhost:8765
python -m http.server 8765
