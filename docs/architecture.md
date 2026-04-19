# Oscar Vyent — Projectarchitectuur

## Stack

| Laag | Technologie |
|---|---|
| Frontend | Angular 21 (`apps/web`) |
| Backend | NestJS (`apps/api`) |
| Database | PostgreSQL via TypeORM 0.3 |
| Betalingen | Mollie iDEAL |
| Monorepo | Nx |
| Package manager | npm |

---

## Mappenstructuur

```
oscar-vyent/
├── apps/
│   ├── api/                          # NestJS REST API
│   │   └── src/
│   │       ├── main.ts               # Lokale bootstrap (app.listen)
│   │       ├── serverless.ts         # Vercel serverless adapter
│   │       └── app/
│   │           ├── app.module.ts
│   │           ├── config/           # ConfigModule (configuration.ts)
│   │           ├── common/
│   │           │   ├── filters/      # GlobalExceptionFilter
│   │           │   └── interceptors/ # LoggingInterceptor
│   │           ├── database/
│   │           │   ├── data-source.ts        # TypeORM CLI data source
│   │           │   ├── snake-naming.strategy.ts
│   │           │   └── migrations/           # TypeORM migraties
│   │           └── modules/
│   │               ├── products/     # Product entity + controller + service
│   │               ├── orders/       # Order + OrderItem entities
│   │               ├── payments/     # Mollie integratie + webhook guard
│   │               └── audit/        # AuditLog entity
│   └── web/                          # Angular 21 frontend
│       └── src/
│           ├── main.ts
│           └── app/
│               ├── core/
│               │   └── services/     # cart.service.ts, etc.
│               └── features/
│                   ├── cart/
│                   └── checkout/
├── libs/
│   └── contracts/                    # Gedeelde TypeScript types/interfaces
│       └── src/index.ts
├── docs/
│   └── architecture.md               # Dit bestand
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD: lint → test → migrate → vercel deploy
├── vercel.json                       # Vercel routing config
├── docker-compose.yml                # Lokale PostgreSQL dev omgeving
├── nx.json
├── tsconfig.base.json
└── package.json
```

---

## Entities (TypeORM)

| Entity | Tabel | Relaties |
|---|---|---|
| `Product` | `products` | — |
| `Order` | `orders` | heeft meerdere `OrderItem` |
| `OrderItem` | `order_items` | behoort tot `Order`, ref `Product` |
| `Payment` | `payments` | behoort tot `Order` |
| `AuditLog` | `audit_logs` | — |

Alle kolommen gebruiken `snake_case` via `SnakeNamingStrategy`.

---

## API Routes

Basis prefix: `/api`

| Module | Routes |
|---|---|
| Products | `GET /api/products`, `GET /api/products/:id` |
| Orders | `POST /api/orders`, `GET /api/orders/:id` |
| Payments | `POST /api/payments`, `POST /api/payments/webhook` |
| Health | `GET /api/health` |

---

## Deployment

- **Frontend**: Vercel static hosting (`dist/apps/web`)
- **API**: Vercel Serverless Function via `apps/api/src/serverless.ts`
- **Database**: Neon PostgreSQL (serverless-compatible, PgBouncer pooling via port 6432)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)

### GitHub Secrets benodigd

| Secret | Doel |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | Fallback voor migrations |
| `VERCEL_TOKEN` | Vercel CLI authenticatie |
| `VERCEL_ORG_ID` | Vercel organisatie ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Vercel Environment Variables

| Variabele | Waarde |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled connection string |
| `MOLLIE_API_KEY` | `live_xxxx` |
| `MOLLIE_WEBHOOK_SECRET` | HMAC secret |
| `ALLOWED_ORIGINS` | `https://oscar-vyent.vercel.app` |

---

## Lokale ontwikkeling

```bash
# Start PostgreSQL
docker-compose up -d

# Start API + Web parallel
npm run dev

# Migraties uitvoeren
npm run migration:run

# Database seeden
npm run seed
```

---

## Nx build targets

| Target | Commando |
|---|---|
| Build alles | `npx nx run-many --target=build --all` |
| Build API | `npx nx build api` |
| Build Web | `npx nx build web` |
| Lint | `npx nx run-many --target=lint --all` |
| Test | `npx nx run-many --target=test --all` |

Build output: `dist/apps/api` en `dist/apps/web`

Path alias: `@oscar-vyent/contracts` → `dist/libs/contracts/src/index.d.ts`
