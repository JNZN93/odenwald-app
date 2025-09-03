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
              <label for="password">Passwort *</label>
              <input id="password" name="password" type="password" [(ngModel)]="password" required minlength="8" class="form-input" />
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

          <div class="documents-section">
            <div class="document-item">
              <label>Gewerbeschein *</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'business_license')" />
            </div>
            <div class="document-item">
              <label>Inhaber-Ausweis *</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'owner_id')" />
            </div>
            <div class="document-item">
              <label>Fotos</label>
              <input type="file" multiple accept="image/*" (change)="onMultipleFileSelect($event, 'wholesaler_photos')" />
            </div>
          </div>

          <div class="form-navigation">
            <button type="submit" class="btn-primary" [disabled]="loading || !isValid()">
              <span *ngIf="!loading">Registrierung absenden</span>
              <span *ngIf="loading">Bitte warten...</span>
            </button>
          </div>

          <p class="error-message" *ngIf="error">{{ error }}</p>
          <p class="success-message" *ngIf="success">{{ success }}</p>
        </form>

        <!-- Info Section -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="10" height="4"/>
                <rect x="7" y="13" width="10" height="4"/>
                <line x1="7" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h3>Warum Großhändler werden?</h3>
            <ul>
              <li>Direkter Zugang zu Restaurant-Kunden</li>
              <li>Höhere Margen durch B2B-Vertrieb</li>
              <li>Professionelle Partner-Plattform</li>
              <li>Wachsender Markt für Gastronomie</li>
            </ul>
          </div>
          <div class="info-card">
            <div class="info-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 18V6"/>
              </svg>
            </div>
            <h3>Registrierungsprozess</h3>
            <ul>
              <li>Kostenlose Registrierung</li>
              <li>Dokumenten-Verifizierung</li>
              <li>Admin-Genehmigung innerhalb 24h</li>
              <li>Sofortiger Zugriff auf Plattform</li>
            </ul>
          </div>
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

    .documents-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .document-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      background: #fef7f0;
      border: 1px solid #fed7aa;
      border-radius: var(--radius-lg);
    }

    .document-item label {
      display: block;
      color: var(--color-heading);
      font-weight: 600;
      font-size: var(--text-sm);
      margin-bottom: var(--space-2);
    }

    .document-item input[type="file"] {
      flex: 1;
      padding: var(--space-3);
      border: 2px solid #fed7aa;
      border-radius: var(--radius-lg);
      background: white;
      font-size: var(--text-sm);
    }

    .document-item input[type="file"]:focus {
      border-color: #ea580c;
      outline: none;
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
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
      background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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

      .document-item {
        flex-direction: column;
        gap: var(--space-2);
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

    /* Info Section */
    .info-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
      margin-top: var(--space-8);
    }

    .info-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .info-icon {
      margin-bottom: var(--space-3);
      color: #ea580c;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-icon svg {
      width: 48px;
      height: 48px;
    }

    .info-card h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .info-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
    }

    .info-card li {
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .info-card li:last-child {
      border-bottom: none;
    }
  `]
})
export class WholesalerRegistrationComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  owner = { name: '', email: '', phone: '', address: '' };
  password = '';
  wholesaler = {
    name: '',
    description: '',
    address: { street: '', city: '', postal_code: '', country: 'Deutschland' },
    contact_info: { phone: '', email: '' }
  };

  businessLicenseFile: File | null = null;
  ownerIdFile: File | null = null;
  photoFiles: File[] = [];

  loading = false;
  error = '';
  success = '';

  isValid(): boolean {
    return !!(this.owner.name && this.owner.email && this.owner.phone && this.password && this.password.length >= 8 && this.wholesaler.name && this.wholesaler.address.street && this.wholesaler.address.city && this.wholesaler.address.postal_code && this.wholesaler.contact_info.phone && this.businessLicenseFile && this.ownerIdFile);
  }

  onFileSelect(event: any, field: string) {
    const file = event.target.files[0];
    if (!file) return;
    if (field === 'business_license') this.businessLicenseFile = file;
    if (field === 'owner_id') this.ownerIdFile = file;
  }

  onMultipleFileSelect(event: any, field: string) {
    const files = Array.from(event.target.files) as File[];
    if (field === 'wholesaler_photos') this.photoFiles = files;
  }

  onSubmit() {
    if (!this.isValid() || this.loading) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = new FormData();
    formData.append('name', this.owner.name);
    formData.append('email', this.owner.email);
    formData.append('password', this.password);
    formData.append('phone', this.owner.phone);
    formData.append('address', this.owner.address || '');

    formData.append('wholesaler_name', this.wholesaler.name);
    formData.append('wholesaler_description', this.wholesaler.description || '');
    formData.append('wholesaler_address_street', this.wholesaler.address.street);
    formData.append('wholesaler_address_city', this.wholesaler.address.city);
    formData.append('wholesaler_address_postal_code', this.wholesaler.address.postal_code);
    formData.append('wholesaler_address_country', this.wholesaler.address.country);
    formData.append('wholesaler_phone', this.wholesaler.contact_info.phone);
    formData.append('wholesaler_email', this.wholesaler.contact_info.email || '');

    if (this.businessLicenseFile) formData.append('business_license', this.businessLicenseFile);
    if (this.ownerIdFile) formData.append('owner_id', this.ownerIdFile);
    this.photoFiles.forEach(f => formData.append('wholesaler_photos', f));

    const headers = new HttpHeaders();
    headers.delete('Content-Type');

    this.http.post(`${environment.apiUrl}/auth/register-wholesaler`, formData, { headers }).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Großhändler-Registrierung erfolgreich eingereicht!';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen.';
      }
    });
  }
}


