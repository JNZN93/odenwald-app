import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';


export interface ManagerMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

@Component({
  selector: 'app-restaurant-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterOutlet],
  template: `
    <div class="manager-dashboard-container">
      <!-- Navigation Header -->
      <div class="manager-nav-header">
        <nav class="manager-nav">
          <a
            *ngFor="let menuItem of managerMenuItems"
            [routerLink]="menuItem.route"
            routerLinkActive="active"
            class="nav-item"
          >
            <svg class="nav-icon" [class]="menuItem.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <!-- Overview Icon -->
              <g *ngIf="menuItem.icon === 'overview-icon'">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </g>
              <!-- Orders Icon -->
              <g *ngIf="menuItem.icon === 'orders-icon'">
                <path d="M9 11l3 3l8-8"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </g>
              <!-- Menu Icon -->
              <g *ngIf="menuItem.icon === 'menu-icon'">
                <path d="M3 3h18v18H3z"></path>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
              </g>
              <!-- Analytics Icon -->
              <g *ngIf="menuItem.icon === 'analytics-icon'">
                <path d="M3 3v18h18"></path>
                <path d="M18.7 8l-5.1 5.1-2.8-2.7L7 14.3"></path>
              </g>
              <!-- Settings Icon -->
              <g *ngIf="menuItem.icon === 'settings-icon'">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </g>
              <!-- Wholesale Icon -->
              <g *ngIf="menuItem.icon === 'wholesale-icon'">
                <rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect>
                <path d="M16 3l-8 4"></path>
              </g>
            </svg>
            <span>{{ menuItem.title }}</span>
            <span *ngIf="menuItem.badge" class="badge">{{ menuItem.badge }}</span>
          </a>
        </nav>

        <!-- Restaurant Selector -->
        <div class="restaurant-selector" *ngIf="managedRestaurants.length > 1">
          <select
            [(ngModel)]="selectedRestaurantId"
            (change)="onRestaurantChange()"
            class="restaurant-select"
          >
            <option *ngFor="let restaurant of managedRestaurants" [value]="restaurant.restaurant_id">
              {{ restaurant.restaurant_name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      <div class="quick-stats-bar" *ngIf="currentStats">
        <div class="stat-card">
          <div class="stat-label">Heutige Bestellungen</div>
          <div class="stat-value">{{ currentStats.total_orders_today }}</div>
          <div class="stat-change">+12% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Umsatz heute</div>
          <div class="stat-value">€{{ currentStats.total_revenue_today.toFixed(2) }}</div>
          <div class="stat-change">+8% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ø Bestellwert</div>
          <div class="stat-value">€{{ currentStats.average_order_value.toFixed(2) }}</div>
          <div class="stat-change">+5% vs gestern</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bestellungen diese Woche</div>
          <div class="stat-value">{{ currentStats.total_orders_this_week }}</div>
          <div class="stat-change">+15% vs letzte Woche</div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="manager-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .manager-dashboard-container {
      min-height: 100vh;
      background: var(--bg-light-green);
    }

    /* Navigation Header */
    .manager-nav-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
      gap: var(--space-4);
    }



    .manager-nav {
      display: flex;
      gap: var(--space-2);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      color: var(--color-muted);
      text-decoration: none;
      transition: all var(--transition);
      position: relative;
      font-weight: 500;
    }

    .nav-item:hover {
      background: var(--bg-light-green);
      color: var(--color-text);
    }

    .nav-item.active {
      background: var(--color-primary-500);
      color: white;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      opacity: 0.9;
      flex-shrink: 0;
    }

    .badge {
      background: var(--color-danger);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      margin-left: var(--space-1);
    }

    .restaurant-selector {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .restaurant-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    /* Quick Stats Bar */
    .quick-stats-bar {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-6);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .stat-card {
      background: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .stat-change {
      font-size: var(--text-xs);
      color: var(--color-success);
      font-weight: 500;
    }

    /* Main Content Area */
    .manager-content {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .manager-nav-header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .manager-nav {
        flex-wrap: wrap;
        justify-content: center;
      }

      .nav-item {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
      }

      .nav-item span:not(.badge) {
        display: none;
      }

      .quick-stats-bar {
        padding: var(--space-4);
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .manager-content {
        padding: var(--space-4);
      }

      .nav-brand h1 {
        font-size: var(--text-lg);
      }

      .quick-stats-bar {
        grid-template-columns: 1fr;
      }

      .stat-card {
        text-align: center;
      }
    }
  `]
})
export class RestaurantManagerDashboardComponent implements OnInit {
  managedRestaurants: any[] = [
    {
      restaurant_id: '1',
      restaurant_name: 'Bella Italia Restaurant',
      role: 'manager'
    }
  ];

  selectedRestaurantId: string = '1';

  currentStats: any = {
    total_orders_today: 12,
    total_revenue_today: 245.50,
    total_orders_this_week: 87,
    total_revenue_this_week: 1850.30,
    total_orders_this_month: 342,
    total_revenue_this_month: 7280.90,
    average_order_value: 21.29,
    popular_items: [
      { name: 'Pizza Margherita', order_count: 45 },
      { name: 'Pasta Carbonara', order_count: 38 },
      { name: 'Caesar Salad', order_count: 29 }
    ]
  };

  managerMenuItems: ManagerMenuItem[] = [];

  ngOnInit() {
    this.setupManagerMenu();
    if (this.managedRestaurants.length > 0) {
      this.selectedRestaurantId = this.managedRestaurants[0].restaurant_id;
    }
  }

  setupManagerMenu() {
    this.managerMenuItems = [
      {
        id: 'overview',
        title: 'Übersicht',
        description: 'Dashboard und Statistiken',
        icon: 'overview-icon',
        route: '/restaurant-manager/overview',
        color: '#4aa96c'
      },
      {
        id: 'orders',
        title: 'Bestellungen',
        description: 'Bestellungen verwalten',
        icon: 'orders-icon',
        route: '/restaurant-manager/orders',
        color: '#f59e0b'
      },
      {
        id: 'menu',
        title: 'Speisekarte',
        description: 'Menu bearbeiten',
        icon: 'menu-icon',
        route: '/restaurant-manager/menu',
        color: '#3B82F6'
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Berichte & Statistiken',
        icon: 'analytics-icon',
        route: '/restaurant-manager/analytics',
        color: '#ef4444'
      },
      {
        id: 'settings',
        title: 'Einstellungen',
        description: 'Restaurant-Einstellungen',
        icon: 'settings-icon',
        route: '/restaurant-manager/settings',
        color: '#8b5cf6'
      }
      ,
      {
        id: 'wholesale',
        title: 'Großhandel Einkauf',
        description: 'Zutaten und Waren bestellen',
        icon: 'wholesale-icon',
        route: '/restaurant-manager/wholesale',
        color: '#10b981'
      }
    ];
  }

  onRestaurantChange() {
    // Mock restaurant change
    console.log('Restaurant changed to:', this.selectedRestaurantId);
  }
}
