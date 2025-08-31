import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <div class="registration-header">
          <h1>Registrieren</h1>
          <p class="registration-subtitle">Erstelle dein Konto bei Odenwald App</p>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="registration-form">
          <div class="form-group">
            <label for="name">Vollständiger Name</label>
            <input
              id="name"
              name="name"
              type="text"
              [(ngModel)]="name"
              required
              placeholder="Max Mustermann"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="email">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="email"
              required
              email
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
              minlength="8"
              placeholder="Mindestens 8 Zeichen"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Passwort bestätigen</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              [(ngModel)]="confirmPassword"
              required
              placeholder="Passwort wiederholen"
              class="form-input"
            />
          </div>



          <button type="submit" [disabled]="loading || !isFormValid()" class="submit-btn">
            <span *ngIf="!loading">Registrieren</span>
            <span *ngIf="loading" class="loading-text">Registrierung läuft...</span>
          </button>

          <p class="error-message" *ngIf="error">{{ error }}</p>
        </form>

        <div class="registration-footer">
          <p class="help-text">Hast du bereits ein Konto? <a [routerLink]="'/auth/login'" class="help-link">Jetzt anmelden</a></p>
          <p class="help-text">Sind Sie Restaurant-Besitzer? <a [routerLink]="'/auth/register-restaurant'" class="help-link">Partner werden</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Prevent scrolling only for the registration component */
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .registration-container {
      display: flex;
      min-height: calc(100vh - 120px);
      align-items: center;
      justify-content: center;
      background: var(--gradient-light-green);
      overflow: hidden;
      position: relative;
      z-index: 1;
      height: calc(100vh - 120px);
    }

    .registration-card {
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

    .registration-header {
      background: var(--gradient-primary);
      color: white;
      padding: var(--space-8) var(--space-6);
      text-align: center;
      position: relative;
    }

    .registration-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    }

    .registration-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-creative);
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }

    .registration-subtitle {
      margin: 0;
      font-size: var(--text-md);
      opacity: 0.9;
      color: white;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }

    .registration-form {
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

    .registration-footer {
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
      .registration-card {
        margin: 10px;
        max-width: calc(100% - 20px);
      }

      .registration-header,
      .registration-form,
      .registration-footer {
        padding: var(--space-6) var(--space-4);
      }

      .registration-header h1 {
        font-size: var(--text-2xl);
      }
    }
  `]
})
export class RegistrationComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error = '';

  isFormValid(): boolean {
    return !!(
      this.name.trim() &&
      this.email.trim() &&
      this.password.length >= 8 &&
      this.confirmPassword.length >= 8 &&
      this.password === this.confirmPassword
    );
  }

  onSubmit() {
    if (!this.isFormValid() || this.loading) return;

    // Check if passwords match
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwörter stimmen nicht überein';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Registration attempt with:', {
      email: this.email,
      name: this.name,
      role: 'customer'
    });

    this.auth.register({
      email: this.email,
      password: this.password,
      name: this.name,
      role: 'customer'
    }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registration successful:', response);

        // Wait for the auth state to be fully updated
        setTimeout(() => {
          // Verify that the token is actually stored
          const storedToken = localStorage.getItem('auth_token');
          const storedUser = localStorage.getItem('current_user');

          console.log('Registration verification:', {
            storedToken: storedToken ? 'Token exists' : 'No token',
            storedUser: storedUser ? 'User exists' : 'No user',
            currentUser: this.auth.currentUserSubject.value
          });

          if (!storedToken || !storedUser) {
            console.error('Registration failed: Token or user not stored properly');
            this.error = 'Registrierung fehlgeschlagen: Token konnte nicht gespeichert werden';
            return;
          }

          // Navigate based on user role after successful registration
          const currentUser = this.auth.currentUserSubject.value;
          console.log('Navigating based on user role after registration:', currentUser?.role);
          
          if (currentUser?.role === 'manager') {
            this.router.navigateByUrl('/restaurant-manager', { replaceUrl: true });
          } else if (currentUser?.role === 'app_admin' || currentUser?.role === 'admin') {
            this.router.navigateByUrl('/admin', { replaceUrl: true });
          } else if (currentUser?.role === 'driver') {
            this.router.navigateByUrl('/driver-dashboard', { replaceUrl: true });
          } else {
            // Default to customer route for regular customers
            this.router.navigateByUrl('/customer', { replaceUrl: true });
          }
        }, 500);
      },
      error: (err) => {
        this.loading = false;
        console.error('Registration error:', err);
        this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen';
      }
    });
  }
}
