import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportTicketsService, SupportTicket, SupportTicketMessage, SupportTicketAttachment, SupportTicketStats } from '../../core/services/support-tickets.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-support-tickets-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="support-admin-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="fa-solid fa-headset"></i>
          </div>
          <div class="header-text">
            <h1>Support-Tickets Verwaltung</h1>
            <p>Verwalte und bearbeite Support-Anfragen von Restaurant-Besitzern</p>
          </div>
        </div>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-number">{{ stats?.total || 0 }}</span>
            <span class="stat-label">Gesamt</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats?.open || 0 }}</span>
            <span class="stat-label">Offen</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats?.in_progress || 0 }}</span>
            <span class="stat-label">In Bearbeitung</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats?.urgent || 0 }}</span>
            <span class="stat-label">Dringend</span>
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
              <option value="waiting_for_response">⏳ Wartet auf Antwort</option>
              <option value="resolved">✅ Gelöst</option>
              <option value="closed">⚫ Geschlossen</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <i class="fa-solid fa-tags"></i>
              Priorität:
            </label>
            <select [ngModel]="filters.priority" (ngModelChange)="onPriorityFilterChange($event)" class="filter-select">
              <option value="">Alle Prioritäten</option>
              <option value="urgent">🔴 Dringend</option>
              <option value="high">🟠 Hoch</option>
              <option value="normal">🟡 Normal</option>
              <option value="low">🟢 Niedrig</option>
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
                placeholder="Ticket-ID, Betreff, Restaurant..."
                class="search-input"
              />
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="tickets-list">
        <div *ngFor="let ticket of filteredTickets; trackBy: trackByTicketId" class="ticket-card" [class]="getPriorityClass(ticket.priority)">
          <!-- Ticket Header -->
          <div class="ticket-header">
            <div class="ticket-id-section">
              <span class="ticket-id">#{{ ticket.id.slice(0, 8) }}</span>
              <span class="ticket-priority-badge" [class]="getPriorityBadgeClass(ticket.priority)">
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </div>
            <div class="ticket-status-section">
              <span class="ticket-status-badge" [class]="getStatusClass(ticket.status)">
                {{ getStatusLabel(ticket.status) }}
              </span>
            </div>
          </div>

          <!-- Ticket Content -->
          <div class="ticket-content">
            <div class="ticket-details">
              <div class="ticket-meta">
                <div class="meta-item">
                  <i class="fa-solid fa-utensils"></i>
                  <span>{{ ticket.restaurant_name || 'Restaurant ID: ' + ticket.restaurant_id }}</span>
                </div>
                <div class="meta-item">
                  <i class="fa-solid fa-user"></i>
                  <span>{{ ticket.creator_name || 'Unbekannt' }}</span>
                </div>
                <div class="meta-item">
                  <i class="fa-solid fa-calendar"></i>
                  <span>{{ ticket.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
                <div class="meta-item">
                  <i [ngClass]="'fa-solid ' + getCategoryIcon(ticket.category)"></i>
                  <span>{{ getCategoryLabel(ticket.category) }}</span>
                </div>
              </div>

              <div class="ticket-description-section">
                <div class="ticket-subject">
                  <strong>{{ ticket.subject }}</strong>
                </div>
                <div class="ticket-description">
                  {{ ticket.description }}
                </div>
              </div>
            </div>

            <!-- Ticket Actions -->
            <div class="ticket-actions">
              <div class="action-group">
                <label class="action-label">Status:</label>
                <select [ngModel]="ticket.status" (ngModelChange)="updateTicketStatus(ticket, $event)" class="action-select">
                  <option value="open">Offen</option>
                  <option value="in_progress">In Bearbeitung</option>
                  <option value="waiting_for_response">Wartet auf Antwort</option>
                  <option value="resolved">Gelöst</option>
                  <option value="closed">Geschlossen</option>
                </select>
              </div>

              <div class="action-group">
                <label class="action-label">Priorität:</label>
                <select [ngModel]="ticket.priority" (ngModelChange)="updateTicketPriority(ticket, $event)" class="action-select">
                  <option value="low">Niedrig</option>
                  <option value="normal">Normal</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              </div>

              <div class="action-group assign-group">
                <label class="action-label">Zuweisung:</label>
                <button
                  class="assign-btn"
                  [class.assigned]="ticket.assigned_to_admin_id"
                  (click)="toggleAssignment(ticket)"
                  [disabled]="assigningTicketId === ticket.id">
                  <i class="fa-solid" [class]="ticket.assigned_to_admin_id ? 'fa-check' : 'fa-share'"></i>
                  {{ ticket.assigned_to_admin_id ? 'Zugewiesen' : 'An mich zuweisen' }}
                </button>
                <div *ngIf="ticket.assignee_name" class="assignment-info">
                  <small>Zugewiesen an: {{ ticket.assignee_name }}</small>
                </div>
              </div>

              <div class="action-group">
                <button class="btn btn-primary" (click)="viewTicketDetails(ticket)">
                  <i class="fa-solid fa-comments"></i>
                  Nachrichten
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredTickets.length === 0" class="empty-state">
          <div class="empty-state-content">
            <div class="empty-icon">
              <i class="fa-solid fa-inbox"></i>
            </div>
            <h3>Keine Tickets gefunden</h3>
            <p>Es wurden keine Support-Tickets gefunden, die Ihren Filterkriterien entsprechen.</p>
            <button class="clear-filters-btn" (click)="clearFilters()" [class.hidden]="!hasActiveFilters()">
              <i class="fa-solid fa-times"></i>
              Filter zurücksetzen
            </button>
          </div>
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
                <strong>Restaurant:</strong> {{ selectedTicket.restaurant_name || 'ID: ' + selectedTicket.restaurant_id }}
              </div>
              <div class="meta-item">
                <strong>Erstellt von:</strong> {{ selectedTicket.creator_name || 'Unbekannt' }}
              </div>
              <div class="meta-item">
                <strong>Kategorie:</strong> {{ getCategoryLabel(selectedTicket.category) }}
              </div>
              <div class="meta-item">
                <strong>Status:</strong> 
                <span class="ticket-status-badge" [class]="'ticket-status-badge status-' + selectedTicket.status">
                  {{ getStatusLabel(selectedTicket.status) }}
                </span>
              </div>
              <div class="meta-item">
                <strong>Priorität:</strong> 
                <span class="ticket-priority-badge" [class]="'ticket-priority-badge priority-' + selectedTicket.priority">
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

            <!-- Ticket Attachments -->
            <div class="attachments-section" *ngIf="ticketAttachments.length > 0">
              <h4>Angehängte Dateien ({{ ticketAttachments.length }})</h4>
              <div class="attachments-grid">
                <div *ngFor="let attachment of ticketAttachments" class="attachment-item">
                  <div *ngIf="isImageFile(attachment.mime_type)" class="image-attachment">
                    <img [src]="getAttachmentUrl(attachment)" [alt]="attachment.original_filename" (click)="openImageModal(attachment)">
                    <div class="attachment-info">
                      <span class="attachment-name">{{ attachment.original_filename }}</span>
                      <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                    </div>
                  </div>
                  <div *ngIf="!isImageFile(attachment.mime_type)" class="file-attachment">
                    <i class="fa-solid fa-file-pdf" *ngIf="attachment.mime_type === 'application/pdf'"></i>
                    <i class="fa-solid fa-file" *ngIf="attachment.mime_type !== 'application/pdf'"></i>
                    <div class="attachment-info">
                      <span class="attachment-name">{{ attachment.original_filename }}</span>
                      <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                    </div>
                    <a [href]="getAttachmentUrl(attachment)" target="_blank" class="download-btn">
                      <i class="fa-solid fa-download"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="messages-section">
              <h4>Nachrichtenverlauf</h4>
              <div class="messages-list">
                <div *ngFor="let message of ticketMessages" class="message-item" [class]="message.sender_type">
                  <div class="message-header">
                    <span class="sender-name">{{ message.sender_name || (message.sender_type === 'admin' ? 'Admin' : 'Restaurant Manager') }}</span>
                    <span class="message-time">{{ formatDate(message.created_at) }}</span>
                  </div>
                  <div class="message-content">{{ message.message }}</div>
                  
                  <!-- Message Attachments -->
                  <div class="message-attachments" *ngIf="messageAttachments[message.id]?.length > 0">
                    <div class="attachments-grid small">
                      <div *ngFor="let attachment of messageAttachments[message.id]" class="attachment-item small">
                        <div *ngIf="isImageFile(attachment.mime_type)" class="image-attachment">
                          <img [src]="getAttachmentUrl(attachment)" [alt]="attachment.original_filename" (click)="openImageModal(attachment)">
                          <div class="attachment-info">
                            <span class="attachment-name">{{ attachment.original_filename }}</span>
                            <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                          </div>
                        </div>
                        <div *ngIf="!isImageFile(attachment.mime_type)" class="file-attachment">
                          <i class="fa-solid fa-file-pdf" *ngIf="attachment.mime_type === 'application/pdf'"></i>
                          <i class="fa-solid fa-file" *ngIf="attachment.mime_type !== 'application/pdf'"></i>
                          <div class="attachment-info">
                            <span class="attachment-name">{{ attachment.original_filename }}</span>
                            <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                          </div>
                          <a [href]="getAttachmentUrl(attachment)" target="_blank" class="download-btn">
                            <i class="fa-solid fa-download"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="reply-section">
              <h4>Antwort hinzufügen</h4>
              <form (ngSubmit)="sendMessage()" #messageForm="ngForm">
                <div class="form-group">
                  <label class="form-label">
                    <input type="checkbox" [(ngModel)]="newMessage.is_internal_note" name="is_internal_note">
                    Interne Notiz (nur für Admins sichtbar)
                  </label>
                </div>
                <textarea 
                  [(ngModel)]="newMessage.message" 
                  name="message"
                  class="form-textarea"
                  rows="4"
                  placeholder="Ihre Antwort..."
                  required
                ></textarea>
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

    <!-- Image Modal -->
    <div class="modal-overlay" *ngIf="showImageModal" (click)="closeImageModal()">
      <div class="image-modal-content" (click)="$event.stopPropagation()">
        <div class="image-modal-header">
          <h3>{{ selectedImage?.original_filename }}</h3>
          <button class="modal-close" (click)="closeImageModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="image-modal-body">
          <img *ngIf="selectedImage" [src]="getAttachmentUrl(selectedImage)" [alt]="selectedImage.original_filename" class="full-size-image">
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .support-admin-container {
      padding: var(--space-8);
      max-width: 1400px;
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
      color: white !important;
    }

    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: var(--text-lg);
      color: white !important;
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
      color: white !important;
    }

    .stat-label {
      font-size: var(--text-xs);
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white !important;
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
      grid-template-columns: 1fr 1fr 2fr;
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
      grid-column: 3;
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

    /* Tickets List */
    .tickets-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Ticket Cards */
    .ticket-card {
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
      overflow: hidden;
      transition: all var(--transition);
      position: relative;
    }

    .ticket-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* Priority-based card styling */
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

    /* Ticket Header */
    .ticket-header {
      background: var(--color-surface-2);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ticket-id-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .ticket-id {
      font-family: 'Monaco', 'Menlo', monospace;
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .ticket-priority-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .ticket-priority-badge.priority-urgent {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }

    .ticket-priority-badge.priority-urgent:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    .ticket-priority-badge.priority-high {
      background: linear-gradient(135deg, #f97316, #fb923c);
      color: white;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
    }

    .ticket-priority-badge.priority-high:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
    }

    .ticket-priority-badge.priority-normal {
      background: linear-gradient(135deg, #eab308, #facc15);
      color: white;
      box-shadow: 0 2px 8px rgba(234, 179, 8, 0.3);
    }

    .ticket-priority-badge.priority-normal:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);
    }

    .ticket-priority-badge.priority-low {
      background: linear-gradient(135deg, #22c55e, #4ade80);
      color: white;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    }

    .ticket-priority-badge.priority-low:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }

    .ticket-status-section {
      display: flex;
      gap: 0.5rem;
    }

    .ticket-status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .ticket-status-badge.status-open {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    .ticket-status-badge.status-open:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    .ticket-status-badge.status-in_progress {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    }

    .ticket-status-badge.status-in_progress:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    .ticket-status-badge.status-waiting_for_response {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .ticket-status-badge.status-waiting_for_response:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .ticket-status-badge.status-resolved {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .ticket-status-badge.status-resolved:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .ticket-status-badge.status-closed {
      background: linear-gradient(135deg, #6b7280, #9ca3af);
      color: white;
      box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
    }

    .ticket-status-badge.status-closed:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
    }

    /* Ticket Content */
    .ticket-content {
      padding: var(--space-6);
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-8);
    }

    .ticket-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .ticket-meta {
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

    .ticket-description-section {
      background: var(--bg-light-green);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border-left: 3px solid var(--color-primary-500);
    }

    .ticket-subject {
      color: var(--color-heading);
      margin-bottom: var(--space-2);
      font-size: var(--text-lg);
    }

    .ticket-description {
      color: var(--color-muted);
      line-height: 1.6;
      white-space: pre-line;
    }

    /* Ticket Actions */
    .ticket-actions {
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
      max-width: 900px;
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

    /* Form Styles */
    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 500;
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .form-textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      background: var(--color-surface);
      color: var(--color-text);
      transition: all var(--transition);
      resize: vertical;
      font-family: inherit;
    }

    .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .form-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-6);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .support-admin-container {
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

      .ticket-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .ticket-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-4);
      }

      .ticket-meta {
        grid-template-columns: 1fr;
      }

      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .support-admin-container {
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

      .ticket-id-section {
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

    /* Attachment Styles */
    .attachments-section {
      margin-bottom: var(--space-6);
    }

    .attachments-section h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-3);
    }

    .attachments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .attachments-grid.small {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--space-3);
    }

    .attachment-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: white;
      transition: all var(--transition);
    }

    .attachment-item:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .attachment-item.small {
      border-radius: var(--radius-md);
    }

    .image-attachment img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      cursor: pointer;
      transition: all var(--transition);
    }

    .image-attachment img:hover {
      transform: scale(1.05);
    }

    .file-attachment {
      display: flex;
      align-items: center;
      padding: var(--space-4);
      gap: var(--space-3);
    }

    .file-attachment i {
      font-size: var(--text-2xl);
      color: var(--color-primary-500);
      flex-shrink: 0;
    }

    .attachment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .attachment-name {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--text-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .attachment-size {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .download-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: var(--color-primary-500);
      color: white;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all var(--transition);
      flex-shrink: 0;
    }

    .download-btn:hover {
      background: var(--color-primary-600);
      transform: scale(1.1);
    }

    .message-attachments {
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
    }

    /* Image Modal Styles */
    .image-modal-content {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      max-width: 90vw;
      max-height: 90vh;
      width: auto;
      height: auto;
    }

    .image-modal-header {
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .image-modal-header h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
      max-width: 400px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .image-modal-body {
      padding: var(--space-4);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .full-size-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
    }

    /* Responsive adjustments for attachments */
    @media (max-width: 768px) {
      .attachments-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--space-3);
      }

      .attachments-grid.small {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }

      .image-attachment img {
        height: 120px;
      }

      .file-attachment {
        padding: var(--space-3);
        flex-direction: column;
        text-align: center;
        gap: var(--space-2);
      }

      .attachment-info {
        align-items: center;
      }

      .attachment-name {
        white-space: normal;
        text-align: center;
        font-size: var(--text-xs);
      }
    }
  `]
})
export class SupportTicketsAdminComponent implements OnInit {
  private supportTicketsService = inject(SupportTicketsService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  filters: { 
    status?: SupportTicket['status'] | ''; 
    priority?: SupportTicket['priority'] | '';
    search: string 
  } = { status: '', priority: '', search: '' };
  
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  stats: SupportTicketStats | null = null;
  assigningTicketId: string | null = null;

  // Modal states
  showDetailsModal = false;
  showImageModal = false;
  selectedTicket: SupportTicket | null = null;
  selectedImage: SupportTicketAttachment | null = null;
  ticketMessages: SupportTicketMessage[] = [];
  ticketAttachments: SupportTicketAttachment[] = [];
  messageAttachments: { [messageId: string]: SupportTicketAttachment[] } = {};

  // Form data
  newMessage = {
    message: '',
    is_internal_note: false
  };

  // Loading states
  isSendingMessage = false;

  ngOnInit(): void {
    this.loadTickets();
    this.loadStats();
  }

  loadTickets() {
    this.loadingService.start('support-tickets');
    
    const params: any = {};
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.priority) params.priority = this.filters.priority;

    this.supportTicketsService.getTickets(params).subscribe({
      next: (data) => { 
        this.tickets = data; 
        this.applyFilters();
        this.loadingService.stop('support-tickets');
      },
      error: (err) => { 
        console.error('Failed to load support tickets', err); 
        this.tickets = []; 
        this.applyFilters();
        this.loadingService.stop('support-tickets');
      }
    });
  }

  loadStats() {
    this.supportTicketsService.getTicketStats().subscribe({
      next: (data) => { this.stats = data; },
      error: (err) => { console.error('Failed to load ticket stats', err); }
    });
  }

  applyFilters() {
    const search = (this.filters.search || '').toLowerCase();
    this.filteredTickets = this.tickets.filter(ticket => {
      if (!search) return true;
      return (
        ticket.id.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        (ticket.restaurant_name || '').toLowerCase().includes(search) ||
        (ticket.creator_name || '').toLowerCase().includes(search)
      );
    });
  }

  updateTicket(ticket: SupportTicket) {
    this.supportTicketsService.updateTicket(ticket.id, {
      status: ticket.status,
      priority: ticket.priority,
      assigned_to_admin_id: ticket.assigned_to_admin_id
    }).subscribe({
      next: () => {
        this.toastService.success('Ticket aktualisiert', 'Das Ticket wurde erfolgreich aktualisiert');
      },
      error: (err) => {
        console.error('Failed to update ticket', err);
        this.toastService.error('Ticket aktualisieren', 'Fehler beim Aktualisieren des Tickets');
      }
    });
  }

  // Helper methods for styling and display
  getPriorityClass(priority: SupportTicket['priority']): string {
    return `priority-${priority}`;
  }

  getPriorityBadgeClass(priority: SupportTicket['priority']): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: SupportTicket['status']): string {
    return `status-${status}`;
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

  trackByTicketId(index: number, ticket: SupportTicket): string {
    return ticket.id;
  }

  clearFilters() {
    this.filters.status = '';
    this.filters.priority = '';
    this.filters.search = '';
    this.loadTickets();
  }

  // Event handlers for form controls
  onStatusFilterChange(value: string) {
    this.filters.status = value as SupportTicket['status'] | '';
    this.loadTickets();
  }

  onPriorityFilterChange(value: string) {
    this.filters.priority = value as SupportTicket['priority'] | '';
    this.loadTickets();
  }

  onSearchChange(value: string) {
    this.filters.search = value;
    this.applyFilters();
  }

  updateTicketStatus(ticket: SupportTicket, status: SupportTicket['status']) {
    ticket.status = status;
    this.updateTicket(ticket);
  }

  updateTicketPriority(ticket: SupportTicket, priority: SupportTicket['priority']) {
    ticket.priority = priority;
    this.updateTicket(ticket);
  }

  toggleAssignment(ticket: SupportTicket) {
    if (ticket.assigned_to_admin_id) {
      // Remove assignment (unassign)
      this.assigningTicketId = ticket.id;
      this.supportTicketsService.updateTicket(ticket.id, {
        assigned_to_admin_id: undefined
      }).subscribe({
        next: (updated: SupportTicket) => {
          ticket.assigned_to_admin_id = updated.assigned_to_admin_id;
          ticket.assignee_name = updated.assignee_name;
          this.assigningTicketId = null;
          this.toastService.success('Zuweisung entfernt', 'Das Ticket wurde erfolgreich zugewiesen');
        },
        error: (err) => {
          console.error('Failed to unassign ticket', err);
          this.assigningTicketId = null;
          this.toastService.error('Zuweisung entfernen', 'Fehler beim Entfernen der Zuweisung');
        }
      });
    } else {
      // Assign to current admin
      this.assigningTicketId = ticket.id;
      this.supportTicketsService.assignTicket(ticket.id).subscribe({
        next: (updated: SupportTicket) => {
          ticket.assigned_to_admin_id = updated.assigned_to_admin_id;
          ticket.assignee_name = updated.assignee_name;
          this.assigningTicketId = null;
          this.toastService.success('Ticket zugewiesen', 'Das Ticket wurde Ihnen erfolgreich zugewiesen');
        },
        error: (err) => {
          console.error('Failed to assign ticket', err);
          this.assigningTicketId = null;
          this.toastService.error('Ticket zuweisen', 'Fehler beim Zuweisen des Tickets');
        }
      });
    }
  }

  async viewTicketDetails(ticket: SupportTicket) {
    this.selectedTicket = ticket;
    this.showDetailsModal = true;

    try {
      // Load messages and attachments in parallel
      const [messages, attachments] = await Promise.all([
        this.supportTicketsService.getTicketMessages(ticket.id).toPromise(),
        this.supportTicketsService.getTicketAttachments(ticket.id).toPromise()
      ]);
      
      this.ticketMessages = messages || [];
      this.ticketAttachments = attachments || [];
      
      // Load attachments for each message
      this.messageAttachments = {};
      for (const message of this.ticketMessages) {
        try {
          const messageAttachments = await this.supportTicketsService.getMessageAttachments(message.id).toPromise();
          this.messageAttachments[message.id] = messageAttachments || [];
        } catch (error) {
          console.error('Error loading message attachments:', error);
          this.messageAttachments[message.id] = [];
        }
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      this.toastService.error('Ticket Details laden', 'Fehler beim Laden der Ticket-Details');
    }
  }

  async sendMessage() {
    if (!this.newMessage.message.trim() || !this.selectedTicket) {
      return;
    }

    this.isSendingMessage = true;

    try {
      await this.supportTicketsService.addMessage(this.selectedTicket.id, {
        message: this.newMessage.message,
        is_internal_note: this.newMessage.is_internal_note
      }).toPromise();

      this.toastService.success('Nachricht gesendet', 'Ihre Nachricht wurde erfolgreich gesendet');
      this.newMessage.message = '';
      this.newMessage.is_internal_note = false;
      this.viewTicketDetails(this.selectedTicket); // Reload messages
    } catch (error) {
      console.error('Error sending message:', error);
      this.toastService.error('Nachricht senden', 'Fehler beim Senden der Nachricht');
    } finally {
      this.isSendingMessage = false;
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedTicket = null;
    this.ticketMessages = [];
    this.ticketAttachments = [];
    this.messageAttachments = {};
    this.newMessage.message = '';
    this.newMessage.is_internal_note = false;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.status || this.filters.priority || this.filters.search);
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

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getAttachmentUrl(attachment: SupportTicketAttachment): string {
    // If it's a full URL (S3), return as is, otherwise construct local URL
    if (attachment.file_path.startsWith('http')) {
      return attachment.file_path;
    }
    return `${environment.apiUrl}${attachment.file_path}`;
  }

  openImageModal(attachment: SupportTicketAttachment) {
    this.selectedImage = attachment;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedImage = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
