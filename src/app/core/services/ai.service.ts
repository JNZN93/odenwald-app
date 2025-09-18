import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Erweiterte Interfaces für alle Intent-Typen
export interface BudgetMenuItem {
  restaurant_id: string;
  restaurant_name: string;
  item_id: string;
  item_name: string;
  price_cents: number;
  price_eur: number;
  // Erweiterte Felder
  description?: string;
  category?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  preparation_time?: number;
  restaurant_rating?: number;
  cuisine_type?: string;
  delivery_fee?: number;
  minimum_order?: number;
  avg_review_rating?: number;
  review_count?: number;
}

export interface OrderResult {
  id: string;
  status: string;
  restaurant_name: string;
  total_price: number;
  created_at: Date;
  items_count: number;
  estimated_delivery?: Date;
}

export interface RestaurantResult {
  id: string;
  name: string;
  cuisine_type: string;
  city: string;
  rating: number;
  delivery_fee: number;
  minimum_order: number;
  is_open: boolean;
  // Erweiterte Felder
  description?: string;
  phone?: string;
  email?: string;
  avg_review_rating?: number;
  review_count?: number;
  avg_delivery_rating?: number;
  avg_food_rating?: number;
}

export interface MenuItemResult {
  id: string;
  name: string;
  description?: string;
  price_eur: number;
  category: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  preparation_time?: number;
}

export interface FAQResult {
  id: string;
  question: string;
  answer: string;
  category: string;
  last_updated: Date;
}

export interface ReviewResult {
  id: string;
  restaurant_name?: string;
  driver_name?: string;
  rating: number;
  comment?: string;
  created_at: Date;
  food_quality?: number;
  delivery_time?: number;
  service?: number;
}

export interface LoyaltyResult {
  restaurant_name: string;
  current_stamps: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  stamps_required?: number;
  discount_percent?: number;
  can_redeem: boolean;
}

export interface PaymentResult {
  id: string;
  amount: number;
  status: string;
  provider: string;
  created_at: Date;
  restaurant_name?: string;
}

export interface DriverResult {
  id: string;
  name: string;
  rating: number;
  total_deliveries: number;
  status: string;
  vehicle_type?: string;
}

export interface PayoutResult {
  id: string;
  amount: number;
  status: string;
  created_at: Date;
  period_start: Date;
  period_end: Date;
  description?: string;
}

export interface ChatResponse {
  intent: 'budget_menu_search' | 'order_status' | 'restaurant_info' | 'menu_details' | 'faq' | 'review_info' | 'loyalty_status' | 'payment_history' | 'driver_info' | 'payout_info' | 'smalltalk' | 'unknown';
  items?: BudgetMenuItem[];
  orders?: OrderResult[];
  restaurants?: RestaurantResult[];
  menuItems?: MenuItemResult[];
  faqs?: FAQResult[];
  reviews?: ReviewResult[];
  loyalty?: LoyaltyResult[];
  payments?: PaymentResult[];
  drivers?: DriverResult[];
  payouts?: PayoutResult[];
  text?: string;
  message?: string;
  appliedFilters?: any; // Neue Eigenschaft für angewandte Filter
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;

  chat(message: string, options?: {
    tenantId?: string;
    city?: string;
    cuisineType?: string;
    enableRag?: boolean;
  }): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      message,
      tenantId: options?.tenantId,
      city: options?.city,
      cuisineType: options?.cuisineType,
      enableRag: options?.enableRag
    });
  }
}
