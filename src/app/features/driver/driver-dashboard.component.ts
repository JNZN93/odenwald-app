import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrdersService, Order } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { Observable, map, switchMap, of, interval, tap, catchError } from 'rxjs';

interface DriverStats {
  totalDeliveries: number;
  todayDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  averageRating: number;
  currentStatus: 'available' | 'busy' | 'offline' | 'on_delivery';
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="driver-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Willkommen, {{ (user$ | async)?.name }}!</h1>
          <p>Fahrer-Dashboard - Verwalte deine Lieferungen</p>
        </div>

        <div class="status-section">
          <div class="status-indicator" [class]="'status-' + driverStats.currentStatus">
            <i class="fa-solid" [ngClass]="getStatusIcon(driverStats.currentStatus)"></i>
            <span>{{ getStatusLabel(driverStats.currentStatus) }}</span>
          </div>

          <button
            class="status-toggle-btn"
            (click)="toggleStatus()"
            [disabled]="togglingStatus"
          >
            <span *ngIf="!togglingStatus">
              {{ driverStats.currentStatus === 'available' ? 'Offline gehen' : 'Verfügbar machen' }}
            </span>
            <span *ngIf="togglingStatus" class="loading-text">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Aktualisiere...
            </span>
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>Lieferungen heute</h3>
            <div class="stat-value">{{ driverStats.todayDeliveries }}</div>
            <small>Gesamt: {{ driverStats.totalDeliveries }}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Verdienst heute</h3>
            <div class="stat-value">{{ driverStats.todayEarnings | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
            <small>Gesamt: {{ driverStats.totalEarnings | currency:'EUR':'symbol':'1.2-2':'de' }}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>Bewertung</h3>
            <div class="stat-value">{{ driverStats.averageRating }}/5</div>
            <div class="rating-stars">
              <i
                *ngFor="let star of [1,2,3,4,5]"
                class="fa-solid"
                [ngClass]="star <= driverStats.averageRating ? 'fa-star' : 'fa-regular fa-star'"
              ></i>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Arbeitszeit</h3>
            <div class="stat-value">{{ workHoursToday }}h</div>
            <small>Online seit: {{ onlineSince }}</small>
          </div>
        </div>
      </div>

      <!-- Active Delivery / Available Orders -->
      <div class="main-content">
        <!-- Active Delivery Section -->
        <div class="active-delivery" *ngIf="activeDeliveries$ | async as activeDeliveries; else availableOrders">
          <div class="delivery-header">
            <h2><i class="fa-solid fa-truck"></i> Aktuelle Lieferungen ({{ activeDeliveries.length }})</h2>
            <div class="delivery-header-actions">
              <button class="btn btn-secondary maps-btn" (click)="openRouteInGoogleMaps()">
                <i class="fa-solid fa-map-location-dot"></i>
                Route in Maps öffnen
              </button>
              <div class="delivery-status">
                <span class="status-badge status-delivery">
                  <i class="fa-solid fa-route"></i>
                  Unterwegs
                </span>
              </div>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div class="route-progress">
            <div class="progress-header">
              <span class="progress-label">Route Fortschritt</span>
              <span class="progress-count">Station 1 von {{ activeDeliveries.length }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="(1 / activeDeliveries.length) * 100"></div>
            </div>
            <div class="progress-steps">
              <div class="progress-step" *ngFor="let delivery of activeDeliveries; let i = index"
                   [class.active]="i === 0"
                   [class.completed]="false"
                   [class.upcoming]="i > 0">
                <div class="step-number">{{ i + 1 }}</div>
                <div class="step-line" *ngIf="i < activeDeliveries.length - 1"></div>
              </div>
            </div>
          </div>

          <!-- Multiple deliveries -->
          <div *ngFor="let delivery of activeDeliveries; let i = index" class="delivery-card" [class.primary-delivery]="i === 0">
            <div class="delivery-details">
              <div class="delivery-info">
                <div class="delivery-header-with-badge">
                  <div class="sequence-badge" [class]="'sequence-' + (i + 1)">
                    <span class="sequence-number">{{ i + 1 }}</span>
                  </div>
                  <h3>Bestellung #{{ delivery.id }}</h3>
                </div>
                <p class="restaurant-name">{{ delivery.restaurant_name }}</p>
                <p class="delivery-address">
                  <i class="fa-solid fa-map-marker-alt"></i>
                  {{ delivery.delivery_address }}
                </p>
                <p class="delivery-time">
                  <i class="fa-solid fa-clock"></i>
                  Geschätzte Ankunft: {{ delivery.estimated_delivery | date:'HH:mm' }}
                </p>
              </div>

              <div class="delivery-actions">
                <button class="btn btn-success" (click)="markAsDelivered(delivery)">
                  <i class="fa-solid fa-check"></i>
                  Als geliefert markieren
                </button>
                <button class="btn btn-warning" (click)="contactCustomer(delivery)">
                  <i class="fa-solid fa-phone"></i>
                  Kunde kontaktieren
                </button>
              </div>
            </div>

            <div class="delivery-items">
              <h4>Bestellte Artikel</h4>
              <div class="items-list">
                <div *ngFor="let item of delivery.items" class="delivery-item">
                  <span>{{ item.name }} × {{ item.quantity }}</span>
                  <span>{{ item.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
                </div>
              </div>
              <div class="delivery-total">
                <strong>Gesamt: {{ delivery.total_price | currency:'EUR':'symbol':'1.2-2':'de' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Available Orders Section -->
        <ng-template #availableOrders>
          <div class="available-orders">
            <div class="orders-header">
              <h2><i class="fa-solid fa-list-check"></i> Verfügbare Aufträge</h2>
              <button class="refresh-btn" (click)="refreshOrders()" [disabled]="refreshing">
                <i class="fa-solid" [ngClass]="refreshing ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>
                Aktualisieren
              </button>
            </div>

            <div class="orders-list" *ngIf="availableOrders$ | async as orders; else loading">
              <div class="no-orders" *ngIf="orders.length === 0">
                <i class="fa-solid fa-inbox"></i>
                <h3>Keine verfügbaren Aufträge</h3>
                <p>Es gibt derzeit keine Aufträge in deiner Nähe.</p>
              </div>

              <div class="order-card" *ngFor="let order of orders">
                <div class="order-header">
                  <div class="order-info">
                    <h4>Bestellung #{{ order.id }}</h4>
                    <p class="restaurant-name">{{ order.restaurant_name }}</p>
                    <p class="order-time">{{ order.order_time | date:'dd.MM.yyyy HH:mm' }}</p>
                  </div>
                  <div class="order-value">
                    <div class="order-total">{{ order.total | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                    <small>Liefergebühr: {{ order.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}</small>
                  </div>
                </div>

                <div class="order-details">
                  <div class="delivery-info">
                    <p class="delivery-address">
                      <i class="fa-solid fa-map-marker-alt"></i>
                      {{ order.delivery_address }}
                    </p>
                    <p class="estimated-time">
                      <i class="fa-solid fa-clock"></i>
                      Lieferung bis: {{ order.estimated_delivery | date:'HH:mm' }}
                    </p>
                  </div>

                  <div class="order-items-preview">
                    <div *ngFor="let item of order.items.slice(0, 3)" class="item-preview">
                      {{ item.name }} × {{ item.quantity }}
                    </div>
                    <div *ngIf="order.items.length > 3" class="more-items">
                      +{{ order.items.length - 3 }} weitere Artikel
                    </div>
                  </div>
                </div>

                <div class="order-actions">
                  <button class="btn btn-primary" (click)="acceptOrder(order)" [disabled]="acceptingOrder">
                    <span *ngIf="!acceptingOrder">
                      <i class="fa-solid fa-check"></i>
                      Auftrag annehmen
                    </span>
                    <span *ngIf="acceptingOrder" class="loading-text">
                      <i class="fa-solid fa-spinner fa-spin"></i>
                      Annehmen...
                    </span>
                  </button>
                  <button class="btn btn-ghost" (click)="viewOrderDetails(order)">
                    <i class="fa-solid fa-eye"></i>
                    Details
                  </button>
                </div>
              </div>
            </div>

            <ng-template #loading>
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Suche nach verfügbaren Aufträgen...</p>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </div>

      <!-- Recent Deliveries -->
      <div class="recent-deliveries">
        <h2><i class="fa-solid fa-history"></i> Letzte Lieferungen</h2>

        <div class="deliveries-list" *ngIf="recentDeliveries$ | async as deliveries; else loadingDeliveries">
          <div class="no-deliveries" *ngIf="deliveries.length === 0">
            <i class="fa-solid fa-receipt"></i>
            <p>Noch keine Lieferungen durchgeführt</p>
          </div>

          <div class="delivery-card" *ngFor="let delivery of deliveries.slice(0, 5)">
            <div class="delivery-info">
              <h4>Bestellung #{{ delivery.id }}</h4>
              <p class="restaurant-name">{{ delivery.restaurant_name }}</p>
              <p class="delivery-date">{{ delivery.order_time | date:'dd.MM.yyyy' }}</p>
            </div>
            <div class="delivery-amount">
              <div class="amount">{{ delivery.total | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
              <small>{{ delivery.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }} Gebühr</small>
            </div>
          </div>
        </div>

        <ng-template #loadingDeliveries>
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Lade Lieferhistorie...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .driver-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .welcome-section h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .welcome-section p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .status-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 600;
      font-size: var(--text-sm);
    }

    .status-available {
      background: color-mix(in oklab, var(--color-success) 15%, white);
      color: var(--color-success);
    }

    .status-busy, .status-on_delivery {
      background: color-mix(in oklab, var(--color-warning) 15%, white);
      color: var(--color-warning);
    }

    .status-offline {
      background: color-mix(in oklab, var(--color-muted) 15%, white);
      color: var(--color-muted);
    }

    .status-toggle-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
    }

    .status-toggle-btn:hover:not(:disabled) {
      background: var(--bg-light);
      transform: translateY(-1px);
    }

    .status-toggle-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
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
    }

    .stat-icon {
      font-size: var(--text-2xl);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      border-radius: var(--radius-lg);
    }

    .stat-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .stat-value {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-content small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .rating-stars {
      display: flex;
      gap: var(--space-1);
      margin-top: var(--space-1);
    }

    .rating-stars i {
      color: #fbbf24;
      font-size: var(--text-sm);
    }

    .main-content {
      margin-bottom: var(--space-8);
    }

    .active-delivery, .available-orders {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .delivery-header, .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .delivery-header h2, .orders-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .delivery-header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
    }

    .refresh-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--bg-light);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .delivery-status {
      display: flex;
      align-items: center;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .status-delivery {
      background: color-mix(in oklab, var(--color-primary) 15%, white);
      color: var(--color-primary);
    }

    .delivery-details {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .delivery-info h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin-bottom: var(--space-2);
    }

    .delivery-address, .delivery-time {
      margin: var(--space-1) 0;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .delivery-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .btn {
      padding: 8px 12px !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-weight: 500 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      transition: all 0.2s ease !important;
      font-size: 14px !important;
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: color-mix(in oklab, var(--color-success) 20%, black);
    }

    .btn-warning {
      background: var(--color-warning);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: color-mix(in oklab, var(--color-warning) 20%, black);
    }

    .btn-secondary {
      background: #f0f8ff !important;
      color: #2563eb !important;
      border: 1px solid #e0e7ff !important;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e0e7ff !important;
      border-color: #c7d2fe !important;
    }

    .maps-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      padding: var(--space-2) var(--space-3);
    }

    .btn-ghost {
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--bg-light);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .delivery-items {
      background: var(--bg-light);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
    }

    .delivery-items h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .delivery-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2);
      background: var(--color-surface);
      border-radius: var(--radius-sm);
    }

    .delivery-total {
      text-align: right;
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-2);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .no-orders, .no-deliveries {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .no-orders i, .no-deliveries i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      color: var(--color-border);
    }

    .order-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: var(--bg-light);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .order-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
    }

    .order-time {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .order-value {
      text-align: right;
    }

    .order-total {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .order-value small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .delivery-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .delivery-address, .estimated-time {
      font-size: var(--text-sm);
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .order-items-preview {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .item-preview {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .more-items {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
    }

    .order-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
    }

    .recent-deliveries {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .recent-deliveries h2 {
      margin: 0 0 var(--space-6) 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .deliveries-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .delivery-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .delivery-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-sm);
    }

    .delivery-date {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .delivery-amount {
      text-align: right;
    }

    .amount {
      font-weight: 700;
      color: var(--color-success);
    }

    .delivery-amount small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
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

    .loading-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Delivery cards for multiple deliveries */
    .delivery-card {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      transition: all var(--transition);
    }

    .delivery-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .delivery-card.primary-delivery {
      border-left: 4px solid var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    .delivery-card:not(.primary-delivery) {
      opacity: 0.8;
    }

    .delivery-card:not(.primary-delivery) .delivery-header {
      font-size: var(--text-sm);
    }

    /* Sequence Badge Styles */
    .delivery-header-with-badge {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-bottom: var(--space-2);
    }

    .sequence-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      border-radius: var(--radius-lg);
      font-weight: 700;
      color: white;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }

    .sequence-badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
      border-radius: var(--radius-lg);
    }

    .sequence-number {
      font-size: var(--text-xl);
      line-height: 1;
      z-index: 1;
      position: relative;
    }

    /* Sequence badge colors - erhöhte Spezifität für garantierte Anzeige */
    .driver-dashboard .sequence-badge.sequence-1 {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-2 {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-3 {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-4 {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-5 {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-6 {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-7 {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-8 {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-9 {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
    }

    .driver-dashboard .sequence-badge.sequence-10 {
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
    }

    /* Route Progress Indicator */
    .route-progress {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      border: 1px solid var(--color-border);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .progress-label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .progress-count {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: color-mix(in oklab, var(--color-border) 50%, white);
      border-radius: 4px;
      margin-bottom: var(--space-4);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-success) 0%, var(--color-primary) 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      margin-top: var(--space-2);
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      max-width: 60px;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--text-sm);
      color: var(--color-muted);
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      transition: all var(--transition);
      position: relative;
      z-index: 2;
    }

    .step-line {
      position: absolute;
      top: 16px;
      left: 50%;
      right: -50%;
      height: 2px;
      background: var(--color-border);
      z-index: 1;
    }

    .progress-step.active .step-number {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: scale(1.1);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 20%, white);
    }

    .progress-step.completed .step-number {
      background: var(--color-success);
      color: white;
      border-color: var(--color-success);
    }

    .progress-step.upcoming .step-number {
      opacity: 0.6;
    }

    .progress-step.active ~ .progress-step .step-line {
      background: color-mix(in oklab, var(--color-border) 50%, white);
    }

    .progress-step.completed .step-line {
      background: var(--color-success);
    }

    /* Responsive adjustments for badges */
    @media (max-width: 768px) {
      .delivery-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .delivery-header-actions {
        flex-direction: row;
        align-items: center;
        width: 100%;
        justify-content: space-between;
      }

      .maps-btn {
        font-size: var(--text-xs);
        padding: var(--space-2);
      }

      .delivery-header-with-badge {
        gap: var(--space-2);
      }

      .sequence-badge {
        min-width: 35px;
        height: 35px;
      }

      .sequence-number {
        font-size: var(--text-sm);
      }

      .route-progress {
        padding: var(--space-3);
      }

      .progress-steps {
        margin-top: var(--space-2);
      }

      .progress-step {
        max-width: 45px;
      }

      .step-number {
        width: 28px;
        height: 28px;
        font-size: var(--text-xs);
      }

      .step-line {
        top: 14px;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .status-section {
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .delivery-details {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .order-details {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .delivery-card {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .delivery-amount {
        text-align: left;
      }
    }
  `]
})
export class DriverDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  user$ = this.authService.currentUser$;
  availableOrders$ = of([] as any[]); // Will be populated from API
  activeDelivery$ = of(null as any); // Will be populated from API
  activeDeliveries$ = of([] as any[]); // Multiple active deliveries
  recentDeliveries$ = of([] as any[]); // Will be populated from API

  togglingStatus = false;
  refreshing = false;
  acceptingOrder = false;

  // Mock driver stats - in real app this would come from API
  driverStats: DriverStats = {
    totalDeliveries: 156,
    todayDeliveries: 3,
    totalEarnings: 2340.50,
    todayEarnings: 45.80,
    averageRating: 4.8,
    currentStatus: 'available'
  };

  workHoursToday = 6.5;
  onlineSince = '08:30';

  ngOnInit() {
    this.loadDriverData();
    // Refresh orders every 1 minute (60 seconds) when available - balanced polling
    interval(60000).subscribe(() => {
      if (this.driverStats.currentStatus === 'available') {
        this.loadAvailableOrders();
      }
    });
  }

  private loadDriverData() {
    // Load driver stats, active delivery, etc.
    this.loadActiveDelivery();
    this.loadAvailableOrders();
    this.loadRecentDeliveries();
  }

  private loadActiveDelivery() {
    const orders$ = this.ordersService.getMyDriverOrders().pipe(
      catchError(() => of({ activeDelivery: null, activeDeliveries: [], availableOrders: [], count: 0 }))
    );

    this.activeDelivery$ = orders$.pipe(
      map(result => result.activeDelivery)
    );

    this.activeDeliveries$ = orders$.pipe(
      map(result => result.activeDeliveries)
    );
  }

  private loadAvailableOrders() {
    this.refreshing = true;
    this.availableOrders$ = this.ordersService.getAvailableOrders().pipe(
      tap(() => this.refreshing = false),
      catchError(() => {
        this.refreshing = false;
        return of([]);
      })
    );
  }

  private loadRecentDeliveries() {
    // In real app, this would call the orders service
    // this.recentDeliveries$ = this.ordersService.getDriverDeliveryHistory();
    console.log('Loading recent deliveries...');
  }

  toggleStatus() {
    if (this.togglingStatus) return;

    this.togglingStatus = true;

    const newStatus = this.driverStats.currentStatus === 'available' ? 'offline' : 'available';

    // In real app, this would call the API
    setTimeout(() => {
      this.driverStats.currentStatus = newStatus;
      this.togglingStatus = false;

      if (newStatus === 'available') {
        this.loadAvailableOrders();
      }
    }, 1000);
  }

  acceptOrder(order: Order) {
    if (this.acceptingOrder) return;

    this.acceptingOrder = true;

    // In real app, this would call the orders service
    setTimeout(() => {
      this.acceptingOrder = false;
      // Set as active delivery
      // this.activeDelivery$ = of(order);
      // Remove from available orders
      alert(`Auftrag #${order.id} wurde angenommen!`);
    }, 1000);
  }

  markAsDelivered(order: Order) {
    if (confirm('Möchten Sie diese Lieferung als abgeschlossen markieren?')) {
      this.ordersService.updateOrderStatus(order.id, 'delivered').subscribe({
        next: (response) => {
          this.toastService.success('Erfolg', 'Lieferung wurde als abgeschlossen markiert!');
          // Reload driver data to update the dashboard
          this.loadActiveDelivery();
          this.loadAvailableOrders();
        },
        error: (error) => {
          console.error('Error marking delivery as completed:', error);
          const errorMessage = error.error?.error || 'Fehler beim Aktualisieren der Lieferung';
          this.toastService.error('Fehler', errorMessage);
        }
      });
    }
  }

  contactCustomer(order: Order) {
    // In real app, this would open phone app or messaging
    const phoneNumber = '+49 123 456789'; // Would come from order data
    window.open(`tel:${phoneNumber}`);
  }

  viewOrderDetails(order: Order) {
    // TODO: Implement order details modal
    console.log('View order details:', order);
  }

  openRouteInGoogleMaps() {
    // Subscribe to get current value of activeDeliveries$
    this.activeDeliveries$.subscribe(activeDeliveries => {
      if (activeDeliveries && activeDeliveries.length > 0) {
        // Sammle alle Lieferadressen
        const addresses = activeDeliveries.map((delivery: any) => delivery.delivery_address);

      // Erstelle Google Maps URL mit Wegpunkten
      let googleMapsUrl = 'https://www.google.com/maps/dir/';

      // Erste Adresse als Startpunkt
      googleMapsUrl += encodeURIComponent(addresses[0]);

      // Alle weiteren Adressen als Wegpunkte
      if (addresses.length > 1) {
        googleMapsUrl += '/';
        for (let i = 1; i < addresses.length; i++) {
          googleMapsUrl += encodeURIComponent(addresses[i]);
          if (i < addresses.length - 1) {
            googleMapsUrl += '/';
          }
        }
      }

        // Öffne Google Maps in neuem Tab
        window.open(googleMapsUrl, '_blank');
      }
    });
  }

  refreshOrders() {
    if (this.refreshing) return;

    this.refreshing = true;
    setTimeout(() => {
      this.loadAvailableOrders();
      this.refreshing = false;
    }, 1000);
  }

  getStatusLabel(status: DriverStats['currentStatus']): string {
    const labels = {
      available: 'Verfügbar',
      busy: 'Beschäftigt',
      offline: 'Offline',
      on_delivery: 'In Lieferung'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: DriverStats['currentStatus']): string {
    const icons = {
      available: 'fa-circle-check',
      busy: 'fa-clock',
      offline: 'fa-circle-xmark',
      on_delivery: 'fa-truck'
    };
    return icons[status] || 'fa-circle';
  }
}
