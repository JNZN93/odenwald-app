import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher.component';

@Component({
  selector: 'app-restaurant-manager-i18n-demo',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <div class="restaurant-manager-i18n-demo">
      <div class="demo-header">
        <h1>Restaurant Manager - Internationalisierung Demo</h1>
        <p>Diese Demo zeigt alle verfügbaren Übersetzungen für den Restaurant Manager Bereich</p>
        <app-language-switcher></app-language-switcher>
      </div>

      <div class="demo-sections">
        <!-- Navigation -->
        <div class="demo-section">
          <h2>{{ 'nav.title' | translate }}</h2>
          <div class="nav-items">
            <div class="nav-item">{{ 'nav.overview' | translate }}</div>
            <div class="nav-item">{{ 'nav.orders' | translate }}</div>
            <div class="nav-item">{{ 'nav.issues' | translate }}</div>
            <div class="nav-item">{{ 'nav.support' | translate }}</div>
            <div class="nav-item">{{ 'nav.tables' | translate }}</div>
            <div class="nav-item">{{ 'nav.drivers' | translate }}</div>
            <div class="nav-item">{{ 'nav.menu' | translate }}</div>
            <div class="nav-item">{{ 'nav.flyer' | translate }}</div>
            <div class="nav-item">{{ 'nav.details' | translate }}</div>
            <div class="nav-item">{{ 'nav.analytics' | translate }}</div>
            <div class="nav-item">{{ 'nav.customers' | translate }}</div>
            <div class="nav-item">{{ 'nav.settings' | translate }}</div>
            <div class="nav-item">{{ 'nav.wholesale' | translate }}</div>
          </div>
        </div>

        <!-- Orders -->
        <div class="demo-section">
          <h2>{{ 'orders.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'orders.order_id' | translate }}:</strong> #12345
            </div>
            <div class="demo-item">
              <strong>{{ 'orders.customer' | translate }}:</strong> Max Mustermann
            </div>
            <div class="demo-item">
              <strong>{{ 'orders.status' | translate }}:</strong> {{ 'orders.pending' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'orders.total_amount' | translate }}:</strong> €25.50
            </div>
            <div class="demo-item">
              <strong>{{ 'orders.actions' | translate }}:</strong> {{ 'orders.accept' | translate }} | {{ 'orders.reject' | translate }}
            </div>
          </div>
        </div>

        <!-- Menu -->
        <div class="demo-section">
          <h2>{{ 'menu.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'menu.item_name' | translate }}:</strong> Pizza Margherita
            </div>
            <div class="demo-item">
              <strong>{{ 'menu.description' | translate }}:</strong> Klassische Pizza mit Tomaten und Mozzarella
            </div>
            <div class="demo-item">
              <strong>{{ 'menu.price' | translate }}:</strong> €12.90
            </div>
            <div class="demo-item">
              <strong>{{ 'menu.category' | translate }}:</strong> Hauptgerichte
            </div>
            <div class="demo-item">
              <strong>{{ 'menu.available' | translate }}:</strong> {{ 'common.yes' | translate }}
            </div>
          </div>
        </div>

        <!-- Customers -->
        <div class="demo-section">
          <h2>{{ 'customers.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'customers.name' | translate }}:</strong> Anna Schmidt
            </div>
            <div class="demo-item">
              <strong>{{ 'customers.email' | translate }}:</strong> anna@example.com
            </div>
            <div class="demo-item">
              <strong>{{ 'customers.phone' | translate }}:</strong> +49 123 456789
            </div>
            <div class="demo-item">
              <strong>{{ 'customers.total_orders' | translate }}:</strong> 15
            </div>
            <div class="demo-item">
              <strong>{{ 'customers.loyalty_points' | translate }}:</strong> 150
            </div>
          </div>
        </div>

        <!-- Drivers -->
        <div class="demo-section">
          <h2>{{ 'drivers.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'drivers.name' | translate }}:</strong> Mehmet Yılmaz
            </div>
            <div class="demo-item">
              <strong>{{ 'drivers.phone' | translate }}:</strong> +49 987 654321
            </div>
            <div class="demo-item">
              <strong>{{ 'drivers.status' | translate }}:</strong> {{ 'drivers.available' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'drivers.current_delivery' | translate }}:</strong> #12345
            </div>
          </div>
        </div>

        <!-- Issues -->
        <div class="demo-section">
          <h2>{{ 'issues.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'issues.issue_id' | translate }}:</strong> #ISS-001
            </div>
            <div class="demo-item">
              <strong>{{ 'issues.order_id' | translate }}:</strong> #12345
            </div>
            <div class="demo-item">
              <strong>{{ 'issues.customer' | translate }}:</strong> Max Mustermann
            </div>
            <div class="demo-item">
              <strong>{{ 'issues.priority' | translate }}:</strong> {{ 'issues.high' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'issues.status' | translate }}:</strong> {{ 'issues.open' | translate }}
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div class="demo-section">
          <h2>{{ 'settings.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'settings.restaurant_name' | translate }}:</strong> Mein Restaurant
            </div>
            <div class="demo-item">
              <strong>{{ 'settings.address' | translate }}:</strong> Musterstraße 123, 12345 Berlin
            </div>
            <div class="demo-item">
              <strong>{{ 'settings.phone' | translate }}:</strong> +49 30 12345678
            </div>
            <div class="demo-item">
              <strong>{{ 'settings.email' | translate }}:</strong> info@restaurant.de
            </div>
            <div class="demo-item">
              <strong>{{ 'settings.opening_hours' | translate }}:</strong> {{ 'settings.opening_hours_monday' | translate }} - {{ 'settings.opening_hours_friday' | translate }}
            </div>
          </div>
        </div>

        <!-- Analytics -->
        <div class="demo-section">
          <h2>{{ 'analytics.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'analytics.revenue' | translate }}:</strong> €2,450.00
            </div>
            <div class="demo-item">
              <strong>{{ 'analytics.orders' | translate }}:</strong> 125
            </div>
            <div class="demo-item">
              <strong>{{ 'analytics.customers' | translate }}:</strong> 89
            </div>
            <div class="demo-item">
              <strong>{{ 'analytics.popular_items' | translate }}:</strong> Pizza Margherita
            </div>
            <div class="demo-item">
              <strong>{{ 'analytics.today' | translate }}:</strong> €450.00
            </div>
          </div>
        </div>

        <!-- Wholesale -->
        <div class="demo-section">
          <h2>{{ 'wholesale.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'wholesale.products' | translate }}:</strong> 45 verfügbar
            </div>
            <div class="demo-item">
              <strong>{{ 'wholesale.orders' | translate }}:</strong> 3 ausstehend
            </div>
            <div class="demo-item">
              <strong>{{ 'wholesale.suppliers' | translate }}:</strong> 5 Partner
            </div>
            <div class="demo-item">
              <strong>{{ 'wholesale.quantity' | translate }}:</strong> 10 kg
            </div>
            <div class="demo-item">
              <strong>{{ 'wholesale.unit_price' | translate }}:</strong> €2.50/kg
            </div>
          </div>
        </div>

        <!-- Support -->
        <div class="demo-section">
          <h2>{{ 'support.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'support.tickets' | translate }}:</strong> 2 offen
            </div>
            <div class="demo-item">
              <strong>{{ 'support.subject' | translate }}:</strong> Technisches Problem
            </div>
            <div class="demo-item">
              <strong>{{ 'support.priority' | translate }}:</strong> {{ 'issues.medium' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'support.status' | translate }}:</strong> {{ 'issues.open' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'support.created' | translate }}:</strong> 2024-01-15
            </div>
          </div>
        </div>

        <!-- Tables -->
        <div class="demo-section">
          <h2>{{ 'tables.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'tables.table_number' | translate }}:</strong> Tisch 5
            </div>
            <div class="demo-item">
              <strong>{{ 'tables.capacity' | translate }}:</strong> 4 Personen
            </div>
            <div class="demo-item">
              <strong>{{ 'tables.status' | translate }}:</strong> {{ 'tables.available' | translate }}
            </div>
            <div class="demo-item">
              <strong>{{ 'tables.qr_code' | translate }}:</strong> QR-Code generiert
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="demo-section">
          <h2>{{ 'details.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'details.basic_info' | translate }}:</strong> Grunddaten
            </div>
            <div class="demo-item">
              <strong>{{ 'details.contact_info' | translate }}:</strong> Kontaktdaten
            </div>
            <div class="demo-item">
              <strong>{{ 'details.delivery_info' | translate }}:</strong> Lieferdaten
            </div>
            <div class="demo-item">
              <strong>{{ 'details.minimum_order' | translate }}:</strong> €15.00
            </div>
            <div class="demo-item">
              <strong>{{ 'details.delivery_fee' | translate }}:</strong> €2.50
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="demo-section">
          <h2>{{ 'payment.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'payment.cash' | translate }}:</strong> Aktiviert
            </div>
            <div class="demo-item">
              <strong>{{ 'payment.card' | translate }}:</strong> Aktiviert
            </div>
            <div class="demo-item">
              <strong>{{ 'payment.online' | translate }}:</strong> Aktiviert
            </div>
            <div class="demo-item">
              <strong>{{ 'payment.stripe_connected' | translate }}:</strong> {{ 'common.yes' | translate }}
            </div>
          </div>
        </div>

        <!-- Invoices -->
        <div class="demo-section">
          <h2>{{ 'invoices.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <strong>{{ 'invoices.invoice_number' | translate }}:</strong> INV-2024-001
            </div>
            <div class="demo-item">
              <strong>{{ 'invoices.date' | translate }}:</strong> 2024-01-15
            </div>
            <div class="demo-item">
              <strong>{{ 'invoices.amount' | translate }}:</strong> €1,250.00
            </div>
            <div class="demo-item">
              <strong>{{ 'invoices.status' | translate }}:</strong> {{ 'invoices.paid' | translate }}
            </div>
          </div>
        </div>

        <!-- Common Actions -->
        <div class="demo-section">
          <h2>{{ 'common.title' | translate }}</h2>
          <div class="demo-grid">
            <div class="demo-item">
              <button class="demo-button">{{ 'common.save' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.cancel' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.edit' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.delete' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.add' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.search' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.filter' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.reset' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.confirm' | translate }}</button>
            </div>
            <div class="demo-item">
              <button class="demo-button">{{ 'common.refresh' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restaurant-manager-i18n-demo {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .demo-header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .demo-header h1 {
      color: #059669;
      margin-bottom: 1rem;
      font-size: 2rem;
    }

    .demo-header p {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }

    .demo-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .demo-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .demo-section h2 {
      color: #374151;
      margin-bottom: 1rem;
      font-size: 1.3rem;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 0.5rem;
    }

    .nav-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }

    .nav-item {
      background: white;
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      text-align: center;
      font-weight: 500;
      color: #374151;
    }

    .demo-grid {
      display: grid;
      gap: 0.75rem;
    }

    .demo-item {
      background: white;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 0.9rem;
    }

    .demo-item strong {
      color: #059669;
      margin-right: 0.5rem;
    }

    .demo-button {
      background: #059669;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .demo-button:hover {
      background: #047857;
    }

    @media (max-width: 768px) {
      .restaurant-manager-i18n-demo {
        margin: 1rem;
        padding: 1rem;
      }

      .demo-sections {
        grid-template-columns: 1fr;
      }

      .nav-items {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RestaurantManagerI18nDemoComponent {}
