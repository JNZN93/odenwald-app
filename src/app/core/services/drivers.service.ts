import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DriversService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/drivers`;

  optimizeTour(driverId: string, restaurantId: string) {
    return this.http.post<{ route: { orderIdsInSequence: string[] } }>(
      `${this.baseUrl}/${driverId}/optimize-tour`,
      { restaurant_id: restaurantId }
    );
  }

  saveTour(driverId: string, orderIds: string[]) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${driverId}/save-tour`,
      { order_ids: orderIds }
    );
  }
}


