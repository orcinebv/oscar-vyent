import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ProductComboDto } from '@oscar-vyent/contracts';
import { CombosService } from '../../../core/services/combos.service';
import { CartService } from '../../../core/services/cart.service';
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
                  <span class="combo-picker__count">({{ selectedItems().length }}/{{ c.slotCount }} gekozen)</span>
                </p>
                <div class="combo-picker__list">
                  @for (product of c.products; track product.id) {
                    <label class="combo-picker__item" [class.combo-picker__item--selected]="isSelected(product.name)">
                      <input
                        type="checkbox"
                        [checked]="isSelected(product.name)"
                        [disabled]="!isSelected(product.name) && selectedItems().length >= c.slotCount"
                        (change)="toggleItem(product.name, c.slotCount)"
                      />
                      <span class="combo-picker__item-name">{{ product.name }}</span>
                      @if (product.imageUrl) {
                        <img [src]="product.imageUrl" [alt]="product.name" class="combo-picker__thumb" />
                      }
                    </label>
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
                  [disabled]="c.stock === 0 || selectedItems().length !== c.slotCount"
                  (click)="onAddToCart(c)"
                >
                  @if (selectedItems().length !== c.slotCount) {
                    Kies nog {{ c.slotCount - selectedItems().length }} {{ c.slotCount - selectedItems().length === 1 ? 'product' : 'producten' }}
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
  protected readonly selectedItems = signal<string[]>([]);
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

  protected isSelected(name: string): boolean {
    return this.selectedItems().includes(name);
  }

  protected toggleItem(name: string, slotCount: number): void {
    this.selectionError.set(null);
    this.selectedItems.update((list) => {
      if (list.includes(name)) return list.filter((n) => n !== name);
      if (list.length >= slotCount) {
        this.selectionError.set(`Je kunt maximaal ${slotCount} producten kiezen.`);
        return list;
      }
      return [...list, name];
    });
  }

  protected onAddToCart(combo: ProductComboDto): void {
    if (this.selectedItems().length !== combo.slotCount) return;
    this.cartService.addCombo(combo, this.selectedItems());
    this.toast.success(`"${combo.name}" (${this.selectedItems().join(' + ')}) toegevoegd aan winkelwagen.`);
    this.selectedItems.set([]);
  }
}
