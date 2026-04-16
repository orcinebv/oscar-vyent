# Oscar Vyent — Dutch Ordering & Checkout Platform

A production-grade ordering and checkout application built for the Dutch/European market, featuring iDEAL payments via Mollie.

## Architecture Overview

```
oscar-vyent/                 # Nx monorepo
├── apps/
│   ├── api/                 # NestJS REST API (Node.js backend)
│   └── web/                 # Angular 17 SPA (standalone + Signals)
├── libs/
│   └── contracts/           # Shared TypeScript DTOs & interfaces
└── docs/
    ├── adr/                 # Architecture Decision Records
    └── diagrams/            # Sequence diagrams
```

### Why Nx?
Single monorepo with affected-build computation, shared `contracts` library between frontend and backend, unified lint/test/build commands, and caching.

### Why NestJS?
Modular architecture, built-in DI, decorator-driven validation with `class-validator`, and first-class TypeScript support. See [ADR-001](docs/adr/001-nestjs-over-express.md).

### Why Mollie + iDEAL?
iDEAL is the dominant Dutch online payment method (65%+ of transactions). Mollie provides the best developer experience for NL-focused integrations. See [ADR-002](docs/adr/002-mollie-ideal.md).

### Why PostgreSQL + TypeORM?
Orders, payments, and inventory have strong relational integrity requirements. ACID transactions are essential for stock management. See [ADR-003](docs/adr/003-postgres-typeorm.md).

### Why Angular Signals?
Built-in reactivity for cart state management without NgRx boilerplate. `signal()`, `computed()`, and `effect()` are sufficient for the cart domain. See [ADR-004](docs/adr/004-angular-signals.md).

---

## Payment Flow

```
Customer → fills cart & checkout form
    ↓
POST /api/orders → order created (status: pending), stock decremented
    ↓
POST /api/payments → Mollie payment created, order → payment_pending
    ↓
Frontend redirects → window.location.href = checkoutUrl (Mollie iDEAL)
    ↓
Customer completes iDEAL at bank
    ↓
Mollie → POST /api/payments/webhook (HMAC-SHA256 verified)
Backend fetches definitive status from Mollie API (never trusts redirect)
Order status updated → paid | failed | cancelled | expired
    ↓
Mollie redirects → /payment/return?orderId=xxx
Frontend polls GET /api/payments/:id/status every 3s (max 30s)
    ↓
Navigate to /orders/:id (order status page)
```

See full diagram: [docs/diagrams/payment-flow.md](docs/diagrams/payment-flow.md)

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Mollie test API key ([get one free](https://www.mollie.com/dashboard))

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# Create database
createdb oscar_vyent

# Run migrations
npm run migration:run

# Seed demo products
npm run seed

# Start both apps (separate terminals)
npm run api     # NestJS on http://localhost:3000
npm run web     # Angular on http://localhost:4200
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `oscar_vyent` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASS` | Database password | `secret` |
| `MOLLIE_API_KEY` | Mollie API key (`test_` or `live_`) | `test_xxxx` |
| `MOLLIE_WEBHOOK_SECRET` | HMAC secret for webhook verification | `whsec_xxxx` |
| `APP_BASE_URL` | Backend public URL (for Mollie callbacks) | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL (for Mollie redirect) | `http://localhost:4200` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:4200` |

### Mollie Test Mode
Use a `test_` prefixed API key. Test payments can be simulated at `https://www.mollie.com/checkout/test-mode`.

---

## Commands

```bash
# Development
npm run dev            # Start api + web in parallel
npm run api            # Start NestJS only
npm run web            # Start Angular only

# Building
npm run build          # Build all apps + libs

# Testing
npm run test           # Test all projects
npm run test:api       # Test NestJS only
npm run test:web       # Test Angular only

# Database
npm run migration:run      # Apply pending migrations
npm run migration:generate # Generate new migration from entity changes
npm run migration:revert   # Revert last migration
npm run seed               # Seed demo products
```

---

## Key Design Decisions

- **No user accounts in v1**: orders are identified by email. Reduces checkout friction. See [ADR-005](docs/adr/005-no-auth-v1.md).
- **Webhook-first payment confirmation**: redirect params are never trusted; always verify server-side via Mollie API.
- **Pessimistic locking for stock**: `SELECT ... FOR UPDATE` prevents overselling under concurrent load.
- **Append-only audit log**: `AuditLog` records are never updated or deleted — full traceability.
- **`synchronize: false` always**: TypeORM schema sync disabled in all environments — use migrations.

---

## Project Structure

### API (`apps/api/src/app/`)
- `config/` — typed environment configuration
- `database/` — TypeORM setup, migrations, seeders
- `modules/products/` — product catalog
- `modules/orders/` — order lifecycle + state machine
- `modules/payments/` — Mollie integration, webhook handling
- `modules/audit/` — append-only audit trail
- `common/` — global exception filter, logging interceptor, webhook guard

### Web (`apps/web/src/app/`)
- `core/services/` — cart (signals), HTTP services
- `features/` — catalog, cart, checkout, payment, orders (lazy-loaded)
- `shared/components/` — header, product-card, loading-spinner, toast, checkout-steps

### Contracts (`libs/contracts/src/`)
- Shared DTOs and response types used by both API and Web
