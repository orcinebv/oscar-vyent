import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductDto } from '@oscar-vyent/contracts';

@Component({
  selector: 'ov-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <article class="product-card" [class.product-card--out-of-stock]="product.stock === 0">
      <a [routerLink]="['/products', product.id]" class="product-card__image-link" [attr.tabindex]="product.stock === 0 ? -1 : 0">
        <div class="product-card__image-wrap">
          @if (product.imageUrl) {
            <img
              [src]="product.imageUrl"
              [alt]="product.name"
              class="product-card__image"
              loading="lazy"
              width="400"
              height="300"
            />
          } @else {
            <div class="product-card__image-placeholder" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
          }
          @if (product.stock === 0) {
            <div class="product-card__stock-overlay">Uitverkocht</div>
          }
          @if (product.category) {
            <span class="product-card__category">{{ product.category }}</span>
          }
        </div>
      </a>

      <div class="product-card__body">
        <a [routerLink]="['/products', product.id]" class="product-card__name">
          {{ product.name }}
        </a>
        <p class="product-card__description">{{ product.description }}</p>

        <div class="product-card__footer">
          <div class="product-card__price-wrap">
            <span class="product-card__price">{{ product.price | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
            @if (product.stock > 0 && product.stock <= 10) {
              <span class="product-card__low-stock">Nog {{ product.stock }} op voorraad</span>
            }
          </div>

          <button
            type="button"
            class="btn btn-primary btn-sm product-card__btn"
            [disabled]="product.stock === 0"
            (click)="onAddToCart()"
            [attr.aria-label]="'Voeg ' + product.name + ' toe aan winkelwagen'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ product.stock === 0 ? 'Uitverkocht' : 'In winkelwagen' }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .product-card {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: box-shadow var(--transition-normal), transform var(--transition-normal);
    }

    .product-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .product-card--out-of-stock { opacity: 0.75; }

    .product-card__image-link { display: block; text-decoration: none; }

    .product-card__image-wrap {
      position: relative;
      aspect-ratio: 4 / 3;
      background: var(--color-surface-subtle);
      overflow: hidden;
    }

    .product-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-slow);
    }

    .product-card:hover .product-card__image { transform: scale(1.03); }

    .product-card__image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
    }

    .product-card__stock-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-lg);
    }

    .product-card__category {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
      background: rgba(27, 58, 92, 0.85);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      backdrop-filter: blur(4px);
    }

    .product-card__body {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: var(--space-2);
    }

    .product-card__name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      text-decoration: none;
      line-height: var(--line-height-tight);
    }

    .product-card__name:hover { color: var(--color-primary-light); text-decoration: underline; }

    .product-card__description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-normal);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .product-card__footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-2);
      margin-top: auto;
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
    }

    .product-card__price-wrap { display: flex; flex-direction: column; gap: 2px; }
    .product-card__price { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-primary); }
    .product-card__low-stock { font-size: var(--font-size-xs); color: var(--color-warning); font-weight: var(--font-weight-medium); }
    .product-card__btn { flex-shrink: 0; }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductDto;
  @Output() addToCart = new EventEmitter<ProductDto>();

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
