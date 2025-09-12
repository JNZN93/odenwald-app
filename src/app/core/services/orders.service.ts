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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'open' | 'in_progress' | 'out_for_delivery';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
  driver_id?: string;
  driver_name?: string;
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
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total_price: Number(item.total_price),
    image_url: item.image_url,
    selected_variant_options: item.selected_variant_options
  });

  // Normalize raw API order to typed Order
  private normalizeOrder = (raw: any): Order => ({
    id: String(raw.id),
    user_id: String(raw.user_id),
    restaurant_id: String(raw.restaurant_id),
    restaurant_name: raw.restaurant_name,
    customer_name: raw.customer_name,
    customer_email: raw.customer_email,
    items: Array.isArray(raw.items) ? raw.items.map((it: any) => this.normalizeItem(it)) : [],
    subtotal: Number(raw.subtotal),
    delivery_fee: Number(raw.delivery_fee),
    total_price: Number(raw.total_price),
    status: raw.status,
    payment_status: raw.payment_status,
    delivery_address: raw.delivery_address,
    delivery_instructions: raw.delivery_instructions ?? undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    driver_id: raw.driver_id != null ? String(raw.driver_id) : undefined,
    driver_name: raw.driver_name
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
      map(response => this.normalizeOrder(response.order))
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

  // Get order statistics
  getOrderStats(timeRange?: { start: Date; end: Date }): Observable<{ stats: OrderStats }> {
    let params: any = {};
    if (timeRange) {
      params.start = timeRange.start.toISOString();
      params.end = timeRange.end.toISOString();
    }
    return this.http.get<{ stats: OrderStats }>(`${this.baseUrl}/stats`, { params });
  }
}
