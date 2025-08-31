import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RestaurantRegistration {
  id: string | number;
  user_id: string | number;
  restaurant_id?: string | number;
  status: 'pending' | 'approved' | 'rejected';
  owner_name: string;
  owner_email: string;
  restaurant_name: string;
  cuisine_type: string;
  owner_info: any;
  restaurant_info: any;
  documents: any;
  notes?: string;
  submitted_at: string;
  approved_at?: string;
  approval_notes?: string;
}

@Component({
  selector: 'app-admin-restaurant-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-registrations-container">
      <div class="header">
        <div class="header-content">
          <h1>🏪 Restaurant-Registrierungen verwalten</h1>
          <p>Prüfen und genehmigen Sie neue Restaurant-Anmeldungen</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="loadRegistrations()" [disabled]="loading">
            <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i>
            Aktualisieren
          </button>
        </div>
      </div>



      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter" [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="pending">Ausstehend</option>
              <option value="approved">Genehmigt</option>
              <option value="rejected">Abgelehnt</option>
              <option value="all">Alle</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="search-filter">Suchen:</label>
            <input
              id="search-filter"
              type="text"
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              placeholder="Restaurant, Besitzer..."
            >
          </div>

          <div class="filter-group">
            <label for="sort-filter">Sortieren:</label>
            <select id="sort-filter" [(ngModel)]="sortBy" (change)="applyFilters()">
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="restaurant">Nach Restaurant</option>
              <option value="owner">Nach Besitzer</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Registrations List -->
      <div class="registrations-section">
        <div class="registrations-header">
          <h2>{{ filteredRegistrations.length }} Registrierung{{ filteredRegistrations.length !== 1 ? 'en' : '' }} gefunden</h2>
        </div>

        <div class="registrations-list">
          <div *ngFor="let registration of filteredRegistrations" class="registration-card">
            <div class="registration-header">
              <div class="registration-info">
                <div class="registration-id">#{{ formatShortId(registration.id) }}</div>
                <div class="submitted-date">{{ formatDate(registration.submitted_at) }}</div>
              </div>
              <div class="registration-status">
                <span [ngClass]="getStatusClass(registration.status)" class="status-badge">
                  {{ getStatusText(registration.status) }}
                </span>
              </div>
            </div>

            <div class="registration-content">
              <div class="restaurant-details">
                <h3>{{ registration.restaurant_name }}</h3>
                <p class="cuisine-type">{{ registration.cuisine_type }}</p>
                <p class="restaurant-address">
                  {{ registration.restaurant_info?.address?.street }},
                  {{ registration.restaurant_info?.address?.postal_code }}
                  {{ registration.restaurant_info?.address?.city }}
                </p>
              </div>

              <div class="owner-details">
                <h4>Besitzer: {{ registration.owner_name }}</h4>
                <p>{{ registration.owner_email }}</p>
                <p>{{ registration.owner_info?.phone }}</p>
              </div>
            </div>

            <div class="registration-actions">
              <button
                class="btn-details"
                (click)="showDetails(registration)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-eye"></i>
                Details
              </button>

              <button
                *ngIf="registration.status === 'pending'"
                class="btn-approve"
                (click)="approveRegistration(registration)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-check"></i>
                Genehmigen
              </button>

              <button
                *ngIf="registration.status === 'pending'"
                class="btn-reject"
                (click)="rejectRegistration(registration)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-times"></i>
                Ablehnen
              </button>
            </div>
          </div>

          <div *ngIf="filteredRegistrations.length === 0" class="empty-state">
            <i class="fa-solid fa-store"></i>
            <h3>Keine Registrierungen gefunden</h3>
            <p>Es gibt keine Restaurant-Registrierungen mit den aktuellen Filtern.</p>
          </div>
        </div>
      </div>

      <!-- Registration Details Modal -->
      <div *ngIf="selectedRegistration" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Registrierungs-Details</h3>
            <button class="close-btn" (click)="closeModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedRegistration">
            <!-- Restaurant Info -->
            <div class="detail-section">
              <h4>🏪 Restaurant-Informationen</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Name:</strong> {{ selectedRegistration.restaurant_info?.name }}
                </div>
                <div class="detail-item">
                  <strong>Küche:</strong> {{ selectedRegistration.restaurant_info?.cuisine_type }}
                </div>
                <div class="detail-item">
                  <strong>Beschreibung:</strong> {{ selectedRegistration.restaurant_info?.description }}
                </div>
                <div class="detail-item">
                  <strong>Adresse:</strong>
                  {{ selectedRegistration.restaurant_info?.address?.street }},
                  {{ selectedRegistration.restaurant_info?.address?.postal_code }}
                  {{ selectedRegistration.restaurant_info?.address?.city }}
                </div>
                <div class="detail-item">
                  <strong>Telefon:</strong> {{ selectedRegistration.restaurant_info?.contact_info?.phone }}
                </div>
                <div class="detail-item">
                  <strong>E-Mail:</strong> {{ selectedRegistration.restaurant_info?.contact_info?.email }}
                </div>
              </div>
            </div>

            <!-- Owner Info -->
            <div class="detail-section">
              <h4>👤 Besitzer-Informationen</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Name:</strong> {{ selectedRegistration.owner_info?.name }}
                </div>
                <div class="detail-item">
                  <strong>E-Mail:</strong> {{ selectedRegistration.owner_info?.email }}
                </div>
                <div class="detail-item">
                  <strong>Telefon:</strong> {{ selectedRegistration.owner_info?.phone }}
                </div>
                <div class="detail-item" *ngIf="selectedRegistration.owner_info?.address">
                  <strong>Adresse:</strong> {{ selectedRegistration.owner_info?.address }}
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div class="detail-section">
              <h4>📄 Dokumente</h4>
              <div class="documents-list">
                <div class="document-item">
                  <strong>Gewerbeschein:</strong>
                  <span *ngIf="selectedRegistration.documents?.business_license; else noDoc">
                    <a [href]="buildPublicUrl(selectedRegistration.documents.business_license) || selectedRegistration.documents.business_license" target="_blank">{{ getFileLabel(selectedRegistration.documents.business_license, 'Gewerbeschein anzeigen') }}</a>
                  </span>
                  <ng-template #noDoc><span class="no-doc">Nicht hochgeladen</span></ng-template>
                </div>
                <div class="document-item">
                  <strong>Steuernummer:</strong>
                  <span *ngIf="selectedRegistration.documents?.tax_certificate; else noDoc">
                    <a [href]="buildPublicUrl(selectedRegistration.documents.tax_certificate) || selectedRegistration.documents.tax_certificate" target="_blank">{{ getFileLabel(selectedRegistration.documents.tax_certificate, 'Steuernummer anzeigen') }}</a>
                  </span>
                </div>
                <div class="document-item">
                  <strong>Ausweis:</strong>
                  <span *ngIf="selectedRegistration.documents?.owner_id; else noDoc">
                    <a [href]="buildPublicUrl(selectedRegistration.documents.owner_id) || selectedRegistration.documents.owner_id" target="_blank">{{ getFileLabel(selectedRegistration.documents.owner_id, 'Ausweis anzeigen') }}</a>
                  </span>
                </div>
                <div class="document-item">
                  <strong>Restaurant-Fotos:</strong>
                  <div *ngIf="selectedRegistration.documents?.restaurant_photos?.length; else noDoc">
                    <div *ngFor="let photo of selectedRegistration.documents.restaurant_photos; let i = index">
                      <a [href]="buildPublicUrl(photo) || photo" target="_blank">{{ getFileLabel(photo, 'Foto ' + (i + 1)) }}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="detail-section" *ngIf="selectedRegistration.notes">
              <h4>📝 Notizen</h4>
              <p>{{ selectedRegistration.notes }}</p>
            </div>

            <!-- Status History -->
            <div class="detail-section">
              <h4>📊 Status-Verlauf</h4>
              <div class="status-timeline">
                <div class="timeline-item">
                  <div class="timeline-marker submitted"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">Eingereicht</div>
                    <div class="timeline-date">{{ formatDate(selectedRegistration.submitted_at) }}</div>
                  </div>
                </div>
                <div class="timeline-item" *ngIf="selectedRegistration.approved_at">
                  <div class="timeline-marker" [ngClass]="selectedRegistration.status"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">{{ getStatusText(selectedRegistration.status) }}</div>
                    <div class="timeline-date">{{ formatDate(selectedRegistration.approved_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions" *ngIf="selectedRegistration?.status === 'pending'">
            <button class="btn-cancel" (click)="closeModal()">Schließen</button>
            <button class="btn-reject" (click)="rejectRegistration(selectedRegistration)">Ablehnen</button>
            <button class="btn-approve" (click)="confirmApprove(selectedRegistration)">Genehmigen</button>
          </div>
        </div>
      </div>

      <!-- Approve/Reject Confirmation Modal -->
      <div *ngIf="confirmationModal.show" class="modal-overlay" (click)="closeConfirmation()">
        <div class="confirmation-modal" (click)="$event.stopPropagation()">
          <div class="confirmation-header">
            <h3>{{ confirmationModal.action === 'approve' ? 'Genehmigen' : 'Ablehnen' }} bestätigen</h3>
          </div>

          <div class="confirmation-body">
            <p>
              Möchten Sie die Restaurant-Registrierung für <strong>{{ confirmationModal.registration?.restaurant_name }}</strong>
              wirklich {{ confirmationModal.action === 'approve' ? 'genehmigen' : 'ablehnen' }}?
            </p>

            <div class="notes-section" *ngIf="confirmationModal.action === 'reject'">
              <label for="rejection-notes">Ablehnungsgrund:</label>
              <textarea
                id="rejection-notes"
                [(ngModel)]="rejectionNotes"
                placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="confirmation-actions">
            <button class="btn-cancel" (click)="closeConfirmation()">Abbrechen</button>
            <button
              class="btn-confirm"
              [ngClass]="confirmationModal.action === 'approve' ? 'approve' : 'reject'"
              (click)="executeAction()"
              [disabled]="loading"
            >
              {{ confirmationModal.action === 'approve' ? 'Genehmigen' : 'Ablehnen' }}
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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .header h1 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
    }

    .header p {
      margin: var(--space-1) 0 0 0;
      color: var(--color-muted);
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      cursor: pointer;
      transition: all var(--transition);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--bg-light);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }



    .filters-section {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .filter-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-heading);
    }

    .filter-group select,
    .filter-group input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .registrations-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .registrations-header {
      padding: var(--space-4) var(--space-6);
      background: var(--bg-light);
      border-bottom: 1px solid var(--color-border);
    }

    .registrations-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .registrations-list {
      padding: var(--space-4) var(--space-6);
    }

    .registration-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      background: var(--color-surface);
      transition: all var(--transition);
    }

    .registration-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-200);
    }

    .registration-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .registration-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .registration-id {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .submitted-date {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .registration-status .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.pending {
      background: var(--color-warning-light);
      color: var(--color-warning-dark);
    }

    .status-badge.approved {
      background: var(--color-success-light);
      color: var(--color-success-dark);
    }

    .status-badge.rejected {
      background: var(--color-danger-light);
      color: var(--color-danger-dark);
    }

    .registration-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .restaurant-details h3 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .cuisine-type {
      color: var(--color-primary);
      font-weight: 500;
      margin-bottom: var(--space-1);
    }

    .restaurant-address {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .owner-details h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .owner-details p {
      margin: var(--space-1) 0;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .registration-actions {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    .btn-details,
    .btn-approve,
    .btn-reject {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-details {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-details:hover:not(:disabled) {
      background: var(--bg-light-hover);
    }

    .btn-approve {
      background: var(--color-success);
      color: white;
    }

    .btn-approve:hover:not(:disabled) {
      background: var(--color-success-dark);
    }

    .btn-reject {
      background: var(--color-danger);
      color: white;
    }

    .btn-reject:hover:not(:disabled) {
      background: var(--color-danger-dark);
    }

    .btn-details:disabled,
    .btn-approve:disabled,
    .btn-reject:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8);
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

    /* Modal Styles */
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
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h3 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-lg);
      cursor: pointer;
      color: var(--color-muted);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .detail-section {
      margin-bottom: var(--space-6);
    }

    .detail-section h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-3);
    }

    .detail-item {
      padding: var(--space-3);
      background: var(--bg-light);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .detail-item strong {
      display: block;
      color: var(--color-heading);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    .documents-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .document-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .document-item strong {
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .document-item a {
      color: var(--color-primary);
      text-decoration: none;
      font-size: var(--text-sm);
    }

    .document-item a:hover {
      text-decoration: underline;
    }

    .no-doc {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-style: italic;
    }

    .status-timeline {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .timeline-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
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

    .timeline-content {
      flex: 1;
    }

    .timeline-title {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .timeline-date {
      color: var(--color-muted);
      font-size: var(--text-xs);
      margin-top: var(--space-1);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .confirmation-modal {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      max-width: 500px;
      width: 100%;
      box-shadow: var(--shadow-xl);
    }

    .confirmation-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .confirmation-header h3 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-xl);
    }

    .confirmation-body {
      padding: var(--space-6);
    }

    .confirmation-body p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-text);
    }

    .notes-section {
      margin-top: var(--space-4);
    }

    .notes-section label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .notes-section textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: var(--text-sm);
      resize: vertical;
    }

    .confirmation-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn-cancel,
    .btn-confirm {
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-cancel {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-cancel:hover {
      background: var(--bg-light-hover);
    }

    .btn-confirm.approve {
      background: var(--color-success);
      color: white;
    }

    .btn-confirm.approve:hover:not(:disabled) {
      background: var(--color-success-dark);
    }

    .btn-confirm.reject {
      background: var(--color-danger);
      color: white;
    }

    .btn-confirm.reject:hover:not(:disabled) {
      background: var(--color-danger-dark);
    }

    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .admin-registrations-container {
        padding: var(--space-4);
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .registration-content {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: var(--space-4);
        max-height: calc(100vh - 2 * var(--space-4));
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminRestaurantRegistrationsComponent implements OnInit {
  private http = inject(HttpClient);

  registrations: RestaurantRegistration[] = [];
  filteredRegistrations: RestaurantRegistration[] = [];

  selectedRegistration: RestaurantRegistration | null = null;
  loading = false;

  // Filters
  selectedStatus = 'pending';
  searchTerm = '';
  sortBy = 'newest';

  // Confirmation modal
  confirmationModal = {
    show: false,
    action: '' as 'approve' | 'reject',
    registration: null as RestaurantRegistration | null
  };
  rejectionNotes = '';

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.loading = true;
    this.http.get<{ registrations: RestaurantRegistration[]; total: number; count: number }>(
      `${environment.apiUrl}/admin/restaurant-registrations?status=${this.selectedStatus}&limit=100`
    ).subscribe({
      next: (response) => {
        // Normalize payload to guard against missing or stringified JSON fields
        this.registrations = (response.registrations || []).map((r: any) => {
          const owner_info = typeof r.owner_info === 'string' ? safeParse(r.owner_info) : (r.owner_info || {});
          const restaurant_info = typeof r.restaurant_info === 'string' ? safeParse(r.restaurant_info) : (r.restaurant_info || {});
          const documents = typeof r.documents === 'string' ? safeParse(r.documents) : (r.documents || {});
          return {
            ...r,
            owner_name: r.owner_name || owner_info?.name || 'Unbekannt',
            owner_email: r.owner_email || owner_info?.email || '-',
            restaurant_name: r.restaurant_name || restaurant_info?.name || 'Unbenanntes Restaurant',
            cuisine_type: r.cuisine_type || restaurant_info?.cuisine_type || '-',
            owner_info,
            restaurant_info,
            documents
          } as RestaurantRegistration;
        });
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.loading = false;
      }
    });
  }



  applyFilters() {
    let filtered = [...this.registrations];

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(reg => reg.status === this.selectedStatus);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.restaurant_name.toLowerCase().includes(term) ||
        reg.owner_name.toLowerCase().includes(term) ||
        reg.owner_email.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        case 'oldest':
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        case 'restaurant':
          return a.restaurant_name.localeCompare(b.restaurant_name);
        case 'owner':
          return a.owner_name.localeCompare(b.owner_name);
        default:
          return 0;
      }
    });

    this.filteredRegistrations = filtered;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      default: return 'Unbekannt';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showDetails(registration: RestaurantRegistration) {
    this.selectedRegistration = registration;
    this.debugLogRegistrationDetails(registration);
  }

  // Build a public URL if only a key is present
  buildPublicUrl(possibleKeyOrUrl?: string | null): string | null {
    if (!possibleKeyOrUrl) return null;
    if (possibleKeyOrUrl.startsWith('http')) return possibleKeyOrUrl;
    const base = (environment as any).publicS3BaseUrl || '';
    if (!base) return null;
    const key = possibleKeyOrUrl.startsWith('/') ? possibleKeyOrUrl.slice(1) : possibleKeyOrUrl;
    return `${base}/${key}`;
  }

  // Extract a nice label from URL/key
  getFileLabel(possibleKeyOrUrl?: string | null, fallback: string = 'Anzeigen'): string {
    if (!possibleKeyOrUrl) return fallback;
    const url = this.buildPublicUrl(possibleKeyOrUrl) || possibleKeyOrUrl;
    try {
      const last = url.split('?')[0].split('#')[0].split('/').pop();
      return last || fallback;
    } catch {
      return fallback;
    }
  }

  closeModal() {
    this.selectedRegistration = null;
  }

  approveRegistration(registration: RestaurantRegistration) {
    this.confirmationModal = {
      show: true,
      action: 'approve',
      registration: registration
    };
  }

  rejectRegistration(registration: RestaurantRegistration) {
    this.confirmationModal = {
      show: true,
      action: 'reject',
      registration: registration
    };
    this.rejectionNotes = '';
  }

  confirmApprove(registration: RestaurantRegistration) {
    this.confirmationModal = {
      show: true,
      action: 'approve',
      registration: registration
    };
  }

  closeConfirmation() {
    this.confirmationModal = { show: false, action: 'approve', registration: null };
    this.rejectionNotes = '';
  }

  executeAction() {
    if (!this.confirmationModal.registration) return;

    const registration = this.confirmationModal.registration;
    const action = this.confirmationModal.action;
    const notes = action === 'reject' ? this.rejectionNotes : '';

    this.loading = true;
    this.closeConfirmation();

    this.http.post(
      `${environment.apiUrl}/admin/restaurant-registrations/${registration.id}/review`,
      { action, notes }
    ).subscribe({
      next: (response) => {
        this.loading = false;
        // Reload data
        this.loadRegistrations();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error processing registration:', error);
        this.loading = false;
      }
    });
  }

  formatShortId(id: any): string {
    const str = id !== undefined && id !== null ? String(id) : '';
    return str.length > 6 ? str.slice(-6) : str;
  }

  // Debug logging for a registration detail and its documents endpoint
  private debugLogRegistrationDetails(registration: RestaurantRegistration) {
    try {
      console.log('[Admin][Registration] Selected registration:', registration);

      // Fetch detailed registration data
      this.http.get(`${environment.apiUrl}/admin/restaurant-registrations/${registration.id}`)
        .subscribe({
          next: (res) => {
            console.log('[Admin][Registration] Detail response:', res);
          },
          error: (err) => {
            console.warn('[Admin][Registration] Detail request failed:', err);
          }
        });

      // Fetch secure document URLs (signed or local)
      this.http.get(`${environment.apiUrl}/admin/restaurant-registrations/${registration.id}/documents`)
        .subscribe({
          next: (res) => {
            console.log('[Admin][Registration] Documents response:', res);
          },
          error: (err) => {
            console.warn('[Admin][Registration] Documents request failed:', err);
          }
        });
    } catch (e) {
      console.warn('[Admin][Registration] Debug logging error:', e);
    }
  }
}

function safeParse(value: any) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
