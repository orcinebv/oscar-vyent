import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'ov-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-box__logo">
          <img src="/assets/logo.jpg" alt="Oscar Vyent" />
        </div>
        <h1 class="login-box__title">Beheer inloggen</h1>

        <form (ngSubmit)="onSubmit()" class="login-box__form">
          <div class="field">
            <label class="field__label" for="username">Gebruikersnaam</label>
            <input
              id="username"
              class="field__input"
              type="text"
              [(ngModel)]="username"
              name="username"
              autocomplete="username"
              required
            />
          </div>

          <div class="field">
            <label class="field__label" for="password">Wachtwoord</label>
            <input
              id="password"
              class="field__input"
              type="password"
              [(ngModel)]="password"
              name="password"
              autocomplete="current-password"
              required
            />
          </div>

          @if (error()) {
            <p class="login-box__error">{{ error() }}</p>
          }

          <button
            type="submit"
            class="login-box__btn"
            [disabled]="loading()"
          >
            {{ loading() ? 'Inloggen...' : 'Inloggen' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface-subtle);
      padding: var(--space-4);
    }

    .login-box {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-10) var(--space-8);
      width: 100%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .login-box__logo {
      display: flex;
      justify-content: center;
    }

    .login-box__logo img {
      height: 64px;
      width: auto;
      object-fit: contain;
    }

    .login-box__title {
      text-align: center;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .login-box__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
    .field__input {
      height: 42px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      background: var(--color-surface-subtle);
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .field__input:focus { border-color: var(--color-primary); }

    .login-box__error {
      background: #fef2f2;
      color: #991b1b;
      border-radius: var(--radius-md);
      padding: var(--space-3);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .login-box__btn {
      width: 100%;
      height: 44px;
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: opacity var(--transition-fast);
      margin-top: var(--space-2);
    }
    .login-box__btn:not(:disabled):hover { opacity: 0.88; }
    .login-box__btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected username = '';
  protected password = '';
  protected loading = signal(false);
  protected error = signal('');

  protected onSubmit(): void {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        void this.router.navigate(['/beheer']);
      },
      error: () => {
        this.error.set('Ongeldige gebruikersnaam of wachtwoord.');
        this.loading.set(false);
      },
    });
  }
}
