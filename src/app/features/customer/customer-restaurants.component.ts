import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NgForOf, AsyncPipe, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { CustomerFiltersService } from '../../core/services/customer-filters.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { AuthService } from '../../core/auth/auth.service';
import { GeocodingService, GeocodeResult } from '../../core/services/geocoding.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { RestaurantSkeletonComponent } from '../../shared/components/restaurant-skeleton.component';
import { Observable, Subscription, combineLatest, BehaviorSubject, of, forkJoin } from 'rxjs';
import { from } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-customer-restaurants',
  standalone: true,
  imports: [NgForOf, AsyncPipe, NgIf, ImageFallbackDirective, FormsModule, DatePipe, RestaurantSkeletonComponent],
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

        <!-- Mobile Search Section -->
        <div class="mobile-search-section" *ngIf="userCoordinates && isCompactMode">
          <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              class="search-input"
              placeholder="Suche nach Restaurants, Küchen, Preisen..."
              [(ngModel)]="globalSearchTerm"
              (input)="onGlobalSearchChanged()"
            >
            <button class="clear-search-btn" *ngIf="globalSearchTerm" (click)="clearGlobalSearch()" type="button">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Filter Section -->
        <div class="mobile-filter-section" *ngIf="userCoordinates && isCompactMode">
          <button class="filter-btn" (click)="goToFilters()" type="button">
            <i class="fa-solid fa-sliders"></i>
            <span>Suche & Filter</span>
          </button>
        </div>

        <!-- Full Hero Content (when no coordinates or not compact mode) -->
        <div class="hero-content" *ngIf="!userCoordinates || !isCompactMode">
          <h1 class="hero-title" *ngIf="!isCompactMode">Essen bestellen im ODNWLD</h1>
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

          <!-- Current Location Bar - Compact after selection -->
          <div class="current-location-bar" [class.compact]="formattedAddress && isCompactMode" *ngIf="userCoordinates">
            <div class="location-info">
              <i class="fa-solid fa-map-marker-alt location-icon"></i>
              <span class="location-text">{{ formattedAddress || deliveryAddress }}</span>
            </div>
            <div class="location-actions">
              <button class="filter-btn" (click)="goToFilters()" type="button" title="Filter & Suche">
                <i class="fa-solid fa-sliders"></i>
                <span class="filter-text">Suche & Filter</span>
              </button>
              <button class="change-address-btn" (click)="clearAddress()" type="button">
                <i class="fa-solid fa-edit"></i>
                <span *ngIf="!isCompactMode">Adresse ändern</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- Results Section -->
      <div class="results-section" *ngIf="userCoordinates">
        <div class="container">
          <!-- Desktop Sidebar (Hidden on Mobile) -->
          <div class="desktop-sidebar" *ngIf="!isMobileOrTablet()">
            <!-- Popular Categories in Sidebar -->
            <div class="sidebar-section sidebar-categories">
              <h3>Kategorien</h3>
              <div class="category-chips">
                <button 
                  *ngFor="let category of popularCategories" 
                  class="category-chip" 
                  (click)="selectPredefinedCategory(category.name)"
                  [class.active]="globalSearchTerm === category.name"
                >
                  <span class="category-icon">{{ category.icon }}</span>
                  <span class="category-name">{{ category.name }}</span>
                </button>
              </div>
            </div>

            <!-- Filters in Sidebar -->
            <div class="sidebar-section sidebar-filters">
              <h3>Filter</h3>
              <div class="filters-row">
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="filterOpenNow" (change)="onFiltersChanged()">
                  <span>Jetzt geöffnet</span>
                </label>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="filterFreeDelivery" (change)="onFiltersChanged()">
                  <span>Kostenlose Lieferung</span>
                </label>
                <label class="select">
                  <span>Mind.-bestellwert</span>
                  <select [(ngModel)]="filterMinOrder" (change)="onFiltersChanged()">
                    <option value="all">Alle</option>
                    <option value="10">10,00 € oder weniger</option>
                    <option value="15">15,00 € oder weniger</option>
                  </select>
                </label>
                <label class="select">
                  <span>Bewertung</span>
                  <select [(ngModel)]="filterRatingMin" (change)="onFiltersChanged()">
                    <option [ngValue]="0">Alle</option>
                    <option [ngValue]="3">ab 3★</option>
                    <option [ngValue]="4">ab 4★</option>
                    <option [ngValue]="4.5">ab 4.5★</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="main-content">
            <!-- Search bar like Lieferando: search items/categories and filter restaurants offering them -->
            <div class="search-bar" *ngIf="!isMobileOrTablet()">
              <div class="search-input-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Suche nach Restaurants, Küchen, Adressen, Preisen... (z.B. Pizza, kostenlos, bar, 10€, schnell)"
                  [(ngModel)]="globalSearchTerm"
                  (input)="onGlobalSearchChanged()"
                >
                <button class="clear-search-btn" *ngIf="globalSearchTerm" (click)="clearGlobalSearch()" type="button">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
              <div class="search-status" *ngIf="isSearching">
                <i class="fa-solid fa-spinner fa-spin"></i> Suche passende Angebote...
              </div>
            </div>

            <!-- Popular Categories like Lieferando (hidden on desktop) -->
            <div class="popular-categories" *ngIf="!isMobileOrTablet()">
              <div class="category-chips">
                <button 
                  *ngFor="let category of popularCategories" 
                  class="category-chip" 
                  (click)="selectPredefinedCategory(category.name)"
                  [class.active]="globalSearchTerm === category.name"
                >
                  <span class="category-icon">{{ category.icon }}</span>
                  <span class="category-name">{{ category.name }}</span>
                </button>
              </div>
            </div>

            <!-- Filters row: open-now, free delivery, min order, rating (hidden on desktop) -->
            <div class="filters-row" *ngIf="!isMobileOrTablet()">
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="filterOpenNow" (change)="onFiltersChanged()">
                <span>Jetzt geöffnet</span>
              </label>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="filterFreeDelivery" (change)="onFiltersChanged()">
                <span>Kostenlose Lieferung</span>
              </label>
              <label class="select">
                <span>Mind.-bestellwert</span>
                <select [(ngModel)]="filterMinOrder" (change)="onFiltersChanged()">
                  <option value="all">Alle</option>
                  <option value="10">10,00 € oder weniger</option>
                  <option value="15">15,00 € oder weniger</option>
                </select>
              </label>
              <label class="select">
                <span>Bewertung</span>
                <select [(ngModel)]="filterRatingMin" (change)="onFiltersChanged()">
                  <option [ngValue]="0">Alle</option>
                  <option [ngValue]="3">ab 3★</option>
                  <option [ngValue]="4">ab 4★</option>
                  <option [ngValue]="4.5">ab 4.5★</option>
                </select>
              </label>
            </div>
          
            <!-- Show skeleton cards while loading -->
            <div class="restaurants-grid" *ngIf="isLoadingRestaurants">
              <app-restaurant-skeleton *ngFor="let i of [0,1,2,3,4,5]" [index]="i" [animate]="true"></app-restaurant-skeleton>
            </div>

            <!-- Show actual restaurants when loaded -->
            <ng-container *ngIf="restaurants$ | async as restaurants">
              <div class="no-results" *ngIf="!isLoadingRestaurants && restaurants.length === 0">
                <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <!-- Such-Icon für keine Ergebnisse -->
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                  <circle cx="11" cy="11" r="2" fill="currentColor"/>
                </svg>
                <p>
                  {{ globalSearchTerm ? 'Keine Restaurants mit passenden Angeboten gefunden.' : 'Keine Restaurants gefunden.' }}
                </p>
              </div>

              <div class="restaurants-grid" *ngIf="!isLoadingRestaurants && restaurants.length > 0">
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
                    <button class="btn btn-ghost" type="button" (click)="viewDetails(r)">
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
          </div>
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

    <!-- Category modal -->
    <div class="category-modal-backdrop" *ngIf="categoryModalOpen" (click)="closeCategoryModal()"></div>
    <div class="category-modal" *ngIf="categoryModalOpen" (click)="$event.stopPropagation()">
      <div class="category-modal-header">
        <h3>Alle Kategorien</h3>
        <button class="close-btn" (click)="closeCategoryModal()" type="button"><i class="fa-solid fa-times"></i></button>
      </div>
      <div class="category-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Suche in Kategorien" [(ngModel)]="categorySearchTerm" (input)="onCategorySearch(categorySearchTerm)">
      </div>
      <div class="category-grid-modal">
        <button class="category-chip" *ngFor="let c of filteredCategories" (click)="selectCategory(c.name)">
          <span class="name">{{ c.name }}</span>
          <span class="count">{{ c.count }}</span>
        </button>
      </div>
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
  private customerFilters = inject(CustomerFiltersService);
  private router = inject(Router);

  // Address and location properties
  deliveryAddress = '';
  userCoordinates: GeocodeResult | null = null;
  formattedAddress = '';
  isGeocoding = false;
  isGettingLocation = false;
  searchRadius = 40; // km - Erhöht für bessere Abdeckung im ODNWLD

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

  // Loading state for skeleton animation
  isLoadingRestaurants = false;
  // Global search states
  globalSearchTerm = '';
  isSearching = false;
  // Full list vs filtered list management
  private allNearbyRestaurants: RestaurantDTO[] = [];
  // Filters similar to Lieferando
  filterOpenNow = false;
  filterFreeDelivery = false;
  filterMinOrder: 'all' | '10' | '15' = 'all';
  filterRatingMin: 0 | 3 | 4 | 4.5 = 0;
  // Categories aggregation
  categoriesLoading = false;
  aggregatedCategories: Array<{ name: string; count: number }> = [];
  categoryModalOpen = false;
  categorySearchTerm = '';
  filteredCategories: Array<{ name: string; count: number }> = [];
  filtersDrawerOpen = false;
  
  // Predefined popular categories like Lieferando
  predefinedCategories = [
    { name: 'Pizza', icon: '🍕', popular: true },
    { name: 'Burger', icon: '🍔', popular: true },
    { name: 'Sushi', icon: '🍣', popular: true },
    { name: 'Asiatisch', icon: '🥢', popular: true },
    { name: 'Italienisch', icon: '🍝', popular: true },
    { name: 'Döner & Kebab', icon: '🥙', popular: true },
    { name: 'Deutsch', icon: '🥨', popular: true },
    { name: 'Vegetarisch', icon: '🥗', popular: true },
    { name: 'Vegan', icon: '🌱', popular: false },
    { name: 'Fast Food', icon: '🍟', popular: false },
    { name: 'Desserts', icon: '🍰', popular: false },
    { name: 'Getränke', icon: '🥤', popular: false },
    { name: 'Salate', icon: '🥙', popular: false },
    { name: 'Pasta', icon: '🍝', popular: false },
    { name: 'Fisch', icon: '🐟', popular: false },
    { name: 'Fleisch', icon: '🥩', popular: false }
  ];

  get popularCategories() {
    return this.predefinedCategories.filter(c => c.popular);
  }

  ngOnInit() {
    console.log('CustomerRestaurantsComponent: Initialized');

    // Load persisted filters
    const s = this.customerFilters.getState();
    this.globalSearchTerm = s.searchTerm || '';
    this.filterOpenNow = s.openNow;
    this.filterFreeDelivery = s.freeDelivery;
    this.filterMinOrder = s.minOrder;
    this.filterRatingMin = s.ratingMin;

    this.customerFilters.state$.subscribe(state => {
      this.globalSearchTerm = state.searchTerm || '';
      this.filterOpenNow = state.openNow;
      this.filterFreeDelivery = state.freeDelivery;
      this.filterMinOrder = state.minOrder;
      this.filterRatingMin = state.ratingMin;
      this.applyAllFilters();
    });

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

  viewDetails(restaurant: RestaurantDTO) {
    this.router.navigate(['/restaurant', restaurant.id], {
      queryParams: { view: 'details' }
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToFilters() {
    this.router.navigate(['/customer/filters']);
  }

  onQuickSearchFocus() {
    // Optional: Add focus behavior for quick search
    console.log('Quick search focused');
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
          
          // Activate compact mode immediately after location selection
          this.isCompactMode = true;
          
          // Format address to show only city and postal code for compact display
          this.formattedAddress = this.formatCompactAddress(this.formattedAddress);
          this.deliveryAddress = this.formattedAddress;

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

    this.isLoadingRestaurants = true;

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
      map(restaurants => restaurants),
      catchError(error => {
        console.error('Error loading nearby restaurants:', error);
        return of([]);
      })
    ).subscribe(restaurants => {
      console.log('🏪 Simple search - API returned:', restaurants.length, 'restaurants');
      console.log('🍔 Firats Burgerkreis in API response:', !!restaurants.find(r => r.name?.includes('Burgerkreis')));
      this.allNearbyRestaurants = restaurants;
      this.applyAllFilters();
      // Aggregate categories in background
      this.loadCategoriesForRestaurants(restaurants);
      this.isLoadingRestaurants = false;
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

  // Apply comprehensive search filter through the complete RestaurantDTO schema
  private applyGlobalSearchFilter(restaurants: RestaurantDTO[]): RestaurantDTO[] {
    const term = (this.globalSearchTerm || '').trim().toLowerCase();
    if (!term) {
      return restaurants;
    }

    // Search through all relevant fields of the RestaurantDTO schema
    return restaurants.filter(restaurant => {
      // Basic restaurant information
      const nameMatch = restaurant.name?.toLowerCase().includes(term);
      const slugMatch = restaurant.slug?.toLowerCase().includes(term);
      const cuisineMatch = restaurant.cuisine_type?.toLowerCase().includes(term);
      const descriptionMatch = restaurant.description?.toLowerCase().includes(term);
      
      // Address information
      const streetMatch = restaurant.address?.street?.toLowerCase().includes(term);
      const cityMatch = restaurant.address?.city?.toLowerCase().includes(term);
      const postalCodeMatch = restaurant.address?.postal_code?.toLowerCase().includes(term);
      
      // Contact information
      const phoneMatch = restaurant.contact_info?.phone?.toLowerCase().includes(term);
      const emailMatch = restaurant.contact_info?.email?.toLowerCase().includes(term);
      const websiteMatch = restaurant.contact_info?.website?.toLowerCase().includes(term);
      
      // Delivery information - search for specific terms
      const deliveryFeeMatch = this.searchDeliveryFee(term, restaurant.delivery_info?.delivery_fee);
      const minOrderMatch = this.searchMinOrder(term, restaurant.delivery_info?.minimum_order_amount);
      const deliveryTimeMatch = this.searchDeliveryTime(term, restaurant.delivery_info?.estimated_delivery_time_minutes);
      
      // Payment methods
      const paymentMatch = this.searchPaymentMethods(term, restaurant.payment_methods);
      
      // Owner information
      const ownerNameMatch = restaurant.owner_name?.toLowerCase().includes(term);
      const ownerEmailMatch = restaurant.owner_email?.toLowerCase().includes(term);
      
      // Special search terms for common food categories
      const categoryMatch = this.searchFoodCategories(term, restaurant);
      
      return nameMatch || slugMatch || cuisineMatch || descriptionMatch ||
             streetMatch || cityMatch || postalCodeMatch ||
             phoneMatch || emailMatch || websiteMatch ||
             deliveryFeeMatch || minOrderMatch || deliveryTimeMatch ||
             paymentMatch || ownerNameMatch || ownerEmailMatch ||
             categoryMatch;
    });
  }

  // Helper methods for specific search functionality
  private searchDeliveryFee(term: string, deliveryFee?: number): boolean {
    if (!deliveryFee) return false;
    
    const freeTerms = ['kostenlos', 'free', 'gratis', '0€', '0 euro'];
    const lowCostTerms = ['günstig', 'billig', 'preiswert', 'günstige lieferung'];
    
    if (deliveryFee === 0 && freeTerms.some(freeTerm => term.includes(freeTerm))) {
      return true;
    }
    
    if (deliveryFee <= 2 && lowCostTerms.some(lowTerm => term.includes(lowTerm))) {
      return true;
    }
    
    return false;
  }

  private searchMinOrder(term: string, minOrder?: number): boolean {
    if (!minOrder) return false;
    
    const budgetTerms = ['günstig', 'billig', 'preiswert', 'budget', 'kleine bestellung'];
    const numberMatch = term.match(/\d+/);
    
    if (numberMatch) {
      const searchNumber = parseInt(numberMatch[0]);
      return Math.abs(minOrder - searchNumber) <= 2; // Allow 2€ tolerance
    }
    
    if (minOrder <= 10 && budgetTerms.some(budgetTerm => term.includes(budgetTerm))) {
      return true;
    }
    
    return false;
  }

  private searchDeliveryTime(term: string, deliveryTime?: number): boolean {
    if (!deliveryTime) return false;
    
    const fastTerms = ['schnell', 'fast', 'quick', 'schnelle lieferung'];
    const numberMatch = term.match(/\d+/);
    
    if (numberMatch) {
      const searchNumber = parseInt(numberMatch[0]);
      return Math.abs(deliveryTime - searchNumber) <= 5; // Allow 5 min tolerance
    }
    
    if (deliveryTime <= 25 && fastTerms.some(fastTerm => term.includes(fastTerm))) {
      return true;
    }
    
    return false;
  }

  private searchPaymentMethods(term: string, paymentMethods?: any): boolean {
    if (!paymentMethods) return false;
    
    const cashTerms = ['bar', 'cash', 'bargeld'];
    const cardTerms = ['karte', 'card', 'kreditkarte', 'debitkarte'];
    const paypalTerms = ['paypal', 'pay pal'];
    
    if (cashTerms.some(cashTerm => term.includes(cashTerm)) && paymentMethods.cash) {
      return true;
    }
    
    if (cardTerms.some(cardTerm => term.includes(cardTerm)) && paymentMethods.card) {
      return true;
    }
    
    if (paypalTerms.some(paypalTerm => term.includes(paypalTerm)) && paymentMethods.paypal) {
      return true;
    }
    
    return false;
  }

  private searchFoodCategories(term: string, restaurant: RestaurantDTO): boolean {
    // Map common search terms to cuisine types
    const cuisineMapping: { [key: string]: string[] } = {
      'pizza': ['pizza', 'italienisch', 'italienische', 'italy', 'italy'],
      'burger': ['burger', 'amerikanisch', 'amerikanische', 'american', 'fast food'],
      'sushi': ['sushi', 'japanisch', 'japanische', 'japanese', 'asiatisch', 'asiatische'],
      'döner': ['döner', 'kebab', 'türkisch', 'türkische', 'turkish', 'doner'],
      'pasta': ['pasta', 'nudeln', 'spaghetti', 'italienisch', 'italienische'],
      'salat': ['salat', 'salate', 'salads', 'healthy', 'gesund', 'grün'],
      'vegetarisch': ['vegetarisch', 'vegetarische', 'vegetarian', 'veggie'],
      'vegan': ['vegan', 'vegane', 'veganer', 'plant based'],
      'chinesisch': ['chinesisch', 'chinesische', 'chinese', 'china'],
      'thailändisch': ['thailändisch', 'thailändische', 'thai', 'thailand'],
      'indisch': ['indisch', 'indische', 'indian', 'curry', 'curries'],
      'mexikanisch': ['mexikanisch', 'mexikanische', 'mexican', 'mexiko', 'taco', 'burrito'],
      'griechisch': ['griechisch', 'griechische', 'greek', 'griechenland'],
      'deutsch': ['deutsch', 'deutsche', 'german', 'deutschland', 'schnitzel', 'bratwurst'],
      'fisch': ['fisch', 'fish', 'seafood', 'meeresfrüchte', 'lachs', 'salmon'],
      'steak': ['steak', 'fleisch', 'meat', 'rind', 'beef', 'schwein', 'pork'],
      'dessert': ['dessert', 'desserts', 'kuchen', 'cake', 'eis', 'ice cream', 'süß'],
      'getränk': ['getränk', 'getränke', 'drinks', 'cola', 'bier', 'beer', 'wein', 'wine']
    };

    // Check if the search term matches any cuisine mapping
    for (const [searchTerm, cuisineTypes] of Object.entries(cuisineMapping)) {
      if (term.includes(searchTerm)) {
        return cuisineTypes.some(cuisineType => 
          restaurant.cuisine_type?.toLowerCase().includes(cuisineType) ||
          restaurant.description?.toLowerCase().includes(cuisineType) ||
          restaurant.name?.toLowerCase().includes(cuisineType)
        );
      }
    }

    return false;
  }

  onGlobalSearchChanged() {
    this.customerFilters.update({ searchTerm: this.globalSearchTerm });
    // Apply filters immediately without AI search
        this.applyAllFilters();
  }

  clearGlobalSearch() {
    this.globalSearchTerm = '';
        this.isSearching = false;
    this.applyAllFilters();
  }

  // Non-AI filters application
  onFiltersChanged() {
    this.customerFilters.update({
      searchTerm: this.globalSearchTerm,
      openNow: this.filterOpenNow,
      freeDelivery: this.filterFreeDelivery,
      minOrder: this.filterMinOrder,
      ratingMin: this.filterRatingMin
    });
    this.applyAllFilters();
  }

  private applyAllFilters() {
    let base = [...this.allNearbyRestaurants];

    // Apply simple search filter
    base = this.applyGlobalSearchFilter(base);

    // Open now filter
    if (this.filterOpenNow) {
      base = base.filter(r => this.isRestaurantOpenNow(r));
    }

    // Free delivery
    if (this.filterFreeDelivery) {
      base = base.filter(r => (r.delivery_info?.delivery_fee ?? 0) === 0);
    }

    // Min order
    if (this.filterMinOrder === '10') {
      base = base.filter(r => (r.delivery_info?.minimum_order_amount ?? 0) <= 10);
    } else if (this.filterMinOrder === '15') {
      base = base.filter(r => (r.delivery_info?.minimum_order_amount ?? 0) <= 15);
    }

    // Rating
    if (this.filterRatingMin > 0) {
      base = base.filter(r => (r.rating ?? 0) >= this.filterRatingMin);
    }

    this.restaurantsSubject.next(base);
  }

  private isRestaurantOpenNow(r: RestaurantDTO): boolean {
    try {
      const now = new Date();
      const dayNames: Array<'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'> = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const day = dayNames[now.getDay()];
      const hours = (r.opening_hours as any)?.[day];
      if (!hours || hours.is_closed) return false;
      const [openH, openM] = (hours.open || '00:00').split(':').map((n: string) => parseInt(n, 10));
      const [closeH, closeM] = (hours.close || '00:00').split(':').map((n: string) => parseInt(n, 10));
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (closeMinutes >= openMinutes) {
        return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
      }
      // Overnight window
      return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
    } catch {
      return false;
    }
  }

  // Categories handling
  openCategoryModal() {
    this.categoryModalOpen = true;
    this.filteredCategories = [...this.aggregatedCategories];
  }

  closeCategoryModal() {
    this.categoryModalOpen = false;
    this.categorySearchTerm = '';
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm = term;
    const t = term.trim().toLowerCase();
    this.filteredCategories = this.aggregatedCategories.filter(c => c.name.toLowerCase().includes(t));
  }

  selectCategory(name: string) {
    this.globalSearchTerm = name;
    this.onGlobalSearchChanged();
    this.closeCategoryModal();
  }

  selectPredefinedCategory(categoryName: string) {
    // Toggle category selection
    if (this.globalSearchTerm === categoryName) {
      this.globalSearchTerm = '';
    } else {
      this.globalSearchTerm = categoryName;
    }
    this.onGlobalSearchChanged();
  }

  private loadCategoriesForRestaurants(restaurants: RestaurantDTO[]) {
    const ids = restaurants.map(r => String(r.id));
    if (ids.length === 0) {
      this.aggregatedCategories = [];
      this.filteredCategories = [];
      return;
    }
    this.categoriesLoading = true;
    const requests = ids.map(id => this.restaurantsService.getMenuCategoriesWithItems(id).pipe(catchError(() => of([]))));
    forkJoin(requests).subscribe({
      next: (results) => {
        const counts = new Map<string, number>();
        results.forEach(list => {
          list.forEach((cat: any) => {
            const name = (cat.name || '').trim();
            if (!name) return;
            counts.set(name, (counts.get(name) || 0) + 1);
          });
        });
        const arr = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
        arr.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        this.aggregatedCategories = arr.slice(0, 24);
        this.filteredCategories = [...this.aggregatedCategories];
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesLoading = false;
      }
    });
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

    // Try to find city name - prioritize the first meaningful part
    let city = '';

    // First, try to find a part that contains both postal code and city
    for (const part of parts) {
      if (part.includes(postalCode) && part.length > postalCode.length + 2) {
        city = part.replace(postalCode, '').trim();
        break;
      }
    }

    // If not found, look for city in other parts (prefer earlier parts for city name)
    if (!city) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Skip parts that are just postal codes, too short, or are administrative divisions
        if (part !== postalCode && 
            part.length > 2 && 
            !/^\d+$/.test(part) &&
            !part.toLowerCase().includes('kreis') &&
            !part.toLowerCase().includes('landkreis') &&
            !part.toLowerCase().includes('hessen') &&
            !part.toLowerCase().includes('deutschland')) {
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

    // Return formatted address
    if (city && postalCode) {
      return `${city}, ${postalCode}`;
    } else if (city) {
      return city;
    } else if (postalCode) {
      return postalCode;
    }

    // Fallback to original address if parsing fails
    return fullAddress;
  }

}


