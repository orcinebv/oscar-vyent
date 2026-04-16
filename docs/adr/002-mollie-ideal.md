# ADR-002: Mollie + iDEAL over Stripe or PayPal

**Date:** 2026-04-14
**Status:** Accepted
**Deciders:** Architecture team

---

## Context

The application serves the Dutch market. A payment provider must be chosen that supports the dominant Dutch payment method and integrates cleanly with our NestJS backend.

## Decision

Use **Mollie** as the payment provider with **iDEAL** as the primary payment method.

## Rationale

- **iDEAL is dominant in the Netherlands** — used in 65%+ of Dutch online transactions (2024 DNB statistics). Not supporting iDEAL would severely limit conversion for a NL-focused shop
- **Mollie-native iDEAL** — Mollie was founded in the Netherlands and provides the best developer experience for iDEAL specifically
- **Simple pricing** — €0.29 flat per successful transaction for iDEAL (vs. Stripe's percentage-based model, which costs more at higher order values)
- **Official Node.js SDK** — `@mollie/api-client` is maintained by Mollie, typed, and straightforward
- **Test mode** — `test_` API key enables full payment simulation without real bank credentials
- **Webhook reliability** — Mollie retries webhook delivery with exponential backoff; we receive definitive payment status regardless of transient failures
- **Dutch IBAN settlement** — funds settle to a Dutch bank account without currency conversion

## Alternatives considered

- **Stripe** — excellent global coverage and developer experience, but less native iDEAL support (iDEAL is just one of many methods, not a first-class focus); higher fees for NL market
- **PayPal** — poor conversion rates for Dutch customers; expensive fees; not the norm for Dutch e-commerce
- **Adyen** — excellent enterprise solution, but complex integration, higher minimum volumes, and NL-headquartered but aimed at enterprise

## Tradeoffs

- Less global coverage than Stripe if we expand outside NL/EU
- Smaller developer community vs. Stripe
- Mollie's webhook timeout is 5 seconds — webhook handler must respond immediately (we fire-and-forget the processing)

## Security Implications

- Webhook endpoint is protected by HMAC-SHA256 signature verification (`Mollie-Signature` header)
- Payment status is always fetched server-side from Mollie API — redirect query params are never trusted
- Idempotency check prevents duplicate payments for the same order

## Consequence

All payment flows are implemented via Mollie's REST API. If a second payment method is needed (e.g. credit card), it can be added by extending `CreatePaymentDto.method` — no structural changes required.
