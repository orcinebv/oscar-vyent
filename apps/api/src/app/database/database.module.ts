import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { Product } from '../modules/products/product.entity';
import { ProductExtra } from '../modules/extras/product-extra.entity';
import { ProductCombo } from '../modules/combos/product-combo.entity';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Payment } from '../modules/payments/payment.entity';
import { AuditLog } from '../modules/audit/audit-log.entity';
import { SnakeNamingStrategy } from './snake-naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const db = config.get('database', { infer: true });
        const nodeEnv = config.get('nodeEnv', { infer: true });
        return {
          type: 'postgres',
          host: db?.host,
          port: db?.port,
          database: db?.name,
          username: db?.user,
          password: db?.pass,
          entities: [Product, ProductExtra, ProductCombo, Order, OrderItem, Payment, AuditLog],
          migrations: ['dist/apps/api/app/database/migrations/*.js'],
          // synchronize is ALWAYS false — use migrations in all environments
          // to prevent accidental schema drift. See ADR-003.
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: false,
          logging: nodeEnv === 'development',
          ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
