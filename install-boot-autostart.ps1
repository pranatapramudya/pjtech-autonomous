# Jalankan SEKALI dari PowerShell "Run as Administrator".
# Menjalankan bot + daemon 1 menit setelah Windows menyala, termasuk saat masih lock screen.

$taskName = 'PJTECH Autonomous'
$launcher = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File D:\Coding\pjtech-autonomous\bot.ps1'
$watchdogTaskName = 'PJTECH WhatsApp Watchdog'
$watchdogLauncher = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File D:\Coding\pjtech-autonomous\daemon-watchdog.ps1'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    throw 'Buka PowerShell dengan Run as Administrator, lalu jalankan script ini lagi.'
}

schtasks.exe /Create `
    /TN $taskName `
    /SC ONSTART `
    /DELAY 0001:00 `
    /RU SYSTEM `
    /RL HIGHEST `
    /TR $launcher `
    /F

if ($LASTEXITCODE -ne 0) {
    throw 'Gagal membuat Scheduled Task PJTECH Autonomous.'
}

schtasks.exe /Create `
    /TN $watchdogTaskName `
    /SC ONSTART `
    /DELAY 0001:10 `
    /RU SYSTEM `
    /RL HIGHEST `
    /TR $watchdogLauncher `
    /F

if ($LASTEXITCODE -ne 0) {
    throw 'Gagal membuat Scheduled Task PJTECH WhatsApp Watchdog.'
}

schtasks.exe /Run /TN $watchdogTaskName
if ($LASTEXITCODE -ne 0) {
    throw 'Task watchdog dibuat, tetapi gagal dijalankan sekarang.'
}

Write-Host 'OK: bot dan watchdog WhatsApp akan berjalan otomatis setelah Windows boot.' -ForegroundColor Green
