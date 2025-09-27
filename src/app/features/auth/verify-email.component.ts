import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <div class="registration-header">
          <h1>E-Mail-Verifizierung</h1>
          <p class="registration-subtitle">Wir bestätigen deine E-Mail-Adresse</p>
        </div>

        <div class="registration-form" *ngIf="!success">
          <p *ngIf="loading">Bitte warten...</p>
          <p class="error-message" *ngIf="error">{{ error }}</p>
        </div>

        <div class="registration-form" *ngIf="success">
          <p class="success-message">Deine E-Mail wurde erfolgreich bestätigt.</p>
          <a [routerLink]="'/customer'" class="help-link">Weiter</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registration-container { display: flex; min-height: calc(100vh - 120px); align-items: center; justify-content: center; background: var(--gradient-light-green); }
    .registration-card { width: 100%; max-width: 440px; background: var(--color-surface); border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg); border: 1px solid var(--color-border); overflow: hidden; }
    .registration-header { background: var(--gradient-primary); color: white; padding: var(--space-8) var(--space-6); text-align: center; }
    .registration-form { padding: var(--space-8) var(--space-6); }
    .error-message { color: var(--color-danger); margin: var(--space-4) 0 0 0; padding: var(--space-3); background: color-mix(in oklab, var(--color-danger) 8%, white); border: 1px solid color-mix(in oklab, var(--color-danger) 20%, white); border-radius: var(--radius-md); font-size: var(--text-sm); text-align: center; }
    .success-message { color: var(--color-success); margin: var(--space-4) 0 0 0; padding: var(--space-3); background: color-mix(in oklab, var(--color-success) 8%, white); border: 1px solid color-mix(in oklab, var(--color-success) 20%, white); border-radius: var(--radius-md); font-size: var(--text-sm); text-align: center; }
    .help-link { color: var(--color-primary-600); text-decoration: none; font-weight: 500; }
  `]
})
export class VerifyEmailComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = true;
  error = '';
  success = false;

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.loading = false;
      this.error = 'Ungültiger Link';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Verifizierung fehlgeschlagen';
      }
    });
  }
}


