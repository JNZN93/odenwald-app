import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

interface OrderIssueVm {
  id: string;
  order_id: number;
  restaurant_id: number;
  reason: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  priority: 'low' | 'normal' | 'high';
  admin_notes?: string;
  assigned_to_restaurant_manager?: boolean;
  assigned_at?: string;
  restaurant_manager_notes?: string;
  created_at: string;
  order_type?: 'delivery' | 'pickup' | 'dine_in';
  order_payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  provider?: string;
  payment_status?: string;
}

@Component({
  selector: 'app-restaurant-manager-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="issues-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>Reklamationen</h1>
          <p>{{ 'issues.manage_complaints' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="loadIssues()" [disabled]="isLoading">
            <i class="fa-solid fa-rotate-right" [class.spin]="isLoading"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Issues List -->
      <div class="issues-section">
        <div class="issues-header">
          <h2>{{ issues.length }} Reklamation{{ issues.length !== 1 ? 'en' : '' }}</h2>
        </div>

        <div class="issues-list">
          <div *ngFor="let issue of issues" class="issue-card" [class]="getPriorityClass(issue.priority)">
            <div class="issue-header">
              <div class="issue-info">
                <div class="issue-id">#{{ issue.id.slice(-6) }}</div>
                <div class="issue-time">{{ formatIssueTime(issue.assigned_at || issue.created_at) }}</div>
              </div>
              <div class="issue-status">
                <span [ngClass]="getPriorityBadgeClass(issue.priority)" class="priority-badge">
                  {{ getPriorityLabel(issue.priority) }}
                </span>
                <span [ngClass]="getStatusClass(issue.status)" class="status-badge">
                  {{ getStatusLabel(issue.status) }}
                </span>
                <span *ngIf="getPaymentMethodLabel(issue)" [ngClass]="getPaymentMethodClass(issue)" class="payment-badge">
                  <i [class]="getPaymentMethodIcon(issue)"></i>
                  {{ getPaymentMethodLabel(issue) }}
                </span>
              </div>
            </div>

            <div class="issue-details">
              <div class="order-info">
                <div class="order-number">Bestellung #{{ issue.order_id }}</div>
              </div>

              <div class="issue-description-section">
                <div class="issue-reason">
                  <strong>{{ getReasonLabel(issue.reason) }}</strong>
                </div>
                <div class="issue-description">
                  {{ issue.description }}
                </div>
                <div *ngIf="issue.admin_notes" class="admin-notes">
                  <i class="fa-solid fa-user-tie"></i>
                  <span><strong>Admin:</strong> {{ issue.admin_notes }}</span>
                </div>
              </div>

              <div class="issue-actions">
                <div class="action-group">
                  <label class="action-label">Status:</label>
                  <select [ngModel]="issue.status" (ngModelChange)="updateIssueStatus(issue, $event)" class="action-select" [disabled]="updatingIssueId === issue.id">
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="resolved">{{ 'issues.resolved' | translate }}</option>
                  </select>
                </div>

                <div class="action-group notes-group">
                  <label class="action-label">Meine Notizen:</label>
                  <textarea
                    [ngModel]="issue.restaurant_manager_notes"
                    (ngModelChange)="updateNotes(issue, $event)"
                    [placeholder]="'issues.add_notes' | translate"
                    class="notes-textarea"
                    rows="3"
                    [disabled]="updatingIssueId === issue.id">
                  </textarea>
                </div>

                <!-- Resolution Actions -->
                <div class="resolution-actions" *ngIf="issue.status !== 'resolved'">
                  <button 
                    class="btn-refund" 
                    (click)="processRefund(issue)"
                    [disabled]="updatingIssueId === issue.id"
                    *ngIf="canRefund(issue)"
                  >
                    <i class="fa-solid fa-money-bill-wave"></i>
                    Geld zurück
                  </button>
                  <button 
                    class="btn-resolution" 
                    (click)="openResolutionModal(issue)"
                    [disabled]="updatingIssueId === issue.id"
                  >
                    <i class="fa-solid fa-gift"></i>
                    Andere Lösung
                  </button>
                </div>
              </div>

              <div class="loading-indicator" *ngIf="updatingIssueId === issue.id">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Aktualisiere...
              </div>
            </div>
          </div>

          <div *ngIf="issues.length === 0 && !isLoading" class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <h3>Keine Reklamationen</h3>
            <p>{{ 'issues.no_complaints' | translate }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div class="modal-overlay" *ngIf="showRefundModal" (click)="closeRefundModal()">
      <div class="modal-content refund-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ 'issues.process_refund' | translate }}</h2>
          <button class="close-btn" (click)="closeRefundModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="modal-body" *ngIf="!loadingRefundItems">
          <div class="order-info-box">
            <h3>Bestellung #{{ selectedIssueForRefund?.order_id }}</h3>
            <p class="issue-reason">{{ getReasonLabel(selectedIssueForRefund?.reason || '') }}</p>
          </div>

          <div class="refund-items-section">
            <h4>{{ 'issues.select_products' | translate }}</h4>
            
            <div class="items-list">
              <div class="item-row" *ngFor="let item of orderItems">
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-price">€{{ item.unit_price.toFixed(2) }} × {{ item.quantity }}</div>
                </div>
                
                <div class="item-controls">
                  <label>Zurückerstatten:</label>
                  <div class="quantity-selector">
                    <button 
                      class="qty-btn" 
                      (click)="updateRefundQuantity(item, item.refund_quantity - 1)"
                      [disabled]="item.refund_quantity === 0">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                    <input 
                      type="number" 
                      class="qty-input"
                      [(ngModel)]="item.refund_quantity"
                      (ngModelChange)="updateRefundQuantity(item, $event)"
                      [max]="item.quantity"
                      min="0">
                    <button 
                      class="qty-btn"
                      (click)="updateRefundQuantity(item, item.refund_quantity + 1)"
                      [disabled]="item.refund_quantity >= item.quantity">
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>
                  <div class="item-refund-amount">
                    = €{{ (item.unit_price * item.refund_quantity).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="refund-total-box">
              <div class="total-row">
                <span class="total-label">Rückerstattungsbetrag:</span>
                <span class="total-amount">€{{ refundTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-body loading-state" *ngIf="loadingRefundItems">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Lade Bestellpositionen...</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeRefundModal()">
            Abbrechen
          </button>
          <button 
            class="btn btn-warning" 
            (click)="processFullRefund()"
            [disabled]="loadingRefundItems">
            <i class="fa-solid fa-money-bill-wave"></i>
            Vollständige Rückerstattung
          </button>
          <button 
            class="btn btn-primary" 
            (click)="processPartialRefund()"
            [disabled]="loadingRefundItems || refundTotal === 0">
            <i class="fa-solid fa-check"></i>
            Teilrückerstattung (€{{ refundTotal.toFixed(2) }})
          </button>
        </div>
      </div>
    </div>

    <!-- Refund Result Modal -->
    <div class="modal-overlay" *ngIf="showRefundResultModal" (click)="closeRefundResultModal()">
      <div class="modal-content result-modal" (click)="$event.stopPropagation()">
        <div class="modal-header" [class.success]="refundResultSuccess" [class.error]="!refundResultSuccess">
          <div class="result-icon">
            <i class="fa-solid" [class.fa-check-circle]="refundResultSuccess" [class.fa-exclamation-circle]="!refundResultSuccess"></i>
          </div>
          <h2>{{ refundResultSuccess ? 'Rückerstattung erfolgreich' : 'Rückerstattung fehlgeschlagen' }}</h2>
        </div>

        <div class="modal-body">
          <div class="result-message">
            <p>{{ refundResultMessage }}</p>
          </div>

          <div class="result-details" *ngIf="refundResultSuccess && refundResultDetails">
            <div class="detail-row highlight">
              <span class="detail-label">Rückerstattungsbetrag:</span>
              <span class="detail-value amount">€{{ refundResultDetails.amount.toFixed(2) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Art:</span>
              <span class="detail-value">
                {{ refundResultDetails.type === 'partial' ? 'Teilrückerstattung' : 
                   refundResultDetails.type === 'full' ? 'Vollständige Rückerstattung' : 
                   'Manuelle Rückerstattung' }}
              </span>
            </div>

            <div class="detail-row" *ngIf="refundResultDetails.refund_id">
              <span class="detail-label">Referenz-ID:</span>
              <span class="detail-value small">{{ refundResultDetails.refund_id }}</span>
            </div>

            <div class="refunded-items-list" *ngIf="refundResultDetails.items && refundResultDetails.items.length > 0">
              <h4>Zurückerstattete Produkte:</h4>
              <div class="refunded-item" *ngFor="let item of refundResultDetails.items">
                <span class="item-quantity">{{ item.quantity }}x</span>
                <span class="item-details">à €{{ item.unit_price }}</span>
                <span class="item-total">= €{{ item.refund_amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="error-details" *ngIf="!refundResultSuccess">
            <div class="error-message">
              <i class="fa-solid fa-info-circle"></i>
              <p>Bitte überprüfen Sie die Bestellung und versuchen Sie es erneut. Bei anhaltenden Problemen kontaktieren Sie bitte den Support.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" [class.btn-primary]="refundResultSuccess" [class.btn-secondary]="!refundResultSuccess" (click)="closeRefundResultModal()">
            <i class="fa-solid fa-check"></i>
            OK
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issues-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-muted);
      margin: 0;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }


    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Issues Section */
    .issues-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .issues-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .issues-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    /* Issue Cards */
    .issue-card {
      border-bottom: 1px solid var(--color-border);
    }

    .issue-card:last-child {
      border-bottom: none;
    }

    .issue-card.priority-high {
      border-left: 4px solid var(--color-danger);
    }

    .issue-card.priority-normal {
      border-left: 4px solid var(--color-warning);
    }

    .issue-card.priority-low {
      border-left: 4px solid var(--color-success);
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--color-border);
    }

    .issue-info .issue-id {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .issue-info .issue-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .issue-status {
      display: flex;
      gap: var(--space-2);
    }

    .priority-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .priority-badge.priority-high {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
    }

    .priority-badge.priority-normal {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
    }

    .priority-badge.priority-low {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .status-badge.status-open {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
    }

    .status-badge.status-in_progress {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
    }

    .status-badge.status-resolved {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
    }

    .payment-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .payment-badge i {
      font-size: var(--text-xs);
    }

    .payment-badge.payment-cash {
      background: color-mix(in oklab, #10b981 12%, white);
      color: var(--color-heading);
      border-color: #10b981;
    }

    .payment-badge.payment-stripe {
      background: color-mix(in oklab, #635bff 12%, white);
      color: var(--color-heading);
      border-color: #635bff;
    }

    .payment-badge.payment-paypal {
      background: color-mix(in oklab, #0070ba 12%, white);
      color: var(--color-heading);
      border-color: #0070ba;
    }

    .payment-badge.payment-unknown {
      background: color-mix(in oklab, var(--color-gray-400) 12%, white);
      color: var(--color-muted);
    }

    .issue-details {
      padding: var(--space-6);
    }

    .order-info {
      margin-bottom: var(--space-4);
    }

    .order-number {
      font-weight: 600;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .issue-description-section {
      margin-bottom: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-primary-500);
    }

    .issue-reason {
      color: var(--color-heading);
      margin-bottom: var(--space-2);
      font-size: var(--text-lg);
    }

    .issue-description {
      color: var(--color-muted);
      line-height: 1.6;
      white-space: pre-line;
      margin-bottom: var(--space-3);
    }

    .admin-notes {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-info);
    }

    .admin-notes i {
      color: var(--color-info);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .admin-notes span {
      font-size: var(--text-sm);
      color: var(--color-muted);
      line-height: 1.4;
    }

    .issue-actions {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-6);
    }

    .action-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .action-label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .action-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
    }

    .action-select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .action-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notes-group {
      grid-column: 2;
    }

    .resolution-actions {
      grid-column: 1 / -1;
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-refund {
      background: var(--color-primary-500);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-right: var(--space-2);
    }

    .btn-refund:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-primary-500) 25%, transparent);
    }

    .btn-refund:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-resolution {
      background: var(--color-success-500);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-resolution:hover:not(:disabled) {
      background: var(--color-success-600);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-success-500) 25%, transparent);
    }

    .btn-resolution:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .notes-textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
      transition: all var(--transition);
      background: var(--color-surface);
      color: var(--color-text);
    }

    .notes-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .notes-textarea:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
      justify-content: center;
      padding: var(--space-4);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-12) var(--space-6);
      text-align: center;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      margin: 0;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--space-4);
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      max-width: 700px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      cursor: pointer;
      color: var(--color-muted);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
      overflow-y: auto;
      flex: 1;
    }

    .modal-body.loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      min-height: 300px;
      color: var(--color-muted);
    }

    .modal-body.loading-state i {
      font-size: 3rem;
    }

    .order-info-box {
      background: var(--bg-light-green);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border-left: 4px solid var(--color-primary-500);
      margin-bottom: var(--space-6);
    }

    .order-info-box h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .issue-reason {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .refund-items-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-4) 0;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .item-price {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .item-controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .item-controls label {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-muted);
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-1);
    }

    .qty-btn {
      background: none;
      border: none;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--radius-md);
      color: var(--color-primary-500);
      transition: all var(--transition);
    }

    .qty-btn:hover:not(:disabled) {
      background: var(--color-primary-50);
    }

    .qty-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .qty-input {
      width: 60px;
      text-align: center;
      border: none;
      font-weight: 600;
      font-size: var(--text-base);
      color: var(--color-text);
    }

    .qty-input:focus {
      outline: none;
    }

    .item-refund-amount {
      min-width: 80px;
      text-align: right;
      font-weight: 600;
      color: var(--color-primary-500);
    }

    .refund-total-box {
      background: var(--color-primary-50);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 2px solid var(--color-primary-500);
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .total-amount {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-primary-500);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn {
      padding: var(--space-3) var(--space-5);
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 600;
      font-size: var(--text-base);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--color-primary-500);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 209, 197, 0.3);
    }

    .btn-warning {
      background: var(--color-warning);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #e0a800;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--color-gray-200);
      color: var(--color-text);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-gray-300);
    }

    /* Result Modal Styles */
    .result-modal {
      max-width: 550px;
    }

    .result-modal .modal-header {
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-8) var(--space-6) var(--space-6);
    }

    .result-modal .modal-header.success {
      background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
      color: white;
    }

    .result-modal .modal-header.error {
      background: linear-gradient(135deg, var(--color-danger) 0%, #dc2626 100%);
      color: white;
    }

    .result-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .result-icon i {
      font-size: 3rem;
      color: white;
    }

    .result-modal .modal-header h2 {
      color: white;
      text-align: center;
    }

    .result-message {
      text-align: center;
      padding: var(--space-4) 0;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-4);
    }

    .result-message p {
      margin: 0;
      font-size: var(--text-lg);
      color: var(--color-text);
      font-weight: 500;
    }

    .result-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      border-radius: var(--radius-md);
      background: var(--color-gray-50);
    }

    .detail-row.highlight {
      background: var(--color-primary-50);
      border: 2px solid var(--color-primary-500);
      padding: var(--space-4);
    }

    .detail-label {
      font-weight: 600;
      color: var(--color-heading);
    }

    .detail-value {
      color: var(--color-text);
    }

    .detail-value.amount {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-primary-500);
    }

    .detail-value.small {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-family: monospace;
    }

    .refunded-items-list {
      margin-top: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-success);
    }

    .refunded-items-list h4 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--color-heading);
    }

    .refunded-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .refunded-item:last-child {
      border-bottom: none;
    }

    .item-quantity {
      font-weight: 600;
      color: var(--color-text);
      min-width: 40px;
    }

    .item-details {
      flex: 1;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .item-total {
      font-weight: 600;
      color: var(--color-success);
    }

    .error-details {
      padding: var(--space-4);
      background: #fef2f2;
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-danger);
    }

    .error-message {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .error-message i {
      color: var(--color-danger);
      font-size: var(--text-lg);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .error-message p {
      margin: 0;
      color: var(--color-text);
      line-height: 1.5;
    }

    .result-modal .modal-footer {
      justify-content: center;
    }

    .result-modal .modal-footer .btn {
      min-width: 150px;
      justify-content: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .issues-container {
        padding: var(--space-4) 0;
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .issue-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .issue-actions {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .notes-group {
        grid-column: 1;
      }

      .item-row {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .item-controls {
        width: 100%;
        justify-content: space-between;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class RestaurantManagerIssuesComponent implements OnInit {
  private http = inject(HttpClient);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private i18nService = inject(I18nService);

  issues: OrderIssueVm[] = [];
  isLoading = false;
  updatingIssueId: string | null = null;
  
  // Refund modal state
  showRefundModal = false;
  selectedIssueForRefund: OrderIssueVm | null = null;
  orderItems: any[] = [];
  loadingRefundItems = false;
  refundTotal = 0;
  
  // Refund result modal
  showRefundResultModal = false;
  refundResultSuccess = false;
  refundResultMessage = '';
  refundResultDetails: any = null;

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.isLoading = true;
    this.loadingService.start('issues');

    console.log('Loading assigned issues...');

    // Get current restaurant manager's restaurant ID
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        console.log('Managed restaurants:', restaurants);
        if (restaurants?.length > 0) {
          const restaurantId = restaurants[0].restaurant_id;
          console.log('Using restaurant ID:', restaurantId);
          console.log('API URL:', `${environment.apiUrl}/order-issues/restaurant/${restaurantId}`);

          this.http.get<OrderIssueVm[]>(`${environment.apiUrl}/order-issues/restaurant/${restaurantId}`).subscribe({
            next: (issues) => {
              console.log('Loaded issues:', issues);
              this.issues = issues;
              this.loadingService.stop('issues');
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error loading assigned issues:', error);
              this.toastService.error('Reklamationen laden', `API-Fehler: ${error.message || 'Unbekannter Fehler'}`);
              this.loadingService.stop('issues');
              this.isLoading = false;
            }
          });
        } else {
          console.warn('No managed restaurants found');
          this.loadingService.stop('issues');
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading restaurants:', error);
        this.toastService.error('Restaurant laden', `Fehler beim Laden des Restaurants: ${error.message || 'Unbekannter Fehler'}`);
        this.loadingService.stop('issues');
        this.isLoading = false;
      }
    });
  }


  updateIssueStatus(issue: OrderIssueVm, newStatus: OrderIssueVm['status']) {
    this.updatingIssueId = issue.id;

    this.http.patch<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}/restaurant-status`, {
      status: newStatus
    }).subscribe({
      next: (updated: OrderIssueVm) => {
        issue.status = updated.status;
        this.toastService.success('Status aktualisiert', `Reklamation wurde als "${this.getStatusLabel(newStatus)}" markiert`);
        this.updatingIssueId = null;
        
        // Trigger a page reload to update badge counts in the dashboard
        // This is a simple approach - in a more complex app you might use a service or event system
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (error: any) => {
        console.error('Error updating issue status:', error);
        this.toastService.error('Status aktualisieren', 'Fehler beim Aktualisieren des Status');
        this.updatingIssueId = null;
      }
    });
  }

  canRefund(issue: OrderIssueVm): boolean {
    // In real implementation, check if order was paid online via Stripe
    // For now, assume all orders can be refunded if they have a payment
    return true; // This would check payment_status === 'paid' and payment_method === 'stripe'
  }

  processRefund(issue: OrderIssueVm) {
    // Open refund modal instead of direct confirm
    this.openRefundModal(issue);
  }

  openRefundModal(issue: OrderIssueVm) {
    this.selectedIssueForRefund = issue;
    this.showRefundModal = true;
    this.loadingRefundItems = true;
    
    // Load order items
    this.http.get<any>(`${environment.apiUrl}/order-issues/${issue.id}/order-items`).subscribe({
      next: (response) => {
        this.orderItems = response.items.map((item: any) => ({
          ...item,
          refund_quantity: 0
        }));
        this.loadingRefundItems = false;
        this.calculateRefundTotal();
      },
      error: (error) => {
        console.error('Error loading order items:', error);
        this.toastService.error('Fehler', 'Bestellpositionen konnten nicht geladen werden');
        this.loadingRefundItems = false;
        this.showRefundModal = false;
      }
    });
  }

  closeRefundModal() {
    this.showRefundModal = false;
    this.selectedIssueForRefund = null;
    this.orderItems = [];
    this.refundTotal = 0;
  }

  calculateRefundTotal() {
    this.refundTotal = this.orderItems.reduce((total, item) => {
      return total + (item.unit_price * item.refund_quantity);
    }, 0);
  }

  updateRefundQuantity(item: any, quantity: number) {
    item.refund_quantity = Math.max(0, Math.min(quantity, item.quantity));
    this.calculateRefundTotal();
  }

  processPartialRefund() {
    if (!this.selectedIssueForRefund) return;

    // Store issue data before closing modal
    const issueId = this.selectedIssueForRefund.id;
    const issueReason = this.selectedIssueForRefund.reason;

    const refundItems = this.orderItems
      .filter(item => item.refund_quantity > 0)
      .map(item => ({
        order_item_id: item.id,
        quantity: item.refund_quantity,
        reason: `Reklamation: ${this.getReasonLabel(issueReason)}`
      }));

    if (refundItems.length === 0) {
      this.toastService.error('Fehler', 'Bitte wählen Sie mindestens ein Produkt aus');
      return;
    }

    this.updatingIssueId = issueId;
    this.closeRefundModal();

    this.http.post(`${environment.apiUrl}/order-issues/${issueId}/refund`, {
      refund_items: refundItems,
      refund_reason: `Reklamation: ${this.getReasonLabel(issueReason)}`
    }).subscribe({
      next: (response: any) => {
        this.showRefundResultModal = true;
        this.refundResultSuccess = true;
        this.refundResultMessage = 'Teilrückerstattung erfolgreich verarbeitet';
        this.refundResultDetails = {
          amount: response.refund_amount,
          type: response.refund_type,
          items: response.refunded_items,
          refund_id: response.refund_id
        };
        this.loadIssues();
        this.updatingIssueId = null;
      },
      error: (error: any) => {
        console.error('Error processing refund:', error);
        this.showRefundResultModal = true;
        this.refundResultSuccess = false;
        this.refundResultMessage = error.error?.error || 'Fehler beim Verarbeiten der Rückerstattung';
        this.refundResultDetails = null;
        this.updatingIssueId = null;
      }
    });
  }

  processFullRefund() {
    if (!this.selectedIssueForRefund) return;

    // Store issue data before closing modal
    const issueId = this.selectedIssueForRefund.id;
    const issueReason = this.selectedIssueForRefund.reason;

    this.updatingIssueId = issueId;
    this.closeRefundModal();

    this.http.post(`${environment.apiUrl}/order-issues/${issueId}/refund`, {
      refund_reason: `Reklamation: ${this.getReasonLabel(issueReason)}`
    }).subscribe({
      next: (response: any) => {
        this.showRefundResultModal = true;
        this.refundResultSuccess = true;
        this.refundResultMessage = 'Vollständige Rückerstattung erfolgreich verarbeitet';
        this.refundResultDetails = {
          amount: response.refund_amount,
          type: response.refund_type,
          refund_id: response.refund_id
        };
        this.loadIssues();
        this.updatingIssueId = null;
      },
      error: (error: any) => {
        console.error('Error processing refund:', error);
        this.showRefundResultModal = true;
        this.refundResultSuccess = false;
        this.refundResultMessage = error.error?.error || 'Fehler beim Verarbeiten der Rückerstattung';
        this.refundResultDetails = null;
        this.updatingIssueId = null;
      }
    });
  }

  closeRefundResultModal() {
    this.showRefundResultModal = false;
    this.refundResultSuccess = false;
    this.refundResultMessage = '';
    this.refundResultDetails = null;
  }

  openResolutionModal(issue: OrderIssueVm) {
    // Open resolution modal - in real implementation, this would open a modal
    // or navigate to resolution component
    console.log('Open resolution modal for issue:', issue.id);
    // For now, just show a placeholder message
    this.toastService.info('Resolution Modal', 'Resolution interface would open here');
  }

  updateNotes(issue: OrderIssueVm, notes: string) {
    this.updatingIssueId = issue.id;

    this.http.patch<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}/restaurant-notes`, {
      notes: notes
    }).subscribe({
      next: (updated: OrderIssueVm) => {
        issue.restaurant_manager_notes = updated.restaurant_manager_notes;
        this.toastService.success('Notizen gespeichert', 'Ihre Notizen wurden erfolgreich gespeichert');
        this.updatingIssueId = null;
      },
      error: (error: any) => {
        console.error('Error updating notes:', error);
        this.toastService.error('Notizen speichern', 'Fehler beim Speichern der Notizen');
        this.updatingIssueId = null;
      }
    });
  }

  formatIssueTime(dateString: string): string {
    if (!dateString) return 'Unbekanntes Datum';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ungültiges Datum';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min.`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `vor ${Math.floor(diffInMinutes / 60)} Std.`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityBadgeClass(priority: string): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      low: 'Niedrig',
      normal: 'Normal',
      high: 'Hoch'
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      resolved: 'Gelöst',
      dismissed: 'Verworfen'
    };
    return labels[status] || status;
  }

  getReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      cold_food: '🥶 Kaltes Essen',
      wrong_order: '❌ Falsche Bestellung',
      missing_items: '📦 Fehlende Artikel',
      late_delivery: '⏰ Zu späte Lieferung',
      poor_quality: '👎 Schlechte Qualität',
      other: '❓ Sonstiges'
    };
    return labels[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getPaymentMethodLabel(issue: OrderIssueVm): string {
    // Priorität: payment_method > provider > order_type fallback
    if (issue.payment_method) {
      const method = issue.payment_method.toLowerCase();
      if (method === 'cash') return 'Bar';
      if (method === 'stripe') return 'Stripe';
      if (method === 'paypal') return 'PayPal';
      return issue.payment_method;
    }
    
    if (issue.provider) {
      const provider = issue.provider.toLowerCase();
      if (provider === 'cash') return 'Bar';
      if (provider === 'stripe') return 'Stripe';
      if (provider === 'paypal') return 'PayPal';
      return issue.provider;
    }

    // Fallback: order_type
    if (issue.order_type === 'dine_in' && issue.order_payment_status === 'pending') {
      return 'Bar (ausstehend)';
    }

    return '';
  }

  getPaymentMethodClass(issue: OrderIssueVm): string {
    const method = (issue.payment_method || issue.provider || '').toLowerCase();
    if (method === 'cash') return 'payment-cash';
    if (method === 'stripe') return 'payment-stripe';
    if (method === 'paypal') return 'payment-paypal';
    return 'payment-unknown';
  }

  getPaymentMethodIcon(issue: OrderIssueVm): string {
    const method = (issue.payment_method || issue.provider || '').toLowerCase();
    if (method === 'cash') return 'fa-solid fa-money-bill';
    if (method === 'stripe' || method === 'paypal') return 'fa-solid fa-credit-card';
    return 'fa-solid fa-question';
  }
}
