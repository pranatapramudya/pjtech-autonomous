# Dijalankan oleh Task Scheduler sebagai SYSTEM. Jangan jalankan manual.
# Menjaga daemon WhatsApp tetap hidup dan tersembunyi.

$daemonPort = 3847
$salesDir = 'D:\Coding\one-sales-man'
$logFile = 'D:\Coding\pjtech-autonomous\whatsapp-daemon.log'
$npxPath = 'C:\Program Files\nodejs\npx.cmd'

function Test-DaemonHealthy {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:$daemonPort/health" -TimeoutSec 3
        return $response.status -eq 'ok'
    } catch {
        return $false
    }
}

function Start-DaemonHidden {
    $command = "`"$npxPath`" tsx src\whatsapp\daemon.ts >> `"$logFile`" 2>&1"
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $command -WorkingDirectory $salesDir -WindowStyle Hidden
    Add-Content -LiteralPath $logFile -Value "`n[WATCHDOG] Memulai ulang daemon WhatsApp secara hidden: $(Get-Date -Format s)"
}

while ($true) {
    if (-not (Test-DaemonHealthy)) {
        Start-DaemonHidden
        Start-Sleep -Seconds 12
    }

    Start-Sleep -Seconds 10
}
