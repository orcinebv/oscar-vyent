import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductDto, ProductListDto } from '@oscar-vyent/contracts';
import { environment } from '../../../environments/environment';

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
}
