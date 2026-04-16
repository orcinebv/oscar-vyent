import { Component, Input } from '@angular/core';

export type CheckoutStep = 1 | 2 | 3;

@Component({
  selector: 'ov-checkout-steps',
  standalone: true,
  template: `
    <nav class="steps" aria-label="Stappen in het bestelproces">
      <ol class="steps__list">
        @for (step of steps; track step.number) {
          <li
            class="steps__item"
            [class.steps__item--active]="step.number === current"
            [class.steps__item--done]="step.number < current"
            [attr.aria-current]="step.number === current ? 'step' : null"
          >
            <span class="steps__number" aria-hidden="true">
              @if (step.number < current) { ✓ } @else { {{ step.number }} }
            </span>
            <span class="steps__label">{{ step.label }}</span>
            @if (!$last) { <span class="steps__connector" aria-hidden="true"></span> }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .steps { padding: var(--space-6) 0; }

    .steps__list {
      display: flex;
      align-items: center;
      gap: 0;
      max-width: 480px;
      margin: 0 auto;
    }

    .steps__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
    }

    .steps__number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      flex-shrink: 0;
      background: var(--color-surface-subtle);
      color: var(--color-text-muted);
      border: 2px solid var(--color-border);
      transition: background var(--transition-normal), color var(--transition-normal), border-color var(--transition-normal);
    }

    .steps__item--active .steps__number {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .steps__item--done .steps__number {
      background: var(--color-success);
      color: white;
      border-color: var(--color-success);
    }

    .steps__label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .steps__item--active .steps__label { color: var(--color-primary); font-weight: var(--font-weight-semibold); }
    .steps__item--done .steps__label   { color: var(--color-success); }

    .steps__connector {
      flex: 1;
      height: 2px;
      background: var(--color-border);
      margin: 0 var(--space-2);
    }

    .steps__item--done .steps__connector { background: var(--color-success); }
  `],
})
export class CheckoutStepsComponent {
  @Input({ required: true }) current!: CheckoutStep;

  protected readonly steps = [
    { number: 1 as CheckoutStep, label: 'Winkelwagen' },
    { number: 2 as CheckoutStep, label: 'Gegevens' },
    { number: 3 as CheckoutStep, label: 'Betaling' },
  ];
}
