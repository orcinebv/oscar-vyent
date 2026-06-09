// ─── Order Contracts ─────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface CreateOrderItemDto {
  productId?: string;
  comboId?: string;
  itemType?: 'product' | 'combo';
  quantity: number;
  selectedExtras?: string[];
}

export interface OrderItemDto {
  id: string;
  itemType: 'product' | 'combo';
  productId: string | null;
  comboId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  selectedExtras: string[] | null;
}

export interface CreateOrderDto {
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  shippingCountry?: string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface OrderDto {
  id: string;
  orderNumber: number | null;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingPostalCode: string | null;
  shippingCity: string | null;
  shippingCountry: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}
