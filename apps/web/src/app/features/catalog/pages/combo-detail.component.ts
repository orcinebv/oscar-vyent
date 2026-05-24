import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ProductComboDto, ProductDto } from '@oscar-vyent/contracts';
import { CombosService } from '../../../core/services/combos.service';
import { CartService, ComboSlotSelection } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface SlotSelection {
  product: ProductDto;
  selectedExtras: string[];
}

@Component({
  selector: 'ov-combo-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LoadingSpinnerComponent],
  template: `
    <div class="container">
      <nav class="breadcrumb" aria-label="Navigatiepad">
        <a routerLink="/products">Producten</a>
        <span aria-hidden="true">›</span>
        @if (combo()) {
          <span>{{ combo()!.name }}</span>
        }
      </nav>

      @if (loading()) {
        <ov-loading-spinner message="Combi laden..." />
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else {
        @if (combo(); as c) {
          <div class="detail">
            <div class="detail__image-wrap">
              @if (c.imageUrl) {
                <img [src]="c.imageUrl" [alt]="c.name" class="detail__image" />
              } @else {
                <div class="detail__image-placeholder">Geen afbeelding beschikbaar</div>
              }
            </div>

            <div class="detail__info">
              <span class="badge badge-combo">Combi</span>
              @if (c.category) {
                <span class="badge badge-info">{{ c.category }}</span>
              }
              <h1 class="detail__name">{{ c.name }}</h1>
              <p class="detail__price">{{ c.price | currency:'EUR':'symbol':'1.2-2':'nl' }}</p>

              @if (c.stock === 0) {
                <div class="alert alert-error">Deze combinatie is uitverkocht.</div>
              } @else if (c.stock <= 5) {
                <p class="detail__low-stock">⚠ Nog slechts {{ c.stock }} beschikbaar!</p>
              }

              <p class="detail__description">{{ c.description }}</p>

              <div class="combo-picker">
                <p class="combo-picker__title">
                  Kies {{ c.slotCount }} {{ c.slotCount === 1 ? 'product' : 'producten' }}
                  <span class="combo-picker__count">({{ selectedSlots().length }}/{{ c.slotCount }} gekozen)</span>
                </p>
                <div class="combo-picker__list">
                  @for (product of c.products; track product.id) {
                    <div class="combo-picker__item-wrap">
                      <label class="combo-picker__item" [class.combo-picker__item--selected]="isSelected(product.id)">
                        <input
                          type="checkbox"
                          [checked]="isSelected(product.id)"
                          [disabled]="!isSelected(product.id) && selectedSlots().length >= c.slotCount"
                          (change)="toggleSlot(product, c.slotCount)"
                        />
                        <span class="combo-picker__item-name">{{ product.name }}</span>
                        @if (product.imageUrl) {
                          <img [src]="product.imageUrl" [alt]="product.name" class="combo-picker__thumb" />
                        }
                      </label>
                      @if (isSelected(product.id) && product.extras.length) {
                        <div class="combo-picker__extras">
                          <p class="combo-picker__extras-label">Wensen voor {{ product.name }}:</p>
                          <div class="combo-picker__extras-list">
                            @for (extra of product.extras; track extra.id) {
                              <label class="combo-picker__extra-item">
                                <input
                                  type="checkbox"
                                  [checked]="isExtraSelected(product.id, extra.name)"
                                  (change)="toggleExtra(product.id, extra.name)"
                                />
                                {{ extra.name }}
                              </label>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
                @if (selectionError()) {
                  <p class="combo-picker__error">{{ selectionError() }}</p>
                }
              </div>

              <div class="detail__actions">
                <button
                  type="button"
                  class="btn btn-primary btn-lg"
                  [disabled]="c.stock === 0 || selectedSlots().length !== c.slotCount"
                  (click)="onAddToCart(c)"
                >
                  @if (selectedSlots().length !== c.slotCount) {
                    Kies nog {{ c.slotCount - selectedSlots().length }} {{ c.slotCount - selectedSlots().length === 1 ? 'product' : 'producten' }}
                  } @else {
                    In winkelwagen
                  }
                </button>
                <a routerLink="/cart" class="btn btn-secondary btn-lg">Winkelwagen bekijken</a>
              </div>

              <div class="detail__trust">
                <div class="trust-item"><span>🔒</span><span>Veilig betalen via iDEAL</span></div>
                <div class="trust-item"><span>📦</span><span>Snelle bezorging in Nederland</span></div>
                <div class="trust-item"><span>↩</span><span>14 dagen retourrecht</span></div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-6); padding-bottom: var(--space-16); }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-8);
    }
    .breadcrumb a { color: var(--color-accent); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }

    .detail {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-8);
    }
    @media (min-width: 768px) { .detail { grid-template-columns: 1fr 1fr; align-items: start; } }

    .detail__image-wrap { border-radius: var(--radius-xl); overflow: hidden; background: var(--color-surface-subtle); aspect-ratio: 1; }
    .detail__image { width: 100%; height: 100%; object-fit: cover; }
    .detail__image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: var(--font-size-sm); }

    .detail__info { display: flex; flex-direction: column; gap: var(--space-4); }
    .detail__name { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .detail__price { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary); }
    .detail__low-stock { color: var(--color-warning); font-weight: var(--font-weight-medium); font-size: var(--font-size-sm); }
    .detail__description { color: var(--color-text-secondary); line-height: var(--line-height-loose); }
    .detail__actions { display: flex; gap: var(--space-4); flex-wrap: wrap; }

    .detail__trust { display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .trust-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-secondary); }

    .badge { display: inline-block; padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: 11px; font-weight: var(--font-weight-semibold); }
    .badge-combo { background: #fef3c7; color: #92400e; margin-right: var(--space-1); }
    .badge-info { background: var(--color-surface-subtle); color: var(--color-text-secondary); }

    .combo-picker {
      padding: var(--space-4);
      background: var(--color-surface-subtle);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }
    .combo-picker__title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-3);
    }
    .combo-picker__count {
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
      margin-left: var(--space-1);
    }
    .combo-picker__list { display: flex; flex-direction: column; gap: var(--space-2); }
    .combo-picker__item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-raised);
      cursor: pointer;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }
    .combo-picker__item:has(input:disabled) { opacity: 0.5; cursor: not-allowed; }
    .combo-picker__item--selected {
      border-color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-raised));
    }
    .combo-picker__item-name { flex: 1; font-size: var(--font-size-sm); }
    .combo-picker__thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .combo-picker__error { font-size: 12px; color: #dc2626; margin-top: var(--space-2); }

    .combo-picker__item-wrap { display: flex; flex-direction: column; gap: 0; }
    .combo-picker__extras {
      margin-left: var(--space-8);
      padding: var(--space-2) var(--space-3);
      background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface-raised));
      border: 1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
      border-top: none;
      border-radius: 0 0 var(--radius-md) var(--radius-md);
    }
    .combo-picker__extras-label {
      font-size: 11px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: var(--space-2);
    }
    .combo-picker__extras-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .combo-picker__extra-item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
      padding: 2px var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: var(--color-surface-raised);
      transition: background var(--transition-fast);
    }
    .combo-picker__extra-item:has(input:checked) {
      background: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface-raised));
      border-color: var(--color-primary);
    }
    .combo-picker__extra-item input { display: none; }
  `],
})
export class ComboDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly combosService = inject(CombosService);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly combo = signal<ProductComboDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedSlots = signal<SlotSelection[]>([]);
  protected readonly selectionError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const fromLineId = this.route.snapshot.queryParamMap.get('from');
    this.combosService
      .getOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (c) => {
          this.combo.set(c);
          if (fromLineId) {
            const cartItem = this.cartService.items().find(i => i.lineId === fromLineId);
            if (cartItem?.selectedComboSlots?.length) {
              this.selectedSlots.set(
                cartItem.selectedComboSlots.map(slot => ({
                  product: c.products.find(p => p.id === slot.productId) ?? { id: slot.productId, name: slot.productName } as ProductDto,
                  selectedExtras: slot.selectedExtras,
                }))
              );
            }
          }
        },
        error: () => this.error.set('Combinatie kon niet geladen worden.'),
      });
  }

  protected isSelected(productId: string): boolean {
    return this.selectedSlots().some(s => s.product.id === productId);
  }

  protected isExtraSelected(productId: string, extraName: string): boolean {
    return this.selectedSlots().find(s => s.product.id === productId)?.selectedExtras.includes(extraName) ?? false;
  }

  protected toggleSlot(product: ProductDto, slotCount: number): void {
    this.selectionError.set(null);
    this.selectedSlots.update((slots) => {
      if (slots.some(s => s.product.id === product.id)) {
        return slots.filter(s => s.product.id !== product.id);
      }
      if (slots.length >= slotCount) {
        this.selectionError.set(`Je kunt maximaal ${slotCount} producten kiezen.`);
        return slots;
      }
      return [...slots, { product, selectedExtras: [] }];
    });
  }

  protected toggleExtra(productId: string, extraName: string): void {
    this.selectedSlots.update((slots) =>
      slots.map(s => {
        if (s.product.id !== productId) return s;
        const has = s.selectedExtras.includes(extraName);
        return {
          ...s,
          selectedExtras: has
            ? s.selectedExtras.filter(e => e !== extraName)
            : [...s.selectedExtras, extraName],
        };
      })
    );
  }

  protected onAddToCart(combo: ProductComboDto): void {
    if (this.selectedSlots().length !== combo.slotCount) return;
    const slots: ComboSlotSelection[] = this.selectedSlots().map(s => ({
      productId: s.product.id,
      productName: s.product.name,
      selectedExtras: s.selectedExtras,
    }));
    this.cartService.addCombo(combo, slots);
    const names = slots.map(s =>
      s.selectedExtras.length ? `${s.productName} (${s.selectedExtras.join(', ')})` : s.productName
    );
    this.toast.success(`"${combo.name}" (${names.join(' + ')}) toegevoegd aan winkelwagen.`);
    this.selectedSlots.set([]);
  }
}
