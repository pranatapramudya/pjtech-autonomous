/**
 * Auto-check & refresh YouTube OAuth token before expiry.
 * Jalankan via cron harian (misal jam 03:00 WIB).
 * 
 * Usage: npx tsx tools/auto-refresh-youtube-token.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TOKENS_PATH_ROOT = path.resolve(__dirname, '../tokens.json');
const TOKENS_PATH_INTERNAL = path.resolve(__dirname, '../video-engine/src/data/tokens.json');
const ENV_PATH = path.resolve(__dirname, '../.env');
const CLIENT_SECRET_PATH = path.resolve(__dirname, '../client_secret.json');

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

// Threshold: refresh kalau token expiry < 1 hari (86400000 ms)
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

async function main() {
  console.log('🔍 [AUTO-REFRESH] Memeriksa status YouTube OAuth token...');

  // Load client credentials
  let clientId = process.env.YOUTUBE_CLIENT_ID;
  let clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if ((!clientId || !clientSecret) && fs.existsSync(CLIENT_SECRET_PATH)) {
    try {
      const secretRaw = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8'));
      const conf = secretRaw.installed || secretRaw.web;
      if (conf) {
        clientId = conf.client_id;
        clientSecret = conf.client_secret;
      }
    } catch {}
  }

  if (!clientId || !clientSecret) {
    console.error('❌ [AUTO-REFRESH] YOUTUBE_CLIENT_ID/SECRET tidak ditemukan');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000');

  // Cek token file
  const tokenFile = fs.existsSync(TOKENS_PATH_ROOT) ? TOKENS_PATH_ROOT : 
                    fs.existsSync(TOKENS_PATH_INTERNAL) ? TOKENS_PATH_INTERNAL : null;

  if (!tokenFile) {
    console.warn('⚠️ [AUTO-REFRESH] Token file tidak ditemukan. Butuh auth manual.');
    process.exit(0); // Exit clean, biar cron tidak error
  }

  try {
    const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    oauth2.setCredentials(tokens);

    const expiryDate = tokens.expiry_date;
    const now = Date.now();
    const timeUntilExpiry = expiryDate - now;

    console.log(`📅 Token expiry: ${new Date(expiryDate).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
    console.log(`⏱️  Sisa waktu: ${Math.round(timeUntilExpiry / 1000 / 60 / 60)} jam ${Math.round((timeUntilExpiry / 1000 / 60) % 60)} menit`);

    // Kalau masih aman (> threshold), skip
    if (timeUntilExpiry > REFRESH_THRESHOLD_MS) {
      console.log('✅ [AUTO-REFRESH] Token masih valid lama. Skip refresh.');
      process.exit(0);
    }

    // Kalau refresh_token ada, coba refresh otomatis
    if (tokens.refresh_token) {
      console.log('🔄 [AUTO-REFRESH] Token nearly expired. Mencoba auto-refresh...');
      
      const { credentials } = await oauth2.refreshAccessToken();
      
      // Merge tokens
      const updatedTokens = { ...tokens, ...credentials };
      
      // Simpan ke semua lokasi
      fs.writeFileSync(TOKENS_PATH_ROOT, JSON.stringify(updatedTokens, null, 2));
      fs.writeFileSync(TOKENS_PATH_INTERNAL, JSON.stringify(updatedTokens, null, 2));
      console.log('💾 [AUTO-REFRESH] Token diperbarui di:', TOKENS_PATH_ROOT);

      // Update .env YOUTUBE_REFRESH_TOKEN kalau ada refresh_token baru
      if (credentials.refresh_token) {
        let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        if (envContent.includes('YOUTUBE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /YOUTUBE_REFRESH_TOKEN=.*/,
            `YOUTUBE_REFRESH_TOKEN=${credentials.refresh_token}`
          );
        } else {
          envContent += `\nYOUTUBE_REFRESH_TOKEN=${credentials.refresh_token}`;
        }
        fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
        console.log('📝 [AUTO-REFRESH] YOUTUBE_REFRESH_TOKEN diperbarui di .env');
      }

      const newExpiry = updatedTokens.expiry_date;
      console.log(`✅ [AUTO-REFRESH] Berhasil! Expiry baru: ${new Date(newExpiry).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
      process.exit(0);
    }

    // Kalau tidak ada refresh_token, butuh re-auth manual
    console.warn('⚠️ [AUTO-REFRESH] Tidak ada refresh_token. Butuh re-auth manual via browser.');
    console.log('   Jalankan: npx tsx tools/refresh-youtube-token.ts');
    process.exit(0);

  } catch (err: any) {
    // Kalau error invalid_grant atau token corrupt
    if (err?.message?.includes('invalid_grant') || err?.code === 400) {
      console.warn('⚠️ [AUTO-REFRESH] Refresh token invalid/expired. Butuh re-auth manual.');
      console.log('   Jalankan: npx tsx tools/refresh-youtube-token.ts');
      process.exit(0);
    }
    console.error('❌ [AUTO-REFRESH] Error:', err?.message || err);
    process.exit(1);
  }
}

main();