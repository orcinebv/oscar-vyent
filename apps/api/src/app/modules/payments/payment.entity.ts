import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';

export const PAYMENT_STATUSES = [
  'open',
  'pending',
  'authorized',
  'expired',
  'failed',
  'canceled',
  'paid',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Payment statuses that are considered terminal (no further updates expected) */
export const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  'expired',
  'failed',
  'canceled',
  'paid',
];

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'uuid', name: 'order_id', unique: true })
  orderId!: string;

  /** Mollie's internal payment ID (e.g. tr_xxxxxxx) */
  @Column({ type: 'varchar', length: 50, unique: true })
  molliePaymentId!: string;

  @Column({ type: 'varchar', length: 50, default: 'ideal' })
  method!: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency!: string;

  /** The Mollie-hosted checkout URL where the customer completes payment */
  @Column({ type: 'text', nullable: true })
  checkoutUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  webhookUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  redirectUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
