import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, filter, take, timeout, catchError, of } from 'rxjs';
import {
  CreatePaymentDto,
  CreatePaymentResponseDto,
  PaymentStatusDto,
  PaymentStatus,
} from '@oscar-vyent/contracts';
import { environment } from '../../../environments/environment';

const TERMINAL_STATUSES: PaymentStatus[] = ['paid', 'failed', 'expired', 'canceled'];
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS  = 30_000;

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payments`;

  create(dto: CreatePaymentDto): Observable<CreatePaymentResponseDto> {
    return this.http.post<CreatePaymentResponseDto>(this.base, dto);
  }

  getStatus(paymentId: string): Observable<PaymentStatusDto> {
    return this.http.get<PaymentStatusDto>(`${this.base}/${paymentId}/status`);
  }

  /**
   * Polls payment status every 3 seconds until a terminal status is reached.
   * Stops after 30 seconds regardless (returns last known status).
   *
   * SECURITY: We never trust the Mollie redirect query parameters.
   * This polling fetches the server-verified status.
   */
  pollUntilResolved(paymentId: string): Observable<PaymentStatusDto> {
    return interval(POLL_INTERVAL_MS).pipe(
      switchMap(() => this.getStatus(paymentId).pipe(catchError(() => of(null)))),
      filter((status): status is PaymentStatusDto => {
        if (!status) return false;
        return TERMINAL_STATUSES.includes(status.status);
      }),
      take(1),
      timeout({
        each: POLL_TIMEOUT_MS,
        with: () => this.getStatus(paymentId), // return final status on timeout
      }),
    );
  }
}
