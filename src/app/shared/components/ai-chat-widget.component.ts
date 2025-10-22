import { Component, inject, OnInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
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
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Chat Widget Button (unten rechts) -->
    <div class="chat-widget-button" [class.hidden]="isOpen" (click)="toggleChat()">
      <div class="chat-icon">
        <i class="fa-solid fa-message"></i>
        <div class="notification-dot" *ngIf="hasNewMessage"></div>
      </div>
      <div class="chat-tooltip">
        <span>AI-Assistent</span>
      </div>
    </div>

    <!-- Chat Widget Window -->
    <div class="chat-widget-window" [class.open]="isOpen" [class.minimized]="isMinimized" [style.height.px]="chatWindowHeight">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-title">
          <i class="fa-solid fa-message"></i>
          <span>AI-Assistent</span>
        </div>
        <div class="chat-controls">
          <button class="control-btn minimize-btn" (click)="toggleMinimize()" [title]="isMinimized ? 'Maximieren' : 'Minimieren'">
            <i class="fa-solid" [class]="isMinimized ? 'fa-plus' : 'fa-minus'"></i>
          </button>
          <button class="control-btn close-btn" (click)="closeChat()" title="Schließen">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Chat Content (nur wenn nicht minimiert) -->
      <div class="chat-content" *ngIf="!isMinimized">
        <div class="chat-messages" #messagesContainer>
          <div class="welcome-message" *ngIf="messages.length === 0">
            <div class="message ai-message">
              <div class="message-content">
                <div class="message-text">
                  👋 Hallo! Ich helfe Ihnen gerne bei der Suche nach passenden Gerichten und Antworten zu Ihren Fragen.
                </div>
              </div>
            </div>
          </div>

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

        <!-- Input Area -->
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

        <!-- Suggestions -->
        <div class="chat-suggestions" *ngIf="messages.length === 0 && !isLoading">
          <div class="suggestion-chips">
            <button class="chip" (click)="setMessage('Was kann ich für 15€ bestellen?')">15€ Budget</button>
            <button class="chip" (click)="setMessage('Wo ist meine Bestellung?')">Meine Bestellungen</button>
            <button class="chip" (click)="setMessage('Wie viele Treuepunkte habe ich?')">Treuepunkte</button>
            <button class="chip" (click)="setMessage('Was sagen die Bewertungen?')">Bewertungen</button>
            <button class="chip" (click)="setMessage('Zeig mir italienische Restaurants')">Italienisch</button>
            <button class="chip" (click)="setMessage('Was vegetarische Optionen gibt es?')">Vegetarisch</button>
            <button class="chip" (click)="setMessage('Meine Zahlungshistorie')">Zahlungen</button>
            <button class="chip" (click)="setMessage('Wer ist mein Fahrer?')">Fahrer-Info</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Chat Widget Button */
    .chat-widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: var(--gradient-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 30%, transparent);
      transition: all 0.3s ease;
      z-index: 1000;
      border: none;
      opacity: 1;
      transform: scale(1);
    }

    .chat-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px color-mix(in oklab, var(--color-primary) 40%, transparent);
    }

    .chat-widget-button.hidden {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    .chat-icon {
      position: relative;
      color: white;
      font-size: 24px;
    }

    .notification-dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    .chat-tooltip {
      position: absolute;
      right: 70px;
      bottom: 15px;
      background: var(--color-text);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease;
      pointer-events: none;
    }

    .chat-tooltip::after {
      content: '';
      position: absolute;
      right: -6px;
      bottom: 15px;
      width: 0;
      height: 0;
      border-left: 6px solid var(--color-text);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }

    .chat-widget-button:hover .chat-tooltip {
      opacity: 1;
      transform: translateX(0);
    }

    /* Chat Widget Window */
    .chat-widget-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 999;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .chat-widget-window.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .chat-widget-window.minimized {
      height: 60px !important;
    }

    /* Header */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--gradient-primary);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .chat-title i {
      font-size: 18px;
    }

    .chat-controls {
      display: flex;
      gap: 8px;
    }

    .control-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.4);
    }

    /* Chat Content */
    .chat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .welcome-message {
      margin-bottom: 16px;
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
      padding: 12px 16px;
      border-radius: 12px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
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
      font-size: 14px;
    }

    .message-timestamp {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .loading-message .message-content {
      padding: 8px 16px;
    }

    .loading-dots {
      display: flex;
      gap: 4px;
    }

    .loading-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6b7280;
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
      grid-template-columns: 1fr;
      gap: 8px;
      margin-top: 12px;
    }

    .menu-item-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .menu-item-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .item-header h4 {
      margin: 0;
      color: var(--color-heading);
      font-size: 14px;
      font-weight: 600;
    }

    .price {
      font-weight: 700;
      color: var(--color-success);
      font-size: 14px;
    }

    .restaurant-name {
      color: var(--color-primary);
      font-weight: 500;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .menu-item-card .btn-primary {
      width: 100%;
      padding: 6px 12px;
      font-size: 12px;
    }

    .chat-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .input-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .input-group input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
    }

    .input-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .input-group input:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    .send-btn {
      padding: 10px;
      background: var(--gradient-primary);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chat-suggestions {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }

    .chip {
      padding: 5px 10px;
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: 16px;
      color: var(--color-primary-700);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .chip:hover {
      background: var(--color-primary-100);
      transform: translateY(-1px);
    }

    /* Mobile Keyboard Handling */
    @supports (height: 100dvh) {
      .chat-widget-window {
        /* Use dynamic viewport height on supported browsers */
        max-height: calc(100dvh - 140px);
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .chat-widget-window {
        width: calc(100vw - 40px);
        max-height: calc(100vh - 140px);
        bottom: 80px;
        right: 20px;
        /* Ensure smooth transitions */
        transition: height 0.2s ease, transform 0.3s ease, opacity 0.3s ease;
      }

      .chat-widget-button {
        bottom: 20px;
        right: 20px;
      }

      .menu-items-grid {
        grid-template-columns: 1fr;
      }

      /* Mobile input focus handling */
      .chat-input-container {
        position: relative;
        z-index: 10;
      }

      .input-group input {
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }

    /* iOS Safari specific fixes */
    @media screen and (-webkit-min-device-pixel-ratio: 2) {
      .chat-widget-window {
        /* Prevent layout shifts on iOS */
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
    }

    /* Additional mobile optimizations */
    @media (max-width: 768px) {
      .chat-widget-window {
        /* Smooth transitions for mobile */
        transition: height 0.2s ease, bottom 0.2s ease, transform 0.3s ease, opacity 0.3s ease;
        /* Prevent text selection issues */
        -webkit-user-select: none;
        user-select: none;
        /* Better touch handling */
        touch-action: manipulation;
      }
      
      .chat-widget-window.open {
        /* Ensure proper positioning when open */
        position: fixed;
      }
    }
  `]
})
export class AIChatWidgetComponent implements OnInit, OnDestroy {
  private aiService = inject(AIService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Mobile keyboard handling
  chatWindowHeight = 600;
  private visualViewportListener?: () => void;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  isOpen = false;
  isMinimized = false;
  hasNewMessage = false;

  ngOnInit() {
    // Optional: Auto-show welcome message after delay
    setTimeout(() => {
      if (this.messages.length === 0) {
        this.hasNewMessage = true;
      }
    }, 3000);
    
    this.setupMobileKeyboardHandling();
  }

  ngOnDestroy() {
    this.cleanupMobileKeyboardHandling();
  }

  private setupMobileKeyboardHandling() {
    // Use visualViewport API for modern browsers
    if (window.visualViewport) {
      this.visualViewportListener = () => {
        this.updateChatWindowHeight();
      };
      
      window.visualViewport.addEventListener('resize', this.visualViewportListener);
      this.updateChatWindowHeight();
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', () => {
        this.updateChatWindowHeight();
      });
    }
  }

  private cleanupMobileKeyboardHandling() {
    if (window.visualViewport && this.visualViewportListener) {
      window.visualViewport.removeEventListener('resize', this.visualViewportListener);
    }
  }

  private updateChatWindowHeight() {
    if (window.visualViewport) {
      // Use visualViewport height (excludes keyboard)
      const viewportHeight = window.visualViewport.height;
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // On mobile, adjust height based on viewport
        this.chatWindowHeight = Math.min(viewportHeight - 100, 600);
        
        // Adjust bottom position when keyboard is open
        const chatWindow = document.querySelector('.chat-widget-window') as HTMLElement;
        if (chatWindow) {
          if (viewportHeight < window.innerHeight * 0.7) {
            // Keyboard is likely open, move chat window up
            chatWindow.style.bottom = '20px';
            chatWindow.style.top = 'auto';
          } else {
            // Keyboard is closed, restore normal position
            chatWindow.style.bottom = '90px';
            chatWindow.style.top = 'auto';
          }
        }
      } else {
        // Desktop: use fixed height
        this.chatWindowHeight = 600;
      }
    } else {
      // Fallback: use window height
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        this.chatWindowHeight = Math.min(window.innerHeight - 100, 600);
      } else {
        this.chatWindowHeight = 600;
      }
    }
  }

  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Scroll input into view when keyboard appears
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.hasNewMessage = false;
      this.isMinimized = false;
    }
  }

  closeChat() {
    this.isOpen = false;
    this.isMinimized = false;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
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
    const displayMessage = response.message || response.text || '';

    // Debug-Logging für Entwickler
    if (response.debug) {
      console.log('🔧 AI Debug Info:', {
        intent: response.intent,
        totalFound: response.totalFound,
        restaurantStats: response.debug.restaurantStats,
        searchParams: response.debug.searchParams,
        sampleFoundItems: response.debug.foundItems?.slice(0, 5)
      });
    }

    switch (response.intent) {
      case 'budget_menu_search':
        if (response.items && response.items.length > 0) {
          this.addMessage('ai', displayMessage, response.items);
        } else {
          this.addMessage('ai', 'Keine Gerichte in diesem Preisbereich gefunden. Versuchen Sie einen höheren Betrag.');
        }
        break;

      case 'order_status':
        if (response.orders && response.orders.length > 0) {
          let orderText = displayMessage + '\n\n';
          response.orders.forEach((order, index) => {
            orderText += `${index + 1}. ${order.restaurant_name}\n`;
            orderText += `   Status: ${this.formatOrderStatus(order.status)}\n`;
            orderText += `   Bestellt: ${order.created_at}\n`;
            orderText += `   Betrag: ${order.total_price}€\n`;
            orderText += `   Artikel: ${order.items_count}\n\n`;
          });
          this.addMessage('ai', orderText);
        } else {
          this.addMessage('ai', displayMessage);
        }
        break;

      case 'restaurant_info':
        if (response.restaurants && response.restaurants.length > 0) {
          let restaurantText = displayMessage + '\n\n';
          response.restaurants.forEach((restaurant, index) => {
            restaurantText += `${index + 1}. ${restaurant.name}\n`;
            restaurantText += `   Küche: ${restaurant.cuisine_type}\n`;
            restaurantText += `   Stadt: ${restaurant.city}\n`;
            restaurantText += `   Bewertung: ⭐ ${restaurant.rating}\n`;
            let deliveryText = 'N/A';
            if (restaurant.delivery_fee && typeof restaurant.delivery_fee === 'number' && !isNaN(restaurant.delivery_fee)) {
              deliveryText = restaurant.delivery_fee.toFixed(2);
            } else if (restaurant.delivery_fee && typeof restaurant.delivery_fee === 'string') {
              deliveryText = restaurant.delivery_fee;
            }
            restaurantText += `   Lieferkosten: ${deliveryText}€\n\n`;
          });
          this.addMessage('ai', restaurantText);
        } else {
          this.addMessage('ai', 'Keine Restaurants gefunden. Versuchen Sie andere Suchbegriffe.');
        }
        break;

      case 'drinks_menu':
        if (response.drinks && response.drinks.length > 0) {
          let drinksText = displayMessage + '\n\n';
          response.drinks.forEach((drink, index) => {
            drinksText += `${index + 1}. ${drink.name}\n`;
            let priceText = 'N/A';
            if (drink.price_eur && typeof drink.price_eur === 'number' && !isNaN(drink.price_eur)) {
              priceText = drink.price_eur.toFixed(2);
            } else if (drink.price_eur && typeof drink.price_eur === 'string') {
              // Fallback für String-Preise
              priceText = drink.price_eur;
            }
            drinksText += `   Preis: ${priceText}€\n`;
            drinksText += `   Kategorie: ${drink.category}\n`;
            if (drink.description) {
              drinksText += `   Beschreibung: ${drink.description}\n`;
            }
            if (drink.is_vegetarian) drinksText += `   🥕 Vegetarisch\n`;
            if (drink.is_vegan) drinksText += `   🌱 Vegan\n`;
            drinksText += '\n';
          });
          this.addMessage('ai', drinksText);
        } else {
          this.addMessage('ai', 'Keine Getränke gefunden. Versuchen Sie andere Suchbegriffe.');
        }
        break;

      case 'product_search':
        if (response.products && response.products.length > 0) {
          let productText = displayMessage + '\n\n';
          response.products.forEach((product, index) => {
            let priceText = 'N/A';
            if (product.price_eur && typeof product.price_eur === 'number' && !isNaN(product.price_eur)) {
              priceText = product.price_eur.toFixed(2);
            } else if (product.price_eur && typeof product.price_eur === 'string') {
              priceText = product.price_eur;
            }

            productText += `${index + 1}. ${product.name}\n`;
            productText += `   Preis: ${priceText}€\n`;
            productText += `   Restaurant: ${product.restaurant_name || 'Unbekannt'}\n`;
            if (product.category) {
              productText += `   Kategorie: ${product.category}\n`;
            }
            if (product.description) {
              productText += `   Beschreibung: ${product.description}\n`;
            }
            if (product.is_vegetarian) productText += `   🥕 Vegetarisch\n`;
            if (product.is_vegan) productText += `   🌱 Vegan\n`;
            productText += '\n';
          });
          this.addMessage('ai', productText);
        } else {
          this.addMessage('ai', 'Keine Produkte gefunden. Versuchen Sie andere Suchbegriffe.');
        }
        break;

      case 'menu_details':
        if (response.menuItems && response.menuItems.length > 0) {
          let menuText = displayMessage + '\n\n';
          response.menuItems.forEach((item, index) => {
            menuText += `${index + 1}. ${item.name}\n`;
            let itemPriceText = 'N/A';
            if (item.price_eur && typeof item.price_eur === 'number' && !isNaN(item.price_eur)) {
              itemPriceText = item.price_eur.toFixed(2);
            } else if (item.price_eur && typeof item.price_eur === 'string') {
              itemPriceText = item.price_eur;
            }
            menuText += `   Preis: ${itemPriceText}€\n`;
            menuText += `   Restaurant: ${item.restaurant_name || 'Unbekannt'}\n`;
            menuText += `   Kategorie: ${item.category}\n`;
            if (item.description) {
              menuText += `   Beschreibung: ${item.description}\n`;
            }
            if (item.is_vegetarian) menuText += `   🥕 Vegetarisch\n`;
            if (item.is_vegan) menuText += `   🌱 Vegan\n`;
            menuText += '\n';
          });
          this.addMessage('ai', menuText);
        } else {
          this.addMessage('ai', 'Keine passenden Menü-Artikel gefunden.');
        }
        break;

      case 'faq':
        if (response.faqs && response.faqs.length > 0) {
          let faqText = displayMessage + '\n\n';
          response.faqs.forEach((faq, index) => {
            faqText += `${index + 1}. ${faq.question}\n`;
            faqText += `   ${faq.answer}\n\n`;
          });
          this.addMessage('ai', faqText);
        } else {
          this.addMessage('ai', 'Ich konnte keine passenden Antworten finden.');
        }
        break;

      case 'review_info':
        if (response.reviews && response.reviews.length > 0) {
          let reviewText = displayMessage + '\n\n';
          response.reviews.forEach((review, index) => {
            const target = review.restaurant_name || review.driver_name || 'Unbekannt';
            reviewText += `${index + 1}. ${target} - ⭐ ${review.rating}/5\n`;
            if (review.comment) {
              reviewText += `   "${review.comment}"\n`;
            }
            if (review.food_quality) reviewText += `   Essen: ${review.food_quality}/5\n`;
            if (review.delivery_time) reviewText += `   Lieferzeit: ${review.delivery_time}/5\n`;
            if (review.service) reviewText += `   Service: ${review.service}/5\n`;
            reviewText += `   ${review.created_at}\n\n`;
          });
          this.addMessage('ai', reviewText);
        } else {
          this.addMessage('ai', 'Keine Bewertungen gefunden.');
        }
        break;

      case 'loyalty_status':
        if (response.loyalty && response.loyalty.length > 0) {
          let loyaltyText = displayMessage + '\n\n';
          response.loyalty.forEach((loyalty, index) => {
            loyaltyText += `${index + 1}. ${loyalty.restaurant_name}\n`;
            loyaltyText += `   Aktuelle Stamps: ${loyalty.current_stamps}\n`;
            loyaltyText += `   Gesamt gesammelt: ${loyalty.lifetime_earned}\n`;
            loyaltyText += `   Eingelöst: ${loyalty.lifetime_redeemed}\n`;
            loyaltyText += `   Für Einlösung benötigt: ${loyalty.stamps_required}\n`;
            loyaltyText += `   Rabatt: ${loyalty.discount_percent}%\n`;
            loyaltyText += `   Einlösbar: ${loyalty.can_redeem ? 'Ja' : 'Nein'}\n\n`;
          });
          this.addMessage('ai', loyaltyText);
        } else {
          this.addMessage('ai', 'Sie haben noch keine Treuepunkte gesammelt.');
        }
        break;

      case 'payment_history':
        if (response.payments && response.payments.length > 0) {
          let paymentText = displayMessage + '\n\n';
          response.payments.forEach((payment, index) => {
            paymentText += `${index + 1}. ${payment.restaurant_name || 'Unbekannt'}\n`;
            paymentText += `   Betrag: ${payment.amount}€\n`;
            paymentText += `   Status: ${this.formatPaymentStatus(payment.status)}\n`;
            paymentText += `   Anbieter: ${payment.provider}\n`;
            paymentText += `   Datum: ${payment.created_at}\n\n`;
          });
          this.addMessage('ai', paymentText);
        } else {
          this.addMessage('ai', 'Keine Zahlungshistorie gefunden.');
        }
        break;

      case 'driver_info':
        if (response.drivers && response.drivers.length > 0) {
          let driverText = displayMessage + '\n\n';
          response.drivers.forEach((driver, index) => {
            driverText += `${index + 1}. ${driver.name}\n`;
            driverText += `   Bewertung: ⭐ ${driver.rating}\n`;
            driverText += `   Lieferungen: ${driver.total_deliveries}\n`;
            driverText += `   Status: ${this.formatDriverStatus(driver.status)}\n`;
            if (driver.vehicle_type) {
              driverText += `   Fahrzeug: ${driver.vehicle_type}\n`;
            }
            driverText += '\n';
          });
          this.addMessage('ai', driverText);
        } else {
          this.addMessage('ai', 'Keine Fahrer-Informationen gefunden.');
        }
        break;

      case 'payout_info':
        if (response.payouts && response.payouts.length > 0) {
          let payoutText = displayMessage + '\n\n';
          response.payouts.forEach((payout, index) => {
            payoutText += `${index + 1}. ${payout.amount}€ - ${this.formatPayoutStatus(payout.status)}\n`;
            payoutText += `   Zeitraum: ${payout.period_start} bis ${payout.period_end}\n`;
            if (payout.description) {
              payoutText += `   Beschreibung: ${payout.description}\n`;
            }
            payoutText += `   Erstellt: ${payout.created_at}\n\n`;
          });
          this.addMessage('ai', payoutText);
        } else {
          this.addMessage('ai', 'Keine Auszahlungen gefunden.');
        }
        break;

      case 'support_escalation':
        // Neue Behandlung: Zeige Hinweis auf "Probleme melden" statt automatische Escalation
        if ((response as any).action === 'redirect_to_report') {
          let message = response.message || 'Um eine Reklamation einzureichen, gehen Sie bitte zu Ihren Bestellungen.';
          
          // Füge zusätzliche Informationen hinzu, falls verfügbar
          if ((response as any).helpText) {
            message += '\n\n' + (response as any).helpText;
          }
          
          this.addMessage('ai', message);
          
          // Zeige zusätzliche Aktionen als Buttons oder Links
          if ((response as any).suggestedActions && (response as any).suggestedActions.length > 0) {
            setTimeout(() => {
              this.showSuggestedActions((response as any).suggestedActions);
            }, 1000);
          }
        } else {
          // Fallback für alte Antworten
          this.addMessage('ai', response.text || 'Ihr Anliegen wurde an unseren Support weitergeleitet.');
        }
        break;

      case 'smalltalk':
        this.addMessage('ai', response.text || displayMessage);
        break;

      default:
        // Prüfe auf action-basierte Antworten (z.B. von Smart Support)
        if ((response as any).action === 'redirect_to_report') {
          let message = response.message || 'Um eine Reklamation einzureichen, gehen Sie bitte zu Ihren Bestellungen.';
          
          if ((response as any).helpText) {
            message += '\n\n' + (response as any).helpText;
          }
          
          this.addMessage('ai', message);
          
          if ((response as any).suggestedActions && (response as any).suggestedActions.length > 0) {
            setTimeout(() => {
              this.showSuggestedActions((response as any).suggestedActions);
            }, 1000);
          }
        } else if ((response as any).action === 'ai_with_redirect') {
          let message = response.message || 'Ich kann Ihnen dabei helfen.';
          
          if ((response as any).redirectOption && (response as any).redirectOption.available) {
            message += '\n\n' + (response as any).redirectOption.message;
          }
          
          this.addMessage('ai', message);
          
          if ((response as any).suggestedActions && (response as any).suggestedActions.length > 0) {
            setTimeout(() => {
              this.showSuggestedActions((response as any).suggestedActions);
            }, 1000);
          }
        } else {
          this.addMessage('ai', response.text || 'Das habe ich nicht verstanden. Versuchen Sie Fragen wie "Was kann ich für 15€ bestellen?", "Wo ist meine Bestellung?" oder "Zeig mir italienische Restaurants".');
        }
    }
  }

  private formatOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'preparing': 'Wird zubereitet',
      'ready': 'Bereit zur Abholung',
      'picked_up': 'Unterwegs',
      'delivered': 'Geliefert',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  }

  private formatPaymentStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'paid': 'Bezahlt',
      'failed': 'Fehlgeschlagen',
      'refunded': 'Rückerstattet'
    };
    return statusMap[status] || status;
  }

  private formatDriverStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Aktiv',
      'inactive': 'Inaktiv',
      'busy': 'Beschäftigt',
      'offline': 'Offline'
    };
    return statusMap[status] || status;
  }

  private formatPayoutStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'processing': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'failed': 'Fehlgeschlagen',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  }

  private addMessage(type: 'user' | 'ai', content: string, items?: BudgetMenuItem[]) {
    this.messages.push({
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      items
    });

    // Scroll to bottom after a short delay
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  private showSuggestedActions(actions: string[]) {
    // Füge eine Nachricht mit vorgeschlagenen Aktionen hinzu
    let actionMessage = '\n\n**Vorgeschlagene Aktionen:**\n';
    actions.forEach((action, index) => {
      actionMessage += `${index + 1}. ${action}\n`;
    });
    
    // Füge die Aktionen als separate Nachricht hinzu
    this.addMessage('ai', actionMessage);
  }

  setMessage(message: string) {
    this.currentMessage = message;
    this.sendMessage();
  }

  navigateToRestaurant(restaurantId: string) {
    this.closeChat();
    this.router.navigate(['/restaurant', restaurantId]);
  }
}
