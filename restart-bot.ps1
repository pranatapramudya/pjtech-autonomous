# ============================================================
# restart-bot.ps1 — Safe Bot Restart (TANPA matiin Kasir Server)
# ============================================================
# Script ini HANYA merestart proses telegram.ts.
# Kasir-umkm (port 3000), one-sales-man, dan proses Node lainnya
# TIDAK akan disentuh sama sekali.
# Jalankan: .\restart-bot.ps1
# ============================================================

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineDir  = Join-Path $ScriptDir "video-engine"
$LockFile   = Join-Path $EngineDir ".bot.lock"
$currentPid = $PID

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   [PJTECH] RESTART BOT TELEGRAM (Safe - Kasir Aman)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# LANGKAH 1: Cari dan matikan HANYA proses telegram.ts
Write-Host "[*] Mencari proses Telegram Bot yang aktif..." -ForegroundColor Cyan
$telegramProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    ($_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*") `
    -and $_.ProcessId -ne $currentPid
}

if ($telegramProcs) {
    $pidList = $telegramProcs.ProcessId -join ', '
    Write-Host "[!] Ditemukan bot aktif (PID: $pidList). Menghentikan..." -ForegroundColor Yellow
    foreach ($proc in $telegramProcs) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
    Write-Host "[OK] Proses telegram.ts berhasil dihentikan." -ForegroundColor Green
} else {
    Write-Host "[OK] Tidak ada bot yang sedang berjalan." -ForegroundColor Green
}

# LANGKAH 2: Hapus .bot.lock
if (Test-Path $LockFile) {
    Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] .bot.lock dibersihkan." -ForegroundColor Green
}

# LANGKAH 3: Konfirmasi kasir server AMAN
$kasirOk = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($kasirOk) {
    Write-Host "[OK] Server Kasir (port 3000) tetap aktif - tidak disentuh." -ForegroundColor Green
} else {
    Write-Host "[!] Server Kasir (port 3000) offline. Jalankan: cd D:\Coding\kasir-umkm && npm run dev" -ForegroundColor Yellow
}

# LANGKAH 4: Pastikan WhatsApp Business Daemon aktif
$waOk = Test-NetConnection -ComputerName localhost -Port 3847 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $waOk) {
    Write-Host "[*] Menyalakan WhatsApp Business Daemon 24/7 di background..." -ForegroundColor Cyan
    $OneSalesDir = "D:\Coding\one-sales-man"
    if (Test-Path $OneSalesDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/whatsapp/daemon.ts >> D:\Coding\pjtech-autonomous\whatsapp-daemon.log 2>&1" -WorkingDirectory $OneSalesDir -WindowStyle Hidden
        Write-Host "[OK] WhatsApp Business Daemon diluncurkan di background." -ForegroundColor Green
    }
} else {
    Write-Host "[OK] WhatsApp Business Daemon sudah aktif di port 3847." -ForegroundColor Green
}

# LANGKAH 5: Start Bot Telegram
Write-Host ""
Write-Host "[*] Menyalakan ulang Bot Telegram..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $EngineDir
try {
    npx tsx src/services/telegram.ts
} finally {
    Set-Location $ScriptDir
}
