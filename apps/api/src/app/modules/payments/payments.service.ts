import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createMollieClient, MollieClient, PaymentMethod, PaymentStatus as MolliePaymentStatus } from '@mollie/api-client';
import { Payment, PaymentStatus, TERMINAL_PAYMENT_STATUSES } from './payment.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AppConfig } from '../../config/configuration';
import { CreatePaymentResponseDto, PaymentStatusDto } from '@oscar-vyent/contracts';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mollieClient: MollieClient;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService<AppConfig>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {
    const apiKey = this.config.get('mollie', { infer: true })?.apiKey;
    if (!apiKey) {
      throw new Error('MOLLIE_API_KEY is required');
    }
    this.mollieClient = createMollieClient({ apiKey });
  }

  /**
   * Creates a Mollie payment for the given order.
   *
   * Idempotency: if an open/pending payment already exists for this order,
   * the existing checkout URL is returned without creating a duplicate.
   *
   * CRITICAL: Mollie requires amount.value as a string with exactly 2 decimal
   * places (e.g. "10.00", NOT 10). This is enforced by toFixed(2).
   */
  async create(dto: CreatePaymentDto, clientIp: string | null): Promise<CreatePaymentResponseDto> {
    const order = await this.ordersService.findOne(dto.orderId);

    if (order.status !== 'pending' && order.status !== 'payment_pending') {
      throw new BadRequestException(
        `Cannot create payment for order in status "${order.status}"`,
      );
    }

    // Idempotency: return existing payment if still open/pending
    const existing = await this.paymentRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existing && (existing.status === 'open' || existing.status === 'pending')) {
      this.logger.log(`Returning existing open payment for order=${dto.orderId}`);
      return {
        paymentId: existing.id,
        orderId: dto.orderId,
        checkoutUrl: existing.checkoutUrl!,
        method: existing.method,
      };
    }

    const baseUrl = this.config.get('app', { infer: true })?.baseUrl;
    const frontendUrl = this.config.get('app', { infer: true })?.frontendUrl;

    const webhookUrl = `${baseUrl}/api/payments/webhook`;
    const redirectUrl = `${frontendUrl}/payment/return?orderId=${order.id}`;

    // Mollie requires exactly 2 decimal places as a string
    const amountValue = Number(order.totalAmount).toFixed(2);

    this.logger.log(`Creating Mollie payment for order=${order.id} amount=${amountValue}`);

    const molliePayment = await this.mollieClient.payments.create({
      amount: { currency: 'EUR', value: amountValue },
      method: PaymentMethod.ideal,
      description: `Order ${order.id.slice(0, 8).toUpperCase()} — Oscar Vyent`,
      redirectUrl,
      webhookUrl,
      metadata: { orderId: order.id },
    });

    const checkoutUrl = molliePayment._links.checkout?.href ?? null;
    if (!checkoutUrl) {
      throw new BadRequestException('Mollie did not return a checkout URL');
    }

    const payment = this.paymentRepo.create({
      orderId: order.id,
      molliePaymentId: molliePayment.id,
      method: dto.method ?? 'ideal',
      status: 'open',
      amount: Number(order.totalAmount),
      currency: 'EUR',
      checkoutUrl,
      webhookUrl,
      redirectUrl,
    });

    await this.paymentRepo.save(payment);

    // Move order to payment_pending
    await this.ordersService.updateStatus(order.id, 'payment_pending', 'system', null);

    void this.auditService.log({
      action: 'payment_created',
      entityType: 'payment',
      entityId: payment.id,
      actorType: 'customer',
      actorIp: clientIp,
      metadata: {
        orderId: order.id,
        molliePaymentId: molliePayment.id,
        amount: amountValue,
        method: dto.method ?? 'ideal',
      },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      checkoutUrl,
      method: payment.method,
    };
  }

  /**
   * Handles the Mollie webhook for a payment status update.
   *
   * SECURITY:
   * - Signature is verified by WebhookSignatureGuard before this is called.
   * - We NEVER trust the status from the webhook body — we always fetch the
   *   definitive status from Mollie's API.
   *
   * Idempotency: if the payment is already in a terminal state, we skip processing.
   */
  async handleWebhook(molliePaymentId: string, webhookIp: string | null): Promise<void> {
    void this.auditService.log({
      action: 'payment_webhook_received',
      entityType: 'payment',
      entityId: molliePaymentId,
      actorType: 'webhook',
      actorIp: webhookIp,
      metadata: { molliePaymentId },
    });

    // Fetch definitive status from Mollie — never trust webhook body content
    const molliePayment = await this.mollieClient.payments.get(molliePaymentId);
    const mollieStatus = molliePayment.status as MolliePaymentStatus;

    const payment = await this.paymentRepo.findOne({
      where: { molliePaymentId },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.warn(`Webhook for unknown molliePaymentId: ${molliePaymentId}`);
      return; // Return 200 to Mollie anyway — retrying won't help
    }

    // Idempotency: already terminal — no further processing needed
    if (TERMINAL_PAYMENT_STATUSES.includes(payment.status)) {
      this.logger.log(`Payment ${payment.id} already in terminal state: ${payment.status}`);
      return;
    }

    const newPaymentStatus = mollieStatus as PaymentStatus;
    const previousPaymentStatus = payment.status;

    await this.paymentRepo.update(payment.id, { status: newPaymentStatus });

    void this.auditService.log({
      action: 'payment_status_changed',
      entityType: 'payment',
      entityId: payment.id,
      actorType: 'webhook',
      actorIp: webhookIp,
      metadata: { from: previousPaymentStatus, to: newPaymentStatus, molliePaymentId },
    });

    // Map payment result to order status
    if (newPaymentStatus === 'paid') {
      await this.ordersService.updateStatus(payment.orderId, 'paid', 'webhook', webhookIp);
    } else if (['failed', 'expired', 'canceled'].includes(newPaymentStatus)) {
      await this.ordersService.updateStatus(payment.orderId, 'failed', 'webhook', webhookIp);

      // Restore stock on payment failure
      await this.restoreStockForOrder(payment.orderId, webhookIp);
    }
  }

  async getStatus(paymentId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    // If still in a non-terminal state, fetch fresh status from Mollie
    if (!TERMINAL_PAYMENT_STATUSES.includes(payment.status)) {
      try {
        const molliePayment = await this.mollieClient.payments.get(payment.molliePaymentId);
        if (molliePayment.status !== payment.status) {
          await this.paymentRepo.update(payment.id, {
            status: molliePayment.status as PaymentStatus,
          });
          payment.status = molliePayment.status as PaymentStatus;
        }
      } catch (err) {
        // Log but don't fail — return cached status
        this.logger.warn(`Could not refresh Mollie status for payment=${paymentId}: ${String(err)}`);
      }
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      orderStatus: payment.order?.status ?? 'unknown',
    };
  }

  private async restoreStockForOrder(orderId: string, ip: string | null): Promise<void> {
    const order = await this.ordersService.findOne(orderId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        await this.productsService.restoreStock(
          item.productId,
          item.quantity,
          queryRunner.manager,
        );
      }
      await queryRunner.commitTransaction();

      void this.auditService.log({
        action: 'stock_restored',
        entityType: 'order',
        entityId: orderId,
        actorType: 'system',
        actorIp: ip,
        metadata: { itemCount: order.items.length },
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Stock restoration failed for order=${orderId}: ${String(err)}`);
    } finally {
      await queryRunner.release();
    }
  }
}
