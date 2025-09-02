import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { AuthService, User } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface PaymentMethod {
  id: 'cash' | 'card' | 'paypal';
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-restaurant-manager-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="payment-methods-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <button class="back-btn" routerLink="/restaurant-manager/settings">
            <i class="fa-solid fa-arrow-left"></i>
            Zurück zu Einstellungen
          </button>
          <h1>Zahlungsmethoden</h1>
          <p>Konfigurieren Sie die Zahlungsmethoden, die Ihren Kunden zur Verfügung stehen</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Zahlungsmethoden werden geladen...</p>
        </div>
      </div>

      <!-- Payment Methods Settings -->
      <div *ngIf="!isLoading" class="content-section">
        <div class="payment-methods-grid">
          <div
            *ngFor="let method of paymentMethods"
            class="payment-method-card"
            [class.enabled]="method.enabled"
            [class.disabled]="!method.enabled"
          >
            <div class="method-header">
              <div class="method-icon">
                <i [class]="method.icon"></i>
              </div>
              <div class="method-info">
                <h3>{{ method.label }}</h3>
                <p>{{ method.description }}</p>
              </div>
              <div class="method-toggle">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    [(ngModel)]="method.enabled"
                    (change)="onPaymentMethodToggle(method)"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="method-details">
              <div class="detail-item" *ngIf="method.id === 'cash'">
                <i class="fa-solid fa-info-circle"></i>
                <span>Kunden zahlen bar bei Lieferung an den Fahrer</span>
              </div>
              <div class="detail-item" *ngIf="method.id === 'card'">
                <i class="fa-solid fa-credit-card"></i>
                <span>Sichere Online-Zahlung mit Kreditkarte über Stripe</span>
              </div>
              <div class="detail-item" *ngIf="method.id === 'paypal'">
                <i class="fa-brands fa-paypal"></i>
                <span>Schnelle Zahlung über PayPal-Konto</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="save-section">
          <button
            class="save-btn"
            (click)="savePaymentMethods()"
            [disabled]="!hasChanges() || isSaving"
          >
            <span *ngIf="!isSaving">
              <i class="fa-solid fa-save"></i>
              Änderungen speichern
            </span>
            <span *ngIf="isSaving">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Wird gespeichert...
            </span>
          </button>

          <p class="save-info">
            * Änderungen werden sofort wirksam und sind für alle Kunden sichtbar
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-methods-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: var(--space-8);
    }

    .header-content {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition);
      margin-bottom: var(--space-4);
    }

    .back-btn:hover {
      background: var(--color-surface);
      transform: translateY(-2px);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16);
      text-align: center;
    }

    .loading-spinner {
      color: var(--color-primary);
    }

    .loading-spinner i {
      font-size: var(--text-4xl);
      margin-bottom: var(--space-4);
    }

    .content-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .payment-methods-grid {
      display: grid;
      gap: var(--space-6);
    }

    .payment-method-card {
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      transition: all var(--transition);
    }

    .payment-method-card.enabled {
      border-color: var(--color-success);
      background: color-mix(in oklab, var(--color-success) 5%, var(--color-surface));
    }

    .payment-method-card.disabled {
      border-color: var(--color-border);
      opacity: 0.7;
    }

    .method-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .method-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-2xl);
      color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      flex-shrink: 0;
    }

    .method-info {
      flex: 1;
    }

    .method-info h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .method-info p {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .method-toggle {
      flex-shrink: 0;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .toggle-switch input {
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
      background-color: var(--color-border);
      transition: 0.4s;
      border-radius: 34px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: var(--color-success);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(26px);
    }

    .method-details {
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .detail-item i {
      color: var(--color-primary);
      width: 16px;
    }

    .save-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .save-btn {
      padding: var(--space-4) var(--space-8);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      color: white;
      font-weight: 600;
      font-size: var(--text-lg);
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .save-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .save-info {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    @media (max-width: 768px) {
      .payment-methods-container {
        padding: var(--space-4);
      }

      .method-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .method-icon {
        align-self: center;
      }

      .method-toggle {
        align-self: center;
      }
    }
  `]
})
export class RestaurantManagerPaymentMethodsComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isLoading = true;
  isSaving = false;
  currentUser: User | null = null;
  managedRestaurants: RestaurantDTO[] = [];
  selectedRestaurantId: string | null = null;

  paymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      label: 'Barzahlung',
      description: 'Kunden zahlen bar bei Lieferung',
      icon: 'fa-solid fa-money-bill-wave',
      enabled: true
    },
    {
      id: 'card',
      label: 'Kreditkarte',
      description: 'Online-Zahlung mit Kreditkarte',
      icon: 'fa-solid fa-credit-card',
      enabled: true
    },
    {
      id: 'paypal',
      label: 'PayPal',
      description: 'Zahlung über PayPal-Konto',
      icon: 'fa-brands fa-paypal',
      enabled: false
    }
  ];

  originalPaymentMethods: PaymentMethod[] = [];

  ngOnInit() {
    this.loadData();
  }

  private async loadData() {
    this.isLoading = true;

    try {
      // Get current user
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (this.currentUser) {
          this.loadRestaurantsForUser();
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.error('Fehler', 'Fehler beim Laden der Daten');
      this.isLoading = false;
    }
  }

  private async loadRestaurantsForUser() {
    if (!this.currentUser) return;

    try {
      // Load managed restaurants
      const restaurants = await this.restaurantsService.getRestaurantsByManager(this.currentUser.id).toPromise();

      if (restaurants && restaurants.length > 0) {
        this.managedRestaurants = restaurants;

        // Select first restaurant by default
        this.selectedRestaurantId = restaurants[0].id;
        await this.loadPaymentMethodsForRestaurant(this.selectedRestaurantId);
      } else {
        this.toastService.warning('Keine Restaurants', 'Sie verwalten keine Restaurants');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.error('Fehler', 'Fehler beim Laden der Daten');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadPaymentMethodsForRestaurant(restaurantId: string) {
    try {
      const restaurant = await this.restaurantsService.getRestaurantById(restaurantId).toPromise() as any;

      if (restaurant && restaurant.payment_methods) {
        // Update payment methods with restaurant settings
        this.paymentMethods = this.paymentMethods.map(method => ({
          ...method,
          enabled: restaurant.payment_methods[method.id] || false
        }));

        // Store original state for change detection
        this.originalPaymentMethods = JSON.parse(JSON.stringify(this.paymentMethods));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      this.toastService.error('Fehler', 'Fehler beim Laden der Zahlungsmethoden');
    }
  }

  onPaymentMethodToggle(method: PaymentMethod) {
    // Method state is already updated via ngModel
    console.log(`${method.label} ${method.enabled ? 'aktiviert' : 'deaktiviert'}`);
  }

  hasChanges(): boolean {
    return JSON.stringify(this.paymentMethods) !== JSON.stringify(this.originalPaymentMethods);
  }

  async savePaymentMethods() {
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Kein Restaurant ausgewählt');
      return;
    }

    this.isSaving = true;

    try {
      const paymentMethodsData = {
        cash: this.paymentMethods.find(m => m.id === 'cash')?.enabled || false,
        card: this.paymentMethods.find(m => m.id === 'card')?.enabled || false,
        paypal: this.paymentMethods.find(m => m.id === 'paypal')?.enabled || false
      };

      await this.restaurantsService.updateRestaurantPaymentMethods(this.selectedRestaurantId, paymentMethodsData).toPromise();

      // Update original state
      this.originalPaymentMethods = JSON.parse(JSON.stringify(this.paymentMethods));

      this.toastService.success('Erfolgreich', 'Zahlungsmethoden wurden gespeichert');

    } catch (error) {
      console.error('Error saving payment methods:', error);
      this.toastService.error('Fehler', 'Fehler beim Speichern der Zahlungsmethoden');
    } finally {
      this.isSaving = false;
    }
  }

  onRestaurantChange(restaurantId: string) {
    this.selectedRestaurantId = restaurantId;
    this.loadPaymentMethodsForRestaurant(restaurantId);
  }
}
