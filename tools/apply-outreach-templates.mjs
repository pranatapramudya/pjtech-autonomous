import fs from 'fs';
import path from 'path';

const targetFile = 'D:/Coding/one-sales-man/src/pipeline/cli-outreach.ts';

const content = `import path from 'path';
import dotenv from 'dotenv';

// Pastikan selalu meload file .env milik one-sales-man
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

// ── LAPISAN 2: FITUR SPESIFIK KATEGORI (4 TENANT TYPES) ──────────────────────
export function getCategoryFeature(category: string | null): string {
  const cat = (category || '').toLowerCase();

  // 1. Retail
  if (
    cat.includes('retail') ||
    cat.includes('toko') ||
    cat.includes('mart') ||
    cat.includes('sembako') ||
    cat.includes('grosir') ||
    cat.includes('minimarket') ||
    cat.includes('warung') ||
    cat.includes('butik') ||
    cat.includes('fashion') ||
    cat.includes('distro') ||
    cat.includes('elektronik') ||
    cat.includes('atk') ||
    cat.includes('baju') ||
    cat.includes('pakaian')
  ) {
    return 'catat stok barang dan rekap penjualan harian';
  }

  // 2. F&B
  if (
    cat.includes('kafe') ||
    cat.includes('cafe') ||
    cat.includes('kopi') ||
    cat.includes('resto') ||
    cat.includes('makan') ||
    cat.includes('f&b') ||
    cat.includes('fnb') ||
    cat.includes('kuliner') ||
    cat.includes('bakery') ||
    cat.includes('roti') ||
    cat.includes('kedai') ||
    cat.includes('kitchen')
  ) {
    return 'rekap orderan meja dan cetak struk dapur';
  }

  // 3. Jasa / Servis
  if (
    cat.includes('jasa') ||
    cat.includes('servis') ||
    cat.includes('service') ||
    cat.includes('salon') ||
    cat.includes('barber') ||
    cat.includes('cukur') ||
    cat.includes('bengkel') ||
    cat.includes('spa') ||
    cat.includes('klinik') ||
    cat.includes('dokter') ||
    cat.includes('apotek') ||
    cat.includes('gym') ||
    cat.includes('fitness') ||
    cat.includes('cuci') ||
    cat.includes('laundry') ||
    cat.includes('refleksi')
  ) {
    return 'hitung komisi kapster/teknisi dan rekap omzet';
  }

  // 4. Rental / Travel / Property
  if (
    cat.includes('rental') ||
    cat.includes('sewa') ||
    cat.includes('kos') ||
    cat.includes('kost') ||
    cat.includes('mobil') ||
    cat.includes('motor') ||
    cat.includes('travel') ||
    cat.includes('tour') ||
    cat.includes('property') ||
    cat.includes('properti') ||
    cat.includes('penginapan') ||
    cat.includes('homestay') ||
    cat.includes('villa') ||
    cat.includes('hotel')
  ) {
    return 'catat jadwal sewa, deposit, dan tagihan';
  }

  // 5. Fallback Kategori Lainnya
  return 'catat transaksi kasir dan rekap omzet harian';
}

// ── LAPISAN 3: STRUKTUR PESAN OUTREACH BAKU ──────────────────────────────────
export function getNicheHook(category: string | null, cleanName: string): string {
  const feature = getCategoryFeature(category);
  return \`Halo admin \${cleanName}, salam kenal! Nemu kontak dari Google Maps.
Mau menawarkan akses Coba Gratis 7 Hari aplikasi Kasir PJTech untuk bantu \${feature}.
Langsung akses dan coba gratis di sini kak: https://pjtechumkm.com

Oh ya, kalau misal butuh pembuatan sistem/aplikasi custom khusus untuk operasional bisnisnya, kami juga bisa bantu ya kak. 🙏\`;
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

    // 2. Lapisan 2: Buat pesan baku dengan variasi fitur spesifik kategori
    const finalMessage = getNicheHook(prospect.category, cleanName);

    console.log(\`[OUTREACH_TEXT \${i + 1}/\${pendingProspects.length}]:\\n"\${finalMessage}"\\n\`);
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

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully written updated cli-outreach.ts');
