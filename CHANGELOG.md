# Changelog

All notable architectural decisions and implementation milestones are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **Nx monorepo** — single workspace for `api`, `web`, and `contracts` library
- **NestJS API** (`apps/api`) — modular REST backend with products, orders, payments, audit modules
- **Angular 17 SPA** (`apps/web`) — standalone components, Angular Signals cart state
- **Shared contracts** (`libs/contracts`) — TypeScript DTOs shared between frontend and backend
- **Mollie iDEAL integration** — full payment lifecycle: create → webhook → verify → confirm
- **Audit log** — append-only `audit_logs` table for traceability of all key events
- **PostgreSQL + TypeORM** — relational schema with migrations, pessimistic locking for stock
- **ADR-001** — NestJS over plain Express
- **ADR-002** — Mollie over Stripe/PayPal for Dutch market
- **ADR-003** — PostgreSQL + TypeORM for relational integrity
- **ADR-004** — Angular Signals over NgRx for cart state
- **ADR-005** — No auth module in v1

### Security
- Helmet headers, strict CORS, rate limiting via @nestjs/throttler
- Mollie webhook HMAC-SHA256 signature verification
- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- Idempotency guard on payment creation (checks for existing open payment)
- Stock restoration on payment failure (transactional)

### Architecture Decisions
- `synchronize: false` in TypeORM across all environments — migrations only
- Webhook-first payment confirmation — redirect params never trusted
- Pessimistic row-level locking for concurrent stock decrements
- Append-only audit log — never updated or deleted

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Use Nx monorepo | Shared contracts, affected builds, unified tooling |
| 2026-04-14 | NestJS over Express | DI, modules, decorator validation, testability |
| 2026-04-14 | Mollie over Stripe | iDEAL native, NL market focus, lower fees |
| 2026-04-14 | PostgreSQL + TypeORM | ACID for orders/payments, relational integrity |
| 2026-04-14 | Angular Signals for cart | No NgRx boilerplate, built-in reactivity |
| 2026-04-14 | No auth v1 | Minimize checkout friction, email-identified orders |
| 2026-04-14 | `synchronize: false` always | Prevent schema drift, reproducible migrations |
