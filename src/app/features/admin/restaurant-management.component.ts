import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { environment } from '../../../environments/environment';

export interface RestaurantManagementStats {
  total: number;
  active: number;
  inactive: number;
  pending_registration: number;
  approved_registration: number;
}

@Component({
  selector: 'app-restaurant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageFallbackDirective],
  template: `
    <div class="restaurant-management-container">
      <!-- Header -->
      <div class="management-header">
        <h1><i class="fa-solid fa-store"></i> Restaurant-Verwaltung</h1>
        <p>Verwalte alle Restaurants in der Plattform</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-store"></i>
          </div>
          <div class="stat-content">
            <h3>Gesamt Restaurants</h3>
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-change">Alle Restaurants</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Aktive Restaurants</h3>
            <div class="stat-value">{{ stats.active }}</div>
            <div class="stat-change success">Online</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-pause-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Inaktive Restaurants</h3>
            <div class="stat-value">{{ stats.inactive }}</div>
            <div class="stat-change warning">Offline</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>Ausstehende Registrierungen</h3>
            <div class="stat-value">{{ stats.pending_registration }}</div>
            <div class="stat-change danger">Zu prüfen</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter" [(ngModel)]="selectedStatus" (change)="applyFilters()">
              <option value="all">Alle</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="search-filter">Suchen:</label>
            <input
              id="search-filter"
              type="text"
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              placeholder="Restaurant-Name, Küche..."
            >
          </div>

          <div class="filter-group">
            <label for="sort-filter">Sortieren:</label>
            <select id="sort-filter" [(ngModel)]="sortBy" (change)="applyFilters()">
              <option value="name">Nach Name</option>
              <option value="created_at">Nach Erstellungsdatum</option>
              <option value="rating">Nach Bewertung</option>
              <option value="status">Nach Status</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Restaurants List -->
      <div class="restaurants-section">
        <div class="restaurants-header">
          <h2>{{ filteredRestaurants.length }} Restaurant{{ filteredRestaurants.length !== 1 ? 's' : '' }} gefunden</h2>
          <button class="add-btn" (click)="addRestaurant()">
            <i class="fa-solid fa-plus"></i>
            <span>Restaurant hinzufügen</span>
          </button>
        </div>

        <div class="restaurants-list">
          <div *ngFor="let restaurant of filteredRestaurants" class="restaurant-card">
            <div class="restaurant-header">
              <div class="restaurant-info">
                <div class="restaurant-name">{{ restaurant.name }}</div>
                <div class="restaurant-cuisine">{{ restaurant.cuisine_type }}</div>
                <div class="restaurant-location">
                  {{ restaurant.address.city }}, {{ restaurant.address.street }}
                </div>
              </div>
              <div class="restaurant-status">
                <span [ngClass]="getStatusClass(restaurant)" class="status-badge">
                  {{ getStatusText(restaurant) }}
                </span>
              </div>
            </div>

            <div class="restaurant-content">
              <div class="restaurant-details">
                <div class="detail-item">
                  <strong>Bewertung:</strong> 
                  <span class="rating">
                    <i class="fa-solid fa-star"></i>
                    {{ restaurant.rating || 'Keine' }}
                  </span>
                </div>
                <div class="detail-item">
                  <strong>Erstellt:</strong> {{ formatDate(restaurant.created_at) }}
                </div>
                <div class="detail-item">
                  <strong>Besitzer:</strong> {{ restaurant.owner_name || 'Unbekannt' }}
                </div>
                <div class="detail-item">
                  <strong>E-Mail:</strong> {{ restaurant.owner_email || 'Keine' }}
                </div>
              </div>

              <div class="restaurant-image">
                <img 
                  [src]="restaurant.images.banner || restaurant.images.logo || ''" 
                  [alt]="restaurant.name"
                  appImageFallback
                >
              </div>
            </div>

            <div class="restaurant-actions">
              <button
                class="btn-details"
                (click)="showDetails(restaurant)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-eye"></i>
                Details
              </button>

              <button
                class="btn-toggle-status"
                (click)="toggleStatus(restaurant)"
                [disabled]="loading"
                [class]="restaurant.is_active ? 'btn-deactivate' : 'btn-activate'"
              >
                <i class="fa-solid" [ngClass]="restaurant.is_active ? 'fa-pause' : 'fa-play'"></i>
                {{ restaurant.is_active ? 'Deaktivieren' : 'Aktivieren' }}
              </button>

              <button
                class="btn-edit"
                (click)="editRestaurant(restaurant)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-edit"></i>
                Bearbeiten
              </button>

              <button
                class="btn-delete"
                (click)="deleteRestaurant(restaurant)"
                [disabled]="loading"
              >
                <i class="fa-solid fa-trash"></i>
                Löschen
              </button>
            </div>
          </div>

          <div *ngIf="filteredRestaurants.length === 0" class="empty-state">
            <i class="fa-solid fa-store"></i>
            <h3>Keine Restaurants gefunden</h3>
            <p>Es gibt keine Restaurants mit den aktuellen Filtern.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restaurant-management-container {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .management-header {
      text-align: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .management-header h1 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-2xl);
    }

    .management-header p {
      margin: var(--space-1) 0 0 0;
      color: var(--color-muted);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      font-size: var(--text-xl);
      color: var(--color-primary-500);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content {
      flex: 1;
    }

    .stat-content h3 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: bold;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-change {
      font-size: var(--text-xs);
      font-weight: bold;
    }

    .stat-change.success {
      color: var(--color-success);
    }

    .stat-change.warning {
      color: var(--color-warning);
    }

    .stat-change.danger {
      color: var(--color-danger);
    }

    .filters-section {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .filter-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-heading);
    }

    .filter-group select,
    .filter-group input {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .restaurants-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .restaurants-header {
      padding: var(--space-4) var(--space-6);
      background: var(--bg-light);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .restaurants-header h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .add-btn {
      background: var(--color-primary-600);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 600;
      font-size: var(--text-sm);
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .add-btn:hover {
      background: var(--color-primary-700);
    }

    .restaurants-list {
      padding: var(--space-4) var(--space-6);
    }

    .restaurant-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      background: var(--color-surface);
      transition: all var(--transition);
    }

    .restaurant-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary-200);
    }

    .restaurant-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .restaurant-name {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-lg);
      margin-bottom: var(--space-1);
    }

    .restaurant-cuisine {
      color: var(--color-primary);
      font-weight: 500;
      margin-bottom: var(--space-1);
    }

    .restaurant-location {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .restaurant-status .status-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.active {
      background: var(--color-success-light);
      color: var(--color-success-dark);
    }

    .status-badge.inactive {
      background: var(--color-warning-light);
      color: var(--color-warning-dark);
    }

    .status-badge.pending {
      background: var(--color-danger-light);
      color: var(--color-danger-dark);
    }

    .restaurant-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .restaurant-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2);
      background: var(--bg-light);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .detail-item strong {
      color: var(--color-heading);
    }

    .rating {
      color: #f59e0b;
      font-weight: 600;
    }

    .restaurant-image {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .restaurant-image img {
      width: 120px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--radius-md);
    }

    .restaurant-actions {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    .btn-details,
    .btn-toggle-status,
    .btn-edit,
    .btn-delete {
      padding: var(--space-2) var(--space-4);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-details {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-details:hover:not(:disabled) {
      background: var(--bg-light-hover);
    }

    .btn-activate {
      background: var(--color-success);
      color: white;
    }

    .btn-activate:hover:not(:disabled) {
      background: var(--color-success-dark);
    }

    .btn-deactivate {
      background: var(--color-warning);
      color: white;
    }

    .btn-deactivate:hover:not(:disabled) {
      background: var(--color-warning-dark);
    }

    .btn-edit {
      background: var(--color-primary-600);
      color: white;
    }

    .btn-edit:hover:not(:disabled) {
      background: var(--color-primary-700);
    }

    .btn-delete {
      background: var(--color-danger);
      color: white;
    }

    .btn-delete:hover:not(:disabled) {
      background: var(--color-danger-dark);
    }

    .btn-details:disabled,
    .btn-toggle-status:disabled,
    .btn-edit:disabled,
    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8);
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: var(--text-4xl);
      margin-bottom: var(--space-4);
      display: block;
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    @media (max-width: 768px) {
      .restaurant-management-container {
        padding: var(--space-4);
      }

      .restaurants-header {
        flex-direction: column;
        gap: var(--space-4);
        align-items: flex-start;
      }

      .restaurant-content {
        grid-template-columns: 1fr;
      }

      .restaurant-actions {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RestaurantManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private restaurantsService = inject(RestaurantsService);

  restaurants: RestaurantDTO[] = [];
  filteredRestaurants: RestaurantDTO[] = [];
  stats: RestaurantManagementStats | null = null;
  loading = false;

  // Filters
  selectedStatus = 'all';
  searchTerm = '';
  sortBy = 'name';

  ngOnInit() {
    this.loadRestaurants();
    this.loadStats();
  }

  loadRestaurants() {
    this.loading = true;
    this.restaurantsService.list().subscribe({
      next: (restaurants) => {
        this.restaurants = restaurants;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
        this.loading = false;
      }
    });
  }

  loadStats() {
    // Calculate stats from restaurants data
    const stats: RestaurantManagementStats = {
      total: this.restaurants.length,
      active: this.restaurants.filter(r => r.is_active).length,
      inactive: this.restaurants.filter(r => !r.is_active).length,
      pending_registration: this.restaurants.filter(r => r.registration_status === 'pending').length,
      approved_registration: this.restaurants.filter(r => r.registration_status === 'approved').length
    };
    this.stats = stats;
  }

  applyFilters() {
    let filtered = [...this.restaurants];

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(restaurant => {
        switch (this.selectedStatus) {
          case 'active':
            return restaurant.is_active;
          case 'inactive':
            return !restaurant.is_active;
          case 'pending':
            return restaurant.registration_status === 'pending';
          default:
            return true;
        }
      });
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.cuisine_type.toLowerCase().includes(term) ||
        restaurant.address.city.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'status':
          return a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1;
        default:
          return 0;
      }
    });

    this.filteredRestaurants = filtered;
  }

  getStatusClass(restaurant: RestaurantDTO): string {
    if (restaurant.registration_status === 'pending') {
      return 'pending';
    }
    return restaurant.is_active ? 'active' : 'inactive';
  }

  getStatusText(restaurant: RestaurantDTO): string {
    if (restaurant.registration_status === 'pending') {
      return 'Ausstehend';
    }
    return restaurant.is_active ? 'Aktiv' : 'Inaktiv';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  showDetails(restaurant: RestaurantDTO) {
    // TODO: Implement restaurant details modal
    console.log('Show details for restaurant:', restaurant);
  }

  toggleStatus(restaurant: RestaurantDTO) {
    if (confirm(`Möchten Sie das Restaurant "${restaurant.name}" ${restaurant.is_active ? 'deaktivieren' : 'aktivieren'}?`)) {
      this.loading = true;
      this.restaurantsService.toggleActive(restaurant.id).subscribe({
        next: () => {
          restaurant.is_active = !restaurant.is_active;
          this.applyFilters();
          this.loadStats();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error toggling restaurant status:', error);
          this.loading = false;
        }
      });
    }
  }

  editRestaurant(restaurant: RestaurantDTO) {
    // TODO: Implement restaurant edit modal
    console.log('Edit restaurant:', restaurant);
  }

  deleteRestaurant(restaurant: RestaurantDTO) {
    if (confirm(`Möchten Sie das Restaurant "${restaurant.name}" wirklich löschen?`)) {
      this.loading = true;
      this.restaurantsService.delete(restaurant.id).subscribe({
        next: () => {
          this.restaurants = this.restaurants.filter(r => r.id !== restaurant.id);
          this.applyFilters();
          this.loadStats();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error deleting restaurant:', error);
          this.loading = false;
        }
      });
    }
  }

  addRestaurant() {
    // TODO: Implement add restaurant modal
    console.log('Add new restaurant');
  }
}
