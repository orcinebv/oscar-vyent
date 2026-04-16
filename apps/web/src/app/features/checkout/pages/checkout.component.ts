import { Component, inject, signal, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrdersService } from '../../../core/services/orders.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { ToastService } from '../../../core/services/toast.service';
import { CheckoutStepsComponent } from '../../../shared/components/checkout-steps/checkout-steps.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/** Dutch postal code: 4 digits + space (optional) + 2 uppercase letters */
const DUTCH_POSTAL_CODE = /^[1-9][0-9]{3}\s?[A-Z]{2}$/;
/** Loose phone validation for NL/international numbers */
const PHONE_PATTERN = /^[+]?[0-9\s\-(). ]{7,20}$/;

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
            <h1 id="checkout-heading" class="section-title">Uw gegevens</h1>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="checkout-form">

              <fieldset class="fieldset">
                <legend class="fieldset__legend">Contactgegevens</legend>

                <div class="field">
                  <label for="email" class="form-label required">E-mailadres</label>
                  <input id="email" type="email" class="form-control" formControlName="customerEmail" autocomplete="email" placeholder="uw@email.nl" />
                  @if (f['customerEmail'].invalid && f['customerEmail'].touched) {
                    <span class="form-error">Voer een geldig e-mailadres in.</span>
                  }
                </div>

                <div class="field-row">
                  <div class="field">
                    <label for="firstName" class="form-label required">Voornaam</label>
                    <input id="firstName" type="text" class="form-control" formControlName="customerFirstName" autocomplete="given-name" />
                    @if (f['customerFirstName'].invalid && f['customerFirstName'].touched) {
                      <span class="form-error">Voornaam is verplicht (minimaal 2 tekens).</span>
                    }
                  </div>
                  <div class="field">
                    <label for="lastName" class="form-label required">Achternaam</label>
                    <input id="lastName" type="text" class="form-control" formControlName="customerLastName" autocomplete="family-name" />
                    @if (f['customerLastName'].invalid && f['customerLastName'].touched) {
                      <span class="form-error">Achternaam is verplicht.</span>
                    }
                  </div>
                </div>

                <div class="field">
                  <label for="phone" class="form-label">Telefoonnummer <span class="form-label-optional">(optioneel)</span></label>
                  <input id="phone" type="tel" class="form-control" formControlName="customerPhone" autocomplete="tel" placeholder="+31 6 12345678" />
                  @if (f['customerPhone'].invalid && f['customerPhone'].touched) {
                    <span class="form-error">Voer een geldig telefoonnummer in.</span>
                  }
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset__legend">Bezorgadres</legend>

                <div class="field">
                  <label for="address" class="form-label required">Straat en huisnummer</label>
                  <input id="address" type="text" class="form-control" formControlName="shippingAddress" autocomplete="street-address" placeholder="Keizersgracht 1" />
                  @if (f['shippingAddress'].invalid && f['shippingAddress'].touched) {
                    <span class="form-error">Adres is verplicht.</span>
                  }
                </div>

                <div class="field-row">
                  <div class="field">
                    <label for="postal" class="form-label required">Postcode</label>
                    <input id="postal" type="text" class="form-control" formControlName="shippingPostalCode" autocomplete="postal-code" placeholder="1234 AB" style="text-transform:uppercase" />
                    @if (f['shippingPostalCode'].invalid && f['shippingPostalCode'].touched) {
                      <span class="form-error">Voer een geldige postcode in (bijv. 1234 AB).</span>
                    }
                  </div>
                  <div class="field">
                    <label for="city" class="form-label required">Plaats</label>
                    <input id="city" type="text" class="form-control" formControlName="shippingCity" autocomplete="address-level2" placeholder="Amsterdam" />
                    @if (f['shippingCity'].invalid && f['shippingCity'].touched) {
                      <span class="form-error">Plaats is verplicht.</span>
                    }
                  </div>
                </div>
              </fieldset>

              <div class="field">
                <label for="notes" class="form-label">Opmerkingen <span class="form-label-optional">(optioneel)</span></label>
                <textarea id="notes" class="form-control" formControlName="notes" rows="3" placeholder="Eventuele opmerkingen voor uw bestelling..."></textarea>
              </div>

              @if (submitting()) {
                <ov-loading-spinner message="Bestelling verwerken..." />
              } @else {
                <button type="submit" class="btn btn-primary btn-lg btn-full" [disabled]="form.invalid">
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
              @for (item of cart.items(); track item.product.id) {
                <li class="summary-item">
                  <span class="summary-item__name">
                    {{ item.product.name }}
                    <span class="summary-item__qty">× {{ item.quantity }}</span>
                  </span>
                  <span class="summary-item__price">
                    {{ (item.product.price * item.quantity) | currency:'EUR':'symbol':'1.2-2':'nl' }}
                  </span>
                </li>
              }
            </ul>

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
              <li>📋 Orderbevestiging per e-mail</li>
            </ul>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-6); padding-bottom: var(--space-16); }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-8);
    }
    @media (min-width: 900px) { .checkout-layout { grid-template-columns: 1fr 340px; align-items: start; } }

    .section-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6); }

    .checkout-form { display: flex; flex-direction: column; gap: var(--space-6); }

    .fieldset {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .fieldset__legend {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0 var(--space-2);
    }

    .field { display: flex; flex-direction: column; }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }
    @media (max-width: 600px) { .field-row { grid-template-columns: 1fr; } }

    .form-label-optional { font-weight: var(--font-weight-normal); color: var(--color-text-muted); font-size: var(--font-size-xs); }

    /* Summary sidebar */
    .summary-items { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .summary-item { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--font-size-sm); }
    .summary-item__name { color: var(--color-text-secondary); flex: 1; }
    .summary-item__qty { color: var(--color-text-muted); margin-left: var(--space-1); }
    .summary-item__price { font-weight: var(--font-weight-medium); margin-left: var(--space-4); }

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
  private readonly toast = inject(ToastService);
  protected readonly cart = inject(CartService);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    customerEmail:       ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    customerFirstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    customerLastName:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    customerPhone:       ['', [Validators.pattern(PHONE_PATTERN)]],
    shippingAddress:     ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    shippingPostalCode:  ['', [Validators.required, Validators.pattern(DUTCH_POSTAL_CODE)]],
    shippingCity:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    notes:               ['', Validators.maxLength(1000)],
  });

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  ngOnInit(): void {
    if (this.cart.isEmpty()) {
      void this.router.navigate(['/cart']);
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    const v = this.form.value;
    const orderDto = {
      customerEmail:      v.customerEmail!,
      customerFirstName:  v.customerFirstName!,
      customerLastName:   v.customerLastName!,
      customerPhone:      v.customerPhone ?? undefined,
      shippingAddress:    v.shippingAddress!,
      shippingPostalCode: v.shippingPostalCode!.toUpperCase().replace(/\s/, ' '),
      shippingCity:       v.shippingCity!,
      shippingCountry:    'NL',
      notes:              v.notes ?? undefined,
      items: this.cart.items().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.ordersService
      .create(orderDto)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (order) => {
          // Step 2: create Mollie payment
          this.submitting.set(true);
          this.paymentsService
            .create({ orderId: order.id, method: 'ideal' })
            .pipe(finalize(() => this.submitting.set(false)))
            .subscribe({
              next: (payment) => {
                // Cart cleared before redirect — prevents accidental re-order on back
                this.cart.clear();
                // Redirect to Mollie hosted checkout page
                window.location.href = payment.checkoutUrl;
              },
              error: () => {
                this.submitError.set('Betaling kon niet worden gestart. Probeer het opnieuw.');
              },
            });
        },
        error: () => {
          this.submitError.set('Bestelling kon niet worden aangemaakt. Controleer uw gegevens.');
        },
      });
  }
}
