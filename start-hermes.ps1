# Start Hermes Agent on Boot (User Session Required)
# Run this via Task Scheduler: At log on (not At startup)

$HermesExe = "C:\Users\Pranata Pramudya\AppData\Local\hermes\bin\hermes.exe"
$HermesArgs = "chat --provider custom --model combo-prun --base-url http://localhost:20128/v1 --tui"

if (-not (Test-Path $HermesExe)) {
    Write-Error "Hermes not found at $HermesExe"
    exit 1
}

Write-Host "[*] Starting Hermes Agent..." -ForegroundColor Cyan
Start-Process -FilePath $HermesExe -ArgumentList $HermesArgs -WindowStyle Normal -WorkingDirectory "D:\Coding\pjtech-autonomous"