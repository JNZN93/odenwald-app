import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SupportTicket {
  id: string;
  restaurant_id: number;
  created_by_user_id: number;
  subject: string;
  description: string;
  category: 'technical_issue' | 'payment_issue' | 'feature_request' | 'account_issue' | 
           'menu_management' | 'order_management' | 'driver_issue' | 'platform_issue' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_response' | 'resolved' | 'closed';
  source: 'restaurant_manager' | 'restaurant_owner' | 'admin';
  assigned_to_admin_id?: number;
  assigned_at?: string;
  resolved_at?: string;
  closed_at?: string;
  tenant_id?: number;
  created_at: string;
  updated_at: string;
  restaurant_name?: string;
  creator_name?: string;
  creator_email?: string;
  assignee_name?: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_user_id: number;
  sender_type: 'restaurant_manager' | 'restaurant_owner' | 'admin';
  message: string;
  is_internal_note: boolean;
  attachments?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender_name?: string;
}

export interface SupportTicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

export interface CreateSupportTicketData {
  restaurant_id: number;
  subject: string;
  description: string;
  category: SupportTicket['category'];
  priority?: SupportTicket['priority'];
}

export interface CreateSupportTicketMessageData {
  message: string;
  is_internal_note?: boolean;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_for_response: number;
  resolved: number;
  closed: number;
  urgent: number;
  high_priority: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupportTicketsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Ticket Management
  createTicket(data: CreateSupportTicketData): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/support-tickets`, data);
  }

  getTickets(filters?: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
    category?: SupportTicket['category'];
    restaurant_id?: number;
    assigned_to_admin_id?: number;
  }): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/support-tickets`, { params: filters as any });
  }

  getTicketStats(): Observable<SupportTicketStats> {
    return this.http.get<SupportTicketStats>(`${this.apiUrl}/support-tickets/stats`);
  }

  getTicketsByRestaurant(restaurantId: number): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/support-tickets/restaurant/${restaurantId}`);
  }

  getTicket(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.apiUrl}/support-tickets/${id}`);
  }

  updateTicket(id: string, data: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
    assigned_to_admin_id?: number;
  }): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.apiUrl}/support-tickets/${id}`, data);
  }

  assignTicket(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/support-tickets/${id}/assign`, {});
  }

  closeTicket(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/support-tickets/${id}/close`, {});
  }

  resolveTicket(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/support-tickets/${id}/resolve`, {});
  }

  // Message Management
  addMessage(ticketId: string, data: CreateSupportTicketMessageData): Observable<SupportTicketMessage> {
    return this.http.post<SupportTicketMessage>(`${this.apiUrl}/support-tickets/${ticketId}/messages`, data);
  }

  getTicketMessages(ticketId: string): Observable<SupportTicketMessage[]> {
    return this.http.get<SupportTicketMessage[]>(`${this.apiUrl}/support-tickets/${ticketId}/messages`);
  }

  markMessageAsRead(messageId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/support-tickets/messages/${messageId}/read`, {});
  }

  // Attachment Management
  uploadAttachments(ticketId: string, files: File[]): Observable<{ message: string; attachments: SupportTicketAttachment[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    
    return this.http.post<{ message: string; attachments: SupportTicketAttachment[] }>(
      `${this.apiUrl}/support-tickets/${ticketId}/attachments`, 
      formData
    );
  }

  uploadMessageAttachments(ticketId: string, messageId: string, files: File[]): Observable<{ message: string; attachments: SupportTicketAttachment[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    
    return this.http.post<{ message: string; attachments: SupportTicketAttachment[] }>(
      `${this.apiUrl}/support-tickets/${ticketId}/messages/${messageId}/attachments`, 
      formData
    );
  }

  getTicketAttachments(ticketId: string): Observable<SupportTicketAttachment[]> {
    return this.http.get<SupportTicketAttachment[]>(`${this.apiUrl}/support-tickets/${ticketId}/attachments`);
  }

  getMessageAttachments(messageId: string): Observable<SupportTicketAttachment[]> {
    return this.http.get<SupportTicketAttachment[]>(`${this.apiUrl}/support-tickets/messages/${messageId}/attachments`);
  }

  deleteAttachment(attachmentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/support-tickets/attachments/${attachmentId}`);
  }

  // Helper Methods
  getCategoryLabel(category: SupportTicket['category']): string {
    const labels: { [key: string]: string } = {
      technical_issue: '🔧 Technisches Problem',
      payment_issue: '💳 Zahlungsproblem',
      feature_request: '✨ Feature-Anfrage',
      account_issue: '👤 Account-Problem',
      menu_management: '📋 Speisekarten-Management',
      order_management: '🛒 Bestellungs-Management',
      driver_issue: '🚗 Fahrer-Problem',
      platform_issue: '🌐 Plattform-Problem',
      other: '❓ Sonstiges'
    };
    return labels[category] || category;
  }

  getPriorityLabel(priority: SupportTicket['priority']): string {
    const labels: { [key: string]: string } = {
      low: '🟢 Niedrig',
      normal: '🟡 Normal',
      high: '🟠 Hoch',
      urgent: '🔴 Dringend'
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: SupportTicket['status']): string {
    const labels: { [key: string]: string } = {
      open: '🔴 Offen',
      in_progress: '🟡 In Bearbeitung',
      waiting_for_response: '⏳ Wartet auf Antwort',
      resolved: '✅ Gelöst',
      closed: '⚫ Geschlossen'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: SupportTicket['priority']): string {
    const colors: { [key: string]: string } = {
      low: '#10b981',
      normal: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  }

  getStatusColor(status: SupportTicket['status']): string {
    const colors: { [key: string]: string } = {
      open: '#ef4444',
      in_progress: '#f59e0b',
      waiting_for_response: '#3b82f6',
      resolved: '#10b981',
      closed: '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  getCategoryIcon(category: SupportTicket['category']): string {
    const icons: { [key: string]: string } = {
      technical_issue: 'fa-tools',
      payment_issue: 'fa-credit-card',
      feature_request: 'fa-lightbulb',
      account_issue: 'fa-user-cog',
      menu_management: 'fa-list-alt',
      order_management: 'fa-shopping-cart',
      driver_issue: 'fa-truck',
      platform_issue: 'fa-server',
      other: 'fa-question-circle'
    };
    return icons[category] || 'fa-question-circle';
  }
}
