import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const products = await this.productRepo
      .createQueryBuilder('p')
      .whereInIds(ids)
      .andWhere('p.is_active = true')
      .getMany();
    return products;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.productRepo.save(product);
  }

  /**
   * Decrement stock within an active QueryRunner transaction.
   * Uses pessimistic write lock to prevent overselling under concurrent load.
   * Throws ConflictException if stock is insufficient.
   */
  async decrementStock(
    productId: string,
    quantity: number,
    manager: EntityManager,
  ): Promise<void> {
    // Lock the row for the duration of the transaction
    const product = await manager.findOne(Product, {
      where: { id: productId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (product.stock < quantity) {
      throw new ConflictException(
        `Insufficient stock for "${product.name}" (requested: ${quantity}, available: ${product.stock})`,
      );
    }

    await manager.update(Product, productId, { stock: product.stock - quantity });
    this.logger.log(`Stock decremented: product=${productId} qty=${quantity} remaining=${product.stock - quantity}`);
  }

  /**
   * Restore stock within an active QueryRunner transaction.
   * Called when a payment fails/expires/is cancelled to release held inventory.
   */
  async restoreStock(
    productId: string,
    quantity: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.increment(Product, { id: productId }, 'stock', quantity);
    this.logger.log(`Stock restored: product=${productId} qty=${quantity}`);
  }
}
