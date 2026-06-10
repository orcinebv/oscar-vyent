import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  getSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.base}/settings`);
  }

  updateSettings(settings: Record<string, string>): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/settings`, settings);
  }

  resetSequence(startAt: number): Observable<{ nextValue: number }> {
    return this.http.post<{ nextValue: number }>(
      `${this.base}/orders/admin/reset-sequence`,
      { startAt },
    );
  }
}
