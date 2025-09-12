import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface WholesalerData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_verified: boolean;
  registration_status: string;
}

@Component({
  selector: 'app-wholesaler-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="wholesaler-dashboard">
      <!-- Sidebar Navigation -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>{{ wholesalerData?.name || 'Großhändler' }}</h2>
          <div class="status-badge" [class]="'status-' + wholesalerData?.registration_status">
            {{ getStatusText(wholesalerData?.registration_status) }}
          </div>
        </div>

        <div class="sidebar-content">
          <ul class="nav-menu">
            <li>
              <a routerLink="overview" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-home"></i>
                <span>Übersicht</span>
              </a>
            </li>
            <li>
              <a routerLink="products" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-box"></i>
                <span>Produkte</span>
              </a>
            </li>
            <li>
              <a routerLink="orders" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-shopping-cart"></i>
                <span>Bestellungen</span>
                <span *ngIf="pendingOrdersCount > 0" class="nav-badge">{{ pendingOrdersCount }}</span>
              </a>
            </li>
            <li>
              <a routerLink="analytics" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-chart-bar"></i>
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a routerLink="profile" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-store"></i>
                <span>Profil</span>
              </a>
            </li>
            <li>
              <a routerLink="settings" routerLinkActive="active" class="nav-link">
                <i class="fa-solid fa-cog"></i>
                <span>Einstellungen</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="fa-solid fa-sign-out-alt"></i>
            <span>Abmelden</span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <header class="content-header">
          <div class="header-actions">
            <button class="notification-btn">
              <i class="fa-solid fa-bell"></i>
            </button>
            <div class="user-menu">
              <span class="user-name">{{ (currentUser$ | async)?.name }}</span>
              <button class="user-avatar">
                <i class="fa-solid fa-user"></i>
              </button>
            </div>
          </div>
        </header>

        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wholesaler-dashboard {
      display: flex;
      min-height: 100vh;
      background: var(--bg-light);
      margin-top: 0;
      position: relative;
    }

    .sidebar {
      width: 260px;
      background: white;
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--gradient-primary);
      color: white;
      flex-shrink: 0;
    }

    .sidebar-header h2 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: white;
    }

    .status-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-approved {
      background: var(--color-success);
      color: white;
    }

    .status-pending {
      background: var(--color-warning);
      color: white;
    }

    .status-rejected {
      background: var(--color-danger);
      color: white;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-menu {
      list-style: none;
      margin: 0;
      padding: var(--space-4) 0;
    }

    .nav-menu li {
      margin: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-6);
      color: var(--color-text);
      text-decoration: none;
      transition: all var(--transition);
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }

    .nav-link:hover {
      background: var(--bg-light);
      color: var(--color-primary);
    }

    .nav-link.active {
      background: var(--color-primary-600);
      color: white;
    }

    .nav-link i {
      width: 20px;
      text-align: center;
    }

    .nav-badge {
      background: var(--color-danger);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      margin-left: var(--space-2);
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .sidebar-footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
      position: sticky;
      bottom: 0;
      background: white;
      z-index: 10;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-danger);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      width: 100%;
      justify-content: center;
    }

    .logout-btn:hover {
      background: var(--color-danger-dark);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: absolute;
      top: 0;
      right: 0;
      left: 260px;
      bottom: 0;
    }

    .content-header {
      background: white;
      border-bottom: 1px solid var(--color-border);
      padding: 0 var(--space-6);
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 64px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .notification-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .notification-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .user-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: var(--gradient-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: none;
      cursor: pointer;
    }

    .content-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
    }

    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .sidebar {
        width: 240px;
      }

      .main-content {
        left: 240px;
      }
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 220px;
      }

      .main-content {
        left: 220px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        position: fixed;
        top: 0;
        left: -100%;
        height: 100vh;
        z-index: 1000;
        transition: left 0.3s ease;
      }

      .sidebar.open {
        left: 0;
      }

      .main-content {
        width: 100%;
        margin-left: 0;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .content-header {
        padding: var(--space-3) var(--space-4);
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .wholesaler-dashboard {
        margin-top: 0;
        min-height: 100vh;
      }
    }
  `]
})
export class WholesalerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  currentUser$ = this.authService.currentUser$;
  wholesalerData: WholesalerData | null = null;
  pendingOrdersCount: number = 0;

  ngOnInit() {
    // Load wholesaler data based on current user
    this.loadWholesalerData();
    this.loadBadgeCounts();
  }

  private loadWholesalerData() {
    // Subscribe to current user and load wholesaler data from API
    this.currentUser$.subscribe(user => {
      if (user) {
        this.http.get<WholesalerData>(`${environment.apiUrl}/wholesalers/profile`).subscribe({
          next: (data) => {
            this.wholesalerData = data;
          },
          error: (error) => {
            console.error('Failed to load wholesaler data:', error);
            // Fallback to default data if API fails
            this.wholesalerData = {
              id: 1,
              name: 'Großhändler',
              slug: 'grosshaendler',
              description: 'Ihr vertrauensvoller Großhändler',
              is_active: true,
              is_verified: false,
              registration_status: 'pending'
            };
          }
        });
      }
    });
  }

  getStatusText(status?: string): string {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'pending': return 'Ausstehend';
      case 'rejected': return 'Abgelehnt';
      default: return 'Unbekannt';
    }
  }

  private loadBadgeCounts() {
    // Load pending orders count for wholesaler
    this.http.get(`${this.getApiUrl()}/wholesaler-orders/stats/pending-wholesaler`).subscribe({
      next: (response: any) => {
        if (response && typeof response === 'object' && 'pending_orders_count' in response) {
          this.pendingOrdersCount = response.pending_orders_count as number;
        }
      },
      error: (error) => {
        console.error('Error loading badge counts:', error);
        this.pendingOrdersCount = 0;
      }
    });
  }

  private getApiUrl(): string {
    return (this.http as any)._defaultOptions?.baseUrl || environment.apiUrl;
  }

  logout() {
    // Clear auth immediately to prevent any further authenticated requests
    this.authService.clearAuth();
    // Optionally try to notify the backend, but don't wait for it
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: () => {
        // If logout request fails, we're already logged out locally
        console.log('Logout request failed, but local auth cleared');
      }
    });
    this.router.navigate(['/auth/login']);
  }
}
