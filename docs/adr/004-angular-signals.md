# ADR-004: Angular Signals over NgRx for cart state

**Date:** 2026-04-14
**Status:** Accepted
**Deciders:** Architecture team

---

## Context

The frontend needs reactive state management for the shopping cart. The cart must:
- update in real time as items are added/removed/modified
- persist across page navigation (localStorage)
- be easily readable by multiple components (header badge, cart page, checkout page)
- propagate changes without manual change detection triggers

## Decision

Use **Angular Signals** (`signal`, `computed`, `effect`) in `CartService` instead of NgRx.

## Rationale

- **Built-in since Angular 16** — no extra dependency; zero additional bundle cost
- **No boilerplate** — NgRx requires actions, reducers, selectors, effects for each state slice. Signals achieve the same result in ~80 fewer lines for our cart use case
- **`computed()` for derived state** — `count`, `total`, `isEmpty` are derived values that update automatically when `_items` changes; no selector code needed
- **`effect()` for side effects** — auto-persists to localStorage on every signal change without manual calls or RxJS operators
- **Read-only signal exposure** — `_items.asReadonly()` enforces that external consumers cannot mutate state directly (encapsulation)
- **Fine-grained reactivity** — Angular's signal graph only re-renders components that consume changed signals (similar to Solid.js)

## Alternatives considered

- **NgRx** — powerful for complex multi-slice state, DevTools time-travel debugging, strict action-effect patterns. Overkill for a cart with 4 operations (add/remove/updateQty/clear)
- **BehaviorSubject service** — RxJS-based service pattern (pre-Signals Angular idiom). Works, but `computed()` and `effect()` are cleaner than `map()` + `combineLatest()`
- **Component Input/Output** — only works for parent-child; cart is consumed across unrelated routes

## Tradeoffs

- Less powerful DevTools compared to NgRx Redux DevTools (no time-travel)
- If state complexity grows significantly (complex workflows, optimistic updates, server-state sync), NgRx or TanStack Query may be warranted in v2
- `effect()` runs asynchronously in some Angular scheduling modes — localStorage persistence is eventually consistent (acceptable for cart use case)

## Consequence

`CartService` is the single source of truth for cart state. Any component that needs cart data injects `CartService` and reads from its signals. No cart state exists in components themselves.
