import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentsService } from '../../../core/services/payments.service';
import { PaymentStatusDto } from '@oscar-vyent/contracts';
import { DecimalPipe } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type ReturnState = 'polling' | 'paid' | 'failed' | 'timeout';

@Component({
  selector: 'ov-payment-return',
  standalone: true,
  imports: [RouterLink, DecimalPipe, LoadingSpinnerComponent],
  template: `
    <div class="container">
      <div class="return-wrap">

        @switch (state()) {
          @case ('polling') {
            <div class="return-card card">
              <ov-loading-spinner message="Betalingsstatus controleren..." />
              <p class="return-hint">Even geduld, wij verwerken uw betaling.</p>
            </div>
          }

          @case ('paid') {
            <div class="return-card card return-card--success">
              <div class="return-icon" aria-hidden="true">✓</div>
              <h1 class="return-title">Betaling gelukt!</h1>

              @if (orderNumber()) {
                <div class="volgnummer-wrap">
                  <p class="volgnummer-label">Uw volgnummer</p>
                  <span class="volgnummer">{{ orderNumber()! | number:'3.0-0' }}</span>
                  <p class="volgnummer-hint">Laat dit nummer zien bij het ophalen van uw bestelling.</p>
                </div>
              }

              <a [routerLink]="['/orders', orderId()]" class="btn btn-secondary btn-lg">Bestelling bekijken</a>
            </div>
          }

          @case ('failed') {
            <div class="return-card card return-card--failed">
              <div class="return-icon" aria-hidden="true">✕</div>
              <h1 class="return-title">Betaling mislukt</h1>
              <p class="return-subtitle">{{ errorMessage() }}</p>
              <div class="return-actions">
                <a routerLink="/cart" class="btn btn-primary btn-lg">Opnieuw proberen</a>
                <a routerLink="/products" class="btn btn-secondary btn-lg">Producten bekijken</a>
              </div>
            </div>
          }

          @case ('timeout') {
            <div class="return-card card">
              <div class="return-icon return-icon--neutral" aria-hidden="true">⏳</div>
              <h1 class="return-title">Betaling wordt verwerkt</h1>
              <p class="return-subtitle">
                Wij hebben uw betaling nog niet ontvangen. Dit kan een moment duren.
              </p>
              @if (orderId()) {
                <a [routerLink]="['/orders', orderId()]" class="btn btn-secondary btn-lg">Bestelling bekijken</a>
              }
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .container { padding-top: var(--space-16); padding-bottom: var(--space-16); }

    .return-wrap {
      max-width: 520px;
      margin: 0 auto;
    }

    .return-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-10);
    }

    .return-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      background: var(--color-surface-subtle);
      color: var(--color-text-secondary);
    }

    .return-card--success .return-icon { background: var(--color-success-surface); color: var(--color-success); }
    .return-card--failed  .return-icon { background: var(--color-error-surface);   color: var(--color-error);   }

    .return-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
    .return-subtitle { color: var(--color-text-secondary); line-height: var(--line-height-normal); max-width: 380px; }
    .return-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); }

    .volgnummer-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-surface-subtle);
      border: 2px solid var(--color-success);
      border-radius: var(--radius-xl);
      padding: var(--space-6) var(--space-10);
      width: 100%;
    }

    .volgnummer-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0;
    }

    .volgnummer {
      font-size: 4rem;
      font-weight: var(--font-weight-bold);
      color: var(--color-success);
      line-height: 1;
    }

    .volgnummer-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin: 0;
    }

    .return-actions { display: flex; gap: var(--space-4); flex-wrap: wrap; justify-content: center; }
  `],
})
export class PaymentReturnComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentsService = inject(PaymentsService);

  protected readonly state = signal<ReturnState>('polling');
  protected readonly orderId = signal<string | null>(null);
  protected readonly orderNumber = signal<number | null>(null);
  protected readonly errorMessage = signal<string>('De betaling is niet geslaagd. Probeer het opnieuw.');

  private pollSub?: Subscription;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const oid = params.get('orderId');
    const pid = params.get('paymentId');

    this.orderId.set(oid);

    if (!pid) {
      this.state.set('timeout');
      return;
    }

    // SECURITY: We deliberately ignore any 'status' query param from Mollie.
    // The only trusted source of truth is the server-side payment status.
    this.pollSub = this.paymentsService.pollUntilResolved(pid).subscribe({
      next: (status: PaymentStatusDto) => {
        if (status.status === 'paid') {
          this.orderNumber.set(status.orderNumber ?? null);
          this.state.set('paid');
        } else if (['failed', 'expired', 'canceled'].includes(status.status)) {
          const msgs: Record<string, string> = {
            failed:   'De betaling is mislukt. Probeer het opnieuw.',
            expired:  'De betalingssessie is verlopen. Start een nieuwe bestelling.',
            canceled: 'De betaling is geannuleerd.',
          };
          this.errorMessage.set(msgs[status.status] ?? 'De betaling is niet gelukt.');
          this.state.set('failed');
        } else {
          this.state.set('timeout');
        }
      },
      error: () => {
        this.state.set('timeout');
      },
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
