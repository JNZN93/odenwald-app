import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Anmelden</h1>
          <p class="login-subtitle">Willkommen zurück bei Odenwald App</p>
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
      /* Ensure the container takes full available height without scrolling */
      height: calc(100vh - 120px);
    }
    
    .login-card { 
      width: 100%; 
      max-width: 440px; 
      background: var(--color-surface); 
      border-radius: var(--radius-2xl); 
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
      padding: var(--space-8) var(--space-6);
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

    .login-form {
      padding: var(--space-8) var(--space-6);
      background: var(--color-surface);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
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
      padding: var(--space-6);
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
      .login-card {
        margin: 10px;
        max-width: calc(100% - 20px);
      }
      
      .login-header,
      .login-form,
      .login-footer {
        padding: var(--space-6) var(--space-4);
      }
      
      .login-header h1 {
        font-size: var(--text-2xl);
      }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

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
}


