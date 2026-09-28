<#
.SYNOPSIS
    PJTECH Unified Boot Autostart - Satu script untuk mengaktifkan SEMUA layanan otomatis saat Windows nyala.
    Jalankan SEKALI dari PowerShell "Run as Administrator".

.SERVICES
    1. 9router (Local LLM Gateway)        -> Port 9000, SYSTEM, ONSTART
    2. kasir-umkm (Next.js POS Server)    -> Port 3000, SYSTEM, ONSTART  
    3. WhatsApp Business Daemon           -> Port 3847, SYSTEM, ONSTART
    4. pjtech-autonomous Telegram Bot     -> SYSTEM, ONSTART (depends on 9router + kasir + WA)
    5. Hermes Agent (AI Assistant)        -> USER LOGON (butuh sesi interaktif)

.NOTES
    - Semua service SYSTEM jalan di background (WindowStyle Hidden), termasuk saat Lock Screen.
    - Hermes HARUS jalan di USER LOGON (bukan SYSTEM) karena butuh sesi user & GPU.
    - Bot Telegram pakai single-instance lock (mencegah 409 Conflict).
    - Anti-sleep guard aktif untuk mencegah PC tidur saat bot jalan.
#>

$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
# KONFIGURASI PATH (sesuaikan kalau beda lokasi)
# ─────────────────────────────────────────────────────────────────────────────
$RootDir         = 'D:\Coding\pjtech-autonomous'
$KasirDir        = 'D:\Coding\kasir-umkm'
$OneSalesDir     = 'D:\Coding\one-sales-man'
$VideoEngineDir  = Join-Path $RootDir 'video-engine'
$NineRouterDir   = 'C:\Program Files\9router'  # atau lokasi install 9router kamu
$NodeExe         = 'C:\Program Files\nodejs\node.exe'
$NpmCmd          = 'C:\Program Files\nodejs\npm.cmd'
$NineRouterExe   = Join-Path $NineRouterDir '9router.exe'

# ─────────────────────────────────────────────────────────────────────────────
# CEK ADMIN
# ─────────────────────────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw '❌ Buka PowerShell dengan "Run as Administrator", lalu jalankan script ini lagi.'
}

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   [PJTECH UNIFIED BOOT] - Setup Auto-Start Semua Layanan" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Buat Scheduled Task
# ─────────────────────────────────────────────────────────────────────────────
function New-BootTask {
    param(
        [string]$TaskName,
        [string]$Command,
        [string]$Arguments = '',
        [string]$User = 'SYSTEM',
        [string]$Schedule = 'ONSTART',
        [string]$Delay = '0001:00',
        [bool]$RunNow = $false
    )
    $fullCmd = if ($Arguments) { "$Command $Arguments" } else { $Command }
    
    Write-Host "[*] Membuat task: $TaskName" -ForegroundColor Cyan
    Write-Host "    Command: $fullCmd" -ForegroundColor Gray
    
    schtasks.exe /Create `
        /TN $TaskName `
        /SC $Schedule `
        /DELAY $Delay `
        /RU $User `
        /RL HIGHEST `
        /TR $fullCmd `
        /F
    
    if ($LASTEXITCODE -ne 0) {
        throw "❌ Gagal membuat task: $TaskName"
    }
    
    if ($RunNow) {
        schtasks.exe /Run /TN $TaskName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    → Task dijalankan sekarang." -ForegroundColor Green
        }
    }
    Write-Host "    ✅ Task $TaskName dibuat." -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. 9ROUTER (Local LLM Gateway) - Port 9000
# ─────────────────────────────────────────────────────────────────────────────
if (Test-Path $NineRouterExe) {
    New-BootTask `
        -TaskName 'PJTECH 9router LLM Gateway' `
        -Command $NineRouterExe `
        -Arguments '--config "C:\Users\Pranata Pramudya\.config\9router\config.yaml"' `
        -Delay '0000:30'  # Start paling awal
} else {
    Write-Host "⚠️ 9router tidak ditemukan di $NineRouterExe - lewati. Install 9router dulu." -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. KASIR-UMKM Server (Next.js) - Port 3000
# ─────────────────────────────────────────────────────────────────────────────
$KasirLauncher = "$NpmCmd run start"
if (-not (Test-Path (Join-Path $KasirDir '.next'))) {
    $KasirLauncher = "$NpmCmd run dev"  # fallback ke dev kalau belum build
}

New-BootTask `
    -TaskName 'PJTECH Kasir-Umkm Server' `
    -Command 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' `
    -Arguments "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `\"cd '$KasirDir'; $KasirLauncher`\"" `
    -Delay '0001:00'

# ─────────────────────────────────────────────────────────────────────────────
# 3. PJTECH AUTONOMOUS TELEGRAM BOT (Command Center)
# ─────────────────────────────────────────────────────────────────────────────
$BotLauncher = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$BotArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$RootDir\bot.ps1`""

New-BootTask `
    -TaskName 'PJTECH Autonomous Telegram Bot' `
    -Command $BotLauncher `
    -Arguments $BotArgs `
    -Delay '0002:00'  # Tunggu 9router + kasir ready (WA daemon di-start oleh bot.ps1 jika perlu)

# ─────────────────────────────────────────────────────────────────────────────
# 4. ONE-SALES-MAN SCHEDULER (Divisi Sales - Scrape, Email, Report)
# ─────────────────────────────────────────────────────────────────────────────
if (Test-Path $OneSalesDir) {
    $OneSalesLauncher = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    $OneSalesArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"cd '$OneSalesDir'; npx tsx src/pipeline/master-pipeline.ts scheduler`""

    New-BootTask `
        -TaskName 'PJTECH One-Sales-Man Scheduler' `
        -Command $OneSalesLauncher `
        -Arguments $OneSalesArgs `
        -Delay '0003:00'  # Tunggu kasir + WA + bot ready
} else {
    Write-Host "⚠️ one-sales-man tidak ditemukan di $OneSalesDir - lewati Sales Scheduler." -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. HERMES AGENT (AI Assistant) - USER LOGON (bukan SYSTEM!)
# ─────────────────────────────────────────────────────────────────────────────
$HermesExe = "C:\Users\Pranata Pramudya\AppData\Local\hermes\bin\hermes.exe"
if (Test-Path $HermesExe) {
    $HermesArgs = "chat --provider custom --model combo-prun --base-url http://localhost:9000/v1 --tui"
    $HermesLauncher = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    $HermesTaskArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -Command `\"& '$HermesExe' $HermesArgs`\""
    
    # Hermes pakai ONLOGON user, bukan ONSTART system
    schtasks.exe /Create `
        /TN 'PJTECH Hermes Agent' `
        /SC ONLOGON `
        /DELAY 0000:30 `
        /RU "$env:USERNAME" `
        /RL HIGHEST `
        /TR $HermesTaskArgs `
        /F
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Hermes Agent task dibuat (USER LOGON)." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Gagal buat Hermes task (mungkin path beda)." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Hermes tidak ditemukan di $HermesExe - lewati." -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# ANTI-SLEEP GUARD (Registry - berlaku global, bukan per-task)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "[*] Mengaktifkan Anti-Sleep Guard (PC tidak tidur saat colok listrik)..." -ForegroundColor Cyan
try {
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    powercfg /change monitor-timeout-ac 15  # layar boleh mati 15 menit
    Write-Host "✅ Anti-Sleep Guard aktif: CPU tetap jalan 24/7 saat tercolok listrik." -ForegroundColor Green
} catch {
    Write-Warning "⚠️ Ganti power plan manual: powercfg /change standby-timeout-ac 0"
}

# ─────────────────────────────────────────────────────────────────────────────
# RINGKASAN
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   SETUP SELESAI - Semua layanan terdaftar auto-start" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Task yang dibuat (SYSTEM - jalan di background saat boot):" -ForegroundColor White
Write-Host "  1. PJTECH 9router LLM Gateway          → Port 9000" -ForegroundColor Gray
Write-Host "  2. PJTECH Kasir-Umkm Server            → Port 3000" -ForegroundColor Gray
Write-Host "  3. PJTECH Autonomous Telegram Bot      → Bot Command Center (include WA daemon)" -ForegroundColor Gray
Write-Host "  4. PJTECH One-Sales-Man Scheduler      → Divisi Sales (Scrape/Email/Report)" -ForegroundColor Gray
Write-Host ""
Write-Host "Task USER LOGON (butuh login user):" -ForegroundColor White
Write-Host "  5. PJTECH Hermes Agent                 → AI Assistant (TUI)" -ForegroundColor Gray
Write-Host ""
Write-Host "Cek status: Get-ScheduledTask -TaskName 'PJTECH*'" -ForegroundColor Cyan
Write-Host "Hapus semua: schtasks /Delete /TN 'PJTECH*' /F" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔁 Restart PC untuk test otomatis penuh." -ForegroundColor Green