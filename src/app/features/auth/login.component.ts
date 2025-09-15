import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Anmelden</h1>
          <p class="login-subtitle">Willkommen zurück bei ODNWLD liefert</p>
        </div>
        
        <!-- Google Sign In Button -->
        <div class="google-signin-section">
          <button type="button" (click)="signInWithGoogle()" [disabled]="loading" class="google-signin-btn">
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Mit Google anmelden</span>
          </button>
        </div>

        <div class="divider">
          <span class="divider-text">oder</span>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="login-form">
          <div class="form-group">
            <label for="email">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="email"
              required
              placeholder="ihre.email@beispiel.de"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Passwort</label>
            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              required
              placeholder="Ihr Passwort"
              class="form-input"
            />
          </div>

          <button type="submit" [disabled]="loading" class="submit-btn">
            <span *ngIf="!loading">Anmelden</span>
            <span *ngIf="loading" class="loading-text">Anmelden...</span>
          </button>

          <p class="error-message" *ngIf="error">{{ error }}</p>
        </form>
        
        <div class="login-footer">
          <p class="help-text">Haben Sie noch kein Konto? <a href="/auth/register" class="help-link">Jetzt registrieren</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Prevent scrolling only for the login component */
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .login-container {
      display: flex;
      min-height: calc(100vh - 120px); /* Account for header height */
      align-items: center;
      justify-content: center;
      background: var(--gradient-light-green);
      overflow: hidden;
      position: relative;
      z-index: 1;
      padding: var(--space-4) var(--space-2);
      /* Ensure the container takes full available height without scrolling */
      height: calc(100vh - 120px);
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      overflow: hidden;
      animation: modalSlideIn 0.3s var(--ease);
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .login-header {
      background: var(--gradient-primary);
      color: white;
      padding: var(--space-6) var(--space-4);
      text-align: center;
      position: relative;
    }

    .login-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    }

    .login-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-creative);
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }

    .login-subtitle {
      margin: 0;
      font-size: var(--text-md);
      opacity: 0.9;
      color: white;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    .google-signin-section {
      padding: var(--space-4) var(--space-4) var(--space-3) var(--space-4);
      background: var(--color-surface);
    }

    .google-signin-btn {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text);
      font-weight: 500;
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .google-signin-btn:hover:not(:disabled) {
      border-color: var(--color-border-hover);
      background: var(--bg-light-green);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .google-signin-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .google-signin-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .google-icon {
      flex-shrink: 0;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: var(--space-4) 0;
      background: var(--color-surface);
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: var(--space-6);
      right: var(--space-6);
      height: 1px;
      background: var(--color-border);
    }

    .divider-text {
      background: var(--color-surface);
      padding: 0 var(--space-4);
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
      position: relative;
      z-index: 1;
    }

    .login-form {
      padding: var(--space-3) var(--space-4) var(--space-4) var(--space-4);
      background: var(--color-surface);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    label {
      font-size: var(--text-sm);
      color: var(--color-heading);
      font-weight: 600;
      margin-bottom: var(--space-1);
    }

    .form-input {
      width: 100%;
      padding: var(--space-4) var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-md);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
      background: var(--bg-light-green);
    }

    .form-input::placeholder {
      color: var(--color-muted);
      opacity: 0.7;
    }

    .submit-btn {
      width: 100%;
      padding: var(--space-4) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      background: var(--gradient-primary);
      color: white;
      font-weight: 600;
      font-size: var(--text-md);
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-600) 25%, transparent);
      position: relative;
      overflow: hidden;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in oklab, var(--color-primary-600) 35%, transparent);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .submit-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .submit-btn:hover::before {
      left: 100%;
    }

    .loading-text {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .loading-text::after {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      color: var(--color-danger);
      margin: var(--space-4) 0 0 0;
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-danger) 8%, white);
      border: 1px solid color-mix(in oklab, var(--color-danger) 20%, white);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      text-align: center;
    }

    .login-footer {
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-top: 1px solid var(--color-border);
      text-align: center;
    }

    .help-text {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .help-link {
      color: var(--color-primary-600);
      text-decoration: none;
      font-weight: 500;
      transition: color var(--transition);
    }

    .help-link:hover {
      color: var(--color-primary-700);
      text-decoration: underline;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .login-container {
        padding: var(--space-2);
        height: calc(100vh - 100px);
      }

      .login-card {
        margin: 5px;
        max-width: calc(100% - 10px);
      }

      .login-header {
        padding: var(--space-4) var(--space-3);
      }

      .google-signin-section {
        padding: var(--space-3) var(--space-3) var(--space-2) var(--space-3);
      }

      .login-form {
        padding: var(--space-2) var(--space-3) var(--space-3) var(--space-3);
      }

      .login-footer {
        padding: var(--space-3);
      }

      .login-header h1 {
        font-size: var(--text-xl);
      }

      .form-group {
        margin-bottom: var(--space-3);
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  email = '';
  password = '';
  loading = false;
  error = '';

  ngOnInit() {
    this.checkForGoogleCallback();
  }

  private checkForGoogleCallback() {
    // Check if we have Google OAuth parameters in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    console.log('LoginComponent: Checking for Google OAuth callback...', { success, token: !!token, user: !!userParam, error });

    // Handle error from OAuth callback
    if (error) {
      console.error('LoginComponent: Google OAuth error:', error);
      this.error = this.getErrorMessage(error);
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }

    // Handle successful OAuth callback
    if (success === 'true' && token && userParam) {
      console.log('LoginComponent: Google OAuth callback detected, processing...');
      this.loading = true;

      try {
        // Parse user data from URL parameter
        const user = JSON.parse(decodeURIComponent(userParam));

        // Create auth response object
        const authResponse = {
          message: 'Google authentication successful',
          user: user,
          token: token
        };

        console.log('LoginComponent: Google OAuth response:', authResponse);

        // Handle the auth success
        this.auth.handleAuthSuccess(authResponse);

        // Clean up URL by removing OAuth parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        console.log('LoginComponent: Google OAuth successful, navigating...');

        // Small delay to ensure auth state is properly updated
        setTimeout(() => {
          this.navigateAfterGoogleLogin(user);
        }, 100);

      } catch (parseError) {
        console.error('LoginComponent: Error parsing OAuth response:', parseError);
        this.loading = false;
        this.error = 'Google-Anmeldung fehlgeschlagen: Ungültige Antwortdaten';
        // Clean up URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'google_auth_failed':
        return 'Google-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      case 'internal_server_error':
        return 'Serverfehler bei der Google-Anmeldung. Bitte versuchen Sie es später erneut.';
      default:
        return 'Google-Anmeldung fehlgeschlagen';
    }
  }

  private navigateAfterGoogleLogin(user: any): void {
    // Reset loading state
    this.loading = false;

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

  onSubmit() {
    if (!this.email || !this.password || this.loading) return;
    this.loading = true;
    this.error = '';

    console.log('Login attempt with:', { email: this.email });

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login successful:', response);

        // Wait for the auth state to be fully updated
        setTimeout(() => {
          // Verify that the token is actually stored
          const storedToken = localStorage.getItem('auth_token');
          const storedUser = localStorage.getItem('current_user');

          console.log('Login verification:', {
            storedToken: storedToken ? 'Token exists' : 'No token',
            storedUser: storedUser ? 'User exists' : 'No user',
            currentUser: this.auth.currentUserSubject.value
          });

          if (!storedToken || !storedUser) {
            console.error('Login failed: Token or user not stored properly');
            this.error = 'Login fehlgeschlagen: Token konnte nicht gespeichert werden';
            return;
          }

          // Check for return URL first
          const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');

          if (returnUrl && !returnUrl.includes('/auth/login')) {
            console.log('Navigating to return URL:', returnUrl);
            this.router.navigateByUrl(returnUrl);
          } else {
            // Determine where to navigate based on user role
            const user = response.user;
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

            console.log('Navigating to target route:', targetRoute, 'for user role:', user.role);
            // Use replace to avoid back button issues
            this.router.navigateByUrl(targetRoute, { replaceUrl: true });
          }
        }, 500); // Increased delay to ensure auth state is fully updated
      },
      error: (err) => {
        this.loading = false;
        console.error('Login error:', err);
        this.error = err?.error?.error || err?.error?.message || 'Anmeldung fehlgeschlagen';
      }
    });
  }

  signInWithGoogle() {
    if (this.loading) return;

    console.log('Starting Google Sign In...');
    this.loading = true;
    this.error = '';

    try {
      // Use the redirect-based Google Sign In for better compatibility
      this.auth.initiateGoogleSignIn();
      // Note: loading will be reset by the OAuth callback handler
    } catch (error) {
      this.loading = false;
      console.error('Google Sign In error:', error);
      this.error = 'Google-Anmeldung fehlgeschlagen';
    }
  }
}


