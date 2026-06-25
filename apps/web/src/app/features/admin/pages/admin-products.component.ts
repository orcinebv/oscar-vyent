import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, of } from 'rxjs';
import { ProductDto, ProductExtraDto } from '@oscar-vyent/contracts';
import { ProductsService } from '../../../core/services/products.service';
import { ExtrasService } from '../../../core/services/extras.service';
import { UploadService } from '../../../core/services/upload.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'ov-admin-products',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin">
      <div class="admin__header">
        <h1 class="admin__title">Productbeheer</h1>
        <button class="btn btn--primary" (click)="openCreate()">+ Nieuw product</button>
      </div>

      @if (loading()) {
        <p class="admin__loading">Laden...</p>
      } @else {
        @if (reordering()) {
          <p class="admin__saving">Volgorde opslaan...</p>
        }
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th--handle"></th>
                <th></th>
                <th>Naam</th>
                <th>Categorie</th>
                <th>Prijs</th>
                <th>Voorraad</th>
                <th>Actief</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody [class.is-dragging]="dragIndex() !== null">
              @for (product of products(); track product.id; let i = $index) {
                <tr [class.row--inactive]="!product.isActive"
                    [class.row--dragging]="dragIndex() === i"
                    [class.row--drag-over]="dragOverIndex() === i && dragIndex() !== i"
                    draggable="true"
                    (dragstart)="onDragStart($event, i)"
                    (dragover)="onDragOver($event, i)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event, i)"
                    (dragend)="onDragEnd()">
                  <td class="table__drag-handle">
                    <svg class="drag-icon" width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
                      <circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/>
                      <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/>
                      <circle cx="4" cy="16" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
                    </svg>
                  </td>
                  <td>
                    @if (product.imageUrl) {
                      <img [src]="product.imageUrl" [alt]="product.name" class="table__img" />
                    } @else {
                      <span class="table__no-img">—</span>
                    }
                  </td>
                  <td class="table__name">{{ product.name }}</td>
                  <td>{{ product.category ?? '—' }}</td>
                  <td>{{ formatPrice(product.price) }}</td>
                  <td>{{ product.stock }}</td>
                  <td>
                    <span class="badge" [class.badge--active]="product.isActive" [class.badge--inactive]="!product.isActive">
                      {{ product.isActive ? 'Ja' : 'Nee' }}
                    </span>
                  </td>
                  <td class="table__actions">
                    <button class="btn btn--sm btn--ghost" (click)="openEdit(product)">Bewerken</button>
                    <button class="btn btn--sm btn--danger" (click)="deleteProduct(product)">Verwijderen</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="table__empty">Geen producten gevonden.</td>
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
            <h2 class="modal__title">{{ mode() === 'create' ? 'Nieuw product' : 'Product bewerken' }}</h2>
            <button class="modal__close" (click)="closeModal()" aria-label="Sluiten">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="modal__body">
            <div class="field">
              <label class="field__label" for="name">Naam *</label>
              <input id="name" class="field__input" formControlName="name" autocomplete="off" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="field__error">Naam is verplicht (min. 2 tekens)</span>
              }
            </div>

            <div class="field">
              <label class="field__label" for="description">Omschrijving *</label>
              <textarea id="description" class="field__input field__input--textarea" formControlName="description" rows="3"></textarea>
              @if (form.get('description')?.invalid && form.get('description')?.touched) {
                <span class="field__error">Omschrijving is verplicht (min. 10 tekens)</span>
              }
            </div>

            <div class="field-row">
              <div class="field">
                <label class="field__label" for="price">Prijs (€) *</label>
                <input id="price" class="field__input" formControlName="price" type="number" min="0.01" step="0.01" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <span class="field__error">Geldige prijs vereist</span>
                }
              </div>
              <div class="field">
                <label class="field__label" for="stock">Voorraad *</label>
                <input id="stock" class="field__input" formControlName="stock" type="number" min="0" step="1" />
                @if (form.get('stock')?.invalid && form.get('stock')?.touched) {
                  <span class="field__error">Voorraad is verplicht (min. 0)</span>
                }
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="category">Categorie</label>
              <input id="category" class="field__input" formControlName="category"
                     list="category-options" autocomplete="off"
                     placeholder="Kies of typ een nieuwe categorie" />
              <datalist id="category-options">
                @for (cat of categories(); track cat) {
                  <option [value]="cat"></option>
                }
              </datalist>
              <span class="field__hint">Kies een bestaande categorie of typ een nieuwe naam.</span>
            </div>

            <div class="field">
              <label class="field__label" for="imageUrl">Afbeelding URL</label>
              <div class="image-url-field">
                <input id="imageUrl" class="field__input" formControlName="imageUrl" type="url"
                       placeholder="https://... of upload een bestand" />
                <label class="btn btn--ghost btn--sm image-upload__btn" title="Bestand uploaden">
                  ↑
                  <input type="file" accept="image/*" (change)="onFileSelected($event)" hidden />
                </label>
              </div>
              @if (imagePreview()) {
                <div class="image-upload__preview-wrap">
                  <img [src]="imagePreview()!" alt="Voorvertoning" class="image-upload__preview" />
                  <button type="button" class="image-upload__clear" (click)="clearImage()" title="Verwijderen">✕</button>
                </div>
              }
              @if (uploadError()) {
                <span class="field__error">{{ uploadError() }}</span>
              }
            </div>

            <div class="field field--checkbox">
              <label class="field__checkbox-label">
                <input type="checkbox" formControlName="isActive" />
                Actief (zichtbaar in winkel)
              </label>
            </div>

            @if (allExtras().length > 0) {
              <div class="field">
                <div class="extras-header">
                  <label class="field__label">Beschikbare wensen / extras</label>
                  <button type="button" class="btn btn--ghost btn--sm" (click)="loadCategoryDefaults()">
                    Laad categorie-standaard
                  </button>
                </div>
                <div class="extras-list">
                  @for (extra of allExtras(); track extra.id) {
                    <label class="field__checkbox-label">
                      <input type="checkbox"
                             [checked]="selectedExtraIds().includes(extra.id)"
                             (change)="toggleExtra(extra.id)" />
                      {{ extra.name }}
                      @if (extra.defaultForCategories.length) {
                        <span class="extra__cats">({{ extra.defaultForCategories.join(', ') }})</span>
                      }
                    </label>
                  }
                </div>
                <span class="field__hint">
                  Aangevinkte extras zijn keuze-opties voor de klant bij dit product.
                  <a href="/beheer/extras" target="_blank">Extras beheren →</a>
                </span>
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
      max-width: 1200px;
      margin: 0 auto;
    }

    .admin__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
    }

    .admin__title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .admin__loading {
      color: var(--color-text-secondary);
      text-align: center;
      padding: var(--space-12);
    }

    .admin__saving {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      text-align: right;
      margin-bottom: var(--space-2);
      margin-top: calc(var(--space-2) * -1);
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-raised);
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    .table th {
      text-align: left;
      padding: var(--space-3) var(--space-4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }

    .th--handle { width: 28px; padding: 0; }

    .table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      vertical-align: middle;
    }

    .table tr:last-child td { border-bottom: none; }

    .row--inactive td { opacity: 0.5; }
    .row--dragging { opacity: 0.4; }
    .row--drag-over td { background: var(--color-surface-subtle); border-top: 2px solid var(--color-primary); }

    /* Prevent child elements from stealing drag events */
    .table tbody.is-dragging td,
    .table tbody.is-dragging td * { pointer-events: none; }

    .table__img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }

    .table__no-img {
      display: inline-block;
      width: 48px;
      height: 48px;
      background: var(--color-surface-subtle);
      border-radius: var(--radius-sm);
      line-height: 48px;
      text-align: center;
      color: var(--color-text-tertiary);
    }

    .table__name { font-weight: var(--font-weight-medium); }

    .table__drag-handle {
      width: 28px;
      padding: 0 var(--space-2);
      text-align: center;
      cursor: grab;
      color: var(--color-text-tertiary);
      user-select: none;
    }
    .table__drag-handle:active { cursor: grabbing; }
    .drag-icon { display: block; margin: 0 auto; }

    .table__actions { display: flex; gap: var(--space-2); }

    .table__empty {
      text-align: center;
      color: var(--color-text-secondary);
      padding: var(--space-8);
    }

    .badge {
      display: inline-block;
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: var(--font-weight-semibold);
    }

    .badge--active { background: #d1fae5; color: #065f46; }
    .badge--inactive { background: #fee2e2; color: #991b1b; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border: none;
      cursor: pointer;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      text-decoration: none;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn--primary {
      background: var(--color-primary);
      color: white;
    }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-hover, var(--color-accent)); }

    .btn--ghost {
      background: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }
    .btn--ghost:hover { background: var(--color-surface-subtle); }

    .btn--danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .btn--danger:hover { background: #fecaca; }

    .btn--sm { padding: var(--space-1) var(--space-3); font-size: 12px; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }

    .modal {
      background: var(--color-surface-raised);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 540px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
    }

    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
    }

    .modal__close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: var(--font-size-lg);
      color: var(--color-text-secondary);
      padding: var(--space-1);
      line-height: 1;
    }

    .modal__body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }

    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .field { display: flex; flex-direction: column; gap: var(--space-1); }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

    .field__label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .field__input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      background: var(--color-surface);
      transition: border-color var(--transition-fast);
      width: 100%;
      box-sizing: border-box;
    }

    .field__input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .field__input--textarea { resize: vertical; }

    .field--checkbox { flex-direction: row; }

    .field__checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      cursor: pointer;
    }

    .field__hint {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .field__error {
      font-size: 12px;
      color: #dc2626;
    }

    .field__error--block {
      padding: var(--space-2) var(--space-3);
      background: #fee2e2;
      border-radius: var(--radius-sm);
    }

    .extras-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-2);
    }

    .extras-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-subtle);
      max-height: 180px;
      overflow-y: auto;
    }

    .extra__cats {
      font-size: 11px;
      color: var(--color-text-tertiary);
      margin-left: var(--space-1);
    }

    .image-url-field { display: flex; gap: var(--space-2); }
    .image-url-field .field__input { flex: 1; }
    .image-upload__btn { cursor: pointer; flex-shrink: 0; font-size: var(--font-size-base); }
    .image-upload__preview-wrap { position: relative; display: inline-block; margin-top: var(--space-2); }
    .image-upload__preview {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      display: block;
    }
    .image-upload__clear {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `],
})
export class AdminProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly extrasService = inject(ExtrasService);
  private readonly uploadService = inject(UploadService);
  private readonly fb = inject(FormBuilder);

  products = signal<ProductDto[]>([]);
  allExtras = signal<ProductExtraDto[]>([]);
  selectedExtraIds = signal<string[]>([]);
  categories = computed(() =>
    [...new Set(this.products().map((p) => p.category).filter((c): c is string => c !== null))].sort()
  );
  loading = signal(true);
  showModal = signal(false);
  mode = signal<FormMode>('create');
  saving = signal(false);
  saveError = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  uploadError = signal<string | null>(null);
  reordering = signal(false);
  protected dragIndex = signal<number | null>(null);
  protected dragOverIndex = signal<number | null>(null);
  private pendingFile = signal<File | null>(null);
  private editingId = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: [''],
    imageUrl: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
    this.extrasService.getAll().subscribe((extras) => this.allExtras.set(extras));
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
  }

  private load(): void {
    this.loading.set(true);
    this.productsService.getAllAdmin().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.mode.set('create');
    this.editingId.set(null);
    this.form.reset({ isActive: true, stock: 0, price: null, imageUrl: '' });
    this.selectedExtraIds.set([]);
    this.saveError.set(null);
    this.imagePreview.set(null);
    this.pendingFile.set(null);
    this.uploadError.set(null);
    this.showModal.set(true);
  }

  openEdit(product: ProductDto): void {
    this.mode.set('edit');
    this.editingId.set(product.id);
    this.form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category ?? '',
      imageUrl: product.imageUrl ?? '',
      isActive: product.isActive,
    });
    this.selectedExtraIds.set((product.extras ?? []).map((e) => e.id));
    this.saveError.set(null);
    this.imagePreview.set(product.imageUrl ?? null);
    this.pendingFile.set(null);
    this.uploadError.set(null);
    this.showModal.set(true);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    this.pendingFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    (event.target as HTMLInputElement).value = '';
  }

  clearImage(): void {
    this.imagePreview.set(null);
    this.pendingFile.set(null);
    this.form.patchValue({ imageUrl: '' });
  }

  toggleExtra(extraId: string): void {
    this.selectedExtraIds.update((ids) =>
      ids.includes(extraId) ? ids.filter((id) => id !== extraId) : [...ids, extraId],
    );
  }

  loadCategoryDefaults(): void {
    const category = this.form.get('category')?.value ?? '';
    if (!category) return;
    const matching = this.allExtras()
      .filter((e) => e.defaultForCategories?.includes(category))
      .map((e) => e.id);
    this.selectedExtraIds.set(matching);
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
    const upload$ = this.pendingFile()
      ? this.uploadService.uploadImage(this.pendingFile()!)
      : of({ url: raw.imageUrl || null });

    upload$.pipe(
      switchMap(({ url }) => {
        const dto = {
          name: raw.name!,
          description: raw.description!,
          price: Number(raw.price),
          stock: Number(raw.stock),
          imageUrl: url || null,
          category: raw.category || null,
          isActive: raw.isActive ?? true,
        };
        return this.mode() === 'create'
          ? this.productsService.create(dto)
          : this.productsService.update(this.editingId()!, dto);
      }),
      switchMap((product) =>
        this.productsService.setExtras(product.id, this.selectedExtraIds()),
      ),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const httpErr = err as { error?: { message?: string | string[] } };
        const msg = httpErr?.error?.message;
        this.saveError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Er is een fout opgetreden.'));
      },
    });
  }

  deleteProduct(product: ProductDto): void {
    if (!confirm(`Weet je zeker dat je "${product.name}" wilt verwijderen?`)) return;
    this.productsService.delete(product.id).subscribe({
      next: () => this.load(),
      error: () => alert('Verwijderen mislukt.'),
    });
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragIndex.set(index);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', String(index));
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverIndex.set(index);
  }

  onDragLeave(event: DragEvent): void {
    // Only clear when truly leaving the row — not when entering a child <td>
    const related = event.relatedTarget as Node | null;
    if (!related || !(event.currentTarget as Element).contains(related)) {
      this.dragOverIndex.set(null);
    }
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const fromIndex = this.dragIndex();
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
    if (fromIndex === null || fromIndex === targetIndex) return;

    const updated = [...this.products()];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, moved);
    this.products.set(updated);

    this.reordering.set(true);
    this.productsService.reorder(updated.map((p) => p.id)).subscribe({
      next: () => this.reordering.set(false),
      error: () => {
        this.reordering.set(false);
        this.load();
      },
    });
  }

  onDragEnd(): void {
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }
}
