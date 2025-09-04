import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantDTO, UpdateRestaurantRequest } from '@odenwald/shared';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  category_id: string;
  image_url?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  position: number;
}

interface MenuItemsResponse {
  count: number;
  menu_items: MenuItem[];
}

interface MenuCategoriesResponse {
  count: number;
  categories: MenuCategory[];
}

interface MenuCategoryWithItems {
  id: string;
  restaurant_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: Date;
  updated_at: Date;
  items: MenuItem[];
}

interface MenuCategoriesWithItemsResponse {
  count: number;
  categories: MenuCategoryWithItems[];
}

export interface RestaurantCustomer {
  id: number;
  restaurant_id: number;
  user_id?: number;
  email: string;
  name: string;
  phone?: string;
  first_order_at: string;
  last_order_at: string;
  total_orders: number;
  total_spent_cents: number;
  preferences?: {
    allergies?: string[];
    favorite_items?: number[];
    delivery_notes?: string;
    payment_preference?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RestaurantCustomersResponse {
  count: number;
  customers: RestaurantCustomer[];
}

interface RestaurantCustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
  avg_orders_per_customer: number;
}

interface RestaurantsResponse {
  count: number;
  restaurants: RestaurantDTO[];
}

interface NearbyRestaurantsResponse {
  count: number;
  radius_km: number;
  coordinates: { latitude: number; longitude: number };
  restaurants: RestaurantDTO[];
}

@Injectable({ providedIn: 'root' })
export class RestaurantsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/restaurants`;

  list(): Observable<RestaurantDTO[]> {
    console.log('RestaurantsService: Fetching restaurants from:', this.baseUrl);
    return this.http.get<RestaurantsResponse>(this.baseUrl).pipe(
      map(response => {
        console.log('RestaurantsService: Received response:', response);
        return response.restaurants || [];
      }),
      catchError(error => {
        console.error('RestaurantsService: Error fetching restaurants:', error);
        return of([]);
      })
    );
  }

  listWithFilters(filters?: {
    tenant_id?: string;
    cuisine_type?: string;
    is_active?: boolean;
    is_verified?: boolean;
    min_rating?: number;
    is_open_now?: boolean;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Observable<RestaurantDTO[]> {
    console.log('RestaurantsService: Fetching restaurants with filters:', filters);

    const params = new URLSearchParams();

    if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
    if (filters?.cuisine_type) params.append('cuisine_type', filters.cuisine_type);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
    if (filters?.min_rating) params.append('min_rating', filters.min_rating.toString());
    if (filters?.is_open_now) params.append('is_open_now', 'true');
    if (filters?.lat) params.append('lat', filters.lat.toString());
    if (filters?.lng) params.append('lng', filters.lng.toString());
    if (filters?.radius) params.append('radius', filters.radius.toString());

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

    return this.http.get<RestaurantsResponse>(url).pipe(
      map(response => {
        console.log('RestaurantsService: Received filtered response:', response);
        return response.restaurants || [];
      }),
      catchError(error => {
        console.error('RestaurantsService: Error fetching restaurants with filters:', error);
        return of([]);
      })
    );
  }

  searchNearby(lat: number, lng: number, radius: number = 10): Observable<RestaurantDTO[]> {
    return this.http.get<NearbyRestaurantsResponse>(`${this.baseUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`).pipe(
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error searching nearby restaurants:', error);
        return of([]);
      })
    );
  }

  getById(id: string): Observable<RestaurantDTO> {
    return this.http.get<{ restaurant: RestaurantDTO }>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error fetching restaurant:', error);
        throw error;
      })
    );
  }

  getMenuItems(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<MenuItemsResponse>(`${this.baseUrl}/${restaurantId}/menu-items`).pipe(
      map(response => response.menu_items || []),
      catchError(error => {
        console.error('Error fetching menu items:', error);
        return of([]);
      })
    );
  }

  getMenuCategories(restaurantId: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategoriesResponse>(`${this.baseUrl}/${restaurantId}/menu-categories`).pipe(
      map(response => response.categories || []),
      catchError(error => {
        console.error('Error fetching menu categories:', error);
        return of([]);
      })
    );
  }

  getMenuCategoriesWithItems(restaurantId: string): Observable<MenuCategoryWithItems[]> {
    console.log('🌐 Making request to public endpoint:', `${this.baseUrl}/${restaurantId}/menu-categories/public`);
    return this.http.get<MenuCategoriesWithItemsResponse>(`${this.baseUrl}/${restaurantId}/menu-categories/public`).pipe(
      map(response => {
        console.log('✅ Received response:', response);
        return response.categories || [];
      }),
      catchError(error => {
        console.error('❌ Error fetching menu categories with items:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error URL:', error.url);
        return of([]);
      })
    );
  }

  createMenuItem(restaurantId: string, data: {
    category_id?: string;
    name: string;
    description?: string;
    price?: number;
    price_cents?: number;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    preparation_time_minutes?: number;
    image_url?: string;
  }): Observable<MenuItem> {
    return this.http.post<{ menu_item: MenuItem }>(`${this.baseUrl}/${restaurantId}/menu-items`, data).pipe(
      map(response => response.menu_item),
      catchError(error => {
        console.error('Error creating menu item:', error);
        throw error;
      })
    );
  }

  toggleActive(restaurantId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.baseUrl}/${restaurantId}/toggle-active`, {}).pipe(
      catchError(error => {
        console.error('Error toggling restaurant active status:', error);
        throw error;
      })
    );
  }

  delete(restaurantId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${restaurantId}`).pipe(
      catchError(error => {
        console.error('Error deleting restaurant:', error);
        throw error;
      })
    );
  }

  createCategory(restaurantId: string, data: {
    name: string;
    description?: string;
    position?: number;
    is_active?: boolean;
  }): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${this.baseUrl}/${restaurantId}/menu-categories`, data);
  }

  updateCategory(restaurantId: string, categoryId: string, data: {
    name?: string;
    description?: string;
    position?: number;
    is_active?: boolean;
  }): Observable<MenuCategory> {
    return this.http.put<MenuCategory>(`${this.baseUrl}/${restaurantId}/menu-categories/${categoryId}`, data);
  }

  deleteCategory(restaurantId: string, categoryId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}/menu-categories/${categoryId}`);
  }

  deleteMenuItem(restaurantId: string, itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}/menu-items/${itemId}`);
  }

  updateMenuItem(restaurantId: string, itemId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    price_cents?: number;
    category_id?: string;
    is_available?: boolean;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    preparation_time_minutes?: number;
    image_url?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${restaurantId}/menu-items/${itemId}`, data);
  }

  restoreMenuItem(restaurantId: string, itemId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${restaurantId}/menu-items/${itemId}/restore`, {});
  }

  // Get single restaurant by ID
  getRestaurantById(restaurantId: string): Observable<RestaurantDTO> {
    return this.http.get<{ restaurant: RestaurantDTO }>(`${this.baseUrl}/${restaurantId}`).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error fetching restaurant:', error);
        throw error;
      })
    );
  }

  // Restaurant Settings Update Methods
  updateRestaurant(restaurantId: string, data: UpdateRestaurantRequest): Observable<RestaurantDTO> {
    return this.http.put<{ restaurant: RestaurantDTO }>(`${this.baseUrl}/${restaurantId}`, data).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error updating restaurant:', error);
        throw error;
      })
    );
  }

  // Get restaurant statistics
  getRestaurantStats(restaurantId: string, timeRange?: {
    start: Date;
    end: Date;
  }): Observable<any> {
    let url = `${this.baseUrl}/${restaurantId}/stats`;
    if (timeRange) {
      const params = new URLSearchParams();
      params.append('start', timeRange.start.toISOString());
      params.append('end', timeRange.end.toISOString());
      url += `?${params.toString()}`;
    }

    return this.http.get<{ stats: any }>(url).pipe(
      map(response => response.stats),
      catchError(error => {
        console.error('Error fetching restaurant stats:', error);
        throw error;
      })
    );
  }

  // Get restaurants managed by a specific manager
  getRestaurantsByManager(managerId: string): Observable<RestaurantDTO[]> {
    const url = `${this.baseUrl}/manager/${managerId}`;
    return this.http.get<{ count: number; restaurants: RestaurantDTO[] }>(url).pipe(
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error fetching restaurants by manager:', error);
        return of([]);
      })
    );
  }

  // Update payment methods for a restaurant
  updateRestaurantPaymentMethods(restaurantId: string, paymentMethods: { cash: boolean; card: boolean; paypal: boolean }): Observable<RestaurantDTO> {
    const url = `${this.baseUrl}/${restaurantId}/payment-methods`;
    return this.http.put<{ message: string; payment_methods: any }>(url, { payment_methods: paymentMethods }).pipe(
      map(response => response as any),
      catchError(error => {
        console.error('Error updating payment methods:', error);
        throw error;
      })
    );
  }

  // Image Upload Methods
  uploadRestaurantLogo(restaurantId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/upload-logo`;
    return this.http.post(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant logo:', error);
        throw error;
      })
    );
  }

  uploadRestaurantBanner(restaurantId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/upload-banner`;
    return this.http.post(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant banner:', error);
        throw error;
      })
    );
  }

  uploadRestaurantGallery(restaurantId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/upload-gallery`;
    return this.http.post(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant gallery:', error);
        throw error;
      })
    );
  }

  deleteGalleryImage(restaurantId: string, imageIndex: number): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/gallery/${imageIndex}`;
    return this.http.delete(url).pipe(
      catchError(error => {
        console.error('Error deleting gallery image:', error);
        throw error;
      })
    );
  }

  // Menu Item Image Upload Methods
  uploadMenuItemImage(restaurantId: string, itemId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/upload-image`;
    return this.http.post(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading menu item image:', error);
        throw error;
      })
    );
  }

  deleteMenuItemImage(restaurantId: string, itemId: string): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/remove-image`;
    return this.http.delete(url).pipe(
      catchError(error => {
        console.error('Error deleting menu item image:', error);
        throw error;
      })
    );
  }

  // Restaurant Customer Management Methods
  getRestaurantCustomers(restaurantId: string): Observable<RestaurantCustomer[]> {
    const url = `${this.baseUrl}/${restaurantId}/customers`;
    return this.http.get<RestaurantCustomersResponse>(url).pipe(
      map(response => response.customers || []),
      catchError(error => {
        console.error('Error fetching restaurant customers:', error);
        return of([]);
      })
    );
  }

  getRestaurantCustomer(restaurantId: string, customerId: string): Observable<RestaurantCustomer> {
    const url = `${this.baseUrl}/${restaurantId}/customers/${customerId}`;
    return this.http.get<{ customer: RestaurantCustomer }>(url).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error fetching restaurant customer:', error);
        throw error;
      })
    );
  }

  createRestaurantCustomer(restaurantId: string, customerData: {
    email: string;
    name: string;
    phone?: string;
    preferences?: RestaurantCustomer['preferences'];
  }): Observable<RestaurantCustomer> {
    const url = `${this.baseUrl}/${restaurantId}/customers`;
    return this.http.post<{ customer: RestaurantCustomer }>(url, customerData).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error creating restaurant customer:', error);
        throw error;
      })
    );
  }

  updateRestaurantCustomer(restaurantId: string, customerId: string, customerData: {
    name?: string;
    phone?: string;
    preferences?: RestaurantCustomer['preferences'];
    is_active?: boolean;
  }): Observable<RestaurantCustomer> {
    const url = `${this.baseUrl}/${restaurantId}/customers/${customerId}`;
    return this.http.put<{ customer: RestaurantCustomer }>(url, customerData).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error updating restaurant customer:', error);
        throw error;
      })
    );
  }

  deleteRestaurantCustomer(restaurantId: string, customerId: string): Observable<any> {
    const url = `${this.baseUrl}/${restaurantId}/customers/${customerId}`;
    return this.http.delete(url).pipe(
      catchError(error => {
        console.error('Error deleting restaurant customer:', error);
        throw error;
      })
    );
  }

  getRestaurantCustomerStats(restaurantId: string): Observable<RestaurantCustomerStats> {
    const url = `${this.baseUrl}/${restaurantId}/customers/stats`;
    return this.http.get<{ stats: RestaurantCustomerStats }>(url).pipe(
      map(response => response.stats),
      catchError(error => {
        // Don't log 404/403 errors as they are expected for non-existent restaurants
        if (error.status !== 404 && error.status !== 403) {
          console.error('Error fetching restaurant customer stats:', error);
        }
        return of({
          total_customers: 0,
          active_customers: 0,
          new_customers_this_month: 0,
          avg_orders_per_customer: 0
        });
      })
    );
  }

  searchRestaurantCustomers(restaurantId: string, email: string): Observable<RestaurantCustomer> {
    const url = `${this.baseUrl}/${restaurantId}/customers/search?email=${encodeURIComponent(email)}`;
    return this.http.get<{ customer: RestaurantCustomer }>(url).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error searching restaurant customer:', error);
        throw error;
      })
    );
  }
}

export type { RestaurantDTO } from '@odenwald/shared';


