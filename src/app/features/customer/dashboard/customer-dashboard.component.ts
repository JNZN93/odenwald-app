import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OrdersService, Order } from '../../../core/services/orders.service';
import { CartService } from '../../../core/services/supplier.service';
import { ImageFallbackDirective } from '../../../core/image-fallback.directive';
import { PasswordChangeComponent } from '../../../shared/components/password-change.component';
import { Observable, map, switchMap, of, startWith, catchError } from 'rxjs';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ImageFallbackDirective, PasswordChangeComponent],
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

        <!-- Favorite Restaurants -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>Beliebte Restaurants</h2>
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
    </div>
  `,
  styles: [`
    .customer-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .dashboard-header h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .dashboard-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .quick-actions {
      display: flex;
      gap: var(--space-4);
      flex-wrap: wrap;
      justify-content: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 600;
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
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .section-header h2 {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
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
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private cartService = inject(CartService);
  private router = inject(Router);

  user$ = this.authService.currentUser$;
  recentOrders$: Observable<Order[]> = of([]);
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart ? (this.cartService.getItemCount() || 0) : 0)
  );

  isLoadingOrders = false;
  ordersError: string | null = null;
  showPasswordChangeModal = false;

  // Mock featured restaurants - in real app, this would come from API
  featuredRestaurants = [
    {
      id: '1',
      name: 'Italienische Pizzeria Roma',
      images: { banner: 'assets/images/restaurants/italian-pizzeria.jpg', logo: '' },
      rating: 4.5,
      delivery_info: { estimated_delivery_time_minutes: 25 }
    },
    {
      id: '2',
      name: 'Sushi Palace',
      images: { banner: 'assets/images/restaurants/asian-sushi.jpg', logo: '' },
      rating: 4.7,
      delivery_info: { estimated_delivery_time_minutes: 30 }
    },
    {
      id: '3',
      name: 'Deutsche Gaststätte',
      images: { banner: 'assets/images/restaurants/german-schnitzel.jpg', logo: '' },
      rating: 4.3,
      delivery_info: { estimated_delivery_time_minutes: 20 }
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

  goToRestaurants() {
    this.router.navigate(['/customer']);
  }

  goToCart() {
    this.router.navigate(['/checkout']);
  }

  goToProfile() {
    // TODO: Implement profile page
    console.log('Navigate to profile');
  }

  viewAllOrders() {
    // TODO: Implement orders history page
    console.log('View all orders');
  }

  viewOrderDetails(order: Order) {
    // TODO: Implement order details modal/page
    console.log('View order details:', order);
  }

  orderFromRestaurant(restaurant: any) {
    this.router.navigate(['/restaurant', restaurant.id]);
  }

  manageAddresses() {
    // TODO: Implement address management
    console.log('Manage addresses');
  }

  managePaymentMethods() {
    // TODO: Implement payment methods management
    console.log('Manage payment methods');
  }

  manageNotifications() {
    // TODO: Implement notification settings
    console.log('Manage notifications');
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
}
