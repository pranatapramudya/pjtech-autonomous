# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2026-09-10

### Added
- **Autonomous Executive Board (AI CEO & Chief of Staff)**:
  - Integrated AI Chief of Staff persona into Telegram Command Center for high-level business strategy, operational complaint analysis, and technical action plans.
  - Zero-Token-Waste Sliding Window Memory: keeps LLM token consumption predictable and lean by retaining only the last 5 conversational turns (max 10 messages).
  - Natural language fallthrough routing in Telegram: automatically detects conversational text and routes it to AI CEO.
- **Realtime Tech Radar (Ultra Token-Efficient)**:
  - Real-time ingestion of top 3-5 tech/AI headlines from the public Hacker News Firebase API without heavy browser scraping overhead.
  - High-density Gemini Flash summarization (<150 tokens) focusing on innovation and practical monetization opportunities.
  - Interactive `/techradar` command and inline keyboard button in Telegram cockpit.
- **Self-Healing SRE Watchdog**:
  - Resilient task wrapper (`withWatchdog`) in `video-engine/src/pipeline/watchdog.ts` protecting critical pipelines (Remotion render, Playwright scraper, WhatsApp outreach).
  - Token-efficient diagnostic logging: extracts only the last 50 lines of stderr upon failure.
  - Automatic Gemini Flash RCA diagnosis and 1x adaptive retry with Telegram alerting (`[AUTO-HEALED ✅]` / `[ESCALATION NEEDED 🚨]`).

### Fixed & Improved
- **14-Day Free Trial Outreach**: Updated Kasir UMKM cold outreach message templates to offer a 14-day free trial (upgraded from 7 days) to maximize conversion.
- **WhatsApp Anti-Ban Protections**: Locked outreach scheduler to 14:00 WIB with max 5-prospect batches and random 30-60s humanized jitter delays.
- **Telegram Executive Suite UI**: Restructured main menu keyboard with AI CEO and Tech Radar as top priority rows, with updated `/start` welcome header.

## [1.1.0] - 2026-09-10

### Security & Reliability Hardening (24/7 Architecture)

- **P0 (Credential Protection)**: Updated `.gitignore` to strictly exclude `tokens.json`, `client_secret.json`, and `.env` files from version control to prevent credential leakage.
- **P0 (Error Handling)**: Updated `process.on('uncaughtException')` in [telegram.ts](file:///d:/Coding/pjtech-autonomous/src/telegram.ts) to log errors with `console.error` and fail-fast via `process.exit(1)` instead of hanging or silently ignoring exceptions.
- **P0 (Process Hang Prevention)**: Added a 300,000 ms (5-minute) timeout to `exec()` and `spawn()` calls in [sales-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/sales-orchestrator.ts) and [kliper-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/kliper-orchestrator.ts) to avoid indefinite zombie processes.
- **P1 (DB Connection Pool Leak)**: Added `await prisma.$disconnect()` in `finally` blocks across CLI entrypoints (`one-sales-man`) to ensure database client connections are properly released.
- **P1 (DB Resilience)**: Configured `connectionTimeoutMillis: 5000` on `pg.Pool` instances in `run_pipeline.ts` to fail fast during database connectivity issues.
