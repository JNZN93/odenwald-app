import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WholesalerService, WholesalerAnalytics } from '../../core/services/wholesaler.service';

@Component({
  selector: 'app-wholesaler-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <h1>Analytics & Berichte</h1>
        <p>Analysieren Sie Ihre Verkaufsdaten und Trends</p>
      </div>

      <!-- Loading State -->
      <div class="analytics-content" *ngIf="isLoading">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Daten werden geladen...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="analytics-content" *ngIf="error && !isLoading">
        <div class="error-state">
          <div class="error-icon">
            <i class="fa-solid fa-exclamation-triangle"></i>
          </div>
          <h3>Fehler beim Laden der Daten</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="loadAnalytics()">
            <i class="fa-solid fa-refresh"></i>
            Erneut versuchen
          </button>
        </div>
      </div>

      <!-- Analytics Content -->
      <div class="analytics-content" *ngIf="analytics && !isLoading && !error">
        <!-- Overview Cards -->
        <div class="overview-section">
          <h2>Übersicht</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-euro-sign"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.total_revenue | currency:'EUR':'symbol':'1.2-2' }}</div>
                <div class="stat-label">Gesamtumsatz</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-calendar-month"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.monthly_revenue | currency:'EUR':'symbol':'1.2-2' }}</div>
                <div class="stat-label">Umsatz (30 Tage)</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-shopping-cart"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.total_orders }}</div>
                <div class="stat-label">Gesamtbestellungen</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.unique_customers }}</div>
                <div class="stat-label">Kunden</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.average_order_value | currency:'EUR':'symbol':'1.2-2' }}</div>
                <div class="stat-label">Ø Bestellwert</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="fa-solid fa-calendar-week"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ analytics.overview.weekly_orders }}</div>
                <div class="stat-label">Bestellungen (7 Tage)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="section" *ngIf="analytics.top_products.length > 0">
          <h2>Beliebte Produkte</h2>
          <div class="products-grid">
            <div class="product-card" *ngFor="let product of analytics.top_products">
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p class="product-category">{{ product.category }}</p>
              </div>
              <div class="product-stats">
                <div class="stat">
                  <span class="stat-value">{{ product.total_quantity }}</span>
                  <span class="stat-label">Verkaufte Menge</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ product.total_revenue | currency:'EUR':'symbol':'1.2-2' }}</span>
                  <span class="stat-label">Umsatz</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ product.order_count }}</span>
                  <span class="stat-label">Bestellungen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Customers -->
        <div class="section" *ngIf="analytics.top_customers.length > 0">
          <h2>Top-Kunden</h2>
          <div class="customers-grid">
            <div class="customer-card" *ngFor="let customer of analytics.top_customers">
              <div class="customer-info">
                <h3>{{ customer.name }}</h3>
              </div>
              <div class="customer-stats">
                <div class="stat">
                  <span class="stat-value">{{ customer.total_spent | currency:'EUR':'symbol':'1.2-2' }}</span>
                  <span class="stat-label">Ausgegeben</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ customer.order_count }}</span>
                  <span class="stat-label">Bestellungen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Status Distribution -->
        <div class="section">
          <h2>Bestellstatus-Verteilung</h2>
          <div class="distribution-grid">
            <div class="distribution-card" *ngFor="let status of getOrderStatusEntries()">
              <div class="distribution-info">
                <h3>{{ getStatusLabel(status.key) }}</h3>
                <p>{{ status.value }} Bestellungen</p>
              </div>
              <div class="distribution-bar">
                <div class="bar-fill" [style.width.%]="getStatusPercentage(status.value)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Trends -->
        <div class="section" *ngIf="analytics.revenue_trends.length > 0">
          <h2>Umsatz-Trends (30 Tage)</h2>
          <div class="trends-container">
            <div class="trend-item" *ngFor="let trend of analytics.revenue_trends">
              <div class="trend-date">{{ formatDate(trend.date) }}</div>
              <div class="trend-stats">
                <div class="trend-revenue">{{ trend.daily_revenue | currency:'EUR':'symbol':'1.2-2' }}</div>
                <div class="trend-orders">{{ trend.daily_orders }} Bestellungen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .analytics-header {
      margin-bottom: var(--space-8);
    }

    .analytics-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .analytics-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .analytics-content {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      padding: var(--space-8);
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: var(--space-8);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top: 4px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4) auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: var(--space-8);
    }

    .error-icon {
      font-size: var(--text-4xl);
      color: var(--color-danger);
      margin-bottom: var(--space-4);
    }

    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
    }

    .retry-btn:hover {
      background: var(--color-primary-700);
    }

    /* Overview Section */
    .overview-section {
      margin-bottom: var(--space-8);
    }

    .overview-section h2 {
      margin: 0 0 var(--space-6) 0;
      font-size: var(--text-2xl);
      color: var(--color-heading);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
    }

    .stat-card {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      border: 1px solid var(--color-border);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      background: var(--gradient-primary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--text-xl);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-label {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Sections */
    .section {
      margin-bottom: var(--space-8);
    }

    .section h2 {
      margin: 0 0 var(--space-6) 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-4);
    }

    .product-card {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
    }

    .product-info h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .product-category {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .product-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
    }

    .product-stats .stat {
      text-align: center;
    }

    .product-stats .stat-value {
      display: block;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary);
    }

    .product-stats .stat-label {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    /* Customers Grid */
    .customers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .customer-card {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
    }

    .customer-info h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .customer-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .customer-stats .stat {
      text-align: center;
    }

    .customer-stats .stat-value {
      display: block;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary);
    }

    .customer-stats .stat-label {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    /* Distribution Grid */
    .distribution-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .distribution-card {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
    }

    .distribution-info h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-base);
      color: var(--color-heading);
    }

    .distribution-info p {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .distribution-bar {
      height: 8px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--gradient-primary);
      transition: width 0.3s ease;
    }

    /* Trends Container */
    .trends-container {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .trend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .trend-item:last-child {
      border-bottom: none;
    }

    .trend-date {
      font-weight: 500;
      color: var(--color-heading);
    }

    .trend-stats {
      display: flex;
      gap: var(--space-4);
    }

    .trend-revenue {
      font-weight: 600;
      color: var(--color-primary);
    }

    .trend-orders {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }
  `]
})
export class WholesalerAnalyticsComponent implements OnInit {
  private wholesalerService = inject(WholesalerService);

  analytics: WholesalerAnalytics | null = null;
  isLoading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading = true;
    this.error = null;

    this.wholesalerService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = this.convertStringsToNumbers(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = error.error?.error || 'Fehler beim Laden der Analytics-Daten';
        this.isLoading = false;
      }
    });
  }

  private convertStringsToNumbers(data: WholesalerAnalytics): WholesalerAnalytics {
    return {
      ...data,
      overview: {
        ...data.overview,
        total_revenue: Number(data.overview.total_revenue) || 0,
        monthly_revenue: Number(data.overview.monthly_revenue) || 0,
        weekly_revenue: Number(data.overview.weekly_revenue) || 0,
        daily_revenue: Number(data.overview.daily_revenue) || 0,
        total_orders: Number(data.overview.total_orders) || 0,
        monthly_orders: Number(data.overview.monthly_orders) || 0,
        weekly_orders: Number(data.overview.weekly_orders) || 0,
        daily_orders: Number(data.overview.daily_orders) || 0,
        average_order_value: Number(data.overview.average_order_value) || 0,
        monthly_average_order_value: Number(data.overview.monthly_average_order_value) || 0,
        unique_customers: Number(data.overview.unique_customers) || 0
      },
      top_products: data.top_products.map(product => ({
        ...product,
        total_quantity: Number(product.total_quantity) || 0,
        total_revenue: Number(product.total_revenue) || 0,
        order_count: Number(product.order_count) || 0
      })),
      revenue_trends: data.revenue_trends.map(trend => ({
        ...trend,
        daily_revenue: Number(trend.daily_revenue) || 0,
        daily_orders: Number(trend.daily_orders) || 0
      })),
      top_customers: data.top_customers.map(customer => ({
        ...customer,
        total_spent: Number(customer.total_spent) || 0,
        order_count: Number(customer.order_count) || 0
      }))
    };
  }

  getOrderStatusEntries(): Array<{key: string, value: number}> {
    if (!this.analytics?.distributions?.order_status) {
      return [];
    }
    return Object.entries(this.analytics.distributions.order_status).map(([key, value]) => ({key, value}));
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'preparing': 'Vorbereitung',
      'ready': 'Bereit',
      'delivered': 'Geliefert',
      'cancelled': 'Storniert'
    };
    return statusLabels[status] || status;
  }

  getStatusPercentage(count: number): number {
    if (!this.analytics?.distributions?.order_status) {
      return 0;
    }
    const total = Object.values(this.analytics.distributions.order_status).reduce((sum, val) => sum + val, 0);
    return total > 0 ? (count / total) * 100 : 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
