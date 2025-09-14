import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AnalyticsData {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  topRestaurants: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  topMenuItems: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
}

export interface AnalyticsFilters {
  period: '7' | '30' | '90' | '365';
  dateRange: 'custom' | 'preset';
  startDate?: string;
  endDate?: string;
  groupBy: 'day' | 'week' | 'month';
}

@Component({
  selector: 'app-analytics-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-admin-container">
      <!-- Header -->
      <div class="page-header">
        <h1><i class="fa-solid fa-chart-pie"></i> Analytics & Berichte</h1>
        <p>Detaillierte Einblicke in die Plattform-Performance</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-controls">
          <div class="period-selector">
            <label>Zeitraum:</label>
            <select [(ngModel)]="filters.period" (change)="loadAnalytics()">
              <option value="7">Letzte 7 Tage</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
              <option value="365">Letztes Jahr</option>
            </select>
          </div>
          
          <div class="group-by-selector">
            <label>Gruppierung:</label>
            <select [(ngModel)]="filters.groupBy" (change)="loadAnalytics()">
              <option value="day">Nach Tag</option>
              <option value="week">Nach Woche</option>
              <option value="month">Nach Monat</option>
            </select>
          </div>
          
          <button class="btn btn-primary" (click)="exportReport()">
            <i class="fa-solid fa-download"></i>
            Bericht exportieren
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="metric-content">
            <h3>Gesamt Bestellungen</h3>
            <div class="metric-value">{{ analyticsData.totalOrders }}</div>
            <div class="metric-change">
              <i class="fa-solid fa-arrow-up"></i>
              +12% vs vorheriger Zeitraum
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="metric-content">
            <h3>Gesamt Umsatz</h3>
            <div class="metric-value">{{ analyticsData.totalRevenue }}€</div>
            <div class="metric-change">
              <i class="fa-solid fa-arrow-up"></i>
              +8% vs vorheriger Zeitraum
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-calculator"></i>
          </div>
          <div class="metric-content">
            <h3>Durchschnittlicher Bestellwert</h3>
            <div class="metric-value">{{ analyticsData.averageOrderValue | number:'1.2-2' }}€</div>
            <div class="metric-change">
              <i class="fa-solid fa-arrow-down"></i>
              -2% vs vorheriger Zeitraum
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="metric-content">
            <h3>Neue Kunden</h3>
            <div class="metric-value">{{ analyticsData.newCustomers }}</div>
            <div class="metric-change">
              <i class="fa-solid fa-arrow-up"></i>
              +15% vs vorheriger Zeitraum
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Revenue Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3><i class="fa-regular fa-chart-line"></i> Umsatz-Entwicklung</h3>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color revenue"></span>
                Umsatz
              </span>
              <span class="legend-item">
                <span class="legend-color orders"></span>
                Bestellungen
              </span>
            </div>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder">
              <i class="fa-solid fa-chart-line"></i>
              <p>Umsatz-Chart wird hier angezeigt</p>
              <small>Zeigt Umsatz und Bestellungen über den gewählten Zeitraum</small>
            </div>
          </div>
        </div>

        <!-- Top Restaurants -->
        <div class="chart-container">
          <div class="chart-header">
            <h3><i class="fa-solid fa-store"></i> Top Restaurants</h3>
          </div>
          <div class="chart-content">
            <div class="ranking-list">
              <div *ngFor="let restaurant of analyticsData.topRestaurants; let i = index" class="ranking-item">
                <div class="ranking-position">{{ i + 1 }}</div>
                <div class="ranking-info">
                  <div class="ranking-name">{{ restaurant.name }}</div>
                  <div class="ranking-stats">
                    <span class="orders">{{ restaurant.orders }} Bestellungen</span>
                    <span class="revenue">{{ restaurant.revenue }}€ Umsatz</span>
                  </div>
                </div>
                <div class="ranking-bar">
                  <div class="bar-fill" [style.width.%]="getBarPercentage(restaurant.revenue)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analytics -->
      <div class="detailed-analytics">
        <!-- Order Status Distribution -->
        <div class="analytics-card">
          <h3><i class="fa-solid fa-pie-chart"></i> Bestellstatus-Verteilung</h3>
          <div class="status-distribution">
            <div *ngFor="let status of analyticsData.orderStatusDistribution" class="status-item">
              <div class="status-info">
                <span class="status-name">{{ status.status }}</span>
                <span class="status-count">{{ status.count }}</span>
              </div>
              <div class="status-bar">
                <div class="bar-fill" [style.width.%]="status.percentage"></div>
              </div>
              <span class="status-percentage">{{ status.percentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Top Menu Items -->
        <div class="analytics-card">
          <h3><i class="fa-solid fa-utensils"></i> Beliebteste Gerichte</h3>
          <div class="menu-items-list">
            <div *ngFor="let item of analyticsData.topMenuItems; let i = index" class="menu-item">
              <div class="item-rank">{{ i + 1 }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-stats">
                  <span class="orders">{{ item.orders }}x bestellt</span>
                  <span class="revenue">{{ item.revenue }}€ Umsatz</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Retention -->
        <div class="analytics-card">
          <h3><i class="fa-solid fa-user-check"></i> Kundenbindung</h3>
          <div class="retention-stats">
            <div class="retention-metric">
              <div class="metric-label">Neue Kunden</div>
              <div class="metric-value">{{ analyticsData.customerRetention.newCustomers }}</div>
            </div>
            <div class="retention-metric">
              <div class="metric-label">Wiederholungskäufer</div>
              <div class="metric-value">{{ analyticsData.customerRetention.returningCustomers }}</div>
            </div>
            <div class="retention-metric">
              <div class="metric-label">Bindungsrate</div>
              <div class="metric-value">{{ analyticsData.customerRetention.retentionRate }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-admin-container {
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

    /* Filters Section */
    .filters-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      flex-wrap: wrap;
    }

    .period-selector, .group-by-selector {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .period-selector label, .group-by-selector label {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 500;
    }

    .period-selector select, .group-by-selector select {
      padding: var(--space-2) var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .period-selector select:focus, .group-by-selector select:focus {
      outline: none;
      border-color: var(--color-primary-500);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .metric-card {
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

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-300);
    }

    .metric-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .metric-icon i {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
    }

    .metric-content h3 {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-1) 0;
      font-weight: 500;
    }

    .metric-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .metric-change {
      font-size: var(--text-sm);
      color: var(--color-success);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .metric-change i {
      font-size: var(--text-xs);
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .chart-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .chart-header {
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-header h3 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .chart-legend {
      display: flex;
      gap: var(--space-4);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-color.revenue { background: var(--color-primary-500); }
    .legend-color.orders { background: var(--color-success); }

    .chart-content {
      padding: var(--space-6);
    }

    .chart-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-light-green);
      border-radius: var(--radius-lg);
      color: var(--color-muted);
      text-align: center;
    }

    .chart-placeholder i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-3);
    }

    .chart-placeholder p {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .chart-placeholder small {
      color: var(--color-muted);
    }

    /* Ranking List */
    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--bg-light-green);
      border-radius: var(--radius-md);
    }

    .ranking-position {
      width: 24px;
      height: 24px;
      background: var(--color-primary-500);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .ranking-info {
      flex: 1;
    }

    .ranking-name {
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .ranking-stats {
      display: flex;
      gap: var(--space-3);
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .ranking-bar {
      width: 100px;
      height: 8px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--color-primary-500);
      transition: width var(--transition);
    }

    /* Detailed Analytics */
    .detailed-analytics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-6);
    }

    .analytics-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .analytics-card h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    /* Status Distribution */
    .status-distribution {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .status-info {
      display: flex;
      justify-content: space-between;
      min-width: 120px;
    }

    .status-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .status-count {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .status-bar {
      flex: 1;
      height: 8px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .status-percentage {
      min-width: 40px;
      text-align: right;
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 500;
    }

    /* Menu Items List */
    .menu-items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--bg-light-green);
      border-radius: var(--radius-md);
    }

    .item-rank {
      width: 24px;
      height: 24px;
      background: var(--color-success);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .item-stats {
      display: flex;
      gap: var(--space-3);
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    /* Retention Stats */
    .retention-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }

    .retention-metric {
      text-align: center;
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-radius: var(--radius-md);
    }

    .metric-label {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-2);
    }

    .metric-value {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .charts-section {
        grid-template-columns: 1fr;
      }

      .detailed-analytics {
        grid-template-columns: 1fr;
      }

      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .retention-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsAdminComponent implements OnInit {
  private http = inject(HttpClient);

  filters: AnalyticsFilters = {
    period: '30',
    dateRange: 'preset',
    groupBy: 'day'
  };

  analyticsData: AnalyticsData = {
    period: '30',
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    newCustomers: 0,
    returningCustomers: 0,
    topRestaurants: [],
    topMenuItems: [],
    orderStatusDistribution: [],
    revenueByDay: [],
    customerRetention: {
      newCustomers: 0,
      returningCustomers: 0,
      retentionRate: 0
    }
  };

  ngOnInit() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    try {
      // TODO: Replace with actual API call
      const response = await this.http.get<AnalyticsData>(`${environment.apiUrl}/admin/analytics?period=${this.filters.period}&groupBy=${this.filters.groupBy}`).toPromise();
      if (response) {
        this.analyticsData = response;
      } else {
        // Fallback to mock data for development
        this.analyticsData = this.getMockAnalyticsData();
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data for development
      this.analyticsData = this.getMockAnalyticsData();
    }
  }

  getBarPercentage(value: number): number {
    const maxValue = Math.max(...this.analyticsData.topRestaurants.map(r => r.revenue));
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  exportReport() {
    console.log('Export analytics report');
    // TODO: Implement report export (PDF, Excel, etc.)
  }

  // Mock data for development
  private getMockAnalyticsData(): AnalyticsData {
    return {
      period: '30',
      totalOrders: 1247,
      totalRevenue: 15680.50,
      averageOrderValue: 12.58,
      newCustomers: 89,
      returningCustomers: 234,
      topRestaurants: [
        { name: 'Pizzeria Bella Vista', orders: 156, revenue: 2340.00 },
        { name: 'Sushi Bar Tokyo', orders: 134, revenue: 2010.00 },
        { name: 'Biergarten München', orders: 98, revenue: 1470.00 },
        { name: 'Kebab Haus', orders: 87, revenue: 870.00 },
        { name: 'Pasta Palace', orders: 76, revenue: 1140.00 }
      ],
      topMenuItems: [
        { name: 'Pizza Margherita', orders: 89, revenue: 1157.00 },
        { name: 'California Roll', orders: 67, revenue: 1005.00 },
        { name: 'Schnitzel Wiener Art', orders: 54, revenue: 810.00 },
        { name: 'Döner Kebab', orders: 43, revenue: 430.00 },
        { name: 'Spaghetti Carbonara', orders: 38, revenue: 570.00 }
      ],
      orderStatusDistribution: [
        { status: 'Abgeschlossen', count: 892, percentage: 71.5 },
        { status: 'In Bearbeitung', count: 234, percentage: 18.8 },
        { status: 'Storniert', count: 89, percentage: 7.1 },
        { status: 'Fehlgeschlagen', count: 32, percentage: 2.6 }
      ],
      revenueByDay: [],
      customerRetention: {
        newCustomers: 89,
        returningCustomers: 234,
        retentionRate: 72.4
      }
    };
  }
}
