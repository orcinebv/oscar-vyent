import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';

// Stored as varchar — never use TypeORM enums which generate hard-to-migrate
// PostgreSQL enum types. See ADR-003.
export const ORDER_STATUSES = [
  'pending',
  'payment_pending',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'failed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Valid state transitions. Enforced in OrdersService.updateStatus().
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'failed', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
  failed: [],
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  customerEmail!: string;

  @Column({ type: 'varchar', length: 100 })
  customerFirstName!: string;

  @Column({ type: 'varchar', length: 100 })
  customerLastName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  customerPhone!: string | null;

  @Column({ type: 'text' })
  shippingAddress!: string;

  @Column({ type: 'varchar', length: 10 })
  shippingPostalCode!: string;

  @Column({ type: 'varchar', length: 100 })
  shippingCity!: string;

  @Column({ type: 'varchar', length: 2, default: 'NL' })
  shippingCountry!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, { nullable: true })
  payment!: Payment | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
