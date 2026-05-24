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

  @Column({ type: 'varchar', length: 10, name: 'item_type', default: 'product' })
  itemType!: 'product' | 'combo';

  // productId/comboId stored as reference only — name/price snapshotted below.
  @Column({ type: 'uuid', name: 'product_id', nullable: true })
  productId!: string | null;

  @Column({ type: 'uuid', name: 'combo_id', nullable: true })
  comboId!: string | null;

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

  /** Snapshot of selected extras at order time — never changes after creation */
  @Column({ type: 'jsonb', nullable: true, name: 'selected_extras' })
  selectedExtras!: string[] | null;
}
