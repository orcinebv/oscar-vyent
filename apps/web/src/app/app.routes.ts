import { Routes } from '@angular/router';

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
    path: '**',
    redirectTo: '/products',
  },
];
