import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface WholesalerProfile {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_verified: boolean;
  registration_status: string;
}

interface RecentActivity {
  title: string;
  created_at: string;
  icon: string;
}

@Component({
  selector: 'app-wholesaler-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-container">
      <div class="overview-header">
        <h1>{{ profile?.name || 'Dashboard Übersicht' }}</h1>
        <p *ngIf="!profile">Willkommen zurück! Hier ist der aktuelle Status Ihres Großhändler-Kontos.</p>
        <div class="profile-meta" *ngIf="profile">
          <span class="badge" [class]="'status-' + profile.registration_status">{{ getStatusText(profile.registration_status) }}</span>
          <span class="badge" [class]="profile.is_active ? 'status-approved' : 'status-rejected'">{{ profile.is_active ? 'Aktiv' : 'Inaktiv' }}</span>
          <span class="badge" [class]="profile.is_verified ? 'status-approved' : 'status-pending'">{{ profile.is_verified ? 'Verifiziert' : 'Unbestätigt' }}</span>
        </div>
      </div>

      <div class="profile-card" *ngIf="profile">
        <div class="profile-card-header">
          <i class="fa-solid fa-store"></i>
          <h2>Firmenprofil</h2>
        </div>
        <div class="profile-card-body">
          <div class="profile-row">
            <div class="label">Name</div>
            <div class="value">{{ profile.name }}</div>
          </div>
          <div class="profile-row" *ngIf="profile.description">
            <div class="label">Beschreibung</div>
            <div class="value">{{ profile.description }}</div>
          </div>
          <div class="profile-row">
            <div class="label">Slug</div>
            <div class="value">{{ profile.slug }}</div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-box"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats?.totalProducts || 0 }}</h3>
            <p>Gesamt Produkte</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats?.activeProducts || 0 }}</h3>
            <p>Aktive Produkte</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-shopping-cart"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats?.totalOrders || 0 }}</h3>
            <p>Gesamt Bestellungen</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats?.pendingOrders || 0 }}</h3>
            <p>Ausstehende Bestellungen</p>
          </div>
        </div>

        <div class="stat-card revenue">
          <div class="stat-icon">
            <i class="fa-solid fa-euro-sign"></i>
          </div>
          <div class="stat-content">
            <h3>€{{ (stats?.totalRevenue || 0).toFixed(2) }}</h3>
            <p>Gesamtumsatz</p>
          </div>
        </div>

        <div class="stat-card revenue">
          <div class="stat-icon">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>€{{ (stats?.monthlyRevenue || 0).toFixed(2) }}</h3>
            <p>Dieser Monat</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>Kürzliche Aktivitäten</h2>
        <div class="activity-list">
          <div class="activity-item" *ngIf="!recentActivities || recentActivities.length === 0">
            <div class="activity-icon">
              <i class="fa-solid fa-info-circle"></i>
            </div>
            <div class="activity-content">
              <p>Keine kürzlichen Aktivitäten</p>
              <small>Fügen Sie Ihre ersten Produkte hinzu, um loszulegen!</small>
            </div>
          </div>

          <div class="activity-item" *ngFor="let activity of recentActivities">
            <div class="activity-icon">
              <i class="fa-solid" [class]="activity.icon"></i>
            </div>
            <div class="activity-content">
              <p>{{ activity.title }}</p>
              <small>{{ formatDate(activity.created_at) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Schnellzugriff</h2>
        <div class="actions-grid">
          <a routerLink="../products" class="action-card">
            <div class="action-icon">
              <i class="fa-solid fa-plus"></i>
            </div>
            <div class="action-content">
              <h3>Produkt hinzufügen</h3>
              <p>Neues Produkt in Ihren Katalog aufnehmen</p>
            </div>
          </a>

          <a routerLink="../orders" class="action-card">
            <div class="action-icon">
              <i class="fa-solid fa-list"></i>
            </div>
            <div class="action-content">
              <h3>Bestellungen verwalten</h3>
              <p>Offene Bestellungen bearbeiten</p>
            </div>
          </a>

          <a routerLink="../analytics" class="action-card">
            <div class="action-icon">
              <i class="fa-solid fa-chart-bar"></i>
            </div>
            <div class="action-content">
              <h3>Berichte ansehen</h3>
              <p>Verkaufsstatistiken und Trends</p>
            </div>
          </a>

          <a routerLink="../profile" class="action-card">
            <div class="action-icon">
              <i class="fa-solid fa-edit"></i>
            </div>
            <div class="action-content">
              <h3>Profil bearbeiten</h3>
              <p>Firmeninformationen aktualisieren</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .overview-header {
      margin-bottom: var(--space-8);
    }

    .overview-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .overview-header p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .profile-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .status-approved { background: var(--color-success); color: #fff; border-color: var(--color-success); }
    .status-pending { background: var(--color-warning); color: #fff; border-color: var(--color-warning); }
    .status-rejected { background: var(--color-danger); color: #fff; border-color: var(--color-danger); }

    .profile-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .profile-card-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .profile-card-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .profile-card-body {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    .profile-row { display: grid; grid-template-columns: 220px 1fr; gap: var(--space-4); align-items: start; }
    .profile-row .label { color: var(--color-muted); }
    .profile-row .value { color: var(--color-text); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      transition: all var(--transition);
    }

    .stat-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .stat-card.revenue {
      background: var(--gradient-primary);
      color: white;
    }

    .stat-card.revenue * {
      color: white !important;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      background: var(--bg-light);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xl);
      color: var(--color-primary);
    }

    .stat-card.revenue .stat-icon {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .stat-content h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .stat-content p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .recent-activity, .quick-actions {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .recent-activity h2, .quick-actions h2 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-heading);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: var(--color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .activity-content p {
      margin: 0 0 var(--space-1) 0;
      font-weight: 500;
      color: var(--color-heading);
    }

    .activity-content small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--color-text);
      transition: all var(--transition);
    }

    .action-card:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .action-icon {
      width: 50px;
      height: 50px;
      background: var(--color-primary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .action-card:hover .action-icon {
      background: white;
      color: var(--color-primary);
    }

    .action-content h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-base);
      font-weight: 600;
    }

    .action-content p {
      margin: 0;
      font-size: var(--text-sm);
      opacity: 0.8;
    }

    @media (max-width: 1024px) {
      .profile-row { grid-template-columns: 180px 1fr; }
    }

    @media (max-width: 768px) {
      .overview-header h1 { font-size: var(--text-2xl); }
      .overview-header p { font-size: var(--text-base); }

      .profile-card { padding: var(--space-4); }
      .stat-card { padding: var(--space-4); }
      .action-card { padding: var(--space-4); }

      .profile-row { grid-template-columns: 1fr; gap: var(--space-2); }
      .profile-row .label { font-weight: 600; }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .stat-content h3 { font-size: var(--text-xl); }
      .stat-icon { width: 48px; height: 48px; font-size: var(--text-lg); }
    }
  `]
})
export class WholesalerOverviewComponent implements OnInit {
  private http = inject(HttpClient);

  stats: DashboardStats | null = null;
  recentActivities: RecentActivity[] = [];
  profile: WholesalerProfile | null = null;

  ngOnInit() {
    console.log('🚀 Wholesaler Overview Component initialized');
    console.log('🌐 API Base URL:', environment.apiUrl);
    this.loadDashboardStats();
    this.loadWholesalerProfile();
  }

  loadDashboardStats() {
    // Load real stats from the API
    this.loadProductStats();
    this.loadOrderStats();
  }

  private loadProductStats() {
    console.log('🔍 Loading product stats from:', `${environment.apiUrl}/wholesaler-products`);
    this.http.get<any>(`${environment.apiUrl}/wholesaler-products`).subscribe({
      next: (response) => {
        console.log('✅ Product API response:', response);
        // Extract products array from response object
        const products = response?.products || [];
        const productArray = Array.isArray(products) ? products : [];
        const totalProducts = productArray.length;
        const activeProducts = productArray.filter(p => p.is_active !== false).length;
        console.log('📊 Product stats calculated:', { totalProducts, activeProducts });

        // Update stats while preserving existing values
        this.stats = {
          totalProducts,
          activeProducts,
          totalOrders: this.stats?.totalOrders || 0,
          pendingOrders: this.stats?.pendingOrders || 0,
          totalRevenue: this.stats?.totalRevenue || 0,
          monthlyRevenue: this.stats?.monthlyRevenue || 0
        };
      },
      error: (error) => {
        console.error('❌ Product stats API error:', error);
        console.log('📊 Using fallback values for product stats');
        // Keep existing values or set to 0 if undefined
        this.stats = {
          totalProducts: this.stats?.totalProducts || 0,
          activeProducts: this.stats?.activeProducts || 0,
          totalOrders: this.stats?.totalOrders || 0,
          pendingOrders: this.stats?.pendingOrders || 0,
          totalRevenue: this.stats?.totalRevenue || 0,
          monthlyRevenue: this.stats?.monthlyRevenue || 0
        };
      }
    });
  }

  private loadOrderStats() {
    console.log('🔍 Loading order stats from:', `${environment.apiUrl}/wholesaler-orders/wholesaler/orders`);
    this.http.get<any>(`${environment.apiUrl}/wholesaler-orders/wholesaler/orders`).subscribe({
      next: (response) => {
        console.log('✅ Order API response:', response);
        // Extract orders array from response object
        const orders = response?.orders || [];
        const orderArray = Array.isArray(orders) ? orders : [];
        const totalOrders = orderArray.length;
        const pendingOrders = orderArray.filter(o => o.status === 'pending').length;
        console.log('📊 Order stats calculated:', { totalOrders, pendingOrders });

        // Calculate revenue from orders
        const completedOrders = orderArray.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        // Calculate monthly revenue (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyOrders = orderArray.filter(o => {
          const orderDate = new Date(o.created_at);
          return o.status === 'completed' &&
                 orderDate.getMonth() === currentMonth &&
                 orderDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyOrders
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        console.log('💰 Revenue calculated:', {
          completedOrdersCount: completedOrders.length,
          totalRevenue,
          monthlyOrdersCount: monthlyOrders.length,
          monthlyRevenue
        });

        // Update stats
        this.stats = {
          totalProducts: this.stats?.totalProducts || 0,
          activeProducts: this.stats?.activeProducts || 0,
          totalOrders,
          pendingOrders,
          totalRevenue,
          monthlyRevenue
        };

        // Create recent activities from orders
        this.createRecentActivities(orderArray);
      },
      error: (error) => {
        console.error('❌ Order stats API error:', error);
        console.log('📊 Using fallback values for order stats');
        // Keep existing values or set to 0 if undefined
        this.stats = {
          totalProducts: this.stats?.totalProducts || 0,
          activeProducts: this.stats?.activeProducts || 0,
          totalOrders: this.stats?.totalOrders || 0,
          pendingOrders: this.stats?.pendingOrders || 0,
          totalRevenue: this.stats?.totalRevenue || 0,
          monthlyRevenue: this.stats?.monthlyRevenue || 0
        };
        this.recentActivities = [];
      }
    });
  }

  private createRecentActivities(orders: any[]) {
    // Ensure orders is an array
    const orderArray = Array.isArray(orders) ? orders : [];

    // Sort orders by creation date (newest first)
    const sortedOrders = orderArray
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5); // Only show last 5 activities

    this.recentActivities = sortedOrders.map(order => ({
      title: `Bestellung #${order.id} - ${order.status}`,
      created_at: order.created_at,
      icon: order.status === 'completed' ? 'fa-check-circle' :
            order.status === 'pending' ? 'fa-clock' : 'fa-info-circle'
    }));

    // If no orders, show placeholder activity
    if (this.recentActivities.length === 0) {
      this.recentActivities = [{
        title: 'Noch keine Aktivitäten',
        created_at: new Date().toISOString(),
        icon: 'fa-info-circle'
      }];
    }
  }

  loadWholesalerProfile() {
    console.log('🔍 Loading wholesaler profile from:', `${environment.apiUrl}/wholesalers/profile`);
    this.http.get<WholesalerProfile>(`${environment.apiUrl}/wholesalers/profile`).subscribe({
      next: (data) => {
        console.log('✅ Profile API response:', data);
        this.profile = data;
      },
      error: (error) => {
        console.error('❌ Profile API error:', error);
        this.profile = null;
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
