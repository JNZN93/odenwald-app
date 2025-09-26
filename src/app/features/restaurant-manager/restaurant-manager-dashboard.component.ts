import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { AuthService, User } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription, interval } from 'rxjs';


export interface ManagerMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  queryParams: Record<string, any>;
  color: string;
  badge?: string;
}

@Component({
  selector: 'app-restaurant-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterOutlet],
  template: `
    <div class="manager-dashboard-container">
      <!-- Navigation Header -->
      <div class="manager-nav-header">

        <nav class="manager-nav">
          <a
            *ngFor="let menuItem of managerMenuItems"
            [routerLink]="menuItem.route"
             [queryParams]="menuItem.queryParams"
            routerLinkActive="active"
            class="nav-item"
          >
            <!-- Font Awesome Icons -->
            <i *ngIf="menuItem.icon === 'overview-icon'" class="fas fa-th-large nav-icon"></i>
            <i *ngIf="menuItem.icon === 'orders-icon'" class="fas fa-clipboard-check nav-icon"></i>
            <i *ngIf="menuItem.icon === 'issues-icon'" class="fas fa-triangle-exclamation nav-icon"></i>
            <i *ngIf="menuItem.icon === 'tables-icon'" class="fas fa-chair nav-icon"></i>
            <i *ngIf="menuItem.icon === 'drivers-icon'" class="fas fa-truck nav-icon"></i>
            <i *ngIf="menuItem.icon === 'menu-icon'" class="fas fa-list nav-icon"></i>
            <i *ngIf="menuItem.icon === 'details-icon'" class="fas fa-info-circle nav-icon"></i>
            <i *ngIf="menuItem.icon === 'analytics-icon'" class="fas fa-chart-line nav-icon"></i>
            <i *ngIf="menuItem.icon === 'customers-icon'" class="fas fa-address-book nav-icon"></i>
            <i *ngIf="menuItem.icon === 'settings-icon'" class="fas fa-cog nav-icon"></i>
            <i *ngIf="menuItem.icon === 'wholesale-icon'" class="fas fa-store nav-icon"></i>
            <span>{{ menuItem.title }}</span>
            <span *ngIf="menuItem.badge" class="badge">{{ menuItem.badge }}</span>
          </a>
        </nav>

        <!-- Restaurant Selector -->
        <div class="restaurant-selector" *ngIf="managedRestaurants.length > 1">
          <select
            [(ngModel)]="selectedRestaurantId"
            (change)="onRestaurantChange()"
            class="restaurant-select"
          >
            <option *ngFor="let restaurant of managedRestaurants" [value]="restaurant.restaurant_id">
              {{ restaurant.restaurant_name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      <div class="quick-stats-bar" *ngIf="currentStats && !isLoadingStats && shouldShowQuickStatsBar()">
        <div class="stat-card">
          <div class="stat-label">Heutige Bestellungen</div>
          <div class="stat-value">{{ currentStats.total_orders_today }}</div>
          <div class="stat-change">+12% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Umsatz heute</div>
          <div class="stat-value">€{{ currentStats.total_revenue_today?.toFixed(2) || '0.00' }}</div>
          <div class="stat-change">+8% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ø Bestellwert</div>
          <div class="stat-value">€{{ currentStats.average_order_value?.toFixed(2) || '0.00' }}</div>
          <div class="stat-change">+5% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bestellungen diese Woche</div>
          <div class="stat-value">{{ currentStats.total_orders_this_week || 0 }}</div>
          <div class="stat-change">+15% vs letzte Woche</div>
        </div>
      </div>

      <!-- Loading Stats Bar -->
      <div class="quick-stats-bar" *ngIf="isLoadingStats && shouldShowQuickStatsBar()">
        <div class="stat-card loading">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton short"></div>
        </div>
        <div class="stat-card loading">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton short"></div>
        </div>
        <div class="stat-card loading">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton short"></div>
        </div>
        <div class="stat-card loading">
          <div class="loading-skeleton"></div>
          <div class="loading-skeleton short"></div>
        </div>
      </div>

      <!-- Quick Stats Bar (Fallback when no data) -->
      <div class="quick-stats-bar" *ngIf="!currentStats && !isLoadingStats && shouldShowQuickStatsBar()">
        <div class="stat-card">
          <div class="stat-label">Heutige Bestellungen</div>
          <div class="stat-value">0</div>
          <div class="stat-change">Keine Daten verfügbar</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Umsatz heute</div>
          <div class="stat-value">€0.00</div>
          <div class="stat-change">Keine Daten verfügbar</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ø Bestellwert</div>
          <div class="stat-value">€0.00</div>
          <div class="stat-change">Keine Daten verfügbar</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bestellungen diese Woche</div>
          <div class="stat-value">0</div>
          <div class="stat-change">Keine Daten verfügbar</div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="manager-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .manager-dashboard-container {
      min-height: 100vh;
      background: var(--bg-light-green);
    }

    /* Navigation Header */
    .manager-nav-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-6);
      display: flex;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }





    .manager-nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      overflow-y: visible;
      padding-bottom: var(--space-2);
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    .manager-nav::-webkit-scrollbar {
      height: 6px;
    }

    .manager-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .manager-nav::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }

    .manager-nav::-webkit-scrollbar-thumb:hover {
      background: var(--color-gray-400);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      color: var(--color-muted);
      text-decoration: none;
      transition: all var(--transition);
      position: relative;
      font-weight: 500;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .nav-item:hover {
      background: var(--bg-light-green);
      color: var(--color-text);
    }

    .nav-item:hover .nav-icon {
      color: var(--color-text);
    }

    .nav-item.active {
      background: var(--color-primary-500);
      color: white;
    }

    .nav-icon {
      font-size: 18px;
      opacity: 1;
      flex-shrink: 0;
      color: var(--color-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item.active .nav-icon {
      color: white;
    }

    .badge {
      background: var(--color-danger);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      position: absolute;
      top: 2px;
      right: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .restaurant-selector {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-2);
    }

    .restaurant-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    /* Quick Stats Bar */
    .quick-stats-bar {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-6);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .stat-card {
      background: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .stat-change {
      font-size: var(--text-xs);
      color: var(--color-success);
      font-weight: 500;
    }

    /* Main Content Area */
    .manager-content {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading States */
    .stat-card.loading {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .loading-skeleton {
      background: var(--bg-light-green);
      border-radius: var(--radius-md);
      animation: pulse 1.5s ease-in-out infinite alternate;
    }

    .loading-skeleton:not(.short) {
      height: 24px;
    }

    .loading-skeleton.short {
      height: 16px;
      width: 60%;
    }

    @keyframes pulse {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.5;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .manager-nav-header {
        padding: var(--space-4);
      }

      .restaurant-brand-section {
        margin: 0 var(--space-4) var(--space-3) var(--space-4);
        padding: var(--space-2) var(--space-4);
      }

      .restaurant-name-display {
        font-size: var(--text-lg);
      }

      .restaurant-icon {
        width: 20px;
        height: 20px;
      }

      .manager-nav {
        justify-content: flex-start;
        gap: var(--space-3);
        overflow-x: auto;
        overflow-y: visible;
        padding-bottom: var(--space-2);
      }

      .nav-item {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        min-width: 48px;
        justify-content: center;
      }

      .nav-item:hover {
        background: var(--bg-light-green);
        border-color: var(--color-primary-200);
      }

      .nav-item:hover .nav-icon {
        color: var(--color-text);
      }

      .nav-item.active {
        background: var(--color-primary-500);
        color: white;
        border-color: var(--color-primary-500);
      }

      .nav-item span:not(.badge) {
        display: none;
      }

      .nav-item {
        flex-shrink: 0;
        white-space: nowrap;
      }

      .nav-icon {
        font-size: 16px;
        color: var(--color-muted);
      }

      .quick-stats-bar {
        padding: var(--space-4);
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 1024px) {
      .manager-content {
        padding: 0;
      }
    }

    @media (max-width: 768px) {
      .manager-content {
        padding: 0;
      }

      .nav-brand h1 {
        font-size: var(--text-lg);
      }

      .nav-item {
        min-width: 44px;
        padding: var(--space-2);
      }

      .nav-icon {
        font-size: 14px;
      }

      .quick-stats-bar {
        grid-template-columns: 1fr;
      }

      .stat-card {
        text-align: center;
      }
    }
  `]
})
export class RestaurantManagerDashboardComponent implements OnInit, OnDestroy {
  private restaurantManagerService = inject(RestaurantManagerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];
  private badgeRefreshSubscription?: Subscription;

  managedRestaurants: any[] = [];
  selectedRestaurantId: string = '';
  currentStats: any = null;
  currentUser: User | null = null;
  isLoadingStats: boolean = false;
  pendingOrdersCount: number = 0;
  pendingWholesalerOrdersCount: number = 0;
  openIssuesCount: number = 0;
  currentRestaurant: any = null;
  needsStripeSetup: boolean = false;


  managerMenuItems: ManagerMenuItem[] = [];

  // Check if current route is overview
  isOverviewRoute(): boolean {
    return this.router.url.includes('/restaurant-manager/overview');
  }

  // Check if user has admin or manager role
  isAdminOrManager(): boolean {
    return this.authService.hasAnyRole(['admin', 'manager']);
  }

  // Check if quick stats bar should be visible
  shouldShowQuickStatsBar(): boolean {
    return this.isOverviewRoute() && this.isAdminOrManager();
  }

  ngOnInit() {
    this.setupManagerMenu();
    this.loadCurrentUser();
    this.loadManagedRestaurants();
    this.loadBadgeCounts();

    // Auto-refresh badge counts every 30 seconds
    this.badgeRefreshSubscription = interval(30000).subscribe(() => {
      this.loadBadgeCounts();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.badgeRefreshSubscription) {
      this.badgeRefreshSubscription.unsubscribe();
    }
  }

  private loadCurrentUser() {
    const sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Dashboard: Current user loaded:', user);
    });
    this.subscriptions.push(sub);
  }

  private loadManagedRestaurants() {
    const sub = this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants) => {
        this.managedRestaurants = restaurants;
        console.log('Managed restaurants loaded:', restaurants);

        if (this.managedRestaurants.length > 0) {
          this.selectedRestaurantId = this.managedRestaurants[0].restaurant_id;
          // Speichere das erste Restaurant im Service
          this.restaurantManagerService.setSelectedRestaurant(this.managedRestaurants[0]);
          this.loadRestaurantStats(this.selectedRestaurantId);
          this.loadRestaurantDetails(this.selectedRestaurantId);
        }
      },
      error: (error) => {
        console.error('Error loading managed restaurants:', error);
        this.toastService.error('Fehler', 'Restaurants konnten nicht geladen werden');
      }
    });
    this.subscriptions.push(sub);
  }

  private loadRestaurantStats(restaurantId: string) {
    this.isLoadingStats = true;
    const sub = this.restaurantManagerService.getRestaurantStats(restaurantId, 'today').subscribe({
      next: (stats) => {
        this.currentStats = stats;
        this.isLoadingStats = false;
        console.log('Restaurant stats loaded:', stats);
      },
      error: (error) => {
        console.error('Error loading restaurant stats:', error);
        this.toastService.error('Fehler', 'Restaurant-Statistiken konnten nicht geladen werden');
        this.isLoadingStats = false;
        // Set fallback stats
        this.currentStats = {
          total_orders_today: 0,
          total_revenue_today: 0,
          total_orders_this_week: 0,
          total_revenue_this_week: 0,
          total_orders_this_month: 0,
          total_revenue_this_month: 0,
          average_order_value: 0,
          popular_items: []
        };
      }
    });
    this.subscriptions.push(sub);
  }

  private loadRestaurantDetails(restaurantId: string) {
    const sub = this.restaurantManagerService.getRestaurantDetails(restaurantId).subscribe({
      next: (restaurant) => {
        this.currentRestaurant = restaurant;
        this.needsStripeSetup = !restaurant.stripe_account_id;
        this.updateMenuBadges();
        console.log('Restaurant details loaded:', restaurant);
      },
      error: (error) => {
        console.error('Error loading restaurant details:', error);
        this.needsStripeSetup = false;
        this.updateMenuBadges();
      }
    });
    this.subscriptions.push(sub);
  }

  onRestaurantChange() {
    if (this.selectedRestaurantId) {
      // Finde das ausgewählte Restaurant und speichere es im Service
      const selectedRestaurant = this.managedRestaurants.find(r => r.restaurant_id === this.selectedRestaurantId);
      if (selectedRestaurant) {
        this.restaurantManagerService.setSelectedRestaurant(selectedRestaurant);
      }
      this.loadRestaurantStats(this.selectedRestaurantId);
      this.loadRestaurantDetails(this.selectedRestaurantId);
      this.loadBadgeCounts(); // Reload badge counts when restaurant changes
    }
  }

  private async loadBadgeCounts() {
    try {
      console.log('Loading badge counts...');

      // Load pending orders count
      const ordersResponse = await this.restaurantManagerService.getHttpClient().get(
        `${this.restaurantManagerService.getApiUrl()}/orders/stats/pending`
      ).toPromise();

      console.log('Orders stats response:', ordersResponse);

      if (ordersResponse && typeof ordersResponse === 'object' && 'pending_orders_count' in ordersResponse) {
        this.pendingOrdersCount = ordersResponse.pending_orders_count as number;
        console.log('Set pending orders count to:', this.pendingOrdersCount);
      } else {
        console.warn('Invalid orders response format:', ordersResponse);
        this.pendingOrdersCount = 0;
      }

      // Load pending wholesaler orders count
      const wholesalerResponse = await this.restaurantManagerService.getHttpClient().get(
        `${this.restaurantManagerService.getApiUrl()}/wholesaler-orders/stats/pending`
      ).toPromise();

      console.log('Wholesaler stats response:', wholesalerResponse);

      if (wholesalerResponse && typeof wholesalerResponse === 'object' && 'pending_wholesaler_orders_count' in wholesalerResponse) {
        this.pendingWholesalerOrdersCount = wholesalerResponse.pending_wholesaler_orders_count as number;
        console.log('Set pending wholesaler orders count to:', this.pendingWholesalerOrdersCount);
      } else {
        console.warn('Invalid wholesaler response format:', wholesalerResponse);
        this.pendingWholesalerOrdersCount = 0;
      }

      // Load open issues count for current restaurant
      if (this.selectedRestaurantId) {
        const issuesResponse = await this.restaurantManagerService.getHttpClient().get(
          `${this.restaurantManagerService.getApiUrl()}/order-issues/restaurant/${this.selectedRestaurantId}`
        ).toPromise();

        console.log('Issues response:', issuesResponse);

        if (Array.isArray(issuesResponse)) {
          // Count only open issues (status: 'open')
          this.openIssuesCount = issuesResponse.filter((issue: any) => issue.status === 'open').length;
          console.log('Set open issues count to:', this.openIssuesCount);
        } else {
          console.warn('Invalid issues response format:', issuesResponse);
          this.openIssuesCount = 0;
        }
      } else {
        this.openIssuesCount = 0;
      }

      // Update menu badges
      this.updateMenuBadges();
    } catch (error) {
      console.error('Error loading badge counts:', error);
      // Don't reset counts on error - keep previous values
      // Only reset if this is the first load
      if (this.pendingOrdersCount === undefined) {
        this.pendingOrdersCount = 0;
      }
      if (this.pendingWholesalerOrdersCount === undefined) {
        this.pendingWholesalerOrdersCount = 0;
      }
      if (this.openIssuesCount === undefined) {
        this.openIssuesCount = 0;
      }
      this.updateMenuBadges();
    }
  }

  private updateMenuBadges() {
    this.managerMenuItems.forEach(item => {
      if (item.id === 'orders') {
        item.badge = this.pendingOrdersCount > 0 ? this.pendingOrdersCount.toString() : undefined;
      } else if (item.id === 'wholesale') {
        item.badge = this.pendingWholesalerOrdersCount > 0 ? this.pendingWholesalerOrdersCount.toString() : undefined;
      } else if (item.id === 'issues') {
        item.badge = this.openIssuesCount > 0 ? this.openIssuesCount.toString() : undefined;
      } else if (item.id === 'settings' && this.needsStripeSetup) {
        item.badge = '!';
      }
    });
  }

  getSelectedRestaurantName(): string {
    const restaurant = this.managedRestaurants.find(r => r.restaurant_id === this.selectedRestaurantId);
    return restaurant ? restaurant.restaurant_name : '';
  }



  setupManagerMenu() {
    this.managerMenuItems = [
      {
        id: 'overview',
        title: 'Übersicht',
        description: 'Dashboard und Statistiken',
        icon: 'overview-icon',
        route: '/restaurant-manager/overview',
        queryParams: {},
        color: '#4aa96c'
      },
      {
        id: 'orders',
        title: 'Bestellungen',
        description: 'Bestellungen verwalten',
        icon: 'orders-icon',
        route: '/restaurant-manager/orders',
        queryParams: {},
        color: '#f59e0b',
        badge: this.pendingOrdersCount > 0 ? this.pendingOrdersCount.toString() : undefined
      },
      {
        id: 'issues',
        title: 'Reklamationen',
        description: 'Zugewiesene Kundenreklamationen',
        icon: 'issues-icon',
        route: '/restaurant-manager/issues',
        queryParams: {},
        color: '#dc2626'
      },
      {
        id: 'tables',
        title: 'Tische',
        description: 'Tischverwaltung & Tischangebote',
        icon: 'tables-icon',
        route: '/restaurant-manager/tables',
        queryParams: {},
        color: '#8b5cf6'
      },
      {
        id: 'drivers',
        title: 'Fahrer',
        description: 'Fahrer verwalten & zuweisen',
        icon: 'drivers-icon',
        route: '/restaurant-manager/drivers',
        queryParams: {},
        color: '#06b6d4'
      },
      {
        id: 'menu',
        title: 'Speisekarte',
        description: 'Menu bearbeiten',
        icon: 'menu-icon',
        route: '/restaurant-manager/menu',
        queryParams: {},
        color: '#3B82F6'
      },
      {
        id: 'details',
        title: 'Details',
        description: 'Restaurant-Details für Kunden',
        icon: 'details-icon',
        route: '/restaurant-manager/details',
        queryParams: {},
        color: '#059669'
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Berichte & Statistiken',
        icon: 'analytics-icon',
        route: '/restaurant-manager/analytics',
        queryParams: {},
        color: '#ef4444'
      },
      {
        id: 'customers',
        title: 'Kunden',
        description: 'Kunden verwalten',
        icon: 'customers-icon',
        route: '/restaurant-manager/customers',
        queryParams: {},
        color: '#ec4899'
      },
      {
        id: 'settings',
        title: 'Einstellungen',
        description: 'Restaurant-Einstellungen',
        icon: 'settings-icon',
        route: '/restaurant-manager/settings',
        queryParams: { tab: 'stripe' },
        color: '#8b5cf6'
      },
      {
        id: 'wholesale',
        title: 'Großhandel Einkauf',
        description: 'Zutaten und Waren bestellen',
        icon: 'wholesale-icon',
        route: '/restaurant-manager/wholesale',
        queryParams: {},
        color: '#10b981',
        badge: this.pendingWholesalerOrdersCount > 0 ? this.pendingWholesalerOrdersCount.toString() : undefined
      }
    ];
  }

}
