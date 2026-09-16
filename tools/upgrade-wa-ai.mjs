import fs from 'fs';
import path from 'path';

const ONE_SALES_MAN_DIR = path.resolve(process.cwd(), '../one-sales-man');
const CLIENT_FILE = path.join(ONE_SALES_MAN_DIR, 'src/whatsapp/client.ts');
const DAEMON_FILE = path.join(ONE_SALES_MAN_DIR, 'src/whatsapp/daemon.ts');

console.log('Target client file:', CLIENT_FILE);
console.log('Target daemon file:', DAEMON_FILE);

// ── 1. UPGRADED client.ts ───────────────────────────────────────────────────
const upgradedClientContent = `import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env dari root pjtech-autonomous & one-sales-man
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';
import prisma from '../lib/prisma';

// Initialize Groq Client
const groqApiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
const groq = new Groq({
    apiKey: groqApiKey,
});

const sessionDir = path.resolve(__dirname, '../../.wwebjs_auth');

// Global safety crash guard
process.on('uncaughtException', (err) => {
    console.error('❌ [WA CRITICAL UNCAUGHT]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ [WA CRITICAL UNHANDLED]:', reason);
});

const chromePath = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
const useSystemChrome = fs.existsSync(chromePath);

// Initialize the WhatsApp Client
export const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: sessionDir
    }),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    webVersionCache: {
        type: 'local',
    },
    puppeteer: {
        headless: true,
        executablePath: useSystemChrome ? chromePath : undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
        ],
    }
});

let latestQr: string | undefined;
export function getLatestQr() {
    return latestQr;
}

whatsappClient.on('qr', (qr) => {
    latestQr = qr;
    console.log('QR Code Received. Scan it with your WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log(\`[WA_QR] \${qr}\`);
});

whatsappClient.on('ready', () => {
    latestQr = undefined;
    console.log('✅ WhatsApp Client is ready! AI Negotiator is listening for incoming messages...');
});

whatsappClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp Client disconnected. Reason:', reason);
});

// Helper kirim notifikasi darurat/hot lead ke Telegram
async function notifyTelegram(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;
    try {
        await fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e: any) {
        console.warn('[AI Negotiator] Gagal kirim notif ke Telegram:', e?.message);
    }
}

// AI NEGOTIATOR LOGIC
const HANDOFF_TEXT = "Baik Kak, untuk detail teknis dan penawaran khusus akan langsung dibantu oleh Mas Pranata (Technical Lead kami). Sebentar ya Kak, saya teruskan ke beliau.";

whatsappClient.on('message', async (msg) => {
    // Abaikan pesan dari grup, status broadcast, atau pesan dari bot sendiri
    if (msg.from.includes('@g.us') || msg.from === 'status@broadcast' || msg.fromMe) return;

    try {
        // Normalisasi nomor pengirim dari "628xxx@c.us"
        const rawDigits = msg.from.replace('@c.us', '').replace(/\\D/g, '');
        const senderNumber = '+' + rawDigits;
        const localFormat = rawDigits.startsWith('62') ? '0' + rawDigits.slice(2) : rawDigits;

        // Cari prospek di database (toleran berbagai format nomor)
        const prospect = await prisma.prospect.findFirst({
            where: {
                OR: [
                    { whatsappNumber: senderNumber },
                    { whatsappNumber: rawDigits },
                    { whatsappNumber: localFormat },
                    { whatsappNumber: { contains: rawDigits.slice(-9) } }
                ]
            }
        });

        const bizName = prospect?.businessName || 'Kak';

        // RULES: Jika status sudah HOT_LEAD atau CLOSED, jangan ditimpa AI agar Mas Pranata bisa handle manual
        if (prospect && (prospect.status === 'HOT_LEAD' || prospect.status === 'CLOSED')) {
            console.log(\`[AI Negotiator] Pesan dari \${bizName} (\${senderNumber}) diabaikan karena status sudah \${prospect.status} (dihandle langsung Mas Pranata).\`);
            return;
        }

        console.log(\`\\n🤖 [AI Negotiator] Memproses pesan masuk dari \${bizName} (\${senderNumber})\`);
        console.log(\`[User] : \${msg.body}\`);

        const systemPrompt = \`Anda adalah "Pranata / Tim Sales PJTech", asisten konsultan bisnis digital UMKM dari PJTECH.
Saat merespons klien di WhatsApp, gunakan gaya bahasa yang ramah, sopan, santai, dan solutif (khas chat bisnis WhatsApp Indonesia, bukan robot kaku).

PRODUK UTAMA KITA:
1. "PJTech Kasir UMKM" (https://pjtechumkm.com):
- Solusi kasir POS cloud multi-usaha (F&B kafe/resto, Toko retail/sembako, Jasa barbershop/salon/bengkel, dan Rental kendaraan/kos).
- Fitur: Cek stok HP, scan barcode kamera, cetak struk bluetooth, rekap omzet harian otomatis, hitung komisi karyawan.
- Harga: Coba GRATIS 14 Hari (Rp 0). Paket Pro 1 Tahun cuma Rp 82.500/bulan (Total Rp 990.000/tahun — cuma setara Rp 2.700/hari!).
- Arahkan ke link coba gratis: https://pjtechumkm.com

2. "PJTech Custom Apps & Web" (https://pranajayatech.online/):
- Jika \${bizName} butuh sistem khusus (antrean pasien klinik, absensi membership gym, kalender rental GPS, website custom).
- Portofolio: https://pranajayatech.online/

ATURAN HANDOFF (SANGAT PENTING):
Jika calon klien menunjukkan minat beli, meminta nomor rekening, menanyakan rincian harga mendalam, ingin jadwal meeting, atau tanya teknis spesifik, Anda WAJIB membalas dengan kalimat persis:
"\${HANDOFF_TEXT}"
Jangan tambahkan kata lain jika handoff terpicu!\`;

        // Panggil LLM: Coba Groq Qwen lebih dulu, jika gagal fallback ke Gemini Flash
        let aiResponse = '';
        if (groqApiKey) {
            try {
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: msg.body }
                    ],
                    model: 'qwen/qwen3.8-27b',
                    temperature: 0.6,
                    max_tokens: 500
                });
                aiResponse = chatCompletion.choices[0]?.message?.content?.trim() || '';
            } catch (groqErr: any) {
                console.warn('[AI Negotiator] Groq model error, mencoba fallback ke Gemini Flash:', groqErr?.message);
            }
        }

        if (!aiResponse && process.env.GEMINI_API_KEY) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const geminiRes = await model.generateContent(\`\${systemPrompt}\\n\\nPesan Klien: "\${msg.body}"\\nBalasan Anda:\`);
                aiResponse = geminiRes.response.text().trim();
            } catch (geminiErr: any) {
                console.error('[AI Negotiator] Gemini fallback error:', geminiErr?.message);
            }
        }

        if (!aiResponse) {
            aiResponse = \`Halo Kak! Terima kasih sudah menghubungi tim PJTech. Untuk kebutuhan operasional kasir atau pembuatan sistem di \${bizName}, ada yang bisa kami bantu kak? Kakak juga bisa langsung coba gratis 14 hari di https://pjtechumkm.com ya kak 😊\`;
        }

        // Random delay sebelum membalas (Anti-ban: 5s hingga 10s)
        const delay = Math.floor(Math.random() * 5000) + 5000;
        console.log(\`[AI Negotiator] Menunggu \${delay / 1000} detik sebelum membalas ke \${bizName}...\`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Balas pesan via WhatsApp
        await msg.reply(aiResponse);
        console.log(\`[AI Balasan] : \${aiResponse}\`);

        // Cek jika AI merespons dengan Handoff Trigger
        const isHandoff = aiResponse.includes("dibantu oleh Mas Pranata") || aiResponse.includes("saya teruskan");
        if (isHandoff) {
            console.log(\`[🔥 HANDOFF] Trigger terdeteksi! Mengubah status \${bizName} menjadi HOT_LEAD.\`);
            if (prospect) {
                await prisma.prospect.update({
                    where: { id: prospect.id },
                    data: { status: 'HOT_LEAD', lastContactedAt: new Date() }
                });
            }

            // Notifikasi Real-time ke Telegram Owner
            await notifyTelegram(
                \`🔥 *[HOT LEAD WHATSAPP TERDETEKSI!]*\\n\\n\` +
                \`👤 *Bisnis:* \${bizName}\\n\` +
                \`📱 *WhatsApp:* \\\`\${senderNumber}\\\`\\n\` +
                \`💬 *Pesan Klien:* "\${msg.body}"\\n\` +
                \`🤖 *Balasan AI:* "\${aiResponse}"\\n\\n\` +
                \`⚡ *Segera follow up & closing deal!*\\n\` +
                \`👉 [Buka Chat WhatsApp](https://wa.me/\${rawDigits})\`
            );
        } else {
            // Notifikasi info chat masuk ke Telegram (hanya log informatif)
            await notifyTelegram(
                \`💬 *[WHATSAPP CHAT DARI KLIEN]*\\n\\n\` +
                \`👤 *Bisnis:* \${bizName} (\\\`\${senderNumber}\\\`)\\n\` +
                \`📥 *Pesan:* "\${msg.body}"\\n\` +
                \`🤖 *AI Menjawab:* "\${aiResponse}"\`
            ).catch(() => {});
        }

        // Catat percakapan ke database jika prospek ada
        if (prospect) {
            await prisma.outreachMessage.create({
                data: {
                    prospectId: prospect.id,
                    messageText: \`[User]: \${msg.body}\\n[AI]: \${aiResponse}\`
                }
            }).catch(() => {});
        }

    } catch (error) {
        console.error('[AI Negotiator] Terjadi error saat memproses pesan masuk:', error);
    }
});

// Helper function to send initial cold messages with a random human-like delay
export async function sendColdMessage(number: string, text: string, mediaPath?: string): Promise<boolean> {
    try {
        let formattedNumber = number;
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber.replace('+', '').replace(/\\D/g, '') + '@c.us';
        }

        // Random delay between 4s and 8s
        const delay = Math.floor(Math.random() * 4000) + 4000;
        console.log(\`Waiting \${delay / 1000} seconds before sending message to \${formattedNumber}...\`);
        await new Promise(resolve => setTimeout(resolve, delay));

        if (mediaPath) {
            const media = MessageMedia.fromFilePath(mediaPath);
            await whatsappClient.sendMessage(formattedNumber, media, { caption: text });
        } else {
            await whatsappClient.sendMessage(formattedNumber, text);
        }

        console.log(\`✅ Message sent successfully to \${formattedNumber}\`);
        return true;
    } catch (error) {
        console.error(\`❌ Failed to send message to \${number}:\`, error);
        return false;
    }
}
`;

fs.writeFileSync(CLIENT_FILE, upgradedClientContent, 'utf-8');
console.log('✅ Updated one-sales-man/src/whatsapp/client.ts');

// ── 2. STANDALONE PERSISTENT DAEMON: daemon.ts (SELF-CONTAINED) ─────────────
const daemonContent = `import path from 'path';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Global safety crash guard
process.on('uncaughtException', (err) => {
    console.error('❌ [DAEMON UNCAUGHT]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ [DAEMON UNHANDLED]:', reason);
});

import { whatsappClient, getLatestQr, sendColdMessage } from './client';
import prisma from '../lib/prisma';

const PORT = 3847;

let isReady = false;
let isOutreachRunning = false;

function sanitizeBusinessName(rawName: string): string {
  if (!rawName) return 'Kak';
  let name = rawName;
  name = name.replace(/\\(.*?\\)/g, '').replace(/\\[.*?\\]/g, '');
  name = name.split(/[-|/]/)[0];
  name = name.replace(/\\b(PT|CV|UD|PD)\\.?\\s+/gi, '');
  name = name.replace(/\\b(buka\\s+24\\s+jam|24\\s+jam|cabang\\s+\\w+|spesialis\\s+[\\w\\s]+)/gi, '');
  name = name.split(',')[0];
  name = name.replace(/\\s+/g, ' ').trim();
  const words = name.split(' ');
  if (words.length > 4) name = words.slice(0, 4).join(' ');
  name = name.replace(/[\\s&,\\-|/]+$/, '').trim();
  return name || rawName;
}

function getCategoryFeature(category: string | null): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('retail') || cat.includes('toko') || cat.includes('mart') || cat.includes('sembako') || cat.includes('minimarket')) {
    return 'catat stok barang dan rekap penjualan harian';
  }
  if (cat.includes('kafe') || cat.includes('cafe') || cat.includes('kopi') || cat.includes('resto') || cat.includes('makan') || cat.includes('fnb') || cat.includes('kuliner')) {
    return 'rekap orderan meja dan cetak struk dapur';
  }
  if (cat.includes('jasa') || cat.includes('servis') || cat.includes('salon') || cat.includes('barber') || cat.includes('bengkel') || cat.includes('klinik') || cat.includes('laundry')) {
    return 'hitung komisi kapster/teknisi dan rekap omzet';
  }
  if (cat.includes('rental') || cat.includes('sewa') || cat.includes('kos') || cat.includes('mobil') || cat.includes('motor') || cat.includes('villa') || cat.includes('homestay')) {
    return 'catat jadwal sewa unit/kamar per jam atau per hari, deposit, dan kuitansi otomatis';
  }
  return 'catat transaksi kasir dan rekap omzet harian';
}

function getNicheHook(category: string | null, cleanName: string): string {
  const feature = getCategoryFeature(category);
  return \`Halo admin \${cleanName}, salam kenal! Nemu kontak dari Google Maps.
Mau menawarkan akses Coba Gratis 14 Hari aplikasi Kasir PJTech untuk bantu \${feature}.
Langsung akses dan coba gratis di sini kak: https://pjtechumkm.com

Oh ya, kalau misal butuh pembuatan sistem/website custom khusus untuk operasional bisnisnya, kami juga bisa bantu. Cek layanan kami di: https://pranajayatech.online ya kak :)\`;
}

whatsappClient.on('ready', () => {
    isReady = true;
    console.log(\`\\n===========================================================\`);
    console.log(\` 📱 WHATSAPP BUSINESS DAEMON & AI CHAT ACTIVE 24/7\`);
    console.log(\` • Status         : 🟢 Connected & Listening Incoming Chats\`);
    console.log(\` • Internal Port  : http://127.0.0.1:\${PORT}\`);
    console.log(\` • AI Engine      : Groq (Qwen 3.8 27B) + Gemini Flash Fallback\`);
    console.log(\`===========================================================\\n\`);
});

whatsappClient.on('disconnected', () => {
    isReady = false;
});

// Jalankan HTTP server ringan untuk komunikasi internal
const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/health') {
        return res.end(JSON.stringify({
            status: 'ok',
            ready: isReady,
            outreachActive: isOutreachRunning,
            latestQr: getLatestQr() || null
        }));
    }

    if (req.method === 'POST' && req.url === '/trigger-outreach') {
        if (!isReady) {
            return res.writeHead(400).end(JSON.stringify({
                success: false,
                message: 'WhatsApp belum login / scan QR code.',
                qrUrl: getLatestQr() ? \`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${encodeURIComponent(getLatestQr()!)}\` : undefined
            }));
        }

        if (isOutreachRunning) {
            return res.writeHead(409).end(JSON.stringify({
                success: false,
                message: 'Batch outreach WhatsApp sedang berjalan. Mohon tunggu.'
            }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            let params: any = {};
            try { params = JSON.parse(body); } catch {}
            const batchLimit = parseInt(params.batchLimit || '10', 10);
            const category = params.category;
            const city = params.city;

            isOutreachRunning = true;
            res.writeHead(200).end(JSON.stringify({
                success: true,
                message: \`Batch outreach dimulai untuk maksimal \${batchLimit} prospek PENDING.\`
            }));

            try {
                const whereClause: any = { status: 'PENDING' };
                if (city) whereClause.city = { contains: city.trim(), mode: 'insensitive' };
                
                let prospects = await prisma.prospect.findMany({
                    where: whereClause,
                    take: batchLimit
                });

                if (prospects.length === 0) {
                    prospects = await prisma.prospect.findMany({
                        where: { status: 'PENDING' },
                        take: batchLimit
                    });
                }

                console.log(\`[WA_DAEMON] Memulai batch outreach ke \${prospects.length} prospek...\`);

                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < prospects.length; i++) {
                    const p = prospects[i];
                    const cleanName = sanitizeBusinessName(p.businessName);
                    const finalMessage = getNicheHook(p.category, cleanName);

                    console.log(\`[OUTREACH \${i+1}/\${prospects.length}] Kirim ke \${cleanName} (\${p.whatsappNumber})...\`);
                    const ok = await sendColdMessage(p.whatsappNumber, finalMessage);

                    if (ok) {
                        successCount++;
                        await prisma.prospect.update({
                            where: { id: p.id },
                            data: { status: 'CONTACTED', lastContactedAt: new Date() }
                        });
                        await prisma.outreachMessage.create({
                            data: { prospectId: p.id, messageText: finalMessage }
                        });
                    } else {
                        failCount++;
                    }

                    // Jeda aman anti-ban antar pesan (30s - 45s)
                    if (i < prospects.length - 1) {
                        const wait = Math.floor(Math.random() * 15000) + 30000;
                        console.log(\`⏳ [ANTI-BAN DELAY] Menunggu \${(wait/1000).toFixed(0)} detik...\`);
                        await new Promise(r => setTimeout(r, wait));
                    }
                }
                console.log(\`✅ [WA_DAEMON] Outreach batch selesai: \${successCount} sukses, \${failCount} gagal.\`);
            } catch (err: any) {
                console.error('❌ [WA_DAEMON] Error saat outreach batch:', err?.message);
            } finally {
                isOutreachRunning = false;
            }
        });
        return;
    }

    res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(\`🚀 [WA_DAEMON] Server bridge aktif di http://127.0.0.1:\${PORT}\`);
    console.log(\`📱 [WA_DAEMON] Menginisialisasi WhatsApp Client...\`);
    whatsappClient.initialize();
});
`;

fs.writeFileSync(DAEMON_FILE, daemonContent, 'utf-8');
console.log('✅ Created one-sales-man/src/whatsapp/daemon.ts');
