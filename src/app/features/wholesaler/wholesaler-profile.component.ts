import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WholesalerService, WholesalerProfile } from '../../core/services/wholesaler.service';

@Component({
  selector: 'app-wholesaler-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>Firmenprofil</h1>
        <p>Verwalten Sie Ihre Firmeninformationen und Einstellungen</p>
      </div>

      <div class="profile-content">
        @if (isLoading) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Profil wird geladen...</p>
          </div>
        } @else {
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
            @if (!profile) {
              <div class="warning-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Profil konnte nicht geladen werden. Sie können trotzdem versuchen, Daten zu speichern.
              </div>
            }

            @if (saveSuccess) {
              <div class="success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Profil erfolgreich gespeichert!
              </div>
            }

            <!-- Company Information -->
            <div class="form-section">
              <h2>Firmeninformationen</h2>
              <div class="form-grid">
                <div class="form-field">
                  <label for="name">Firmenname *</label>
                  <input type="text" id="name" formControlName="name" class="form-input">
                  @if (getFieldError('name')) {
                    <span class="error-message">{{ getFieldError('name') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="slug">Slug *</label>
                  <input type="text" id="slug" formControlName="slug" class="form-input">
                  @if (getFieldError('slug')) {
                    <span class="error-message">{{ getFieldError('slug') }}</span>
                  }
                </div>

                <div class="form-field full-width">
                  <label for="description">Beschreibung</label>
                  <textarea id="description" formControlName="description" class="form-textarea" rows="3"></textarea>
                </div>
              </div>
            </div>

            <!-- Address Information -->
            <div class="form-section">
              <h2>Adresse</h2>
              <div class="form-grid">
                <div class="form-field full-width">
                  <label for="street">Straße *</label>
                  <input type="text" id="street" formControlName="street" class="form-input">
                  @if (getFieldError('street')) {
                    <span class="error-message">{{ getFieldError('street') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="postal_code">PLZ *</label>
                  <input type="text" id="postal_code" formControlName="postal_code" class="form-input">
                  @if (getFieldError('postal_code')) {
                    <span class="error-message">{{ getFieldError('postal_code') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="city">Stadt *</label>
                  <input type="text" id="city" formControlName="city" class="form-input">
                  @if (getFieldError('city')) {
                    <span class="error-message">{{ getFieldError('city') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="country">Land *</label>
                  <input type="text" id="country" formControlName="country" class="form-input">
                  @if (getFieldError('country')) {
                    <span class="error-message">{{ getFieldError('country') }}</span>
                  }
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="form-section">
              <h2>Kontaktdaten</h2>
              <div class="form-grid">
                <div class="form-field">
                  <label for="phone">Telefon *</label>
                  <input type="tel" id="phone" formControlName="phone" class="form-input">
                  @if (getFieldError('phone')) {
                    <span class="error-message">{{ getFieldError('phone') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="email">E-Mail</label>
                  <input type="email" id="email" formControlName="email" class="form-input">
                  @if (getFieldError('email')) {
                    <span class="error-message">{{ getFieldError('email') }}</span>
                  }
                </div>

                <div class="form-field">
                  <label for="website">Website</label>
                  <input type="url" id="website" formControlName="website" class="form-input">
                </div>
              </div>
            </div>

            <!-- Images -->
            <div class="form-section">
              <h2>Firmenfotos</h2>
              <div class="image-upload-section">
                <div class="image-upload-item">
                  <h3>Logo</h3>
                  <div class="image-preview">
                    @if (profile?.images?.logo) {
                      <img [src]="profile!.images!.logo" alt="Firmenlogo" class="preview-image">
                    } @else {
                      <div class="no-image">Kein Logo hochgeladen</div>
                    }
                  </div>
                  <input type="file" #logoInput accept="image/*" (change)="onLogoSelected($event)" style="display: none;">
                  <button type="button" class="upload-button" (click)="logoInput.click()">
                    Logo hochladen
                  </button>
                </div>

                <div class="image-upload-item">
                  <h3>Banner</h3>
                  <div class="image-preview">
                    @if (profile?.images?.banner) {
                      <img [src]="profile!.images!.banner" alt="Firmenbanner" class="preview-image">
                    } @else {
                      <div class="no-image">Kein Banner hochgeladen</div>
                    }
                  </div>
                  <input type="file" #bannerInput accept="image/*" (change)="onBannerSelected($event)" style="display: none;">
                  <button type="button" class="upload-button" (click)="bannerInput.click()">
                    Banner hochladen
                  </button>
                </div>
              </div>
            </div>

            <!-- Status Information (Read-only) -->
            @if (profile) {
              <div class="form-section">
                <h2>Status</h2>
                <div class="status-grid">
                  <div class="status-item">
                    <span class="status-label">Verifiziert:</span>
                    <span class="status-value" [class.verified]="profile.is_verified" [class.unverified]="!profile.is_verified">
                      {{ profile.is_verified ? 'Ja' : 'Nein' }}
                    </span>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Aktiv:</span>
                    <span class="status-value" [class.active]="profile.is_active" [class.inactive]="!profile.is_active">
                      {{ profile.is_active ? 'Ja' : 'Nein' }}
                    </span>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Registrierungsstatus:</span>
                    <span class="status-value" [class]="profile.registration_status">
                      {{ profile.registration_status === 'approved' ? 'Genehmigt' : profile.registration_status === 'pending' ? 'Ausstehend' : 'Abgelehnt' }}
                    </span>
                  </div>
                </div>
              </div>
            }

            <!-- Save Button -->
            <div class="form-actions">
              <button type="submit" class="save-button" [disabled]="isSaving || profileForm.invalid">
                @if (isSaving) {
                  <div class="button-spinner"></div>
                  Speichern...
                } @else {
                  Speichern
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .profile-header {
      margin-bottom: var(--space-8);
    }

    .profile-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .profile-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .profile-content {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      padding: var(--space-8);
    }

    .loading {
      text-align: center;
      padding: var(--space-12);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top: 4px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4) auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-success-light);
      color: var(--color-success);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-success);
      margin-bottom: var(--space-6);
      font-weight: 500;
    }

    .error-message {
      background: var(--color-error-light);
      color: var(--color-error);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-error);
      text-align: center;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-warning-light);
      color: var(--color-warning);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-warning);
      margin-bottom: var(--space-6);
      font-weight: 500;
    }

    .profile-form {
      max-width: none;
    }

    .form-section {
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-8);
      border-bottom: 1px solid var(--color-border);
    }

    .form-section:last-child {
      border-bottom: none;
      margin-bottom: var(--space-6);
    }

    .form-section h2 {
      margin: 0 0 var(--space-6) 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .form-field {
      display: flex;
      flex-direction: column;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      margin-bottom: var(--space-2);
      font-weight: 500;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .form-input, .form-textarea {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      transition: border-color 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
    }

    .form-input.ng-invalid.ng-touched,
    .form-textarea.ng-invalid.ng-touched {
      border-color: var(--color-error);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-message {
      margin-top: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-error);
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .status-label {
      font-weight: 500;
      color: var(--color-heading);
    }

    .status-value {
      font-weight: 600;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .status-value.verified {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .status-value.unverified {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }

    .status-value.active {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .status-value.inactive {
      background: var(--color-error-light);
      color: var(--color-error);
    }

    .status-value.approved {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .status-value.pending {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }

    .status-value.rejected {
      background: var(--color-error-light);
      color: var(--color-error);
    }

    .image-upload-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
    }

    .image-upload-item {
      text-align: center;
    }

    .image-upload-item h3 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .image-preview {
      width: 200px;
      height: 150px;
      margin: 0 auto var(--space-3) auto;
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      overflow: hidden;
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      color: var(--color-muted);
      font-size: var(--text-sm);
      text-align: center;
    }

    .upload-button {
      background: #4aa96c;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .upload-button:hover {
      background: #3d8e59;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .save-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: #4aa96c;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .save-button:hover:not(:disabled) {
      background: #3d8e59;
    }

    .save-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .button-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: var(--space-4);
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        justify-content: center;
      }
    }
  `]
})
export class WholesalerProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private wholesalerService = inject(WholesalerService);

  profileForm!: FormGroup;
  profile: WholesalerProfile | null = null;
  isLoading = false;
  isSaving = false;
  saveSuccess = false;

  ngOnInit() {
    this.initializeForm();
    this.loadProfile();
  }

  private initializeForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      street: ['', Validators.required],
      city: ['', Validators.required],
      postal_code: ['', Validators.required],
      country: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.email]],
      website: ['']
    });
  }

  private loadProfile() {
    this.isLoading = true;
    this.wholesalerService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm.patchValue({
          name: profile.name,
          slug: profile.slug,
          description: profile.description || '',
          street: profile.address.street,
          city: profile.address.city,
          postal_code: profile.address.postal_code,
          country: profile.address.country,
          phone: profile.contact_info.phone,
          email: profile.contact_info.email || '',
          website: profile.contact_info.website || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isSaving = true;
      this.saveSuccess = false;

      const formValue = this.profileForm.value;
      const profileData = {
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        address: {
          street: formValue.street,
          city: formValue.city,
          postal_code: formValue.postal_code,
          country: formValue.country
        },
        contact_info: {
          phone: formValue.phone,
          email: formValue.email,
          website: formValue.website
        }
      };

      this.wholesalerService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.profile = response.wholesaler;
          this.isSaving = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldPath: string): string {
    const control = this.profileForm.get(fieldPath);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Dieses Feld ist erforderlich';
      }
      if (control.errors['minlength']) {
        return 'Mindestens 2 Zeichen erforderlich';
      }
      if (control.errors['email']) {
        return 'Ungültige E-Mail-Adresse';
      }
      if (control.errors['pattern']) {
        return 'Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt';
      }
    }
    return '';
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadImage(file, 'logo');
    }
  }

  onBannerSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadImage(file, 'banner');
    }
  }

  private uploadImage(file: File, type: 'logo' | 'banner') {
    const formData = new FormData();
    formData.append(type, file);

    this.wholesalerService.uploadProfileImages(formData).subscribe({
      next: (response) => {
        // Update the profile with new image URL
        if (this.profile) {
          this.profile.images = {
            ...this.profile.images,
            gallery: this.profile.images?.gallery || [],
            [type]: response.images[type]
          };
        }
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (error) => {
        console.error(`Error uploading ${type}:`, error);
        // Here you could show an error message to the user
      }
    });
  }
}
