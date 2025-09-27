import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountSettingsService, UserProfile, CustomerSettings, PasswordChangeRequest } from '../../../core/services/account-settings.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PasswordChangeComponent } from '../../../shared/components/password-change.component';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordChangeComponent],
  template: `
    <div class="account-settings-container">
      <!-- Header -->
      <div class="settings-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
          Zurück
        </button>
        <h1>Kontoeinstellungen</h1>
        <p>Verwalten Sie Ihre persönlichen Daten und Einstellungen</p>
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
      <div *ngIf="isLoading && !userProfile" class="loading-container">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Daten werden geladen...</p>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="settings-content" *ngIf="!isLoading || userProfile">
        <!-- Personal Information -->
        <div *ngIf="activeTab === 'personal'" class="settings-section">
          <h2>Persönliche Daten</h2>
          <form (ngSubmit)="savePersonalInfo()" #personalForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="userName">Name *</label>
                <input 
                  id="userName" 
                  type="text" 
                  [(ngModel)]="userProfile.name" 
                  name="name" 
                  required
                  [disabled]="isSaving"
                >
              </div>

              <div class="form-group">
                <label for="userEmail">E-Mail</label>
                <input 
                  id="userEmail" 
                  type="email" 
                  [value]="userProfile.email" 
                  disabled
                  class="disabled-field"
                >
                <small class="field-note">E-Mail kann nicht geändert werden</small>
              </div>

              <div class="form-group">
                <label for="userPhone">Telefon</label>
                <input 
                  id="userPhone" 
                  type="tel" 
                  [(ngModel)]="userProfile.phone" 
                  name="phone"
                  [disabled]="isSaving"
                  placeholder="+49 123 456789"
                >
              </div>

              <div class="form-group full-width">
                <label for="userAddress">Adresse</label>
                <textarea 
                  id="userAddress" 
                  [(ngModel)]="userProfile.address" 
                  name="address"
                  [disabled]="isSaving"
                  rows="3"
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="!personalForm.valid || isSaving">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isSaving"></i>
                <i class="fa-solid fa-save" *ngIf="!isSaving"></i>
                {{ isSaving ? 'Wird gespeichert...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Address Management -->
        <div *ngIf="activeTab === 'addresses'" class="settings-section">
          <h2>Lieferadressen</h2>
          <p class="section-description">Verwalten Sie Ihre gespeicherten Lieferadressen für schnelle Bestellungen.</p>
          
          <div class="addresses-list" *ngIf="savedAddresses.length > 0">
            <div class="address-card" *ngFor="let address of savedAddresses; let i = index">
              <div class="address-info">
                <h4>{{ address.name || 'Adresse ' + (i + 1) }}</h4>
                <p>{{ address.street }}</p>
                <p>{{ address.postalCode }} {{ address.city }}</p>
                <p *ngIf="address.instructions" class="instructions">{{ address.instructions }}</p>
              </div>
              <div class="address-actions">
                <button class="btn-ghost" (click)="editAddress(address, i)">
                  <i class="fa-solid fa-edit"></i>
                  Bearbeiten
                </button>
                <button class="btn-danger" (click)="deleteAddress(i)">
                  <i class="fa-solid fa-trash"></i>
                  Löschen
                </button>
              </div>
            </div>
          </div>

          <div class="no-addresses" *ngIf="savedAddresses.length === 0">
            <i class="fa-solid fa-map-marker-alt"></i>
            <h3>Keine gespeicherten Adressen</h3>
            <p>Fügen Sie Ihre erste Lieferadresse hinzu, um schneller bestellen zu können.</p>
          </div>

          <button class="btn-primary" (click)="addNewAddress()">
            <i class="fa-solid fa-plus"></i>
            Neue Adresse hinzufügen
          </button>
        </div>

        <!-- Payment Methods -->
        <div *ngIf="activeTab === 'payment'" class="settings-section">
          <h2>Zahlungsmethoden</h2>
          <p class="section-description">Verwalten Sie Ihre gespeicherten Zahlungsmethoden für schnelle Bestellungen.</p>
          
          <div class="payment-methods-list" *ngIf="savedPaymentMethods.length > 0">
            <div class="payment-card" *ngFor="let payment of savedPaymentMethods; let i = index">
              <div class="payment-info">
                <i [ngClass]="getPaymentIcon(payment.type)"></i>
                <div class="payment-details">
                  <h4>{{ getPaymentTypeLabel(payment.type) }}</h4>
                  <p *ngIf="payment.type === 'credit_card'">{{ payment.cardNumber }}</p>
                  <p *ngIf="payment.type === 'paypal'">{{ payment.email }}</p>
                  <p *ngIf="payment.isDefault" class="default-badge">Standard</p>
                </div>
              </div>
              <div class="payment-actions">
                <button class="btn-ghost" (click)="editPaymentMethod(payment, i)">
                  <i class="fa-solid fa-edit"></i>
                  Bearbeiten
                </button>
                <button class="btn-danger" (click)="deletePaymentMethod(i)">
                  <i class="fa-solid fa-trash"></i>
                  Löschen
                </button>
              </div>
            </div>
          </div>

          <div class="no-payment-methods" *ngIf="savedPaymentMethods.length === 0">
            <i class="fa-solid fa-credit-card"></i>
            <h3>Keine gespeicherten Zahlungsmethoden</h3>
            <p>Fügen Sie Ihre erste Zahlungsmethode hinzu, um schneller bestellen zu können.</p>
          </div>

          <button class="btn-primary" (click)="addNewPaymentMethod()">
            <i class="fa-solid fa-plus"></i>
            Neue Zahlungsmethode hinzufügen
          </button>
        </div>

        <!-- Notifications -->
        <div *ngIf="activeTab === 'notifications'" class="settings-section">
          <h2>Benachrichtigungen</h2>
          <form (ngSubmit)="saveNotificationSettings()" #notificationForm="ngForm">
            <div class="notification-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>E-Mail-Benachrichtigungen</h4>
                  <p>Erhalten Sie E-Mails bei Bestellungen und wichtigen Updates</p>
                </div>
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="customerSettings.email_notifications" 
                    name="emailNotifications"
                    [disabled]="isSaving"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>SMS-Benachrichtigungen</h4>
                  <p>Erhalten Sie SMS bei dringenden Bestellungen</p>
                </div>
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="customerSettings.sms_notifications" 
                    name="smsNotifications"
                    [disabled]="isSaving"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Push-Benachrichtigungen</h4>
                  <p>Browser-Benachrichtigungen für neue Bestellungen</p>
                </div>
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="customerSettings.push_notifications" 
                    name="pushNotifications"
                    [disabled]="isSaving"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Wöchentliche Zusammenfassung</h4>
                  <p>Wöchentliche Übersicht Ihrer Bestellungen</p>
                </div>
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="customerSettings.weekly_summary" 
                    name="weeklySummary"
                    [disabled]="isSaving"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Marketing-E-Mails</h4>
                  <p>Erhalten Sie Angebote und Neuigkeiten</p>
                </div>
                <label class="toggle">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="customerSettings.marketing_emails" 
                    name="marketingEmails"
                    [disabled]="isSaving"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isSaving">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isSaving"></i>
                <i class="fa-solid fa-save" *ngIf="!isSaving"></i>
                {{ isSaving ? 'Wird gespeichert...' : 'Benachrichtigungen speichern' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Password Settings -->
        <div *ngIf="activeTab === 'password'" class="settings-section">
          <h2>Passwort ändern</h2>
          <app-password-change (passwordChanged)="onPasswordChanged()"></app-password-change>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-settings-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    .settings-header {
      margin-bottom: var(--space-8);
      text-align: center;
      position: relative;
    }

    .back-btn {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .back-btn:hover {
      background: var(--bg-light);
      border-color: var(--color-primary);
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
      overflow-x: auto;
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
      white-space: nowrap;
      min-width: fit-content;
    }

    .tab-button:hover {
      color: var(--color-text);
      background: var(--bg-light);
    }

    .tab-button.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
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

    .section-description {
      color: var(--color-muted);
      margin-bottom: var(--space-6);
      font-size: var(--text-base);
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

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .form-group input,
    .form-group textarea {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      transition: all var(--transition);
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .form-group input:disabled,
    .form-group textarea:disabled {
      background: var(--bg-light);
      color: var(--color-muted);
      cursor: not-allowed;
    }

    .disabled-field {
      background: var(--bg-light) !important;
      color: var(--color-muted) !important;
    }

    .field-note {
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
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
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-ghost {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .btn-ghost:hover {
      background: var(--bg-light);
    }

    .btn-danger {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: none;
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .btn-danger:hover {
      background: var(--color-danger);
      color: white;
    }

    /* Address and Payment Cards */
    .addresses-list,
    .payment-methods-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .address-card,
    .payment-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--bg-light);
    }

    .address-info,
    .payment-info {
      flex: 1;
    }

    .address-info h4,
    .payment-info h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .address-info p,
    .payment-info p {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .instructions {
      font-style: italic;
      color: var(--color-primary);
    }

    .default-badge {
      background: var(--color-primary);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
      display: inline-block;
    }

    .payment-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .payment-info i {
      font-size: var(--text-xl);
      color: var(--color-primary);
    }

    .payment-details {
      flex: 1;
    }

    .address-actions,
    .payment-actions {
      display: flex;
      gap: var(--space-2);
    }

    /* No Data States */
    .no-addresses,
    .no-payment-methods {
      text-align: center;
      padding: var(--space-12) 0;
      color: var(--color-muted);
    }

    .no-addresses i,
    .no-payment-methods i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .no-addresses h3,
    .no-payment-methods h3 {
      font-size: var(--text-xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
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
      background: var(--color-primary);
      border-color: var(--color-primary-700);
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
      color: var(--color-primary);
    }

    .loading-spinner p {
      margin: 0;
      font-size: var(--text-lg);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .account-settings-container {
        padding: var(--space-4) 0;
      }

      .settings-header {
        text-align: center;
      }

      .back-btn {
        position: static;
        margin-bottom: var(--space-4);
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

      .address-card,
      .payment-card {
        flex-direction: column;
        gap: var(--space-4);
      }

      .address-actions,
      .payment-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  private accountSettingsService = inject(AccountSettingsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptions: Subscription[] = [];

  activeTab: string = 'personal';
  isLoading: boolean = false;
  isSaving: boolean = false;

  userProfile: UserProfile = {
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'customer',
    is_active: true,
    is_email_verified: false,
    auth_provider: 'local',
    created_at: '',
    updated_at: ''
  };

  customerSettings: CustomerSettings = {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    weekly_summary: true,
    marketing_emails: false
  };

  savedAddresses: any[] = [];
  savedPaymentMethods: any[] = [];

  settingsTabs = [
    { id: 'personal', title: 'Persönliche Daten', icon: 'fa-solid fa-user' },
    { id: 'addresses', title: 'Lieferadressen', icon: 'fa-solid fa-map-marker-alt' },
    { id: 'payment', title: 'Zahlungsmethoden', icon: 'fa-solid fa-credit-card' },
    { id: 'notifications', title: 'Benachrichtigungen', icon: 'fa-solid fa-bell' },
    { id: 'password', title: 'Passwort', icon: 'fa-solid fa-lock' }
  ];

  ngOnInit() {
    // Check for tab query parameter
    const tabQueryParam = this.route.snapshot.queryParams['tab'];
    if (tabQueryParam && this.settingsTabs.some(tab => tab.id === tabQueryParam)) {
      this.activeTab = tabQueryParam;
    }
    
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.isLoading = true;

    // Load user profile
    const profileSub = this.accountSettingsService.loadUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.toastService.show('error', 'Fehler beim Laden der Benutzerdaten', 'Die Benutzerdaten konnten nicht geladen werden.');
        this.isLoading = false;
      }
    });

    // Load customer settings
    const settingsSub = this.accountSettingsService.loadCustomerSettings().subscribe({
      next: (response) => {
        this.customerSettings = response.settings;
      },
      error: (error) => {
        console.error('Error loading customer settings:', error);
        // Don't show error for settings as they might not exist yet
      }
    });

    this.subscriptions.push(profileSub, settingsSub);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  savePersonalInfo() {
    if (!this.userProfile.name.trim()) {
      this.toastService.show('error', 'Bitte geben Sie einen Namen ein', 'Der Name ist ein Pflichtfeld.');
      return;
    }

    this.isSaving = true;
    const updateData = {
      name: this.userProfile.name.trim(),
      phone: this.userProfile.phone?.trim() || '',
      address: this.userProfile.address?.trim() || ''
    };

    this.accountSettingsService.updateUserProfile(updateData).subscribe({
      next: (response) => {
        this.toastService.show('success', 'Persönliche Daten erfolgreich aktualisiert', 'Ihre Daten wurden erfolgreich gespeichert.');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toastService.show('error', 'Fehler beim Aktualisieren der Daten', 'Die Daten konnten nicht aktualisiert werden.');
        this.isSaving = false;
      }
    });
  }

  saveNotificationSettings() {
    this.isSaving = true;

    this.accountSettingsService.updateCustomerSettings(this.customerSettings).subscribe({
      next: (response) => {
        this.toastService.show('success', 'Benachrichtigungseinstellungen erfolgreich aktualisiert', 'Ihre Einstellungen wurden gespeichert.');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating settings:', error);
        this.toastService.show('error', 'Fehler beim Aktualisieren der Einstellungen', 'Die Einstellungen konnten nicht gespeichert werden.');
        this.isSaving = false;
      }
    });
  }

  onPasswordChanged() {
    this.toastService.show('success', 'Passwort erfolgreich geändert', 'Ihr Passwort wurde erfolgreich aktualisiert.');
  }

  // Address Management Methods
  addNewAddress() {
    // TODO: Implement address management modal
    this.toastService.show('info', 'Adressverwaltung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  editAddress(address: any, index: number) {
    // TODO: Implement address editing modal
    this.toastService.show('info', 'Adressbearbeitung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  deleteAddress(index: number) {
    // TODO: Implement address deletion
    this.toastService.show('info', 'Adresslöschung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  // Payment Methods Management
  addNewPaymentMethod() {
    // TODO: Implement payment method management modal
    this.toastService.show('info', 'Zahlungsmethodenverwaltung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  editPaymentMethod(payment: any, index: number) {
    // TODO: Implement payment method editing modal
    this.toastService.show('info', 'Zahlungsmethodenbearbeitung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  deletePaymentMethod(index: number) {
    // TODO: Implement payment method deletion
    this.toastService.show('info', 'Zahlungsmethodenlöschung wird in Kürze verfügbar sein', 'Diese Funktion wird bald implementiert.');
  }

  getPaymentIcon(type: string): string {
    switch (type) {
      case 'credit_card': return 'fa-solid fa-credit-card';
      case 'paypal': return 'fa-brands fa-paypal';
      case 'sepa': return 'fa-solid fa-university';
      default: return 'fa-solid fa-money-bill';
    }
  }

  getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'credit_card': return 'Kreditkarte';
      case 'paypal': return 'PayPal';
      case 'sepa': return 'SEPA-Lastschrift';
      default: return 'Unbekannt';
    }
  }
}
