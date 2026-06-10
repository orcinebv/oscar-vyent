import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  get adminKey(): string {
    return localStorage.getItem('admin_key') ?? '';
  }

  set adminKey(value: string) {
    if (value) {
      localStorage.setItem('admin_key', value);
    } else {
      localStorage.removeItem('admin_key');
    }
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'x-admin-key': this.adminKey });
  }

  getSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.base}/settings`);
  }

  updateSettings(settings: Record<string, string>): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/settings`, settings, {
      headers: this.headers,
    });
  }

  resetSequence(startAt: number): Observable<{ nextValue: number }> {
    return this.http.post<{ nextValue: number }>(
      `${this.base}/orders/admin/reset-sequence`,
      { startAt },
      { headers: this.headers },
    );
  }
}
