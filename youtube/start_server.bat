@echo off
echo Starting YouTube Analytics Server...
echo Make sure you have added your API Key to .env
cd /d "%~dp0"
npm start
pause
