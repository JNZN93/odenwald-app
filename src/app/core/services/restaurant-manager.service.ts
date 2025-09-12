import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantDTO } from './restaurants.service';

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
  peak_hours?: Array<{
    hour: number;
    orders: number;
    percentage: number;
  }>;
  peak_hours_by_day?: Array<{
    day: number;
    dayName: string;
    hours: Array<{ hour: number; orders: number; percentage: number }>;
  }>;
}

@Injectable({ providedIn: 'root' })
export class RestaurantManagerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/restaurant-managers`;

  // BehaviorSubject für aktuell ausgewähltes Restaurant
  private selectedRestaurantSubject = new BehaviorSubject<RestaurantManager | null>(null);
  public selectedRestaurant$ = this.selectedRestaurantSubject.asObservable();

  // Aktuell ausgewähltes Restaurant setzen
  setSelectedRestaurant(restaurant: RestaurantManager | null) {
    this.selectedRestaurantSubject.next(restaurant);
    // Optional: In localStorage speichern für Persistenz
    if (restaurant) {
      localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    } else {
      localStorage.removeItem('selectedRestaurant');
    }
  }

  // Hilfsmethoden für HTTP-Zugriff
  getHttpClient(): HttpClient {
    return this.http;
  }

  getApiUrl(): string {
    return environment.apiUrl;
  }

  // Aktuell ausgewähltes Restaurant bekommen
  getSelectedRestaurant(): RestaurantManager | null {
    return this.selectedRestaurantSubject.value;
  }

  // Restaurant-Name bekommen
  getSelectedRestaurantName(): string {
    const restaurant = this.selectedRestaurantSubject.value;
    return restaurant ? restaurant.restaurant_name : 'Restaurant';
  }

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

  // Get full restaurant details by restaurant ID
  getRestaurantDetails(restaurantId: string): Observable<RestaurantDTO> {
    return this.http.get<{ restaurant: RestaurantDTO }>(`${environment.apiUrl}/restaurants/${restaurantId}`).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error fetching restaurant details:', error);
        throw error;
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
          popular_items: [],
          peak_hours: []
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

  // Get historical data for charts
  getHistoricalData(restaurantId: string, period: '7d' | '30d' | '90d' = '7d'): Observable<{
    revenue: Array<{ date: string; amount: number }>;
    orders: Array<{ date: string; count: number }>;
  }> {
    return this.http.get<{
      data: {
        revenue: Array<{ date: string; amount: number }>;
        orders: Array<{ date: string; count: number }>;
      }
    }>(`${environment.apiUrl}/orders/restaurant/${restaurantId}/historical?period=${period}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching historical data:', error);
        return of({
          revenue: [],
          orders: []
        });
      })
    );
  }
}
