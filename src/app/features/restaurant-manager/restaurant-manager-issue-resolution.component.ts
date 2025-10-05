import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

interface ResolutionOption {
  can_refund: boolean;
  max_refund_amount: number;
  can_credit: boolean;
  max_credit_amount: number;
  can_discount: boolean;
  max_discount_percentage: number;
  can_replacement: boolean;
  order_items: any[];
}

@Component({
  selector: 'app-restaurant-manager-issue-resolution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="resolution-container" *ngIf="issue">
      <!-- Issue Header -->
      <div class="issue-header">
        <h2>Reklamation lösen - #{{ issue.id.slice(-8) }}</h2>
        <div class="issue-meta">
          <span class="issue-reason">{{ getReasonLabel(issue.reason) }}</span>
          <span class="issue-priority" [class]="'priority-' + issue.priority">
            {{ getPriorityLabel(issue.priority) }}
          </span>
        </div>
      </div>

      <!-- Issue Details -->
      <div class="issue-details">
        <h3>Kundenbeschwerde</h3>
        <p>{{ issue.description }}</p>
        <div class="order-info">
          <strong>Bestellung #{{ issue.order_id }}</strong>
        </div>
      </div>

      <!-- Resolution Options -->
      <div class="resolution-section" *ngIf="!isResolved">
        <h3>Lösungsvorschlag</h3>
        
        <div class="resolution-types">
          <!-- Replacement Option -->
          <div class="resolution-option" *ngIf="resolutionOptions?.can_replacement">
            <label class="option-label">
              <input type="radio" name="resolutionType" value="replacement" [(ngModel)]="selectedResolutionType">
              <div class="option-content">
                <div class="option-icon">🔄</div>
                <div class="option-text">
                  <strong>Ersatzlieferung</strong>
                  <p>Artikel nachliefern oder ersetzen</p>
                </div>
              </div>
            </label>
          </div>

          <!-- Refund Option -->
          <div class="resolution-option" *ngIf="resolutionOptions?.can_refund">
            <label class="option-label">
              <input type="radio" name="resolutionType" value="refund" [(ngModel)]="selectedResolutionType">
              <div class="option-content">
                <div class="option-icon">💰</div>
                <div class="option-text">
                  <strong>Geld zurück</strong>
                  <p>Vollständige oder teilweise Rückerstattung</p>
                </div>
              </div>
            </label>
            
            <!-- Refund Amount Input -->
            <div class="refund-input" *ngIf="selectedResolutionType === 'refund'">
              <label>Rückerstattungsbetrag (€)</label>
              <div class="amount-input-group">
                <input 
                  type="number" 
                  [(ngModel)]="refundAmount" 
                  [max]="resolutionOptions?.max_refund_amount"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                >
                <button type="button" class="btn-secondary" (click)="setFullRefund()">
                  Vollständig
                </button>
              </div>
              <small class="help-text">
                Maximal: €{{ resolutionOptions?.max_refund_amount?.toFixed(2) }}
              </small>
            </div>
          </div>

          <!-- Credit Option -->
          <div class="resolution-option" *ngIf="resolutionOptions?.can_credit">
            <label class="option-label">
              <input type="radio" name="resolutionType" value="credit" [(ngModel)]="selectedResolutionType">
              <div class="option-content">
                <div class="option-icon">🎫</div>
                <div class="option-text">
                  <strong>Guthaben</strong>
                  <p>Guthaben für zukünftige Bestellungen</p>
                </div>
              </div>
            </label>
            
            <!-- Credit Amount Input -->
            <div class="credit-input" *ngIf="selectedResolutionType === 'credit'">
              <label>Guthabenbetrag (€)</label>
              <input 
                type="number" 
                [(ngModel)]="creditAmount" 
                [max]="resolutionOptions?.max_credit_amount"
                step="0.01"
                min="0.01"
                placeholder="0.00"
              >
              <small class="help-text">
                Maximal: €{{ resolutionOptions?.max_credit_amount?.toFixed(2) }}
              </small>
            </div>
          </div>

          <!-- Discount Option -->
          <div class="resolution-option" *ngIf="resolutionOptions?.can_discount">
            <label class="option-label">
              <input type="radio" name="resolutionType" value="discount" [(ngModel)]="selectedResolutionType">
              <div class="option-content">
                <div class="option-icon">🏷️</div>
                <div class="option-text">
                  <strong>Rabatt</strong>
                  <p>Prozentualer Rabatt auf zukünftige Bestellungen</p>
                </div>
              </div>
            </label>
            
            <!-- Discount Input -->
            <div class="discount-input" *ngIf="selectedResolutionType === 'discount'">
              <label>Rabatt (%)</label>
              <input 
                type="number" 
                [(ngModel)]="discountPercentage" 
                [max]="resolutionOptions?.max_discount_percentage"
                min="1"
                max="100"
                placeholder="10"
              >
              <small class="help-text">
                Maximal: {{ resolutionOptions?.max_discount_percentage }}%
              </small>
            </div>
          </div>
        </div>

        <!-- Resolution Notes -->
        <div class="notes-section">
          <label>Interne Notizen</label>
          <textarea 
            [(ngModel)]="resolutionNotes"
            placeholder="Interne Notizen zur Lösung..."
            rows="3"
          ></textarea>
        </div>

        <!-- Customer Notification -->
        <div class="notification-section">
          <label>Kundenbenachrichtigung</label>
          <textarea 
            [(ngModel)]="customerNotification"
            placeholder="Nachricht an den Kunden..."
            rows="3"
            required
          ></textarea>
          <small class="help-text">
            Diese Nachricht wird dem Kunden per E-Mail gesendet.
          </small>
        </div>

        <!-- Admin Approval Notice -->
        <div class="approval-notice" *ngIf="requiresApproval">
          <i class="fa-solid fa-info-circle"></i>
          <p>
            <strong>Admin-Genehmigung erforderlich:</strong>
            Diese Lösung erfordert eine Genehmigung durch das Admin-Team.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-secondary" (click)="cancelResolution()">
            Abbrechen
          </button>
          <button 
            class="btn-primary" 
            (click)="proposeResolution()"
            [disabled]="!canProposeResolution() || isSubmitting"
          >
            <i class="fa-solid fa-spinner fa-spin" *ngIf="isSubmitting"></i>
            {{ isSubmitting ? 'Wird gesendet...' : 'Lösung vorschlagen' }}
          </button>
        </div>
      </div>

      <!-- Resolution Status -->
      <div class="resolution-status" *ngIf="isResolved">
        <div class="status-card" [class]="'status-' + issue.resolution_type">
          <div class="status-icon">
            <i [class]="getResolutionIcon(issue.resolution_type)"></i>
          </div>
          <div class="status-content">
            <h3>{{ getResolutionLabel(issue.resolution_type) }}</h3>
            <p *ngIf="issue.resolution_notes">{{ issue.resolution_notes }}</p>
            <div class="status-meta">
              <span *ngIf="issue.resolution_approved_at">
                Genehmigt: {{ formatDate(issue.resolution_approved_at) }}
              </span>
              <span *ngIf="issue.refund_amount">
                Rückerstattung: €{{ issue.refund_amount.toFixed(2) }}
              </span>
              <span *ngIf="issue.credit_amount">
                Guthaben: €{{ issue.credit_amount.toFixed(2) }}
              </span>
              <span *ngIf="issue.discount_percentage">
                Rabatt: {{ issue.discount_percentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resolution-container {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .issue-header {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      border: 1px solid var(--color-border);
    }

    .issue-header h2 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .issue-meta {
      display: flex;
      gap: var(--space-3);
    }

    .issue-reason {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .issue-priority {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      text-transform: uppercase;
    }

    .priority-high { background: var(--color-danger-100); color: var(--color-danger-700); }
    .priority-normal { background: var(--color-warning-100); color: var(--color-warning-700); }
    .priority-low { background: var(--color-success-100); color: var(--color-success-700); }

    .issue-details {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      border: 1px solid var(--color-border);
    }

    .issue-details h3 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .order-info {
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
    }

    .resolution-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      border: 1px solid var(--color-border);
    }

    .resolution-types {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .resolution-option {
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      transition: all var(--transition);
    }

    .resolution-option:hover {
      border-color: var(--color-primary-300);
    }

    .option-label {
      cursor: pointer;
      display: block;
    }

    .option-label input[type="radio"] {
      display: none;
    }

    .option-label input[type="radio"]:checked + .option-content {
      color: var(--color-primary-700);
    }

    .option-label input[type="radio"]:checked ~ * {
      display: block;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .option-icon {
      font-size: var(--text-2xl);
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary-50);
      border-radius: var(--radius-lg);
    }

    .option-text strong {
      display: block;
      margin-bottom: var(--space-1);
    }

    .option-text p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .refund-input,
    .credit-input,
    .discount-input {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .amount-input-group {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .amount-input-group input {
      flex: 1;
    }

    .notes-section,
    .notification-section {
      margin-bottom: var(--space-4);
    }

    .notes-section label,
    .notification-section label,
    .refund-input label,
    .credit-input label,
    .discount-input label {
      display: block;
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .notes-section textarea,
    .notification-section textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      resize: vertical;
    }

    .help-text {
      display: block;
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-top: var(--space-1);
    }

    .approval-notice {
      background: var(--color-warning-50);
      border: 1px solid var(--color-warning-200);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .approval-notice i {
      color: var(--color-warning-600);
      margin-top: var(--space-1);
    }

    .approval-notice p {
      margin: 0;
      color: var(--color-warning-700);
    }

    .action-buttons {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .resolution-status {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      border: 1px solid var(--color-border);
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
    }

    .status-card.status-refund {
      background: var(--color-success-50);
      border: 1px solid var(--color-success-200);
    }

    .status-card.status-credit {
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
    }

    .status-card.status-replacement {
      background: var(--color-info-50);
      border: 1px solid var(--color-info-200);
    }

    .status-card.status-discount {
      background: var(--color-warning-50);
      border: 1px solid var(--color-warning-200);
    }

    .status-icon {
      font-size: var(--text-3xl);
      color: var(--color-success-600);
    }

    .status-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .status-content p {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-muted);
    }

    .status-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .status-meta span {
      background: var(--color-gray-100);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    @media (max-width: 768px) {
      .resolution-container {
        padding: var(--space-4);
      }

      .option-content {
        flex-direction: column;
        text-align: center;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class RestaurantManagerIssueResolutionComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  issue: any = null;
  resolutionOptions: ResolutionOption | null = null;
  
  selectedResolutionType: string = '';
  refundAmount: number = 0;
  creditAmount: number = 0;
  discountPercentage: number = 0;
  resolutionNotes: string = '';
  customerNotification: string = '';
  
  requiresApproval: boolean = false;
  isResolved: boolean = false;
  isSubmitting: boolean = false;

  ngOnInit() {
    // Load issue data (would be passed from parent component)
    this.loadIssue();
  }

  loadIssue() {
    // Mock data - in real implementation, load from parent component or route
    this.issue = {
      id: 'issue-123',
      order_id: 456,
      reason: 'missing_item',
      description: 'Die Pizza Margherita fehlt in meiner Bestellung.',
      priority: 'high',
      status: 'open'
    };
    
    this.loadResolutionOptions();
  }

  loadResolutionOptions() {
    // Mock resolution options
    this.resolutionOptions = {
      can_refund: true,
      max_refund_amount: 25.99,
      can_credit: true,
      max_credit_amount: 31.19,
      can_discount: true,
      max_discount_percentage: 100,
      can_replacement: true,
      order_items: []
    };
  }

  setFullRefund() {
    this.refundAmount = this.resolutionOptions?.max_refund_amount || 0;
  }

  canProposeResolution(): boolean {
    if (!this.selectedResolutionType || !this.customerNotification.trim()) {
      return false;
    }

    switch (this.selectedResolutionType) {
      case 'refund':
        return this.refundAmount > 0 && this.refundAmount <= (this.resolutionOptions?.max_refund_amount || 0);
      case 'credit':
        return this.creditAmount > 0 && this.creditAmount <= (this.resolutionOptions?.max_credit_amount || 0);
      case 'discount':
        return this.discountPercentage > 0 && this.discountPercentage <= (this.resolutionOptions?.max_discount_percentage || 0);
      default:
        return true;
    }
  }

  proposeResolution() {
    if (!this.canProposeResolution()) return;

    this.isSubmitting = true;
    
    const resolutionData = {
      resolution_type: this.selectedResolutionType,
      refund_amount: this.selectedResolutionType === 'refund' ? this.refundAmount : undefined,
      credit_amount: this.selectedResolutionType === 'credit' ? this.creditAmount : undefined,
      discount_percentage: this.selectedResolutionType === 'discount' ? this.discountPercentage : undefined,
      resolution_notes: this.resolutionNotes,
      customer_notification: this.customerNotification
    };

    // In real implementation, call API
    setTimeout(() => {
      this.isSubmitting = false;
      this.requiresApproval = this.refundAmount > 50; // Mock approval logic
      this.toastService.success('Lösung vorgeschlagen', 'Ihr Lösungsvorschlag wurde erfolgreich eingereicht.');
      
      if (this.requiresApproval) {
        this.toastService.info('Admin-Genehmigung', 'Diese Lösung erfordert eine Genehmigung durch das Admin-Team.');
      }
    }, 2000);
  }

  cancelResolution() {
    // Navigate back or close modal
  }

  getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      'missing_item': 'Artikel fehlt',
      'wrong_item': 'Falscher Artikel',
      'cold_food': 'Essen ist kalt',
      'late_delivery': 'Lieferung verspätet',
      'other': 'Anderes Problem'
    };
    return labels[reason] || reason;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'high': 'Hoch',
      'normal': 'Normal',
      'low': 'Niedrig'
    };
    return labels[priority] || priority;
  }

  getResolutionLabel(type: string): string {
    const labels: Record<string, string> = {
      'replacement': 'Ersatzlieferung',
      'refund': 'Geld zurück',
      'credit': 'Guthaben',
      'discount': 'Rabatt'
    };
    return labels[type] || type;
  }

  getResolutionIcon(type: string): string {
    const icons: Record<string, string> = {
      'replacement': 'fa-solid fa-truck',
      'refund': 'fa-solid fa-money-bill-wave',
      'credit': 'fa-solid fa-gift',
      'discount': 'fa-solid fa-percentage'
    };
    return icons[type] || 'fa-solid fa-check';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE');
  }
}
