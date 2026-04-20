// ─── Seed Runner ─────────────────────────────────────────────────────────────
// Standalone script: ts-node apps/api/src/app/database/seeders/run-seed.ts
// Or via: npm run seed

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Product } from '../../modules/products/product.entity';
import { Order } from '../../modules/orders/order.entity';
import { OrderItem } from '../../modules/orders/order-item.entity';
import { Payment } from '../../modules/payments/payment.entity';
import { AuditLog } from '../../modules/audit/audit-log.entity';
import { SnakeNamingStrategy } from '../snake-naming.strategy';

dotenv.config({ path: 'apps/api/.env' });
dotenv.config({ path: '.env' });

const databaseUrl = process.env['DATABASE_URL'];

const ds = new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env['DB_HOST'] ?? 'localhost',
        port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
        database: process.env['DB_NAME'] ?? 'oscar_vyent',
        username: process.env['DB_USER'] ?? 'postgres',
        password: process.env['DB_PASS'] ?? '',
      }),
  ssl: process.env['DB_SSL'] === 'true' || databaseUrl?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
  entities: [Product, Order, OrderItem, Payment, AuditLog],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});

const SEED_PRODUCTS = [
  { name: 'Pom', description: 'Het nationale gerecht van Suriname. Malse kip met pomtajer (taro) en citrus, langzaam gegaard in de oven. Geserveerd met rijst.', price: 13.50, stock: 60, imageUrl: '/assets/products/pom.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Roti met Kerrie Kip', description: 'Zachte Surinaamse roti met malse kerrie kip, aardappel en bruine bonen. Bereid met huisgemaakte kerriemix.', price: 11.50, stock: 80, imageUrl: '/assets/products/roti.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Saoto Soep', description: 'Aromatische Surinaamse kippensoep met mihoen, taugé, hardgekookt ei, gebakken uitjes en een scheutje ketjap.', price: 7.50, stock: 100, imageUrl: '/assets/products/saoto.png', category: 'Soepen', isActive: true },
  { name: 'Bara (6 stuks)', description: 'Knapperige gefrituurde deegballetjes van spliterwten. Geserveerd met tamarinde chutney. Ideaal als snack of bij saoto.', price: 5.00, stock: 150, imageUrl: '/assets/products/bara.png', category: 'Snacks', isActive: true },
  { name: 'Moksi Alesi', description: 'Surinaamse rijst met zwarte oogbonen, gestoofde kip en gezouten vlees. Geserveerd met bakabana.', price: 12.00, stock: 70, imageUrl: '/assets/products/moksi-alesi.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Bruine Bonen met Rijst', description: 'Rijkgevulde bruine bonenstoof over witte rijst. Een klassiek Surinaams comfort food, bereid met verse kruiden.', price: 9.50, stock: 90, imageUrl: '/assets/products/bruine-bonen.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Baka Bana', description: 'Gefrituurd rijpe bakabana, krokant van buiten en zacht van binnen. Heerlijk als bijgerecht of snack.', price: 4.00, stock: 120, imageUrl: '/assets/products/baka-bana.png', category: 'Snacks', isActive: true },
  { name: 'Nasi Goreng', description: 'Surinaamse gebakken rijst met ei, kip, garnalen en groenten. Geserveerd met kroepoek en atjar.', price: 10.50, stock: 100, imageUrl: '/assets/products/nasi.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Bami Goreng', description: 'Surinaamse gebakken mihoen met kip, kool, taugé en ketjap. Geserveerd met een gebakken ei.', price: 10.50, stock: 100, imageUrl: '/assets/products/bami.png', category: 'Hoofdgerechten', isActive: true },
  { name: 'Broodje Pom', description: 'Knapperig broodje gevuld met warme pom. Dé Surinaamse klassieker om mee te nemen.', price: 6.50, stock: 80, imageUrl: '/assets/products/broodje-pom.png', category: 'Broodjes', isActive: true },
];

async function main(): Promise<void> {
  await ds.initialize();
  const repo = ds.getRepository(Product);
  await repo.clear();
  await repo.save(SEED_PRODUCTS.map(p => repo.create(p)));
  console.log(`Seeded ${SEED_PRODUCTS.length} demo products`);
}

main()
  .then(() => ds.destroy())
  .catch(console.error);
