import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FavoriteItem {
  id: string;
  user_id: string;
  restaurant_id: string;
  menu_item_id: string;
  order_count: number;
  last_ordered_at: string;
  created_at: string;
  updated_at: string;
  menu_item_name: string;
  menu_item_description?: string;
  menu_item_price_cents: number;
  menu_item_image_url?: string;
  restaurant_name: string;
}

export interface FavoritesResponse {
  count: number;
  favorites: FavoriteItem[];
}

export interface FavoriteStats {
  total_favorites: number;
  restaurant_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = `${environment.apiUrl}/api/v1/favorites`;
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get user's favorite items
  getFavorites(restaurantId?: string, limit?: number): Observable<FavoritesResponse> {
    const params: any = {};
    if (restaurantId) params.restaurant_id = restaurantId;
    if (limit) params.limit = limit;

    return this.http.get<FavoritesResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.favoritesSubject.next(response.favorites);
      })
    );
  }

  // Get user's top favorite items
  getTopFavorites(limit: number = 10): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(`${this.apiUrl}/top`, {
      params: { limit: limit.toString() }
    });
  }

  // Add item to favorites
  addToFavorites(menuItemId: string): Observable<{ message: string; favorite: FavoriteItem }> {
    return this.http.post<{ message: string; favorite: FavoriteItem }>(this.apiUrl, {
      menu_item_id: menuItemId
    }).pipe(
      tap(() => {
        // Refresh favorites after adding
        this.getFavorites().subscribe();
      })
    );
  }

  // Remove item from favorites
  removeFromFavorites(menuItemId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${menuItemId}`).pipe(
      tap(() => {
        // Refresh favorites after removing
        this.getFavorites().subscribe();
      })
    );
  }

  // Check if item is favorited
  isFavorite(menuItemId: string): Observable<{ is_favorite: boolean }> {
    return this.http.get<{ is_favorite: boolean }>(`${this.apiUrl}/check/${menuItemId}`);
  }

  // Get favorite statistics
  getFavoriteStats(restaurantId?: string): Observable<FavoriteStats> {
    const params: any = {};
    if (restaurantId) params.restaurant_id = restaurantId;

    return this.http.get<FavoriteStats>(`${this.apiUrl}/stats`, { params });
  }

  // Increment order count for a favorite item
  incrementOrderCount(menuItemId: string): Observable<{ message: string; favorite: FavoriteItem }> {
    return this.http.post<{ message: string; favorite: FavoriteItem }>(`${this.apiUrl}/increment-order`, {
      menu_item_id: menuItemId
    });
  }

  // Format price for display
  formatPrice(priceCents: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(priceCents / 100);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get current favorites from subject
  getCurrentFavorites(): FavoriteItem[] {
    return this.favoritesSubject.value;
  }

  // Clear favorites
  clearFavorites(): void {
    this.favoritesSubject.next([]);
  }
}

