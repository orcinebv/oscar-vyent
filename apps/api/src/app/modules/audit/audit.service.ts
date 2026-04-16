import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditAction, AuditActorType } from '@oscar-vyent/contracts';

export interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorType: AuditActorType;
  actorIp?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Records an audit event to the database and structured logs.
   *
   * Fire-and-forget: errors are swallowed to ensure audit failures never
   * interrupt the main business flow. All audit events also appear in
   * Winston structured logs as a secondary audit trail.
   */
  async log(params: AuditLogParams): Promise<void> {
    const entry = this.auditRepo.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorType: params.actorType,
      actorIp: params.actorIp ?? null,
      metadata: params.metadata ?? null,
    });

    // Structured log mirrors the DB record — useful when DB is unavailable
    this.logger.log(
      JSON.stringify({
        audit: true,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        actorType: params.actorType,
        actorIp: params.actorIp,
        metadata: params.metadata,
        ts: new Date().toISOString(),
      }),
    );

    try {
      await this.auditRepo.save(entry);
    } catch (err) {
      // Audit failure must not break the caller
      this.logger.error(`Failed to persist audit log [${params.action}]: ${String(err)}`);
    }
  }
}
