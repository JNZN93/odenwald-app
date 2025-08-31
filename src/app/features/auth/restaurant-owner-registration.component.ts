import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RestaurantOwnerRegistrationData {
  // Owner info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;

  // Restaurant info
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
      email: string;
    };
  };

  // Documents
  documents: {
    business_license?: string;
    tax_certificate?: string;
    owner_id?: string;
    restaurant_photos?: string[];
  };

  // Notes
  notes: string;
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
          <!-- Step 1: Owner Information -->
          <div class="form-step" [class.active]="currentStep === 1">
            <div class="step-header">
              <h3>1. Persönliche Informationen</h3>
              <p>Bitte geben Sie Ihre Kontaktdaten für die Registrierung ein</p>
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

              <div class="form-group">
                <label for="password">Passwort *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  [(ngModel)]="registrationData.password"
                  required
                  minlength="8"
                  placeholder="Mindestens 8 Zeichen"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">Passwort bestätigen *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  [(ngModel)]="registrationData.confirmPassword"
                  required
                  placeholder="Passwort wiederholen"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Step 2: Restaurant Information -->
          <div class="form-step" [class.active]="currentStep === 2">
            <div class="step-header">
              <h3>2. Restaurant-Informationen</h3>
              <p>Bitte geben Sie die Details zu Ihrem Restaurant ein</p>
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
                  rows="4"
                  class="form-input"
                ></textarea>
              </div>

              <!-- Restaurant Address -->
              <div class="address-section">
                <h4>Restaurant-Adresse</h4>
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
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Documents & Final -->
          <div class="form-step" [class.active]="currentStep === 3">
            <div class="step-header">
              <h3>3. Dokumente & Verifizierung</h3>
              <p>Bitte laden Sie die erforderlichen Dokumente für die Verifizierung hoch</p>
            </div>

            <!-- Documents -->
            <div class="documents-section">
              <div class="document-item">
                <div class="document-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <div class="document-info">
                  <strong>Gewerbeschein</strong>
                  <small>Nachweis der Gewerbeanmeldung</small>
                </div>
                <div class="file-input-container">
                  <input
                    type="file"
                    name="businessLicense"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelect($event, 'business_license')"
                    #businessLicenseInput
                    class="file-input"
                  />
                  <div class="file-input-display" (click)="businessLicenseInput.click()">
                    <span *ngIf="!businessLicenseFile" class="file-placeholder">📎 Datei auswählen...</span>
                    <span *ngIf="businessLicenseFile" class="file-selected">{{ businessLicenseFile.name }}</span>
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="document-item">
                <div class="document-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div class="document-info">
                  <strong>Steuernummer</strong>
                  <small>Steuerliche Registrierung</small>
                </div>
                <input
                  type="text"
                  name="taxNumber"
                  [(ngModel)]="registrationData.documents.tax_certificate"
                  placeholder="z.B. 123/456/78901"
                  class="document-input"
                />
              </div>

              <div class="document-item">
                <div class="document-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <div class="document-info">
                  <strong>Ausweis</strong>
                  <small>Personalausweis des Inhabers</small>
                </div>
                <div class="file-input-container">
                  <input
                    type="file"
                    name="ownerId"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelect($event, 'owner_id')"
                    #ownerIdInput
                    class="file-input"
                  />
                  <div class="file-input-display" (click)="ownerIdInput.click()">
                    <span *ngIf="!ownerIdFile" class="file-placeholder">📎 Datei auswählen...</span>
                    <span *ngIf="ownerIdFile" class="file-selected">{{ ownerIdFile.name }}</span>
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="document-item">
                <div class="document-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    <circle cx="16" cy="8" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <div class="document-info">
                  <strong>Restaurant-Fotos</strong>
                  <small>Mindestens 3 Fotos Ihres Restaurants</small>
                </div>
                <div class="file-input-container">
                  <input
                    type="file"
                    name="restaurantPhotos"
                    accept="image/*"
                    multiple
                    (change)="onMultipleFileSelect($event, 'restaurant_photos')"
                    #restaurantPhotosInput
                    class="file-input"
                  />
                  <div class="file-input-display" (click)="restaurantPhotosInput.click()">
                    <span *ngIf="restaurantPhotoFiles.length === 0" class="file-placeholder">📎 Mehrere Dateien auswählen...</span>
                    <span *ngIf="restaurantPhotoFiles.length > 0" class="file-selected">
                      {{ restaurantPhotoFiles.length }} Datei{{ restaurantPhotoFiles.length !== 1 ? 'en' : '' }} ausgewählt
                    </span>
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <div *ngIf="restaurantPhotoFiles.length > 0" class="selected-files">
                    <div *ngFor="let file of restaurantPhotoFiles; let i = index" class="file-item">
                      <span class="file-name">{{ file.name }}</span>
                      <button type="button" class="remove-file" (click)="removeRestaurantPhoto(i)">×</button>
                    </div>
                  </div>
                </div>
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

            <!-- Terms & Privacy -->
            <div class="terms-section">
              <div class="checkbox-group">
                <input type="checkbox" id="terms" name="terms" [(ngModel)]="acceptTerms" required>
                <label for="terms">
                  Ich akzeptiere die <a href="#" class="link">Allgemeinen Geschäftsbedingungen</a> und die <a href="#" class="link">Datenschutzerklärung</a>
                </label>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="form-navigation">
            <button
              type="button"
              *ngIf="currentStep > 1"
              (click)="previousStep()"
              class="btn-secondary"
            >
              Zurück
            </button>

            <div class="step-indicator">
              <span [class.active]="currentStep >= 1">1</span>
              <span [class.active]="currentStep >= 2">2</span>
              <span [class.active]="currentStep >= 3">3</span>
            </div>

            <button
              type="button"
              *ngIf="currentStep < 3"
              (click)="nextStep()"
              [disabled]="!isStepValid(currentStep)"
              class="btn-primary"
            >
              Weiter
            </button>

            <button
              type="submit"
              *ngIf="currentStep === 3"
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
            <li>Bei Rückfragen werden wir uns mit Ihnen in Verbindung setzen</li>
            <li>Die Bearbeitungszeit beträgt in der Regel 1-3 Werktage</li>
            <li>Nach Genehmigung können Sie Ihr Restaurant in unserem System verwalten</li>
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
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .step-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
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

    .form-input textarea {
      resize: vertical;
      font-family: inherit;
    }

    .address-section {
      grid-column: 1 / -1;
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .address-section h4 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
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
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .document-icon {
      width: 24px;
      height: 24px;
      color: var(--color-primary-600);
      flex-shrink: 0;
    }

    .document-icon svg {
      width: 100%;
      height: 100%;
    }

    .document-info {
      flex: 1;
    }

    .document-info strong {
      display: block;
      color: var(--color-heading);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    .document-info small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .file-input-container {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .file-input {
      display: none;
    }

    .file-input-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      cursor: pointer;
      transition: all var(--transition);
      min-height: 48px;
      width: 100%;
      box-sizing: border-box;
    }

    .file-input-display:hover {
      border-color: var(--color-primary-500);
      background: var(--bg-light-green);
    }

    .file-placeholder,
    .file-selected {
      font-size: var(--text-sm);
      color: var(--color-muted);
      flex: 1;
    }

    .file-selected {
      color: var(--color-primary-600);
      font-weight: 500;
    }

    .upload-icon {
      width: 20px;
      height: 20px;
      color: var(--color-primary-600);
      flex-shrink: 0;
    }

    .document-input {
      flex: 2;
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
      box-sizing: border-box;
      min-height: 48px;
      width: 100%;
      display: inline-flex;
      align-items: center;
    }

    .document-input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
      background: var(--bg-light-green);
    }

    .document-input::placeholder {
      color: var(--color-muted);
      opacity: 0.7;
    }

    .selected-files {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: var(--space-2);
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-3);
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .file-name {
      color: var(--color-text);
      flex: 1;
      word-break: break-all;
    }

    .remove-file {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      font-size: var(--text-lg);
      font-weight: bold;
      padding: 0 var(--space-1);
      margin-left: var(--space-2);
      border-radius: var(--radius-sm);
      transition: all var(--transition);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-file:hover {
      background: var(--color-danger);
      color: white;
    }

    .terms-section {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border: 1px solid color-mix(in oklab, var(--color-primary) 20%, white);
      border-radius: var(--radius-md);
    }

    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .checkbox-group input[type="checkbox"] {
      margin-top: var(--space-1);
      flex-shrink: 0;
    }

    .checkbox-group label {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-heading);
      line-height: 1.5;
    }

    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    .form-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .step-indicator {
      display: flex;
      gap: var(--space-2);
    }

    .step-indicator span {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-border);
      color: var(--color-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      font-weight: 600;
      transition: all var(--transition);
    }

    .step-indicator span.active {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-secondary,
    .btn-primary {
      padding: var(--space-3) var(--space-5);
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-primary-600) 20%, transparent);
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--bg-light-hover);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-600) 30%, transparent);
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .submit-btn {
      min-width: 200px;
      padding: var(--space-4) var(--space-6);
      font-size: var(--text-lg);
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
      grid-column: 1 / -1;
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
      grid-column: 1 / -1;
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

      .form-navigation {
        flex-direction: column;
        gap: var(--space-4);
      }

      .step-indicator {
        order: -1;
      }

      .document-item {
        flex-direction: column;
        gap: var(--space-2);
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

  currentStep = 1;
  acceptTerms = false;

  registrationData: RestaurantOwnerRegistrationData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    documents: {},
    notes: ''
  };

  // File properties
  businessLicenseFile: File | null = null;
  ownerIdFile: File | null = null;
  restaurantPhotoFiles: File[] = [];

  loading = false;
  error = '';
  success = '';

  nextStep() {
    if (this.currentStep < 3 && this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(
          this.registrationData.name &&
          this.registrationData.email &&
          this.registrationData.phone &&
          this.registrationData.password &&
          this.registrationData.confirmPassword &&
          this.registrationData.password === this.registrationData.confirmPassword &&
          this.registrationData.password.length >= 8
        );
      case 2:
        return !!(
          this.registrationData.restaurant_info.name &&
          this.registrationData.restaurant_info.description &&
          this.registrationData.restaurant_info.cuisine_type &&
          this.registrationData.restaurant_info.address.street &&
          this.registrationData.restaurant_info.address.city &&
          this.registrationData.restaurant_info.address.postal_code &&
          this.registrationData.restaurant_info.contact_info.phone
        );
      case 3:
        return this.acceptTerms;
      default:
        return false;
    }
  }

  isFormValid(): boolean {
    return this.isStepValid(1) && this.isStepValid(2) && this.isStepValid(3);
  }

  // File handling methods
  onFileSelect(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      switch (field) {
        case 'business_license':
          this.businessLicenseFile = file;
          this.registrationData.documents.business_license = file.name;
          break;
        case 'owner_id':
          this.ownerIdFile = file;
          this.registrationData.documents.owner_id = file.name;
          break;
      }
    }
  }

  onMultipleFileSelect(event: any, field: string) {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      if (field === 'restaurant_photos') {
        this.restaurantPhotoFiles = files;
        this.registrationData.documents.restaurant_photos = files.map(f => f.name);
      }
    }
  }

  removeRestaurantPhoto(index: number) {
    this.restaurantPhotoFiles.splice(index, 1);
    this.registrationData.documents.restaurant_photos = this.restaurantPhotoFiles.map(f => f.name);
  }

  onSubmit() {
    if (!this.isFormValid() || this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    // Erstelle FormData für Datei-Upload
    const formData = new FormData();

    // Text-Daten hinzufügen
    formData.append('name', this.registrationData.name);
    formData.append('email', this.registrationData.email);
    formData.append('password', this.registrationData.password);
    formData.append('phone', this.registrationData.phone);
    formData.append('address', this.registrationData.address || '');
    formData.append('restaurant_name', this.registrationData.restaurant_info.name);
    formData.append('restaurant_description', this.registrationData.restaurant_info.description || '');
    formData.append('cuisine_type', this.registrationData.restaurant_info.cuisine_type);
    formData.append('restaurant_address_street', this.registrationData.restaurant_info.address.street);
    formData.append('restaurant_address_city', this.registrationData.restaurant_info.address.city);
    formData.append('restaurant_address_postal_code', this.registrationData.restaurant_info.address.postal_code);
    formData.append('restaurant_address_country', this.registrationData.restaurant_info.address.country);
    formData.append('restaurant_phone', this.registrationData.restaurant_info.contact_info.phone || '');
    formData.append('restaurant_email', this.registrationData.restaurant_info.contact_info.email || '');
    formData.append('notes', this.registrationData.notes || '');

    // Dateien hinzufügen
    if (this.businessLicenseFile) {
      formData.append('business_license', this.businessLicenseFile);
    }

    if (this.ownerIdFile) {
      formData.append('owner_id', this.ownerIdFile);
    }

    // Mehrere Restaurant-Fotos hinzufügen
    this.restaurantPhotoFiles.forEach((file, index) => {
      formData.append('restaurant_photos', file);
    });

    // Headers für FormData (Content-Type wird automatisch gesetzt)
    const headers = new HttpHeaders();
    // Entferne Content-Type, damit Browser ihn automatisch setzt
    headers.delete('Content-Type');

    this.http.post(`${environment.apiUrl}/auth/register-restaurant-owner`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.success = 'Restaurant-Registrierung erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit dem Status.';

          // Redirect to login after success
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: {
                message: 'Registrierung erfolgreich! Bitte loggen Sie sich ein, sobald Ihr Account freigeschaltet wurde.'
              }
            });
          }, 3000);
        },
        error: (err) => {
          this.loading = false;
          console.error('Registration error:', err);

          // Spezifische Fehlerbehandlung für Datei-Uploads
          if (err?.error?.details && Array.isArray(err.error.details)) {
            this.error = 'Upload-Fehler: ' + err.error.details.join(', ');
          } else {
            this.error = err?.error?.error || err?.error?.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
          }
        }
      });
  }
}
