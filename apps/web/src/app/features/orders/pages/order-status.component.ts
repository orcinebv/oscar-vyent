import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { OrderDto, OrderStatus } from '@oscar-vyent/contracts';
import { OrdersService } from '../../../core/services/orders.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:         'In afwachting',
  payment_pending: 'Betaling verwerken',
  paid:            'Betaald',
  processing:      'In verwerking',
  shipped:         'Verzonden',
  completed:       'Afgeleverd',
  cancelled:       'Geannuleerd',
  failed:          'Mislukt',
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending:         'badge-neutral',
  payment_pending: 'badge-warning',
  paid:            'badge-success',
  processing:      'badge-info',
  shipped:         'badge-info',
  completed:       'badge-success',
  cancelled:       'badge-error',
  failed:          'badge-error',
};

@Component({
  selector: 'ov-order-status',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, LoadingSpinnerComponent],
  template: `
    <div class="container">
      @if (loading()) {
        <ov-loading-spinner message="Bestelling laden..." />
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else {
        @if (order(); as o) {
        <div class="order-status">

          <header class="order-header">
            <div>
              <h1 class="order-title">Bestelling #{{ o.id.slice(0, 8).toUpperCase() }}</h1>
              <p class="order-date">Geplaatst op {{ o.createdAt | date:'d MMMM yyyy, HH:mm':'':'nl' }}</p>
            </div>
            <span class="badge {{ statusBadge(o.status) }}">{{ statusLabel(o.status) }}</span>
          </header>

          <div class="order-layout">
            <!-- Items -->
            <section class="card order-items-section" aria-labelledby="items-heading">
              <h2 id="items-heading" class="section-title">Bestelde artikelen</h2>
              <ul class="order-items">
                @for (item of o.items; track item.id) {
                  <li class="order-item">
                    <div class="order-item__info">
                      <span class="order-item__name">{{ item.productName }}</span>
                      <span class="order-item__qty">× {{ item.quantity }}</span>
                    </div>
                    <span class="order-item__price">{{ item.totalPrice | currency:'EUR':'symbol':'1.2-2':'nl' }}</span>
                  </li>
                }
              </ul>
              <hr class="divider" />
              <div class="order-total">
                <span>Totaal</span>
                <strong>{{ o.totalAmount | currency:'EUR':'symbol':'1.2-2':'nl' }}</strong>
              </div>
            </section>

            <!-- Details -->
            <aside>
              <section class="card order-details-section" aria-labelledby="details-heading">
                <h2 id="details-heading" class="section-title">Bezorggegevens</h2>
                <address class="order-address">
                  {{ o.customerFirstName }} {{ o.customerLastName }}<br/>
                  {{ o.shippingAddress }}<br/>
                  {{ o.shippingPostalCode }} {{ o.shippingCity }}<br/>
                  {{ o.shippingCountry }}
                </address>
              </section>

              @if (o.status === 'paid' || o.status === 'processing' || o.status === 'shipped') {
                <section class="card order-steps-section" aria-labelledby="steps-heading" style="margin-top: var(--space-4)">
                  <h2 id="steps-heading" class="section-title">Bestellingstatus</h2>
                  <div class="progress-steps">
                    @for (step of progressSteps; track step.status) {
                      <div class="progress-step" [class.progress-step--done]="isStepDone(o.status, step.status)" [class.progress-step--active]="o.status === step.status">
                        <div class="progress-step__dot"></div>
                        <span>{{ step.label }}</span>
                      </div>
                    }
                  </div>
                </section>
              }
            </aside>
          </div>

          <div class="order-footer">
            <a routerLink="/products" class="btn btn-secondary">Verder winkelen</a>
          </div>
        </div>
        }
      }
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-8); padding-bottom: var(--space-16); }

    .order-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
    }

    .order-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
    .order-date  { color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-top: var(--space-1); }

    .order-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }
    @media (min-width: 768px) { .order-layout { grid-template-columns: 1fr 300px; align-items: start; } }

    .section-title { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-size: var(--font-size-xs); }

    .order-items { display: flex; flex-direction: column; gap: var(--space-3); }
    .order-item { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--font-size-sm); }
    .order-item__info { display: flex; gap: var(--space-2); flex: 1; }
    .order-item__name { color: var(--color-text-primary); }
    .order-item__qty { color: var(--color-text-muted); }
    .order-item__price { font-weight: var(--font-weight-medium); }
    .order-total { display: flex; justify-content: space-between; font-size: var(--font-size-lg); }

    .order-address { font-style: normal; font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: var(--line-height-loose); }

    .progress-steps { display: flex; flex-direction: column; gap: var(--space-3); }
    .progress-step { display: flex; align-items: center; gap: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .progress-step__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border); flex-shrink: 0; }
    .progress-step--done .progress-step__dot { background: var(--color-success); }
    .progress-step--done { color: var(--color-text-secondary); }
    .progress-step--active .progress-step__dot { background: var(--color-primary); box-shadow: 0 0 0 3px rgba(250,179,62,0.3); }
    .progress-step--active { color: var(--color-primary); font-weight: var(--font-weight-semibold); }

    .order-footer { margin-top: var(--space-8); }
  `],
})
export class OrderStatusComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  protected readonly order = signal<OrderDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly progressSteps = [
    { status: 'paid' as OrderStatus, label: 'Betaling ontvangen' },
    { status: 'processing' as OrderStatus, label: 'Bestelling verwerkt' },
    { status: 'shipped' as OrderStatus, label: 'Verzonden' },
    { status: 'completed' as OrderStatus, label: 'Afgeleverd' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService
      .getOne(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (o) => this.order.set(o),
        error: () => this.error.set('Bestelling kon niet worden geladen.'),
      });
  }

  protected statusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected statusBadge(status: OrderStatus): string {
    return STATUS_BADGE_CLASS[status] ?? 'badge-neutral';
  }

  protected isStepDone(currentStatus: OrderStatus, stepStatus: OrderStatus): boolean {
    const order = ['paid', 'processing', 'shipped', 'completed'];
    return order.indexOf(currentStatus) >= order.indexOf(stepStatus);
  }
}
