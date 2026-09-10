# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - 2026-09-10

### Security & Reliability Hardening (24/7 Architecture)

- **P0 (Credential Protection)**: Updated `.gitignore` to strictly exclude `tokens.json`, `client_secret.json`, and `.env` files from version control to prevent credential leakage.
- **P0 (Error Handling)**: Updated `process.on('uncaughtException')` in [telegram.ts](file:///d:/Coding/pjtech-autonomous/src/telegram.ts) to log errors with `console.error` and fail-fast via `process.exit(1)` instead of hanging or silently ignoring exceptions.
- **P0 (Process Hang Prevention)**: Added a 300,000 ms (5-minute) timeout to `exec()` and `spawn()` calls in [sales-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/sales-orchestrator.ts) and [kliper-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/src/orchestrator/kliper-orchestrator.ts) to avoid indefinite zombie processes.
- **P1 (DB Connection Pool Leak)**: Added `await prisma.$disconnect()` in `finally` blocks across CLI entrypoints (`one-sales-man`) to ensure database client connections are properly released.
- **P1 (DB Resilience)**: Configured `connectionTimeoutMillis: 5000` on `pg.Pool` instances in `run_pipeline.ts` to fail fast during database connectivity issues.
