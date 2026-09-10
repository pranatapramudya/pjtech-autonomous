import path from 'path';

const SIBLING_DIR = path.resolve(process.cwd(), '../one-sales-man');
const CLI_OUTREACH = path.join(SIBLING_DIR, 'src/pipeline/cli-outreach.ts');

async function test() {
  const { sanitizeBusinessName, getNicheHook } = await import(`file://${CLI_OUTREACH}`);

  console.log('=== TEST SMART SANITIZER & HOOKS ===');
  const sample1 = 'Klinik Pratama Rawat Inap & Bersalin Dr. Hendra, Sp.A (Buka 24 Jam)';
  const sample2 = 'CV. Kopi Kenangan Mantan - Cabang Dago Bandung';
  const sample3 = 'FIT HUB Gym & Fitness Center (Lantai 2 Mall)';
  const sample4 = 'Bengkel Mobil Maju Jaya Spesialis AC & Kaki-kaki (Murah)';

  const clean1 = sanitizeBusinessName(sample1);
  const clean2 = sanitizeBusinessName(sample2);
  const clean3 = sanitizeBusinessName(sample3);
  const clean4 = sanitizeBusinessName(sample4);

  console.log('RAW 1:', sample1);
  console.log('CLEAN 1:', clean1);
  console.log('HOOK 1:\n', getNicheHook('Klinik', clean1));
  console.log('-------------------------------------------');
  console.log('RAW 2:', sample2);
  console.log('CLEAN 2:', clean2);
  console.log('HOOK 2:\n', getNicheHook('Kafe', clean2));
  console.log('-------------------------------------------');
  console.log('RAW 3:', sample3);
  console.log('CLEAN 3:', clean3);
  console.log('HOOK 3:\n', getNicheHook('Gym', clean3));
  console.log('-------------------------------------------');
  console.log('RAW 4:', sample4);
  console.log('CLEAN 4:', clean4);
  console.log('HOOK 4:\n', getNicheHook('Bengkel', clean4));
}

test();
