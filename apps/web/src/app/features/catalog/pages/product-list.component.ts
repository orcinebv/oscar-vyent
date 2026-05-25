import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ProductDto, ProductComboDto } from '@oscar-vyent/contracts';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { CombosService } from '../../../core/services/combos.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductsStore } from '../products.store';

@Component({
  selector: 'ov-product-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ProductCardComponent, LoadingSpinnerComponent],
  providers: [ProductsStore],
  template: `
    <section class="catalog">
      <div class="container">
        <header class="catalog__header">
          <h1 class="catalog__title">{{ activeCategory() ?? 'Onze Producten' }}</h1>
          <p class="catalog__subtitle">Authentieke Surinaamse gerechten, vers bereid met liefde</p>
        </header>

        @if (store.loading()) {
          <ov-loading-spinner message="Producten laden..." />
        } @else if (store.error()) {
          <div class="alert alert-error" role="alert">
            <strong>Fout:</strong> {{ store.error() }}
            <button class="btn btn-ghost btn-sm" (click)="store.loadProducts()" style="margin-left:8px">Opnieuw proberen</button>
          </div>
        } @else {
          @if (filteredCombos().length > 0) {
            <div class="catalog__section">
              <h2 class="catalog__section-title">Combinaties</h2>
              <div class="catalog__grid">
                @for (combo of filteredCombos(); track combo.id) {
                  <a class="combo-card" [routerLink]="['/combos', combo.id]">
                    <div class="combo-card__image-wrap">
                      @if (combo.imageUrl) {
                        <img [src]="combo.imageUrl" [alt]="combo.name" class="combo-card__image" />
                      } @else {
                        <div class="combo-card__image-placeholder">Combi</div>
                      }
                      <span class="combo-card__badge">Combi</span>
                    </div>
                    <div class="combo-card__body">
                      @if (combo.category) {
                        <span class="combo-card__category">{{ combo.category }}</span>
                      }
                      <h3 class="combo-card__name">{{ combo.name }}</h3>
                      <p class="combo-card__desc">Kies {{ combo.slotCount }} producten uit {{ combo.products.length }} opties</p>
                      <div class="combo-card__footer">
                        <span class="combo-card__price">{{ combo.price | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
                        <span class="combo-card__cta">Kies je combi →</span>
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>
          }

          @if (filteredProducts().length > 0) {
            <div class="catalog__section">
              @if (filteredCombos().length > 0) {
                <h2 class="catalog__section-title">Losse producten</h2>
              }
              <div class="catalog__grid">
                @for (product of filteredProducts(); track product.id) {
                  <ov-product-card
                    [product]="product"
                    (addToCart)="onAddToCart($event)"
                  />
                }
              </div>
            </div>
          }

          @if (filteredProducts().length === 0 && filteredCombos().length === 0) {
            <div class="catalog__empty">
              <p>Geen producten gevonden.</p>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    .catalog { padding: var(--space-10) 0 var(--space-16); }

    .catalog__header { text-align: center; margin-bottom: var(--space-10); }

    .catalog__title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      margin-bottom: var(--space-2);
    }

    .catalog__subtitle { font-size: var(--font-size-lg); color: var(--color-text-secondary); }

    .catalog__section { margin-bottom: var(--space-10); }

    .catalog__section-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-5);
    }

    .catalog__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }

    @media (min-width: 600px) { .catalog__grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 900px) { .catalog__grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1200px) { .catalog__grid { grid-template-columns: repeat(4, 1fr); } }

    .catalog__empty {
      text-align: center;
      padding: var(--space-16);
      color: var(--color-text-secondary);
    }

    .combo-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-surface-raised);
      text-decoration: none;
      color: inherit;
      transition: box-shadow var(--transition-fast), transform var(--transition-fast);
    }
    .combo-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

    .combo-card__image-wrap { position: relative; aspect-ratio: 4/3; background: var(--color-surface-subtle); overflow: hidden; }
    .combo-card__image { width: 100%; height: 100%; object-fit: cover; }
    .combo-card__image-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-muted); font-size: var(--font-size-sm);
    }
    .combo-card__badge {
      position: absolute;
      top: var(--space-2);
      left: var(--space-2);
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      font-weight: var(--font-weight-bold);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
    }

    .combo-card__body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
    .combo-card__category { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .combo-card__name { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
    .combo-card__desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .combo-card__footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--space-2); }
    .combo-card__price { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary); }
    .combo-card__cta { font-size: var(--font-size-sm); color: var(--color-accent); font-weight: var(--font-weight-medium); }
  `],
})
export class ProductListComponent implements OnInit {
  protected readonly store = inject(ProductsStore);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly combosService = inject(CombosService);
  private readonly route = inject(ActivatedRoute);

  protected readonly combos = signal<ProductComboDto[]>([]);

  private readonly categoryParam = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('category'))),
    { initialValue: null },
  );

  protected readonly activeCategory = computed(() => this.categoryParam());

  protected readonly filteredProducts = computed(() => {
    const cat = this.categoryParam();
    return cat ? this.store.products().filter(p => p.category === cat) : this.store.products();
  });

  protected readonly filteredCombos = computed(() => {
    const cat = this.categoryParam();
    return cat ? this.combos().filter(c => c.category === cat) : this.combos();
  });

  ngOnInit(): void {
    this.combosService.getAll().subscribe({
      next: (c) => this.combos.set(c),
    });
  }

  protected onAddToCart(product: ProductDto): void {
    this.cartService.addItem(product);
    this.toast.success(`"${product.name}" is toegevoegd aan uw winkelwagen.`);
  }
}
