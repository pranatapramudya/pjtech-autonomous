/**
 * Script untuk me-refresh OAuth token YouTube.
 * Jalankan: npx tsx tools/refresh-youtube-token.ts
 * 
 * Jika token expired, script ini akan generate link auth baru.
 * Setelah login di browser dan mendapat code, paste code-nya ke terminal.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { google } from 'googleapis';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TOKENS_PATH_INTERNAL = path.resolve(__dirname, '../video-engine/src/data/tokens.json');
const TOKENS_PATH_ROOT = path.resolve(__dirname, '../tokens.json');
const ENV_PATH = path.resolve(__dirname, '../.env');

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

async function main() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ YOUTUBE_CLIENT_ID atau YOUTUBE_CLIENT_SECRET tidak ada di .env');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000');

  // Cek apakah existing token masih valid
  const tokenFile = fs.existsSync(TOKENS_PATH_ROOT) ? TOKENS_PATH_ROOT : TOKENS_PATH_INTERNAL;
  if (fs.existsSync(tokenFile)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
      oauth2.setCredentials(tokens);
      const { token } = await oauth2.getAccessToken();
      if (token) {
        console.log('✅ Token YouTube masih valid! Tidak perlu re-auth.');
        console.log('   Access token berhasil diperbarui otomatis.');
        // Simpan ulang tokens yang sudah di-refresh
        const newCreds = oauth2.credentials;
        const updated = { ...tokens, ...newCreds };
        fs.writeFileSync(TOKENS_PATH_ROOT, JSON.stringify(updated, null, 2));
        fs.writeFileSync(TOKENS_PATH_INTERNAL, JSON.stringify(updated, null, 2));
        console.log('💾 Tokens diperbarui di:', TOKENS_PATH_ROOT);
        process.exit(0);
      }
    } catch (err: any) {
      console.warn('⚠️ Token existing expired atau invalid:', err?.message);
    }
  }

  // Generate Auth URL baru
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\n🔐 ====== YOUTUBE RE-AUTHENTICATION REQUIRED ======');
  console.log('Token YouTube expired. Ikuti langkah berikut:\n');
  console.log('1. Buka URL ini di browser:');
  console.log('\n' + authUrl + '\n');
  console.log('2. Login dengan akun Google yang dipakai untuk channel YouTube PJTech');
  console.log('3. Klik "Allow / Izinkan"');
  console.log('4. Browser akan redirect ke localhost:3000?code=XXXXX (halaman mungkin error, itu normal)');
  console.log('5. Copy HANYA nilai "code=" dari URL tersebut dan paste di sini:\n');
  console.log('===================================================\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Paste authorization code di sini: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oauth2.getToken(code.trim());
      oauth2.setCredentials(tokens);

      // Simpan ke semua lokasi yang digunakan sistem
      fs.mkdirSync(path.dirname(TOKENS_PATH_INTERNAL), { recursive: true });
      fs.writeFileSync(TOKENS_PATH_ROOT, JSON.stringify(tokens, null, 2));
      fs.writeFileSync(TOKENS_PATH_INTERNAL, JSON.stringify(tokens, null, 2));
      console.log('\n✅ Token YouTube berhasil diperbarui!');
      console.log('📁 Disimpan ke:', TOKENS_PATH_ROOT);
      console.log('📁 Disimpan ke:', TOKENS_PATH_INTERNAL);

      // Update YOUTUBE_REFRESH_TOKEN di .env jika ada refresh_token baru
      if (tokens.refresh_token) {
        let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        if (envContent.includes('YOUTUBE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /YOUTUBE_REFRESH_TOKEN=.*/,
            `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
        } else {
          envContent += `\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`;
        }
        fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
        console.log('📝 YOUTUBE_REFRESH_TOKEN diperbarui di .env');
      }

      console.log('\n🚀 Selesai! Sekarang jalankan ulang evaluasi:');
      console.log('   npx tsx -e "import { evaluateDailyVideos } from \'./video-engine/src/pipeline/analytics-loop\'; evaluateDailyVideos().then(r => console.log(r.summary))"');
    } catch (err: any) {
      console.error('\n❌ Gagal menukarkan code:', err?.message || err);
      console.error('Pastikan code yang di-paste lengkap dan belum expired (kode hanya valid beberapa menit).');
    }
    process.exit(0);
  });
}

main();
