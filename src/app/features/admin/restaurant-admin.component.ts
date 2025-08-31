import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ShoppingComponent } from '../shopping/shopping.component';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { environment } from '../../../environments/environment';

export interface Order {
  id: string;
  customer_name: string;
  customer_address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  order_time: string;
  estimated_delivery: string;
}

export interface Statistic {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ShoppingComponent, ImageFallbackDirective],
  template: `
    <div class="restaurant-dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1><i class="fa-solid fa-utensils"></i> Restaurant Dashboard</h1>
        <p>Verwalte dein Restaurant, Bestellungen und Einkäufe</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div *ngFor="let stat of quickStats" class="stat-card" [class]="'trend-' + stat.trend">
          <div class="stat-icon">
            <i class="fa-solid" [ngClass]="stat.icon"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stat.label }}</h3>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-change" [class]="'trend-' + stat.trend">
              {{ stat.change }}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div class="content-tabs">
        <div class="tab-buttons">
          <button
            *ngFor="let tab of tabs"
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)"
            class="tab-btn"
          >
            <i class="fa-solid" [ngClass]="tab.icon"></i>
            {{ tab.label }}
          </button>
        </div>

        <!-- Orders Tab -->
        <div *ngIf="activeTab === 'orders'" class="tab-content">
          <div class="tab-header">
            <h2>Kundenbestellungen</h2>
            <div class="order-filters">
              <select [(ngModel)]="orderStatusFilter" (change)="filterOrders()">
                <option value="">Alle Status</option>
                <option value="pending">Ausstehend</option>
                <option value="confirmed">Bestätigt</option>
                <option value="preparing">Wird zubereitet</option>
                <option value="ready">Bereit</option>
                <option value="delivered">Geliefert</option>
              </select>
            </div>
          </div>
          
          <div class="orders-list">
            <div *ngFor="let order of filteredOrders" class="order-card">
              <div class="order-header">
                <div class="order-info">
                  <h4>Bestellung #{{ order.id }}</h4>
                  <p>{{ order.customer_name }} - {{ order.customer_address }}</p>
                  <span class="order-time">{{ order.order_time }}</span>
                </div>
                <div class="order-status" [class]="'status-' + order.status">
                  {{ getStatusLabel(order.status) }}
                </div>
              </div>
              
              <div class="order-items">
                <div *ngFor="let item of order.items" class="order-item">
                  <span>{{ item.name }} × {{ item.quantity }}</span>
                  <span>{{ item.price }}€</span>
                </div>
              </div>
              
              <div class="order-footer">
                <div class="order-total">
                  <strong>Gesamt: {{ order.total }}€</strong>
                </div>
                <div class="order-actions">
                  <button
                    *ngIf="order.status === 'pending'"
                    (click)="updateOrderStatus(order.id, 'confirmed')"
                    class="action-btn confirm-btn"
                  >
                    <i class="fa-solid fa-check"></i>
                    Bestätigen
                  </button>
                  <button
                    *ngIf="order.status === 'confirmed'"
                    (click)="updateOrderStatus(order.id, 'preparing')"
                    class="action-btn prepare-btn"
                  >
                    <i class="fa-solid fa-utensils"></i>
                    Zubereitung starten
                  </button>
                  <button
                    *ngIf="order.status === 'preparing'"
                    (click)="updateOrderStatus(order.id, 'ready')"
                    class="action-btn ready-btn"
                  >
                    <i class="fa-solid fa-check-circle"></i>
                    Bereit
                  </button>
                  <button
                    *ngIf="order.status === 'ready'"
                    (click)="updateOrderStatus(order.id, 'delivered')"
                    class="action-btn deliver-btn"
                  >
                    <i class="fa-solid fa-truck"></i>
                    Als geliefert markieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu Management Tab -->
        <div *ngIf="activeTab === 'menu'" class="tab-content">
          <div class="tab-header">
            <h2>Speisekarte verwalten</h2>
            <button class="add-btn" (click)="addMenuItem()">
              <i class="fa-solid fa-plus"></i>
              <span>Neues Gericht</span>
            </button>
          </div>
          
          <div class="menu-categories">
            <div *ngFor="let category of menuCategories" class="category-section">
              <h3>{{ category.name }}</h3>

              <!-- Table/List Header -->
              <div class="table-header">
                <div class="col-image">Bild</div>
                <div class="col-name">Name</div>
                <div class="col-description">Beschreibung</div>
                <div class="col-tags">Tags</div>
                <div class="col-price">Preis</div>
                <div class="col-actions">Aktionen</div>
              </div>

              <!-- Menu Items List -->
              <div class="menu-items-list">
                <div *ngFor="let item of category.items" class="menu-item-row">
                  <div class="col-image">
                    <div class="item-image">
                      <img [src]="item.image_url || ''" [alt]="item.name" appImageFallback>
                    </div>
                  </div>

                  <div class="col-name">
                    <h4>{{ item.name }}</h4>
                    <!-- Tags for mobile (shown inline with name) -->
                    <div class="mobile-tags" *ngIf="item.is_vegetarian || item.is_vegan || item.is_gluten_free">
                      <span *ngIf="item.is_vegetarian" class="tag vegetarian">V</span>
                      <span *ngIf="item.is_vegan" class="tag vegan">VG</span>
                      <span *ngIf="item.is_gluten_free" class="tag gluten-free">GF</span>
                    </div>
                  </div>

                  <div class="col-description">
                    <p>{{ item.description }}</p>
                  </div>

                  <div class="col-tags">
                    <div class="item-tags" *ngIf="item.is_vegetarian || item.is_vegan || item.is_gluten_free">
                      <span *ngIf="item.is_vegetarian" class="tag vegetarian">V</span>
                      <span *ngIf="item.is_vegan" class="tag vegan">VG</span>
                      <span *ngIf="item.is_gluten_free" class="tag gluten-free">GF</span>
                    </div>
                  </div>

                  <div class="col-price">
                    <span class="price">{{ item.price }}€</span>
                  </div>

                  <div class="col-actions">
                    <button class="edit-btn" (click)="editMenuItem(item)" title="Bearbeiten">
                      <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="delete-btn" (click)="deleteMenuItem(item.id)" title="Löschen">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shopping Tab -->
        <div *ngIf="activeTab === 'shopping'" class="tab-content">
          <div class="tab-header">
            <h2>Einkäufe bei Lieferanten</h2>
            <button class="add-btn" (click)="goToShopping()">
              <i class="fa-solid fa-plus"></i>
              <span>Neuer Einkauf</span>
            </button>
          </div>
          <app-shopping></app-shopping>
          
          <div class="shopping-summary">
            <div class="summary-card">
              <h3>Letzte Einkäufe</h3>
              <div class="recent-orders">
                <div *ngFor="let order of recentOrders" class="order-summary">
                  <div class="order-details">
                    <span class="order-id">#{{ order.id }}</span>
                    <span class="order-date">{{ order.created_at | date:'short' }}</span>
                    <span class="order-total">{{ order.total }}€</span>
                  </div>
                  <div class="order-status" [class]="'status-' + order.status">
                    {{ getOrderStatusLabel(order.status) }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="summary-card">
              <h3>Einkaufs-Statistiken</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <span>Diesen Monat:</span>
                  <span>{{ monthlySpending }}€</span>
                </div>
                <div class="stat-item">
                  <span>Letzter Monat:</span>
                  <span>{{ lastMonthSpending }}€</span>
                </div>
                <div class="stat-item">
                  <span>Durchschnitt pro Bestellung:</span>
                  <span>{{ averageOrderValue }}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics Tab -->
        <div *ngIf="activeTab === 'analytics'" class="tab-content">
          <div class="tab-header">
            <h2>Statistiken & Analysen</h2>
            <div class="date-range">
              <select [(ngModel)]="analyticsPeriod">
                <option value="7">Letzte 7 Tage</option>
                <option value="30">Letzte 30 Tage</option>
                <option value="90">Letzte 90 Tage</option>
              </select>
            </div>
          </div>
          
          <div class="analytics-grid">
            <div class="chart-card">
              <h3>Umsatz-Entwicklung</h3>
              <div class="chart-placeholder">
                Umsatz-Chart wird hier angezeigt
              </div>
            </div>
            
            <div class="chart-card">
              <h3>Beliebteste Gerichte</h3>
              <div class="popular-items">
                <div *ngFor="let item of popularItems" class="popular-item">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-count">{{ item.count }}x bestellt</span>
                </div>
              </div>
            </div>
            
            <div class="chart-card">
              <h3>Kundenverhalten</h3>
              <div class="customer-stats">
                <div class="stat-row">
                  <span>Neue Kunden:</span>
                  <span>{{ newCustomers }}</span>
                </div>
                <div class="stat-row">
                  <span>Wiederholungskäufer:</span>
                  <span>{{ returningCustomers }}</span>
                </div>
                <div class="stat-row">
                  <span>Durchschnittlicher Bestellwert:</span>
                  <span>{{ averageOrderValue }}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restaurant-dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .dashboard-header h1 {
      color: var(--color-heading);
      margin-bottom: 10px;
      font-size: var(--text-3xl);
    }

    .dashboard-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      text-align: left;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .stat-icon i {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
    }

    .stat-content {
      flex: 1;
    }

    .stat-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: bold;
      color: var(--color-heading);
      margin-bottom: 5px;
    }

    .stat-change {
      font-size: var(--text-sm);
      font-weight: bold;
    }

    .trend-up .stat-change {
      color: var(--color-success);
    }

    .trend-down .stat-change {
      color: var(--color-danger);
    }

    .trend-neutral .stat-change {
      color: var(--color-muted);
    }

    /* Content Tabs */
    .content-tabs {
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .tab-buttons {
      display: flex;
      background: var(--bg-light-green);
      border-bottom: 1px solid var(--color-border);
    }

    .tab-btn {
      flex: 1;
      padding: var(--space-5);
      border: none;
      background: none;
      cursor: pointer;
      font-size: var(--text-md);
      font-weight: 500;
      color: var(--color-muted);
      transition: all var(--transition);
      border-bottom: 3px solid transparent;
    }

    .tab-btn:hover {
      background: var(--bg-light-green);
      color: var(--color-primary-600);
    }

    .tab-btn.active {
      color: var(--color-primary-600);
      border-bottom-color: var(--color-primary-600);
      background: white;
    }

    .tab-content {
      padding: var(--space-8);
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
    }

    .tab-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
    }

    .add-btn {
      background: var(--color-primary-600);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 600;
      font-size: var(--text-sm);
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .add-btn:hover {
      background: var(--color-primary-700);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .add-btn i {
      font-size: var(--text-md);
    }

    /* Orders Tab */
    .order-filters select {
      padding: 10px 15px;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      font-size: 14px;
    }

    .orders-list {
      display: grid;
      gap: var(--space-5);
    }

    .order-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      background: var(--bg-light-green);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .order-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .order-info p {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .order-time {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .order-status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: bold;
      text-transform: uppercase;
    }

    .status-pending { background: #fff3cd; color: #856404; }
    .status-confirmed { background: #d1ecf1; color: #0c5460; }
    .status-preparing { background: #d4edda; color: #155724; }
    .status-ready { background: #cce5ff; color: #004085; }
    .status-delivered { background: #d1e7dd; color: #0f5132; }

    .order-items {
      margin-bottom: 15px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-sm);
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-total {
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .order-actions {
      display: flex;
      gap: var(--space-3);
    }

    .action-btn {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-xs);
      font-weight: bold;
      transition: all var(--transition);
    }

    .confirm-btn { background: var(--color-success); color: white; }
    .prepare-btn { background: var(--color-warning); color: white; }
    .ready-btn { background: var(--color-primary-600); color: white; }
    .deliver-btn { background: var(--color-primary-700); color: white; }

    .action-btn:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    /* Menu Management Tab */
    .menu-categories {
      display: grid;
      gap: var(--space-6);
    }

    .category-section h3 {
      color: var(--color-heading);
      margin-bottom: var(--space-4);
      font-size: var(--text-lg);
      font-weight: 600;
      letter-spacing: -0.025em;
    }

    /* Table Header */
    .table-header {
      display: grid;
      grid-template-columns: 80px 1fr 2fr 120px 100px 120px;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-6);
      background: #0f5132;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      font-weight: 600;
      color: white;
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #0f5132;
      border-bottom: none;
      box-shadow: 0 2px 8px rgba(15, 81, 50, 0.2);
    }

    .table-header > div {
      display: flex;
      align-items: center;
    }

    /* Menu Items List */
    .menu-items-list {
      border: 1px solid #0f5132;
      border-top: none;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
      background: white;
    }

    .menu-item-row {
      display: grid;
      grid-template-columns: 80px 1fr 2fr 120px 100px 120px;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      transition: background-color var(--transition);
      align-items: center;
    }

    .menu-item-row:last-child {
      border-bottom: none;
    }

    .menu-item-row:hover {
      background: rgba(22, 163, 74, 0.05);
      border-left: 3px solid #0f5132;
    }

    /* Column Styles */
    .col-image {
      display: flex;
      justify-content: center;
    }

    .item-image {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-light-green);
      flex-shrink: 0;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .col-name h4 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-md);
      font-weight: 600;
      line-height: 1.3;
    }

    .mobile-tags {
      display: none; /* Hidden by default, shown only on mobile */
      margin-top: var(--space-1);
    }

    .mobile-tags .tag {
      font-size: 10px;
      padding: 1px var(--space-1);
    }

    .col-description p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .col-tags {
      display: flex;
      justify-content: center;
    }

    .item-tags {
      display: flex;
      gap: var(--space-1);
      flex-wrap: wrap;
    }

    .tag {
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
      border: 1px solid;
      background: transparent;
      min-width: 24px;
      text-align: center;
    }

    .vegetarian {
      color: var(--color-success);
      border-color: var(--color-success);
      background: color-mix(in oklab, var(--color-success) 5%, white);
    }
    .vegan {
      color: var(--color-primary-700);
      border-color: var(--color-primary-700);
      background: color-mix(in oklab, var(--color-primary-700) 5%, white);
    }
    .gluten-free {
      color: var(--color-warning);
      border-color: var(--color-warning);
      background: color-mix(in oklab, var(--color-warning) 5%, white);
    }

    .col-price {
      display: flex;
      justify-content: flex-end;
    }

    .price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
      margin: 0;
    }

    .col-actions {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    .edit-btn, .delete-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
      background: transparent;
      color: var(--color-muted);
    }

    .edit-btn:hover {
      background: var(--color-primary-600);
      color: white;
      transform: scale(1.05);
    }

    .delete-btn:hover {
      background: var(--color-danger);
      color: white;
      transform: scale(1.05);
    }

    /* Shopping Tab */
    .shopping-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .summary-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      border: 1px solid #e1e8ed;
    }

    .summary-card h3 {
      color: var(--color-heading);
      margin-bottom: 20px;
      border-bottom: 2px solid var(--color-primary-600);
      padding-bottom: 10px;
    }

    .recent-orders {
      display: grid;
      gap: 15px;
    }

    .order-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
    }

    .order-details {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .order-id {
      font-weight: bold;
      color: #2c3e50;
    }

    .order-date {
      font-size: 12px;
      color: #7f8c8d;
    }

    .order-total {
      font-weight: bold;
      color: #27ae60;
    }

    .stats-list {
      display: grid;
      gap: 15px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e1e8ed;
    }

    /* Analytics Tab */
    .date-range select {
      padding: 10px 15px;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      font-size: 14px;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
    }

    .chart-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      border: 1px solid #e1e8ed;
    }

    .chart-card h3 {
      color: var(--color-heading);
      margin-bottom: 20px;
      border-bottom: 2px solid var(--color-primary-600);
      padding-bottom: 10px;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      color: #7f8c8d;
      font-size: 18px;
      border: 2px dashed #e1e8ed;
      text-align: center;
      padding: 20px;
    }

    .popular-items, .customer-stats {
      display: grid;
      gap: 15px;
    }

    .popular-item, .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e1e8ed;
    }

    .item-count {
      font-weight: bold;
      color: #27ae60;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .tab-buttons {
        flex-direction: column;
      }

      .shopping-summary {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }

      .order-header, .order-footer {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      /* Mobile table layout adjustments */
      .table-header {
        display: none; /* Hide table header on mobile */
      }

      .menu-item-row {
        grid-template-columns: 60px 1fr auto;
        gap: var(--space-3);
        padding: var(--space-3);
      }

      .col-description {
        display: none; /* Hide description column on mobile */
      }

      .col-tags {
        display: none; /* Hide tags column on mobile */
      }

      .col-actions {
        justify-content: flex-end;
      }

      .menu-item-row:hover {
        background: transparent;
      }

      .mobile-tags {
        display: flex;
        gap: var(--space-1);
      }
    }
  `]
})
export class RestaurantDashboardComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private supplierService = inject(SupplierService);
  private restaurantManagerService = inject(RestaurantManagerService);

  activeTab = 'orders';
  orderStatusFilter = '';
  
  quickStats: Statistic[] = [];

  ngOnInit() {
    this.loadStats();
    this.loadOrders();
    this.loadMenuItems();
  }

  async loadStats() {
    try {
      // Get restaurant-specific stats
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Calculate stats based on actual data
      const todayOrders = this.orders.filter(order =>
        new Date(order.order_time) >= todayStart
      );

      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = this.orders.filter(order => order.status === 'pending').length;

      this.quickStats = [
        {
          label: 'Heutiger Umsatz',
          value: `€${todayRevenue.toFixed(2)}`,
          change: '+0%', // Would need historical data
          trend: 'neutral' as const,
          icon: 'fa-euro-sign'
        },
        {
          label: 'Offene Bestellungen',
          value: pendingOrders.toString(),
          change: '0 neue',
          trend: 'neutral' as const,
          icon: 'fa-clock'
        },
        {
          label: 'Aktive Bestellungen',
          value: this.orders.length.toString(),
          change: '0',
          trend: 'neutral' as const,
          icon: 'fa-list-check'
        },
        {
          label: 'Durchschnittsbestellwert',
          value: this.orders.length > 0 ? `€${(this.orders.reduce((sum, order) => sum + order.total, 0) / this.orders.length).toFixed(2)}` : '€0.00',
          change: '0%',
          trend: 'neutral' as const,
          icon: 'fa-calculator'
        }
      ];
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  tabs = [
    { id: 'orders', label: 'Bestellungen', icon: 'fa-list-check' },
    { id: 'menu', label: 'Speisekarte', icon: 'fa-utensils' },
    { id: 'shopping', label: 'Einkäufe', icon: 'fa-shopping-cart' },
    { id: 'analytics', label: 'Statistiken', icon: 'fa-chart-bar' }
  ];

  orders: Order[] = [];

  async loadOrders() {
    try {
      // In a real implementation, this would load orders for the current restaurant
      // For now, we'll initialize with empty array since we don't have restaurant-specific orders yet
      this.filterOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.filterOrders();
    }
  }

  filteredOrders: Order[] = [...this.orders];

  menuCategories: any[] = [];

  private http = inject(HttpClient);

  async loadMenuItems() {
    try {
      console.log('Loading menu items...');

      // Lade alle Restaurants mit Observable zu Promise konvertierung
      const restaurants = await this.restaurantsService.list().toPromise();
      this.menuCategories = [];

      if (!restaurants || restaurants.length === 0) {
        console.log('No restaurants found');
        return;
      }

      // Für jedes Restaurant die Menu-Items laden
      for (const restaurant of restaurants) {
        try {
          const response = await this.http.get<{ menu_items: any[] }>(
            `${environment.apiUrl}/restaurants/${restaurant.id}/menu-items/all`
          ).toPromise();

          if (response && response.menu_items && response.menu_items.length > 0) {
            const category = {
              name: restaurant.name,
              items: response.menu_items.map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: (item.price_cents / 100).toFixed(2),
                image_url: item.image_url,
                is_vegetarian: item.is_vegetarian || false,
                is_vegan: item.is_vegan || false,
                is_gluten_free: item.is_gluten_free || false
              }))
            };

            this.menuCategories.push(category);
          }
        } catch (error) {
          console.error(`Error loading menu items for ${restaurant.name}:`, error);
        }
      }

      console.log('Loaded menu categories:', this.menuCategories.length, 'categories');
      if (this.menuCategories.length > 0) {
        console.log('Sample items:', this.menuCategories[0].items.slice(0, 3));
      } else {
        console.log('No menu items found for any restaurant');
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      this.menuCategories = [];
    }
  }

  recentOrders: any[] = [];
  monthlySpending = 0;
  lastMonthSpending = 0;
  averageOrderValue = 0;
  analyticsPeriod = '30';
  popularItems: any[] = [];
  newCustomers = 0;
  returningCustomers = 0;



  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  filterOrders() {
    if (!this.orderStatusFilter) {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.orderStatusFilter);
    }
  }

  updateOrderStatus(orderId: string, newStatus: Order['status']) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.filterOrders();
    }
  }

  getStatusLabel(status: Order['status']): string {
    const labels = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'Wird zubereitet',
      ready: 'Bereit',
      delivered: 'Geliefert'
    };
    return labels[status];
  }

  addMenuItem() {
    const name = prompt('Name des Gerichts:');
    if (!name) return;
    const priceStr = prompt('Preis in Euro (z.B. 9.99):');
    const price = priceStr ? parseFloat(priceStr) : NaN;
    if (!price || price <= 0) {
      alert('Ungültiger Preis');
      return;
    }

    // Für Manager: nutze das Restaurant aus der eigenen Manager-Zuordnung
    this.restaurantManagerService.getManagedRestaurants().subscribe(managed => {
      if (!managed || managed.length === 0) {
        alert('Kein verwaltetes Restaurant gefunden');
        return;
      }

      const restaurantId = managed[0].restaurant_id;

      const categoryId = prompt('Kategorie-ID (vorhandene Kategorie-ID eingeben):');
      if (!categoryId) {
        alert('Kategorie-ID ist erforderlich');
        return;
      }

      this.restaurantsService.createMenuItem(restaurantId, {
        category_id: categoryId,
        name,
        price_cents: Math.round(price * 100)
      }).subscribe({
        next: () => {
          alert('Gericht erstellt');
          this.loadMenuItems();
        },
        error: (err) => {
          console.error('Fehler beim Erstellen des Gerichts:', err);
          alert('Fehler beim Erstellen des Gerichts: ' + (err?.error?.error || 'Unbekannter Fehler'));
        }
      });
    });
  }

  editMenuItem(item: any) {
    alert(`Gericht bearbeiten: ${item.name}`);
  }

  deleteMenuItem(itemId: string) {
    if (confirm('Möchten Sie dieses Gericht wirklich löschen?')) {
      alert(`Gericht gelöscht: ${itemId}`);
    }
  }

  goToShopping() {
    this.setActiveTab('shopping');
  }

  getOrderStatusLabel(status: string): string {
    const labels = {
      draft: 'Entwurf',
      confirmed: 'Bestätigt',
      processing: 'Wird bearbeitet',
      shipped: 'Versendet',
      delivered: 'Geliefert'
    };
    return labels[status as keyof typeof labels] || status;
  }
}
