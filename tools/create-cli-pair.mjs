import fs from 'fs';
import path from 'path';

const siblingDir = path.resolve(process.cwd(), '../one-sales-man');
const pairScriptPath = path.join(siblingDir, 'src/pipeline/cli-pair.ts');

const content = `import 'dotenv/config';
import { whatsappClient } from '../whatsapp/client';

console.log('[PAIR_START] Memulai inisialisasi WhatsApp untuk PAIRING SAJA (Tanpa Kirim Pesan)...');

whatsappClient.initialize();

whatsappClient.on('ready', async () => {
  console.log('[WA_READY] ✅ WhatsApp Client berhasil ditautkan (Pairing Sukses)!');
  console.log('[PAIR_SUCCESS] Sesi tersimpan aman. Tidak ada pesan yang dikirim ke prospek.');
  setTimeout(async () => {
    await whatsappClient.destroy().catch(() => {});
    process.exit(0);
  }, 2000);
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('[WA_AUTH_FAILURE]', msg);
  process.exit(1);
});
`;

fs.writeFileSync(pairScriptPath, content, 'utf-8');
console.log('✅ Successfully created cli-pair.ts at:', pairScriptPath);
