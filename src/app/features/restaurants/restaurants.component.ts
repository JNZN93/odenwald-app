import { Component, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [NgForOf, AsyncPipe, NgIf, ImageFallbackDirective],
  template: `
    <section class="restaurants-section container">
      <header class="section-header">
        <h2 class="section-title">Restaurants</h2>
        <p class="section-subtitle">Entdecke regionale Küchen im Odenwald</p>
      </header>

      <ng-container *ngIf="restaurants$ | async as restaurants; else loading">
        <div class="empty-state" *ngIf="restaurants.length === 0">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <circle cx="11" cy="11" r="2" fill="currentColor"/>
          </svg>
          <p>Keine Restaurants gefunden.</p>
        </div>

        <div class="restaurants-grid" *ngIf="restaurants.length > 0">
          <article class="restaurant-card transition-base" *ngFor="let r of restaurants">
            <div class="card-image">
              <img
                [src]="r.images.banner || r.images.logo || ''"
                [alt]="r.name"
                loading="lazy"
                appImageFallback
              >
              <div class="card-overlay">
                <span class="badge badge-primary" *ngIf="r.cuisine_type">{{ r.cuisine_type }}</span>
                <span class="badge" [class.badge-success]="r.is_verified">
                  <svg *ngIf="r.is_verified" class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {{ r.is_verified ? 'Verifiziert' : 'Unbestätigt' }}
                </span>
              </div>
            </div>
            
            <div class="card-content">
              <div class="restaurant-head">
                <h3 class="restaurant-name">{{ r.name }}</h3>
                <div class="rating">
                  <svg class="star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"/>
                  </svg>
                  <span>{{ r.rating || '–' }}</span>
                  <small class="muted">({{ r.total_reviews || 0 }})</small>
                </div>
              </div>

              <p class="restaurant-desc" *ngIf="r.description">{{ r.description }}</p>

              <div class="restaurant-meta">
                <div class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <span>{{ r.address.city }}</span>
                </div>
                <div class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>{{ r.delivery_info.estimated_delivery_time_minutes }} Min</span>
                </div>
                <div class="meta-item">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>Min. {{ r.delivery_info.minimum_order_amount }}€</span>
                </div>
              </div>

              <div class="restaurant-actions">
                <button class="btn btn-primary" type="button" (click)="viewMenu(r)">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h8"/>
                    <path d="M8 10h8"/>
                    <path d="M8 14h8"/>
                    <path d="M8 18h8"/>
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                  Zur Speisekarte
                </button>
                <button class="btn btn-ghost" type="button">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Details
                </button>
              </div>
            </div>
          </article>
        </div>
      </ng-container>

      <ng-template #loading>
        <div class="loading">
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    </section>
  `,
  styles: [`
    .restaurants-section { 
      padding: var(--space-8) 0; 
    }
    
    .section-header { 
      text-align: center; 
      margin-bottom: var(--space-10); 
    }
    
    .section-title { 
      font-size: var(--text-3xl); 
      margin-bottom: var(--space-2);
    }
    
    .section-subtitle { 
      color: var(--color-muted); 
      font-size: var(--text-lg);
    }

    .restaurants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .restaurant-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .restaurant-card:hover {
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary-300);
    }

    .card-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-overlay {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
      right: var(--space-3);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-content {
      padding: var(--space-6);
    }

    .restaurant-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .restaurant-name {
      margin: 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
      flex: 1;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f59e0b;
      font-weight: 600;
    }

    .restaurant-desc {
      color: var(--color-muted);
      margin-bottom: var(--space-4);
      line-height: 1.5;
    }

    .restaurant-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .muted {
      color: var(--color-muted);
      opacity: 0.7;
    }

    .restaurant-actions {
      display: flex;
      gap: var(--space-3);
    }

    .restaurant-actions .btn {
      flex: 1;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: var(--space-3);
      padding: var(--space-12) 0;
      color: var(--color-muted);
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 32px;
      color: var(--color-border);
    }

    .loading {
      text-align: center;
      padding: var(--space-12) 0;
      color: var(--color-muted);
    }

    .badge-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .star-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .meta-icon {
      width: 16px;
      height: 16px;
      color: var(--color-muted);
      flex-shrink: 0;
    }

    .btn-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .spinner {
      width: 36px;
      height: 36px;
      color: var(--color-primary-500);
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-3);
    }

    @keyframes spin {
      from { transform: rotate(0); }
      to { transform: rotate(360deg); }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .restaurants-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        padding: 0 var(--space-4);
      }

      .restaurant-actions {
        flex-direction: column;
      }

      .card-overlay {
        flex-direction: column;
        gap: var(--space-2);
      }
    }

    @media (min-width: 1200px) {
      .restaurants-grid {
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: var(--space-8);
      }
    }
  `]
})
export class RestaurantsComponent {
  private service = inject(RestaurantsService);
  private router = inject(Router);
  restaurants$: Observable<RestaurantDTO[]> = this.service.list();

  viewMenu(restaurant: RestaurantDTO) {
    this.router.navigate(['/restaurant', restaurant.id]);
  }
}


