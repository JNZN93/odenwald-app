import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface WholesalerRegistration {
  id: string | number;
  user_id: string | number;
  wholesaler_id?: string | number;
  status: 'pending' | 'approved' | 'awaiting_final_approval' | 'rejected';
  owner_name: string;
  owner_email: string;
  wholesaler_name: string;
  owner_info: any;
  wholesaler_info: any;
  documents: any;
  notes?: string;
  submitted_at: string;
  approved_at?: string;
  approval_notes?: string;
  onboarding_link?: string;
  wholesaler_is_active?: boolean;
  wholesaler_is_verified?: boolean;
}

@Component({
  selector: 'app-admin-wholesaler-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-registrations-container">
      <div class="header">
        <div class="header-content">
          <h1>Großhändler-Registrierungen verwalten</h1>
          <p>Prüfen und genehmigen Sie neue Großhändler-Anmeldungen</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="loadRegistrations()" [disabled]="loading">
            <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon pending-icon">
            <i class="fa-solid fa-paper-plane"></i>
          </div>
          <div class="stat-content">
            <h3>Neu</h3>
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-change warning">Onboarding-Link senden</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon awaiting-icon">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div class="stat-content">
            <h3>Wartet auf Freigabe</h3>
            <div class="stat-value">{{ stats.awaiting_final_approval }}</div>
            <div class="stat-change info">Dokumente prüfen</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon onboarding-icon">
            <i class="fa-solid fa-envelope"></i>
          </div>
          <div class="stat-content">
            <h3>Onboarding läuft</h3>
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-change info">Link versendet</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon rejected-icon">
            <i class="fa-solid fa-times-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Abgelehnt</h3>
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-change danger">Nicht akzeptiert</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter" [(ngModel)]="statusFilter" (change)="applyFilters()">
              <option value="">Alle</option>
              <option value="pending">Ausstehend</option>
              <option value="approved">Onboarding-Link versendet</option>
              <option value="awaiting_final_approval">Wartet auf finale Freigabe</option>
              <option value="rejected">Abgelehnt</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="search-filter">Suche:</label>
            <input
              id="search-filter"
              type="text"
              [(ngModel)]="searchFilter"
              placeholder="Name oder E-Mail..."
              (input)="applyFilters()"
            />
          </div>
        </div>
      </div>

      <!-- Registrations Table -->
      <div class="table-container">
        <table class="registrations-table" *ngIf="filteredRegistrations.length > 0">
          <thead>
            <tr>
              <th>Status</th>
              <th>Besitzer</th>
              <th>Großhändler</th>
              <th>Eingereicht am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reg of filteredRegistrations" [class]="reg.status">
              <td>
                <span class="status-badge" [class]="reg.status">
                  <i class="fa-solid" [class]="getStatusIcon(reg.status)"></i>
                  {{ getStatusText(reg.status) }}
                </span>
              </td>
              <td>
                <div class="user-info">
                  <strong>{{ reg.owner_name }}</strong>
                  <small>{{ reg.owner_email }}</small>
                </div>
              </td>
              <td>
                <div class="restaurant-info">
                  <strong>{{ reg.wholesaler_name }}</strong>
                  <small *ngIf="reg.wholesaler_info?.address?.city">
                    {{ reg.wholesaler_info.address.city }}
                  </small>
                </div>
              </td>
              <td>
                <div class="date-info">
                  {{ formatDate(reg.submitted_at) }}
                </div>
              </td>
              <td>
                <div class="actions">
                  <button class="btn btn-primary btn-sm" (click)="viewDetails(reg)">
                    <i class="fa-solid fa-eye"></i>
                    Details
                  </button>
                  <button
                    class="btn btn-success btn-sm"
                    (click)="approveRegistration(reg)"
                    *ngIf="reg.status === 'pending'"
                    [disabled]="loading"
                  >
                    <i class="fa-solid fa-check"></i>
                    Onboarding-Link senden
                  </button>
                  <button
                    class="btn btn-success btn-sm"
                    (click)="finalApproval(reg)"
                    *ngIf="reg.status === 'awaiting_final_approval'"
                    [disabled]="loading"
                  >
                    <i class="fa-solid fa-check-double"></i>
                    Final freigeben
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="openRejectModal(reg)"
                    *ngIf="reg.status === 'pending' || reg.status === 'awaiting_final_approval'"
                    [disabled]="loading"
                  >
                    <i class="fa-solid fa-times"></i>
                    Ablehnen
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="filteredRegistrations.length === 0 && !loading">
          <i class="fa-solid fa-inbox"></i>
          <h3>Keine Registrierungen gefunden</h3>
          <p>Es gibt aktuell keine Großhändler-Registrierungen mit den gewählten Filtern.</p>
        </div>
      </div>

      <!-- Details Modal -->
      <div class="modal-overlay" *ngIf="selectedRegistration" (click)="closeDetails()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Großhändler-Registrierung Details</h2>
            <button class="close-btn" (click)="closeDetails()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedRegistration">
            <!-- Owner Information -->
            <div class="detail-section">
              <h3>Besitzer-Informationen</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Name:</label>
                  <span>{{ selectedRegistration.owner_name }}</span>
                </div>
                <div class="detail-item">
                  <label>E-Mail:</label>
                  <span>{{ selectedRegistration.owner_email }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.owner_info?.phone">
                  <label>Telefon:</label>
                  <span>{{ selectedRegistration.owner_info.phone }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.owner_info?.address">
                  <label>Adresse:</label>
                  <span>{{ selectedRegistration.owner_info.address }}</span>
                </div>
              </div>
            </div>

            <!-- Wholesaler Information -->
            <div class="detail-section">
              <h3>Großhändler-Informationen</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Firmenname:</label>
                  <span>{{ selectedRegistration.wholesaler_name }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.wholesaler_info?.description">
                  <label>Beschreibung:</label>
                  <span>{{ selectedRegistration.wholesaler_info.description }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.wholesaler_info?.address">
                  <label>Adresse:</label>
                  <span>
                    {{ selectedRegistration.wholesaler_info.address.street }}<br>
                    {{ selectedRegistration.wholesaler_info.address.postal_code }}
                    {{ selectedRegistration.wholesaler_info.address.city }}<br>
                    {{ selectedRegistration.wholesaler_info.address.country }}
                  </span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.wholesaler_info?.contact_info?.phone">
                  <label>Kontakt Telefon:</label>
                  <span>{{ selectedRegistration.wholesaler_info.contact_info.phone }}</span>
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.wholesaler_info?.contact_info?.email">
                  <label>Kontakt E-Mail:</label>
                  <span>{{ selectedRegistration.wholesaler_info.contact_info.email }}</span>
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div class="detail-section">
              <h3>Dokumente</h3>
              <div class="documents-grid">
                <div class="document-item" *ngIf="selectedRegistration.documents?.business_license">
                  <i class="fa-solid fa-file-contract"></i>
                  <span>Gewerbeschein</span>
                  <small *ngIf="selectedRegistration.documents.business_license.url; else noDocBusiness">
                    <a [href]="selectedRegistration.documents.business_license.url" target="_blank">Anzeigen</a>
                  </small>
                  <ng-template #noDocBusiness><small>Hochgeladen</small></ng-template>
                </div>
                <div class="document-item" *ngIf="selectedRegistration.documents?.owner_id">
                  <i class="fa-solid fa-id-card"></i>
                  <span>Inhaber-Ausweis</span>
                  <small *ngIf="selectedRegistration.documents.owner_id.url; else noDocOwner">
                    <a [href]="selectedRegistration.documents.owner_id.url" target="_blank">Anzeigen</a>
                  </small>
                  <ng-template #noDocOwner><small>Hochgeladen</small></ng-template>
                </div>
                <div class="document-item" *ngIf="selectedRegistration.documents?.wholesaler_photos?.length">
                  <i class="fa-solid fa-images"></i>
                  <span>Fotos</span>
                  <small *ngIf="selectedRegistration.documents.wholesaler_photos.length > 0; else noDocPhotos">
                    {{ selectedRegistration.documents.wholesaler_photos.length }} Dateien
                    <div class="photo-links">
                      <ng-container *ngFor="let photo of selectedRegistration.documents.wholesaler_photos; let i = index">
                        <a *ngIf="photo.url"
                           [href]="photo.url" 
                           target="_blank" 
                           class="photo-link">
                          Foto {{ i + 1 }}
                        </a>
                      </ng-container>
                    </div>
                  </small>
                  <ng-template #noDocPhotos><small>Hochgeladen</small></ng-template>
                </div>
              </div>
              
              <!-- Show message if no documents -->
              <div class="no-documents" *ngIf="!hasAnyDocuments(selectedRegistration.documents)">
                <i class="fa-solid fa-file-circle-exclamation"></i>
                <span>Keine Dokumente hochgeladen</span>
              </div>
            </div>

            <!-- Notes -->
            <div class="detail-section" *ngIf="selectedRegistration.notes">
              <h3>Notizen</h3>
              <p>{{ selectedRegistration.notes }}</p>
            </div>

            <!-- Status History -->
            <div class="detail-section">
              <h3>Status-Verlauf</h3>
              <div class="status-timeline">
                <div class="timeline-item">
                  <div class="timeline-marker submitted"></div>
                  <div class="timeline-content">
                    <strong>Eingereicht</strong>
                    <small>{{ formatDate(selectedRegistration.submitted_at) }}</small>
                  </div>
                </div>
                <div class="timeline-item" *ngIf="selectedRegistration.status !== 'pending'">
                  <div class="timeline-marker" [class]="selectedRegistration.status"></div>
                  <div class="timeline-content">
                    <strong>{{ getStatusText(selectedRegistration.status) }}</strong>
                    <small *ngIf="selectedRegistration.approved_at">{{ formatDate(selectedRegistration.approved_at) }}</small>
                    <p *ngIf="selectedRegistration.approval_notes">{{ selectedRegistration.approval_notes }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions" *ngIf="selectedRegistration && selectedRegistration.status === 'pending'">
            <button class="btn btn-secondary" (click)="closeDetails()">Schließen</button>
            <button class="btn btn-danger" (click)="openRejectModal(selectedRegistration)">
              <i class="fa-solid fa-times"></i>
              Ablehnen
            </button>
            <button class="btn btn-success" (click)="approveRegistration(selectedRegistration)">
              <i class="fa-solid fa-check"></i>
              Genehmigen
            </button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
        <div class="modal-content reject-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Registrierung ablehnen</h2>
            <button class="close-btn" (click)="closeRejectModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <p>Sind Sie sicher, dass Sie die Registrierung von <strong>{{ rejectTarget?.wholesaler_name }}</strong> ablehnen möchten?</p>
            <div class="form-group">
              <label for="reject-notes">Ablehnungsgrund (optional):</label>
              <textarea
                id="reject-notes"
                [(ngModel)]="rejectNotes"
                placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeRejectModal()">Abbrechen</button>
            <button class="btn btn-danger" (click)="confirmReject()" [disabled]="loading">
              <i class="fa-solid fa-times"></i>
              Ablehnen bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-registrations-container {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Stats Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-2xl);
      flex-shrink: 0;
    }

    .pending-icon {
      background: rgba(251, 191, 36, 0.1);
      color: #f59e0b;
    }

    .awaiting-icon {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .approved-icon {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .onboarding-icon {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .rejected-icon {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .stat-content {
      flex: 1;
    }

    .stat-content h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-heading);
      line-height: 1;
      margin-bottom: var(--space-1);
    }

    .stat-change {
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .stat-change.warning {
      color: #f59e0b;
    }

    .stat-change.info {
      color: #3b82f6;
    }

    .stat-change.success {
      color: #22c55e;
    }

    .stat-change.danger {
      color: #ef4444;
    }

    .header {
      background: var(--gradient-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: white;
    }

    .header p {
      margin: 0;
      opacity: 0.9;
      color: white;
    }

    .refresh-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .refresh-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
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

    .filters-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .filter-group label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .filter-group select,
    .filter-group input {
      padding: var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .table-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .registrations-table {
      width: 100%;
      border-collapse: collapse;
    }

    .registrations-table th,
    .registrations-table td {
      padding: var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    .registrations-table th {
      background: var(--bg-light);
      font-weight: 600;
      color: var(--color-heading);
    }

    .registrations-table tr:last-child td {
      border-bottom: none;
    }

    .registrations-table tr.pending {
      background: rgba(251, 191, 36, 0.05);
    }

    .registrations-table tr.approved {
      background: rgba(34, 197, 94, 0.05);
    }

    .registrations-table tr.rejected {
      background: rgba(239, 68, 68, 0.05);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background: var(--bg-warning);
      color: var(--color-warning);
    }

    .status-badge.approved {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge.awaiting_final_approval {
      background: #fef3c7;
      color: #b45309;
    }

    .status-badge.rejected {
      background: var(--bg-danger);
      color: var(--color-danger);
    }

    .user-info strong {
      display: block;
      color: var(--color-heading);
    }

    .user-info small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .restaurant-info strong {
      display: block;
      color: var(--color-heading);
    }

    .restaurant-info small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .btn {
      padding: var(--space-2) var(--space-3);
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-sm {
      padding: var(--space-1) var(--space-2);
      font-size: var(--text-xs);
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-danger {
      background: var(--color-danger);
      color: white;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: var(--text-4xl);
      margin-bottom: var(--space-4);
      display: block;
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .modal-content {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-2xl);
    }

    .modal-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--gradient-primary);
    }

    .modal-header h2 {
      margin: 0;
      color: white;
      font-size: var(--text-xl);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: white;
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .modal-body {
      padding: var(--space-6);
    }

    .detail-section {
      margin-bottom: var(--space-6);
    }

    .detail-section h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .detail-item label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .detail-item span {
      color: var(--color-text);
      line-height: 1.5;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .document-item i {
      color: var(--color-primary);
      font-size: var(--text-lg);
    }

    .document-item span {
      font-weight: 600;
      color: var(--color-heading);
    }

    .document-item small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .document-item a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .document-item a:hover {
      text-decoration: underline;
    }

    .photo-links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin-top: var(--space-1);
    }

    .photo-link {
      background: var(--color-primary);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      text-decoration: none;
    }

    .photo-link:hover {
      background: var(--color-primary-dark);
      text-decoration: none;
    }

    .no-documents {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      color: var(--color-muted);
      font-style: italic;
    }

    .no-documents i {
      color: var(--color-warning);
    }

    .status-timeline {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .timeline-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .timeline-marker.submitted {
      background: var(--color-primary);
    }

    .timeline-marker.approved {
      background: var(--color-success);
    }

    .timeline-marker.rejected {
      background: var(--color-danger);
    }

    .timeline-content strong {
      display: block;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .timeline-content small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .timeline-content p {
      margin: var(--space-1) 0 0 0;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .modal-actions {
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .reject-modal .modal-body {
      text-align: center;
    }

    .reject-modal .form-group {
      text-align: left;
      margin-top: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      color: var(--color-heading);
    }

    .form-group textarea {
      width: 100%;
      padding: var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    @media (max-width: 768px) {
      .admin-registrations-container {
        padding: var(--space-4);
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .registrations-table {
        font-size: var(--text-sm);
      }

      .actions {
        flex-direction: column;
      }

      .modal-content {
        margin: var(--space-2);
        max-height: calc(100vh - var(--space-8));
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AdminWholesalerRegistrationsComponent implements OnInit {
  private http = inject(HttpClient);

  registrations: WholesalerRegistration[] = [];
  filteredRegistrations: WholesalerRegistration[] = [];
  selectedRegistration: WholesalerRegistration | null = null;
  showRejectModal = false;
  rejectTarget: WholesalerRegistration | null = null;
  rejectNotes = '';

  statusFilter = '';
  searchFilter = '';
  loading = false;
  
  stats = {
    total: 0,
    pending: 0,
    awaiting_final_approval: 0,
    approved: 0,
    rejected: 0
  };

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.loading = true;
    // Lade ALLE Registrierungen (status='all')
    this.http.get(`${environment.apiUrl}/admin/wholesaler-registrations?status=all`).subscribe({
      next: (response: any) => {
        this.registrations = response.registrations || [];
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.loading = false;
      }
    });
  }

  calculateStats() {
    // Berechne Stats basierend auf tatsächlichem Großhändler-Status
    this.stats = {
      total: this.registrations.length,
      pending: this.registrations.filter(r => r.status === 'pending').length,
      awaiting_final_approval: this.registrations.filter(r => r.status === 'awaiting_final_approval').length,
      // "Onboarding läuft" = approved aber Großhändler noch nicht aktiv
      approved: this.registrations.filter(r => r.status === 'approved' && !r.wholesaler_is_active).length,
      rejected: this.registrations.filter(r => r.status === 'rejected').length
    };
  }

  applyFilters() {
    let filtered = [...this.registrations];

    if (this.statusFilter) {
      filtered = filtered.filter(reg => reg.status === this.statusFilter);
    }

    if (this.searchFilter.trim()) {
      const search = this.searchFilter.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.owner_name.toLowerCase().includes(search) ||
        reg.owner_email.toLowerCase().includes(search) ||
        reg.wholesaler_name.toLowerCase().includes(search)
      );
    }

    this.filteredRegistrations = filtered;
  }

  viewDetails(registration: WholesalerRegistration) {
    this.selectedRegistration = registration;
    // Fetch document details when viewing registration
    this.fetchDocumentDetails(registration.id);
  }

  closeDetails() {
    this.selectedRegistration = null;
  }

  approveRegistration(registration: WholesalerRegistration) {
    if (confirm(`Sind Sie sicher, dass Sie die Registrierung von "${registration.wholesaler_name}" genehmigen möchten?\n\nDer Großhändler erhält einen Onboarding-Link per E-Mail.`)) {
      this.loading = true;
      this.http.post(`${environment.apiUrl}/admin/wholesaler-registrations/${registration.id}/review`, {
        action: 'approve'
      }).subscribe({
        next: (response: any) => {
          // Zeige Onboarding-Link in der Konsole für Tests
          if (response.registration?.onboarding_link) {
            console.log('🔗 Onboarding-Link:', response.registration.onboarding_link);
            alert(`✅ Registrierung genehmigt!\n\nOnboarding-Link (für Tests):\n${response.registration.onboarding_link}`);
          } else {
            alert('✅ Registrierung genehmigt! Onboarding-Link wurde per E-Mail versendet.');
          }
          this.loadRegistrations();
          this.closeDetails();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error approving registration:', error);
          alert('❌ Fehler beim Genehmigen: ' + (error.error?.error || error.message));
          this.loading = false;
        }
      });
    }
  }

  openRejectModal(registration: WholesalerRegistration) {
    this.rejectTarget = registration;
    this.rejectNotes = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectTarget = null;
    this.rejectNotes = '';
  }

  finalApproval(registration: WholesalerRegistration) {
    if (confirm(`Sind Sie sicher, dass Sie "${registration.wholesaler_name}" FINAL AKTIVIEREN möchten?\n\nDer Großhändler wird für Restaurants sichtbar!`)) {
      this.loading = true;
      this.http.post(`${environment.apiUrl}/admin/wholesaler-registrations/${registration.id}/final-review`, {
        action: 'approve',
        notes: 'Alle Dokumente geprüft und genehmigt'
      }).subscribe({
        next: (response: any) => {
          alert('✅ Großhändler wurde aktiviert und ist jetzt LIVE!');
          this.loadRegistrations();
          this.closeDetails();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error in final approval:', error);
          alert('❌ Fehler bei finaler Freigabe: ' + (error.error?.error || error.message));
          this.loading = false;
        }
      });
    }
  }

  confirmReject() {
    if (!this.rejectTarget) return;

    this.loading = true;
    const endpoint = this.rejectTarget.status === 'awaiting_final_approval' 
      ? 'final-review' 
      : 'review';
    
    this.http.post(`${environment.apiUrl}/admin/wholesaler-registrations/${this.rejectTarget.id}/${endpoint}`, {
      action: 'reject',
      notes: this.rejectNotes
    }).subscribe({
      next: () => {
        this.loadRegistrations();
        this.closeRejectModal();
        this.closeDetails();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error rejecting registration:', error);
        this.loading = false;
      }
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'approved': return 'fa-paper-plane';
      case 'awaiting_final_approval': return 'fa-hourglass-half';
      case 'rejected': return 'fa-times';
      default: return 'fa-question';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'approved': return 'Onboarding-Link versendet';
      case 'awaiting_final_approval': return 'Wartet auf finale Freigabe';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Fetch document details for a registration
  fetchDocumentDetails(registrationId: string | number) {
    this.http.get(`${environment.apiUrl}/admin/wholesaler-registrations/${registrationId}/documents`)
      .subscribe({
        next: (response: any) => {
          if (this.selectedRegistration && this.selectedRegistration.id === registrationId) {
            // Update the documents with secure URLs
            this.selectedRegistration.documents = response.documents;
          }
        },
        error: (error) => {
          console.error('Error fetching document details:', error);
        }
      });
  }

  // Check if any documents exist
  hasAnyDocuments(documents: any): boolean {
    if (!documents) return false;
    
    return !!(documents.business_license?.filename || 
              documents.owner_id?.filename || 
              (documents.wholesaler_photos && documents.wholesaler_photos.length > 0));
  }
}
