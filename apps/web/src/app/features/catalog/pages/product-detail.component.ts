import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ProductDto } from '@oscar-vyent/contracts';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'ov-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LoadingSpinnerComponent],
  template: `
    <div class="container">
      <nav class="breadcrumb" aria-label="Navigatiepad">
        <a routerLink="/products">Producten</a>
        @if (product()) {
          <span aria-hidden="true">›</span>
          <span>{{ product()!.name }}</span>
        }
      </nav>

      @if (loading()) {
        <ov-loading-spinner message="Product laden..." />
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else {
        @if (product(); as p) {
        <div class="detail">
          <div class="detail__image-wrap">
            @if (p.imageUrl) {
              <img [src]="p.imageUrl" [alt]="p.name" class="detail__image" />
            } @else {
              <div class="detail__image-placeholder">Geen afbeelding beschikbaar</div>
            }
          </div>

          <div class="detail__info">
            @if (p.category) {
              <span class="badge badge-info">{{ p.category }}</span>
            }
            <h1 class="detail__name">{{ p.name }}</h1>
            <p class="detail__price">{{ p.price | currency:'EUR':'symbol':'1.2-2':'nl' }}</p>

            @if (p.stock === 0) {
              <div class="alert alert-error">Dit product is uitverkocht.</div>
            } @else if (p.stock <= 10) {
              <p class="detail__low-stock">⚠ Nog slechts {{ p.stock }} stuks op voorraad!</p>
            }

            <p class="detail__description">{{ p.description }}</p>

            <div class="detail__actions">
              <button
                type="button"
                class="btn btn-primary btn-lg"
                [disabled]="p.stock === 0"
                (click)="onAddToCart(p)"
              >
                In winkelwagen
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
    .breadcrumb a { color: var(--color-primary-light); text-decoration: none; }
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
  `],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly product = signal<ProductDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService
      .getOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => this.product.set(p),
        error: () => this.error.set('Product kon niet geladen worden.'),
      });
  }

  protected onAddToCart(product: ProductDto): void {
    this.cartService.addItem(product);
    this.toast.success(`"${product.name}" is toegevoegd aan uw winkelwagen.`);
  }
}
