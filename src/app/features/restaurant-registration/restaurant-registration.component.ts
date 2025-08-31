import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RestaurantRegistrationData {
  owner_info: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
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
  documents: {
    business_license?: string;
    tax_certificate?: string;
    owner_id?: string;
    restaurant_photos?: string[];
  };
  notes?: string;
}

@Component({
  selector: 'app-restaurant-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        <div class="registration-header">
          <h1>🍽️ Restaurant registrieren</h1>
          <p class="registration-subtitle">Bringen Sie Ihr Restaurant auf unsere Plattform</p>
        </div>

        <form (ngSubmit)="onSubmit()" #f="ngForm" class="registration-form">
          <!-- Restaurant-Besitzer Informationen -->
          <div class="section">
            <h3>🏢 Restaurant-Besitzer Informationen</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="ownerName">Vollständiger Name *</label>
                <input
                  id="ownerName"
                  type="text"
                  [(ngModel)]="registrationData.owner_info.name"
                  name="ownerName"
                  required
                  placeholder="Max Mustermann"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="ownerEmail">E-Mail *</label>
                <input
                  id="ownerEmail"
                  type="email"
                  [(ngModel)]="registrationData.owner_info.email"
                  name="ownerEmail"
                  required
                  email
                  placeholder="ihre.email@beispiel.de"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="ownerPhone">Telefonnummer *</label>
                <input
                  id="ownerPhone"
                  type="tel"
                  [(ngModel)]="registrationData.owner_info.phone"
                  name="ownerPhone"
                  required
                  placeholder="+49123456789"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="ownerAddress">Adresse (optional)</label>
                <input
                  id="ownerAddress"
                  type="text"
                  [(ngModel)]="registrationData.owner_info.address"
                  name="ownerAddress"
                  placeholder="Musterstraße 123, 12345 Musterstadt"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Restaurant-Informationen -->
          <div class="section">
            <h3>🏪 Restaurant-Informationen</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="restaurantName">Restaurant Name *</label>
                <input
                  id="restaurantName"
                  type="text"
                  [(ngModel)]="registrationData.restaurant_info.name"
                  name="restaurantName"
                  required
                  placeholder="Mein Restaurant"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="cuisineType">Küchentyp *</label>
                <select
                  id="cuisineType"
                  [(ngModel)]="registrationData.restaurant_info.cuisine_type"
                  name="cuisineType"
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
            </div>

            <div class="form-group">
              <label for="description">Beschreibung *</label>
              <textarea
                id="description"
                [(ngModel)]="registrationData.restaurant_info.description"
                name="description"
                required
                placeholder="Beschreiben Sie Ihr Restaurant..."
                rows="3"
                class="form-input"
              ></textarea>
            </div>

            <!-- Restaurant-Adresse -->
            <div class="subsection">
              <h4>📍 Restaurant-Adresse</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="street">Straße & Hausnummer *</label>
                  <input
                    id="street"
                    type="text"
                    [(ngModel)]="registrationData.restaurant_info.address.street"
                    name="street"
                    required
                    placeholder="Hauptstraße 123"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label for="postalCode">PLZ *</label>
                  <input
                    id="postalCode"
                    type="text"
                    [(ngModel)]="registrationData.restaurant_info.address.postal_code"
                    name="postalCode"
                    required
                    placeholder="12345"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">Stadt *</label>
                  <input
                    id="city"
                    type="text"
                    [(ngModel)]="registrationData.restaurant_info.address.city"
                    name="city"
                    required
                    placeholder="Berlin"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label for="country">Land *</label>
                  <input
                    id="country"
                    type="text"
                    [(ngModel)]="registrationData.restaurant_info.address.country"
                    name="country"
                    required
                    placeholder="Deutschland"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Kontaktinformationen -->
            <div class="subsection">
              <h4>📞 Kontaktinformationen</h4>

              <div class="form-row">
                <div class="form-group">
                  <label for="restaurantPhone">Restaurant-Telefon *</label>
                  <input
                    id="restaurantPhone"
                    type="tel"
                    [(ngModel)]="registrationData.restaurant_info.contact_info.phone"
                    name="restaurantPhone"
                    required
                    placeholder="+49123456789"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label for="restaurantEmail">Restaurant-E-Mail (optional)</label>
                  <input
                    id="restaurantEmail"
                    type="email"
                    [(ngModel)]="registrationData.restaurant_info.contact_info.email"
                    name="restaurantEmail"
                    placeholder="info@restaurant.de"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Dokumente -->
          <div class="section">
            <h3>📄 Dokumente</h3>
            <p class="section-description">
              Diese Dokumente werden zur Verifizierung benötigt. Sie können später hochgeladen werden.
            </p>

            <div class="document-list">
              <div class="document-item">
                <div class="document-info">
                  <strong>Gewerbeschein</strong>
                  <small>Nachweis der Gewerbeanmeldung</small>
                </div>
                <input
                  type="text"
                  [(ngModel)]="registrationData.documents.business_license"
                  name="businessLicense"
                  placeholder="URL zum Dokument oder Dateiname"
                  class="form-input document-input"
                />
              </div>

              <div class="document-item">
                <div class="document-info">
                  <strong>Steuernummer</strong>
                  <small>Steuerliche Registrierung</small>
                </div>
                <input
                  type="text"
                  [(ngModel)]="registrationData.documents.tax_certificate"
                  name="taxCertificate"
                  placeholder="URL zum Dokument oder Dateiname"
                  class="form-input document-input"
                />
              </div>

              <div class="document-item">
                <div class="document-info">
                  <strong>Ausweis</strong>
                  <small>Personalausweis des Inhabers</small>
                </div>
                <input
                  type="text"
                  [(ngModel)]="registrationData.documents.owner_id"
                  name="ownerId"
                  placeholder="URL zum Dokument oder Dateiname"
                  class="form-input document-input"
                />
              </div>

              <div class="document-item">
                <div class="document-info">
                  <strong>Restaurant-Fotos</strong>
                  <small>URLs zu Restaurant-Bildern (kommagetrennt)</small>
                </div>
                <textarea
                  [(ngModel)]="restaurantPhotosText"
                  name="restaurantPhotos"
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  rows="2"
                  class="form-input document-input"
                  (input)="updateRestaurantPhotos()"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Zusätzliche Notizen -->
          <div class="section">
            <h3>📝 Zusätzliche Informationen</h3>

            <div class="form-group">
              <label for="notes">Notizen (optional)</label>
              <textarea
                id="notes"
                [(ngModel)]="registrationData.notes"
                name="notes"
                placeholder="Zusätzliche Informationen für die Admin-Prüfung..."
                rows="3"
                class="form-input"
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" [disabled]="loading || !isFormValid()" class="submit-btn">
            <span *ngIf="!loading">🍽️ Restaurant registrieren</span>
            <span *ngIf="loading" class="loading-text">Registrierung wird verarbeitet...</span>
          </button>

          <!-- Error/Success Messages -->
          <p class="error-message" *ngIf="error">{{ error }}</p>
          <p class="success-message" *ngIf="success">{{ success }}</p>

          <!-- Info Box -->
          <div class="info-box">
            <h4>ℹ️ Wichtige Informationen</h4>
            <ul>
              <li>Ihre Registrierung wird von unserem Admin-Team geprüft</li>
              <li>Sie erhalten eine E-Mail sobald die Prüfung abgeschlossen ist</li>
              <li>Bei Rückfragen werden wir uns mit Ihnen in Verbindung setzen</li>
              <li>Die Bearbeitungszeit beträgt in der Regel 1-3 Werktage</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .registration-container {
      min-height: 100vh;
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-2);
    }

    .registration-card {
      max-width: 800px;
      margin: 0 auto;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .registration-header {
      background: var(--gradient-primary);
      color: white;
      padding: var(--space-6);
      text-align: center;
    }

    .registration-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
    }

    .registration-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: var(--text-lg);
    }

    .registration-form {
      padding: var(--space-6);
    }

    .section {
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .section h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .section-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-4);
    }

    .subsection {
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .subsection h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    label {
      font-size: var(--text-sm);
      color: var(--color-heading);
      font-weight: 600;
    }

    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
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
    }

    .form-input::placeholder {
      color: var(--color-muted);
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .document-item {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
      padding: var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .document-info {
      flex: 1;
    }

    .document-info strong {
      display: block;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .document-info small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .document-input {
      flex: 2;
      margin: 0;
    }

    .submit-btn {
      width: 100%;
      padding: var(--space-4) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      background: var(--gradient-primary);
      color: white;
      font-weight: 600;
      font-size: var(--text-lg);
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-600) 25%, transparent);
      margin-top: var(--space-6);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in oklab, var(--color-primary-600) 35%, transparent);
    }

    .submit-btn:disabled {
      opacity: 0.7;
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
      margin-top: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-light-green);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-md);
    }

    .info-box h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-primary-700);
      font-size: var(--text-md);
    }

    .info-box ul {
      margin: 0;
      padding-left: var(--space-4);
    }

    .info-box li {
      color: var(--color-primary-600);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .document-item {
        flex-direction: column;
        gap: var(--space-2);
      }

      .registration-form {
        padding: var(--space-4);
      }

      .section {
        padding: var(--space-4);
      }
    }
  `]
})
export class RestaurantRegistrationComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  registrationData: RestaurantRegistrationData = {
    owner_info: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
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
    documents: {},
    notes: ''
  };

  restaurantPhotosText = '';
  loading = false;
  error = '';
  success = '';

  isFormValid(): boolean {
    return !!(
      this.registrationData.owner_info.name &&
      this.registrationData.owner_info.email &&
      this.registrationData.owner_info.phone &&
      this.registrationData.restaurant_info.name &&
      this.registrationData.restaurant_info.description &&
      this.registrationData.restaurant_info.cuisine_type &&
      this.registrationData.restaurant_info.address.street &&
      this.registrationData.restaurant_info.address.city &&
      this.registrationData.restaurant_info.address.postal_code &&
      this.registrationData.restaurant_info.contact_info.phone
    );
  }

  updateRestaurantPhotos() {
    if (this.restaurantPhotosText) {
      this.registrationData.documents.restaurant_photos =
        this.restaurantPhotosText.split(',').map(url => url.trim()).filter(url => url);
    } else {
      this.registrationData.documents.restaurant_photos = undefined;
    }
  }

  onSubmit() {
    if (!this.isFormValid() || this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post(`${environment.apiUrl}/restaurant-registration`, this.registrationData)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.success = 'Restaurant-Registrierung erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit dem Status.';

          // Reset form after successful submission
          setTimeout(() => {
            this.registrationData = {
              owner_info: {
                name: '',
                email: '',
                phone: '',
                address: ''
              },
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
              documents: {},
              notes: ''
            };
            this.restaurantPhotosText = '';
            this.success = '';
          }, 5000);
        },
        error: (err) => {
          this.loading = false;
          console.error('Registration error:', err);
          this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
      });
  }
}
