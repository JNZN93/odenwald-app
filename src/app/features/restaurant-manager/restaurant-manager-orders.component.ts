import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { OrdersService, Order } from '../../core/services/orders.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { OrderEditModalComponent } from './order-edit-modal.component';

type CanonicalStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'served' | 'paid' | 'cancelled';

@Component({
  selector: 'app-restaurant-manager-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, OrderEditModalComponent],
  template: `
    <div class="orders-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>{{ 'orders.title' | translate }}</h1>
          <p>{{ 'orders.manage_description' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="refreshOrders()" [disabled]="isLoading">
            <i class="fa-solid fa-rotate-right" [class.spin]="isLoading"></i>
            {{ 'common.refresh' | translate }}
          </button>
        </div>
      </div>

      <!-- Order Tabs -->
      <div class="order-tabs">
        <button
          *ngFor="let tab of orderTabs"
          [class.active]="activeTab === tab.id"
          (click)="switchTab(tab.id)"
          class="tab-button"
        >
          <i [ngClass]="tab.icon"></i>
          <span>{{ tab.titleKey | translate }}</span>
          <span class="tab-badge" [ngClass]="getBadgeClass(tab.id)">{{ tabCounts[tab.id] || 0 }}</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group" *ngIf="activeTab === 'all'">
            <label for="status-filter">{{ 'orders.status' | translate }}:</label>
            <select id="status-filter" [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="all">{{ 'orders.all_status' | translate }}</option>
              <option value="pending">{{ 'order.status.pending' | translate }}</option>
              <option value="confirmed">{{ 'order.status.confirmed' | translate }}</option>
              <option value="preparing">{{ 'order.status.preparing' | translate }}</option>
              <option value="ready">{{ 'order.status.ready' | translate }}</option>
              <option value="picked_up">{{ 'order.status.picked_up' | translate }}</option>
              <option value="delivered">{{ 'order.status.delivered' | translate }}</option>
              <option value="cancelled">{{ 'order.status.cancelled' | translate }}</option>
              <option value="payment_pending">{{ 'orders.payment_pending' | translate }}</option>
              <option value="ready_pickup">{{ 'orders.ready_pickup' | translate }}</option>
              <option value="fully_completed">{{ 'orders.fully_completed' | translate }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="search-filter">{{ 'common.search' | translate }}:</label>
            <input
              id="search-filter"
              type="text"
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              [placeholder]="'orders.search_placeholder' | translate"
            >
          </div>

          <div class="filter-group">
            <label for="sort-filter">{{ 'orders.sort_by' | translate }}:</label>
            <select id="sort-filter" [(ngModel)]="sortBy" (change)="applyFilters()">
              <option value="newest">{{ 'orders.newest_first' | translate }}</option>
              <option value="oldest">{{ 'orders.oldest_first' | translate }}</option>
              <option value="total_high">{{ 'orders.highest_amount' | translate }}</option>
              <option value="total_low">{{ 'orders.lowest_amount' | translate }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="orders-section">
        <div class="orders-header">
          <h2>{{ filteredOrders.length }} {{ (activeTab === 'all' ? 'orders.orders_found' : (activeTab === 'completed' ? 'orders.completed_orders_found' : 'orders.orders_found')) | translate }}</h2>
        </div>

        <!-- Desktop Table View -->
        <div class="orders-table-container desktop-only" *ngIf="filteredOrders.length > 0">
          <table class="orders-table">
            <thead>
              <tr>
                <th class="col-order-id">{{ 'orders.order' | translate }}</th>
                <th class="col-customer">{{ 'orders.customer' | translate }}</th>
                <th class="col-order-status">{{ 'orders.order_status' | translate }}</th>
                <th class="col-payment-status">{{ 'orders.payment' | translate }}</th>
                <th class="col-total">{{ 'orders.total' | translate }}</th>
                <th class="col-order-type">{{ 'orders.type' | translate }}</th>
                <th class="col-address">{{ 'orders.address' | translate }}</th>
                <th class="col-actions">{{ 'orders.actions' | translate }}</th>
                <th class="col-details">{{ 'orders.details' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredOrders" class="order-row" [class.paid-pending]="order.payment_status === 'paid' && order.status === 'pending'">
                <td class="col-order-id">
                  <div class="order-id">#{{ order.id.slice(-6) }}</div>
                  <div class="order-time-mobile">{{ formatOrderTime(order.created_at) }}</div>
                </td>
                <td class="col-customer">
                  <div class="customer-name">
                    <span [ngClass]="getUserTypeClass(order.user_id)" class="user-type-badge">
                      {{ getUserTypeText(order.user_id) }}
                    </span>
                    {{ order.customer_name }}
                  </div>
                  <div class="customer-email">{{ order.customer_email }}</div>
                </td>
                <td class="col-order-status">
                  <span [ngClass]="getOrderStatusClass(order.status)" class="status-badge">
                    {{ getOrderStatusText(order.status) }}
                  </span>
                </td>
                <td class="col-payment-status">
                  <span *ngIf="order.payment_status === 'paid'" class="payment-indicator">
                    <i class="fa-solid fa-credit-card"></i>
                    {{ 'orders.paid' | translate }}
                  </span>
                  <span *ngIf="order.payment_status === 'pending'" class="payment-indicator temp">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    {{ 'orders.payment_pending' | translate }}
                  </span>
                  <!-- Warnung für fast abgeschlossene Bestellungen ohne Zahlung -->
                  <span *ngIf="isOrderStatusCompleteButNotPaid(order)" class="payment-warning">
                    <i class="fa-solid fa-exclamation-circle"></i>
                    {{ 'orders.almost_ready_payment_missing' | translate }}
                  </span>
                </td>
                <td class="col-total">
                  <div class="total-amount">€{{ order.total_price.toFixed(2) }}</div>
                  <div class="item-count">{{ order.items.length }} {{ 'orders.items' | translate }}</div>
                </td>
                <td class="col-order-type">
                  <div class="order-type-badge" [ngClass]="getOrderTypeClass(order)">
                    <i [ngClass]="getOrderTypeIcon(order)"></i>
                    <span>{{ getOrderTypeText(order) | translate }}</span>
                  </div>
                </td>
                <td class="col-address">
                  <div class="delivery-address" *ngIf="order.delivery_address">{{ order.delivery_address }}</div>
                  <div class="no-address" *ngIf="!order.delivery_address">{{ 'orders.no_address' | translate }}</div>
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <!-- Status Action Buttons - Always visible in same positions -->
                    <button
                      class="action-btn confirm"
                      [class.hidden]="!canUpdateStatus(order.status, 'confirmed', order)"
                      (click)="canUpdateStatus(order.status, 'confirmed', order) ? updateOrderStatus(order.id, 'confirmed') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'confirmed', order)"
                      [title]="'orders.confirm' | translate"
                    >
                      <i class="fa-solid fa-check"></i>
                    </button>

                    <button
                      class="action-btn prepare"
                      [class.hidden]="!canUpdateStatus(order.status, 'preparing', order)"
                      (click)="canUpdateStatus(order.status, 'preparing', order) ? updateOrderStatus(order.id, 'preparing') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'preparing', order)"
                      [title]="'orders.prepare' | translate"
                    >
                      <i class="fa-solid fa-utensils"></i>
                    </button>

                    <button
                      class="action-btn ready"
                      [class.hidden]="!canUpdateStatus(order.status, 'ready', order)"
                      (click)="canUpdateStatus(order.status, 'ready', order) ? updateOrderStatus(order.id, 'ready') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'ready', order)"
                      [title]="'orders.ready' | translate"
                    >
                      <i class="fa-solid fa-check-circle"></i>
                    </button>

                    <button
                      class="action-btn pickup"
                      [class.hidden]="!canUpdateStatus(order.status, 'picked_up', order)"
                      (click)="canUpdateStatus(order.status, 'picked_up', order) ? updateOrderStatus(order.id, 'picked_up') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'picked_up', order)"
                      [title]="'orders.picked_up' | translate"
                    >
                      <i class="fa-solid fa-box"></i>
                    </button>

                    <button
                      class="action-btn deliver"
                      [class.hidden]="!canUpdateStatus(order.status, 'delivered', order)"
                      (click)="canUpdateStatus(order.status, 'delivered', order) ? updateOrderStatus(order.id, 'delivered') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'delivered', order)"
                      [title]="'orders.delivered' | translate"
                    >
                      <i class="fa-solid fa-truck"></i>
                    </button>

                    <!-- Served Button - Only for table orders -->
                    <button
                      class="action-btn served"
                      [class.hidden]="!canUpdateStatus(order.status, 'served', order)"
                      (click)="canUpdateStatus(order.status, 'served', order) ? updateOrderStatus(order.id, 'served') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'served', order)"
                      [title]="'orders.served' | translate"
                    >
                      <i class="fa-solid fa-utensils"></i>
                    </button>

                    <!-- Paid Button - Only for table orders -->
                    <button
                      class="action-btn paid"
                      [class.hidden]="!canUpdateStatus(order.status, 'paid', order)"
                      (click)="canUpdateStatus(order.status, 'paid', order) ? updateOrderStatus(order.id, 'paid') : null"
                      [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'paid', order)"
                      [title]="'orders.paid' | translate"
                    >
                      <i class="fa-solid fa-credit-card"></i>
                    </button>

                    <!-- Payment Button - Only visible when not paid and not in table order flow -->
                    <button
                      class="action-btn payment"
                      *ngIf="order.payment_status === 'pending' && !canUpdateStatus(order.status, 'paid', order)"
                      (click)="markOrderAsPaid(order.id)"
                      [disabled]="updatingOrderId === order.id"
                      [title]="'orders.mark_as_paid' | translate"
                    >
                      <i class="fa-solid fa-credit-card"></i>
                    </button>

                    <!-- Cancel Button -->
                    <button
                      class="action-btn cancel"
                      [class.hidden]="!canCancelOrder(order.status)"
                      (click)="canCancelOrder(order.status) ? cancelOrder(order.id) : null"
                      [disabled]="updatingOrderId === order.id || !canCancelOrder(order.status)"
                      [title]="'orders.cancel' | translate"
                    >
                      <i class="fa-solid fa-times"></i>
                    </button>

                    <!-- Edit Button -->
                    <button
                      *ngIf="canEditOrder(order.status)"
                      class="action-btn edit"
                      (click)="openEditModal(order)"
                      [disabled]="updatingOrderId === order.id"
                      [title]="'orders.edit' | translate"
                    >
                      <i class="fa-solid fa-edit"></i>
                    </button>

                  </div>
                  <div class="loading-indicator" *ngIf="updatingOrderId === order.id">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                  </div>
                </td>
                <td class="col-details">
                  <button
                    class="action-btn details"
                    [class.has-notes]="order.notes"
                    (click)="openDetailsModal(order)"
                    [title]="order.notes ? ('orders.show_details_with_notes' | translate) : ('orders.show_details' | translate)"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="orders-list mobile-only">
          <div *ngFor="let order of filteredOrders" class="order-card" [class.paid-pending]="order.payment_status === 'paid' && order.status === 'pending'">
            <div class="order-header">
              <div class="order-info">
                <div class="order-number">#{{ order.id.slice(-6) }}</div>
                <div class="order-time">{{ formatOrderTime(order.created_at) }}</div>
              </div>
              <div class="order-status">
                <span [ngClass]="getOrderStatusClass(order.status)" class="status-badge">
                  {{ getOrderStatusText(order.status) }}
                </span>
                <span *ngIf="order.payment_status === 'paid'" class="payment-indicator">
                  <i class="fa-solid fa-credit-card"></i>
                  Bezahlt
                </span>
                <span *ngIf="order.payment_status === 'pending'" class="payment-indicator temp">
                  <i class="fa-solid fa-exclamation-triangle"></i>
                  Zahlung ausstehend
                </span>
                <!-- Warnung für fast abgeschlossene Bestellungen ohne Zahlung -->
                <span *ngIf="isOrderStatusCompleteButNotPaid(order)" class="payment-warning">
                  <i class="fa-solid fa-exclamation-circle"></i>
                  Fast fertig - Zahlung fehlt
                </span>
              </div>
            </div>

            <div class="order-details">
              <div class="customer-info">
                <div class="customer-name">
                  <span [ngClass]="getUserTypeClass(order.user_id)" class="user-type-badge">
                    {{ getUserTypeText(order.user_id) }}
                  </span>
                  {{ order.customer_name }}
                </div>
                <div class="customer-email">{{ order.customer_email }}</div>
                <div class="order-type-info">
                  <div class="order-type-badge mobile" [ngClass]="getOrderTypeClass(order)">
                    <i [ngClass]="getOrderTypeIcon(order)"></i>
                    <span>{{ getOrderTypeText(order) | translate }}</span>
                  </div>
                </div>
                <div class="delivery-address" *ngIf="order.delivery_address">{{ order.delivery_address }}</div>
              </div>

              <div class="order-items">
                <div *ngFor="let item of order.items" class="order-item">
                  <div class="item-main">
                    <span class="item-quantity">{{ item.quantity }}x</span>
                    <div class="item-details">
                      <span class="item-name">{{ item.name }}</span>
                      <!-- Show selected variants inline -->
                      <span class="item-variants-inline" *ngIf="item.selected_variant_options && item.selected_variant_options.length > 0">
                        ({{ getVariantSummary(item.selected_variant_options) }})
                      </span>
                    </div>
                    <span class="item-price">€{{ item.total_price.toFixed(2) }}</span>
                  </div>
                  
                  <!-- Item Special Instructions (Mobile) -->
                  <div class="item-special-instructions-mobile" *ngIf="item.special_instructions">
                    <div class="special-instructions-header-mobile">
                      <i class="fa-solid fa-sticky-note"></i>
                      <span class="special-instructions-label-mobile">Spezielle Anweisungen:</span>
                    </div>
                    <div class="special-instructions-content-mobile">
                      {{ item.special_instructions }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="order-summary">
                <div class="order-total">
                  <span class="total-label">Gesamt:</span>
                  <span class="total-amount">€{{ order.total_price.toFixed(2) }}</span>
                </div>
              </div>

              <!-- Order Notes Section -->
              <div class="order-notes-section" *ngIf="order.notes || order.delivery_instructions">
                <div class="notes-header">
                  <h4>Hinweise</h4>
                </div>
                <div class="notes-content">
                  <div *ngIf="order.delivery_instructions" class="delivery-notes">
                    <i class="fa-solid fa-map-marker-alt"></i>
                    <span>{{ order.delivery_instructions }}</span>
                  </div>
                  <div *ngIf="order.notes" class="order-notes">
                    <i class="fa-solid fa-sticky-note"></i>
                    <span>{{ order.notes }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <div class="action-buttons">
                <!-- Status Action Buttons - Always visible in same positions -->
                <button
                  class="action-btn confirm"
                  [class.hidden]="!canUpdateStatus(order.status, 'confirmed', order)"
                  (click)="canUpdateStatus(order.status, 'confirmed', order) ? updateOrderStatus(order.id, 'confirmed') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'confirmed', order)"
                >
                  <i class="fa-solid fa-check"></i>
                  {{ 'orders.confirm' | translate }}
                </button>

                <button
                  class="action-btn prepare"
                  [class.hidden]="!canUpdateStatus(order.status, 'preparing', order)"
                  (click)="canUpdateStatus(order.status, 'preparing', order) ? updateOrderStatus(order.id, 'preparing') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'preparing', order)"
                >
                  <i class="fa-solid fa-utensils"></i>
                  {{ 'orders.prepare' | translate }}
                </button>

                <button
                  class="action-btn ready"
                  [class.hidden]="!canUpdateStatus(order.status, 'ready', order)"
                  (click)="canUpdateStatus(order.status, 'ready', order) ? updateOrderStatus(order.id, 'ready') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'ready', order)"
                >
                  <i class="fa-solid fa-check-circle"></i>
                  Fertig
                </button>

                <button
                  class="action-btn pickup"
                  [class.hidden]="!canUpdateStatus(order.status, 'picked_up', order)"
                  (click)="canUpdateStatus(order.status, 'picked_up', order) ? updateOrderStatus(order.id, 'picked_up') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'picked_up', order)"
                >
                  <i class="fa-solid fa-box"></i>
                  Abgeholt
                </button>

                <button
                  class="action-btn deliver"
                  [class.hidden]="!canUpdateStatus(order.status, 'delivered', order)"
                  (click)="canUpdateStatus(order.status, 'delivered', order) ? updateOrderStatus(order.id, 'delivered') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'delivered', order)"
                >
                  <i class="fa-solid fa-truck"></i>
                  Geliefert
                </button>

                <!-- Served Button - Only for table orders -->
                <button
                  class="action-btn served"
                  [class.hidden]="!canUpdateStatus(order.status, 'served', order)"
                  (click)="canUpdateStatus(order.status, 'served', order) ? updateOrderStatus(order.id, 'served') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'served', order)"
                >
                  <i class="fa-solid fa-utensils"></i>
                  Serviert
                </button>

                <!-- Paid Button - Only for table orders -->
                <button
                  class="action-btn paid"
                  [class.hidden]="!canUpdateStatus(order.status, 'paid', order)"
                  (click)="canUpdateStatus(order.status, 'paid', order) ? updateOrderStatus(order.id, 'paid') : null"
                  [disabled]="updatingOrderId === order.id || !canUpdateStatus(order.status, 'paid', order)"
                >
                  <i class="fa-solid fa-credit-card"></i>
                  Bezahlt
                </button>

                <!-- Payment Button - Only visible when not paid and not in table order flow -->
                <button
                  class="action-btn payment"
                  *ngIf="order.payment_status === 'pending' && !canUpdateStatus(order.status, 'paid', order)"
                  (click)="markOrderAsPaid(order.id)"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-credit-card"></i>
                  Als bezahlt markieren
                </button>

                <!-- Cancel Button -->
                <button
                  class="action-btn cancel"
                  [class.hidden]="!canCancelOrder(order.status)"
                  (click)="canCancelOrder(order.status) ? cancelOrder(order.id) : null"
                  [disabled]="updatingOrderId === order.id || !canCancelOrder(order.status)"
                >
                  <i class="fa-solid fa-times"></i>
                  {{ 'orders.cancel' | translate }}
                </button>

                <!-- Edit Button -->
                <button
                  *ngIf="canEditOrder(order.status)"
                  class="action-btn edit"
                  (click)="openEditModal(order)"
                  [disabled]="updatingOrderId === order.id"
                >
                  <i class="fa-solid fa-edit"></i>
                  Bearbeiten
                </button>
              </div>

              <div class="loading-indicator" *ngIf="updatingOrderId === order.id">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Aktualisiere...
              </div>
            </div>
          </div>

          <div *ngIf="filteredOrders.length === 0" class="empty-state">
            <i class="fa-solid fa-shopping-cart"></i>
            <h3>Keine Bestellungen gefunden</h3>
            <p>Es gibt keine Bestellungen mit den aktuellen Filtereinstellungen.</p>
          </div>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div class="details-modal-overlay" *ngIf="detailsModalOpen" (click)="closeDetailsModal()">
        <div class="details-modal" (click)="$event.stopPropagation()">
          <div class="details-modal-header">
            <h3>{{ 'orders.order_number' | translate }}{{ selectedOrder?.id?.slice(-6) || ('orders.unknown' | translate) }}</h3>
            <button class="close-btn" (click)="closeDetailsModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="details-modal-body" *ngIf="selectedOrder">
            <!-- Order Header Info -->
            <div class="order-summary-section">
              <div class="order-summary-grid">
                <div class="summary-item">
                  <label>{{ 'orders.customer_label' | translate }}</label>
                  <span>{{ selectedOrder.customer_name }}</span>
                </div>
                <div class="summary-item">
                  <label>{{ 'orders.email_label' | translate }}</label>
                  <span>{{ selectedOrder.customer_email }}</span>
                </div>
                <div class="summary-item">
                  <label>{{ 'orders.ordered_at' | translate }}</label>
                  <span>{{ formatOrderTime(selectedOrder.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Delivery Address -->
            <div class="delivery-section" *ngIf="selectedOrder.delivery_address">
              <h4>{{ 'orders.delivery_address' | translate }}</h4>
              <div class="address-info">
                <i class="fa-solid fa-map-marker-alt"></i>
                <span>{{ selectedOrder.delivery_address }}</span>
              </div>
              <div class="delivery-instructions" *ngIf="selectedOrder.delivery_instructions">
                <i class="fa-solid fa-info-circle"></i>
                <span>{{ selectedOrder.delivery_instructions }}</span>
              </div>
            </div>

            <!-- Order Items -->
            <div class="items-section">
              <h4>{{ 'orders.ordered_items' | translate }}</h4>
              <div class="order-items-list">
                <div *ngFor="let item of selectedOrder.items" class="detail-order-item">
                  <div class="item-header">
                    <div class="item-main-info">
                      <span class="item-quantity">{{ item.quantity }}x</span>
                      <div class="item-details">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-variants" *ngIf="item.selected_variant_options && item.selected_variant_options.length > 0">
                          ({{ getVariantSummary(item.selected_variant_options) }})
                        </span>
                      </div>
                    </div>
                    <span class="item-price">€{{ item.total_price.toFixed(2) }}</span>
                  </div>
                  
                  <!-- Item Special Instructions -->
                  <div class="item-special-instructions" *ngIf="item.special_instructions">
                    <div class="special-instructions-header">
                      <i class="fa-solid fa-sticky-note"></i>
                      <span class="special-instructions-label">{{ 'orders.special_instructions' | translate }}</span>
                    </div>
                    <div class="special-instructions-content">
                      {{ item.special_instructions }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Total -->
            <div class="total-section">
              <div class="total-breakdown">
                <div class="total-row">
                  <span class="total-label">{{ 'orders.subtotal' | translate }}</span>
                  <span class="total-amount">€{{ (selectedOrder.total_price - (selectedOrder.delivery_fee || 0)).toFixed(2) }}</span>
                </div>
                <div class="total-row" *ngIf="selectedOrder.delivery_fee">
                  <span class="total-label">{{ 'orders.delivery_fee' | translate }}:</span>
                  <span class="total-amount">€{{ selectedOrder.delivery_fee.toFixed(2) }}</span>
                </div>
                <div class="total-row final">
                  <span class="total-label">{{ 'orders.total' | translate }}</span>
                  <span class="total-amount">€{{ selectedOrder.total_price.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Order Notes Section -->
            <div class="notes-section">
              <div class="notes-header">
                <h4>{{ 'orders.notes' | translate }}</h4>
                <button
                  class="edit-notes-btn"
                  (click)="toggleNotesEdit()"
                  [title]="editingNotes ? ('orders.cancel_editing' | translate) : (selectedOrder.notes ? ('orders.edit_notes' | translate) : ('orders.add_notes' | translate))"
                >
                  <i [ngClass]="editingNotes ? 'fa-solid fa-times' : (selectedOrder.notes ? 'fa-solid fa-edit' : 'fa-solid fa-plus')"></i>
                </button>
              </div>
              
              <!-- Display Notes -->
              <div *ngIf="!editingNotes && selectedOrder.notes" class="order-notes">
                <i class="fa-solid fa-sticky-note"></i>
                <span>{{ selectedOrder.notes }}</span>
              </div>
              
              <!-- No Notes Message -->
              <div *ngIf="!editingNotes && !selectedOrder.notes" class="no-notes">
                <i class="fa-solid fa-info-circle"></i>
                <span>{{ 'orders.no_notes_add' | translate }}</span>
              </div>
              
              <!-- Edit Notes Form -->
              <div *ngIf="editingNotes" class="notes-edit-form">
                <div class="form-group">
                  <label for="notes-textarea">{{ 'orders.additional_notes' | translate }}</label>
                  <textarea
                    id="notes-textarea"
                    [(ngModel)]="notesText"
                    [placeholder]="'orders.notes_placeholder' | translate"
                    rows="4"
                    maxlength="1000">
                  </textarea>
                  <small class="character-count">{{ notesText.length }}/1000</small>
                </div>
                <div class="notes-actions">
                  <button class="cancel-btn" (click)="cancelNotesEdit()">{{ 'common.cancel' | translate }}</button>
                  <button
                    class="save-btn"
                    (click)="saveNotesInline()"
                    [disabled]="savingNotes || !notesText.trim()"
                    [class.loading]="savingNotes">
                    <i class="fa-solid fa-save" *ngIf="!savingNotes"></i>
                    <i class="fa-solid fa-spinner fa-spin" *ngIf="savingNotes"></i>
                    {{ selectedOrder.notes ? ('orders.update' | translate) : ('orders.add' | translate) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Modal -->
      <div class="notes-modal-overlay" *ngIf="notesModalOpen" (click)="closeNotesModal()">
        <div class="notes-modal" (click)="$event.stopPropagation()">
          <div class="notes-modal-header">
            <h3>{{ editingOrder?.notes ? ('orders.edit_notes' | translate) : ('orders.add_notes' | translate) }}</h3>
            <button class="close-btn" (click)="closeNotesModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="notes-modal-body">
            <div class="form-group">
              <label for="notes-textarea">{{ 'orders.additional_notes' | translate }}</label>
              <textarea
                id="notes-textarea"
                [(ngModel)]="notesText"
                [placeholder]="'orders.notes_placeholder' | translate"
                rows="4"
                maxlength="1000">
              </textarea>
              <small class="character-count">{{ notesText.length }}/1000</small>
            </div>
            <div class="notes-modal-info" *ngIf="!editingOrder?.notes">
              <i class="fa-solid fa-info-circle"></i>
              <span>{{ 'orders.notes_warning' | translate }}</span>
            </div>
          </div>
          <div class="notes-modal-footer">
            <button class="cancel-btn" (click)="closeNotesModal()">{{ 'common.cancel' | translate }}</button>
            <button
              class="save-btn"
              (click)="saveNotes()"
              [disabled]="savingNotes || !notesText.trim()"
              [class.loading]="savingNotes">
              <i class="fa-solid fa-save" *ngIf="!savingNotes"></i>
              <i class="fa-solid fa-spinner fa-spin" *ngIf="savingNotes"></i>
              {{ editingOrder?.notes ? ('orders.update' | translate) : ('orders.add' | translate) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Edit Modal -->
    <app-order-edit-modal
      [isOpen]="isEditModalOpen"
      [order]="editSelectedOrder"
      (closed)="closeEditModal()"
      (orderUpdated)="onOrderUpdated($event)"
    ></app-order-edit-modal>
  `,
  styles: [`
    .orders-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    /* Order Tabs */
    .order-tabs {
      display: flex;
      gap: var(--space-1);
      margin-bottom: var(--space-6);
      padding: var(--space-3);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      background: var(--color-gray-50);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-text);
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tab-button:hover {
      background: var(--color-gray-100);
      border-color: var(--color-gray-300);
      transform: translateY(-1px);
    }

    .tab-button.active {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .tab-button.active:hover {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .tab-button i {
      font-size: var(--text-sm);
    }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: #dc2626;
      color: white;
      border-radius: 9px;
      font-size: 10px;
      font-weight: 700;
      margin-left: var(--space-1);
      border: 1px solid #b91c1c;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Badge color variations */
    .tab-badge.badge-all {
      background: #6b7280;
      border-color: #4b5563;
    }

    .tab-badge.badge-completed {
      background: #059669;
      border-color: #047857;
    }

    /* All other badges remain red (default) */

    .tab-button.active .tab-badge {
      background: #1f2937 !important;
      color: white;
      border: 1px solid #374151 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .tab-badge:empty {
      display: none;
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

    /* Filters */
    .filters-section {
      margin-bottom: var(--space-6);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .filter-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .filter-group select,
    .filter-group input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    /* Orders Section */
    .orders-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .orders-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .orders-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    /* Order Cards */
    .order-card {
      border-bottom: 1px solid var(--color-border);
    }

    .order-card:last-child {
      border-bottom: none;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--color-border);
    }

    /* Ensure consistent inline order of status + payment indicators */
    .order-status {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: nowrap;
    }
    .order-status .status-badge { order: 1; }
    .order-status .payment-indicator { order: 2; }

    /* Highlight paid pending orders */
    .order-card.paid-pending .order-header {
      background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-success-50) 100%);
      border-left: 4px solid var(--color-success);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .order-info .order-number {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .order-info .order-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending { background: var(--color-warning-50); color: var(--color-warning); }
    .status-badge.confirmed { background: var(--color-info-50); color: var(--color-info); }

    .payment-indicator {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      margin-left: var(--space-2);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .payment-indicator:not(.temp) {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .payment-indicator.temp {
      background: var(--color-warning-50);
      color: var(--color-warning);
      border: 1px solid var(--color-warning-200);
    }

    .payment-warning {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--color-danger-50);
      color: var(--color-danger);
      border: 1px solid var(--color-danger-200);
      text-transform: uppercase;
      margin-left: var(--space-1);
    }
    .status-badge.preparing { background: var(--color-primary-50); color: var(--color-primary-600); }
    .status-badge.ready { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.picked_up { background: var(--color-accent-50); color: var(--color-accent-600); }
    .status-badge.delivered { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.served { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.paid { background: var(--color-success-50); color: var(--color-success); }
    .status-badge.cancelled { background: var(--color-danger-50); color: var(--color-danger); }

    .order-details {
      padding: var(--space-6);
    }

    .customer-info {
      margin-bottom: var(--space-4);
    }

    .customer-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .customer-email,
    .delivery-address {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }


    .order-items {
      margin-bottom: var(--space-4);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      font-size: var(--text-sm);
    }

    .item-quantity {
      font-weight: 600;
      color: var(--color-primary-600);
      min-width: 40px;
    }


    .item-price {
      font-weight: 600;
      color: var(--color-text);
    }

    .item-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin: 0 var(--space-2);
    }

    .item-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .item-variants-inline {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
      margin-top: 2px;
    }

    .order-summary {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .order-total {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .total-label {
      font-weight: 600;
      color: var(--color-text);
    }

    .total-amount {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
    }

    .order-actions {
      padding: var(--space-4) var(--space-6);
      background: var(--bg-light);
      border-top: 1px solid var(--color-border);
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
      justify-content: flex-start;
      align-items: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .action-btn.confirm {
      border-color: var(--color-info-500);
      color: var(--color-info-600);
      background: white;
    }

    .action-btn.confirm:hover {
      background: var(--color-info-50);
    }

    .action-btn.prepare {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
      background: white;
    }

    .action-btn.prepare:hover {
      background: var(--color-primary-50);
    }

    .action-btn.ready {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.ready:hover {
      background: var(--color-success-50);
    }

    .action-btn.pickup {
      border-color: var(--color-accent-500);
      color: var(--color-accent-600);
      background: white;
    }

    .action-btn.pickup:hover {
      background: var(--color-accent-50);
    }

    .action-btn.deliver {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.deliver:hover {
      background: var(--color-success-50);
    }

    .action-btn.served {
      border-color: var(--color-info-500);
      color: var(--color-info);
      background: white;
    }

    .action-btn.served:hover {
      background: var(--color-info-50);
    }

    .action-btn.paid {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.paid:hover {
      background: var(--color-success-50);
    }

    .action-btn.cancel {
      border-color: var(--color-danger-500);
      color: var(--color-danger);
      background: white;
    }

    .action-btn.cancel:hover {
      background: var(--color-danger-50);
    }

    .action-btn.edit {
      border-color: var(--color-primary-500);
      color: var(--color-primary);
      background: white;
    }

    .action-btn.edit:hover {
      background: var(--color-primary-50);
    }

    .action-btn.payment {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .action-btn.payment:hover {
      background: var(--color-success-50);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.hidden {
      display: none;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    /* Order Notes Section */
    .order-notes-section {
      margin-top: var(--space-4);
      padding: var(--space-4);
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .notes-header h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .add-notes-btn, .edit-notes-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-primary-500);
      background: white;
      color: var(--color-primary-600);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      font-size: var(--text-sm);
    }

    .add-notes-btn:hover, .edit-notes-btn:hover {
      background: var(--color-primary-50);
      transform: translateY(-1px);
    }

    .notes-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .delivery-notes, .order-notes {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-2);
      background: white;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .delivery-notes i, .order-notes i {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .delivery-notes {
      border-left: 3px solid var(--color-info);
    }

    .order-notes {
      border-left: 3px solid var(--color-warning);
      position: relative;
    }

    .order-notes .edit-notes-btn {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      width: 24px;
      height: 24px;
      font-size: var(--text-xs);
    }

    /* Notes Modal */
    .notes-modal-overlay {
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

    .notes-modal {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .notes-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .notes-modal-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      font-size: var(--text-lg);
      padding: var(--space-1);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .notes-modal-body {
      padding: var(--space-6);
      flex: 1;
      overflow-y: auto;
    }

    .notes-modal-body .form-group {
      margin-bottom: var(--space-4);
    }

    .notes-modal-body label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .notes-modal-body textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
      transition: border-color var(--transition);
    }

    .notes-modal-body textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .character-count {
      display: block;
      text-align: right;
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
    }

    .notes-modal-info {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-info-50);
      border: 1px solid var(--color-info-200);
      border-radius: var(--radius-lg);
      margin-top: var(--space-4);
    }

    .notes-modal-info i {
      color: var(--color-info);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .notes-modal-info span {
      font-size: var(--text-sm);
      color: var(--color-info-800);
      line-height: 1.4;
    }

    .notes-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .cancel-btn, .save-btn {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .cancel-btn {
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-text);
    }

    .cancel-btn:hover {
      background: var(--color-gray-50);
    }

    .save-btn {
      border: 1px solid var(--color-primary-500);
      background: var(--color-primary-500);
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .save-btn.loading {
      pointer-events: none;
    }

    /* Order Details Modal */
    .details-modal-overlay {
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

    .details-modal {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .details-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-gray-50);
    }

    .details-modal-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .details-modal .close-btn {
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      font-size: var(--text-lg);
      padding: var(--space-1);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .details-modal .close-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .details-modal-body {
      padding: var(--space-6);
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* Order Summary Section */
    .order-summary-section {
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .order-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .summary-item label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .summary-item span {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    /* Delivery Section */
    .delivery-section {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .delivery-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0 0 var(--space-3) 0;
    }

    .address-info, .delivery-instructions {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-2);
    }

    .address-info:last-child,
    .delivery-instructions:last-child {
      margin-bottom: 0;
    }

    .address-info i, .delivery-instructions i {
      color: var(--color-info);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .address-info span, .delivery-instructions span {
      font-size: var(--text-sm);
      color: var(--color-text);
      line-height: 1.4;
    }

    /* Items Section */
    .items-section {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .items-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0 0 var(--space-4) 0;
    }

    .order-items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .detail-order-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      background: white;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2);
    }

    .item-main-info {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      flex: 1;
    }

    .item-quantity {
      font-weight: 600;
      color: var(--color-primary-600);
      min-width: 35px;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: var(--color-text);
    }

    .item-variants {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
    }

    .item-price {
      font-weight: 600;
      color: var(--color-primary-600);
      font-size: var(--text-lg);
    }

    /* Item Special Instructions Styles */
    .item-special-instructions {
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%);
      border: 1px solid #fbbf24;
      border-radius: var(--radius-md);
      border-left: 4px solid #f59e0b;
    }

    .special-instructions-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .special-instructions-header i {
      color: #f59e0b;
      font-size: var(--text-sm);
    }

    .special-instructions-label {
      font-weight: 600;
      color: #92400e;
      font-size: var(--text-sm);
    }

    .special-instructions-content {
      color: #92400e;
      font-size: var(--text-sm);
      line-height: 1.4;
      font-style: italic;
      padding-left: var(--space-6);
    }

    /* Mobile Item Special Instructions Styles */
    .item-special-instructions-mobile {
      margin-top: var(--space-2);
      padding: var(--space-2);
      background: linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%);
      border: 1px solid #fbbf24;
      border-radius: var(--radius-sm);
      border-left: 3px solid #f59e0b;
    }

    .special-instructions-header-mobile {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-bottom: var(--space-1);
    }

    .special-instructions-header-mobile i {
      color: #f59e0b;
      font-size: var(--text-xs);
    }

    .special-instructions-label-mobile {
      font-weight: 600;
      color: #92400e;
      font-size: var(--text-xs);
    }

    .special-instructions-content-mobile {
      color: #92400e;
      font-size: var(--text-xs);
      line-height: 1.3;
      font-style: italic;
      padding-left: var(--space-4);
    }

    /* Total Section */
    .total-section {
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .total-breakdown {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-1) 0;
    }

    .total-row.final {
      border-top: 2px solid var(--color-primary-300);
      padding-top: var(--space-3);
      margin-top: var(--space-2);
      font-size: var(--text-lg);
      font-weight: 700;
    }

    .total-label {
      color: var(--color-text);
      font-weight: 500;
    }

    .total-amount {
      color: var(--color-primary-600);
      font-weight: 600;
    }

    .total-row.final .total-amount {
      color: var(--color-primary-700);
    }

    /* Notes Section */
    .details-modal-body .notes-section {
      border: 1px solid var(--color-warning-200);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: var(--color-warning-50);
    }

    .details-modal-body .notes-section .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .details-modal-body .notes-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .details-modal-body .edit-notes-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-primary-500);
      background: white;
      color: var(--color-primary-600);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      font-size: var(--text-sm);
    }

    .details-modal-body .edit-notes-btn:hover {
      background: var(--color-primary-50);
      transform: translateY(-1px);
    }

    .details-modal-body .order-notes {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: white;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-warning-200);
    }

    .details-modal-body .order-notes i {
      color: var(--color-warning);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .details-modal-body .order-notes span {
      font-size: var(--text-sm);
      color: var(--color-text);
      line-height: 1.4;
    }

    .details-modal-body .no-notes {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: white;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .details-modal-body .no-notes i {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .details-modal-body .no-notes span {
      font-size: var(--text-sm);
      color: var(--color-muted);
      line-height: 1.4;
      font-style: italic;
    }

    .details-modal-body .notes-edit-form {
      background: white;
      border-radius: var(--radius-md);
      padding: var(--space-4);
      border: 1px solid var(--color-warning-200);
    }

    .details-modal-body .notes-edit-form .form-group {
      margin-bottom: var(--space-4);
    }

    .details-modal-body .notes-edit-form label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .details-modal-body .notes-edit-form textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
      transition: border-color var(--transition);
    }

    .details-modal-body .notes-edit-form textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .details-modal-body .character-count {
      display: block;
      text-align: right;
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
    }

    .details-modal-body .notes-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .details-modal-body .notes-actions .cancel-btn,
    .details-modal-body .notes-actions .save-btn {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .details-modal-body .notes-actions .cancel-btn {
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-text);
    }

    .details-modal-body .notes-actions .cancel-btn:hover {
      background: var(--color-gray-50);
    }

    .details-modal-body .notes-actions .save-btn {
      border: 1px solid var(--color-primary-500);
      background: var(--color-primary-500);
      color: white;
    }

    .details-modal-body .notes-actions .save-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .details-modal-body .notes-actions .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .details-modal-body .notes-actions .save-btn.loading {
      pointer-events: none;
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

    /* Desktop Table Styles */
    .orders-table-container {
      overflow-x: auto;
      margin-bottom: var(--space-6);
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }

    .orders-table thead {
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--color-border);
    }

    .orders-table th {
      padding: var(--space-2) var(--space-2);
      text-align: left;
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }

    .orders-table td {
      padding: var(--space-2) var(--space-2);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    .orders-table tbody tr {
      transition: background-color var(--transition);
    }

    .orders-table tbody tr:hover {
      background: var(--color-gray-25);
    }

    .orders-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Table Column Styles */
    .col-order-id {
      width: 100px;
      min-width: 100px;
    }

    .col-customer {
      width: 180px;
      min-width: 180px;
    }

    .col-order-status {
      width: 120px;
      min-width: 120px;
    }

    .col-payment-status {
      width: 120px;
      min-width: 120px;
    }

    .col-total {
      width: 90px;
      min-width: 90px;
      text-align: right;
    }

    .col-order-type {
      width: 100px;
      min-width: 100px;
      text-align: center;
    }

    .col-address {
      width: 180px;
      min-width: 180px;
    }

    .col-actions {
      width: 120px;
      min-width: 120px;
    }

    .col-details {
      width: 50px;
      min-width: 50px;
      text-align: center;
    }

    /* Table Cell Content */
    .order-id {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .order-time-mobile {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .customer-name {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .customer-email {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .user-type-badge {
      padding: 2px var(--space-1);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .user-type-badge.user-registered {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .user-type-badge.user-guest {
      background: var(--color-warning-50);
      color: var(--color-warning);
    }

    .delivery-address {
      font-size: var(--text-sm);
      color: var(--color-text);
      line-height: 1.4;
      word-wrap: break-word;
    }

    .no-address {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
    }

    .col-order-status .status-badge,
    .col-payment-status .payment-indicator {
      margin: 0;
    }

    .total-amount {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
    }

    .item-count {
      font-size: var(--text-sm);
      color: var(--color-muted);
      text-align: right;
    }

    /* Order Type Badges */
    .order-type-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .order-type-badge.mobile {
      margin-bottom: var(--space-2);
    }

    .order-type-badge.order-type-delivery {
      background: var(--color-info-50);
      color: var(--color-info-600);
      border: 1px solid var(--color-info-200);
    }

    .order-type-badge.order-type-pickup {
      background: var(--color-warning-50);
      color: var(--color-warning-600);
      border: 1px solid var(--color-warning-200);
    }

    .order-type-badge.order-type-dine-in {
      background: var(--color-success-50);
      color: var(--color-success-600);
      border: 1px solid var(--color-success-200);
    }

    .order-type-badge.order-type-unknown {
      background: var(--color-gray-50);
      color: var(--color-gray-600);
      border: 1px solid var(--color-gray-200);
    }

    .order-type-info {
      margin-bottom: var(--space-2);
    }

    /* Table Action Buttons */
    .col-actions .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      justify-content: flex-start;
    }

    .col-actions .action-btn {
      width: 32px;
      height: 32px;
      padding: var(--space-1);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
      border: 1px solid;
    }

    .col-actions .action-btn.confirm {
      border-color: var(--color-info-500);
      color: var(--color-info-600);
      background: white;
    }

    .col-actions .action-btn.confirm:hover:not(:disabled) {
      background: var(--color-info-50);
    }

    .col-actions .action-btn.payment {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .col-actions .action-btn.payment:hover:not(:disabled) {
      background: var(--color-success-50);
    }

    .col-actions .action-btn.prepare {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
      background: white;
    }

    .col-actions .action-btn.prepare:hover:not(:disabled) {
      background: var(--color-primary-50);
    }

    .col-actions .action-btn.ready {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .col-actions .action-btn.ready:hover:not(:disabled) {
      background: var(--color-success-50);
    }

    .col-actions .action-btn.pickup {
      border-color: var(--color-accent-500);
      color: var(--color-accent-600);
      background: white;
    }

    .col-actions .action-btn.pickup:hover:not(:disabled) {
      background: var(--color-accent-50);
    }

    .col-actions .action-btn.deliver {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .col-actions .action-btn.deliver:hover:not(:disabled) {
      background: var(--color-success-50);
    }

    .col-actions .action-btn.served {
      border-color: var(--color-info-500);
      color: var(--color-info);
      background: white;
    }

    .col-actions .action-btn.served:hover:not(:disabled) {
      background: var(--color-info-50);
    }

    .col-actions .action-btn.paid {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: white;
    }

    .col-actions .action-btn.paid:hover:not(:disabled) {
      background: var(--color-success-50);
    }

    .col-actions .action-btn.cancel {
      border-color: var(--color-danger-500);
      color: var(--color-danger);
      background: white;
    }

    .col-actions .action-btn.cancel:hover:not(:disabled) {
      background: var(--color-danger-50);
    }

    .col-actions .action-btn.edit {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
      background: white;
    }

    .col-actions .action-btn.edit:hover:not(:disabled) {
      background: var(--color-primary-50);
    }

    .col-actions .action-btn.details {
      border-color: var(--color-info-500);
      color: var(--color-info-600);
      background: white;
    }

    .col-actions .action-btn.details:hover:not(:disabled) {
      background: var(--color-info-50);
    }

    .col-actions .action-btn.notes {
      border-color: var(--color-warning-500);
      color: var(--color-warning-600);
      background: white;
    }

    .col-actions .action-btn.notes:hover:not(:disabled) {
      background: var(--color-warning-50);
    }

    /* Details button with notes indicator */
    .action-btn.details.has-notes {
      background: #ff9500 !important;
      border-color: #ff9500 !important;
      color: white !important;
    }

    .action-btn.details.has-notes:hover {
      background: #e6850e !important;
      border-color: #e6850e !important;
      color: white !important;
    }

    .col-actions .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .col-actions .action-btn.hidden {
      display: none;
    }

    .col-actions .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-top: var(--space-2);
    }

    /* Highlight paid pending orders in table */
    .order-row.paid-pending {
      background: linear-gradient(135deg, var(--color-gray-25) 0%, var(--color-success-25) 100%);
    }

    .order-row.paid-pending:hover {
      background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-success-50) 100%);
    }

    /* Responsive: Show table on desktop, cards on mobile */
    .desktop-only {
      display: block;
    }

    .mobile-only {
      display: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .orders-container {
        padding: var(--space-4) 0;
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .order-tabs {
        padding: var(--space-2);
        gap: var(--space-1);
      }

      .tab-button {
        padding: var(--space-1) var(--space-2);
        font-size: 10px;
      }

      .tab-button i {
        font-size: var(--text-xs);
      }

      .tab-badge {
        min-width: 16px;
        height: 16px;
        font-size: 9px;
        border-radius: 8px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      /* Hide table on mobile, show cards */
      .desktop-only {
        display: none;
      }

      .mobile-only {
        display: block;
      }

      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-btn {
        justify-content: center;
      }
    }
  `]
})
export class RestaurantManagerOrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private i18nService = inject(I18nService);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus = 'all';
  searchTerm = '';
  sortBy = 'newest';
  updatingOrderId: string | null = null;
  isLoading = false;
  
  // Tab counts for badges
  tabCounts: { [key: string]: number } = {};

  // Notes modal properties
  notesModalOpen = false;
  editingOrder: Order | null = null;
  notesText = '';
  savingNotes = false;

  // Details modal properties
  detailsModalOpen = false;
  selectedOrder: Order | null = null;
  editingNotes = false;

  // Tabs properties - erweitert um Tischangebote
  activeTab = 'urgent';
  orderTabs = [
    { id: 'all', titleKey: 'orders.tabs.all', icon: 'fa-solid fa-list' },
    { id: 'urgent', titleKey: 'orders.tabs.urgent', icon: 'fa-solid fa-exclamation-triangle' },
    { id: 'preparing', titleKey: 'orders.tabs.preparing', icon: 'fa-solid fa-utensils' },
    { id: 'ready', titleKey: 'orders.tabs.ready', icon: 'fa-solid fa-check-circle' },
    { id: 'delivery', titleKey: 'orders.tabs.delivery', icon: 'fa-solid fa-truck' },
    { id: 'pickup', titleKey: 'orders.tabs.pickup', icon: 'fa-solid fa-shopping-bag' },
    { id: 'dine_in', titleKey: 'orders.tabs.dine_in', icon: 'fa-solid fa-utensils' },
    { id: 'completed', titleKey: 'orders.tabs.completed', icon: 'fa-solid fa-archive' }
  ];

  private refreshSubscription?: Subscription;
  private isPageVisible = true;
  private visibilityChangeHandler = () => {
    this.isPageVisible = !document.hidden;
  };

  ngOnInit() {
    this.loadOrders();
    // Auto-refresh every 1 minute (60 seconds) - balanced polling
    this.refreshSubscription = interval(60000).subscribe(() => {
      // Only refresh if page is visible and user is active
      if (this.isPageVisible && !document.hidden) {
        this.loadOrders();
      }
    });

    // Listen for page visibility changes to pause/resume polling
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    // Remove event listener
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  async loadOrders() {
    this.isLoading = true;
    this.loadingService.start('orders');

    try {
      // FIXED: Use async/await to prevent Observable leaks from nested subscribes
      const restaurants = await this.restaurantManagerService.getManagedRestaurants().toPromise();
      
      if (restaurants && restaurants.length > 0) {
        const restaurantId = restaurants[0].restaurant_id;
        const orders = await this.ordersService.getRestaurantOrders(restaurantId).toPromise();
        
        this.orders = orders || [];
        this.applyFilters();
      }
      
      this.loadingService.stop('orders');
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error loading orders:', error);
      this.toastService.error('Fehler', 'Bestellungen konnten nicht geladen werden');
      this.loadingService.stop('orders');
      this.isLoading = false;
    }
  }

  refreshOrders() {
    this.loadOrders();
  }

  switchTab(tabId: string) {
    this.activeTab = tabId;
    // Reset status filter when switching tabs
    if (['all', 'urgent', 'preparing', 'ready', 'delivery', 'pickup', 'dine_in', 'completed'].includes(tabId)) {
      this.selectedStatus = 'all';
    }
    this.applyFilters();
  }

  applyFilters() {
    // Ensure we always work with the most current orders data
    let filtered = [...this.orders];

    // First, filter by tab
    if (this.activeTab === 'all') {
      // All orders: no additional filtering (show everything)
      // filtered remains unchanged - shows all orders
    } else if (this.activeTab === 'urgent') {
      // Urgent orders: pending status (new orders that need immediate attention)
      filtered = filtered.filter(order => {
        const canonicalStatus = this.canonicalStatus(order.status);
        return canonicalStatus === 'pending';
      });
    } else if (this.activeTab === 'preparing') {
      // Orders currently being prepared
      filtered = filtered.filter(order => {
        const canonicalStatus = this.canonicalStatus(order.status);
        return canonicalStatus === 'preparing';
      });
    } else if (this.activeTab === 'ready') {
      // Orders ready for pickup/delivery
      filtered = filtered.filter(order => {
        const canonicalStatus = this.canonicalStatus(order.status);
        return canonicalStatus === 'ready';
      });
    } else if (this.activeTab === 'delivery') {
      // Only delivery orders
      filtered = filtered.filter(order => this.ordersService.isDeliveryOrder(order));
    } else if (this.activeTab === 'pickup') {
      // Only pickup orders
      filtered = filtered.filter(order => this.ordersService.isPickupOrder(order));
    } else if (this.activeTab === 'dine_in') {
      // Only table orders
      filtered = filtered.filter(order => this.ordersService.isTableOrder(order));
    } else if (this.activeTab === 'completed') {
      // Completed orders: nur vollständig abgeschlossene Bestellungen (Status + Zahlung)
      filtered = filtered.filter(order => this.isOrderFullyCompleted(order));
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => {
        // Spezielle Filter für benutzerfreundliche Ansichten
        switch (this.selectedStatus) {
          case 'payment_pending':
            return order.payment_status === 'pending';
          case 'ready_pickup':
            return order.status === 'ready';
          case 'fully_completed':
            return this.isOrderFullyCompleted(order);
          default:
            // Standard-Status-Filter
            const canonicalStatus = this.canonicalStatus(order.status);
            return canonicalStatus === this.selectedStatus;
        }
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.customer_name?.toLowerCase().includes(search) || false) ||
        (order.customer_email?.toLowerCase().includes(search) || false) ||
        order.id.toLowerCase().includes(search)
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'total_high':
          return b.total_price - a.total_price;
        case 'total_low':
          return a.total_price - b.total_price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Ensure filteredOrders is always updated with a new reference for Angular change detection
    this.filteredOrders = [...filtered];

    // Update tab counts for badges
    this.updateTabCounts();

    // Debug logging to help identify issues
    console.log(`Filtered ${this.orders.length} orders to ${this.filteredOrders.length} with status filter: ${this.selectedStatus}`);
    console.log('Filtered orders IDs:', this.filteredOrders.map(o => o.id));
    console.log('Order 214 in filtered:', this.filteredOrders.find(o => o.id === '214'));

    // If no orders are shown but we have orders, there might be a filter issue
    if (this.orders.length > 0 && this.filteredOrders.length === 0 && this.selectedStatus !== 'all') {
      console.warn(`No orders shown with status filter "${this.selectedStatus}". Available statuses:`,
        [...new Set(this.orders.map(o => this.canonicalStatus(o.status)))]);
    }
  }

  private canonicalStatus(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): CanonicalStatus {
    if (status === 'open') return 'pending';
    if (status === 'in_progress') return 'preparing';
    if (status === 'out_for_delivery') return 'picked_up';
    // Handle table order specific statuses
    if (status === 'served') return 'served';
    if (status === 'paid') return 'paid';
    return status as CanonicalStatus;
  }

  updateOrderStatus(orderId: string, newStatus: Order['status']) {
    this.updatingOrderId = orderId;
    console.log('Starting status update:', { orderId, newStatus });

    // Check if this is a table order and use appropriate service method
    const order = this.orders.find(o => String(o.id) === String(orderId));
    const isTableOrder = order ? this.ordersService.isTableOrder(order) : false;

    const updateObservable = isTableOrder
      ? this.ordersService.updateTableOrderStatus(orderId, newStatus as any)
      : this.ordersService.updateOrderStatus(orderId, newStatus);

    updateObservable.subscribe({
      next: (response) => {
        console.log('Status update response:', response);

        // Update local order - preserve existing data and only update status
        const index = this.orders.findIndex(o => String(o.id) === String(orderId));
        if (index !== -1) {
          // Preserve all existing data, only update status and updated_at
          this.orders[index] = {
            ...this.orders[index], // Keep all existing data
            status: response.order.status,
            updated_at: response.order.updated_at || this.orders[index].updated_at
          };
          console.log('Updated local order:', this.orders[index]);
        } else {
          console.warn('Order not found in local array:', orderId);
          console.log('Available orders:', this.orders.map(o => ({ id: o.id, type: typeof o.id })));
        }

        // Force Angular change detection by creating new array reference
        this.orders = [...this.orders];

        // Force re-filtering with updated data
        this.applyFilters();

        // Check if updated order is visible
        const updatedOrderVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
        console.log('Order visibility after update:', {
          orderId,
          visible: updatedOrderVisible,
          filteredCount: this.filteredOrders.length,
          currentFilter: this.selectedStatus
        });

        // If the updated order is no longer visible due to filters, reset to show all
        if (!updatedOrderVisible && this.selectedStatus !== 'all') {
          console.log(`Order ${orderId} not visible after update, resetting status filter`);
          this.selectedStatus = 'all';
          this.applyFilters();

          // Double-check after filter reset
          const stillVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
          console.log(`Order visibility after filter reset:`, { orderId, visible: stillVisible });
        }

        // Automatische Zahlungsmarkierung für Tischangebote
        if (newStatus === 'served' && order && order.order_type === 'dine_in' && order.payment_status === 'pending') {
          console.log('Auto-marking table order as paid after serving');
          // Automatisch als bezahlt markieren für Tischangebote
          this.orders[index] = {
            ...this.orders[index],
            payment_status: 'paid'
          };
          
          // Backend-Update für Zahlungsstatus
          this.ordersService.updateOrderPaymentStatus(orderId, 'paid').subscribe({
            next: () => {
              console.log('Table order automatically marked as paid');
            },
            error: (error) => {
              console.error('Error auto-marking table order as paid:', error);
              // Rückgängig machen bei Fehler
              this.orders[index] = {
                ...this.orders[index],
                payment_status: 'pending'
              };
            }
          });
        }

        this.toastService.success('Status aktualisiert', `Bestellung ${this.getOrderStatusText(newStatus)}`);
        this.updatingOrderId = null;
      },
      error: (error: any) => {
        console.error('Error updating order status:', error);
        this.toastService.error('Status aktualisieren', 'Fehler beim Aktualisieren des Bestellstatus');
        this.updatingOrderId = null;
      }
    });
  }

  cancelOrder(orderId: string) {
    if (confirm(this.i18nService.translate('orders.confirm_cancel'))) {
      this.updatingOrderId = orderId;

      this.ordersService.cancelOrder(orderId, this.i18nService.translate('orders.cancelled_by_manager')).subscribe({
        next: (response) => {
          console.log('Cancel order response:', response);

          const index = this.orders.findIndex(o => String(o.id) === String(orderId));
          if (index !== -1) {
            // Preserve all existing data, only update status and updated_at
            this.orders[index] = {
              ...this.orders[index], // Keep all existing data
              status: response.order.status,
              updated_at: response.order.updated_at || this.orders[index].updated_at
            };
            console.log('Updated cancelled order:', this.orders[index]);
          } else {
            console.warn('Cancelled order not found in local array:', orderId);
          }

          // Force Angular change detection by creating new array reference
          this.orders = [...this.orders];

          // Force re-filtering with updated data
          this.applyFilters();

          // If the cancelled order is no longer visible due to filters, reset to show all
          const cancelledOrderVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
          console.log('Cancelled order visibility:', {
            orderId,
            visible: cancelledOrderVisible,
            filteredCount: this.filteredOrders.length,
            currentFilter: this.selectedStatus
          });

          if (!cancelledOrderVisible && this.selectedStatus !== 'all') {
            console.log(`Cancelled order ${orderId} not visible after update, resetting status filter`);
            this.selectedStatus = 'all';
            this.applyFilters();

            // Double-check after filter reset
            const stillVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
            console.log(`Cancelled order visibility after filter reset:`, { orderId, visible: stillVisible });
          }

          this.toastService.success(this.i18nService.translate('orders.order_cancelled'), this.i18nService.translate('orders.order_cancelled_success'));
          this.updatingOrderId = null;
        },
        error: (error: any) => {
          console.error('Error cancelling order:', error);
          this.toastService.error(this.i18nService.translate('orders.cancel_failed'), this.i18nService.translate('orders.cancel_error'));
          this.updatingOrderId = null;
        }
      });
    }
  }

  markOrderAsPaid(orderId: string) {
    if (confirm(this.i18nService.translate('orders.confirm_mark_paid'))) {
      this.updatingOrderId = orderId;
      console.log('Starting payment status update:', { orderId, paymentStatus: 'paid' });

      this.ordersService.updateOrderPaymentStatus(orderId, 'paid').subscribe({
        next: (response) => {
          console.log('Payment status update response:', response);

          // Update local order - preserve existing data and only update payment_status
          const index = this.orders.findIndex(o => String(o.id) === String(orderId));
          if (index !== -1) {
            // Preserve all existing data, only update payment_status and updated_at
            this.orders[index] = {
              ...this.orders[index], // Keep all existing data
              payment_status: 'paid',
              updated_at: response.order.updated_at || this.orders[index].updated_at
            };
            console.log('Updated order payment status:', this.orders[index]);
          } else {
            console.warn('Order not found in local array:', orderId);
          }

          // Force Angular change detection by creating new array reference
          this.orders = [...this.orders];

          // Force re-filtering with updated data
          this.applyFilters();

          // If the updated order is no longer visible due to filters, reset to show all
          const updatedOrderVisible = this.filteredOrders.some(order => String(order.id) === String(orderId));
          console.log('Order visibility after payment update:', {
            orderId,
            visible: updatedOrderVisible,
            filteredCount: this.filteredOrders.length,
            currentFilter: this.selectedStatus
          });

          if (!updatedOrderVisible && this.selectedStatus !== 'all') {
            console.log(`Order ${orderId} not visible after payment update, resetting status filter`);
            this.selectedStatus = 'all';
            this.applyFilters();
          }

          this.toastService.success(this.i18nService.translate('orders.payment_confirmed'), this.i18nService.translate('orders.order_marked_paid'));
          this.updatingOrderId = null;
        },
        error: (error: any) => {
          console.error('Error updating order payment status:', error);
          this.toastService.error(this.i18nService.translate('orders.payment_confirm'), this.i18nService.translate('orders.payment_update_error'));
          this.updatingOrderId = null;
        }
      });
    }
  }

  canUpdateStatus(currentStatus: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery', targetStatus: CanonicalStatus, order?: Order): boolean {
    // Different status flows for different order types
    const deliveryStatusFlow: Record<CanonicalStatus, CanonicalStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up', 'cancelled'],
      'picked_up': ['delivered'],
      'delivered': [],
      'served': [],
      'paid': [],
      'cancelled': []
    };

    const tableStatusFlow: Record<CanonicalStatus, CanonicalStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['served', 'cancelled'], // Table orders go directly to served, not picked_up
      'served': ['paid'], // Table orders can be marked as paid after being served
      'paid': [],
      'picked_up': [],
      'delivered': [],
      'cancelled': []
    };

    const normalized: CanonicalStatus = this.canonicalStatus(currentStatus as any);
    
    // Choose the appropriate status flow based on order type
    const statusFlow = order && this.ordersService.isTableOrder(order) ? tableStatusFlow : deliveryStatusFlow;
    
    // Special case: Only delivery orders can be marked as 'delivered'
    if (targetStatus === 'delivered' && order) {
      // Only allow 'delivered' status for delivery orders
      if (!this.ordersService.isDeliveryOrder(order)) {
        return false;
      }
    }
    
    // Special case: Only delivery/pickup orders can be marked as 'picked_up'
    // Table orders (dine_in) should not have pickup status since they are served directly
    if (targetStatus === 'picked_up' && order) {
      // Only allow 'picked_up' status for delivery or pickup orders, not for table orders
      if (this.ordersService.isTableOrder(order)) {
        return false;
      }
    }
    
    return statusFlow[normalized]?.includes(targetStatus) || false;
  }

  canCancelOrder(status: Order['status']): boolean {
    return !['delivered', 'cancelled'].includes(status);
  }

  formatOrderTime(orderTime: string): string {
    if (!orderTime) {
      return 'Unbekanntes Datum';
    }

    const date = new Date(orderTime);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return this.i18nService.translate('orders.invalid_date');
    }

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

  getOrderStatusClass(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const normalized = this.canonicalStatus(status as any);
    switch (normalized) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'picked_up': return 'picked_up';
      case 'delivered': return 'delivered';
      case 'served': return 'served';
      case 'paid': return 'paid';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  getOrderStatusText(status: Order['status'] | 'open' | 'in_progress' | 'out_for_delivery'): string {
    const normalized = this.canonicalStatus(status as any);
    switch (normalized) {
      case 'pending': return this.i18nService.translate('order.status.pending');
      case 'confirmed': return this.i18nService.translate('order.status.confirmed');
      case 'preparing': return this.i18nService.translate('order.status.preparing');
      case 'ready': return this.i18nService.translate('order.status.ready');
      case 'picked_up': return this.i18nService.translate('order.status.picked_up');
      case 'delivered': return this.i18nService.translate('order.status.delivered');
      case 'served': return this.i18nService.translate('order.status.served');
      case 'paid': return this.i18nService.translate('order.status.paid');
      case 'cancelled': return this.i18nService.translate('order.status.cancelled');
      default: return this.i18nService.translate('orders.unknown');
    }
  }

  /**
   * Prüft ob eine Bestellung vollständig abgeschlossen ist
   * Eine Bestellung gilt als abgeschlossen wenn:
   * 1. Der Bestellungsstatus den Endpunkt erreicht hat UND
   * 2. Die Zahlung erfolgt ist
   */
  private isOrderFullyCompleted(order: Order): boolean {
    // Bestellungsstatus muss den Endpunkt erreicht haben
    const isOrderStatusComplete = 
      (order.order_type === 'delivery' && order.status === 'delivered') ||
      (order.order_type === 'pickup' && order.status === 'picked_up') ||
      (order.order_type === 'dine_in' && order.status === 'served');
    
    // Zahlung muss erfolgt sein
    const isPaymentComplete = order.payment_status === 'paid';
    
    return isOrderStatusComplete && isPaymentComplete;
  }

  /**
   * Prüft ob der Bestellungsstatus abgeschlossen ist, aber die Zahlung noch aussteht
   * Zeigt eine Warnung für fast fertige Bestellungen ohne Zahlung
   */
  isOrderStatusCompleteButNotPaid(order: Order): boolean {
    const isOrderStatusComplete = 
      (order.order_type === 'delivery' && order.status === 'delivered') ||
      (order.order_type === 'pickup' && order.status === 'picked_up') ||
      (order.order_type === 'dine_in' && order.status === 'served');
    
    const isPaymentPending = order.payment_status === 'pending';
    
    return isOrderStatusComplete && isPaymentPending;
  }

  getVariantSummary(variants: Array<{variant_group_id: string, variant_option_id: string, price_modifier_cents: number}>): string {
    if (!variants || variants.length === 0) return '';

    // Since we only have IDs, we'll show a generic message indicating variants were selected
    const variantCount = variants.length;
    const totalPriceModifier = variants.reduce((sum, variant) => sum + variant.price_modifier_cents, 0);
    
    let summary = `${variantCount} Variante${variantCount > 1 ? 'n' : ''} ausgewählt`;
    
    if (totalPriceModifier !== 0) {
      const modifierText = totalPriceModifier > 0 ? `+${(totalPriceModifier / 100).toFixed(2)}€` : `${(totalPriceModifier / 100).toFixed(2)}€`;
      summary += ` (${modifierText})`;
    }
    
    return summary;
  }

  getUserTypeText(userId: string): string {
    return this.isRegisteredUser(userId) ? 'User' : 'Gast';
  }

  getUserTypeClass(userId: string): string {
    return this.isRegisteredUser(userId) ? 'user-registered' : 'user-guest';
  }

  private isRegisteredUser(userId: string): boolean {
    // Consider a user registered if user_id exists and is not null/empty
    return !!(userId && userId.trim() && userId !== 'null' && userId !== 'undefined');
  }

  // Helper method to get display information for different order types
  getOrderDisplayInfo(order: Order) {
    if (this.ordersService.isTableOrder(order)) {
      return {
        title: `Tisch ${order.table_number || 'Unbekannt'}`,
        subtitle: order.party_size ? `${order.party_size} Personen` : 'Tischangebot',
        icon: '🪑',
        type: 'dine_in'
      };
    } else if (this.ordersService.isDeliveryOrder(order)) {
      return {
        title: order.delivery_address || 'Keine Adresse',
        subtitle: `Lieferung • €${order.delivery_fee}`,
        icon: '🚚',
        type: 'delivery'
      };
    } else if (this.ordersService.isPickupOrder(order)) {
      return {
        title: 'Abholung',
        subtitle: 'Im Restaurant abholen',
        icon: '🛍️',
        type: 'pickup'
      };
    } else {
      return {
        title: 'Unbekannter Typ',
        subtitle: order.id,
        icon: '❓',
        type: 'unknown'
      };
    }
  }

  // Details modal methods
  openDetailsModal(order: Order) {
    this.selectedOrder = order;
    this.detailsModalOpen = true;
  }

  closeDetailsModal() {
    this.detailsModalOpen = false;
    this.selectedOrder = null;
    this.editingNotes = false;
    this.notesText = '';
  }

  // Inline notes editing methods
  toggleNotesEdit() {
    this.editingNotes = !this.editingNotes;
    if (this.editingNotes) {
      this.notesText = this.selectedOrder?.notes || '';
    } else {
      this.notesText = '';
    }
  }

  cancelNotesEdit() {
    this.editingNotes = false;
    this.notesText = '';
  }

  saveNotesInline() {
    if (!this.selectedOrder || !this.notesText.trim()) return;

    this.savingNotes = true;

    this.ordersService.updateOrderNotes(this.selectedOrder.id, this.notesText.trim()).subscribe({
      next: (response) => {
        // Update local order data
        const index = this.orders.findIndex(o => o.id === this.selectedOrder!.id);
        if (index !== -1) {
          this.orders[index] = response.order;
          this.applyFilters(); // Refresh filtered orders
        }

        // Update selected order for modal
        this.selectedOrder = response.order;
        this.editingNotes = false;
        this.notesText = '';

        this.toastService.success('Notizen gespeichert', 'Die Notizen wurden erfolgreich gespeichert.');
        this.savingNotes = false;
      },
      error: (error: any) => {
        console.error('Error saving notes:', error);
        this.toastService.error('Fehler beim Speichern', error.error?.error || 'Notizen konnten nicht gespeichert werden.');
        this.savingNotes = false;
      }
    });
  }

  // Notes modal methods
  openNotesModal(order: Order) {
    this.editingOrder = order;
    this.notesText = order.notes || '';
    this.notesModalOpen = true;
  }

  closeNotesModal() {
    this.notesModalOpen = false;
    this.editingOrder = null;
    this.notesText = '';
    this.savingNotes = false;
  }

  saveNotes() {
    if (!this.editingOrder || !this.notesText.trim()) return;

    this.savingNotes = true;

    this.ordersService.updateOrderNotes(this.editingOrder.id, this.notesText.trim()).subscribe({
      next: (response) => {
        // Update local order data
        const index = this.orders.findIndex(o => o.id === this.editingOrder!.id);
        if (index !== -1) {
          this.orders[index] = response.order;
          this.applyFilters(); // Refresh filtered orders
        }

        this.toastService.success('Notizen gespeichert', 'Die Notizen wurden erfolgreich gespeichert.');
        this.closeNotesModal();
      },
      error: (error: any) => {
        console.error('Error saving notes:', error);
        this.toastService.error('Fehler beim Speichern', error.error?.error || 'Notizen konnten nicht gespeichert werden.');
        this.savingNotes = false;
      }
    });
  }

  // Order type display methods
  getOrderTypeText(order: Order): string {
    if (this.ordersService.isTableOrder(order)) {
      return 'orders.type.dine_in';
    } else if (this.ordersService.isDeliveryOrder(order)) {
      return 'orders.type.delivery';
    } else if (this.ordersService.isPickupOrder(order)) {
      return 'orders.type.pickup';
    } else {
      return 'orders.type.unknown';
    }
  }


  getOrderTypeIcon(order: Order): string {
    if (this.ordersService.isTableOrder(order)) {
      return 'fa-solid fa-utensils';
    } else if (this.ordersService.isDeliveryOrder(order)) {
      return 'fa-solid fa-truck';
    } else if (this.ordersService.isPickupOrder(order)) {
      return 'fa-solid fa-shopping-bag';
    } else {
      return 'fa-solid fa-question';
    }
  }

  getOrderTypeClass(order: Order): string {
    if (this.ordersService.isTableOrder(order)) {
      return 'order-type-dine-in';
    } else if (this.ordersService.isDeliveryOrder(order)) {
      return 'order-type-delivery';
    } else if (this.ordersService.isPickupOrder(order)) {
      return 'order-type-pickup';
    } else {
      return 'order-type-unknown';
    }
  }

  updateTabCounts(): void {
    if (!this.orders || this.orders.length === 0) {
      // Reset all counts to 0
      this.orderTabs.forEach(tab => {
        this.tabCounts[tab.id] = 0;
      });
      return;
    }

    const filtered = [...this.orders];

    // Calculate counts for each tab
    this.tabCounts['all'] = filtered.length;

    this.tabCounts['urgent'] = filtered.filter(order => {
      const canonicalStatus = this.canonicalStatus(order.status);
      return canonicalStatus === 'pending';
    }).length;

    this.tabCounts['preparing'] = filtered.filter(order => {
      const canonicalStatus = this.canonicalStatus(order.status);
      return canonicalStatus === 'preparing';
    }).length;

    this.tabCounts['ready'] = filtered.filter(order => {
      const canonicalStatus = this.canonicalStatus(order.status);
      return canonicalStatus === 'ready';
    }).length;

    this.tabCounts['delivery'] = filtered.filter(order => this.ordersService.isDeliveryOrder(order)).length;

    this.tabCounts['pickup'] = filtered.filter(order => this.ordersService.isPickupOrder(order)).length;

    this.tabCounts['dine_in'] = filtered.filter(order => this.ordersService.isTableOrder(order)).length;

    this.tabCounts['completed'] = filtered.filter(order => this.isOrderFullyCompleted(order)).length;
  }

  getTabCount(tabId: string): number {
    return this.tabCounts[tabId] || 0;
  }

  getBadgeClass(tabId: string): string {
    return `badge-${tabId}`;
  }

  // Edit Modal Properties and Methods
  isEditModalOpen = false;
  editSelectedOrder: Order | null = null;

  canEditOrder(status: string): boolean {
    // Allow editing only for pending, confirmed, and preparing orders
    return ['pending', 'confirmed', 'preparing'].includes(status);
  }

  openEditModal(order: Order): void {
    this.editSelectedOrder = { ...order }; // Create a copy to avoid modifying the original
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editSelectedOrder = null;
  }

  onOrderUpdated(updatedOrder: Order): void {
    // Find and update the order in the orders array
    const index = this.orders.findIndex(order => order.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
      this.updateTabCounts();
    }
    this.closeEditModal();
  }
}