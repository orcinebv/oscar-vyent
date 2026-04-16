// ─── Product Contracts ───────────────────────────────────────────────────────
// Shared between API (response serialization) and Web (HTTP client typing).

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListDto {
  items: ProductDto[];
  total: number;
}
