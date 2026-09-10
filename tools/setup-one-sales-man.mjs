import fs from 'fs';
import path from 'path';

const SIBLING_DIR = path.resolve(process.cwd(), '../one-sales-man');
const PIPELINE_DIR = path.join(SIBLING_DIR, 'src/pipeline');

console.log('Target sibling pipeline dir:', PIPELINE_DIR);

// 1. cli-status.ts
const cliStatusContent = `import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  try {
    const [total, pending, contacted, hotLeads, closed] = await Promise.all([
      prisma.prospect.count(),
      prisma.prospect.count({ where: { status: 'PENDING' } }),
      prisma.prospect.count({ where: { status: 'CONTACTED' } }),
      prisma.prospect.count({ where: { status: 'HOT_LEAD' } }),
      prisma.prospect.count({ where: { status: 'CLOSED' } })
    ]);

    const recentHotLeads = await prisma.prospect.findMany({
      where: { status: 'HOT_LEAD' },
      orderBy: { lastContactedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        whatsappNumber: true,
        lastContactedAt: true
      }
    });

    const payload = {
      success: true,
      stats: {
        total,
        pending,
        contacted,
        hotLeads,
        closed
      },
      recentHotLeads
    };

    console.log(JSON.stringify(payload, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ success: false, error: error?.message || String(error) }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
`;

// 2. cli-scrape.ts
const cliScrapeContent = `import 'dotenv/config';
import { scrapeGoogleMaps } from '../scraper/gmaps';

// Usage: npx tsx src/pipeline/cli-scrape.ts --keyword="Klinik di Sumedang" --limit=10 --headless=true
async function main() {
  const args = process.argv.slice(2);
  let keyword = 'Klinik di Sumedang';
  let limit = 10;
  let headless = true;

  for (const arg of args) {
    if (arg.startsWith('--keyword=')) {
      keyword = arg.replace('--keyword=', '').trim();
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.replace('--limit=', '').trim(), 10) || 10;
    } else if (arg.startsWith('--headless=')) {
      headless = arg.replace('--headless=', '').trim() === 'true';
    }
  }

  console.log(\`[CLI_SCRAPE_START] Keyword: "\${keyword}" | Limit: \${limit} | Headless: \${headless}\`);

  try {
    await scrapeGoogleMaps(keyword, limit, headless);
    console.log(\`[CLI_SCRAPE_SUCCESS] Selesai melakukan scraping untuk "\${keyword}".\`);
    process.exit(0);
  } catch (err: any) {
    console.error(\`[CLI_SCRAPE_ERROR] \${err?.message || err}\`);
    process.exit(1);
  }
}

main();
`;

// 3. cli-outreach.ts
const cliOutreachContent = `import 'dotenv/config';
import prisma from '../lib/prisma';
import { whatsappClient, sendColdMessage } from '../whatsapp/client';

// Usage: npx tsx src/pipeline/cli-outreach.ts --batch=5
async function runBatchOutreach(batchLimit: number = 5) {
  console.log(\`[OUTREACH_START] Memulai batch outreach (Maksimal: \${batchLimit} prospek PENDING)...\`);

  const pendingProspects = await prisma.prospect.findMany({
    where: { status: 'PENDING' },
    take: batchLimit
  });

  if (pendingProspects.length === 0) {
    console.log('[OUTREACH_EMPTY] Tidak ada prospek dengan status PENDING di database.');
    return { contacted: 0, failed: 0 };
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
  return { contacted: successCount, failed: failCount };
}

async function main() {
  const args = process.argv.slice(2);
  let batchLimit = 5;

  for (const arg of args) {
    if (arg.startsWith('--batch=')) {
      batchLimit = parseInt(arg.replace('--batch=', '').trim(), 10) || 5;
    }
  }

  console.log('[WA_INIT] Menginisialisasi WhatsApp Client...');
  whatsappClient.initialize();

  whatsappClient.on('ready', async () => {
    console.log('[WA_READY] WhatsApp Client siap. Menjalankan batch outreach...');
    try {
      await runBatchOutreach(batchLimit);
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

// Tulis ketiga file ke one-sales-man/src/pipeline
fs.writeFileSync(path.join(PIPELINE_DIR, 'cli-status.ts'), cliStatusContent, 'utf-8');
console.log('Written: cli-status.ts');

fs.writeFileSync(path.join(PIPELINE_DIR, 'cli-scrape.ts'), cliScrapeContent, 'utf-8');
console.log('Written: cli-scrape.ts');

fs.writeFileSync(path.join(PIPELINE_DIR, 'cli-outreach.ts'), cliOutreachContent, 'utf-8');
console.log('Written: cli-outreach.ts');

// Modifikasi juga gmaps.ts agar support headless parameter
const gmapsPath = path.join(SIBLING_DIR, 'src/scraper/gmaps.ts');
let gmapsContent = fs.readFileSync(gmapsPath, 'utf-8');
if (!gmapsContent.includes('headless: boolean = false')) {
  gmapsContent = gmapsContent.replace(
    'export async function scrapeGoogleMaps(keyword: string, limit: number = 10) {',
    'export async function scrapeGoogleMaps(keyword: string, limit: number = 10, headless: boolean = false) {'
  );
  gmapsContent = gmapsContent.replace(
    'const browser = await chromium.launch({ headless: false });',
    'const browser = await chromium.launch({ headless: headless });'
  );
  fs.writeFileSync(gmapsPath, gmapsContent, 'utf-8');
  console.log('Updated: gmaps.ts with headless parameter support');
} else {
  console.log('gmaps.ts already supports headless parameter');
}

console.log('All CLI endpoints setup complete!');
