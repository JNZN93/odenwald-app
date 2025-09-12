import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NgForOf, AsyncPipe, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { AuthService } from '../../core/auth/auth.service';
import { GeocodingService, GeocodeResult } from '../../core/services/geocoding.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable, Subscription, combineLatest, BehaviorSubject, of } from 'rxjs';
import { from } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-customer-restaurants',
  standalone: true,
  imports: [NgForOf, AsyncPipe, NgIf, ImageFallbackDirective, FormsModule, DatePipe],
  template: `
    <section class="customer-restaurants-section">
      <!-- Hero Header -->
      <div class="hero-header">
        <!-- Compact Location Bar (when coordinates exist) -->
        <div class="compact-location-bar" *ngIf="userCoordinates && isCompactMode">
          <div class="location-info">
            <i class="fa-solid fa-map-marker-alt location-icon"></i>
            <span class="location-text">{{ formattedAddress || deliveryAddress }}</span>
          </div>
          <button class="change-address-btn" (click)="clearAddress()" type="button">
            <i class="fa-solid fa-edit"></i>
            Adresse ändern
          </button>
        </div>

        <!-- Full Hero Content (when no coordinates or not compact mode) -->
        <div class="hero-content" *ngIf="!userCoordinates || !isCompactMode">
          <h1 class="hero-title" *ngIf="!isCompactMode">Essen bestellen im Odenwald</h1>
          <p class="hero-subtitle" *ngIf="!isCompactMode">Entdecke lokale Restaurants und lass dir dein Lieblingsessen nach Hause liefern</p>

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

          <!-- Address Input Section -->
          <div class="address-section" *ngIf="showAddressInput">
            <div class="address-container">
              <h2 class="address-title" *ngIf="!isCompactMode">Wo möchtest du bestellen?</h2>
              <div class="address-input-wrapper">
                <i class="fa-solid fa-location-dot address-icon"></i>
                <input
                  type="text"
                  class="address-input"
                  placeholder="Gib deine Lieferadresse ein (z.B. Hauptstr. 123, 10115 Berlin)"
                  [(ngModel)]="deliveryAddress"
                  (keydown.enter)="onAddressSubmit()"
                  [disabled]="isGeocoding"
                  autofocus
                >
                <button
                  class="address-submit-btn"
                  (click)="onAddressSubmit()"
                  [disabled]="!deliveryAddress || isGeocoding"
                  type="button"
                >
                  <i class="fa-solid fa-magnifying-glass" *ngIf="!isGeocoding"></i>
                  <i class="fa-solid fa-spinner fa-spin" *ngIf="isGeocoding"></i>
                  Restaurants suchen
                </button>
              </div>

              <div class="address-examples">
                <div class="examples-list">
                  <button class="example-btn current-location-btn" (click)="useCurrentLocation()" [disabled]="isGettingLocation" type="button">
                    <i class="fa-solid fa-location-crosshairs" *ngIf="!isGettingLocation"></i>
                    <i class="fa-solid fa-spinner fa-spin" *ngIf="isGettingLocation"></i>
                    {{ isGettingLocation ? 'Standort wird ermittelt...' : 'Meinen aktuellen Standort verwenden' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Location Bar -->
          <div class="current-location-bar" *ngIf="userCoordinates && !isCompactMode">
            <div class="location-info">
              <i class="fa-solid fa-map-marker-alt location-icon"></i>
              <span class="location-text">{{ formattedAddress || deliveryAddress }}</span>
            </div>
            <button class="change-address-btn" (click)="clearAddress()" type="button">
              <i class="fa-solid fa-edit"></i>
              Adresse ändern
            </button>
          </div>
        </div>
      </div>


      <!-- Results Section -->
      <div class="results-section" *ngIf="userCoordinates">
        <div class="container">
          <div class="results-header">
            <h2 class="results-title" *ngIf="!isMobileOrTablet()">Restaurants in deiner Nähe</h2>
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
                    <button class="rating-container" type="button" (click)="openReviews(r)">
                      <div class="stars">
                        <i class="fa-solid fa-star star"
                           *ngFor="let star of [1,2,3,4,5]"
                           [class.filled]="star <= (r.rating || 0)"
                           [class.half]="star - 0.5 <= (r.rating || 0) && star > (r.rating || 0)"></i>
                      </div>
                      <div class="rating-info">
                        <div class="rating-score">{{ (+(r.rating || 0)).toFixed(1) }}</div>
                        <div class="rating-details">{{ r.total_reviews || 0 }} Bewertungen</div>
                      </div>
                      <i class="fa-solid fa-chevron-right rating-arrow"></i>
                    </button>
                    
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

    <!-- Reviews Modal -->
    <div class="reviews-modal-backdrop" *ngIf="reviewsModalOpen" (click)="closeReviews()"></div>
    <div class="reviews-modal" *ngIf="reviewsModalOpen" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title-section">
          <h3>Bewertungen & Rezensionen</h3>
          <div class="restaurant-info">
            <span class="restaurant-name">{{ activeRestaurant?.name }}</span>
            <span class="cuisine-badge" *ngIf="activeRestaurant?.cuisine_type">{{ activeRestaurant?.cuisine_type }}</span>
          </div>
        </div>
        <button class="close-btn" (click)="closeReviews()" type="button">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>

      <div class="modal-content" *ngIf="reviewsSummary && reviewsList">
        <!-- Overall Rating Summary -->
        <div class="rating-summary">
          <div class="overall-rating">
            <div class="rating-score">{{ (+(reviewsSummary?.average_rating || 0)).toFixed(1) }}</div>
            <div class="rating-stars">
              <i class="fa-solid fa-star star"
                 *ngFor="let star of [1,2,3,4,5]"
                 [class.filled]="star <= (reviewsSummary?.average_rating || 0)"
                 [class.half]="star - 0.5 <= (reviewsSummary?.average_rating || 0) && star > (reviewsSummary?.average_rating || 0)"></i>
            </div>
            <div class="rating-count">{{ reviewsSummary?.total_reviews }} Bewertungen</div>
          </div>

          <!-- Rating Distribution -->
          <div class="rating-distribution">
            <h4>Bewertungsverteilung</h4>
            <div class="distribution-bars">
              <div class="distribution-item" *ngFor="let star of [5,4,3,2,1]">
                <span class="star-label">{{ star }} <i class="fa-solid fa-star"></i></span>
                <div class="bar-container">
                  <div class="bar-fill"
                       [style.width.%]="(reviewsSummary?.distribution[star.toString()] || 0) / (reviewsSummary?.total_reviews || 1) * 100"></div>
                </div>
                <span class="count">{{ reviewsSummary?.distribution[star.toString()] || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Category Ratings -->
          <div class="category-ratings">
            <h4>Durchschnittliche Bewertungen</h4>
            <div class="category-grid">
              <div class="category-item">
                <span class="category-label">Essen</span>
                <div class="category-stars">
                  <i class="fa-solid fa-star star-mini"
                     *ngFor="let star of [1,2,3,4,5]"
                     [class.filled]="star <= (reviewsSummary?.average_food_quality || 0)"></i>
                  <span class="category-score">{{ (+(reviewsSummary?.average_food_quality || 0)).toFixed(1) }}</span>
                </div>
              </div>
              <div class="category-item">
                <span class="category-label">Lieferzeit</span>
                <div class="category-stars">
                  <i class="fa-solid fa-star star-mini"
                     *ngFor="let star of [1,2,3,4,5]"
                     [class.filled]="star <= (reviewsSummary?.average_delivery_time || 0)"></i>
                  <span class="category-score">{{ (+(reviewsSummary?.average_delivery_time || 0)).toFixed(1) }}</span>
                </div>
              </div>
              <div class="category-item">
                <span class="category-label">Verpackung</span>
                <div class="category-stars">
                  <i class="fa-solid fa-star star-mini"
                     *ngFor="let star of [1,2,3,4,5]"
                     [class.filled]="star <= (reviewsSummary?.average_packaging || 0)"></i>
                  <span class="category-score">{{ (+(reviewsSummary?.average_packaging || 0)).toFixed(1) }}</span>
                </div>
              </div>
              <div class="category-item">
                <span class="category-label">Service</span>
                <div class="category-stars">
                  <i class="fa-solid fa-star star-mini"
                     *ngFor="let star of [1,2,3,4,5]"
                     [class.filled]="star <= (reviewsSummary?.average_service || 0)"></i>
                  <span class="category-score">{{ (+(reviewsSummary?.average_service || 0)).toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="review-filters">
          <button class="filter-btn" [class.active]="!showCommentsOnly" (click)="toggleCommentsOnly(false)">
            Alle Bewertungen
          </button>
          <button class="filter-btn" [class.active]="showCommentsOnly" (click)="toggleCommentsOnly(true)">
            Nur mit Kommentaren
          </button>
        </div>

        <!-- Reviews List -->
        <div class="reviews-section">
          <div class="reviews-header">
            <h4>Kundenbewertungen</h4>
            <span class="reviews-count-badge">{{ reviewsList.length }} angezeigt</span>
          </div>

          <div class="reviews-list" *ngIf="reviewsList.length > 0; else noReviews">
            <div class="review-card" *ngFor="let rev of reviewsList; trackBy: trackByReviewId">
              <div class="review-header">
                <div class="review-rating">
                  <div class="stars-small">
                    <i class="fa-solid fa-star star"
                       *ngFor="let star of [1,2,3,4,5]"
                       [class.filled]="star <= (rev.restaurant_rating || 0)"
                       [class.half]="star - 0.5 <= (rev.restaurant_rating || 0) && star > (rev.restaurant_rating || 0)"></i>
                  </div>
                  <span class="rating-number">{{ rev.restaurant_rating }}</span>
                </div>
                <div class="review-date">{{ rev.created_at | date:'dd.MM.yyyy' }}</div>
              </div>

              <!-- Review Comment -->
              <div class="review-comment" *ngIf="rev.restaurant_comment">
                <p>{{ rev.restaurant_comment }}</p>
              </div>

              <!-- Review Categories (if available) -->
              <div class="review-categories" *ngIf="rev.food_quality_rating || rev.delivery_time_rating || rev.packaging_rating || rev.service_rating">
                <div class="category-breakdown">
                  <div class="category-breakdown-item" *ngIf="rev.food_quality_rating">
                    <span class="category-name">Essen:</span>
                    <div class="category-stars">
                      <i class="fa-solid fa-star star-tiny"
                         *ngFor="let star of [1,2,3,4,5]"
                         [class.filled]="star <= rev.food_quality_rating"></i>
                    </div>
                  </div>
                  <div class="category-breakdown-item" *ngIf="rev.delivery_time_rating">
                    <span class="category-name">Lieferzeit:</span>
                    <div class="category-stars">
                      <i class="fa-solid fa-star star-tiny"
                         *ngFor="let star of [1,2,3,4,5]"
                         [class.filled]="star <= rev.delivery_time_rating"></i>
                    </div>
                  </div>
                  <div class="category-breakdown-item" *ngIf="rev.packaging_rating">
                    <span class="category-name">Verpackung:</span>
                    <div class="category-stars">
                      <i class="fa-solid fa-star star-tiny"
                         *ngFor="let star of [1,2,3,4,5]"
                         [class.filled]="star <= rev.packaging_rating"></i>
                    </div>
                  </div>
                  <div class="category-breakdown-item" *ngIf="rev.service_rating">
                    <span class="category-name">Service:</span>
                    <div class="category-stars">
                      <i class="fa-solid fa-star star-tiny"
                         *ngFor="let star of [1,2,3,4,5]"
                         [class.filled]="star <= rev.service_rating"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ng-template #noReviews>
            <div class="no-reviews">
              <i class="fa-solid fa-comment-dots"></i>
              <p>Keine Bewertungen gefunden</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./customer-restaurants.component.scss']
})
export class CustomerRestaurantsComponent implements OnInit, OnDestroy {
  private restaurantsService = inject(RestaurantsService);
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);
  private geocodingService = inject(GeocodingService);
  private router = inject(Router);

  // Address and location properties
  deliveryAddress = '';
  userCoordinates: GeocodeResult | null = null;
  formattedAddress = '';
  isGeocoding = false;
  isGettingLocation = false;
  searchRadius = 40; // km - Erhöht für bessere Abdeckung im Odenwald

  // Search and filter properties - vereinfacht für Standort-basierte Suche
  searchTerm = '';
  cuisineFilter = '';
  deliveryTimeFilter = '';
  ratingFilter = '';

  // Deaktiviere alle zusätzlichen Filter für reine Standort-Suche
  private useSimpleSearch = true;

  // Restaurants based on location
  private restaurantsSubject = new BehaviorSubject<RestaurantDTO[]>([]);
  restaurants$ = this.restaurantsSubject.asObservable();

  isLoggedIn$ = this.authService.currentUser$.pipe(
    map(user => !!user)
  );

  private subscriptions: Subscription[] = [];

  // Reviews modal state
  reviewsModalOpen = false;
  activeRestaurant: RestaurantDTO | null = null;
  reviewsSummary: any = null;
  reviewsList: any[] = [];
  showCommentsOnly = false;

  // Compact mode for returning users
  isCompactMode = false;
  showAddressInput = true;

  ngOnInit() {
    console.log('CustomerRestaurantsComponent: Initialized');

    // Check for saved location in localStorage
    this.checkSavedLocation();

    // Start with empty restaurants list (user needs to enter address first)
    this.restaurantsSubject.next([]);

    // Debug: Subscribe to restaurants observable
    const restaurantsSub = this.restaurants$.subscribe({
      next: (restaurants) => {
        console.log('CustomerRestaurantsComponent: Filtered restaurants:', restaurants.length);
        if (restaurants.length > 0) {
          console.log('Sample restaurant:', restaurants[0]);
          console.log('All restaurants:', restaurants.map(r => ({ name: r.name, cuisine: r.cuisine_type, verified: r.is_verified })));
        }
        console.log('📍 Simple location search active - no additional filters');
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

  onAddressSubmit() {
    if (!this.deliveryAddress.trim()) return;

    this.isGeocoding = true;

    console.log('🎯 Geocoding address:', this.deliveryAddress);

    this.geocodingService.geocodeAddress(this.deliveryAddress)
      .pipe(
        catchError(error => {
          console.error('Geocoding error:', error);
          alert('Adresse konnte nicht gefunden werden. Bitte überprüfe deine Eingabe.');
          return of(null);
        })
      )
      .subscribe(result => {
        this.isGeocoding = false;

        if (result) {
          console.log('📍 Geocoding result:', result);
          this.userCoordinates = result;
          this.formattedAddress = result.formattedAddress || this.deliveryAddress;

          // Save location to localStorage when manually entered
          this.saveLocationToStorage(result);
          this.showAddressInput = false; // Hide address input after successful manual entry

          this.loadNearbyRestaurants();
        } else {
          console.error('❌ No geocoding result');
        }
      });
  }

  clearAddress() {
    this.deliveryAddress = '';
    this.userCoordinates = null;
    this.formattedAddress = '';
    this.restaurantsSubject.next([]);

    // Clear localStorage and deactivate compact mode
    localStorage.removeItem('customer_location');
    this.isCompactMode = false;
    this.showAddressInput = true; // Show address input when changing address

    console.log('🗑️ Location cleared from localStorage');
  }


  useCurrentLocation() {
    this.isGettingLocation = true;
    console.log('🎯 Getting current location...');

    this.geocodingService.getCurrentLocation()
      .pipe(
        catchError(error => {
          console.error('Location error:', error);
          alert(error.message || 'Standort konnte nicht ermittelt werden. Bitte überprüfe deine Browser-Einstellungen.');
          return of(null);
        })
      )
      .subscribe(result => {
        this.isGettingLocation = false;

        if (result) {
          console.log('📍 Current location result:', result);
          this.userCoordinates = result;
          this.formattedAddress = result.formattedAddress || 'Mein aktueller Standort';
          this.deliveryAddress = this.formattedAddress;

          // Versuche reverse geocoding für genauere Adresse
          this.geocodingService.reverseGeocode(result.latitude, result.longitude)
            .pipe(
              catchError(error => {
                console.log('Reverse geocoding failed, using default address');
                return of(result);
              })
            )
            .subscribe(reverseResult => {
              if (reverseResult && reverseResult.formattedAddress) {
                this.userCoordinates = reverseResult;
                this.formattedAddress = reverseResult.formattedAddress;
                console.log('🏙️ Reverse geocoding successful:', reverseResult);
              }

              // Save location to localStorage and activate compact mode
              if (this.userCoordinates) {
                this.saveLocationToStorage(this.userCoordinates);
                this.isCompactMode = true;
                this.showAddressInput = false; // Hide address input after using current location

                // Format address to show only city and postal code
                this.formattedAddress = this.formatCompactAddress(this.formattedAddress);
                this.deliveryAddress = this.formattedAddress;
              }

              this.loadNearbyRestaurants();
            });
        } else {
          console.error('❌ No location result');
        }
      });
  }

  private loadNearbyRestaurants() {
    if (!this.userCoordinates) return;

    console.log('🔍 Loading nearby restaurants with coordinates:', {
      latitude: this.userCoordinates.latitude,
      longitude: this.userCoordinates.longitude,
      radius: this.searchRadius
    });

    this.restaurantsService.getNearbyRestaurants(
      this.userCoordinates.latitude,
      this.userCoordinates.longitude,
      this.searchRadius // Verwende den konfigurierten Radius
    ).pipe(
      map(restaurants => this.filterRestaurants(restaurants)),
      catchError(error => {
        console.error('Error loading nearby restaurants:', error);
        return of([]);
      })
    ).subscribe(restaurants => {
      console.log('🏪 Simple search - API returned:', restaurants.length, 'restaurants');
      console.log('🍔 Firats Burgerkreis in API response:', !!restaurants.find(r => r.name?.includes('Burgerkreis')));

      // Bei einfacher Suche: Zeige alle Restaurants ohne zusätzliche Filter
      this.restaurantsSubject.next(restaurants);
    });
  }

  // Vereinfachte Suchlogik - keine zusätzlichen Filter
  onSearchChange(event: any) {
    // Bei einfacher Suche keine zusätzlichen Filter anwenden
    this.searchTerm = event.target.value;
  }

  onFilterChange() {
    // Bei einfacher Suche keine Filter-Updates
  }

  private triggerFilterUpdate() {
    // Bei einfacher Suche keine Filter-Updates notwendig
  }

  private filterRestaurants(restaurants: RestaurantDTO[]): RestaurantDTO[] {
    console.log('🏪 Simple location-based search - showing all nearby restaurants:', restaurants.length);

    // Bei einfacher Standort-Suche: Zeige alle Restaurants, die die API zurückgibt
    // Keine zusätzlichen Filter anwenden

    const firatsRestaurant = restaurants.find(r => r.name?.includes('Burgerkreis'));
    if (firatsRestaurant) {
      console.log('🍔 Firats Burgerkreis found in results:', {
        name: firatsRestaurant.name,
        cuisine: firatsRestaurant.cuisine_type,
        rating: firatsRestaurant.rating,
        delivery_time: firatsRestaurant.delivery_info?.estimated_delivery_time_minutes
      });
    }

    console.log('✅ All restaurants shown (no additional filtering):', restaurants.length);
    return restaurants;
  }

  openReviews(r: RestaurantDTO) {
    this.activeRestaurant = r;
    this.reviewsModalOpen = true;
    this.showCommentsOnly = false;
    const restaurantId = String(r.id);
    this.reviewsService.getRestaurantSummary(restaurantId).subscribe(summary => this.reviewsSummary = summary);
    this.loadReviews(restaurantId);
  }

  closeReviews() {
    this.reviewsModalOpen = false;
    this.activeRestaurant = null;
    this.reviewsSummary = null;
    this.reviewsList = [];
    this.showCommentsOnly = false;
  }

  toggleCommentsOnly(commentsOnly: boolean) {
    this.showCommentsOnly = commentsOnly;
    if (this.activeRestaurant) {
      this.loadReviews(String(this.activeRestaurant.id));
    }
  }

  private loadReviews(restaurantId: string) {
    const params = this.showCommentsOnly
      ? { with_comments_only: true, limit: 100 }
      : { limit: 100 };
    this.reviewsService.getRestaurantReviews(restaurantId, params).subscribe(list => this.reviewsList = list);
  }

  trackByReviewId(index: number, review: any): string {
    return review.id;
  }

  isMobileOrTablet(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768; // Tablet und Mobile
    }
    return false;
  }

  private checkSavedLocation() {
    const savedLocation = localStorage.getItem('customer_location');
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        if (locationData && locationData.latitude && locationData.longitude) {
          // Activate compact mode for returning users
          this.isCompactMode = true;
          this.showAddressInput = false; // Hide address input in compact mode
          this.userCoordinates = locationData;
          this.formattedAddress = this.formatCompactAddress(locationData.formattedAddress || '');
          this.deliveryAddress = this.formattedAddress;

          // Load nearby restaurants
          this.loadNearbyRestaurants();

          console.log('📍 Loaded saved location from localStorage:', locationData);
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
        localStorage.removeItem('customer_location');
      }
    }
  }

  private saveLocationToStorage(location: GeocodeResult) {
    try {
      localStorage.setItem('customer_location', JSON.stringify(location));
      console.log('💾 Location saved to localStorage');
    } catch (error) {
      console.error('Error saving location to localStorage:', error);
    }
  }

  private formatCompactAddress(fullAddress: string): string {
    if (!fullAddress) return '';

    // Extract city and postal code from address
    const parts = fullAddress.split(',').map(part => part.trim());

    // Look for postal code pattern (German format: 5 digits)
    const postalCodeMatch = fullAddress.match(/\b\d{5}\b/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';

    // Try to find city name
    let city = '';

    // First, try to find a part that contains both postal code and city
    for (const part of parts) {
      if (part.includes(postalCode) && part.length > postalCode.length + 2) {
        city = part.replace(postalCode, '').trim();
        break;
      }
    }

    // If not found, look for city in other parts
    if (!city) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        // Skip parts that are just postal codes or too short
        if (part !== postalCode && part.length > 2 && !/^\d+$/.test(part)) {
          city = part;
          break;
        }
      }
    }

    // Clean up city name (remove common suffixes/prefixes)
    if (city) {
      city = city.replace(/^(stadt|kreis|landkreis)\s+/i, '');
      city = city.replace(/\s+(stadt|kreis|landkreis)$/i, '');
    }

    if (city && postalCode) {
      return `${postalCode} ${city}`;
    } else if (city) {
      return city;
    } else if (postalCode) {
      return postalCode;
    }

    // Fallback to original address if parsing fails
    return fullAddress;
  }

}


