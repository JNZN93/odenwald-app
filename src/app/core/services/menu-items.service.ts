import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  preparation_time_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable({ providedIn: 'root' })
export class MenuItemsService {
  private http = inject(HttpClient);

  getMenuItemsByRestaurant(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<{ menu_items: MenuItem[] }>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items`).pipe(
      map(response => response.menu_items || []),
      catchError(error => {
        console.error('Error fetching menu items:', error);
        return of([]);
      })
    );
  }

  getCategoriesByRestaurant(restaurantId: string): Observable<MenuCategory[]> {
    return this.http.get<{ categories: MenuCategory[] }>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-categories`).pipe(
      map(response => response.categories || []),
      catchError(error => {
        console.error('Error fetching menu categories:', error);
        return of([]);
      })
    );
  }

  getMenuItemById(restaurantId: string, itemId: string): Observable<MenuItem | null> {
    return this.http.get<MenuItem>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}`).pipe(
      catchError(error => {
        console.error('Error fetching menu item:', error);
        return of(null);
      })
    );
  }

  createMenuItem(restaurantId: string, data: {
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    is_available?: boolean;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    preparation_time_minutes?: number;
    image_url?: string;
  }): Observable<MenuItem> {
    return this.http.post<{ menu_item: MenuItem }>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items`, data).pipe(
      map(response => response.menu_item),
      catchError(error => {
        console.error('Error creating menu item:', error);
        throw error;
      })
    );
  }

  updateMenuItem(restaurantId: string, itemId: string, data: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}`, data).pipe(
      catchError(error => {
        console.error('Error updating menu item:', error);
        throw error;
      })
    );
  }

  deleteMenuItem(restaurantId: string, itemId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items/${itemId}`).pipe(
      catchError(error => {
        console.error('Error deleting menu item:', error);
        throw error;
      })
    );
  }

  createCategory(restaurantId: string, data: {
    name: string;
    description?: string;
    sort_order?: number;
  }): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-categories`, data).pipe(
      catchError(error => {
        console.error('Error creating menu category:', error);
        throw error;
      })
    );
  }

  updateCategory(restaurantId: string, categoryId: string, data: Partial<MenuCategory>): Observable<MenuCategory> {
    return this.http.put<MenuCategory>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-categories/${categoryId}`, data).pipe(
      catchError(error => {
        console.error('Error updating menu category:', error);
        throw error;
      })
    );
  }

  deleteCategory(restaurantId: string, categoryId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/restaurants/${restaurantId}/menu-categories/${categoryId}`).pipe(
      catchError(error => {
        console.error('Error deleting menu category:', error);
        throw error;
      })
    );
  }
}