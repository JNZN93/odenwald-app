import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RestaurantTable {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  location: 'indoor' | 'outdoor' | 'bar' | 'vip';
  is_active: boolean;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTableData {
  table_number: string;
  capacity?: number;
  location?: 'indoor' | 'outdoor' | 'bar' | 'vip';
}

export interface UpdateTableData {
  table_number?: string;
  capacity?: number;
  location?: 'indoor' | 'outdoor' | 'bar' | 'vip';
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RestaurantTablesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/restaurant-tables`;

  getTables(restaurantId: number): Observable<RestaurantTable[]> {
    return this.http.get<{ count: number; tables: RestaurantTable[] }>(
      `${this.baseUrl}/restaurant/${restaurantId}/tables`
    ).pipe(map(res => res.tables));
  }

  createTable(restaurantId: number, tableData: CreateTableData): Observable<RestaurantTable> {
    return this.http.post<{ message: string; table: RestaurantTable }>(
      `${this.baseUrl}/restaurant/${restaurantId}/tables`,
      tableData
    ).pipe(map(res => res.table));
  }

  updateTable(tableId: number, updateData: UpdateTableData): Observable<RestaurantTable> {
    return this.http.patch<{ message: string; table: RestaurantTable }>(
      `${this.baseUrl}/tables/${tableId}`,
      updateData
    ).pipe(map(res => res.table));
  }

  toggleActive(tableId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/tables/${tableId}/toggle-active`, {});
  }

  generateQRCode(tableId: number): Observable<{ qr_code: string }> {
    return this.http.post<{ qr_code: string }>(
      `${this.baseUrl}/tables/${tableId}/generate-qr`,
      {}
    );
  }

  // Public QR code access - no authentication required
  getQRCodeInfo(restaurantId: number, tableNumber: string): Observable<{
    success: boolean;
    table: {
      id: number;
      table_number: string;
      capacity: number;
      location: string;
    };
    restaurant: {
      id: number;
      name: string;
      description: string;
      is_active: boolean;
    };
  }> {
    return this.http.get<{
      success: boolean;
      table: {
        id: number;
        table_number: string;
        capacity: number;
        location: string;
      };
      restaurant: {
        id: number;
        name: string;
        description: string;
        is_active: boolean;
      };
    }>(`${this.baseUrl}/qr/${restaurantId}/${encodeURIComponent(tableNumber)}`);
  }
}
