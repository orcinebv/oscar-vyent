import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ProductExtra } from '../extras/product-extra.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) } })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_sold_out' })
  isSoldOut!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @ManyToMany(() => ProductExtra, (e) => e.products, { eager: false })
  @JoinTable({
    name: 'product_extras_map',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'product_extra_id' },
  })
  extras!: ProductExtra[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
