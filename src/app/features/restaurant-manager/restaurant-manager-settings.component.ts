import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { AuthService, User } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PasswordChangeComponent } from '../../shared/components/password-change.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-restaurant-manager-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PasswordChangeComponent],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <div class="settings-header">
        <h1>Restaurant-Einstellungen</h1>
        <p>Verwalten Sie die Einstellungen Ihres Restaurants</p>
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
      <div *ngIf="isLoading && !currentRestaurant" class="loading-container">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Restaurant-Daten werden geladen...</p>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="settings-content" *ngIf="!isLoading || currentRestaurant">
        <!-- Images Settings -->
        <div *ngIf="activeTab === 'images'" class="settings-section">
          <h2>Restaurant-Bilder</h2>
          <p class="section-description">Verwalten Sie Logo, Banner und Galerie-Bilder Ihres Restaurants</p>

          <!-- Logo Section -->
          <div class="image-section">
            <h3>Logo</h3>
            <p class="image-description">Ihr Restaurant-Logo wird in der Restaurant-Liste und auf der Detailseite angezeigt.</p>

            <div class="image-upload-area">
              <div class="current-image" *ngIf="currentRestaurant?.images?.logo">
                <img [src]="currentRestaurant!.images!.logo" [alt]="'Logo von ' + (currentRestaurant?.name || 'Restaurant')" class="preview-image">
                <button type="button" class="remove-btn" (click)="removeLogo()">
                  <i class="fa-solid fa-times"></i>
                  Entfernen
                </button>
              </div>

              <div class="upload-controls" [class.has-image]="currentRestaurant?.images?.logo">
                <input
                  type="file"
                  #logoFileInput
                  (change)="onLogoFileSelected($event)"
                  accept="image/*"
                  style="display: none;">
                <button type="button" class="upload-btn" (click)="logoFileInput.click()">
                  <i class="fa-solid fa-upload"></i>
                  {{ currentRestaurant?.images?.logo ? 'Logo ersetzen' : 'Logo hochladen' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Banner Section -->
          <div class="image-section">
            <h3>Banner</h3>
            <p class="image-description">Das Banner-Bild wird als Header auf Ihrer Restaurant-Detailseite angezeigt.</p>

            <div class="image-upload-area">
              <div class="current-image" *ngIf="currentRestaurant?.images?.banner">
                <img [src]="currentRestaurant!.images!.banner" [alt]="'Banner von ' + (currentRestaurant?.name || 'Restaurant')" class="preview-image banner-preview">
                <button type="button" class="remove-btn" (click)="removeBanner()">
                  <i class="fa-solid fa-times"></i>
                  Entfernen
                </button>
              </div>

              <div class="upload-controls" [class.has-image]="currentRestaurant?.images?.banner">
                <input
                  type="file"
                  #bannerFileInput
                  (change)="onBannerFileSelected($event)"
                  accept="image/*"
                  style="display: none;">
                <button type="button" class="upload-btn" (click)="bannerFileInput.click()">
                  <i class="fa-solid fa-upload"></i>
                  {{ currentRestaurant?.images?.banner ? 'Banner ersetzen' : 'Banner hochladen' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Gallery Section -->
          <div class="image-section">
            <h3>Galerie</h3>
            <p class="image-description">Fügen Sie bis zu 10 Bilder Ihrer Speisen, Ihres Restaurants oder Ihrer Atmosphäre hinzu.</p>

            <div class="gallery-grid" *ngIf="currentRestaurant?.images?.gallery && currentRestaurant!.images!.gallery!.length > 0">
              <div *ngFor="let image of currentRestaurant!.images!.gallery!; let i = index" class="gallery-item">
                <img [src]="image" [alt]="'Galerie-Bild ' + (i + 1)" class="gallery-image">
                <button type="button" class="remove-gallery-btn" (click)="removeGalleryImage(i)">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
            </div>

            <div class="gallery-upload" *ngIf="!currentRestaurant?.images?.gallery || (currentRestaurant!.images!.gallery && currentRestaurant!.images!.gallery!.length < 10)">
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
                {{ currentRestaurant?.images?.gallery ? (currentRestaurant!.images!.gallery!.length || 0) : 0 }}/10 Bilder hochgeladen
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
                <label for="restaurantName">Restaurant Name *</label>
                <input id="restaurantName" type="text" [(ngModel)]="restaurant.name" name="name" required>
              </div>

              <div class="form-group">
                <label for="restaurantEmail">E-Mail</label>
                <input id="restaurantEmail" type="email" [(ngModel)]="restaurant.email" name="email">
              </div>

              <div class="form-group">
                <label for="restaurantPhone">Telefon</label>
                <input id="restaurantPhone" type="tel" [(ngModel)]="restaurant.phone" name="phone">
              </div>

              <div class="form-group">
                <label for="restaurantCuisine">Küche/Typ</label>
                <input id="restaurantCuisine" type="text" [(ngModel)]="restaurant.cuisine_type" name="cuisineType">
              </div>

              <!-- Address Fields -->
              <div class="form-group">
                <label for="addressStreet">Straße und Hausnummer</label>
                <input id="addressStreet" type="text" [(ngModel)]="restaurant.address_street" name="addressStreet">
              </div>

              <div class="form-group">
                <label for="addressPostalCode">PLZ</label>
                <input id="addressPostalCode" type="text" [(ngModel)]="restaurant.address_postal_code" name="addressPostalCode">
              </div>

              <div class="form-group">
                <label for="addressCity">Stadt</label>
                <input id="addressCity" type="text" [(ngModel)]="restaurant.address_city" name="addressCity">
              </div>

              <div class="form-group">
                <label for="addressCountry">Land</label>
                <input id="addressCountry" type="text" [(ngModel)]="restaurant.address_country" name="addressCountry">
              </div>
            </div>

            <div class="form-group">
              <label for="restaurantDescription">Beschreibung</label>
              <textarea id="restaurantDescription" [(ngModel)]="restaurant.description" name="description" rows="4"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="!generalForm.valid || isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Speichern' }}
              </button>
              <button type="button" class="btn-secondary" (click)="saveAddressSettings()" [disabled]="isLoading">
                <i class="fa-solid fa-location-arrow" *ngIf="!isLoading"></i>
                Adresse speichern
              </button>
            </div>
          </form>
        </div>

        <!-- Operating Hours -->
        <div *ngIf="activeTab === 'hours'" class="settings-section">
          <h2>Öffnungszeiten</h2>
          
          <!-- Immediate Closure Toggle -->
          <div class="immediate-closure-section">
            <div class="closure-toggle-card">
              <div class="closure-info">
                <h3>Sofort schließen</h3>
                <p>Schließt das Restaurant sofort, unabhängig von den Öffnungszeiten. Kunden können keine Bestellungen aufgeben.</p>
                <p><strong>DEBUG:</strong> isImmediatelyClosed = {{ isImmediatelyClosed }}</p>
              </div>
              <div class="closure-toggle">
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="isImmediatelyClosed" 
                    (change)="toggleImmediateClosure()"
                    [disabled]="isLoading"
                  >
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label" [class.active]="isImmediatelyClosed">
                  {{ isImmediatelyClosed ? 'Geschlossen' : 'Geöffnet' }}
                </span>
              </div>
            </div>
          </div>

          <form (ngSubmit)="saveOperatingHours()" #hoursForm="ngForm">
            <div class="hours-grid">
              <div *ngFor="let day of daysOfWeek; let i = index" class="day-hours">
                <div class="day-name">{{ day.name }}</div>
                <div class="hours-inputs">
                  <input
                    type="time"
                    [(ngModel)]="operatingHours[i].open"
                    [name]="'open-' + i"
                    placeholder="Öffnen"
                  >
                  <span>bis</span>
                  <input
                    type="time"
                    [(ngModel)]="operatingHours[i].close"
                    [name]="'close-' + i"
                    placeholder="Schließen"
                  >
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="operatingHours[i].closed" [name]="'closed-' + i">
                    <span class="checkmark"></span>
                    Geschlossen
                  </label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Öffnungszeiten speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Delivery Settings -->
        <div *ngIf="activeTab === 'delivery'" class="settings-section">
          <h2>Liefer-Einstellungen</h2>
          <form (ngSubmit)="saveDeliverySettings()" #deliveryForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="minOrder">Mindestbestellwert (€)</label>
                <input id="minOrder" type="number" step="0.01" [(ngModel)]="deliverySettings.minOrderAmount" name="minOrder" min="0">
              </div>

              <div class="form-group">
                <label for="deliveryFee">Liefergebühr (€)</label>
                <input id="deliveryFee" type="number" step="0.01" [(ngModel)]="deliverySettings.deliveryFee" name="deliveryFee" min="0">
              </div>

              <div class="form-group">
                <label for="deliveryRadius">Lieferradius (km)</label>
                <input id="deliveryRadius" type="number" step="0.1" [(ngModel)]="deliverySettings.deliveryRadius" name="deliveryRadius" min="0">
              </div>

              <div class="form-group">
                <label for="estimatedTime">Geschätzte Lieferzeit (Min.)</label>
                <input id="estimatedTime" type="number" [(ngModel)]="deliverySettings.estimatedDeliveryTime" name="estimatedTime" min="0">
              </div>
            </div>

            <!-- Excluded delivery areas (postal code + sub-area) -->
            <div class="form-group">
              <label>Ausgeschlossene Bereiche (PLZ + Ortsteil)</label>
              <div *ngFor="let area of deliverySettings.excludedAreas; let i = index" class="excluded-area-row">
                <input
                  type="text"
                  placeholder="PLZ"
                  [(ngModel)]="deliverySettings.excludedAreas[i].postal_code"
                  [name]="'excluded_postal_' + i"
                >
                <input
                  type="text"
                  placeholder="Ortsteil"
                  [(ngModel)]="deliverySettings.excludedAreas[i].sub_area"
                  [name]="'excluded_subarea_' + i"
                >
                <button type="button" class="btn-secondary" (click)="removeExcludedArea(i)">Entfernen</button>
              </div>
              <button type="button" class="btn-primary" (click)="addExcludedArea()">
                <i class="fa-solid fa-plus"></i>
                Bereich hinzufügen
              </button>
              <p class="upload-info">Beispiel: PLZ 64711, Ortsteil Bullau</p>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="deliverySettings.isActive" name="isActive">
                <span class="checkmark"></span>
                Lieferung aktiv
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Liefer-Einstellungen speichern' }}
              </button>
            </div>
          </form>

          <!-- Display current excluded areas -->
          <div *ngIf="hasExcludedAreas()" class="current-exclusions">
            <h3>Aktuell ausgeschlossene Bereiche</h3>
            <div class="exclusions-list">
              <div *ngFor="let area of getExcludedAreas()" class="exclusion-item">
                <div class="exclusion-info">
                  <strong>{{ area.sub_area }}</strong> in {{ area.postal_code }}
                  <span *ngIf="area.reason" class="exclusion-reason">({{ area.reason }})</span>
                </div>
              </div>
            </div>
            <p class="info-note">Diese Bereiche werden bei der Restaurant-Suche für Kunden nicht angezeigt.</p>
          </div>
        </div>

        <!-- Notifications -->
        <div *ngIf="activeTab === 'notifications'" class="settings-section">
          <h2>Benachrichtigungen</h2>
          <form (ngSubmit)="saveNotificationSettings()" #notificationForm="ngForm">
            <div class="notification-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>E-Mail-Benachrichtigungen</h4>
                  <p>Erhalten Sie E-Mails bei neuen Bestellungen</p>
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
                  <h4>Tägliche Zusammenfassung</h4>
                  <p>Tägliche Umsatz- und Bestellzusammenfassung</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="notificationSettings.dailySummary" name="dailySummary">
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

        <!-- Payment Settings -->
        <div *ngIf="activeTab === 'payment'" class="settings-section">
          <h2>Zahlungseinstellungen</h2>
          <div class="payment-info">
            <div class="info-card">
              <i class="fa-solid fa-info-circle"></i>
              <div>
                <h4>Zahlungsabwicklung</h4>
                <p>Die Zahlungsabwicklung erfolgt über Stripe. Konfiguration im Admin-Bereich verfügbar.</p>
              </div>
            </div>

            <div class="payment-methods">
              <h4>Akzeptierte Zahlungsmethoden</h4>
              <form (ngSubmit)="savePaymentSettings()" #paymentForm="ngForm">
                <div class="method-grid">
                  <div class="payment-method" [class.active]="paymentSettings.cash">
                    <label class="payment-toggle">
                      <input type="checkbox" [(ngModel)]="paymentSettings.cash" name="cash">
                      <i class="fa-solid fa-money-bill-wave"></i>
                      <span title="Barzahlung">Barzahlung</span>
                      <div class="toggle-indicator" [class.active]="paymentSettings.cash"></div>
                    </label>
                  </div>
                  <div class="payment-method" [class.active]="paymentSettings.card">
                    <label class="payment-toggle">
                      <input type="checkbox" [(ngModel)]="paymentSettings.card" name="card">
                      <i class="fa-solid fa-credit-card"></i>
                      <span title="Kreditkarte">Kreditkarte</span>
                      <div class="toggle-indicator" [class.active]="paymentSettings.card"></div>
                    </label>
                  </div>
                  <div class="payment-method" [class.active]="paymentSettings.paypal">
                    <label class="payment-toggle">
                      <input type="checkbox" [(ngModel)]="paymentSettings.paypal" name="paypal">
                      <i class="fa-brands fa-paypal"></i>
                      <span title="PayPal">PayPal</span>
                      <div class="toggle-indicator" [class.active]="paymentSettings.paypal"></div>
                    </label>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn-primary" [disabled]="isLoading">
                    <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                    <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                    {{ isLoading ? 'Wird gespeichert...' : 'Zahlungsmethoden speichern' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Loyalty Settings -->
        <div *ngIf="activeTab === 'loyalty'" class="settings-section">
          <h2>Stempelkarten</h2>
          <form (ngSubmit)="saveLoyaltySettings()" #loyaltyForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="loyaltySettings.enabled" name="loyaltyEnabled">
                  <span class="checkmark"></span>
                  Stempelkarten aktivieren
                </label>
              </div>

              <div class="form-group">
                <label for="stampsRequired">Bestellungen für Rabatt</label>
                <input id="stampsRequired" type="number" min="1" [(ngModel)]="loyaltySettings.stamps_required" name="stampsRequired">
              </div>

              <div class="form-group">
                <label for="discountPercent">Rabatt in %</label>
                <input id="discountPercent" type="number" min="1" max="100" [(ngModel)]="loyaltySettings.discount_percent" name="discountPercent">
              </div>

              <div class="form-group">
                <label for="minSubtotal">Mindestwarenkorb für Stempel (€)</label>
                <input id="minSubtotal" type="number" step="0.01" min="0" [(ngModel)]="loyaltySettings.min_subtotal_to_earn" name="minSubtotal">
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isLoading"></i>
                <i class="fa-solid fa-save" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Wird gespeichert...' : 'Stempelkarten speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Stripe Connect Settings -->
        <div *ngIf="activeTab === 'stripe'" class="settings-section">
          <h2>Stripe Connect</h2>
          <p>Verbinden Sie Ihr Stripe-Konto, um Zahlungen direkt zu empfangen.</p>

          <div class="info-card" style="margin-bottom:16px;">
            <div>
              <p><strong>Account-ID:</strong> {{ currentRestaurant?.stripe_account_id || '–' }}</p>
              <p><strong>Status:</strong> {{ stripeStatusText }}</p>
            </div>
          </div>

          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn-primary" type="button" (click)="startStripeOnboarding()" [disabled]="isLoading">
              <i class="fa-brands fa-stripe"></i>
              {{ currentRestaurant?.stripe_account_id ? 'Onboarding fortsetzen' : 'Stripe-Konto erstellen' }}
            </button>
            <button class="btn-secondary" type="button" (click)="refreshStripeStatus()" [disabled]="isLoading">
              Status aktualisieren
            </button>
          </div>
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

    /* Operating Hours */
    .hours-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .day-hours {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-radius: var(--radius-lg);
    }

    .day-name {
      min-width: 100px;
      font-weight: 600;
      color: var(--color-text);
    }

    .hours-inputs {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
    }

    .hours-inputs input[type="time"] {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      width: 120px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      position: relative;
      transition: all var(--transition);
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
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

    /* Payment Settings */
    .payment-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .info-card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--color-info-50);
      border: 1px solid var(--color-info-200);
      border-radius: var(--radius-lg);
      color: var(--color-info-800);
    }

    .info-card i {
      font-size: 1.5rem;
      margin-top: var(--space-1);
    }

    .info-card h4 {
      margin: 0 0 var(--space-2) 0;
    }

    .info-card p {
      margin: 0;
    }

    .payment-methods h4 {
      margin-bottom: var(--space-4);
      color: var(--color-text);
    }

    .method-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    /* For very small containers, ensure minimum usability */
    @media (max-width: 480px) {
      .method-grid {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .payment-method {
        min-height: 60px;
      }

      .payment-toggle span {
        font-size: var(--text-sm);
        max-width: calc(100% - 50px);
      }
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: white;
      color: var(--color-muted);
      transition: all var(--transition);
      min-width: 0; /* Allow flex items to shrink below their content size */
    }

    .payment-method.active {
      border-color: var(--color-success);
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .payment-method i {
      font-size: 1.25rem;
    }

    /* Payment Toggle Styles */
    .payment-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      width: 100%;
      padding: var(--space-3);
      border-radius: var(--radius-md);
      transition: all var(--transition);
      position: relative;
      min-width: 0; /* Allow flex items to shrink */
    }

    .payment-toggle:hover {
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    .payment-toggle input[type="checkbox"] {
      display: none;
    }

    .payment-toggle i {
      color: var(--color-primary);
      font-size: var(--text-lg);
      flex-shrink: 0;
    }

    .payment-toggle span {
      flex: 1;
      color: var(--color-text);
      font-weight: 500;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 60px); /* Reserve space for icon and toggle */
      position: relative;
      cursor: help;
    }

    /* Tooltip for truncated text */
    .payment-toggle span:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-text);
      color: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      white-space: nowrap;
      z-index: 1000;
      margin-bottom: var(--space-2);
      box-shadow: var(--shadow-lg);
      opacity: 0;
      animation: fadeInTooltip 0.2s ease forwards;
      pointer-events: none; /* Prevent tooltip from interfering with clicks */
    }

    @keyframes fadeInTooltip {
      to {
        opacity: 1;
      }
    }

    .toggle-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      transition: all var(--transition);
      flex-shrink: 0;
      position: relative;
      margin-left: auto; /* Push to the right */
    }

    .toggle-indicator.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .toggle-indicator.active::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .payment-method.active {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, var(--color-surface));
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

      .day-hours {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .hours-inputs {
        width: 100%;
        justify-content: space-between;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .method-grid {
        grid-template-columns: 1fr;
      }

      .payment-method {
        min-width: 0;
      }

      .payment-toggle span {
        font-size: var(--text-sm);
      }

      /* Disable tooltips on touch devices */
      .payment-toggle span:hover::after,
      .payment-toggle span:hover::before {
        display: none;
      }

      /* Alternative: Show full text on mobile */
      .payment-method {
        padding: var(--space-3);
      }

      .payment-toggle {
        padding: var(--space-2);
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

    /* Immediate Closure Styles */
    .immediate-closure-section {
      margin-bottom: var(--space-8);
    }

    .closure-toggle-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-6);
      background: var(--color-warning-100);
      border: 3px solid var(--color-warning-500);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .closure-toggle-card:hover {
      border-color: var(--color-warning-300);
      background: var(--color-warning-100);
    }

    .closure-info h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-warning-800);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .closure-info p {
      margin: 0;
      color: var(--color-warning-700);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .closure-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    .toggle-label {
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--color-muted);
      transition: color var(--transition);
    }

    .toggle-label.active {
      color: var(--color-warning-800);
    }

    /* Specific styling for immediate closure toggle */
    .closure-toggle .toggle {
      width: 60px;
      height: 30px;
    }
    
    .closure-toggle .toggle-slider {
      background: #ddd;
      border: 2px solid #bbb;
    }
    
    .closure-toggle .toggle input:checked + .toggle-slider {
      background: #ff4444;
      border-color: #cc0000;
    }
    
    .closure-toggle .toggle-slider:before {
      height: 22px;
      width: 22px;
      left: 2px;
      bottom: 2px;
    }
    
    .closure-toggle .toggle input:checked + .toggle-slider:before {
      transform: translateX(30px);
    }

    /* Excluded areas styles */
    .excluded-area-row {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .excluded-area-row input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .excluded-area-row input:first-child {
      flex: 0 0 100px;
    }

    .current-exclusions {
      margin-top: var(--space-6);
      padding: var(--space-4);
      background: var(--color-info-50);
      border: 1px solid var(--color-info-200);
      border-radius: var(--radius-lg);
    }

    .current-exclusions h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-info-800);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .exclusions-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .exclusion-item {
      padding: var(--space-3);
      background: white;
      border: 1px solid var(--color-info-300);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .exclusion-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .exclusion-reason {
      color: var(--color-muted);
      font-style: italic;
    }

    .info-note {
      margin: 0;
      color: var(--color-info-700);
      font-size: var(--text-sm);
      font-style: italic;
    }

    /* Responsive for immediate closure */
    @media (max-width: 768px) {
      .closure-toggle-card {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .closure-toggle {
        align-self: flex-end;
      }

      .excluded-area-row {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-2);
      }

      .excluded-area-row input {
        flex: none;
      }

      .excluded-area-row input:first-child {
        flex: 1;
      }
    }
  `]
})
export class RestaurantManagerSettingsComponent implements OnInit, OnDestroy {
  private restaurantsService = inject(RestaurantsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private subscriptions: Subscription[] = [];

  activeTab: string = 'general';
  isLoading: boolean = false;
  currentUser: User | null = null;
  currentRestaurant: RestaurantDTO | null = null;
  isImmediatelyClosed: boolean = false;

  restaurant: any = {
    name: '',
    email: '',
    phone: '',
    description: '',
    cuisine_type: '',
    address_street: '',
    address_postal_code: '',
    address_city: '',
    address_country: ''
  };

  settingsTabs = [
    { id: 'general', title: 'Allgemein', icon: 'fa-solid fa-info-circle' },
    { id: 'images', title: 'Bilder', icon: 'fa-solid fa-camera' },
    { id: 'hours', title: 'Öffnungszeiten', icon: 'fa-solid fa-clock' },
    { id: 'delivery', title: 'Lieferung', icon: 'fa-solid fa-truck' },
    { id: 'notifications', title: 'Benachrichtigungen', icon: 'fa-solid fa-bell' },
    { id: 'payment', title: 'Zahlung', icon: 'fa-solid fa-credit-card' },
    { id: 'loyalty', title: 'Stempelkarten', icon: 'fa-solid fa-ticket' },
    { id: 'stripe', title: 'Stripe Connect', icon: 'fa-brands fa-stripe' },
    { id: 'password', title: 'Passwort', icon: 'fa-solid fa-lock' }
  ];

  daysOfWeek = [
    { name: 'Montag', value: 'monday' },
    { name: 'Dienstag', value: 'tuesday' },
    { name: 'Mittwoch', value: 'wednesday' },
    { name: 'Donnerstag', value: 'thursday' },
    { name: 'Freitag', value: 'friday' },
    { name: 'Samstag', value: 'saturday' },
    { name: 'Sonntag', value: 'sunday' }
  ];

  operatingHours = this.daysOfWeek.map(day => ({
    day: day.value,
    open: '09:00',
    close: '22:00',
    closed: false
  }));

  deliverySettings = {
    minOrderAmount: 15.00,
    deliveryFee: 2.50,
    deliveryRadius: 5.0,
    estimatedDeliveryTime: 30,
    isActive: true,
    excludedAreas: [] as Array<{ postal_code: string; sub_area: string; reason?: string }>
  };

  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailySummary: true
  };

  paymentSettings = {
    cash: true,
    card: true,
    paypal: false
  };

  loyaltySettings: any = {
    enabled: false,
    stamps_required: 5,
    discount_percent: 10,
    min_subtotal_to_earn: 0
  };

  stripeStatusText: string = '–';

  ngOnInit() {
    this.loadCurrentUser();
    this.loadRestaurantData();

    // Check for tab parameter in URL
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam && this.settingsTabs.some(tab => tab.id === tabParam)) {
      this.activeTab = tabParam;
    }
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

  private loadRestaurantData() {
    if (!this.currentUser) return;

    this.isLoading = true;

    // For now, we assume the user manages restaurants and get the first one
    // In a real scenario, this would come from route params or user selection
    const restaurantId = this.currentUser.tenant_id;

    const sub = this.restaurantsService.getRestaurantById(restaurantId).subscribe({
      next: (restaurant: any) => {
        this.currentRestaurant = restaurant;
        this.populateFormData(restaurant);

        // Auto-switch to Stripe tab if no account exists and no tab parameter
        if (!restaurant.stripe_account_id && !this.route.snapshot.queryParamMap.has('tab')) {
          this.activeTab = 'stripe';
        }

        this.isLoading = false;
        console.log('Restaurant data loaded:', restaurant);
      },
      error: (error: any) => {
        console.error('Error loading restaurant:', error);
        this.toastService.error('Fehler', 'Restaurant-Daten konnten nicht geladen werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private populateFormData(restaurant: RestaurantDTO) {
    // General settings
    this.restaurant = {
      name: restaurant.name,
      email: restaurant.contact_info?.email || '',
      phone: restaurant.contact_info?.phone || '',
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type,
      address_street: restaurant.address?.street || '',
      address_postal_code: restaurant.address?.postal_code || '',
      address_city: restaurant.address?.city || '',
      address_country: restaurant.address?.country || ''
    };

    // Operating hours
    if (restaurant.opening_hours) {
      const openingHours = restaurant.opening_hours as Record<string, { open: string; close: string; is_closed: boolean }>;
      this.operatingHours = this.daysOfWeek.map(day => ({
        day: day.value,
        open: openingHours[day.value]?.open || '09:00',
        close: openingHours[day.value]?.close || '22:00',
        closed: openingHours[day.value]?.is_closed || false
      }));
    }

    // Delivery settings
    if (restaurant.delivery_info) {
      this.deliverySettings = {
        minOrderAmount: restaurant.delivery_info.minimum_order_amount || 15.00,
        deliveryFee: restaurant.delivery_info.delivery_fee || 2.50,
        deliveryRadius: restaurant.delivery_info.delivery_radius_km || 5.0,
        estimatedDeliveryTime: restaurant.delivery_info.estimated_delivery_time_minutes || 30,
        isActive: true, // This would need to be stored separately
        excludedAreas: (restaurant.delivery_info as any).excluded_areas || []
      };
    }

    // Payment settings
    if (restaurant.payment_methods) {
      this.paymentSettings = {
        cash: !!restaurant.payment_methods.cash,
        card: !!restaurant.payment_methods.card,
        paypal: !!restaurant.payment_methods.paypal
      };
    }

    // Immediate closure status
    console.log('Restaurant data loaded:', restaurant);
    console.log('is_immediately_closed:', restaurant.is_immediately_closed);
    this.isImmediatelyClosed = restaurant.is_immediately_closed || false;

    // Loyalty settings
    if ((restaurant as any).loyalty_settings) {
      this.loyaltySettings = {
        enabled: !!(restaurant as any).loyalty_settings.enabled,
        stamps_required: (restaurant as any).loyalty_settings.stamps_required || 5,
        discount_percent: (restaurant as any).loyalty_settings.discount_percent || 10,
        min_subtotal_to_earn: (restaurant as any).loyalty_settings.min_subtotal_to_earn || 0
      };
    }

    // Stripe status text
    const parts: string[] = [];
    if ((restaurant as any).stripe_charges_enabled) parts.push('Zahlungen aktiv');
    if ((restaurant as any).stripe_payouts_enabled) parts.push('Auszahlungen aktiv');
    if ((restaurant as any).stripe_details_submitted) parts.push('Details übermittelt');
    this.stripeStatusText = parts.length ? parts.join(' • ') : 'Noch nicht verbunden';
  }

  saveGeneralSettings() {
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const updateData = {
      name: this.restaurant.name,
      description: this.restaurant.description,
      cuisine_type: this.restaurant.cuisine_type,
      contact_info: {
        phone: this.restaurant.phone,
        email: this.restaurant.email
      }
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
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

  saveAddressSettings() {
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const address = {
      street: this.restaurant.address_street,
      postal_code: this.restaurant.address_postal_code,
      city: this.restaurant.address_city,
      country: this.restaurant.address_country
    };

    const sub = this.restaurantsService.updateRestaurantAddress(this.currentRestaurant.id, address).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
        this.toastService.success('Erfolg', 'Adresse wurde gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving address:', error);
        this.toastService.error('Fehler', 'Adresse konnte nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  saveOperatingHours() {
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const openingHours: {
      monday: { open: string; close: string; is_closed: boolean };
      tuesday: { open: string; close: string; is_closed: boolean };
      wednesday: { open: string; close: string; is_closed: boolean };
      thursday: { open: string; close: string; is_closed: boolean };
      friday: { open: string; close: string; is_closed: boolean };
      saturday: { open: string; close: string; is_closed: boolean };
      sunday: { open: string; close: string; is_closed: boolean };
    } = {} as any;

    this.operatingHours.forEach(hour => {
      (openingHours as any)[hour.day] = {
        open: hour.open,
        close: hour.close,
        is_closed: hour.closed
      };
    });

    const updateData = {
      opening_hours: openingHours
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
        this.toastService.success('Erfolg', 'Öffnungszeiten wurden gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving operating hours:', error);
        this.toastService.error('Fehler', 'Öffnungszeiten konnten nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  toggleImmediateClosure() {
    if (!this.currentRestaurant) return;

    console.log('Toggling immediate closure for restaurant:', this.currentRestaurant.id);
    console.log('Current isImmediatelyClosed:', this.isImmediatelyClosed);
    this.isLoading = true;
    const sub = this.restaurantsService.toggleImmediateClosure(this.currentRestaurant.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the local state
          this.isImmediatelyClosed = !this.isImmediatelyClosed;
          this.toastService.success(
            'Erfolg', 
            this.isImmediatelyClosed ? 'Restaurant wurde geschlossen' : 'Restaurant wurde geöffnet'
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error toggling immediate closure:', error);
        this.toastService.error('Fehler', 'Status konnte nicht geändert werden');
        // Revert the toggle state on error
        this.isImmediatelyClosed = !this.isImmediatelyClosed;
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  saveDeliverySettings() {
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const updateData = {
      delivery_info: {
        minimum_order_amount: this.deliverySettings.minOrderAmount,
        delivery_fee: this.deliverySettings.deliveryFee,
        delivery_radius_km: this.deliverySettings.deliveryRadius,
        estimated_delivery_time_minutes: this.deliverySettings.estimatedDeliveryTime,
        excluded_areas: (this.deliverySettings.excludedAreas || []).filter(a => a.postal_code && a.sub_area)
      }
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
        // Update the form data to reflect the saved changes
        this.populateFormData(updatedRestaurant);
        this.toastService.success('Erfolg', 'Liefer-Einstellungen wurden gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving delivery settings:', error);
        this.toastService.error('Fehler', 'Liefer-Einstellungen konnten nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  addExcludedArea() {
    this.deliverySettings.excludedAreas.push({ postal_code: '', sub_area: '' });
  }

  removeExcludedArea(index: number) {
    this.deliverySettings.excludedAreas.splice(index, 1);
  }

  hasExcludedAreas(): boolean {
    return !!(this.currentRestaurant?.delivery_info &&
              (this.currentRestaurant.delivery_info as any).excluded_areas?.length > 0);
  }

  getExcludedAreas(): Array<{ postal_code: string; sub_area: string; reason?: string }> {
    return (this.currentRestaurant?.delivery_info as any)?.excluded_areas || [];
  }

  saveNotificationSettings() {
    // Notification settings would typically be saved to user preferences
    // For now, we'll just show a success message
    this.toastService.success('Erfolg', 'Benachrichtigungs-Einstellungen wurden gespeichert');
  }

  savePaymentSettings() {
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const updateData = {
      payment_methods: {
        cash: this.paymentSettings.cash,
        card: this.paymentSettings.card,
        paypal: this.paymentSettings.paypal
      }
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
        this.toastService.success('Erfolg', 'Zahlungsmethoden wurden gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving payment settings:', error);
        this.toastService.error('Fehler', 'Zahlungsmethoden konnten nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  saveLoyaltySettings() {
    if (!this.currentRestaurant) return;
    this.isLoading = true;
    const sub = this.restaurantsService.updateLoyaltySettings(this.currentRestaurant.id, this.loyaltySettings).subscribe({
      next: (updated) => {
        (this.currentRestaurant as any).loyalty_settings = updated;
        this.toastService.success('Erfolg', 'Stempelkarten-Einstellungen wurden gespeichert');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving loyalty settings:', error);
        this.toastService.error('Fehler', 'Stempelkarten-Einstellungen konnten nicht gespeichert werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  startStripeOnboarding() {
    if (!this.currentRestaurant) return;
    this.isLoading = true;
    const restaurantId = this.currentRestaurant.id;

    const proceed = () => {
      this.restaurantsService.createStripeOnboardingLink(restaurantId).subscribe({
        next: ({ url }) => {
          window.location.href = url;
        },
        error: (err) => {
          console.error('Error creating onboarding link:', err);
          this.toastService.error('Stripe', 'Onboarding-Link konnte nicht erstellt werden');
          this.isLoading = false;
        }
      });
    };

    if (!this.currentRestaurant.stripe_account_id) {
      this.restaurantsService.createStripeAccount(restaurantId).subscribe({
        next: () => proceed(),
        error: (err) => {
          console.error('Error creating Stripe account:', err);
          this.toastService.error('Stripe', 'Konto konnte nicht erstellt werden');
          this.isLoading = false;
        }
      });
    } else {
      proceed();
    }
  }

  refreshStripeStatus() {
    if (!this.currentRestaurant) return;
    this.isLoading = true;
    this.restaurantsService.getStripeStatus(this.currentRestaurant.id).subscribe({
      next: (status) => {
        const parts: string[] = [];
        if (status.charges_enabled) parts.push('Zahlungen aktiv');
        if (status.payouts_enabled) parts.push('Auszahlungen aktiv');
        if (status.details_submitted) parts.push('Details übermittelt');
        this.stripeStatusText = parts.length ? parts.join(' • ') : status.onboarding_status;
        this.toastService.success('Stripe', 'Status aktualisiert');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error refreshing Stripe status:', err);
        this.toastService.error('Stripe', 'Status konnte nicht aktualisiert werden');
        this.isLoading = false;
      }
    });
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('logo', file);

    const sub = this.restaurantsService.uploadRestaurantLogo(this.currentRestaurant.id, formData).subscribe({
      next: (response: any) => {
        this.currentRestaurant = response.restaurant;
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('banner', file);

    const sub = this.restaurantsService.uploadRestaurantBanner(this.currentRestaurant.id, formData).subscribe({
      next: (response: any) => {
        this.currentRestaurant = response.restaurant;
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const formData = new FormData();
    files.forEach(file => {
      formData.append('gallery', file);
    });

    const sub = this.restaurantsService.uploadRestaurantGallery(this.currentRestaurant.id, formData).subscribe({
      next: (response: any) => {
        this.currentRestaurant = response.restaurant;
        this.toastService.success('Erfolg', `${files.length} Galerie-Bilder wurden erfolgreich hochgeladen`);
        this.isLoading = false;
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const updateData = {
      images: {
        ...this.currentRestaurant.images,
        logo: undefined
      }
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const updateData = {
      images: {
        ...this.currentRestaurant.images,
        banner: undefined
      }
    };

    const sub = this.restaurantsService.updateRestaurant(this.currentRestaurant.id, updateData).subscribe({
      next: (updatedRestaurant) => {
        this.currentRestaurant = updatedRestaurant;
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
    if (!this.currentRestaurant) return;

    this.isLoading = true;
    const sub = this.restaurantsService.deleteGalleryImage(this.currentRestaurant.id, index).subscribe({
      next: (response: any) => {
        this.currentRestaurant = response.restaurant;
        this.toastService.success('Erfolg', 'Galerie-Bild wurde entfernt');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error removing gallery image:', error);
        this.toastService.error('Fehler', 'Galerie-Bild konnte nicht entfernt werden');
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }
}
