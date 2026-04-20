import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load API key from root .env
const env = readFileSync(join(root, '.env'), 'utf-8');
const apiKey = env.match(/OPEN_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) throw new Error('OPEN_API_KEY not found in .env');

const OUTPUT_DIR = join(root, 'apps/web/src/assets/products');

const BG = 'dark walnut wooden table background, warm amber side lighting matching a cozy brown-toned restaurant, no text overlays';

const products = [
  { file: 'pom.png',         prompt: `Menu card food photo of Surinamese pom, golden-brown taro and chicken oven bake in a terracotta dish, caramelized crust, garnished with fresh parsley, ${BG}, shot from 45 degrees, 50mm f/2.8, sharp focus` },
  { file: 'roti.png',        prompt: `Menu card food photo of Surinamese roti, soft thin flatbread folded on a round plate with yellow curry chicken, chunks of potato and whole chickpeas, drizzle of golden curry sauce, ${BG}, overhead shot, 35mm f/2.5` },
  { file: 'saoto.png',       prompt: `Menu card food photo of Surinamese saoto soup in a wide ceramic bowl, steaming clear golden broth with vermicelli, bean sprouts, boiled egg halves, crispy fried shallots and a wedge of lime, ${BG}, 45 degree angle, 50mm f/2.8` },
  { file: 'bara.png',        prompt: `Menu card food photo of six Surinamese bara on a small wooden board, round golden-brown deep-fried split-pea fritters, small ramekin of tamarind chutney beside them, ${BG}, close-up 45 degree angle, 85mm f/2.5` },
  { file: 'moksi-alesi.png', prompt: `Menu card food photo of Surinamese moksi alesi, generous portion of seasoned rice with black-eyed peas, braised chicken pieces and two slices of golden fried plantain on the side, served on a dark plate, ${BG}, 45 degree angle shot, 50mm f/2.8` },
  { file: 'bruine-bonen.png',prompt: `Menu card food photo of Surinamese bruine bonen met rijst, rich dark brown kidney bean stew poured over fluffy white rice, garnished with a pinch of fresh thyme, served in a deep bowl, ${BG}, 45 degree angle, 50mm f/2.8` },
  { file: 'baka-bana.png',   prompt: `Menu card food photo of baka bana, four thick slices of deep-fried sweet plantain, caramelized golden-brown exterior with soft orange interior, served on parchment on a small wooden board, ${BG}, close-up 45 degree, 85mm f/2.5` },
  { file: 'nasi.png',        prompt: `Menu card food photo of Surinamese nasi goreng, wok-fried golden rice with egg, green onion, shrimp and chicken strips, served on a dark oval plate with prawn crackers on the side, ${BG}, 45 degree angle, 50mm f/2.8` },
  { file: 'bami.png',        prompt: `Menu card food photo of Surinamese bami goreng, stir-fried egg noodles with chicken strips, cabbage, bean sprouts and soy sauce glaze, served in a deep bowl with a fried egg on top, ${BG}, 45 degree angle, 50mm f/2.8` },
  { file: 'broodje-pom.png', prompt: `Menu card food photo of a broodje pom, a toasted Surinamese bread roll sliced open and generously filled with warm pom taro-chicken filling, served on brown parchment paper, ${BG}, close-up 45 degree angle, 85mm f/2.5` },
];

async function generateImage(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const json = await res.json();
  return json.data[0].url;
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buffer);
}

(async () => {
  console.log(`Generating ${products.length} product images with DALL-E 3...\n`);

  for (const { file, prompt } of products) {
    const dest = join(OUTPUT_DIR, file);
    process.stdout.write(`  ${file} ... `);
    try {
      const url = await generateImage(prompt);
      await downloadImage(url, dest);
      console.log('done');
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  console.log(`\nImages saved to apps/web/src/assets/products/`);
})();
