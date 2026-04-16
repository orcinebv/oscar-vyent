import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { AuditAction, AuditActorType } from '@oscar-vyent/contracts';

// Audit logs are APPEND-ONLY — no UpdateDateColumn, no soft-delete.
// Records must never be modified or removed. See auditability requirements.

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60 })
  action!: AuditAction;

  /** The domain entity type (e.g. 'order', 'payment', 'product') */
  @Column({ type: 'varchar', length: 50 })
  entityType!: string;

  /** The domain entity UUID this event relates to */
  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'varchar', length: 20 })
  actorType!: AuditActorType;

  @Column({ type: 'inet', nullable: true })
  actorIp!: string | null;

  /** Arbitrary structured context for this event — schema varies by action */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
