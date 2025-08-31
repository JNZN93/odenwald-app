import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_type: 'car' | 'motorcycle' | 'bicycle' | 'scooter';
  vehicle_info: string;
  license_plate?: string;
  is_active: boolean;
  current_status: 'available' | 'busy' | 'offline' | 'on_delivery';
  current_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  joined_date: string;
  last_active: string;
}

export interface DriverFilters {
  search: string;
  status: 'all' | 'available' | 'busy' | 'offline' | 'on_delivery';
  vehicle_type: 'all' | 'car' | 'motorcycle' | 'bicycle' | 'scooter';
  is_active: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'rating' | 'total_deliveries' | 'joined_date';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-drivers-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="drivers-admin-container">
      <!-- Header -->
      <div class="page-header">
        <h1><i class="fa-solid fa-truck"></i> Fahrerverwaltung</h1>
        <p>Verwalte alle Fahrer der Plattform</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-truck"></i>
          <div class="stat-content">
            <h3>Gesamt Fahrer</h3>
            <div class="stat-value">{{ totalDrivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-check-circle"></i>
          <div class="stat-content">
            <h3>Verfügbare Fahrer</h3>
            <div class="stat-value">{{ availableDrivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-clock"></i>
          <div class="stat-content">
            <h3>In Lieferung</h3>
            <div class="stat-value">{{ deliveringDrivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="stat-icon fa-solid fa-star"></i>
          <div class="stat-content">
            <h3>Durchschnittsbewertung</h3>
            <div class="stat-value">{{ averageRating | number:'1.1-1' }}/5</div>
          </div>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="filters-section">
        <div class="search-filters">
          <div class="search-box">
            <i class="fa-solid fa-search"></i>
            <input 
              type="text" 
              [(ngModel)]="filters.search" 
              placeholder="Nach Namen, E-Mail oder Fahrzeug suchen..."
              (input)="applyFilters()"
            >
          </div>
          
          <div class="filter-controls">
            <select [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="all">Alle Status</option>
              <option value="available">Verfügbar</option>
              <option value="busy">Beschäftigt</option>
              <option value="offline">Offline</option>
              <option value="on_delivery">In Lieferung</option>
            </select>
            
            <select [(ngModel)]="filters.vehicle_type" (change)="applyFilters()">
              <option value="all">Alle Fahrzeugtypen</option>
              <option value="car">Auto</option>
              <option value="motorcycle">Motorrad</option>
              <option value="bicycle">Fahrrad</option>
              <option value="scooter">Roller</option>
            </select>
            
            <select [(ngModel)]="filters.is_active" (change)="applyFilters()">
              <option value="all">Alle Fahrer</option>
              <option value="active">Nur aktive</option>
              <option value="inactive">Nur inaktive</option>
            </select>
            
            <select [(ngModel)]="filters.sortBy" (change)="applyFilters()">
              <option value="name">Nach Name sortieren</option>
              <option value="rating">Nach Bewertung sortieren</option>
              <option value="total_deliveries">Nach Lieferungen sortieren</option>
              <option value="joined_date">Nach Beitrittsdatum sortieren</option>
            </select>
            
            <button 
              class="btn btn-ghost" 
              (click)="toggleSortOrder()"
              [title]="filters.sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'"
            >
              <i class="fa-solid" [ngClass]="filters.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
            </button>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn-primary" (click)="addDriver()">
            <i class="fa-solid fa-plus"></i>
            Neuer Fahrer
          </button>
          <button class="btn btn-success" (click)="exportDrivers()">
            <i class="fa-solid fa-download"></i>
            Export CSV
          </button>
          <button class="btn btn-ghost" (click)="refreshData()">
            <i class="fa-solid fa-refresh"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      <!-- Drivers Table -->
      <div class="drivers-table-container">
        <table class="drivers-table">
          <thead>
            <tr>
              <th>Fahrer</th>
              <th>Fahrzeug</th>
              <th>Status</th>
              <th>Standort</th>
              <th>Bewertung</th>
              <th>Lieferungen</th>
              <th>Verdienst</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let driver of filteredDrivers" class="driver-row">
              <td class="driver-info">
                <div class="driver-avatar">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="driver-details">
                  <h4>{{ driver.name }}</h4>
                  <div class="driver-contact">
                    <span class="email">{{ driver.email }}</span>
                    <span class="phone">{{ driver.phone }}</span>
                  </div>
                  <small class="driver-id">ID: {{ driver.id }}</small>
                </div>
              </td>
              
              <td class="vehicle-info">
                <div class="vehicle-type">
                  <i class="fa-solid" [ngClass]="getVehicleIcon(driver.vehicle_type)"></i>
                  {{ getVehicleTypeLabel(driver.vehicle_type) }}
                </div>
                <div class="vehicle-details">
                  <span class="vehicle-model">{{ driver.vehicle_info }}</span>
                  <span *ngIf="driver.license_plate" class="license-plate">
                    {{ driver.license_plate }}
                  </span>
                </div>
              </td>
              
              <td class="status-cell">
                <span class="status-badge" [class]="'status-' + driver.current_status">
                  <i class="fa-solid" [ngClass]="getStatusIcon(driver.current_status)"></i>
                  {{ getStatusLabel(driver.current_status) }}
                </span>
                <div class="active-status" [class]="'status-' + (driver.is_active ? 'active' : 'inactive')">
                  {{ driver.is_active ? 'Aktiv' : 'Inaktiv' }}
                </div>
              </td>
              
              <td class="location-cell">
                <div *ngIf="driver.current_location; else noLocation" class="location-info">
                  <i class="fa-solid fa-location-dot"></i>
                  <span class="location-address">{{ driver.current_location.address }}</span>
                </div>
                <ng-template #noLocation>
                  <span class="no-location">Kein Standort verfügbar</span>
                </ng-template>
              </td>
              
              <td class="rating-cell">
                <div class="rating-stars">
                  <i 
                    *ngFor="let star of [1,2,3,4,5]" 
                    class="fa-solid"
                    [ngClass]="star <= driver.rating ? 'fa-star' : 'fa-regular fa-star'"
                  ></i>
                </div>
                <div class="rating-value">{{ driver.rating | number:'1.1-1' }}/5</div>
              </td>
              
              <td class="deliveries-cell">
                <div class="deliveries-count">{{ driver.total_deliveries }}</div>
                <small class="deliveries-label">Lieferungen</small>
              </td>
              
              <td class="earnings-cell">
                <div class="earnings-amount">{{ driver.total_earnings }}€</div>
                <small class="earnings-label">Gesamt</small>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-ghost" 
                    (click)="viewDriverDetails(driver)"
                    title="Fahrer-Details anzeigen"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  
                  <button 
                    class="btn btn-sm btn-ghost" 
                    (click)="viewDriverLocation(driver)"
                    title="Standort anzeigen"
                  >
                    <i class="fa-solid fa-map"></i>
                  </button>
                  
                  <button 
                    class="btn btn-sm btn-ghost" 
                    (click)="viewDriverHistory(driver)"
                    title="Lieferverlauf anzeigen"
                  >
                    <i class="fa-solid fa-history"></i>
                  </button>
                  
                  <button 
                    class="btn btn-sm" 
                    [class]="driver.is_active ? 'btn-warning' : 'btn-success'"
                    (click)="toggleDriverStatus(driver)"
                    [title]="driver.is_active ? 'Fahrer deaktivieren' : 'Fahrer aktivieren'"
                  >
                    <i class="fa-solid" [ngClass]="driver.is_active ? 'fa-user-slash' : 'fa-user-check'"></i>
                  </button>
                  
                  <button 
                    class="btn btn-sm btn-ghost" 
                    (click)="editDriver(driver)"
                    title="Fahrer bearbeiten"
                  >
                    <i class="fa-solid fa-edit"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty State -->
        <div *ngIf="filteredDrivers.length === 0" class="empty-state">
          <i class="fa-solid fa-truck"></i>
          <h3>Keine Fahrer gefunden</h3>
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
          <i class="fa-solid fa-chevron-left"></i>
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
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .drivers-admin-container {
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-300);
    }

    .stat-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
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
    }

    /* Filters Section */
    .filters-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .search-filters {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      min-width: 300px;
    }

    .search-box i {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-muted);
    }

    .search-box input {
      width: 100%;
      padding: var(--space-3) var(--space-3) var(--space-3) var(--space-10);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-md);
      transition: all var(--transition);
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .filter-controls select {
      padding: var(--space-2) var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .filter-controls select:focus {
      outline: none;
      border-color: var(--color-primary-500);
    }

    .actions {
      display: flex;
      gap: var(--space-3);
    }

    /* Table */
    .drivers-table-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
    }

    .drivers-table {
      width: 100%;
      border-collapse: collapse;
    }

    .drivers-table th {
      background: var(--bg-light-green);
      padding: var(--space-4) var(--space-3);
      text-align: left;
      font-weight: 600;
      color: var(--color-heading);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--text-sm);
    }

    .drivers-table td {
      padding: var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    .driver-row:hover {
      background: var(--bg-light-green);
    }

    /* Driver Info Column */
    .driver-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .driver-avatar {
      width: 50px;
      height: 50px;
      background: var(--color-primary-100);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-600);
      font-size: 1.5rem;
    }

    .driver-details h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-md);
    }

    .driver-contact {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-bottom: var(--space-1);
    }

    .email, .phone {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .driver-id {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Vehicle Info Column */
    .vehicle-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .vehicle-type {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 500;
      color: var(--color-text);
    }

    .vehicle-type i {
      color: var(--color-primary-500);
    }

    .vehicle-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .vehicle-model {
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .license-plate {
      background: var(--bg-light-green);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      color: var(--color-muted);
      font-family: monospace;
    }

    /* Status Column */
    .status-cell {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .status-available { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-busy { background: color-mix(in oklab, #f59e0b 15%, white); color: #d97706; }
    .status-offline { background: color-mix(in oklab, #6b7280 15%, white); color: #4b5563; }
    .status-on_delivery { background: color-mix(in oklab, #3b82f6 15%, white); color: #2563eb; }

    .active-status {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      text-align: center;
      font-weight: 500;
    }

    .status-active { background: color-mix(in oklab, #10b981 15%, white); color: #059669; }
    .status-inactive { background: color-mix(in oklab, #ef4444 15%, white); color: #dc2626; }

    /* Location Column */
    .location-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .location-info i {
      color: var(--color-primary-500);
    }

    .location-address {
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .no-location {
      color: var(--color-muted);
      font-style: italic;
      font-size: var(--text-sm);
    }

    /* Rating Column */
    .rating-cell {
      text-align: center;
    }

    .rating-stars {
      display: flex;
      justify-content: center;
      gap: var(--space-1);
      margin-bottom: var(--space-1);
    }

    .rating-stars i {
      color: #fbbf24;
      font-size: var(--text-sm);
    }

    .rating-value {
      font-weight: 600;
      color: var(--color-text);
    }

    /* Deliveries Column */
    .deliveries-cell {
      text-align: center;
    }

    .deliveries-count {
      font-weight: 700;
      color: var(--color-primary-600);
      font-size: var(--text-lg);
    }

    .deliveries-label {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Earnings Column */
    .earnings-cell {
      text-align: center;
    }

    .earnings-amount {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .earnings-label {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    /* Actions Column */
    .action-buttons {
      display: flex;
      gap: var(--space-1);
    }

    .btn-sm {
      padding: var(--space-2);
      font-size: var(--text-sm);
      min-width: 32px;
      height: 32px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-6);
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
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
      }

      .search-filters {
        justify-content: center;
      }

      .search-box {
        min-width: auto;
        width: 100%;
      }

      .drivers-table {
        font-size: var(--text-sm);
      }

      .drivers-table th,
      .drivers-table td {
        padding: var(--space-3) var(--space-2);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .drivers-table-container {
        overflow-x: auto;
      }

      .action-buttons {
        flex-direction: column;
        gap: var(--space-1);
      }
    }
  `]
})
export class DriversAdminComponent implements OnInit {
  private http = inject(HttpClient);

  drivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  
  filters: DriverFilters = {
    search: '',
    status: 'all',
    vehicle_type: 'all',
    is_active: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  // Statistics
  totalDrivers = 0;
  availableDrivers = 0;
  deliveringDrivers = 0;
  averageRating = 0;

  ngOnInit() {
    this.loadDrivers();
    this.loadStatistics();
  }

  async loadDrivers() {
    try {
      // TODO: Replace with actual API call
      const response = await this.http.get<Driver[]>(`${environment.apiUrl}/drivers`).toPromise();
      this.drivers = response || [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading drivers:', error);
      // Fallback to mock data for development
      this.drivers = this.getMockDrivers();
      this.applyFilters();
    }
  }

  async loadStatistics() {
    try {
      // TODO: Replace with actual API call
      const stats = await this.http.get(`${environment.apiUrl}/drivers/stats`).toPromise();
      // Update statistics based on API response
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Calculate from local data
      this.calculateStatistics();
    }
  }

  applyFilters() {
    let filtered = [...this.drivers];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(driver => 
        driver.name.toLowerCase().includes(search) ||
        driver.email.toLowerCase().includes(search) ||
        driver.vehicle_info.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(driver => driver.current_status === this.filters.status);
    }

    // Vehicle type filter
    if (this.filters.vehicle_type !== 'all') {
      filtered = filtered.filter(driver => driver.vehicle_type === this.filters.vehicle_type);
    }

    // Active status filter
    if (this.filters.is_active !== 'all') {
      const isActive = this.filters.is_active === 'active';
      filtered = filtered.filter(driver => driver.is_active === isActive);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'total_deliveries':
          aValue = a.total_deliveries;
          bValue = b.total_deliveries;
          break;
        case 'joined_date':
          aValue = new Date(a.joined_date);
          bValue = new Date(b.joined_date);
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

    this.filteredDrivers = filtered;
    this.updatePagination();
  }

  toggleSortOrder() {
    this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredDrivers.length / this.itemsPerPage);
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
    this.totalDrivers = this.drivers.length;
    this.availableDrivers = this.drivers.filter(d => d.current_status === 'available').length;
    this.deliveringDrivers = this.drivers.filter(d => d.current_status === 'on_delivery').length;
    
    const totalRating = this.drivers.reduce((sum, d) => sum + d.rating, 0);
    this.averageRating = this.totalDrivers > 0 ? totalRating / this.totalDrivers : 0;
  }

  getVehicleTypeLabel(type: Driver['vehicle_type']): string {
    const labels = {
      car: 'Auto',
      motorcycle: 'Motorrad',
      bicycle: 'Fahrrad',
      scooter: 'Roller'
    };
    return labels[type];
  }

  getVehicleIcon(type: Driver['vehicle_type']): string {
    const icons = {
      car: 'fa-car',
      motorcycle: 'fa-motorcycle',
      bicycle: 'fa-bicycle',
      scooter: 'fa-scooter'
    };
    return icons[type];
  }

  getStatusLabel(status: Driver['current_status']): string {
    const labels = {
      available: 'Verfügbar',
      busy: 'Beschäftigt',
      offline: 'Offline',
      on_delivery: 'In Lieferung'
    };
    return labels[status];
  }

  getStatusIcon(status: Driver['current_status']): string {
    const icons = {
      available: 'fa-check-circle',
      busy: 'fa-clock',
      offline: 'fa-power-off',
      on_delivery: 'fa-truck'
    };
    return icons[status];
  }

  // Action Methods
  addDriver() {
    console.log('Add new driver');
    // TODO: Implement add driver modal/form
  }

  viewDriverDetails(driver: Driver) {
    console.log('View driver details:', driver);
    // TODO: Implement driver details modal/page
  }

  viewDriverLocation(driver: Driver) {
    console.log('View driver location:', driver);
    // TODO: Implement location map view
  }

  viewDriverHistory(driver: Driver) {
    console.log('View driver history:', driver);
    // TODO: Implement delivery history view
  }

  async toggleDriverStatus(driver: Driver) {
    try {
      // TODO: Replace with actual API call
      const response = await this.http.patch(`${environment.apiUrl}/drivers/${driver.id}`, {
        is_active: !driver.is_active
      }).toPromise();
      
      driver.is_active = !driver.is_active;
      this.calculateStatistics();
    } catch (error) {
      console.error('Error toggling driver status:', error);
      // Revert the change on error
      driver.is_active = !driver.is_active;
    }
  }

  editDriver(driver: Driver) {
    console.log('Edit driver:', driver);
    // TODO: Implement driver edit modal/form
  }

  exportDrivers() {
    console.log('Export drivers to CSV');
    // TODO: Implement CSV export
  }

  refreshData() {
    this.loadDrivers();
    this.loadStatistics();
  }

  // Mock data for development
  private getMockDrivers(): Driver[] {
    return [
      {
        id: 'DRV001',
        name: 'Hans Müller',
        email: 'hans.mueller@example.com',
        phone: '+49 123 456789',
        vehicle_type: 'car',
        vehicle_info: 'VW Golf',
        license_plate: 'M-AB 1234',
        is_active: true,
        current_status: 'available',
        current_location: {
          lat: 48.1351,
          lng: 11.5820,
          address: 'Marienplatz 1, 80331 München'
        },
        rating: 4.8,
        total_deliveries: 156,
        total_earnings: 2340.50,
        joined_date: '2024-01-15T10:30:00Z',
        last_active: '2025-08-27T19:30:00Z'
      },
      {
        id: 'DRV002',
        name: 'Lisa Schmidt',
        email: 'lisa.schmidt@example.com',
        phone: '+49 987 654321',
        vehicle_type: 'motorcycle',
        vehicle_info: 'Honda CB500F',
        is_active: true,
        current_status: 'on_delivery',
        current_location: {
          lat: 48.1351,
          lng: 11.5820,
          address: 'Sendlinger Str. 15, 80331 München'
        },
        rating: 4.9,
        total_deliveries: 89,
        total_earnings: 1567.80,
        joined_date: '2024-03-01T14:20:00Z',
        last_active: '2025-08-27T19:25:00Z'
      }
    ];
  }
}
