import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'ov-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header" role="banner">
      <div class="container header__inner">
        <a routerLink="/products" class="header__logo" aria-label="Oscar Vyent — naar startpagina">
          <img src="/assets/logo.jpg" alt="Oscar Vyent" class="header__logo-img" />
        </a>

        <nav class="header__nav" role="navigation" aria-label="Hoofdmenu">
          <a routerLink="/products" routerLinkActive="active" class="header__nav-link">
            Producten
          </a>
        </nav>

        <div class="header__actions">
          <a routerLink="/cart" class="header__cart" [attr.aria-label]="'Winkelwagen, ' + cart.count() + ' artikelen'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            @if (cart.count() > 0) {
              <span class="header__cart-badge" aria-hidden="true">{{ cart.count() }}</span>
            }
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--header-height);
      background: var(--color-surface-raised);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      z-index: 100;
    }

    .header__inner {
      display: flex;
      align-items: center;
      height: 100%;
      gap: var(--space-6);
    }

    .header__logo {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--color-text-primary);
      flex-shrink: 0;
    }

    .header__logo-img {
      height: 56px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .header__nav {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex: 1;
    }

    .header__nav-link {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      text-decoration: none;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: color var(--transition-fast), background-color var(--transition-fast);
    }

    .header__nav-link:hover,
    .header__nav-link.active {
      color: var(--color-accent);
      background-color: var(--color-surface-subtle);
      text-decoration: none;
    }

    .header__actions { margin-left: auto; }

    .header__cart {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }

    .header__cart:hover {
      background-color: var(--color-surface-subtle);
      color: var(--color-primary);
      text-decoration: none;
    }

    .header__cart-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      background: var(--color-accent);
      color: white;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: var(--font-weight-bold);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid var(--color-surface-raised);
    }
  `],
})
export class HeaderComponent {
  protected readonly cart = inject(CartService);
}
