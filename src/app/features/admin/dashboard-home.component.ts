import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-home-container">
      <!-- Welcome Header -->
      <div class="welcome-header">
        <h1>Willkommen im Admin-Bereich</h1>
        <p>Übersicht und Verwaltung der Odenwald-App Plattform</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div *ngFor="let stat of dashboardStats" class="stat-card" [class]="'trend-' + stat.trend">
          <div class="stat-icon">
            <i [ngClass]="stat.iconClass"></i>
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

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2 class="section-title">Schnellzugriff</h2>
        <div class="quick-actions-grid">
          <div *ngFor="let action of quickActions" class="action-card" [routerLink]="action.route">
            <div class="action-icon">
              <i [ngClass]="action.icon"></i>
            </div>
            <div class="action-content">
              <h3>{{ action.title }}</h3>
              <p>{{ action.description }}</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity-section">
        <h2 class="section-title">Letzte Aktivitäten</h2>
        <div class="activity-list">
          <div *ngFor="let activity of recentActivities" class="activity-item">
            <div class="activity-icon">
              <i [ngClass]="activity.icon"></i>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ activity.time | date:'dd.MM.yyyy HH:mm' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .welcome-header h1 {
      font-size: var(--text-3xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .welcome-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Statistics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
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
      border-color: var(--color-primary-300);
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

    .stat-content h3 {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-1) 0;
      font-weight: 500;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-change {
      font-size: var(--text-sm);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .trend-up {
      color: var(--color-success);
    }

    .trend-down {
      color: var(--color-danger);
    }

    .trend-neutral {
      color: var(--color-muted);
    }

    /* Quick Actions Section */
    .quick-actions-section {
      margin-bottom: var(--space-8);
    }

    .section-title {
      font-size: var(--text-2xl);
      color: var(--color-heading);
      margin-bottom: var(--space-6);
      text-align: center;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
    }

    .action-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
      padding: var(--space-6);
      text-align: center;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary-300);
    }



    .action-content {
      padding: 0;
    }

    .action-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      text-align: center;
    }

    .action-content p {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.5;
      text-align: center;
    }

    .action-icon {
      font-size: var(--text-lg);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-3);
    }

    .action-icon i {
      font-size: var(--text-lg);
      color: var(--color-primary-500);
    }

    /* Recent Activity Section */
    .recent-activity-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      transition: background var(--transition);
    }

    .activity-item:hover {
      background: var(--bg-light-green);
    }

    .activity-icon {
      font-size: var(--text-md);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-right: 12px;
    }

    .activity-icon i {
      font-size: var(--text-md);
      color: var(--color-primary-500);
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .activity-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    .activity-time {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions-grid {
        grid-template-columns: 1fr;
      }

      .welcome-header h1 {
        font-size: var(--text-2xl);
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private http = inject(HttpClient);

  dashboardStats: DashboardStat[] = [];
  quickActions: AdminMenuItem[] = [];
  recentActivities: any[] = [];

  ngOnInit() {
    this.loadDashboardStats();
    this.setupQuickActions();
    this.loadRecentActivities();
  }

  async loadDashboardStats() {
    try {
      const stats = await this.http.get<any[]>(`${environment.apiUrl}/admin/dashboard-stats`).toPromise();
      this.dashboardStats = stats || [];
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.dashboardStats = [];
    }
  }

  setupQuickActions() {
    this.quickActions = [
      {
        id: 'customers',
        title: 'Kundenverwaltung',
        description: 'Alle registrierten Kunden verwalten, Status ändern und Details einsehen',
        icon: '',
        route: '/admin/customers',
        color: '#4aa96c'
      },
      {
        id: 'restaurants',
        title: 'Restaurant-Verwaltung',
        description: 'Restaurants, Speisekarten und Bestellungen verwalten',
        icon: '',
        route: '/admin/restaurants',
        color: '#3B82F6'
      },
      {
        id: 'orders',
        title: 'Bestellverwaltung',
        description: 'Alle Bestellungen einsehen, Status verfolgen und verwalten',
        icon: '',
        route: '/admin/orders',
        color: '#f59e0b'
      }
    ];
  }

  async loadRecentActivities() {
    try {
      const activities = await this.http.get<any[]>(`${environment.apiUrl}/admin/recent-activities`).toPromise();
      this.recentActivities = activities || [];
    } catch (error) {
      console.error('Error loading recent activities:', error);
      this.recentActivities = [];
    }
  }


}
