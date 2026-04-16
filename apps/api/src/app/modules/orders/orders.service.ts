import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, ORDER_TRANSITIONS } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuditActorType } from '@oscar-vyent/contracts';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Creates an order within a database transaction:
   * 1. Lock & validate stock for each product
   * 2. Decrement stock atomically
   * 3. Persist Order + OrderItems
   * 4. Emit audit log
   *
   * Rolls back fully if any step fails (e.g. insufficient stock).
   */
  async create(dto: CreateOrderDto, clientIp: string | null): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Load all products inside the transaction for locking
      const productMap = new Map<string, Product>();
      for (const item of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, isActive: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found or inactive`);
        }
        productMap.set(item.productId, product);
      }

      // Validate & decrement stock for each item
      for (const item of dto.items) {
        await this.productsService.decrementStock(
          item.productId,
          item.quantity,
          queryRunner.manager,
        );
      }

      // Build order items with price snapshots
      const orderItems: Partial<OrderItem>[] = dto.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = Number(product.price);
        return {
          productId: item.productId,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          totalPrice: unitPrice * item.quantity,
        };
      });

      const totalAmount = orderItems.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);

      const order = queryRunner.manager.create(Order, {
        customerEmail: dto.customerEmail,
        customerFirstName: dto.customerFirstName,
        customerLastName: dto.customerLastName,
        customerPhone: dto.customerPhone ?? null,
        shippingAddress: dto.shippingAddress,
        shippingPostalCode: dto.shippingPostalCode,
        shippingCity: dto.shippingCity,
        shippingCountry: dto.shippingCountry ?? 'NL',
        notes: dto.notes ?? null,
        status: 'pending',
        totalAmount,
        currency: 'EUR',
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Attach order reference to items and save
      const items = orderItems.map((i) => ({ ...i, orderId: savedOrder.id }));
      await queryRunner.manager.save(OrderItem, items);

      await queryRunner.commitTransaction();

      this.logger.log(`Order created: id=${savedOrder.id} total=${totalAmount} customer=${dto.customerEmail}`);

      // Audit is fire-and-forget — outside the transaction
      void this.auditService.log({
        action: 'order_created',
        entityType: 'order',
        entityId: savedOrder.id,
        actorType: 'customer',
        actorIp: clientIp,
        metadata: {
          email: dto.customerEmail,
          itemCount: dto.items.length,
          totalAmount,
          currency: 'EUR',
        },
      });

      // Reload with items for the response
      return this.findOne(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Order creation failed, transaction rolled back: ${String(err)}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'payment'],
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async findByEmail(email: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { customerEmail: email },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates order status, enforcing the allowed state machine transitions.
   * Throws BadRequestException for invalid transitions.
   */
  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    actorType: AuditActorType,
    actorIp: string | null,
  ): Promise<Order> {
    const order = await this.findOne(id);
    const allowed = ORDER_TRANSITIONS[order.status];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition order from "${order.status}" to "${newStatus}". ` +
          `Allowed: [${allowed.join(', ')}]`,
      );
    }

    const previousStatus = order.status;
    await this.orderRepo.update(id, { status: newStatus });

    void this.auditService.log({
      action: 'order_status_changed',
      entityType: 'order',
      entityId: id,
      actorType,
      actorIp,
      metadata: { from: previousStatus, to: newStatus },
    });

    return this.findOne(id);
  }
}
