import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WholesalerAnalytics {
  wholesaler: {
    id: string;
    name: string;
  };
  overview: {
    total_revenue: number;
    monthly_revenue: number;
    weekly_revenue: number;
    daily_revenue: number;
    total_orders: number;
    monthly_orders: number;
    weekly_orders: number;
    daily_orders: number;
    average_order_value: number;
    monthly_average_order_value: number;
    unique_customers: number;
  };
  distributions: {
    order_status: Record<string, number>;
    payment_status: Record<string, number>;
  };
  top_products: Array<{
    id: number;
    name: string;
    category: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
  }>;
  revenue_trends: Array<{
    date: string;
    daily_revenue: number;
    daily_orders: number;
  }>;
  top_customers: Array<{
    id: number;
    name: string;
    total_spent: number;
    order_count: number;
  }>;
}

export interface WholesalerProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact_info: {
    phone: string;
    email?: string;
    website?: string;
  };
  images?: {
    logo?: string;
    banner?: string;
    gallery: string[];
  };
  is_active: boolean;
  is_verified: boolean;
  registration_status: string;
  owner_name?: string;
  owner_email?: string;
}

@Injectable({ providedIn: 'root' })
export class WholesalerService {
  private http = inject(HttpClient);

  /**
   * Get analytics data for the authenticated wholesaler
   */
  getAnalytics(): Observable<WholesalerAnalytics> {
    return this.http.get<WholesalerAnalytics>(`${environment.apiUrl}/wholesalers/analytics`);
  }

  /**
   * Get wholesaler profile for the authenticated user
   */
  getProfile(): Observable<WholesalerProfile> {
    return this.http.get<WholesalerProfile>(`${environment.apiUrl}/wholesalers/profile`);
  }

  /**
   * Update wholesaler profile
   */
  updateProfile(profileData: Partial<WholesalerProfile>): Observable<{ message: string; wholesaler: WholesalerProfile }> {
    return this.http.put<{ message: string; wholesaler: WholesalerProfile }>(`${environment.apiUrl}/wholesalers/profile`, profileData);
  }

  /**
   * Upload profile images (logo, banner)
   */
  uploadProfileImages(formData: FormData): Observable<{ message: string; images: { logo?: string; banner?: string } }> {
    return this.http.post<{ message: string; images: { logo?: string; banner?: string } }>(
      `${environment.apiUrl}/wholesalers/profile/upload-images`,
      formData
    );
  }
}
