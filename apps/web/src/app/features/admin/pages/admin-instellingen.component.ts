import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';

@Component({
  selector: 'ov-admin-instellingen',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin">
      <div class="admin__header">
        <h1 class="admin__title">Instellingen</h1>
      </div>

      <!-- Admin sleutel -->
      <section class="card">
        <h2 class="card__title">Admin toegang</h2>
        <p class="card__desc">Voer hier de admin sleutel in om wijzigingen op te slaan. De sleutel wordt lokaal opgeslagen in de browser.</p>
        <div class="field-row">
          <input
            class="field__input"
            type="password"
            [(ngModel)]="adminKeyInput"
            placeholder="Admin sleutel"
            autocomplete="off"
          />
          <button class="btn btn--primary" (click)="saveAdminKey()">Opslaan</button>
        </div>
        @if (adminKeySaved()) {
          <p class="feedback feedback--ok">Sleutel opgeslagen.</p>
        }
      </section>

      <!-- E-mail instellingen -->
      <section class="card">
        <h2 class="card__title">E-mail notificaties</h2>
        <p class="card__desc">Elke nieuwe bestelling wordt verstuurd naar dit e-mailadres.</p>
        @if (loadingSettings()) {
          <p class="admin__loading">Laden...</p>
        } @else {
          <div class="field-row">
            <input
              class="field__input"
              type="email"
              [(ngModel)]="mailTo"
              placeholder="ontvanger@voorbeeld.nl"
            />
            <button class="btn btn--primary" [disabled]="savingMail()" (click)="saveMail()">
              {{ savingMail() ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
          @if (mailFeedback()) {
            <p class="feedback" [class.feedback--ok]="mailFeedback() === 'ok'" [class.feedback--err]="mailFeedback() !== 'ok'">
              {{ mailFeedback() === 'ok' ? 'E-mailadres opgeslagen.' : mailFeedback() }}
            </p>
          }
        }
      </section>

      <!-- Bestelnummer resetten -->
      <section class="card">
        <h2 class="card__title">Bestelnummer resetten</h2>
        <p class="card__desc">Stel het volgende bestelnummer in. Gebruik dit alleen als je bewust wilt herstarten.</p>
        <div class="field-row">
          <input
            class="field__input field__input--sm"
            type="number"
            [(ngModel)]="sequenceStart"
            min="1"
            placeholder="1"
          />
          <button class="btn btn--danger" [disabled]="resetting()" (click)="resetSequence()">
            {{ resetting() ? 'Resetten...' : 'Resetten' }}
          </button>
        </div>
        @if (resetFeedback()) {
          <p class="feedback" [class.feedback--ok]="resetOk()" [class.feedback--err]="!resetOk()">
            {{ resetFeedback() }}
          </p>
        }
      </section>
    </div>
  `,
  styles: [`
    .admin { max-width: 720px; margin: 0 auto; padding: var(--space-8) var(--space-4) var(--space-16); }
    .admin__header { margin-bottom: var(--space-8); }
    .admin__title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .admin__loading { color: var(--color-text-secondary); font-size: var(--font-size-sm); }

    .card {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .card__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .card__desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: 0; }

    .field-row { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
    .field__input {
      flex: 1;
      min-width: 200px;
      height: 38px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      background: var(--color-surface-subtle);
      outline: none;
    }
    .field__input:focus { border-color: var(--color-primary); }
    .field__input--sm { flex: 0 0 120px; min-width: 0; }

    .btn {
      height: 38px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      border: none;
      white-space: nowrap;
      transition: opacity var(--transition-fast);
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn--primary:not(:disabled):hover { opacity: 0.88; }
    .btn--danger { background: #dc2626; color: #fff; }
    .btn--danger:not(:disabled):hover { opacity: 0.88; }

    .feedback { font-size: var(--font-size-sm); margin: 0; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
    .feedback--ok { background: #f0fdf4; color: #166534; }
    .feedback--err { background: #fef2f2; color: #991b1b; }
  `],
})
export class AdminInstellingenComponent implements OnInit {
  private readonly adminSettings = inject(AdminSettingsService);

  protected adminKeyInput = signal('');
  protected adminKeySaved = signal(false);

  protected mailTo = signal('');
  protected loadingSettings = signal(true);
  protected savingMail = signal(false);
  protected mailFeedback = signal('');

  protected sequenceStart = signal(1);
  protected resetting = signal(false);
  protected resetFeedback = signal('');
  protected resetOk = signal(false);

  ngOnInit(): void {
    this.adminKeyInput.set(this.adminSettings.adminKey);
    this.adminSettings.getSettings().subscribe({
      next: (s) => {
        this.mailTo.set(s['mail.to'] ?? 'orcinebv@gmail.com');
        this.loadingSettings.set(false);
      },
      error: () => this.loadingSettings.set(false),
    });
  }

  protected saveAdminKey(): void {
    this.adminSettings.adminKey = this.adminKeyInput();
    this.adminKeySaved.set(true);
    setTimeout(() => this.adminKeySaved.set(false), 3000);
  }

  protected saveMail(): void {
    this.savingMail.set(true);
    this.mailFeedback.set('');
    this.adminSettings.updateSettings({ 'mail.to': this.mailTo() }).subscribe({
      next: () => {
        this.mailFeedback.set('ok');
        this.savingMail.set(false);
      },
      error: (err) => {
        this.mailFeedback.set(err?.error?.message ?? 'Opslaan mislukt. Controleer de admin sleutel.');
        this.savingMail.set(false);
      },
    });
  }

  protected resetSequence(): void {
    const start = Number(this.sequenceStart());
    if (!start || start < 1) return;
    this.resetting.set(true);
    this.resetFeedback.set('');
    this.adminSettings.resetSequence(start).subscribe({
      next: (res) => {
        this.resetOk.set(true);
        this.resetFeedback.set(`Volgende bestelnummer wordt #${res.nextValue}.`);
        this.resetting.set(false);
      },
      error: (err) => {
        this.resetOk.set(false);
        this.resetFeedback.set(err?.error?.message ?? 'Resetten mislukt. Controleer de admin sleutel.');
        this.resetting.set(false);
      },
    });
  }
}
