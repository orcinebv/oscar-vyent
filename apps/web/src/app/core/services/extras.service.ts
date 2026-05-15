import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductExtraDto } from '@oscar-vyent/contracts';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExtrasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/extras`;

  getAll(): Observable<ProductExtraDto[]> {
    return this.http.get<ProductExtraDto[]>(this.base);
  }

  create(dto: { name: string; defaultForCategories?: string[] }): Observable<ProductExtraDto> {
    return this.http.post<ProductExtraDto>(this.base, dto);
  }

  update(id: string, dto: { name?: string; isActive?: boolean; defaultForCategories?: string[] }): Observable<ProductExtraDto> {
    return this.http.patch<ProductExtraDto>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
