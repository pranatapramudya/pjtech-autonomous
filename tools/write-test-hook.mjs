import fs from 'fs';
import path from 'path';

const content = `import { sanitizeBusinessName, getNicheHook } from "./src/pipeline/cli-outreach.ts";

console.log("=== VERIFIKASI SMART SANITIZER & HOOKS ===");
const raw1 = "Klinik Pratama Rawat Inap & Bersalin Dr. Hendra, Sp.A (Buka 24 Jam)";
const clean1 = sanitizeBusinessName(raw1);
console.log("RAW 1  :", raw1);
console.log("CLEAN 1:", clean1);
console.log("HOOK 1 :", getNicheHook("Klinik", clean1));

console.log("-----------------------------------------");
const raw2 = "CV. Kopi Kenangan Mantan - Cabang Dago Bandung";
const clean2 = sanitizeBusinessName(raw2);
console.log("RAW 2  :", raw2);
console.log("CLEAN 2:", clean2);
console.log("HOOK 2 :", getNicheHook("Kafe", clean2));

console.log("-----------------------------------------");
const raw3 = "FIT HUB Gym & Fitness Center (Lantai 2 Mall)";
const clean3 = sanitizeBusinessName(raw3);
console.log("RAW 3  :", raw3);
console.log("CLEAN 3:", clean3);
console.log("HOOK 3 :", getNicheHook("Gym", clean3));
`;

fs.writeFileSync(path.resolve(process.cwd(), '../one-sales-man/test-smart-hook.mjs'), content, 'utf-8');
console.log('Written test-smart-hook.mjs to one-sales-man');
