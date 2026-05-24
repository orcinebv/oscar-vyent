import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductComboDto } from '@oscar-vyent/contracts';

@Injectable({ providedIn: 'root' })
export class CombosService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/combos';

  getAll(includeInactive = false): Observable<ProductComboDto[]> {
    return this.http.get<ProductComboDto[]>(this.base, {
      params: includeInactive ? { all: 'true' } : {},
    });
  }

  getAllAdmin(): Observable<ProductComboDto[]> {
    return this.getAll(true);
  }

  getOne(id: string): Observable<ProductComboDto> {
    return this.http.get<ProductComboDto>(`${this.base}/${id}`);
  }

  create(dto: Partial<ProductComboDto> & { productIds?: string[] }): Observable<ProductComboDto> {
    return this.http.post<ProductComboDto>(this.base, dto);
  }

  update(id: string, dto: Partial<ProductComboDto> & { productIds?: string[] }): Observable<ProductComboDto> {
    return this.http.patch<ProductComboDto>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
