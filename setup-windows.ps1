# ==============================================================================
# PJTECH AUTONOMOUS - WINDOWS 24/7 POWER PLAN & AUTO-START SETUP
# Jalankan script ini SATU KALI via PowerShell (Run as Administrator direkomendasikan):
# .\setup-windows.ps1
# ==============================================================================

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " [PJTECH] KONFIGURASI POWER PLAN & STARTUP OTONOM 24/7" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. ATUR POWER PLAN: CEGAH PC SLEEP & HIBERNATE SAAT TERSAMBUNG KE LISTRIK
# ------------------------------------------------------------------------------
Write-Host "[1/2] Mengonfigurasi Windows Power Plan..." -ForegroundColor Yellow

try {
    # Nilai 0 = Never / Tidak Pernah
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    powercfg /change disk-timeout-ac 0

    Write-Host "  [OK] PC diset: TIDAK AKAN SLEEP / HIBERNATE saat terhubung listrik (AC)!" -ForegroundColor Green
    Write-Host "       (Catatan: Layar/Monitor tetap bisa mati otomatis untuk menghemat listrik & layar)" -ForegroundColor Gray
} catch {
    Write-Warning "  [!] Gagal mengubah power plan. Pastikan PowerShell dijalankan dengan hak Administrator jika diperlukan."
}

Write-Host ""

# ------------------------------------------------------------------------------
# 2. BUAT SHORTCUT STARTUP VBS (SILENT/HIDDEN LAUNCHER SAAT BOOTING)
# ------------------------------------------------------------------------------
Write-Host "[2/2] Mendaftarkan Auto-Start ke Windows Startup..." -ForegroundColor Yellow

$StartupFolder = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$VbsPath = Join-Path $StartupFolder "start-pjtech.vbs"
$BotScriptPath = "D:\Coding\pjtech-autonomous\bot.ps1"

# Konten script VBS yang menjalankan bot.ps1 secara hidden (tanpa muncul jendela hitam CMD/PowerShell)
$VbsContent = @"
' PJTECH Autonomous - Silent Background Launcher
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$BotScriptPath""", 0, False
"@

try {
    if (-not (Test-Path $StartupFolder)) {
        New-Item -ItemType Directory -Path $StartupFolder -Force | Out-Null
    }

    # Tulis file VBS dengan encoding ASCII/ANSI agar Windows Script Host membacanya dengan mulus
    [System.IO.File]::WriteAllText($VbsPath, $VbsContent, [System.Text.Encoding]::ASCII)

    Write-Host "  [OK] File Startup VBS berhasil dibuat di:" -ForegroundColor Green
    Write-Host "       $VbsPath" -ForegroundColor White
    Write-Host "  [OK] Target Script: $BotScriptPath" -ForegroundColor Green
    Write-Host "       (Mode: Hidden/Silent - Berjalan di background saat Windows menyala)" -ForegroundColor Gray
} catch {
    Write-Error "  [!] Gagal membuat file startup VBS: $_"
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " [SUKSES] Konfigurasi selesai 100%!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Setiap kali PC dinyalakan / reboot:"
Write-Host " 1. Server Kasir (Port 3000) otomatis aktif di background."
Write-Host " 2. Bot Telegram & 24/7 Autonomous Scheduler otomatis jalan."
Write-Host " 3. PC tidak akan pernah sleep sendiri saat dicolok listrik."
Write-Host " 4. Bot Kliper/Affiliate siap melayani kapan saja dari HP."
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
