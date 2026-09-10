# PJTECH Autonomous - Telegram Bot Command Center Launcher
# Jalankan dari PowerShell: .\bot.ps1 atau npm run bot

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineDir = Join-Path $ScriptDir "video-engine"
$KasirDir = Resolve-Path (Join-Path $ScriptDir "..\kasir-umkm") -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   [PJTECH AUTONOMOUS] - TELEGRAM BOT COMMAND CENTER" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. SINGLE-INSTANCE GUARD (MENCEGAH BOT DOUBLE / TELEGRAM 409 CONFLICT) ---
Write-Host "[*] Memeriksa instansi bot yang sedang berjalan..." -ForegroundColor Cyan
$currentPid = $PID
$runningBots = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    ($_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*") -and $_.ProcessId -ne $currentPid
}

if ($runningBots) {
    Write-Host "[!] Ditemukan instansi bot yang sudah aktif di sistem (PID: $($runningBots.ProcessId -join ', '))!" -ForegroundColor Yellow
    Write-Host "[*] Menghentikan instansi bot lama untuk mencegah bentrok token Telegram (Error 409)..." -ForegroundColor Cyan
    foreach ($proc in $runningBots) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
    Write-Host "[OK] Instansi bot lama berhasil dibersihkan." -ForegroundColor Green
}

# --- 2. TUNGGU KONEKSI INTERNET AKTIF (UNTUK COLD BOOT SAAT PC BARU HIDUP) ---
Write-Host "[*] Memeriksa koneksi internet (Telegram API)..." -ForegroundColor Cyan
$maxNetWait = 25
$netWaited = 0
$isOnline = $false

while (-not $isOnline -and ($netWaited -lt $maxNetWait)) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connect = $tcp.BeginConnect("api.telegram.org", 443, $null, $null)
        $success = $connect.AsyncWaitHandle.WaitOne(2000, $false)
        if ($success -and $tcp.Connected) {
            $tcp.EndConnect($connect)
            $isOnline = $true
        }
        $tcp.Close()
    } catch {
        $isOnline = $false
    }

    if (-not $isOnline) {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $netWaited += 2
    }
}
Write-Host ""

if ($isOnline) {
    Write-Host "[OK] Koneksi internet aktif & terhubung ke Telegram API!" -ForegroundColor Green
} else {
    Write-Warning "[!] Belum dapat menjangkau api.telegram.org setelah $maxNetWait detik. Melanjutkan proses..."
}

# --- 3. AUTO-CHECK & AUTO-START SERVER KASIR-UMKM (PORT 3000) ---
Write-Host "[*] Memeriksa status server kasir-umkm di port 3000..." -ForegroundColor Cyan
$isServerRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $isServerRunning) {
    if ($KasirDir -and (Test-Path $KasirDir)) {
        Write-Host "[!] Server kasir-umkm belum aktif. Menyalakan otomatis di background..." -ForegroundColor Yellow

        if (-not (Test-Path (Join-Path $KasirDir ".next"))) {
            Write-Host "[*] Menjalankan build Next.js (hanya sekali)..." -ForegroundColor Yellow
            Start-Process -FilePath "npm.cmd" -ArgumentList "run", "build" -WorkingDirectory $KasirDir -NoNewWindow -Wait
        }

        Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $KasirDir -WindowStyle Hidden

        $maxWait = 25
        $waited = 0
        Write-Host "[...] Menunggu server kasir siap menerima request..." -NoNewline -ForegroundColor Yellow
        while (-not (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) -and ($waited -lt $maxWait)) {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline -ForegroundColor Yellow
            $waited++
        }
        Write-Host ""

        if ($waited -ge $maxWait) {
            Write-Warning "[!] Gagal menyalakan server kasir-umkm di port 3000. Pastikan Anda menyalakannya secara manual."
        } else {
            Write-Host "[OK] Server kasir-umkm aktif di http://localhost:3000!" -ForegroundColor Green
        }
    } else {
        Write-Host "[!] Direktori kasir-umkm tidak ditemukan di ..\kasir-umkm. Pastikan server kasir jalan di port 3000." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Server kasir-umkm sudah aktif di http://localhost:3000!" -ForegroundColor Green
}

# --- 4. START TELEGRAM BOT COMMAND CENTER ---
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "[*] Menyalakan Bot Telegram..." -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $EngineDir
try {
    npx tsx src/telegram.ts
} finally {
    Set-Location $ScriptDir
}
