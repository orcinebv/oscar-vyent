import sharp from 'sharp';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const dir = 'apps/web/src/assets/products';
const files = readdirSync(dir).filter(f => f.endsWith('.svg'));

for (const file of files) {
  const input = join(dir, file);
  const output = join(dir, file.replace('.svg', '.png'));
  await sharp(input).resize(400, 400).png().toFile(output);
  unlinkSync(input);
  console.log(`✓ ${file} → ${file.replace('.svg', '.png')}`);
}
