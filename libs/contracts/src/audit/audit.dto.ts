// ─── Audit Log Contracts ──────────────────────────────────────────────────────

export type AuditAction =
  | 'order_created'
  | 'order_status_changed'
  | 'payment_created'
  | 'payment_webhook_received'
  | 'payment_status_changed'
  | 'checkout_started'
  | 'stock_decremented'
  | 'stock_restored'
  | 'validation_failed'
  | 'webhook_signature_failed'
  | 'rate_limit_exceeded';

export type AuditActorType = 'customer' | 'system' | 'webhook';

export interface AuditLogDto {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorType: AuditActorType;
  actorIp: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
