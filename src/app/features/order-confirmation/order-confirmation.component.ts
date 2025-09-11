import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OrdersService, Order } from '../../core/services/orders.service';
import { Observable, interval, Subscription, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="order-confirmation-container">
      <div class="confirmation-header">
        <div class="success-icon">
          <i class="fa-solid fa-check-circle"></i>
        </div>
        <h1>Bestellung erfolgreich!</h1>
        <p class="confirmation-subtitle">Ihre Bestellung wurde aufgegeben und wird bald bearbeitet.</p>
      </div>

      <ng-container *ngIf="order$ | async as order">
        <div class="payment-banner" [ngClass]="{
          'payment-pending': order.payment_status === 'pending',
          'payment-paid': order.payment_status === 'paid',
          'payment-failed': order.payment_status === 'failed'
        }">
          <i class="fa-solid" [ngClass]="{
            'fa-spinner fa-spin': order.payment_status === 'pending',
            'fa-check-circle': order.payment_status === 'paid',
            'fa-triangle-exclamation': order.payment_status === 'failed'
          }"></i>
          <span *ngIf="order.payment_status === 'pending'">Zahlung ausstehend – wir aktualisieren den Status automatisch…</span>
          <span *ngIf="order.payment_status === 'paid'">Zahlung erfolgreich – Ihre Bestellung wird bestätigt.</span>
          <span *ngIf="order.payment_status === 'failed'">Zahlung fehlgeschlagen – bitte versuchen Sie es erneut.</span>
        </div>
      </ng-container>

      <div class="confirmation-content" *ngIf="order$ | async as order; else loading">
        <div class="order-details-card">
          <div class="order-header">
            <h2>Bestellung #{{ order.id }}</h2>
            <div class="order-status" [class]="'status-' + order.status">
              {{ getStatusLabel(order.status) }}
            </div>
          </div>

          <div class="order-info">
            <div class="info-section">
              <h3><i class="fa-solid fa-store"></i> Restaurant</h3>
              <p>{{ order.restaurant_name }}</p>
            </div>

            <div class="info-section">
              <h3><i class="fa-solid fa-map-marker-alt"></i> Lieferadresse</h3>
              <p>{{ order.delivery_address }}</p>
              <p *ngIf="order.delivery_instructions" class="instructions">
                Hinweise: {{ order.delivery_instructions }}
              </p>
            </div>

            <div class="info-section">
              <h3><i class="fa-solid fa-clock"></i> Geschätzte Lieferzeit</h3>
              <p>{{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</p>
            </div>
          </div>

          <div class="order-items">
            <h3>Bestellte Artikel</h3>
            <div class="items-list">
              <div *ngFor="let item of order.items" class="order-item">
                <div class="item-info">
                  <h4>{{ item.name }}</h4>
                  <p class="item-details">{{ item.quantity }} × {{ item.unit_price | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
                </div>
                <div class="item-total">{{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
              </div>
            </div>
          </div>

          <div class="order-summary">
            <div class="summary-row">
              <span>Zwischensumme:</span>
              <span>{{ order.subtotal | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>
            <div class="summary-row">
              <span>Liefergebühr:</span>
              <span>{{ order.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>
            <div class="summary-row total">
              <span>Gesamt:</span>
              <span>{{ order.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
            </div>
          </div>
        </div>

        <div class="redirect-notice" *ngIf="countdown > 0">
          <div class="redirect-message">
            <i class="fa-solid fa-info-circle"></i>
            <span>Automatische Weiterleitung zur Startseite in {{ countdown }} Sekunden...</span>
            <button class="cancel-redirect-btn" (click)="cancelRedirect()">
              <i class="fa-solid fa-times"></i>
              Abbrechen
            </button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" (click)="trackOrder()">
            <i class="fa-solid fa-map-marker-alt"></i>
            Bestellung verfolgen
          </button>
          <button class="btn btn-ghost" (click)="goToRestaurants()">
            <i class="fa-solid fa-utensils"></i>
            Weitere Bestellungen
          </button>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Bestellung wird geladen...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .order-confirmation-container {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--space-8);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .confirmation-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .success-icon {
      font-size: 4rem;
      color: var(--color-success);
      margin-bottom: var(--space-4);
    }

    .confirmation-header h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .confirmation-subtitle {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .confirmation-content {
      width: 100%;
    }

    .payment-banner {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-6);
      border: 1px solid transparent;
      font-weight: 600;
    }

    .payment-pending { background: color-mix(in oklab, #fbbf24 10%, white); color: #92400e; border-color: #f59e0b; }
    .payment-paid { background: color-mix(in oklab, #10b981 10%, white); color: #065f46; border-color: #10b981; }
    .payment-failed { background: color-mix(in oklab, #ef4444 10%, white); color: #7f1d1d; border-color: #ef4444; }

    .order-details-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      margin-bottom: var(--space-8);
      box-shadow: var(--shadow-lg);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .order-header h2 {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0;
    }

    .order-status {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending { background: color-mix(in oklab, #fbbf24 15%, white); color: #d97706; }
    .status-confirmed { background: color-mix(in oklab, #3b82f6 15%, white); color: #2563eb; }
    .status-preparing { background: color-mix(in oklab, #f59e0b 15%, white); color: #d97706; }
    .status-ready { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-delivered { background: color-mix(in oklab, #059669 15%, white); color: #047857; }
    .status-cancelled { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }

    .order-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .info-section h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .info-section p {
      color: var(--color-text);
      margin: 0;
    }

    .instructions {
      font-style: italic;
      color: var(--color-muted);
    }

    .order-items {
      margin-bottom: var(--space-8);
    }

    .order-items h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-4);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .item-info {
      flex: 1;
    }

    .item-info h4 {
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-1) 0;
    }

    .item-details {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .item-total {
      font-weight: 600;
      color: var(--color-success);
    }

    .order-summary {
      border-top: 2px solid var(--color-border);
      padding-top: var(--space-4);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      font-size: var(--text-md);
    }

    .summary-row.total {
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--color-heading);
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-3);
      margin-top: var(--space-3);
    }

    .action-buttons {
      display: flex;
      gap: var(--space-4);
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: var(--space-4) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      font-size: var(--text-md);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-ghost {
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-ghost:hover {
      background: var(--bg-light);
      transform: translateY(-2px);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-16) 0;
      color: var(--color-muted);
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

    .redirect-notice {
      margin-bottom: var(--space-6);
    }

    .redirect-message {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-lg);
      color: var(--color-primary);
      font-weight: 500;
    }

    .redirect-message i {
      font-size: var(--text-lg);
      flex-shrink: 0;
    }

    .redirect-message span {
      flex: 1;
    }

    .cancel-redirect-btn {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      background: transparent;
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-md);
      color: var(--color-primary);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 600;
      transition: all var(--transition);
      flex-shrink: 0;
    }

    .cancel-redirect-btn:hover {
      background: var(--color-primary);
      color: white;
    }

    .cancel-redirect-btn i {
      font-size: var(--text-sm);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .order-confirmation-container {
        padding: var(--space-4);
      }

      .order-info {
        grid-template-columns: 1fr;
      }

      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .order-item {
        flex-direction: column;
        gap: var(--space-2);
      }

      .redirect-message {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .cancel-redirect-btn {
        align-self: flex-end;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private http = inject(HttpClient);

  private orderSubject = new BehaviorSubject<Order | null>(null);
  order$: Observable<Order | null> = this.orderSubject.asObservable();
  countdown = 5;
  private countdownSubscription: Subscription | null = null;
  private pollingSubscription: Subscription | null = null;

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.refreshOrder(orderId);
      this.pollingSubscription = interval(2000)
        .pipe(take(30))
        .subscribe(() => this.refreshOrder(orderId, true));
      this.startCountdown();
    }
  }

  ngOnDestroy() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private startCountdown() {
    this.countdownSubscription = interval(1000)
      .pipe(take(5))
      .subscribe({
        next: (count) => {
          this.countdown = 5 - count;
        },
        complete: () => {
          this.goToRestaurants();
        }
      });
  }

  cancelRedirect() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
    this.countdown = 0;
  }

  getStatusLabel(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const labels = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'Wird zubereitet',
      ready: 'Bereit zur Abholung',
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

  trackOrder() {
    // TODO: Navigate to order tracking page
    console.log('Track order');
  }

  goToRestaurants() {
    this.router.navigate(['/customer']);
  }

  private refreshOrder(orderId: string, stopOnPaid = false) {
    // Use the public confirmation endpoint that doesn't require authentication
    this.http.get<{ order: any }>(`${environment.apiUrl}/orders/confirmation/${orderId}`).subscribe({
      next: (response) => {
        const order = this.ordersService['normalizeOrder'](response.order);
        this.orderSubject.next(order);
        if (stopOnPaid && (order.payment_status === 'paid' || order.payment_status === 'failed')) {
          if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = null;
          }
        }
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.orderSubject.next(null);
      }
    });
  }
}
