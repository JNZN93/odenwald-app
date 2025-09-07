import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { OrdersService, Order } from '../../core/services/orders.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

type CanonicalStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-restaurant-manager-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="orders-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>Bestellungen verwalten</h1>
          <p>Verfolgen und aktualisieren Sie alle Bestellungen für Ihr Restaurant</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="refreshOrders()" [disabled]="isLoading">
            <i class="fa-solid fa-rotate-right" [class.spin]="isLoading"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter" [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestätigt</option>
              <option value="preparing">Wird zubereitet</option>
              <option value="ready">Bereit zur Abholung</option>
              <option value="picked_up">Abgeholt</option>
              <option value="delivered">Geliefert</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="search-filter">Suchen:</label>
            <input
              id="search-filter"
              type="text"
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              placeholder="Kunde, Bestellnummer..."
            >
          </div>

          <div class="filter-group">
            <label for="sort-filter">Sortieren nach:</label>
            <select id="sort-filter" [(ngModel)]="sortBy" (change)="applyFilters()">
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="total_high">Höchster Betrag</option>
              <option value="total_low">Niedrigster Betrag</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="orders-section">
        <div class="orders-header">
          <h2>{{ filteredOrders.length }} Bestellung{{ filteredOrders.length !== 1 ? 'en' : '' }} gefunden</h2>
        </div>

        <div class="orders-list">
          <div *ngFor="let order of filteredOrders" class="order-card">
            <div class="order-header">
              <div class="order-info">
                <div class="order-number">#{{ order.id.slice(-6) }}</div>
                <div class="order-time">{{ formatOrderTime(order.created_at) }}</div>
              </div>
              <div class="order-status">
                <span [ngClass]="getOrderStatusClass(order.status)" class="status-badge">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
            </div>

            <div class="order-details">
              <div class="customer-info">
                <div class="customer-name">{{ order.customer_name }}</div>
                <div class="customer-email">{{ order.customer_email }}</div>
                <div class="delivery-address">{{ order.delivery_address }}</div>
              </div>

              <div class="order-items">
                <div *ngFor="let item of order.items" class="order-item">
                  <div class="item-main">
                    <span class="item-quantity">{{ item.quantity }}x</span>
                    <div class="item-details">
                      <span class="item-name">{{ item.name }}</span>
                      <!-- Show selected variants inline -->
                      <span class="item-variants-inline" *ngIf="item.selected_variant_options && item.selected_variant_options.length > 0">
                        ({{ getVariantSummary(item.selected_variant_options) }})
                      </span>
                    </div>
                    <span class="item-price">€{{ item.total_price.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div class="order-summary">
                <div class="order-total">
                  <span class="total-label">Gesamt:</span>
                  <span class="total-amount">€{{ order.total_price.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <div class="action-buttons">
                <button
                  *ngIf="canUpdateStatus(order.status, 'confirmed')"
                  class="action-btn confirm"
                  (click)="updateOrderStatus(order.id, 'confirmed')"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-check"></i>
                  Bestätigen
                </button>

                <button
                  *ngIf="canUpdateStatus(order.status, 'preparing')"
                  class="action-btn prepare"
                  (click)="updateOrderStatus(order.id, 'preparing')"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-utensils"></i>
                  Zubereiten
                </button>

                <button
                  *ngIf="canUpdateStatus(order.status, 'ready')"
                  class="action-btn ready"
                  (click)="updateOrderStatus(order.id, 'ready')"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-check-circle"></i>
                  Fertig
                </button>

                <button
                  *ngIf="canUpdateStatus(order.status, 'picked_up')"
                  class="action-btn pickup"
                  (click)="updateOrderStatus(order.id, 'picked_up')"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-box"></i>
                  Abgeholt
                </button>

                <button
                  *ngIf="canUpdateStatus(order.status, 'delivered')"
                  class="action-btn deliver"
                  (click)="updateOrderStatus(order.id, 'delivered')"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-truck"></i>
                  Geliefert
                </button>

                <button
                  *ngIf="canCancelOrder(order.status)"
                  class="action-btn cancel"
                  (click)="cancelOrder(order.id)"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-times"></i>
                  Stornieren
                </button>
              </div>

              <div class="loading-indicator" *ngIf="updatingOrderId === order.id">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Aktualisiere...
              </div>
            </div>
          </div>

          <div *ngIf="filteredOrders.length === 0" class="empty-state">
            <i class="fa-solid fa-shopping-cart"></i>
            <h3>Keine Bestellungen gefunden</h3>
            <p>Es gibt keine Bestellungen mit den aktuellen Filtereinstellungen.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-muted);
      margin: 0;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Filters */
    .filters-section {
      margin-bottom: var(--space-6);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .filter-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .filter-group select,
    .filter-group input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    /* Orders Section */
    .orders-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .orders-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .orders-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    /* Order Cards */
    .order-card {
      border-bottom: 1px solid var(--color-border);
    }

    .order-card:last-child {
      border-bottom: none;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: var(--bg-light-green);
    }

    .order-info .order-number {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .order-info .order-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending { background: var(--color-warning-50); color: var(--color-warning); }
    .status-badge.confirmed { background: var(--color-info-50); color: var(--color-info); }
    .status-badge.preparing { background: var(--color-primary-50); color: var(--color-primary-600); }
    .status-badge.ready { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.picked_up { background: var(--color-accent-50); color: var(--color-accent-600); }
    .status-badge.delivered { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.cancelled { background: var(--color-danger-50); color: var(--color-danger); }

    .order-details {
      padding: var(--space-6);
    }

    .customer-info {
      margin-bottom: var(--space-4);
    }

    .customer-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .customer-email,
    .delivery-address {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .order-items {
      margin-bottom: var(--space-4);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      font-size: var(--text-sm);
    }

    .item-quantity {
      font-weight: 600;
      color: var(--color-primary-600);
      min-width: 40px;
    }


    .item-price {
      font-weight: 600;
      color: var(--color-text);
    }

    .item-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin: 0 var(--space-2);
    }

    .item-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .item-variants-inline {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
      margin-top: 2px;
    }

    .order-summary {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .order-total {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .total-label {
      font-weight: 600;
      color: var(--color-text);
    }

    .total-amount {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
    }

    .order-actions {
      padding: var(--space-4) var(--space-6);
      background: var(--bg-light);
      border-top: 1px solid var(--color-border);
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .action-btn.confirm {
      border-color: var(--color-info-500);
      color: var(--color-info-600);
      background: white;
    }

    .action-btn.confirm:hover {
      background: var(--color-info-50);
    }

    .action-btn.prepare {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
      background: white;
    }

    .action-btn.prepare:hover {
      background: var(--color-primary-50);
    }

    .action-btn.ready {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.ready:hover {
      background: var(--color-success-50);
    }

    .action-btn.pickup {
      border-color: var(--color-accent-500);
      color: var(--color-accent-600);
      background: white;
    }

    .action-btn.pickup:hover {
      background: var(--color-accent-50);
    }

    .action-btn.deliver {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.deliver:hover {
      background: var(--color-success-50);
    }

    .action-btn.cancel {
      border-color: var(--color-danger-500);
      color: var(--color-danger);
      background: white;
    }

    .action-btn.cancel:hover {
      background: var(--color-danger-50);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-12) var(--space-6);
      text-align: center;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .orders-container {
        padding: var(--space-4) 0;
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-btn {
        justify-content: center;
      }
    }
  `]
})
export class RestaurantManagerOrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus = 'all';
  searchTerm = '';
  sortBy = 'newest';
  updatingOrderId: string | null = null;
  isLoading = false;

  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadOrders();
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadOrders();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadOrders() {
    this.isLoading = true;
    this.loadingService.start('orders');

    // Get current restaurant manager's restaurant ID
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        if (restaurants?.length > 0) {
          // Use the first restaurant for now - in a real app you'd want to handle multiple restaurants
          const restaurantId = restaurants[0].restaurant_id;
          this.ordersService.getRestaurantOrders(restaurantId).subscribe({
            next: (orders) => {
              this.orders = orders;
              this.applyFilters();
              this.loadingService.stop('orders');
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error loading orders:', error);
              this.toastService.error('Bestellungen laden', 'Fehler beim Laden der Bestellungen');
              this.loadingService.stop('orders');
              this.isLoading = false;
            }
          });
        } else {
          this.loadingService.stop('orders');
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading restaurants:', error);
        this.toastService.error('Restaurant laden', 'Fehler beim Laden des Restaurants');
        this.loadingService.stop('orders');
        this.isLoading = false;
      }
    });
  }

  refreshOrders() {
    this.loadOrders();
  }

  applyFilters() {
    // Ensure we always work with the most current orders data
    let filtered = [...this.orders];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => {
        const canonicalStatus = this.canonicalStatus(order.status);
        return canonicalStatus === this.selectedStatus;
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.customer_name?.toLowerCase().includes(search) || false) ||
        (order.customer_email?.toLowerCase().includes(search) || false) ||
        order.id.toLowerCase().includes(search)
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'total_high':
          return b.total_price - a.total_price;
        case 'total_low':
          return a.total_price - b.total_price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Ensure filteredOrders is always updated with a new reference for Angular change detection
    this.filteredOrders = [...filtered];

    // Debug logging to help identify issues
    console.log(`Filtered ${this.orders.length} orders to ${this.filteredOrders.length} with status filter: ${this.selectedStatus}`);

    // If no orders are shown but we have orders, there might be a filter issue
    if (this.orders.length > 0 && this.filteredOrders.length === 0 && this.selectedStatus !== 'all') {
      console.warn(`No orders shown with status filter "${this.selectedStatus}". Available statuses:`,
        [...new Set(this.orders.map(o => this.canonicalStatus(o.status)))]);
    }
  }

  private canonicalStatus(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): CanonicalStatus {
    if (status === 'open') return 'pending';
    if (status === 'in_progress') return 'preparing';
    if (status === 'out_for_delivery') return 'picked_up';
    return status as CanonicalStatus;
  }

  updateOrderStatus(orderId: string, newStatus: Order['status']) {
    this.updatingOrderId = orderId;
    console.log('Starting status update:', { orderId, newStatus });

    this.ordersService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        console.log('Status update response:', response);

        // Update local order - make sure we have a deep copy
        const index = this.orders.findIndex(o => String(o.id) === String(orderId));
        if (index !== -1) {
          // Create a deep copy to ensure change detection works
          this.orders[index] = { ...response.order, id: String(response.order.id) };
          console.log('Updated local order:', this.orders[index]);
        } else {
          console.warn('Order not found in local array:', orderId);
          console.log('Available orders:', this.orders.map(o => ({ id: o.id, type: typeof o.id })));
        }

        // Force Angular change detection by creating new array reference
        this.orders = [...this.orders];

        // Force re-filtering with updated data
        this.applyFilters();

        // Check if updated order is visible
        const updatedOrderVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
        console.log('Order visibility after update:', {
          orderId,
          visible: updatedOrderVisible,
          filteredCount: this.filteredOrders.length,
          currentFilter: this.selectedStatus
        });

        // If the updated order is no longer visible due to filters, reset to show all
        if (!updatedOrderVisible && this.selectedStatus !== 'all') {
          console.log(`Order ${orderId} not visible after update, resetting status filter`);
          this.selectedStatus = 'all';
          this.applyFilters();

          // Double-check after filter reset
          const stillVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
          console.log(`Order visibility after filter reset:`, { orderId, visible: stillVisible });
        }

        this.toastService.success('Status aktualisiert', `Bestellung ${this.getOrderStatusText(newStatus)}`);
        this.updatingOrderId = null;
      },
      error: (error: any) => {
        console.error('Error updating order status:', error);
        this.toastService.error('Status aktualisieren', 'Fehler beim Aktualisieren des Bestellstatus');
        this.updatingOrderId = null;
      }
    });
  }

  cancelOrder(orderId: string) {
    if (confirm('Sind Sie sicher, dass Sie diese Bestellung stornieren möchten?')) {
      this.updatingOrderId = orderId;

      this.ordersService.cancelOrder(orderId, 'Storniert durch Restaurant-Manager').subscribe({
        next: (response) => {
          console.log('Cancel order response:', response);

          const index = this.orders.findIndex(o => String(o.id) === String(orderId));
          if (index !== -1) {
            this.orders[index] = { ...response.order, id: String(response.order.id) };
            console.log('Updated cancelled order:', this.orders[index]);
          } else {
            console.warn('Cancelled order not found in local array:', orderId);
          }

          // Force Angular change detection by creating new array reference
          this.orders = [...this.orders];

          // Force re-filtering with updated data
          this.applyFilters();

          // If the cancelled order is no longer visible due to filters, reset to show all
          const cancelledOrderVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
          console.log('Cancelled order visibility:', {
            orderId,
            visible: cancelledOrderVisible,
            filteredCount: this.filteredOrders.length,
            currentFilter: this.selectedStatus
          });

          if (!cancelledOrderVisible && this.selectedStatus !== 'all') {
            console.log(`Cancelled order ${orderId} not visible after update, resetting status filter`);
            this.selectedStatus = 'all';
            this.applyFilters();

            // Double-check after filter reset
            const stillVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
            console.log(`Cancelled order visibility after filter reset:`, { orderId, visible: stillVisible });
          }

          this.toastService.success('Bestellung storniert', 'Die Bestellung wurde erfolgreich storniert');
          this.updatingOrderId = null;
        },
        error: (error: any) => {
          console.error('Error cancelling order:', error);
          this.toastService.error('Stornierung fehlgeschlagen', 'Fehler beim Stornieren der Bestellung');
          this.updatingOrderId = null;
        }
      });
    }
  }

  canUpdateStatus(currentStatus: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery', targetStatus: CanonicalStatus): boolean {
    const statusFlow: Record<CanonicalStatus, CanonicalStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up', 'cancelled'],
      'picked_up': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    const normalized: CanonicalStatus = this.canonicalStatus(currentStatus as any);
    return statusFlow[normalized]?.includes(targetStatus) || false;
  }

  canCancelOrder(status: Order['status']): boolean {
    return !['delivered', 'cancelled'].includes(status);
  }

  formatOrderTime(orderTime: string): string {
    const date = new Date(orderTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min.`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `vor ${Math.floor(diffInMinutes / 60)} Std.`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getOrderStatusClass(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const normalized = this.canonicalStatus(status as any);
    switch (normalized) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'picked_up': return 'picked_up';
      case 'delivered': return 'delivered';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  getOrderStatusText(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const normalized = this.canonicalStatus(status as any);
    switch (normalized) {
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

  getVariantSummary(variants: Array<{id: string, name: string, group_name: string, price_modifier_cents: number}>): string {
    if (!variants || variants.length === 0) return '';

    // Group variants by group_name
    const groupedVariants = variants.reduce((groups, variant) => {
      const groupName = variant.group_name;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(variant);
      return groups;
    }, {} as Record<string, typeof variants>);

    // Create summary strings for each group
    const summaries: string[] = [];

    for (const [groupName, groupVariants] of Object.entries(groupedVariants)) {
      if (groupVariants.length === 1) {
        // Single variant in group - just show the name
        summaries.push(groupVariants[0].name);
      } else {
        // Multiple variants in group - show group name and variant names
        const variantNames = groupVariants.map(v => v.name).join(', ');
        summaries.push(`${groupName}: ${variantNames}`);
      }
    }

    return summaries.join(', ');
  }
}