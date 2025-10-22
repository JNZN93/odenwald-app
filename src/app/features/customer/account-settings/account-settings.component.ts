import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountSettingsService, UserProfile, PasswordChangeRequest, AccountDeletionRequest } from '../../../core/services/account-settings.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PasswordChangeComponent } from '../../../shared/components/password-change.component';
import { UserDataService, DeliveryAddress } from '../../../core/services/user-data.service';

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
          (click)="switchTab(tab.id)"
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
            <div class="address-card" *ngFor="let address of savedAddresses; let i = index" [class.default-address]="address.is_default">
              <div class="address-info">
                <div class="address-header">
                  <h4>{{ address.name || 'Adresse ' + (i + 1) }}</h4>
                  <span class="default-badge" *ngIf="address.is_default">Standard</span>
                </div>
                <p class="address-street">{{ address.street }}</p>
                <p class="address-location">{{ address.postal_code }} {{ address.city }}</p>
                <p class="address-date" *ngIf="address.created_at">
                  <i class="fa-solid fa-calendar"></i>
                  Hinzugefügt: {{ address.created_at | date:'dd.MM.yyyy' }}
                </p>
              </div>
              <div class="address-actions">
                <button class="btn-ghost" (click)="setAsDefault(address)" *ngIf="!address.is_default" title="Als Standard setzen">
                  <i class="fa-solid fa-star"></i>
                  Standard
                </button>
                <button class="btn-ghost" (click)="editAddress(address)">
                  <i class="fa-solid fa-edit"></i>
                  Bearbeiten
                </button>
                <button class="btn-danger" (click)="deleteAddress(address)" [disabled]="address.is_default && savedAddresses.length === 1">
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
            <p class="address-hint">Adressen werden automatisch gespeichert, wenn Sie eine Bestellung aufgeben.</p>
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

        <!-- Password Settings -->
        <div *ngIf="activeTab === 'password'" class="settings-section">
          <h2>Passwort ändern</h2>
          <app-password-change (passwordChanged)="onPasswordChanged()"></app-password-change>
        </div>

        <!-- Account Deletion -->
        <div *ngIf="activeTab === 'delete'" class="settings-section">
          <h2>Account löschen</h2>
          <div class="danger-zone">
            <div class="danger-warning">
              <i class="fa-solid fa-exclamation-triangle"></i>
              <h3>Gefahrenbereich</h3>
              <p>Die Löschung Ihres Accounts ist <strong>unwiderruflich</strong>. Alle Ihre Daten werden dauerhaft entfernt.</p>
            </div>

            <div class="deletion-info">
              <h4>Was wird gelöscht:</h4>
              <ul>
                <li><i class="fa-solid fa-check"></i> Ihr Benutzerprofil und alle persönlichen Daten</li>
                <li><i class="fa-solid fa-check"></i> Alle gespeicherten Lieferadressen</li>
                <li><i class="fa-solid fa-check"></i> Ihre Bestellhistorie (für Compliance-Zwecke anonymisiert)</li>
                <li><i class="fa-solid fa-check"></i> Alle Bewertungen und Kommentare</li>
              </ul>
            </div>


            <form (ngSubmit)="deleteAccount()" #deletionForm="ngForm" class="deletion-form">
              <div class="form-group">
                <label for="deletionPassword">Passwort bestätigen *</label>
                <input 
                  id="deletionPassword" 
                  type="password" 
                  [(ngModel)]="deletionData.password" 
                  name="password"
                  required
                  [disabled]="isDeleting"
                  placeholder="Ihr aktuelles Passwort"
                >
                <small class="field-note">Geben Sie Ihr aktuelles Passwort ein, um die Löschung zu bestätigen</small>
              </div>

              <div class="form-group">
                <label for="deletionReason">Grund für die Löschung (optional)</label>
                <select 
                  id="deletionReason" 
                  [(ngModel)]="deletionData.reason" 
                  name="reason"
                  [disabled]="isDeleting"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="privacy_concerns">Datenschutzbedenken</option>
                  <option value="no_longer_needed">Account wird nicht mehr benötigt</option>
                  <option value="found_alternative">Alternative Lösung gefunden</option>
                  <option value="technical_issues">Technische Probleme</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="confirmDeletion" 
                    name="confirmDeletion"
                    required
                    [disabled]="isDeleting"
                  >
                  <span class="checkmark"></span>
                  <strong>Ich verstehe, dass die Löschung unwiderruflich ist und alle meine Daten dauerhaft entfernt werden</strong>
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="confirmDataLoss" 
                    name="confirmDataLoss"
                    required
                    [disabled]="isDeleting"
                  >
                  <span class="checkmark"></span>
                  <strong>Ich bestätige, dass ich alle wichtigen Daten gesichert habe</strong>
                </label>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-danger" [disabled]="!deletionForm.valid || !confirmDeletion || !confirmDataLoss || isDeleting">
                  <i class="fa-solid fa-spinner fa-spin" *ngIf="isDeleting"></i>
                  <i class="fa-solid fa-trash" *ngIf="!isDeleting"></i>
                  {{ isDeleting ? 'Account wird gelöscht...' : 'Account unwiderruflich löschen' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Address Modal -->
      <div *ngIf="showAddressModal" class="modal-overlay" (click)="closeAddressModal()">
        <div class="modal-content address-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingAddress ? 'Adresse bearbeiten' : 'Neue Adresse hinzufügen' }}</h3>
            <button class="close-btn" (click)="closeAddressModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveAddress()" #addressForm="ngForm">
              <div class="form-group">
                <label for="addressName">Name der Adresse (optional)</label>
                <input 
                  id="addressName" 
                  type="text" 
                  [(ngModel)]="currentAddress.name" 
                  name="name"
                  placeholder="z.B. Zuhause, Arbeit, etc."
                >
              </div>

              <div class="form-group">
                <label for="addressStreet">Straße und Hausnummer *</label>
                <input 
                  id="addressStreet" 
                  type="text" 
                  [(ngModel)]="currentAddress.street" 
                  name="street"
                  placeholder="Musterstraße 123"
                  required
                >
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="addressCity">Stadt *</label>
                  <input 
                    id="addressCity" 
                    type="text" 
                    [(ngModel)]="currentAddress.city" 
                    name="city"
                    placeholder="Musterstadt"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="addressPostalCode">PLZ *</label>
                  <input 
                    id="addressPostalCode" 
                    type="text" 
                    [(ngModel)]="currentAddress.postal_code" 
                    name="postal_code"
                    placeholder="12345"
                    required
                  >
                </div>
              </div>


              <div class="form-group" *ngIf="!editingAddress">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="setAsDefaultAddress" 
                    name="setAsDefault"
                  >
                  <span class="checkmark"></span>
                  Als Standard-Adresse setzen
                </label>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeAddressModal()">Abbrechen</button>
                <button type="submit" class="btn-primary" [disabled]="!addressForm.valid || isSaving">
                  <i class="fa-solid fa-spinner fa-spin" *ngIf="isSaving"></i>
                  <i class="fa-solid fa-save" *ngIf="!isSaving"></i>
                  {{ isSaving ? 'Wird gespeichert...' : 'Speichern' }}
                </button>
              </div>
            </form>
          </div>
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

    /* Address Management Styles */
    .address-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .address-header h4 {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .address-street {
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-1) 0;
    }

    .address-location {
      color: var(--color-muted);
      margin: 0 0 var(--space-2) 0;
    }

    .address-date {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: var(--space-2) 0 0 0;
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .address-date i {
      font-size: var(--text-xs);
    }

    .address-hint {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-style: italic;
      margin-top: var(--space-2);
    }

    .default-address {
      border: 2px solid var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
    }

    .default-address .address-header h4::after {
      content: ' ⭐';
      color: var(--color-warning);
    }

    /* Address Modal Styles */
    .address-modal .modal-content {
      max-width: 600px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      font-weight: 500;
      color: var(--color-text);
    }

    .checkbox-label input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
      background: white;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      color: white;
      font-size: var(--text-sm);
      font-weight: bold;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
      margin-top: var(--space-6);
    }

    .btn-secondary {
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-surface);
      border-color: var(--color-primary-300);
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

      .form-row {
        grid-template-columns: 1fr;
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

      .address-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .modal-actions {
        flex-direction: column;
        gap: var(--space-2);
      }

      .btn-secondary,
      .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }

    /* Account Deletion Styles */
    .danger-zone {
      border: 2px solid var(--color-danger);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      background: color-mix(in oklab, var(--color-danger) 5%, white);
    }

    .danger-warning {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: color-mix(in oklab, var(--color-danger) 10%, white);
      border-radius: var(--radius-lg);
      border-left: 4px solid var(--color-danger);
    }

    .danger-warning i {
      font-size: var(--text-xl);
      color: var(--color-danger);
    }

    .danger-warning h3 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-danger);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .danger-warning p {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .deletion-info {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
    }

    .deletion-info h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-text);
      font-size: var(--text-base);
      font-weight: 600;
    }

    .deletion-info ul {
      margin: 0;
      padding-left: var(--space-6);
    }

    .deletion-info li {
      margin-bottom: var(--space-2);
      color: var(--color-text);
      font-size: var(--text-sm);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .deletion-info li i {
      color: var(--color-danger);
      font-size: var(--text-xs);
      width: 12px;
    }

    .deletion-form {
      margin-top: var(--space-6);
    }

    .deletion-form .form-group {
      margin-bottom: var(--space-4);
    }

    .deletion-form select {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      background: white;
      width: 100%;
    }

    .deletion-form select:focus {
      outline: none;
      border-color: var(--color-danger);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-danger) 15%, transparent);
    }

    .deletion-form .form-actions {
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 2px solid var(--color-danger);
    }

    .deletion-form .btn-danger {
      background: var(--color-danger);
      color: white;
      border: none;
      padding: var(--space-4) var(--space-6);
      font-size: var(--text-base);
      font-weight: 600;
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-danger) 25%, transparent);
    }

    .deletion-form .btn-danger:hover:not(:disabled) {
      background: var(--color-danger-700);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-danger) 35%, transparent);
    }

    .deletion-form .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Responsive Account Deletion */
    @media (max-width: 768px) {
      .danger-zone {
        padding: var(--space-4);
      }

      .danger-warning {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }


      .deletion-info {
        padding: var(--space-3);
      }
    }
  `]
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  private accountSettingsService = inject(AccountSettingsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userDataService = inject(UserDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptions: Subscription[] = [];

  activeTab: string = 'personal';
  isLoading: boolean = false;
  isSaving: boolean = false;

  // Account deletion properties
  isDeleting: boolean = false;
  deletionData: AccountDeletionRequest = {
    password: '',
    reason: ''
  };
  confirmDeletion: boolean = false;
  confirmDataLoss: boolean = false;

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

  savedAddresses: DeliveryAddress[] = [];
  savedPaymentMethods: any[] = [];

  // Address modal properties
  showAddressModal: boolean = false;
  editingAddress: DeliveryAddress | null = null;
  currentAddress: DeliveryAddress = {
    street: '',
    city: '',
    postal_code: '',
    name: '',
    instructions: ''
  };
  setAsDefaultAddress: boolean = false;

  settingsTabs = [
    { id: 'personal', title: 'Persönliche Daten', icon: 'fa-solid fa-user' },
    { id: 'addresses', title: 'Lieferadressen', icon: 'fa-solid fa-map-marker-alt' },
    { id: 'payment', title: 'Zahlungsmethoden', icon: 'fa-solid fa-credit-card' },
    { id: 'password', title: 'Passwort', icon: 'fa-solid fa-lock' },
    { id: 'delete', title: 'Account löschen', icon: 'fa-solid fa-trash' }
  ];

  ngOnInit() {
    // Check for tab query parameter
    const tabQueryParam = this.route.snapshot.queryParams['tab'];
    if (tabQueryParam && this.settingsTabs.some(tab => tab.id === tabQueryParam)) {
      this.activeTab = tabQueryParam;
    }
    
    // Listen for route changes to update active tab
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        if (params['tab'] && this.settingsTabs.some(tab => tab.id === params['tab'])) {
          this.activeTab = params['tab'];
        }
      })
    );
    
    this.loadUserProfile();
    this.loadSavedAddresses();
  }

  switchTab(tabId: string) {
    this.activeTab = tabId;
    // Update URL with tab parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserProfile() {
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

    this.subscriptions.push(profileSub);
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


  onPasswordChanged() {
    this.toastService.show('success', 'Passwort erfolgreich geändert', 'Ihr Passwort wurde erfolgreich aktualisiert.');
  }

  // Address Management Methods
  loadSavedAddresses(): void {
    this.savedAddresses = this.userDataService.getDeliveryAddresses();
  }

  addNewAddress(): void {
    this.editingAddress = null;
    this.currentAddress = {
      street: '',
      city: '',
      postal_code: '',
      name: '',
    };
    this.setAsDefaultAddress = false;
    this.showAddressModal = true;
  }

  editAddress(address: DeliveryAddress): void {
    this.editingAddress = address;
    this.currentAddress = { ...address };
    this.setAsDefaultAddress = false;
    this.showAddressModal = true;
  }

  deleteAddress(address: DeliveryAddress): void {
    if (address.is_default && this.savedAddresses.length === 1) {
      this.toastService.show('error', 'Standard-Adresse kann nicht gelöscht werden', 'Es muss mindestens eine Adresse vorhanden sein.');
      return;
    }

    if (confirm(`Möchten Sie die Adresse "${address.name || address.street}" wirklich löschen?`)) {
      this.userDataService.deleteDeliveryAddress(address.id!);
      this.loadSavedAddresses();
      this.toastService.show('success', 'Adresse gelöscht', 'Die Adresse wurde erfolgreich entfernt.');
    }
  }

  setAsDefault(address: DeliveryAddress): void {
    this.userDataService.setDefaultAddress(address.id!);
    this.loadSavedAddresses();
    this.toastService.show('success', 'Standard-Adresse gesetzt', `"${address.name || address.street}" ist jetzt Ihre Standard-Adresse.`);
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.editingAddress = null;
    this.currentAddress = {
      street: '',
      city: '',
      postal_code: '',
      name: '',
    };
    this.setAsDefaultAddress = false;
  }

  saveAddress(): void {
    if (!this.currentAddress.street.trim() || !this.currentAddress.city.trim() || !this.currentAddress.postal_code.trim()) {
      this.toastService.show('error', 'Pflichtfelder ausfüllen', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    this.isSaving = true;

    try {
      if (this.editingAddress) {
        // Update existing address
        this.userDataService.updateDeliveryAddress(this.editingAddress.id!, {
          ...this.currentAddress,
          street: this.currentAddress.street.trim(),
          city: this.currentAddress.city.trim(),
          postal_code: this.currentAddress.postal_code.trim(),
          name: this.currentAddress.name?.trim() || undefined,
        });
        this.toastService.show('success', 'Adresse aktualisiert', 'Die Adresse wurde erfolgreich bearbeitet.');
      } else {
        // Add new address
        const newAddress: DeliveryAddress = {
          ...this.currentAddress,
          street: this.currentAddress.street.trim(),
          city: this.currentAddress.city.trim(),
          postal_code: this.currentAddress.postal_code.trim(),
          name: this.currentAddress.name?.trim() || undefined,
          is_default: this.setAsDefaultAddress
        };

        this.userDataService.addDeliveryAddress(newAddress);

        if (this.setAsDefaultAddress) {
          this.userDataService.setDefaultAddress(newAddress.id!);
        }

        this.toastService.show('success', 'Adresse hinzugefügt', 'Die neue Adresse wurde erfolgreich gespeichert.');
      }

      this.loadSavedAddresses();
      this.closeAddressModal();
    } catch (error) {
      console.error('Error saving address:', error);
      this.toastService.show('error', 'Fehler beim Speichern', 'Die Adresse konnte nicht gespeichert werden.');
    } finally {
      this.isSaving = false;
    }
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

  // Account Deletion Methods
  deleteAccount(): void {
    if (!this.deletionData.password.trim()) {
      this.toastService.show('error', 'Passwort erforderlich', 'Bitte geben Sie Ihr aktuelles Passwort ein.');
      return;
    }

    if (!this.confirmDeletion || !this.confirmDataLoss) {
      this.toastService.show('error', 'Bestätigung erforderlich', 'Bitte bestätigen Sie alle Checkboxen.');
      return;
    }

    // Final confirmation dialog
    const confirmMessage = `Sind Sie sicher, dass Sie Ihren Account unwiderruflich löschen möchten?\n\nDiese Aktion kann nicht rückgängig gemacht werden und alle Ihre Daten werden dauerhaft entfernt.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isDeleting = true;

    this.accountSettingsService.deleteAccount(this.deletionData).subscribe({
      next: (response) => {
        this.toastService.show('success', 'Account erfolgreich gelöscht', 'Ihr Account wurde erfolgreich gelöscht.');
        
        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Logout and redirect to login
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/auth/login'], { 
            queryParams: { message: 'account_deleted' } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.toastService.show('error', 'Fehler beim Löschen des Accounts', 'Der Account konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
        this.isDeleting = false;
      }
    });
  }
}
