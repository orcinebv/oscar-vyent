import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { ExtrasModule } from './modules/extras/extras.module';
import { CombosModule } from './modules/combos/combos.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditModule } from './modules/audit/audit.module';
import { UploadModule } from './modules/upload/upload.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
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
    UploadModule,
    SettingsModule,
    AuthModule,
    ExtrasModule,
    CombosModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
