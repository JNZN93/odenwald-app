import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface WholesalerOrder {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_date?: string;
  delivery_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-wholesaler-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orders-container">
      <div class="orders-header">
        <h1>Bestellungen</h1>
        <p>Verwalten Sie eingehende Bestellungen von Restaurants</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
            <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>Bestellungen werden geladen...</p>
      </div>

      <!-- Orders List -->
      <div class="orders-grid" *ngIf="!loading && orders.length > 0">
        <div class="order-card" *ngFor="let order of orders">
          <div class="order-header">
            <div class="order-info">
              <h3>Bestellung #{{ order.id }}</h3>
              <p class="restaurant-name">{{ order.restaurant_name }}</p>
            </div>
            <div class="order-status" [class]="order.status">
              <i class="fa-solid" [class]="getStatusIcon(order.status)"></i>
              {{ getStatusText(order.status) }}
            </div>
          </div>

          <div class="order-details">
            <div class="detail-item">
              <span class="detail-label">Gesamtbetrag:</span>
              <span class="detail-value">€{{ order.total_amount.toFixed(2) }}</span>
            </div>
            <div class="detail-item" *ngIf="order.delivery_date">
              <span class="detail-label">Lieferdatum:</span>
              <span class="detail-value">{{ formatDate(order.delivery_date) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Bestellt am:</span>
              <span class="detail-value">{{ formatDate(order.created_at) }}</span>
            </div>
          </div>

          <div class="order-notes" *ngIf="order.notes">
            <p>{{ order.notes }}</p>
          </div>

          <div class="order-actions">
            <button
              class="btn btn-primary"
              (click)="viewOrderDetails(order)"
              *ngIf="order.status === 'pending'"
            >
              Details anzeigen
            </button>
            <button
              class="btn btn-success"
              (click)="updateOrderStatus(order, 'confirmed')"
              *ngIf="order.status === 'pending'"
            >
              Bestätigen
            </button>
            <button
              class="btn btn-warning"
              (click)="updateOrderStatus(order, 'preparing')"
              *ngIf="order.status === 'confirmed'"
            >
              In Bearbeitung
            </button>
            <button
              class="btn btn-info"
              (click)="updateOrderStatus(order, 'ready')"
              *ngIf="order.status === 'preparing'"
            >
              Bereit zur Lieferung
            </button>
            <button
              class="btn btn-success"
              (click)="updateOrderStatus(order, 'delivered')"
              *ngIf="order.status === 'ready'"
            >
              Als geliefert markieren
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && orders.length === 0">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h3>Noch keine Bestellungen</h3>
        <p>Sobald Restaurants bei Ihnen bestellen, werden diese hier angezeigt.</p>
      </div>

      <!-- Order Details Modal -->
      <div class="modal-overlay" *ngIf="selectedOrder" (click)="closeOrderDetails()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Bestellung #{{ selectedOrder.id }} - Details</h2>
            <button class="close-btn" (click)="closeOrderDetails()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedOrder">
            <div class="order-summary">
              <div class="summary-item">
                <label>Restaurant:</label>
                <span>{{ selectedOrder.restaurant_name }}</span>
              </div>
              <div class="summary-item">
                <label>Status:</label>
                <span class="status-badge" [class]="selectedOrder.status">
                  {{ getStatusText(selectedOrder.status) }}
                </span>
              </div>
              <div class="summary-item">
                <label>Gesamtbetrag:</label>
                <span class="total-amount">€{{ selectedOrder.total_amount.toFixed(2) }}</span>
              </div>
              <div class="summary-item" *ngIf="selectedOrder.delivery_date">
                <label>Lieferdatum:</label>
                <span>{{ formatDate(selectedOrder.delivery_date) }}</span>
              </div>
            </div>

            <div class="order-items" *ngIf="selectedOrder.items && selectedOrder.items.length > 0">
              <h3>Bestellpositionen</h3>
              <div class="items-list">
                <div class="item-row" *ngFor="let item of selectedOrder.items">
                  <div class="item-info">
                    <strong>{{ item.product_name }}</strong>
                    <small>{{ item.quantity }} × €{{ item.unit_price.toFixed(2) }}</small>
                  </div>
                  <div class="item-total">€{{ item.total_price.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <div class="delivery-info" *ngIf="selectedOrder.delivery_address">
              <h3>Lieferadresse</h3>
              <address>
                {{ selectedOrder.delivery_address.street }}<br>
                {{ selectedOrder.delivery_address.postal_code }} {{ selectedOrder.delivery_address.city }}<br>
                {{ selectedOrder.delivery_address.country }}
              </address>
            </div>

            <div class="order-notes" *ngIf="selectedOrder.notes">
              <h3>Notizen</h3>
              <p>{{ selectedOrder.notes }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeOrderDetails()">Schließen</button>
            <button
              class="btn btn-success"
              (click)="updateOrderStatus(selectedOrder, 'confirmed')"
              *ngIf="selectedOrder.status === 'pending'"
            >
              Bestellung bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .orders-header {
      margin-bottom: var(--space-8);
    }

    .orders-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .orders-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .orders-grid {
      display: grid;
      gap: var(--space-6);
    }

    .order-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      transition: all var(--transition);
    }

    .order-card:hover {
      box-shadow: var(--shadow-md);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .order-info h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .restaurant-name {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-status {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .order-status.pending {
      background: var(--bg-warning);
      color: var(--color-warning);
    }

    .order-status.confirmed {
      background: var(--bg-info);
      color: var(--color-info);
    }

    .order-status.preparing {
      background: var(--bg-primary);
      color: var(--color-primary);
    }

    .order-status.ready {
      background: var(--bg-success);
      color: var(--color-success);
    }

    .order-status.delivered {
      background: var(--bg-success);
      color: var(--color-success);
    }

    .order-status.cancelled {
      background: var(--bg-danger);
      color: var(--color-danger);
    }

    .order-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      font-weight: 500;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .detail-value {
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .order-notes {
      background: var(--bg-light);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
    }

    .order-notes p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .btn {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-warning {
      background: var(--color-warning);
      color: var(--color-warning);
    }

    .btn-info {
      background: var(--color-info);
      color: white;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      color: var(--color-muted);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-state p {
      margin: 0;
      color: var(--color-muted);
    }

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
      max-width: 700px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .order-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .summary-item label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .summary-item span {
      color: var(--color-text);
    }

    .status-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .total-amount {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    .order-items h3,
    .delivery-info h3,
    .order-notes h3 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .items-list {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      border-bottom: 1px solid var(--color-border);
    }

    .item-row:last-child {
      border-bottom: none;
    }

    .item-info strong {
      display: block;
      color: var(--color-heading);
    }

    .item-info small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .item-total {
      font-weight: 600;
      color: var(--color-primary);
    }

    .delivery-info address {
      font-style: normal;
      line-height: 1.5;
      color: var(--color-text);
    }

    .modal-actions {
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .loading-spinner {
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
      .order-header {
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
      }

      .order-actions {
        flex-direction: column;
      }

      .modal-content {
        margin: var(--space-2);
      }
    }
  `]
})
export class WholesalerOrdersComponent implements OnInit {
  private http = inject(HttpClient);

  orders: WholesalerOrder[] = [];
  loading = false;
  error: string | null = null;
  selectedOrder: (WholesalerOrder & { items?: any[] }) | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.error = null;

    this.http.get<{ orders: WholesalerOrder[] }>(`${environment.apiUrl}/wholesaler-orders/wholesaler/orders`).subscribe({
      next: (response) => {
        // Ensure numeric fields are numbers (API may return decimals as strings)
        this.orders = (response.orders || []).map((o: any) => ({
          ...o,
          total_amount: typeof o.total_amount === 'number' ? o.total_amount : parseFloat(o.total_amount ?? '0')
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = 'Fehler beim Laden der Bestellungen. Bitte versuchen Sie es später erneut.';
        this.loading = false;
      }
    });
  }

  viewOrderDetails(order: WholesalerOrder) {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/wholesaler-orders/wholesaler/${order.id}`).subscribe({
      next: (response: any) => {
        this.selectedOrder = response.order as any;
        if (this.selectedOrder) {
          // Coerce numeric fields to numbers
          (this.selectedOrder as any).total_amount = typeof (this.selectedOrder as any).total_amount === 'number'
            ? (this.selectedOrder as any).total_amount
            : parseFloat((this.selectedOrder as any).total_amount ?? '0');

          const items = response.items || [];
          (this.selectedOrder as any).items = items.map((it: any) => ({
            ...it,
            unit_price: typeof it.unit_price === 'number' ? it.unit_price : parseFloat(it.unit_price ?? '0'),
            total_price: typeof it.total_price === 'number' ? it.total_price : parseFloat(it.total_price ?? '0')
          }));
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        alert('Fehler beim Laden der Bestelldetails. Bitte versuchen Sie es erneut.');
        this.loading = false;
      }
    });
  }

  closeOrderDetails() {
    this.selectedOrder = null;
  }

  updateOrderStatus(order: WholesalerOrder, newStatus: string) {
    this.http.patch(`${environment.apiUrl}/wholesaler-orders/wholesaler/${order.id}`, {
      status: newStatus
    }).subscribe({
      next: (response: any) => {
        console.log('Order status updated:', response);
        order.status = newStatus as any;
        if (this.selectedOrder && this.selectedOrder.id === order.id) {
          this.selectedOrder.status = newStatus as any;
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        alert('Fehler beim Aktualisieren des Bestellstatus. Bitte versuchen Sie es erneut.');
      }
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'confirmed': return 'fa-check-circle';
      case 'preparing': return 'fa-cog';
      case 'ready': return 'fa-box';
      case 'delivered': return 'fa-truck';
      case 'cancelled': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'confirmed': return 'Bestätigt';
      case 'preparing': return 'In Bearbeitung';
      case 'ready': return 'Bereit zur Lieferung';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
