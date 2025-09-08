import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReviewDTO {
  id: string;
  order_id: string;
  restaurant_id: string;
  driver_id?: string | null;
  restaurant_rating?: number | null;
  driver_rating?: number | null;
  food_quality_rating?: number | null;
  delivery_time_rating?: number | null;
  packaging_rating?: number | null;
  service_rating?: number | null;
  restaurant_comment?: string | null;
  driver_comment?: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/reviews`;

  getRestaurantReviews(restaurantId: string, params?: { limit?: number; offset?: number; min_stars?: number; with_comments_only?: boolean }): Observable<ReviewDTO[]> {
    const search = new URLSearchParams();
    if (params?.limit) search.append('limit', String(params.limit));
    if (params?.offset) search.append('offset', String(params.offset));
    if (params?.min_stars) search.append('min_stars', String(params.min_stars));
    if (params?.with_comments_only) search.append('with_comments_only', 'true');
    const url = `${this.baseUrl}/restaurants/${restaurantId}` + (search.toString() ? `?${search.toString()}` : '');
    return this.http.get<any[]>(url).pipe(map(r => r || []));
  }

  getAllRestaurantReviews(restaurantId: string): Observable<ReviewDTO[]> {
    return this.http.get<any[]>(`${this.baseUrl}/restaurants/${restaurantId}?limit=100`).pipe(map(r => r || []));
  }

  getRestaurantSummary(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants/${restaurantId}/summary`);
  }

  validateToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/token/${encodeURIComponent(token)}`);
  }

  submitReviewWithToken(token: string, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit-with-token`, { token, ...payload });
  }
}


