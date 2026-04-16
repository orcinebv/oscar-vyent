# ADR-005: No authentication module in v1

**Date:** 2026-04-14
**Status:** Accepted
**Deciders:** Architecture team

---

## Context

Should customers be required to create an account to place an order?

## Decision

**No user accounts in v1.** Orders are identified by email address. Customers can view their order status via the direct URL `/orders/:id`.

## Rationale

- **Reduced checkout friction** — forced registration is one of the top reasons for cart abandonment in e-commerce (Baymard Institute: 24% of users abandon at registration). Guest checkout significantly increases conversion
- **Simpler architecture** — no session management, JWT, refresh tokens, password hashing, email verification, or account recovery flows
- **Sufficient traceability** — each order captures the customer's email; the audit log records IP and actor for all events
- **Order confirmation email** — a confirmation email (out of scope for v1, but trivial to add via a transactional email service) gives customers their order link
- **Mollie handles identity for payment** — payment authentication is delegated to the customer's bank via iDEAL; we don't need to duplicate identity verification

## Alternatives considered

- **JWT-based auth** — adds ~1 week of development, introduces token refresh complexity, and adds security attack surface (XSS, token theft)
- **Magic link auth** — good middle ground (no password, email-based login), but still adds complexity; can be added in v2
- **OAuth (Google/Apple)** — reduces friction for users with those accounts, but excludes others and adds OAuth flow complexity

## Tradeoffs

- Customers cannot view all their past orders in one place (no account dashboard)
- If an order URL is lost, the customer has no way to retrieve it without contacting support (mitigated by confirmation email)
- No personalization or repeat-customer features in v1

## V2 Plan

Add magic link authentication (email → link → session) to allow customers to view order history without passwords. This is additive — the `customerEmail` field already provides the natural join key.

## Consequence

The `OrdersController.findOne` endpoint is public — anyone with the order UUID can view it. UUIDs have sufficient entropy (~122 bits) to make enumeration impractical. In v2, access can be gated by email verification.
