import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OrdersService, Order } from '../../../core/services/orders.service';
import { CartService } from '../../../core/services/supplier.service';
import { ImageFallbackDirective } from '../../../core/image-fallback.directive';
import { PasswordChangeComponent } from '../../../shared/components/password-change.component';
import { LoyaltyCardsComponent } from '../../../shared/components/loyalty-cards.component';
import { FavoritesSectionComponent } from '../../../shared/components/favorites-section.component';
import { FavoritesService } from '../../../core/services/favorites.service';
import { Observable, map, switchMap, of, startWith, catchError } from 'rxjs';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageFallbackDirective, PasswordChangeComponent, LoyaltyCardsComponent, FavoritesSectionComponent],
  template: `
    <div class="customer-dashboard">
      <div class="dashboard-header">
        <h1>Willkommen zurück, {{ (user$ | async)?.name }}!</h1>
        <p>Verwalten Sie Ihre Bestellungen und Einstellungen</p>
      </div>

      <div class="dashboard-content">
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn primary" (click)="goToRestaurants()">
            <i class="fa-solid fa-utensils"></i>
            <span>Jetzt bestellen</span>
          </button>
          <ng-container *ngIf="(cartItemsCount$ | async) as cartCount">
            <button class="action-btn secondary" (click)="goToCart()" *ngIf="cartCount > 0">
              <i class="fa-solid fa-shopping-cart"></i>
              <span>Warenkorb ({{ cartCount }})</span>
            </button>
          </ng-container>
          <button class="action-btn secondary" (click)="goToProfile()">
            <i class="fa-solid fa-user"></i>
            <span>Profil bearbeiten</span>
          </button>
        </div>

        <!-- Recent Orders -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Meine Bestellungen</h2>
            <button class="view-all-btn" (click)="viewAllOrders()">Alle anzeigen</button>
          </div>

          <div class="orders-list">
            <!-- Error State -->
            <div class="error-state" *ngIf="ordersError">
              <i class="fa-solid fa-exclamation-triangle"></i>
              <h3>{{ ordersError }}</h3>
              <button class="btn-secondary" (click)="loadRecentOrders()">Erneut versuchen</button>
            </div>

            <!-- Loading State -->
            <div class="loading-state" *ngIf="isLoadingOrders && !ordersError">
              <div class="loading-spinner"></div>
              <p>Bestellungen werden geladen...</p>
            </div>

            <!-- Orders Content -->
            <ng-container *ngIf="!isLoadingOrders && !ordersError">
              <ng-container *ngIf="recentOrders$ | async as orders">
                <div class="no-orders" *ngIf="orders.length === 0">
                  <i class="fa-solid fa-receipt"></i>
                  <h3>Noch keine Bestellungen</h3>
                  <p>Entdecken Sie unsere Restaurants und geben Sie Ihre erste Bestellung auf.</p>
                  <button class="btn-primary" (click)="goToRestaurants()">Jetzt bestellen</button>
                </div>

                <div class="order-card" *ngFor="let order of orders.slice(0, 5)">
              <div class="order-header">
                <div class="order-info">
                  <h4>Bestellung #{{ order.id }}</h4>
                  <p class="restaurant-name">{{ order.restaurant_name }}</p>
                  <p class="order-date">{{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</p>
                </div>
                <div class="order-status">
                  <span class="status-badge" [class]="'status-' + order.status">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>

              <div class="order-items">
                <div class="order-item" *ngFor="let item of (order.items || []).slice(0, 2)">
                  <span>{{ item.name }} × {{ item.quantity }}</span>
                </div>
                <span class="more-items" *ngIf="(order.items || []).length > 2">
                  +{{ (order.items || []).length - 2 }} weitere Artikel
                </span>
              </div>

              <div class="order-footer">
                <div class="order-total">{{ order.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                <button class="btn-ghost" (click)="viewOrderDetails(order)">Details</button>
              </div>
            </div>
              </ng-container>
            </ng-container>
          </div>

        <!-- Loyalty Cards -->
        <app-loyalty-cards></app-loyalty-cards>


        <!-- Favorite Restaurants -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Meine beliebten Restaurants</h2>
            <button class="view-all-btn" (click)="goToRestaurants()">Alle anzeigen</button>
          </div>

          <div class="restaurants-grid">
            <div class="restaurant-card" *ngFor="let restaurant of featuredRestaurants">
              <img [src]="restaurant.images.banner || restaurant.images.logo" [alt]="restaurant.name" appImageFallback>
              <div class="restaurant-info">
                <h4>{{ restaurant.name }}</h4>
                <div class="restaurant-meta">
                  <span class="rating">
                    <i class="fa-solid fa-star"></i>
                    {{ restaurant.rating }}
                  </span>
                  <span class="delivery-time">{{ restaurant.delivery_info.estimated_delivery_time_minutes }} Min</span>
                </div>
              </div>
              <button class="btn-primary" (click)="orderFromRestaurant(restaurant)">Bestellen</button>
            </div>
          </div>
        </div>

        <!-- Favorites Section -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>
              <i class="fa-solid fa-heart"></i>
              Meine Favoriten
            </h2>
            <p>Ihre häufig bestellten Gerichte</p>
          </div>
          
          <app-favorites-section
            [showFavorites]="true"
            (favoriteSelected)="onFavoriteSelected($event)"
            (addToCartClicked)="onAddToCartClicked($event)"
            (removeFavoriteClicked)="onRemoveFavoriteClicked($event)"
          ></app-favorites-section>
        </div>

        <!-- Chat Support Section - TEMPORARILY DISABLED -->
        <!--
        <div class="dashboard-section">
          <div class="section-header">
            <h2>
              <i class="fa-solid fa-comments"></i>
              Chat Support
            </h2>
            <p>Haben Sie Fragen? Chatten Sie direkt mit den Restaurants</p>
            <button class="toggle-chat-btn" (click)="toggleChatSupport()">
              <i class="fa-solid" [class.fa-chevron-up]="isChatExpanded" [class.fa-chevron-down]="!isChatExpanded"></i>
            </button>
          </div>
          
          <div class="chat-content" *ngIf="isChatExpanded">
            <div class="chat-container" *ngIf="!showChatList && !showChat">
              <button class="btn-start-chat" (click)="showChatList = true">
                <i class="fa-solid fa-comments"></i>
                Chats anzeigen
              </button>
            </div>

            <app-chat-list
              *ngIf="showChatList && !showChat"
              (chatRoomSelected)="onChatRoomSelected($event)"
              (newChatRequested)="onNewChatRequested()"
            ></app-chat-list>

            <app-chat
              *ngIf="showChat && selectedChatRoom"
              [chatRoom]="selectedChatRoom"
              (chatClosed)="onChatClosed()"
            ></app-chat>
          </div>
        </div>
        -->

        <!-- Account Settings -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Kontoeinstellungen</h2>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <i class="fa-solid fa-user"></i>
              <h4>Persönliche Daten</h4>
              <p>Name, E-Mail und Kontaktdaten verwalten</p>
              <button class="btn-ghost" (click)="goToProfile()">Bearbeiten</button>
            </div>

            <div class="setting-card">
              <i class="fa-solid fa-map-marker-alt"></i>
              <h4>Lieferadressen</h4>
              <p>Speichern Sie häufig verwendete Adressen</p>
              <button class="btn-ghost" (click)="manageAddresses()">Verwalten</button>
            </div>

            <div class="setting-card">
              <i class="fa-solid fa-credit-card"></i>
              <h4>Zahlungsmethoden</h4>
              <p>Kreditkarten und Zahlungsdaten verwalten</p>
              <button class="btn-ghost" (click)="managePaymentMethods()">Verwalten</button>
            </div>

            <div class="setting-card">
              <i class="fa-solid fa-bell"></i>
              <h4>Benachrichtigungen</h4>
              <p>Bestell- und Marketing-Benachrichtigungen</p>
              <button class="btn-ghost" (click)="manageNotifications()">Einstellungen</button>
            </div>

            <div class="setting-card">
              <i class="fa-solid fa-lock"></i>
              <h4>Passwort ändern</h4>
              <p>Sichern Sie Ihr Konto mit einem neuen Passwort</p>
              <button class="btn-ghost" (click)="openPasswordChangeModal()">Ändern</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Change Modal -->
      <div *ngIf="showPasswordChangeModal" class="modal-overlay" (click)="closePasswordChangeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Passwort ändern</h3>
            <button class="close-btn" (click)="closePasswordChangeModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <app-password-change (passwordChanged)="onPasswordChanged()"></app-password-change>
          </div>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div *ngIf="showOrderDetailsModal && selectedOrder" class="modal-overlay" (click)="closeOrderDetailsModal()">
        <div class="modal-content order-details-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Bestellungsdetails #{{ selectedOrder.id }}</h3>
            <button class="close-btn" (click)="closeOrderDetailsModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="order-details-content">
              <!-- Order Header Info -->
              <div class="order-info-section">
                <div class="info-row">
                  <span class="label">Restaurant:</span>
                  <span class="value">{{ selectedOrder.restaurant_name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Bestelldatum:</span>
                  <span class="value">{{ selectedOrder.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="status-badge" [class]="'status-' + selectedOrder.status">
                    {{ getStatusLabel(selectedOrder.status) }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Gesamtpreis:</span>
                  <span class="value total-price">{{ selectedOrder.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
                </div>
              </div>

              <!-- Order Items -->
              <div class="order-items-section">
                <h4>Bestellte Artikel</h4>
                <div class="order-items-list">
                  <div class="order-item-detail" *ngFor="let item of (selectedOrder.items || [])">
                    <div class="item-info">
                      <span class="item-name">{{ item.name }}</span>
                      <span class="item-quantity">× {{ item.quantity }}</span>
                    </div>
                    <div class="item-price">
                      {{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Delivery Information -->
              <div class="delivery-section" *ngIf="selectedOrder.delivery_address">
                <h4>Lieferadresse</h4>
                <div class="address-info">
                  <p>{{ selectedOrder.delivery_address }}</p>
                  <p *ngIf="selectedOrder.delivery_instructions">{{ selectedOrder.delivery_instructions }}</p>
                </div>
              </div>

              <!-- Payment Information -->
              <div class="payment-section">
                <h4>Zahlungsstatus</h4>
                <p>
                  <span class="payment-status" [class]="'status-' + selectedOrder.payment_status">
                    {{ getPaymentStatusLabel(selectedOrder.payment_status) }}
                  </span>
                </p>
              </div>

              <!-- Additional Notes -->
              <div class="notes-section">
                <h4>Zusätzliche Hinweise</h4>
                <ng-container *ngIf="selectedOrder && canEditOrderNotes(selectedOrder)">
                  <textarea
                    class="notes-input"
                    [(ngModel)]="orderNotes"
                    placeholder="Fügen Sie hier zusätzliche Hinweise hinzu..."
                    rows="3"
                  ></textarea>
                  <p class="notes-hint">Notizen können nur einmal hinzugefügt werden und danach nicht mehr geändert werden.</p>
                </ng-container>
                <ng-container *ngIf="selectedOrder && !canEditOrderNotes(selectedOrder)">
                  <div class="notes-display" *ngIf="selectedOrder.notes && selectedOrder.notes.trim().length > 0">
                    <p class="existing-notes">{{ selectedOrder.notes }}</p>
                    <p class="notes-info">Diese Hinweise wurden beim Checkout angegeben und können nicht mehr geändert werden.</p>
                  </div>
                  <div class="notes-display" *ngIf="!selectedOrder.notes || selectedOrder.notes.trim().length === 0">
                    <p class="no-notes">Keine zusätzlichen Hinweise vorhanden.</p>
                    <p class="notes-info" *ngIf="!['delivered', 'cancelled'].includes(selectedOrder.status)">
                      Zusätzliche Hinweise können nur beim Checkout hinzugefügt werden.
                    </p>
                    <p class="notes-info" *ngIf="['delivered', 'cancelled'].includes(selectedOrder.status)">
                      Die Bestellung ist bereits {{ selectedOrder.status === 'delivered' ? 'geliefert' : 'storniert' }} und kann nicht mehr bearbeitet werden.
                    </p>
                  </div>
                </ng-container>
              </div>

              <!-- Special Requests -->
              <div class="special-requests-section">
                <h4>Spezielle Anfragen</h4>
                <textarea
                  class="special-requests-input"
                  [(ngModel)]="orderSpecialRequests"
                  placeholder="Haben Sie spezielle Anfragen oder Allergien?..."
                  rows="2"
                ></textarea>
              </div>

              <!-- Rating Section -->
              <div class="rating-section" *ngIf="selectedOrder.status === 'delivered'">
                <h4>Bewertung abgeben</h4>
                <div class="rating-input">
                  <div class="stars">
                    <i
                      class="fa-solid fa-star"
                      [class.active]="rating >= 1"
                      (click)="setRating(1)"
                    ></i>
                    <i
                      class="fa-solid fa-star"
                      [class.active]="rating >= 2"
                      (click)="setRating(2)"
                    ></i>
                    <i
                      class="fa-solid fa-star"
                      [class.active]="rating >= 3"
                      (click)="setRating(3)"
                    ></i>
                    <i
                      class="fa-solid fa-star"
                      [class.active]="rating >= 4"
                      (click)="setRating(4)"
                    ></i>
                    <i
                      class="fa-solid fa-star"
                      [class.active]="rating >= 5"
                      (click)="setRating(5)"
                    ></i>
                  </div>
                  <textarea
                    class="review-input"
                    [(ngModel)]="reviewText"
                    placeholder="Teilen Sie Ihre Erfahrung..."
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="modal-actions">
                <button class="btn-secondary" (click)="closeOrderDetailsModal()">Schließen</button>
                <button class="btn-primary" (click)="saveOrderDetails()" *ngIf="selectedOrder && canEditOrderNotes(selectedOrder)">Änderungen speichern</button>
                <button class="btn-outline" *ngIf="selectedOrder && canReportIssue(selectedOrder)" (click)="reportIssue(selectedOrder)">Problem melden</button>
                <button class="btn-danger" *ngIf="selectedOrder && canCancelOrder(selectedOrder)" (click)="cancelOrder()">Bestellung stornieren</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customer-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .dashboard-header {
      background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-25));
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      position: relative;
      overflow: hidden;
    }

    .dashboard-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--gradient-primary);
    }

    .dashboard-header h1 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary-700);
      margin-bottom: var(--space-1);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .dashboard-header h1::before {
      content: '👋';
      font-size: var(--text-base);
    }

    .dashboard-header p {
      color: var(--color-primary-600);
      font-size: var(--text-sm);
      margin: 0;
      font-weight: 500;
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .quick-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: var(--space-1);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: var(--text-xs);
      cursor: pointer;
      transition: all var(--transition);
      border: none;
    }

    .action-btn.primary {
      background: var(--gradient-primary);
      color: white;
      border: 2px solid transparent;
    }

    .action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-700) 25%, transparent);
    }

    .action-btn.secondary {
      background: var(--color-primary-700);
      color: white;
      border: 2px solid var(--color-primary-600);
    }

    .action-btn.secondary:hover {
      background: var(--color-primary-800);
      border-color: var(--color-primary-700);
    }

    .dashboard-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-border);
      gap: var(--space-3);
    }

    .section-header h2 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary-700);
      margin: 0;
    }

    .view-all-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    .view-all-btn:hover {
      color: var(--color-primary-700);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .no-orders {
      text-align: center;
      padding: var(--space-12) 0;
      color: var(--color-muted);
    }

    .no-orders i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .no-orders h3 {
      font-size: var(--text-xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .order-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: var(--bg-light);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .order-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
    }

    .order-date {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .status-pending { background: color-mix(in oklab, #fbbf24 15%, white); color: #d97706; }
    .status-confirmed { background: color-mix(in oklab, #3b82f6 15%, white); color: #2563eb; }
    .status-preparing { background: color-mix(in oklab, #f59e0b 15%, white); color: #d97706; }
    .status-ready { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-delivered { background: color-mix(in oklab, #059669 15%, white); color: #047857; }
    .status-cancelled { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }

    .payment-status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .status-paid { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-failed { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }
    .status-refunded { background: color-mix(in oklab, #8b5cf6 15%, white); color: #7c3aed; }

    .order-items {
      margin-bottom: var(--space-3);
    }

    .order-item {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .more-items {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-style: italic;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-total {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .btn-ghost {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .btn-ghost:hover {
      background: var(--bg-light);
    }

    .btn-primary {
      background: var(--gradient-primary);
      border: none;
      color: white;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .restaurants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
    }

    .restaurant-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: white;
      transition: all var(--transition);
    }

    .restaurant-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .restaurant-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }

    .restaurant-info {
      padding: var(--space-4);
    }

    .restaurant-info h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .restaurant-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .rating {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--color-warning);
    }

    .delivery-time {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .setting-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--bg-light);
      transition: all var(--transition);
    }

    .setting-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .setting-card i {
      font-size: 2rem;
      color: var(--color-primary);
      margin-bottom: var(--space-3);
    }

    .setting-card h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .setting-card p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.4;
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .error-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-danger);
    }

    .error-state i {
      font-size: 3rem;
      color: var(--color-danger);
      margin-bottom: var(--space-4);
    }

    .error-state h3 {
      font-size: var(--text-xl);
      color: var(--color-danger);
      margin-bottom: var(--space-4);
    }

    .btn-secondary {
      background: var(--color-muted-100);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-muted-200);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h3 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
    }

    /* Order Details Modal Styles */
    .order-details-modal .modal-content {
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .order-details-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .order-info-section {
      background: var(--bg-light);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      font-weight: 600;
      color: var(--color-heading);
    }

    .info-row .value {
      color: var(--color-text);
    }

    .total-price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-success);
    }

    .order-items-section h4,
    .delivery-section h4,
    .payment-section h4,
    .notes-section h4,
    .special-requests-section h4,
    .rating-section h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .order-items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .order-item-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .item-name {
      font-weight: 600;
      color: var(--color-heading);
    }

    .item-quantity {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .item-price {
      font-weight: 600;
      color: var(--color-success);
    }

    .address-info p {
      margin: var(--space-1) 0;
      color: var(--color-text);
    }

    .notes-input,
    .special-requests-input,
    .review-input {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
    }

    .notes-input:focus,
    .special-requests-input:focus,
    .review-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .notes-hint {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-top: var(--space-2);
      font-style: italic;
    }

    .notes-display {
      background: var(--bg-light);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .existing-notes {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .no-notes {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-style: italic;
    }

    .notes-info {
      margin: var(--space-2) 0 0 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.4;
    }

    .rating-input {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .stars {
      display: flex;
      gap: var(--space-2);
    }

    .stars i {
      font-size: var(--text-xl);
      color: var(--color-border);
      cursor: pointer;
      transition: color var(--transition);
    }

    .stars i.active {
      color: var(--color-warning);
    }

    .stars i:hover {
      color: var(--color-warning);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-danger {
      background: var(--color-danger);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-danger:hover {
      background: color-mix(in oklab, var(--color-danger) 85%, black);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: none;
      border: 2px solid var(--color-primary);
      color: var(--color-primary);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-outline:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .customer-dashboard {
        padding: var(--space-4);
      }

      .quick-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .action-btn {
        justify-content: center;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .restaurants-grid, .settings-grid {
        grid-template-columns: 1fr;
      }

      .order-header {
        flex-direction: column;
        gap: var(--space-2);
      }

      .order-footer {
        flex-direction: column;
        gap: var(--space-2);
      }

      .order-details-modal .modal-content {
        margin: var(--space-2);
        max-height: 95vh;
      }

      .modal-actions {
        flex-direction: column;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-1);
      }

      .order-item-detail {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);

  user$ = this.authService.currentUser$;
  recentOrders$: Observable<Order[]> = of([]);
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart ? (this.cartService.getItemCount() || 0) : 0)
  );

  isLoadingOrders = false;
  ordersError: string | null = null;
  showPasswordChangeModal = false;
  showOrderDetailsModal = false;
  selectedOrder: Order | null = null;
  rating = 0;
  reviewText = '';
  orderNotes = '';
  orderSpecialRequests = '';

  // Mock featured restaurants - using real restaurant IDs from backend
  featuredRestaurants = [
    {
      id: '451',
      name: 'Berrys Burger & Pizza',
      images: { 
        banner: 'https://odenwald-bucket.s3.eu-central-1.amazonaws.com/restaurant-images/banner-1756930683144-c9d898de81ec.jpg', 
        logo: 'https://odenwald-bucket.s3.eu-central-1.amazonaws.com/restaurant-images/logo-1756767153052-8ab8158d4171.jpg' 
      },
      rating: 4.67,
      delivery_info: { estimated_delivery_time_minutes: 30 }
    },
    {
      id: '457',
      name: 'Da Enzo',
      images: { 
        banner: 'https://odenwald-bucket.s3.eu-central-1.amazonaws.com/restaurant-images/banner-1757530231768-5239c668541f.jpg', 
        logo: '' 
      },
      rating: 4.0,
      delivery_info: { estimated_delivery_time_minutes: 30 }
    },
    {
      id: '455',
      name: 'Dilans Küche',
      images: { 
        banner: 'https://odenwald-bucket.s3.eu-central-1.amazonaws.com/restaurant-images/banner-1756936548993-addebe0db396.jpg', 
        logo: '' 
      },
      rating: 4.0,
      delivery_info: { estimated_delivery_time_minutes: 30 }
    }
  ];

  ngOnInit() {
    this.loadRecentOrders();

    // Expose debug function to window for console testing
    (window as any).debugOrdersAPI = () => this.debugOrdersAPI();
  }

  debugOrdersAPI() {
    console.log('🔧 Debug: Testing Orders API directly...');

    const token = this.authService.getToken();
    const user = this.authService.currentUserSubject.value;

    console.log('🔑 Token exists:', !!token);
    console.log('👤 Current user:', user);

    if (!token || !user) {
      console.error('❌ No token or user found');
      return;
    }

    // Direct fetch call
    fetch('http://localhost:4000/api/v1/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': user.tenant_id,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);
      return response.json();
    })
    .then(data => {
      console.log('✅ API Response data:', data);
    })
    .catch(error => {
      console.error('❌ API Request failed:', error);
    });
  }

  loadRecentOrders() {
    this.user$.subscribe(user => {
      if (user) {
        this.isLoadingOrders = true;
        this.ordersError = null;

        this.recentOrders$ = this.ordersService.getMyOrders().pipe(
          startWith([]), // Start with empty array to show loading
          catchError(error => {
            console.error('Error loading orders:', error);
            this.ordersError = 'Bestellungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
            this.isLoadingOrders = false;
            return of([]); // Return empty array on error
          })
        );

        // Set loading to false when observable completes
        this.recentOrders$.subscribe({
          next: (orders) => {
            this.isLoadingOrders = false;
          },
          error: (error) => {
            this.isLoadingOrders = false;
          },
          complete: () => {
            this.isLoadingOrders = false;
          }
        });
      }
    });
  }

  getStatusLabel(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const labels = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'Wird zubereitet',
      ready: 'Bereit',
      picked_up: 'Unterwegs',
      delivered: 'Geliefert',
      cancelled: 'Storniert'
    } as const;
    const mapped = status === 'open'
      ? 'pending'
      : status === 'in_progress'
        ? 'preparing'
        : status === 'out_for_delivery'
          ? 'picked_up'
          : status;
    return labels[mapped as keyof typeof labels] || (mapped as string);
  }

  getPaymentStatusLabel(status: Order['payment_status']): string {
    const labels = {
      pending: 'Ausstehend',
      paid: 'Bezahlt',
      failed: 'Fehlgeschlagen',
      refunded: 'Rückerstattet'
    } as const;
    return labels[status] || status;
  }

  goToRestaurants() {
    this.router.navigate(['/customer']);
  }

  goToCart() {
    this.router.navigate(['/checkout']);
  }

  goToProfile() {
    this.router.navigate(['/account-settings'], { queryParams: { tab: 'personal' } });
  }

  viewAllOrders() {
    // TODO: Implement orders history page
    console.log('View all orders');
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
    // Initialize form fields with current order data
    this.orderNotes = order.notes || '';
    this.orderSpecialRequests = '';
    this.rating = 0;
    this.reviewText = '';
  }

  // Check if customer can edit notes for this order
  canEditOrderNotes(order: Order): boolean {
    // Can only edit if:
    // 1. Order is not delivered or cancelled
    // 2. No notes exist yet (prevents modifying existing checkout notes)
    return !['delivered', 'cancelled'].includes(order.status) &&
           (!order.notes || order.notes.trim().length === 0);
  }

  closeOrderDetailsModal() {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
    this.rating = 0;
    this.reviewText = '';
    this.orderNotes = '';
    this.orderSpecialRequests = '';
  }

  setRating(rating: number) {
    this.rating = rating;
  }

  saveOrderDetails() {
    if (!this.selectedOrder) return;

    console.log('Saving order details:', {
      orderId: this.selectedOrder.id,
      notes: this.orderNotes,
      specialRequests: this.orderSpecialRequests,
      rating: this.rating,
      reviewText: this.reviewText
    });

    let hasChanges = false;

    // Update order notes if they changed and can be edited
    if (this.canEditOrderNotes(this.selectedOrder)) {
      const currentNotes = this.selectedOrder.notes || '';
      const newNotes = this.orderNotes.trim();

      if (newNotes !== currentNotes) {
        hasChanges = true;
        this.ordersService.updateOrderNotesByCustomer(this.selectedOrder.id, newNotes)
          .subscribe({
            next: (response) => {
              console.log('Order notes updated:', response);
              // Update the order in our local data
              this.selectedOrder = response.order;
              // Also update in the recentOrders$ observable if needed
              this.loadRecentOrders();
              // Show success message
              // TODO: Add toast notification
            },
            error: (error) => {
              console.error('Failed to update order notes:', error);
              // TODO: Show error toast to user
            }
          });
      }
    }

    // TODO: Implement special requests update
    // TODO: Implement rating/review submission

    // Close modal after operations (or immediately if no changes)
    if (!hasChanges) {
      this.closeOrderDetailsModal();
    }
  }

  canCancelOrder(order: Order): boolean {
    // Allow cancellation only for pending, confirmed, or preparing orders
    return ['pending', 'confirmed', 'preparing'].includes(order.status);
  }

  cancelOrder() {
    // TODO: Implement order cancellation
    console.log('Cancelling order:', this.selectedOrder?.id);
    this.closeOrderDetailsModal();
  }

  canReportIssue(order: Order | null): boolean {
    if (!order) return false;
    // Allow reporting issues only for delivered or picked up orders
    return ['delivered', 'picked_up'].includes(order.status);
  }

  reportIssue(order: Order) {
    this.closeOrderDetailsModal();
    this.router.navigate(['/report-issue', order.id]);
  }

  orderFromRestaurant(restaurant: any) {
    this.router.navigate(['/restaurant', restaurant.id]);
  }

  manageAddresses() {
    this.router.navigate(['/account-settings'], { queryParams: { tab: 'addresses' } });
  }

  managePaymentMethods() {
    this.router.navigate(['/account-settings'], { queryParams: { tab: 'payment' } });
  }

  manageNotifications() {
    this.router.navigate(['/account-settings'], { queryParams: { tab: 'notifications' } });
  }

  openPasswordChangeModal() {
    this.showPasswordChangeModal = true;
  }

  closePasswordChangeModal() {
    this.showPasswordChangeModal = false;
  }

  onPasswordChanged() {
    // Password was successfully changed, close modal
    this.closePasswordChangeModal();
  }

  // Favorites Methods
  onFavoriteSelected(favorite: any) {
    // Navigate to restaurant or show favorite details
    console.log('Favorite selected:', favorite);
    if (favorite.restaurant_id) {
      this.router.navigate(['/restaurant', favorite.restaurant_id]);
    }
  }

  onAddToCartClicked(favorite: any) {
    // Add favorite item to cart
    console.log('Add to cart clicked:', favorite);
    // Implement cart functionality here
  }

  onRemoveFavoriteClicked(favorite: any) {
    // Remove from favorites
    console.log('Remove favorite clicked:', favorite);
    this.favoritesService.removeFromFavorites(favorite.menu_item_id).subscribe({
      next: () => {
        console.log('Favorite removed successfully');
        // Refresh favorites list
      },
      error: (error) => {
        console.error('Error removing favorite:', error);
      }
    });
  }
}
