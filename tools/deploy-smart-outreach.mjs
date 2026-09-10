import fs from 'fs';
import path from 'path';

const SIBLING_DIR = path.resolve(process.cwd(), '../one-sales-man');
const CLI_OUTREACH_PATH = path.join(SIBLING_DIR, 'src/pipeline/cli-outreach.ts');

const updatedCliOutreach = `import path from 'path';
import dotenv from 'dotenv';

// Pastikan selalu meload file .env milik one-sales-man
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Groq from 'groq-sdk';
import prisma from '../lib/prisma';
import { whatsappClient, sendColdMessage } from '../whatsapp/client';

// ── LAPISAN 1: SMART NAME SANITIZER ──────────────────────────────────────────
export function sanitizeBusinessName(rawName: string): string {
  if (!rawName) return 'Kak';
  let name = rawName;

  // 1. Hapus isi tanda kurung beserta kurungnya: (Buka 24 Jam), (Cabang...), dll
  name = name.replace(/\\(.*?\\)/g, '');
  name = name.replace(/\\[.*?\\]/g, '');

  // 2. Hapus kata setelah strip, pipe, atau slash (biasanya tagline/kota)
  name = name.split(/[-|/]/)[0];

  // 3. Hapus PT, CV, UD, PD
  name = name.replace(/\\b(PT|CV|UD|PD)\\.?\\s+/gi, '');

  // 4. Hapus frase umum Google Maps
  name = name.replace(/\\b(buka\\s+24\\s+jam|24\\s+jam|cabang\\s+\\w+|spesialis\\s+[\\w\\s]+)/gi, '');

  // 5. Hapus gelar setelah tanda koma (misal: , Sp.A, , S.Ked)
  name = name.split(',')[0];

  // 6. Rapikan spasi
  name = name.replace(/\\s+/g, ' ').trim();

  // 7. Jika nama masih terlalu panjang (> 4 kata), ambil 4 kata pertama agar terdengar natural
  const words = name.split(' ');
  if (words.length > 4) {
    name = words.slice(0, 4).join(' ');
  }

  // 8. Hapus karakter menggantung di akhir (seperti &, -, ,, /)
  name = name.replace(/[\\s&,\\-|/]+$/, '').trim();

  return name || rawName;
}

// ── LAPISAN 2: NICHE-SPECIFIC HOOK GENERATOR ─────────────────────────────────
export function getNicheHook(category: string | null, cleanName: string): string {
  const cat = (category || '').toLowerCase();

  if (cat.includes('klinik') || cat.includes('dokter') || cat.includes('apotek') || cat.includes('medis') || cat.includes('sehat')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari tim PJTECH. Maaf mengganggu waktunya kak. Mau tanya santai, untuk sistem reservasi antrean pasien di \${cleanName} sekarang sudah pakai sistem digital atau masih via WhatsApp manual kak?\`;
  }

  if (cat.includes('kafe') || cat.includes('cafe') || cat.includes('kopi') || cat.includes('resto') || cat.includes('makan') || cat.includes('fnb') || cat.includes('kuliner') || cat.includes('bakery')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari PJTECH. Maaf mengganggu waktunya kak. Izin tanya sedikit, untuk pencatatan pesanan meja dan tiket dapur di \${cleanName} saat ini sudah pakai aplikasi kasir/POS atau masih manual kak?\`;
  }

  if (cat.includes('gym') || cat.includes('fitness') || cat.includes('fitnes') || cat.includes('senam')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari PJTECH. Maaf mengganggu waktunya kak. Boleh tanya santai, untuk absensi dan kartu membership member di \${cleanName} sekarang sudah pakai sistem barcode atau masih manual kak?\`;
  }

  if (cat.includes('salon') || cat.includes('barber') || cat.includes('cukur') || cat.includes('bengkel') || cat.includes('spa') || cat.includes('servis')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari PJTECH. Maaf mengganggu waktunya kak. Mau tanya sedikit, untuk pembagian komisi montir/kapster dan reservasi antrean di \${cleanName} sudah pakai sistem otomatis atau masih buku catatan kak?\`;
  }

  if (cat.includes('rental') || cat.includes('sewa') || cat.includes('kos') || cat.includes('mobil') || cat.includes('motor')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari PJTECH. Maaf mengganggu waktunya kak. Mau tanya santai, untuk jadwal kalender sewa unit di \${cleanName} sekarang sudah pakai sistem anti-bentrok atau masih rekap manual kak?\`;
  }

  if (cat.includes('retail') || cat.includes('toko') || cat.includes('mart') || cat.includes('sembako') || cat.includes('grosir')) {
    return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari PJTECH. Maaf mengganggu waktunya kak. Izin tanya sedikit, untuk pencatatan kasir dan cek stok barang di \${cleanName} saat ini sudah pakai scan barcode HP atau masih manual kak?\`;
  }

  return \`Halo admin \${cleanName}, salam kenal! Saya Pranata dari tim PJTECH. Maaf mengganggu waktunya kak. Kebetulan kita lagi ada program riset untuk digitalisasi UMKM lokal. Boleh izin tanya sedikit mengenai operasional pencatatan di \${cleanName} kak?\`;
}

// ── LAPISAN 3: GROQ LLM HUMAN POLISH ─────────────────────────────────────────
async function polishWithGroq(rawMessage: string, cleanName: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) return rawMessage;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: \`Anda adalah asisten copywriter pesan WhatsApp B2B.
Tugas Anda adalah memperhalus pesan pengantar cold message berikut agar terdengar 100% seperti ketikan manusia santai di WhatsApp:
- Sopan, ramah, tidak kaku, dan seperti teman yang sedang riset bisnis.
- Singkat (maksimal 2-3 kalimat).
- Tetap sapa dengan nama "\${cleanName}".
- Jangan gunakan kata marketing klise atau promosi jualan yang agresif.
Balas HANYA dengan teks pesan final tanpa tanda petik, tanda kurung, atau kalimat pengantar.\`
        },
        {
          role: 'user',
          content: rawMessage
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 150
    });

    const polished = completion.choices[0]?.message?.content?.trim();
    return polished || rawMessage;
  } catch (err: any) {
    console.warn('[Outreach Polish] Fallback ke template niche:', err?.message || err);
    return rawMessage;
  }
}

// ── FUNGSI UTAMA BATCH OUTREACH ──────────────────────────────────────────────
async function runBatchOutreach(batchLimit: number = 5, category?: string, city?: string) {
  console.log(\`[OUTREACH_START] Memulai batch outreach (Maksimal: \${batchLimit} prospek PENDING | Filter: \${category || 'Semua'} - \${city || 'Semua'})...\`);

  const whereClause: any = { status: 'PENDING' };
  if (category && category.trim() !== '') {
    whereClause.category = { contains: category.trim(), mode: 'insensitive' };
  }
  if (city && city.trim() !== '') {
    whereClause.city = { contains: city.trim(), mode: 'insensitive' };
  }

  let pendingProspects = await prisma.prospect.findMany({
    where: whereClause,
    take: batchLimit
  });

  if (pendingProspects.length === 0 && (category || city)) {
    console.log(\`[OUTREACH_FALLBACK] Tidak ada prospek PENDING untuk niche "\${category || ''}". Mengambil antrean PENDING umum...\`);
    pendingProspects = await prisma.prospect.findMany({
      where: { status: 'PENDING' },
      take: batchLimit
    });
  }

  if (pendingProspects.length === 0) {
    console.log('[OUTREACH_EMPTY] Tidak ada prospek dengan status PENDING di database.');
    return { contacted: 0, failed: 0, targetInfo: \`\${category || 'Semua'} di \${city || 'Semua'}\` };
  }

  console.log(\`[OUTREACH_FOUND] Ditemukan \${pendingProspects.length} prospek PENDING siap dihubungi.\`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < pendingProspects.length; i++) {
    const prospect = pendingProspects[i];

    // 1. Lapisan 1: Bersihkan nama bisnis dari embel-embel Google Maps
    const cleanName = sanitizeBusinessName(prospect.businessName);

    // 2. Lapisan 2: Buat hook sapaan kontekstual sesuai niche
    const rawNicheMessage = getNicheHook(prospect.category, cleanName);

    // 3. Lapisan 3: Final human polish via Groq Llama 3
    console.log(\`[OUTREACH_POLISHING \${i + 1}/\${pendingProspects.length}] Memoles sapaan untuk "\${cleanName}" via Groq Llama 3...\`);
    const finalMessage = await polishWithGroq(rawNicheMessage, cleanName);

    console.log(\`[OUTREACH_TEXT]:\\n"\${finalMessage}"\\n\`);
    console.log(\`[OUTREACH_SENDING \${i + 1}/\${pendingProspects.length}] Mengirim pesan ke \${cleanName} (\${prospect.whatsappNumber})...\`);

    const success = await sendColdMessage(prospect.whatsappNumber, finalMessage);

    if (success) {
      successCount++;
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: {
          status: 'CONTACTED',
          lastContactedAt: new Date()
        }
      });

      await prisma.outreachMessage.create({
        data: {
          prospectId: prospect.id,
          messageText: finalMessage
        }
      });
      console.log(\`[OUTREACH_SUCCESS] \${cleanName} status diupdate ke CONTACTED.\`);
    } else {
      failCount++;
      console.log(\`[OUTREACH_FAILED] Gagal mengirim pesan ke \${cleanName}.\`);
    }
  }

  console.log(\`[OUTREACH_DONE] Batch selesai! Sukses: \${successCount}, Gagal: \${failCount}\`);
  return { contacted: successCount, failed: failCount, targetInfo: \`\${category || 'Semua'} di \${city || 'Semua'}\` };
}

async function main() {
  const args = process.argv.slice(2);
  let batchLimit = 5;
  let category: string | undefined;
  let city: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--batch=')) {
      batchLimit = parseInt(arg.replace('--batch=', '').trim(), 10) || 5;
    } else if (arg.startsWith('--category=')) {
      category = arg.replace('--category=', '').trim();
    } else if (arg.startsWith('--city=')) {
      city = arg.replace('--city=', '').trim();
    }
  }

  console.log('[WA_INIT] Menginisialisasi WhatsApp Client...');

  whatsappClient.on('qr', (qr) => {
    console.log(\`[WA_QR] \${qr}\`);
  });

  whatsappClient.initialize();

  whatsappClient.on('ready', async () => {
    console.log('[WA_READY] WhatsApp Client siap. Menjalankan smart batch outreach...');
    try {
      await runBatchOutreach(batchLimit, category, city);
    } catch (err) {
      console.error('[OUTREACH_ERROR]', err);
    } finally {
      setTimeout(async () => {
        console.log('[WA_FINISH] Menutup koneksi...');
        await prisma.$disconnect();
        await whatsappClient.destroy().catch(() => {});
        process.exit(0);
      }, 3000);
    }
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('[WA_AUTH_FAILURE]', msg);
    process.exit(1);
  });
}

// Hanya jalankan main jika dipanggil langsung sebagai CLI
if (process.argv[1] && process.argv[1].includes('cli-outreach')) {
  main();
}
`;

fs.writeFileSync(CLI_OUTREACH_PATH, updatedCliOutreach, 'utf-8');
console.log('Successfully refined Smart Outreach in one-sales-man/src/pipeline/cli-outreach.ts');
