# ADR-001: NestJS over plain Express

**Date:** 2026-04-14
**Status:** Accepted
**Deciders:** Architecture team

---

## Context

We need a Node.js backend for a production ordering system that handles products, orders, payments, and audit logging. The backend must be maintainable, testable, and support strict input validation.

## Decision

Use **NestJS** as the backend framework.

## Rationale

- **Built-in Dependency Injection** — reduces coupling between services; makes testing with mocks straightforward
- **Module system** — maps directly to our domain (ProductsModule, OrdersModule, PaymentsModule, AuditModule) with clear boundaries
- **Decorator-driven validation** — `class-validator` + `class-transformer` + `ValidationPipe` provides strict, declarative input validation with minimal boilerplate
- **First-class TypeScript** — all NestJS internals are typed; no ambient type wrangling
- **Testing utilities** — `@nestjs/testing` provides `Test.createTestingModule()` for clean unit tests without starting the server
- **Active ecosystem** — `@nestjs/typeorm`, `@nestjs/config`, `@nestjs/throttler` are maintained by the core team

## Alternatives considered

- **Plain Express** — requires manually wiring routing, validation, DI, and error handling. Viable but produces bespoke, harder-to-onboard code
- **Fastify** — faster raw throughput, but smaller NestJS integration surface; not a bottleneck for our use case
- **Hono** — lightweight, modern, but lacks the module/DI ecosystem we need for this complexity

## Tradeoffs

- NestJS adds abstraction layers that can feel magical to developers unfamiliar with it (decorators, lifecycle hooks)
- Slightly larger bundle than Express due to `reflect-metadata` and core framework
- Framework lock-in — migrating away from NestJS would require restructuring

## Consequence

All backend code is written within NestJS module boundaries. Developers must understand the NestJS DI container and lifecycle to contribute effectively. The README includes a note on this.
