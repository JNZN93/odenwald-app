import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    // This would be: return this.http.get<MenuItem[]>(`${environment.apiUrl}/restaurants/${restaurantId}/menu-items`);
    return new Observable(observer => {
      // Mock data for demonstration
      observer.next([
        {
          id: '1',
          restaurant_id: restaurantId,
          category_id: '1',
          name: 'Bruschetta',
          description: 'Geröstetes Brot mit Tomaten, Basilikum und Olivenöl',
          price: 6.50,
          image_url: 'https://example.com/bruschetta.jpg',
          is_available: true,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
          allergens: ['Gluten'],
          preparation_time_minutes: 10,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          restaurant_id: restaurantId,
          category_id: '1',
          name: 'Caprese Salat',
          description: 'Mozzarella, Tomaten, Basilikum mit Balsamico',
          price: 8.90,
          image_url: 'https://example.com/caprese.jpg',
          is_available: true,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
          allergens: ['Milch'],
          preparation_time_minutes: 8,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          restaurant_id: restaurantId,
          category_id: '2',
          name: 'Pasta Carbonara',
          description: 'Spaghetti mit Ei, Speck und Parmesan',
          price: 14.50,
          image_url: 'https://example.com/carbonara.jpg',
          is_available: true,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
          allergens: ['Gluten', 'Ei', 'Milch'],
          preparation_time_minutes: 20,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '4',
          restaurant_id: restaurantId,
          category_id: '2',
          name: 'Pizza Margherita',
          description: 'Klassische Pizza mit Tomatensauce und Mozzarella',
          price: 12.90,
          image_url: 'https://example.com/margherita.jpg',
          is_available: true,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
          allergens: ['Gluten', 'Milch'],
          preparation_time_minutes: 25,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      observer.complete();
    });
  }

  getCategoriesByRestaurant(restaurantId: string): Observable<MenuCategory[]> {
    // This would be: return this.http.get<MenuCategory[]>(`${environment.apiUrl}/restaurants/${restaurantId}/categories`);
    return new Observable(observer => {
      observer.next([
        {
          id: '1',
          restaurant_id: restaurantId,
          name: 'Vorspeisen',
          description: 'Leckere Vorspeisen und Salate',
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          restaurant_id: restaurantId,
          name: 'Hauptgerichte',
          description: 'Unsere Hauptspeisen',
          sort_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          restaurant_id: restaurantId,
          name: 'Desserts',
          description: 'Süße Versuchungen',
          sort_order: 3,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      observer.complete();
    });
  }

  getMenuItemById(id: string): Observable<MenuItem | null> {
    // This would be: return this.http.get<MenuItem>(`${environment.apiUrl}/menu-items/${id}`);
    return new Observable(observer => {
      // Mock implementation
      observer.next(null);
      observer.complete();
    });
  }
}



