import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CartService, Cart, CartItem } from '../../core/services/supplier.service';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { LoadingService } from '../../core/services/loading.service';
import { UserDataService } from '../../core/services/user-data.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { MenuItemVariantsModalComponent } from '../restaurants/menu-item-variants-modal.component';
import { DeliverySlotsComponent } from '../../shared/components/delivery-slots.component';
import { DeliverySlotsService, DeliverySlot } from '../../core/services/delivery-slots.service';
import { Observable, map } from 'rxjs';

interface DeliveryAddress {
  id?: string;
  name?: string;
  street: string;
  city: string;
  postal_code: string;
  instructions?: string;
  is_default?: boolean;
  created_at?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface MenuItemWithVariants {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  category_id: string | null;
  image_url?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  variants?: MenuItemVariant[];
}

interface MenuItemVariant {
  id: string;
  name: string;
  is_required: boolean;
  min_selections?: number;
  max_selections?: number;
  options: MenuItemVariantOption[];
}

interface MenuItemVariantOption {
  id: string;
  name: string;
  price_modifier_cents: number;
  is_available: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuItemVariantsModalComponent, DeliverySlotsComponent],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('200ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  template: `
    <div class="checkout-container">
      <div class="checkout-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
          Zurück zum Restaurant
        </button>
        <h1>Warenkorb</h1>
      </div>

      <!-- Success/Error Messages -->
      <div class="message-container" *ngIf="showSuccessMessage || errorMessage">
        <div class="success-message" *ngIf="showSuccessMessage">
          <i class="fa-solid fa-check-circle"></i>
          <span>{{ successMessage }}</span>
        </div>
        <div class="error-message" *ngIf="errorMessage">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <span>{{ errorMessage }}</span>
          <button class="close-btn" (click)="clearMessages()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      <div class="checkout-content" *ngIf="cart$ | async as cart; else emptyCart">
        <div class="checkout-main">
          <!-- Cart Items -->
          <div class="cart-section">
            <div class="cart-header">
              <h2>Bestellung von {{ cart.restaurant_name }}</h2>
              <button 
                class="clear-cart-btn" 
                (click)="clearCart()"
                title="Warenkorb leeren">
                <i class="fa-solid fa-trash"></i>
                Warenkorb leeren
              </button>
            </div>

            <div class="cart-items">
              <div *ngFor="let item of cart.items" class="cart-item">
                <div class="item-details">
                  <div class="item-header">
                    <h3 class="item-name">{{ item.name }}</h3>
                    <div class="item-price">{{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                  </div>

                  <div class="item-meta">
                    <div class="item-unit-price">{{ item.unit_price | currency:'EUR':'symbol':'1.2-2':'de' }} / Stück</div>

                    <!-- Show selected variants -->
                    <div class="selected-variants" *ngIf="item.selected_variant_options && item.selected_variant_options.length > 0">
                      <div *ngFor="let variant of item.selected_variant_options" class="variant-tag">
                        {{ variant.name }}
                        <span *ngIf="variant.price_modifier_cents !== 0" class="variant-price">
                          ({{ variant.price_modifier_cents > 0 ? '+' : '' }}{{ variant.price_modifier_cents / 100 | currency:'EUR':'symbol':'1.2-2':'de' }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="item-actions">
                  <div class="item-quantity">
                    <button
                      class="quantity-btn"
                      (click)="updateQuantity(item.menu_item_id, item.quantity - 1)"
                      [disabled]="item.quantity <= 1">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button
                      class="quantity-btn"
                      (click)="updateQuantity(item.menu_item_id, item.quantity + 1)">
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>

                  <div class="item-actions-group">
                    <button
                      class="edit-btn"
                      (click)="editItemVariants(item)"
                      title="Varianten bearbeiten"
                      *ngIf="item.selected_variant_options && item.selected_variant_options.length > 0">
                      <i class="fa-solid fa-edit"></i>
                    </button>
                    <button
                      class="remove-btn"
                      (click)="removeItem(item.menu_item_id)"
                      title="Artikel entfernen">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <!-- Notes Section -->
                <div class="item-notes-section">
                  <button
                    class="notes-toggle-btn"
                    (click)="toggleItemNotes(item.menu_item_id)"
                    [class.active]="isNotesOpen(item.menu_item_id)">
                    <i class="fa-solid" [class]="isNotesOpen(item.menu_item_id) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                    <span>{{ getItemNotes(item.menu_item_id) ? 'Notiz bearbeiten' : 'Notiz hinzufügen' }}</span>
                  </button>
                  
                  <div class="notes-content" [class.open]="isNotesOpen(item.menu_item_id)">
                    <textarea
                      [(ngModel)]="itemNotes[item.menu_item_id]"
                      (ngModelChange)="onItemNotesChange(item.menu_item_id)"
                      placeholder="Spezielle Wünsche für dieses Produkt..."
                      rows="2"
                      class="notes-textarea">
                    </textarea>
                    <div class="notes-actions" *ngIf="isNotesOpen(item.menu_item_id)">
                      <button
                        class="notes-save-btn"
                        (click)="saveItemNotes(item.menu_item_id)"
                        [disabled]="!itemNotes[item.menu_item_id].trim()">
                        <i class="fa-solid fa-check"></i>
                        Speichern
                      </button>
                      <button
                        class="notes-cancel-btn"
                        (click)="cancelItemNotes(item.menu_item_id)">
                        <i class="fa-solid fa-times"></i>
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Type Selection -->
          <div class="order-type-section">
            <h2>Bestellart</h2>
            
            <div class="order-type-options">
              <div class="order-type-option" [class.selected]="orderType === 'delivery'" (click)="selectOrderType('delivery')">
                <input
                  type="radio"
                  id="delivery"
                  value="delivery"
                  [checked]="orderType === 'delivery'"
                  name="orderType"
                >
                <label for="delivery">
                  <i class="fa-solid fa-truck"></i>
                  <div>
                    <div class="type-name">Lieferung</div>
                    <div class="type-desc">Wir liefern direkt zu Ihnen</div>
                  </div>
                </label>
              </div>

              <div class="order-type-option" [class.selected]="orderType === 'pickup'" (click)="selectOrderType('pickup')">
                <input
                  type="radio"
                  id="pickup"
                  value="pickup"
                  [checked]="orderType === 'pickup'"
                  name="orderType"
                >
                <label for="pickup">
                  <i class="fa-solid fa-store"></i>
                  <div>
                    <div class="type-name">Abholung</div>
                    <div class="type-desc">Sie holen Ihre Bestellung ab</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Delivery Time Slots (only shown for delivery orders) -->
          <div class="delivery-slots-section" *ngIf="orderType === 'delivery' && getCurrentRestaurantId()">
            <h2>Lieferzeit wählen</h2>
            <p>Wählen Sie wann Sie Ihre Bestellung erhalten möchten</p>
            
            <app-delivery-slots
              [restaurantId]="getCurrentRestaurantId()"
              (slotSelected)="onDeliverySlotSelected($event)"
            ></app-delivery-slots>
          </div>

          <!-- Delivery Address (only shown for delivery orders) -->
          <div class="delivery-section" *ngIf="orderType === 'delivery'">
            <h2>Lieferadresse</h2>

            <!-- Saved Addresses Selection -->
            <div class="saved-addresses" *ngIf="savedAddresses.length > 0">
              <h3>Gespeicherte Adressen</h3>
              <div class="address-selection">
                <div class="address-option" *ngFor="let address of savedAddresses" 
                     [class.selected]="selectedAddressId === address.id"
                     (click)="selectSavedAddress(address)">
                  <div class="address-radio">
                    <input type="radio" 
                           [id]="'address_' + address.id"
                           [value]="address.id" 
                           [(ngModel)]="selectedAddressId"
                           name="addressSelection">
                    <label [for]="'address_' + address.id"></label>
                  </div>
                  <div class="address-info">
                    <div class="address-name">
                      <strong>{{ address.name || 'Adresse' }}</strong>
                      <span class="default-badge" *ngIf="address.is_default">Standard</span>
                    </div>
                    <div class="address-details">
                      {{ address.street }}, {{ address.postal_code }} {{ address.city }}
                    </div>
                    <div class="address-instructions" *ngIf="address.instructions">
                      {{ address.instructions }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="address-selection-actions">
                <button type="button" class="btn-ghost" (click)="useNewAddress()">
                  <i class="fa-solid fa-plus"></i>
                  Neue Adresse eingeben
                </button>
                <button type="button" class="btn-ghost" (click)="manageAddresses()">
                  <i class="fa-solid fa-cog"></i>
                  Adressen verwalten
                </button>
              </div>
            </div>

            <!-- Manual Address Entry -->
            <div class="address-form" [class.hidden]="selectedAddressId && !showManualEntry">
              <div class="manual-entry-header" *ngIf="savedAddresses.length > 0">
                <h3>Neue Adresse eingeben</h3>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="addressName">Name der Adresse (optional)</label>
                  <input
                    id="addressName"
                    type="text"
                    [(ngModel)]="newAddressName"
                    placeholder="z.B. Zuhause, Arbeit"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="street">Straße und Hausnummer</label>
                  <input
                    id="street"
                    type="text"
                    [(ngModel)]="deliveryAddress.street"
                    (ngModelChange)="onAddressChange()"
                    placeholder="Musterstraße 123"
                    [required]="!selectedAddressId"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">Stadt</label>
                  <input
                    id="city"
                    type="text"
                    [(ngModel)]="deliveryAddress.city"
                    (ngModelChange)="onAddressChange()"
                    placeholder="Musterstadt"
                    [required]="!selectedAddressId"
                  >
                </div>

                <div class="form-group">
                  <label for="postal_code">PLZ</label>
                  <input
                    id="postal_code"
                    type="text"
                    [(ngModel)]="deliveryAddress.postal_code"
                    (ngModelChange)="onAddressChange()"
                    placeholder="12345"
                    [required]="!selectedAddressId"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="deliveryInstructions">Lieferhinweise (optional)</label>
                <textarea
                  id="deliveryInstructions"
                  [(ngModel)]="deliveryInstructions"
                  placeholder="z.B. Klingel an der Hintertür, 2. Stock, etc."
                  rows="2">
                </textarea>
              </div>

              <div class="form-group">
                <label for="notes">Zusätzliche Hinweise (optional)</label>
                <textarea
                  id="notes"
                  [(ngModel)]="orderNotes"
                  (ngModelChange)="onNotesChange()"
                  placeholder="z.B. Allergien, besondere Wünsche..."
                  rows="3">
                </textarea>
              </div>
            </div>

            <!-- Data Saving Notice -->
            <div class="data-saving-notice" *ngIf="!isAuthenticated">
              <i class="fa-solid fa-shield-alt"></i>
              <small *ngIf="!userDataSvc.hasData()">Ihre Adresse und Kontaktdaten werden nach der ersten Bestellung lokal gespeichert.</small>
              <small *ngIf="userDataSvc.hasData()">Ihre Adresse und Kontaktdaten wurden gespeichert und werden bei zukünftigen Bestellungen automatisch ausgefüllt.</small>
              <button class="clear-data-btn" *ngIf="userDataSvc.hasData()" (click)="clearSavedData()" title="Gespeicherte Daten löschen">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="payment-section">
            <h2>Zahlungsmethode</h2>

            <div class="payment-methods">
              <div class="payment-method" [class.selected]="selectedPaymentMethod === 'cash'" *ngIf="isPaymentMethodAvailable('cash')">
                <input
                  type="radio"
                  id="cash"
                  value="cash"
                  [(ngModel)]="selectedPaymentMethod"
                  name="paymentMethod"
                >
                <label for="cash">
                  <i class="fa-solid fa-money-bill-wave"></i>
                  <div>
                    <div class="method-name">Barzahlung</div>
                    <div class="method-desc">Zahlen Sie bei Lieferung</div>
                  </div>
                </label>
              </div>

              <div class="payment-method" [class.selected]="selectedPaymentMethod === 'card'" (click)="selectCard()" *ngIf="isPaymentMethodAvailable('card')">
                <input
                  type="radio"
                  id="card"
                  value="card"
                  [(ngModel)]="selectedPaymentMethod"
                  name="paymentMethod"
                >
                <label for="card">
                  <i class="fa-solid fa-credit-card"></i>
                  <div>
                    <div class="method-name">Kreditkarte</div>
                    <div class="method-desc">Sichere Online-Zahlung</div>
                  </div>
                </label>
              </div>

              <div class="payment-method" [class.selected]="selectedPaymentMethod === 'paypal'" (click)="selectPayPal()" *ngIf="isPaymentMethodAvailable('paypal')">
                <input
                  type="radio"
                  id="paypal"
                  value="paypal"
                  [(ngModel)]="selectedPaymentMethod"
                  name="paymentMethod"
                >
                <label for="paypal">
                  <i class="fa-brands fa-paypal"></i>
                  <div>
                    <div class="method-name">PayPal</div>
                    <div class="method-desc">Schnell und sicher über Stripe zahlen</div>
                  </div>
                </label>
              </div>

              <!-- Show message if no payment methods are available -->
              <div class="no-payment-methods" *ngIf="!hasAvailablePaymentMethods()">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>Dieses Restaurant bietet derzeit keine Zahlungsmethoden an.</span>
              </div>
            </div>
          </div>

          <!-- Customer Information (only for guest orders) -->
          <div class="customer-info-section" *ngIf="!isAuthenticated">
            <h2>Kontaktdaten</h2>

            <div class="customer-info-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="customer_name">Vollständiger Name</label>
                  <input
                    id="customer_name"
                    type="text"
                    [(ngModel)]="customerInfo.name"
                    (ngModelChange)="onCustomerInfoChange()"
                    placeholder="Max Mustermann"
                    required
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="customer_email">E-Mail-Adresse</label>
                  <input
                    id="customer_email"
                    type="email"
                    [(ngModel)]="customerInfo.email"
                    (ngModelChange)="onCustomerInfoChange()"
                    placeholder="max.mustermann@email.com"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="customer_phone">Telefonnummer</label>
                  <input
                    id="customer_phone"
                    type="tel"
                    [(ngModel)]="customerInfo.phone"
                    (ngModelChange)="onCustomerInfoChange()"
                    placeholder="+49 123 4567890"
                    required
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="checkout-sidebar">
          <div class="order-summary">
            <h2>Bestellübersicht</h2>

            <div class="summary-row">
              <span>Zwischensumme:</span>
              <span>{{ cart.subtotal | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>

            <div class="summary-row">
              <span>{{ orderType === 'pickup' ? 'Abholgebühr:' : 'Liefergebühr:' }}</span>
              <span>{{ cart.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>

            <!-- Loyalty redemption section -->
            <div class="loyalty-section" *ngIf="loyaltyAvailable">
              <div class="loyalty-header" [class.active]="useLoyaltyReward">
                <div class="loyalty-icon">
                  <i class="fa-solid fa-gift"></i>
                </div>
                <div class="loyalty-info">
                  <div class="loyalty-title">Stempelkarten-Rabatt verfügbar!</div>
                  <div class="loyalty-subtitle">{{ loyaltySettings.stamps_required }} Stempel = {{ loyaltySettings.discount_percent }}% Rabatt</div>
                </div>
                <div class="loyalty-status">
                  <div class="stamps-indicator" [class.can-redeem]="canRedeem">
                    <i class="fa-solid fa-star"></i>
                    <span>{{ currentUserStamps || 0 }}/{{ loyaltySettings.stamps_required }}</span>
                  </div>
                </div>
              </div>

              <div class="loyalty-action" *ngIf="canRedeem">
                <button
                  class="loyalty-redeem-btn"
                  [class.active]="useLoyaltyReward"
                  (click)="toggleLoyalty()"
                >
                  <i class="fa-solid" [class]="useLoyaltyReward ? 'fa-times' : 'fa-gift'"></i>
                  {{ useLoyaltyReward ? 'Rabatt entfernen' : 'Jetzt einlösen!' }}
                </button>
              </div>

              <div class="loyalty-preview" *ngIf="useLoyaltyReward" [@fadeInOut]>
                <div class="discount-applied">
                  <i class="fa-solid fa-check-circle"></i>
                  <span class="discount-text">
                    {{ loyaltySettings.discount_percent }}% Rabatt angewendet
                  </span>
                  <span class="discount-amount">
                    -{{ getLoyaltyDiscount(cart) | currency:'EUR':'symbol':'1.2-2':'de' }}
                  </span>
                </div>
              </div>

              <div class="loyalty-notice" *ngIf="!canRedeem">
                <i class="fa-solid fa-info-circle"></i>
                <span>Sammle noch {{ loyaltySettings.stamps_required - (currentUserStamps || 0) }} Stempel für den nächsten Rabatt!</span>
              </div>
            </div>

            <div class="summary-row total">
              <span>Gesamt:</span>
              <span>{{ getDisplayedTotal(cart) | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>

            <!-- Minimum Order Warning -->
            <div class="minimum-order-warning" *ngIf="!isMinimumOrderMet(cart)">
              <i class="fa-solid fa-exclamation-triangle"></i>
              <span>Mindestbestellwert: {{ cart.minimum_order | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>

            <button
              class="order-btn"
              (click)="placeOrder()"
              [disabled]="!isFormValid() || !isMinimumOrderMet(cart) || loading"
            >
              <i class="fa-solid fa-shopping-cart"></i>
              Jetzt bestellen
            </button>

            <div class="order-info">
              <p><i class="fa-solid fa-clock"></i> Geschätzte {{ orderType === 'pickup' ? 'Abholzeit' : 'Lieferzeit' }}: {{ orderType === 'pickup' ? '15-30 Min' : '30-45 Min' }}</p>
              <p><i class="fa-solid fa-shield-alt"></i> Ihre Daten sind sicher</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Cart Template -->
      <ng-template #emptyCart>
        <div class="empty-cart">
          <div class="empty-cart-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <h2>Ihr Warenkorb ist leer</h2>
          <p>Entdecken Sie unsere Restaurants und fügen Sie Gerichte zu Ihrem Warenkorb hinzu.</p>
          <button class="browse-btn" (click)="goToRestaurants()">
            Restaurants durchsuchen
          </button>
        </div>
      </ng-template>

      <!-- Variants Modal -->
      <app-menu-item-variants-modal
        [menuItem]="selectedMenuItemForEdit"
        [isOpen]="showVariantsModal"
        [isEditMode]="true"
        [existingSelection]="existingItemSelection"
        (close)="closeVariantsModal()"
        (confirm)="confirmVariantsEdit($event)">
      </app-menu-item-variants-modal>
    </div>
  `,
  styles: [`
    .checkout-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
      min-height: 100vh;
    }

    .checkout-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      cursor: pointer;
      transition: all var(--transition);
    }

    .back-btn:hover {
      background: var(--color-surface);
      transform: translateY(-2px);
    }

    .checkout-header h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin: 0;
    }

    .checkout-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: var(--space-8);
    }

    .checkout-main {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .cart-section, .order-type-section, .delivery-section, .payment-section, .customer-info-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .delivery-slots-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .cart-section h2, .order-type-section h2, .delivery-section h2, .payment-section h2, .customer-info-section h2, .delivery-slots-section h2 {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-primary);
    }

    .delivery-slots-section p {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-4);
    }

    .order-type-options {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .order-type-option {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      background: var(--color-surface-2);
    }

    .order-type-option:hover {
      border-color: var(--color-primary-300);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .order-type-option.selected {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
      transform: translateY(-1px);
    }

    .order-type-option input[type="radio"] {
      display: none;
    }

    .order-type-option label {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      width: 100%;
    }

    .order-type-option i {
      font-size: var(--text-xl);
      color: var(--color-primary);
      width: 24px;
    }

    .type-name {
      font-weight: 600;
      color: var(--color-heading);
    }

    .type-desc {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-primary);
    }

    .cart-header h2 {
      margin: 0;
      border: none;
      padding: 0;
    }

    .clear-cart-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    .clear-cart-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    .clear-cart-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    .clear-cart-btn i {
      font-size: var(--text-sm);
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .cart-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, var(--color-surface) 0%, rgba(255, 255, 255, 0.8) 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
      flex-wrap: wrap;
    }

    .cart-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
      opacity: 0;
      transition: opacity var(--transition);
    }

    .cart-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
      border-color: var(--color-primary-200);
    }

    .cart-item:hover::before {
      opacity: 1;
    }


    .item-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .item-name {
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--color-heading);
      line-height: 1.3;
      margin: 0;
      flex: 1;
      min-width: 0;
    }

    .item-price {
      color: var(--color-primary);
      font-weight: 600;
      font-size: var(--text-base);
      white-space: nowrap;
      background: var(--color-primary-50);
      padding: 4px 8px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-primary-200);
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .item-unit-price {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .selected-variants {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-1);
    }

    .variant-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-25));
      color: var(--color-primary-700);
      padding: 4px var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-xs);
      font-weight: 600;
      border: 1px solid var(--color-primary-200);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all var(--transition);
    }

    .variant-tag:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .variant-price {
      color: var(--color-primary-800);
      font-weight: 600;
      font-size: var(--text-xs);
    }

    .item-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
      min-width: 120px;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--color-surface-2);
      border-radius: var(--radius-lg);
      padding: var(--space-1);
      border: 1px solid var(--color-border);
    }

    .quantity-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
      color: var(--color-text);
      font-weight: 600;
      font-size: var(--text-lg);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .quantity-btn:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .quantity-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .quantity-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }

    .quantity {
      font-weight: 700;
      font-size: var(--text-base);
      min-width: 24px;
      text-align: center;
      color: var(--color-heading);
    }

    .item-actions-group {
      display: flex;
      flex-direction: row;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .edit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2);
      background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
      color: #6b7280 !important;
      border: 1px solid #d1d5db;
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
      text-decoration: none;
      width: 40px;
      height: 40px;
      min-width: 40px;
    }

    .edit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
      background: linear-gradient(135deg, #e5e7eb, #d1d5db);
      color: #374151 !important;
      border-color: #9ca3af;
    }

    .edit-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
    }

    .remove-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2);
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white !important;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      text-decoration: none;
      width: 40px;
      height: 40px;
      min-width: 40px;
    }

    .remove-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .remove-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .cart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .cart-header h2 {
        font-size: var(--text-xl);
      }

      .clear-cart-btn {
        align-self: flex-end;
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
      }

      .cart-item {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas: 
          "details actions"
          "notes notes";
        align-items: start;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-lg);
      }

      .item-details { grid-area: details; min-width: 0; }
      .item-actions { grid-area: actions; }
      .item-notes-section { grid-area: notes; order: initial; flex-basis: auto; }

      .item-header {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .item-name {
        font-size: var(--text-base);
        font-weight: 600;
        line-height: 1.2;
        margin: 0;
      }

      .item-price {
        font-size: var(--text-sm);
        padding: 2px 6px;
        align-self: flex-start;
        margin-bottom: var(--space-1);
      }

      .item-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .item-unit-price {
        font-size: var(--text-xs);
        color: var(--color-muted);
      }

      .selected-variants {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        margin-top: var(--space-1);
      }

      .variant-tag {
        font-size: 10px;
        padding: 2px 4px;
      }

      .variant-price {
        font-size: 10px;
      }

      .item-actions {
        grid-area: actions;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-2);
        min-width: 90px;
        height: 100%;
      }

      .item-quantity {
        background: transparent;
        border: none;
        padding: 0;
        gap: var(--space-1);
      }

      .quantity-btn {
        width: 28px;
        height: 28px;
        font-size: var(--text-sm);
      }

      .quantity {
        font-size: var(--text-sm);
        min-width: 20px;
      }

      .item-actions-group {
        flex-direction: row;
        gap: var(--space-1);
        margin-top: var(--space-1);
      }

      .edit-btn {
        padding: var(--space-1);
        font-size: var(--text-xs);
        border-radius: var(--radius-md);
        width: 32px;
        height: 32px;
        min-width: 32px;
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #6b7280 !important;
        border: 1px solid #d1d5db;
      }

      .edit-btn:hover {
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        color: #374151 !important;
        border-color: #9ca3af;
      }

      .edit-btn i {
        font-size: var(--text-xs);
        width: 1em;
        height: 1em;
      }

      .remove-btn {
        padding: var(--space-1);
        font-size: var(--text-xs);
        border-radius: var(--radius-md);
        width: 32px;
        height: 32px;
        min-width: 32px;
      }

      .remove-btn i {
        font-size: var(--text-xs);
        width: 1em;
        height: 1em;
      }
    }

    @media (max-width: 480px) {
      .cart-header {
        gap: var(--space-2);
      }

      .cart-header h2 {
        font-size: var(--text-lg);
      }

      .clear-cart-btn {
        padding: var(--space-1) var(--space-2);
        font-size: 10px;
        gap: var(--space-1);
      }

      .clear-cart-btn i {
        font-size: 10px;
      }

      .btn-ghost {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
        gap: var(--space-1);
      }

      .btn-ghost i {
        font-size: var(--text-xs);
      }

      .cart-item {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "details actions"
          "notes notes";
        padding: var(--space-2);
        gap: var(--space-2);
      }

      .item-details { grid-area: details; }
      .item-actions { grid-area: actions; }
      .item-notes-section { grid-area: notes; }

      .item-name {
        font-size: var(--text-sm);
        line-height: 1.3;
      }

      .item-price {
        font-size: var(--text-xs);
        padding: 1px 4px;
      }

      .item-unit-price {
        font-size: 10px;
      }

      .quantity-btn {
        width: 24px;
        height: 24px;
        font-size: var(--text-xs);
      }

      .quantity {
        font-size: var(--text-xs);
        min-width: 16px;
      }

      .edit-btn {
        padding: 2px;
        font-size: 10px;
        width: 28px;
        height: 28px;
        min-width: 28px;
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #6b7280 !important;
        border: 1px solid #d1d5db;
      }

      .edit-btn:hover {
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        color: #374151 !important;
        border-color: #9ca3af;
      }

      .edit-btn i {
        font-size: 10px;
        width: 1em;
        height: 1em;
      }

      .remove-btn {
        padding: 2px;
        font-size: 10px;
        width: 28px;
        height: 28px;
        min-width: 28px;
      }

      .remove-btn i {
        font-size: 10px;
        width: 1em;
        height: 1em;
      }

      .variant-tag {
        font-size: 8px;
        padding: 1px 3px;
      }

      .variant-price {
        font-size: 8px;
      }

      .item-actions {
        min-width: 70px;
        gap: var(--space-1);
      }
    }

    /* ===== ITEM NOTES STYLES ===== */

    .item-notes-section {
      width: 100%;
      margin-top: var(--space-3);
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-3);
      flex-basis: 100%;
      order: 99;
    }

    .notes-toggle-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2) var(--space-3);
      background: linear-gradient(135deg, var(--color-surface-2), var(--color-surface));
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      text-align: left;
    }

    .notes-toggle-btn:hover {
      background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-25));
      border-color: var(--color-primary-200);
      color: var(--color-primary-700);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .notes-toggle-btn.active {
      background: linear-gradient(135deg, var(--color-primary-100), var(--color-primary-50));
      border-color: var(--color-primary);
      color: var(--color-primary-800);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    }

    .notes-toggle-btn i {
      font-size: var(--text-xs);
      transition: transform var(--transition);
    }

    .notes-toggle-btn.active i {
      transform: rotate(180deg);
    }

    .notes-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, padding 0.3s ease-out;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      margin-top: var(--space-2);
    }

    .notes-content.open {
      max-height: 200px;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-top: var(--space-2);
    }

    .notes-textarea {
      width: 100%;
      min-height: 60px;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-family: inherit;
      resize: vertical;
      transition: border-color var(--transition);
      background: var(--color-surface);
      color: var(--color-text);
    }

    .notes-textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .notes-textarea::placeholder {
      color: var(--color-muted);
      font-style: italic;
    }

    .notes-actions {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
      justify-content: flex-end;
    }

    .notes-save-btn, .notes-cancel-btn {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      text-decoration: none;
    }

    .notes-save-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    }

    .notes-save-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669, #047857);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
    }

    .notes-save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .notes-cancel-btn {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
      box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
    }

    .notes-cancel-btn:hover {
      background: linear-gradient(135deg, #4b5563, #374151);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(107, 114, 128, 0.4);
    }

    .notes-save-btn i, .notes-cancel-btn i {
      font-size: var(--text-xs);
    }

    /* Responsive Notes */
    @media (max-width: 768px) {
      .item-notes-section {
        margin-top: var(--space-2);
        padding-top: var(--space-2);
      }

      .notes-toggle-btn {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-xs);
      }

      .notes-content.open {
        padding: var(--space-2);
        margin-top: var(--space-2);
      }

      .notes-textarea {
        min-height: 50px;
        font-size: var(--text-xs);
      }

      .notes-actions {
        margin-top: var(--space-2);
        gap: var(--space-1);
      }

      .notes-save-btn, .notes-cancel-btn {
        padding: var(--space-1) var(--space-2);
        font-size: 10px;
      }
    }

    @media (max-width: 480px) {
      .item-notes-section {
        padding-left: 0;
        padding-right: 0;
      }

      .notes-toggle-btn {
        padding: 6px var(--space-2);
        font-size: 10px;
      }

      .notes-toggle-btn span {
        flex: 1;
        text-align: left;
      }

      .notes-content.open {
        padding: var(--space-1);
        margin-top: var(--space-2);
      }

      .notes-textarea {
        min-height: 40px;
        padding: var(--space-1) var(--space-2);
        font-size: 10px;
      }

      .notes-actions {
        flex-direction: column;
        gap: var(--space-1);
      }

      .notes-save-btn, .notes-cancel-btn {
        width: 100%;
        justify-content: center;
        padding: 6px var(--space-2);
        font-size: 9px;
      }
    }

    .address-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .address-form.hidden {
      display: none;
    }

    .manual-entry-header h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .saved-addresses {
      margin-bottom: var(--space-6);
    }

    .saved-addresses h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .address-selection {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .address-option {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      background: var(--color-surface-2);
    }

    .address-option:hover {
      border-color: var(--color-primary-300);
      background: color-mix(in oklab, var(--color-primary) 15%, white);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .address-option.selected {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 20%, white);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
      transform: translateY(-1px);
    }

    .address-radio {
      margin-top: var(--space-1);
    }

    .address-radio input[type="radio"] {
      display: none;
    }

    .address-radio label {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-radius: 50%;
      display: block;
      cursor: pointer;
      position: relative;
      transition: all var(--transition);
    }

    .address-option.selected .address-radio label {
      border-color: var(--color-primary);
      background: var(--color-primary);
    }

    .address-option.selected .address-radio label::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }

    .address-info {
      flex: 1;
      padding: var(--space-2);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in oklab, var(--color-primary) 10%, transparent);
    }

    .address-option.selected .address-info {
      background: color-mix(in oklab, var(--color-primary) 8%, white);
      border-color: color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .address-name {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .address-name strong {
      color: var(--color-heading);
      font-size: var(--text-base);
    }

    .address-details {
      color: var(--color-text);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
      font-weight: 500;
    }

    .address-instructions {
      color: var(--color-muted);
      font-size: var(--text-xs);
      font-style: italic;
    }

    .default-badge {
      background: var(--color-primary);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .address-selection-actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .btn-ghost {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      text-decoration: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .btn-ghost:hover {
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .btn-ghost:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-ghost i {
      font-size: var(--text-sm);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .form-group input, .form-group textarea {
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-md);
      transition: border-color var(--transition);
    }

    .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
    }

    .payment-method:hover {
      border-color: var(--color-primary-300);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
    }

    .payment-method.selected {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 10%, white);
    }

    .payment-method input[type="radio"] {
      display: none;
    }

    .payment-method label {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      width: 100%;
    }

    .payment-method i {
      font-size: var(--text-xl);
      color: var(--color-primary);
      width: 24px;
    }

    .method-name {
      font-weight: 600;
      color: var(--color-heading);
    }

    .method-desc {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .no-payment-methods {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: color-mix(in oklab, var(--color-warning) 10%, white);
      border: 1px solid var(--color-warning);
      border-radius: var(--radius-lg);
      color: var(--color-warning);
      font-size: var(--text-sm);
      margin-top: var(--space-4);
    }

    .no-payment-methods i {
      font-size: var(--text-lg);
    }

    .checkout-sidebar {
      position: sticky;
      top: var(--space-6);
    }

    .order-summary {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-lg);
    }

    .order-summary h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-6);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      font-size: var(--text-md);
    }

    .summary-row.total {
      border-top: 2px solid var(--color-border);
      padding-top: var(--space-3);
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .minimum-order-warning {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: color-mix(in oklab, var(--color-warning) 15%, white);
      border: 1px solid var(--color-warning);
      border-radius: var(--radius-lg);
      color: var(--color-warning);
      font-size: var(--text-sm);
      margin: var(--space-4) 0;
    }

    .order-btn {
      width: 100%;
      padding: var(--space-4);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      color: white;
      font-weight: 600;
      font-size: var(--text-lg);
      cursor: pointer;
      transition: all var(--transition);
      margin: var(--space-6) 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }

    .order-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .order-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .order-info p {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
    }

    .empty-cart {
      text-align: center;
      padding: var(--space-16) var(--space-6);
      color: var(--color-muted);
    }

    .empty-cart-icon {
      font-size: 4rem;
      color: var(--color-border);
      margin-bottom: var(--space-6);
    }

    .empty-cart h2 {
      font-size: var(--text-2xl);
      color: var(--color-heading);
      margin-bottom: var(--space-4);
    }

    .empty-cart p {
      margin-bottom: var(--space-8);
      font-size: var(--text-lg);
    }

    .browse-btn {
      padding: var(--space-4) var(--space-6);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .browse-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .checkout-content {
        grid-template-columns: 1fr;
      }

      .checkout-sidebar {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .checkout-container {
        padding: var(--space-4);
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .address-selection-actions {
        flex-direction: column;
        gap: var(--space-2);
      }

      .btn-ghost {
        width: 100%;
        justify-content: center;
        padding: var(--space-3);
        font-size: var(--text-sm);
      }

      .cart-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .item-quantity, .item-total {
        align-self: stretch;
        justify-content: space-between;
      }
    }

    /* ===== LOYALTY STYLES ===== */

    .loyalty-section {
      margin: var(--space-4) 0;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      border: 2px solid #e8efff;
      transition: all var(--transition);
    }

    .loyalty-section:hover {
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    /* Loyalty Header */
    .loyalty-header {
      display: flex;
      align-items: center;
      padding: var(--space-4);
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      transition: all var(--transition);
    }

    .loyalty-header.active {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .loyalty-icon {
      font-size: 2rem;
      margin-right: var(--space-3);
      opacity: 0.9;
    }

    .loyalty-info {
      flex: 1;
    }

    .loyalty-title {
      font-size: var(--text-lg);
      font-weight: 700;
      margin-bottom: var(--space-1);
    }

    .loyalty-subtitle {
      font-size: var(--text-sm);
      opacity: 0.9;
      font-weight: 500;
    }

    .loyalty-status {
      margin-left: var(--space-3);
    }

    .stamps-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: rgba(255, 255, 255, 0.2);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .stamps-indicator.can-redeem {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
      animation: pulse 2s infinite;
    }

    .stamps-indicator i {
      color: #fbbf24;
    }

    /* Loyalty Action */
    .loyalty-action {
      padding: var(--space-4);
      text-align: center;
    }

    .loyalty-redeem-btn {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-full);
      font-size: var(--text-base);
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .loyalty-redeem-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    .loyalty-redeem-btn:active {
      transform: translateY(0);
    }

    .loyalty-redeem-btn.active {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
    }

    .loyalty-redeem-btn.active:hover {
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
    }

    /* Loyalty Preview */
    .loyalty-preview {
      padding: var(--space-4);
      background: #f0fdf4;
      border-top: 1px solid #bbf7d0;
    }

    .discount-applied {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: #166534;
      font-weight: 600;
    }

    .discount-applied i {
      color: #16a34a;
      font-size: var(--text-lg);
    }

    .discount-text {
      flex: 1;
    }

    .discount-amount {
      color: #dc2626;
      font-weight: 700;
      font-size: var(--text-lg);
    }

    /* Loyalty Notice */
    .loyalty-notice {
      padding: var(--space-4);
      background: #fef3c7;
      border-top: 1px solid #fde68a;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: #92400e;
      font-weight: 600;
    }

    .loyalty-notice i {
      color: #d97706;
      font-size: var(--text-lg);
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.6);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .loyalty-header {
        flex-direction: column;
        text-align: center;
        gap: var(--space-2);
      }

      .loyalty-icon {
        margin-right: 0;
      }

      .loyalty-status {
        margin-left: 0;
      }

      .loyalty-redeem-btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* ===== MESSAGE STYLES ===== */

    .message-container {
      margin-bottom: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .success-message, .error-message {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 600;
      font-size: var(--text-base);
      border: 1px solid;
      animation: slideIn 0.3s ease-out;
    }

    .success-message {
      background: color-mix(in oklab, #10b981 10%, white);
      color: #065f46;
      border-color: #10b981;
    }

    .success-message i {
      color: #10b981;
      font-size: var(--text-lg);
    }

    .error-message {
      background: color-mix(in oklab, #ef4444 10%, white);
      color: #7f1d1d;
      border-color: #ef4444;
    }

    .error-message i {
      color: #ef4444;
      font-size: var(--text-lg);
    }

    .error-message .close-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #7f1d1d;
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-md);
      transition: all var(--transition);
      font-size: var(--text-sm);
    }

    .error-message .close-btn:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ===== DATA SAVING NOTICE ===== */

    .data-saving-notice {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-4);
      padding: var(--space-3);
      background: color-mix(in oklab, #3b82f6 8%, white);
      border: 1px solid #3b82f6;
      border-radius: var(--radius-lg);
      color: #1d4ed8;
      font-size: var(--text-sm);
    }

    .data-saving-notice i {
      color: #3b82f6;
      font-size: var(--text-base);
      flex-shrink: 0;
    }

    .clear-data-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-md);
      transition: all var(--transition);
      margin-left: auto;
      font-size: 14px;
      flex-shrink: 0;
    }

    .clear-data-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Responsive messages */
    @media (max-width: 768px) {
      .success-message, .error-message {
        padding: var(--space-3);
        font-size: var(--text-sm);
        gap: var(--space-2);
      }

      .success-message i, .error-message i {
        font-size: var(--text-base);
      }

      .data-saving-notice {
        padding: var(--space-2);
        font-size: 12px;
        gap: var(--space-1);
      }

      .data-saving-notice i {
        font-size: var(--text-sm);
      }
    }
  `]
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  private cartService = inject(CartService);
  private ordersService = inject(OrdersService);
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private restaurantsService = inject(RestaurantsService);
  private userDataService = inject(UserDataService);
  private loadingService = inject(LoadingService);
  private confirmationService = inject(ConfirmationService);
  private deliverySlotsService = inject(DeliverySlotsService);

  cart$ = this.cartService.cart$;
  loading = false;
  successMessage = '';
  errorMessage = '';
  showSuccessMessage = false;

  deliveryAddress: DeliveryAddress = {
    street: '',
    city: '',
    postal_code: ''
  };

  orderNotes = '';
  deliveryInstructions = '';
  newAddressName = '';

  // Address management
  savedAddresses: DeliveryAddress[] = [];
  selectedAddressId: string | null = null;
  showManualEntry = false;

  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: ''
  };

  selectedPaymentMethod = 'cash';
  orderType: 'delivery' | 'pickup' = 'delivery';
  isAuthenticated = false;
  availablePaymentMethods: { cash: boolean; card: boolean; paypal: boolean } | null = null;
  // Loyalty UI state
  loyaltyAvailable = false;
  canRedeem = false; // can be refined with dedicated endpoint later
  stampsMissing = 0;
  currentUserStamps = 0;
  useLoyaltyReward = false;
  loyaltySettings: { enabled: boolean; discount_percent: number; stamps_required: number; min_subtotal_to_earn?: number } = {
    enabled: false,
    discount_percent: 10,
    stamps_required: 5
  };

  // Variants modal properties
  showVariantsModal = false;
  selectedMenuItemForEdit: MenuItemWithVariants | null = null;
  existingItemSelection: any = null;

  // Item notes properties
  itemNotes: { [menuItemId: string]: string } = {};
  openNotesItems: { [menuItemId: string]: boolean } = {};
  tempNotes: { [menuItemId: string]: string } = {};

  // Delivery slots properties
  selectedDeliverySlot: DeliverySlot | null = null;

  ngOnInit() {
    // Lade gespeicherte Benutzerdaten beim Initialisieren
    this.loadSavedUserData();
    this.loadSavedAddresses();

    // Check if cart is empty and redirect if needed
    this.cart$.subscribe(cart => {
      if (!cart || cart.items.length === 0) {
        // Cart is empty, but we'll show the empty state
        this.availablePaymentMethods = null;
      } else {
        // Load payment methods for the restaurant
        this.loadRestaurantPaymentMethods(cart.restaurant_id);
        
        // Load existing item notes from cart
        this.loadItemNotesFromCart(cart);
      }
    });

    // Check authentication status immediately first
    this.isAuthenticated = this.authService.isAuthenticated();

    // Also listen for changes
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!(user && user.is_active);
    });
  }

  ngAfterViewInit() {
    // Garantiertes Scrolling nach oben nach vollständiger View-Initialisierung
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }

  private loadRestaurantPaymentMethods(restaurantId: string) {
    this.restaurantsService.getRestaurantPaymentMethods(restaurantId).subscribe({
      next: (paymentMethods) => {
        this.availablePaymentMethods = paymentMethods;
        // Set default payment method if current selection is not available
        if (!this.isPaymentMethodAvailable(this.selectedPaymentMethod)) {
          this.selectedPaymentMethod = this.getFirstAvailablePaymentMethod();
        }
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
        // Fallback to all payment methods enabled if loading fails
        this.availablePaymentMethods = { cash: true, card: true, paypal: true };
      }
    });

    // Load loyalty settings and user stamps
    this.restaurantsService.getLoyaltySettings(restaurantId).subscribe({
      next: (settings) => {
        this.loyaltyAvailable = !!(settings && settings.enabled);
        this.loyaltySettings = settings || this.loyaltySettings;

        // If loyalty is enabled, check if user has enough stamps
        if (this.loyaltyAvailable && this.isAuthenticated) {
          this.checkUserLoyaltyForRestaurant(restaurantId);
        } else {
          this.canRedeem = false;
        }
      },
      error: () => {
        this.loyaltyAvailable = false;
        this.canRedeem = false;
      }
    });
  }

  public isPaymentMethodAvailable(method: string): boolean {
    if (!this.availablePaymentMethods) return true;
    switch (method) {
      case 'cash': return this.availablePaymentMethods.cash;
      case 'card': return this.availablePaymentMethods.card;
      case 'paypal': return this.availablePaymentMethods.paypal;
      default: return false;
    }
  }

  private getFirstAvailablePaymentMethod(): string {
    if (!this.availablePaymentMethods) return 'cash';
    if (this.availablePaymentMethods.cash) return 'cash';
    if (this.availablePaymentMethods.card) return 'card';
    if (this.availablePaymentMethods.paypal) return 'paypal';
    return 'cash'; // fallback
  }

  private checkUserLoyaltyForRestaurant(restaurantId: string) {
    this.ordersService.getMyLoyalty().subscribe({
      next: (loyaltyResponse) => {
        // Find loyalty data for current restaurant
        const restaurantLoyalty = loyaltyResponse.loyalty.find(
          (loyalty: any) => loyalty.restaurant_id === restaurantId
        );

        if (restaurantLoyalty) {
          this.canRedeem = restaurantLoyalty.can_redeem;
          this.currentUserStamps = restaurantLoyalty.current_stamps || 0;
          this.stampsMissing = Math.max(0, restaurantLoyalty.stamps_required - this.currentUserStamps);
          console.log('Loyalty check result:', {
            restaurantId,
            currentStamps: restaurantLoyalty.current_stamps,
            stampsRequired: restaurantLoyalty.stamps_required,
            canRedeem: restaurantLoyalty.can_redeem
          });
        } else {
          this.canRedeem = false;
          this.currentUserStamps = 0;
          this.stampsMissing = this.loyaltySettings.stamps_required;
        }
      },
      error: (error) => {
        console.error('Error checking user loyalty:', error);
        this.canRedeem = false;
      }
    });
  }

  updateQuantity(menuItemId: string, quantity: number) {
    this.cartService.updateQuantity(menuItemId, quantity);
  }

  async removeItem(menuItemId: string) {
    // Get the cart item to show in the confirmation dialog
    const cart = this.cartService.getCurrentCart();
    const item = cart?.items.find(item => item.menu_item_id === menuItemId);
    
    if (!item) {
      console.error('Item not found in cart');
      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Artikel entfernen',
      message: `Möchten Sie "${item.name}" aus Ihrem Warenkorb entfernen?`,
      confirmText: 'Ja, entfernen',
      cancelText: 'Abbrechen',
      type: 'warning',
      showCancel: true
    });

    if (confirmed) {
      this.cartService.removeFromCart(menuItemId);
    }
  }

  async clearCart() {
    const cart = this.cartService.getCurrentCart();
    if (!cart || cart.items.length === 0) {
      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Warenkorb leeren',
      message: 'Möchten Sie wirklich den gesamten Warenkorb leeren? Alle Artikel werden entfernt.',
      confirmText: 'Ja, leeren',
      cancelText: 'Abbrechen',
      type: 'warning',
      showCancel: true
    });

    if (confirmed) {
      this.cartService.clearCart();
      // Clear any item notes
      this.itemNotes = {};
      this.openNotesItems = {};
      this.tempNotes = {};
    }
  }


  public hasAvailablePaymentMethods(): boolean {
    if (!this.availablePaymentMethods) return true;
    return this.availablePaymentMethods.cash || this.availablePaymentMethods.card || this.availablePaymentMethods.paypal;
  }

  isMinimumOrderMet(cart: Cart): boolean {
    return this.cartService.isMinimumOrderMet();
  }


  toggleLoyalty() {
    if (!this.loyaltyAvailable) return;
    this.useLoyaltyReward = !this.useLoyaltyReward;
  }

  getLoyaltyDiscount(cart: Cart): number {
    if (!this.loyaltyAvailable || !this.useLoyaltyReward) return 0;
    const pct = Math.max(1, Math.min(100, this.loyaltySettings.discount_percent || 10));
    const discount = (cart.subtotal || 0) * (pct / 100);
    return Math.round(discount * 100) / 100;
  }

  getDisplayedTotal(cart: Cart): number {
    const discount = this.getLoyaltyDiscount(cart);
    return Math.max(0, (cart.subtotal || 0) - discount + (cart.delivery_fee || 0));
  }

  selectCard() {
    this.selectedPaymentMethod = 'card';
  }

  selectPayPal() {
    this.selectedPaymentMethod = 'paypal';
  }

  selectOrderType(type: 'delivery' | 'pickup') {
    console.log('selectOrderType called with:', type);
    this.orderType = type;
    console.log('orderType set to:', this.orderType);
  }

  goBack() {
    const cart = this.cartService.getCurrentCart();
    if (cart && cart.restaurant_id) {
      this.router.navigate(['/restaurant', cart.restaurant_id]);
    } else {
      this.router.navigate(['/customer']);
    }
  }

  goToRestaurants() {
    this.router.navigate(['/customer']);
  }

  /**
   * Getter für den UserDataService (für Template-Zugriff)
   */
  get userDataSvc() {
    return this.userDataService;
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.showSuccessMessage = false;
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    this.showSuccessMessage = false;
    // Auto-hide error message after 5 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Lade gespeicherte Benutzerdaten aus localStorage
   */
  private loadSavedUserData(): void {
    try {
      if (this.userDataService.hasData() && this.userDataService.isDataRecent()) {
        this.deliveryAddress = this.userDataService.loadDeliveryAddress();
        this.customerInfo = this.userDataService.loadCustomerInfo();
        this.orderNotes = this.userDataService.loadOrderNotes();
        console.log('📂 Gespeicherte Benutzerdaten wurden wiederhergestellt');
      } else {
        console.log('📝 Keine oder veraltete gespeicherte Daten gefunden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Daten:', error);
    }
  }

  /**
   * Speichere die aktuellen Daten bei Änderungen
   */
  private saveUserData(): void {
    try {
      if (!this.isAuthenticated) {
        // Speichere nur für Gast-Bestellungen
        const customerInfoToSave = {
          ...this.customerInfo,
          phone: this.customerInfo.phone || ''
        };
        this.userDataService.saveCheckoutData(
          this.deliveryAddress,
          customerInfoToSave,
          this.orderNotes
        );
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Benutzerdaten:', error);
    }
  }

  /**
   * Event-Handler für Adressänderungen
   */
  onAddressChange(): void {
    // Speichere Adresse bei jeder Änderung
    this.saveUserData();
  }

  /**
   * Event-Handler für Kontaktdaten-Änderungen
   */
  onCustomerInfoChange(): void {
    // Speichere Kontaktdaten bei jeder Änderung
    this.saveUserData();
  }

  /**
   * Event-Handler für Notizen-Änderungen
   */
  onNotesChange(): void {
    // Speichere Notizen bei jeder Änderung
    this.saveUserData();
  }

  /**
   * Gespeicherte Daten löschen
   */
  clearSavedData(): void {
    if (confirm('Möchten Sie wirklich alle gespeicherten Daten löschen? Diese können nicht wiederhergestellt werden.')) {
      this.userDataService.clearData();
      // Zurücksetzen der Formularfelder auf Standardwerte
      this.deliveryAddress.street = '';
      this.deliveryAddress.city = '';
      this.deliveryAddress.postal_code = '';
      this.customerInfo.name = '';
      this.customerInfo.email = '';
      this.customerInfo.phone = undefined;
      this.orderNotes = '';
      console.log('🗑️ Gespeicherte Benutzerdaten wurden gelöscht');
    }
  }

  /**
   * Varianten eines Cart-Items bearbeiten
   */
  async editItemVariants(cartItem: CartItem): Promise<void> {
    try {
      const cart = this.cartService.getCurrentCart();
      if (!cart) return;

      // Lade die vollständigen Menu-Daten mit Varianten
      const menuData = await this.restaurantsService.getMenuCategoriesWithItemsAndVariants(cart.restaurant_id).toPromise();
      
      if (!menuData || !menuData.length) {
        this.showErrorMessage('Keine Speisekarte verfügbar.');
        return;
      }

      // Finde das Menu-Item in den geladenen Daten
      let menuItem: MenuItemWithVariants | null = null;
      for (const category of menuData) {
        menuItem = category.items.find((item: any) => item.id === cartItem.menu_item_id) as MenuItemWithVariants;
        if (menuItem) break;
      }
      
      if (!menuItem) {
        this.showErrorMessage('Produkt nicht gefunden.');
        return;
      }

      // Prüfe ob Varianten vorhanden sind
      if (!menuItem.variants || menuItem.variants.length === 0) {
        this.showErrorMessage('Keine Varianten für dieses Produkt verfügbar.');
        return;
      }

      console.log('Gefundenes Menu-Item mit Varianten:', {
        id: menuItem.id,
        name: menuItem.name,
        variantsCount: menuItem.variants?.length || 0,
        variants: menuItem.variants
      });

      // Bereite die bestehende Auswahl vor
      this.existingItemSelection = {
        selectedOptionIds: cartItem.selected_variant_option_ids || [],
        selectedOptions: cartItem.selected_variant_options || [],
        quantity: cartItem.quantity
      };

      // Setze das Menu-Item und öffne das Modal
      this.selectedMenuItemForEdit = menuItem;
      this.showVariantsModal = true;
    } catch (error) {
      console.error('Fehler beim Laden der Menu-Item-Varianten:', error);
      this.showErrorMessage('Fehler beim Laden der Produktvarianten.');
    }
  }

  /**
   * Varianten-Bearbeitung bestätigen
   */
  confirmVariantsEdit(event: {
    selectedOptionIds: string[];
    selectedOptions: Array<{id: string, name: string, price_modifier_cents: number}>;
    quantity: number;
  }): void {
    const cart = this.cartService.getCurrentCart();
    if (!cart || !this.selectedMenuItemForEdit) {
      console.error('Cart oder selectedMenuItemForEdit ist null:', { cart, selectedMenuItemForEdit: this.selectedMenuItemForEdit });
      this.showErrorMessage('Fehler: Keine gültigen Daten für die Aktualisierung.');
      return;
    }

    // Speichere die Referenz vor dem asynchronen Call
    const menuItem = this.selectedMenuItemForEdit;
    const menuItemId = menuItem.id;

    // Lade Restaurant-Daten
    this.restaurantsService.getRestaurantById(cart.restaurant_id).subscribe({
      next: (restaurant: any) => {
        // Aktualisiere die Varianten im Cart
        this.cartService.updateCartItemVariants(
          menuItemId,
          event.selectedOptionIds,
          event.selectedOptions,
          restaurant,
          menuItem
        );

        // Schließe das Modal
        this.closeVariantsModal();
      },
      error: (error: any) => {
        console.error('Fehler beim Laden der Restaurant-Daten:', error);
        this.showErrorMessage('Fehler beim Aktualisieren der Varianten.');
      }
    });
  }

  /**
   * Varianten-Modal schließen
   */
  closeVariantsModal(): void {
    console.log('Schließe Varianten-Modal:', {
      selectedMenuItemForEdit: this.selectedMenuItemForEdit?.id,
      showVariantsModal: this.showVariantsModal
    });
    
    this.showVariantsModal = false;
    this.selectedMenuItemForEdit = null;
    this.existingItemSelection = null;
  }

  /**
   * Item Notes Management
   */
  toggleItemNotes(menuItemId: string): void {
    this.openNotesItems[menuItemId] = !this.openNotesItems[menuItemId];
    
    if (this.openNotesItems[menuItemId]) {
      // Speichere den aktuellen Wert als temporären Wert
      this.tempNotes[menuItemId] = this.itemNotes[menuItemId] || '';
    }
  }

  isNotesOpen(menuItemId: string): boolean {
    return !!this.openNotesItems[menuItemId];
  }

  getItemNotes(menuItemId: string): string {
    return this.itemNotes[menuItemId] || '';
  }

  onItemNotesChange(menuItemId: string): void {
    // Automatisches Speichern bei Änderungen (optional)
    // this.saveItemNotes(menuItemId);
  }

  saveItemNotes(menuItemId: string): void {
    // Speichere die Notiz im Cart Service
    this.cartService.updateItemNotes(menuItemId, this.itemNotes[menuItemId] || '');
    this.openNotesItems[menuItemId] = false;
    delete this.tempNotes[menuItemId];
  }

  cancelItemNotes(menuItemId: string): void {
    // Stelle den ursprünglichen Wert wieder her
    this.itemNotes[menuItemId] = this.tempNotes[menuItemId] || '';
    this.openNotesItems[menuItemId] = false;
    delete this.tempNotes[menuItemId];
  }

  /**
   * Lade bestehende Item-Notizen aus dem Cart
   */
  private loadItemNotesFromCart(cart: Cart): void {
    cart.items.forEach(item => {
      if (item.special_instructions) {
        this.itemNotes[item.menu_item_id] = item.special_instructions;
      }
    });
  }

  /**
   * Lade gespeicherte Adressen
   */
  loadSavedAddresses(): void {
    this.savedAddresses = this.userDataService.getDeliveryAddresses();
    
    // Auto-select default address if available
    if (this.savedAddresses.length > 0) {
      const defaultAddress = this.savedAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        this.selectSavedAddress(defaultAddress);
      }
    }
  }

  /**
   * Wähle eine gespeicherte Adresse aus
   */
  selectSavedAddress(address: DeliveryAddress): void {
    this.selectedAddressId = address.id!;
    this.showManualEntry = false;
    
    // Update delivery address fields
    this.deliveryAddress = {
      street: address.street,
      city: address.city,
      postal_code: address.postal_code
    };
    
    // Clear delivery instructions when selecting saved address (hints are not saved with addresses)
    this.deliveryInstructions = '';
    
    // Save the address selection
    this.saveUserData();
  }

  /**
   * Verwende neue Adresse (manuelle Eingabe)
   */
  useNewAddress(): void {
    this.selectedAddressId = null;
    this.showManualEntry = true;
    
    // Clear address fields
    this.deliveryAddress = {
      street: '',
      city: '',
      postal_code: ''
    };
    this.deliveryInstructions = '';
    this.newAddressName = '';
  }

  /**
   * Navigiere zu den Account Settings für Adressverwaltung
   */
  manageAddresses(): void {
    this.router.navigate(['/account-settings'], { queryParams: { tab: 'addresses' } });
  }

  /**
   * Get current restaurant ID from cart
   */
  getCurrentRestaurantId(): string {
    const cart = this.cartService.getCurrentCart();
    return cart?.restaurant_id || '';
  }

  /**
   * Handle delivery slot selection
   */
  onDeliverySlotSelected(slot: DeliverySlot): void {
    this.selectedDeliverySlot = slot;
    console.log('Delivery slot selected:', slot);
  }

  /**
   * Erweiterte isFormValid-Methode für Adressauswahl
   */
  isFormValid(): boolean {
    // For pickup orders, address is not required
    if (this.orderType === 'pickup') {
      const paymentMethodValid: boolean = !!this.selectedPaymentMethod && this.isPaymentMethodAvailable(this.selectedPaymentMethod);
      const customerInfoValid: boolean = this.isAuthenticated || (
        !!this.customerInfo.name.trim() &&
        !!this.customerInfo.email.trim() &&
        !!this.customerInfo.phone?.trim()
      );
      return paymentMethodValid && customerInfoValid;
    }

    // For delivery orders, check address requirements
    const hasSelectedAddress: boolean = this.selectedAddressId !== null && this.selectedAddressId !== '';
    const hasValidManualAddress: boolean = Boolean(
      this.deliveryAddress.street.trim() &&
      this.deliveryAddress.city.trim() &&
      this.deliveryAddress.postal_code.trim()
    );
    const addressValid: boolean = hasSelectedAddress || hasValidManualAddress;

    const paymentMethodValid: boolean = !!this.selectedPaymentMethod && this.isPaymentMethodAvailable(this.selectedPaymentMethod);

    const customerInfoValid: boolean = this.isAuthenticated || (
      !!this.customerInfo.name.trim() &&
      !!this.customerInfo.email.trim() &&
      !!this.customerInfo.phone?.trim()
    );

    return addressValid && paymentMethodValid && customerInfoValid;
  }

  /**
   * Erweiterte placeOrder-Methode mit automatischem Adressspeichern
   */
  placeOrder() {
    if (!this.isFormValid()) return;

    // Clear any previous messages
    this.clearMessages();

    this.loading = true;
    this.loadingService.start('place-order');

    // Determine the full address to use (only for delivery orders)
    let fullAddress: string = '';
    let addressToSave: DeliveryAddress | null = null;

    if (this.orderType === 'delivery') {
      if (this.selectedAddressId) {
        // Use selected saved address
        const selectedAddress = this.savedAddresses.find(addr => addr.id === this.selectedAddressId);
        if (selectedAddress) {
          fullAddress = `${selectedAddress.street}, ${selectedAddress.postal_code} ${selectedAddress.city}`;
          // Add delivery instructions if provided
          if (this.deliveryInstructions.trim()) {
            fullAddress += ` (${this.deliveryInstructions.trim()})`;
          }
        } else {
          // Fallback to manual address
          fullAddress = `${this.deliveryAddress.street}, ${this.deliveryAddress.postal_code} ${this.deliveryAddress.city}`;
          if (this.deliveryInstructions.trim()) {
            fullAddress += ` (${this.deliveryInstructions.trim()})`;
          }
        }
      } else {
        // Use manual address entry
        fullAddress = `${this.deliveryAddress.street}, ${this.deliveryAddress.postal_code} ${this.deliveryAddress.city}`;
        if (this.deliveryInstructions.trim()) {
          fullAddress += ` (${this.deliveryInstructions.trim()})`;
        }

        // Prepare address for automatic saving (without delivery instructions/hints)
        addressToSave = {
          street: this.deliveryAddress.street.trim(),
          city: this.deliveryAddress.city.trim(),
          postal_code: this.deliveryAddress.postal_code.trim(),
          name: this.newAddressName.trim() || undefined
          // Note: instructions/hints are not saved with the address - only used for current order
        };
      }
    } else {
      // For pickup orders, use restaurant address or a generic pickup address
      fullAddress = 'Abholung im Restaurant';
    }

    // Prepare customer info for guest orders
    const customerInfo = this.isAuthenticated ? undefined : {
      name: this.customerInfo.name.trim(),
      email: this.customerInfo.email.trim(),
      phone: this.customerInfo.phone?.trim() || undefined
    };

    console.log('Creating order with orderType:', this.orderType);
    
    // Prepare delivery slot data
    const deliverySlotData = this.selectedDeliverySlot ? {
      type: this.selectedDeliverySlot.type,
      scheduled_delivery_time: this.selectedDeliverySlot.type === 'scheduled' ? this.selectedDeliverySlot.value : undefined
    } : undefined;
    
    this.cartService.createOrder(fullAddress, '', this.selectedPaymentMethod, customerInfo, this.useLoyaltyReward, this.orderNotes, this.orderType, deliverySlotData)
      .subscribe({
        next: (response) => {
          console.log('Order placed successfully:', response);
          const orderId = response.order.id;

          // Automatically save new address if it was manually entered
          if (addressToSave && !this.selectedAddressId) {
            this.userDataService.saveDeliveryAddressAutomatically(addressToSave);
          }

          // Speichere die Daten nach erfolgreicher Bestellung
          this.saveUserData();

          // Clear cart after successful order creation
          this.cartService.clearCart();
          this.loading = false;
          this.loadingService.stopAll();

          if (this.selectedPaymentMethod === 'card' || this.selectedPaymentMethod === 'paypal') {
            // Create Stripe checkout session and redirect (includes PayPal option)
            const successUrl = window.location.origin + '/order-confirmation/' + orderId;
            const cancelUrl = window.location.origin + '/checkout';
            const customerEmail = this.isAuthenticated ? undefined : this.customerInfo.email;
            this.loadingService.start('place-order');
            this.paymentsService.createStripeCheckoutSession(orderId, successUrl, cancelUrl, customerEmail).subscribe({
              next: (data) => {
                this.loadingService.stopAll();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  // Fallback: go to confirmation and let webhook update status
                  this.router.navigate(['/order-confirmation', orderId]);
                }
              },
              error: (err) => {
                console.error('Failed to create checkout session:', err);
                this.loadingService.stopAll();
                // Show failure alert and stay on checkout
                this.showErrorMessage('Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
              }
            });
          } else {
            // Navigate to order confirmation immediately
            this.router.navigate(['/order-confirmation', orderId]);
          }
        },
        error: (error) => {
          this.loading = false;
          this.loadingService.stopAll();
          console.error('Order placement failed:', error);
          // Show failure alert and stay on checkout
          this.showErrorMessage('Bestellung konnte nicht aufgegeben werden. Bitte versuchen Sie es erneut.');
        }
      });
  }
}
