import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  login(username: string, password: string): Observable<{ accessToken: string }> {
    return this.http
      .post<{ accessToken: string }>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.accessToken)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    void this.router.navigate(['/login']);
  }
}
