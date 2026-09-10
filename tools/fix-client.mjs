import fs from 'fs';
import path from 'path';

const clientPath = path.resolve(process.cwd(), '../one-sales-man/src/whatsapp/client.ts');
let content = fs.readFileSync(clientPath, 'utf-8');

const targetOld = `export const whatsappClient = new Client({
    authStrategy: new LocalAuth(), // Saves session locally
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});`;

const replacementNew = `export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1047068806-alpha.html',
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});`;

if (content.includes(targetOld)) {
  content = content.replace(targetOld, replacementNew);
  fs.writeFileSync(clientPath, content, 'utf-8');
  console.log('✅ client.ts successfully updated with webVersionCache and stable puppeteer args!');
} else {
  console.log('Target block not found, checking if already updated...');
}
