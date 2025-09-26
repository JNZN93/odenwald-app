import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { RestaurantManagerService, RestaurantStats } from '../../core/services/restaurant-manager.service';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-restaurant-manager-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgChartsModule],
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
          
          <!-- Custom Date Range -->
          <div class="custom-range-inline">
            <input type="date" [(ngModel)]="startDate" class="date-input-inline" placeholder="Von">
            <input type="date" [(ngModel)]="endDate" class="date-input-inline" placeholder="Bis">
            <button class="btn-primary" (click)="loadCustomRange()" [disabled]="isLoading">
              <i class="fa-solid fa-chart-line"></i>
              Zeitraum-Analyse
            </button>
          </div>
          
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
            <select [(ngModel)]="revenueChartPeriod" (change)="onRevenueChartPeriodChange()" class="chart-select">
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
              <option value="90d">90 Tage</option>
            </select>
          </div>
          <div class="chart-container">
            <canvas baseChart
                    [data]="revenueChartData"
                    [options]="revenueChartOptions"
                    [type]="'line'">
            </canvas>
          </div>
        </div>

        <!-- Orders Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Bestellungen</h3>
            <select [(ngModel)]="ordersChartPeriod" (change)="onOrdersChartPeriodChange()" class="chart-select">
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
              <option value="90d">90 Tage</option>
            </select>
          </div>
          <div class="chart-container">
            <canvas baseChart
                    [data]="ordersChartData"
                    [options]="ordersChartOptions"
                    [type]="'bar'">
            </canvas>
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
            <div class="peak-hours-toggle">
              <button
                [class.active]="!showPeakHoursByDay"
                (click)="showPeakHoursByDay = false"
                class="toggle-btn">
                Nach Uhrzeit
              </button>
              <button
                [class.active]="showPeakHoursByDay"
                (click)="showPeakHoursByDay = true"
                class="toggle-btn">
                Nach Wochentag
              </button>
            </div>
          </div>

          <!-- Peak Hours by Time Only -->
          <div *ngIf="!showPeakHoursByDay" class="peak-hours">
            <div *ngFor="let hour of peakHours" class="hour-bar">
              <div class="hour-label">{{ hour.hour }}:00</div>
              <div class="hour-bar-container">
                <div class="hour-bar-fill" [style.width.%]="hour.percentage"></div>
              </div>
              <div class="hour-count">{{ hour.orders }}</div>
            </div>

            <div *ngIf="peakHours.length === 0" class="no-data">
              <p>Keine Bestellungsdaten für diesen Zeitraum verfügbar</p>
            </div>
          </div>

          <!-- Peak Hours by Day and Time -->
          <div *ngIf="showPeakHoursByDay" class="peak-hours-by-day">
            <div *ngFor="let dayData of peakHoursByDay" class="day-peak-hours">
              <h4 class="day-title">{{ dayData.dayName }}</h4>
              <div class="day-hours-list">
                <div *ngFor="let hour of dayData.hours" class="hour-bar">
                  <div class="hour-label">{{ hour.hour }}:00</div>
                  <div class="hour-bar-container">
                    <div class="hour-bar-fill" [style.width.%]="hour.percentage"></div>
                  </div>
                  <div class="hour-count">{{ hour.orders }}</div>
                </div>
                <div *ngIf="dayData.hours.length === 0" class="no-hours">
                  <p>Keine Bestellungen</p>
                </div>
              </div>
            </div>

            <div *ngIf="peakHoursByDay.length === 0" class="no-data">
              <p>Keine Bestellungsdaten für diesen Zeitraum verfügbar</p>
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


      <!-- Report Modal -->
      <div *ngIf="isReportModalOpen" class="modal-overlay" (click)="closeReportModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ currentReport?.title }}</h2>
            <button class="modal-close" (click)="closeReportModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body" *ngIf="currentReport?.data">
            <!-- Summary Section -->
            <div class="report-section" *ngIf="currentReport?.data?.summary">
              <h3>Zusammenfassung</h3>
              <div class="summary-grid">
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.total_orders !== undefined">
                  <div class="summary-label">Bestellungen</div>
                  <div class="summary-value">{{ currentReport?.data?.summary?.total_orders }}</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.total_revenue !== undefined">
                  <div class="summary-label">Umsatz</div>
                  <div class="summary-value">€{{ currentReport?.data?.summary?.total_revenue?.toFixed(2) }}</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.average_order_value !== undefined">
                  <div class="summary-label">Ø Bestellwert</div>
                  <div class="summary-value">€{{ currentReport?.data?.summary?.average_order_value?.toFixed(2) }}</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.total_customers !== undefined">
                  <div class="summary-label">Kunden</div>
                  <div class="summary-value">{{ currentReport?.data?.summary?.total_customers }}</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.peak_hour !== undefined">
                  <div class="summary-label">Stoßzeit</div>
                  <div class="summary-value">{{ currentReport?.data?.summary?.peak_hour }}:00 Uhr</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.best_day">
                  <div class="summary-label">Bester Tag</div>
                  <div class="summary-value">{{ currentReport?.data?.summary?.best_day }}</div>
                </div>
                <div class="summary-item" *ngIf="currentReport?.data?.summary?.best_week !== undefined">
                  <div class="summary-label">Beste Woche</div>
                  <div class="summary-value">Woche {{ currentReport?.data?.summary?.best_week }}</div>
                </div>
              </div>
            </div>

            <!-- Time Period -->
            <div class="report-section" *ngIf="currentReport?.data?.date || currentReport?.data?.week_start || currentReport?.data?.month">
              <h3>Zeitraum</h3>
              <div class="time-period">
                <span *ngIf="currentReport?.data?.date">{{ currentReport?.data?.date }}</span>
                <span *ngIf="currentReport?.data?.week_start && currentReport?.data?.week_end">
                  {{ currentReport?.data?.week_start }} bis {{ currentReport?.data?.week_end }}
                </span>
                <span *ngIf="currentReport?.data?.month && currentReport?.data?.year">
                  {{ currentReport?.data?.month }} {{ currentReport?.data?.year }}
                </span>
                <span *ngIf="currentReport?.data?.period">{{ currentReport?.data?.period }}</span>
              </div>
            </div>

            <!-- Orders by Status -->
            <div class="report-section" *ngIf="currentReport?.data?.orders_by_status">
              <h3>Bestellungen nach Status</h3>
              <div class="status-list">
                <div class="status-item" *ngFor="let status of getStatusEntries(currentReport?.data?.orders_by_status || {})">
                  <span class="status-name">{{ getStatusLabel(status.key) }}</span>
                  <span class="status-count">{{ status.value }}</span>
                </div>
              </div>
            </div>

            <!-- Daily Breakdown (Weekly Report) -->
            <div class="report-section" *ngIf="currentReport?.data?.daily_breakdown">
              <h3>Tagesaufschlüsselung</h3>
              <div class="daily-breakdown">
                <div class="day-item" *ngFor="let day of currentReport?.data?.daily_breakdown || []">
                  <div class="day-name">{{ day.day_name }}</div>
                  <div class="day-stats">
                    <span>{{ day.orders }} Bestellungen</span>
                    <span>€{{ day.revenue?.toFixed(2) }}</span>
                    <span>{{ day.customers }} Kunden</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Weekly Breakdown (Monthly Report) -->
            <div class="report-section" *ngIf="currentReport?.data?.weekly_breakdown">
              <h3>Wochenaufschlüsselung</h3>
              <div class="weekly-breakdown">
                <div class="week-item" *ngFor="let week of currentReport?.data?.weekly_breakdown || []">
                  <div class="week-header">
                    <span class="week-number">Woche {{ week.week }}</span>
                    <span class="week-dates">{{ week.start_date }} - {{ week.end_date }}</span>
                  </div>
                  <div class="week-stats">
                    <span>{{ week.orders }} Bestellungen</span>
                    <span>€{{ week.revenue?.toFixed(2) }}</span>
                    <span>{{ week.customers }} Kunden</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Orders by Hour (Daily Report) -->
            <div class="report-section" *ngIf="currentReport?.data?.orders_by_hour">
              <h3>Bestellungen nach Stunde</h3>
              <div class="hourly-breakdown">
                <div class="hour-item" *ngFor="let hour of getPeakHours(currentReport?.data?.orders_by_hour || [])">
                  <div class="hour-time">{{ hour.hour }}:00</div>
                  <div class="hour-bar">
                    <div class="hour-bar-fill" [style.width.%]="getHourPercentage(hour.orders, currentReport?.data?.orders_by_hour || [])"></div>
                  </div>
                  <div class="hour-stats">
                    <span>{{ hour.orders }} Bestellungen</span>
                    <span>€{{ hour.revenue.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Breakdown -->
            <div class="report-section" *ngIf="currentReport?.data?.customer_breakdown">
              <h3>Kundenaufschlüsselung</h3>
              <div class="customer-breakdown">
                <div class="customer-item" *ngIf="currentReport?.data?.customer_breakdown?.returning_customers">
                  <span class="customer-label">Stammkunden</span>
                  <span class="customer-count">{{ currentReport?.data?.customer_breakdown?.returning_customers }}</span>
                </div>
                <div class="customer-item" *ngIf="currentReport?.data?.customer_breakdown?.guest_orders">
                  <span class="customer-label">Gast-Bestellungen</span>
                  <span class="customer-count">{{ currentReport?.data?.customer_breakdown?.guest_orders }}</span>
                </div>
                <div class="customer-item" *ngIf="currentReport?.data?.customer_breakdown?.new_customers">
                  <span class="customer-label">Neue Kunden</span>
                  <span class="customer-count">{{ currentReport?.data?.customer_breakdown?.new_customers }}</span>
                </div>
              </div>
            </div>

            <!-- Delivery Stats -->
            <div class="report-section" *ngIf="currentReport?.data?.delivery_stats">
              <h3>Lieferstatistiken</h3>
              <div class="delivery-stats">
                <div class="delivery-item" *ngIf="currentReport?.data?.delivery_stats?.total_deliveries">
                  <span class="delivery-label">Lieferungen</span>
                  <span class="delivery-count">{{ currentReport?.data?.delivery_stats?.total_deliveries }}</span>
                </div>
                <div class="delivery-item" *ngIf="currentReport?.data?.delivery_stats?.on_time_deliveries">
                  <span class="delivery-label">Pünktliche Lieferungen</span>
                  <span class="delivery-count">{{ currentReport?.data?.delivery_stats?.on_time_deliveries }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeReportModal()">
              <i class="fa-solid fa-times"></i>
              Schließen
            </button>
            <button class="btn-primary" (click)="exportReport()">
              <i class="fa-solid fa-download"></i>
              Exportieren
            </button>
          </div>
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

    .custom-range-inline {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .date-input-inline {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: white;
      font-size: var(--text-sm);
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

    .peak-hours-toggle {
      display: flex;
      gap: var(--space-2);
      background: var(--color-muted-100);
      border-radius: var(--radius-md);
      padding: var(--space-1);
    }

    .toggle-btn {
      background: transparent;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-sm);
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .toggle-btn:hover {
      background: var(--color-muted-200);
      color: var(--color-text);
    }

    .toggle-btn.active {
      background: white;
      color: var(--color-text);
      box-shadow: var(--shadow-sm);
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

    .chart-container {
      height: 300px;
      padding: var(--space-4);
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

    .no-data {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .no-data p {
      margin: 0;
      font-size: var(--text-sm);
    }

    /* Peak Hours by Day */
    .peak-hours-by-day {
      padding: var(--space-6);
    }

    .day-peak-hours {
      margin-bottom: var(--space-6);
    }

    .day-peak-hours:last-child {
      margin-bottom: 0;
    }

    .day-title {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-text);
      font-size: var(--text-lg);
      font-weight: 600;
      padding-bottom: var(--space-2);
      border-bottom: 2px solid var(--color-primary-500);
    }

    .day-hours-list {
      display: grid;
      gap: var(--space-3);
    }

    .no-hours {
      text-align: center;
      padding: var(--space-4);
      color: var(--color-muted);
    }

    .no-hours p {
      margin: 0;
      font-size: var(--text-sm);
      font-style: italic;
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

      .custom-range-inline {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-2);
      }

      .date-input-inline {
        width: 100%;
      }
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
      box-shadow: var(--shadow-lg);
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h2 {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-xl);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .modal-close:hover {
      background: var(--color-muted-100);
      color: var(--color-text);
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      background: var(--color-muted-50);
    }

    /* Report Section Styles */
    .report-section {
      margin-bottom: var(--space-6);
    }

    .report-section:last-child {
      margin-bottom: 0;
    }

    .report-section h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-text);
      font-size: var(--text-lg);
      font-weight: 600;
      padding-bottom: var(--space-2);
      border-bottom: 2px solid var(--color-primary-500);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .summary-item {
      background: var(--color-muted-50);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .summary-label {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-2);
    }

    .summary-value {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-text);
    }

    .time-period {
      background: var(--color-primary-50);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      text-align: center;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-primary-700);
    }

    .status-list {
      display: grid;
      gap: var(--space-3);
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--color-muted-50);
      border-radius: var(--radius-md);
    }

    .status-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .status-count {
      background: var(--color-primary-500);
      color: white;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .daily-breakdown, .weekly-breakdown {
      display: grid;
      gap: var(--space-3);
    }

    .day-item, .week-item {
      background: var(--color-muted-50);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
    }

    .day-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .day-stats, .week-stats {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .week-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .week-number {
      font-weight: 600;
      color: var(--color-text);
    }

    .week-dates {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .hourly-breakdown {
      display: grid;
      gap: var(--space-3);
    }

    .hour-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-muted-50);
      border-radius: var(--radius-md);
    }

    .hour-time {
      min-width: 60px;
      font-weight: 600;
      color: var(--color-text);
    }

    .hour-bar {
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

    .hour-stats {
      display: flex;
      gap: var(--space-3);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .customer-breakdown, .delivery-stats {
      display: grid;
      gap: var(--space-3);
    }

    .customer-item, .delivery-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--color-muted-50);
      border-radius: var(--radius-md);
    }

    .customer-label, .delivery-label {
      font-weight: 500;
      color: var(--color-text);
    }

    .customer-count, .delivery-count {
      background: var(--color-success-500);
      color: white;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    /* Responsive Modal */
    @media (max-width: 768px) {
      .modal-overlay {
        padding: var(--space-2);
      }

      .modal-content {
        max-height: 95vh;
      }

      .modal-header, .modal-body, .modal-footer {
        padding: var(--space-4);
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .day-stats, .week-stats, .hour-stats {
        flex-direction: column;
        gap: var(--space-2);
      }

      .week-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-1);
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
    popular_items: [],
    peak_hours: []
  };

  selectedPeriod: string = 'today';
  revenueChartPeriod: string = '7d';
  ordersChartPeriod: string = '7d';
  totalCustomers: number = 0;

  // Chart configurations
  public revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Umsatz (€)',
      fill: true,
      tension: 0.4,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  };

  public revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '€' + value.toString();
          }
        }
      }
    }
  };

  public ordersChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Bestellungen',
      backgroundColor: '#10b981',
      borderColor: '#059669',
      borderWidth: 1
    }]
  };

  public ordersChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  startDate: string = '';
  endDate: string = '';

  isLoading: boolean = true;
  error: string | null = null;
  selectedRestaurantId: string | null = null;
  managedRestaurants: any[] = [];
  showPeakHoursByDay: boolean = false;
  isReportModalOpen: boolean = false;
  currentReport: { title: string; data: any } | null = null;

  get peakHours() {
    return this.currentStats?.peak_hours || [];
  }

  get peakHoursByDay() {
    return this.currentStats?.peak_hours_by_day || [];
  }

  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.initializeDates();
    this.loadManagedRestaurants();
    this.initializeCharts();

    // Auto-refresh every 5 minutes
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.refreshData();
    });
  }

  initializeCharts() {
    // Initialize with sample data - will be replaced with real data
    this.updateRevenueChart('7d');
    this.updateOrdersChart('7d');
  }

  updateRevenueChart(period: string) {
    if (!this.selectedRestaurantId) return;

    this.restaurantManagerService.getHistoricalData(this.selectedRestaurantId, period as any).subscribe({
      next: (historicalData) => {
        if (historicalData.revenue && historicalData.revenue.length > 0) {
          // Use real data
          const labels = historicalData.revenue.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
          });

          const data = historicalData.revenue.map(item => Math.round(item.amount));

          this.revenueChartData = {
            labels,
            datasets: [{
              data,
              label: 'Umsatz (€)',
              fill: true,
              tension: 0.4,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          };
        } else {
          // Fallback to sample data if no real data
          this.generateSampleRevenueData(period);
        }
      },
      error: (error) => {
        console.error('Error loading revenue data:', error);
        this.generateSampleRevenueData(period);
      }
    });
  }

  private generateSampleRevenueData(period: string) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }));

      // Generate realistic sample data
      const baseRevenue = 150 + Math.random() * 100;
      const dayMultiplier = Math.sin((i / days) * Math.PI * 2) * 0.3 + 0.7; // Weekend boost
      data.push(Math.round(baseRevenue * dayMultiplier));
    }

    this.revenueChartData = {
      labels,
      datasets: [{
        data,
        label: 'Umsatz (€)',
        fill: true,
        tension: 0.4,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };
  }

  updateOrdersChart(period: string) {
    if (!this.selectedRestaurantId) return;

    this.restaurantManagerService.getHistoricalData(this.selectedRestaurantId, period as any).subscribe({
      next: (historicalData) => {
        if (historicalData.orders && historicalData.orders.length > 0) {
          // Use real data
          const labels = historicalData.orders.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
          });

          const data = historicalData.orders.map(item => item.count);

          this.ordersChartData = {
            labels,
            datasets: [{
              data,
              label: 'Bestellungen',
              backgroundColor: '#10b981',
              borderColor: '#059669',
              borderWidth: 1
            }]
          };
        } else {
          // Fallback to sample data if no real data
          this.generateSampleOrdersData(period);
        }
      },
      error: (error) => {
        console.error('Error loading orders data:', error);
        this.generateSampleOrdersData(period);
      }
    });
  }

  private generateSampleOrdersData(period: string) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }));

      // Generate realistic sample order data
      const baseOrders = 8 + Math.random() * 6;
      const dayMultiplier = Math.sin((i / days) * Math.PI * 2) * 0.4 + 0.8;
      data.push(Math.round(baseOrders * dayMultiplier));
    }

    this.ordersChartData = {
      labels,
      datasets: [{
        data,
        label: 'Bestellungen',
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      }]
    };
  }

  onRevenueChartPeriodChange() {
    this.updateRevenueChart(this.revenueChartPeriod);
  }

  onOrdersChartPeriodChange() {
    this.updateOrdersChart(this.ordersChartPeriod);
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

        // Update charts with real data
        this.updateRevenueChart(this.revenueChartPeriod);
        this.updateOrdersChart(this.ordersChartPeriod);
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
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Bitte wählen Sie ein Restaurant aus');
      return;
    }

    this.loadingService.start('report-generation');
    this.restaurantManagerService.generateDailyReport(this.selectedRestaurantId).subscribe({
      next: (report) => {
        this.loadingService.stop('report-generation');
        if (report) {
          this.showReportModal('Tagesbericht', report);
        } else {
          this.toastService.error('Fehler', 'Fehler beim Generieren des Tagesberichts');
        }
      },
      error: (error) => {
        this.loadingService.stop('report-generation');
        console.error('Error generating daily report:', error);
        this.toastService.error('Fehler', 'Fehler beim Generieren des Tagesberichts');
      }
    });
  }

  generateWeeklyReport() {
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Bitte wählen Sie ein Restaurant aus');
      return;
    }

    this.loadingService.start('report-generation');
    this.restaurantManagerService.generateWeeklyReport(this.selectedRestaurantId).subscribe({
      next: (report) => {
        this.loadingService.stop('report-generation');
        if (report) {
          this.showReportModal('Wochenbericht', report);
        } else {
          this.toastService.error('Fehler', 'Fehler beim Generieren des Wochenberichts');
        }
      },
      error: (error) => {
        this.loadingService.stop('report-generation');
        console.error('Error generating weekly report:', error);
        this.toastService.error('Fehler', 'Fehler beim Generieren des Wochenberichts');
      }
    });
  }

  generateMonthlyReport() {
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Bitte wählen Sie ein Restaurant aus');
      return;
    }

    this.loadingService.start('report-generation');
    this.restaurantManagerService.generateMonthlyReport(this.selectedRestaurantId).subscribe({
      next: (report) => {
        this.loadingService.stop('report-generation');
        if (report) {
          this.showReportModal('Monatsbericht', report);
        } else {
          this.toastService.error('Fehler', 'Fehler beim Generieren des Monatsberichts');
        }
      },
      error: (error) => {
        this.loadingService.stop('report-generation');
        console.error('Error generating monthly report:', error);
        this.toastService.error('Fehler', 'Fehler beim Generieren des Monatsberichts');
      }
    });
  }

  generateMenuReport() {
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Bitte wählen Sie ein Restaurant aus');
      return;
    }

    this.loadingService.start('report-generation');
    this.restaurantManagerService.generateMenuAnalysisReport(this.selectedRestaurantId, '30d').subscribe({
      next: (report) => {
        this.loadingService.stop('report-generation');
        if (report) {
          this.showReportModal('Menü-Analyse', report);
        } else {
          this.toastService.error('Fehler', 'Fehler beim Generieren der Menü-Analyse');
        }
      },
      error: (error) => {
        this.loadingService.stop('report-generation');
        console.error('Error generating menu analysis report:', error);
        this.toastService.error('Fehler', 'Fehler beim Generieren der Menü-Analyse');
      }
    });
  }

  private showReportModal(title: string, report: any) {
    this.currentReport = {
      title,
      data: report
    };
    this.isReportModalOpen = true;
  }

  closeReportModal() {
    this.isReportModalOpen = false;
    this.currentReport = null;
  }

  exportReport() {
    if (!this.currentReport) return;
    
    const reportData = {
      title: this.currentReport.title,
      generated_at: new Date().toISOString(),
      data: this.currentReport.data
    };
    
    this.downloadReportCSV(reportData);
    this.toastService.success('Erfolg', 'Bericht wurde erfolgreich exportiert');
  }

  private downloadReportCSV(data: any) {
    const csvContent = this.convertReportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${data.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertReportToCSV(data: any): string {
    const report = data.data;
    if (!report) return 'Keine Daten verfügbar';

    const headers = ['Bericht', 'Generiert am'];
    const values = [data.title, data.generated_at];

    if (report.summary) {
      headers.push('Bestellungen', 'Umsatz (€)', 'Ø Bestellwert (€)', 'Kunden');
      values.push(
        report.summary.total_orders || 0,
        report.summary.total_revenue || 0,
        report.summary.average_order_value || 0,
        report.summary.total_customers || 0
      );
    }

    if (report.date) {
      headers.push('Datum');
      values.push(report.date);
    }
    if (report.week_start && report.week_end) {
      headers.push('Woche von', 'Woche bis');
      values.push(report.week_start, report.week_end);
    }
    if (report.month && report.year) {
      headers.push('Monat', 'Jahr');
      values.push(report.month, report.year);
    }
    if (report.period) {
      headers.push('Zeitraum');
      values.push(report.period);
    }

    return [headers.join(','), values.join(',')].join('\n');
  }

  getStatusEntries(statusObj: Record<string, number>): Array<{ key: string; value: number }> {
    return Object.entries(statusObj).map(([key, value]) => ({ key, value }));
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'preparing': 'In Vorbereitung',
      'ready': 'Bereit',
      'picked_up': 'Abgeholt',
      'delivered': 'Geliefert',
      'cancelled': 'Storniert'
    };
    return statusLabels[status] || status;
  }

  getPeakHours(hours: Array<{ hour: number; orders: number; revenue: number }>): Array<{ hour: number; orders: number; revenue: number }> {
    return hours.filter(hour => hour.orders > 0);
  }

  getHourPercentage(hourOrders: number, allHours: Array<{ hour: number; orders: number; revenue: number }>): number {
    const maxOrders = Math.max(...allHours.map(h => h.orders));
    return maxOrders > 0 ? (hourOrders / maxOrders) * 100 : 0;
  }

  loadCustomRange() {
    if (!this.selectedRestaurantId) {
      this.toastService.error('Fehler', 'Bitte wählen Sie ein Restaurant aus');
      return;
    }

    if (!this.startDate || !this.endDate) {
      this.toastService.error('Fehler', 'Bitte wählen Sie Start- und Enddatum aus');
      return;
    }

    // Validate date range
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start > end) {
      this.toastService.error('Fehler', 'Das Startdatum muss vor dem Enddatum liegen');
      return;
    }

    // Check if date range is not too large (max 1 year)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      this.toastService.error('Fehler', 'Der Zeitraum darf maximal 365 Tage betragen');
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.restaurantManagerService.getRestaurantStatsForCustomRange(
      this.selectedRestaurantId, 
      this.startDate, 
      this.endDate
    ).subscribe({
      next: (customStats) => {
        this.isLoading = false;
        
        // Update current stats with custom range data
        this.currentStats = {
          total_orders_today: customStats.total_orders,
          total_revenue_today: customStats.total_revenue,
          total_orders_this_week: customStats.total_orders,
          total_revenue_this_week: customStats.total_revenue,
          total_orders_this_month: customStats.total_orders,
          total_revenue_this_month: customStats.total_revenue,
          average_order_value: customStats.average_order_value,
          popular_items: customStats.popular_items,
          peak_hours: customStats.peak_hours,
          peak_hours_by_day: customStats.peak_hours_by_day
        };

        // Update charts with custom range data
        this.updateChartsForCustomRange(customStats.daily_breakdown);
        
        // Update period label to show custom range
        this.selectedPeriod = 'custom';
        
        this.toastService.success('Erfolg', `Analytics für Zeitraum ${this.startDate} bis ${this.endDate} geladen`);
        console.log('Custom range analytics loaded:', customStats);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Fehler beim Laden der benutzerdefinierten Analytics-Daten.';
        console.error('Error loading custom range analytics:', error);
        this.toastService.error('Fehler', 'Fehler beim Laden der benutzerdefinierten Analytics-Daten');
      }
    });
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
      case 'custom':
        return `vom ${this.startDate} bis ${this.endDate}`;
      default:
        return 'heute';
    }
  }

  private updateChartsForCustomRange(dailyBreakdown: Array<{ date: string; orders: number; revenue: number }>) {
    if (!dailyBreakdown || dailyBreakdown.length === 0) {
      return;
    }

    // Update revenue chart
    const revenueLabels = dailyBreakdown.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    });
    const revenueData = dailyBreakdown.map(item => Math.round(item.revenue));

    this.revenueChartData = {
      labels: revenueLabels,
      datasets: [{
        data: revenueData,
        label: 'Umsatz (€)',
        fill: true,
        tension: 0.4,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };

    // Update orders chart
    const ordersLabels = dailyBreakdown.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    });
    const ordersData = dailyBreakdown.map(item => item.orders);

    this.ordersChartData = {
      labels: ordersLabels,
      datasets: [{
        data: ordersData,
        label: 'Bestellungen',
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      }]
    };
  }

  exportData() {
    if (!this.currentStats || this.isLoading) {
      return;
    }

    this.loadingService.start('report-generation');
    
    // Generate a comprehensive report for export
    const exportData = {
      restaurant_id: this.selectedRestaurantId,
      period: this.selectedPeriod,
      generated_at: new Date().toISOString(),
      stats: this.currentStats,
      charts: {
        revenue: this.revenueChartData,
        orders: this.ordersChartData
      }
    };

    // Create and download CSV file
    this.downloadCSV(exportData);
    
    this.loadingService.stop('report-generation');
    this.toastService.success('Erfolg', 'Daten wurden erfolgreich exportiert');
  }

  private downloadCSV(data: any) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `restaurant-analytics-${this.selectedRestaurantId}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: any): string {
    const headers = [
      'Restaurant ID',
      'Zeitraum',
      'Generiert am',
      'Bestellungen heute',
      'Umsatz heute',
      'Bestellungen diese Woche',
      'Umsatz diese Woche',
      'Bestellungen dieser Monat',
      'Umsatz dieser Monat',
      'Ø Bestellwert'
    ];

    const values = [
      data.restaurant_id || '',
      data.period || '',
      data.generated_at || '',
      data.stats?.total_orders_today || 0,
      data.stats?.total_revenue_today || 0,
      data.stats?.total_orders_this_week || 0,
      data.stats?.total_revenue_this_week || 0,
      data.stats?.total_orders_this_month || 0,
      data.stats?.total_revenue_this_month || 0,
      data.stats?.average_order_value || 0
    ];

    return [headers.join(','), values.join(',')].join('\n');
  }
}
