import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner.component';
import { LoadingService } from './core/services/loading.service';

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
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

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

  get isGlobalLoading$() {
    return this.loadingService.globalLoading$;
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
