import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OrdersService, Order } from '../../../core/services/orders.service';

interface IssueReason {
  id: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-report-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-issue-container">
      <div class="report-issue-content">
        <!-- Header -->
        <div class="report-header">
          <button class="back-btn" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <h1>Problem melden</h1>
        </div>

        <!-- Order Info -->
        <div class="order-summary" *ngIf="order">
          <div class="order-info">
            <h2>Bestellung #{{ order.id }}</h2>
            <p class="restaurant-name">{{ order.restaurant_name }}</p>
            <p class="order-date">{{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</p>
          </div>
          <div class="order-status">
            <span class="status-badge" [class]="'status-' + order.status">
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>

        <!-- Helper Text -->
        <div class="helper-text">
          <i class="fa-solid fa-info-circle"></i>
          <p>Wir kümmern uns um deine Bestellung, wenn etwas nicht stimmt.</p>
        </div>

        <!-- Step 1: Reason Selection -->
        <div class="step-section" *ngIf="!selectedReason && !isSubmitted">
          <h3>Was ist das Problem?</h3>
          <div class="reasons-grid">
            <div
              class="reason-card"
              *ngFor="let reason of issueReasons"
              (click)="selectReason(reason)"
            >
              <div class="reason-icon">
                <i [class]="reason.icon"></i>
              </div>
              <div class="reason-content">
                <h4>{{ reason.label }}</h4>
                <p>{{ reason.description }}</p>
              </div>
              <div class="reason-arrow">
                <i class="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Details Form -->
        <div class="step-section" *ngIf="selectedReason && !isSubmitted">
          <div class="selected-reason">
            <button class="change-reason-btn" (click)="changeReason()">
              <i class="fa-solid fa-arrow-left"></i>
              Grund ändern
            </button>
            <div class="reason-display">
              <div class="reason-icon">
                <i [class]="selectedReason.icon"></i>
              </div>
              <div class="reason-content">
                <h4>{{ selectedReason.label }}</h4>
                <p>{{ selectedReason.description }}</p>
              </div>
            </div>
          </div>

          <div class="details-form">
            <h3>Bitte beschreibe das Problem genauer</h3>
            <textarea
              [(ngModel)]="issueDescription"
              placeholder="Erzähl uns mehr über das Problem..."
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ issueDescription.length }}/500</div>

            <!-- Photos Section (placeholder for future) -->
            <div class="photos-section">
              <h4>Fotos hinzufügen (optional)</h4>
              <p class="photos-hint">Fotos können uns helfen, das Problem schneller zu lösen.</p>
              <button class="upload-btn" disabled>
                <i class="fa-solid fa-camera"></i>
                Foto hochladen (bald verfügbar)
              </button>
            </div>

            <div class="form-actions">
              <button class="btn-secondary" (click)="cancel()">Abbrechen</button>
              <button
                class="btn-primary"
                (click)="submitReport()"
                [disabled]="!issueDescription.trim() || isSubmitting"
              >
                <span *ngIf="!isSubmitting">Problem melden</span>
                <span *ngIf="isSubmitting">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Wird gesendet...
                </span>
              </button>
            </div>

            <div class="error-message" *ngIf="submitError">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ submitError }}
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div class="success-message" *ngIf="isSubmitted">
          <div class="success-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <h3>Vielen Dank!</h3>
          <p>Wir haben dein Problem erhalten und werden uns schnellstmöglich darum kümmern.</p>
          <p class="response-time">Du erhältst in den nächsten 24 Stunden eine Rückmeldung.</p>
          <button class="btn-primary" (click)="goToDashboard()">Zurück zum Dashboard</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-issue-container {
      min-height: 100vh;
      background: var(--bg-light);
      padding: var(--space-4) var(--space-4) var(--space-8);
    }

    .report-issue-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .report-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .back-btn {
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text);
      transition: all var(--transition);
    }

    .back-btn:hover {
      background: var(--bg-light);
      border-color: var(--color-primary);
    }

    .report-header h1 {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
      margin: 0;
    }

    .order-summary {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .order-info h2 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
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

    .helper-text {
      background: color-mix(in oklab, #3b82f6 5%, white);
      border: 1px solid color-mix(in oklab, #3b82f6 20%, white);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .helper-text i {
      color: #3b82f6;
      font-size: var(--text-lg);
      margin-top: var(--space-1);
      flex-shrink: 0;
    }

    .helper-text p {
      margin: 0;
      color: var(--color-text);
      line-height: 1.5;
    }

    .step-section {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }

    .step-section h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-4) 0;
    }

    .reasons-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .reason-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
    }

    .reason-card:hover {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 2%, white);
      transform: translateY(-1px);
    }

    .reason-icon {
      width: 48px;
      height: 48px;
      background: var(--color-primary-100);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: var(--text-xl);
      flex-shrink: 0;
    }

    .reason-content {
      flex: 1;
    }

    .reason-content h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-base);
    }

    .reason-content p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .reason-arrow {
      color: var(--color-muted);
      transition: color var(--transition);
    }

    .reason-card:hover .reason-arrow {
      color: var(--color-primary);
    }

    .selected-reason {
      margin-bottom: var(--space-6);
    }

    .change-reason-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .change-reason-btn:hover {
      background: color-mix(in oklab, var(--color-primary) 5%, white);
    }

    .reason-display {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: color-mix(in oklab, var(--color-primary) 2%, white);
      border: 1px solid color-mix(in oklab, var(--color-primary) 10%, white);
      border-radius: var(--radius-md);
    }

    .details-form h3 {
      margin-bottom: var(--space-4);
    }

    .details-form textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--text-base);
      resize: vertical;
      min-height: 120px;
    }

    .details-form textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .char-count {
      text-align: right;
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-top: var(--space-1);
    }

    .photos-section {
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .photos-section h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .photos-hint {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .upload-btn {
      background: var(--bg-light);
      border: 2px dashed var(--color-border);
      color: var(--color-muted);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      cursor: not-allowed;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .form-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-secondary {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-muted-200);
      border-color: var(--color-muted);
    }

    .btn-primary {
      background: var(--gradient-primary);
      border: none;
      color: white;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .success-message {
      text-align: center;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8);
    }

    .success-icon {
      font-size: 4rem;
      color: var(--color-success);
      margin-bottom: var(--space-4);
    }

    .success-message h3 {
      font-size: var(--text-2xl);
      color: var(--color-heading);
      margin: 0 0 var(--space-3) 0;
    }

    .success-message p {
      color: var(--color-text);
      margin: 0 0 var(--space-2) 0;
      line-height: 1.5;
    }

    .response-time {
      color: var(--color-muted);
      font-style: italic;
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
    .status-picked_up { background: color-mix(in oklab, #059669 15%, white); color: #047857; }
    .status-cancelled { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }

    .error-message {
      margin-top: var(--space-3);
      color: #b91c1c;
      background: color-mix(in oklab, #ef4444 10%, white);
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    @media (max-width: 768px) {
      .report-issue-container {
        padding: var(--space-2);
      }

      .report-header {
        margin-bottom: var(--space-4);
      }

      .order-summary {
        flex-direction: column;
        gap: var(--space-3);
        align-items: flex-start;
      }

      .reason-card {
        padding: var(--space-3);
      }

      .form-actions {
        flex-direction: column;
      }

      .btn-secondary, .btn-primary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ReportIssueComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(OrdersService);

  order: Order | null = null;
  issueReasons: IssueReason[] = [
    { id: 'missing_item', label: 'Artikel fehlt', description: 'Ein oder mehrere Artikel fehlen in deiner Bestellung.', icon: 'fa-solid fa-box-open' },
    { id: 'wrong_item', label: 'Falscher Artikel', description: 'Du hast einen falschen Artikel erhalten.', icon: 'fa-solid fa-shuffle' },
    { id: 'cold_food', label: 'Essen ist kalt', description: 'Die Speisen sind kalt angekommen.', icon: 'fa-solid fa-temperature-low' },
    { id: 'late_delivery', label: 'Lieferung verspätet', description: 'Die Lieferung hat deutlich länger gedauert.', icon: 'fa-solid fa-clock' },
    { id: 'other', label: 'Anderes Problem', description: 'Ein anderes Problem mit deiner Bestellung.', icon: 'fa-solid fa-message' },
  ];

  selectedReason: IssueReason | null = null;
  issueDescription = '';
  isSubmitting = false;
  isSubmitted = false;
  submitError: string | null = null;

  async ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) return;
    this.ordersService.getOrderById(orderId).subscribe({
      next: (order) => this.order = order,
      error: () => {
        // non-blocking
      }
    });
  }

  selectReason(reason: IssueReason) {
    this.selectedReason = reason;
  }

  changeReason() {
    this.selectedReason = null;
  }

  getStatusLabel(status: Order['status']): string {
    const labels: Record<Order['status'], string> = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'Wird zubereitet',
      ready: 'Bereit zur Abholung',
      picked_up: 'Abgeholt',
      delivered: 'Geliefert',
      served: 'Serviert',
      paid: 'Bezahlt',
      cancelled: 'Storniert',
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      out_for_delivery: 'Unterwegs'
    } as const;
    return labels[status];
  }

  submitReport() {
    if (!this.selectedReason || !this.issueDescription.trim() || !this.order) return;

    this.isSubmitting = true;
    this.submitError = null;

    this.ordersService.submitOrderIssue({
      order_id: this.order.id,
      restaurant_id: this.order.restaurant_id,
      reason: this.selectedReason.id,
      description: this.issueDescription.trim(),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = 'Senden fehlgeschlagen. Bitte versuche es erneut.';
        console.error('Issue submit failed', err);
      }
    });
  }

  cancel() {
    this.goBack();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
