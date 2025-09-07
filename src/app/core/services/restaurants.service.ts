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

interface VariantOptionDTO {
  id: string;
  variant_group_id: string;
  name: string;
  price_modifier_cents: number;
  is_available: boolean;
  position: number;
}

interface VariantGroupDTO {
  id: string;
  menu_item_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  position: number;
  options: VariantOptionDTO[];
}

interface MenuItemVariantsResponse {
  count: number;
  variant_groups: VariantGroupDTO[];
}

interface MenuCategoryWithItems {
  id: string;
  restaurant_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: string; // ISO string from API
  updated_at: string; // ISO string from API
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
    return this.http.get<RestaurantsResponse>(this.baseUrl).pipe(
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error fetching restaurants:', error);
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
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error fetching restaurants with filters:', error);
        return of([]);
      })
    );
  }

  searchNearby(lat: number, lng: number, radius: number = 10): Observable<RestaurantDTO[]> {
    return this.http.get<NearbyRestaurantsResponse>(
      `${this.baseUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    ).pipe(
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error searching nearby restaurants:', error);
        return of([]);
      })
    );
  }

  getNearbyRestaurants(lat: number, lng: number, radius: number = 10): Observable<RestaurantDTO[]> {
    return this.searchNearby(lat, lng, radius);
  }

  getRestaurantById(restaurantId: string): Observable<RestaurantDTO> {
    return this.http.get<{ restaurant: RestaurantDTO }>(`${this.baseUrl}/${restaurantId}`).pipe(
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
    return this.http.get<MenuCategoriesWithItemsResponse>(
      `${this.baseUrl}/${restaurantId}/menu-categories/public`
    ).pipe(
      map(response => response.categories || []),
      catchError(error => {
        console.error('Error fetching menu categories with items:', error);
        return of([]);
      })
    );
  }

  getMenuItemVariants(restaurantId: string, menuItemId: string): Observable<VariantGroupDTO[]> {
    return this.http.get<MenuItemVariantsResponse>(
      `${this.baseUrl}/${restaurantId}/menu-items/${menuItemId}/variants`
    ).pipe(
      map(response => response.variant_groups || []),
      catchError(error => {
        console.error('Error fetching menu item variants:', error);
        return of([]);
      })
    );
  }

  getMenuCategoriesWithItemsAndVariants(restaurantId: string): Observable<MenuCategoryWithItems[]> {
    return this.getMenuCategoriesWithItems(restaurantId).pipe(
      map(categories => {
        // For each category, enrich items with variants
        return categories.map(category => ({
          ...category,
          items: category.items.map(item => ({
            ...item,
            variants: [] as VariantGroupDTO[] // Will be populated below
          }))
        }));
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

  toggleImmediateClosure(restaurantId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.baseUrl}/${restaurantId}/toggle-immediate-closure`, {}).pipe(
      catchError(error => {
        console.error('Error toggling restaurant immediate closure status:', error);
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

  getDeliveryEtaDebug(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${restaurantId}/delivery-eta-debug`).pipe(
      catchError(error => {
        console.error('Error fetching delivery ETA debug:', error);
        throw error;
      })
    );
  }

  updateRestaurant(restaurantId: string, data: UpdateRestaurantRequest): Observable<RestaurantDTO> {
    return this.http.put<{ restaurant: RestaurantDTO }>(`${this.baseUrl}/${restaurantId}`, data).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error updating restaurant:', error);
        throw error;
      })
    );
  }

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

  updateRestaurantAddress(
    restaurantId: string,
    address: { street: string; postal_code: string; city: string; country: string }
  ): Observable<RestaurantDTO> {
    return this.http.put<{ message: string; restaurant: RestaurantDTO }>(
      `${this.baseUrl}/${restaurantId}/address`,
      { address }
    ).pipe(
      map(response => response.restaurant),
      catchError(error => {
        console.error('Error updating restaurant address:', error);
        throw error;
      })
    );
  }

  getRestaurantsByManager(managerId: string): Observable<RestaurantDTO[]> {
    return this.http.get<{ count: number; restaurants: RestaurantDTO[] }>(
      `${this.baseUrl}/manager/${managerId}`
    ).pipe(
      map(response => response.restaurants || []),
      catchError(error => {
        console.error('Error fetching restaurants by manager:', error);
        return of([]);
      })
    );
  }

  getRestaurantPaymentMethods(restaurantId: string): Observable<{ cash: boolean; card: boolean; paypal: boolean }> {
    return this.http.get<{ payment_methods: { cash: boolean; card: boolean; paypal: boolean } }>(
      `${this.baseUrl}/${restaurantId}/payment-methods/public`
    ).pipe(
      map(response => response.payment_methods),
      catchError(error => {
        console.error('Error fetching payment methods:', error);
        throw error;
      })
    );
  }

  updateRestaurantPaymentMethods(
    restaurantId: string,
    paymentMethods: { cash: boolean; card: boolean; paypal: boolean }
  ): Observable<{ message: string; payment_methods: { cash: boolean; card: boolean; paypal: boolean } }> {
    return this.http.put<{ message: string; payment_methods: { cash: boolean; card: boolean; paypal: boolean } }>(
      `${this.baseUrl}/${restaurantId}/payment-methods`,
      { payment_methods: paymentMethods }
    ).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error updating payment methods:', error);
        throw error;
      })
    );
  }

  uploadRestaurantLogo(restaurantId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${restaurantId}/upload-logo`, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant logo:', error);
        throw error;
      })
    );
  }

  uploadRestaurantBanner(restaurantId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${restaurantId}/upload-banner`, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant banner:', error);
        throw error;
      })
    );
  }

  uploadRestaurantGallery(restaurantId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${restaurantId}/upload-gallery`, formData).pipe(
      catchError(error => {
        console.error('Error uploading restaurant gallery:', error);
        throw error;
      })
    );
  }

  deleteGalleryImage(restaurantId: string, imageIndex: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}/gallery/${imageIndex}`).pipe(
      catchError(error => {
        console.error('Error deleting gallery image:', error);
        throw error;
      })
    );
  }

  uploadMenuItemImage(restaurantId: string, itemId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${restaurantId}/menu-items/${itemId}/upload-image`, formData).pipe(
      catchError(error => {
        console.error('Error uploading menu item image:', error);
        throw error;
      })
    );
  }

  deleteMenuItemImage(restaurantId: string, itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}/menu-items/${itemId}/remove-image`).pipe(
      catchError(error => {
        console.error('Error deleting menu item image:', error);
        throw error;
      })
    );
  }

  getRestaurantCustomers(restaurantId: string): Observable<RestaurantCustomer[]> {
    return this.http.get<RestaurantCustomersResponse>(
      `${this.baseUrl}/${restaurantId}/customers`
    ).pipe(
      map(response => response.customers || []),
      catchError(error => {
        console.error('Error fetching restaurant customers:', error);
        return of([]);
      })
    );
  }

  getRestaurantCustomer(restaurantId: string, customerId: string): Observable<RestaurantCustomer> {
    return this.http.get<{ customer: RestaurantCustomer }>(
      `${this.baseUrl}/${restaurantId}/customers/${customerId}`
    ).pipe(
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
    return this.http.post<{ customer: RestaurantCustomer }>(
      `${this.baseUrl}/${restaurantId}/customers`,
      customerData
    ).pipe(
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
    return this.http.put<{ customer: RestaurantCustomer }>(
      `${this.baseUrl}/${restaurantId}/customers/${customerId}`,
      customerData
    ).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error updating restaurant customer:', error);
        throw error;
      })
    );
  }

  deleteRestaurantCustomer(restaurantId: string, customerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${restaurantId}/customers/${customerId}`).pipe(
      catchError(error => {
        console.error('Error deleting restaurant customer:', error);
        throw error;
      })
    );
  }

  getRestaurantCustomerStats(restaurantId: string): Observable<RestaurantCustomerStats> {
    return this.http.get<{ stats: RestaurantCustomerStats }>(
      `${this.baseUrl}/${restaurantId}/customers/stats`
    ).pipe(
      map(response => response.stats),
      catchError(error => {
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
    return this.http.get<{ customer: RestaurantCustomer }>(
      `${this.baseUrl}/${restaurantId}/customers/search?email=${encodeURIComponent(email)}`
    ).pipe(
      map(response => response.customer),
      catchError(error => {
        console.error('Error searching restaurant customer:', error);
        throw error;
      })
    );
  }

  getVariantsForMenuItem(restaurantId: string, itemId: string): Observable<MenuItemVariantsResponse> {
    return this.http.get<MenuItemVariantsResponse>(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variants`
    ).pipe(
      catchError(() => of({ count: 0, variant_groups: [] }))
    );
  }

  createVariantGroup(restaurantId: string, itemId: string, groupData: {
    name: string;
    is_required?: boolean;
    min_selections?: number;
    max_selections?: number;
    position?: number;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups`,
      groupData
    ).pipe(
      catchError(error => {
        console.error('Error creating variant group:', error);
        throw error;
      })
    );
  }

  updateVariantGroup(restaurantId: string, itemId: string, groupId: string, groupData: {
    name?: string;
    is_required?: boolean;
    min_selections?: number;
    max_selections?: number;
    position?: number;
  }): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups/${groupId}`,
      groupData
    ).pipe(
      catchError(error => {
        console.error('Error updating variant group:', error);
        throw error;
      })
    );
  }

  deleteVariantGroup(restaurantId: string, itemId: string, groupId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups/${groupId}`
    ).pipe(
      catchError(error => {
        console.error('Error deleting variant group:', error);
        throw error;
      })
    );
  }

  createVariantOption(restaurantId: string, itemId: string, groupId: string, optionData: {
    name: string;
    price_modifier_cents?: number;
    is_available?: boolean;
    position?: number;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups/${groupId}/options`,
      optionData
    ).pipe(
      catchError(error => {
        console.error('Error creating variant option:', error);
        throw error;
      })
    );
  }

  updateVariantOption(restaurantId: string, itemId: string, groupId: string, optionId: string, optionData: {
    name?: string;
    price_modifier_cents?: number;
    is_available?: boolean;
    position?: number;
  }): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups/${groupId}/options/${optionId}`,
      optionData
    ).pipe(
      catchError(error => {
        console.error('Error updating variant option:', error);
        throw error;
      })
    );
  }

  deleteVariantOption(restaurantId: string, itemId: string, groupId: string, optionId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${restaurantId}/menu-items/${itemId}/variant-groups/${groupId}/options/${optionId}`
    ).pipe(
      catchError(error => {
        console.error('Error deleting variant option:', error);
        throw error;
      })
    );
  }
}

export type { RestaurantDTO } from '@odenwald/shared';

