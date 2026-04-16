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

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingCountry?: string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface OrderDto {
  id: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string | null;
  shippingAddress: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingCountry: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}
