// ─── Product Contracts ───────────────────────────────────────────────────────
// Shared between API (response serialization) and Web (HTTP client typing).

export interface ProductExtraDto {
  id: string;
  name: string;
  isActive: boolean;
  defaultForCategories: string[];
  sortOrder?: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isSoldOut: boolean;
  category: string | null;
  sortOrder?: number;
  extras: ProductExtraDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListDto {
  items: ProductDto[];
  total: number;
}

export interface ProductComboDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: string | null;
  slotCount: number;
  sortOrder?: number;
  products: ProductDto[];
  extras: ProductExtraDto[];
  createdAt: string;
  updatedAt: string;
}
