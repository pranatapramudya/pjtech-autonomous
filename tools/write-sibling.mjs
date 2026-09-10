import fs from 'fs';
import path from 'path';

const [targetRelativePath, base64Content] = process.argv.slice(2);

if (!targetRelativePath || !base64Content) {
  console.error('Usage: node write-sibling.mjs <targetPath> <base64Content>');
  process.exit(1);
}

const targetPath = path.resolve(process.cwd(), targetRelativePath);
const content = Buffer.from(base64Content, 'base64').toString('utf-8');

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, content, 'utf-8');
console.log('Successfully written to:', targetPath);
