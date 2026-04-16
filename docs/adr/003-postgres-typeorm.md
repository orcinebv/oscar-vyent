# ADR-003: PostgreSQL + TypeORM over MongoDB

**Date:** 2026-04-14
**Status:** Accepted
**Deciders:** Architecture team

---

## Context

We need a database to store products, orders, payments, and audit logs. The domain has strong relational requirements (orders reference products, payments reference orders, order items are tied to orders).

## Decision

Use **PostgreSQL 15+** with **TypeORM** as the ORM.

## Rationale

### PostgreSQL
- **ACID transactions** — order creation decrements stock and creates order items atomically; rollback on any failure guarantees consistency
- **Referential integrity** — foreign keys between `orders → order_items` and `orders → payments` enforce correctness at the DB level
- **Row-level locking** — `SELECT ... FOR UPDATE` (pessimistic locking) prevents overselling when concurrent customers order the same last-in-stock item
- **JSONB** — `AuditLog.metadata` uses `jsonb` for flexible structured context without sacrificing query capability
- **Mature, well-supported** — extensive hosting options (Neon, Supabase, RDS, Railway), excellent tooling

### TypeORM
- First-class NestJS integration via `@nestjs/typeorm`
- Decorator-based entity definitions co-located with domain code
- `QueryRunner` and `DataSource` provide explicit transaction control
- Migration support for schema evolution without `synchronize: true`

## Alternatives considered

- **MongoDB** — flexible schema, but we have well-defined relational data with referential requirements; MongoDB's multi-document transactions are more complex and less ergonomic for this use case
- **Prisma** — excellent DX and type safety, but less flexible for manual transaction control with `QueryRunner`; also adds a build step (Prisma Client generation)
- **Drizzle ORM** — lightweight and type-safe, but less mature NestJS ecosystem at time of writing

## Key Constraints

- `synchronize: false` is hard-coded in all environments. Schema changes must go through TypeORM migrations. This prevents accidental destructive schema changes in development.
- Migrations are stored in `apps/api/src/app/database/migrations/`. Each migration is hand-reviewed before applying.
- `ORDER_STATUSES` is stored as `varchar` (not a PostgreSQL `ENUM` type) to avoid painful ALTER TYPE operations during migrations.

## Tradeoffs

- TypeORM has historically had N+1 query issues with eager relations — use `relations` option and `QueryBuilder` judiciously
- More rigid than a document store for schema-free data (only `AuditLog.metadata` needs this; solved with `jsonb`)
- Migration management is a developer responsibility — engineers must generate and review migrations on entity changes
