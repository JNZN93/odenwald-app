import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  constructor(private http: HttpClient) {}

  /**
   * Geocode a free-form address string to geographic coordinates
   * using OpenStreetMap Nominatim (free, no API key required)
   */
  geocodeAddress(address: string): Observable<GeocodeResult> {
    const url = `${environment.apiUrl}/geocoding/search`;
    return this.http
      .get<GeocodeResult>(url, { params: { q: address } })
      .pipe(
        map(result => {
          if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
            throw new Error('Adresse konnte nicht gefunden werden');
          }
          return result;
        })
      );
  }

  /** Calculate distance between two coordinates using Haversine formula */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** Format full address string from components */
  formatFullAddress(parts: {
    street?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  }): string {
    const segments = [parts.street, [parts.postal_code, parts.city].filter(Boolean).join(' '), parts.country]
      .filter(Boolean);
    return segments.join(', ');
  }
}
