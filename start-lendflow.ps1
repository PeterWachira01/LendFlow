# LendFlow - Start Development Environment
# Save this file as: start-lendflow.ps1
# Put it in the root of your Lending-management-system folder.

$ProjectRoot = "C:\Users\User\Desktop\Lending-management-system"
$ClientPath = Join-Path $ProjectRoot "client"
$ServerPath = Join-Path $ProjectRoot "server"

Write-Host "Starting LendFlow..." -ForegroundColor Cyan

# Start PostgreSQL service if it is not already running
$pgServices = Get-Service -Name "postgresql-x64-*" -ErrorAction SilentlyContinue

if ($pgServices) {
    foreach ($service in $pgServices) {
        if ($service.Status -ne "Running") {
            Write-Host "Starting PostgreSQL service: $($service.Name)" -ForegroundColor Yellow
            Start-Service -Name $service.Name
        }
    }
    Write-Host "PostgreSQL is ready." -ForegroundColor Green
} else {
    Write-Host "PostgreSQL service was not found automatically." -ForegroundColor Red
    Write-Host "Check that PostgreSQL 18 is installed and running." -ForegroundColor Yellow
}

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ServerPath'; npm run dev"

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ClientPath'; npm run dev"

Write-Host ""
Write-Host "LendFlow development environment started." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two terminal windows have been opened for the frontend and backend." -ForegroundColor Gray
