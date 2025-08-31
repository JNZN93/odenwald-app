import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export interface DashboardStat {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  iconClass: string;
  color: string;
}

export interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="admin-dashboard-container">
      <!-- Navigation Header -->
      <div class="admin-nav-header">
        <div class="nav-brand">
        </div>
        
        <nav class="admin-nav">
          <a 
            *ngFor="let menuItem of adminMenuItems" 
            [routerLink]="menuItem.route"
            routerLinkActive="active"
            class="nav-item"
          >
            <i [ngClass]="menuItem.icon"></i>
            <span>{{ menuItem.title }}</span>
            <span *ngIf="menuItem.badge" class="badge">{{ menuItem.badge }}</span>
          </a>
        </nav>
      </div>

      <!-- Main Content Area -->
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      min-height: 100vh;
      background: var(--bg-light-green);
    }

    /* Navigation Header */
    .admin-nav-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--space-4) var(--space-6);
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }



    .admin-nav {
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

    .nav-item i {
      font-size: 0.875rem;
      opacity: 0.7;
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

    /* Main Content Area */
    .admin-content {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .admin-nav-header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .admin-nav {
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
    }

    @media (max-width: 768px) {
      .admin-content {
        padding: var(--space-4);
      }

      .nav-brand h1 {
        font-size: var(--text-lg);
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);

  adminMenuItems: AdminMenuItem[] = [];

  ngOnInit() {
    this.setupAdminMenu();
  }

  setupAdminMenu() {
    const allMenuItems: AdminMenuItem[] = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Übersicht der Plattform',
        icon: 'fa-solid fa-gauge',
        route: '/admin/dashboard',
        color: '#4aa96c'
      },
      {
        id: 'customers',
        title: 'Kunden',
        description: 'Kundenverwaltung',
        icon: '',
        route: '/admin/customers',
        color: '#4aa96c',
        badge: 'Neu'
      },
      {
        id: 'restaurants',
        title: 'Restaurants verwalten',
        description: 'Restaurant-Verwaltung',
        icon: 'fa-solid fa-store',
        route: '/admin/restaurants',
        color: '#3B82F6'
      },
      {
        id: 'restaurant-dashboard',
        title: 'Restaurant-Dashboard',
        description: 'Eigenes Restaurant verwalten',
        icon: 'fa-solid fa-utensils',
        route: '/admin/restaurant-dashboard',
        color: '#3B82F6'
      },
      {
        id: 'restaurant-registrations',
        title: 'Registrierungen',
        description: 'Neue Restaurant-Anmeldungen',
        icon: 'fa-solid fa-clipboard-check',
        route: '/admin/restaurant-registrations',
        color: '#f97316'
      },
      {
        id: 'orders',
        title: 'Bestellungen',
        description: 'Bestellverwaltung',
        icon: 'fa-solid fa-list-check',
        route: '/admin/orders',
        color: '#f59e0b'
      },
      {
        id: 'drivers',
        title: 'Fahrer',
        description: 'Fahrer-Management',
        icon: 'fa-solid fa-truck',
        route: '/admin/drivers',
        color: '#8b5cf6'
      },
      {
        id: 'payments',
        title: 'Zahlungen',
        description: 'Zahlungsverwaltung',
        icon: 'fa-solid fa-credit-card',
        route: '/admin/payments',
        color: '#10b981'
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Berichte & Statistiken',
        icon: 'fa-solid fa-chart-pie',
        route: '/admin/analytics',
        color: '#ef4444'
      }
    ];

    // Filter menu items based on user role
    this.adminMenuItems = allMenuItems.filter(item => {
      const userRole = this.authService.currentUserSubject.value?.role;
      
      // Only app_admin can see restaurant registrations
      if (item.id === 'restaurant-registrations') {
        return userRole === 'app_admin';
      }
      
      // Show different restaurant management options based on role
      if (item.id === 'restaurants' && userRole === 'app_admin') {
        return true; // App admin sees "Restaurants verwalten"
      }
      
      if (item.id === 'restaurant-dashboard' && (userRole === 'admin' || userRole === 'manager')) {
        return true; // Admin and manager see "Restaurant-Dashboard"
      }
      
      if (item.id === 'restaurants' && userRole !== 'app_admin') {
        return false; // Hide "Restaurants verwalten" for non-app-admins
      }
      
      if (item.id === 'restaurant-dashboard' && userRole === 'app_admin') {
        return false; // Hide "Restaurant-Dashboard" for app-admin
      }
      
      // For other menu items, show based on role permissions
      switch (userRole) {
        case 'app_admin':
          // App admin can see everything except restaurant-dashboard
          return item.id !== 'restaurant-dashboard';
        case 'admin':
          // Tenant admin can see most items except registrations and restaurant-dashboard
          return item.id !== 'restaurant-registrations' && item.id !== 'restaurant-dashboard';
        case 'manager':
          // Restaurant manager has limited access
          return ['dashboard', 'restaurant-dashboard', 'orders'].includes(item.id);
        default:
          return false;
      }
    });


  }


}
