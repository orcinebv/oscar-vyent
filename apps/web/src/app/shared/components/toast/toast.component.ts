import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'ov-toast',
  standalone: true,
  template: `
    <div class="toast-container" role="live" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type" role="alert">
          <span class="toast__icon" aria-hidden="true">{{ icon(toast.type) }}</span>
          <p class="toast__message">{{ toast.message }}</p>
          <button
            class="toast__close"
            type="button"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Melding sluiten"
          >×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      max-width: 380px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      pointer-events: all;
      animation: slideIn 0.25s ease;
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
    }

    .toast--success { border-left: 4px solid var(--color-success); }
    .toast--error   { border-left: 4px solid var(--color-error); }
    .toast--warning { border-left: 4px solid var(--color-warning); }
    .toast--info    { border-left: 4px solid var(--color-info); }

    .toast__icon { font-size: var(--font-size-base); flex-shrink: 0; }
    .toast__message { flex: 1; font-size: var(--font-size-sm); color: var(--color-text-primary); line-height: var(--line-height-normal); }

    .toast__close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: var(--font-size-xl);
      line-height: 1;
      padding: 0;
      flex-shrink: 0;
    }

    .toast__close:hover { color: var(--color-text-primary); }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    @media (max-width: 600px) {
      .toast-container { left: var(--space-4); right: var(--space-4); bottom: var(--space-4); max-width: none; }
    }
  `],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  icon(type: Toast['type']): string {
    const map: Record<Toast['type'], string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return map[type];
  }
}
