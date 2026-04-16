// ─── TypeORM CLI Data Source ──────────────────────────────────────────────────
// Used exclusively by the TypeORM CLI for migrations.
// Do NOT use this in application code — use the TypeOrmModule injected connection.

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { Product } from '../modules/products/product.entity';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Payment } from '../modules/payments/payment.entity';
import { AuditLog } from '../modules/audit/audit-log.entity';

dotenv.config({ path: 'apps/api/.env' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  database: process.env['DB_NAME'] ?? 'oscar_vyent',
  username: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASS'] ?? '',
  entities: [Product, Order, OrderItem, Payment, AuditLog],
  migrations: ['apps/api/src/app/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: true,
});
