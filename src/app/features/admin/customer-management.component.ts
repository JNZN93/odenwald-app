import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  total_orders?: number;
  last_order_date?: string;
}

export interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'email' | 'created_at' | 'total_orders';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="customer-management-container">
      <!-- Header -->
      <div class="page-header">
        <h1>Kundenverwaltung</h1>
        <p>Verwalte alle registrierten Kunden der Plattform</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>Gesamt Kunden</h3>
            <div class="stat-value">{{ totalCustomers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div class="stat-content">
            <h3>Aktive Kunden</h3>
            <div class="stat-value">{{ activeCustomers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="stat-content">
            <h3>Neue Kunden</h3>
            <div class="stat-value">{{ newCustomers }}</div>
            <small class="stat-subtitle">Letzte 30 Tage</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>Durchschnitt</h3>
            <div class="stat-value">{{ averageOrders | number:'1.1-1' }}</div>
            <small class="stat-subtitle">Bestellungen pro Kunde</small>
          </div>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="filters-section">
        <div class="search-box">
          <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              [(ngModel)]="filters.search"
              placeholder="Nach Namen oder E-Mail suchen..."
              (input)="applyFilters()"
            >
          </div>
        </div>

        <div class="filter-controls">
          <select [(ngModel)]="filters.status" (change)="applyFilters()">
            <option value="all">Alle</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </select>

          <select [(ngModel)]="filters.sortBy" (change)="applyFilters()">
            <option value="name">Name</option>
            <option value="email">E-Mail</option>
            <option value="created_at">Datum</option>
            <option value="total_orders">Bestellungen</option>
          </select>

          <button
            class="btn btn-ghost btn-sm"
            (click)="toggleSortOrder()"
            [title]="filters.sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'"
          >
            <i class="fa-solid" [class]="filters.sortOrder === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
          </button>
        </div>

        <div class="actions">
          <button class="btn btn-ghost btn-sm" (click)="refreshData()">
            <i class="fa-solid fa-rotate"></i>
          </button>
          <button class="btn btn-ghost btn-sm" (click)="exportCustomers()">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="customers-table-container">
        <table class="customers-table">
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Kontakt</th>
              <th>Status</th>
              <th>Bestellungen</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let customer of filteredCustomers" class="customer-row">
              <td class="customer-info">
                <div class="customer-details">
                  <div class="customer-name">{{ customer.name }}</div>
                  <small class="customer-id">ID: {{ customer.id }}</small>
                </div>
              </td>

              <td class="contact-info">
                <div class="customer-email">{{ customer.email }}</div>
                <div class="customer-phone" *ngIf="customer.phone">{{ customer.phone }}</div>
              </td>

              <td class="status-cell">
                <span class="status-badge" [class]="'status-' + (customer.is_active ? 'active' : 'inactive')">
                  {{ customer.is_active ? 'Aktiv' : 'Inaktiv' }}
                </span>
              </td>

              <td class="orders-cell">
                <span class="orders-count">{{ customer.total_orders || 0 }}</span>
              </td>

              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="btn btn-sm action-btn action-btn-view" (click)="viewCustomerDetails(customer)">
                    <i class="fa-solid fa-eye"></i>
                    Details
                  </button>
                  <button class="btn btn-sm action-btn action-btn-orders" (click)="viewCustomerOrders(customer)">
                    <i class="fa-solid fa-list"></i>
                    Bestellungen
                  </button>
                  <button
                    class="btn btn-sm action-btn"
                    [class]="customer.is_active ? 'action-btn-deactivate' : 'action-btn-activate'"
                    (click)="toggleCustomerStatus(customer)"
                  >
                    <i class="fa-solid" [class]="customer.is_active ? 'fa-user-xmark' : 'fa-user-check'"></i>
                    {{ customer.is_active ? 'Deaktivieren' : 'Aktivieren' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="filteredCustomers.length === 0" class="empty-state">
          <h3>Keine Kunden gefunden</h3>
          <p>Versuche andere Filter-Einstellungen oder suche nach einem anderen Begriff.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="btn btn-ghost"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          Zurück
        </button>
        
        <div class="page-numbers">
          <button 
            *ngFor="let page of getPageNumbers()" 
            class="btn btn-sm" 
            [class]="page === currentPage ? 'btn-primary' : 'btn-ghost'"
            (click)="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="btn btn-ghost"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          Weiter
        </button>
      </div>
    </div>
  `,
  styles: [`
    .customer-management-container {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .page-header h1 {
      font-size: var(--text-3xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .page-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Statistics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon i {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
    }

    .stat-content {
      flex: 1;
    }

    .stat-content h3 {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin: 0 0 var(--space-1) 0;
      font-weight: 500;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-subtitle {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    /* Filters Section */
    .filters-section {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      padding: var(--space-4) 0;
    }

    .search-box {
      flex: 1;
      max-width: 300px;
    }

    .search-input-wrapper {
      position: relative;
      width: 100%;
    }

    .search-input-wrapper input {
      width: 100%;
      padding: var(--space-2) var(--space-3) var(--space-2) var(--space-8);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .search-input-wrapper input:focus {
      outline: none;
      border-color: var(--color-primary-500);
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-muted);
      font-size: var(--text-sm);
      pointer-events: none;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .filter-controls select {
      padding: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
      min-width: 100px;
    }

    .filter-controls select:focus {
      outline: none;
      border-color: var(--color-primary-500);
    }

    .actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Clean Table */
    .customers-table-container {
      background: white;
      border: 1px solid #14532d;
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: var(--space-6);
    }

    /* Ensure the table itself has proper border-radius */
    .customers-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .customers-table th {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-weight: 600;
      color: white;
      font-size: var(--text-sm);
      background: #14532d;
      border-bottom: none;
      box-shadow: 0 2px 8px rgba(20, 83, 45, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .customers-table td {
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border);
      vertical-align: middle;
      background: white;
    }

    /* Column alignments */
    .customer-info {
      min-width: 200px;
    }

    .contact-info {
      min-width: 200px;
    }

    .status-cell {
      width: 100px;
      text-align: center;
    }

    .orders-cell {
      width: 100px;
      text-align: center;
    }

    .customer-row:hover {
      background: rgba(22, 163, 74, 0.05);
      border-left: 3px solid #14532d;
    }

    /* Customer Info (flex container) */
    .customer-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }



    .customer-name {
      font-weight: 500;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .customer-id {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .customer-email {
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .customer-phone {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Status Column */
    .status-badge {
      display: inline-flex;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .status-active {
      background: color-mix(in oklab, var(--color-success) 10%, transparent);
      color: var(--color-success);
    }

    .status-inactive {
      background: color-mix(in oklab, var(--color-muted) 10%, transparent);
      color: var(--color-muted);
    }

    /* Date Column */
    .date-cell {
      text-align: center;
    }

    .date {
      font-weight: 500;
      color: var(--color-text);
    }

    .time {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Orders Column */
    .orders-cell {
      text-align: center;
    }

    .orders-count {
      font-weight: 500;
      color: var(--color-primary-600);
      font-size: var(--text-sm);
    }

    .orders-label {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Last Order Column */
    .last-order-cell {
      text-align: center;
    }

    .last-order {
      color: var(--color-text);
    }

    .last-order small {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .no-orders {
      color: var(--color-muted);
      font-style: italic;
      font-size: var(--text-sm);
    }

    /* Actions Column */
    .actions-cell {
      min-width: 180px;
      text-align: center;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: var(--space-2);
    }

    /* Einheitliche Action Button Styles */
    .action-btn {
      min-width: 120px;
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-xs);
      border-radius: var(--radius-md);
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      font-weight: 500;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }

    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .action-btn i {
      font-size: var(--text-xs);
    }

    /* View Button - Dezente blaue Farbe */
    .action-btn-view {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #1565c0;
      border-color: #90caf9;
    }

    .action-btn-view:hover {
      background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
      color: #0d47a1;
    }

    /* Orders Button - Dezente grüne Farbe */
    .action-btn-orders {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      color: #2e7d32;
      border-color: #a5d6a7;
    }

    .action-btn-orders:hover {
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
      color: #1b5e20;
    }

    /* Activate Button - Dezente grüne Farbe für Aktivierung */
    .action-btn-activate {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      color: #2e7d32;
      border-color: #a5d6a7;
    }

    .action-btn-activate:hover {
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
      color: #1b5e20;
    }

    /* Deactivate Button - Dezente orangene Farbe für Deaktivierung */
    .action-btn-deactivate {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      color: #e65100;
      border-color: #ffcc02;
    }

    .action-btn-deactivate:hover {
      background: linear-gradient(135deg, #ffe0b2 0%, #ffcc02 100%);
      color: #bf360c;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-6);
      color: var(--color-muted);
    }



    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }

    .page-numbers {
      display: flex;
      gap: var(--space-1);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .filters-section {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-3);
      }

      .search-box {
        max-width: none;
      }

      .customers-table th,
      .customers-table td {
        padding: var(--space-3);
      }

      /* Auf mittleren Bildschirmen: Buttons horizontal anordnen für bessere Raumnutzung */
      .action-buttons {
        flex-direction: row;
        gap: var(--space-1);
      }

      .action-btn {
        min-width: 100px;
        padding: var(--space-1) var(--space-2);
        font-size: 11px;
      }

      .actions-cell {
        min-width: 320px;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }

      .stat-card {
        padding: var(--space-3);
      }

      .customers-table-container {
        overflow-x: auto;
      }

      .action-buttons {
        flex-direction: column;
        gap: var(--space-2);
      }

      .action-btn {
        min-width: 100px;
        padding: var(--space-1) var(--space-2);
        font-size: 10px;
      }

      .actions-cell {
        min-width: 120px;
      }
    }
  `]
})
export class CustomerManagementComponent implements OnInit {
  private http = inject(HttpClient);

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  
  filters: CustomerFilters = {
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  // Statistics
  totalCustomers = 0;
  activeCustomers = 0;
  newCustomers = 0;
  averageOrders = 0;

  ngOnInit() {
    this.loadCustomers();
    this.loadStatistics();
  }

  async loadCustomers() {
    try {
      // TODO: Replace with actual API call
      const response = await this.http.get<Customer[]>(`${environment.apiUrl}/users?role=customer`).toPromise();
      this.customers = response || [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading customers:', error);
      // Fallback to mock data for development
      this.customers = this.getMockCustomers();
      this.applyFilters();
    }
  }

  async loadStatistics() {
    try {
      // TODO: Replace with actual API call
      const stats = await this.http.get(`${environment.apiUrl}/users/stats`).toPromise();
      // Update statistics based on API response
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Calculate from local data
      this.calculateStatistics();
    }
  }

  applyFilters() {
    let filtered = [...this.customers];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      const isActive = this.filters.status === 'active';
      filtered = filtered.filter(customer => customer.is_active === isActive);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'total_orders':
          aValue = a.total_orders || 0;
          bValue = b.total_orders || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (this.filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredCustomers = filtered;
    this.updatePagination();
  }

  toggleSortOrder() {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  calculateStatistics() {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(c => c.is_active).length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.newCustomers = this.customers.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length;
    
    const totalOrders = this.customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
    this.averageOrders = this.totalCustomers > 0 ? totalOrders / this.totalCustomers : 0;
  }

  // Action Methods
  viewCustomerDetails(customer: Customer) {
    console.log('View customer details:', customer);
    // TODO: Implement customer details modal/page
  }

  viewCustomerOrders(customer: Customer) {
    console.log('View customer orders:', customer);
    // TODO: Implement customer orders view
  }

  async toggleCustomerStatus(customer: Customer) {
    try {
      // TODO: Replace with actual API call
      const response = await this.http.patch(`${environment.apiUrl}/users/${customer.id}`, {
        is_active: !customer.is_active
      }).toPromise();
      
      customer.is_active = !customer.is_active;
      this.calculateStatistics();
    } catch (error) {
      console.error('Error toggling customer status:', error);
      // Revert the change on error
      customer.is_active = !customer.is_active;
    }
  }

  editCustomer(customer: Customer) {
    console.log('Edit customer:', customer);
    // TODO: Implement customer edit modal/form
  }

  exportCustomers() {
    console.log('Export customers to CSV');
    // TODO: Implement CSV export
  }

  refreshData() {
    this.loadCustomers();
    this.loadStatistics();
  }

  // Mock data for development
  private getMockCustomers(): Customer[] {
    return [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 123 456789',
        address: 'Musterstraße 1, 12345 Musterstadt',
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        total_orders: 12,
        last_order_date: '2024-03-20T18:45:00Z'
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49 987 654321',
        address: 'Beispielweg 5, 54321 Beispielort',
        is_active: true,
        created_at: '2024-02-03T14:20:00Z',
        total_orders: 8,
        last_order_date: '2024-03-18T12:15:00Z'
      },
      {
        id: '3',
        name: 'Peter Weber',
        email: 'peter.weber@example.com',
        is_active: false,
        created_at: '2024-01-20T09:15:00Z',
        total_orders: 3,
        last_order_date: '2024-02-28T19:30:00Z'
      },
      {
        id: '4',
        name: 'Lisa Müller',
        email: 'lisa.mueller@example.com',
        phone: '+49 555 123456',
        address: 'Teststraße 10, 67890 Teststadt',
        is_active: true,
        created_at: '2024-03-01T16:45:00Z',
        total_orders: 5,
        last_order_date: '2024-03-19T20:00:00Z'
      },
      {
        id: '5',
        name: 'Thomas Fischer',
        email: 'thomas.fischer@example.com',
        is_active: true,
        created_at: '2024-02-15T11:00:00Z',
        total_orders: 0
      }
    ];
  }
}
