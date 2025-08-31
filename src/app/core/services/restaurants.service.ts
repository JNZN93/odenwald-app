import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantDTO } from '@odenwald/shared';

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
}

export type { RestaurantDTO } from '@odenwald/shared';


