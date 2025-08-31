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
        // Don't trigger logout for logout requests to prevent infinite loops
        if (!req.url.includes('/auth/logout')) {
          console.log('JWT Interceptor: 401 error received for:', req.url);
          console.log('JWT Interceptor: Current user state:', authService.currentUserSubject?.value);
          
          // Check if this is a login-related request or if we have a valid user
          const currentUser = authService.currentUserSubject?.value;
          const isLoginRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');
          
          if (!isLoginRequest && (!currentUser || !currentUser.is_active)) {
            console.log('JWT Interceptor: clearing auth due to 401 and no valid user');
            authService.clearAuth();
            router.navigate(['/auth/login'], { replaceUrl: true });
          } else {
            console.log('JWT Interceptor: 401 error but not clearing auth (login request or valid user)');
          }
        }
      }
      return throwError(() => error);
    })
  );
};


