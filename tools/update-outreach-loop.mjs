import fs from 'fs';
import path from 'path';

const file = 'D:/Coding/one-sales-man/src/pipeline/cli-outreach.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Tambahkan fungsi helper randomDelay jika belum ada
const delayFunc = `
// ── HELPER DELAY ANTI-BAN (30s - 60s) ────────────────────────────────────────
function randomDelay(minMs: number = 30000, maxMs: number = 60000): Promise<number> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
}
`;

if (!content.includes('function randomDelay')) {
  content = content.replace(
    '// ── FUNGSI UTAMA BATCH OUTREACH',
    delayFunc + '\n// ── FUNGSI UTAMA BATCH OUTREACH'
  );
}

// 2. Ganti perulangan for index biasa menjadi for...of dengan jeda 30-60 detik
const oldLoop = `  for (let i = 0; i < pendingProspects.length; i++) {
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
  }`;

const newLoop = `  let currentIndex = 0;
  for (const prospect of pendingProspects) {
    currentIndex++;

    // 1. Lapisan 1: Bersihkan nama bisnis dari embel-embel Google Maps
    const cleanName = sanitizeBusinessName(prospect.businessName);

    // 2. Lapisan 2: Buat pesan baku dengan variasi fitur spesifik kategori
    const finalMessage = getNicheHook(prospect.category, cleanName);

    console.log(\`[OUTREACH_TEXT \${currentIndex}/\${pendingProspects.length}]:\\n"\${finalMessage}"\\n\`);
    console.log(\`[OUTREACH_SENDING \${currentIndex}/\${pendingProspects.length}] Mengirim pesan ke \${cleanName} (\${prospect.whatsappNumber})...\`);

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

      // Jeda acak 30s - 60s SETELAH setiap pengiriman pesan sukses sebelum lanjut ke prospek berikutnya
      if (currentIndex < pendingProspects.length) {
        console.log(\`⏳ [ANTI-BAN DELAY] Menunggu jeda aman sebelum kontak berikutnya...\`);
        const waitedMs = await randomDelay(30000, 60000);
        console.log(\`✅ [ANTI-BAN DELAY] Selesai jeda \${(waitedMs / 1000).toFixed(1)} detik. Melanjutkan ke prospek berikutnya...\\n\`);
      }
    } else {
      failCount++;
      console.log(\`[OUTREACH_FAILED] Gagal mengirim pesan ke \${cleanName}.\`);
    }
  }`;

if (content.includes(oldLoop)) {
  content = content.replace(oldLoop, newLoop);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Berhasil memperbarui cli-outreach.ts dengan loop for...of dan delay 30-60 detik!');
} else {
  console.error('❌ Bagian loop lama tidak cocok!');
  process.exit(1);
}
