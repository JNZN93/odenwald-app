import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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

  /** Get user's current location using browser geolocation API */
  getCurrentLocation(): Observable<GeocodeResult> {
    return from(new Promise<GeocodeResult>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({
            latitude,
            longitude,
            formattedAddress: 'Mein aktueller Standort'
          });
        },
        (error) => {
          let errorMessage = 'Standort konnte nicht ermittelt werden';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standortberechtigung wurde verweigert';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standort ist nicht verfügbar';
              break;
            case error.TIMEOUT:
              errorMessage = 'Standortermittlung hat zu lange gedauert';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 Minuten Cache
        }
      );
    }));
  }

  /** Reverse geocode coordinates to address using Nominatim */
  reverseGeocode(latitude: number, longitude: number): Observable<GeocodeResult> {
    const url = `${environment.apiUrl}/geocoding/reverse`;
    return this.http
      .get<GeocodeResult>(url, {
        params: {
          lat: latitude.toString(),
          lon: longitude.toString()
        }
      })
      .pipe(
        map(result => {
          if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
            throw new Error('Adresse konnte nicht ermittelt werden');
          }
          return result;
        })
      );
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
