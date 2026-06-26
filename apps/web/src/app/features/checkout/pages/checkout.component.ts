import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrdersService } from '../../../core/services/orders.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { CheckoutStepsComponent } from '../../../shared/components/checkout-steps/checkout-steps.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'ov-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, CheckoutStepsComponent, LoadingSpinnerComponent],
  template: `
    <div class="container">
      <ov-checkout-steps [current]="2" />

      @if (cart.isEmpty()) {
        <div class="alert alert-error">
          Uw winkelwagen is leeg.
          <a routerLink="/products" class="btn btn-ghost btn-sm">Producten bekijken</a>
        </div>
      } @else {
        <div class="checkout-layout">
          <!-- Checkout form -->
          <section class="checkout-form-section" aria-labelledby="checkout-heading">
            <h1 id="checkout-heading" class="section-title">Afronden</h1>
            <p class="checkout-intro">Na betaling ontvangt u een <strong>volgnummer</strong> om uw bestelling op te halen.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="checkout-form">

              @if (submitting()) {
                <ov-loading-spinner message="Bestelling verwerken..." />
              } @else {
                <button type="submit" class="btn btn-primary btn-lg btn-full">
                  Doorgaan naar betaling →
                </button>
              }

              @if (submitError()) {
                <div class="alert alert-error" role="alert">{{ submitError() }}</div>
              }
            </form>
          </section>

          <!-- Order summary sidebar -->
          <aside class="checkout-summary card" aria-label="Besteloverzicht">
            <h2 class="section-title">Uw bestelling</h2>

            <ul class="summary-items">
              @for (item of cart.items(); track item.lineId) {
                <li class="summary-item">
                  <span class="summary-item__name">
                    {{ item.product.name }}
                    <span class="summary-item__qty">× {{ item.quantity }}</span>
                    @if (item.isCombo && item.selectedComboSlots?.length) {
                      @for (slot of item.selectedComboSlots!; track slot.productId) {
                        <span class="summary-item__extras">
                          {{ slot.productName }}@if (slot.selectedExtras.length) { · {{ slot.selectedExtras.join(', ') }}}
                        </span>
                      }
                      @if (item.comboExtras?.length) {
                        <span class="summary-item__extras summary-item__extras--wishes">Wensen: {{ item.comboExtras!.join(', ') }}</span>
                      }
                    } @else if (item.selectedExtras.length) {
                      <span class="summary-item__extras">{{ item.selectedExtras.join(', ') }}</span>
                    }
                  </span>
                  <span class="summary-item__price">
                    {{ (item.product.price * item.quantity) | currency:'EUR':'symbol':'1.2-2':'nl' }}
                  </span>
                </li>
              }
            </ul>

            <div class="summary-row summary-row--vat">
              <span>Waarvan BTW (21%)</span>
              <span>{{ cart.vatAmount() | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
            </div>

            <hr class="divider" />

            <div class="summary-total">
              <span>Totaal incl. BTW</span>
              <strong>{{ cart.total() | currency:'EUR':'symbol':'1.2-2':'nl' }}</strong>
            </div>

            <div class="payment-method">
              <img src="assets/ideal-logo.svg" alt="iDEAL" class="payment-method__logo" width="40" height="40" />
              <span>Betaling via iDEAL</span>
            </div>

            <ul class="trust-signals">
              <li>🔒 256-bit SSL beveiliging</li>
              <li>🏦 Betalen via uw eigen bank</li>
              <li>🎟️ Volgnummer na betaling</li>
            </ul>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-6); padding-bottom: var(--space-16); }

    .checkout-intro {
      color: var(--color-text-secondary);
      margin-bottom: var(--space-6);
      line-height: var(--line-height-normal);
    }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-8);
    }
    @media (min-width: 900px) { .checkout-layout { grid-template-columns: 1fr 340px; align-items: start; } }

    .section-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4); }

    .checkout-form { display: flex; flex-direction: column; gap: var(--space-6); }

    .field { display: flex; flex-direction: column; }

    .form-label-optional { font-weight: var(--font-weight-normal); color: var(--color-text-muted); font-size: var(--font-size-xs); }

    /* Summary sidebar */
    .summary-items { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .summary-item { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--font-size-sm); }
    .summary-item__name { color: var(--color-text-secondary); flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .summary-item__qty { color: var(--color-text-muted); }
    .summary-item__extras { font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; }
    .summary-item__price { font-weight: var(--font-weight-medium); margin-left: var(--space-4); }

    .summary-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--space-2); }
    .summary-row--vat { color: var(--color-text-muted); font-style: italic; }
    .summary-total { display: flex; justify-content: space-between; font-size: var(--font-size-lg); margin-bottom: var(--space-4); }

    .payment-method {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-info-surface);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
    }
    .payment-method__logo { border-radius: var(--radius-sm); }

    .trust-signals { display: flex; flex-direction: column; gap: var(--space-2); }
    .trust-signals li { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
  `],
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly paymentsService = inject(PaymentsService);
  protected readonly cart = inject(CartService);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly form = this.fb.group({});

  ngOnInit(): void {
    if (this.cart.isEmpty()) {
      void this.router.navigate(['/cart']);
    }
  }

  protected onSubmit(): void {
    this.submitting.set(true);
    this.submitError.set(null);

    const orderDto = {
      items: this.cart.items().map((i) => i.isCombo
        ? {
            comboId: i.comboId,
            itemType: 'combo' as const,
            quantity: i.quantity,
            selectedExtras: [
              ...(i.selectedComboSlots
                ? i.selectedComboSlots.flatMap(s =>
                    s.selectedExtras.length
                      ? [`${s.productName}: ${s.selectedExtras.join(', ')}`]
                      : [s.productName]
                  )
                : (i.selectedComboItems ?? [])),
              ...(i.comboExtras ?? []),
            ],
          }
        : {
            productId: i.product.id,
            itemType: 'product' as const,
            quantity: i.quantity,
            selectedExtras: i.selectedExtras?.length ? i.selectedExtras : undefined,
          }),
    };

    this.ordersService
      .create(orderDto)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (order) => {
          this.submitting.set(true);
          this.paymentsService
            .create({ orderId: order.id, method: 'ideal' })
            .pipe(finalize(() => this.submitting.set(false)))
            .subscribe({
              next: (payment) => {
                this.cart.clear();
                window.location.href = payment.checkoutUrl;
              },
              error: () => {
                this.submitError.set('Betaling kon niet worden gestart. Probeer het opnieuw.');
              },
            });
        },
        error: () => {
          this.submitError.set('Bestelling kon niet worden aangemaakt. Probeer het opnieuw.');
        },
      });
  }
}
