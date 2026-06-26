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

      @if (loadingSettings()) {
        <p class="admin__loading">Laden...</p>
      } @else {

        <!-- SMTP configuratie -->
        <section class="card">
          <h2 class="card__title">SMTP-configuratie (uitgaande mail)</h2>
          <p class="card__desc">
            Instellingen voor het versturen van bestelnotificaties via e-mail.
            Laat velden leeg om de server-standaardwaarden (.env) te gebruiken.
          </p>

          <div class="field-group">
            <div class="field">
              <label class="field__label">SMTP-host</label>
              <input class="field__input" type="text" [(ngModel)]="smtpHost"
                     placeholder="smtp.gmail.com" autocomplete="off" />
              <span class="field__hint">Bijv. smtp.gmail.com, smtp.office365.com, mail.provider.nl</span>
            </div>

            <div class="field-row--2">
              <div class="field">
                <label class="field__label">Poort</label>
                <input class="field__input" type="number" [(ngModel)]="smtpPort"
                       placeholder="587" min="1" max="65535" />
              </div>
              <div class="field">
                <label class="field__label">Beveiliging</label>
                <select class="field__input field__select" [(ngModel)]="smtpSecure" (ngModelChange)="onSecureChange($event)">
                  <option value="starttls">STARTTLS (poort 587, aanbevolen)</option>
                  <option value="ssl">SSL/TLS (poort 465)</option>
                  <option value="none">Geen (poort 25, alleen intern)</option>
                </select>
              </div>
            </div>

            <div class="field-row--2">
              <div class="field">
                <label class="field__label">Gebruikersnaam</label>
                <input class="field__input" type="text" [(ngModel)]="smtpUser"
                       placeholder="info@orcine.nl" autocomplete="username" />
              </div>
              <div class="field">
                <label class="field__label">Wachtwoord</label>
                <div class="password-wrap">
                  <input class="field__input" [type]="showPass() ? 'text' : 'password'"
                         [(ngModel)]="smtpPass"
                         placeholder="Laat leeg om ongewijzigd te laten"
                         autocomplete="current-password" />
                  <button type="button" class="btn-icon" (click)="showPass.set(!showPass())"
                          [title]="showPass() ? 'Verbergen' : 'Tonen'">
                    {{ showPass() ? '🙈' : '👁' }}
                  </button>
                </div>
                <span class="field__hint">Wordt nooit teruggetoond na opslaan.</span>
              </div>
            </div>

            <div class="field">
              <label class="field__label">Afzender (From)</label>
              <input class="field__input" type="text" [(ngModel)]="smtpFrom"
                     placeholder="Orcine &lt;info@orcine.nl&gt;" autocomplete="off" />
              <span class="field__hint">Naam en adres die de ontvanger ziet als afzender.</span>
            </div>
          </div>

          <div class="card__actions">
            <button class="btn btn--primary" [disabled]="savingSmtp()" (click)="saveSmtp()">
              {{ savingSmtp() ? 'Opslaan...' : 'Opslaan' }}
            </button>
            <button class="btn btn--ghost" [disabled]="testingMail()" (click)="testMail()">
              {{ testingMail() ? 'Versturen...' : 'Testmail versturen →' }}
            </button>
          </div>

          @if (smtpFeedback()) {
            <p class="feedback" [class.feedback--ok]="smtpFeedbackOk()" [class.feedback--err]="!smtpFeedbackOk()">
              {{ smtpFeedback() }}
            </p>
          }
          @if (testMailFeedback()) {
            <p class="feedback" [class.feedback--ok]="testMailOk()" [class.feedback--err]="!testMailOk()">
              {{ testMailFeedback() }}
            </p>
          }
        </section>

        <!-- Ontvanger -->
        <section class="card">
          <h2 class="card__title">E-mail ontvanger</h2>
          <p class="card__desc">Bestelnotificaties worden naar dit adres verstuurd.</p>
          <div class="field-row">
            <input class="field__input" type="email" [(ngModel)]="mailTo"
                   placeholder="ontvanger@voorbeeld.nl" />
            <button class="btn btn--primary" [disabled]="savingMail()" (click)="saveMail()">
              {{ savingMail() ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
          @if (mailFeedback()) {
            <p class="feedback" [class.feedback--ok]="mailFeedback() === 'ok'" [class.feedback--err]="mailFeedback() !== 'ok'">
              {{ mailFeedback() === 'ok' ? 'E-mailadres opgeslagen.' : mailFeedback() }}
            </p>
          }
        </section>

        <!-- Bestelnummer resetten -->
        <section class="card">
          <h2 class="card__title">Bestelnummer resetten</h2>
          <p class="card__desc">Stel het volgende bestelnummer in. Gebruik dit alleen als je bewust wilt herstarten.</p>
          <div class="field-row">
            <input class="field__input field__input--sm" type="number" [(ngModel)]="sequenceStart" min="1" placeholder="1" />
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

      }
    </div>
  `,
  styles: [`
    .admin { max-width: 760px; margin: 0 auto; padding: var(--space-8) var(--space-4) var(--space-16); }
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
      gap: var(--space-4);
    }
    .card__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .card__desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: 0; }
    .card__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }

    .field-group { display: flex; flex-direction: column; gap: var(--space-4); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field-row { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
    .field-row--2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    @media (max-width: 560px) { .field-row--2 { grid-template-columns: 1fr; } }

    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
    .field__hint { font-size: 12px; color: var(--color-text-secondary); }
    .field__input {
      flex: 1;
      min-width: 0;
      height: 38px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      background: var(--color-surface-subtle);
      outline: none;
      box-sizing: border-box;
      width: 100%;
    }
    .field__input:focus { border-color: var(--color-primary); }
    .field__input--sm { flex: 0 0 120px; min-width: 0; }
    .field__select { cursor: pointer; }

    .password-wrap { display: flex; gap: var(--space-2); align-items: center; }
    .password-wrap .field__input { flex: 1; }
    .btn-icon {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-subtle);
      cursor: pointer;
      font-size: var(--font-size-base);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-icon:hover { background: var(--color-surface); }

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
    .btn--ghost { background: transparent; color: var(--color-text-primary); border: 1px solid var(--color-border); }
    .btn--ghost:not(:disabled):hover { background: var(--color-surface-subtle); }
    .btn--danger { background: #dc2626; color: #fff; }
    .btn--danger:not(:disabled):hover { opacity: 0.88; }

    .feedback { font-size: var(--font-size-sm); margin: 0; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
    .feedback--ok { background: #f0fdf4; color: #166534; }
    .feedback--err { background: #fef2f2; color: #991b1b; }
  `],
})
export class AdminInstellingenComponent implements OnInit {
  private readonly adminSettings = inject(AdminSettingsService);

  protected loadingSettings = signal(true);
  protected showPass = signal(false);

  // SMTP
  protected smtpHost   = signal('');
  protected smtpPort   = signal<number | null>(null);
  protected smtpSecure = signal('starttls');
  protected smtpUser   = signal('');
  protected smtpPass   = signal('');
  protected smtpFrom   = signal('');
  protected savingSmtp = signal(false);
  protected smtpFeedback = signal('');
  protected smtpFeedbackOk = signal(false);
  protected testingMail = signal(false);
  protected testMailFeedback = signal('');
  protected testMailOk = signal(false);

  // Mail to
  protected mailTo = signal('');
  protected savingMail = signal(false);
  protected mailFeedback = signal('');

  // Sequence
  protected sequenceStart = signal(1);
  protected resetting = signal(false);
  protected resetFeedback = signal('');
  protected resetOk = signal(false);

  ngOnInit(): void {
    this.adminSettings.getSettings().subscribe({
      next: (s) => {
        this.smtpHost.set(s['mail.smtp.host'] ?? '');
        this.smtpPort.set(s['mail.smtp.port'] ? Number(s['mail.smtp.port']) : null);
        this.smtpSecure.set(s['mail.smtp.secure'] ?? 'starttls');
        this.smtpUser.set(s['mail.smtp.user'] ?? '');
        // Password is never returned by API — leave empty
        this.smtpFrom.set(s['mail.smtp.from'] ?? '');
        this.mailTo.set(s['mail.to'] ?? 'orcinebv@gmail.com');
        this.loadingSettings.set(false);
      },
      error: () => this.loadingSettings.set(false),
    });
  }

  protected onSecureChange(value: string): void {
    if (value === 'starttls' && !this.smtpPort()) this.smtpPort.set(587);
    if (value === 'ssl'      && !this.smtpPort()) this.smtpPort.set(465);
    if (value === 'none'     && !this.smtpPort()) this.smtpPort.set(25);
  }

  protected saveSmtp(): void {
    this.savingSmtp.set(true);
    this.smtpFeedback.set('');

    const payload: Record<string, string> = {
      'mail.smtp.host':   this.smtpHost(),
      'mail.smtp.port':   String(this.smtpPort() ?? 587),
      'mail.smtp.secure': this.smtpSecure(),
      'mail.smtp.user':   this.smtpUser(),
      'mail.smtp.from':   this.smtpFrom(),
    };
    // Only update password if the admin actually typed something
    if (this.smtpPass().trim()) {
      payload['mail.smtp.pass'] = this.smtpPass();
    }

    this.adminSettings.updateSettings(payload).subscribe({
      next: () => {
        this.smtpFeedbackOk.set(true);
        this.smtpFeedback.set('SMTP-instellingen opgeslagen.');
        this.smtpPass.set('');
        this.savingSmtp.set(false);
      },
      error: (err) => {
        this.smtpFeedbackOk.set(false);
        this.smtpFeedback.set(err?.error?.message ?? 'Opslaan mislukt.');
        this.savingSmtp.set(false);
      },
    });
  }

  protected testMail(): void {
    this.testingMail.set(true);
    this.testMailFeedback.set('');
    this.adminSettings.testMail().subscribe({
      next: () => {
        this.testMailOk.set(true);
        this.testMailFeedback.set(`Testmail verstuurd naar ${this.mailTo() || '(mail.to instelling)'}.`);
        this.testingMail.set(false);
      },
      error: (err) => {
        this.testMailOk.set(false);
        this.testMailFeedback.set(err?.error?.message ?? 'Testmail mislukt. Controleer de SMTP-instellingen.');
        this.testingMail.set(false);
      },
    });
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
        this.mailFeedback.set(err?.error?.message ?? 'Opslaan mislukt.');
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
        this.resetFeedback.set(err?.error?.message ?? 'Resetten mislukt.');
        this.resetting.set(false);
      },
    });
  }
}
