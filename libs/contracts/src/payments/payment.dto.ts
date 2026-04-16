// ─── Payment Contracts ────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'open'
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'failed'
  | 'canceled'
  | 'paid';

export interface CreatePaymentDto {
  orderId: string;
  method?: string;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  molliePaymentId: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatusDto {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  orderStatus: string;
}

export interface CreatePaymentResponseDto {
  paymentId: string;
  orderId: string;
  checkoutUrl: string;
  method: string;
}
