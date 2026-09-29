# pjtech-autonomous — AI Agent Context

## Apa ini?
Ekosistem autonomous 24/7 milik Pranata Pramudya (PJTech). Bukan web app — ini **orchestrator + Telegram Bot Command Center** yang berjalan terus-menerus di background Windows.

## Arsitektur Sistem

```
bot.ps1                          ← Launcher utama (jalankan ini untuk start semua)
  ├── kasir-umkm/ (port 3000)    ← Next.js SaaS POS (sibling repo)
  ├── cloudflared               ← Tunnel HTTPS publik
  └── video-engine/src/telegram.ts  ← Telegram Bot + Scheduler (PROSES UTAMA)
        ├── autonomous-scheduler.ts  ← Semua cron jobs (node-cron)
        ├── sales-orchestrator.ts    ← Bridge ke one-sales-man/ (spawn subprocess)
        ├── kliper-orchestrator.ts   ← Bridge ke kliper-autonomous/
        └── business-orchestrator.ts ← CS ticket system
```

## Sibling Repos (di D:\Coding\)
| Repo | Fungsi |
|------|--------|
| `one-sales-man/` | Google Maps scraper + Email outreach via Resend API |
| `kliper-autonomous/` | Video affiliate pipeline |
| `kasir-umkm/` | SaaS POS (Next.js, Prisma, Neon, Clerk) |

## Jadwal Cron Harian (autonomous-scheduler.ts)
- `08:30` — Auto-Scrape Google Maps Nasional (50 prospek/hari)
- `09:00` — Email Cold Outreach (Resend API, 50 email/hari)
- `09:00` — Auto-refresh YouTube OAuth token
- `10:00` — Email Follow-up hari ke-3 & ke-7
- `12:00` — Produksi video marketing Slot 1 (E2E Demo) → YouTube Shorts
- `18:30` — Produksi video marketing Slot 2 (Motion Story) → YouTube Shorts
- `21:00` — AI Analytics Flywheel (evaluasi konten)
- `21:30` — Nightly Executive Report ke Telegram

## Telegram Config
- Bot token: `TELEGRAM_BOT_TOKEN` di `.env`
- Target notifikasi: **SATU grup** → `TELEGRAM_GROUP_ID=-5419749099`
- `TELEGRAM_ADMIN_CHAT_ID` → **dinonaktifkan** (pakai # di .env)
- Semua notif Sales, Marketing, CS → ke grup yang sama

## Stack
- Runtime: Node.js + `tsx` (TypeScript direct run)
- Scheduler: `node-cron`
- Email: Resend API (limit 3k/bulan gratis)
- Video: Remotion + TTS Orus + Deepgram
- DB: Neon PostgreSQL via Prisma (di one-sales-man)
- Scraper: Playwright (Google Maps)
- Upload: YouTube Data API v3

## Rules Penting untuk Agent
1. **WA Daemon DINONAKTIFKAN** — sistem beralih ke Email Outreach. Jangan aktifkan kembali `npx tsx src/whatsapp/daemon.ts` di `bot.ps1`
2. **Single instance** — `bot.ps1` sudah ada single-instance guard. Jangan spawn `telegram.ts` lebih dari sekali
3. **BIOS alarm 08:00** — PC hidup otomatis jam 08:00. Kalau ada tugas terlewat, gunakan: `cd video-engine && npx tsx src/catchup-today.ts`
4. **Counter sent/failed** — parse dari baris `Sent: N` / `Failed: N` di SUMMARY output subprocess, bukan dari emoji (emoji garbled di Windows stdout)
5. **Supervisor di boot.log** — jika Telegram Bot crash, `bot.ps1` restart otomatis via VBS di Startup folder

## File Penting
| File | Fungsi |
|------|--------|
| `bot.ps1` | Launcher utama — edit ini untuk ubah startup behavior |
| `video-engine/src/telegram.ts` | Entry point bot Telegram |
| `video-engine/src/pipeline/autonomous-scheduler.ts` | Semua cron jobs |
| `video-engine/src/sales-orchestrator.ts` | Bridge subprocess ke one-sales-man |
| `video-engine/src/catchup-today.ts` | Manual catch-up script (scrape + outreach + followup) |
| `.env` | API keys (Telegram, Resend, YouTube, Gemini) |
| `boot.log` | Log supervisor restart Telegram bot |
| `whatsapp-daemon.log` | Log WA daemon (tidak aktif lagi) |

## Cara Jalankan
```powershell
# Start semua (dari root repo)
.\bot.ps1

# Manual catch-up jika PC baru nyala setelah 08:30
cd video-engine
npx tsx src/catchup-today.ts

# TypeScript check
cd video-engine
npx tsc --noEmit
```
