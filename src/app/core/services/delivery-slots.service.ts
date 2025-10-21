import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DeliverySlot {
  type: 'asap' | 'scheduled';
  label: string;
  value: string;
  available: boolean;
  estimated_time?: string;
}

export interface DeliverySlotsResponse {
  restaurant_id: string;
  restaurant_name: string;
  available_slots: DeliverySlot[];
}

@Injectable({
  providedIn: 'root'
})
export class DeliverySlotsService {
  private apiUrl = `${environment.apiUrl}/api/v1/orders`;

  constructor(private http: HttpClient) {}

  getDeliverySlots(restaurantId: string, date?: string): Observable<DeliverySlotsResponse> {
    const params: any = {};
    if (date) {
      params.date = date;
    }
    
    return this.http.get<DeliverySlotsResponse>(`${this.apiUrl}/delivery-slots/${restaurantId}`, { params });
  }

  formatDeliverySlotLabel(slot: DeliverySlot): string {
    if (slot.type === 'asap') {
      return slot.label;
    }
    
    // For scheduled slots, format the time nicely
    const date = new Date(slot.value);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (slotDate.getTime() === today.getTime()) {
      return `Heute um ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (slotDate.getTime() === tomorrow.getTime()) {
      return `Morgen um ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} um ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  isSlotAvailable(slot: DeliverySlot): boolean {
    if (!slot.available) return false;
    
    if (slot.type === 'scheduled') {
      const slotTime = new Date(slot.value);
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      
      return slotTime >= minTime;
    }
    
    return true; // ASAP slots are always available
  }
}

