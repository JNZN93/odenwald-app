import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, ChatRoom } from '../../core/services/chat.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, ImageFallbackDirective],
  template: `
    <div class="chat-list-container">
      <div class="chat-list-header">
        <h2>
          <i class="fa-solid fa-comments"></i>
          Chat Support
        </h2>
        <button class="btn-new-chat" (click)="createNewChat()">
          <i class="fa-solid fa-plus"></i>
          Neuer Chat
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <p>Chats werden geladen...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error && !isLoading">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="loadChatRooms()">Erneut versuchen</button>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && !error && chatRooms.length === 0">
        <i class="fa-solid fa-comments"></i>
        <h4>Noch keine Chats</h4>
        <p>Starten Sie eine Unterhaltung mit einem Restaurant</p>
        <button class="btn-start-chat" (click)="createNewChat()">
          <i class="fa-solid fa-plus"></i>
          Ersten Chat starten
        </button>
      </div>

      <!-- Chat Rooms List -->
      <div class="chat-rooms-list" *ngIf="!isLoading && !error && chatRooms.length > 0">
        <div
          *ngFor="let chatRoom of chatRooms; trackBy: trackByChatRoomId"
          class="chat-room-item"
          [class.unread]="chatRoom.unread_count && chatRoom.unread_count > 0"
          [class.active]="selectedChatRoom?.id === chatRoom.id"
          (click)="selectChatRoom(chatRoom)"
        >
          <div class="chat-room-avatar">
            <img
              [src]="chatRoom.restaurant_logo"
              [alt]="chatRoom.restaurant_name"
              appImageFallback
            >
            <div class="status-indicator" [class.active]="chatRoom.status === 'active'"></div>
          </div>

          <div class="chat-room-content">
            <div class="chat-room-header">
              <h4 class="restaurant-name">{{ chatRoom.restaurant_name }}</h4>
              <div class="chat-room-meta">
                <span class="last-message-time" *ngIf="chatRoom.last_message_at">
                  {{ formatLastMessageTime(chatRoom.last_message_at) }}
                </span>
                <span class="chat-status" [class.closed]="chatRoom.status === 'closed'">
                  {{ getStatusText(chatRoom.status) }}
                </span>
              </div>
            </div>

            <div class="chat-room-preview">
              <p class="last-message" *ngIf="chatRoom.last_message">
                <span class="sender-name">{{ chatRoom.last_message.sender_name }}:</span>
                {{ chatRoom.last_message.message }}
              </p>
              <p class="no-messages" *ngIf="!chatRoom.last_message">
                Noch keine Nachrichten
              </p>
            </div>

            <div class="chat-room-footer">
              <div class="order-info" *ngIf="chatRoom.order_number">
                <i class="fa-solid fa-receipt"></i>
                Bestellung #{{ chatRoom.order_number }}
              </div>
              <div class="unread-badge" *ngIf="chatRoom.unread_count && chatRoom.unread_count > 0">
                {{ chatRoom.unread_count }}
              </div>
            </div>
          </div>

          <div class="chat-room-actions">
            <button 
              class="btn-action"
              (click)="toggleChatRoom(chatRoom, $event)"
              [title]="chatRoom.status === 'closed' ? 'Wiedereröffnen' : 'Schließen'"
            >
              <i class="fa-solid" [class.fa-unlock]="chatRoom.status === 'closed'" [class.fa-lock]="chatRoom.status === 'active'"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-list-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .chat-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      background: var(--gradient-primary);
      color: white;
      border-bottom: 1px solid var(--color-border);
    }

    .chat-list-header h2 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-new-chat {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .btn-new-chat:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-danger);
    }

    .error-state i {
      font-size: 3rem;
      color: var(--color-danger);
      margin-bottom: var(--space-4);
    }

    .error-state p {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-sm);
    }

    .btn-retry {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-retry:hover {
      background: var(--color-primary-700);
      transform: translateY(-1px);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 4rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .empty-state h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .empty-state p {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-sm);
    }

    .btn-start-chat {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin: 0 auto;
    }

    .btn-start-chat:hover {
      background: var(--color-primary-700);
      transform: translateY(-1px);
    }

    .chat-rooms-list {
      max-height: 600px;
      overflow-y: auto;
    }

    .chat-room-item {
      display: flex;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: all var(--transition);
      background: white;
    }

    .chat-room-item:hover {
      background: var(--color-muted-50);
    }

    .chat-room-item.active {
      background: var(--color-primary-50);
      border-left: 4px solid var(--color-primary);
    }

    .chat-room-item.unread {
      background: var(--color-primary-25);
      font-weight: 600;
    }

    .chat-room-avatar {
      position: relative;
      margin-right: var(--space-3);
    }

    .chat-room-avatar img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-muted);
      border: 2px solid white;
    }

    .status-indicator.active {
      background: var(--color-success);
    }

    .chat-room-content {
      flex: 1;
      min-width: 0;
    }

    .chat-room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .restaurant-name {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--color-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-room-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .last-message-time {
      white-space: nowrap;
    }

    .chat-status {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--color-success);
      color: white;
      font-size: var(--text-xs);
    }

    .chat-status.closed {
      background: var(--color-danger);
    }

    .chat-room-preview {
      margin-bottom: var(--space-2);
    }

    .last-message {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sender-name {
      font-weight: 600;
      color: var(--color-heading);
    }

    .no-messages {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-style: italic;
    }

    .chat-room-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-info {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      color: var(--color-primary);
    }

    .unread-badge {
      background: var(--color-primary);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .chat-room-actions {
      margin-left: var(--space-2);
    }

    .btn-action {
      background: var(--color-muted-100);
      border: none;
      color: var(--color-muted);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-action:hover {
      background: var(--color-muted-200);
      color: var(--color-text);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chat-list-header {
        padding: var(--space-3);
      }

      .chat-list-header h2 {
        font-size: var(--text-base);
      }

      .btn-new-chat {
        padding: var(--space-1) var(--space-2);
        font-size: var(--text-sm);
      }

      .chat-room-item {
        padding: var(--space-3);
      }

      .chat-room-avatar img {
        width: 40px;
        height: 40px;
      }

      .restaurant-name {
        font-size: var(--text-sm);
      }

      .chat-room-meta {
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
      }
    }
  `]
})
export class ChatListComponent implements OnInit, OnDestroy {
  @Input() selectedChatRoom?: ChatRoom;
  @Output() chatRoomSelected = new EventEmitter<ChatRoom>();
  @Output() newChatRequested = new EventEmitter<void>();

  chatRooms: ChatRoom[] = [];
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadChatRooms();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadChatRooms() {
    this.isLoading = true;
    this.error = null;

    this.chatService.getChatRooms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chatRooms = response.chat_rooms;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Fehler beim Laden der Chats';
          this.isLoading = false;
          console.error('Error loading chat rooms:', error);
        }
      });
  }

  selectChatRoom(chatRoom: ChatRoom) {
    this.chatRoomSelected.emit(chatRoom);
  }

  createNewChat() {
    this.newChatRequested.emit();
  }

  toggleChatRoom(chatRoom: ChatRoom, event: Event) {
    event.stopPropagation();
    
    const action = chatRoom.status === 'closed' ? 'reopen' : 'close';
    const serviceCall = action === 'close' 
      ? this.chatService.closeChatRoom(chatRoom.id)
      : this.chatService.reopenChatRoom(chatRoom.id);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update local state
        chatRoom.status = action === 'close' ? 'closed' : 'active';
      },
      error: (error) => {
        console.error(`Error ${action}ing chat room:`, error);
      }
    });
  }

  trackByChatRoomId(index: number, chatRoom: ChatRoom): string {
    return chatRoom.id;
  }

  formatLastMessageTime(timestamp: string): string {
    return this.chatService.formatMessageTime(timestamp);
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'closed': return 'Geschlossen';
      case 'archived': return 'Archiviert';
      default: return 'Unbekannt';
    }
  }
}

