import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Ip,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookSignatureGuard } from '../../common/guards/webhook-signature.guard';
import { CreatePaymentResponseDto, PaymentStatusDto } from '@oscar-vyent/contracts';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /** Initiate a Mollie payment for an order. Rate-limited to 5/min. */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(
    @Body() dto: CreatePaymentDto,
    @Ip() ip: string,
  ): Promise<CreatePaymentResponseDto> {
    return this.paymentsService.create(dto, ip);
  }

  /**
   * Poll payment status. Rate-limited to 20/min to prevent excessive polling.
   * Returns cached DB status; refreshes from Mollie if still non-terminal.
   */
  @Get(':id/status')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async getStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.getStatus(id);
  }

  /**
   * Mollie webhook endpoint.
   *
   * SECURITY: Signature verified by WebhookSignatureGuard before any logic runs.
   * Always returns 200 — Mollie retries on non-2xx, which could cause duplicate processing.
   * Idempotency is handled inside PaymentsService.handleWebhook().
   *
   * Mollie sends: Content-Type: application/x-www-form-urlencoded, body: id=tr_xxxxx
   */
  @Post('webhook')
  @SkipThrottle()
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body('id') molliePaymentId: string, @Ip() ip: string): Promise<void> {
    this.logger.log(`Webhook received for molliePaymentId=${molliePaymentId}`);

    if (!molliePaymentId) {
      this.logger.warn('Webhook called without id in body');
      return; // Still return 200 — no id means nothing to process
    }

    // Process asynchronously — return 200 immediately to Mollie
    // Mollie has a 5-second webhook timeout; processing must be fast
    void this.paymentsService.handleWebhook(molliePaymentId, ip);
  }
}
