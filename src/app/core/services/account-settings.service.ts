import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
  is_email_verified?: boolean;
  auth_provider?: string;
  created_at: string;
  updated_at: string;
}


export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AccountDeletionRequest {
  password: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/customers`;

  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);

  // Observables for components to subscribe to
  userProfile$ = this.userProfileSubject.asObservable();

  constructor() {
    // Load initial data
    this.loadUserProfile();
  }

  // User Profile Methods
  loadUserProfile(): Observable<UserProfile> {
    return this.http.get<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
      role: string;
      is_active: boolean;
      is_email_verified?: boolean;
      auth_provider?: string;
      created_at: string;
      updated_at: string;
    }>(`${this.apiUrl}/profile`).pipe(
      tap(profile => {
        this.userProfileSubject.next(profile);
      })
    );
  }

  updateUserProfile(profileData: Partial<UserProfile>): Observable<{ message: string; user: UserProfile }> {
    return this.http.put<{ message: string; user: UserProfile }>(`${this.apiUrl}/profile`, profileData).pipe(
      tap(response => {
        this.userProfileSubject.next(response.user);
      })
    );
  }

  changePassword(passwordData: PasswordChangeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, passwordData);
  }

  deleteAccount(deletionData: AccountDeletionRequest): Observable<{ message: string; deleted_at: string }> {
    return this.http.delete<{ message: string; deleted_at: string }>(`${this.apiUrl}/account`, {
      body: deletionData
    });
  }


  // Utility Methods
  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  // Clear data on logout
  clearData(): void {
    this.userProfileSubject.next(null);
  }
}
