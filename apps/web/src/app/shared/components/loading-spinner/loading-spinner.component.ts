import { Component, Input } from '@angular/core';

@Component({
  selector: 'ov-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap" role="status" [attr.aria-label]="message">
      <div class="spinner" aria-hidden="true"></div>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      padding: var(--space-12) var(--space-4);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-message {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoadingSpinnerComponent {
  @Input() message = 'Laden...';
}
