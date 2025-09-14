import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface WholesalerData {
  id: number;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact_info: {
    phone: string;
    email?: string;
    website?: string;
  };
  images: {
    logo?: string;
    banner?: string;
    gallery: string[];
  };
  is_active: boolean;
  is_verified: boolean;
  registration_status: string;
  owner_name?: string;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

interface WholesalerProduct {
  id: number;
  wholesaler_id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
  wholesale_price?: number;
  min_order_quantity: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  images: string[];
}

interface CartItem {
  product: WholesalerProduct;
  wholesaler: WholesalerData;
  quantity: number;
  unit_price: number;
  total_price: number;
}

@Component({
  selector: 'app-wholesaler-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wholesaler-detail-container">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
            <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>Produkte werden geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Fehler beim Laden</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" (click)="loadWholesalerAndProducts()">Erneut versuchen</button>
      </div>

      <!-- Main Content -->
      <div *ngIf="!loading && !error && wholesaler" class="detail-content">
        <!-- Header with Back Button -->
        <div class="detail-header">
          <button class="back-button" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            Zurück zu Großhändlern
          </button>
          <div class="wholesaler-info">
            <div class="wholesaler-logo">
              <div class="logo-placeholder">{{ wholesaler.name.charAt(0).toUpperCase() }}</div>
            </div>
            <div class="wholesaler-details">
              <h1>{{ wholesaler.name }}</h1>
              <p class="description">{{ wholesaler.description }}</p>
              <div class="wholesaler-meta">
                <span class="status-badge" [class.active]="wholesaler.is_active && wholesaler.is_verified">
                  {{ wholesaler.is_active && wholesaler.is_verified ? 'Aktiv' : 'Inaktiv' }}
                </span>
                <span class="location">{{ wholesaler.address.city }}, {{ wholesaler.address.country }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Summary (always visible) -->
        <div class="cart-summary-sticky">
          <div class="cart-summary" [class.empty]="cartItems.length === 0">
            <span *ngIf="cartItems.length > 0">{{ cartItems.length }} Produkte im Warenkorb</span>
            <span *ngIf="cartItems.length === 0" class="empty-cart-text">Warenkorb ist leer</span>
            <span *ngIf="cartItems.length > 0" class="total">€{{ getCartTotal().toFixed(2) }}</span>
            <button class="btn-primary cart-view-btn" (click)="viewCart()">Warenkorb anzeigen</button>
          </div>
        </div>

        <!-- Products Section -->
        <div class="products-section">
          <div class="products-header">
            <h2>Produkte</h2>
            <div class="products-count">{{ filteredProducts.length }} Produkte verfügbar</div>
          </div>

          <!-- Category Filter -->
          <div class="categories-filter" *ngIf="productCategories.length > 0">
            <button
              class="category-btn"
              [class.active]="selectedCategory === ''"
              (click)="filterProducts('')"
            >
              Alle Kategorien
            </button>
            <button
              class="category-btn"
              *ngFor="let category of productCategories"
              [class.active]="selectedCategory === category"
              (click)="filterProducts(category)"
            >
              {{ category }}
            </button>
          </div>

          <!-- Products Grid -->
          <div class="products-grid">
            <div class="product-card" *ngFor="let product of filteredProducts">
              <!-- Product Image Section -->
              <div class="product-image-section">
                <div class="product-image-container">
                  <div class="image-placeholder" *ngIf="product.images.length === 0">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <img *ngIf="product.images.length > 0" [src]="product.images[0]" [alt]="product.name" class="product-image" />
                  <div class="product-overlay">
                    <div class="quick-add">
                      <button
                        class="quick-add-btn"
                        (click)="getProductQuantity(product) > 0 ? decreaseQuantity(product) : increaseQuantity(product)"
                        [class.in-cart]="getProductQuantity(product) > 0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        <span *ngIf="getProductQuantity(product) === 0">Hinzufügen</span>
                        <span *ngIf="getProductQuantity(product) > 0">{{ getProductQuantity(product) }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Stock Badge -->
                <div class="stock-indicator" [class.low-stock]="product.stock_quantity < 10" [class.out-of-stock]="product.stock_quantity === 0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>{{ product.stock_quantity }} {{ product.unit }}</span>
                </div>
              </div>

              <!-- Product Info Section -->
              <div class="product-info">
                <!-- Product Title & Category -->
                <div class="product-header">
                  <h3 class="product-title">{{ product.name }}</h3>
                  <span class="product-category" *ngIf="product.category">{{ product.category }}</span>
                </div>

                <!-- Product Description -->
                <p class="product-description" *ngIf="product.description">{{ product.description }}</p>

                <!-- Product Price Section -->
                <div class="product-pricing">
                  <div class="price-main">
                    <span class="current-price">€{{ (product.wholesale_price || product.price).toFixed(2) }}</span>
                    <span class="price-unit">/ {{ product.unit }}</span>
                  </div>
                  <div class="price-info" *ngIf="product.min_order_quantity > 1">
                    <span class="min-order-info">Mindestbestellung: {{ product.min_order_quantity }} {{ product.unit }}</span>
                  </div>
                </div>

                <!-- Product Rating (Placeholder) -->
                <div class="product-rating">
                  <span class="rating-text">4.2 von 5 Sternen (24 Bewertungen)</span>
                </div>

                <!-- Product Actions -->
                <div class="product-actions">
                  <div class="quantity-selector" *ngIf="getProductQuantity(product) > 0">
                    <button class="qty-control" (click)="decreaseQuantity(product)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span class="qty-display">{{ getProductQuantity(product) }}</span>
                    <button class="qty-control" (click)="increaseQuantity(product)" [disabled]="getProductQuantity(product) >= product.stock_quantity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>

                  <button
                    class="add-to-cart-btn"
                    [class.in-cart]="getProductQuantity(product) > 0"
                    (click)="getProductQuantity(product) > 0 ? null : increaseQuantity(product)"
                    [disabled]="product.stock_quantity === 0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span *ngIf="getProductQuantity(product) === 0">In den Warenkorb</span>
                    <span *ngIf="getProductQuantity(product) > 0">Im Warenkorb</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Products State -->
          <div class="empty-state" *ngIf="filteredProducts.length === 0">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3h18v18H3z"/>
                <path d="M9 9h6v6H9z"/>
              </svg>
            </div>
            <h3>Keine Produkte verfügbar</h3>
            <p>Dieser Großhändler hat aktuell keine Produkte in dieser Kategorie.</p>
          </div>
        </div>
      </div>


      <!-- Cart Modal -->
      <div class="modal-overlay" *ngIf="showCart" (click)="closeCart()">
        <div class="modal-content cart-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Warenkorb</h2>
            <button class="close-btn modal-close-btn" (click)="closeCart()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Cart Items -->
            <div class="cart-items" *ngIf="cartItems.length > 0">
              <div class="cart-item" *ngFor="let item of cartItems">
                <div class="item-main">
                  <div class="item-info">
                    <h4>{{ item.product.name }}</h4>
                    <p>{{ item.wholesaler.name }}</p>
                    <div class="item-details">
                      <span>{{ item.quantity }} × €{{ item.unit_price.toFixed(2) }}</span>
                      <span class="item-total">€{{ item.total_price.toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="item-image">
                    <img
                      *ngIf="item.product.images && item.product.images.length > 0"
                      [src]="item.product.images[0]"
                      [alt]="item.product.name"
                      (error)="onImageError($event)"
                      loading="lazy"
                    />
                    <div class="no-image" *ngIf="!item.product.images || item.product.images.length === 0">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="item-actions">
                  <button class="remove-btn" (click)="removeFromCart(item)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Cart Summary -->
            <div class="cart-summary" *ngIf="cartItems.length > 0">
              <div class="summary-row">
                <span>Gesamt:</span>
                <span class="total-amount">€{{ getCartTotal().toFixed(2) }}</span>
              </div>
            </div>

            <!-- Cart Warning for Invalid Items -->
            <div class="cart-warning" *ngIf="hasInvalidCartItems()">
              <div class="warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p>Einige Produkte im Warenkorb gehören zu einem anderen Großhändler. Bitte entfernen Sie diese Produkte oder wechseln Sie zum entsprechenden Großhändler.</p>
            </div>

            <!-- Order Form -->
            <div class="order-form" *ngIf="cartItems.length > 0 && !hasInvalidCartItems()">
              <h4>Lieferdetails</h4>
              <div class="form-group">
                <label for="delivery-date">Lieferdatum:</label>
                <input
                  id="delivery-date"
                  type="date"
                  [(ngModel)]="deliveryDate"
                  [min]="getMinDeliveryDate()"
                />
              </div>
              <div class="form-group">
                <label for="order-notes">Notizen:</label>
                <textarea
                  id="order-notes"
                  [(ngModel)]="orderNotes"
                  placeholder="Besondere Anweisungen..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            <!-- Empty Cart -->
            <div class="empty-cart" *ngIf="cartItems.length === 0">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <h3>Warenkorb ist leer</h3>
              <p>Fügen Sie Produkte zum Warenkorb hinzu, um eine Bestellung aufzugeben.</p>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeCart()">Weiter einkaufen</button>
            <button class="btn-success" (click)="placeOrder()" [disabled]="cartItems.length === 0 || placingOrder || hasInvalidCartItems()">
              <svg *ngIf="!placingOrder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <svg *ngIf="placingOrder" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
                <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ placingOrder ? 'Bestellung wird aufgegeben...' : 'Bestellung aufgeben' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wholesaler-detail-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      background: var(--gradient-light-green);
      min-height: 100vh;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: var(--space-4);
      color: var(--color-primary);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Error State */
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      margin: var(--space-6) 0;
    }

    .error-icon {
      margin-bottom: var(--space-4);
      color: var(--color-danger);
    }

    .error-container h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .error-container p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
    }

    /* Detail Header */
    .detail-header {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      color: var(--color-text);
      cursor: pointer;
      transition: all var(--transition);
      margin-bottom: var(--space-4);
    }

    .back-button:hover {
      background: var(--bg-light);
      border-color: var(--color-primary);
    }

    .wholesaler-info {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .wholesaler-logo {
      flex-shrink: 0;
    }

    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: var(--gradient-primary);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--text-2xl);
      font-weight: 700;
    }

    .wholesaler-details h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .description {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .wholesaler-meta {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.active {
      background: var(--color-success);
      color: white;
    }

    .location {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Cart Summary Sticky */
    .cart-summary-sticky {
      position: sticky;
      top: 20px;
      z-index: 1000;
      margin-bottom: var(--space-6);
    }

    .cart-summary {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5a47 100%);
      color: white;
      padding: var(--space-5);
      border-radius: var(--radius-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 8px 32px rgba(26, 77, 58, 0.3);
      border: 2px solid #3d7c5f;
      backdrop-filter: blur(10px);
      transition: all var(--transition);
      position: relative;
      pointer-events: auto;
    }

    .cart-summary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(26, 77, 58, 0.4);
      border-color: #4a8b6e;
    }

    .cart-summary .total {
      font-weight: 800;
      font-size: var(--text-xl);
      color: #a8d5ba;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .empty-cart-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: var(--text-base);
      font-weight: 500;
    }
      
    .cart-summary.empty:hover {
      box-shadow: 0 8px 32px rgba(74, 93, 74, 0.4);
    }

    /* Products Section */
    .products-section {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }

    .products-header h2 {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .products-count {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Categories Filter */
    .categories-filter {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
    }

    .category-btn {
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      font-size: var(--text-sm);
    }

    .category-btn:hover {
      background: var(--bg-light);
    }

    .category-btn.active {
      background: var(--gradient-primary);
      color: white;
      border-color: var(--color-primary);
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .product-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary-200);
    }

    /* Product Image Section */
    .product-image-section {
      position: relative;
      width: 100%;
      height: 240px;
      background: var(--bg-light);
      overflow: hidden;
    }

    .product-image-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-light-green) 100%);
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition);
    }

    .product-card:hover .product-image {
      transform: scale(1.08);
    }

    .product-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      opacity: 0;
      transition: opacity var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-card:hover .product-overlay {
      opacity: 1;
    }

    .quick-add {
      transform: translateY(20px);
      transition: transform var(--transition);
    }

    .product-card:hover .quick-add {
      transform: translateY(0);
    }

    .quick-add-btn {
      background: rgba(255, 255, 255, 0.9);
      color: var(--color-primary);
      border: none;
      border-radius: var(--radius-full);
      padding: var(--space-3) var(--space-5);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: var(--shadow-md);
      height: 40px;
      backdrop-filter: blur(10px);
    }

    .quick-add-btn:hover {
      background: rgba(26, 77, 58, 0.9);
      color: white;
      transform: scale(1.05);
      backdrop-filter: blur(15px);
    }

    .quick-add-btn.in-cart {
      background: var(--color-success);
      color: white;
    }

    .stock-indicator {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      background: var(--color-success);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--space-1);
      box-shadow: var(--shadow-sm);
    }

    .stock-indicator.low-stock {
      background: var(--color-warning);
      color: var(--color-heading);
    }

    .stock-indicator.out-of-stock {
      background: var(--color-danger);
    }

    /* Product Info Section */
    .product-info {
      padding: var(--space-3);
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      justify-content: space-between;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .product-title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      line-height: 1.3;
      flex: 1;
    }

    .product-category {
      background: var(--bg-light-green);
      color: var(--color-success);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .product-description {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
      min-height: 2.5em;
    }

    .product-pricing {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex-shrink: 0;
    }

    .price-main {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .current-price {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-primary);
      line-height: 1;
    }

    .price-unit {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 500;
    }

    .price-info {
      margin-top: var(--space-1);
    }

    .min-order-info {
      font-size: var(--text-xs);
      color: var(--color-warning);
      font-weight: 500;
      background: rgba(245, 158, 11, 0.1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      display: inline-block;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }

    .stars {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .star {
      color: var(--color-warning);
      font-size: var(--text-sm);
    }

    .star.empty {
      color: var(--color-muted);
    }

    .rating-text {
      font-size: var(--text-xs);
      color: var(--color-muted);
      font-weight: 500;
    }

    /* Product Actions */
    .product-actions {
      padding: var(--space-3);
      border-top: 1px solid var(--color-border);
      background: var(--bg-light);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-top: auto;
      flex-shrink: 0;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-2);
      border: 1px solid var(--color-border);
    }

    .qty-control {
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
      font-size: var(--text-sm);
    }

    .qty-control:hover:not(:disabled) {
      background: var(--bg-light);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .qty-control:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .qty-display {
      min-width: 40px;
      text-align: center;
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .add-to-cart-btn {
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      padding: var(--space-2-5) var(--space-4);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      width: 100%;
      font-size: var(--text-sm);
      height: 36px;
    }

    .add-to-cart-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .add-to-cart-btn.in-cart {
      background: var(--color-success);
    }

    .add-to-cart-btn:disabled {
      background: var(--color-muted);
      cursor: not-allowed;
      transform: none;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      color: var(--color-muted);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-state p {
      margin: 0;
      color: var(--color-muted);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(4px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 9999 !important;
      padding: var(--space-4) !important;
      animation: modalFadeIn 0.3s ease-out !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(4px);
      }
    }

    .modal-content {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 60px rgba(26, 77, 58, 0.15), 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 650px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid rgba(61, 124, 95, 0.2);
      animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 10001;
      pointer-events: auto;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-header {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5a47 100%);
      color: white;
      padding: var(--space-6);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(26, 77, 58, 0.3);
      position: relative;
    }

    .modal-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    /* Specific styling for modal close button */
    .modal-close-btn {
      position: relative !important;
      z-index: 10000 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .modal-close-btn:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: var(--color-text) !important;
      transform: scale(1.1) !important;
    }

    .modal-body {
      padding: var(--space-6);
    }

    .modal-actions {
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
    }

    /* Cart Modal Specific Styles */
    .cart-modal {
      max-width: 600px;
    }

    .cart-items {
      margin-bottom: var(--space-6);
    }

    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-5);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      border: 1px solid rgba(61, 124, 95, 0.1);
      box-shadow: 0 2px 8px rgba(26, 77, 58, 0.08);
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
    }

    .cart-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #1a4d3a 0%, #2d5a47 100%);
    }

    .cart-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(26, 77, 58, 0.15);
      border-color: rgba(61, 124, 95, 0.2);
    }

    .item-main {
      display: flex;
      flex: 1;
      gap: var(--space-4);
      align-items: center;
    }

    .item-info {
      flex: 1;
    }

    .item-info h4 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      line-height: 1.3;
    }

    .item-info p {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 500;
    }

    .item-image {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(61, 124, 95, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-md);
    }

    .no-image {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      background: rgba(255, 255, 255, 0.8);
      border-radius: var(--radius-md);
    }

    .no-image svg {
      opacity: 0.6;
    }

    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-sm);
      color: var(--color-text);
      background: rgba(255, 255, 255, 0.6);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      min-width: 120px;
    }

    .item-total {
      font-weight: 700;
      font-size: var(--text-base);
      color: #1a4d3a;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .remove-btn:hover {
      background: var(--color-danger);
      color: white;
    }

    .cart-summary {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5a47 100%);
      color: white;
      padding: var(--space-5);
      box-shadow: 0 8px 32px rgba(26, 77, 58, 0.3);
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100%;
      z-index: 1000;
      overflow: hidden;
    }

    .cart-summary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-lg);
      font-weight: 600;
      position: relative;
      z-index: 1;
    }

    .total-amount {
      color: #a8d5ba;
      font-size: var(--text-2xl);
      font-weight: 800;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .order-form {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 2px solid rgba(61, 124, 95, 0.2);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      margin-bottom: var(--space-6);
      box-shadow: 0 4px 16px rgba(26, 77, 58, 0.1);
      position: relative;
      overflow: hidden;
    }

    .order-form::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #1a4d3a 0%, #2d5a47 100%);
    }

    .order-form h4 {
      margin: 0 0 var(--space-4) 0;
      color: #1a4d3a;
      font-size: var(--text-lg);
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 500;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: 2px solid rgba(61, 124, 95, 0.2);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-family: inherit;
      background: rgba(255, 255, 255, 0.8);
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(26, 77, 58, 0.05);
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #2d5a47;
      box-shadow: 0 0 0 3px rgba(45, 90, 71, 0.1), 0 4px 16px rgba(26, 77, 58, 0.1);
      background: white;
      transform: translateY(-1px);
    }

    .empty-cart {
      text-align: center;
      padding: var(--space-8);
    }

    .empty-cart h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-cart p {
      margin: 0;
      color: var(--color-muted);
    }

    /* Cart Warning */
    .cart-warning {
      background: var(--color-danger-light);
      border: 1px solid var(--color-danger);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .warning-icon {
      color: var(--color-danger);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .cart-warning p {
      margin: 0;
      color: var(--color-danger-dark);
      font-size: var(--text-sm);
      line-height: 1.4;
    }

    /* Button Styles */
    .btn-primary {
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      position: relative;
      z-index: 10;
      pointer-events: auto;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-primary:disabled {
      background: var(--color-muted);
      cursor: not-allowed;
      transform: none;
    }

    /* Specific styling for cart view button */
    .cart-view-btn {
      position: relative !important;
      z-index: 1001 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .cart-view-btn:hover {
      background: var(--color-primary-dark) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-border);
    }

    .btn-success {
      background: var(--color-success);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-success:hover:not(:disabled) {
      background: var(--color-success-dark);
      transform: translateY(-1px);
    }

    .btn-success:disabled {
      background: var(--color-muted);
      cursor: not-allowed;
      transform: none;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .wholesaler-detail-container {
        padding: 0 var(--space-6) var(--space-8) var(--space-6);
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }

      .product-image-section {
        height: 220px;
      }

      .product-info {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .product-title {
        font-size: var(--text-base);
      }

      .current-price {
        font-size: var(--text-lg);
      }
    }

    @media (max-width: 768px) {
      .wholesaler-detail-container {
        padding: 0 var(--space-4) var(--space-12) var(--space-4);
      }

      .detail-header {
        padding: var(--space-4);
      }

      .wholesaler-info {
        flex-direction: column;
        gap: var(--space-3);
      }

      .wholesaler-details h1 {
        font-size: var(--text-2xl);
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: var(--space-3);
      }

      .products-header {
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
      }

      .cart-summary {
        flex-direction: column;
        gap: var(--space-2);
        text-align: center;
      }

      .product-image-section {
        height: 200px;
      }

      .product-info {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .product-title {
        font-size: var(--text-base);
      }

      .current-price {
        font-size: var(--text-lg);
      }

      .product-description {
        font-size: var(--text-xs);
        -webkit-line-clamp: 2;
      }

      .product-actions {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .quantity-selector {
        padding: var(--space-1);
      }

      .qty-control {
        width: 32px;
        height: 32px;
      }

      .qty-display {
        min-width: 35px;
        font-size: var(--text-xs);
      }

      .add-to-cart-btn {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
      }

      .modal-content {
        margin: var(--space-4);
        max-height: 95vh;
      }
    }

    @media (max-width: 480px) {
      .products-grid {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .product-image-section {
        height: 180px;
      }

      .product-info {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .product-title {
        font-size: var(--text-sm);
      }

      .current-price {
        font-size: var(--text-base);
      }

      .product-description {
        font-size: var(--text-xs);
        -webkit-line-clamp: 1;
      }

      .product-rating {
        gap: var(--space-1);
      }

      .stars {
        gap: 1px;
      }

      .rating-text {
        font-size: 10px;
      }

      .product-actions {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .quantity-selector {
        padding: var(--space-1);
      }

      .qty-control {
        width: 28px;
        height: 28px;
      }

      .qty-display {
        min-width: 30px;
        font-size: var(--text-xs);
      }

      .add-to-cart-btn {
        padding: var(--space-2);
        font-size: var(--text-xs);
      }

      .stock-indicator {
        top: var(--space-2);
        right: var(--space-2);
        padding: var(--space-1) var(--space-1-5);
        font-size: 10px;
      }
    }
  `]
})
export class WholesalerDetailComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  wholesaler: WholesalerData | null = null;
  products: WholesalerProduct[] = [];
  filteredProducts: WholesalerProduct[] = [];
  productCategories: string[] = [];
  selectedCategory = '';
  loading = false;
  error: string | null = null;

  // Cart properties
  showCart = false;
  cartItems: CartItem[] = [];
  deliveryDate = '';
  orderNotes = '';
  placingOrder = false;
  private routeSub?: any;

  ngOnInit() {
    // Subscribe to param changes so navigating between wholesalers updates state
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      
      if (id) {
        // Clear state when switching wholesalers
        this.wholesaler = null;
        this.products = [];
        this.filteredProducts = [];
        this.cartItems = [];
        this.loading = true;
        this.error = null;
        
        this.loadWholesalerAndProducts(+id);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub && typeof this.routeSub.unsubscribe === 'function') {
      this.routeSub.unsubscribe();
    }
  }

  loadWholesalerAndProducts(wholesalerId?: number) {
    const id = wholesalerId || this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Load wholesaler details
    this.http.get<{ wholesaler: WholesalerData }>(`${environment.apiUrl}/restaurant-managers/wholesalers/${id}`)
      .subscribe({
        next: (wholesalerResponse) => {
          const newWholesaler = wholesalerResponse.wholesaler;

          // Clear cart if switching to a different wholesaler
          if (this.wholesaler && this.wholesaler.id !== newWholesaler.id) {
            this.cartItems = [];
          }

          this.wholesaler = newWholesaler;

          // Load products
          this.http.get<{ products: WholesalerProduct[]; wholesaler: any }>(
            `${environment.apiUrl}/restaurant-managers/wholesalers/${id}/products?is_available=true`
          ).subscribe({
            next: (productsResponse) => {
              this.products = productsResponse.products;
              this.productCategories = [...new Set(productsResponse.products.map(p => p.category).filter((cat): cat is string => Boolean(cat)))];
              this.filteredProducts = this.products;
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading products:', error);
              this.error = 'Fehler beim Laden der Produkte. Bitte versuchen Sie es später erneut.';
              this.loading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading wholesaler:', error);
          this.error = 'Fehler beim Laden des Großhändlers. Bitte versuchen Sie es später erneut.';
          this.loading = false;
        }
      });
  }

  goBack() {
    this.router.navigate(['/restaurant-manager/wholesale']);
  }

  filterProducts(category: string) {
    this.selectedCategory = category;
    if (category === '') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }
  }

  // Cart methods
  viewCart() {
    this.showCart = true;
  }

  closeCart() {
    this.showCart = false;
  }

  getProductQuantity(product: WholesalerProduct): number {
    if (!this.wholesaler) return 0;
    const cartItem = this.cartItems.find(item =>
      item.product.id === product.id &&
      item.wholesaler.id === this.wholesaler!.id
    );
    return cartItem ? cartItem.quantity : 0;
  }

  setProductQuantity(product: WholesalerProduct, event: any) {
    const quantity = parseInt(event.target.value) || 0;
    this.updateCartItem(product, quantity);
  }

  increaseQuantity(product: WholesalerProduct) {
    const currentQty = this.getProductQuantity(product);
    if (currentQty < product.stock_quantity) {
      this.updateCartItem(product, currentQty + 1);
    }
  }

  decreaseQuantity(product: WholesalerProduct) {
    const currentQty = this.getProductQuantity(product);
    if (currentQty > 0) {
      this.updateCartItem(product, currentQty - 1);
    }
  }

  private updateCartItem(product: WholesalerProduct, quantity: number) {
    if (!this.wholesaler) {
      return;
    }

    // Prevent adding items that don't belong to the current wholesaler
    if (product.wholesaler_id !== this.wholesaler.id) {
      console.warn('Product belongs to a different wholesaler. Blocking add to cart.');
      alert('Dieses Produkt gehört zu einem anderen Großhändler. Bitte wechseln Sie zum passenden Großhändler.');
      return;
    }

    const existingIndex = this.cartItems.findIndex(item =>
      item.product.id === product.id &&
      item.wholesaler.id === this.wholesaler!.id
    );

    if (quantity <= 0) {
      // Remove item from cart
      if (existingIndex >= 0) {
        this.cartItems.splice(existingIndex, 1);
      }
    } else {
      // Add or update item in cart
      const unitPrice = product.wholesale_price || product.price;
      const totalPrice = quantity * unitPrice;

      const cartItem: CartItem = {
        product,
        wholesaler: this.wholesaler,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      };

      if (existingIndex >= 0) {
        this.cartItems[existingIndex] = cartItem;
      } else {
        this.cartItems.push(cartItem);
      }
    }
  }

  removeFromCart(item: CartItem) {
    const index = this.cartItems.indexOf(item);
    if (index >= 0) {
      this.cartItems.splice(index, 1);
    }
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.total_price, 0);
  }

  hasInvalidCartItems(): boolean {
    if (!this.wholesaler) return false;
    return this.cartItems.some(item => item.wholesaler.id !== this.wholesaler!.id);
  }

  getMinDeliveryDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  async placeOrder() {
    if (this.cartItems.length === 0 || !this.wholesaler) {
      return;
    }

    this.placingOrder = true;

    try {
      // Double-check: ensure all cart items belong to current wholesaler
      const invalidItems = this.cartItems.filter(item => item.wholesaler.id !== this.wholesaler!.id);

      if (invalidItems.length > 0) {
        throw new Error(`Einige Produkte im Warenkorb gehören zu einem anderen Großhändler. Warenkorb wurde geleert.`);
      }

      const orderData = {
        wholesaler_id: this.wholesaler.id,
        items: this.cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        delivery_date: this.deliveryDate,
        notes: this.orderNotes
      };

      const response = await this.http.post(
        `${environment.apiUrl}/wholesaler-orders`,
        orderData
      ).toPromise();

      // Success - clear cart and close modal
      this.cartItems = [];
      this.deliveryDate = '';
      this.orderNotes = '';
      this.closeCart();

      // Show success message
      alert('Bestellung erfolgreich aufgegeben!');

    } catch (error: any) {
      console.error('Error placing order:', error);

      // If invalid items were found, clear the cart
      if (error.message && error.message.includes('anderen Großhändler')) {
        this.cartItems = [];
        this.closeCart();
        alert(error.message);
      } else {
        alert('Fehler beim Aufgeben der Bestellung. Bitte versuchen Sie es erneut.');
      }
    } finally {
      this.placingOrder = false;
    }
  }

  // Handle image loading errors
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const noImageDiv = parent.querySelector('.no-image') as HTMLElement;
      if (noImageDiv) {
        noImageDiv.style.display = 'flex';
      }
    }
  }
}

