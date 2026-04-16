import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './app/common/filters/global-exception.filter';
import { LoggingInterceptor } from './app/common/interceptors/logging.interceptor';
import { AppConfig } from './app/config/configuration';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // rawBody: true is REQUIRED for Mollie webhook signature verification.
    // The WebhookSignatureGuard reads req.rawBody to compute the HMAC.
    rawBody: true,
    bufferLogs: true,
  });

  const config = app.get(ConfigService<AppConfig>);
  const port = config.get('port', { infer: true }) ?? 3000;
  const allowedOrigins = config.get('app', { infer: true })?.allowedOrigins ?? [];
  const nodeEnv = config.get('nodeEnv', { infer: true });

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  });

  // ── Global API prefix ───────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global validation — strict input sanitization ───────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties
      transform: true,          // auto-transform to DTO class types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter ─────────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global request/response logging ────────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port);

  logger.log(`Application running in ${nodeEnv} mode on http://localhost:${port}/api`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
