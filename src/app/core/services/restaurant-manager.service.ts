import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RestaurantManager {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: string;
  restaurant_name: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantStats {
  total_orders_today: number;
  total_revenue_today: number;
  total_orders_this_week: number;
  total_revenue_this_week: number;
  total_orders_this_month: number;
  total_revenue_this_month: number;
  average_order_value: number;
  popular_items: Array<{
    item_id: string;
    name: string;
    order_count: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class RestaurantManagerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/restaurant-managers`;

  // Get restaurants managed by current user
  getManagedRestaurants(): Observable<RestaurantManager[]> {
    return this.http.get<{ count: number; managers: RestaurantManager[] }>(`${this.baseUrl}/user/current`).pipe(
      map(response => response.managers || []),
      catchError(error => {
        console.error('Error fetching managed restaurants:', error);
        return of([]);
      })
    );
  }

  // Get managers for a specific restaurant
  getRestaurantManagers(restaurantId: string): Observable<RestaurantManager[]> {
    return this.http.get<{ count: number; managers: RestaurantManager[] }>(`${this.baseUrl}/restaurant/${restaurantId}`).pipe(
      map(response => response.managers || []),
      catchError(error => {
        console.error('Error fetching restaurant managers:', error);
        return of([]);
      })
    );
  }

  // Get restaurant statistics
  getRestaurantStats(restaurantId: string, period: 'today' | 'week' | 'month' = 'today'): Observable<RestaurantStats> {
    return this.http.get<{ stats: RestaurantStats }>(`${environment.apiUrl}/orders/restaurant/${restaurantId}/stats?period=${period}`).pipe(
      map(response => response.stats),
      catchError(error => {
        console.error('Error fetching restaurant stats:', error);
        return of({
          total_orders_today: 0,
          total_revenue_today: 0,
          total_orders_this_week: 0,
          total_revenue_this_week: 0,
          total_orders_this_month: 0,
          total_revenue_this_month: 0,
          average_order_value: 0,
          popular_items: []
        });
      })
    );
  }

  // Get recent orders for restaurant manager overview
  getRecentOrders(restaurantId: string, limit: number = 5): Observable<any[]> {
    return this.http.get<{ orders: any[] }>(`${environment.apiUrl}/orders/restaurant/${restaurantId}/recent?limit=${limit}`).pipe(
      map(response => response.orders),
      catchError(error => {
        console.error('Error fetching recent orders:', error);
        return of([]);
      })
    );
  }

  // Check if current user is manager of restaurant
  isManagerOfRestaurant(restaurantId: string): Observable<boolean> {
    return this.http.get<{ is_manager: boolean }>(`${this.baseUrl}/restaurant/${restaurantId}/is-manager`).pipe(
      map(response => response.is_manager),
      catchError(error => {
        console.error('Error checking manager status:', error);
        return of(false);
      })
    );
  }
}
