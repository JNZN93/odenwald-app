import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <h2>Verbindung zu Google...</h2>
        <p>Bitte warten Sie, während wir Sie anmelden.</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      background: var(--gradient-light-green);
    }

    .callback-card {
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      padding: var(--space-8);
      text-align: center;
      max-width: 400px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-bottom: var(--space-4);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top: 4px solid var(--color-primary-500);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h2 {
      color: var(--color-heading);
      margin: var(--space-4) 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      font-weight: 600;
    }

    p {
      color: var(--color-muted);
      margin: 0;
      font-size: var(--text-base);
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.handleGoogleCallback();
  }

  private handleGoogleCallback() {
    try {
      // Try to get auth data from sessionStorage (set by backend redirect)
      const authDataString = sessionStorage.getItem('google_auth_data');

      if (authDataString) {
        const authData = JSON.parse(authDataString);

        // Clear the stored data
        sessionStorage.removeItem('google_auth_data');

        // Process the authentication
        this.auth.handleAuthSuccess(authData);

        // Navigate to appropriate route based on user role
        this.navigateAfterLogin(authData.user);

      } else {
        // No auth data found, redirect to login
        console.error('No Google auth data found in sessionStorage');
        this.router.navigate(['/auth/login']);
      }

    } catch (error) {
      console.error('Error processing Google callback:', error);
      this.router.navigate(['/auth/login']);
    }
  }

  private navigateAfterLogin(user: any): void {
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
}
