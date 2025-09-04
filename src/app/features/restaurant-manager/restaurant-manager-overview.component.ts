import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, forkJoin } from 'rxjs';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { RestaurantsService } from '../../core/services/restaurants.service';

@Component({
  selector: 'app-restaurant-manager-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="overview-container" *ngIf="!isLoading; else loadingTemplate">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1>Willkommen zurück!</h1>
        <p class="subtitle">Hier ist der aktuelle Status deines Restaurants</p>
      </div>

      <!-- Key Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card primary">
          <div class="metric-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <div class="metric-content">
            <h3>{{ getTotalOrdersToday() }}</h3>
            <p>Bestellungen heute</p>
            <span class="change positive">+12% vs gestern</span>
          </div>
        </div>

        <div class="metric-card secondary">
          <div class="metric-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="metric-content">
            <h3>{{ getTotalRevenueToday() }}</h3>
            <p>Umsatz heute</p>
            <span class="change positive">+8% vs gestern</span>
          </div>
        </div>

        <div class="metric-card accent">
          <div class="metric-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="metric-content">
            <h3>{{ getPendingOrdersCount() }}</h3>
            <p>Ausstehende Bestellungen</p>
            <span class="change neutral">Aktualisiert</span>
          </div>
        </div>

        <div class="metric-card success">
          <div class="metric-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="metric-content">
            <h3>{{ getRatingDisplay() }}</h3>
            <p>Durchschnittliche Bewertung</p>
            <span class="change neutral">{{ getReviewCountDisplay() }}</span>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Recent Orders -->
        <div class="content-card">
          <div class="card-header">
            <h2>Letzte Bestellungen</h2>
            <a [routerLink]="['/restaurant-manager/orders']" class="view-all-link">Alle anzeigen</a>
          </div>
          <div class="orders-list">
            <div *ngFor="let order of recentOrders; trackBy: trackByOrderId" class="order-item">
              <div class="order-info">
                <div class="order-number">#{{ getOrderIdDisplay(order.id) }}</div>
                <div class="order-customer">{{ order.customer_name || 'Unbekannter Kunde' }}</div>
                <div class="order-time">{{ formatOrderTime(order.order_time) }}</div>
              </div>
              <div class="order-status">
                <span [ngClass]="getOrderStatusClass(order.status)" class="status-badge">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
              <div class="order-amount">{{ getOrderAmountDisplay(order.total) }}</div>
            </div>
            <div *ngIf="!recentOrders || recentOrders.length === 0" class="empty-state">
              <i class="fa-solid fa-shopping-cart"></i>
              <p>Keine Bestellungen vorhanden</p>
            </div>
          </div>
        </div>

        <!-- Popular Items -->
        <div class="content-card">
          <div class="card-header">
            <h2>Beliebteste Gerichte</h2>
            <a [routerLink]="['/restaurant-manager/menu']" class="view-all-link">Menu bearbeiten</a>
          </div>
          <div class="popular-items-list">
            <div *ngFor="let item of getPopularItems(); let i = index" class="popular-item">
              <div class="item-rank">#{{ i + 1 }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-orders">{{ item.order_count }} Bestellungen</div>
              </div>
              <div class="item-trend">
                <span class="trend-indicator positive">
                  <i class="fa-solid fa-arrow-up"></i>
                </span>
              </div>
            </div>
            <div *ngIf="getPopularItems().length === 0" class="empty-state">
              <i class="fa-solid fa-utensils"></i>
              <p>Keine Daten verfügbar</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Schnellaktionen</h2>
        <div class="actions-grid">
          <button [routerLink]="['/restaurant-manager/menu']" class="action-button primary">
            <i class="fa-solid fa-plus"></i>
            <span>Neues Gericht hinzufügen</span>
          </button>
          <button [routerLink]="['/restaurant-manager/orders']" class="action-button secondary">
            <i class="fa-solid fa-list-check"></i>
            <span>Bestellungen verwalten</span>
          </button>
          <button [routerLink]="['/restaurant-manager/analytics']" class="action-button accent">
            <i class="fa-solid fa-chart-pie"></i>
            <span>Berichte anzeigen</span>
          </button>
          <button [routerLink]="['/restaurant-manager/settings']" class="action-button neutral">
            <i class="fa-solid fa-cog"></i>
            <span>Einstellungen</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Template -->
    <ng-template #loadingTemplate>
      <div class="loading-container">
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Daten werden geladen...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .overview-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    .welcome-section {
      margin-bottom: var(--space-8);
      text-align: center;
    }

    .welcome-section h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .subtitle {
      font-size: var(--text-lg);
      color: var(--color-muted);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .metric-card {
      background: white;
      padding: var(--space-6);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      transition: all var(--transition);
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .metric-card.primary {
      border-left: 4px solid var(--color-primary-500);
    }

    .metric-card.secondary {
      border-left: 4px solid var(--color-secondary-500);
    }

    .metric-card.accent {
      border-left: 4px solid var(--color-accent-500);
    }

    .metric-card.success {
      border-left: 4px solid var(--color-success);
    }

    .metric-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .metric-card.primary .metric-icon {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .metric-card.secondary .metric-icon {
      background: var(--color-secondary-50);
      color: var(--color-secondary-600);
    }

    .metric-card.accent .metric-icon {
      background: var(--color-accent-50);
      color: var(--color-accent-600);
    }

    .metric-card.success .metric-icon {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .metric-content h3 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin: 0 0 var(--space-1) 0;
    }

    .metric-content p {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-2) 0;
    }

    .change {
      font-size: var(--text-xs);
      font-weight: 600;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .change.positive {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .change.negative {
      background: var(--color-danger-50);
      color: var(--color-danger);
    }

    .change.neutral {
      background: var(--color-muted-50);
      color: var(--color-muted);
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .content-card {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .view-all-link {
      font-size: var(--text-sm);
      color: var(--color-primary-600);
      text-decoration: none;
      font-weight: 500;
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    /* Orders List */
    .orders-list {
      padding: 0;
    }

    .order-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      transition: background-color var(--transition);
    }

    .order-item:hover {
      background: var(--bg-light-green);
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .order-info {
      flex: 1;
    }

    .order-number {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .order-customer {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .order-time {
      font-size: var(--text-xs);
      color: var(--color-muted-600);
    }

    .status-badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background: var(--color-warning-50);
      color: var(--color-warning);
    }

    .status-badge.confirmed {
      background: var(--color-info-50);
      color: var(--color-info);
    }

    .status-badge.preparing {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .status-badge.ready {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .status-badge.delivered {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .status-badge.cancelled {
      background: var(--color-danger-50);
      color: var(--color-danger);
    }

    .order-amount {
      font-weight: 600;
      color: var(--color-text);
    }

    /* Popular Items */
    .popular-items-list {
      padding: 0;
    }

    .popular-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .popular-item:last-child {
      border-bottom: none;
    }

    .item-rank {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
      min-width: 30px;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .item-orders {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .trend-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
    }

    .trend-indicator.positive {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-8) var(--space-6);
      text-align: center;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: var(--text-sm);
    }

    /* Quick Actions */
    .quick-actions {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
    }

    .quick-actions h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-6);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: white;
      color: var(--color-text);
      text-decoration: none;
      font-weight: 500;
      transition: all var(--transition);
      cursor: pointer;
    }

    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .action-button.primary {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
    }

    .action-button.primary:hover {
      background: var(--color-primary-50);
    }

    .action-button.secondary {
      border-color: var(--color-secondary-500);
      color: var(--color-secondary-600);
    }

    .action-button.secondary:hover {
      background: var(--color-secondary-50);
    }

    .action-button.accent {
      border-color: var(--color-accent-500);
      color: var(--color-accent-600);
    }

    .action-button.accent:hover {
      background: var(--color-accent-50);
    }

    .action-button.neutral {
      border-color: var(--color-muted-300);
      color: var(--color-muted-600);
    }

    .action-button.neutral:hover {
      background: var(--color-muted-50);
    }

    .action-button i {
      font-size: 1.25rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .overview-container {
        padding: var(--space-4) 0;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .metric-card {
        padding: var(--space-4);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        padding: var(--space-4);
      }
    }

    /* Loading Styles */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: var(--space-8);
    }

    .loading-spinner {
      font-size: 2rem;
      color: var(--color-primary-600);
      margin-bottom: var(--space-4);
    }

    .loading-container p {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }
  `]
})
export class RestaurantManagerOverviewComponent implements OnInit, OnDestroy {
  private restaurantManagerService = inject(RestaurantManagerService);
  private restaurantsService = inject(RestaurantsService);

  currentStats: any = {
    total_orders_today: 0,
    total_revenue_today: 0,
    average_order_value: 0,
    popular_items: []
  };

  recentOrders: any[] = [];
  currentRestaurant: any = null;
  isLoading: boolean = true;
  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadDashboardData();
    // Auto-refresh every 5 minutes
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadDashboardData() {
    this.isLoading = true;

    // First get the managed restaurants for current user
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        if (restaurants.length > 0) {
          const restaurantId = restaurants[0].restaurant_id; // Use first managed restaurant
          this.loadRestaurantData(restaurantId);
        } else {
          this.isLoading = false;
          console.warn('No managed restaurants found');
        }
      },
      error: (error: any) => {
        console.error('Error loading managed restaurants:', error);
        this.isLoading = false;
      }
    });
  }

  private loadRestaurantData(restaurantId: string) {
    // Load restaurant details, stats, and recent orders in parallel
    const restaurant$ = this.restaurantsService.getRestaurantById(restaurantId);
    const stats$ = this.restaurantManagerService.getRestaurantStats(restaurantId, 'today');
    const recentOrders$ = this.restaurantManagerService.getRecentOrders(restaurantId, 5);

    forkJoin([restaurant$, stats$, recentOrders$]).subscribe({
      next: (results: any[]) => {
        const [restaurant, stats, orders] = results;
        this.currentRestaurant = restaurant;
        this.currentStats = {
          total_orders_today: stats?.total_orders_today || 0,
          total_revenue_today: stats?.total_revenue_today || 0,
          average_order_value: stats?.average_order_value || 0,
          popular_items: stats?.popular_items?.slice(0, 3) || [] // Show top 3 popular items
        };

        // Transform recent orders to match component format
        this.recentOrders = orders?.map((order: any) => ({
          id: order.id,
          customer_name: order.customer_name || 'Unbekannter Kunde',
          order_time: order.created_at,
          status: order.status,
          total: order.total_price
        })) || [];

        // pendingOrdersCount is now calculated in getPendingOrdersCount() method

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading restaurant data:', error);
        this.isLoading = false;
      }
    });
  }

  refreshData() {
    if (this.currentRestaurant?.id) {
      this.loadRestaurantData(this.currentRestaurant.id);
    } else {
      this.loadDashboardData();
    }
  }

  getRatingDisplay(): string {
    if (!this.currentRestaurant?.rating) {
      return '0.0';
    }

    const rating = typeof this.currentRestaurant.rating === 'number'
      ? this.currentRestaurant.rating
      : parseFloat(this.currentRestaurant.rating);

    if (isNaN(rating)) {
      return '0.0';
    }

    return rating.toFixed(1);
  }

  getReviewCountDisplay(): string {
    const count = this.currentRestaurant?.total_reviews || 0;
    return `${count} Bewertungen`;
  }

  getTotalOrdersToday(): number {
    return this.currentStats?.total_orders_today || 0;
  }

  getTotalRevenueToday(): string {
    const revenue = this.currentStats?.total_revenue_today || 0;
    if (typeof revenue === 'number') {
      return `€${revenue.toFixed(2)}`;
    }
    return '€0.00';
  }

  getPopularItems(): any[] {
    return this.currentStats?.popular_items?.slice(0, 3) || [];
  }

  getPendingOrdersCount(): number {
    if (!this.recentOrders || !Array.isArray(this.recentOrders)) {
      return 0;
    }

    return this.recentOrders.filter(order =>
      ['pending', 'confirmed', 'preparing'].includes(order?.status)
    ).length;
  }

  getOrderIdDisplay(orderId: any): string {
    if (!orderId) {
      return '#000000';
    }

    // Convert to string if it's a number (database returns integers)
    const idString = typeof orderId === 'number' ? orderId.toString() : orderId.toString();

    if (idString.length <= 6) {
      return `#${idString.padStart(6, '0')}`;
    }

    return `#${idString.slice(-6)}`;
  }

  getOrderAmountDisplay(total: any): string {
    if (total === null || total === undefined) {
      return '€0.00';
    }

    const numTotal = typeof total === 'number' ? total : parseFloat(total);

    if (isNaN(numTotal)) {
      return '€0.00';
    }

    return `€${numTotal.toFixed(2)}`;
  }

  trackByOrderId(index: number, order: any): string {
    if (!order) return index.toString();
    return (order.id && typeof order.id === 'string') ? order.id : index.toString();
  }

  formatOrderTime(orderTime: string): string {
    if (!orderTime || typeof orderTime !== 'string') {
      return 'Unbekannt';
    }

    const date = new Date(orderTime);
    if (isNaN(date.getTime())) {
      return 'Ungültig';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `vor ${Math.max(1, diffInMinutes)} Min.`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `vor ${Math.floor(diffInMinutes / 60)} Std.`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  }

  getOrderStatusClass(status: string): string {
    if (!status || typeof status !== 'string') {
      return 'pending';
    }

    switch (status.toLowerCase()) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'picked_up': return 'ready';
      case 'delivered': return 'delivered';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  getOrderStatusText(status: string): string {
    if (!status || typeof status !== 'string') {
      return 'Unbekannt';
    }

    switch (status.toLowerCase()) {
      case 'pending': return 'Ausstehend';
      case 'confirmed': return 'Bestätigt';
      case 'preparing': return 'Wird zubereitet';
      case 'ready': return 'Bereit zur Abholung';
      case 'picked_up': return 'Abgeholt';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return 'Unbekannt';
    }
  }
}
