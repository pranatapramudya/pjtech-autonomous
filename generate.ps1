[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# PJTECH Video Engine - One-Click Generator
# Jalankan dari mana saja: .\generate.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineDir = Join-Path $ScriptDir "video-engine"
$PublicDir = Join-Path $EngineDir "public"
$KasirDir = Resolve-Path (Join-Path $ScriptDir "..\kasir-umkm")

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "   PJTECH AUTONOMOUS VIDEO ENGINE" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# --- AUTO-CHECK & AUTO-START SERVER KASIR-UMKM (PORT 3000) ---
Write-Host "🔍 Memeriksa status server kasir-umkm di port 3000..." -ForegroundColor Cyan
$isServerRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $isServerRunning) {
    Write-Host "⚠️  Server kasir-umkm belum aktif. Menyalakan otomatis di background..." -ForegroundColor Yellow
    
    if (-not (Test-Path (Join-Path $KasirDir ".next"))) {
        Write-Host "📦 Menjalankan build Next.js (hanya sekali)..." -ForegroundColor Yellow
        Start-Process -FilePath "npm.cmd" -ArgumentList "run", "build" -WorkingDirectory $KasirDir -NoNewWindow -Wait
    }

    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $KasirDir -WindowStyle Hidden

    $maxWait = 25
    $waited = 0
    Write-Host "⏳ Menunggu server siap menerima request..." -NoNewline -ForegroundColor Yellow
    while (-not (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue) -and ($waited -lt $maxWait)) {
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline -ForegroundColor Yellow
        $waited++
    }
    Write-Host ""

    if ($waited -ge $maxWait) {
        Write-Error "❌ Gagal menyalakan server kasir-umkm di port 3000."
        exit 1
    }
    Write-Host "✅ Server kasir-umkm aktif di http://localhost:3000!" -ForegroundColor Green
} else {
    Write-Host "✅ Server kasir-umkm sudah aktif di http://localhost:3000!" -ForegroundColor Green
}
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════
# 🧹 PRE-RUN CLEAN SLATE: Purge all stale artifacts
# ═══════════════════════════════════════════════════════════
Write-Host "🧹 [CLEAN SLATE] Purging stale artifacts from previous run..." -ForegroundColor Yellow

$staleFiles = @(
    # Video outputs
    (Join-Path $EngineDir "output_ready.mp4"),
    (Join-Path $EngineDir "temp.mp4"),
    (Join-Path $PublicDir "app_demo.mp4"),
    (Join-Path $PublicDir "broll.mp4"),
    # Text & Data
    (Join-Path $PublicDir "script_config.json"),
    (Join-Path $PublicDir "video_metadata.json"),
    (Join-Path $PublicDir "app_demo_data.json"),
    (Join-Path $PublicDir "subtitle_timing.json"),
    (Join-Path $PublicDir "visual_timeline.json"),
    (Join-Path $PublicDir "editing_theme.json"),
    (Join-Path $PublicDir ".pipeline_cache.json"),
    (Join-Path $PublicDir "CAPTION_READY.txt"),
    (Join-Path $EngineDir "CAPTION_READY.txt"),
    # Audio
    (Join-Path $PublicDir "audio.wav"),
    (Join-Path $PublicDir "audio_normalized.wav"),
    (Join-Path $PublicDir "audio.mp3"),
    # Playwright session state (force fresh login)
    (Join-Path $PublicDir "auth.json")
)

$purged = 0
foreach ($f in $staleFiles) {
    if (Test-Path $f) {
        Remove-Item $f -Force -ErrorAction SilentlyContinue
        $purged++
    }
}

# Wipe numbered B-Roll variants + debug screenshots
Get-ChildItem -Path $PublicDir -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^broll_\d+\.mp4$' -or
    $_.Name -like 'audio_test_*' -or
    $_.Name -like 'audio_google_*' -or
    $_.Name -like 'debug_*' -or
    $_.Name -like 'test_*' -or
    $_.Name -like 'page@*' -or
    $_.Name -like 'screenshot*' -or
    $_.Name -like 'step*'
} | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    $purged++
}

Write-Host "✅ [CLEAN SLATE] Purged $purged stale artifacts. Workspace is pristine." -ForegroundColor Green
Write-Host ""

# Ensure placeholder JSON files exist so Remotion bundler doesn't crash if pipeline fails mid-way
if (-not (Test-Path (Join-Path $PublicDir "visual_timeline.json"))) {
    '[]' | Out-File -FilePath (Join-Path $PublicDir "visual_timeline.json") -Encoding utf8
}
if (-not (Test-Path (Join-Path $PublicDir "video_metadata.json"))) {
    '{"title":"PJTECH KASIR UMKM","caption":"","pexels_keyword":"business"}' | Out-File -FilePath (Join-Path $PublicDir "video_metadata.json") -Encoding utf8
}
if (-not (Test-Path (Join-Path $PublicDir "editing_theme.json"))) {
    '{"theme":"cyberpunk"}' | Out-File -FilePath (Join-Path $PublicDir "editing_theme.json") -Encoding utf8
}

# Step 1: Masuk ke folder video-engine dan jalankan pipeline
Set-Location $EngineDir
Write-Host "[1/1] Running full pipeline (auto-clear cache + script AI + Orus TTS + E2E app demo + Remotion render)..." -ForegroundColor Yellow

cmd.exe /c "npx tsx run_pipeline.ts"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Pipeline GAGAL (exit code $LASTEXITCODE)." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host " 🎉 SELESAI! Output: output_ready.mp4" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

$CaptionFile = Join-Path $EngineDir "CAPTION_READY.txt"
if (Test-Path $CaptionFile) {
    Write-Host "📄 DOKUMEN CAPTION & HASHTAG DISIMPAN DI: video-engine\CAPTION_READY.txt" -ForegroundColor Cyan
    Write-Host ""
    Get-Content $CaptionFile -Encoding utf8
    Write-Host ""
}

# Buka folder output_ready.mp4 di Explorer
Start-Process explorer.exe -ArgumentList $EngineDir
