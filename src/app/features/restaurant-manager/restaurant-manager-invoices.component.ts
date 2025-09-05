import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Invoice {
  id: number;
  order_id: number;
  order_type: string;
  restaurant_id: number;
  tenant_id?: number;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  net_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_at?: string;
  due_date?: string;
  paid_at?: string;
  pdf_path?: string;
  billing_address?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_count: number;
}

@Component({
  selector: 'app-restaurant-manager-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoices-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-text">
            <h1><i class="fa-solid fa-file-invoice-dollar"></i> Rechnungen</h1>
            <p>Verwalten Sie Ihre Großhandelsrechnungen</p>
          </div>
          <div class="header-stats">
            <div class="stat-card">
              <div class="stat-number">{{ stats.total_invoices }}</div>
              <div class="stat-label">Gesamt Rechnungen</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">€{{ stats.pending_amount.toFixed(2) }}</div>
              <div class="stat-label">Ausstehend</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">€{{ stats.paid_amount.toFixed(2) }}</div>
              <div class="stat-label">Bezahlt</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
            <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>Rechnungen werden geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Fehler beim Laden</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" (click)="loadInvoices()">Erneut versuchen</button>
      </div>

      <!-- Invoices List -->
      <div *ngIf="!loading && !error" class="invoices-section">
        <div class="section-header">
          <h2>Ihre Rechnungen</h2>
        </div>

        <div *ngIf="invoices.length > 0" class="invoices-grid">
          <div *ngFor="let invoice of invoices" class="invoice-card" [class]="'invoice-' + invoice.status">
            <div class="invoice-header">
              <div class="invoice-info">
                <h3>{{ invoice.invoice_number }}</h3>
                <div class="invoice-meta">
                  <span class="order-ref">Bestellung #{{ invoice.order_id }}</span>
                  <span class="invoice-date">{{ invoice.issued_at | date:'dd.MM.yyyy' }}</span>
                </div>
              </div>
              <div class="invoice-status" [class]="'status-' + invoice.status">
                {{ getStatusText(invoice.status) }}
              </div>
            </div>

            <div class="invoice-content">
              <div class="invoice-amounts">
                <div class="amount-row">
                  <span>Nettobetrag:</span>
                  <span>€{{ invoice.net_amount.toFixed(2) }}</span>
                </div>
                <div class="amount-row">
                  <span>MwSt (19%):</span>
                  <span>€{{ invoice.tax_amount.toFixed(2) }}</span>
                </div>
                <div class="amount-row total">
                  <span>Gesamt:</span>
                  <span>€{{ invoice.total_amount.toFixed(2) }}</span>
                </div>
              </div>

              <div class="invoice-dates">
                <div class="date-row">
                  <span>Fällig bis:</span>
                  <span [class.overdue]="isOverdue(invoice)">
                    {{ invoice.due_date | date:'dd.MM.yyyy' }}
                  </span>
                </div>
                <div *ngIf="invoice.paid_at" class="date-row">
                  <span>Bezahlt am:</span>
                  <span>{{ invoice.paid_at | date:'dd.MM.yyyy' }}</span>
                </div>
              </div>
            </div>

            <div class="invoice-actions">
              <button *ngIf="invoice.pdf_path" class="btn-secondary" (click)="downloadInvoice(invoice)">
                <i class="fa-solid fa-download"></i>
                Download PDF
              </button>
              <button *ngIf="!invoice.pdf_path" class="btn-secondary" (click)="generatePdf(invoice)">
                <i class="fa-solid fa-file-pdf"></i>
                PDF generieren
              </button>
              <button *ngIf="invoice.status === 'sent'" class="btn-success" (click)="markAsPaid(invoice)">
                <i class="fa-solid fa-check"></i>
                Als bezahlt markieren
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="invoices.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <h3>Noch keine Rechnungen</h3>
          <p>Sie haben noch keine Rechnungen für Großhandelsbestellungen.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoices-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      background: var(--gradient-light-green);
      min-height: 100vh;
    }

    .header-section {
      background: var(--gradient-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-8) var(--space-6);
      margin-bottom: var(--space-8);
      color: white;
    }

    .header-section * {
      color: white;
    }

    .header-content {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-6);
      align-items: center;
    }

    .header-text h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .header-stats {
      display: flex;
      gap: var(--space-6);
    }

    .stat-card {
      text-align: center;
      padding: var(--space-4);
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(10px);
    }

    .stat-number {
      font-size: var(--text-2xl);
      font-weight: 700;
      line-height: 1;
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--text-sm);
      opacity: 0.9;
    }

    .invoices-section {
      background: white;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .section-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .section-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      font-weight: 600;
    }

    .invoices-grid {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-6);
    }

    .invoice-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      background: white;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .invoice-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-200);
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .invoice-info h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .invoice-meta {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .invoice-status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-draft { background: var(--color-warning); color: white; }
    .status-sent { background: var(--color-info); color: white; }
    .status-paid { background: var(--color-success); color: white; }
    .status-overdue { background: var(--color-danger); color: white; }
    .status-cancelled { background: var(--color-muted); color: white; }

    .invoice-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-4);
    }

    .invoice-amounts, .invoice-dates {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .amount-row, .date-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-1) 0;
    }

    .amount-row.total {
      border-top: 2px solid var(--color-border);
      margin-top: var(--space-2);
      padding-top: var(--space-3);
      font-weight: 600;
      color: var(--color-primary);
    }

    .overdue {
      color: var(--color-danger);
      font-weight: 600;
    }

    .invoice-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .btn-secondary, .btn-success {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      border: none;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-border);
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-success:hover {
      background: var(--color-success-dark, #059669);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-6);
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      color: var(--color-muted);
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .loading-spinner, .error-icon {
      margin-bottom: var(--space-4);
      color: var(--color-primary);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .header-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        text-align: center;
      }

      .header-stats {
        justify-content: center;
      }

      .invoice-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .invoice-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RestaurantManagerInvoicesComponent implements OnInit {
  private http = inject(HttpClient);

  invoices: Invoice[] = [];
  stats: InvoiceStats = {
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    overdue_count: 0
  };
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadInvoices();
    this.loadStats();
  }

  loadInvoices() {
    this.loading = true;
    this.error = null;

    this.http.get<{ count: number; invoices: Invoice[] }>(`${environment.apiUrl}/invoices`)
      .subscribe({
        next: (response) => {
          this.invoices = response.invoices;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading invoices:', error);
          this.error = 'Fehler beim Laden der Rechnungen. Bitte versuchen Sie es später erneut.';
          this.loading = false;
        }
      });
  }

  loadStats() {
    this.http.get<InvoiceStats>(`${environment.apiUrl}/invoices/stats`)
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading invoice stats:', error);
        }
      });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Gesendet';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  }

  isOverdue(invoice: Invoice): boolean {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  }

  downloadInvoice(invoice: Invoice) {
    if (invoice.pdf_path) {
      window.open(`${environment.apiUrl}${invoice.pdf_path}`, '_blank');
    }
  }

  generatePdf(invoice: Invoice) {
    this.http.post(`${environment.apiUrl}/invoices/${invoice.id}/generate-pdf`, {})
      .subscribe({
        next: () => {
          // Reload invoice to get updated PDF path
          this.loadInvoices();
          alert('PDF wurde erfolgreich generiert!');
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
        }
      });
  }

  markAsPaid(invoice: Invoice) {
    if (confirm('Möchten Sie diese Rechnung wirklich als bezahlt markieren?')) {
      this.http.patch(`${environment.apiUrl}/invoices/${invoice.id}/status`, { status: 'paid' })
        .subscribe({
          next: () => {
            this.loadInvoices();
            this.loadStats();
            alert('Rechnung wurde als bezahlt markiert!');
          },
          error: (error) => {
            console.error('Error updating invoice status:', error);
            alert('Fehler beim Aktualisieren des Rechnungsstatus. Bitte versuchen Sie es erneut.');
          }
        });
    }
  }
}
