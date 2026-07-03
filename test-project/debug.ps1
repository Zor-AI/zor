param()

Set-Location "C:\Users\realj\Desktop\Zor\zor\test-project"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Zor Code v0.1.0 — Debug" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Working dir: $(Get-Location)"
Write-Host " Config: zor.json (opencode/claude-sonnet-4, auto permissions)"
Write-Host ""
Write-Host " Try: fix the bugs in src/app.ts"
Write-Host "      write tests for the divide function"
Write-Host "      /context  |  /help  |  /use"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$env:ZOR_LOG_LEVEL = "debug"
$env:ZOR_DISABLE_ENCRYPTION = "true"

bun run C:\Users\realj\Desktop\Zor\zor\packages\zor-code\src\main.tsx opencode/claude-sonnet-4

Read-Host "Press Enter to exit"
