import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const currentUser = authService.currentUserSubject.value;

  // Skip adding Authorization header for public menu endpoints
  const isPublicMenuEndpoint = req.url.includes('/menu-categories/public');

  console.log('🚀 JWT Interceptor: Request to', req.url, 'with token:', token ? 'Token exists' : 'No token');
  console.log('👤 JWT Interceptor: User role:', currentUser?.role, 'User tenant:', currentUser?.tenant_id);
  console.log('📋 JWT Interceptor: Full request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers.keys().map(key => ({ key, value: req.headers.get(key) }))
  });

  // Prepare headers object
  const headers: any = {};

  if (token && !isPublicMenuEndpoint) {
    headers.Authorization = `Bearer ${token}`;
    console.log('JWT Interceptor: Added Authorization header');
  } else if (isPublicMenuEndpoint) {
    console.log('JWT Interceptor: Skipping Authorization header for public menu endpoint');
  }

  // Add tenant ID for authenticated users on API requests
  const isApiRequest = req.url.includes('/api/v1');

  if (currentUser?.tenant_id && isApiRequest) {
    headers['x-tenant-id'] = String(currentUser.tenant_id);
    console.log('JWT Interceptor: Added x-tenant-id header:', String(currentUser.tenant_id));
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({
      setHeaders: headers
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('JWT Interceptor: 401 error received for:', req.url);
        console.log('JWT Interceptor: Current user state:', authService.currentUserSubject?.value);
        
        // Check if this is an auth-related request (login, register, logout)
        const isAuthRequest = req.url.includes('/auth/login') || 
                             req.url.includes('/auth/register') || 
                             req.url.includes('/auth/logout');
        
        // For all non-auth requests with 401, clear auth and redirect to login
        // This handles expired tokens, invalid tokens, and missing auth
        if (!isAuthRequest) {
          console.log('JWT Interceptor: Token invalid/expired - clearing auth and redirecting to login');
          authService.clearAuth();
          router.navigate(['/auth/login'], { replaceUrl: true });
        } else {
          console.log('JWT Interceptor: 401 on auth endpoint - user will see error message');
        }
      }
      return throwError(() => error);
    })
  );
};


