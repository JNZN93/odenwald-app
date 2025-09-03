import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'app_admin' | 'admin' | 'manager' | 'driver' | 'customer' | 'wholesaler';
  tenant_id: string; // 'public' für Kunden, spezifischer Tenant für Business-User
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'app_admin' | 'admin' | 'manager' | 'driver' | 'customer' | 'wholesaler';
  tenantId?: string; // Optional, nur für Business-User benötigt
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');
    
    console.log('AuthService: loading stored user:', { hasToken: !!token, hasUser: !!userStr });
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('AuthService: parsed stored user:', user);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('AuthService: error parsing stored user:', error);
        this.clearAuth();
      }
    } else {
      console.log('AuthService: no stored auth data found');
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.clearAuth())
      );
  }

  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${environment.apiUrl}/auth/profile`);
  }

  updateProfile(updateData: Partial<User>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${environment.apiUrl}/auth/profile`, updateData)
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response.user);
          localStorage.setItem('current_user', JSON.stringify(response.user));
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    return !!(token && user && user.is_active);
  }

  hasRole(role: User['role']): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    console.log('AuthService: handling auth success:', response);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    console.log('AuthService: currentUser updated:', this.currentUserSubject.value);
    console.log('AuthService: localStorage check:', {
      token: localStorage.getItem('auth_token'),
      user: localStorage.getItem('current_user')
    });
  }

  public clearAuth(): void {
    console.log('AuthService: clearing auth');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    console.log('AuthService: auth cleared');
  }
}


