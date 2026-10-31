@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cls

echo ============================================================
echo   SCM ENTERPRISE - LOCAL AI AUTO SETUP
echo   Ollama + Qwen3 4B
echo ============================================================
echo.
echo This installer will:
echo   1. Detect Ollama
echo   2. Install Ollama if it is missing (official installer)
echo   3. Download qwen3:4b if it is missing
echo   4. Test the local AI API
echo.
echo Internet is required for the first setup only.
echo Model download is about a few GB and depends on your connection.
echo.
pause

echo [1/4] Checking Ollama...
where ollama >nul 2>&1
if errorlevel 1 goto INSTALL_OLLAMA

echo Ollama found.
goto PULL_MODEL

:INSTALL_OLLAMA
echo Ollama is not installed.
echo Installing from the official Ollama Windows installer script...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://ollama.com/install.ps1 | iex"
if errorlevel 1 (
  echo.
  echo ERROR: Ollama installation failed.
  echo Please install it manually from https://ollama.com/download/windows
  pause
  exit /b 1
)

rem Refresh PATH for this session where possible.
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Ollama"
where ollama >nul 2>&1
if errorlevel 1 (
  echo.
  echo Ollama was installed, but this CMD session cannot find ollama yet.
  echo Close this window and run INSTALL_AI_AUTO.bat again.
  pause
  exit /b 0
)

echo Ollama installed successfully.

:PULL_MODEL
echo.
echo [2/4] Checking qwen3:4b...
set "MODEL_FOUND=0"
for /f "tokens=1" %%M in ('ollama list 2^>nul ^| findstr /i /b "qwen3:4b"') do set "MODEL_FOUND=1"
if "!MODEL_FOUND!"=="1" goto TEST_API

echo qwen3:4b is not installed. Downloading now...
echo.
ollama pull qwen3:4b
if errorlevel 1 (
  echo.
  echo ERROR: Model download failed.
  echo Check your internet connection and run this file again.
  pause
  exit /b 1
)

:TEST_API
echo.
echo [3/4] Testing Ollama API...
powershell -NoProfile -Command "$r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:11434/api/tags -TimeoutSec 5; if($r.StatusCode -eq 200){Write-Host 'AI API ONLINE'; exit 0}else{exit 1}"
if errorlevel 1 (
  echo Ollama API is not responding yet.
  echo Starting Ollama...
  start "Ollama" /min ollama serve
  timeout /t 4 /nobreak >nul
)

powershell -NoProfile -Command "try{$r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:11434/api/tags -TimeoutSec 5;if($r.StatusCode -eq 200){exit 0}else{exit 1}}catch{exit 1}"
if errorlevel 1 (
  echo.
  echo WARNING: Ollama API could not be verified.
  echo Try restarting Windows or opening Ollama once.
  pause
  exit /b 1
)

echo.
echo [4/4] SCM Local AI is READY.
echo.
echo Model : qwen3:4b
echo API   : http://127.0.0.1:11434
echo SCM   : http://localhost/scm/
echo.
echo Start XAMPP Apache + MySQL, then open the SCM URL above.
echo AI Copilot should show: AI ONLINE
echo.
pause
endlocal
