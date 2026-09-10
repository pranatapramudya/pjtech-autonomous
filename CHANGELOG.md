# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
