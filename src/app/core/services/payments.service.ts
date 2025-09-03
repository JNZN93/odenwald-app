import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  createStripeCheckoutSession(orderId: string, successUrl?: string, cancelUrl?: string): Observable<{ id: string; url?: string }> {
    const body: any = { order_id: orderId };
    if (successUrl) body.success_url = successUrl;
    if (cancelUrl) body.cancel_url = cancelUrl;
    return this.http.post<{ id: string; url?: string }>(`${this.baseUrl}/stripe/checkout-session`, body);
  }
}


