import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutStepsComponent } from '../../../shared/components/checkout-steps/checkout-steps.component';

@Component({
  selector: 'ov-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, CheckoutStepsComponent],
  template: `
    <div class="container">
      <ov-checkout-steps [current]="1" />

      <h1 class="page-title">Uw winkelwagen</h1>

      @if (cart.isEmpty()) {
        <div class="cart-empty">
          <div class="cart-empty__icon" aria-hidden="true">🛒</div>
          <h2>Uw winkelwagen is leeg</h2>
          <p>Voeg producten toe om verder te gaan.</p>
          <a routerLink="/products" class="btn btn-primary">Producten bekijken</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div class="cart-items">
            @for (item of cart.items(); track item.product.id) {
              <div class="cart-item card">
                <div class="cart-item__image">
                  @if (item.product.imageUrl) {
                    <img [src]="item.product.imageUrl" [alt]="item.product.name" />
                  }
                </div>
                <div class="cart-item__info">
                  <a [routerLink]="['/products', item.product.id]" class="cart-item__name">
                    {{ item.product.name }}
                  </a>
                  <p class="cart-item__unit-price">{{ item.product.price | currency:'EUR':'symbol':'1.2-2':'nl' }} per stuk</p>
                </div>
                <div class="cart-item__qty">
                  <button class="qty-btn" type="button" (click)="decrement(item.product.id, item.quantity)" aria-label="Minder">−</button>
                  <span class="qty-value" [attr.aria-label]="'Aantal: ' + item.quantity">{{ item.quantity }}</span>
                  <button class="qty-btn" type="button" (click)="cart.updateQuantity(item.product.id, item.quantity + 1)" aria-label="Meer">+</button>
                </div>
                <div class="cart-item__total">
                  {{ (item.product.price * item.quantity) | currency:'EUR':'symbol':'1.2-2':'nl' }}
                </div>
                <button class="cart-item__remove btn btn-ghost btn-sm" type="button" (click)="cart.removeItem(item.product.id)" [attr.aria-label]="'Verwijder ' + item.product.name">
                  ✕
                </button>
              </div>
            }
          </div>

          <aside class="cart-summary card">
            <h2 class="cart-summary__title">Overzicht</h2>
            <div class="cart-summary__row">
              <span>Subtotaal ({{ cart.count() }} artikel{{ cart.count() !== 1 ? 'en' : '' }})</span>
              <span>{{ cart.total() | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
            </div>
            <div class="cart-summary__row">
              <span>Verzendkosten</span>
              <span class="cart-summary__free">Gratis</span>
            </div>
            <hr class="divider" />
            <div class="cart-summary__total">
              <span>Totaal</span>
              <span>{{ cart.total() | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
            </div>

            <a routerLink="/checkout" class="btn btn-primary btn-lg btn-full cart-summary__cta">
              Verder naar bestellen →
            </a>

            <div class="cart-summary__trust">
              <span>🔒 Veilig betalen via iDEAL</span>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-6); padding-bottom: var(--space-16); }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6); }

    .cart-empty {
      text-align: center;
      padding: var(--space-16) var(--space-8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }
    .cart-empty__icon { font-size: 4rem; }
    .cart-empty h2 { font-size: var(--font-size-xl); }
    .cart-empty p { color: var(--color-text-secondary); }

    .cart-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }
    @media (min-width: 900px) { .cart-layout { grid-template-columns: 1fr 340px; align-items: start; } }

    .cart-items { display: flex; flex-direction: column; gap: var(--space-4); }

    .cart-item {
      display: grid;
      grid-template-columns: 72px 1fr auto auto auto;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
    }
    @media (max-width: 600px) {
      .cart-item { grid-template-columns: 56px 1fr; gap: var(--space-3); }
      .cart-item__qty, .cart-item__total, .cart-item__remove { grid-column: 2; }
    }

    .cart-item__image img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-md); }
    .cart-item__name { font-weight: var(--font-weight-semibold); text-decoration: none; color: var(--color-text-primary); }
    .cart-item__name:hover { color: var(--color-primary-light); text-decoration: underline; }
    .cart-item__unit-price { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }

    .cart-item__qty { display: flex; align-items: center; gap: var(--space-2); }
    .qty-btn {
      width: 32px; height: 32px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-raised);
      cursor: pointer;
      font-size: var(--font-size-lg);
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition-fast);
    }
    .qty-btn:hover { background: var(--color-surface-subtle); }
    .qty-value { min-width: 32px; text-align: center; font-weight: var(--font-weight-semibold); }

    .cart-item__total { font-weight: var(--font-weight-bold); font-size: var(--font-size-lg); min-width: 80px; text-align: right; }
    .cart-item__remove { color: var(--color-text-muted); font-size: var(--font-size-sm); }

    .cart-summary__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4); }
    .cart-summary__row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3); }
    .cart-summary__free { color: var(--color-success); font-weight: var(--font-weight-medium); }
    .cart-summary__total { display: flex; justify-content: space-between; font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6); }
    .cart-summary__cta { margin-bottom: var(--space-4); }
    .cart-summary__trust { text-align: center; font-size: var(--font-size-xs); color: var(--color-text-muted); }
  `],
})
export class CartComponent {
  protected readonly cart = inject(CartService);

  protected decrement(productId: string, currentQty: number): void {
    this.cart.updateQuantity(productId, currentQty - 1);
  }
}
