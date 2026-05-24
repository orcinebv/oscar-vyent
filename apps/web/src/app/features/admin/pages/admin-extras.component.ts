import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductExtraDto } from '@oscar-vyent/contracts';
import { ExtrasService } from '../../../core/services/extras.service';
import { ProductsService } from '../../../core/services/products.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'ov-admin-extras',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin">
      <div class="admin__header">
        <div>
          <h1 class="admin__title">Extras / Wensen beheer</h1>
          <p class="admin__subtitle">Beheer de beschikbare wensen (bijv. Komkommer, Peper). Koppel ze daarna aan producten via <a href="/beheer">Productbeheer</a>.</p>
        </div>
        <button class="btn btn--primary" (click)="openCreate()">+ Nieuwe extra</button>
      </div>

      @if (loading()) {
        <p class="admin__loading">Laden...</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Standaard voor categorieën</th>
                <th>Actief</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              @for (extra of extras(); track extra.id) {
                <tr [class.row--inactive]="!extra.isActive">
                  <td class="table__name">{{ extra.name }}</td>
                  <td class="table__cats">
                    {{ extra.defaultForCategories.length ? extra.defaultForCategories.join(', ') : '—' }}
                  </td>
                  <td>
                    <span class="badge" [class.badge--active]="extra.isActive" [class.badge--inactive]="!extra.isActive">
                      {{ extra.isActive ? 'Ja' : 'Nee' }}
                    </span>
                  </td>
                  <td class="table__actions">
                    <button class="btn btn--sm btn--ghost" (click)="openEdit(extra)">Bewerken</button>
                    <button class="btn btn--sm btn--danger" (click)="deleteExtra(extra)">Verwijderen</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="table__empty">Geen extras gevonden. Maak een nieuwe aan.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal__header">
            <h2 class="modal__title">{{ mode() === 'create' ? 'Nieuwe extra' : 'Extra bewerken' }}</h2>
            <button class="modal__close" (click)="closeModal()" aria-label="Sluiten">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="modal__body">
            <div class="field">
              <label class="field__label" for="name">Naam *</label>
              <input id="name" class="field__input" formControlName="name" autocomplete="off" placeholder="bijv. Komkommer" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="field__error">Naam is verplicht (min. 2 tekens)</span>
              }
            </div>

            @if (allCategories().length > 0) {
              <div class="field">
                <label class="field__label">Standaard voor categorieën</label>
                <div class="cat-list">
                  @for (cat of allCategories(); track cat) {
                    <label class="field__checkbox-label">
                      <input type="checkbox"
                             [checked]="selectedCategories().includes(cat)"
                             (change)="toggleCategory(cat)" />
                      {{ cat }}
                    </label>
                  }
                </div>
                <span class="field__hint">Aangevinkte categorieën worden als standaard voorgeselecteerd bij nieuwe producten in die categorie.</span>
              </div>
            }

            @if (mode() === 'edit') {
              <div class="field field--checkbox">
                <label class="field__checkbox-label">
                  <input type="checkbox" formControlName="isActive" />
                  Actief (zichtbaar als keuze voor klant)
                </label>
              </div>
            }

            @if (saveError()) {
              <p class="field__error field__error--block">{{ saveError() }}</p>
            }

            <div class="modal__footer">
              <button type="button" class="btn btn--ghost" (click)="closeModal()">Annuleren</button>
              <button type="submit" class="btn btn--primary" [disabled]="saving()">
                {{ saving() ? 'Opslaan...' : 'Opslaan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin {
      padding: var(--space-8) var(--space-6);
      max-width: 1000px;
      margin: 0 auto;
    }
    .admin__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      gap: var(--space-4);
    }
    .admin__title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1);
    }
    .admin__subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .admin__subtitle a { color: var(--color-primary); }
    .admin__loading { color: var(--color-text-secondary); text-align: center; padding: var(--space-12); }

    .table-wrap { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-raised); }
    .table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
    .table th { text-align: left; padding: var(--space-3) var(--space-4); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); white-space: nowrap; }
    .table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .row--inactive td { opacity: 0.5; }
    .table__name { font-weight: var(--font-weight-medium); }
    .table__cats { color: var(--color-text-secondary); font-size: var(--font-size-xs); }
    .table__actions { display: flex; gap: var(--space-2); }
    .table__empty { text-align: center; color: var(--color-text-secondary); padding: var(--space-8); }

    .badge { display: inline-block; padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: 11px; font-weight: var(--font-weight-semibold); }
    .badge--active { background: #d1fae5; color: #065f46; }
    .badge--inactive { background: #fee2e2; color: #991b1b; }

    .btn { display: inline-flex; align-items: center; justify-content: center; padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); border: none; cursor: pointer; transition: background-color var(--transition-fast); text-decoration: none; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--primary { background: var(--color-primary); color: white; }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-hover, var(--color-accent)); }
    .btn--ghost { background: transparent; color: var(--color-text-primary); border: 1px solid var(--color-border); }
    .btn--ghost:hover { background: var(--color-surface-subtle); }
    .btn--danger { background: #fee2e2; color: #991b1b; }
    .btn--danger:hover { background: #fecaca; }
    .btn--sm { padding: var(--space-1) var(--space-3); font-size: 12px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
    .modal { background: var(--color-surface-raised); border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
    .modal__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); }
    .modal__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; }
    .modal__close { background: none; border: none; cursor: pointer; font-size: var(--font-size-lg); color: var(--color-text-secondary); padding: var(--space-1); line-height: 1; }
    .modal__body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .modal__footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }

    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
    .field__input { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--color-text-primary); background: var(--color-surface); transition: border-color var(--transition-fast); width: 100%; box-sizing: border-box; }
    .field__input:focus { outline: none; border-color: var(--color-primary); }
    .field--checkbox { flex-direction: row; }
    .field__checkbox-label { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); cursor: pointer; }
    .field__hint { font-size: 12px; color: var(--color-text-secondary); }
    .field__error { font-size: 12px; color: #dc2626; }
    .field__error--block { padding: var(--space-2) var(--space-3); background: #fee2e2; border-radius: var(--radius-sm); }

    .cat-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-subtle);
    }
  `],
})
export class AdminExtrasComponent implements OnInit {
  private readonly extrasService = inject(ExtrasService);
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  extras = signal<ProductExtraDto[]>([]);
  allCategories = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  loading = signal(true);
  showModal = signal(false);
  mode = signal<FormMode>('create');
  saving = signal(false);
  saveError = signal<string | null>(null);
  private editingId = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  private load(): void {
    this.loading.set(true);
    this.extrasService.getAll().subscribe({
      next: (extras) => {
        this.extras.set(extras);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCategories(): void {
    this.productsService.getAllAdmin().subscribe({
      next: (products) => {
        const cats = [...new Set(products.map((p) => p.category).filter((c): c is string => c !== null))].sort();
        this.allCategories.set(cats);
      },
    });
  }

  openCreate(): void {
    this.mode.set('create');
    this.editingId.set(null);
    this.form.reset({ isActive: true });
    this.selectedCategories.set([]);
    this.saveError.set(null);
    this.showModal.set(true);
  }

  openEdit(extra: ProductExtraDto): void {
    this.mode.set('edit');
    this.editingId.set(extra.id);
    this.form.reset({ name: extra.name, isActive: extra.isActive });
    this.selectedCategories.set(extra.defaultForCategories?.filter(Boolean) ?? []);
    this.saveError.set(null);
    this.showModal.set(true);
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update((list) =>
      list.includes(cat) ? list.filter((c) => c !== cat) : [...list, cat],
    );
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);

    const raw = this.form.getRawValue();
    const defaultForCategories = this.selectedCategories();

    const request$ = this.mode() === 'create'
      ? this.extrasService.create({ name: raw.name!, defaultForCategories })
      : this.extrasService.update(this.editingId()!, {
          name: raw.name!,
          isActive: raw.isActive ?? true,
          defaultForCategories,
        });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message;
        this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Er is een fout opgetreden.'));
      },
    });
  }

  deleteExtra(extra: ProductExtraDto): void {
    if (!confirm(`Weet je zeker dat je "${extra.name}" wilt verwijderen?`)) return;
    this.extrasService.remove(extra.id).subscribe({
      next: () => this.load(),
      error: () => alert('Verwijderen mislukt.'),
    });
  }
}
