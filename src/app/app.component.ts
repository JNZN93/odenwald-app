import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from './core/auth/auth.service';
import { RestaurantManagerService } from './core/services/restaurant-manager.service';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner.component';
import { LoadingService } from './core/services/loading.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    ToastContainerComponent,
    ConfirmationDialogComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private http = inject(HttpClient);

  constructor() {
    // Lade gespeichertes Restaurant aus localStorage
    const savedRestaurant = localStorage.getItem('selectedRestaurant');
    if (savedRestaurant) {
      try {
        const restaurant = JSON.parse(savedRestaurant);
        this.restaurantManagerService.setSelectedRestaurant(restaurant);
      } catch (error) {
        console.error('Error parsing saved restaurant:', error);
        localStorage.removeItem('selectedRestaurant');
      }
    }
  }

  ngOnInit() {
    // Check for Google OAuth callback
    this.checkForGoogleCallback();
  }

  private checkForGoogleCallback() {
    // Check if we have Google OAuth parameters in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const scope = urlParams.get('scope');

    console.log('Checking for Google OAuth callback...', { code: !!code, scope, url: window.location.href });

    if (code && scope && scope.includes('google')) {
      console.log('Google OAuth callback detected, processing...');

      // Clean up URL by removing OAuth parameters
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Process the Google OAuth callback by calling the backend directly
      this.http.get<any>(`${environment.apiUrl}/auth/google/callback?code=${code}`)
        .subscribe({
          next: (response) => {
            console.log('Google OAuth response:', response);
            if (response && response.user) {
              // Handle the auth success
              this.authService.handleAuthSuccess(response);
              console.log('Google OAuth successful, navigating...');
              this.navigateAfterGoogleLogin(response.user);
            }
          },
          error: (error) => {
            console.error('Google OAuth callback error:', error);
            this.router.navigate(['/auth/login']);
          }
        });
    }
  }

  private navigateAfterGoogleLogin(user: any): void {
    let targetRoute = '/customer'; // Default route

    if (user.role === 'app_admin' || user.role === 'admin') {
      targetRoute = '/admin';
    } else if (user.role === 'manager') {
      targetRoute = '/restaurant-manager';
    } else if (user.role === 'wholesaler') {
      targetRoute = '/wholesaler';
    } else if (user.role === 'driver') {
      targetRoute = '/driver-dashboard';
    }

    // Check for stored return URL
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl && !returnUrl.includes('/auth/login')) {
      localStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate([targetRoute]);
    }
  }

  get currentUser$() {
    return this.authService.currentUser$;
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  get hasAdminRole() {
    return this.authService.hasAnyRole(['app_admin', 'admin']);
  }

  get hasManagerRole() {
    return this.authService.hasRole('manager');
  }

  get hasAppAdminRole() {
    return this.authService.hasRole('app_admin');
  }

  get hasCustomerRole() {
    return this.authService.hasRole('customer');
  }

  get hasDriverRole() {
    return this.authService.hasRole('driver');
  }

  get hasWholesalerRole() {
    return this.authService.hasRole('wholesaler');
  }

  get isWholesalerRoute() {
    return this.router.url.startsWith('/wholesaler');
  }

  get isGlobalLoading$() {
    return this.loadingService.globalLoading$;
  }

  // Restaurant Manager specific properties
  showRole: boolean = false;

  toggleRoleDisplay() {
    this.showRole = !this.showRole;
  }

  getCurrentUserRole(): string {
    const user = this.authService.currentUserSubject.value;
    if (!user) return '';
    switch (user.role) {
      case 'app_admin': return 'App Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Restaurant Manager';
      case 'driver': return 'Fahrer';
      case 'customer': return 'Kunde';
      default: return 'Unbekannt';
    }
  }

  getSelectedRestaurantName(): string {
    return this.restaurantManagerService.getSelectedRestaurantName();
  }

  logout() {
    // Clear auth immediately to prevent infinite loops
    this.authService.clearAuth();
    // Optionally try to notify the backend, but don't wait for it
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: () => {
        // If logout request fails, we're already logged out locally
        console.log('Logout request failed, but user is logged out locally');
      }
    });

    // Always navigate to login page after logout
    console.log('Navigating to login page after logout');
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
