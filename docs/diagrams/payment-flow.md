# Payment Flow — Sequence Diagram

Full lifecycle of a customer payment via Mollie iDEAL.

```
Customer Browser          Angular Frontend          NestJS API              Mollie API            Customer Bank
      │                         │                       │                       │                      │
      │  Fill cart & checkout   │                       │                       │                      │
      │─────────────────────────│                       │                       │                      │
      │                         │                       │                       │                      │
      │  Submit checkout form   │                       │                       │                      │
      │─────────────────────────▶                       │                       │                      │
      │                         │  POST /api/orders     │                       │                      │
      │                         │──────────────────────▶│                       │                      │
      │                         │                       │ BEGIN TRANSACTION     │                      │
      │                         │                       │ Lock product rows     │                      │
      │                         │                       │ (pessimistic write)   │                      │
      │                         │                       │ Validate stock        │                      │
      │                         │                       │ Decrement stock       │                      │
      │                         │                       │ Save Order +          │                      │
      │                         │                       │ OrderItems            │                      │
      │                         │                       │ COMMIT                │                      │
      │                         │  { orderId }          │                       │                      │
      │                         │◀──────────────────────│                       │                      │
      │                         │                       │                       │                      │
      │                         │  POST /api/payments   │                       │                      │
      │                         │  { orderId }          │                       │                      │
      │                         │──────────────────────▶│                       │                      │
      │                         │                       │ Check: existing       │                      │
      │                         │                       │ payment? (idempotency)│                      │
      │                         │                       │──────────────────────▶│                      │
      │                         │                       │  payments.create()    │                      │
      │                         │                       │  amount: "25.90"      │                      │
      │                         │                       │  method: ideal        │                      │
      │                         │                       │  webhookUrl: /api/... │                      │
      │                         │                       │  redirectUrl: /pay... │                      │
      │                         │                       │◀──────────────────────│                      │
      │                         │                       │  { id: tr_xxx,        │                      │
      │                         │                       │    checkoutUrl: ... } │                      │
      │                         │                       │ Save Payment entity   │                      │
      │                         │                       │ Order → payment_pend. │                      │
      │                         │  { checkoutUrl }      │                       │                      │
      │                         │◀──────────────────────│                       │                      │
      │                         │                       │                       │                      │
      │  window.location.href   │                       │                       │                      │
      │  = checkoutUrl          │                       │                       │                      │
      │◀────────────────────────│                       │                       │                      │
      │                         │                       │                       │                      │
      │  ───── Redirect to Mollie hosted checkout ─────────────────────────────▶                      │
      │                         │                       │                       │  iDEAL bank select   │
      │                         │                       │                       │─────────────────────▶│
      │                         │                       │                       │  Authenticate        │
      │                         │                       │                       │◀─────────────────────│
      │                         │                       │                       │  Confirm payment     │
      │                         │                       │                       │─────────────────────▶│
      │                         │                       │                       │◀─────────────────────│
      │                         │                       │                       │                      │
      │                         │          POST /api/payments/webhook           │                      │
      │                         │          (async, before redirect)             │                      │
      │                         │                       │◀──────────────────────│                      │
      │                         │                       │ VERIFY Mollie-Sig.    │                      │
      │                         │                       │ (HMAC-SHA256)         │                      │
      │                         │                       │ Return 200 immediately│                      │
      │                         │                       │──────────────────────▶│                      │
      │                         │                       │                       │                      │
      │                         │                       │ [async processing]    │                      │
      │                         │                       │ payments.get(tr_xxx)  │                      │
      │                         │                       │──────────────────────▶│                      │
      │                         │                       │◀──────────────────────│                      │
      │                         │                       │  { status: "paid" }   │                      │
      │                         │                       │ Update Payment → paid │                      │
      │                         │                       │ Update Order → paid   │                      │
      │                         │                       │ Write AuditLog        │                      │
      │                         │                       │                       │                      │
      │  ◀──────── Mollie redirect ─────────────────────────────────────────── │                      │
      │  /payment/return?orderId=xxx                    │                       │                      │
      │─────────────────────────▶                       │                       │                      │
      │                         │                       │                       │                      │
      │                         │  Polling (every 3s)   │                       │                      │
      │                         │  GET /api/payments    │                       │                      │
      │                         │  /:paymentId/status   │                       │                      │
      │                         │──────────────────────▶│                       │                      │
      │                         │◀──────────────────────│                       │                      │
      │                         │  { status: "paid" }   │                       │                      │
      │                         │                       │                       │                      │
      │  Navigate to            │                       │                       │                      │
      │  /orders/:orderId       │                       │                       │                      │
      │◀────────────────────────│                       │                       │                      │
      │                         │                       │                       │                      │
```

## Key security properties

1. **Webhook-first confirmation**: The order is marked `paid` only after `payments.get()` from Mollie API — never based on the redirect URL parameters
2. **Signature verification**: `Mollie-Signature` header is HMAC-SHA256 verified before any webhook processing
3. **Idempotency**: Webhook handler checks if payment is already in terminal state before processing
4. **Polling timeout**: Frontend polls for max 30 seconds, then shows neutral "processing" state — avoids infinite loading
5. **Stock safety**: `SELECT ... FOR UPDATE` prevents concurrent orders from overselling the last item

## Failure scenarios

| Scenario | Behaviour |
|----------|-----------|
| Stock runs out during checkout | `ConflictException` → order rolled back → 409 response → frontend shows error |
| Mollie API unreachable during payment creation | `BadRequestException` → order stays `pending` → frontend shows error, can retry |
| Webhook arrives before polling starts | Frontend polls → finds `paid` immediately → success |
| Webhook delayed | Frontend polls for 30s → shows "processing" state → webhook arrives later → email confirms |
| Payment failed/expired | Webhook → order → `failed` → stock restored → frontend shows failure |
| Duplicate webhook call | Idempotency check → payment already terminal → no-op → 200 returned |
