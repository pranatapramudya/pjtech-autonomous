# 🏗️ Arsitektur Sistem: PJTech Autonomous & Sibling Orchestrator

Dokumen ini menjelaskan arsitektur teknis menyeluruh dari ekosistem **PJTech Autonomous Solopreneur**, termasuk pola integrasi **Sibling Orchestrator** yang menghubungkan modul pemasaran video (`pjtech-autonomous`) dengan modul jemput bola sales B2B (`one-sales-man`).

---

## 🧭 Gambaran Umum Arsitektur

Sistem ini didesain menggunakan prinsip **Modular Multi-Repo (Sibling Orchestrator)**. Setiap proyek mandiri berada di foldernya masing-masing di dalam direktori `D:\Coding\`, menjaga dependensi, versi pustaka, dan konfigurasi runtime tetap bersih dan terisolasi tanpa perlu disatukan menjadi satu monolithic repo yang rumit.

```mermaid
graph TD
    %% User & Interfaces
    User([📱 Pengguna / Admin]) <-->|Chat & Inline Buttons| TeleBot[Telegram Bot Controller<br/>telegram.ts]

    %% Main Telegram Hub
    subgraph PJTECH_AUTONOMOUS ["📁 D:/Coding/pjtech-autonomous (Command Center & Marketing)"]
        TeleBot --> Orchestrator[sales-orchestrator.ts<br/>Sibling Bridge Engine]
        TeleBot --> VideoPipeline[run_pipeline.ts<br/>Remotion Video Generator]

        subgraph VideoEngine ["Video Production Engine"]
            VideoPipeline --> Gemini[Google Gemini 3.8 Flash<br/>Scriptwriting & Directing]
            VideoPipeline --> TTS[Gemini TTS Orus<br/>Emotional Voiceover]
            VideoPipeline --> Deepgram[Deepgram Nova-2<br/>Word-Level Timestamps]
            VideoPipeline --> PlaywrightE2E[Playwright Stealth<br/>Mobile App Recording]
            VideoPipeline --> Remotion[Remotion v4<br/>3D Claymorphic & SFX Renderer]
        end
    end

    %% Sibling Project: one-sales-man
    subgraph ONE_SALES_MAN ["📁 D:/Coding/one-sales-man (Sales B2B Auto-Pilot)"]
        Orchestrator -->|exec npx tsx| CLI_Status[src/pipeline/cli-status.ts]
        Orchestrator -->|spawn npx tsx| CLI_Scrape[src/pipeline/cli-scrape.ts]
        Orchestrator -->|spawn npx tsx| CLI_Outreach[src/pipeline/cli-outreach.ts]

        CLI_Status --> Prisma[(Neon PostgreSQL<br/>Prospects DB)]
        CLI_Scrape --> GMapsScraper[Playwright Headless<br/>Google Maps Scraper]
        GMapsScraper --> Prisma

        CLI_Outreach --> WAClient[WhatsApp Web JS<br/>Anti-Ban Delay Sender]
        WAClient --> Prisma
        WAClient <--> GroqAI[Groq Llama 3 70B<br/>AI Sales Representative]
    end

    %% Sibling Project: kasir-umkm
    subgraph KASIR_UMKM ["📁 D:/Coding/kasir-umkm (SaaS Product: pjtechumkm.com)"]
        PlaywrightE2E -->|Capture UI on :3000| NextServer[Next.js Application Server]
    end

    %% High-Ticket Agency
    Prisma -.->|Hot Lead Handoff| Agency["🏢 pranajayatech.online<br/>(High-Ticket Closing)"]
```

---

## ⚙️ Cara Kerja Sibling Orchestrator

Orchestrator diimplementasikan di [sales-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/video-engine/src/sales-orchestrator.ts) menggunakan modul bawaan Node.js `child_process` (`spawn` dan `exec`). 

### 1. Deteksi Jalur Relatif (*Path Resolution*)
```typescript
import path from 'path';
// Dari pjtech-autonomous/video-engine/src naik 3 level ke D:\Coding\one-sales-man
export const ONE_SALES_MAN_DIR = path.resolve(__dirname, '../../../one-sales-man');
```
Dengan cara ini:
- `pjtech-autonomous` tidak perlu menginstal ulang dependensi seperti `whatsapp-web.js` atau `@prisma/client`.
- Script dieksekusi dengan `cwd: ONE_SALES_MAN_DIR`, memastikan file konfigurasi `.env`, `.wwebjs_auth`, dan modul Prisma milik `one-sales-man` terbaca sempurna.

### 2. Tiga Endpoint CLI di `one-sales-man`

| File CLI | Fungsi | Mekanisme Eksekusi |
| :--- | :--- | :--- |
| `src/pipeline/cli-status.ts` | Mengambil agregasi jumlah prospek (`PENDING`, `CONTACTED`, `HOT_LEAD`, `CLOSED`) dan 5 Hot Leads teratas. | `exec` (Mengembalikan output JSON bersih ke Telegram). |
| `src/pipeline/cli-scrape.ts` | Menjalankan Playwright Google Maps dengan parameter `--keyword`, `--limit`, dan `--headless=true`. | `spawn` (Streaming progress langsung ke chat Telegram). |
| `src/pipeline/cli-outreach.ts` | Mengirimkan batch sapaan awal WhatsApp (default 5 pesan) menggunakan delay acak manusiawi (5-15s). | `spawn` (Streaming status pengiriman pesan ke Telegram). |

### 3. Mekanisme Keamanan Anti-Banned WhatsApp
- **Strict Batch Limit**: Pengiriman pesan baru dibatasi maksimal 5 kontak per panggilan batch via Telegram.
- **Random Human Delay**: Jeda acak 5.000 ms hingga 15.000 ms di antara setiap pesan keluar.
- **AI Human Handoff**: Saat calon klien di WhatsApp menunjukkan minat kuat (bertanya harga detail, meminta meeting, atau ingin memesan), AI Groq otomatis mengunci status menjadi `HOT_LEAD`, mengirimkan respons penyerahan teknis ke Mas Pranata, dan datanya langsung siap di-follow up via Telegram Cockpit.

---

## 🎬 Arsitektur Video Engine (Remotion + Multi-Layer SFX)

Video Engine terbagi menjadi 2 format spesialis:

```mermaid
flowchart TD
    Prompt[Gemini AI Script & Visual Generator] --> AudioGen[Gemini Orus TTS Voiceover]
    AudioGen --> Normalize[FFmpeg Audio Normalization]
    Normalize --> Deepgram[Deepgram Word Timestamping]

    Deepgram --> Splitter{Format Terpilih?}
    
    Splitter -->|Format 1| E2E[VideoComposition.tsx<br/>E2E App Demo]
    Splitter -->|Format 2| Motion[MotionStoryComposition.tsx<br/>2D/3D Claymorphic Explainer]

    E2E --> E2E_Visual[Pure Bright B-Roll + Floating iPhone Mockup + Snappy SFX]
    Motion --> Motion_Visual[220px 3D Claymorphic Cards + Kinetic Subtitle + Multi-Layer SFX]

    E2E_Visual --> Render[Remotion Bundler & FFmpeg Renderer]
    Motion_Visual --> Render
    Render --> MP4[output_ready.mp4 1080x1920 30fps]
```

### Format 1: E2E App Demo (`VideoComposition.tsx`)
- **B-Roll Asli & Terang**: Video background Pexels ditampilkan dengan kecerahan 100% alami tanpa overlay gelap, menciptakan nuansa bisnis yang segar.
- **Keterbacaan Visual**: Kartu UI dan mockup smartphone menggunakan drop shadow tegas (`drop-shadow(0 20px 40px rgba(0,0,0,0.35))`) untuk mempertahankan kontras di atas video background terang.
- **Sound Design Multi-Layer**: Transisi slide (`whoosh.wav`), kemunculan kartu fitur (`pop_snappy.wav`), interaksi demo aplikasi (`ding.wav`), dan penutup promo (`cash.wav`).

### Format 2: Motion Story (`MotionStoryComposition.tsx`)
- **3D Claymorphism (220px)**: Kartu visual berukuran jumbo 220px dengan bevel lembut, bayangan 3 lapis, dan animasi pegas halus (*spring physics*).
- **Karaoke Subtitle Presisi**: Subtitle kata-per-kata yang tersinkronisasi murni dengan audio ternormalisasi tanpa jeda (zero frame drift), dengan kata aktif berwarna kuning menyala berlatar kapsul biru modern.
- **Bypass Server**: Format ini tidak memerlukan server web kasir aktif, sehingga dapat dirender kapan saja secara instan.

---

## 🎛️ Struktur Menu Telegram Cockpit

Telegram Bot menggunakan sistem menu bertingkat yang interaktif:

```
[ MENU UTAMA (/start) ]
  ├── 🎬 Divisi Marketing (Video Engine)
  │     ├── 📱 E2E App Demo (Kasir UMKM) ➔ Pilih Sektor (Retail / F&B / Jasa / Rental / Auto)
  │     └── ✨ Motion Story (Animasi 2D) ➔ Pilih Sektor (Retail / F&B / Jasa / Rental / Auto)
  ├── 🎯 Divisi Sales (One Sales Man)
  │     ├── 🚀 Eksekusi Kampanye Hari Ini (Rotasi Harian Semi-Autonomous)
  │     ├── 🔍 Scrape Google Maps ➔ (Preset: Klinik, Kafe, Gym, Barbershop, atau Kustom)
  │     ├── ⚡ Kirim Batch WA (5 Kontak PENDING)
  │     ├── 🔥 Lihat Hot Leads (Daftar prospek hangat + link langsung wa.me)
  │     └── 🔄 Refresh Status Pipeline
  ├── ✂️ Divisi Kliper (Video Shorts)
  │     ├── 🔗 Masukkan Link YouTube (Auto-cut & subtitling)
  │     ├── 📦 Kirim Ulang Hasil Terakhir (/resend)
  │     └── 🤖 Auto-Detect YouTube Link (Kirim link langsung di chat)
  ├── 🤝 Divisi Admin CS (Customer Success)
  │     ├── 🤖 Auto-Reply AI Triage (Groq Llama / Qwen)
  │     ├── 🚨 Tiket Butuh Teknisi (Laporan Bug / Klien Siap Bayar)
  │     └── 💬 Penyelesaian Tiket (/resolve <id>)
  ├── 💰 Divisi Finance (Cashflow & Accounting)
  │     ├── ➕ Catat Pemasukan Langganan (/in <amount> <ket>)
  │     ├── ➖ Catat Pengeluaran API/Server (/out <amount> <ket>)
  │     └── 📈 Laporan Laba Bersih (Net Profit & Margin %)
  └── 📊 Status Sistem & Server
        ├── Status Server Kasir (Port 3000)
        ├── Status Engine Video (Standby / Processing)
        └── Status Pipeline Sales (Total, Pending, Contacted, Hot Leads)
```

---

## ✂️ Sibling Project 2: Kliper Autonomous (`D:\Coding\kliper-autonomous`)

Kliper terintegrasi via [kliper-orchestrator.ts](file:///d:/Coding/pjtech-autonomous/video-engine/src/kliper-orchestrator.ts) menggunakan `child_process.spawn`:
- **Input**: Link video YouTube yang dikirimkan melalui chat atau tombol menu.
- **Pipeline**: Menjalankan `npx tsx run_pipeline.ts "<url>"` di dalam direktori `kliper-autonomous/video-engine`.
- **Fitur /resend**: Mengambil langsung file-file `.mp4` dan `captions_all_clips.txt` yang sudah dirender di `public/output/` untuk dikirimkan kembali secara instan tanpa perlu re-download atau render ulang.
- **Ekstraksi Hasil**: Menangkap klip vertikal HD 9:16 dari `public/output/` beserta file copywriting rekomendasi, lalu mengirimkannya langsung ke Telegram secara streaming.

---

## 🛡️ Lapisan Ketahanan Sistem (*System Resilience & Anti-Stall*)

### 1. Zero-Crash Playwright Path Resolution
Playwright menggunakan penyimpanan browser global di `%LOCALAPPDATA%\ms-playwright`. Variabel `PLAYWRIGHT_BROWSERS_PATH` dibersihkan dari environment untuk menghindari penunjukan ke path direktori yang keliru (`./0/`). Pemanggilan CLI di Windows (`cmd.exe`) selalu menggunakan sanitasi tanda kutip (`"--keyword=..."`) untuk mengisolasi karakter khusus seperti ampersand (`&`).

### 2. Multi-Tenant Onboarding Bypass & DB Upsert
Untuk menjamin video demo E2E (`run_pipeline.ts`) berjalan mulus tanpa terhenti di layar `/onboarding`:
- **Neon DB Profile Sync**: Sinkronisasi tenant profile dieksekusi melalui pola PostgreSQL `UPSERT` (`INSERT ... ON CONFLICT ("userId") DO UPDATE ...`), memastikan ID akun uji coba bot selalu memiliki tenant aktif 365 hari.
- **Dynamic Onboarding Handler**: Jika aplikasi kasir mengalihkan navigasi ke `/onboarding`, Playwright secara otomatis mendeteksi form, memasukkan nama toko demo, memilih kartu kategori yang sesuai (Retail / F&B / Jasa / Rental), dan melakukan submit otomatis.

### 3. Smart Category Mapping & Funnel Outreach
Sistem cold outreach memetakan 4 pilar bisnis secara cerdas (OR query multi-keyword) agar data hasil *scraping* Google Maps tidak terlewatkan dan pesan WhatsApp yang terkirim memiliki *hook* spesifik yang relevan dengan jenis usaha calon klien.
