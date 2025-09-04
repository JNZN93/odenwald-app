import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule],
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
              <span class="stat-number">{{ suppliers.length }}</span>
              <span class="stat-label">Großhändler</span>
            </div>
            <div class="stat">
              <span class="stat-number">24h</span>
              <span class="stat-label">Lieferzeit</span>
            </div>
            <div class="stat">
              <span class="stat-number">€50</span>
              <span class="stat-label">Mindestbestellung</span>
            </div>
          </div>
        </div>
      </div>

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
                    <span class="rating-value">{{ supplier.rating }}</span>
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
              <button class="btn-secondary" (click)="viewCatalog(supplier)">
                <span>Katalog</span>
              </button>
              <button class="btn-primary" (click)="viewProducts(supplier)" [disabled]="!supplier.isOpen">
                <span>Produkte</span>
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
      flex-direction: column;
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
    }

    .supplier-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-300);
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
      gap: var(--space-2);
    }

    .btn-secondary, .btn-primary {
      flex: 1;
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

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-border);
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

    /* Responsive Design */
    @media (max-width: 1024px) {
      .header-content {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        text-align: center;
      }

      .header-stats {
        justify-content: center;
      }

      .suppliers-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .wholesale-container {
        padding: 0 var(--space-4);
      }

      .header-section {
        padding: var(--space-6) var(--space-4);
      }

      .supplier-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }

      .supplier-actions {
        flex-direction: column;
      }

      .info-section {
        grid-template-columns: 1fr;
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

  `]
})
export class RestaurantManagerWholesaleComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  suppliers: Supplier[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.loadWholesalers();
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

  viewCatalog(supplier: Supplier) {
    console.log('View catalog for:', supplier.name);
    // TODO: Navigate to supplier catalog
  }

  viewProducts(supplier: Supplier) {
    // Navigate to the wholesaler detail page
    this.router.navigate(['/restaurant-manager/wholesale', supplier.wholesalerData.id]);
  }


}


