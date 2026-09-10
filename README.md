# 🤖 PJTech Autonomous Solopreneur Ecosystem

> **Pusat Komando Bisnis Otonom 24/7:** Ekosistem terintegrasi yang menggabungkan **Pabrik Konten Video Otomatis** (Remotion + Gemini AI + YouTube Uploader), **Mesin Sales Outbound B2B** (Playwright + WhatsApp Business + Groq Llama 3), dan **Mesin Klip Konten Affiliate** (Kliper Engine), seluruhnya dikendalikan dari **Satu Layar Telegram Command Center**.

---

## 🏗️ 1. Arsitektur Utama Sistem

Proyek ini dibangun di atas arsitektur **Multi-Project Sibling Orchestrator** berbasis **Node.js & TypeScript**. Komponen-komponen sistem beroperasi secara modular namun terkoordinasi di bawah satu komando:

```
D:/Coding/
├── pjtech-autonomous/                 ← [COMMAND CENTER, SCHEDULER & MARKETING ENGINE]
│   ├── bot.ps1                        ← Launcher utama Bot Telegram & Auto-check Server
│   ├── setup-windows.ps1              ← Setup Windows 24/7 (Power Plan Anti-Sleep & Startup VBS)
│   ├── generate.ps1                   ← 1-Click render video E2E standalone
│   ├── client_secret.json             ← Kredensial OAuth 2.0 Google Cloud Desktop App
│   ├── tokens.json                    ← Refresh & Access Token YouTube API (Permanen)
│   └── video-engine/                  ← Engine Video, Scheduler 24/7 & Telegram Bot
│       ├── run_pipeline.ts            ← Pipeline produksi video marketing E2E
│       ├── src/
│       │   ├── telegram.ts            ← Master Telegram Cockpit (PJTECH Mandor Bot)
│       │   ├── sales-orchestrator.ts  ← Jembatan pengendali sibling project one-sales-man
│       │   ├── kliper-orchestrator.ts ← Jembatan pengendali sibling project kliper-autonomous
│       │   ├── pipeline/
│       │   │   ├── autonomous-scheduler.ts ← 6 Rutinitas Cron Job harian (08:30 - 21:30)
│       │   │   ├── youtube-uploader.ts     ← Uploader YouTube Shorts otomatis via Google API
│       │   │   ├── analytics-loop.ts       ← AI Feedback Loop & Retrospektif Hook Gemini
│       │   │   └── nightly-reporter.ts     ← EOD Executive Briefing otomatis
│       │   ├── VideoComposition.tsx   ← Format 1: E2E App Demo (Live Navigasi Kasir)
│       │   └── MotionStoryComposition.tsx ← Format 2: 2D Claymorphic Motion Story
│       └── public/                    ← Aset video, audio TTS, subtitle timing, & SFX
│
├── one-sales-man/                     ← [DIVISI SALES: B2B COLD OUTREACH AUTO-PILOT]
│   ├── src/
│   │   ├── pipeline/
│   │   │   ├── cli-scrape.ts          ← Scraper Google Maps via Playwright Headless
│   │   │   ├── cli-outreach.ts        ← WhatsApp Blaster dengan delay anti-ban
│   │   │   ├── cli-pair.ts            ← Mode aman pairing WhatsApp Business (Tanpa kirim pesan)
│   │   │   └── cli-status.ts          ← Endpoint statistik prospek & Hot Leads
│   │   ├── whatsapp/client.ts         ← WhatsApp Web JS + Groq Llama 3 AI Negotiator
│   │   └── lib/prisma.ts              ← Prisma Client ORM
│   └── prisma/schema.prisma           ← Schema Database PostgreSQL (Neon Serverless)
│
├── kliper-autonomous/                 ← [DIVISI AFFILIATE: AUTO VIDEO CLIPPING ENGINE]
│   └── video-engine/
│       └── run_pipeline.ts            ← Ingest video, transkripsi Deepgram, kurasi hook Gemini
│
└── kasir-umkm/                        ← [PRODUK SAAS KASIR UMKM]
    └── (Next.js Application Server di Port 3000 - https://pjtechumkm.com)
```

---

## 🎛️ 2. Master Telegram Cockpit (`PJTECH Executive Suite`)

Seluruh operasi bisnis dikendalikan secara nirkabel dari smartphone melalui Telegram. Tidak perlu membuka terminal atau menyentuh kodingan:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        6 PILAR KENDALI TELEGRAM EXECUTIVE SUITE                        │
├───────────────────────────┬────────────────────────────┬───────────────────────────────┤
│ 👔 1. AI CEO & TECH RADAR │ 🎬 2. DIVISI MARKETING     │ 💼 3. DIVISI SALES            │
├───────────────────────────┼────────────────────────────┼───────────────────────────────┤
│ • Konsultasi AI CEO / RCA │ • Render E2E App Demo      │ • Scrape Google Maps          │
│ • Sliding Window Memory   │ • Render 2D Motion Story   │ • 1-Klik Kampanye Harian      │
│ • Live News Tech Radar    │ • Auto-Upload YouTube      │ • Batch Outreach WA (5)       │
│ • Peluang Monetisasi Bisnis│ • Kirim MP4 ke Chat HP    │ • Pairing WA Aman (QR)        │
│ • Natural Lang Fallthrough│ • Copywriting Siap Pakai   │ • Notifikasi Hot Leads        │
├───────────────────────────┼────────────────────────────┼───────────────────────────────┤
│ ✂️ 4. DIVISI KLIPER       │ 🤝 5. CS & FINANCE         │ 📊 6. SISTEM & SRE WATCHDOG   │
├───────────────────────────┼────────────────────────────┼───────────────────────────────┤
│ • Input Link / Video Mentah│ • Tiket Eskalasi Support  │ • Status Server Kasir (3000)  │
│ • AI Viral Hook Detection │ • Monitoring Mayar.id      │ • Telemetri Database Prospek  │
│ • Subtitle Animasi Pop-up │ • SLA Respon 5 Menit       │ • Self-Healing SRE Watchdog   │
│ • Layout Fashion/Kosmetik │ • Resolusi Tiket 1-Klik    │ • Laporan Malam Eksekutif     │
└───────────────────────────┴────────────────────────────┴───────────────────────────────┘
```

---

## 👔 3. Autonomous Executive Board (AI CEO & Chief of Staff)

Ekosistem PJTech dilengkapi dewan eksekutif berbasis AI yang bertindak sebagai Chief of Staff pribadi Mas Pranata:
* **Konsultasi & Penanganan Masalah Tingkat Tinggi**: Menerima curhat operasional, keluhan bisnis, atau instruksi strategis, lalu menghasilkan *Root Cause Analysis (RCA)* cepat dan rencana tindakan teknis yang ringkas dan terarah.
* **Zero-Token-Waste Sliding Window Memory**: Menggunakan buffer memori geser (*sliding window*) yang hanya mempertahankan **5 interaksi percakapan terakhir** (maksimal 10 pesan) yang dikirimkan ke model LLM Gemini. Riwayat lama otomatis dipangkas di RAM sehingga konsumsi token tetap minimal dan stabil.
* **Natural Language Fallthrough Routing**: Setiap pesan teks bebas non-perintah di Telegram (misalnya *"CEO nya mana?"*, *"Penjualan minggu ini turun, solusinya apa?"*) otomatis dialihkan ke AI CEO tanpa perlu mengetikkan slash command.

---

## 📡 4. Realtime Tech Radar (Ultra Token-Efficient Live Feed)

Memantau perkembangan teknologi terkini 24/7 tanpa pemborosan komputasi atau token:
* **Open Source Live Feed Ingest**: Menarik 3–5 headline berita teknologi dan AI terhangat langsung dari endpoint publik Hacker News Firebase API secara *zero-cost* dan tanpa browser scraping yang berat.
* **Gemini Flash Sharp Synthesis**: Hanya judul berita yang dikirimkan ke model **Gemini Flash** dengan prompt ultra-padat (<150 token) untuk merangkum 3 tren utama dalam bahasa Indonesia, berfokus pada inovasi teknologi dan peluang monetisasi bisnis UMKM.
* **Akses Instan Telegram**: Dapat diakses kapan saja melalui tombol `📡 Tech Radar (AI News Terkini)` di menu utama atau command `/techradar`.

---

## 💼 5. Divisi Sales: One Sales Man (B2B Auto-Pilot)

Divisi Sales dirancang untuk melakukan jemput bola calon klien B2B secara terukur dan aman dari risiko pemblokiran nomor WhatsApp:

1. **Google Maps Scraper (Playwright Headless)**:
   - Mencari prospek lokal berdasarkan kata kunci (misal: *Kafe di Bandung*, *Barbershop di Jakarta*, *Gym di Surabaya*).
   - Menarik nama bisnis, nomor telepon WhatsApp, rating, dan alamat.
2. **Database PostgreSQL (Neon Serverless)**:
   - Prospek disimpan secara terpusat dengan Prisma ORM.
   - Dilengkapi deduplikasi otomatis agar satu nomor tidak pernah dihubungi lebih dari sekali.
3. **Outreach WhatsApp Humanis & Anti-Ban**:
   - Mengirim pesan pembuka *Free Trial 14 Hari* yang ramah per batch (strict **5 kontak/sesi**).
   - Jeda acak (*random jitter* **30–60 detik**) antar pesan untuk meniru ritme mengetik manusia dan menghindari deteksi bot WhatsApp.
4. **AI Negotiator (Groq Llama 3 70B)**:
   - Merespons balasan pesan prospek secara otomatis dan kontekstual.
   - Mampu mendiagnosa masalah bisnis prospek dan menawarkan:
     - **SaaS Kasir UMKM** ([pjtechumkm.com](https://pjtechumkm.com)) untuk F&B, retail, salon, rental.
     - **Custom Software / Web Development** ([pranajayatech.online](https://www.pranajayatech.online/)) untuk kebutuhan antrean klinik, sistem barcode kustom, dll.
5. **Human Handoff & Hot Leads**:
   - Saat prospek menunjukkan minat beli, meminta harga diskon, atau mengajak meeting, AI langsung menghentikan balasan otomatis dan mengaktifkan status `HOT_LEAD`.
   - Bot Telegram mengirimkan alert instan ke smartphone Mas Pranata beserta link langsung `https://wa.me/...` untuk penutupan penjualan secara langsung.

---

## 🎬 6. Divisi Marketing: Pabrik Konten & Multi-Platform Delivery

Memproduksi video berstandar agensi periklanan untuk mengonversi prospek di berbagai kanal sosial media:

### Format Video yang Diproduksi
* **Format 1: E2E App Demo (Slot Siang 12:00 WIB)**
  - Rekaman navigasi nyata aplikasi kasir menggunakan Playwright browser emulator.
  - Tampilan smartphone 3D mengambang (iPhone 14 Pro Max) dengan B-roll terang dan dynamic sound effects (`whoosh.wav`, `ding.wav`, `cash.wav`).
  - Fokus: *Proof-of-Work* dan pembuktian fitur siap pakai.
* **Format 2: 2D Motion Story (Slot Malam 18:30 WIB)**
  - Kartu visual 2D Claymorphic 220px dengan animasi pegas elastis (*spring physics*).
  - Subtitle karaoke dinamis berpresisi tinggi (0 drift) yang diselaraskan dengan TTS Orus.
  - Fokus: *Viral Storytelling* yang mengangkat masalah operasional UMKM (bon hilang, antrean kacau, kasbon selisih).

### Alur Eksekusi Otomatis
1. **Remotion Engine** merender video vertikal 9:16 resolusi tinggi (`output_ready.mp4`).
2. **YouTube Shorts Uploader** mengunggah video ke YouTube channel *Pranajaya Tech* via Google OAuth 2.0 API tanpa intervensi manual.
3. **Auto-Send File MP4 ke Telegram**: File video matang dikirim langsung ke chat Telegram grup Mas Pranata (`bot.sendVideo` dengan streaming playback).
4. **Materi Copywriting Siap Copy-Paste**: Bot melampirkan teks monospaced berisi:
   - 📌 Judul Konten
   - 📝 Caption & Deskripsi
   - 🏷️ Hashtags Relevan
   - 🌐 Link Produk / Bio
   - *Mas Pranata cukup tap-and-copy dari HP dan langsung upload ke TikTok, Instagram Reels, dan Facebook!*

---

## 💰 7. Divisi Affiliate: Kliper Autonomous Engine

Dirancang khusus untuk kakak Mas Pranata agar bisa memproduksi klip video affiliasi TikTok/Shopee tanpa perlu memahami koding atau software editing:

```
[Kakak kirim link YouTube / video mentah ke Telegram]
                          ↓
      [yt-dlp mengunduh video & ekstrak audio]
                          ↓
  [Deepgram AI mentranskripsi teks kata-per-kata]
                          ↓
 [Gemini AI menganalisis & memilih bagian paling viral]
                          ↓
[Remotion Engine memotong & menambahkan subtitle pop-up]
                          ↓
   [Bot Telegram mengirimkan video MP4 siap posting +
            copywriting & hashtag ke HP Kakak]
```

* **Smart Layout Adaptation**:
  - Mode **Kosmetik / Handheld**: Subtitle otomatis ditempatkan di bagian bawah agar fisik produk yang dipegang tangan tidak tertutup teks.
  - Mode **Fashion / Outfit**: Subtitle dipusatkan di area tengah dada dengan efek pop-up dinamis.

---

## 🛡️ 8. Self-Healing SRE Watchdog

Untuk menjamin keandalan sistem autonomous yang beroperasi 24/7 tanpa pengawasan manual, disematkan arsitektur **Self-Healing SRE Watchdog** (`video-engine/src/pipeline/watchdog.ts`):
* **Resilient Task Wrapper (`withWatchdog`)**: Membungkus tugas-tugas kritis berisiko tinggi (Remotion video rendering, Playwright browser scraping, dan koneksi WhatsApp socket).
* **Token-Efficient Diagnostic Capture**: Ketika terjadi kegagalan atau exception, sistem memotong dan mengambil hanya **50 baris terakhir** dari log stderr/stdout (tail-50) untuk meminimalkan token yang dikonsumsi LLM.
* **Instant Gemini Flash RCA & Adaptive 1x Retry**: Log 50 baris tersebut dianalisis oleh Gemini Flash untuk mengidentifikasi akar masalah (OOM, timeout jaringan, file lock, bentrok port) dan memberikan saran perbaikan. Sistem kemudian mencoba 1 kali *retry* adaptif (maksimal 1x retry guna mencegah *infinite loop* pemborosan token).
* **Notifikasi SRE ke Telegram**:
  - `[AUTO-HEALED ✅]`: Dikirim jika percobaan kedua berhasil pulih secara otomatis.
  - `[ESCALATION NEEDED 🚨]`: Dikirim bersama ringkasan diagnosa RCA jika butuh penanganan fisik oleh teknisi.

---

## ⚡ 9. Resilient Polling Guard (Anti 409 Conflict)

Bot Telegram `node-telegram-bot-api` menggunakan model *long-polling* yang rentan terhadap konflik **409 Conflict** apabila lebih dari satu instansi node.js memegang token polling secara bersamaan. Arsitektur guard berikut memastikan bot selalu pulih secara mandiri:

* **Exponential Backoff (3s → 6s → 12s → 24s → 48s)**: Setiap attempt reconnect menggandakan interval tunggu, memberi ruang bagi instansi lama untuk mati dan melepaskan polling slot sebelum instansi baru merebut slot tersebut.
* **Max 5 Attempts Cap**: Setelah 5 percobaan gagal, guard berhenti mencoba (tidak spam loop) dan menunggu kondisi stabil. Polling akan pulih sendiri ketika instansi lain benar-benar mati.
* **Stop-before-Restart**: Guard memanggil `bot.stopPolling()` secara eksplisit sebelum `startPolling({ restart: true })` untuk memastikan koneksi lama benar-benar diputus terlebih dahulu.
* **Crash-Proof Global Process Handlers**:
  - `uncaughtException` → log error detail **tanpa** `process.exit(1)` sehingga bot tidak mati permanen.
  - `unhandledRejection` → log promise + reason **tanpa** exit, menjaga event loop tetap hidup.
* **Single-Instance Guard di `bot.ps1`**: Sebelum memulai bot, launcher memeriksa semua proses `node.exe` yang mengandung `telegram.ts` dalam CommandLine-nya dan mematikan duplikat dengan `Stop-Process -Force`.

---

## ⚙️ 10. Infrastruktur & Automasi 24/7

### Jadwal Cron Job Otomatis (`Asia/Jakarta`)
Sistem autonomous scheduler bekerja setiap hari tanpa henti mengikuti matriks jadwal berikut:

| Jam (WIB) | Divisi | Nama Operasi | Keterangan |
| :---: | :---: | :--- | :--- |
| **08:00** | 🖥️ System | **BIOS RTC Auto-Wake & Startup Check** | PC menyala otomatis via BIOS RTC Alarm. Windows auto-logon, `bot.ps1` dijalankan dari folder Startup: kill zombie proses lama → cek koneksi Telegram API → aktifkan bot → notifikasi online. |
| **08:30** | 💼 Sales | **Auto-Scrape Google Maps** | Mengumpulkan 10 prospek baru sesuai matriks sektor harian (Senin: Retail, Selasa: Kafe, Rabu: Gym/Salon, Kamis: Rental, Jumat: Kuliner, Sabtu: Bengkel). |
| **12:00** | 🎬 Marketing | **Slot 1: E2E App Demo** | Render video demo aplikasi ➔ Upload YouTube Shorts ➔ Kirim MP4 & copywriting ke Telegram. |
| **14:00** | 💼 Sales | **Batch Outreach WA (Anti-Ban)** | Menyapa **5 prospek** berstatus `PENDING` dengan pesan *Free Trial 14 Hari* dan jeda acak **30–60 detik** antar pesan untuk menghindari deteksi WhatsApp. |
| **18:30** | 🎬 Marketing | **Slot 2: 2D Motion Story** | Render video 2D motion explainer ➔ Upload YouTube Shorts ➔ Kirim MP4 & copywriting ke Telegram. |
| **21:00** | 🧠 Analytics | **AI Analytics Flywheel** | Gemini AI menganalisis performa YouTube harian dan merumuskan *winning hook formula* baru ke knowledge base. |
| **21:30** | 📋 Executive | **Nightly Executive Briefing** | Bot mengirimkan laporan ringkasan malam ke Telegram (jumlah prospek, status pipeline, dan video yang terbit hari ini). |
| **21:35** | 🖥️ System | **Safe Auto-Shutdown OS** | Menjalankan `shutdown /s /t 60` untuk mematikan PC dengan aman setelah semua laporan terkirim — siap untuk siklus RTC berikutnya. |

### Windows 24/7 Power Plan, Auto-Start & Auto-Logon
File script otomatisasi telah tersedia di root proyek: [setup-windows.ps1](setup-windows.ps1) dan [bot.ps1](bot.ps1).

1. **Anti-Sleep (Power Plan)**:
   - Menggunakan perintah `powercfg /change standby-timeout-ac 0` dan `hibernate-timeout-ac 0`.
   - PC **tidak akan pernah masuk mode Sleep/Hibernate** saat terhubung ke listrik AC.
   - Layar monitor tetap diizinkan mati otomatis untuk menghemat daya dan masa pakai panel layar.
2. **Auto-Start Saat Booting (`shell:startup`)**:
   - Mendaftarkan file `start-pjtech.vbs` ke direktori Windows Startup:
     `C:\Users\<User>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
   - Setiap kali PC dinyalakan atau selesai reboot, server kasir UMKM (port 3000), Bot Telegram, dan 6 jadwal cron langsung aktif otomatis di background tanpa menampilkan jendela CMD/PowerShell hitam (*silent background process*).
3. **Windows Auto-Logon (`netplwiz`) — Kunci PC Hidup Sendiri**:
   - Program di folder `Startup` Windows hanya akan dieksekusi setelah sesi pengguna masuk ke desktop.
   - Dengan menyetel `netplwiz` (menonaktifkan keharusan memasukkan sandi saat booting), ketika alarm BIOS menyalakan PC di pagi hari, Windows langsung login otomatis ke desktop.
4. **Single-Instance Guard & Network Check ([bot.ps1](bot.ps1))**:
   - **Network Readiness**: Menunggu Wi-Fi/LAN terhubung ke Telegram API sebelum bot start agar terhindar dari kegagalan koneksi awal saat cold boot.
   - **Anti-Bentrok (Error 409)**: Jika bot dijalankan manual via terminal, script otomatis membersihkan proses bot lama di background sehingga tidak terjadi perebutan token.
   - **Instant Telegram Notification**: Begitu PC selesai booting dan server kasir aktif, bot langsung mengirim notifikasi `🚀 [PJTECH AUTONOMOUS SYSTEM ONLINE]` beserta keyboard menu utama ke Telegram!

---

## ⏰ 11. Panduan Hardware: Auto Power-On PC via BIOS Motherboard

Karena sistem operasi tidak dapat menyalakan PC dari kondisi mati total (*Cold Shutdown*), kita memanfaatkan fitur perangkat keras bawaan motherboard yaitu **RTC Alarm (Real-Time Clock Power-On)**. 

Dengan menyetel fitur ini, PC Mas Pranata akan **menyala secara otomatis setiap hari pada jam 07:30 Pagi WIB** (1 jam sebelum jadwal scrape 08:30 WIB), sehingga Mas Pranata bisa tidur nyenyak dan PC hidup sendiri tanpa perlu menekan tombol fisik.

### Langkah-langkah Setting BIOS:

#### Tahap 1: Masuk ke Menu BIOS
1. Matikan PC Mas Pranata (Shut Down).
2. Nyalakan PC, dan **tekan tombol `DEL` atau `F2` secara berulang-ulang** segera setelah tombol power ditekan, sampai layar menu BIOS muncul.

#### Tahap 2: Menemukan Pengaturan RTC Alarm Sesuai Merk Motherboard

* **Motherboard ASUS:**
  1. Tekan `F7` untuk masuk ke **Advanced Mode**.
  2. Buka tab **Advanced** ➔ pilih **APM Configuration** (Advanced Power Management).
  3. Cari opsi **ErP Ready** ➔ ubah menjadi **Disabled** (wajib dinonaktifkan agar RTC alarm bisa menerima daya).
  4. Cari opsi **Power On By RTC** (atau *Resume by RTC*) ➔ ubah dari *Disabled* menjadi **Enabled**.
  5. Atur parameter waktu:
     - **RTC Alarm Date (Days)**: Pilih `Every Day` (atau angka `0` untuk setiap hari).
     - **Hour**: `07`
     - **Minute**: `30`
     - **Second**: `00`
  6. Tekan `F10` ➔ pilih **Save & Exit**.

* **Motherboard MSI:**
  1. Masuk ke **Advanced Mode** (tekan `F7`).
  2. Masuk ke menu **Settings** ➔ **Advanced** ➔ **Wake Up Event Setup**.
  3. Ubah **Wake Up Event By** menjadi **BIOS** (bukan *OS*).
  4. Cari opsi **Resume by RTC Alarm** ➔ ubah menjadi **Enabled**.
  5. Atur:
     - **Date**: `Every Day` (atau `0`)
     - **Time**: `07 : 30 : 00`
  6. Tekan `F10` ➔ pilih **Save Changes & Reboot**.

* **Motherboard GIGABYTE / AORUS:**
  1. Masuk ke **Classic Mode** / **Advanced Mode** (tekan `F2`).
  2. Buka tab **Settings** ➔ **Platform Power** (atau tab *Power*).
  3. Cari opsi **ErP** ➔ ubah menjadi **Disabled**.
  4. Cari opsi **Resume by Alarm** ➔ ubah menjadi **Enabled**.
  5. Atur:
     - **Wake up day**: `Everyday` (atau `0`)
     - **Wake up hour / minute / second**: `07` : `30` : `00`
  6. Tekan `F10` ➔ pilih **Save & Exit Setup**.

* **Motherboard ASROCK:**
  1. Masuk ke **Advanced** tab ➔ pilih **ACPI Configuration**.
  2. Cari opsi **RTC Alarm Power On** ➔ ubah menjadi **Enabled**.
  3. Atur frekuensi ke `Every Day`, jam `07`, menit `30`.
  4. Tekan `F10` untuk simpan dan keluar.

> ⚠️ **Catatan Penting Listrik:**
> - Fitur RTC Alarm membutuhkan aliran daya standby dari stopkontak ke Power Supply (PSU). Jangan mematikan saklar colokan listrik utama / stopkontak PC setelah PC di-shutdown.
> - Pastikan baterai CMOS motherboard dalam kondisi prima agar jam BIOS tidak ter-reset ke tahun lama.

---

## 🚀 12. Panduan Menjalankan Sistem

### Sekali Setup (Sudah Dijalankan)
Jalankan script konfigurasi Windows satu kali via PowerShell:
```powershell
.\setup-windows.ps1
```

### Menjalankan Manual / Debugging
Jika Anda ingin menyalakan bot command center secara manual di terminal:
```powershell
.\bot.ps1
# atau
npm run bot
```

### Memeriksa Status Log Background
Jika sistem sedang berjalan di background, seluruh aktivitas tercatat pada log:
```powershell
# Cek aktivitas Telegram Bot & Scheduler
Get-Content -Path "C:\Users\<User>\.gemini\antigravity-ide\brain\...\task-xxx.log" -Tail 50 -Wait
```

---

## 🛡️ Lisensi & Kepemilikan
Dikembangkan secara eksklusif untuk **Pranajaya Tech (PJTech Autonomous Solopreneur Ecosystem)**. Hak cipta dilindungi undang-undang.
