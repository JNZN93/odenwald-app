import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-restaurant-manager-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

      <!-- Tab Content -->
      <div class="settings-content">
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
            </div>

            <div class="form-group">
              <label for="restaurantDescription">Beschreibung</label>
              <textarea id="restaurantDescription" [(ngModel)]="restaurant.description" name="description" rows="4"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="!generalForm.valid">
                <i class="fa-solid fa-save"></i>
                Speichern
              </button>
            </div>
          </form>
        </div>

        <!-- Operating Hours -->
        <div *ngIf="activeTab === 'hours'" class="settings-section">
          <h2>Öffnungszeiten</h2>
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
              <button type="submit" class="btn-primary">
                <i class="fa-solid fa-save"></i>
                Öffnungszeiten speichern
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

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="deliverySettings.isActive" name="isActive">
                <span class="checkmark"></span>
                Lieferung aktiv
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fa-solid fa-save"></i>
                Liefer-Einstellungen speichern
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
              <button type="submit" class="btn-primary">
                <i class="fa-solid fa-save"></i>
                Benachrichtigungen speichern
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
              <div class="method-grid">
                <div class="payment-method active">
                  <i class="fa-solid fa-credit-card"></i>
                  <span>Kreditkarte</span>
                </div>
                <div class="payment-method active">
                  <i class="fa-solid fa-building-columns"></i>
                  <span>Banküberweisung</span>
                </div>
                <div class="payment-method">
                  <i class="fa-solid fa-mobile-screen"></i>
                  <span>Mobile Payment</span>
                </div>
                <div class="payment-method">
                  <i class="fa-solid fa-wallet"></i>
                  <span>Digital Wallet</span>
                </div>
              </div>
            </div>
          </div>
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
      background: var(--color-muted-300);
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
      background: var(--color-primary-500);
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
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-4);
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
    }

    .payment-method.active {
      border-color: var(--color-success);
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .payment-method i {
      font-size: 1.25rem;
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
    }
  `]
})
export class RestaurantManagerSettingsComponent implements OnInit {
  activeTab: string = 'general';

  restaurant: any = {
    name: 'Bella Italia Restaurant',
    email: 'info@bella-italia.de',
    phone: '+49 123 456789',
    description: 'Authentische italienische Küche in gemütlicher Atmosphäre',
    cuisine_type: 'Italienisch'
  };

  settingsTabs = [
    { id: 'general', title: 'Allgemein', icon: 'fa-solid fa-info-circle' },
    { id: 'hours', title: 'Öffnungszeiten', icon: 'fa-solid fa-clock' },
    { id: 'delivery', title: 'Lieferung', icon: 'fa-solid fa-truck' },
    { id: 'notifications', title: 'Benachrichtigungen', icon: 'fa-solid fa-bell' },
    { id: 'payment', title: 'Zahlung', icon: 'fa-solid fa-credit-card' }
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
    isActive: true
  };

  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailySummary: true
  };

  ngOnInit() {
    // Component initialized with mock data
  }

  saveGeneralSettings() {
    console.log('Saving general settings:', this.restaurant);
    alert('Allgemeine Einstellungen wurden gespeichert (Mock-Funktionalität)');
  }

  saveOperatingHours() {
    console.log('Saving operating hours:', this.operatingHours);
    alert('Öffnungszeiten wurden gespeichert (Mock-Funktionalität)');
  }

  saveDeliverySettings() {
    console.log('Saving delivery settings:', this.deliverySettings);
    alert('Liefer-Einstellungen wurden gespeichert (Mock-Funktionalität)');
  }

  saveNotificationSettings() {
    console.log('Saving notification settings:', this.notificationSettings);
    alert('Benachrichtigungs-Einstellungen wurden gespeichert (Mock-Funktionalität)');
  }
}
