import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, Cart, CartItem } from '../../core/services/supplier.service';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable, map } from 'rxjs';

interface DeliveryAddress {
  street: string;
  city: string;
  postal_code: string;
  instructions?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageFallbackDirective],
  template: `
    <div class="checkout-container">
      <div class="checkout-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
          Zurück zum Restaurant
        </button>
        <h1>Warenkorb</h1>
      </div>

      <div class="checkout-content" *ngIf="cart$ | async as cart; else emptyCart">
        <div class="checkout-main">
          <!-- Cart Items -->
          <div class="cart-section">
            <h2>Bestellung von {{ cart.restaurant_name }}</h2>

            <div class="cart-items">
              <div *ngFor="let item of cart.items" class="cart-item">
                <div class="item-image">
                  <img [src]="item.image_url || ''" [alt]="item.name" appImageFallback>
                </div>

                <div class="item-details">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <div class="item-price">{{ item.unit_price | currency:'EUR':'symbol':'1.2-2':'de' }} / Stück</div>

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

                <div class="item-total">
                  <div class="total-price">{{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                  <button
                    class="remove-btn"
                    (click)="removeItem(item.menu_item_id)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Address -->
          <div class="delivery-section">
            <h2>Lieferadresse</h2>

            <div class="address-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="street">Straße und Hausnummer</label>
                  <input
                    id="street"
                    type="text"
                    [(ngModel)]="deliveryAddress.street"
                    placeholder="Musterstraße 123"
                    required
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
                    placeholder="Musterstadt"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="postal_code">PLZ</label>
                  <input
                    id="postal_code"
                    type="text"
                    [(ngModel)]="deliveryAddress.postal_code"
                    placeholder="12345"
                    required
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="instructions">Lieferhinweise (optional)</label>
                <textarea
                  id="instructions"
                  [(ngModel)]="deliveryAddress.instructions"
                  placeholder="z.B. Bitte klingeln bei Müller"
                  rows="3">
                </textarea>
              </div>
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
              <span>Liefergebühr:</span>
              <span>{{ cart.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>

            <div class="summary-row total">
              <span>Gesamt:</span>
              <span>{{ cart.total | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
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
              <span *ngIf="!loading">
                <i class="fa-solid fa-shopping-cart"></i>
                Jetzt bestellen
              </span>
              <span *ngIf="loading" class="loading-text">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Bestellung wird aufgegeben...
              </span>
            </button>

            <div class="order-info">
              <p><i class="fa-solid fa-clock"></i> Geschätzte Lieferzeit: 30-45 Min</p>
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

    .cart-section, .delivery-section, .payment-section, .customer-info-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .cart-section h2, .delivery-section h2, .payment-section h2, .customer-info-section h2 {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-primary);
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--bg-light);
    }

    .item-image {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-border);
      flex-shrink: 0;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .item-price {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .selected-variants {
      margin-top: var(--space-2);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .variant-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: var(--color-primary-50);
      color: var(--color-primary-700);
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .variant-price {
      color: var(--color-primary-600);
      font-weight: 600;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .quantity-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
    }

    .quantity-btn:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity {
      font-weight: 600;
      min-width: 30px;
      text-align: center;
    }

    .item-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-2);
    }

    .total-price {
      font-weight: 700;
      color: var(--color-success);
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .remove-btn:hover {
      background: color-mix(in oklab, var(--color-danger) 10%, white);
    }

    .address-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
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
  `]
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private ordersService = inject(OrdersService);
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private restaurantsService = inject(RestaurantsService);

  cart$ = this.cartService.cart$;
  loading = false;

  deliveryAddress: DeliveryAddress = {
    street: '',
    city: '',
    postal_code: '',
    instructions: ''
  };

  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: ''
  };

  selectedPaymentMethod = 'cash';
  isAuthenticated = false;
  availablePaymentMethods: { cash: boolean; card: boolean; paypal: boolean } | null = null;

  ngOnInit() {
    // Check if cart is empty and redirect if needed
    this.cart$.subscribe(cart => {
      if (!cart || cart.items.length === 0) {
        // Cart is empty, but we'll show the empty state
        this.availablePaymentMethods = null;
      } else {
        // Load payment methods for the restaurant
        this.loadRestaurantPaymentMethods(cart.restaurant_id);
      }
    });

    // Check authentication status immediately first
    this.isAuthenticated = this.authService.isAuthenticated();

    // Also listen for changes
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!(user && user.is_active);
    });
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

  updateQuantity(menuItemId: string, quantity: number) {
    this.cartService.updateQuantity(menuItemId, quantity);
  }

  removeItem(menuItemId: string) {
    this.cartService.removeFromCart(menuItemId);
  }

  isFormValid(): boolean {
    const deliveryValid = !!(
      this.deliveryAddress.street.trim() &&
      this.deliveryAddress.city.trim() &&
      this.deliveryAddress.postal_code.trim()
    );

    const paymentMethodValid = !!this.selectedPaymentMethod && this.isPaymentMethodAvailable(this.selectedPaymentMethod);

    const customerInfoValid = this.isAuthenticated || (
      !!this.customerInfo.name.trim() &&
      !!this.customerInfo.email.trim() &&
      !!this.customerInfo.phone?.trim()
    );

    return deliveryValid && paymentMethodValid && customerInfoValid;
  }

  public hasAvailablePaymentMethods(): boolean {
    if (!this.availablePaymentMethods) return true;
    return this.availablePaymentMethods.cash || this.availablePaymentMethods.card || this.availablePaymentMethods.paypal;
  }

  isMinimumOrderMet(cart: Cart): boolean {
    return this.cartService.isMinimumOrderMet();
  }

  placeOrder() {
    if (!this.isFormValid()) return;

    this.loading = true;

    const fullAddress = `${this.deliveryAddress.street}, ${this.deliveryAddress.postal_code} ${this.deliveryAddress.city}`;

    // Prepare customer info for guest orders
    const customerInfo = this.isAuthenticated ? undefined : {
      name: this.customerInfo.name.trim(),
      email: this.customerInfo.email.trim(),
      phone: this.customerInfo.phone?.trim() || undefined
    };

    // Guests can now use online payments (card/paypal)

    this.cartService.createOrder(fullAddress, this.deliveryAddress.instructions, this.selectedPaymentMethod, customerInfo)
      .subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Order placed successfully:', response);
          const orderId = response.order.id;
          if (this.selectedPaymentMethod === 'card' || this.selectedPaymentMethod === 'paypal') {
            // Create Stripe checkout session and redirect (includes PayPal option)
            const successUrl = window.location.origin + '/order-confirmation/' + orderId;
            const cancelUrl = window.location.origin + '/checkout';
            const customerEmail = this.isAuthenticated ? undefined : this.customerInfo.email;
            this.paymentsService.createStripeCheckoutSession(orderId, successUrl, cancelUrl, customerEmail).subscribe({
              next: (data) => {
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  // Fallback: go to confirmation and let webhook update status
                  this.router.navigate(['/order-confirmation', orderId]);
                }
              },
              error: (err) => {
                console.error('Failed to create checkout session:', err);
                alert('Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
                this.router.navigate(['/order-confirmation', orderId]);
              }
            });
          } else {
            // Navigate to order confirmation or order tracking
            this.router.navigate(['/order-confirmation', orderId]);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Order placement failed:', error);
          alert('Bestellung konnte nicht aufgegeben werden. Bitte versuchen Sie es erneut.');
        }
      });
  }

  selectCard() {
    this.selectedPaymentMethod = 'card';
  }

  selectPayPal() {
    this.selectedPaymentMethod = 'paypal';
  }

  goBack() {
    this.router.navigate(['/customer']);
  }

  goToRestaurants() {
    this.router.navigate(['/customer']);
  }
}