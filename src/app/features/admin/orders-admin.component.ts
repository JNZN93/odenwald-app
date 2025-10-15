import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { OrdersService, Order } from '../../core/services/orders.service';

// Extended Order interface for API responses that may have additional properties
export interface ExtendedOrder extends Omit<Order, 'status'> {
  total_price: number;
  tax_amount?: number;
  order_time?: string;
  total?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'served' | 'paid' | 'cancelled' | 'open' | 'in_progress' | 'out_for_delivery';
}

export interface OrderFilters {
  search: string;
  status: 'all' | ExtendedOrder['status'];
  restaurant: 'all' | string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'created_at' | 'total_price' | 'customer_name';
  sortOrder: 'asc' | 'desc';
}

export interface OrderStatsResponse {
  stats: {
    total_orders: number;
    orders_by_status: Record<string, number>;
    total_revenue: number;
    average_order_value: number;
    orders_by_restaurant: Record<string, number>;
  };
}

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-admin-container">
      <!-- Header -->
      <div class="page-header">
        <h1><i class="fa-solid fa-list-check"></i> Bestellungsverwaltung</h1>
        <p>Verwalte alle Bestellungen der Plattform</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="stat-content">
            <h3>Gesamt Bestellungen</h3>
            <div class="stat-value">{{ totalOrders }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Offene Bestellungen</h3>
            <div class="stat-value">{{ pendingOrders }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Heutiger Umsatz</h3>
            <div class="stat-value">{{ todayRevenue }}€</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>In Lieferung</h3>
            <div class="stat-value">{{ deliveringOrders }}</div>
          </div>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="filters-section">
        <div class="search-filters">
          <div class="search-box">
            <i class="fa-solid fa-search"></i>
            <input 
              type="text" 
              [(ngModel)]="filters.search" 
              placeholder="Nach Bestellungs-ID, Kunde oder Restaurant suchen..."
              (input)="applyFilters()"
            >
          </div>
          
          <div class="filter-controls">
            <select [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestätigt</option>
              <option value="preparing">Wird zubereitet</option>
              <option value="ready">Bereit zur Abholung</option>
              <option value="picked_up">Abgeholt</option>
              <option value="delivered">Geliefert</option>
              <option value="served">Serviert</option>
              <option value="paid">Bezahlt</option>
              <option value="cancelled">Storniert</option>
              <option value="open">Offen</option>
            </select>
            
            <select *ngIf="!isRestaurantManager" [(ngModel)]="filters.restaurant" (change)="applyFilters()">
              <option value="all">Alle Restaurants</option>
              <option *ngFor="let restaurant of restaurants" [value]="restaurant.id">
                {{ restaurant.name }}
              </option>
            </select>
            
            <select [(ngModel)]="filters.dateRange" (change)="applyFilters()">
              <option value="all">Alle Daten</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Diesen Monat</option>
            </select>
            
            <select [(ngModel)]="filters.sortBy" (change)="applyFilters()">
              <option value="created_at">Nach Bestellzeit</option>
              <option value="total_price">Nach Betrag</option>
              <option value="customer_name">Nach Kunde</option>
            </select>
            
            <button
              class="btn btn-ghost"
              (click)="toggleSortOrder()"
              [title]="filters.sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'"
            >
              <i class="fa-solid" [ngClass]="filters.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
            </button>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" (click)="exportOrders()">
            <i class="fa-solid fa-download"></i>
            Export CSV
          </button>
          <button class="btn btn-success" (click)="refreshData()">
            <i class="fa-solid fa-refresh"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="orders-table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Bestellung</th>
              <th>Kunde</th>
              <th>Restaurant</th>
              <th>Details</th>
              <th>Status</th>
              <th>Zahlung</th>
              <th>Fahrer</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders" class="order-row">
              <td class="order-info">
                <div class="order-id">#{{ order.id }}</div>
                <div class="order-time">{{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</div>
                <div class="order-total">{{ order.total_price | number:'1.2-2' }}€</div>
              </td>

              <td class="customer-info">
                <div class="customer-name">{{ order.customer_name || 'N/A' }}</div>
                <div class="customer-email">{{ order.customer_email || 'N/A' }}</div>
              </td>
              
              <td class="restaurant-info">
                <div class="restaurant-name">{{ order.restaurant_name }}</div>
              </td>
              
              <td class="order-details">
                <div class="items-count">{{ order.items.length }} Artikel</div>
                <div class="items-preview">
                  <span *ngFor="let item of order.items.slice(0, 2)" class="item-preview">
                    {{ item.name }} × {{ item.quantity }}
                  </span>
                  <span *ngIf="order.items.length > 2" class="more-items">
                    +{{ order.items.length - 2 }} weitere
                  </span>
                </div>
              </td>
              
              <td class="status-cell">
                <span class="status-badge" [class]="'status-' + order.status">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              
              <td class="payment-cell">
                <span class="payment-badge" [class]="'payment-' + order.payment_status">
                  {{ getPaymentLabel(order.payment_status) }}
                </span>
              </td>
              
              <td class="driver-cell">
                <div *ngIf="order.driver_name; else noDriver" class="driver-name">
                  {{ order.driver_name }}
                </div>
                <ng-template #noDriver>
                  <span class="no-driver">Kein Fahrer zugewiesen</span>
                </ng-template>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    class="btn btn-sm btn-ghost"
                    (click)="viewOrderDetails(order)"
                    title="Bestellungs-Details anzeigen"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>

                  <button
                    class="btn btn-sm btn-ghost"
                    (click)="assignDriver(order)"
                    title="Fahrer zuweisen"
                  >
                    <i class="fa-solid fa-user"></i>
                  </button>

                  <button
                    class="btn btn-sm btn-warning"
                    (click)="updateOrderStatus(order)"
                    title="Status ändern"
                  >
                    <i class="fa-solid fa-edit"></i>
                  </button>

                  <button
                    class="btn btn-sm btn-danger"
                    (click)="cancelOrder(order)"
                    title="Bestellung stornieren"
                    *ngIf="order.status !== 'cancelled' && order.status !== 'delivered'"
                  >
                    <i class="fa-solid fa-times"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty State -->
        <div *ngIf="filteredOrders.length === 0" class="empty-state">
          <i class="fa-solid fa-list-check"></i>
          <h3>Keine Bestellungen gefunden</h3>
          <p>Versuche andere Filter-Einstellungen oder suche nach einem anderen Begriff.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="btn btn-ghost"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          <i class="fa-solid fa-chevron-left"></i>
          Zurück
        </button>
        
        <div class="page-numbers">
          <button 
            *ngFor="let page of getPageNumbers()" 
            class="btn btn-sm" 
            [class]="page === currentPage ? 'btn-primary' : 'btn-ghost'"
            (click)="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="btn btn-ghost"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          Weiter
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .orders-admin-container {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .page-header h1 {
      font-size: var(--text-3xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .page-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Statistics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
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
      border-color: var(--color-primary-300);
    }

    .stat-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .stat-icon i {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
    }

    .stat-content h3 {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-1) 0;
      font-weight: 500;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    /* Filters Section */
    .filters-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .search-filters {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      min-width: 300px;
    }

    .search-box i {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-muted);
    }

    .search-box input {
      width: 100%;
      padding: var(--space-3) var(--space-3) var(--space-3) var(--space-10);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-md);
      transition: all var(--transition);
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .filter-controls select {
      padding: var(--space-2) var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .filter-controls select:focus {
      outline: none;
      border-color: var(--color-primary-500);
    }

    .actions {
      display: flex;
      gap: var(--space-3);
    }

    /* Table */
    .orders-table-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th {
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-3);
      text-align: left;
      font-weight: 600;
      color: var(--color-heading);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-sm);
    }

    .orders-table td {
      padding: var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    .order-row:hover {
      background: var(--bg-light-green);
    }

    /* Order Info Column */
    .order-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .order-id {
      font-weight: 700;
      color: var(--color-primary-600);
      font-size: var(--text-md);
    }

    .order-time {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-total {
      font-weight: 600;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    /* Customer Info Column */
    .customer-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .customer-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .customer-email {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Restaurant Info Column */
    .restaurant-name {
      font-weight: 500;
      color: var(--color-text);
    }

    /* Order Details Column */
    .order-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .items-count {
      font-weight: 500;
      color: var(--color-text);
    }

    .items-preview {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .item-preview {
      background: var(--bg-light-green);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .more-items {
      color: var(--color-muted);
      font-size: var(--text-xs);
      font-style: italic;
    }

    /* Status Column */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
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

    /* Payment Column */
    .payment-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .payment-pending { background: color-mix(in oklab, #fbbf24 15%, white); color: #d97706; }
    .payment-paid { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .payment-failed { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }

    /* Driver Column */
    .driver-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .no-driver {
      color: var(--color-muted);
      font-style: italic;
      font-size: var(--text-sm);
    }

    /* Actions Column */
    .action-buttons {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .btn-sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      min-width: 80px;
      height: 32px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-6);
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }

    .page-numbers {
      display: flex;
      gap: var(--space-1);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .search-filters {
        justify-content: center;
      }

      .search-box {
        min-width: auto;
        width: 100%;
      }

      .orders-table {
        font-size: var(--text-sm);
      }

      .orders-table th,
      .orders-table td {
        padding: var(--space-3) var(--space-2);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .orders-table-container {
        overflow-x: auto;
      }

      .action-buttons {
        flex-direction: column;
        gap: var(--space-1);
      }
    }
  `]
})
export class OrdersAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private ordersService = inject(OrdersService);

  orders: ExtendedOrder[] = [];
  filteredOrders: ExtendedOrder[] = [];
  restaurants: Array<{id: string, name: string}> = [];

  // User role detection
  isRestaurantManager = false;
  managedRestaurantId: string | null = null;

  filters: OrderFilters = {
    search: '',
    status: 'all',
    restaurant: 'all',
    dateRange: 'all',
          sortBy: 'created_at',
    sortOrder: 'desc'
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  // Statistics
  totalOrders = 0;
  pendingOrders = 0;
  todayRevenue = 0;
  deliveringOrders = 0;

  async ngOnInit() {
    console.log('[OrdersAdmin] ngOnInit');
    await this.checkUserRole();
    await this.loadOrders();
    this.loadRestaurants();
    this.loadStatistics();
  }

  private async checkUserRole() {
    const currentUser = this.authService.currentUserSubject.value;
    console.log('[OrdersAdmin] checkUserRole -> currentUser', currentUser);
    if (currentUser && currentUser.role === 'manager') {
      this.isRestaurantManager = true;
      try {
        const managedRestaurants = await this.restaurantManagerService.getManagedRestaurants().toPromise();
        console.log('[OrdersAdmin] manager detected, managedRestaurants', managedRestaurants);
        if (managedRestaurants && managedRestaurants.length > 0) {
          this.managedRestaurantId = managedRestaurants[0].restaurant_id;
          // Als Restaurant-Manager: Restaurant-Filter automatisch setzen
          this.filters.restaurant = this.managedRestaurantId;
          console.log('[OrdersAdmin] set managedRestaurantId', this.managedRestaurantId);
        }
      } catch (error) {
        console.error('Error loading managed restaurants:', error);
      }
    }
  }

  async loadOrders() {
    try {
      // Hole Bestellungen - der Backend filtert automatisch nach der Benutzerrolle
      const response = await this.ordersService.getMyOrders().toPromise();
      this.orders = response || [];
      console.log('[OrdersAdmin] loadOrders', { count: this.orders.length, sample: this.orders[0] });
      this.applyFilters();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.orders = [];
      this.applyFilters();
    }
  }

  async loadRestaurants() {
    try {
      const response = await this.http.get<Array<{id: string, name: string}>>(`${environment.apiUrl}/restaurants`).toPromise();
      this.restaurants = response || [];
    } catch (error) {
      console.error('Error loading restaurants:', error);
      this.restaurants = [];
    }
  }

  async loadStatistics() {
    // Berechne Kennzahlen lokal aus den aktuell gefilterten Bestellungen
    this.calculateStatistics();
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(search) ||
        (order.customer_name?.toLowerCase().includes(search)) ||
        order.restaurant_name.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === this.filters.status);
    }

    // Restaurant filter
    if (this.filters.restaurant !== 'all') {
      filtered = filtered.filter(order => order.restaurant_id === this.filters.restaurant);
    }

    // Date range filter
    if (this.filters.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (this.filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(order => order.created_at && new Date(order.created_at) >= startDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
                  case 'total_price':
            aValue = a.total_price || 0;
            bValue = b.total_price || 0;
          break;
        case 'customer_name':
          aValue = a.customer_name?.toLowerCase() || '';
          bValue = b.customer_name?.toLowerCase() || '';
          break;
        default:
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
      }

      if (this.filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredOrders = filtered;
    this.updatePagination();
  }

  toggleSortOrder() {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  calculateStatistics() {
    const source = this.filteredOrders && this.filteredOrders.length > 0 ? this.filteredOrders : this.orders;

    this.totalOrders = source.length;

    // Zähle "offen" je nach möglicher Statusbelegung (neues Backend vs. alte Frontend-Labels)
    const pendingStatuses = ['open', 'in_progress', 'pending', 'confirmed', 'preparing', 'ready'];
    this.pendingOrders = source.filter(o => pendingStatuses.includes(o.status as any)).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayRevenue = source
      .filter(o => o.created_at && new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + (o.total_price || 0), 0);

    // "In Lieferung": in_progress (neues Backend) oder ready (älterer Frontend-Status)
    const deliveringStatuses = ['in_progress', 'ready'];
    this.deliveringOrders = source.filter(o => deliveringStatuses.includes(o.status as any)).length;
  }

  getStatusLabel(status: ExtendedOrder['status']): string {
    const labels: Record<ExtendedOrder['status'], string> = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'Wird zubereitet',
      ready: 'Bereit zur Abholung',
      picked_up: 'Abgeholt',
      delivered: 'Geliefert',
      served: 'Serviert',
      paid: 'Bezahlt',
      cancelled: 'Storniert',
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      out_for_delivery: 'Unterwegs'
    };
    return labels[status];
  }

  getPaymentLabel(status: Order['payment_status']): string {
    const labels = {
      pending: 'Ausstehend',
      paid: 'Bezahlt',
      failed: 'Fehlgeschlagen'
    };
    return labels[status];
  }

  // Action Methods
  viewOrderDetails(order: ExtendedOrder) {
    // Create and show order details modal
    this.showOrderDetailsModal(order);
  }

  assignDriver(order: ExtendedOrder) {
    // Create and show driver assignment modal
    this.showDriverAssignmentModal(order);
  }

  updateOrderStatus(order: ExtendedOrder) {
    // Create and show status update modal
    this.showStatusUpdateModal(order);
  }

  cancelOrder(order: ExtendedOrder) {
    if (confirm('Möchten Sie diese Bestellung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      // Call API to cancel order
      this.http.patch(`${environment.apiUrl}/orders/${order.id}/cancel`, { reason: 'Cancelled by admin' })
        .subscribe({
          next: () => {
            alert('Bestellung wurde erfolgreich storniert.');
            this.refreshData();
          },
          error: (error) => {
            console.error('Error cancelling order:', error);
            alert('Fehler beim Stornieren der Bestellung.');
          }
        });
    }
  }

  exportOrders() {
    // Create CSV content
    const headers = ['Bestell-ID', 'Kunde', 'Restaurant', 'Status', 'Gesamt', 'Bestellzeit'];
    const csvContent = [
      headers.join(','),
      ...this.filteredOrders.map(order => [
        order.id,
        `"${order.customer_name || ''}"`,
        `"${order.restaurant_name}"`,
        order.status,
                  order.total_price || 0,
        new Date(order.created_at || '').toLocaleString('de-DE')
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bestellungen_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshData() {
    this.loadOrders();
    this.loadStatistics();
  }

  // Modal Methods
  private showOrderDetailsModal(order: ExtendedOrder) {
    // Create modal content
    const modalHtml = `
      <div class="modal-overlay" id="orderModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Bestellung #${order.id}</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="order-details-grid">
              <div class="detail-section">
                <h3>Kundeninformationen</h3>
                <p><strong>Name:</strong> ${order.customer_name}</p>
                <p><strong>E-Mail:</strong> ${order.customer_email}</p>
              </div>
              <div class="detail-section">
                <h3>Restaurant</h3>
                <p><strong>Name:</strong> ${order.restaurant_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  private showDriverAssignmentModal(order: ExtendedOrder) {
    // Simple driver assignment modal
    const driverId = prompt('Fahrer-ID eingeben:');
    if (driverId) {
      this.http.post(`${environment.apiUrl}/orders/${order.id}/assign-driver`, {
        driver_id: driverId
      }).subscribe({
        next: () => {
          alert('Fahrer erfolgreich zugewiesen!');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error assigning driver:', error);
          alert('Fehler beim Zuweisen des Fahrers.');
        }
      });
    }
  }

  private showStatusUpdateModal(order: ExtendedOrder) {
    // Simple status update modal
    const newStatus = prompt('Neuer Status (confirmed, preparing, ready, delivered):', order.status);
    if (newStatus && newStatus !== order.status) {
      this.http.patch(`${environment.apiUrl}/orders/${order.id}/status`, { status: newStatus })
        .subscribe({
          next: () => {
            alert('Status erfolgreich aktualisiert!');
            this.refreshData();
          },
          error: (error) => {
            console.error('Error updating status:', error);
            alert('Fehler beim Aktualisieren des Status.');
          }
        });
    }
  }


}
