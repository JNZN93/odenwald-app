import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-driver-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Fahrer Anmeldung</h1>
          <p class="login-subtitle">Willkommen zurück!</p>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="login-form">
          <div class="form-group">
            <label for="username">Benutzername</label>
            <input
              id="username"
              name="username"
              type="text"
              [(ngModel)]="username"
              required
              placeholder="ihr.benutzername"
              class="form-input"
              autocomplete="username"
            />
            <small class="help-text">Ihr Benutzername wurde Ihnen bei der Registrierung mitgeteilt</small>
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
              autocomplete="current-password"
            />
          </div>

          <button type="submit" [disabled]="loading || !username || !password" class="submit-btn">
            <span *ngIf="!loading">Anmelden</span>
            <span *ngIf="loading" class="loading-text">Anmelden...</span>
          </button>

          <p class="error-message" *ngIf="error">{{ error }}</p>
        </form>

        <div class="login-footer">
          <p class="help-text">
            <a [routerLink]="'/auth/login'" class="help-link">← Zurück zur normalen Anmeldung</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .login-container {
      display: flex;
      min-height: calc(100vh - 120px);
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      position: relative;
      z-index: 1;
      padding: var(--space-4) var(--space-2);
      height: calc(100vh - 120px);
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-xl);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    .help-text {
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
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
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
      background: #fafbff;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      font-size: var(--text-md);
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      position: relative;
      overflow: hidden;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.6;
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
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      text-align: center;
    }

    .login-footer {
      padding: var(--space-6);
      background: var(--bg-light);
      border-top: 1px solid var(--color-border);
      text-align: center;
    }

    .login-footer .help-text {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .help-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color var(--transition);
    }

    .help-link:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .login-container {
        padding: var(--space-2);
        height: calc(100vh - 100px);
      }

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
export class DriverLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  username = '';
  password = '';
  loading = false;
  error = '';

  onSubmit() {
    if (!this.username || !this.password || this.loading) return;

    this.loading = true;
    this.error = '';

    // Use the special driver login endpoint
    this.http.post<any>(`${environment.apiUrl}/auth/driver-login`, {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Check if password change is required
        if (response.require_password_change) {
          this.error = 'Passwortänderung erforderlich. Bitte kontaktieren Sie Ihren Manager.';
          return;
        }
        
        // Handle successful login
        this.auth.handleAuthSuccess(response);
        
        // Navigate to driver dashboard
        this.router.navigate(['/driver-dashboard']);
      },
      error: (err) => {
        this.loading = false;
        
        if (err.error?.error) {
          const errorMsg = err.error.error;
          
          if (errorMsg.includes('Invalid credentials')) {
            this.error = 'Benutzername oder Passwort ist falsch';
          } else if (errorMsg.includes('not active')) {
            this.error = 'Ihr Account wurde deaktiviert. Bitte kontaktieren Sie Ihren Manager.';
          } else {
            this.error = errorMsg;
          }
        } else {
          this.error = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
      }
    });
  }
}

