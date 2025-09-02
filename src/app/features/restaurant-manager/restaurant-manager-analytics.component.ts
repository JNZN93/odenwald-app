import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { RestaurantManagerService, RestaurantStats } from '../../core/services/restaurant-manager.service';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-restaurant-manager-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="analytics-container">
      <!-- Header -->
      <div class="analytics-header">
        <h1>Analytics & Berichte</h1>
        <div class="header-actions">
          <select *ngIf="managedRestaurants.length > 1" [(ngModel)]="selectedRestaurantId" (change)="loadAnalytics()" class="period-select">
            <option *ngFor="let restaurant of managedRestaurants" [value]="restaurant.restaurant_id">
              {{ restaurant.restaurant_name }}
            </option>
          </select>
          <select [(ngModel)]="selectedPeriod" (change)="loadAnalytics()" class="period-select">
            <option value="today">Heute</option>
            <option value="week">Diese Woche</option>
            <option value="month">Dieser Monat</option>
          </select>
          <button class="btn-secondary" (click)="exportData()" [disabled]="isLoading">
            <i class="fa-solid fa-download"></i>
            Export
          </button>
        </div>
      </div>

      <!-- Loading/Error States -->
      <div *ngIf="isLoading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Analytics-Daten werden geladen...</p>
      </div>

      <div *ngIf="error && !isLoading" class="error-state">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn-primary" (click)="loadAnalytics()">Erneut versuchen</button>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid" *ngIf="currentStats && !isLoading && !error">
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <div class="metric-content">
            <h3>{{ getCurrentPeriodOrders() }}</h3>
            <p>Bestellungen {{ getPeriodLabel() }}</p>
            <span class="change positive">+12.5%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="metric-content">
            <h3>€{{ getCurrentPeriodRevenue().toFixed(2) }}</h3>
            <p>Umsatz {{ getPeriodLabel() }}</p>
            <span class="change positive">+8.2%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="metric-content">
            <h3>{{ currentStats.average_order_value.toFixed(2) }}</h3>
            <p>Ø Bestellwert</p>
            <span class="change positive">+5.1%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="metric-content">
            <h3>{{ totalCustomers }}</h3>
            <p>Kunden heute</p>
            <span class="change positive">+15.3%</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Revenue Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Umsatzentwicklung</h3>
            <select [(ngModel)]="revenueChartPeriod" class="chart-select">
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
              <option value="90d">90 Tage</option>
            </select>
          </div>
          <div class="chart-placeholder">
            <i class="fa-solid fa-chart-line"></i>
            <p>Umsatz-Chart wird hier angezeigt</p>
            <small>Chart.js Integration ausstehend</small>
          </div>
        </div>

        <!-- Orders Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Bestellungen</h3>
            <select [(ngModel)]="ordersChartPeriod" class="chart-select">
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
              <option value="90d">90 Tage</option>
            </select>
          </div>
          <div class="chart-placeholder">
            <i class="fa-solid fa-chart-bar"></i>
            <p>Bestell-Chart wird hier angezeigt</p>
            <small>Chart.js Integration ausstehend</small>
          </div>
        </div>

        <!-- Popular Items -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Beliebteste Gerichte</h3>
          </div>
          <div class="popular-items-list">
            <div *ngFor="let item of currentStats?.popular_items || []; let i = index" class="popular-item">
              <div class="item-rank">#{{ i + 1 }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-count">{{ item.order_count }} Bestellungen</div>
              </div>
              <div class="item-bar">
                <div class="bar-fill" [style.width.%]="getItemPercentage(item.order_count)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Peak Hours -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Stoßzeiten</h3>
          </div>
          <div class="peak-hours">
            <div *ngFor="let hour of peakHours" class="hour-bar">
              <div class="hour-label">{{ hour.hour }}:00</div>
              <div class="hour-bar-container">
                <div class="hour-bar-fill" [style.width.%]="hour.percentage"></div>
              </div>
              <div class="hour-count">{{ hour.orders }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Reports -->
      <div class="reports-section">
        <h2>Detaillierte Berichte</h2>
        <div class="report-cards">
          <div class="report-card">
            <div class="report-icon">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div class="report-content">
              <h4>Tagesbericht</h4>
              <p>Detaillierte Übersicht aller Aktivitäten heute</p>
              <button class="btn-link" (click)="generateDailyReport()">Generieren</button>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon">
              <i class="fa-solid fa-calendar-week"></i>
            </div>
            <div class="report-content">
              <h4>Wochenbericht</h4>
              <p>Wöchentliche Performance-Analyse</p>
              <button class="btn-link" (click)="generateWeeklyReport()">Generieren</button>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon">
              <i class="fa-solid fa-calendar-alt"></i>
            </div>
            <div class="report-content">
              <h4>Monatsbericht</h4>
              <p>Monatliche Geschäftsentwicklung</p>
              <button class="btn-link" (click)="generateMonthlyReport()">Generieren</button>
            </div>
          </div>

          <div class="report-card">
            <div class="report-icon">
              <i class="fa-solid fa-utensils"></i>
            </div>
            <div class="report-content">
              <h4>Menü-Analyse</h4>
              <p>Performance der einzelnen Gerichte</p>
              <button class="btn-link" (click)="generateMenuReport()">Generieren</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Date Range -->
      <div class="custom-range-section">
        <h2>Benutzerdefinierter Zeitraum</h2>
        <div class="date-range-form">
          <div class="form-group">
            <label>Von:</label>
            <input type="date" [(ngModel)]="startDate" class="date-input">
          </div>
          <div class="form-group">
            <label>Bis:</label>
            <input type="date" [(ngModel)]="endDate" class="date-input">
          </div>
          <button class="btn-primary" (click)="loadCustomRange()">
            <i class="fa-solid fa-search"></i>
            Analysieren
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }

    .analytics-header h1 {
      margin: 0;
      color: var(--color-text);
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .period-select, .chart-select, .date-input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: white;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-muted-100);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-muted-200);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

    .metric-card:nth-child(1) .metric-icon {
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }

    .metric-card:nth-child(2) .metric-icon {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .metric-card:nth-child(3) .metric-icon {
      background: var(--color-info-50);
      color: var(--color-info);
    }

    .metric-card:nth-child(4) .metric-icon {
      background: var(--color-warning-50);
      color: var(--color-warning);
    }

    .metric-content h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
    }

    .metric-content p {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
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

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .chart-card {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .chart-header h3 {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .chart-placeholder {
      padding: var(--space-8);
      text-align: center;
      color: var(--color-muted);
    }

    .chart-placeholder i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    /* Popular Items */
    .popular-items-list {
      padding: var(--space-6);
    }

    .popular-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .popular-item:last-child {
      margin-bottom: 0;
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

    .item-count {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .item-bar {
      width: 100px;
      height: 8px;
      background: var(--color-muted-200);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--color-primary-500);
      border-radius: var(--radius-sm);
    }

    /* Peak Hours */
    .peak-hours {
      padding: var(--space-6);
    }

    .hour-bar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .hour-bar:last-child {
      margin-bottom: 0;
    }

    .hour-label {
      min-width: 50px;
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .hour-bar-container {
      flex: 1;
      height: 12px;
      background: var(--color-muted-200);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .hour-bar-fill {
      height: 100%;
      background: var(--color-info-500);
      border-radius: var(--radius-sm);
    }

    .hour-count {
      min-width: 30px;
      text-align: right;
      font-size: var(--text-sm);
      color: var(--color-text);
      font-weight: 600;
    }

    /* Reports Section */
    .reports-section {
      margin-bottom: var(--space-8);
    }

    .reports-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
      font-size: var(--text-xl);
    }

    .report-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .report-card {
      background: white;
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .report-icon {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-lg);
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .report-content {
      flex: 1;
    }

    .report-content h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text);
    }

    .report-content p {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--color-primary-600);
      cursor: pointer;
      font-weight: 500;
      padding: 0;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    /* Custom Range Section */
    .custom-range-section {
      background: white;
      padding: var(--space-6);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .custom-range-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
      font-size: var(--text-xl);
    }

    .date-range-form {
      display: flex;
      gap: var(--space-4);
      align-items: end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .btn-primary:hover {
      background: var(--color-primary-600);
    }

    /* Loading and Error States */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
    }

    .loading-state i, .error-state i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.7;
    }

    .loading-state i {
      color: var(--color-primary-500);
    }

    .error-state i {
      color: var(--color-danger);
    }

    .loading-state p, .error-state p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: var(--space-4) 0;
      }

      .analytics-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .report-cards {
        grid-template-columns: 1fr;
      }

      .date-range-form {
        flex-direction: column;
        align-items: stretch;
      }

      .form-group {
        width: 100%;
      }
    }
  `]
})
export class RestaurantManagerAnalyticsComponent implements OnInit, OnDestroy {
  private restaurantManagerService = inject(RestaurantManagerService);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  currentStats: RestaurantStats = {
    total_orders_today: 0,
    total_revenue_today: 0,
    total_orders_this_week: 0,
    total_revenue_this_week: 0,
    total_orders_this_month: 0,
    total_revenue_this_month: 0,
    average_order_value: 0,
    popular_items: []
  };

  selectedPeriod: string = 'today';
  revenueChartPeriod: string = '7d';
  ordersChartPeriod: string = '7d';
  totalCustomers: number = 0;

  startDate: string = '';
  endDate: string = '';

  isLoading: boolean = true;
  error: string | null = null;
  selectedRestaurantId: string | null = null;
  managedRestaurants: any[] = [];

  peakHours = [
    { hour: 11, orders: 12, percentage: 60 },
    { hour: 12, orders: 20, percentage: 100 },
    { hour: 13, orders: 18, percentage: 90 },
    { hour: 14, orders: 8, percentage: 40 },
    { hour: 17, orders: 15, percentage: 75 },
    { hour: 18, orders: 19, percentage: 95 },
    { hour: 19, orders: 16, percentage: 80 },
    { hour: 20, orders: 10, percentage: 50 }
  ];

  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.initializeDates();
    this.loadManagedRestaurants();

    // Auto-refresh every 5 minutes
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.refreshData();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  initializeDates() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.startDate = weekAgo.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  loadManagedRestaurants() {
    this.isLoading = true;
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        this.managedRestaurants = restaurants;
        if (restaurants.length > 0) {
          this.selectedRestaurantId = restaurants[0].restaurant_id;
          this.loadAnalytics();
        } else {
          this.isLoading = false;
          this.error = 'Keine Restaurants gefunden, die Sie verwalten.';
        }
      },
      error: (error: any) => {
        console.error('Error loading managed restaurants:', error);
        this.isLoading = false;
        this.error = 'Fehler beim Laden der Restaurants.';
        this.toastService.error('Fehler', 'Fehler beim Laden der Restaurants');
      }
    });
  }

  loadAnalytics() {
    if (!this.selectedRestaurantId) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.restaurantManagerService.getRestaurantStats(this.selectedRestaurantId, this.selectedPeriod as any).subscribe({
      next: (stats: RestaurantStats) => {
        this.currentStats = stats;
        this.totalCustomers = stats.total_orders_today; // Approximation for now
        this.isLoading = false;
        console.log('Analytics loaded:', stats);
      },
      error: (error: any) => {
        console.error('Error loading analytics:', error);
        this.isLoading = false;
        this.error = 'Fehler beim Laden der Analytics-Daten.';
        this.toastService.error('Fehler', 'Fehler beim Laden der Analytics-Daten');
      }
    });
  }

  refreshData() {
    if (this.selectedRestaurantId) {
      this.loadAnalytics();
    }
  }

  getItemPercentage(orderCount: number): number {
    if (!this.currentStats?.popular_items?.length) return 0;
    const maxCount = Math.max(...this.currentStats.popular_items.map((item: any) => item.order_count));
    return (orderCount / maxCount) * 100;
  }

  generateDailyReport() {
    console.log('Generating daily report...');
    alert('Tagesbericht wird generiert (Mock-Funktionalität)');
  }

  generateWeeklyReport() {
    console.log('Generating weekly report...');
    alert('Wochenbericht wird generiert (Mock-Funktionalität)');
  }

  generateMonthlyReport() {
    console.log('Generating monthly report...');
    alert('Monatsbericht wird generiert (Mock-Funktionalität)');
  }

  generateMenuReport() {
    console.log('Generating menu report...');
    alert('Menü-Bericht wird generiert (Mock-Funktionalität)');
  }

  loadCustomRange() {
    console.log('Loading custom range:', this.startDate, this.endDate);
    alert(`Daten für Zeitraum ${this.startDate} bis ${this.endDate} werden geladen (Mock-Funktionalität)`);
  }

  getCurrentPeriodOrders(): number {
    switch (this.selectedPeriod) {
      case 'today':
        return this.currentStats.total_orders_today;
      case 'week':
        return this.currentStats.total_orders_this_week;
      case 'month':
        return this.currentStats.total_orders_this_month;
      default:
        return this.currentStats.total_orders_today;
    }
  }

  getCurrentPeriodRevenue(): number {
    switch (this.selectedPeriod) {
      case 'today':
        return this.currentStats.total_revenue_today;
      case 'week':
        return this.currentStats.total_revenue_this_week;
      case 'month':
        return this.currentStats.total_revenue_this_month;
      default:
        return this.currentStats.total_revenue_today;
    }
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case 'today':
        return 'heute';
      case 'week':
        return 'diese Woche';
      case 'month':
        return 'dieser Monat';
      default:
        return 'heute';
    }
  }

  exportData() {
    if (!this.currentStats || this.isLoading) {
      return;
    }

    console.log('Exporting data...');
    this.toastService.info('Info', 'Export-Funktionalität wird bald verfügbar sein');
  }
}
