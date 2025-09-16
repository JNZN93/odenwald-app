import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

//* eslint-disable @typescript-eslint/no-explicit-any
//* eslint-disable @typescript-eslint/no-unused-vars

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

        <div class="nav-container">
          <button
            class="nav-scroll-btn nav-scroll-left"
            (click)="scrollNav('left')"
            [class.disabled]="!canScrollLeft"
            aria-label="Nach links scrollen"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          <nav class="admin-nav" #navElement>
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

          <button
            class="nav-scroll-btn nav-scroll-right"
            (click)="scrollNav('right')"
            [class.disabled]="!canScrollRight"
            aria-label="Nach rechts scrollen"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
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
      justify-content: space-between;
      align-items: center;
      min-height: 80px;
    }

    .nav-container {
      display: flex;
      align-items: center;
      flex: 1;
      position: relative;
      padding: 0 var(--space-2);
    }

    .nav-scroll-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      cursor: pointer;
      transition: all var(--transition);
      z-index: 15;
      flex-shrink: 0;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin: 0 var(--space-1);
    }

    .nav-scroll-btn:hover:not(.disabled) {
      background: var(--bg-light-green);
      color: var(--color-text);
      border-color: var(--color-primary-200);
    }

    .nav-scroll-btn.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-scroll-btn i {
      font-size: var(--text-sm);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .admin-nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
      /* Webkit scrollbar styling */
      scrollbar-gutter: stable;
      flex: 1;
      padding: 0 var(--space-2);
    }

    .admin-nav::-webkit-scrollbar {
      height: 4px;
    }

    .admin-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .admin-nav::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 2px;
    }

    .admin-nav::-webkit-scrollbar-thumb:hover {
      background: var(--color-muted);
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
      flex-shrink: 0;
      white-space: nowrap;
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

      .nav-container {
        width: 100%;
        padding: 0 var(--space-1);
      }

      .admin-nav {
        flex-wrap: nowrap;
        justify-content: flex-start;
        /* Bei kleineren Bildschirmen trotzdem horizontal scrollen */
      }

      .nav-scroll-btn {
        width: 36px;
        height: 36px;
        margin: 0 var(--space-1);
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

      .nav-scroll-btn {
        width: 32px;
        height: 32px;
        margin: 0 var(--space-1);
      }

      .nav-scroll-btn i {
        font-size: 12px;
      }

      .nav-container {
        padding: 0 var(--space-1);
      }
    }

    @media (max-width: 480px) {
      .nav-scroll-btn {
        display: none;
      }

      .nav-container {
        justify-content: center;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('navElement') navElement!: ElementRef<HTMLElement>;

  adminMenuItems: AdminMenuItem[] = [];
  canScrollLeft = false;
  canScrollRight = false;

  ngOnInit() {
    this.setupAdminMenu();
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.setupScrollListener();
      this.updateScrollButtons();
    }, 0);
  }

  scrollNav(direction: 'left' | 'right') {
    if (!this.navElement) return;

    const nav = this.navElement.nativeElement;
    const scrollAmount = 300; // pixels to scroll

    if (direction === 'left') {
      nav.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      nav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  updateScrollButtons() {
    if (!this.navElement) return;

    const nav = this.navElement.nativeElement;
    const newCanScrollLeft = nav.scrollLeft > 0;
    const newCanScrollRight = nav.scrollLeft < (nav.scrollWidth - nav.clientWidth - 1);

    // Only update if values actually changed
    if (this.canScrollLeft !== newCanScrollLeft || this.canScrollRight !== newCanScrollRight) {
      this.canScrollLeft = newCanScrollLeft;
      this.canScrollRight = newCanScrollRight;
      this.cdr.detectChanges();
    }
  }

  setupScrollListener() {
    if (!this.navElement) return;

    const nav = this.navElement.nativeElement;
    const updateButtons = () => this.updateScrollButtons();

    nav.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);

    // Store references for cleanup
    (this as any).scrollHandler = updateButtons;
  }

  ngOnDestroy() {
    // Cleanup event listeners
    if ((this as any).scrollHandler) {
      const nav = this.navElement?.nativeElement;
      if (nav) {
        nav.removeEventListener('scroll', (this as any).scrollHandler);
      }
      window.removeEventListener('resize', (this as any).scrollHandler);
    }
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
        id: 'wholesaler-registrations',
        title: 'Großhändler',
        description: 'Großhändler-Registrierungen',
        icon: 'fa-solid fa-warehouse',
        route: '/admin/wholesaler-registrations',
        color: '#f59e0b'
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
        id: 'issues',
        title: 'Probleme',
        description: 'Gemeldete Bestell-Probleme',
        icon: 'fa-solid fa-triangle-exclamation',
        route: '/admin/issues',
        color: '#ef4444'
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
      // Only app_admin can see wholesaler registrations
      if (item.id === 'wholesaler-registrations') {
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
          // Tenant admin can see most items except registrations, restaurant-dashboard, and issues
          if (item.id === 'issues') return false;
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
