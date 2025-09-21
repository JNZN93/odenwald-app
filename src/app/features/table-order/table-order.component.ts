import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, startWith, switchMap, take, first } from 'rxjs/operators';
import { MenuItemsService } from '../../core/services/menu-items.service';
import { OrdersService } from '../../core/services/orders.service';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { RestaurantTablesService } from '../../core/services/restaurant-tables.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  selected_variant_options?: any[];
}

@Component({
  selector: 'app-table-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="table-order-container" *ngIf="tableData$ | async as tableData">
      <!-- Header -->
      <div class="order-header">
        <div class="restaurant-info">
          <h1>{{ tableData.restaurant?.name || 'Restaurant' }}</h1>
          <p class="table-info">🪑 Tisch {{ tableData.tableNumber }}</p>
        </div>
      </div>

      <!-- Menu Categories -->
      <div class="menu-section" *ngIf="menuItems$ | async as menuItems">
        <div class="categories">
          <button
            [class.active]="selectedCategory === ''"
            (click)="selectCategory('')"
            class="category-btn"
          >
            🍽️ Alle
          </button>
          <button
            *ngFor="let category of getCategories(menuItems)"
            [class.active]="selectedCategory === category"
            (click)="selectCategory(category)"
            class="category-btn"
          >
            {{ getCategoryIcon(category) }} {{ category }}
          </button>
        </div>

        <div class="menu-items">
          <div
            *ngFor="let item of getFilteredMenuItems(menuItems)"
            class="menu-item-card"
          >
            <div class="item-image">
              <img 
                [src]="item.image_url || '/assets/images/default-food.jpg'" 
                [alt]="item.name"
                (error)="onImageError($event)"
                loading="lazy"
              />
            </div>
            <div class="item-content">
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p class="description">{{ item.description }}</p>
                <div class="item-meta">
                  <span class="price">€{{ getItemPrice(item) }}</span>
                  <div class="item-badges" *ngIf="item.is_vegetarian || item.is_vegan">
                    <span class="badge vegetarian" *ngIf="item.is_vegetarian">
                      🌱 Vegetarisch
                    </span>
                    <span class="badge vegan" *ngIf="item.is_vegan">
                      🌿 Vegan
                    </span>
                  </div>
                </div>
              </div>
              <div class="item-actions">
                <button
                  (click)="addToCart(item)"
                  class="add-btn"
                  [disabled]="isInCart(item.id)"
                >
                  {{ isInCart(item.id) ? '✓ Im Warenkorb' : '+ Hinzufügen' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Modal Overlay (Mobile/Tablet) -->
      <div class="cart-modal-overlay" *ngIf="cartSidebarOpen && cartItems.length > 0" (click)="closeCartSidebar()">
        <div class="cart-modal" (click)="$event.stopPropagation()">
          <div class="cart-header">
            <h3>Warenkorb</h3>
            <button (click)="closeCartSidebar()" class="close-modal-btn">✕</button>
          </div>

        <div class="cart-items">
          <div *ngFor="let item of cartItems; let i = index" class="cart-item">
            <div class="item-details">
              <h4>{{ item.name }}</h4>
              <div class="quantity-controls">
                <button (click)="updateQuantity(i, item.quantity - 1)" class="qty-btn">-</button>
                <span class="quantity">{{ item.quantity }}</span>
                <button (click)="updateQuantity(i, item.quantity + 1)" class="qty-btn">+</button>
              </div>
            </div>
            <div class="item-price">€{{ (item.total_price || 0).toFixed(2) }}</div>
            <button (click)="removeFromCart(i)" class="remove-btn">❌</button>
          </div>
        </div>

        <div class="cart-total">
          <div class="total-row">
            <span>Gesamt:</span>
            <strong>€{{ getCartTotal().toFixed(2) }}</strong>
          </div>
        </div>

        <div class="order-actions">
          <div class="party-size">
            <label>Personenanzahl:</label>
            <input
              type="number"
              [(ngModel)]="partySize"
              min="1"
              max="20"
              class="party-input"
            >
          </div>

          <textarea
            [(ngModel)]="orderNotes"
            placeholder="Besondere Wünsche..."
            class="notes-input"
            rows="2"
          ></textarea>

          <button
            (click)="placeOrder()"
            class="order-btn"
            [disabled]="isPlacingOrder || cartItems.length === 0"
          >
            {{ isPlacingOrder ? 'Bestellung wird aufgegeben...' : 'Bestellung aufgeben' }}
          </button>
        </div>
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
      <div class="cart-sidebar desktop-only" *ngIf="cartItems.length > 0">
        <div class="cart-header">
          <h3>Warenkorb</h3>
          <button (click)="clearCart()" class="clear-btn">🗑️ Leeren</button>
        </div>

        <div class="cart-items">
          <div *ngFor="let item of cartItems; let i = index" class="cart-item">
            <div class="item-details">
              <h4>{{ item.name }}</h4>
              <div class="quantity-controls">
                <button (click)="updateQuantity(i, item.quantity - 1)" class="qty-btn">-</button>
                <span class="quantity">{{ item.quantity }}</span>
                <button (click)="updateQuantity(i, item.quantity + 1)" class="qty-btn">+</button>
              </div>
            </div>
            <div class="item-price">€{{ (item.total_price || 0).toFixed(2) }}</div>
            <button (click)="removeFromCart(i)" class="remove-btn">❌</button>
          </div>
        </div>

        <div class="cart-total">
          <div class="total-row">
            <span>Gesamt:</span>
            <strong>€{{ getCartTotal().toFixed(2) }}</strong>
          </div>
        </div>

        <div class="order-actions">
          <div class="party-size">
            <label>Personenanzahl:</label>
            <input
              type="number"
              [(ngModel)]="partySize"
              min="1"
              max="20"
              class="party-input"
            >
          </div>

          <textarea
            [(ngModel)]="orderNotes"
            placeholder="Besondere Wünsche..."
            class="notes-input"
            rows="2"
          ></textarea>

          <button
            (click)="placeOrder()"
            class="order-btn"
            [disabled]="isPlacingOrder || cartItems.length === 0"
          >
            {{ isPlacingOrder ? 'Bestellung wird aufgegeben...' : 'Bestellung aufgeben' }}
          </button>
        </div>
      </div>

      <!-- Mobile Cart Button (Floating) -->
      <div class="mobile-cart-btn" *ngIf="cartItems.length > 0" (click)="openCartSidebar()">
        <i class="fa-solid fa-shopping-cart"></i>
        <div class="cart-info">
          <span class="cart-count">{{ cartItems.length }} Artikel</span>
          <span class="cart-total">€{{ getCartTotal().toFixed(2) }}</span>
        </div>
      </div>

      <!-- Order Success Modal -->
      <div class="success-modal" *ngIf="orderSuccess" (click)="closeSuccessModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="success-icon">✅</div>
          <h2>Bestellung erfolgreich!</h2>
          <p>Ihre Bestellung wurde an die Küche weitergeleitet.</p>
          <p class="order-number">Bestellnummer: #{{ orderId }}</p>
          <button (click)="closeSuccessModal()" class="close-success-btn">
            Neue Bestellung
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Bestellung wird geladen...</p>
      </div>
    </div>
  `,
  styles: [`
    .table-order-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-4);
      min-height: 100vh;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
    }

    .restaurant-info h1 {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .table-info {
      font-size: var(--text-lg);
      color: var(--color-muted);
    }

    .cart-summary {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-1);
    }

    .cart-count {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .cart-total {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    .mobile-cart-btn {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-600) 100%);
      color: white;
      border: none;
      border-radius: 20px;
      min-width: 120px;
      height: 56px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
      overflow: hidden;
    }

    .mobile-cart-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
    }

    .mobile-cart-btn:active {
      transform: translateY(0) scale(0.98);
      transition: all 0.1s ease;
    }

    .mobile-cart-btn i {
      font-size: 18px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    .mobile-cart-btn .cart-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
      flex-shrink: 0;
    }

    .mobile-cart-btn .cart-count {
      font-size: 11px;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .mobile-cart-btn .cart-total {
      font-size: 12px;
      font-weight: 800;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    .menu-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .categories {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      overflow-x: auto;
      padding-bottom: var(--space-2);
    }

    .category-btn {
      padding: var(--space-3) var(--space-4);
      background: var(--color-gray-100);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
    }

    .category-btn:hover {
      background: var(--color-gray-200);
    }

    .category-btn.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .menu-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .menu-item-card {
      display: flex;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: white;
      overflow: hidden;
      transition: all var(--transition);
    }

    .menu-item-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    .item-image {
      flex-shrink: 0;
      width: 120px;
      height: 120px;
      overflow: hidden;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }

    .menu-item-card:hover .item-image img {
      transform: scale(1.05);
    }

    .item-content {
      flex: 1;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .item-info {
      flex: 1;
    }

    .item-info h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .description {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-2);
    }

    .item-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    .item-badges {
      display: flex;
      gap: var(--space-1);
    }

    .badge {
      padding: 2px 8px;
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .badge.vegetarian {
      background: #d4edda;
      color: #155724;
    }

    .badge.vegan {
      background: #d1ecf1;
      color: #0c5460;
    }

    .add-btn {
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .add-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .add-btn:disabled {
      background: var(--color-success);
      cursor: not-allowed;
      transform: none;
    }

    .cart-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1050;
      display: flex;
      align-items: flex-end;
    }

    .cart-modal {
      background: white;
      width: 100%;
      max-height: 80vh;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      padding: var(--space-6);
      overflow-y: auto;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .close-modal-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      cursor: pointer;
      color: var(--color-muted);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-modal-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .desktop-only {
      display: block;
    }

    .cart-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      border-left: 1px solid var(--color-border);
      box-shadow: var(--shadow-xl);
      padding: var(--space-6);
      overflow-y: auto;
      z-index: 1000;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .cart-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      font-size: var(--text-lg);
    }

    .cart-items {
      margin-bottom: var(--space-6);
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .item-details {
      flex: 1;
    }

    .item-details h4 {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .qty-btn {
      width: 30px;
      height: 30px;
      border: 1px solid var(--color-border);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 600;
    }

    .quantity {
      font-weight: 600;
      min-width: 30px;
      text-align: center;
    }

    .item-price {
      font-weight: 600;
      color: var(--color-text);
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      font-size: var(--text-lg);
    }

    .cart-total {
      padding: var(--space-4);
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-6);
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-lg);
    }

    .order-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .party-size {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .party-size label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .party-input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
    }

    .notes-input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      resize: vertical;
    }

    .order-btn {
      padding: var(--space-4);
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .order-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .order-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .success-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal-content {
      background: white;
      padding: var(--space-8);
      border-radius: var(--radius-xl);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: var(--space-4);
    }

    .modal-content h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-4);
    }

    .modal-content p {
      color: var(--color-muted);
      margin-bottom: var(--space-2);
    }

    .order-number {
      font-weight: 600;
      color: var(--color-primary);
      font-size: var(--text-lg);
    }

    .close-success-btn {
      margin-top: var(--space-6);
      padding: var(--space-3) var(--space-6);
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }

    .close-success-btn:hover {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-gray-200);
      border-top: 4px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--space-4);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Hide cart summary on mobile/tablet, show floating cart button instead */
    @media (max-width: 1024px) {
      .mobile-cart-btn {
        display: flex !important;
      }

      .desktop-only {
        display: none;
      }

      .cart-modal {
        max-height: 85vh;
      }
    }

    @media (max-width: 768px) {
      .table-order-container {
        padding: var(--space-2);
      }

      .order-header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .menu-items {
        grid-template-columns: 1fr;
      }

      .menu-item-card {
        flex-direction: column;
      }

      .item-image {
        width: 100%;
        height: 200px;
      }

      .cart-modal {
        max-height: 90vh;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }

      .mobile-cart-btn {
        min-width: 100px;
        height: 48px;
        bottom: 16px;
        left: 16px;
        padding: 6px 10px;
        border-radius: 16px;
        gap: 6px;
        display: flex !important;
      }

      .mobile-cart-btn i {
        font-size: 16px;
      }

      .mobile-cart-btn .cart-count {
        font-size: 10px;
      }

      .mobile-cart-btn .cart-total {
        font-size: 11px;
      }
    }
  `]
})
export class TableOrderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuItemsService = inject(MenuItemsService);
  private ordersService = inject(OrdersService);
  private restaurantsService = inject(RestaurantsService);
  private restaurantTablesService = inject(RestaurantTablesService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  // State
  tableData$!: Observable<{ restaurantId: number; tableNumber: string; restaurant?: any }>;
  menuItems$!: Observable<any[]>;
  cartItems: CartItem[] = [];
  selectedCategory = '';
  partySize = 1;
  orderNotes = '';
  isLoading = false;
  isPlacingOrder = false;
  orderSuccess = false;
  orderId = '';
  cartSidebarOpen = false;

  ngOnInit() {
    this.initializeTableOrder();
    this.loadMenuItems();
  }

  private initializeTableOrder() {
    this.tableData$ = this.route.params.pipe(
      map(params => ({
        restaurantId: parseInt(params['restaurantId'], 10),
        tableNumber: params['tableNumber']
      })),
      switchMap(data =>
        this.restaurantTablesService.getQRCodeInfo(data.restaurantId, data.tableNumber).pipe(
          map(qrInfo => ({
            ...data,
            restaurant: qrInfo.restaurant,
            table: qrInfo.table
          }))
        )
      )
    );
  }

  private loadMenuItems() {
    console.log('🔄 Loading menu items with categories...');
    this.tableData$.pipe(
      switchMap(data => {
        console.log('🔍 Loading menu for restaurant:', data.restaurantId);
        return this.restaurantsService.getMenuCategoriesWithItems(data.restaurantId.toString());
      })
    ).subscribe({
      next: (categories) => {
        console.log('✅ Menu categories loaded:', categories);
        
        // Flatten categories into menu items with category names
        const allItems = categories.flatMap(category => 
          category.items
            .filter(item => item.is_available) // Filter available items first
            .map(item => ({
              ...item,
              category: category.name // Add category name to each item
            }))
        );
        
        console.log('🔍 Available menu items with categories:', allItems);
        
        this.menuItems$ = of(allItems);
      },
      error: (error) => {
        console.error('❌ Error loading menu items:', error);
        this.toastService.error('Fehler', 'Menü konnte nicht geladen werden');
      }
    });
  }

  private getCurrentRestaurantId(): number {
    // Extract restaurant ID from route params
    const params = this.route.snapshot.params;
    return parseInt(params['restaurantId'], 10);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  getCategories(menuItems: any[]): string[] {
    const categories = new Set(menuItems.map(item => item.category));
    return Array.from(categories);
  }

  getFilteredMenuItems(menuItems: any[]): any[] {
    if (!this.selectedCategory) {
      return menuItems;
    }
    return menuItems.filter(item => item.category === this.selectedCategory);
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Burger': '🍔',
      'Beilagen': '🍟',
      'Getränke': '🥤',
      'Desserts': '🍰',
      'Hauptgerichte': '🍽️',
      'Vorspeisen': '🥗',
      'Pizza': '🍕',
      'Sushi': '🍣',
      'Salate': '🥙'
    };
    return iconMap[category] || '🍽️';
  }

  addToCart(item: any) {
    const existingIndex = this.cartItems.findIndex(cartItem => cartItem.menu_item_id === item.id);

    if (existingIndex >= 0) {
      // Item already in cart, increase quantity
      this.updateQuantity(existingIndex, this.cartItems[existingIndex].quantity + 1);
    } else {
      // Add new item to cart
      const unitPrice = this.getItemPriceAsNumber(item);
      const cartItem: CartItem = {
        menu_item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice
      };

      this.cartItems.push(cartItem);
    }

    this.toastService.success('Hinzugefügt', `${item.name} zum Warenkorb hinzugefügt`);
  }

  isInCart(menuItemId: string): boolean {
    return this.cartItems.some(item => item.menu_item_id === menuItemId);
  }

  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(index);
      return;
    }

    if (newQuantity > 99) {
      newQuantity = 99;
    }

    this.cartItems[index].quantity = newQuantity;
    this.cartItems[index].total_price = this.cartItems[index].unit_price * newQuantity;
  }

  removeFromCart(index: number) {
    this.cartItems.splice(index, 1);
  }

  clearCart() {
    this.cartItems = [];
    this.toastService.info('Info', 'Warenkorb geleert');
  }

  openCartSidebar() {
    this.cartSidebarOpen = true;
  }

  closeCartSidebar() {
    this.cartSidebarOpen = false;
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.total_price || 0), 0);
  }

  async placeOrder() {
    if (this.cartItems.length === 0) {
      this.toastService.error('Fehler', 'Warenkorb ist leer');
      return;
    }

    if (this.isPlacingOrder) {
      console.log('⚠️ Order already in progress, ignoring duplicate request');
      return;
    }

    this.isPlacingOrder = true;
    this.loadingService.start('place-order');

    try {
      console.log('🚀 Starting order placement...');
      
      // Use first() to prevent hanging observables
      const tableData = await this.tableData$.pipe(first()).toPromise();
      if (!tableData) {
        throw new Error('Tischauswahl fehlt');
      }

      console.log('📋 Table data:', tableData);
      console.log('🛒 Cart items:', this.cartItems);

      const orderData = {
        restaurant_id: tableData.restaurantId.toString(),
        table_id: `${tableData.restaurantId}-${tableData.tableNumber}`,
        items: this.cartItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_instructions: item.special_instructions,
          selected_variant_options: item.selected_variant_options
        })),
        party_size: this.partySize,
        notes: this.orderNotes
      };

      console.log('📤 Sending order data:', orderData);

      const response = await this.ordersService.createTableOrder(orderData).pipe(first()).toPromise();

      console.log('✅ Order response:', response);

      if (!response) {
        throw new Error('Bestellung konnte nicht erstellt werden');
      }

      this.orderId = response.order.id.toString();
      this.orderSuccess = true;
      this.clearCart();
      this.closeCartSidebar(); // Close modal on mobile/tablet

      console.log('🎉 Order placed successfully! Order ID:', this.orderId);
      this.toastService.success('Bestellung erfolgreich!', 'Ihre Bestellung wurde aufgegeben');

    } catch (error: any) {
      console.error('❌ Error placing order:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Bestellung konnte nicht aufgegeben werden';
      if (error?.error?.error) {
        errorMessage = error.error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.toastService.error('Fehler', errorMessage);
    } finally {
      this.isPlacingOrder = false;
      this.loadingService.stop('place-order');
      console.log('🏁 Order placement finished');
    }
  }

  closeSuccessModal() {
    this.orderSuccess = false;
    this.orderId = '';
    // Optionally redirect to order status page
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/images/default-food.jpg';
  }

  getItemPrice(item: any): string {
    try {
      let priceInCents = 0;
      
      if (item?.price_cents && typeof item.price_cents === 'number') {
        priceInCents = item.price_cents;
      } else if (item?.price && typeof item.price === 'number') {
        priceInCents = item.price * 100;
      } else {
        return '0.00';
      }

      return (priceInCents / 100).toFixed(2);
    } catch (error) {
      console.error('❌ Error formatting price for item:', item?.name, error);
      return '0.00';
    }
  }

  getItemPriceAsNumber(item: any): number {
    try {
      let priceInCents = 0;
      
      if (item?.price_cents && typeof item.price_cents === 'number') {
        priceInCents = item.price_cents;
      } else if (item?.price && typeof item.price === 'number') {
        priceInCents = item.price * 100;
      } else {
        return 0;
      }

      return priceInCents / 100;
    } catch (error) {
      console.error('❌ Error getting price as number for item:', item?.name, error);
      return 0;
    }
  }
}
