import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Assign or propagate a correlation ID for distributed tracing
    const correlationId = (req.headers['x-request-id'] as string) ?? randomUUID();
    res.setHeader('X-Request-Id', correlationId);

    const { method, url, ip } = req;
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const startMs = Date.now();

    this.logger.log(`→ ${method} ${url} | ip=${ip} | ua=${userAgent} | rid=${correlationId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startMs;
          this.logger.log(
            `← ${method} ${url} | ${res.statusCode} | ${ms}ms | rid=${correlationId}`,
          );
        },
        error: (err: unknown) => {
          const ms = Date.now() - startMs;
          const status = (err as { status?: number }).status ?? 500;
          this.logger.warn(
            `← ${method} ${url} | ${status} | ${ms}ms | rid=${correlationId}`,
          );
        },
      }),
    );
  }
}
