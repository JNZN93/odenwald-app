import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RestaurantOwnerRegistrationData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  restaurant_info: {
    name: string;
    description: string;
    cuisine_type: string;
    address: {
      street: string;
      city: string;
      postal_code: string;
      country: string;
    };
    contact_info: {
      phone: string;
      email?: string;
    };
  };
  notes?: string;
}

@Component({
  selector: 'app-restaurant-owner-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <div class="registration-header">
          <div class="logo-section">
            <h1>Restaurant-Partner werden</h1>
            <p class="subtitle">Registrieren Sie Ihr Restaurant auf unserer Plattform</p>
          </div>
          <div class="benefits-preview">
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span class="benefit-text">Schnelle Registrierung</span>
            </div>
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
              </div>
              <span class="benefit-text">Mehr Kunden erreichen</span>
            </div>
            <div class="benefit">
              <div class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                  <path d="M12 18V6"/>
                </svg>
              </div>
              <span class="benefit-text">Neue Einnahmequelle</span>
            </div>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="registration-form">
          <!-- Owner & Restaurant Information Combined -->
          <div class="form-step active">
            <div class="step-header">
              <h3>Restaurant-Registrierung</h3>
              <p>Bitte geben Sie Ihre Kontaktdaten und Restaurant-Informationen ein</p>
            </div>

            <!-- Owner Information -->
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Ihre Kontaktdaten</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="ownerName">Vollständiger Name *</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  [(ngModel)]="registrationData.name"
                  required
                  placeholder="Max Mustermann"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="ownerEmail">E-Mail-Adresse *</label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  [(ngModel)]="registrationData.email"
                  required
                  email
                  placeholder="ihre.email@restaurant.de"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="ownerPhone">Telefonnummer *</label>
                <input
                  id="ownerPhone"
                  name="ownerPhone"
                  type="tel"
                  [(ngModel)]="registrationData.phone"
                  required
                  placeholder="+49123456789"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="ownerAddress">Adresse (optional)</label>
                <input
                  id="ownerAddress"
                  name="ownerAddress"
                  type="text"
                  [(ngModel)]="registrationData.address"
                  placeholder="Musterstraße 123, 12345 Musterstadt"
                  class="form-input"
                />
              </div>
            </div>

            <!-- Restaurant Information -->
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Restaurant-Informationen</span>
            </div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label for="restaurantName">Restaurant-Name *</label>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.name"
                  required
                  placeholder="Mein Restaurant"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="cuisineType">Küchentyp *</label>
                <select
                  id="cuisineType"
                  name="cuisineType"
                  [(ngModel)]="registrationData.restaurant_info.cuisine_type"
                  required
                  class="form-input"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="italienisch">Italienisch</option>
                  <option value="deutsch">Deutsch</option>
                  <option value="asiatisch">Asiatisch</option>
                  <option value="türkisch">Türkisch</option>
                  <option value="amerikanisch">Amerikanisch</option>
                  <option value="indisch">Indisch</option>
                  <option value="vegetarisch">Vegetarisch/Vegan</option>
                  <option value="andere">Andere</option>
                </select>
              </div>

              <div class="form-group">
                <label for="restaurantPhone">Restaurant-Telefon *</label>
                <input
                  id="restaurantPhone"
                  name="restaurantPhone"
                  type="tel"
                  [(ngModel)]="registrationData.restaurant_info.contact_info.phone"
                  required
                  placeholder="+49123456789"
                  class="form-input"
                />
              </div>

              <div class="form-group full-width">
                <label for="description">Beschreibung *</label>
                <textarea
                  id="description"
                  name="description"
                  [(ngModel)]="registrationData.restaurant_info.description"
                  required
                  placeholder="Beschreiben Sie Ihr Restaurant, Ihre Spezialitäten und was Sie besonders macht..."
                  rows="3"
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <!-- Restaurant Address -->
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Restaurant-Adresse</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="street">Straße & Hausnummer *</label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.address.street"
                  required
                  placeholder="Hauptstraße 123"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="postalCode">PLZ *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.address.postal_code"
                  required
                  placeholder="12345"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="city">Stadt *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.address.city"
                  required
                  placeholder="Berlin"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="country">Land *</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.address.country"
                  required
                  placeholder="Deutschland"
                  class="form-input"
                />
              </div>

              <div class="form-group full-width">
                <label for="restaurantEmail">Restaurant-E-Mail (optional)</label>
                <input
                  id="restaurantEmail"
                  name="restaurantEmail"
                  type="email"
                  [(ngModel)]="registrationData.restaurant_info.contact_info.email"
                  placeholder="info@restaurant.de"
                  class="form-input"
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label for="notes">Zusätzliche Informationen (optional)</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="registrationData.notes"
                placeholder="Haben Sie noch Fragen oder möchten uns etwas mitteilen?"
                rows="3"
                class="form-input"
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="form-navigation">
            <button
              type="submit"
              [disabled]="loading || !isFormValid()"
              class="btn-primary submit-btn"
            >
              <span *ngIf="!loading">Registrierung absenden</span>
              <span *ngIf="loading" class="loading-text">Registrierung wird verarbeitet...</span>
            </button>
          </div>

          <!-- Error/Success Messages -->
          <p class="error-message" *ngIf="error">{{ error }}</p>
          <p class="success-message" *ngIf="success">{{ success }}</p>
        </form>

        <!-- Info Box -->
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
    .registration-container {
      min-height: 100vh;
      background: var(--bg-light-green);
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

    .registration-header {
      background: var(--gradient-primary);
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
      color: var(--color-primary-600);
      flex-shrink: 0;
    }

    .benefit-icon svg {
      width: 100%;
      height: 100%;
    }

    .registration-form {
      padding: var(--space-8);
    }

    .form-step {
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .form-step.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .step-header {
      margin-bottom: var(--space-6);
      text-align: center;
    }

    .step-header h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      font-weight: 600;
    }

    .step-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-8) 0 var(--space-4) 0;
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-border);
      color: var(--color-primary-600);
      font-weight: 600;
      font-size: var(--text-lg);
    }

    .section-icon {
      width: 24px;
      height: 24px;
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
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
      background: var(--bg-light-green);
    }

    .form-input::placeholder {
      color: var(--color-muted);
      opacity: 0.7;
    }

    textarea.form-input {
      resize: vertical;
      font-family: inherit;
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
      background: var(--gradient-primary);
      color: white;
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-600) 25%, transparent);
      min-width: 250px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in oklab, var(--color-primary-600) 35%, transparent);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .submit-btn {
      min-width: 300px;
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

    .success-message {
      color: var(--color-success);
      margin: var(--space-4) 0 0 0;
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-success) 8%, white);
      border: 1px solid color-mix(in oklab, var(--color-success) 20%, white);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      text-align: center;
    }

    .info-box {
      margin: 0 var(--space-8) var(--space-8) var(--space-8);
      padding: var(--space-6);
      background: var(--bg-light-green);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-lg);
    }

    .info-box h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-primary-700);
      font-size: var(--text-md);
      font-weight: 600;
    }

    .info-box ul {
      margin: 0;
      padding-left: var(--space-4);
    }

    .info-box li {
      color: var(--color-primary-600);
      font-size: var(--text-sm);
      margin-bottom: var(--space-2);
      line-height: 1.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .registration-header {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .benefits-preview {
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .registration-form {
        padding: var(--space-4);
      }

      .info-box {
        margin: 0 var(--space-4) var(--space-4) var(--space-4);
        padding: var(--space-4);
      }
    }
  `]
})
export class RestaurantOwnerRegistrationComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  registrationData: RestaurantOwnerRegistrationData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    restaurant_info: {
      name: '',
      description: '',
      cuisine_type: '',
      address: {
        street: '',
        city: '',
        postal_code: '',
        country: 'Deutschland'
      },
      contact_info: {
        phone: '',
        email: ''
      }
    },
    notes: ''
  };

  loading = false;
  error = '';
  success = '';

  isFormValid(): boolean {
    return !!(
      this.registrationData.name &&
      this.registrationData.email &&
      this.registrationData.phone &&
      this.registrationData.restaurant_info.name &&
      this.registrationData.restaurant_info.description &&
      this.registrationData.restaurant_info.cuisine_type &&
      this.registrationData.restaurant_info.address.street &&
      this.registrationData.restaurant_info.address.city &&
      this.registrationData.restaurant_info.address.postal_code &&
      this.registrationData.restaurant_info.contact_info.phone
    );
  }

  onSubmit() {
    if (!this.isFormValid() || this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    // Prepare data in the format backend expects
    const payload = {
      owner_info: {
        name: this.registrationData.name,
        email: this.registrationData.email,
        phone: this.registrationData.phone,
        address: this.registrationData.address
      },
      restaurant_info: this.registrationData.restaurant_info,
      notes: this.registrationData.notes
    };

    this.http.post(`${environment.apiUrl}/restaurant-registration`, payload)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.success = 'Registrierung erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit dem Status.';

          // Reset form after successful submission
          setTimeout(() => {
            this.registrationData = {
              name: '',
              email: '',
              phone: '',
              address: '',
              restaurant_info: {
                name: '',
                description: '',
                cuisine_type: '',
                address: {
                  street: '',
                  city: '',
                  postal_code: '',
                  country: 'Deutschland'
                },
                contact_info: {
                  phone: '',
                  email: ''
                }
              },
              notes: ''
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
          console.error('Registration error:', err);
          this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
      });
  }
}
