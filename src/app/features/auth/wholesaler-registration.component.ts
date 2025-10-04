import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wholesaler-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <div class="registration-header">
          <div class="logo-section">
            <h1>Großhändler werden</h1>
            <p class="subtitle">Registrieren Sie Ihren Großhandel für Restaurant-Manager</p>
          </div>
          <div class="benefits-preview">
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <rect x="7" y="7" width="10" height="4"/>
                  <rect x="7" y="13" width="10" height="4"/>
                  <line x1="7" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <span class="benefit-text">Neue Kunden erreichen</span>
            </div>
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span class="benefit-text">Premium-Partner Status</span>
            </div>
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                  <path d="M12 18V6"/>
                </svg>
              </div>
              <span class="benefit-text">Höhere Margen</span>
            </div>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="registration-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Vollständiger Name *</label>
              <input id="name" name="name" type="text" [(ngModel)]="owner.name" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="email">E-Mail *</label>
              <input id="email" name="email" type="email" [(ngModel)]="owner.email" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="phone">Telefon *</label>
              <input id="phone" name="phone" type="tel" [(ngModel)]="owner.phone" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="address">Adresse (optional)</label>
              <input id="address" name="address" type="text" [(ngModel)]="owner.address" class="form-input" placeholder="Straße, PLZ Stadt" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="wname">Großhändler-Name *</label>
              <input id="wname" name="wname" type="text" [(ngModel)]="wholesaler.name" required class="form-input" />
            </div>
            <div class="form-group full-width">
              <label for="wdesc">Beschreibung</label>
              <textarea id="wdesc" name="wdesc" rows="3" [(ngModel)]="wholesaler.description" class="form-input"></textarea>
            </div>
            <div class="form-group">
              <label for="street">Straße *</label>
              <input id="street" name="street" type="text" [(ngModel)]="wholesaler.address.street" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="city">Stadt *</label>
              <input id="city" name="city" type="text" [(ngModel)]="wholesaler.address.city" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="postal">PLZ *</label>
              <input id="postal" name="postal" type="text" [(ngModel)]="wholesaler.address.postal_code" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="country">Land *</label>
              <input id="country" name="country" type="text" [(ngModel)]="wholesaler.address.country" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="wphone">Kontakt Telefon *</label>
              <input id="wphone" name="wphone" type="tel" [(ngModel)]="wholesaler.contact_info.phone" required class="form-input" />
            </div>
            <div class="form-group">
              <label for="wemail">Kontakt E-Mail</label>
              <input id="wemail" name="wemail" type="email" [(ngModel)]="wholesaler.contact_info.email" class="form-input" />
            </div>
          </div>

          <div class="form-navigation">
            <button type="submit" class="btn-primary" [disabled]="loading || !isValid()">
              <span *ngIf="!loading">Registrierung absenden</span>
              <span *ngIf="loading" class="loading-text">Registrierung wird verarbeitet...</span>
            </button>
          </div>

          <p class="error-message" *ngIf="error">{{ error }}</p>
          <p class="success-message" *ngIf="success">{{ success }}</p>
        </form>

        <!-- Info Section -->
        <div class="info-box">
          <h4>Was passiert nach der Registrierung?</h4>
          <ul>
            <li>Ihre Bewerbung wird von unserem Administrationsteam geprüft</li>
            <li>Sie erhalten eine E-Mail mit dem Status Ihrer Bewerbung</li>
            <li>Nach Genehmigung erhalten Sie einen Link zum Onboarding</li>
            <li>Im Onboarding vervollständigen Sie Ihr Profil und laden Dokumente hoch</li>
            <li>Die Bearbeitungszeit beträgt in der Regel 1-3 Werktage</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Wholesaler Registration - Orange Theme */
    .registration-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #fff8f0 0%, #fef3e7 100%);
      padding: var(--space-4) var(--space-2);
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .registration-card {
      width: 100%;
      max-width: 900px;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      margin: var(--space-4) 0;
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

    /* Orange Header Theme */
    .registration-header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
      color: white;
      padding: var(--space-8);
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .logo-section h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-creative);
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }

    .logo-section .subtitle {
      margin: 0;
      font-size: var(--text-lg);
      opacity: 0.9;
      color: white;
      position: relative;
      z-index: 1;
    }

    .benefits-preview {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      position: relative;
      z-index: 1;
    }

    .benefit {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-sm);
      opacity: 0.9;
    }

    .benefit-icon {
      width: 24px;
      height: 24px;
      color: #fed7aa;
      flex-shrink: 0;
    }

    .benefit-icon svg {
      width: 100%;
      height: 100%;
    }

    .registration-form {
      padding: var(--space-8);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: var(--text-sm);
      color: var(--color-heading);
      font-weight: 600;
    }

    .form-input {
      width: 100%;
      padding: var(--space-4);
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
      border-color: #ea580c;
      box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
      background: #fffaf7;
    }

    .form-input::placeholder {
      color: var(--color-muted);
      opacity: 0.7;
    }

    .form-input textarea {
      resize: vertical;
      font-family: inherit;
    }

    .info-box {
      margin: 0 var(--space-8) var(--space-8) var(--space-8);
      padding: var(--space-6);
      background: #fef7f0;
      border: 1px solid #fed7aa;
      border-radius: var(--radius-lg);
    }

    .info-box h4 {
      margin: 0 0 var(--space-3) 0;
      color: #ea580c;
      font-size: var(--text-md);
      font-weight: 600;
    }

    .info-box ul {
      margin: 0;
      padding-left: var(--space-4);
    }

    .info-box li {
      color: #9a3412;
      font-size: var(--text-sm);
      margin-bottom: var(--space-2);
      line-height: 1.5;
    }

    .form-navigation {
      display: flex;
      justify-content: center;
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn-primary {
      padding: var(--space-4) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
      min-width: 200px;
      position: relative;
      overflow: hidden;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
      background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .btn-primary:hover::before {
      left: 100%;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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
      grid-column: 1 / -1;
    }

    .success-message {
      color: var(--color-success);
      margin: var(--space-4) 0 0 0;
      padding: var(--space-3);
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      text-align: center;
      grid-column: 1 / -1;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .registration-header {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .benefits-preview {
        width: 100%;
      }

      .info-box {
        margin: 0 var(--space-4) var(--space-4) var(--space-4);
        padding: var(--space-4);
      }

      .registration-form {
        padding: var(--space-4);
      }
    }

    /* Loading Animation */
    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .btn-primary:hover::before {
      left: 100%;
    }

  `]
})
export class WholesalerRegistrationComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  owner = { name: '', email: '', phone: '', address: '' };
  wholesaler = {
    name: '',
    description: '',
    address: { street: '', city: '', postal_code: '', country: 'Deutschland' },
    contact_info: { phone: '', email: '' }
  };

  loading = false;
  error = '';
  success = '';

  isValid(): boolean {
    return !!(
      this.owner.name && 
      this.owner.email && 
      this.owner.phone && 
      this.wholesaler.name && 
      this.wholesaler.address.street && 
      this.wholesaler.address.city && 
      this.wholesaler.address.postal_code && 
      this.wholesaler.contact_info.phone
    );
  }

  onSubmit() {
    if (!this.isValid() || this.loading) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    // Prepare data in the format backend expects (without password!)
    const payload = {
      owner_info: {
        name: this.owner.name,
        email: this.owner.email,
        phone: this.owner.phone,
        address: this.owner.address
      },
      wholesaler_info: {
        name: this.wholesaler.name,
        description: this.wholesaler.description,
        address: this.wholesaler.address,
        contact_info: this.wholesaler.contact_info
      },
      notes: ''
    };

    this.http.post(`${environment.apiUrl}/wholesaler-registration`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Großhändler-Registrierung erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit dem Status.';
        
        // Reset form after successful submission
        setTimeout(() => {
          this.owner = { name: '', email: '', phone: '', address: '' };
          this.wholesaler = {
            name: '',
            description: '',
            address: { street: '', city: '', postal_code: '', country: 'Deutschland' },
            contact_info: { phone: '', email: '' }
          };
          this.success = '';
          
          // Redirect to login or home
          this.router.navigate(['/'], {
            queryParams: {
              message: 'Registrierung erfolgreich! Sie erhalten eine E-Mail nach der Prüfung.'
            }
          });
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen.';
      }
    });
  }
}


