@echo off
cd /d "C:\Users\realj\Desktop\Zor\zor\test-project"

echo.
echo ========================================
echo  Zor Code v0.1.0 — Debug
echo ========================================
echo.
echo  Working dir: %cd%
echo  Config: zor.json (opencode/claude-sonnet-4, auto)
echo.
echo  Tests:
echo    fix the bugs in src/app.ts
echo    write tests for the divide function
echo    /context  ^|  /help  ^|  /use
echo ========================================
echo.

bun run C:\Users\realj\Desktop\Zor\zor\packages\zor-code\src\main.tsx opencode/claude-sonnet-4
pause
