# LendFlow - Stop Development Environment
# Save this file as: stop-lendflow.ps1

Write-Host "Stopping LendFlow development servers..." -ForegroundColor Cyan

# Stop Vite/Node development processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Development servers stopped." -ForegroundColor Green
Write-Host "PostgreSQL was left running so other PostgreSQL applications are not interrupted." -ForegroundColor Gray
