# PJTECH Autonomous - Telegram Bot Command Center Launcher
# Jalankan dari PowerShell: .\bot.ps1 atau npm run bot

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineDir = Join-Path $ScriptDir "video-engine"
$KasirDir = Resolve-Path (Join-Path $ScriptDir "..\kasir-umkm") -ErrorAction SilentlyContinue

$env:PUPPETEER_CACHE_DIR = "C:\Users\Pranata Pramudya\.cache\puppeteer"
$env:PLAYWRIGHT_BROWSERS_PATH = "C:\Users\Pranata Pramudya\AppData\Local\ms-playwright"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "   [PJTECH AUTONOMOUS] - TELEGRAM BOT COMMAND CENTER" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 0. WINDOWS POWER ANTI-SLEEP GUARD (MENCEGAH PC TIDUR SAAT BOT BERJALAN) ---
Write-Host "[*] Mengaktifkan Anti-Sleep Guard (Power Plan AC)..." -ForegroundColor Cyan
try {
    # Pastikan PC tidak otomatis sleep / hibernate saat tercolok listrik (AC)
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    # Layar monitor tetap boleh mati setelah 15 menit agar hemat daya dan adem
    powercfg /change monitor-timeout-ac 15
    Write-Host "[OK] Anti-Sleep Guard aktif: CPU PC akan tetap bekerja 24/7 saat bot aktif." -ForegroundColor Green
} catch {
    Write-Warning "[!] Peringatan: Tidak dapat mengubah powercfg secara otomatis: $_"
}

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

# Cek apakah port 3000 aktif ATAU proses kasir sudah jalan (dev/start mode)
$isPortActive = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
$isKasirProcessRunning = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*kasir-umkm*" -or $_.CommandLine -like "*next dev*" -or $_.CommandLine -like "*next start*"
}
$isServerRunning = $isPortActive -or ($isKasirProcessRunning -and $isKasirProcessRunning.Count -gt 0)

if (-not $isServerRunning) {
    if ($KasirDir -and (Test-Path $KasirDir)) {
        Write-Host "[!] Server kasir-umkm belum aktif. Menyalakan otomatis di background..." -ForegroundColor Yellow

        # Gunakan 'dev' jika .next belum ada, 'start' jika sudah pernah di-build
        $nextBuildDir = Join-Path $KasirDir ".next"
        if (Test-Path $nextBuildDir) {
            # Build sudah ada — jalankan production mode (lebih ringan)
            Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $KasirDir -WindowStyle Hidden
        } else {
            # Belum pernah build — jalankan dev mode
            Write-Host "[*] Belum ada build production. Menjalankan dev mode..." -ForegroundColor Yellow
            Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $KasirDir -WindowStyle Hidden
        }

        $maxWait = 60
        $waited = 0
        Write-Host "[...] Menunggu server kasir siap (maks 60 detik)..." -NoNewline -ForegroundColor Yellow
        while (-not (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) -and ($waited -lt $maxWait)) {
            Start-Sleep -Seconds 2
            Write-Host "." -NoNewline -ForegroundColor Yellow
            $waited += 2
        }
        Write-Host ""

        if ($waited -ge $maxWait) {
            Write-Warning "[!] Gagal menyalakan server kasir-umkm dalam 60 detik. Lanjutkan manual: cd D:\Coding\kasir-umkm && npm run dev"
        } else {
            Write-Host "[OK] Server kasir-umkm aktif di http://localhost:3000!" -ForegroundColor Green
        }
    } else {
        Write-Host "[!] Direktori kasir-umkm tidak ditemukan. Pastikan server kasir jalan di port 3000." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Server kasir-umkm sudah aktif di http://localhost:3000!" -ForegroundColor Green
}

# --- 4. PERIKSA & NYALAKAN WHATSAPP BUSINESS DAEMON (PORT 3847) ---
$OneSalesDir = "D:\Coding\one-sales-man"
$waAuthDir = Join-Path $OneSalesDir ".wwebjs_auth"
$waBackupDir = Join-Path $OneSalesDir ".wwebjs_auth_backup"

# Sesi Guard: Pulihkan jika corrupt / backup jika sehat
if (Test-Path $waAuthDir) {
    $authFiles = Get-ChildItem -Path $waAuthDir -Recurse -ErrorAction SilentlyContinue
    if ($authFiles -and $authFiles.Count -gt 10) {
        Write-Host "[*] Melakukan Auto-Backup sesi WhatsApp Business aktif..." -ForegroundColor Cyan
        try {
            robocopy $waAuthDir $waBackupDir /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
            Write-Host "[OK] Backup sesi WhatsApp tersimpan aman di .wwebjs_auth_backup." -ForegroundColor Green
        } catch {
            Write-Warning "[!] Peringatan: Gagal membuat backup sesi: $_"
        }
    }
} elseif (Test-Path $waBackupDir) {
    Write-Host "[!] Folder .wwebjs_auth utama tidak ditemukan, memulihkan dari backup otomatis..." -ForegroundColor Yellow
    try {
        robocopy $waBackupDir $waAuthDir /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        Write-Host "[OK] Sesi WhatsApp Business berhasil dipulihkan dari backup!" -ForegroundColor Green
    } catch {
        Write-Warning "[!] Peringatan: Gagal memulihkan sesi dari backup: $_"
    }
}

$waOk = Test-NetConnection -ComputerName localhost -Port 3847 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $waOk) {
    Write-Host "[*] Menyalakan WhatsApp Business Daemon 24/7 di background..." -ForegroundColor Cyan
    if (Test-Path $OneSalesDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/whatsapp/daemon.ts >> D:\Coding\pjtech-autonomous\whatsapp-daemon.log 2>&1" -WorkingDirectory $OneSalesDir -WindowStyle Hidden
        Write-Host "[OK] WhatsApp Business Daemon diluncurkan di background." -ForegroundColor Green
    }
} else {
    Write-Host "[OK] WhatsApp Business Daemon sudah aktif di port 3847." -ForegroundColor Green
}

# --- 5. START TELEGRAM BOT COMMAND CENTER ---
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
