import fs from 'fs';
import path from 'path';

const SIBLING_DIR = path.resolve(process.cwd(), '../one-sales-man');
const CLI_OUTREACH_PATH = path.join(SIBLING_DIR, 'src/pipeline/cli-outreach.ts');

const updatedCliOutreach = `import 'dotenv/config';
import prisma from '../lib/prisma';
import { whatsappClient, sendColdMessage } from '../whatsapp/client';

// Usage: npx tsx src/pipeline/cli-outreach.ts --batch=5 --category="F&B" --city="Bandung"
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

  // Fallback: Jika target niche/kota spesifik belum ada yang PENDING, ambil prospek PENDING umum agar kampanye tetap jalan
  if (pendingProspects.length === 0 && (category || city)) {
    console.log(\`[OUTREACH_FALLBACK] Tidak ada prospek PENDING untuk niche "\${category || ''}". Mengambil prospek PENDING umum dari antrean...\`);
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
    const messageTemplate = \`Halo admin \${prospect.businessName}, salam kenal! Saya Pranata dari tim PJTECH.

Maaf mengganggu waktunya kak. Kebetulan kita lagi ada program riset untuk digitalisasi UMKM/Bisnis lokal. Boleh izin tanya sedikit mengenai operasional pencatatan di \${prospect.businessName} kak?\`;

    console.log(\`[OUTREACH_SENDING \${i + 1}/\${pendingProspects.length}] Mengirim pesan ke \${prospect.businessName} (\${prospect.whatsappNumber})...\`);
    const success = await sendColdMessage(prospect.whatsappNumber, messageTemplate);

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
          messageText: messageTemplate
        }
      });
      console.log(\`[OUTREACH_SUCCESS] \${prospect.businessName} status diupdate ke CONTACTED.\`);
    } else {
      failCount++;
      console.log(\`[OUTREACH_FAILED] Gagal mengirim pesan ke \${prospect.businessName}.\`);
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
    console.log('[WA_READY] WhatsApp Client siap. Menjalankan batch outreach...');
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

main();
`;

fs.writeFileSync(CLI_OUTREACH_PATH, updatedCliOutreach, 'utf-8');
console.log('Successfully updated cli-outreach.ts with category/city support and QR logging.');
