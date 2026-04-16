import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  // productId is stored as reference only — name/price are snapshotted below
  // so the order remains accurate even if the product is later updated.
  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  /** Snapshot of product name at time of order — never changes after creation */
  @Column({ type: 'varchar', length: 255 })
  productName!: string;

  /** Snapshot of unit price at time of order — never changes after creation */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;
}
