import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NgForOf, AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { AuthService } from '../../core/auth/auth.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-customer-restaurants',
  standalone: true,
  imports: [NgForOf, AsyncPipe, NgIf, ImageFallbackDirective, FormsModule],
  template: `
    <section class="customer-restaurants-section">
      <!-- Hero Header -->
      <div class="hero-header">
        <div class="hero-content">
          <h1 class="hero-title">Essen bestellen im Odenwald</h1>
          <p class="hero-subtitle">Entdecke lokale Restaurants und lass dir dein Lieblingsessen nach Hause liefern</p>
          
          <!-- Navigation -->
          <div class="navigation-section" *ngIf="isLoggedIn$ | async">
            <button class="nav-btn" (click)="goToDashboard()">
              <i class="fa-solid fa-tachometer-alt"></i>
              Mein Dashboard
            </button>
          </div>

          <style>
            .navigation-section {
              display: flex;
              justify-content: center;
              margin-bottom: var(--space-6);
            }

            .nav-btn {
              display: flex;
              align-items: center;
              gap: var(--space-2);
              padding: var(--space-3) var(--space-4);
              background: var(--color-primary-700);
              border: 2px solid var(--color-primary-600);
              border-radius: var(--radius-lg);
              color: white;
              font-weight: 600;
              cursor: pointer;
              transition: all var(--transition);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }

            .nav-btn:hover {
              background: var(--color-primary-800);
              border-color: var(--color-primary-700);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .nav-btn:active {
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
            }

            .nav-btn i {
              color: var(--color-primary);
            }
          </style>

          <!-- Search Section -->
          <div class="search-section">
            <div class="search-container">
              <div class="search-input-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Nach Restaurant oder Küche suchen..."
                  [(ngModel)]="searchTerm"
                  (input)="onSearchChange($event)"
                >
              </div>
              
              <div class="filter-controls">
                <div class="filter-group">
                  <label class="filter-label">Küche</label>
                  <select class="filter-select" [(ngModel)]="cuisineFilter" (change)="onFilterChange()">
                    <option value="">Alle Küchen</option>
                    <option value="german">Deutsche Küche</option>
                    <option value="italian">Italienische Küche</option>
                    <option value="asian">Asiatische Küche</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label class="filter-label">Lieferzeit</label>
                  <select class="filter-select" [(ngModel)]="deliveryTimeFilter" (change)="onFilterChange()">
                    <option value="">Alle Zeiten</option>
                    <option value="30">Bis 30 Min</option>
                    <option value="45">Bis 45 Min</option>
                    <option value="60">Bis 60 Min</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label class="filter-label">Bewertung</label>
                  <select class="filter-select" [(ngModel)]="ratingFilter" (change)="onFilterChange()">
                    <option value="">Alle Bewertungen</option>
                    <option value="4">4+ Sterne</option>
                    <option value="3">3+ Sterne</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <div class="container">
          <div class="results-header">
            <h2 class="results-title">Restaurants in deiner Nähe</h2>
          </div>
          
          <ng-container *ngIf="restaurants$ | async as restaurants; else loading">
            <div class="no-results" *ngIf="restaurants.length === 0">
              <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <!-- Such-Icon für keine Ergebnisse -->
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <circle cx="11" cy="11" r="2" fill="currentColor"/>
              </svg>
              <p>Keine Restaurants gefunden.</p>
            </div>
            
            <div class="restaurants-grid" *ngIf="restaurants.length > 0">
              <div *ngFor="let r of restaurants" class="restaurant-card">
                <div class="card-image-container">
                  <img
                    [src]="r.images.banner || r.images.logo || ''"
                    [alt]="r.name"
                    class="restaurant-image"
                    loading="lazy"
                    appImageFallback
                  >
                  <div class="card-overlay">
                    <div class="verification-badge" *ngIf="r.is_verified">
                      <i class="fa-solid fa-badge-check badge-icon"></i>
                      Verifiziert
                    </div>
                    <button class="view-menu-btn" type="button" (click)="viewMenu(r)">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Speisekarte Icon -->
                        <path d="M8 6h8"/>
                        <path d="M8 10h8"/>
                        <path d="M8 14h8"/>
                        <path d="M8 18h8"/>
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                      </svg>
                      Zur Speisekarte
                    </button>
                  </div>
                </div>
                
                <div class="card-content">
                  <div class="restaurant-header">
                    <h3 class="restaurant-name">{{ r.name }}</h3>
                    <span class="cuisine-badge" *ngIf="r.cuisine_type">{{ r.cuisine_type }}</span>
                  </div>
                  
                  <div class="restaurant-description">
                    <p *ngIf="r.description">{{ r.description }}</p>
                    <span class="slug">{{ r.slug }}</span>
                  </div>
                  
                  <div class="restaurant-metrics">
                    <div class="rating-container">
                      <div class="stars">
                        <i class="fa-solid fa-star star" 
                           *ngFor="let star of [1,2,3,4,5]" 
                           [class.filled]="star <= (r.rating || 0)"></i>
                      </div>
                      <span class="rating-text">{{ r.rating || '–' }}</span>
                      <span class="reviews-count">({{ r.total_reviews || 0 }} Bewertungen)</span>
                    </div>
                    
                                      <div class="delivery-metrics">
                    <div class="metric-item">
                      <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Uhr Icon für Lieferzeit -->
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span>{{ r.delivery_info.estimated_delivery_time_minutes || '–' }} Min</span>
                    </div>
                    <div class="metric-item">
                      <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Euro Icon für Mindestbestellwert -->
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      <span>Min. {{ r.delivery_info.minimum_order_amount || '–' }}€</span>
                    </div>
                    <div class="metric-item">
                      <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Lieferservice Icon -->
                        <path d="M8 19v-9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v9"/>
                        <path d="M6 19h12"/>
                        <circle cx="16" cy="19" r="2"/>
                        <circle cx="8" cy="19" r="2"/>
                        <path d="M10 9h4"/>
                      </svg>
                      <span>{{ r.delivery_info.delivery_fee || '–' }}€ Lieferung</span>
                    </div>
                  </div>
                  </div>
                  
                  <div class="restaurant-actions">
                    <button class="btn btn-primary" type="button" (click)="viewMenu(r)">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Speisekarte Icon -->
                        <path d="M8 6h8"/>
                        <path d="M8 10h8"/>
                        <path d="M8 14h8"/>
                        <path d="M8 18h8"/>
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                      </svg>
                      Speisekarte ansehen
                    </button>
                    <button class="btn btn-ghost" type="button">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <!-- Info Icon -->
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                      </svg>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
          
          <ng-template #loading>
            <div class="loading-state">
              <svg class="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4"/>
                <path d="M12 18v4"/>
                <path d="M4.93 4.93l2.83 2.83"/>
                <path d="M16.24 16.24l2.83 2.83"/>
                <path d="M2 12h4"/>
                <path d="M18 12h4"/>
                <path d="M4.93 19.07l2.83-2.83"/>
                <path d="M16.24 7.76l2.83-2.83"/>
              </svg>
              <p>Lade Restaurants...</p>
            </div>
          </ng-template>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./customer-restaurants.component.scss']
})
export class CustomerRestaurantsComponent implements OnInit, OnDestroy {
  private restaurantsService = inject(RestaurantsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Search and filter properties
  searchTerm = '';
  cuisineFilter = '';
  deliveryTimeFilter = '';
  ratingFilter = '';

  // All restaurants (only verified ones)
  private allRestaurants$: Observable<RestaurantDTO[]> = this.restaurantsService.listWithFilters({
    is_verified: true,
    is_active: true
  });

  // Filtered restaurants (will be set up in ngOnInit for reactivity)
  restaurants$!: Observable<RestaurantDTO[]>;

  isLoggedIn$ = this.authService.currentUser$.pipe(
    map(user => !!user)
  );

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    console.log('CustomerRestaurantsComponent: Initialized');

    // Set up initial restaurants observable
    this.restaurants$ = this.allRestaurants$.pipe(
      map(restaurants => this.filterRestaurants(restaurants))
    );

    // Debug: Subscribe to restaurants observable
    const restaurantsSub = this.restaurants$.subscribe({
      next: (restaurants) => {
        console.log('CustomerRestaurantsComponent: Filtered restaurants:', restaurants.length);
        if (restaurants.length > 0) {
          console.log('Sample restaurant:', restaurants[0]);
        }
      },
      error: (error) => {
        console.error('CustomerRestaurantsComponent: Error loading restaurants:', error);
      }
    });

    // Debug: Subscribe to auth state
    const authSub = this.isLoggedIn$.subscribe(isLoggedIn => {
      console.log('CustomerRestaurantsComponent: User logged in:', isLoggedIn);
    });

    this.subscriptions.push(restaurantsSub, authSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  viewMenu(restaurant: RestaurantDTO) {
    this.router.navigate(['/restaurant', restaurant.id]);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.triggerFilterUpdate();
  }

  onFilterChange() {
    this.triggerFilterUpdate();
  }

  private triggerFilterUpdate() {
    // Create a new observable that will re-emit with current filter values
    this.restaurants$ = this.allRestaurants$.pipe(
      map(restaurants => this.filterRestaurants(restaurants))
    );
  }

  private filterRestaurants(restaurants: RestaurantDTO[]): RestaurantDTO[] {
    return restaurants.filter(restaurant => {
      // Search term filter (name, description, cuisine)
      const matchesSearch = !this.searchTerm ||
        restaurant.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (restaurant.description && restaurant.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (restaurant.cuisine_type && restaurant.cuisine_type.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Cuisine filter
      const matchesCuisine = !this.cuisineFilter ||
        restaurant.cuisine_type?.toLowerCase() === this.cuisineFilter.toLowerCase();

      // Delivery time filter
      const matchesDeliveryTime = !this.deliveryTimeFilter ||
        (restaurant.delivery_info?.estimated_delivery_time_minutes &&
         restaurant.delivery_info.estimated_delivery_time_minutes <= parseInt(this.deliveryTimeFilter));

      // Rating filter
      const matchesRating = !this.ratingFilter ||
        (restaurant.rating && restaurant.rating >= parseInt(this.ratingFilter));

      return matchesSearch && matchesCuisine && matchesDeliveryTime && matchesRating;
    });
  }
}


