import { Injectable, signal, computed, effect } from '@angular/core';
import { ProductDto } from '@oscar-vyent/contracts';

export interface CartItem {
  product: ProductDto;
  quantity: number;
}

const STORAGE_KEY = 'oscar_vyent_cart';

/**
 * Signal-based cart state service.
 *
 * Architecture decision: Angular Signals over NgRx.
 * Cart state is self-contained, localStorage-backed, and small enough
 * that NgRx's boilerplate (actions/reducers/selectors) adds no value.
 * See ADR-004.
 *
 * An effect() auto-persists to localStorage whenever the items signal changes,
 * ensuring cart survives page reload without manual calls.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  // Private writable signal — only mutated via methods in this service
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());

  // Public read-only views
  readonly items = this._items.asReadonly();
  readonly count = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0),
  );
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Persist to localStorage on every change — replaces manual save() calls
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
      } catch {
        // localStorage may be unavailable (private mode, quota exceeded)
      }
    });
  }

  addItem(product: ProductDto, quantity = 1): void {
    this._items.update((items) => {
      const idx = items.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        return items.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...items, { product, quantity }];
    });
  }

  removeItem(productId: string): void {
    this._items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }

  clear(): void {
    this._items.set([]);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const items = JSON.parse(raw) as CartItem[];
      // Discard items with incomplete product data (can happen after stale localStorage)
      return items.filter((i) => i?.product?.id && i.product.name && i.quantity > 0);
    } catch {
      return [];
    }
  }
}
