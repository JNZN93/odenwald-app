import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

interface OrderIssueVm {
  id: string;
  order_id: number;
  restaurant_id: number;
  reason: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  priority: 'low' | 'normal' | 'high';
  admin_notes?: string;
  assigned_to_restaurant_manager?: boolean;
  assigned_at?: string;
  restaurant_manager_notes?: string;
  created_at: string;
}

@Component({
  selector: 'app-restaurant-manager-issues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="issues-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>Zugewiesene Reklamationen</h1>
          <p>Verwalte Kundenreklamationen, die dir vom Administrator zugewiesen wurden</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="loadIssues()" [disabled]="isLoading">
            <i class="fa-solid fa-rotate-right" [class.spin]="isLoading"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Issues List -->
      <div class="issues-section">
        <div class="issues-header">
          <h2>{{ issues.length }} zugewiesene Reklamation{{ issues.length !== 1 ? 'en' : '' }}</h2>
        </div>

        <div class="issues-list">
          <div *ngFor="let issue of issues" class="issue-card" [class]="getPriorityClass(issue.priority)">
            <div class="issue-header">
              <div class="issue-info">
                <div class="issue-id">#{{ issue.id.slice(-6) }}</div>
                <div class="issue-time">{{ formatIssueTime(issue.assigned_at || issue.created_at) }}</div>
              </div>
              <div class="issue-status">
                <span [ngClass]="getPriorityBadgeClass(issue.priority)" class="priority-badge">
                  {{ getPriorityLabel(issue.priority) }}
                </span>
                <span [ngClass]="getStatusClass(issue.status)" class="status-badge">
                  {{ getStatusLabel(issue.status) }}
                </span>
              </div>
            </div>

            <div class="issue-details">
              <div class="order-info">
                <div class="order-number">Bestellung #{{ issue.order_id }}</div>
              </div>

              <div class="issue-description-section">
                <div class="issue-reason">
                  <strong>{{ getReasonLabel(issue.reason) }}</strong>
                </div>
                <div class="issue-description">
                  {{ issue.description }}
                </div>
                <div *ngIf="issue.admin_notes" class="admin-notes">
                  <i class="fa-solid fa-user-tie"></i>
                  <span><strong>Admin:</strong> {{ issue.admin_notes }}</span>
                </div>
              </div>

              <div class="issue-actions">
                <div class="action-group">
                  <label class="action-label">Status:</label>
                  <select [ngModel]="issue.status" (ngModelChange)="updateIssueStatus(issue, $event)" class="action-select" [disabled]="updatingIssueId === issue.id">
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="resolved">Gelöst</option>
                  </select>
                </div>

                <div class="action-group notes-group">
                  <label class="action-label">Meine Notizen:</label>
                  <textarea
                    [ngModel]="issue.restaurant_manager_notes"
                    (ngModelChange)="updateNotes(issue, $event)"
                    placeholder="Fügen Sie Ihre Notizen hinzu..."
                    class="notes-textarea"
                    rows="3"
                    [disabled]="updatingIssueId === issue.id">
                  </textarea>
                </div>
              </div>

              <div class="loading-indicator" *ngIf="updatingIssueId === issue.id">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Aktualisiere...
              </div>
            </div>
          </div>

          <div *ngIf="issues.length === 0 && !isLoading" class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <h3>Keine zugewiesenen Reklamationen</h3>
            <p>Derzeit sind keine Reklamationen an Sie zugewiesen.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .issues-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-muted);
      margin: 0;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Issues Section */
    .issues-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .issues-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .issues-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    /* Issue Cards */
    .issue-card {
      border-bottom: 1px solid var(--color-border);
    }

    .issue-card:last-child {
      border-bottom: none;
    }

    .issue-card.priority-high {
      border-left: 4px solid var(--color-danger);
    }

    .issue-card.priority-normal {
      border-left: 4px solid var(--color-warning);
    }

    .issue-card.priority-low {
      border-left: 4px solid var(--color-success);
    }

    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--color-border);
    }

    .issue-info .issue-id {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .issue-info .issue-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .issue-status {
      display: flex;
      gap: var(--space-2);
    }

    .priority-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .priority-badge.priority-high {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
    }

    .priority-badge.priority-normal {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
    }

    .priority-badge.priority-low {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
    }

    .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--color-border);
    }

    .status-badge.status-open {
      background: color-mix(in oklab, var(--color-danger) 12%, white);
      color: var(--color-heading);
    }

    .status-badge.status-in_progress {
      background: color-mix(in oklab, var(--color-warning) 12%, white);
      color: var(--color-heading);
    }

    .status-badge.status-resolved {
      background: color-mix(in oklab, var(--color-success) 12%, white);
      color: var(--color-heading);
    }

    .issue-details {
      padding: var(--space-6);
    }

    .order-info {
      margin-bottom: var(--space-4);
    }

    .order-number {
      font-weight: 600;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .issue-description-section {
      margin-bottom: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-light-green);
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
      margin-bottom: var(--space-3);
    }

    .admin-notes {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-info);
    }

    .admin-notes i {
      color: var(--color-info);
      font-size: var(--text-sm);
      margin-top: 2px;
      flex-shrink: 0;
    }

    .admin-notes span {
      font-size: var(--text-sm);
      color: var(--color-muted);
      line-height: 1.4;
    }

    .issue-actions {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-6);
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

    .action-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notes-group {
      grid-column: 2;
    }

    .notes-textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
      transition: all var(--transition);
      background: var(--color-surface);
      color: var(--color-text);
    }

    .notes-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .notes-textarea:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
      justify-content: center;
      padding: var(--space-4);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-12) var(--space-6);
      text-align: center;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .issues-container {
        padding: var(--space-4) 0;
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .issue-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .issue-actions {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .notes-group {
        grid-column: 1;
      }
    }
  `]
})
export class RestaurantManagerIssuesComponent implements OnInit {
  private http = inject(HttpClient);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  issues: OrderIssueVm[] = [];
  isLoading = false;
  updatingIssueId: string | null = null;

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.isLoading = true;
    this.loadingService.start('issues');

    console.log('Loading assigned issues...');

    // Get current restaurant manager's restaurant ID
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        console.log('Managed restaurants:', restaurants);
        if (restaurants?.length > 0) {
          const restaurantId = restaurants[0].restaurant_id;
          console.log('Using restaurant ID:', restaurantId);
          console.log('API URL:', `${environment.apiUrl}/order-issues/assigned-to-restaurant/${restaurantId}`);

          this.http.get<OrderIssueVm[]>(`${environment.apiUrl}/order-issues/assigned-to-restaurant/${restaurantId}`).subscribe({
            next: (issues) => {
              console.log('Loaded issues:', issues);
              this.issues = issues;
              this.loadingService.stop('issues');
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error loading assigned issues:', error);
              this.toastService.error('Reklamationen laden', `API-Fehler: ${error.message || 'Unbekannter Fehler'}`);
              this.loadingService.stop('issues');
              this.isLoading = false;
            }
          });
        } else {
          console.warn('No managed restaurants found');
          this.loadingService.stop('issues');
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading restaurants:', error);
        this.toastService.error('Restaurant laden', `Fehler beim Laden des Restaurants: ${error.message || 'Unbekannter Fehler'}`);
        this.loadingService.stop('issues');
        this.isLoading = false;
      }
    });
  }

  updateIssueStatus(issue: OrderIssueVm, newStatus: OrderIssueVm['status']) {
    this.updatingIssueId = issue.id;

    this.http.patch<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}`, {
      status: newStatus
    }).subscribe({
      next: (updated: OrderIssueVm) => {
        issue.status = updated.status;
        this.toastService.success('Status aktualisiert', `Reklamation wurde als "${this.getStatusLabel(newStatus)}" markiert`);
        this.updatingIssueId = null;
      },
      error: (error: any) => {
        console.error('Error updating issue status:', error);
        this.toastService.error('Status aktualisieren', 'Fehler beim Aktualisieren des Status');
        this.updatingIssueId = null;
      }
    });
  }

  updateNotes(issue: OrderIssueVm, notes: string) {
    this.updatingIssueId = issue.id;

    this.http.patch<OrderIssueVm>(`${environment.apiUrl}/order-issues/${issue.id}/restaurant-notes`, {
      notes: notes
    }).subscribe({
      next: (updated: OrderIssueVm) => {
        issue.restaurant_manager_notes = updated.restaurant_manager_notes;
        this.toastService.success('Notizen gespeichert', 'Ihre Notizen wurden erfolgreich gespeichert');
        this.updatingIssueId = null;
      },
      error: (error: any) => {
        console.error('Error updating notes:', error);
        this.toastService.error('Notizen speichern', 'Fehler beim Speichern der Notizen');
        this.updatingIssueId = null;
      }
    });
  }

  formatIssueTime(dateString: string): string {
    if (!dateString) return 'Unbekanntes Datum';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ungültiges Datum';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min.`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `vor ${Math.floor(diffInMinutes / 60)} Std.`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityBadgeClass(priority: string): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      low: 'Niedrig',
      normal: 'Normal',
      high: 'Hoch'
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
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
}
