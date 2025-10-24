import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { RestaurantCustomer } from '../../core/services/restaurants.service';
import { I18nService } from '../../core/services/i18n.service';

interface RestaurantCustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
  avg_orders_per_customer: number;
}

@Component({
  selector: 'app-restaurant-manager-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="customers-container">
      <!-- Header -->
      <div class="customers-header">
        <div class="header-main">
          <h1>{{ i18n.translate('customers.title') }}</h1>
          <button class="btn-primary mobile-add-btn" (click)="showAddCustomerModal = true">
            <i class="fa-solid fa-plus"></i>
            <span class="btn-text-full">{{ i18n.translate('customers.add_customer') }}</span>
            <span class="btn-text-mobile">{{ i18n.translate('customers.add_customer_mobile') }}</span>
          </button>
        </div>
        <div class="header-actions">
          <div class="search-container">
            <input
              type="text"
              [(ngModel)]="searchEmail"
              (keyup.enter)="searchCustomer()"
              [placeholder]="i18n.translate('customers.search_placeholder')"
              class="search-input">
            <button (click)="searchCustomer()" class="btn-secondary">
              <i class="fa-solid fa-search"></i>
            </button>
          </div>
          <button class="btn-primary desktop-add-btn" (click)="showAddCustomerModal = true">
            <i class="fa-solid fa-plus"></i>
            {{ i18n.translate('customers.add_customer') }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="customerStats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ customerStats.total_customers }}</div>
            <div class="stat-label">{{ i18n.translate('customers.total_customers') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ customerStats.active_customers }}</div>
            <div class="stat-label">{{ i18n.translate('customers.active_customers') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ customerStats.new_customers_this_month }}</div>
            <div class="stat-label">{{ i18n.translate('customers.new_customers_month') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ customerStats.avg_orders_per_customer | number:'1.1-1' }}</div>
            <div class="stat-label">{{ i18n.translate('customers.avg_orders_per_customer') }}</div>
          </div>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="customers-table-container desktop-view">
        <table class="customers-table" *ngIf="customers.length > 0; else noCustomers">
          <thead>
            <tr>
              <th>{{ i18n.translate('customers.customer') }}</th>
              <th>{{ i18n.translate('customers.contact') }}</th>
              <th>{{ i18n.translate('customers.orders') }}</th>
              <th>{{ i18n.translate('customers.total_spent') }}</th>
              <th>{{ i18n.translate('customers.last_order') }}</th>
              <th>{{ i18n.translate('customers.status') }}</th>
              <th>{{ i18n.translate('customers.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let customer of customers" class="customer-row">
              <td>
                <div class="customer-info">
                  <div class="customer-name">{{ customer.name }}</div>
                  <div class="customer-email">{{ customer.email }}</div>
                </div>
              </td>
              <td>
                <div class="customer-contact">
                  <div *ngIf="customer.phone; else noPhone">
                    <i class="fa-solid fa-phone"></i>
                    {{ customer.phone }}
                  </div>
                  <ng-template #noPhone>
                    <span class="no-data">{{ i18n.translate('customers.no_phone') }}</span>
                  </ng-template>
                </div>
              </td>
              <td>
                <span class="orders-count">{{ customer.total_orders }}</span>
              </td>
              <td>
                <span class="total-spent">€{{ (customer.total_spent_cents / 100) | number:'1.2-2' }}</span>
              </td>
              <td>
                <div class="last-order">
                  <div class="last-order-date">{{ customer.last_order_at | date:'dd.MM.yyyy' }}</div>
                  <div class="last-order-time">{{ customer.last_order_at | date:'HH:mm' }}</div>
                </div>
              </td>
              <td>
                <span class="status-badge" [class.active]="customer.is_active" [class.inactive]="!customer.is_active">
                  {{ customer.is_active ? i18n.translate('customers.active') : i18n.translate('customers.inactive') }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-sm" (click)="viewCustomerDetails(customer)" [title]="i18n.translate('customers.view_details')">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button class="btn-sm" (click)="editCustomer(customer)" [title]="i18n.translate('customers.edit')">
                    <i class="fa-solid fa-edit"></i>
                  </button>
                  <button
                    class="btn-sm danger"
                    (click)="toggleCustomerStatus(customer)"
                    [title]="customer.is_active ? i18n.translate('customers.deactivate') : i18n.translate('customers.activate')">
                    <i class="fa-solid" [class]="customer.is_active ? 'fa-ban' : 'fa-check'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #noCustomers>
          <div class="no-customers">
            <div class="no-customers-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <h3>{{ i18n.translate('customers.no_customers_title') }}</h3>
            <p>{{ i18n.translate('customers.no_customers_desc') }}</p>
            <button class="btn-primary" (click)="showAddCustomerModal = true">
              {{ i18n.translate('customers.add_first_customer') }}
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Mobile Card View -->
      <div class="customers-cards-container mobile-view" *ngIf="customers.length > 0">
        <div class="customer-card" *ngFor="let customer of customers">
          <div class="card-header">
            <div class="customer-avatar">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="customer-info">
              <div class="customer-name">{{ customer.name }}</div>
              <div class="customer-email">{{ customer.email }}</div>
            </div>
            <span class="status-badge" [class.active]="customer.is_active" [class.inactive]="!customer.is_active">
              {{ customer.is_active ? i18n.translate('customers.active') : i18n.translate('customers.inactive') }}
            </span>
          </div>

          <div class="card-body">
            <div class="card-row">
              <div class="card-field">
                <i class="fa-solid fa-phone"></i>
                <span>{{ customer.phone || i18n.translate('customers.no_phone') }}</span>
              </div>
            </div>

            <div class="card-stats">
              <div class="stat-item">
                <div class="stat-label">{{ i18n.translate('customers.orders') }}</div>
                <div class="stat-value">{{ customer.total_orders }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">{{ i18n.translate('customers.total_spent') }}</div>
                <div class="stat-value">€{{ (customer.total_spent_cents / 100) | number:'1.2-2' }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">{{ i18n.translate('customers.last_order') }}</div>
                <div class="stat-value">{{ customer.last_order_at | date:'dd.MM.yyyy' }}</div>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-outline" (click)="viewCustomerDetails(customer)">
              <i class="fa-solid fa-eye"></i>
              {{ i18n.translate('customers.details') }}
            </button>
            <button class="btn-outline" (click)="editCustomer(customer)">
              <i class="fa-solid fa-edit"></i>
              {{ i18n.translate('customers.edit_button') }}
            </button>
            <button
              class="btn-outline danger"
              (click)="toggleCustomerStatus(customer)">
              <i class="fa-solid" [class]="customer.is_active ? 'fa-ban' : 'fa-check'"></i>
              {{ customer.is_active ? i18n.translate('customers.deactivate_button') : i18n.translate('customers.activate_button') }}
            </button>
          </div>
        </div>
      </div>

      <!-- No customers for mobile -->
      <div class="no-customers mobile-view" *ngIf="customers.length === 0">
        <div class="no-customers-icon">
          <i class="fa-solid fa-users"></i>
        </div>
        <h3>{{ i18n.translate('customers.no_customers_title') }}</h3>
        <p>{{ i18n.translate('customers.no_customers_desc') }}</p>
        <button class="btn-primary" (click)="showAddCustomerModal = true">
          {{ i18n.translate('customers.add_first_customer') }}
        </button>
      </div>

      <!-- Customer Details Modal -->
      <div *ngIf="showCustomerDetailsModal" class="modal-overlay" (click)="showCustomerDetailsModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ i18n.translate('customers.details_title') }}</h3>
            <button class="close-btn" (click)="showCustomerDetailsModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedCustomer">
            <div class="customer-details-grid">
              <div class="detail-section">
                <h4>{{ i18n.translate('customers.personal_info') }}</h4>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.name') }}</span>
                  <span class="detail-value">{{ selectedCustomer.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.email') }}</span>
                  <span class="detail-value">{{ selectedCustomer.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.phone') }}</span>
                  <span class="detail-value">{{ selectedCustomer.phone || i18n.translate('customers.not_provided') }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.first_order') }}</span>
                  <span class="detail-value">{{ selectedCustomer.first_order_at | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>{{ i18n.translate('customers.order_stats') }}</h4>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.total_orders') }}</span>
                  <span class="detail-value">{{ selectedCustomer.total_orders }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.total_spent_label') }}</span>
                  <span class="detail-value">€{{ (selectedCustomer.total_spent_cents / 100) | number:'1.2-2' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.avg_per_order') }}</span>
                  <span class="detail-value">€{{ (selectedCustomer.total_spent_cents / selectedCustomer.total_orders / 100) | number:'1.2-2' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.status_label') }}</span>
                  <span class="detail-value">{{ selectedCustomer.is_active ? i18n.translate('customers.active') : i18n.translate('customers.inactive') }}</span>
                </div>
              </div>

              <div class="detail-section" *ngIf="selectedCustomer.preferences">
                <h4>{{ i18n.translate('customers.preferences') }}</h4>
                <div *ngIf="selectedCustomer.preferences.allergies && selectedCustomer.preferences.allergies.length > 0" class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.allergies') }}</span>
                  <span class="detail-value">{{ selectedCustomer.preferences.allergies.join(', ') }}</span>
                </div>
                <div *ngIf="selectedCustomer.preferences.delivery_notes" class="detail-row">
                  <span class="detail-label">{{ i18n.translate('customers.delivery_notes') }}</span>
                  <span class="detail-value">{{ selectedCustomer.preferences.delivery_notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Customer Modal -->
      <div *ngIf="showAddCustomerModal" class="modal-overlay" (click)="showAddCustomerModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCustomer ? i18n.translate('customers.edit_customer') : i18n.translate('customers.add_new_customer') }}</h3>
            <button class="close-btn" (click)="showAddCustomerModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="saveCustomer()" #customerForm="ngForm">
            <div class="form-group">
              <label for="customerName">{{ i18n.translate('customers.name_required') }}</label>
              <input
                type="text"
                id="customerName"
                [(ngModel)]="currentCustomer.name"
                name="name"
                required
                class="form-input"
                [placeholder]="i18n.translate('customers.name_placeholder')">
            </div>

            <div class="form-group">
              <label for="customerEmail">{{ i18n.translate('customers.email_required') }}</label>
              <input
                type="email"
                id="customerEmail"
                [(ngModel)]="currentCustomer.email"
                name="email"
                required
                [disabled]="!!editingCustomer"
                class="form-input"
                [placeholder]="i18n.translate('customers.email_placeholder')">
            </div>

            <div class="form-group">
              <label for="customerPhone">{{ i18n.translate('customers.phone_label') }}</label>
              <input
                type="tel"
                id="customerPhone"
                [(ngModel)]="currentCustomer.phone"
                name="phone"
                class="form-input"
                [placeholder]="i18n.translate('customers.phone_placeholder')">
            </div>

            <div class="form-group" *ngIf="editingCustomer">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="currentCustomer.is_active"
                  name="is_active">
                {{ i18n.translate('customers.is_active') }}
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showAddCustomerModal = false">
                {{ i18n.translate('customers.cancel') }}
              </button>
              <button type="submit" class="btn-primary" [disabled]="!customerForm.valid || isLoading">
                {{ isLoading ? i18n.translate('customers.saving') : (editingCustomer ? i18n.translate('customers.update') : i18n.translate('customers.add')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customers-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .customers-header {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .customers-header h1 {
      margin: 0;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .mobile-add-btn, .desktop-add-btn {
      display: none;
    }

    /* Responsive button text */
    .btn-text-full {
      display: inline;
    }

    .btn-text-mobile {
      display: none;
    }

    .search-container {
      display: flex;
      gap: 8px;
    }

    .search-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 250px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      background: var(--gradient-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .customers-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .customers-table {
      width: 100%;
      border-collapse: collapse;
    }

    .customers-table th {
      background: #f8f9fa;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #e0e0e0;
    }

    .customers-table td {
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
    }

    .customer-row:hover {
      background: #f8f9fa;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
    }

    .customer-name {
      font-weight: 600;
      color: #333;
    }

    .customer-email {
      color: #666;
      font-size: 14px;
    }

    .customer-contact {
      color: #333;
    }

    .orders-count {
      font-weight: 600;
      color: var(--color-success);
    }

    .total-spent {
      font-weight: 600;
      color: var(--color-primary-600);
    }

    .last-order {
      display: flex;
      flex-direction: column;
    }

    .last-order-date {
      font-weight: 600;
      color: #333;
    }

    .last-order-time {
      color: #666;
      font-size: 14px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.active {
      background: var(--bg-light-green);
      color: var(--color-success);
    }

    .status-badge.inactive {
      background: var(--bg-light-green-2);
      color: var(--color-muted);
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn-sm:hover {
      opacity: 0.8;
    }

    .btn-sm.danger {
      background: #dc3545;
      color: white;
    }

    .btn-sm.danger:hover {
      background: #c82333;
    }

    .no-customers {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-customers-icon {
      font-size: 64px;
      margin-bottom: 20px;
      color: #ccc;
    }

    .no-customers h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .no-data {
      color: #999;
      font-style: italic;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 20px;
    }

    .customer-details-grid {
      display: grid;
      gap: 20px;
    }

    .detail-section h4 {
      margin: 0 0 15px 0;
      color: #333;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 600;
      color: #666;
    }

    .detail-value {
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #333;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-input:disabled {
      background: #f8f9fa;
      color: #666;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    /* Mobile Card Styles */
    .customers-cards-container {
      display: grid;
      gap: 16px;
    }

    .customer-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .customer-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .customer-avatar {
      width: 40px;
      height: 40px;
      background: var(--gradient-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
    }

    .card-body {
      padding: 16px;
    }

    .card-row {
      margin-bottom: 12px;
    }

    .card-field {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .card-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    .btn-outline {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      background: white;
      color: #666;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      background: #f8f9fa;
      border-color: #bbb;
    }

    .btn-outline.danger {
      border-color: #dc3545;
      color: #dc3545;
    }

    .btn-outline.danger:hover {
      background: #f8d7da;
      border-color: #c82333;
    }

    /* View toggles */
    .desktop-view {
      display: block;
    }

    .mobile-view {
      display: none;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .customers-container {
        padding: 16px;
      }

      .customers-header {
        gap: 16px;
        margin-bottom: 24px;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .search-input {
        width: 200px;
      }
    }

    @media (max-width: 768px) {
      .customers-container {
        padding: 12px;
      }

      .customers-header {
        gap: 12px;
        margin-bottom: 20px;
      }

      .header-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .customers-header h1 {
        font-size: 24px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .search-container {
        flex: 1;
      }

      .search-input {
        width: 100%;
        max-width: none;
      }

      .mobile-add-btn {
        display: flex !important;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: 14px;
      }

      .desktop-add-btn {
        display: none !important;
      }

      .btn-text-full {
        display: none;
      }

      .btn-text-mobile {
        display: inline;
      }

      /* Hide table, show cards */
      .desktop-view {
        display: none;
      }

      .mobile-view {
        display: block;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .stat-card {
        padding: 16px;
      }

      .card-stats {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .card-actions {
        flex-direction: column;
        gap: 6px;
      }

      .btn-outline {
        justify-content: flex-start;
        padding: 10px 12px;
        font-size: 14px;
      }

      /* Modal improvements for mobile */
      .modal-content {
        width: 95%;
        margin: 10px;
        max-height: 90vh;
      }

      .modal-header h3 {
        font-size: 18px;
      }

      .customer-details-grid {
        gap: 16px;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .detail-label {
        font-weight: 600;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        color: #333;
        font-size: 14px;
      }
    }

    @media (max-width: 480px) {
      .customers-container {
        padding: 8px;
      }

      .card-header {
        padding: 12px;
        gap: 10px;
      }

      .card-body {
        padding: 12px;
      }

      .card-actions {
        padding: 12px;
      }

      .customer-avatar {
        width: 36px;
        height: 36px;
        font-size: 14px;
      }

      .customer-name {
        font-size: 16px;
      }

      .customer-email {
        font-size: 14px;
      }

      .stat-value {
        font-size: 16px;
      }

      .modal-content {
        width: 98%;
        margin: 5px;
      }
    }
  `]
})
export class RestaurantManagerCustomersComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private restaurantManagerService = inject(RestaurantManagerService);
  public i18n = inject(I18nService); // Made public for template access

  customers: RestaurantCustomer[] = [];
  customerStats: RestaurantCustomerStats | null = null;
  managedRestaurantId: string | null = null;

  // Modal states
  showAddCustomerModal = false;
  showCustomerDetailsModal = false;

  // Form data
  currentCustomer = {
    name: '',
    email: '',
    phone: '',
    is_active: true
  };

  editingCustomer: RestaurantCustomer | null = null;
  selectedCustomer: RestaurantCustomer | null = null;
  searchEmail = '';
  isLoading = false;

  ngOnInit() {
    this.loadManagedRestaurant();
  }

  private async loadManagedRestaurant() {
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (managers) => {
        const restaurantId = managers?.[0]?.restaurant_id;
        if (restaurantId) {
          this.managedRestaurantId = String(restaurantId);
          this.loadCustomers();
          this.loadCustomerStats();
        }
      },
      error: (error) => {
        console.error('Error loading managed restaurant:', error);
      }
    });
  }

  private loadCustomers() {
    if (!this.managedRestaurantId) return;

    this.restaurantsService.getRestaurantCustomers(this.managedRestaurantId).subscribe({
      next: (customers) => {
        this.customers = customers;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.customers = [];
      }
    });
  }

  private loadCustomerStats() {
    if (!this.managedRestaurantId) return;

    this.restaurantsService.getRestaurantCustomerStats(this.managedRestaurantId).subscribe({
      next: (stats) => {
        this.customerStats = stats;
      },
      error: (error) => {
        // Don't log expected errors (404/403) as they indicate missing restaurant or permissions
        if (error.status !== 404 && error.status !== 403) {
          console.error('Error loading customer stats:', error);
        }
        // Reset stats to default values
        this.customerStats = {
          total_customers: 0,
          active_customers: 0,
          new_customers_this_month: 0,
          avg_orders_per_customer: 0
        };
      }
    });
  }

  searchCustomer() {
    if (!this.searchEmail.trim() || !this.managedRestaurantId) return;

    this.isLoading = true;
    this.restaurantsService.searchRestaurantCustomers(this.managedRestaurantId, this.searchEmail.trim()).subscribe({
      next: (customer) => {
        // Highlight the found customer in the list
        this.customers = [customer];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Customer not found:', error);
        alert('Kunde mit dieser E-Mail-Adresse nicht gefunden.');
        this.isLoading = false;
      }
    });
  }

  viewCustomerDetails(customer: RestaurantCustomer) {
    this.selectedCustomer = customer;
    this.showCustomerDetailsModal = true;
  }

  editCustomer(customer: RestaurantCustomer) {
    this.editingCustomer = customer;
    this.currentCustomer = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      is_active: customer.is_active
    };
    this.showAddCustomerModal = true;
  }

  toggleCustomerStatus(customer: RestaurantCustomer) {
    if (!this.managedRestaurantId) return;

    const action = customer.is_active ? 'deaktivieren' : 'aktivieren';
    if (!confirm(`Sind Sie sicher, dass Sie diesen Kunden ${action} möchten?`)) {
      return;
    }

    this.isLoading = true;
    this.restaurantsService.updateRestaurantCustomer(
      this.managedRestaurantId,
      String(customer.id),
      { is_active: !customer.is_active }
    ).subscribe({
      next: (updatedCustomer) => {
        // Update the customer in the list
        const index = this.customers.findIndex(c => c.id === customer.id);
        if (index !== -1) {
          this.customers[index] = updatedCustomer;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating customer status:', error);
        alert('Fehler beim Aktualisieren des Kundenstatus.');
        this.isLoading = false;
      }
    });
  }

  saveCustomer() {
    if (!this.managedRestaurantId) return;

    this.isLoading = true;

    if (this.editingCustomer) {
      // Update existing customer
      this.restaurantsService.updateRestaurantCustomer(
        this.managedRestaurantId,
        String(this.editingCustomer.id),
        {
          name: this.currentCustomer.name,
          phone: this.currentCustomer.phone,
          is_active: this.currentCustomer.is_active
        }
      ).subscribe({
        next: (updatedCustomer) => {
          // Update the customer in the list
          const index = this.customers.findIndex(c => c.id === this.editingCustomer!.id);
          if (index !== -1) {
            this.customers[index] = updatedCustomer;
          }
          this.closeCustomerModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          alert('Fehler beim Aktualisieren des Kunden.');
          this.isLoading = false;
        }
      });
    } else {
      // Create new customer
      this.restaurantsService.createRestaurantCustomer(
        this.managedRestaurantId,
        {
          name: this.currentCustomer.name,
          email: this.currentCustomer.email,
          phone: this.currentCustomer.phone
        }
      ).subscribe({
        next: (newCustomer) => {
          this.customers.unshift(newCustomer);
          this.loadCustomerStats(); // Refresh stats
          this.closeCustomerModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          alert('Fehler beim Erstellen des Kunden.');
          this.isLoading = false;
        }
      });
    }
  }

  private closeCustomerModal() {
    this.showAddCustomerModal = false;
    this.editingCustomer = null;
    this.currentCustomer = {
      name: '',
      email: '',
      phone: '',
      is_active: true
    };
  }
}
