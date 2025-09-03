import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take, tap } from 'rxjs/operators';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.is_active) {
        // Redirect authenticated users based on their role
        if (user.role === 'app_admin' || user.role === 'admin') {
          router.navigate(['/admin']);
        } else if (user.role === 'manager') {
          router.navigate(['/restaurant-manager']);
        } else if (user.role === 'wholesaler') {
          router.navigate(['/wholesaler']);
        } else if (user.role === 'driver') {
          router.navigate(['/driver-dashboard']);
        } else {
          router.navigate(['/dashboard']);
        }
        return false;
      } else {
        // Allow unauthenticated users to access the public restaurant list
        return true;
      }
    })
  );
};

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // Avoid redirect loops for login page
      if (state.url.includes('/auth/login')) {
        return true;
      }
      
      if (user && user.is_active) {
        return true;
      } else {
        // Only redirect if not already on login page
        if (!state.url.includes('/auth/login')) {
          router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        }
        return false;
      }
    })
  );
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Avoid redirect loops for login page
        if (state.url.includes('/auth/login')) {
          return true;
        }
        
        if (user && user.is_active && allowedRoles.includes(user.role)) {
          return true;
        } else {
          // Only redirect if not already on login page
          if (!state.url.includes('/auth/login')) {
            router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
          }
          return false;
        }
      })
    );
  };
};
