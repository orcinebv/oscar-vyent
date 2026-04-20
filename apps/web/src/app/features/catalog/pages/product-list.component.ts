import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductDto } from '@oscar-vyent/contracts';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductsStore } from '../products.store';

@Component({
  selector: 'ov-product-list',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, LoadingSpinnerComponent],
  providers: [ProductsStore],
  template: `
    <section class="catalog">
      <div class="container">
        <header class="catalog__header">
          <h1 class="catalog__title">Onze Producten</h1>
          <p class="catalog__subtitle">Authentieke Surinaamse gerechten, vers bereid met liefde</p>
        </header>

        @if (store.loading()) {
          <ov-loading-spinner message="Producten laden..." />
        } @else if (store.error()) {
          <div class="alert alert-error" role="alert">
            <strong>Fout:</strong> {{ store.error() }}
            <button class="btn btn-ghost btn-sm" (click)="store.loadProducts()" style="margin-left:8px">Opnieuw proberen</button>
          </div>
        } @else if (store.products().length === 0) {
          <div class="catalog__empty">
            <p>Geen producten gevonden.</p>
          </div>
        } @else {
          <div class="catalog__grid">
            @for (product of store.products(); track product.id) {
              <ov-product-card
                [product]="product"
                (addToCart)="onAddToCart($event)"
              />
            }
          </div>
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
  `],
})
export class ProductListComponent {
  protected readonly store = inject(ProductsStore);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  protected onAddToCart(product: ProductDto): void {
    this.cartService.addItem(product);
    this.toast.success(`"${product.name}" is toegevoegd aan uw winkelwagen.`);
  }
}
