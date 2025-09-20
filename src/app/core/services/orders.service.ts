import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  price_cents?: number;
  image_url?: string;
  selected_variant_options?: Array<{
    id: string;
    name: string;
    group_name: string;
    price_modifier_cents: number;
  }>;
}

export interface LoyaltyData {
  restaurant_id: string;
  restaurant_name: string;
  customer_id: string;
  current_stamps: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  can_redeem: boolean;
  stamps_required: number;
  discount_percent: number;
  last_updated?: string;
}

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  customer_name?: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_price: number;
  loyalty_discount_amount?: number;
  loyalty_redeemed?: boolean;
  loyalty_redemption_stamps_used?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'open' | 'in_progress' | 'out_for_delivery';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method?: 'cash' | 'card' | 'paypal' | 'bank_transfer';
  delivery_address: string;
  delivery_instructions?: string;
  notes?: string; // Additional notes from customer or restaurant manager
  created_at: string;
  updated_at: string;
  driver_id?: string;
  driver_name?: string;
  // Table order fields
  table_id?: string;
  table_number?: string;
  session_id?: string;
  party_size?: number;
  order_type?: 'delivery' | 'pickup' | 'dine_in';
  table_status?: 'ordered' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid';
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export interface OrderStats {
  total_orders: number;
  orders_by_status: Record<string, number>;
  total_revenue: number;
  average_order_value: number;
  orders_by_restaurant: Record<string, number>;
}

export interface OrderFilters {
  status?: string;
  restaurant_id?: string;
  driver_id?: string;
  manager_user_id?: string; // For restaurant manager filtering
  date_range?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/orders`;

  // Normalize raw API order item to typed OrderItem
  private normalizeItem = (item: any): OrderItem => ({
    id: String(item.id),
    menu_item_id: String(item.menu_item_id),
    name: item.name,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    total_price: Number(item.total_price) || 0,
    image_url: item.image_url,
    selected_variant_options: item.selected_variant_options
  });

  // Normalize raw API order to typed Order
  public normalizeOrder = (raw: any): Order => ({
    id: String(raw.id),
    user_id: String(raw.user_id),
    restaurant_id: String(raw.restaurant_id),
    restaurant_name: raw.restaurant_name,
    customer_name: raw.customer_name,
    customer_email: raw.customer_email,
    items: Array.isArray(raw.items) ? raw.items.map((it: any) => this.normalizeItem(it)) : [],
    subtotal: Number(raw.subtotal) || 0,
    delivery_fee: Number(raw.delivery_fee) || 0,
    total_price: Number(raw.total_price) || 0,
    loyalty_discount_amount: raw.loyalty_discount_amount != null ? Number(raw.loyalty_discount_amount) : undefined,
    loyalty_redeemed: raw.loyalty_redeemed != null ? !!raw.loyalty_redeemed : undefined,
    loyalty_redemption_stamps_used: raw.loyalty_redemption_stamps_used != null ? Number(raw.loyalty_redemption_stamps_used) : undefined,
    status: raw.status,
    payment_status: raw.payment_status,
    payment_method: raw.payment_method,
    delivery_address: raw.delivery_address,
    delivery_instructions: raw.delivery_instructions ?? undefined,
    notes: raw.notes ?? undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    driver_id: raw.driver_id != null ? String(raw.driver_id) : undefined,
    driver_name: raw.driver_name,
    // Table order fields
    table_id: raw.table_id ?? undefined,
    table_number: raw.table_number ?? undefined,
    party_size: raw.party_size != null ? Number(raw.party_size) : undefined,
    order_type: raw.order_type ?? undefined,
    table_status: raw.table_status ?? undefined
  });

  // Get all orders with optional filters
  getOrders(filters?: OrderFilters): Observable<Order[]> {
    let params: any = {};

    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters?.restaurant_id) {
      params.restaurant_id = filters.restaurant_id;
    }

    if (filters?.driver_id) {
      params.driver_id = filters.driver_id;
    }

    if (filters?.manager_user_id) {
      params.manager_user_id = filters.manager_user_id;
    }

    if (filters?.date_range) {
      params.start = filters.date_range.start.toISOString();
      params.end = filters.date_range.end.toISOString();
    }

    return this.http.get<{ count: number; orders: any[] }>(this.baseUrl, { params }).pipe(
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get order by ID
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<{ order: any }>(`${this.baseUrl}/${orderId}`).pipe(
      map(response => {
        // API returns { order: OrderWithItems } where OrderWithItems has { order: Order, items: OrderItem[] }
        const orderWithItems = response.order;
        if (orderWithItems && orderWithItems.order) {
          return this.normalizeOrder(orderWithItems.order);
        }
        // Fallback: if it's already the order object directly
        return this.normalizeOrder(orderWithItems);
      })
    );
  }

  // Create new order
  createOrder(orderData: {
    restaurant_id: string;
    delivery_address: string;
    delivery_instructions?: string;
    payment_method?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      unit_price: number;
    }>;
  }): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(this.baseUrl, orderData);
  }

  // Update order status
  updateOrderStatus(orderId: string, status: Order['status']): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/status`, { status });
  }

  // Update order payment status
  updateOrderPaymentStatus(orderId: string, paymentStatus: Order['payment_status']): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/payment-status`, { payment_status: paymentStatus });
  }

  // Assign driver to order
  assignDriver(orderId: string, driverId: string, estimatedDeliveryTime?: Date): Observable<{ message: string; order: Order }> {
    const data: any = { driver_id: driverId };
    if (estimatedDeliveryTime) {
      data.estimated_delivery_time = estimatedDeliveryTime.toISOString();
    }
    return this.http.post<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/assign-driver`, data);
  }

  // Cancel order
  cancelOrder(orderId: string, reason?: string): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/cancel`, { reason });
  }

  // Get order tracking information
  getOrderTracking(orderId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orderId}/tracking`);
  }

  // Get current user's orders (with items)
  getMyOrders(): Observable<Order[]> {
    return this.http.get<{ count: number; orders: any[] }>(`${this.baseUrl}/with-items`).pipe(
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get customer orders (for admin use)
  getCustomerOrders(customerId: string): Observable<Order[]> {
    return this.http.get<{ count: number; orders: any[] }>(`${this.baseUrl}/customer/${customerId}`).pipe(
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get restaurant orders
  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    const url = `${this.baseUrl}/restaurant/${restaurantId}`;
    console.log('[OrdersService] Preparing request', { url, restaurantId });
    return this.http.get<{ count: number; orders: any[] }>(url).pipe(
      tap(response => console.log('[OrdersService] GET', url, {
        count: response?.count,
        ordersLength: response?.orders?.length,
        sample: response?.orders?.[0]
      })),
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get driver orders
  getDriverOrders(driverId: string): Observable<Order[]> {
    return this.http.get<{ count: number; orders: any[] }>(`${this.baseUrl}/driver/${driverId}`).pipe(
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get current driver's orders (assigned + available)
  getMyDriverOrders(): Observable<{
    activeDelivery: Order | null;
    activeDeliveries: Order[];
    availableOrders: Order[];
    count: number
  }> {
    return this.http.get<{
      activeDelivery: any;
      activeDeliveries: any[];
      availableOrders: any[];
      count: number
    }>(`${this.baseUrl}/my-orders`).pipe(
      map(response => ({
        activeDelivery: response.activeDelivery ? this.normalizeOrder(response.activeDelivery) : null,
        activeDeliveries: (response.activeDeliveries || []).map(o => this.normalizeOrder(o)),
        availableOrders: (response.availableOrders || []).map(o => this.normalizeOrder(o)),
        count: response.count
      }))
    );
  }

  // Get available orders for drivers
  getAvailableOrders(): Observable<Order[]> {
    return this.http.get<{ count: number; orders: any[] }>(`${this.baseUrl}/available`).pipe(
      map(response => (response.orders || []).map(o => this.normalizeOrder(o)))
    );
  }

  // Get current user's loyalty data across all restaurants
  getMyLoyalty(): Observable<{ count: number; loyalty: LoyaltyData[] }> {
    return this.http.get<{ count: number; loyalty: any[] }>(`${this.baseUrl}/my-loyalty`);
  }

  // Update order notes
  updateOrderNotes(orderId: string, notes: string): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/notes`, { notes });
  }

  // Update order notes by customer
  updateOrderNotesByCustomer(orderId: string, notes: string): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(`${this.baseUrl}/${orderId}/customer-notes`, { notes });
  }

  // Get order statistics
  getOrderStats(timeRange?: { start: Date; end: Date }): Observable<{ stats: OrderStats }> {
    let params: any = {};
    if (timeRange) {
      params.start = timeRange.start.toISOString();
      params.end = timeRange.end.toISOString();
    }
    return this.http.get<{ stats: OrderStats }>(`${this.baseUrl}/stats`, { params });
  }

  // Submit an issue report for an order
  submitOrderIssue(data: {
    order_id: string;
    restaurant_id: string;
    reason: string;
    description: string;
    priority?: 'low' | 'normal' | 'high';
    restaurant_customer_id?: string;
  }): Observable<any> {
    const url = `${environment.apiUrl}/order-issues`;
    return this.http.post(url, data);
  }

  // Table Order Methods

  // Type Guards for order types
  isDeliveryOrder(order: Order): boolean {
    return order.order_type === 'delivery' || (!order.order_type && !!order.delivery_address);
  }

  isTableOrder(order: Order): boolean {
    return order.order_type === 'dine_in' || (!order.order_type && !!order.table_id);
  }

  isPickupOrder(order: Order): boolean {
    return order.order_type === 'pickup';
  }

  // Create table order
  createTableOrder(tableOrderData: {
    restaurant_id: string;
    table_id: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      special_instructions?: string;
      selected_variant_options?: any[];
    }>;
    customer_info?: {
      name: string;
      email?: string;
      phone?: string;
    };
    party_size?: number;
    notes?: string;
  }): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(`${this.baseUrl}/table-order`, tableOrderData);
  }

  // Get table orders for a restaurant
  getTableOrders(restaurantId: string, tableId?: string): Observable<Order[]> {
    const filters: OrderFilters = {
      restaurant_id: restaurantId,
      status: 'dine_in'
    };

    if (tableId) {
      (filters as any).table_id = tableId;
    }

    return this.getOrders(filters);
  }

  // Update table order status
  updateTableOrderStatus(orderId: string, status: 'ordered' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid'): Observable<{ message: string; order: Order }> {
    return this.http.patch<{ message: string; order: Order }>(
      `${this.baseUrl}/${orderId}/table-status`,
      { status }
    );
  }
}
