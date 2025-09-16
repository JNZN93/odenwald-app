import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
type IssuePriority = 'low' | 'normal' | 'high';

interface OrderIssueVm {
  id: string;
  order_id: number;
  restaurant_id: number;
  restaurant_name?: string;
  customer_name?: string;
  reason: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  admin_notes?: string;
  assigned_to_restaurant_manager?: boolean;
  assigned_by_admin_id?: number;
  assigned_at?: string;
  restaurant_manager_notes?: string;
  created_at: string;
}

@Component({
  selector: 'app-issues-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="issues-admin-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="header-text">
            <h1>Gemeldete Probleme</h1>
            <p>Verwalte und bearbeite Kundenbeschwerden</p>
          </div>
        </div>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-number">{{ getTotalCount() }}</span>
            <span class="stat-label">Gesamt</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ getStatusCount('open') }}</span>
            <span class="stat-label">Offen</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ getStatusCount('in_progress') }}</span>
            <span class="stat-label">In Bearbeitung</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ getPriorityCount('high') }}</span>
            <span class="stat-label">Hoch Priorität</span>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-container">
          <div class="filter-group">
            <label class="filter-label">
              <i class="fa-solid fa-filter"></i>
              Status filtern:
            </label>
            <select [ngModel]="filters.status" (ngModelChange)="onStatusFilterChange($event)" class="filter-select">
          <option value="">Alle Status</option>
              <option value="open">🔴 Offen</option>
              <option value="in_progress">🟡 In Bearbeitung</option>
              <option value="resolved">🟢 Gelöst</option>
              <option value="dismissed">⚫ Verworfen</option>
        </select>
          </div>

          <div class="filter-group search-group">
            <label class="filter-label">
              <i class="fa-solid fa-search"></i>
              Suchen:
            </label>
            <div class="search-input-wrapper">
              <input
                type="text"
                [ngModel]="filters.search"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Bestell-ID, Restaurant, Grund, Beschreibung..."
                class="search-input"
              />
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Issues List -->
      <div class="issues-list">
        <div *ngFor="let issue of filteredIssues; trackBy: trackByIssueId" class="issue-card" [class]="getPriorityClass(issue.priority)">
          <!-- Issue Header -->
          <div class="issue-header">
            <div class="issue-id-section">
              <span class="issue-id">#{{ issue.id.slice(0, 8) }}</span>
              <span class="issue-priority-badge" [class]="getPriorityBadgeClass(issue.priority)">
                {{ getPriorityLabel(issue.priority) }}
              </span>
            </div>
            <div class="issue-status-section">
              <span class="issue-status-badge" [class]="getStatusClass(issue.status)">
                {{ getStatusLabel(issue.status) }}
              </span>
            </div>
          </div>

          <!-- Issue Content -->
          <div class="issue-content">
            <div class="issue-details">
              <div class="issue-meta">
                <div class="meta-item">
                  <i class="fa-solid fa-shopping-cart"></i>
                  <span>Bestellung #{{ issue.order_id }}</span>
                </div>
                <div class="meta-item">
                  <i class="fa-solid fa-utensils"></i>
                  <span>Restaurant ID: {{ issue.restaurant_id }}</span>
                </div>
                <div class="meta-item">
                  <i class="fa-solid fa-calendar"></i>
                  <span>{{ issue.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="issue-description-section">
                <div class="issue-reason">
                  <strong>{{ getReasonLabel(issue.reason) }}</strong>
                </div>
                <div class="issue-description">
                  {{ issue.description }}
                </div>
              </div>
          </div>

            <!-- Issue Actions -->
          <div class="issue-actions">
              <div class="action-group">
                <label class="action-label">Status:</label>
                <select [ngModel]="issue.status" (ngModelChange)="updateIssueStatus(issue, $event)" class="action-select">
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="resolved">Gelöst</option>
              <option value="dismissed">Verworfen</option>
            </select>
              </div>

              <div class="action-group">
                <label class="action-label">Priorität:</label>
                <select [ngModel]="issue.priority" (ngModelChange)="updateIssuePriority(issue, $event)" class="action-select">
              <option value="low">Niedrig</option>
              <option value="normal">Normal</option>
              <option value="high">Hoch</option>
            </select>
              </div>

              <div class="action-group assign-group">
                <label class="action-label">Zuweisung:</label>
                <button
                  class="assign-btn"
                  [class.assigned]="issue.assigned_to_restaurant_manager"
                  (click)="toggleAssignment(issue)"
                  [disabled]="assigningIssueId === issue.id">
                  <i class="fa-solid" [class]="issue.assigned_to_restaurant_manager ? 'fa-check' : 'fa-share'"></i>
                  {{ issue.assigned_to_restaurant_manager ? 'Zugewiesen' : 'An Restaurant zuweisen' }}
                </button>
                <div *ngIf="issue.assigned_to_restaurant_manager && issue.assigned_at" class="assignment-info">
                  <small>Zugewiesen am {{ issue.assigned_at | date:'dd.MM.yyyy HH:mm' }}</small>
                </div>
              </div>

              <div class="action-group notes-group">
                <label class="action-label">Admin-Notiz:</label>
                <textarea
                  [ngModel]="issue.admin_notes"
                  (ngModelChange)="updateIssueNotes(issue, $event)"
                  placeholder="Interne Notiz hinzufügen..."
                  class="notes-textarea"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredIssues.length === 0" class="empty-state">
          <div class="empty-state-content">
            <div class="empty-icon">
          <i class="fa-solid fa-inbox"></i>
            </div>
            <h3>Keine Einträge gefunden</h3>
            <p>Es wurden keine Probleme gefunden, die Ihren Filterkriterien entsprechen.</p>
            <button class="clear-filters-btn" (click)="clearFilters()" [class.hidden]="!hasActiveFilters()">
              <i class="fa-solid fa-times"></i>
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .issues-admin-container {
      padding: var(--space-8);
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--font-sans);
      color: var(--color-text);
    }

    /* Page Header */
    .page-header {
      margin-bottom: 2rem;
      background: var(--gradient-primary);
      border-radius: var(--radius-xl);
      padding: 2rem;
      color: white;
      box-shadow: var(--shadow-lg);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-icon {
      background: rgba(255, 255, 255, 0.2);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .header-text h1 {
      margin: 0;
      font-size: var(--text-3xl);
      font-weight: 700;
    }

    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: var(--text-lg);
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--space-4);
      margin-top: var(--space-6);
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.15);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .stat-number {
      display: block;
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--text-xs);
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Filters Section */
    .filters-section {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-8);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
    }

    .filters-container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .filter-select {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
      cursor: pointer;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .search-group {
      grid-column: 2;
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: var(--space-3) var(--space-4) var(--space-3) 3rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
    }

    .search-input::placeholder {
      color: var(--color-muted);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .search-icon {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Issues List */
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Issue Cards */
    .issue-card {
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
      overflow: hidden;
      transition: all var(--transition);
      position: relative;
    }

    .issue-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* Priority-based card styling */
    .issue-card.priority-high {
      border-left: 4px solid var(--color-danger);
    }

    .issue-card.priority-normal {
      border-left: 4px solid var(--color-warning);
    }

    .issue-card.priority-low {
      border-left: 4px solid var(--color-success);
    }

    /* Issue Header */
    .issue-header {
      background: var(--color-surface-2);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .issue-id-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .issue-id {
      font-family: 'Monaco', 'Menlo', monospace;
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .issue-priority-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .issue-priority-badge.priority-high {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
      border-color: transparent;
    }

    .issue-priority-badge.priority-normal {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
      border-color: transparent;
    }

    .issue-priority-badge.priority-low {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
      border-color: transparent;
    }

    .issue-status-section {
      display: flex;
      gap: 0.5rem;
    }

    .issue-status-badge {
      padding: var(--space-1) var(--space-4);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .issue-status-badge.status-open {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
    }

    .issue-status-badge.status-in_progress {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
    }

    .issue-status-badge.status-resolved {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
    }

    .issue-status-badge.status-dismissed {
      background: var(--color-surface-2);
      color: var(--color-muted);
      border-color: var(--color-border);
    }

    /* Issue Content */
    .issue-content {
      padding: var(--space-6);
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-8);
    }

    .issue-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .issue-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .meta-item i {
      color: var(--color-muted);
      width: 16px;
      opacity: 0.7;
    }

    .issue-description-section {
      background: var(--bg-light-green);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-primary-500);
    }

    .issue-reason {
      color: var(--color-heading);
      margin-bottom: var(--space-2);
      font-size: var(--text-lg);
    }

    .issue-description {
      color: var(--color-muted);
      line-height: 1.6;
      white-space: pre-line;
    }

    /* Issue Actions */
    .issue-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .action-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .action-label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .action-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
    }

    .action-select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .assign-group {
      margin-bottom: var(--space-4);
    }

    .assign-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-primary-500);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-primary-600);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      width: 100%;
      justify-content: center;
    }

    .assign-btn:hover:not(:disabled) {
      background: var(--color-primary-50);
      transform: translateY(-1px);
    }

    .assign-btn.assigned {
      border-color: var(--color-success-500);
      color: var(--color-success);
      background: color-mix(in oklab, var(--color-success) 10%, white);
    }

    .assign-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .assignment-info {
      margin-top: var(--space-2);
      text-align: center;
    }

    .assignment-info small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .notes-group {
      flex: 1;
    }

    .notes-textarea {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      resize: vertical;
      min-height: 60px;
      transition: all var(--transition);
      font-family: var(--font-sans);
      background: var(--color-surface);
      color: var(--color-text);
    }

    .notes-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
    }

    .empty-state-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      color: var(--color-muted);
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      color: var(--color-heading);
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
    }

    .empty-state p {
      color: var(--color-muted);
      margin: 0 0 var(--space-6) 0;
      line-height: 1.6;
    }

    .clear-filters-btn {
      color: #fff;
      background: var(--color-primary-700);
      box-shadow: 0 6px 14px color-mix(in oklab, var(--color-primary-700) 35%, transparent);
      border: 1px solid transparent;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .clear-filters-btn:hover:not(:disabled) {
      background: var(--color-primary-800);
      box-shadow: 0 8px 20px color-mix(in oklab, var(--color-primary-800) 40%, transparent);
      transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .issues-admin-container {
        padding: var(--space-4);
      }

      .page-header {
        padding: var(--space-6);
      }

      .filters-container {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .search-group {
        grid-column: 1;
      }

      .issue-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .issue-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-4);
      }

      .issue-meta {
        grid-template-columns: 1fr;
      }

      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .issues-admin-container {
        padding: var(--space-3);
      }

      .page-header {
        padding: var(--space-4);
      }

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .header-icon {
        width: 50px;
        height: 50px;
        font-size: 1.25rem;
      }

      .header-text h1 {
        font-size: var(--text-2xl);
      }

      .stats-bar {
        grid-template-columns: 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .stat-item {
        padding: var(--space-3);
      }

      .issue-id-section {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .filters-section {
        padding: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .empty-state {
        padding: 3rem var(--space-4);
      }
    }

    /* Hidden utility class */
    .hidden {
      display: none !important;
    }
  `]
})
export class IssuesAdminComponent implements OnInit {
  private http = inject(HttpClient);
  filters: { status?: IssueStatus | ''; search: string } = { status: '', search: '' };
  issues: OrderIssueVm[] = [];
  filteredIssues: OrderIssueVm[] = [];
  assigningIssueId: string | null = null;

  ngOnInit(): void {
    this.loadIssues();
  }

  loadIssues() {
    const params: any = {};
    if (this.filters.status) params.status = this.filters.status;
    this.http.get<OrderIssueVm[]>(`${environment.apiUrl}/order-issues`, { params }).subscribe({
      next: (data) => { this.issues = data; this.applyFilters(); },
      error: (err) => { console.error('Failed to load issues', err); this.issues = []; this.applyFilters(); }
    });
  }

  applyFilters() {
    const search = (this.filters.search || '').toLowerCase();
    this.filteredIssues = this.issues.filter(i => {
      if (!search) return true;
      return (
        String(i.order_id).includes(search) ||
        String(i.restaurant_id).includes(search) ||
        (i.reason || '').toLowerCase().includes(search) ||
        (i.description || '').toLowerCase().includes(search)
      );
    });
  }

  updateIssue(issue: OrderIssueVm) {
    this.http.patch(`${environment.apiUrl}/order-issues/${issue.id}`, {
      status: issue.status,
      admin_notes: issue.admin_notes,
      priority: issue.priority,
    }).subscribe({
      next: () => {},
      error: (err) => console.error('Failed to update issue', err)
    });
  }

  // Helper methods for styling and display
  getPriorityClass(priority: IssuePriority): string {
    return `priority-${priority}`;
  }

  getPriorityBadgeClass(priority: IssuePriority): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: IssueStatus): string {
    return `status-${status}`;
  }

  getPriorityLabel(priority: IssuePriority): string {
    const labels = {
      low: 'Niedrig',
      normal: 'Normal',
      high: 'Hoch'
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: IssueStatus): string {
    const labels = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      resolved: 'Gelöst',
      dismissed: 'Verworfen'
    };
    return labels[status] || status;
  }

  getReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      cold_food: '🥶 Kaltes Essen',
      wrong_order: '❌ Falsche Bestellung',
      missing_items: '📦 Fehlende Artikel',
      late_delivery: '⏰ Zu späte Lieferung',
      poor_quality: '👎 Schlechte Qualität',
      other: '❓ Sonstiges'
    };
    return labels[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  trackByIssueId(index: number, issue: OrderIssueVm): string {
    return issue.id;
  }

  clearFilters() {
    this.filters.status = '';
    this.filters.search = '';
    this.loadIssues();
  }

  // Helper methods for statistics
  getTotalCount(): number {
    return this.filteredIssues.length;
  }

  getStatusCount(status: IssueStatus): number {
    return this.filteredIssues.filter(i => i.status === status).length;
  }

  getPriorityCount(priority: IssuePriority): number {
    return this.filteredIssues.filter(i => i.priority === priority).length;
  }

  // Event handlers for form controls
  onStatusFilterChange(value: string) {
    this.filters.status = value as IssueStatus | '';
    this.loadIssues();
  }

  onSearchChange(value: string) {
    this.filters.search = value;
    this.applyFilters();
  }

  updateIssueStatus(issue: OrderIssueVm, status: IssueStatus) {
    issue.status = status;
    this.updateIssue(issue);
  }

  updateIssuePriority(issue: OrderIssueVm, priority: IssuePriority) {
    issue.priority = priority;
    this.updateIssue(issue);
  }

  updateIssueNotes(issue: OrderIssueVm, notes: string) {
    issue.admin_notes = notes;
    this.updateIssue(issue);
  }

  toggleAssignment(issue: OrderIssueVm) {
    if (issue.assigned_to_restaurant_manager) {
      // Remove assignment (unassign)
      this.assigningIssueId = issue.id;
      this.http.patch<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}`, {
        assigned_to_restaurant_manager: false,
        assigned_by_admin_id: null,
        assigned_at: null
      }).subscribe({
        next: (updated: OrderIssueVm) => {
          issue.assigned_to_restaurant_manager = updated.assigned_to_restaurant_manager;
          issue.assigned_by_admin_id = updated.assigned_by_admin_id;
          issue.assigned_at = updated.assigned_at;
          this.assigningIssueId = null;
        },
        error: (err) => {
          console.error('Failed to unassign issue', err);
          this.assigningIssueId = null;
        }
      });
    } else {
      // Assign to restaurant
      this.assigningIssueId = issue.id;
      this.http.post<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}/assign-to-restaurant`, {}).subscribe({
        next: (updated: OrderIssueVm) => {
          issue.assigned_to_restaurant_manager = updated.assigned_to_restaurant_manager;
          issue.assigned_by_admin_id = updated.assigned_by_admin_id;
          issue.assigned_at = updated.assigned_at;
          this.assigningIssueId = null;
        },
        error: (err) => {
          console.error('Failed to assign issue', err);
          this.assigningIssueId = null;
        }
      });
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.status || this.filters.search);
  }
}


