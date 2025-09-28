import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportTicketsService, SupportTicket, SupportTicketMessage, SupportTicketAttachment, CreateSupportTicketData } from '../../core/services/support-tickets.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-restaurant-manager-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="support-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1><i class="fa-solid fa-headset"></i> Support & Hilfe</h1>
          <p>Melden Sie Probleme direkt an unser Admin-Team</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateTicketModal()">
          <i class="fa-solid fa-plus"></i>
          Neues Ticket erstellen
        </button>
      </div>

      <!-- Statistics -->
      <div class="stats-grid" *ngIf="tickets.length > 0">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-ticket"></i>
          </div>
          <div class="stat-content">
            <h3>Gesamt Tickets</h3>
            <div class="stat-value">{{ tickets.length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Offen</h3>
            <div class="stat-value">{{ getStatusCount('open') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-spinner"></i>
          </div>
          <div class="stat-content">
            <h3>In Bearbeitung</h3>
            <div class="stat-value">{{ getStatusCount('in_progress') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Gelöst</h3>
            <div class="stat-value">{{ getStatusCount('resolved') }}</div>
          </div>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="tickets-section">
        <div class="tickets-header">
          <h2>Meine Support-Tickets</h2>
          <div class="filter-controls">
            <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="filter-select">
              <option value="">Alle Status</option>
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="waiting_for_response">Wartet auf Antwort</option>
              <option value="resolved">Gelöst</option>
              <option value="closed">Geschlossen</option>
            </select>
          </div>
        </div>

        <div class="tickets-list">
          <div *ngFor="let ticket of filteredTickets" class="ticket-card" [class]="getPriorityClass(ticket.priority)">
            <div class="ticket-header">
              <div class="ticket-info">
                <div class="ticket-id">#{{ ticket.id.slice(-8) }}</div>
                <div class="ticket-subject">{{ ticket.subject }}</div>
                <div class="ticket-time">{{ formatDate(ticket.created_at) }}</div>
              </div>
              <div class="ticket-badges">
                <span class="priority-badge" [style.background-color]="getPriorityColor(ticket.priority)">
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
                <span class="status-badge" [style.background-color]="getStatusColor(ticket.status)">
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </div>
            </div>

            <div class="ticket-content">
              <div class="ticket-category">
                <i [ngClass]="'fa-solid ' + getCategoryIcon(ticket.category)"></i>
                {{ getCategoryLabel(ticket.category) }}
              </div>
              <div class="ticket-description">
                {{ ticket.description }}
              </div>
              <div *ngIf="ticket.assignee_name" class="ticket-assignee">
                <i class="fa-solid fa-user-tie"></i>
                Zugewiesen an: {{ ticket.assignee_name }}
              </div>
            </div>

            <div class="ticket-actions">
              <button class="btn btn-sm btn-ghost" (click)="viewTicketDetails(ticket)">
                <i class="fa-solid fa-eye"></i>
                Details anzeigen
              </button>
              <button 
                *ngIf="ticket.status !== 'closed' && ticket.status !== 'resolved'" 
                class="btn btn-sm btn-primary" 
                (click)="openMessageModal(ticket)"
              >
                <i class="fa-solid fa-reply"></i>
                Antworten
              </button>
            </div>
          </div>

          <div *ngIf="filteredTickets.length === 0 && !isLoading" class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <h3>Keine Tickets gefunden</h3>
            <p>Sie haben noch keine Support-Tickets erstellt oder es wurden keine Tickets gefunden, die Ihren Filterkriterien entsprechen.</p>
            <button class="btn btn-primary" (click)="openCreateTicketModal()">
              <i class="fa-solid fa-plus"></i>
              Erstes Ticket erstellen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Ticket Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Neues Support-Ticket erstellen</h3>
          <button class="modal-close" (click)="closeCreateModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="createTicket()" #ticketForm="ngForm">
            <div class="form-group">
              <label class="form-label">Betreff *</label>
              <input 
                type="text" 
                [(ngModel)]="newTicket.subject" 
                name="subject"
                class="form-input"
                placeholder="Kurze Beschreibung des Problems"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">Kategorie *</label>
              <select [(ngModel)]="newTicket.category" name="category" class="form-select" required>
                <option value="">Kategorie auswählen</option>
                <option value="technical_issue">🔧 Technisches Problem</option>
                <option value="payment_issue">💳 Zahlungsproblem</option>
                <option value="feature_request">✨ Feature-Anfrage</option>
                <option value="account_issue">👤 Account-Problem</option>
                <option value="menu_management">📋 Speisekarten-Management</option>
                <option value="order_management">🛒 Bestellungs-Management</option>
                <option value="driver_issue">🚗 Fahrer-Problem</option>
                <option value="platform_issue">🌐 Plattform-Problem</option>
                <option value="other">❓ Sonstiges</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Priorität</label>
              <select [(ngModel)]="newTicket.priority" name="priority" class="form-select">
                <option value="normal">🟡 Normal</option>
                <option value="low">🟢 Niedrig</option>
                <option value="high">🟠 Hoch</option>
                <option value="urgent">🔴 Dringend</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Beschreibung *</label>
              <textarea 
                [(ngModel)]="newTicket.description" 
                name="description"
                class="form-textarea"
                rows="5"
                placeholder="Beschreiben Sie Ihr Problem oder Ihre Anfrage detailliert..."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Bilder/Dokumente anhängen (optional)</label>
              <div class="file-upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                <input #fileInput type="file" multiple accept="image/*,.pdf" (change)="onFileSelected($event)" style="display: none;">
                <div class="upload-content" *ngIf="selectedFiles.length === 0">
                  <i class="fa-solid fa-cloud-upload-alt"></i>
                  <p>Klicken Sie hier oder ziehen Sie Dateien hierher</p>
                  <small>Unterstützte Formate: JPEG, PNG, GIF, WebP, PDF (max. 5MB pro Datei)</small>
                </div>
                <div class="selected-files" *ngIf="selectedFiles.length > 0">
                  <div class="file-item" *ngFor="let file of selectedFiles; let i = index">
                    <div class="file-info">
                      <i class="fa-solid fa-file-image" *ngIf="file.type.startsWith('image/')"></i>
                      <i class="fa-solid fa-file-pdf" *ngIf="file.type === 'application/pdf'"></i>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">({{ formatFileSize(file.size) }})</span>
                    </div>
                    <button type="button" class="remove-file" (click)="removeFile(i)">
                      <i class="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-ghost" (click)="closeCreateModal()">
                Abbrechen
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="!ticketForm.form.valid || isCreating">
                <i class="fa-solid fa-spinner fa-spin" *ngIf="isCreating"></i>
                <i class="fa-solid fa-paper-plane" *ngIf="!isCreating"></i>
                {{ isCreating ? 'Erstelle...' : 'Ticket erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Ticket Details Modal -->
    <div class="modal-overlay" *ngIf="showDetailsModal" (click)="closeDetailsModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Ticket Details - #{{ selectedTicket?.id?.slice(-8) }}</h3>
          <button class="modal-close" (click)="closeDetailsModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div *ngIf="selectedTicket" class="ticket-details">
            <div class="ticket-meta">
              <div class="meta-item">
                <strong>Betreff:</strong> {{ selectedTicket.subject }}
              </div>
              <div class="meta-item">
                <strong>Kategorie:</strong> {{ getCategoryLabel(selectedTicket.category) }}
              </div>
              <div class="meta-item">
                <strong>Status:</strong> 
                <span class="status-badge" [style.background-color]="getStatusColor(selectedTicket.status)">
                  {{ getStatusLabel(selectedTicket.status) }}
                </span>
              </div>
              <div class="meta-item">
                <strong>Priorität:</strong> 
                <span class="priority-badge" [style.background-color]="getPriorityColor(selectedTicket.priority)">
                  {{ getPriorityLabel(selectedTicket.priority) }}
                </span>
              </div>
              <div class="meta-item">
                <strong>Erstellt:</strong> {{ formatDate(selectedTicket.created_at) }}
              </div>
              <div class="meta-item" *ngIf="selectedTicket.assignee_name">
                <strong>Zugewiesen an:</strong> {{ selectedTicket.assignee_name }}
              </div>
            </div>

            <div class="ticket-description-section">
              <h4>Beschreibung</h4>
              <div class="description-content">{{ selectedTicket.description }}</div>
            </div>

            <div class="messages-section">
              <h4>Nachrichtenverlauf</h4>
              <div class="messages-list">
                <div *ngFor="let message of ticketMessages" class="message-item" [class]="message.sender_type">
                  <div class="message-header">
                    <span class="sender-name">{{ message.sender_name || (message.sender_type === 'admin' ? 'Admin' : 'Sie') }}</span>
                    <span class="message-time">{{ formatDate(message.created_at) }}</span>
                  </div>
                  <div class="message-content">{{ message.message }}</div>
                </div>
              </div>
            </div>

            <div class="reply-section" *ngIf="selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved'">
              <h4>Antwort hinzufügen</h4>
              <form (ngSubmit)="sendMessage()" #messageForm="ngForm">
                <textarea 
                  [(ngModel)]="newMessage.message" 
                  name="message"
                  class="form-textarea"
                  rows="4"
                  placeholder="Ihre Antwort..."
                  required
                ></textarea>
                
                <div class="form-group">
                  <label class="form-label">Dateien anhängen (optional)</label>
                  <div class="file-upload-area small" (click)="messageFileInput.click()" (dragover)="onMessageDragOver($event)" (drop)="onMessageDrop($event)">
                    <input #messageFileInput type="file" multiple accept="image/*,.pdf" (change)="onMessageFileSelected($event)" style="display: none;">
                    <div class="upload-content" *ngIf="messageFiles.length === 0">
                      <i class="fa-solid fa-paperclip"></i>
                      <p>Dateien anhängen</p>
                    </div>
                    <div class="selected-files" *ngIf="messageFiles.length > 0">
                      <div class="file-item" *ngFor="let file of messageFiles; let i = index">
                        <div class="file-info">
                          <i class="fa-solid fa-file-image" *ngIf="file.type.startsWith('image/')"></i>
                          <i class="fa-solid fa-file-pdf" *ngIf="file.type === 'application/pdf'"></i>
                          <span class="file-name">{{ file.name }}</span>
                        </div>
                        <button type="button" class="remove-file" (click)="removeMessageFile(i)">
                          <i class="fa-solid fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="!messageForm.form.valid || isSendingMessage">
                    <i class="fa-solid fa-spinner fa-spin" *ngIf="isSendingMessage"></i>
                    <i class="fa-solid fa-paper-plane" *ngIf="!isSendingMessage"></i>
                    {{ isSendingMessage ? 'Sende...' : 'Nachricht senden' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .support-container {
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

    /* Statistics */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: white;
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .stat-icon {
      font-size: var(--text-2xl);
      color: var(--color-primary-500);
    }

    .stat-content h3 {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-1) 0;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-text);
    }

    /* Tickets Section */
    .tickets-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .tickets-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tickets-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .filter-controls {
      display: flex;
      gap: var(--space-3);
    }

    .filter-select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    /* Ticket Cards */
    .ticket-card {
      border-bottom: 1px solid var(--color-border);
      transition: all var(--transition);
    }

    .ticket-card:last-child {
      border-bottom: none;
    }

    .ticket-card:hover {
      background: var(--bg-light-green);
    }

    .ticket-card.priority-urgent {
      border-left: 4px solid #dc2626;
    }

    .ticket-card.priority-high {
      border-left: 4px solid #ef4444;
    }

    .ticket-card.priority-normal {
      border-left: 4px solid #f59e0b;
    }

    .ticket-card.priority-low {
      border-left: 4px solid #10b981;
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--color-border);
    }

    .ticket-info .ticket-id {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
      margin-bottom: var(--space-1);
    }

    .ticket-info .ticket-subject {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .ticket-info .ticket-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .ticket-badges {
      display: flex;
      gap: var(--space-2);
    }

    .priority-badge, .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ticket-content {
      padding: var(--space-6);
    }

    .ticket-category {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: var(--space-3);
    }

    .ticket-description {
      color: var(--color-muted);
      line-height: 1.6;
      margin-bottom: var(--space-3);
    }

    .ticket-assignee {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .ticket-actions {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: var(--space-3);
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
      margin: 0 0 var(--space-6) 0;
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
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.large {
      max-width: 800px;
    }

    .modal-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: var(--text-lg);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .modal-close:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
    }

    /* Form Styles */
    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .form-textarea {
      resize: vertical;
      font-family: inherit;
    }

    .form-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-6);
    }

    /* Ticket Details */
    .ticket-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .ticket-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .meta-item strong {
      font-size: var(--text-sm);
      color: var(--color-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ticket-description-section h4,
    .messages-section h4,
    .reply-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-3);
    }

    .description-content {
      background: var(--bg-light-green);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-primary-500);
      line-height: 1.6;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .message-item {
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .message-item.admin {
      background: var(--color-primary-50);
      border-color: var(--color-primary-200);
    }

    .message-item.restaurant_manager {
      background: var(--color-success-50);
      border-color: var(--color-success-200);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .sender-name {
      font-weight: 600;
      color: var(--color-text);
    }

    .message-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .message-content {
      line-height: 1.6;
      color: var(--color-text);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .support-container {
        padding: var(--space-4) 0;
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .tickets-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }

      .ticket-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .ticket-badges {
        align-self: stretch;
        justify-content: flex-start;
      }

      .ticket-actions {
        flex-direction: column;
      }

      .modal-content {
        margin: var(--space-4);
        max-height: calc(100vh - 2rem);
      }

      .ticket-meta {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }

    /* File Upload Styles */
    .file-upload-area {
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-6);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--color-background);
    }

    .file-upload-area:hover {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }

    .file-upload-area.small {
      padding: var(--space-4);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    .upload-content i {
      font-size: var(--text-2xl);
      color: var(--color-muted);
    }

    .upload-content p {
      margin: 0;
      color: var(--color-text);
      font-weight: 500;
    }

    .upload-content small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .selected-files {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-3);
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .file-info i {
      color: var(--color-primary-500);
    }

    .file-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .file-size {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .remove-file {
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }

    .remove-file:hover {
      color: var(--color-error);
      background: var(--color-error-50);
    }
  `]
})
export class RestaurantManagerSupportComponent implements OnInit {
  private supportTicketsService = inject(SupportTicketsService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  isLoading = false;
  statusFilter = '';

  // Modal states
  showCreateModal = false;
  showDetailsModal = false;
  selectedTicket: SupportTicket | null = null;
  ticketMessages: SupportTicketMessage[] = [];

  // Form data
  newTicket: CreateSupportTicketData = {
    restaurant_id: 0,
    subject: '',
    description: '',
    category: 'other',
    priority: 'normal'
  };

  newMessage = {
    message: ''
  };

  // Loading states
  isCreating = false;
  isSendingMessage = false;

  // File upload properties
  selectedFiles: File[] = [];
  messageFiles: File[] = [];

  ngOnInit() {
    this.loadTickets();
  }

  async loadTickets() {
    this.isLoading = true;
    this.loadingService.start('support-tickets');

    try {
      // Get managed restaurants first
      const restaurants = await this.restaurantManagerService.getManagedRestaurants().toPromise();
      if (restaurants && restaurants.length > 0) {
        const restaurantId = parseInt(restaurants[0].restaurant_id, 10);
        this.newTicket.restaurant_id = restaurantId;
        
        const tickets = await this.supportTicketsService.getTicketsByRestaurant(restaurantId).toPromise();
        this.tickets = tickets || [];
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
      this.toastService.error('Tickets laden', 'Fehler beim Laden der Support-Tickets');
      this.tickets = [];
    } finally {
      this.loadingService.stop('support-tickets');
      this.isLoading = false;
    }
  }

  applyFilters() {
    if (!this.statusFilter) {
      this.filteredTickets = [...this.tickets];
    } else {
      this.filteredTickets = this.tickets.filter(ticket => ticket.status === this.statusFilter);
    }
  }

  async createTicket() {
    if (!this.newTicket.subject || !this.newTicket.description || !this.newTicket.category) {
      this.toastService.error('Ticket erstellen', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    this.isCreating = true;

    try {
      const ticket = await this.supportTicketsService.createTicket(this.newTicket).toPromise();
      
      // Upload attachments if any
      if (this.selectedFiles.length > 0) {
        try {
          await this.supportTicketsService.uploadAttachments(ticket!.id, this.selectedFiles).toPromise();
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          this.toastService.warning('Ticket erstellt', 'Ticket wurde erstellt, aber Dateien konnten nicht hochgeladen werden');
        }
      }
      
      this.toastService.success('Ticket erstellt', 'Ihr Support-Ticket wurde erfolgreich erstellt');
      this.closeCreateModal();
      this.selectedFiles = []; // Clear selected files
      this.loadTickets();
    } catch (error) {
      console.error('Error creating support ticket:', error);
      this.toastService.error('Ticket erstellen', 'Fehler beim Erstellen des Support-Tickets');
    } finally {
      this.isCreating = false;
    }
  }

  async viewTicketDetails(ticket: SupportTicket) {
    this.selectedTicket = ticket;
    this.showDetailsModal = true;

    try {
      const messages = await this.supportTicketsService.getTicketMessages(ticket.id).toPromise();
      this.ticketMessages = messages || [];
    } catch (error) {
      console.error('Error loading ticket messages:', error);
      this.toastService.error('Nachrichten laden', 'Fehler beim Laden der Nachrichten');
    }
  }

  async sendMessage() {
    if (!this.newMessage.message.trim() || !this.selectedTicket) {
      return;
    }

    this.isSendingMessage = true;

    try {
      const message = await this.supportTicketsService.addMessage(this.selectedTicket.id, {
        message: this.newMessage.message
      }).toPromise();

      // Upload attachments if any
      if (this.messageFiles.length > 0) {
        try {
          await this.supportTicketsService.uploadMessageAttachments(this.selectedTicket.id, message!.id, this.messageFiles).toPromise();
        } catch (uploadError) {
          console.error('Error uploading message attachments:', uploadError);
          this.toastService.warning('Nachricht gesendet', 'Nachricht wurde gesendet, aber Dateien konnten nicht hochgeladen werden');
        }
      }

      this.toastService.success('Nachricht gesendet', 'Ihre Nachricht wurde erfolgreich gesendet');
      this.newMessage.message = '';
      this.messageFiles = []; // Clear message files
      this.viewTicketDetails(this.selectedTicket); // Reload messages
    } catch (error) {
      console.error('Error sending message:', error);
      this.toastService.error('Nachricht senden', 'Fehler beim Senden der Nachricht');
    } finally {
      this.isSendingMessage = false;
    }
  }

  openCreateTicketModal() {
    this.showCreateModal = true;
    this.newTicket = {
      restaurant_id: this.newTicket.restaurant_id,
      subject: '',
      description: '',
      category: 'other',
      priority: 'normal'
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openMessageModal(ticket: SupportTicket) {
    this.viewTicketDetails(ticket);
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedTicket = null;
    this.ticketMessages = [];
    this.newMessage.message = '';
  }

  // Helper methods
  getStatusCount(status: SupportTicket['status']): number {
    return this.tickets.filter(ticket => ticket.status === status).length;
  }

  getPriorityClass(priority: SupportTicket['priority']): string {
    return `priority-${priority}`;
  }

  getPriorityLabel(priority: SupportTicket['priority']): string {
    return this.supportTicketsService.getPriorityLabel(priority);
  }

  getStatusLabel(status: SupportTicket['status']): string {
    return this.supportTicketsService.getStatusLabel(status);
  }

  getCategoryLabel(category: SupportTicket['category']): string {
    return this.supportTicketsService.getCategoryLabel(category);
  }

  getPriorityColor(priority: SupportTicket['priority']): string {
    return this.supportTicketsService.getPriorityColor(priority);
  }

  getStatusColor(status: SupportTicket['status']): string {
    return this.supportTicketsService.getStatusColor(status);
  }

  getCategoryIcon(category: SupportTicket['category']): string {
    return this.supportTicketsService.getCategoryIcon(category);
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

  // File upload methods
  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.validateAndAddFiles(files, 'ticket');
  }

  onMessageFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.validateAndAddFiles(files, 'message');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.validateAndAddFiles(files, 'ticket');
  }

  onMessageDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onMessageDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.validateAndAddFiles(files, 'message');
  }

  validateAndAddFiles(files: File[], type: 'ticket' | 'message') {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    
    for (const file of files) {
      if (file.size > maxSize) {
        this.toastService.error('Datei zu groß', `${file.name} ist größer als 5MB`);
        continue;
      }
      
      if (!allowedTypes.includes(file.type)) {
        this.toastService.error('Dateityp nicht unterstützt', `${file.name} hat einen nicht unterstützten Dateityp`);
        continue;
      }
      
      if (type === 'ticket') {
        if (this.selectedFiles.length >= 5) {
          this.toastService.error('Zu viele Dateien', 'Maximal 5 Dateien pro Ticket erlaubt');
          break;
        }
        this.selectedFiles.push(file);
      } else {
        if (this.messageFiles.length >= 5) {
          this.toastService.error('Zu viele Dateien', 'Maximal 5 Dateien pro Nachricht erlaubt');
          break;
        }
        this.messageFiles.push(file);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  removeMessageFile(index: number) {
    this.messageFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
