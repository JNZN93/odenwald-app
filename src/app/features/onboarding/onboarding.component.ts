import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TermsModalComponent } from '../../shared/legal/terms-modal.component';
import { PrivacyModalComponent } from '../../shared/legal/privacy-modal.component';
import { PartnerContractModalComponent } from '../../shared/legal/partner-contract-modal.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TermsModalComponent, 
    PrivacyModalComponent, 
    PartnerContractModalComponent
  ],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <!-- Header -->
        <div class="onboarding-header">
          <h1>Restaurant-Onboarding</h1>
          <p *ngIf="restaurantName">{{ restaurantName }}</p>
        </div>

        <!-- Progress Indicator -->
        <div class="progress-bar">
          <div class="progress-step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
            <div class="step-number">1</div>
            <span class="step-label">Passwort</span>
          </div>
          <div class="progress-line" [class.completed]="currentStep > 1"></div>
          
          <div class="progress-step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
            <div class="step-number">2</div>
            <span class="step-label">Details</span>
          </div>
          <div class="progress-line" [class.completed]="currentStep > 2"></div>
          
          <div class="progress-step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
            <div class="step-number">3</div>
            <span class="step-label">Dokumente</span>
          </div>
          <div class="progress-line" [class.completed]="currentStep > 3"></div>
          
          <div class="progress-step" [class.active]="currentStep >= 4" [class.completed]="currentStep > 4">
            <div class="step-number">4</div>
            <span class="step-label">Zahlung</span>
          </div>
          <div class="progress-line" [class.completed]="currentStep > 4"></div>
          
          <div class="progress-step" [class.active]="currentStep >= 5" [class.completed]="currentStep > 5">
            <div class="step-number">5</div>
            <span class="step-label">Vertrag</span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading && !validToken" class="loading-state">
          <div class="spinner"></div>
          <p>Token wird validiert...</p>
        </div>

        <!-- Invalid Token -->
        <div *ngIf="!loading && !validToken" class="error-state">
          <h2>❌ Ungültiger oder abgelaufener Link</h2>
          <p>Der Onboarding-Link ist ungültig oder abgelaufen.</p>
          <p>Bitte kontaktieren Sie uns, um einen neuen Link zu erhalten.</p>
        </div>

        <!-- Step Content -->
        <div *ngIf="validToken && !loading" class="step-content">
          <!-- Step 1: Password -->
          <div *ngIf="currentStep === 1" class="step">
            <h2>Schritt 1: Passwort erstellen</h2>
            <p class="step-description">Willkommen! Erstellen Sie jetzt Ihr Passwort für Ihren Account.</p>
            
            <div class="form-group">
              <label for="password">Passwort *</label>
              <input 
                id="password" 
                type="password" 
                [(ngModel)]="step1Data.password" 
                required 
                minlength="8"
                placeholder="Mindestens 8 Zeichen"
                class="form-input">
            </div>

            <div class="form-group">
              <label for="confirmPassword">Passwort bestätigen *</label>
              <input 
                id="confirmPassword" 
                type="password" 
                [(ngModel)]="step1Data.confirmPassword" 
                required
                placeholder="Passwort wiederholen"
                class="form-input">
            </div>

            <p class="error-message" *ngIf="error">{{ error }}</p>
            
            <button 
              (click)="submitStep1()" 
              [disabled]="submitting || !step1Data.password || step1Data.password !== step1Data.confirmPassword"
              class="btn-primary">
              {{ submitting ? 'Wird verarbeitet...' : 'Weiter' }}
            </button>
          </div>

          <!-- Step 2: Restaurant Details + Photos -->
          <div *ngIf="currentStep === 2" class="step">
            <h2>Schritt 2: Restaurant-Details</h2>
            <p class="step-description">Vervollständigen Sie Ihr Restaurant-Profil.</p>
            
            <div class="form-group">
              <label>Restaurant-Fotos (min. 3) *</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                (change)="onPhotosSelected($event)"
                class="form-input">
              <small>{{ step2Data.photos.length }} Foto(s) ausgewählt</small>
            </div>

            <div class="form-group">
              <label>Öffnungszeiten</label>
              <div class="opening-hours-grid">
                <div class="hours-row">
                  <label class="day-label">Montag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.monday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.monday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Dienstag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.tuesday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.tuesday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Mittwoch:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.wednesday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.wednesday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Donnerstag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.thursday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.thursday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Freitag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.friday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.friday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Samstag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.saturday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.saturday.close" class="time-input">
                </div>
                <div class="hours-row">
                  <label class="day-label">Sonntag:</label>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.sunday.open" class="time-input">
                  <span>bis</span>
                  <input type="time" [(ngModel)]="step2Data.opening_hours.sunday.close" class="time-input">
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="deliveryRadius">Lieferradius (km)</label>
                <input 
                  id="deliveryRadius" 
                  type="number" 
                  [(ngModel)]="step2Data.delivery_radius" 
                  placeholder="5"
                  class="form-input">
              </div>

              <div class="form-group">
                <label for="minimumOrder">Mindestbestellwert (€)</label>
                <input 
                  id="minimumOrder" 
                  type="number" 
                  [(ngModel)]="step2Data.minimum_order" 
                  placeholder="15"
                  class="form-input">
              </div>

              <div class="form-group">
                <label for="deliveryFee">Liefergebühr (€)</label>
                <input 
                  id="deliveryFee" 
                  type="number" 
                  [(ngModel)]="step2Data.delivery_fee" 
                  placeholder="2.50"
                  class="form-input">
              </div>
            </div>

            <p class="error-message" *ngIf="error">{{ error }}</p>

            <div class="button-group">
              <button (click)="previousStep()" class="btn-secondary">Zurück</button>
              <button 
                (click)="submitStep2()" 
                [disabled]="submitting || step2Data.photos.length < 3"
                class="btn-primary">
                {{ submitting ? 'Wird hochgeladen...' : 'Weiter' }}
              </button>
            </div>
          </div>

          <!-- Step 3: Documents -->
          <div *ngIf="currentStep === 3" class="step">
            <h2>Schritt 3: Dokumente hochladen</h2>
            <p class="step-description">Laden Sie die erforderlichen Dokumente hoch.</p>

            <div class="form-group">
              <label for="businessLicense">Gewerbeschein *</label>
              <input 
                id="businessLicense" 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                (change)="onFileSelected($event, 'business_license')"
                class="form-input">
              <small *ngIf="step3Data.business_license">{{ step3Data.business_license.name }}</small>
            </div>

            <div class="form-group">
              <label for="ownerId">Personalausweis *</label>
              <input 
                id="ownerId" 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                (change)="onFileSelected($event, 'owner_id')"
                class="form-input">
              <small *ngIf="step3Data.owner_id">{{ step3Data.owner_id.name }}</small>
            </div>

            <div class="form-group">
              <label for="taxNumber">Steuernummer</label>
              <input 
                id="taxNumber" 
                type="text" 
                [(ngModel)]="step3Data.tax_number" 
                placeholder="z.B. 123/456/78901"
                class="form-input">
            </div>

            <p class="error-message" *ngIf="error">{{ error }}</p>

            <div class="button-group">
              <button (click)="previousStep()" class="btn-secondary">Zurück</button>
              <button 
                (click)="submitStep3()" 
                [disabled]="submitting || !step3Data.business_license || !step3Data.owner_id"
                class="btn-primary">
                {{ submitting ? 'Wird hochgeladen...' : 'Weiter' }}
              </button>
            </div>
          </div>

          <!-- Step 4: Stripe -->
          <div *ngIf="currentStep === 4" class="step">
            <h2>Schritt 4: Zahlungsinformationen</h2>
            <p class="step-description">
              Um Auszahlungen zu erhalten, müssen Sie Ihre Bankdaten bei unserem Partner Stripe hinterlegen.
            </p>

            <div class="info-box">
              <h4>🔒 Sicher und verschlüsselt</h4>
              <p>Stripe ist ein weltweit führender Zahlungsdienstleister. Ihre Bankdaten werden sicher verschlüsselt übertragen.</p>
              <p>Sie werden zu Stripe weitergeleitet und kommen automatisch zurück.</p>
            </div>

            <p class="error-message" *ngIf="error">{{ error }}</p>

            <div class="button-group">
              <button (click)="previousStep()" class="btn-secondary">Zurück</button>
              <button 
                (click)="submitStep4()" 
                [disabled]="submitting"
                class="btn-primary">
                {{ submitting ? 'Wird vorbereitet...' : 'Zu Stripe weiterleiten' }}
              </button>
            </div>
          </div>

          <!-- Step 5: Terms & Complete -->
          <div *ngIf="currentStep === 5" class="step">
            <h2>Schritt 5: Vertrag & Geschäftsbedingungen</h2>
            <p class="step-description">Fast geschafft! Bitte akzeptieren Sie folgende Dokumente:</p>

            <div class="contract-summary">
              <h3>📋 Partner-Vereinbarung</h3>
              <div class="summary-box">
                <p><strong>Wichtige Eckdaten:</strong></p>
                <ul>
                  <li>📊 Provision: 15% pro Bestellung</li>
                  <li>💰 Auszahlungszyklus: wöchentlich</li>
                  <li>📅 Mindestlaufzeit: keine</li>
                  <li>🔔 Kündigungsfrist: 30 Tage</li>
                </ul>
                <button (click)="showContractModal = true" class="link-button">
                  Vollständigen Vertrag lesen →
                </button>
              </div>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="step5Data.acceptedContract">
                <span>Ich habe den vollständigen Partner-Vertrag gelesen und akzeptiere ihn</span>
              </label>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="step5Data.acceptedTerms">
                <span>
                  Ich akzeptiere die 
                  <a href="#" (click)="$event.preventDefault(); showTermsModal = true" class="link">AGB</a>
                </span>
              </label>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="step5Data.acceptedPrivacy">
                <span>
                  Ich akzeptiere die 
                  <a href="#" (click)="$event.preventDefault(); showPrivacyModal = true" class="link">Datenschutzerklärung</a>
                </span>
              </label>
            </div>

            <div class="info-box warning">
              <p>⚖️ <strong>Hinweis:</strong> Mit der Bestätigung gehen Sie eine verbindliche Partnerschaft mit ODNWLD ein.</p>
            </div>

            <p class="error-message" *ngIf="error">{{ error }}</p>

            <div class="button-group">
              <button (click)="previousStep()" class="btn-secondary">Zurück</button>
              <button 
                (click)="submitStep5()" 
                [disabled]="submitting || !allTermsAccepted()"
                class="btn-primary btn-complete">
                {{ submitting ? 'Wird abgeschlossen...' : 'Onboarding abschließen ✓' }}
              </button>
            </div>
          </div>

          <!-- Completed State -->
          <div *ngIf="currentStep === 6" class="success-state">
            <div class="success-icon">✓</div>
            <h2>🎉 Onboarding erfolgreich abgeschlossen!</h2>
            <div class="info-box warning" style="text-align: left; margin: var(--space-6) 0;">
              <h4>⏳ Nächste Schritte</h4>
              <p><strong>Ihr Restaurant befindet sich jetzt in Überprüfung.</strong></p>
              <ul style="margin: var(--space-2) 0; padding-left: var(--space-4);">
                <li>Unser Admin-Team prüft Ihre hochgeladenen Dokumente</li>
                <li>Die Überprüfung dauert in der Regel 1-3 Werktage</li>
                <li>Sie erhalten eine E-Mail sobald Ihr Restaurant freigeschaltet wurde</li>
                <li>Erst nach der Freischaltung können Kunden Ihr Restaurant sehen</li>
              </ul>
            </div>
            <p style="color: var(--color-muted); margin: var(--space-4) 0;">
              Sie können sich bereits jetzt einloggen und Ihr Dashboard erkunden, 
              aber Ihr Restaurant wird erst nach der Admin-Freigabe für Kunden sichtbar.
            </p>
            <button (click)="goToDashboard()" class="btn-primary">Zum Dashboard</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <app-terms-modal *ngIf="showTermsModal" (closeModal)="showTermsModal = false"></app-terms-modal>
    <app-privacy-modal *ngIf="showPrivacyModal" (closeModal)="showPrivacyModal = false"></app-privacy-modal>
    <app-partner-contract-modal *ngIf="showContractModal" (closeModal)="showContractModal = false"></app-partner-contract-modal>
  `,
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token: string = '';
  validToken: boolean = false;
  loading: boolean = true;
  submitting: boolean = false;
  error: string = '';

  currentStep: number = 1;
  restaurantName: string = '';
  registrationData: any = null;

  // Step data
  step1Data = {
    password: '',
    confirmPassword: ''
  };

  step2Data = {
    photos: [] as File[],
    opening_hours: {
      monday: { open: '11:00', close: '22:00' },
      tuesday: { open: '11:00', close: '22:00' },
      wednesday: { open: '11:00', close: '22:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '22:00' },
      saturday: { open: '11:00', close: '22:00' },
      sunday: { open: '11:00', close: '22:00' }
    },
    delivery_radius: '',
    minimum_order: '',
    delivery_fee: ''
  };

  step3Data = {
    business_license: null as File | null,
    owner_id: null as File | null,
    tax_number: ''
  };

  step5Data = {
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedContract: false
  };

  // Modal states
  showTermsModal = false;
  showPrivacyModal = false;
  showContractModal = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      const step = params['step'];
      
      if (this.token) {
        this.validateToken();
      } else {
        this.loading = false;
        this.validToken = false;
      }

      // Handle return from Stripe
      if (step === '5') {
        this.currentStep = 5;
      }
    });
  }

  validateToken() {
    this.http.post(`${environment.apiUrl}/onboarding/validate-token`, { token: this.token })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.validToken = true;
          this.registrationData = response.registration;
          this.restaurantName = response.registration.restaurant_info.name;
          this.currentStep = response.onboarding.currentStep || 1;
        },
        error: (err) => {
          this.loading = false;
          this.validToken = false;
          console.error('Token validation error:', err);
        }
      });
  }

  submitStep1() {
    if (this.step1Data.password !== this.step1Data.confirmPassword) {
      this.error = 'Passwörter stimmen nicht überein';
      return;
    }

    if (this.step1Data.password.length < 8) {
      this.error = 'Passwort muss mindestens 8 Zeichen lang sein';
      return;
    }

    this.submitting = true;
    this.error = '';

    this.http.post(`${environment.apiUrl}/onboarding/step-1/password`, {
      token: this.token,
      password: this.step1Data.password
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.currentStep = 2;
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.error || 'Fehler beim Erstellen des Passworts';
      }
    });
  }

  onPhotosSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.step2Data.photos = files;
  }

  submitStep2() {
    if (this.step2Data.photos.length < 3) {
      this.error = 'Bitte laden Sie mindestens 3 Fotos hoch';
      return;
    }

    this.submitting = true;
    this.error = '';

    const formData = new FormData();
    formData.append('token', this.token);
    
    this.step2Data.photos.forEach(photo => {
      formData.append('photos', photo);
    });

    // Send opening hours as JSON string
    formData.append('opening_hours', JSON.stringify(this.step2Data.opening_hours));
    
    if (this.step2Data.delivery_radius) {
      formData.append('delivery_radius', this.step2Data.delivery_radius);
    }
    if (this.step2Data.minimum_order) {
      formData.append('minimum_order', this.step2Data.minimum_order);
    }
    if (this.step2Data.delivery_fee) {
      formData.append('delivery_fee', this.step2Data.delivery_fee);
    }

    this.http.post(`${environment.apiUrl}/onboarding/step-2/details`, formData)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.currentStep = 3;
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.error || 'Fehler beim Hochladen';
        }
      });
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      if (field === 'business_license') {
        this.step3Data.business_license = file;
      } else if (field === 'owner_id') {
        this.step3Data.owner_id = file;
      }
    }
  }

  submitStep3() {
    this.submitting = true;
    this.error = '';

    const formData = new FormData();
    formData.append('token', this.token);
    
    if (this.step3Data.business_license) {
      formData.append('business_license', this.step3Data.business_license);
    }
    if (this.step3Data.owner_id) {
      formData.append('owner_id', this.step3Data.owner_id);
    }
    if (this.step3Data.tax_number) {
      formData.append('tax_number', this.step3Data.tax_number);
    }

    this.http.post(`${environment.apiUrl}/onboarding/step-3/documents`, formData)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.currentStep = 4;
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.error || 'Fehler beim Hochladen';
        }
      });
  }

  submitStep4() {
    this.submitting = true;
    this.error = '';

    this.http.post(`${environment.apiUrl}/onboarding/step-4/stripe-init`, { token: this.token })
      .subscribe({
        next: (response: any) => {
          this.submitting = false;
          // Redirect to Stripe
          window.location.href = response.stripeUrl;
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.error || 'Fehler beim Initialisieren von Stripe';
        }
      });
  }

  submitStep5() {
    if (!this.allTermsAccepted()) {
      this.error = 'Bitte akzeptieren Sie alle Bedingungen';
      return;
    }

    this.submitting = true;
    this.error = '';

    this.http.post(`${environment.apiUrl}/onboarding/step-5/complete`, {
      token: this.token,
      acceptedTerms: this.step5Data.acceptedTerms,
      acceptedPrivacy: this.step5Data.acceptedPrivacy,
      acceptedContract: this.step5Data.acceptedContract
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.currentStep = 6;
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.error || 'Fehler beim Abschließen';
      }
    });
  }

  allTermsAccepted(): boolean {
    return this.step5Data.acceptedTerms && 
           this.step5Data.acceptedPrivacy && 
           this.step5Data.acceptedContract;
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = '';
    }
  }

  goToDashboard() {
    this.router.navigate(['/restaurant-manager/dashboard']);
  }
}

