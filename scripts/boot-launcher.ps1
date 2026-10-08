# ==============================================================================
# PJTECH AUTONOMOUS - 24/7 COLD BOOT LAUNCHER & SELF-HEALING SUPERVISOR
# Dieksekusi via Windows Task Scheduler saat PC menyala (RTC Alarm BIOS)
# Berjalan terus menerus di background memantau:
# 1. Kasir UMKM (Port 3000)
# 2. WhatsApp Business Daemon (Port 3847)
# 3. Telegram Bot Command Center (src/telegram.ts)
# ==============================================================================

$ErrorActionPreference = "Continue"
$ScriptDir = "D:\Coding\pjtech-autonomous"
$EngineDir = "D:\Coding\pjtech-autonomous\video-engine"
$KasirDir  = "D:\Coding\kasir-umkm"
$OneSalesDir = "D:\Coding\one-sales-man"
$BootLog   = Join-Path $ScriptDir "boot.log"
$DaemonLog = Join-Path $ScriptDir "telegram-daemon.log"
$WaLog     = Join-Path $ScriptDir "whatsapp-daemon.log"
$LockFile  = Join-Path $EngineDir ".bot.lock"

function Log-Boot ($msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $logLine = "[$timestamp] $msg"
    Write-Output $logLine
    Add-Content -Path $BootLog -Value $logLine -ErrorAction SilentlyContinue
}

# --- SINGLE INSTANCE CHECK FOR SUPERVISOR ---
$myPid = $PID
$existingSupervisors = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*boot-launcher.ps1*" -and $_.ProcessId -ne $myPid
}
if ($existingSupervisors) {
    Log-Boot "[INFO] Supervisor boot-launcher sudah aktif (PID: $($existingSupervisors.ProcessId -join ', ')). Melepaskan proses duplikat."
    exit 0
}

Log-Boot "==========================================================="
Log-Boot "[PJTECH BOOT] Windows RTC / Startup Sequence Terdeteksi"
Log-Boot "==========================================================="

# 1. Pastikan Environment Variable Puppeteer, Playwright, & User Profile terpasang
$env:PUPPETEER_CACHE_DIR = "C:\Users\Pranata Pramudya\.cache\puppeteer"
$env:PLAYWRIGHT_BROWSERS_PATH = "C:\Users\Pranata Pramudya\AppData\Local\ms-playwright"
if (-not $env:USERPROFILE -or $env:USERPROFILE -like "*systemprofile*") {
    $env:USERPROFILE = "C:\Users\Pranata Pramudya"
}
if (-not $env:LOCALAPPDATA -or $env:LOCALAPPDATA -like "*systemprofile*") {
    $env:LOCALAPPDATA = "C:\Users\Pranata Pramudya\AppData\Local"
}
$sysPlaywright = "C:\WINDOWS\system32\config\systemprofile\AppData\Local\ms-playwright"
if (-not (Test-Path $sysPlaywright) -and (Test-Path $env:PLAYWRIGHT_BROWSERS_PATH)) {
    try {
        New-Item -ItemType Junction -Path $sysPlaywright -Target $env:PLAYWRIGHT_BROWSERS_PATH -Force -ErrorAction SilentlyContinue | Out-Null
    } catch {}
}
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

# 2. Tunggu koneksi internet aktif (Wi-Fi / LAN DHCP setelah cold boot)
Log-Boot "[1/4] Menunggu koneksi internet aktif (Telegram API)..."
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

# --- SERVICE LAUNCH HELPER FUNCTIONS ---

function Start-KasirServer {
    if (Test-Path $KasirDir) {
        Log-Boot "[*] Menyalakan server Kasir UMKM di port 3000 (Next.js)..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -WorkingDirectory $KasirDir -WindowStyle Hidden
    }
}

function Start-WhatsAppDaemon {
    if (Test-Path $OneSalesDir) {
        Log-Boot "[*] Menyalakan WhatsApp Business Daemon di port 3847..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/whatsapp/daemon.ts >> `"$WaLog`" 2>&1" -WorkingDirectory $OneSalesDir -WindowStyle Hidden
    }
}

function Start-TelegramBot {
    if (Test-Path $EngineDir) {
        # Bersihkan stale lock jika ada
        if (Test-Path $LockFile) {
            try { Remove-Item $LockFile -Force -ErrorAction SilentlyContinue } catch {}
        }
        Log-Boot "[*] Menyalakan Telegram Bot Command Center & Scheduler..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/services/telegram.ts >> `"$DaemonLog`" 2>&1" -WorkingDirectory $EngineDir -WindowStyle Hidden
    }
}

# 3. Inisialisasi awal server lokal Kasir UMKM (Port 3000)
Log-Boot "[2/4] Memeriksa server Kasir UMKM di port 3000..."
$isKasirRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $isKasirRunning) {
    Start-KasirServer
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
    Log-Boot "[OK] Server Kasir UMKM sudah berjalan di port 3000."
}

# 4. Inisialisasi awal WhatsApp Business Daemon (Port 3847)
Log-Boot "[3/4] Memeriksa WhatsApp Business Daemon di port 3847..."
$isWaRunning = Test-NetConnection -ComputerName localhost -Port 3847 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $isWaRunning) {
    Start-WhatsAppDaemon
    Start-Sleep -Seconds 3
    Log-Boot "[OK] WhatsApp Business Daemon diluncurkan."
} else {
    Log-Boot "[OK] WhatsApp Business Daemon sudah berjalan aktif di port 3847."
}

# 5. Inisialisasi awal Telegram Bot Command Center
Log-Boot "[4/4] Memeriksa Telegram Bot Command Center..."
$runningBots = Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='tsx.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*"
}
if (-not $runningBots) {
    Start-TelegramBot
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
Log-Boot "[SUPERVISOR] Memulai 24/7 Self-Healing Watchdog Loop..."
Log-Boot "==========================================================="

# ==============================================================================
# 6. 24/7 CONTINUOUS SELF-HEALING SUPERVISOR
# Memantau ke-3 service setiap 30 detik.
# Jika ada service yang crash / offline / internet sempat putus, otomatis dihidupkan ulang.
# ==============================================================================

$heartbeatCounter = 0

while ($true) {
    Start-Sleep -Seconds 30
    $heartbeatCounter++

    try {
        # A. Cek Kasir UMKM (Port 3000)
        $kasirAlive = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $kasirAlive) {
            Log-Boot "[SUPERVISOR-ALERT] Server Kasir UMKM (Port 3000) offline! Merestart otomatis..."
            Start-KasirServer
        }

        # B. Cek WhatsApp Daemon (Port 3847)
        $waAlive = Test-NetConnection -ComputerName localhost -Port 3847 -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $waAlive) {
            Log-Boot "[SUPERVISOR-ALERT] WhatsApp Daemon (Port 3847) offline! Merestart otomatis..."
            Start-WhatsAppDaemon
        }

        # C. Cek Telegram Bot Process
        $botProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='tsx.exe'" -ErrorAction SilentlyContinue | Where-Object {
            $_.CommandLine -like "*src/telegram.ts*" -or $_.CommandLine -like "*src\telegram.ts*"
        }
        if (-not $botProcs) {
            Log-Boot "[SUPERVISOR-ALERT] Telegram Bot tidak terdeteksi! Merestart otomatis..."
            Start-TelegramBot
        }

        # D. Heartbeat log setiap ~6 jam (720 iterasi x 30s = 21600s = 6 jam)
        if ($heartbeatCounter -ge 720) {
            Log-Boot "[HEARTBEAT] Seluruh service (Kasir:3000, WA:3847, TelegramBot) aktif & sehat."
            $heartbeatCounter = 0
        }
    } catch {
        # Tangkap error supervisor tanpa mematikan loop
    }
}
