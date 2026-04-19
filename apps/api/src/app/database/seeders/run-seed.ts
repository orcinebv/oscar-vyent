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
  { name: 'Stroopwafel Luxe Blik', description: 'Authentieke Hollandse stroopwafels in een luxe bewaarblik. Handgemaakt met vers karamel. Per blik 24 stuks.', price: 12.95, stock: 150, imageUrl: '/assets/products/stroopwafel.jpg', category: 'Levensmiddelen', isActive: true },
  { name: 'Delftsblauw Vaasje', description: 'Handgeschilderd Delfts blauw vaasje, 18cm hoog. Authentiek handwerk uit Delft.', price: 34.50, stock: 45, imageUrl: '/assets/products/delfts-blauw.jpg', category: 'Wonen & Decoratie', isActive: true },
  { name: 'Nederlandse Tulpenbollen (10 stuks)', description: 'Geselecteerde tulpenbollen van Nederlandse kwekers. Bloeitijd voorjaar.', price: 8.75, stock: 300, imageUrl: '/assets/products/tulpen.jpg', category: 'Tuin', isActive: true },
  { name: 'Gouda Kaas Oudbeleegd (500g)', description: 'Authentieke boerenkaas uit Gouda, minimaal 18 maanden gerijpt.', price: 11.25, stock: 80, imageUrl: '/assets/products/gouda-kaas.jpg', category: 'Levensmiddelen', isActive: true },
  { name: 'Klompen Souvenirpaar', description: 'Traditionele Nederlandse klompen, met de hand beschilderd.', price: 19.95, stock: 60, imageUrl: '/assets/products/klompen.jpg', category: 'Souvenirs', isActive: true },
  { name: 'Hagelslag Melkchocolade (400g)', description: 'De Ruijter melkchocolade hagelslag in familiepak.', price: 3.49, stock: 500, imageUrl: '/assets/products/hagelslag.jpg', category: 'Levensmiddelen', isActive: true },
  { name: 'Windmolen Miniatuur (hout)', description: 'Houten miniatuur windmolen, 25cm hoog. Handgemaakt en geschilderd.', price: 24.99, stock: 35, imageUrl: '/assets/products/windmolen.jpg', category: 'Wonen & Decoratie', isActive: true },
];

async function main(): Promise<void> {
  await ds.initialize();
  const repo = ds.getRepository(Product);
  const count = await repo.count();
  if (count > 0) {
    console.log(`Seeder skipped — ${count} products already exist`);
    return;
  }
  await repo.save(SEED_PRODUCTS.map(p => repo.create(p)));
  console.log(`Seeded ${SEED_PRODUCTS.length} demo products`);
}

main()
  .then(() => ds.destroy())
  .catch(console.error);
