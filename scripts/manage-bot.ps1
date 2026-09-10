<#
.SYNOPSIS
    Kontrol daemon Bot Telegram (start / stop / status).

.PARAMETER Action
    start   - Jalankan bot sebagai background daemon via wscript
    stop    - Hentikan semua proses node yang menjalankan telegram.ts
    status  - Periksa status proses + tampilkan 10 baris terakhir log

.EXAMPLE
    .\manage-bot.ps1 -Action start
    .\manage-bot.ps1 -Action stop
    .\manage-bot.ps1 -Action status
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("start", "stop", "status")]
    [string]$Action
)

$VbsPath  = "D:\Coding\pjtech-autonomous\scripts\start-telegram-daemon.vbs"
$LogPath  = "D:\Coding\pjtech-autonomous\telegram-daemon.log"
$Keyword  = "telegram.ts"

function Get-TelegramProcesses {
    $found = @()
    try {
        $cimProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' or Name = 'tsx.exe'" -ErrorAction SilentlyContinue
        foreach ($p in $cimProcs) {
            if ($p.CommandLine -like "*$Keyword*") {
                $found += [PSCustomObject]@{
                    PID         = $p.ProcessId
                    Name        = $p.Name
                    CommandLine = $p.CommandLine
                }
            }
        }
    } catch {
        # Fallback to WMI
        Get-Process -Name node, tsx -ErrorAction SilentlyContinue | ForEach-Object {
            $pid_ = $_.Id
            try {
                $wmi = Get-WmiObject Win32_Process -Filter "ProcessId=$pid_" -ErrorAction SilentlyContinue
                if ($wmi.CommandLine -like "*$Keyword*") {
                    $found += [PSCustomObject]@{
                        PID         = $pid_
                        Name        = $_.ProcessName
                        CommandLine = $wmi.CommandLine
                    }
                }
            } catch {}
        }
    }
    return $found
}

switch ($Action) {

    "start" {
        Write-Host "[START] Memeriksa apakah daemon sudah berjalan..." -ForegroundColor Cyan
        $existing = Get-TelegramProcesses
        if ($existing) {
            Write-Host "[WARN]  Daemon sudah berjalan (PID: $($existing.PID -join ', ')). Gunakan -Action stop terlebih dahulu." -ForegroundColor Yellow
            return
        }

        Write-Host "[START] Meluncurkan Telegram daemon via WScript (detached)..." -ForegroundColor Cyan
        try {
            Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "wscript.exe `"$VbsPath`"" } | Out-Null
        } catch {
            Start-Process -FilePath "wscript.exe" -ArgumentList "`"$VbsPath`"" -WindowStyle Hidden
        }
        
        Write-Host "[WAIT]  Menunggu proses booting (hingga 12 detik)..." -ForegroundColor DarkCyan
        $procs = $null
        for ($i = 0; $i -lt 12; $i++) {
            Start-Sleep -Seconds 1
            $procs = Get-TelegramProcesses
            if ($procs) { break }
        }

        if ($procs) {
            Write-Host "[OK]    Daemon aktif di background Windows!" -ForegroundColor Green
            $procs | Format-Table -AutoSize
        } else {
            Write-Host "[INFO]  Proses sedang inisialisasi di background. Silakan cek status beberapa saat lagi." -ForegroundColor Yellow
        }

        if (Test-Path $LogPath) {
            Write-Host "`n--- Log Terakhir ($LogPath) ---" -ForegroundColor DarkGray
            Get-Content $LogPath -Tail 15
        }
    }

    "stop" {
        Write-Host "[STOP]  Menghentikan Telegram daemon..." -ForegroundColor Cyan
        $procs = Get-TelegramProcesses
        if ($procs) {
            $procs | ForEach-Object {
                Stop-Process -Id $_.PID -Force -ErrorAction SilentlyContinue
                Write-Host "[OK]    Proses PID $($_.PID) berhasil dihentikan." -ForegroundColor Green
            }
        } else {
            Write-Host "[INFO]  Tidak ada proses telegram.ts yang sedang berjalan." -ForegroundColor Yellow
        }
    }

    "status" {
        Write-Host "[STATUS] Memeriksa status Telegram daemon..." -ForegroundColor Cyan
        $procs = Get-TelegramProcesses
        if ($procs) {
            Write-Host "[ONLINE] Daemon aktif (PID: $($procs.PID -join ', ')):" -ForegroundColor Green
            $procs | Format-Table -AutoSize
        } else {
            Write-Host "[OFFLINE] Tidak ada proses telegram.ts yang ditemukan." -ForegroundColor Red
        }
        if (Test-Path $LogPath) {
            Write-Host "`n--- 15 Baris Terakhir Log ($LogPath) ---" -ForegroundColor DarkGray
            Get-Content $LogPath -Tail 15
        } else {
            Write-Host "[INFO]  File log belum ada: $LogPath" -ForegroundColor Yellow
        }
    }
}