import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, error } = this.resolveError(exception);

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Log full error details server-side; client only gets the structured response
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${statusCode}: ${JSON.stringify(message)}`);
    }

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null && 'message' in resp) {
        const r = resp as Record<string, unknown>;
        return {
          statusCode: status,
          message: r['message'] as string | string[],
          error: r['error'] as string ?? HttpStatus[status],
        };
      }
      return {
        statusCode: status,
        message: exception.message,
        error: HttpStatus[status] ?? 'Error',
      };
    }

    if (exception instanceof QueryFailedError) {
      // PostgreSQL unique constraint violation
      if ((exception as QueryFailedError & { code?: string }).code === '23505') {
        return { statusCode: 409, message: 'Resource already exists', error: 'Conflict' };
      }
      return { statusCode: 500, message: 'Database error', error: 'Internal Server Error' };
    }

    return {
      statusCode: 500,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    };
  }
}
