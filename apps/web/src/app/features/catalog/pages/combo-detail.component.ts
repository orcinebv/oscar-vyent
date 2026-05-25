import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ProductComboDto, ProductDto } from '@oscar-vyent/contracts';
import { CombosService } from '../../../core/services/combos.service';
import { CartService, ComboSlotSelection } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';


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
                  <span class="combo-picker__count">({{ slotTotal() }}/{{ c.slotCount }} gekozen)</span>
                </p>
                <div class="combo-picker__list">
                  @for (product of c.products; track product.id) {
                    <div class="combo-picker__item" [class.combo-picker__item--selected]="qtyFor(product.id) > 0">
                      @if (product.imageUrl) {
                        <img [src]="product.imageUrl" [alt]="product.name" class="combo-picker__thumb" />
                      }
                      <span class="combo-picker__item-name">{{ product.name }}</span>
                      <div class="combo-picker__stepper">
                        <button type="button" class="stepper__btn"
                          (click)="changeQty(product, -1, c.slotCount)"
                          [disabled]="qtyFor(product.id) === 0">−</button>
                        <span class="stepper__value">{{ qtyFor(product.id) }}</span>
                        <button type="button" class="stepper__btn"
                          (click)="changeQty(product, 1, c.slotCount)"
                          [disabled]="slotTotal() >= c.slotCount">+</button>
                      </div>
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
                  [disabled]="c.stock === 0 || slotTotal() !== c.slotCount"
                  (click)="onAddToCart(c)"
                >
                  @if (slotTotal() !== c.slotCount) {
                    Kies nog {{ c.slotCount - slotTotal() }} {{ c.slotCount - slotTotal() === 1 ? 'product' : 'producten' }}
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
    .combo-picker__title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
    .combo-picker__count { font-weight: var(--font-weight-normal); color: var(--color-text-secondary); margin-left: var(--space-1); }
    .combo-picker__list { display: flex; flex-direction: column; gap: var(--space-2); }
    .combo-picker__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-raised); transition: border-color var(--transition-fast), background var(--transition-fast); }
    .combo-picker__item--selected { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-raised)); }
    .combo-picker__item-name { flex: 1; font-size: var(--font-size-sm); }
    .combo-picker__thumb { width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; }
    .combo-picker__error { font-size: 12px; color: #dc2626; margin-top: var(--space-2); }
    .combo-picker__stepper { display: flex; align-items: center; gap: var(--space-2); margin-left: auto; flex-shrink: 0; }
    .stepper__btn { width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-raised); cursor: pointer; font-size: var(--font-size-base); display: flex; align-items: center; justify-content: center; color: var(--color-text-primary); line-height: 1; }
    .stepper__btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .stepper__btn:not(:disabled):hover { background: var(--color-surface-subtle); }
    .stepper__value { min-width: 20px; text-align: center; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
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
  protected readonly slotQuantities = signal<Record<string, number>>({});
  protected readonly selectionError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.combosService
      .getOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (c) => this.combo.set(c),
        error: () => this.error.set('Combinatie kon niet geladen worden.'),
      });
  }

  protected slotTotal(): number {
    return Object.values(this.slotQuantities()).reduce((s, n) => s + n, 0);
  }

  protected qtyFor(productId: string): number {
    return this.slotQuantities()[productId] ?? 0;
  }

  protected changeQty(product: ProductDto, delta: number, slotCount: number): void {
    this.selectionError.set(null);
    this.slotQuantities.update((qtys) => {
      const current = qtys[product.id] ?? 0;
      const total = Object.values(qtys).reduce((s, n) => s + n, 0);
      if (delta > 0 && total >= slotCount) {
        this.selectionError.set(`Je kunt maximaal ${slotCount} producten kiezen.`);
        return qtys;
      }
      const next = current + delta;
      if (next < 0) return qtys;
      const updated = { ...qtys };
      if (next === 0) { delete updated[product.id]; } else { updated[product.id] = next; }
      return updated;
    });
  }

  protected onAddToCart(combo: ProductComboDto): void {
    if (this.slotTotal() !== combo.slotCount) return;
    const slots: ComboSlotSelection[] = [];
    for (const [productId, qty] of Object.entries(this.slotQuantities())) {
      const product = combo.products.find(p => p.id === productId)!;
      for (let i = 0; i < qty; i++) {
        slots.push({ productId: product.id, productName: product.name, selectedExtras: [] });
      }
    }
    this.cartService.addCombo(combo, slots);
    const names = Object.entries(this.slotQuantities()).map(([id, qty]) => {
      const p = combo.products.find(p => p.id === id)!;
      return qty > 1 ? `${qty}× ${p.name}` : p.name;
    });
    this.toast.success(`"${combo.name}" (${names.join(' + ')}) toegevoegd aan winkelwagen.`);
    this.slotQuantities.set({});
  }
}
