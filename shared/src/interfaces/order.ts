export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_price: number;
  delivery_fee: number;
  tax_amount: number;
  subtotal: number;
  delivery_address: string;
  delivery_instructions?: string;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: Date;
  updated_at: Date;
}

export interface OrderDTO extends Omit<Order, 'created_at' | 'updated_at' | 'estimated_delivery_time' | 'actual_delivery_time'> {
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  selected_variant_option_ids?: string[];
}

export interface OrderItemDTO extends OrderItem {}

export interface CreateOrderRequest {
  restaurant_id: string;
  delivery_address: string;
  delivery_instructions?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    special_instructions?: string;
    selected_variant_option_ids?: string[];
  }>;
}

export interface UpdateOrderRequest {
  status?: Order['status'];
  driver_id?: string;
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  payment_status?: Order['payment_status'];
}

export interface OrderWithItems {
  order: Order;
  items: Array<OrderItem & {
    name: string;
    selected_variant_options?: Array<{
      id: string;
      name: string;
      price_modifier_cents: number;
    }>;
  }>;
}

export interface OrderWithItemsDTO {
  order: OrderDTO;
  items: Array<OrderItemDTO & {
    name: string;
    selected_variant_options?: Array<{
      id: string;
      name: string;
      price_modifier_cents: number;
    }>;
  }>;
}

export interface OrderFilters {
  tenant_id?: string;
  status?: Order['status'];
  customer_id?: string;
  restaurant_id?: string;
  driver_id?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export interface DriverAssignmentRequest {
  driver_id: string;
  estimated_delivery_time?: Date;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface OrderStats {
  total_orders: number;
  orders_by_status: Record<string, number>;
  total_revenue: number;
  average_order_value: number;
  orders_by_restaurant: Record<string, number>;
}

