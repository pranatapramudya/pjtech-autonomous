import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is not set in .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generationConfig = {
    temperature: 0.8,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
};

const B2B_PROMPT = `
Anda adalah Master SaaS Copywriter & Direct-Response Video Producer untuk "PJTECH KASIR UMKM".
Tugas Anda adalah membuat script konten video pendek (TikTok/Reels/Shorts 35-45s) yang HIGH-CONVERTING untuk pemilik UMKM (Retail, F&B, Jasa, Rental).

CORE VALUE & PENAWARAN (OFFER):
- Tagline: "Satu Aplikasi Kasir untuk Semua Usaha: Cuma Rp 2.700 per Hari!"
- Penawaran: Rp 990.000 / Tahun (All-In Tanpa Biaya Tersembunyi, Bebas Tambah Karyawan/Perangkat).
- Price Anchoring: Bandingkan dengan kasir kompetitor (Rp 3-4,8 jt/thn). PJTech cuma seharga parkir motor atau es teh per hari!

STRUKTUR P-A-S-O-C:
1. Problem/Hook: Hentikan scroll dengan hook provokatif (nota manual, selisih kasir, atau bayar software kasir jutaan).
2. Agitate: Bahas kerugian dan pusingnya kebocoran kasir atau software mahal yang dibatasi fiturnya.
3. Solution: PJTech Kasir Cloud dari smartphone/tablet/laptop, barcode scanner, struk thermal, laporan otomatis.
4. Offer: Rp 990.000 untuk 1 tahun penuh (~Rp 2.700/hari).
5. CTA: Coba gratis atau chat WhatsApp di link bio www.pjtechumkm.com!

ATURAN OUTPUT:
Kembalikan respon dalam format JSON murni dengan struktur berikut:
{
  "scriptConfig": [
    {
      "displayText": "kalimat pendek (maksimal 10-15 kata per scene)",
      "highlightWords": ["kata1", "kata2"],
      "emoji": "🔥",
      "showAppDemo": true
    }
  ],
  "videoMetadata": {
    "title": "Judul video yang clickbait, huruf kapital semua, provokatif",
    "caption": "Caption video untuk di TikTok/Reels yang memicu komentar dan klik bio",
    "hashtags": ["#KasirUMKM", "#BisnisLancar", "#PJTECH", "#AplikasiKasir"]
  }
}

Buat bagian "scriptConfig" minimal 7 scene dan maksimal 9 scene.
Pastikan bahasa energetik, lugas, santai tapi profesional.
JANGAN merubah format JSON ini.
`;

async function generateScript() {
    console.log("🤖 Memulai Agent Mesin Konten B2B...");
    try {
        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        console.log("📝 Generating script menggunakan Gemini...");
        const result = await chatSession.sendMessage(B2B_PROMPT);
        const responseText = result.response.text();
        
        let jsonResponse;
        try {
            // Bersihkan tag markdown (```json dan ```) yang sering disisipkan AI
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            jsonResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("❌ Gagal mem-parsing JSON dari Gemini.", responseText);
            process.exit(1);
        }

        console.log("✅ Script berhasil di-generate!");
        
        // Simpan script config ke folder video-engine
        const scriptPath = path.join(__dirname, '..', 'video-engine', 'public', 'script_config.json');
        await fs.writeFile(scriptPath, JSON.stringify(jsonResponse.scriptConfig || jsonResponse, null, 2), "utf8");
        
        // Simpan metadata ke folder video-engine
        if (jsonResponse.videoMetadata) {
            const metadataPath = path.join(__dirname, '..', 'video-engine', 'public', 'video_metadata.json');
            await fs.writeFile(metadataPath, JSON.stringify(jsonResponse.videoMetadata, null, 2), "utf8");
            console.log(`💾 File video_metadata.json berhasil di-update di: ${metadataPath}`);
        }
        
        console.log(`💾 File script_config.json berhasil di-update di: ${scriptPath}`);
        console.log("🎉 Silakan jalankan video engine untuk melihat hasilnya!");

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat memanggil Gemini API:", error);
    }
}

generateScript();
