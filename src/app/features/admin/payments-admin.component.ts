import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Payment {
  id: string;
  order_id: string;
  customer_name: string;
  restaurant_name: string;
  amount: number;
  currency: string;
  payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payout_status?: 'paid_out' | 'pending';
  transaction_id?: string;
  created_at: string;
  processed_at?: string;
  failure_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
}

export interface PaymentFilters {
  search: string;
  status: 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: 'all' | 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash';
  payout_status: 'all' | 'paid_out' | 'pending';
  dateRange: 'all' | 'today' | 'week' | 'month';
  amountRange: 'all' | 'low' | 'medium' | 'high';
  sortBy: 'created_at' | 'amount' | 'customer_name' | 'restaurant_name';
  sortOrder: 'asc' | 'desc';
}

export interface PayoutCalculation {
  restaurant_id: number;
  restaurant_name: string;
  total_revenue: number;
  platform_fee: number;
  stripe_fee: number;
  payout_amount: number;
  order_count: number;
}

export interface PayoutResult {
  total_restaurants: number;
  total_amount: number;
  successful_payouts: number;
  failed_payouts: number;
  payouts: any[];
}

@Component({
  selector: 'app-payments-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-admin-container">
      <!-- Header -->
      <div class="page-header">
        <h1><i class="fa-solid fa-credit-card"></i> Zahlungsverwaltung</h1>
        <p>Verwalte alle Zahlungen und Transaktionen der Plattform</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-euro-sign"></i>
          <div class="stat-content">
            <h3>Auszahlungen bereit</h3>
            <div class="stat-value">{{ payoutCalculations.length }}</div>
            <div class="stat-subtext">Restaurants</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-coins"></i>
          <div class="stat-content">
            <h3>Gesamtauszahlung</h3>
            <div class="stat-value">{{ getTotalPayoutAmount() }}€</div>
            <div class="stat-subtext">Netto-Betrag</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-percentage"></i>
          <div class="stat-content">
            <h3>Plattform-Provision</h3>
            <div class="stat-value">{{ getTotalPlatformFee() }}€</div>
            <div class="stat-subtext">5% von Umsatz</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-credit-card"></i>
          <div class="stat-content">
            <h3>Gesamtumsatz</h3>
            <div class="stat-value">{{ getTotalRevenueFromPayouts() }}€</div>
            <div class="stat-subtext">Restaurant-Einnahmen</div>
          </div>
        </div>
      </div>

      <!-- Payout Calculations Table -->
      <div *ngIf="payoutCalculations.length > 0" class="payout-calculations-container">
        <div class="section-header">
          <h2><i class="fa-solid fa-calculator"></i> Berechnete Auszahlungen</h2>
          <p>Diese Beträge würden an die Restaurants ausgezahlt werden</p>
        </div>

        <div class="payouts-table-container">
          <table class="payouts-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Bestellungen</th>
                <th>Gesamtumsatz</th>
                <th>Provision (5%)</th>
                <th>Stripe-Gebühr</th>
                <th>Auszahlung</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let calc of payoutCalculations" class="payout-row">
                <td class="restaurant-info">
                  <div class="restaurant-name">{{ calc.restaurant_name }}</div>
                  <div class="restaurant-id">#{{ calc.restaurant_id }}</div>
                </td>
                <td class="order-count">{{ calc.order_count }}</td>
                <td class="amount">{{ calc.total_revenue.toFixed(2) }}€</td>
                <td class="fee">{{ calc.platform_fee.toFixed(2) }}€</td>
                <td class="fee">{{ calc.stripe_fee.toFixed(2) }}€</td>
                <td class="payout-amount">{{ calc.payout_amount.toFixed(2) }}€</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Statistics Cards (existing) -->
      <div class="stats-grid" *ngIf="payoutCalculations.length === 0">
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-credit-card"></i>
          <div class="stat-content">
            <h3>Gesamt Umsatz</h3>
            <div class="stat-value">{{ totalRevenue.toFixed(2) }}€</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-check-circle"></i>
          <div class="stat-content">
            <h3>Erfolgreiche Zahlungen</h3>
            <div class="stat-value">{{ successfulPayments }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-clock"></i>
          <div class="stat-content">
            <h3>Ausstehende Zahlungen</h3>
            <div class="stat-value">{{ pendingPayments }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-exclamation-triangle"></i>
          <div class="stat-content">
            <h3>Fehlgeschlagene Zahlungen</h3>
            <div class="stat-value">{{ failedPayments }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-money-bill-wave"></i>
          <div class="stat-content">
            <h3>Ausgezahlte Zahlungen</h3>
            <div class="stat-value">{{ paidOutPayments }}</div>
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
              placeholder="Nach Zahlungs-ID, Kunde oder Restaurant suchen..."
              (input)="applyFilters()"
            >
          </div>
          
          <div class="filter-controls">
            <select [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="processing">Wird bearbeitet</option>
              <option value="completed">Abgeschlossen</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="refunded">Erstattet</option>
              <option value="cancelled">Storniert</option>
            </select>
            
            <select [(ngModel)]="filters.payment_method" (change)="applyFilters()">
              <option value="all">Alle Zahlungsmethoden</option>
              <option value="credit_card">Kreditkarte</option>
              <option value="debit_card">Debitkarte</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Banküberweisung</option>
              <option value="cash">Bargeld</option>
            </select>
            
            <select [(ngModel)]="filters.dateRange" (change)="applyFilters()">
              <option value="all">Alle Daten</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Diesen Monat</option>
            </select>

            <select [(ngModel)]="filters.payout_status" (change)="applyFilters()">
              <option value="all">Alle Auszahlungen</option>
              <option value="paid_out">Ausgezahlt</option>
              <option value="pending">Ausstehend</option>
            </select>
            
            <select [(ngModel)]="filters.amountRange" (change)="applyFilters()">
              <option value="all">Alle Beträge</option>
              <option value="low">Niedrig (0-25€)</option>
              <option value="medium">Mittel (25-100€)</option>
              <option value="high">Hoch (100€+)</option>
            </select>
            
            <select [(ngModel)]="filters.sortBy" (change)="applyFilters()">
              <option value="created_at">Nach Datum sortieren</option>
              <option value="amount">Nach Betrag sortieren</option>
              <option value="customer_name">Nach Kunde sortieren</option>
              <option value="restaurant_name">Nach Restaurant sortieren</option>
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
          <button class="btn btn-primary" (click)="exportPayments()">
            <i class="fa-solid fa-download"></i>
            Export CSV
          </button>
          <button class="btn btn-success" (click)="refreshData()">
            <i class="fa-solid fa-refresh"></i>
            Aktualisieren
          </button>
          <button
            class="btn btn-warning"
            (click)="calculatePayouts()"
            [disabled]="isCalculatingPayouts || isProcessingPayouts">
            <i class="fa-solid fa-calculator"></i>
            Auszahlungen berechnen
          </button>
          <button
            class="btn btn-danger"
            (click)="processBulkPayouts()"
            [disabled]="isProcessingPayouts || !payoutCalculations || payoutCalculations.length === 0">
            <i class="fa-solid fa-money-bill-transfer"></i>
            Alle auszahlen ({{ payoutCalculations.length || 0 }} Restaurants)
          </button>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="payments-table-container">
        <table class="payments-table">
          <thead>
            <tr>
              <th>Zahlung</th>
              <th>Bestellung</th>
              <th>Kunde</th>
              <th>Restaurant</th>
              <th>Betrag</th>
              <th>Methode</th>
              <th>Status</th>
              <th>Auszahlung</th>
              <th>Transaktion</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of filteredPayments" class="payment-row">
              <td class="payment-info">
                <div class="payment-id">#{{ payment.id }}</div>
                <div class="payment-date">{{ payment.created_at | date:'dd.MM.yyyy HH:mm' }}</div>
                <div *ngIf="payment.processed_at" class="processed-date">
                  Bearbeitet: {{ payment.processed_at | date:'dd.MM.yyyy HH:mm' }}
                </div>
              </td>
              
              <td class="order-info">
                <div class="order-id">#{{ payment.order_id }}</div>
              </td>
              
              <td class="customer-info">
                <div class="customer-name">{{ payment.customer_name }}</div>
              </td>
              
              <td class="restaurant-info">
                <div class="restaurant-name">{{ payment.restaurant_name }}</div>
              </td>
              
              <td class="amount-cell">
                <div class="amount">{{ payment.amount.toFixed(2) }}€</div>
                <div *ngIf="payment.refund_amount" class="refund-amount">
                  Erstattet: {{ payment.refund_amount.toFixed(2) }}€
                </div>
              </td>
              
              <td class="method-cell">
                <span class="method-badge" [class]="'method-' + payment.payment_method">
                  <i [ngClass]="getMethodIconClass(payment.payment_method)"></i>
                  {{ getMethodLabel(payment.payment_method) }}
                </span>
              </td>
              
              <td class="status-cell">
                <span class="status-badge" [class]="'status-' + payment.status">
                  <i class="fa-solid" [ngClass]="getStatusIcon(payment.status)"></i>
                  {{ getStatusLabel(payment.status) }}
                </span>
                <div *ngIf="payment.failure_reason" class="failure-reason">
                  {{ payment.failure_reason }}
                </div>
              </td>

              <td class="payout-cell">
                <span class="payout-badge" [class]="'payout-' + payment.payout_status">
                  {{ getPayoutLabel(payment.payout_status) }}
                </span>
              </td>

              <td class="transaction-cell">
                <div *ngIf="payment.transaction_id; else noTransaction" class="transaction-id">
                  {{ payment.transaction_id }}
                </div>
                <ng-template #noTransaction>
                  <span class="no-transaction">Keine ID</span>
                </ng-template>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-ghost" 
                    (click)="viewPaymentDetails(payment)"
                    title="Zahlungs-Details anzeigen"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  
                  <button 
                    *ngIf="payment.status === 'completed'"
                    class="btn btn-sm btn-warning" 
                    (click)="processRefund(payment)"
                    title="Erstattung verarbeiten"
                  >
                    <i class="fa-solid fa-undo"></i>
                  </button>
                  
                  <button 
                    *ngIf="payment.status === 'failed'"
                    class="btn btn-sm btn-success" 
                    (click)="retryPayment(payment)"
                    title="Zahlung wiederholen"
                  >
                    <i class="fa-solid fa-redo"></i>
                  </button>
                  
                  <button 
                    *ngIf="payment.status === 'pending'"
                    class="btn btn-sm btn-danger" 
                    (click)="cancelPayment(payment)"
                    title="Zahlung stornieren"
                  >
                    <i class="fa-solid fa-times"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty State -->
        <div *ngIf="filteredPayments.length === 0" class="empty-state">
          <i class="fa-solid fa-credit-card"></i>
          <h3>Keine Zahlungen gefunden</h3>
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
    .payments-admin-container {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    .payments-table-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table th {
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-3);
      text-align: left;
      font-weight: 600;
      color: var(--color-heading);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-sm);
    }

    .payments-table td {
      padding: var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    .payment-row:hover {
      background: var(--bg-light-green);
    }

    /* Payment Info Column */
    .payment-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .payment-id {
      font-weight: 700;
      color: var(--color-primary-600);
      font-size: var(--text-md);
    }

    .payment-date {
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .processed-date {
      color: var(--color-muted);
      font-size: var(--text-xs);
      font-style: italic;
    }

    /* Order Info Column */
    .order-id {
      font-weight: 500;
      color: var(--color-text);
    }

    /* Customer Info Column */
    .customer-name {
      font-weight: 500;
      color: var(--color-text);
    }

    /* Restaurant Info Column */
    .restaurant-name {
      font-weight: 500;
      color: var(--color-text);
    }

    /* Amount Column */
    .amount-cell {
      text-align: center;
    }

    .amount {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .refund-amount {
      color: var(--color-warning);
      font-size: var(--text-xs);
      font-style: italic;
    }

    /* Method Column */
    .method-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .method-credit_card { background: color-mix(in oklab, #3b82f6 15%, white); color: #2563eb; }
    .method-debit_card { background: color-mix(in oklab, #8b5cf6 15%, white); color: #7c3aed; }
    .method-paypal { background: color-mix(in oklab, #f59e0b 15%, white); color: #d97706; }
    .method-bank_transfer { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .method-cash { background: color-mix(in oklab, #6b7280 15%, white); color: #4b5563; }

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
    .status-processing { background: color-mix(in oklab, #3b82f6 15%, white); color: #2563eb; }
    .status-completed { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-failed { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }
    .status-refunded { background: color-mix(in oklab, #8b5cf6 15%, white); color: #7c3aed; }
    .status-cancelled { background: color-mix(in oklab, #6b7280 15%, white); color: #4b5563; }

    .failure-reason {
      color: var(--color-danger);
      font-size: var(--text-xs);
      font-style: italic;
      margin-top: var(--space-1);
    }

    /* Payout Column */
    .payout-cell {
      text-align: center;
    }

    .payout-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .payout-paid_out {
      background: color-mix(in oklab, #10b981 15%, white);
      color: #059669;
    }

    .payout-pending {
      background: color-mix(in oklab, #6b7280 15%, white);
      color: #374151;
    }

    /* Transaction Column */
    .transaction-id {
      font-family: monospace;
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .no-transaction {
      color: var(--color-muted);
      font-style: italic;
      font-size: var(--text-sm);
    }

    /* Actions Column */
    .action-buttons {
      display: flex;
      gap: var(--space-1);
    }

    .btn-sm {
      padding: var(--space-2);
      font-size: var(--text-sm);
      min-width: 32px;
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

    /* Payout Calculations */
    .payout-calculations-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .section-header h2 {
      font-size: var(--text-xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .section-header p {
      color: var(--color-muted);
      margin: 0;
    }

    .payouts-table-container {
      margin-top: var(--space-4);
      overflow-x: auto;
    }

    .payouts-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payouts-table th {
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-3);
      text-align: left;
      font-weight: 600;
      color: var(--color-heading);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-sm);
    }

    .payouts-table td {
      padding: var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    .payout-row:hover {
      background: var(--bg-light-green);
    }

    .restaurant-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .restaurant-name {
      font-weight: 600;
      color: var(--color-text);
    }

    .restaurant-id {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-family: monospace;
    }

    .order-count {
      text-align: center;
      font-weight: 500;
    }

    .amount {
      text-align: right;
      font-weight: 600;
      color: var(--color-success);
    }

    .fee {
      text-align: right;
      color: var(--color-warning);
      font-size: var(--text-sm);
    }

    .payout-amount {
      text-align: right;
      font-weight: 700;
      color: var(--color-primary-600);
      font-size: var(--text-lg);
    }

    /* Stat subtext */
    .stat-subtext {
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
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

      .payments-table {
        font-size: var(--text-sm);
      }

      .payments-table th,
      .payments-table td {
        padding: var(--space-3) var(--space-2);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .payments-table-container {
        overflow-x: auto;
      }

      .action-buttons {
        flex-direction: column;
        gap: var(--space-1);
      }
    }
  `]
})
export class PaymentsAdminComponent implements OnInit {
  private http = inject(HttpClient);

  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  
  filters: PaymentFilters = {
    search: '',
    status: 'all',
    payment_method: 'all',
    payout_status: 'all',
    dateRange: 'all',
    amountRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  // Statistics
  totalRevenue = 0;
  successfulPayments = 0;
  pendingPayments = 0;
  failedPayments = 0;
  paidOutPayments = 0;

  // Payouts
  payoutCalculations: PayoutCalculation[] = [];
  isCalculatingPayouts = false;
  isProcessingPayouts = false;

  ngOnInit() {
    this.loadPayments();
    this.loadStatistics();
  }

  async loadPayments() {
    try {
      const response = await this.http.get<{count: number, payments: Payment[]}>(`${environment.apiUrl}/payments`).toPromise();
      this.payments = response?.payments || [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading payments:', error);
      // Fallback to mock data for development
      this.payments = this.getMockPayments();
      this.applyFilters();
    }
  }

  async loadStatistics() {
    try {
      const response = await this.http.get<{stats: any}>(`${environment.apiUrl}/payments/stats`).toPromise();
      if (response?.stats) {
        // Update statistics based on API response
        this.totalRevenue = parseFloat(response.stats.total_amount) || 0;
        this.successfulPayments = response.stats.successful_payments || 0;
        this.pendingPayments = response.stats.total_payments - response.stats.successful_payments - response.stats.failed_payments || 0;
        this.failedPayments = response.stats.failed_payments || 0;
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Calculate from local data
      this.calculateStatistics();
    }
  }

  applyFilters() {
    let filtered = [...this.payments];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.id.toLowerCase().includes(search) ||
        payment.customer_name.toLowerCase().includes(search) ||
        payment.restaurant_name.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === this.filters.status);
    }

    // Payment method filter
    if (this.filters.payment_method !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === this.filters.payment_method);
    }

    // Payout status filter
    if (this.filters.payout_status !== 'all') {
      filtered = filtered.filter(payment => payment.payout_status === this.filters.payout_status);
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
      
      filtered = filtered.filter(payment => new Date(payment.created_at) >= startDate);
    }

    // Amount range filter
    if (this.filters.amountRange !== 'all') {
      switch (this.filters.amountRange) {
        case 'low':
          filtered = filtered.filter(payment => payment.amount <= 25);
          break;
        case 'medium':
          filtered = filtered.filter(payment => payment.amount > 25 && payment.amount <= 100);
          break;
        case 'high':
          filtered = filtered.filter(payment => payment.amount > 100);
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'customer_name':
          aValue = a.customer_name.toLowerCase();
          bValue = b.customer_name.toLowerCase();
          break;
        case 'restaurant_name':
          aValue = a.restaurant_name.toLowerCase();
          bValue = b.restaurant_name.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (this.filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredPayments = filtered;
    this.updatePagination();
  }

  toggleSortOrder() {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
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
    this.totalRevenue = this.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    this.successfulPayments = this.payments.filter(p => p.status === 'completed').length;
    this.pendingPayments = this.payments.filter(p => ['pending', 'processing'].includes(p.status)).length;
    this.failedPayments = this.payments.filter(p => p.status === 'failed').length;
    this.paidOutPayments = this.payments.filter(p => p.payout_status === 'paid_out').length;
  }

  getMethodLabel(method: Payment['payment_method']): string {
    const labels = {
      credit_card: 'Kreditkarte',
      debit_card: 'Debitkarte',
      paypal: 'PayPal',
      bank_transfer: 'Banküberweisung',
      cash: 'Bargeld'
    };
    return labels[method];
  }

  getMethodIcon(method: Payment['payment_method']): string {
    const icons = {
      credit_card: 'fa-credit-card',
      debit_card: 'fa-credit-card',
      paypal: 'fa-paypal',
      bank_transfer: 'fa-university',
      cash: 'fa-money-bill'
    };
    return icons[method];
  }

  getMethodIconClass(method: Payment['payment_method']): string {
    const icon = this.getMethodIcon(method);
    // PayPal verwendet Brand Icons, alle anderen Solid Icons
    if (method === 'paypal') {
      return `fa-brands ${icon}`;
    }
    return `fa-solid ${icon}`;
  }

  getStatusLabel(status: Payment['status']): string {
    const labels = {
      pending: 'Ausstehend',
      processing: 'Wird bearbeitet',
      completed: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
      refunded: 'Erstattet',
      cancelled: 'Storniert'
    };
    return labels[status];
  }

  getStatusIcon(status: Payment['status']): string {
    const icons = {
      pending: 'fa-clock',
      processing: 'fa-spinner',
      completed: 'fa-check-circle',
      failed: 'fa-exclamation-triangle',
      refunded: 'fa-undo',
      cancelled: 'fa-times-circle'
    };
    return icons[status];
  }

  getPayoutLabel(status?: 'paid_out' | 'pending'): string {
    const labels = {
      paid_out: 'Ausgezahlt',
      pending: 'Ausstehend'
    };
    return labels[status || 'pending'];
  }

  // Action Methods
  viewPaymentDetails(payment: Payment) {
    console.log('View payment details:', payment);
    // TODO: Implement payment details modal/page
  }

  processRefund(payment: Payment) {
    console.log('Process refund for payment:', payment);
    // TODO: Implement refund modal/form
  }

  retryPayment(payment: Payment) {
    console.log('Retry payment:', payment);
    // TODO: Implement payment retry
  }

  cancelPayment(payment: Payment) {
    if (confirm('Möchten Sie diese Zahlung wirklich stornieren?')) {
      console.log('Cancel payment:', payment);
      // TODO: Implement payment cancellation
    }
  }

  exportPayments() {
    console.log('Export payments to CSV');
    // TODO: Implement CSV export
  }

  refreshData() {
    this.loadPayments();
    this.loadStatistics();
  }

  // Payout Methods
  async calculatePayouts() {
    this.isCalculatingPayouts = true;
    try {
      const response = await this.http.get<{
        count: number;
        calculations: PayoutCalculation[];
      }>(`${environment.apiUrl}/payments/payouts/calculate`).toPromise();

      this.payoutCalculations = response?.calculations || [];
      console.log('Payout calculations:', this.payoutCalculations);
    } catch (error) {
      console.error('Error calculating payouts:', error);
      alert('Fehler beim Berechnen der Auszahlungen');
    } finally {
      this.isCalculatingPayouts = false;
    }
  }

  async processBulkPayouts() {
    if (!confirm(`Möchten Sie wirklich ${this.payoutCalculations.length} Restaurants auszahlen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    this.isProcessingPayouts = true;
    try {
      const response = await this.http.post<{
        message: string;
        result: PayoutResult;
      }>(`${environment.apiUrl}/payments/payouts/process`, {}).toPromise();

      alert(response?.message || 'Auszahlungen erfolgreich verarbeitet');
      console.log('Payout result:', response?.result);

      // Reset calculations and refresh data
      this.payoutCalculations = [];
      this.refreshData();
    } catch (error) {
      console.error('Error processing bulk payouts:', error);
      alert('Fehler beim Verarbeiten der Auszahlungen');
    } finally {
      this.isProcessingPayouts = false;
    }
  }

  // Helper methods for payout calculations
  getTotalPayoutAmount(): string {
    const total = this.payoutCalculations.reduce((sum, calc) => sum + calc.payout_amount, 0);
    return total.toFixed(2);
  }

  getTotalPlatformFee(): string {
    const total = this.payoutCalculations.reduce((sum, calc) => sum + calc.platform_fee, 0);
    return total.toFixed(2);
  }

  getTotalRevenueFromPayouts(): string {
    const total = this.payoutCalculations.reduce((sum, calc) => sum + calc.total_revenue, 0);
    return total.toFixed(2);
  }

  // Mock data for development
  private getMockPayments(): Payment[] {
    return [
      {
        id: 'PAY001',
        order_id: 'ORD001',
        customer_name: 'Max Mustermann',
        restaurant_name: 'Pizzeria Bella Vista',
        amount: 29.30,
        currency: 'EUR',
        payment_method: 'credit_card',
        status: 'completed',
        payout_status: 'paid_out',
        transaction_id: 'TXN123456789',
        created_at: '2025-08-27T19:30:00Z',
        processed_at: '2025-08-27T19:31:00Z'
      },
      {
        id: 'PAY002',
        order_id: 'ORD002',
        customer_name: 'Anna Schmidt',
        restaurant_name: 'Sushi Bar Tokyo',
        amount: 21.40,
        currency: 'EUR',
        payment_method: 'paypal',
        status: 'pending',
        payout_status: 'pending',
        created_at: '2025-08-27T19:15:00Z'
      }
    ];
  }
}
