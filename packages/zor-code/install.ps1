# Zor Code Windows Installer
param(
  [string]$InstallDir = "$env:USERPROFILE\.zor"
)

$ErrorActionPreference = "Stop"
$BinDir = Join-Path $InstallDir "bin"

# Check for Bun
$bun = Get-Command "bun" -ErrorAction SilentlyContinue
if (-not $bun) {
  $bunPath = "$env:USERPROFILE\.bun\bin\bun.exe"
  if (-not (Test-Path $bunPath)) {
    Write-Host "Installing Bun..." -ForegroundColor Cyan
    irm bun.sh/install.ps1 | iex
  }
  $bun = Get-Command "bun" -ErrorAction SilentlyContinue
  if (-not $bun) { $bun = $bunPath }
}

# Create directories
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

# Install Zor Code binary
$repo = "https://github.com/yourusername/zor/releases/latest/download"
$binaryUrl = "$repo/zor-code.exe"
$binaryPath = Join-Path $BinDir "zor-code.exe"

Write-Host "Downloading Zor Code..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $binaryUrl -OutFile $binaryPath -UseBasicParsing

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$BinDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$currentPath;$BinDir", "User")
  Write-Host "Added $BinDir to User PATH. Restart your terminal." -ForegroundColor Yellow
}

Write-Host @"

✓ Zor Code installed!

Quick start:
  1. Set your API key:
     zor-code keys set anthropic sk-ant-xxxxxxxxxxxx

  2. Run:
     zor-code

  3. Or use Ollama:
     ollama pull qwen2.5-coder:14b
     zor-code

  Type /help inside Zor Code for commands.
"@ -ForegroundColor Green