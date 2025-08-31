export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_method: 'stripe' | 'paypal' | 'cash' | 'bank_transfer';
  payment_provider: string;
  provider_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface PaymentDTO extends Omit<Payment, 'created_at' | 'updated_at' | 'completed_at'> {
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  currency: string;
  payment_method: Payment['payment_method'];
  payment_provider: string;
  provider_transaction_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentRequest {
  status?: Payment['status'];
  failure_reason?: string;
  metadata?: Record<string, any>;
  completed_at?: Date;
}

export interface UpdatePaymentStatusRequest {
  status: Payment['status'];
  failure_reason?: string;
}

export interface ProcessRefundRequest {
  refund_amount: number;
}

export interface PaymentMethod {
  id: string;
  customer_id: string;
  type: 'card' | 'bank_account' | 'paypal';
  provider: string;
  provider_payment_method_id: string;
  is_default: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethodDTO extends Omit<PaymentMethod, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethod['type'];
  provider: string;
  provider_payment_method_id: string;
  is_default?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodRequest {
  type?: PaymentMethod['type'];
  provider?: string;
  provider_payment_method_id?: string;
  is_default?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentFilters {
  customer_id?: string;
  order_id?: string;
  status?: Payment['status'];
  payment_method?: Payment['payment_method'];
  date_range?: {
    start: Date;
    end: Date;
  };
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  successful_payments: number;
  failed_payments: number;
  average_payment_amount: number;
  payment_methods_distribution: Record<string, number>;
}

