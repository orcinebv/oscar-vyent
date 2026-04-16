import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Global config — available via ConfigService everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: 'apps/api/.env',
    }),

    // Global rate limiting — individual routes can override with @Throttle()
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    DatabaseModule,
    AuditModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
