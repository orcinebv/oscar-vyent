import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { ProductCombo } from './product-combo.entity';
import { Product } from '../products/product.entity';
import { CreateProductComboDto } from './dto/create-product-combo.dto';
import { UpdateProductComboDto } from './dto/update-product-combo.dto';

@Injectable()
export class CombosService {
  private readonly logger = new Logger(CombosService.name);

  constructor(
    @InjectRepository(ProductCombo)
    private readonly comboRepo: Repository<ProductCombo>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(includeInactive = false): Promise<ProductCombo[]> {
    return this.comboRepo.find({
      where: includeInactive ? undefined : { isActive: true },
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductCombo> {
    const combo = await this.comboRepo.findOne({
      where: { id, isActive: true },
      relations: ['products'],
    });
    if (!combo) throw new NotFoundException(`Combo ${id} not found`);
    return combo;
  }

  async create(dto: CreateProductComboDto): Promise<ProductCombo> {
    const combo = this.comboRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock ?? 0,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      category: dto.category ?? null,
      slotCount: dto.slotCount ?? 2,
    });
    combo.products = dto.productIds?.length
      ? await this.productRepo.findBy({ id: In(dto.productIds) })
      : [];
    return this.comboRepo.save(combo);
  }

  async update(id: string, dto: UpdateProductComboDto): Promise<ProductCombo> {
    const combo = await this.comboRepo.findOne({ where: { id }, relations: ['products'] });
    if (!combo) throw new NotFoundException(`Combo ${id} not found`);
    const { productIds, ...fields } = dto;
    Object.assign(combo, fields);
    if (productIds !== undefined) {
      combo.products = productIds.length > 0
        ? await this.productRepo.findBy({ id: In(productIds) })
        : [];
    }
    return this.comboRepo.save(combo);
  }

  async remove(id: string): Promise<void> {
    const combo = await this.comboRepo.findOne({ where: { id } });
    if (!combo) throw new NotFoundException(`Combo ${id} not found`);
    await this.comboRepo.remove(combo);
  }

  async decrementStock(comboId: string, quantity: number, manager: EntityManager): Promise<void> {
    const combo = await manager.findOne(ProductCombo, {
      where: { id: comboId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!combo) throw new NotFoundException(`Combo ${comboId} not found`);
    if (combo.stock < quantity) {
      throw new ConflictException(
        `Insufficient stock for combo "${combo.name}" (requested: ${quantity}, available: ${combo.stock})`,
      );
    }
    await manager.update(ProductCombo, comboId, { stock: combo.stock - quantity });
    this.logger.log(`Combo stock decremented: combo=${comboId} qty=${quantity}`);
  }

  async restoreStock(comboId: string, quantity: number, manager: EntityManager): Promise<void> {
    await manager.increment(ProductCombo, { id: comboId }, 'stock', quantity);
    this.logger.log(`Combo stock restored: combo=${comboId} qty=${quantity}`);
  }
}
