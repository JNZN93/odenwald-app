import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface WholesalerData {
  id: number;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact_info: {
    phone: string;
    email?: string;
    website?: string;
  };
  images: {
    logo?: string;
    banner?: string;
    gallery: string[];
  };
  is_active: boolean;
  is_verified: boolean;
  registration_status: string;
  owner_name?: string;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

interface WholesalerProduct {
  id: number;
  wholesaler_id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
  wholesale_price?: number;
  min_order_quantity: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  images: string[];
}

interface WholesalerOrder {
  id: number;
  wholesaler_id: number;
  wholesaler_name: string;
  restaurant_id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface Supplier {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  rating: number;
  deliveryTime: string;
  minOrderValue: number;
  isOpen: boolean;
  specialOffer?: string;
  wholesalerData: WholesalerData;
  products?: WholesalerProduct[];
}

interface CartItem {
  product: WholesalerProduct;
  wholesaler: WholesalerData;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  wholesaler_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address?: any;
  delivery_date?: string;
  notes?: string;
}

@Component({
  selector: 'app-restaurant-manager-wholesale',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="wholesale-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-text">
            <h1>Großhandel Einkauf</h1>
            <p>Frische Zutaten und Waren für Ihr Restaurant</p>
          </div>
          <div class="header-stats">
            <div class="stat">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <rect x="7" y="7" width="3" height="3"/>
                  <rect x="14" y="7" width="3" height="3"/>
                  <rect x="7" y="14" width="3" height="3"/>
                  <rect x="14" y="14" width="3" height="3"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ suppliers.length }}</span>
                <span class="stat-label">Großhändler</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ myOrdersCount }}</span>
                <span class="stat-label">Meine Bestellungen</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="stat-content">
                <span class="stat-number">€{{ (totalOrderValue || 0).toFixed(2) }}</span>
                <span class="stat-label">Bestellwert</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-section">
        <div class="tabs">
          <button
            class="tab-button"
            [class.active]="activeTab === 'browse'"
            (click)="setActiveTab('browse')">
            <div class="tab-content">
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="3"/>
                <rect x="14" y="7" width="3" height="3"/>
                <rect x="7" y="14" width="3" height="3"/>
                <rect x="14" y="14" width="3" height="3"/>
              </svg>
              <span class="tab-text-full">Großhändler durchsuchen</span>
              <span class="tab-text-mobile">Durchsuchen</span>
            </div>
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'orders'"
            (click)="setActiveTab('orders')">
            <div class="tab-content">
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
              <span class="tab-text-full">Meine Bestellungen</span>
              <span class="tab-text-mobile">Bestellungen</span>
              <span *ngIf="pendingOrdersCount > 0" class="tab-badge">{{ pendingOrdersCount }}</span>
            </div>
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'invoices'"
            (click)="setActiveTab('invoices')">
            <div class="tab-content">
              <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              <span class="tab-text-full">Rechnungen</span>
              <span class="tab-text-mobile">Rechnungen</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">

        <!-- Browse Tab -->
        <div *ngIf="activeTab === 'browse'">
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
            <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>Großhändler werden geladen...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Fehler beim Laden</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" (click)="loadWholesalers()">Erneut versuchen</button>
      </div>

      <!-- Suppliers Grid -->
      <div class="suppliers-section" *ngIf="!loading && !error">
        <h2 class="section-title">Großhändler</h2>
        <div class="suppliers-grid" *ngIf="suppliers.length > 0">
          <div class="supplier-card" *ngFor="let supplier of suppliers">
            <div class="supplier-header">
              <div class="supplier-logo">
                <div class="supplier-icon" [innerHTML]="supplier.logo"></div>
              </div>
              <div class="supplier-info">
                <h3>{{ supplier.name }}</h3>
                <div class="supplier-meta">
                  <span class="category">{{ supplier.category }}</span>
                  <div class="rating">
                    <span class="stars">★★★★☆</span>
                    <span class="rating-value">{{ supplier.rating.toFixed(1) }}</span>
                  </div>
                </div>
              </div>
              <div class="status-badge" [class.open]="supplier.isOpen" [class.closed]="!supplier.isOpen">
                {{ supplier.isOpen ? 'Geöffnet' : 'Geschlossen' }}
              </div>
            </div>

            <div class="supplier-content">
              <p class="description">{{ supplier.description }}</p>

              <div class="supplier-details">
                <div class="detail-item">
                  <span class="detail-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </span>
                  <span class="detail-text">{{ supplier.deliveryTime }} Lieferung</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </span>
                  <span class="detail-text">Min. €{{ supplier.minOrderValue }}</span>
                </div>
              </div>

              <div class="special-offer" *ngIf="supplier.specialOffer">
                <span class="offer-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </span>
                <span class="offer-text">{{ supplier.specialOffer }}</span>
              </div>
            </div>

            <div class="supplier-actions">
              <button class="btn-primary" (click)="viewProducts(supplier)" [disabled]="!supplier.isOpen">
                <span>Produkte ansehen</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="suppliers.length === 0">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3h18v18H3z"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
          </div>
          <h3>Keine Großhändler verfügbar</h3>
          <p>Momentan sind keine Großhändler für den Einkauf verfügbar.</p>
        </div>
      </div>


      <!-- Info Section -->
      <div class="info-section">
        <div class="info-card">
          <div class="info-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <h3>Wie funktioniert der Einkauf?</h3>
          <ul>
            <li>Großhändler auswählen</li>
            <li>Katalog durchsuchen</li>
            <li>Warenkorb füllen</li>
            <li>Bestellung abschließen</li>
          </ul>
        </div>
        <div class="info-card">
          <div class="info-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h3>Lieferzeiten & Konditionen</h3>
          <ul>
            <li>Lieferung in 24h</li>
            <li>Mindestbestellung €50</li>
            <li>Kostenlos ab €200</li>
            <li>Qualitätsgarantie</li>
          </ul>
        </div>
      </div>
        </div>

        <!-- Orders Tab -->
        <div *ngIf="activeTab === 'orders'">
          <div class="orders-section">
            <div class="orders-header">
              <h2>Meine Bestellungen</h2>
              <p>Verfolgen Sie den Status Ihrer Großhandelsbestellungen</p>
            </div>

            <!-- Orders Loading -->
            <div *ngIf="ordersLoading" class="loading-container">
              <div class="loading-spinner">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
                  <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p>Bestellungen werden geladen...</p>
            </div>

            <!-- Orders List -->
            <div *ngIf="!ordersLoading && myOrders.length > 0" class="orders-list">
              <div *ngFor="let order of myOrders" class="order-card">
                <div class="order-header">
                  <div class="order-info">
                    <h3>{{ order.wholesaler_name }}</h3>
                    <div class="order-meta">
                      <span class="order-date">{{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                      <span class="order-items-count">{{ order.items ? order.items.length : 0 }} Artikel</span>
                    </div>
                  </div>
                  <div class="order-actions">
                    <div class="order-status" [class]="'status-' + order.status">
                      {{ getStatusText(order.status) }}
                    </div>
                    <button class="btn-primary-outline" (click)="showOrderDetails(order)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      Details
                    </button>
                  </div>
                </div>

                <div class="order-summary">
                  <div class="summary-row">
                    <span>Gesamt:</span>
                    <span class="total-amount">€{{ (order.total_amount || 0).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty Orders State -->
            <div *ngIf="!ordersLoading && myOrders.length === 0" class="empty-orders">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <rect x="7" y="7" width="3" height="3"/>
                  <rect x="14" y="7" width="3" height="3"/>
                  <rect x="7" y="14" width="3" height="3"/>
                  <rect x="14" y="14" width="3" height="3"/>
                </svg>
              </div>
              <h3>Noch keine Bestellungen</h3>
              <p>Sie haben noch keine Bestellungen bei Großhändlern aufgegeben.</p>
              <button class="btn-primary" (click)="setActiveTab('browse')">
                Großhändler durchsuchen
              </button>
            </div>
          </div>

          <!-- Order Details Modal -->
          <div class="modal-overlay" *ngIf="showOrderModal" (click)="closeOrderModal()">
            <div class="modal-content order-detail-modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div class="modal-title-section">
                  <h2>Bestellung Details</h2>
                  <div class="order-meta-header">
                    <span class="wholesaler-name">{{ selectedOrder?.wholesaler_name }}</span>
                    <span class="order-date">{{ selectedOrder?.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                  </div>
                </div>
                <button class="close-btn" (click)="closeOrderModal()">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div class="modal-body" *ngIf="selectedOrder">
                <div class="order-detail-content">
                  <!-- Order Status -->
                  <div class="order-status-section">
                    <div class="status-badge-large" [class]="'status-' + selectedOrder.status">
                      {{ getStatusText(selectedOrder.status) }}
                    </div>
                    <div class="order-total">
                      <span class="total-label">Gesamtbestellung:</span>
                      <span class="total-amount">€{{ (selectedOrder.total_amount || 0).toFixed(2) }}</span>
                    </div>
                  </div>

                  <!-- Order Items -->
                  <div class="order-items-section">
                    <h3>Artikel in dieser Bestellung</h3>
                    <div class="items-list">
                      <div *ngFor="let item of selectedOrder.items; let i = index" class="item-card">
                        <div class="item-main">
                          <div class="item-image">
                            <div class="image-placeholder" *ngIf="!item.product_images || item.product_images.length === 0">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                              </svg>
                            </div>
                            <img *ngIf="item.product_images && item.product_images.length > 0"
                                 [src]="item.product_images[0]"
                                 [alt]="item.product_name"
                                 class="product-image"
                                 (error)="onImageError($event)" />
                          </div>

                          <div class="item-info">
                            <h4 class="item-name">{{ item.product_name }}</h4>
                            <div class="item-details">
                              <span class="quantity">{{ item.quantity }} × €{{ (item.unit_price || 0).toFixed(2) }}</span>
                              <span class="unit" *ngIf="item.product_unit">pro {{ item.product_unit }}</span>
                            </div>
                            <div class="item-category" *ngIf="item.product_category">
                              <span class="category-tag">{{ item.product_category }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="item-price">
                          <span class="item-total">€{{ (item.total_price || 0).toFixed(2) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Order Summary -->
                  <div class="order-summary-section">
                    <h3>Bestellübersicht</h3>
                    <div class="summary-details">
                      <div class="summary-row">
                        <span>Anzahl Artikel:</span>
                        <span>{{ selectedOrder.items?.length || 0 }}</span>
                      </div>
                      <div class="summary-row total-row">
                        <span>Gesamtpreis:</span>
                        <span class="total-price">€{{ (selectedOrder.total_amount || 0).toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Additional Information -->
                  <div class="additional-info-section" *ngIf="selectedOrder.notes">
                    <h3>Notizen</h3>
                    <p class="order-notes">{{ selectedOrder.notes }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices Tab -->
        <div *ngIf="activeTab === 'invoices'">
          <div class="invoices-section">
            <div class="section-header">
              <h2>Rechnungen</h2>
              <p>Verwalten Sie Ihre Großhandelsrechnungen</p>
            </div>

            <div class="invoices-stats">
              <div class="stat-card">
                <div class="stat-number">{{ invoices.length }}</div>
                <div class="stat-label">Gesamt Rechnungen</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">€{{ getTotalPendingAmount() }}</div>
                <div class="stat-label">Ausstehend</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">€{{ getTotalPaidAmount() }}</div>
                <div class="stat-label">Bezahlt</div>
              </div>
            </div>

            <div *ngIf="invoices.length > 0" class="invoices-list">
              <div *ngFor="let invoice of invoices" class="invoice-item">
                <div class="invoice-header">
                  <div class="invoice-info">
                    <h4>{{ invoice.invoice_number }}</h4>
                    <div class="invoice-meta">
                      <span>Bestellung #{{ invoice.order_id }}</span>
                      <span>{{ invoice.issued_at | date:'dd.MM.yyyy' }}</span>
                    </div>
                  </div>
                  <div class="invoice-status" [class]="'status-' + invoice.status">
                    {{ getStatusText(invoice.status) }}
                  </div>
                </div>

                <div class="invoice-amount">
                  <span class="amount">€{{ formatAmount(invoice.total_amount) }}</span>
                  <span class="due-date" [class.overdue]="isOverdue(invoice)">
                    Fällig: {{ invoice.due_date | date:'dd.MM.yyyy' }}
                  </span>
                </div>

                <div class="invoice-actions">
                  <button *ngIf="invoice.pdf_path" class="btn-secondary" (click)="downloadInvoice(invoice)">
                    <i class="fa-solid fa-eye"></i> PDF anzeigen
                  </button>
                  <button *ngIf="!invoice.pdf_path" class="btn-primary" (click)="generatePdf(invoice)">
                    <i class="fa-solid fa-file-pdf"></i> PDF erstellen
                  </button>
                  <button *ngIf="invoice.status === 'sent'" class="btn-success" (click)="markAsPaid(invoice)">
                    <i class="fa-solid fa-check"></i> Bezahlt
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="invoices.length === 0" class="empty-invoices">
              <div class="empty-icon">
                <i class="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <h3>Keine Rechnungen vorhanden</h3>
              <p>Nach Ihrer nächsten Bestellung wird automatisch eine Rechnung generiert.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wholesale-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      background: var(--gradient-light-green);
      min-height: 100vh;
    }

    /* Header Section */
    .header-section {
      background: var(--gradient-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-8) var(--space-6);
      margin-bottom: var(--space-8);
      color: white;
      box-shadow: var(--shadow-lg);
    }

    .header-section * {
      color: white;
    }

    .header-content {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-6);
      align-items: center;
    }

    .header-text h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: 700;
      color: white !important;
    }

    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: var(--text-lg);
      color: white;
    }

    .header-stats {
      display: flex;
      gap: var(--space-6);
      text-align: center;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      min-width: 120px;
    }

    .stat-icon {
      opacity: 0.9;
      flex-shrink: 0;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: var(--text-2xl);
      font-weight: 700;
      line-height: 1;
      color: white;
    }

    .stat-label {
      font-size: var(--text-sm);
      opacity: 0.8;
      margin-top: var(--space-1);
      color: white;
    }

    /* Suppliers Section */
    .suppliers-section {
      margin-bottom: var(--space-8);
    }

    .section-title {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-heading);
      margin: 0 0 var(--space-6) 0;
    }

    .suppliers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-6);
    }

    .supplier-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .supplier-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-300);
    }

    .supplier-card:active {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .supplier-header {
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .supplier-logo {
      width: 60px;
      height: 60px;
      background: var(--gradient-primary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .supplier-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: white;
    }

    .supplier-icon svg {
      width: 24px;
      height: 24px;
    }

    .supplier-info {
      flex: 1;
    }

    .supplier-info h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .supplier-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .category {
      background: var(--bg-light-green);
      color: var(--color-success);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .stars {
      color: var(--color-warning);
      font-size: var(--text-sm);
    }

    .rating-value {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .status-badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.open {
      background: var(--color-success);
      color: white;
    }

    .status-badge.closed {
      background: var(--color-danger);
      color: white;
    }

    .supplier-content {
      padding: var(--space-4);
    }

    .description {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
      line-height: 1.5;
    }

    .supplier-details {
      display: grid;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .detail-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
    }

    .detail-icon svg {
      width: 16px;
      height: 16px;
    }

    .detail-text {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .special-offer {
      background: var(--bg-light-green);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .offer-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-success);
    }

    .offer-icon svg {
      width: 18px;
      height: 18px;
    }

    .offer-text {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-success);
    }

    .supplier-actions {
      padding: 0 var(--space-4) var(--space-4) var(--space-4);
      display: flex;
      justify-content: center;
    }

    .btn-primary {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
      font-size: var(--text-sm);
      border: none;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .btn-primary:hover:not(:disabled) {
      box-shadow: var(--shadow-md);
    }

    .btn-primary:disabled {
      background: var(--color-muted);
      cursor: not-allowed;
      transform: none;
    }

    /* Info Section */
    .info-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
      margin-top: var(--space-8);
    }

    .info-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .info-icon {
      margin-bottom: var(--space-3);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-icon svg {
      width: 48px;
      height: 48px;
    }

    .info-card h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .info-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
    }

    .info-card li {
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .info-card li:last-child {
      border-bottom: none;
    }

    /* Tab Navigation */
    .tabs-section {
      margin-bottom: var(--space-8);
    }

    .tabs {
      display: flex;
      background: white;
      border-radius: var(--radius-xl);
      padding: var(--space-2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.06);
      gap: var(--space-1);
      position: relative;
      overflow: hidden;
    }

    .tabs::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(74, 169, 108, 0.3), transparent);
    }

    .tab-button {
      flex: 1;
      padding: var(--space-4) var(--space-5);
      border: none;
      background: transparent;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: var(--color-muted);
      overflow: hidden;
    }

    .tab-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(74, 169, 108, 0.05), rgba(74, 169, 108, 0.02));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: var(--radius-lg);
    }

    .tab-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      justify-content: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .tab-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      stroke-width: 2;
    }

    .tab-button:hover {
      color: var(--color-primary);
      transform: translateY(-2px);
    }

    .tab-button:hover::before {
      opacity: 1;
    }

    .tab-button:hover .tab-icon {
      transform: scale(1.1);
      stroke: var(--color-primary);
    }

    .tab-button:active {
      transform: translateY(-1px);
    }

    .tab-button.active {
      background: linear-gradient(135deg, #4aa96c 0%, #2d5a47 100%);
      color: white;
      box-shadow: 0 8px 25px rgba(74, 169, 108, 0.3);
      transform: translateY(-2px);
      font-weight: 600;
    }

    .tab-button.active::before {
      opacity: 0;
    }

    .tab-button.active svg {
      stroke: white;
      transform: scale(1.1);
    }

    .tab-button.active:hover {
      background: linear-gradient(135deg, #4aa96c 0%, #2d5a47 100%);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(74, 169, 108, 0.4);
    }

    .tab-badge {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: var(--text-xs);
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 12px;
      margin-left: var(--space-2);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    /* Responsive button text */
    .tab-text-full {
      display: inline;
      font-size: var(--text-sm);
      letter-spacing: 0.025em;
    }

    .tab-text-mobile {
      display: none;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .header-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        text-align: center;
      }

      .header-stats {
        justify-content: center;
        flex-wrap: wrap;
        gap: var(--space-4);
      }

      .stat {
        min-width: 100px;
        padding: var(--space-2) var(--space-3);
      }

      .suppliers-grid {
        grid-template-columns: 1fr;
      }

      .tabs {
        gap: var(--space-1);
      }

      .tab-button {
        padding: var(--space-3) var(--space-2);
      }
    }

    @media (max-width: 768px) {
      .wholesale-container {
        padding: 0 var(--space-4);
      }

      .header-section {
        padding: var(--space-6) var(--space-4);
        margin-bottom: var(--space-6);
      }

      .header-stats {
        flex-direction: column;
        gap: var(--space-3);
        align-items: stretch;
      }

      .stat {
        min-width: unset;
        justify-content: center;
        padding: var(--space-3) var(--space-4);
      }

      .stat-content {
        align-items: center;
      }

      /* Mobile tabs */
      .tabs {
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-xl);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
      }

      .tab-button {
        width: 100%;
        padding: var(--space-5) var(--space-4);
        min-height: 64px;
        justify-content: flex-start;
        border-radius: var(--radius-lg);
        margin-bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }

      .tab-button:hover {
        background: rgba(74, 169, 108, 0.08);
        transform: translateX(4px);
      }

      .tab-button.active {
        background: linear-gradient(135deg, #4aa96c 0%, #2d5a47 100%);
        transform: translateX(4px);
        box-shadow: 0 8px 25px rgba(74, 169, 108, 0.3);
      }

      .tab-content {
        justify-content: flex-start;
        gap: var(--space-4);
        width: 100%;
      }

      .tab-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .tab-text-full {
        display: none;
      }

      .tab-text-mobile {
        display: inline;
        font-weight: 600;
        font-size: var(--text-base);
        letter-spacing: 0.025em;
      }

      .tab-badge {
        margin-left: auto;
        align-self: center;
        padding: 6px 10px;
        font-size: var(--text-xs);
      }

      /* Supplier cards mobile */
      .supplier-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-4);
      }

      .supplier-info {
        width: 100%;
      }

      .supplier-logo {
        width: 50px;
        height: 50px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        flex-shrink: 0;
      }

      .supplier-actions {
        width: 100%;
        padding: var(--space-4);
        background: var(--color-surface-2);
        border-top: 1px solid var(--color-border);
      }

      .supplier-actions button {
        width: 100%;
        justify-content: center;
        min-height: 48px;
        border-radius: var(--radius-lg);
        font-weight: 600;
        transition: all var(--transition);
        background: var(--gradient-primary);
        border: none;
        color: white;
      }

      .supplier-actions button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .suppliers-grid {
        gap: var(--space-4);
      }

      .supplier-card {
        border-radius: var(--radius-lg);
      }

      /* Order cards mobile */
      .order-card {
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-3);
      }

      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .order-info {
        width: 100%;
      }

      .order-info h3 {
        font-size: var(--text-xl);
        margin-bottom: var(--space-2);
      }

      .order-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .order-actions {
        width: 100%;
        justify-content: center;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .order-actions button {
        flex: 1;
        min-height: 48px;
        border-radius: var(--radius-lg);
        font-weight: 600;
        transition: all var(--transition);
      }

      .btn-primary-outline {
        background: var(--color-surface);
        border: 2px solid var(--color-primary);
        color: var(--color-primary);
      }

      .btn-primary-outline:hover {
        background: var(--color-primary);
        color: white;
        transform: translateY(-1px);
      }

      .order-summary {
        text-align: center;
        padding: var(--space-4);
        background: var(--color-surface-2);
        border-radius: var(--radius-lg);
        border-top: 1px solid var(--color-border);
        margin-top: var(--space-4);
      }

      .total-amount {
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--color-primary);
      }

      /* Info section mobile */
      .info-section {
        grid-template-columns: 1fr;
        gap: var(--space-6);
      }

      .info-card {
        padding: var(--space-6);
      }

      /* Modal improvements */
      .modal-content {
        width: 95%;
        margin: var(--space-4);
        max-height: 90vh;
      }

      .modal-header {
        padding: var(--space-4) var(--space-6);
      }

      .modal-body {
        padding: var(--space-4) var(--space-6);
      }
    }

    @media (max-width: 480px) {
      .wholesale-container {
        padding: 0 var(--space-3);
      }

      .header-section {
        padding: var(--space-4) var(--space-3);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
      }

      .header-text h1 {
        font-size: var(--text-xl);
        line-height: 1.2;
      }

      .header-text p {
        font-size: var(--text-sm);
        line-height: 1.4;
      }

      .header-stats {
        gap: var(--space-3);
      }

      .stat {
        padding: var(--space-2) var(--space-3);
        min-width: 90px;
      }

      .stat-icon svg {
        width: 16px;
        height: 16px;
      }

      .tabs {
        padding: var(--space-3);
        gap: var(--space-2);
        border-radius: var(--radius-lg);
      }

      .tab-button {
        min-height: 60px;
        padding: var(--space-4) var(--space-3);
        margin-bottom: 0;
      }

      .tab-icon {
        width: 22px;
        height: 22px;
      }

      .tab-text-mobile {
        font-size: var(--text-sm);
      }

      .supplier-card {
        margin-bottom: var(--space-4);
      }

      .supplier-logo {
        width: 45px;
        height: 45px;
      }

      .supplier-header {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .supplier-actions {
        padding: var(--space-3);
        gap: var(--space-2);
      }

      .supplier-actions button {
        min-height: 44px;
        font-size: var(--text-sm);
      }

      .order-card {
        padding: var(--space-3);
        margin-bottom: var(--space-2);
      }

      .order-info h3 {
        font-size: var(--text-lg);
      }

      .order-actions {
        gap: var(--space-2);
        margin-top: var(--space-3);
      }

      .order-actions button {
        min-height: 44px;
        font-size: var(--text-sm);
      }

      .order-summary {
        padding: var(--space-3);
        margin-top: var(--space-3);
      }

      .modal-content {
        width: 98%;
        margin: var(--space-2);
      }

      .modal-header {
        padding: var(--space-3) var(--space-4);
      }

      .modal-body {
        padding: var(--space-3) var(--space-4);
      }
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: var(--space-4);
      color: var(--color-primary);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Error State */
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
    }

    .error-icon {
      margin-bottom: var(--space-4);
      color: var(--color-danger);
    }

    .error-container h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .error-container p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      color: var(--color-muted);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-state p {
      margin: 0;
      color: var(--color-muted);
    }

    /* Orders Section */
    .orders-section {
      padding: var(--space-6);
    }

    .orders-header {
      text-align: center;
      margin-bottom: var(--space-6);
    }

    .orders-header h2 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
    }

    .orders-header p {
      margin: 0;
      color: var(--color-muted);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .order-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: white;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
      position: relative;
      cursor: pointer;
    }

    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-300);
    }

    .order-card:active {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .order-info h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .order-date {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .order-status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending {
      background: var(--color-warning);
      color: white;
    }

    .status-confirmed {
      background: var(--color-info);
      color: white;
    }

    .status-preparing {
      background: var(--color-primary);
      color: white;
    }

    .status-ready {
      background: var(--color-success);
      color: white;
    }

    .status-delivered {
      background: var(--color-success);
      color: white;
    }

    .status-cancelled {
      background: var(--color-danger);
      color: white;
    }

    .order-content {
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-4);
    }

    .order-items {
      margin-bottom: var(--space-4);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .item-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .item-quantity {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .item-total {
      font-weight: 600;
      color: var(--color-primary);
    }

    .order-summary {
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-3);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .total-amount {
      color: var(--color-primary);
    }

    /* Empty Orders State */
    .empty-orders {
      text-align: center;
      padding: var(--space-12) var(--space-6);
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-orders h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-orders p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
    }

    /* Order Details Modal */
    .order-detail-modal {
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      background: white;
      position: relative;
      z-index: 10001;
    }

    .modal-header {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5a47 100%);
      color: white;
      padding: var(--space-6);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title-section {
      flex: 1;
    }

    .modal-title-section h2 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: white;
    }

    .order-meta-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .wholesaler-name {
      font-size: var(--text-lg);
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    .order-date {
      font-size: var(--text-sm);
      color: rgba(255, 255, 255, 0.7);
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: var(--radius-lg);
      padding: var(--space-2);
      color: white;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .modal-body {
      padding: var(--space-6);
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    }

    .order-detail-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* Order Status Section */
    .order-status-section {
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--color-border);
    }

    .status-badge-large {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 600;
      text-transform: uppercase;
    }

    .order-total {
      text-align: right;
    }

    .total-label {
      display: block;
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-bottom: var(--space-1);
    }

    .total-amount {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-primary);
    }

    /* Order Items Section */
    .order-items-section h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
      font-weight: 600;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .item-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
    }

    .item-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-200);
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex: 1;
    }

    .item-image {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--bg-light);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .image-placeholder {
      color: var(--color-muted);
    }

    .image-placeholder svg {
      width: 32px;
      height: 32px;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .item-details {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .quantity {
      font-weight: 500;
      color: var(--color-text);
    }

    .unit {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .item-category {
      display: inline-block;
    }

    .category-tag {
      background: var(--bg-light-green);
      color: var(--color-success);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .item-price {
      text-align: right;
    }

    .item-total {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    /* Order Summary Section */
    .order-summary-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
    }

    .order-summary-section h3 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
      font-weight: 600;
    }

    .summary-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row.total-row {
      border-top: 2px solid var(--color-border);
      margin-top: var(--space-2);
      padding-top: var(--space-3);
    }

    .summary-row.total-row span:first-child {
      font-weight: 600;
      color: var(--color-heading);
    }

    .total-price {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-success);
    }

    /* Additional Info Section */
    .additional-info-section {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .additional-info-section h3 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-lg);
      color: var(--color-warning);
      font-weight: 600;
    }

    .order-notes {
      margin: 0;
      color: var(--color-text);
      line-height: 1.5;
    }

    /* Button Styles */
    .btn-primary-outline {
      background: transparent;
      border: 2px solid var(--color-primary);
      color: var(--color-primary);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      text-decoration: none;
    }

    .btn-primary-outline:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    /* Order Header Improvements */
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-5);
      background: white;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-4);
    }

    .order-info {
      flex: 1;
    }

    .order-info h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
      font-weight: 600;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .order-date {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .order-items-count {
      font-size: var(--text-sm);
      color: var(--color-primary);
      font-weight: 500;
    }

    .order-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
    }

    /* Order Summary Improvements */
    .order-summary {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5a47 100%);
      color: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      text-align: center;
      margin-top: var(--space-4);
    }

    .order-summary .summary-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-2);
      border: none;
      padding: 0;
    }

    .order-summary .summary-row span:first-child {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
    }

    .order-summary .total-amount {
      font-size: var(--text-xl);
      font-weight: 700;
      color: #a8d5ba;
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.7) !important;
      backdrop-filter: blur(4px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 10000 !important;
      padding: var(--space-4) !important;
      animation: modalFadeIn 0.3s ease-out !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(4px);
      }
    }
/* Invoices Styles */
    .invoices-section {
      padding: var(--space-6);
    }

    .invoices-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .invoices-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .invoice-item {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      box-shadow: var(--shadow-sm);
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .invoice-info h4 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .invoice-meta {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .invoice-status {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-draft { background: var(--color-warning); color: white; }
    .status-sent { background: var(--color-info); color: white; }
    .status-paid { background: var(--color-success); color: white; }
    .status-overdue { background: var(--color-danger); color: white; }

    .invoice-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .amount {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-primary);
    }

    .due-date {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .overdue {
      color: var(--color-danger) !important;
      font-weight: 600;
    }

    .invoice-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .empty-invoices {
      text-align: center;
      padding: var(--space-12);
    }

    .empty-icon {
      font-size: var(--text-6xl);
      color: var(--color-muted);
      margin-bottom: var(--space-4);
    }
  `]
})
export class RestaurantManagerWholesaleComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  suppliers: Supplier[] = [];
  loading = false;
  error: string | null = null;

  // Tab management
  activeTab: 'browse' | 'orders' | 'invoices' = 'browse';

  // Orders management
  myOrders: WholesalerOrder[] = [];
  ordersLoading = false;
  myOrdersCount = 0;
  pendingOrdersCount = 0;
  totalOrderValue: number = 0;

  // Order details modal
  showOrderModal = false;
  selectedOrder: any = null;

  // Invoices management
  invoices: any[] = [];
  invoicesLoading = false;

  ngOnInit() {
    this.loadWholesalers();
    this.loadMyOrders();

    // Add keyboard event listener for modal
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showOrderModal) {
        this.closeOrderModal();
      }
    });
  }

  loadWholesalers() {
    this.loading = true;
    this.error = null;

    this.http.get<{ wholesalers: WholesalerData[] }>(`${environment.apiUrl}/restaurant-managers/wholesalers`).subscribe({
      next: (response) => {
        this.suppliers = this.transformWholesalersToSuppliers(response.wholesalers);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading wholesalers:', error);
        this.error = 'Fehler beim Laden der Großhändler. Bitte versuchen Sie es später erneut.';
        this.loading = false;
      }
    });
  }

  private transformWholesalersToSuppliers(wholesalers: WholesalerData[]): Supplier[] {
    return wholesalers.map(wholesaler => {
      // Generiere zufällige Werte für fehlende Daten
      const categories = ['Frisch', 'Gastro', 'Bio', 'Tiefkühl', 'Getränke'];
      const deliveryTimes = ['24h', '48h', '24-48h', '12h'];
      const minOrderValues = [50, 75, 100, 150, 200];

      // Erstelle ein einfaches Logo basierend auf dem Namen
      const logoSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3h18v18H3z"/>
        <path d="M9 9h6v6H9z"/>
        <text x="12" y="15" text-anchor="middle" font-size="8" fill="currentColor">${wholesaler.name.charAt(0).toUpperCase()}</text>
      </svg>`;

      return {
        id: wholesaler.id.toString(),
        name: wholesaler.name,
        description: wholesaler.description || `Professionelle Großhandelsdienstleistungen für ${wholesaler.name}.`,
        logo: logoSvg,
        category: categories[Math.floor(Math.random() * categories.length)],
        rating: 4.0 + Math.random() * 1.0, // 4.0 - 5.0
        deliveryTime: deliveryTimes[Math.floor(Math.random() * deliveryTimes.length)],
        minOrderValue: minOrderValues[Math.floor(Math.random() * minOrderValues.length)],
        isOpen: wholesaler.is_active && wholesaler.is_verified,
        wholesalerData: wholesaler,
        specialOffer: Math.random() > 0.7 ? 'Sonderangebot verfügbar' : undefined
      };
    });
  }

  viewProducts(supplier: Supplier) {
    // Navigate to the wholesaler detail page
    this.router.navigate(['/restaurant-manager/wholesale', supplier.wholesalerData.id]);
  }

  // Tab management
  setActiveTab(tab: 'browse' | 'orders' | 'invoices') {
    this.activeTab = tab;
    if (tab === 'orders' && this.myOrders.length === 0) {
      this.loadMyOrders();
    }
    if (tab === 'invoices' && this.invoices.length === 0) {
      this.loadInvoices();
    }
  }

  // Orders management
  loadMyOrders() {
    this.ordersLoading = true;
    this.http.get<{orders: WholesalerOrder[]}>(`${environment.apiUrl}/wholesaler-orders/with-items`).subscribe({
      next: (response) => {
        // Sicherstellen, dass alle numerischen Werte korrekt konvertiert werden
        this.myOrders = (response.orders || []).map(order => ({
          ...order,
          total_amount: Number(order.total_amount) || 0,
          items: (order.items || []).map(item => ({
            ...item,
            unit_price: Number(item.unit_price) || 0,
            total_price: Number(item.total_price) || 0
          }))
        }));

        this.myOrdersCount = this.myOrders.length;
        this.pendingOrdersCount = this.myOrders.filter(order =>
          order.status === 'pending' || order.status === 'confirmed'
        ).length;
        this.totalOrderValue = Number(this.myOrders.reduce((total, order) => total + order.total_amount, 0));
        this.ordersLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.myOrders = [];
        this.myOrdersCount = 0;
        this.pendingOrdersCount = 0;
        this.totalOrderValue = 0;
        this.ordersLoading = false;
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'confirmed': return 'Bestätigt';
      case 'preparing': return 'In Vorbereitung';
      case 'ready': return 'Bereit zur Abholung';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  }


  // Order details modal methods
  showOrderDetails(order: any) {
    this.selectedOrder = { ...order };
    this.showOrderModal = true;
  }

  closeOrderModal() {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  // Invoice methods
  loadInvoices() {
    this.invoicesLoading = true;
    this.http.get<{invoices: any[]}>(`${environment.apiUrl}/invoices`)
      .subscribe({
        next: (response) => {
          this.invoices = response.invoices;
          this.invoicesLoading = false;
        },
        error: (error) => {
          console.error('Error loading invoices:', error);
          this.invoicesLoading = false;
        }
      });
  }

  getTotalPendingAmount(): number {
    return this.invoices
      .filter(invoice => invoice.status === 'sent')
      .reduce((total, invoice) => total + (Number(invoice.total_amount) || 0), 0);
  }

  getTotalPaidAmount(): number {
    return this.invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + (Number(invoice.total_amount) || 0), 0);
  }

  formatAmount(amount: any): string {
    return (Number(amount) || 0).toFixed(2);
  }


  isOverdue(invoice: any): boolean {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  }

  downloadInvoice(invoice: any) {
    if (invoice.pdf_path) {
      // Remove /api/v1 from the URL since static files are served directly
      const baseUrl = environment.apiUrl.replace('/api/v1', '');
      window.open(`${baseUrl}${invoice.pdf_path}`, '_blank');
    }
  }

  generatePdf(invoice: any) {
    this.http.post(`${environment.apiUrl}/invoices/${invoice.id}/generate-pdf`, {})
      .subscribe({
        next: () => {
          this.loadInvoices();
          alert('PDF wurde erfolgreich generiert!');
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
        }
      });
  }

  markAsPaid(invoice: any) {
    if (confirm('Möchten Sie diese Rechnung wirklich als bezahlt markieren?')) {
      this.http.patch(`${environment.apiUrl}/invoices/${invoice.id}/status`, { status: 'paid' })
        .subscribe({
          next: () => {
            this.loadInvoices();
            alert('Rechnung wurde als bezahlt markiert!');
          },
          error: (error) => {
            console.error('Error updating invoice status:', error);
            alert('Fehler beim Aktualisieren des Rechnungsstatus. Bitte versuchen Sie es erneut.');
          }
        });
    }
  }

  // Handle image loading errors
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      const placeholder = parent.querySelector('.item-image-placeholder') as HTMLElement;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }


}

    