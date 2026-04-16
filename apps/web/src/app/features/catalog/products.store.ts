import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ProductDto } from '@oscar-vyent/contracts';
import { ProductsService } from '../../core/services/products.service';

type ProductsState = {
  products: ProductDto[];
  loading: boolean;
  error: string | null;
};

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
};

export const ProductsStore = signalStore(
  withState(initialState),
  withMethods((store, productsService = inject(ProductsService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          productsService.getAll().pipe(
            tap((products) => patchState(store, { products, loading: false })),
            catchError(() => {
              patchState(store, { loading: false, error: 'Producten konden niet geladen worden.' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadProducts();
    },
  }),
);
