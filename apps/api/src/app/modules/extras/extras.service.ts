import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductExtra } from './product-extra.entity';
import { CreateProductExtraDto } from './dto/create-product-extra.dto';
import { UpdateProductExtraDto } from './dto/update-product-extra.dto';

@Injectable()
export class ExtrasService {
  constructor(
    @InjectRepository(ProductExtra)
    private readonly extrasRepo: Repository<ProductExtra>,
  ) {}

  findAll(): Promise<ProductExtra[]> {
    return this.extrasRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async reorder(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id, index) => this.extrasRepo.update(id, { sortOrder: index })));
  }

  async findOne(id: string): Promise<ProductExtra> {
    const extra = await this.extrasRepo.findOne({ where: { id } });
    if (!extra) throw new NotFoundException(`Extra ${id} not found`);
    return extra;
  }

  create(dto: CreateProductExtraDto): Promise<ProductExtra> {
    const extra = this.extrasRepo.create({
      name: dto.name,
      defaultForCategories: dto.defaultForCategories ?? [],
      isActive: true,
    });
    return this.extrasRepo.save(extra);
  }

  async update(id: string, dto: UpdateProductExtraDto): Promise<ProductExtra> {
    const extra = await this.findOne(id);
    Object.assign(extra, dto);
    return this.extrasRepo.save(extra);
  }

  async remove(id: string): Promise<void> {
    const extra = await this.findOne(id);
    await this.extrasRepo.remove(extra);
  }
}
