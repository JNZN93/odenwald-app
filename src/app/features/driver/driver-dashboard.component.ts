import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrdersService, Order } from '../../core/services/orders.service';
import { Observable, map, switchMap, of, interval } from 'rxjs';

interface DriverStats {
  totalDeliveries: number;
  todayDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  averageRating: number;
  currentStatus: 'available' | 'busy' | 'offline' | 'on_delivery';
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="driver-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Willkommen, {{ (user$ | async)?.name }}!</h1>
          <p>Fahrer-Dashboard - Verwalte deine Lieferungen</p>
        </div>

        <div class="status-section">
          <div class="status-indicator" [class]="'status-' + driverStats.currentStatus">
            <i class="fa-solid" [ngClass]="getStatusIcon(driverStats.currentStatus)"></i>
            <span>{{ getStatusLabel(driverStats.currentStatus) }}</span>
          </div>

          <button
            class="status-toggle-btn"
            (click)="toggleStatus()"
            [disabled]="togglingStatus"
          >
            <span *ngIf="!togglingStatus">
              {{ driverStats.currentStatus === 'available' ? 'Offline gehen' : 'Verfügbar machen' }}
            </span>
            <span *ngIf="togglingStatus" class="loading-text">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Aktualisiere...
            </span>
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>Lieferungen heute</h3>
            <div class="stat-value">{{ driverStats.todayDeliveries }}</div>
            <small>Gesamt: {{ driverStats.totalDeliveries }}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Verdienst heute</h3>
            <div class="stat-value">{{ driverStats.todayEarnings | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
            <small>Gesamt: {{ driverStats.totalEarnings | currency:'EUR':'symbol':'1.2-2':'de' }}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>Bewertung</h3>
            <div class="stat-value">{{ driverStats.averageRating }}/5</div>
            <div class="rating-stars">
              <i
                *ngFor="let star of [1,2,3,4,5]"
                class="fa-solid"
                [ngClass]="star <= driverStats.averageRating ? 'fa-star' : 'fa-regular fa-star'"
              ></i>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Arbeitszeit</h3>
            <div class="stat-value">{{ workHoursToday }}h</div>
            <small>Online seit: {{ onlineSince }}</small>
          </div>
        </div>
      </div>

      <!-- Active Delivery / Available Orders -->
      <div class="main-content">
        <!-- Active Delivery Section -->
        <div class="active-delivery" *ngIf="activeDelivery$ | async as activeOrder; else availableOrders">
          <div class="delivery-header">
            <h2><i class="fa-solid fa-truck"></i> Aktuelle Lieferung</h2>
            <div class="delivery-status">
              <span class="status-badge status-delivery">
                <i class="fa-solid fa-route"></i>
                Unterwegs
              </span>
            </div>
          </div>

          <div class="delivery-details">
            <div class="delivery-info">
              <h3>Bestellung #{{ activeOrder.id }}</h3>
              <p class="restaurant-name">{{ activeOrder.restaurant_name }}</p>
              <p class="delivery-address">
                <i class="fa-solid fa-map-marker-alt"></i>
                {{ activeOrder.delivery_address }}
              </p>
              <p class="delivery-time">
                <i class="fa-solid fa-clock"></i>
                Geschätzte Ankunft: {{ activeOrder.estimated_delivery | date:'HH:mm' }}
              </p>
            </div>

            <div class="delivery-actions">
              <button class="btn btn-success" (click)="markAsDelivered(activeOrder)">
                <i class="fa-solid fa-check"></i>
                Als geliefert markieren
              </button>
              <button class="btn btn-warning" (click)="contactCustomer(activeOrder)">
                <i class="fa-solid fa-phone"></i>
                Kunde kontaktieren
              </button>
            </div>
          </div>

          <div class="delivery-items">
            <h4>Bestellte Artikel</h4>
            <div class="items-list">
              <div *ngFor="let item of activeOrder.items" class="delivery-item">
                <span>{{ item.name }} × {{ item.quantity }}</span>
                <span>{{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
              </div>
            </div>
            <div class="delivery-total">
              <strong>Gesamt: {{ activeOrder.total | currency:'EUR':'symbol':'1.2-2':'de' }}</strong>
            </div>
          </div>
        </div>

        <!-- Available Orders Section -->
        <ng-template #availableOrders>
          <div class="available-orders">
            <div class="orders-header">
              <h2><i class="fa-solid fa-list-check"></i> Verfügbare Aufträge</h2>
              <button class="refresh-btn" (click)="refreshOrders()" [disabled]="refreshing">
                <i class="fa-solid" [ngClass]="refreshing ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>
                Aktualisieren
              </button>
            </div>

            <div class="orders-list" *ngIf="availableOrders$ | async as orders; else loading">
              <div class="no-orders" *ngIf="orders.length === 0">
                <i class="fa-solid fa-inbox"></i>
                <h3>Keine verfügbaren Aufträge</h3>
                <p>Es gibt derzeit keine Aufträge in deiner Nähe.</p>
              </div>

              <div class="order-card" *ngFor="let order of orders">
                <div class="order-header">
                  <div class="order-info">
                    <h4>Bestellung #{{ order.id }}</h4>
                    <p class="restaurant-name">{{ order.restaurant_name }}</p>
                    <p class="order-time">{{ order.order_time | date:'dd.MM.yyyy HH:mm' }}</p>
                  </div>
                  <div class="order-value">
                    <div class="order-total">{{ order.total | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                    <small>Liefergebühr: {{ order.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}</small>
                  </div>
                </div>

                <div class="order-details">
                  <div class="delivery-info">
                    <p class="delivery-address">
                      <i class="fa-solid fa-map-marker-alt"></i>
                      {{ order.delivery_address }}
                    </p>
                    <p class="estimated-time">
                      <i class="fa-solid fa-clock"></i>
                      Lieferung bis: {{ order.estimated_delivery | date:'HH:mm' }}
                    </p>
                  </div>

                  <div class="order-items-preview">
                    <div *ngFor="let item of order.items.slice(0, 3)" class="item-preview">
                      {{ item.name }} × {{ item.quantity }}
                    </div>
                    <div *ngIf="order.items.length > 3" class="more-items">
                      +{{ order.items.length - 3 }} weitere Artikel
                    </div>
                  </div>
                </div>

                <div class="order-actions">
                  <button class="btn btn-primary" (click)="acceptOrder(order)" [disabled]="acceptingOrder">
                    <span *ngIf="!acceptingOrder">
                      <i class="fa-solid fa-check"></i>
                      Auftrag annehmen
                    </span>
                    <span *ngIf="acceptingOrder" class="loading-text">
                      <i class="fa-solid fa-spinner fa-spin"></i>
                      Annehmen...
                    </span>
                  </button>
                  <button class="btn btn-ghost" (click)="viewOrderDetails(order)">
                    <i class="fa-solid fa-eye"></i>
                    Details
                  </button>
                </div>
              </div>
            </div>

            <ng-template #loading>
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Suche nach verfügbaren Aufträgen...</p>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </div>

      <!-- Recent Deliveries -->
      <div class="recent-deliveries">
        <h2><i class="fa-solid fa-history"></i> Letzte Lieferungen</h2>

        <div class="deliveries-list" *ngIf="recentDeliveries$ | async as deliveries; else loadingDeliveries">
          <div class="no-deliveries" *ngIf="deliveries.length === 0">
            <i class="fa-solid fa-receipt"></i>
            <p>Noch keine Lieferungen durchgeführt</p>
          </div>

          <div class="delivery-card" *ngFor="let delivery of deliveries.slice(0, 5)">
            <div class="delivery-info">
              <h4>Bestellung #{{ delivery.id }}</h4>
              <p class="restaurant-name">{{ delivery.restaurant_name }}</p>
              <p class="delivery-date">{{ delivery.order_time | date:'dd.MM.yyyy' }}</p>
            </div>
            <div class="delivery-amount">
              <div class="amount">{{ delivery.total | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
              <small>{{ delivery.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }} Gebühr</small>
            </div>
          </div>
        </div>

        <ng-template #loadingDeliveries>
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Lade Lieferhistorie...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .driver-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .welcome-section h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .welcome-section p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .status-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 600;
      font-size: var(--text-sm);
    }

    .status-available {
      background: color-mix(in oklab, var(--color-success) 15%, white);
      color: var(--color-success);
    }

    .status-busy, .status-on_delivery {
      background: color-mix(in oklab, var(--color-warning) 15%, white);
      color: var(--color-warning);
    }

    .status-offline {
      background: color-mix(in oklab, var(--color-muted) 15%, white);
      color: var(--color-muted);
    }

    .status-toggle-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .status-toggle-btn:hover:not(:disabled) {
      background: var(--bg-light);
      transform: translateY(-1px);
    }

    .status-toggle-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      font-size: var(--text-2xl);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      border-radius: var(--radius-lg);
    }

    .stat-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .stat-value {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-content small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .rating-stars {
      display: flex;
      gap: var(--space-1);
      margin-top: var(--space-1);
    }

    .rating-stars i {
      color: #fbbf24;
      font-size: var(--text-sm);
    }

    .main-content {
      margin-bottom: var(--space-8);
    }

    .active-delivery, .available-orders {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .delivery-header, .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .delivery-header h2, .orders-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .refresh-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--bg-light);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .delivery-status {
      display: flex;
      align-items: center;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .status-delivery {
      background: color-mix(in oklab, var(--color-primary) 15%, white);
      color: var(--color-primary);
    }

    .delivery-details {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .delivery-info h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin-bottom: var(--space-2);
    }

    .delivery-address, .delivery-time {
      margin: var(--space-1) 0;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .delivery-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .btn {
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      transition: all var(--transition);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: color-mix(in oklab, var(--color-success) 20%, black);
    }

    .btn-warning {
      background: var(--color-warning);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: color-mix(in oklab, var(--color-warning) 20%, black);
    }

    .btn-ghost {
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--bg-light);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .delivery-items {
      background: var(--bg-light);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
    }

    .delivery-items h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .delivery-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2);
      background: var(--color-surface);
      border-radius: var(--radius-sm);
    }

    .delivery-total {
      text-align: right;
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-2);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .no-orders, .no-deliveries {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .no-orders i, .no-deliveries i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      color: var(--color-border);
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
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
    }

    .order-time {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .order-value {
      text-align: right;
    }

    .order-total {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .order-value small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .delivery-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .delivery-address, .estimated-time {
      font-size: var(--text-sm);
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .order-items-preview {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .item-preview {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .more-items {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
    }

    .order-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
    }

    .recent-deliveries {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .recent-deliveries h2 {
      margin: 0 0 var(--space-6) 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .deliveries-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .delivery-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .delivery-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-sm);
    }

    .delivery-date {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .delivery-amount {
      text-align: right;
    }

    .amount {
      font-weight: 700;
      color: var(--color-success);
    }

    .delivery-amount small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
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

    .loading-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .status-section {
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .delivery-details {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .order-details {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .delivery-card {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .delivery-amount {
        text-align: left;
      }
    }
  `]
})
export class DriverDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private router = inject(Router);

  user$ = this.authService.currentUser$;
  availableOrders$ = of([] as any[]); // Will be populated from API
  activeDelivery$ = of(null as any); // Will be populated from API
  recentDeliveries$ = of([] as any[]); // Will be populated from API

  togglingStatus = false;
  refreshing = false;
  acceptingOrder = false;

  // Mock driver stats - in real app this would come from API
  driverStats: DriverStats = {
    totalDeliveries: 156,
    todayDeliveries: 3,
    totalEarnings: 2340.50,
    todayEarnings: 45.80,
    averageRating: 4.8,
    currentStatus: 'available'
  };

  workHoursToday = 6.5;
  onlineSince = '08:30';

  ngOnInit() {
    this.loadDriverData();
    // Refresh orders every 30 seconds when available
    interval(30000).subscribe(() => {
      if (this.driverStats.currentStatus === 'available') {
        this.loadAvailableOrders();
      }
    });
  }

  private loadDriverData() {
    // Load driver stats, active delivery, etc.
    this.loadAvailableOrders();
    this.loadRecentDeliveries();
  }

  private loadAvailableOrders() {
    // In real app, this would call the orders service
    // this.availableOrders$ = this.ordersService.getAvailableOrdersForDriver();
    console.log('Loading available orders...');
  }

  private loadRecentDeliveries() {
    // In real app, this would call the orders service
    // this.recentDeliveries$ = this.ordersService.getDriverDeliveryHistory();
    console.log('Loading recent deliveries...');
  }

  toggleStatus() {
    if (this.togglingStatus) return;

    this.togglingStatus = true;

    const newStatus = this.driverStats.currentStatus === 'available' ? 'offline' : 'available';

    // In real app, this would call the API
    setTimeout(() => {
      this.driverStats.currentStatus = newStatus;
      this.togglingStatus = false;

      if (newStatus === 'available') {
        this.loadAvailableOrders();
      }
    }, 1000);
  }

  acceptOrder(order: Order) {
    if (this.acceptingOrder) return;

    this.acceptingOrder = true;

    // In real app, this would call the orders service
    setTimeout(() => {
      this.acceptingOrder = false;
      // Set as active delivery
      // this.activeDelivery$ = of(order);
      // Remove from available orders
      alert(`Auftrag #${order.id} wurde angenommen!`);
    }, 1000);
  }

  markAsDelivered(order: Order) {
    // In real app, this would call the orders service
    if (confirm('Möchten Sie diese Lieferung als abgeschlossen markieren?')) {
      // Update order status to delivered
      alert('Lieferung wurde als abgeschlossen markiert!');
      // Clear active delivery
      // this.activeDelivery$ = of(null);
    }
  }

  contactCustomer(order: Order) {
    // In real app, this would open phone app or messaging
    const phoneNumber = '+49 123 456789'; // Would come from order data
    window.open(`tel:${phoneNumber}`);
  }

  viewOrderDetails(order: Order) {
    // TODO: Implement order details modal
    console.log('View order details:', order);
  }

  refreshOrders() {
    if (this.refreshing) return;

    this.refreshing = true;
    setTimeout(() => {
      this.loadAvailableOrders();
      this.refreshing = false;
    }, 1000);
  }

  getStatusLabel(status: DriverStats['currentStatus']): string {
    const labels = {
      available: 'Verfügbar',
      busy: 'Beschäftigt',
      offline: 'Offline',
      on_delivery: 'In Lieferung'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: DriverStats['currentStatus']): string {
    const icons = {
      available: 'fa-circle-check',
      busy: 'fa-clock',
      offline: 'fa-circle-xmark',
      on_delivery: 'fa-truck'
    };
    return icons[status] || 'fa-circle';
  }
}
