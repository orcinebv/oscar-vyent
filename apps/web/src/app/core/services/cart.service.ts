import { Injectable, signal, computed, effect } from '@angular/core';
import { ProductDto, ProductComboDto } from '@oscar-vyent/contracts';

export interface ComboSlotSelection {
  productId: string;
  productName: string;
  selectedExtras: string[];
}

export interface CartItem {
  product: ProductDto;
  quantity: number;
  selectedExtras: string[];
  lineId: string;
  isCombo?: boolean;
  comboId?: string;
  /** For combo items: the chosen product names displayed in cart/checkout */
  selectedComboItems?: string[];
  /** For combo items: full per-product slot selections including extras */
  selectedComboSlots?: ComboSlotSelection[];
}

const STORAGE_KEY = 'oscar_vyent_cart';

function makeLineId(productId: string, extras: string[]): string {
  return `${productId}:${[...extras].sort().join(',')}`;
}

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
 *
 * lineId = productId + ':' + sorted(selectedExtras).join(',')
 * Same product + same extras merge; same product + different extras = separate line.
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
  /** BTW 21% component (prijzen zijn incl. BTW): totaal * 21 / 121 */
  readonly vatAmount = computed(() => this.total() * 21 / 121);
  /** Subtotaal excl. BTW */
  readonly subtotalExclVat = computed(() => this.total() / 1.21);
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

  addItem(product: ProductDto, quantity = 1, selectedExtras: string[] = []): void {
    const lineId = makeLineId(product.id, selectedExtras);
    this._items.update((items) => {
      const idx = items.findIndex((i) => i.lineId === lineId);
      if (idx >= 0) {
        return items.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...items, { product, quantity, selectedExtras, lineId }];
    });
  }

  addCombo(combo: ProductComboDto, slots: ComboSlotSelection[], quantity = 1): void {
    const lineId = `combo:${combo.id}:${slots
      .map(s => `${s.productId}[${[...s.selectedExtras].sort().join(',')}]`)
      .sort()
      .join('+')}`;
    const selectedComboItems = slots.map(s => s.productName);
    const product: ProductDto = {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: combo.price,
      stock: combo.stock,
      imageUrl: combo.imageUrl,
      isActive: combo.isActive,
      category: combo.category,
      extras: [],
      createdAt: combo.createdAt,
      updatedAt: combo.updatedAt,
    };
    this._items.update((items) => {
      const idx = items.findIndex((i) => i.lineId === lineId);
      if (idx >= 0) {
        return items.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...items, {
        product,
        quantity,
        selectedExtras: selectedComboItems,
        lineId,
        isCombo: true,
        comboId: combo.id,
        selectedComboItems,
        selectedComboSlots: slots,
      }];
    });
  }

  removeItem(lineId: string): void {
    this._items.update((items) => items.filter((i) => i.lineId !== lineId));
  }

  updateQuantity(lineId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(lineId);
      return;
    }
    this._items.update((items) =>
      items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
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
      // Migrate old cart items that lack selectedExtras/lineId, and discard incomplete items
      return items
        .filter((i) => i?.product?.id && i.product.name && i.quantity > 0)
        .map((i) => ({
          ...i,
          selectedExtras: i.selectedExtras ?? [],
          lineId: i.lineId ?? makeLineId(i.product.id, i.selectedExtras ?? []),
        }));
    } catch {
      return [];
    }
  }
}
