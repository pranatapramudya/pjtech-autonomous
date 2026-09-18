# Install Hermes Auto-Start at User Logon
# Run this ONCE from PowerShell "Run as Administrator"

$taskName = 'PJTECH Hermes Agent'
$launcher = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File D:\Coding\pjtech-autonomous\start-hermes.ps1'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    throw 'Buka PowerShell dengan Run as Administrator, lalu jalankan script ini lagi.'
}

# Task runs at USER LOGON (not system startup) - Hermes needs user session
schtasks.exe /Create `
    /TN $taskName `
    /SC ONLOGON `
    /DELAY 0000:30 `
    /RU "$env:USERNAME" `
    /RL HIGHEST `
    /TR $launcher `
    /F

if ($LASTEXITCODE -ne 0) {
    throw 'Gagal membuat Scheduled Task Hermes Agent.'
}

Write-Host 'OK: Hermes Agent akan berjalan otomatis setelah login Windows (butuh sesi user).' -ForegroundColor Green
Write-Host 'Note: Hermes CLI butuh sesi user interaktif, tidak bisa jalan sebagai SYSTEM saat boot.' -ForegroundColor Yellow