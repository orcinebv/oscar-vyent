import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './app/common/filters/global-exception.filter';
import { LoggingInterceptor } from './app/common/interceptors/logging.interceptor';
import { AppConfig } from './app/config/configuration';
import type { Request, Response } from 'express';

let cachedApp: express.Express | undefined;

async function createApp(): Promise<express.Express> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    rawBody: true,
    bufferLogs: true,
  });

  const config = app.get(ConfigService<AppConfig>);
  const allowedOrigins = config.get('app', { infer: true })?.allowedOrigins ?? [];

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.init();

  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await createApp();
  app(req, res);
}
