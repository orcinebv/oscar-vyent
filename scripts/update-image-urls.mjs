import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, 'apps/api/.env'), 'utf-8');
const get = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim();

const client = new pg.Client({
  host: get('DB_HOST'),
  port: Number(get('DB_PORT')),
  database: get('DB_NAME'),
  user: get('DB_USER'),
  password: get('DB_PASS'),
});

const updates = [
  ['Stroopwafel Luxe Blik',               '/assets/products/stroopwafel.jpg'],
  ['Delftsblauw Vaasje',                  '/assets/products/delfts-blauw.jpg'],
  ['Nederlandse Tulpenbollen (10 stuks)', '/assets/products/tulpen.jpg'],
  ['Gouda Kaas Oudbeleegd (500g)',        '/assets/products/gouda-kaas.jpg'],
  ['Klompen Souvenirpaar (maat 38)',      '/assets/products/klompen.jpg'],
  ['Hagelslag Melkchocolade (400g)',      '/assets/products/hagelslag.jpg'],
  ['Windmolen Miniatuur (hout)',          '/assets/products/windmolen.jpg'],
  ['AdvocaatЛикeur (500ml)',              '/assets/products/advocaat.jpg'],
];

await client.connect();

for (const [name, url] of updates) {
  const res = await client.query(
    `UPDATE products SET image_url = $1 WHERE name = $2`,
    [url, name]
  );
  console.log(`${res.rowCount > 0 ? '✓' : '✗'} ${name}`);
}

await client.end();
console.log('\nKlaar.');
