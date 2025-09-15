import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from './core/auth/auth.service';
import { RestaurantManagerService } from './core/services/restaurant-manager.service';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner.component';
import { AIChatWidgetComponent } from './shared/components/ai-chat-widget.component';
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
    LoadingSpinnerComponent,
    AIChatWidgetComponent
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
    // OAuth callback handling is now done in LoginComponent only
    // This prevents conflicts and ensures consistent behavior
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

  // Mobile Navigation
  isMobileNavOpen: boolean = false;

  toggleRoleDisplay() {
    this.showRole = !this.showRole;
  }

  toggleMobileNav() {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  closeMobileNav() {
    this.isMobileNavOpen = false;
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
