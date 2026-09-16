# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.5.0] - 2026-09-17

### Added
- **5-Ring Concentric Geo-Expansion Strategy (`sales-orchestrator.ts`)**:
  - Mengunci **Ring 1 (Homebase Sumedang, Jatinangor, Tanjungsari)** sebagai prioritas utama penyisiran sebelum ekspansi ke kota lain.
  - Mendukung struktur 5 Ring Zonasi Nasional (Ring 1 Homebase, Ring 2 Priangan-Bandung, Ring 3 Jabodetabek, Ring 4 Jateng-DIY, Ring 5 Jatim-Bali-Nasional).
  - Mendukung override target kota fleksibel melalui variabel lingkungan `SALES_TARGET_CITY` / `TARGET_CITY`.
- **Penyelarasan Scraper 4 Pilar Bisnis UMKM**:
  - Google Maps keyword matrix kini mencakup 4 pilar bisnis UMKM sesuai hasil audit AI Kasir UMKM: Retail Modern & Kebutuhan, F&B Kuliner, Jasa & Servis, dan Rental/Travel/Properti.
- **Template WhatsApp Soft-Selling & Concierge Onboarding (`one-sales-man`)**:
  - Mengeliminasi copy hard-selling (*"nemu kontak dari Google Maps"* dan link ganda agency).
  - Menerapkan copy berbasis empati dan pertanyaan operasional spesifik per sektor bisnis.
  - Menambahkan tawaran **White-Glove Concierge Onboarding** (bantuan input gratis 2-3 data awal armada/menu/stok) untuk mengatasi drop-off akun uji coba.
  - Menambahkan penekanan fleksibilitas **Multi-Device (bisa lewat HP, Tablet, maupun Laptop/PC)** tanpa perlu membeli mesin kasir fisik mahal.

### Fixed
- **JSDoc Syntax & Compiler Warning (`sales-orchestrator.ts`)**:
  - Memperbaiki blok komentar JSDoc `/**` yang belum tertutup sehingga seluruh fungsi pipeline kembali terbaca sempurna.
  - Meng-export `UMKM_CITIES` guna meniadakan error TS6133 unused variable (`npx tsc --noEmit` lulus dengan 0 error).

## [1.4.0] - 2026-09-16

### Added
- **Cutting-Edge Autonomous ReAct AI CEO Agent (`ai-ceo-agent.ts`)**:
  - Upgraded AI CEO dari simple chatbot menjadi full Autonomous ReAct Agent dengan Google Gemini Native Function Calling.
  - Multi-turn execution loop (hingga 4 iterasi reasoning-action) yang otomatis memanggil tools sebelum merumuskan jawaban strategis.
  - **Live System Tools Suite**:
    - `getFinanceStatus`: Query live saldo aktif, pending, dan omset harian dari Mayar.id v2 API.
    - `getSalesMetrics`: Query live pipeline prospek, outreach, dan response rate dari Neon PostgreSQL via Prisma (`cli-nightly-stats.ts`).
    - `getYoutubeStats`: Query live views, likes, dan metrik retensi video YouTube Shorts hari ini via YouTube Data API v3.
    - `getContentInsights`: Query database winning hooks, formula konten, dan banned patterns dari `content_insights.json`.
    - `triggerSystemTask`: Memicu tugas teknis otonom (`run_analytics_flywheel`, `run_nightly_report`, `test_system_health`).
  - **Persistent Long-Term Strategic Memory (`src/data/ceo_memory.json`)**:
    - Menyimpan target perusahaan, pedoman strategis, dan 14 riwayat percakapan secara permanen di disk agar tidak hilang saat server restart/mati listrik.
  - **Cross-Divisional Strategic Synthesis**:
    - Penalaran lintas divisi otomatis (misal: menyarankan hook video YouTube dengan views tinggi ke naskah outreach WhatsApp Sales).

### Improved
- **Telegram Bot AI CEO Integration**:
  - `handleCeoChat` di `telegram.ts` dialihkan ke modul terisolasi `aiCeoAgent.chat`.
  - Dukungan fallback pesan otomatis jika terjadi error formatting Markdown Telegram.
  - Pembersihan memori in-memory usang (`ceoMemory`, `pushCeoMemory`, `CEO_SYSTEM_PROMPT`) dari `telegram.ts`.
- **System Hardening & Test Suite**:
  - Menambahkan script pengujian independen `scratch/test-ai-ceo.ts`.
  - Validasi TypeScript komprehensif (`0 error`).

## [1.3.0] - 2026-09-15

### Fixed
- **Sales Outreach ↔ Telegram Desync (Root Cause Eliminated)**:
  - Bug: Cron 14:00 WIB hanya mengirim notif awal *"akan kirim 10 kontak"* ke Telegram tapi **tidak pernah mengirim laporan hasil** setelah outreach selesai.
  - Bug: `result.success` selalu `true` meski ada pesan WA yang gagal secara individual — karena hanya mengecek exit code proses, bukan status per pesan.
  - Bug: Laporan manual trigger (via tombol Telegram) hard-coded *"5 sudah disapa"* — selalu salah tanpa data real.
  - **Fix**: `runOutreachBatch` sekarang melacak `realContacted` & `realFailed` secara real-time dari stream stdout CLI, dengan parsing `[OUTREACH_DONE] Sukses: X, Gagal: Y` sebagai ground truth tertinggi.
  - **Fix**: Cron 14:00 di `autonomous-scheduler.ts` sekarang mengirim progress update real-time via `editMessageText` + laporan final akurat ke Telegram setelah outreach selesai.
  - **Fix**: Laporan manual campaign di `telegram.ts` sekarang menggunakan `result.contacted` / `result.failed` dari data real.

### Added
- **Multi-Kota UMKM Rotation (10 Kota)**:
  - Sales scraping diperluas dari hanya Bandung ke **10 kota UMKM density tinggi**: Bandung, Surabaya, Medan, Makassar, Yogyakarta, Semarang, Palembang, Denpasar, Malang, Bekasi.
  - Rental Kendaraan (Kamis) punya kota list wisata khusus: Bali, Yogyakarta, Lombok, Malang, Labuan Bajo, Raja Ampat, dst.
  - Rental Properti (Jumat) menyasar destinasi wisata: Pangandaran, Lembang, Bali, Lombok, Flores, Bromo, Wakatobi, Belitung, Labuan Bajo.
  - Kota **dirotasi otomatis** setiap minggu berdasarkan `weekIndex % 10` — tanpa intervensi manual.
- **UMKM-Specific Anti-Mall Keywords**:
  - Semua keyword scraping diperbarui secara eksplisit menghindari mall, franchise nasional, dan minimarket jaringan besar.
  - Setiap hari memiliki **4 variasi keyword** yang dirotasi mingguan (anti-duplikat database).
  - Keyword menggunakan frasa kualitatif seperti *"bukan franchise"*, *"lokal"*, *"UMKM"*, *"rumahan"* untuk filter Google Maps.
- **Real-Time Outreach Progress di Telegram**:
  - Cron 14:00 kini menampilkan status update langsung (via `editMessageText`) selama proses outreach berlangsung.
  - Format laporan final baru: `✅ Terkirim: X | ❌ Gagal: Y | 📦 Total: Z prospek diproses`.

### Improved
- **Return Types Sales Orchestrator**: `runOutreachBatch` dan `runDailyCampaign` sekarang mengembalikan `contacted?: number` dan `failed?: number` untuk transparansi penuh ke semua caller.
- **TypeScript**: Seluruh codebase compile `0 error` setelah semua perubahan.

## [1.2.1] - 2026-09-10

### Added
- **Decoupled Telegram Bot as Independent Windows Background Daemon**:
  - Detached VBScript launcher (`scripts/start-telegram-daemon.vbs`) running with `WindowStyle = 0` (silent/hidden, no terminal popup).
  - Cross-process lifecycle utility (`scripts/manage-bot.ps1`) supporting `-Action start`, `stop`, and `status`.
  - True OS-level process isolation via WMI `Win32_Process.Create` decoupling the daemon from IDE / shell process trees.
  - Dedicated background execution logging routed to `telegram-daemon.log` with `.gitignore` protection.

## [1.2.0] - 2026-09-10

### Added
- **Autonomous Executive Board (AI CEO & Chief of Staff)**:
  - Integrated AI Chief of Staff persona into Telegram Command Center for high-level business strategy, operational complaint analysis, and technical action plans.
  - Zero-Token-Waste Sliding Window Memory: keeps LLM token consumption predictable and lean by retaining only the last **5 conversational turns** (max 10 messages) sent to the LLM; older history is pruned in-memory.
  - Natural language fallthrough routing in Telegram: automatically detects conversational text and routes it to AI CEO without requiring slash commands.
- **Realtime Tech Radar (`/techradar`)**:
  - Real-time ingestion of top 3–5 tech/AI headlines from the public Hacker News Firebase API (zero-cost, no browser scraping).
  - High-density Gemini Flash summarization (<150 tokens prompt) focusing on innovation trends and practical monetization opportunities for UMKM.
  - Interactive `/techradar` command and inline keyboard button in Telegram cockpit.
- **Self-Healing SRE Watchdog**:
  - Resilient task wrapper (`withWatchdog`) in `video-engine/src/pipeline/watchdog.ts` protecting critical pipelines (Remotion render, Playwright scraper, WhatsApp outreach).
  - Token-efficient diagnostic logging: extracts only the last **50 lines** of stderr upon failure (tail-50 truncation) before sending to Gemini for RCA.
  - Automatic Gemini Flash RCA diagnosis and **1x adaptive retry** with Telegram alerting (`[AUTO-HEALED ✅]` / `[ESCALATION NEEDED 🚨]`).
- **Resilient Polling Guard (Anti 409 Conflict)**:
  - Replaced aggressive 3s-fixed reconnect loop with **exponential backoff** strategy: 3s → 6s → 12s → 24s → 48s (max 60s cap).
  - Added **max 5 attempts** gate — after exhausting retries, guard silences itself and lets the event loop stabilize without spamming the log.
  - Guard now calls `bot.stopPolling()` explicitly before `startPolling({ restart: true })` to ensure clean connection teardown.
  - Network noise errors (`ETIMEOUT`, `ECONNRESET`) are filtered from the warning log to reduce noise.
- **Crash-Proof Global Process Safety Handlers**:
  - `uncaughtException` handler: logs full error + stack trace but **no longer calls `process.exit(1)`** — bot stays alive and recovers without manual restart.
  - `unhandledRejection` handler: logs rejected promise reference and reason without exiting, keeping the event loop alive.

### Improved
- **WhatsApp Outreach Queue**: Strict **5-prospect batch** limit per scheduled run with **30–60 second randomized anti-ban jitter** delay between messages (upgraded from 10–25s). Outreach copy updated to promote **Free Trial 14 Hari** (upgraded from 7 days) to maximize open rate and conversion.
- **Autonomous Scheduler Daily Matrix**: Added **08:00 WIB BIOS RTC Auto-Wake** entry and **21:35 WIB Safe Auto-Shutdown** entry to the cron schedule, completing the full power cycle loop.
- **README.md**: Updated architecture docs to reflect all v1.2.0 features including Polling Guard section, updated cron schedule table, and revised WhatsApp outreach specifications.

## [1.1.0] - 2026-09-10

### Security & Reliability Hardening (24/7 Architecture)

- **P0 (Credential Protection)**: Updated `.gitignore` to strictly exclude `tokens.json`, `client_secret.json`, and `.env` files from version control to prevent credential leakage.
- **P0 (Error Handling)**: Updated `process.on('uncaughtException')` in [telegram.ts](file:///d:/Coding/pjtech-autonomous/src/telegram.ts) to log errors with `console.error` and fail-fast via `process.exit(1)` instead of hanging or silently ignoring exceptions.
- **P0 (Process Hang Prevention)**: Added a 300,000 ms (5-minute) timeout to `exec()` and `spawn()` calls in [sales-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/sales-orchestrator.ts) and [kliper-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/kliper-orchestrator.ts) to avoid indefinite zombie processes.
- **P1 (DB Connection Pool Leak)**: Added `await prisma.$disconnect()` in `finally` blocks across CLI entrypoints (`one-sales-man`) to ensure database client connections are properly released.
- **P1 (DB Resilience)**: Configured `connectionTimeoutMillis: 5000` on `pg.Pool` instances in `run_pipeline.ts` to fail fast during database connectivity issues.
