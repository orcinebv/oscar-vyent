import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';

// Mollie sends an HMAC-SHA256 signature in this header to prove authenticity.
// We verify it against the raw request body to prevent spoofed webhook calls.
// Reference: https://docs.mollie.com/docs/webhooks
const MOLLIE_SIGNATURE_HEADER = 'x-mollie-signature';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private readonly config: ConfigService<AppConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const secret = this.config.get('mollie', { infer: true })?.webhookSecret;

    // If no secret is configured (e.g. in development), skip verification.
    // Log a warning so developers are aware.
    if (!secret) {
      this.logger.warn(
        'MOLLIE_WEBHOOK_SECRET is not set — skipping webhook signature verification. ' +
          'This is insecure in production.',
      );
      return true;
    }

    const signature = request.headers[MOLLIE_SIGNATURE_HEADER] as string | undefined;
    if (!signature) {
      this.logger.warn('Webhook request missing Mollie-Signature header');
      throw new ForbiddenException('Missing webhook signature');
    }

    // rawBody is populated by NestFactory.create({ rawBody: true })
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('rawBody is not available — ensure rawBody: true in NestFactory.create()');
      throw new ForbiddenException('Webhook signature could not be verified');
    }

    const expected = createHmac('sha256', secret).update(rawBody as unknown as string).digest('hex');

    // timingSafeEqual prevents timing attacks
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer as unknown as Uint8Array, expBuffer as unknown as Uint8Array)) {
      this.logger.warn(`Webhook signature mismatch from ip=${request.ip}`);
      throw new ForbiddenException('Invalid webhook signature');
    }

    return true;
  }
}
