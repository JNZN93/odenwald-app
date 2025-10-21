import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatRoom, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-info">
          <div class="chat-title">
            <h3>{{ chatRoom?.restaurant_name || 'Chat' }}</h3>
            <span class="chat-status" [class.active]="chatRoom?.status === 'active'">
              {{ getStatusText(chatRoom?.status) }}
            </span>
          </div>
          <div class="chat-meta" *ngIf="chatRoom?.order_number">
            <i class="fa-solid fa-receipt"></i>
            Bestellung #{{ chatRoom?.order_number }}
          </div>
        </div>
        <div class="chat-actions">
          <button 
            class="btn-action" 
            (click)="toggleChatRoom()"
            [disabled]="!chatRoom"
          >
            <i class="fa-solid" [class.fa-lock]="chatRoom?.status === 'closed'" [class.fa-unlock]="chatRoom?.status === 'active'"></i>
            {{ chatRoom?.status === 'closed' ? 'Wiedereröffnen' : 'Schließen' }}
          </button>
          <button class="btn-action" (click)="closeChat()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        <div class="loading-messages" *ngIf="isLoadingMessages">
          <div class="loading-spinner"></div>
          <p>Nachrichten werden geladen...</p>
        </div>

        <div class="no-messages" *ngIf="!isLoadingMessages && messages.length === 0">
          <i class="fa-solid fa-comments"></i>
          <p>Noch keine Nachrichten</p>
          <p class="no-messages-subtitle">Starten Sie eine Unterhaltung mit dem Restaurant</p>
        </div>

        <div class="messages-list" *ngIf="!isLoadingMessages && messages.length > 0">
          <div 
            *ngFor="let message of messages; trackBy: trackByMessageId"
            class="message"
            [class.own-message]="isOwnMessage(message)"
            [class.system-message]="message.message_type === 'system'"
          >
            <div class="message-content">
              <div class="message-header" *ngIf="message.message_type !== 'system'">
                <span class="sender-name">{{ message.sender_name }}</span>
                <span class="message-time">{{ formatMessageTime(message.created_at) }}</span>
              </div>
              <div class="message-body">
                <p>{{ message.message }}</p>
              </div>
              <div class="message-status" *ngIf="isOwnMessage(message)">
                <i class="fa-solid fa-check" [class.read]="message.is_read"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input" *ngIf="chatRoom?.status === 'active'">
        <div class="input-container">
          <textarea
            [(ngModel)]="newMessage"
            (keydown)="onKeyDown($event)"
            placeholder="Nachricht eingeben..."
            class="message-input"
            rows="1"
            #messageInput
          ></textarea>
          <button 
            class="send-button"
            (click)="sendMessage()"
            [disabled]="!newMessage.trim() || isSendingMessage"
          >
            <i class="fa-solid fa-paper-plane" *ngIf="!isSendingMessage"></i>
            <div class="loading-spinner" *ngIf="isSendingMessage"></div>
          </button>
        </div>
      </div>

      <!-- Chat Closed Message -->
      <div class="chat-closed" *ngIf="chatRoom?.status === 'closed'">
        <i class="fa-solid fa-lock"></i>
        <p>Dieser Chat wurde geschlossen</p>
        <button class="btn-reopen" (click)="toggleChatRoom()">
          <i class="fa-solid fa-unlock"></i>
          Chat wiedereröffnen
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      background: var(--gradient-primary);
      color: white;
      border-bottom: 1px solid var(--color-border);
    }

    .chat-info {
      flex: 1;
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .chat-title h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .chat-status {
      font-size: var(--text-sm);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.2);
    }

    .chat-status.active {
      background: var(--color-success);
    }

    .chat-meta {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      opacity: 0.9;
    }

    .chat-actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
    }

    .btn-action:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4);
      background: var(--color-surface);
    }

    .loading-messages {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .loading-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-3);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .no-messages {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .no-messages i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .no-messages p {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
    }

    .no-messages-subtitle {
      font-size: var(--text-sm) !important;
      opacity: 0.7;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .message {
      display: flex;
      margin-bottom: var(--space-2);
    }

    .message.own-message {
      justify-content: flex-end;
    }

    .message.system-message {
      justify-content: center;
    }

    .message-content {
      max-width: 70%;
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .own-message .message-content {
      background: var(--color-primary);
      color: white;
    }

    .system-message .message-content {
      background: var(--color-muted-100);
      color: var(--color-muted);
      font-size: var(--text-sm);
      text-align: center;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .sender-name {
      font-weight: 600;
      font-size: var(--text-sm);
    }

    .message-time {
      font-size: var(--text-xs);
      opacity: 0.7;
    }

    .message-body p {
      margin: 0;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .message-status {
      position: absolute;
      bottom: var(--space-1);
      right: var(--space-2);
    }

    .message-status i {
      font-size: var(--text-xs);
      opacity: 0.7;
    }

    .message-status i.read {
      color: var(--color-success);
    }

    .chat-input {
      padding: var(--space-4);
      background: white;
      border-top: 1px solid var(--color-border);
    }

    .input-container {
      display: flex;
      gap: var(--space-2);
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      font-size: var(--text-sm);
      resize: none;
      min-height: 40px;
      max-height: 120px;
      font-family: inherit;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 20%, transparent);
    }

    .send-button {
      background: var(--color-primary);
      border: none;
      color: white;
      padding: var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 40px;
    }

    .send-button:hover:not(:disabled) {
      background: var(--color-primary-700);
      transform: translateY(-1px);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .chat-closed {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .chat-closed i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .chat-closed p {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
    }

    .btn-reopen {
      background: var(--color-primary);
      border: none;
      color: white;
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

    .btn-reopen:hover {
      background: var(--color-primary-700);
      transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chat-header {
        padding: var(--space-3);
      }

      .chat-title h3 {
        font-size: var(--text-base);
      }

      .chat-actions {
        gap: var(--space-1);
      }

      .btn-action {
        padding: var(--space-1);
        font-size: var(--text-xs);
      }

      .chat-messages {
        padding: var(--space-3);
      }

      .chat-input {
        padding: var(--space-3);
      }

      .message-content {
        max-width: 85%;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() chatRoom?: ChatRoom;
  @Output() chatClosed = new EventEmitter<void>();

  @ViewChild('messagesContainer') messagesContainer?: ElementRef;
  @ViewChild('messageInput') messageInput?: ElementRef;

  messages: ChatMessage[] = [];
  newMessage = '';
  isLoadingMessages = false;
  isSendingMessage = false;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.chatRoom) {
      this.loadMessages();
      this.chatService.setCurrentRoom(this.chatRoom.id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages() {
    if (!this.chatRoom) return;

    this.isLoadingMessages = true;
    this.chatService.getChatMessages(this.chatRoom.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.isLoadingMessages = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.isLoadingMessages = false;
        }
      });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.chatRoom || this.isSendingMessage) return;

    this.isSendingMessage = true;
    const messageText = this.newMessage.trim();
    this.newMessage = '';

    this.chatService.sendMessage(this.chatRoom.id, { message: messageText })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSendingMessage = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.isSendingMessage = false;
          this.newMessage = messageText; // Restore message on error
        }
      });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleChatRoom() {
    if (!this.chatRoom) return;

    const action = this.chatRoom.status === 'closed' ? 'reopen' : 'close';
    const serviceCall = action === 'close' 
      ? this.chatService.closeChatRoom(this.chatRoom.id)
      : this.chatService.reopenChatRoom(this.chatRoom.id);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update local state
        this.chatRoom!.status = action === 'close' ? 'closed' : 'active';
      },
      error: (error) => {
        console.error(`Error ${action}ing chat room:`, error);
      }
    });
  }

  closeChat() {
    this.chatClosed.emit();
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  isOwnMessage(message: ChatMessage): boolean {
    const currentUser = this.authService.currentUserSubject.value;
    return this.chatService.isOwnMessage(message, currentUser?.id || '');
  }

  formatMessageTime(timestamp: string): string {
    return this.chatService.formatMessageTime(timestamp);
  }

  getStatusText(status?: string): string {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'closed': return 'Geschlossen';
      case 'archived': return 'Archiviert';
      default: return 'Unbekannt';
    }
  }
}
