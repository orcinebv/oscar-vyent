import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/catalog/pages/product-list.component').then(
        (m) => m.ProductListComponent,
      ),
    title: 'Producten — Oscar Vyent',
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/catalog/pages/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
    title: 'Product — Oscar Vyent',
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/pages/cart.component').then((m) => m.CartComponent),
    title: 'Winkelwagen — Oscar Vyent',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/pages/checkout.component').then(
        (m) => m.CheckoutComponent,
      ),
    title: 'Afrekenen — Oscar Vyent',
  },
  {
    path: 'payment/return',
    loadComponent: () =>
      import('./features/payment/pages/payment-return.component').then(
        (m) => m.PaymentReturnComponent,
      ),
    title: 'Betaling — Oscar Vyent',
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/pages/order-status.component').then(
        (m) => m.OrderStatusComponent,
      ),
    title: 'Bestelling — Oscar Vyent',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/pages/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
    title: 'Inloggen — Oscar Vyent',
  },
  {
    path: 'beheer',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/pages/admin-products.component').then(
        (m) => m.AdminProductsComponent,
      ),
    title: 'Productbeheer — Oscar Vyent',
  },
  {
    path: 'beheer/extras',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/pages/admin-extras.component').then(
        (m) => m.AdminExtrasComponent,
      ),
    title: 'Extras Beheer — Oscar Vyent',
  },
  {
    path: 'beheer/combos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/pages/admin-combos.component').then(
        (m) => m.AdminCombosComponent,
      ),
    title: 'Combinaties Beheer — Oscar Vyent',
  },
  {
    path: 'beheer/instellingen',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/pages/admin-instellingen.component').then(
        (m) => m.AdminInstellingenComponent,
      ),
    title: 'Instellingen — Oscar Vyent',
  },
  {
    path: 'combos/:id',
    loadComponent: () =>
      import('./features/catalog/pages/combo-detail.component').then(
        (m) => m.ComboDetailComponent,
      ),
    title: 'Combinatie — Oscar Vyent',
  },
  {
    path: '**',
    redirectTo: '/products',
  },
];
