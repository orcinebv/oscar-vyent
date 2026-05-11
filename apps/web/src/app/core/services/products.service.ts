import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductDto, ProductListDto } from '@oscar-vyent/contracts';
import { environment } from '../../../environments/environment';

type CreateProductPayload = Omit<ProductDto, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateProductPayload = Partial<CreateProductPayload>;

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  getAll(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(this.base);
  }

  getOne(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.base}/${id}`);
  }

  getAllAdmin(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.base}?all=true`);
  }

  create(dto: CreateProductPayload): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.base, dto);
  }

  update(id: string, dto: UpdateProductPayload): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
