import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WholesalerService, WholesalerProfile } from '../../core/services/wholesaler.service';
import { AuthService, User } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PasswordChangeComponent } from '../../shared/components/password-change.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wholesaler-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PasswordChangeComponent],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <div class="settings-header">
        <h1>Großhändler-Einstellungen</h1>
        <p>Verwalten Sie die Einstellungen Ihres Großhändler-Profils</p>
      </div>

      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button
          *ngFor="let tab of settingsTabs"
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id"
          class="tab-button"
        >
          <i [ngClass]="tab.icon"></i>
          <span>{{ tab.title }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !currentWholesaler" class="loading-container">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Großhändler-Daten werden geladen...</p>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="settings-content" *ngIf="!isLoading || currentWholesaler">
        <!-- Images Settings -->
        <div *ngIf="activeTab === 'images'" class="settings-section">
          <h2>Großhändler-Bilder</h2>
          <p class="section-description">Verwalten Sie Logo, Banner und Galerie-Bilder Ihres Großhändlers</p>

          <!-- Logo Section -->
          <div class="image-section">
            <h3>Logo</h3>
            <p class="image-description">Ihr Großhändler-Logo wird in der Produktliste und auf der Detailseite angezeigt.</p>

            <div class="image-upload-area">
              <div class="current-image" *ngIf="currentWholesaler?.images?.logo">
                <img [src]="currentWholesaler!.images!.logo" [alt]="'Logo von ' + (currentWholesaler?.name || 'Großhändler')" class="preview-image">
                <button type="button" class="remove-btn" (click)="removeLogo()">
                  <i class="fa-solid fa-times"></i>
                  Entfernen
                </button>
              </div>

              <div class="upload-controls" [class.has-image]="currentWholesaler?.images?.logo">
                <input
                  type="file"
                  #logoFileInput
                  (change)="onLogoFileSelected($event)"
                  accept="image/*"
                  style="display: none;">
                <button type="button" class="upload-btn" (click)="logoFileInput.click()">
                  <i class="fa-solid fa-upload"></i>
                  {{ currentWholesaler?.images?.logo ? 'Logo ersetzen' : 'Logo hochladen' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Banner Section -->
          <div class="image-section">
            <h3>Banner</h3>
            <p class="image-description">Das Banner-Bild wird als Header auf Ihrer Großhändler-Detailseite angezeigt.</p>

            <div class="image-upload-area">
              <div class="current-image" *ngIf="currentWholesaler?.images?.banner">
                <img [src]="currentWholesaler!.images!.banner" [alt]="'Banner von ' + (currentWholesaler?.name || 'Großhändler')" class="preview-image banner-preview">
                <button type="button" class="remove-btn" (click)="removeBanner()">
                  <i class="fa-solid fa-times"></i>
                  Entfernen
                </button>
              </div>

              <div class="upload-controls" [class.has-image]="currentWholesaler?.images?.banner">
                <input
                  type="file"
                  #bannerFileInput
                  (change)="onBannerFileSelected($event)"
                  accept="image/*"
                  style="display: none;">
                <button type="button" class="upload-btn" (click)="bannerFileInput.click()">
                  <i class="fa-solid fa-upload"></i>
                  {{ currentWholesaler?.images?.banner ? 'Banner ersetzen' : 'Banner hochladen' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Gallery Section -->
          <div class="image-section">
            <h3>Galerie</h3>
            <p class="image-description">Fügen Sie bis zu 10 Bilder Ihrer Produkte, Ihres Großhändlers oder Ihrer Räumlichkeiten hinzu.</p>

            <div class="gallery-grid" *ngIf="currentWholesaler?.images?.gallery && currentWholesaler!.images!.gallery!.length > 0">
              <div *ngFor="let image of currentWholesaler!.images!.gallery!; let i = index" class="gallery-item">
                <img [src]="image" [alt]="'Galerie-Bild ' + (i + 1)" class="gallery-image">
                <button type="button" class="remove-gallery-btn" (click)="removeGalleryImage(i)">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
            </div>

            <div class="gallery-upload" *ngIf="!currentWholesaler?.images?.gallery || (currentWholesaler!.images!.gallery && currentWholesaler!.images!.gallery!.length < 10)">
              <input
                type="file"
                #galleryFileInput
                (change)="onGalleryFilesSelected($event)"
                accept="image/*"
                multiple
                style="display: none;">
              <button type="button" class="upload-btn" (click)="galleryFileInput.click()">
                <i class="fa-solid fa-plus"></i>
                Galerie-Bilder hinzufügen
              </button>
              <p class="upload-info">
                {{ currentWholesaler?.images?.gallery ? (currentWholesaler!.images!.gallery!.length || 0) : 0 }}/10 Bilder hochgeladen
              </p>
            </div>
          </div>
        </div>

        <!-- General Settings -->
        <div *ngIf="activeTab === 'general'" class="settings-section">
          <h2>Allgemeine Informationen</h2>
          <form (ngSubmit)="saveGeneralSettings()" #generalForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="wholesalerName">Großhändler Name *</label>
                <input id="wholesalerName" type="text" [(ngModel)]="wholesaler.name" name="name" required>
              </div>

              <div class="form-group">
                <label for="wholesalerSlug">Slug</label>
                <input id="wholesalerSlug" type="text" [(ngModel)]="wholesaler.slug" name="slug">
              </div>

              <div class="form-group">
                <label for="wholesalerPhone">Telefon</label>
                <input id="wholesalerPhone" type="tel" [(ngModel)]="wholesaler.contact_info.phone" name="phone">
              </div>

              <div class="form-group">
                <label for="wholesalerEmail">E-Mail</label>
                <input id="wholesalerEmail" type="email" [(ngModel)]="wholesaler.contact_info.email" name="email">
              </div>

              <!-- Address Fields -->
              <div class="form-group">
                <label for="addressStreet">Straße und Hausnummer</label>
                <input id="addressStreet" type="text" [(ngModel)]="wholesaler.address.street" name="addressStreet">
              </div>

              <div class="form-group">
                <label for="addressPostalCode">PLZ</label>
                <input id="addressPostalCode" type="text" [(ngModel)]="wholesaler.address.postal_code" name="addressPostalCode">
              </div>

              <div class="form-group">
                <label for="addressCity">Stadt</label>
                <input id="addressCity" type="text" [(ngModel)]="wholesaler.address.city" name="addressCity">
              </div>

              <div class="form-group">
                <label for="addressCountry">Land</label>
                <input id="addressCountry" type="text" [(ngModel)]="wholesaler.address.country" name="addressCountry">
              </div>
            </div>

            <div class="form-group">
              <label for="wholesalerDescription">Beschreibung</label>
              <textarea id="wholesalerDescription" [(ngModel)]="wholesaler.description" name="description" rows="4"></textarea>
            </div>

            <div class="form-group">
              <label for="wholesalerWebsite">Website</label>
              <input id="wholesalerWebsite" type="url" [(ngModel)]="wholesaler.contact_info.website" name="website">
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="!generalForm.valid || isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Notifications -->
        <div *ngIf="activeTab === 'notifications'" class="settings-section">
          <h2>Benachrichtigungen</h2>
          <form (ngSubmit)="saveNotificationSettings()" #notificationForm="ngForm">
            <div class="notification-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>E-Mail-Benachrichtigungen</h4>
                  <p>Erhalten Sie E-Mails bei neuen Bestellungen und wichtigen Updates</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="notificationSettings.emailNotifications" name="emailNotifications">
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>SMS-Benachrichtigungen</h4>
                  <p>Erhalten Sie SMS bei dringenden Bestellungen</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="notificationSettings.smsNotifications" name="smsNotifications">
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Push-Benachrichtigungen</h4>
                  <p>Browser-Benachrichtigungen für neue Bestellungen</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="notificationSettings.pushNotifications" name="pushNotifications">
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Wöchentliche Zusammenfassung</h4>
                  <p>Wöchentliche Umsatz- und Bestellzusammenfassung</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="notificationSettings.weeklySummary" name="weeklySummary">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Benachrichtigungen speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Password Settings -->
        <div *ngIf="activeTab === 'password'" class="settings-section">
          <app-password-change></app-password-change>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    .settings-header {
      margin-bottom: var(--space-8);
      text-align: center;
    }

    .settings-header h1 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text);
      font-size: var(--text-3xl);
    }

    .settings-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Settings Tabs */
    .settings-tabs {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--color-muted);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .tab-button:hover {
      color: var(--color-text);
      background: var(--bg-light-green);
    }

    .tab-button.active {
      color: var(--color-primary-600);
      border-bottom-color: var(--color-primary-500);
    }

    .tab-button i {
      font-size: 0.875rem;
    }

    /* Settings Content */
    .settings-content {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .settings-section {
      padding: var(--space-8);
    }

    .settings-section h2 {
      margin: 0 0 var(--space-6) 0;
      color: var(--color-text);
      font-size: var(--text-xl);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-600);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Notification Settings */
    .notification-settings {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .setting-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-text);
    }

    .setting-info p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ccc;
      border: 2px solid #999;
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle input:checked + .toggle-slider {
      background: #ff6b35;
      border-color: #e55a2b;
    }

    .toggle input:checked + .toggle-slider:before {
      transform: translateX(26px);
    }

    /* Loading States */
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .loading-spinner {
      text-align: center;
      color: var(--color-muted);
    }

    .loading-spinner i {
      font-size: 2rem;
      margin-bottom: var(--space-4);
      color: var(--color-primary-500);
    }

    .loading-spinner p {
      margin: 0;
      font-size: var(--text-lg);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .settings-container {
        padding: var(--space-4) 0;
      }

      .settings-tabs {
        flex-wrap: wrap;
      }

      .tab-button {
        flex: 1;
        min-width: 120px;
        justify-content: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }
    }

    /* Image Upload Styles */
    .section-description {
      color: var(--color-muted);
      margin-bottom: var(--space-8);
      font-size: var(--text-lg);
    }

    .image-section {
      margin-bottom: var(--space-10);
    }

    .image-section h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text);
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .image-description {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .image-upload-area {
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      background: var(--bg-light);
      transition: all var(--transition);
    }

    .image-upload-area:hover {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    .current-image {
      position: relative;
      display: inline-block;
      margin-bottom: var(--space-4);
    }

    .preview-image {
      max-width: 200px;
      max-height: 150px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      object-fit: cover;
    }

    .banner-preview {
      max-width: 100%;
      max-height: 200px;
    }

    .remove-btn, .remove-gallery-btn {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .remove-btn:hover, .remove-gallery-btn:hover {
      background: var(--color-danger);
      transform: scale(1.1);
    }

    .upload-controls {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .upload-controls.has-image {
      align-items: flex-start;
    }

    .upload-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .upload-btn:hover {
      background: var(--color-primary-600);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .upload-info {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Gallery Styles */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .gallery-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .gallery-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition);
    }

    .gallery-item:hover .gallery-image {
      transform: scale(1.05);
    }

    .remove-gallery-btn {
      top: var(--space-1);
      right: var(--space-1);
      width: 24px;
      height: 24px;
      font-size: 10px;
    }

    .gallery-upload {
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      text-align: center;
      background: var(--bg-light);
      transition: all var(--transition);
    }

    .gallery-upload:hover {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    /* Responsive Images */
    @media (max-width: 768px) {
      .image-upload-area {
        padding: var(--space-4);
      }

      .preview-image {
        max-width: 150px;
        max-height: 100px;
      }

      .banner-preview {
        max-height: 150px;
      }

      .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: var(--space-3);
      }

      .current-image {
        display: block;
        text-align: center;
      }
    }
  `]
})
export class WholesalerSettingsComponent implements OnInit, OnDestroy {
  private wholesalerService = inject(WholesalerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private subscriptions: Subscription[] = [];

  activeTab: string = 'general';
  isLoading: boolean = false;
  currentUser: User | null = null;
  currentWholesaler: WholesalerProfile | null = null;

  wholesaler: any = {
    name: '',
    slug: '',
    description: '',
    address: {
      street: '',
      postal_code: '',
      city: '',
      country: ''
    },
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    images: {
      gallery: []
    }
  };

  settingsTabs = [
    { id: 'general', title: 'Allgemein', icon: 'fa-solid fa-info-circle' },
    { id: 'images', title: 'Bilder', icon: 'fa-solid fa-camera' },
    { id: 'notifications', title: 'Benachrichtigungen', icon: 'fa-solid fa-bell' },
    { id: 'password', title: 'Passwort', icon: 'fa-solid fa-lock' }
  ];

  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklySummary: true
  };

  ngOnInit() {
    this.loadCurrentUser();
    this.loadWholesalerData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCurrentUser() {
    const sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Current user loaded:', user);
    });
    this.subscriptions.push(sub);
  }

  private loadWholesalerData() {
    if (!this.currentUser) return;

    this.isLoading = true;

    const sub = this.wholesalerService.getProfile().subscribe({
      next: (wholesaler: WholesalerProfile) => {
        this.currentWholesaler = wholesaler;
        this.populateFormData(wholesaler);
        this.isLoading = false;
        console.log('Wholesaler data loaded:', wholesaler);
      },
      error: (error: any) => {
        console.error('Error loading wholesaler:', error);
        this.toastService.error('Fehler', 'Großhändler-Daten konnten nicht geladen werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private populateFormData(wholesaler: WholesalerProfile) {
    this.wholesaler = {
      name: wholesaler.name,
      slug: wholesaler.slug,
      description: wholesaler.description || '',
      address: wholesaler.address || {
        street: '',
        postal_code: '',
        city: '',
        country: ''
      },
      contact_info: wholesaler.contact_info || {
        phone: '',
        email: '',
        website: ''
      },
      images: wholesaler.images || { gallery: [] }
    };
  }

  saveGeneralSettings() {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const updateData = {
      name: this.wholesaler.name,
      slug: this.wholesaler.slug,
      description: this.wholesaler.description,
      address: {
        street: this.wholesaler.address.street,
        postal_code: this.wholesaler.address.postal_code,
        city: this.wholesaler.address.city,
        country: this.wholesaler.address.country
      },
      contact_info: {
        phone: this.wholesaler.contact_info.phone,
        email: this.wholesaler.contact_info.email,
        website: this.wholesaler.contact_info.website
      }
    };

    const sub = this.wholesalerService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.currentWholesaler = response.wholesaler;
        this.toastService.success('Erfolg', 'Allgemeine Einstellungen wurden gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving general settings:', error);
        this.toastService.error('Fehler', 'Allgemeine Einstellungen konnten nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  saveNotificationSettings() {
    // Notification settings would typically be saved to user preferences
    // For now, we'll just show a success message
    this.toastService.success('Erfolg', 'Benachrichtigungs-Einstellungen wurden gespeichert');
  }

  // Image Upload Methods
  onLogoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadLogo(file);
    }
  }

  onBannerFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadBanner(file);
    }
  }

  onGalleryFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      this.uploadGalleryImages(files);
    }
  }

  uploadLogo(file: File) {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('logo', file);

    const sub = this.wholesalerService.uploadProfileImages(formData).subscribe({
      next: (response: any) => {
        // Update the wholesaler images
        this.currentWholesaler!.images = {
          ...this.currentWholesaler!.images,
          logo: response.images.logo,
          gallery: this.currentWholesaler!.images?.gallery || []
        };
        this.toastService.success('Erfolg', 'Logo wurde erfolgreich hochgeladen');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error uploading logo:', error);
        this.toastService.error('Fehler', 'Logo konnte nicht hochgeladen werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  uploadBanner(file: File) {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('banner', file);

    const sub = this.wholesalerService.uploadProfileImages(formData).subscribe({
      next: (response: any) => {
        // Update the wholesaler images
        this.currentWholesaler!.images = {
          ...this.currentWholesaler!.images,
          banner: response.images.banner,
          gallery: this.currentWholesaler!.images?.gallery || []
        };
        this.toastService.success('Erfolg', 'Banner wurde erfolgreich hochgeladen');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error uploading banner:', error);
        this.toastService.error('Fehler', 'Banner konnte nicht hochgeladen werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  uploadGalleryImages(files: File[]) {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const formData = new FormData();
    files.forEach(file => {
      formData.append('gallery', file);
    });

    const sub = this.wholesalerService.uploadProfileImages(formData).subscribe({
      next: (response: any) => {
        // Reload wholesaler data to get updated gallery
        this.loadWholesalerData();
        this.toastService.success('Erfolg', `${files.length} Galerie-Bilder wurden erfolgreich hochgeladen`);
      },
      error: (error) => {
        console.error('Error uploading gallery images:', error);
        this.toastService.error('Fehler', 'Galerie-Bilder konnten nicht hochgeladen werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  removeLogo() {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const updateData = {
      images: {
        ...this.currentWholesaler.images,
        logo: undefined,
        gallery: this.currentWholesaler.images?.gallery || []
      }
    };

    const sub = this.wholesalerService.updateProfile(updateData).subscribe({
      next: (updatedWholesaler) => {
        this.currentWholesaler = updatedWholesaler.wholesaler;
        this.toastService.success('Erfolg', 'Logo wurde entfernt');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error removing logo:', error);
        this.toastService.error('Fehler', 'Logo konnte nicht entfernt werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  removeBanner() {
    if (!this.currentWholesaler) return;

    this.isLoading = true;
    const updateData = {
      images: {
        ...this.currentWholesaler.images,
        banner: undefined,
        gallery: this.currentWholesaler.images?.gallery || []
      }
    };

    const sub = this.wholesalerService.updateProfile(updateData).subscribe({
      next: (updatedWholesaler) => {
        this.currentWholesaler = updatedWholesaler.wholesaler;
        this.toastService.success('Erfolg', 'Banner wurde entfernt');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error removing banner:', error);
        this.toastService.error('Fehler', 'Banner konnte nicht entfernt werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  removeGalleryImage(index: number) {
    // For now, we'll need to implement this in the backend
    // Since the current API doesn't support removing individual gallery images,
    // we'll show a message that this feature is coming soon
    this.toastService.info('Info', 'Diese Funktion wird bald verfügbar sein');
  }
}
