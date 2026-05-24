import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('product_combos')
export class ProductCombo {
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  /** How many products the customer must pick from the pool */
  @Column({ type: 'int', default: 2, name: 'slot_count' })
  slotCount!: number;

  @ManyToMany(() => Product, { eager: false })
  @JoinTable({
    name: 'product_combo_items',
    joinColumn: { name: 'combo_id' },
    inverseJoinColumn: { name: 'product_id' },
  })
  products!: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
