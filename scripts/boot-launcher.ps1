# ==============================================================================
# PJTECH AUTONOMOUS - COLD BOOT LAUNCHER (SYSTEM STARTUP / RTC ALARM 08:00)
# Script ini dirancang khusus untuk dieksekusi via Windows Task Scheduler
# pada saat PC menyala (At System Boot) tanpa memerlukan login akun / PIN.
# ==============================================================================

$ErrorActionPreference = "Continue"
$ScriptDir = "D:\Coding\pjtech-autonomous"
$EngineDir = "D:\Coding\pjtech-autonomous\video-engine"
$KasirDir  = "D:\Coding\kasir-umkm"
$BootLog   = Join-Path $ScriptDir "boot.log"
$DaemonLog = Join-Path $ScriptDir "telegram-daemon.log"

function Log-Boot ($msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $logLine = "[$timestamp] $msg"
    Write-Output $logLine
    Add-Content -Path $BootLog -Value $logLine -ErrorAction SilentlyContinue
}

Log-Boot "==========================================================="
Log-Boot "[PJTECH BOOT] Windows RTC / Startup Sequence Terdeteksi"
Log-Boot "==========================================================="

# 1. Pastikan Environment Variable Puppeteer & User Profile terpasang
$env:PUPPETEER_CACHE_DIR = "C:\Users\Pranata Pramudya\.cache\puppeteer"
if (-not $env:USERPROFILE -or $env:USERPROFILE -like "*systemprofile*") {
    $env:USERPROFILE = "C:\Users\Pranata Pramudya"
}
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# 2. Tunggu koneksi internet aktif (Wi-Fi / LAN DHCP setelah cold boot)
Log-Boot "[1/3] Menunggu koneksi internet aktif (Telegram API)..."
$maxNetWait = 60
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
        Start-Sleep -Seconds 3
        $netWaited += 3
    }
}

if ($isOnline) {
    Log-Boot "[OK] Koneksi internet aktif setelah $netWaited detik!"
} else {
    Log-Boot "[WARN] Belum ada respon dari api.telegram.org setelah $maxNetWait detik, tetap melanjutkan..."
}

# 3. Periksa & jalankan server lokal Kasir UMKM (Port 3000)
Log-Boot "[2/3] Memeriksa server Kasir UMKM di port 3000..."
$isKasirRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $isKasirRunning) {
    if (Test-Path $KasirDir) {
        Log-Boot "[*] Menyalakan server Kasir UMKM di port 3000 (Next.js)..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -WorkingDirectory $KasirDir -WindowStyle Hidden

        $waited = 0
        while (-not (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) -and ($waited -lt 30)) {
            Start-Sleep -Seconds 2
            $waited += 2
        }

        if (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) {
            Log-Boot "[OK] Server Kasir UMKM aktif di http://localhost:3000!"
        } else {
            Log-Boot "[WARN] Server Kasir UMKM belum merespon di port 3000, proses tetap berlanjut."
        }
    } else {
        Log-Boot "[ERROR] Folder Kasir UMKM tidak ditemukan di $KasirDir"
    }
} else {
    Log-Boot "[OK] Server Kasir UMKM sudah berjalan di port 3000."
}

# 4. Periksa & jalankan Telegram Bot Command Center
Log-Boot "[3/3] Memeriksa status Telegram Bot Command Center..."
$runningBots = Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='tsx.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*"
}

if (-not $runningBots) {
    Log-Boot "[*] Bot belum aktif. Meluncurkan Telegram Bot Daemon via WScript..."
    $VbsPath = Join-Path $ScriptDir "scripts\start-telegram-daemon.vbs"
    Start-Process -FilePath "wscript.exe" -ArgumentList "`"$VbsPath`"" -WindowStyle Hidden

    Start-Sleep -Seconds 5
    $checkBots = Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='tsx.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*"
    }

    if ($checkBots) {
        Log-Boot "[OK] Telegram Bot Command Center aktif di background! PID: $($checkBots.ProcessId -join ', ')"
    } else {
        Log-Boot "[INFO] Telegram Bot sedang proses inisialisasi di background."
    }
} else {
    Log-Boot "[OK] Telegram Bot Command Center sudah berjalan aktif! PID: $($runningBots.ProcessId -join ', ')"
}

Log-Boot "[SELESAI] Ekosistem PJTech Autonomous 100% Siap Beroperasi."
Log-Boot "==========================================================="
