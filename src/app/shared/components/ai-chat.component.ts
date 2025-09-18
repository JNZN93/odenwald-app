import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService, ChatResponse, BudgetMenuItem } from '../../core/services/ai.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  items?: BudgetMenuItem[];
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-chat-container">
      <div class="chat-header">
        <div class="chat-title">
          <i class="fa-solid fa-robot"></i>
          <span>AI-Assistent</span>
        </div>
        <p class="chat-subtitle">Fragen Sie nach Menüvorschlägen oder Bestellungen</p>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" class="message" [class.user-message]="message.type === 'user'" [class.ai-message]="message.type === 'ai'">
          <div class="message-content">
            <div class="message-text" [innerHTML]="message.content"></div>

            <!-- Budget search results -->
            <div *ngIf="message.items && message.items.length > 0" class="menu-items-grid">
              <div *ngFor="let item of message.items" class="menu-item-card" (click)="navigateToRestaurant(item.restaurant_id)">
                <div class="item-header">
                  <h4>{{ item.item_name }}</h4>
                  <span class="price">{{ item.price_eur | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
                </div>
                <div class="restaurant-name">{{ item.restaurant_name }}</div>

                <!-- Erweiterte Informationen -->
                <div class="item-details">
                  <div *ngIf="item.category" class="category-badge">{{ item.category }}</div>
                  <div class="dietary-badges">
                    <span *ngIf="item.is_vegetarian" class="badge vegetarian">🌱 Vegetarisch</span>
                    <span *ngIf="item.is_vegan" class="badge vegan">🌱 Vegan</span>
                  </div>
                  <div *ngIf="item.preparation_time" class="prep-time">⏱️ {{ item.preparation_time }} Min.</div>
                  <div *ngIf="item.restaurant_rating" class="rating">⭐ {{ item.restaurant_rating }}/5</div>
                  <div *ngIf="item.cuisine_type" class="cuisine-type">{{ item.cuisine_type }}</div>
                  <div *ngIf="item.delivery_fee > 0" class="delivery-info">
                    Lieferung: {{ item.delivery_fee | currency:'EUR':'symbol':'1.2-2':'de' }}
                  </div>
                  <div *ngIf="item.avg_review_rating" class="review-rating">
                    Bewertung: {{ item.avg_review_rating | number:'1.1-1' }}/5 ({{ item.review_count }} Bewertungen)
                  </div>
                </div>

                <button class="btn-primary">Bestellen</button>
              </div>
            </div>
          </div>
          <div class="message-timestamp">{{ message.timestamp | date:'HH:mm' }}</div>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="message ai-message loading-message">
          <div class="message-content">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <form (ngSubmit)="sendMessage()" #chatForm="ngForm">
          <div class="input-group">
            <input
              type="text"
              [(ngModel)]="currentMessage"
              name="message"
              placeholder="z.B. 'Was kann ich für 15€ bestellen?'"
              [disabled]="isLoading"
              required
              #messageInput
            >
            <button type="submit" [disabled]="!chatForm.valid || isLoading" class="send-btn">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>

      <div class="chat-suggestions" *ngIf="messages.length === 0">
        <p>Versuchen Sie:</p>
        <div class="suggestion-chips">
          <button class="chip" (click)="setMessage('Was kann ich für 15€ bestellen?')">15€ Budget</button>
          <button class="chip" (click)="setMessage('Pizza für 2 Personen')">Pizza für 2</button>
          <button class="chip" (click)="setMessage('Vegetarische Optionen')">Vegetarisch</button>
          <button class="chip" (click)="setMessage('Wo ist meine Bestellung?')">Bestellstatus</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-chat-container {
      display: flex;
      flex-direction: column;
      height: 500px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .chat-header {
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border);
      background: var(--bg-light);
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .chat-title i {
      color: var(--color-primary);
      font-size: var(--text-lg);
    }

    .chat-title span {
      font-weight: 600;
      color: var(--color-heading);
    }

    .chat-subtitle {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }

    .user-message {
      align-self: flex-end;
      align-items: flex-end;
    }

    .ai-message {
      align-self: flex-start;
      align-items: flex-start;
    }

    .message-content {
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      position: relative;
    }

    .user-message .message-content {
      background: var(--gradient-primary);
      color: white;
      border-color: transparent;
    }

    .message-text {
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message-timestamp {
      font-size: var(--text-xs);
      color: var(--color-muted);
      margin-top: var(--space-1);
    }

    .loading-message .message-content {
      padding: var(--space-2) var(--space-3);
    }

    .loading-dots {
      display: flex;
      gap: var(--space-1);
    }

    .loading-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary);
      animation: loading 1.4s infinite ease-in-out both;
    }

    .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes loading {
      0%, 80%, 100% { opacity: 0.5; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }

    .menu-items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--space-3);
      margin-top: var(--space-3);
    }

    .menu-item-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      cursor: pointer;
      transition: all var(--transition);
    }

    .menu-item-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2);
    }

    .item-header h4 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-base);
    }

    .price {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 600;
      font-size: var(--text-sm);
      margin-bottom: var(--space-2);
    }

    .item-details {
      margin-bottom: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .category-badge {
      display: inline-block;
      background: var(--color-primary-100);
      color: var(--color-primary-700);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      align-self: flex-start;
    }

    .dietary-badges {
      display: flex;
      gap: var(--space-1);
      flex-wrap: wrap;
    }

    .badge {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-weight: 500;
    }

    .vegetarian {
      background: var(--color-success-100);
      color: var(--color-success-700);
    }

    .vegan {
      background: var(--color-info-100);
      color: var(--color-info-700);
    }

    .prep-time, .rating, .cuisine-type, .delivery-info, .review-rating {
      font-size: var(--text-xs);
      color: var(--color-muted);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .menu-item-card .btn-primary {
      width: 100%;
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
    }

    .chat-input-container {
      padding: var(--space-4);
      border-top: 1px solid var(--color-border);
      background: var(--bg-light);
    }

    .input-group {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .input-group input {
      flex: 1;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
    }

    .input-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .input-group input:disabled {
      background: var(--bg-light);
      cursor: not-allowed;
    }

    .send-btn {
      padding: var(--space-3);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-md);
      color: white;
      cursor: pointer;
      transition: all var(--transition);
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chat-suggestions {
      padding: var(--space-4);
      border-top: 1px solid var(--color-border);
      background: var(--bg-light);
    }

    .chat-suggestions p {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .chip {
      padding: var(--space-2) var(--space-3);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-full);
      color: var(--color-primary-700);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
    }

    .chip:hover {
      background: var(--color-primary-100);
      transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ai-chat-container {
        height: 400px;
      }

      .menu-items-grid {
        grid-template-columns: 1fr;
      }

      .message {
        max-width: 90%;
      }

      .input-group {
        flex-direction: column;
        align-items: stretch;
      }

      .send-btn {
        align-self: flex-end;
        width: auto;
      }

      .suggestion-chips {
        flex-direction: column;
      }

      .chip {
        text-align: center;
      }
    }
  `]
})
export class AIChatComponent implements OnInit {
  private aiService = inject(AIService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;

  ngOnInit() {
    // Add welcome message
    this.addMessage('ai', 'Hallo! Ich helfe Ihnen gerne bei der Suche nach passenden Gerichten. Was darf es sein?');
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const userMessage = this.currentMessage.trim();
    this.addMessage('user', userMessage);
    this.currentMessage = '';
    this.isLoading = true;

    const user = this.authService.currentUserSubject.value;
    this.aiService.chat(userMessage, {
      tenantId: user?.tenant_id
    }).subscribe({
      next: (response) => {
        this.handleResponse(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('AI chat error:', error);
        this.toastService.error('AI-Fehler', 'Fehler bei der Kommunikation mit dem AI-Assistenten');
        this.addMessage('ai', 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.');
        this.isLoading = false;
      }
    });
  }

  private handleResponse(response: ChatResponse) {
    if (response.intent === 'budget_menu_search' && response.items) {
      // Verwende die vom Server generierte Nachricht oder erstelle eine eigene
      let text = response.message || `Hier sind ${response.items.length} Vorschläge für Ihr Budget:`;

      // Füge Filter-Informationen hinzu, falls verfügbar
      if (response.appliedFilters) {
        const filters = [];
        if (response.appliedFilters.dietaryRestrictions?.vegetarian) filters.push('vegetarisch');
        if (response.appliedFilters.dietaryRestrictions?.vegan) filters.push('vegan');
        if (response.appliedFilters.preparationTime?.preferredTime === 'fast') filters.push('schnell');
        if (response.appliedFilters.location?.postalCode) filters.push(`PLZ ${response.appliedFilters.location.postalCode}`);

        if (filters.length > 0) {
          text += ` (gefiltert nach: ${filters.join(', ')})`;
        }
      }

      this.addMessage('ai', text, response.items);
    } else if (response.intent === 'order_status') {
      if (response.orders && response.orders.length > 0) {
        let text = `Hier sind Ihre letzten ${response.orders.length} Bestellungen:`;
        this.addMessage('ai', text);
        // Hier könnten Sie die Bestellungen detailliert anzeigen
      } else if (response.text) {
        this.addMessage('ai', response.text); // "Bitte melden Sie sich an..."
      } else {
        this.addMessage('ai', 'Sie haben noch keine Bestellungen aufgegeben.');
      }
    } else if (response.intent === 'restaurant_info' && response.restaurants) {
      let text = response.message || (response.restaurants.length > 0
        ? `Hier sind ${response.restaurants.length} Restaurants passend zu Ihrer Suche:`
        : 'Keine Restaurants gefunden. Versuchen Sie andere Suchbegriffe.');
      this.addMessage('ai', text);
    } else if (response.intent === 'menu_details' && response.menuItems) {
      let text = response.message || (response.menuItems.length > 0
        ? `Hier sind ${response.menuItems.length} Menü-Artikel:`
        : 'Keine passenden Menü-Artikel gefunden.');
      this.addMessage('ai', text);
    } else if (response.intent === 'faq' && response.faqs) {
      let text = response.faqs.length > 0
        ? `Hier sind ${response.faqs.length} Antworten auf Ihre Frage:`
        : 'Ich konnte keine passenden Antworten finden.';
      this.addMessage('ai', text);
    } else if (response.intent === 'review_info' && response.reviews) {
      let text = response.reviews.length > 0
        ? `Hier sind ${response.reviews.length} Bewertungen:`
        : 'Keine Bewertungen gefunden.';
      this.addMessage('ai', text);
    } else if (response.intent === 'loyalty_status' && response.loyalty) {
      let text = response.loyalty.length > 0
        ? `Ihr Treuepunkte-Status:`
        : 'Sie haben noch keine Treuepunkte gesammelt.';
      this.addMessage('ai', text);
    } else if (response.intent === 'payment_history' && response.payments) {
      let text = response.payments.length > 0
        ? `Ihre letzten ${response.payments.length} Zahlungen:`
        : 'Keine Zahlungshistorie gefunden.';
      this.addMessage('ai', text);
    } else if (response.intent === 'driver_info' && response.drivers) {
      let text = response.drivers.length > 0
        ? `Informationen zu ${response.drivers.length} Fahrern:`
        : 'Keine Fahrer-Informationen gefunden.';
      this.addMessage('ai', text);
    } else if (response.intent === 'payout_info' && response.payouts) {
      let text = response.payouts.length > 0
        ? `Ihre letzten ${response.payouts.length} Auszahlungen:`
        : 'Keine Auszahlungen gefunden.';
      this.addMessage('ai', text);
    } else if (response.intent === 'smalltalk' && response.text) {
      this.addMessage('ai', response.text);
    } else if (response.intent === 'unknown' && response.text) {
      this.addMessage('ai', response.text);
    } else {
      this.addMessage('ai', 'Ich konnte Ihre Anfrage nicht verstehen. Versuchen Sie es mit einer konkreten Frage zu Menüvorschlägen oder Bestellungen.');
    }
  }

  private addMessage(type: 'user' | 'ai', content: string, items?: BudgetMenuItem[]) {
    this.messages.push({
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      items
    });

    // Scroll to bottom after a short delay to allow DOM update
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  setMessage(message: string) {
    this.currentMessage = message;
  }

  navigateToRestaurant(restaurantId: string) {
    this.router.navigate(['/restaurant', restaurantId]);
  }
}
