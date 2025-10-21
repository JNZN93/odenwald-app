import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChatRoom {
  id: string;
  customer_id: string;
  restaurant_id: string;
  order_id?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  restaurant_name?: string;
  restaurant_logo?: string;
  order_number?: string;
  unread_count?: number;
  last_message?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  sender_type: 'customer' | 'restaurant';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatRoomsResponse {
  count: number;
  chat_rooms: ChatRoom[];
}

export interface ChatMessagesResponse {
  count: number;
  messages: ChatMessage[];
}

export interface CreateChatRoomRequest {
  restaurant_id: string;
  order_id?: string;
}

export interface SendMessageRequest {
  message: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/chat`;
  
  private chatRoomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private messagesSubject = new BehaviorSubject<{ [roomId: string]: ChatMessage[] }>({});
  private unreadCountSubject = new BehaviorSubject<{ [roomId: string]: number }>({});
  
  public chatRooms$ = this.chatRoomsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private pollingSubscription?: Subscription;
  private currentRoomId?: string;

  constructor() {
    // Start polling for new messages every 5 seconds
    this.startPolling();
  }

  // Get user's chat rooms
  getChatRooms(): Observable<ChatRoomsResponse> {
    return this.http.get<ChatRoomsResponse>(`${this.baseUrl}/rooms`).pipe(
      tap(response => {
        this.chatRoomsSubject.next(response.chat_rooms);
        // Update unread counts
        const unreadCounts: { [roomId: string]: number } = {};
        response.chat_rooms.forEach(room => {
          unreadCounts[room.id] = room.unread_count || 0;
        });
        this.unreadCountSubject.next(unreadCounts);
      })
    );
  }

  // Create or get chat room
  createChatRoom(request: CreateChatRoomRequest): Observable<{ message: string; chat_room: ChatRoom }> {
    return this.http.post<{ message: string; chat_room: ChatRoom }>(`${this.baseUrl}/rooms`, request).pipe(
      tap(() => {
        // Refresh chat rooms after creating
        this.getChatRooms().subscribe();
      })
    );
  }

  // Get messages for a chat room
  getChatMessages(roomId: string, limit: number = 50, offset: number = 0): Observable<ChatMessagesResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ChatMessagesResponse>(`${this.baseUrl}/rooms/${roomId}/messages`, { params }).pipe(
      tap(response => {
        const currentMessages = this.messagesSubject.value;
        currentMessages[roomId] = response.messages;
        this.messagesSubject.next({ ...currentMessages });
      })
    );
  }

  // Send message
  sendMessage(roomId: string, request: SendMessageRequest): Observable<{ message: string; chat_message: ChatMessage }> {
    return this.http.post<{ message: string; chat_message: ChatMessage }>(`${this.baseUrl}/rooms/${roomId}/messages`, request).pipe(
      tap(response => {
        // Add message to local state
        const currentMessages = this.messagesSubject.value;
        if (!currentMessages[roomId]) {
          currentMessages[roomId] = [];
        }
        currentMessages[roomId].push(response.chat_message);
        this.messagesSubject.next({ ...currentMessages });
      })
    );
  }

  // Mark messages as read
  markMessagesAsRead(roomId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/rooms/${roomId}/read`, {}).pipe(
      tap(() => {
        // Update unread count to 0
        const unreadCounts = this.unreadCountSubject.value;
        unreadCounts[roomId] = 0;
        this.unreadCountSubject.next({ ...unreadCounts });
      })
    );
  }

  // Get unread count for a chat room
  getUnreadCount(roomId: string): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.baseUrl}/rooms/${roomId}/unread-count`).pipe(
      tap(response => {
        const unreadCounts = this.unreadCountSubject.value;
        unreadCounts[roomId] = response.unread_count;
        this.unreadCountSubject.next({ ...unreadCounts });
      })
    );
  }

  // Close chat room
  closeChatRoom(roomId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/rooms/${roomId}/close`, {}).pipe(
      tap(() => {
        // Refresh chat rooms after closing
        this.getChatRooms().subscribe();
      })
    );
  }

  // Reopen chat room
  reopenChatRoom(roomId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/rooms/${roomId}/reopen`, {}).pipe(
      tap(() => {
        // Refresh chat rooms after reopening
        this.getChatRooms().subscribe();
      })
    );
  }

  // Get chat room details
  getChatRoomDetails(roomId: string): Observable<{ chat_room: ChatRoom }> {
    return this.http.get<{ chat_room: ChatRoom }>(`${this.baseUrl}/rooms/${roomId}`);
  }

  // Set current room for polling
  setCurrentRoom(roomId: string): void {
    this.currentRoomId = roomId;
  }

  // Start polling for new messages
  private startPolling(): void {
    this.pollingSubscription = interval(5000).subscribe(() => {
      if (this.currentRoomId) {
        this.getChatMessages(this.currentRoomId).subscribe();
      }
      // Also refresh chat rooms to get updated unread counts
      this.getChatRooms().subscribe();
    });
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Get current chat rooms
  getCurrentChatRooms(): ChatRoom[] {
    return this.chatRoomsSubject.value;
  }

  // Get current messages for a room
  getCurrentMessages(roomId: string): ChatMessage[] {
    return this.messagesSubject.value[roomId] || [];
  }

  // Get current unread count for a room
  getCurrentUnreadCount(roomId: string): number {
    return this.unreadCountSubject.value[roomId] || 0;
  }

  // Format message time
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'gerade eben';
    } else if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `vor ${hours} Std`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Check if message is from current user
  isOwnMessage(message: ChatMessage, currentUserId: string): boolean {
    return message.sender_id === currentUserId;
  }

  // Clean up
  ngOnDestroy(): void {
    this.stopPolling();
  }
}

