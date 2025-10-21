import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService, FavoriteItem } from '../../core/services/favorites.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-favorites-section',
  standalone: true,
  imports: [CommonModule, ImageFallbackDirective],
  template: `
    <div class="favorites-section" *ngIf="showFavorites">
      <div class="section-header">
        <h2>
          <i class="fa-solid fa-heart"></i>
          Meine Favoriten
        </h2>
        <button class="toggle-favorites-btn" (click)="toggleFavorites()">
          <i class="fa-solid" [class.fa-chevron-up]="isExpanded" [class.fa-chevron-down]="!isExpanded"></i>
        </button>
      </div>

      <div class="favorites-content" *ngIf="isExpanded">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Favoriten werden geladen...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error && !isLoading">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button class="btn-retry" (click)="loadFavorites()">Erneut versuchen</button>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!isLoading && !error && favorites.length === 0">
          <i class="fa-solid fa-heart"></i>
          <h4>Noch keine Favoriten</h4>
          <p>Bestellen Sie Artikel, um sie zu Ihren Favoriten hinzuzufügen</p>
        </div>

        <!-- Favorites Grid -->
        <div class="favorites-grid" *ngIf="!isLoading && !error && favorites.length > 0">
          <div
            *ngFor="let favorite of favorites"
            class="favorite-card"
            (click)="selectFavorite(favorite)"
          >
            <div class="favorite-image">
              <img
                [src]="favorite.menu_item_image_url"
                [alt]="favorite.menu_item_name"
                appImageFallback
              >
              <div class="favorite-badge">
                <i class="fa-solid fa-heart"></i>
              </div>
            </div>

            <div class="favorite-content">
              <div class="favorite-header">
                <h4 class="favorite-name">{{ favorite.menu_item_name }}</h4>
                <div class="favorite-restaurant">{{ favorite.restaurant_name }}</div>
              </div>

              <div class="favorite-description" *ngIf="favorite.menu_item_description">
                {{ favorite.menu_item_description }}
              </div>

              <div class="favorite-footer">
                <div class="favorite-price">{{ formatPrice(favorite.menu_item_price_cents) }}</div>
                <div class="favorite-stats">
                  <span class="order-count">{{ favorite.order_count }}x bestellt</span>
                  <span class="last-ordered">zuletzt {{ formatDate(favorite.last_ordered_at) }}</span>
                </div>
              </div>

              <div class="favorite-actions">
                <button class="btn-add-to-cart" (click)="addToCart(favorite, $event)">
                  <i class="fa-solid fa-plus"></i>
                  In den Warenkorb
                </button>
                <button class="btn-remove-favorite" (click)="removeFavorite(favorite, $event)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div class="load-more-section" *ngIf="!isLoading && !error && favorites.length > 0 && hasMore">
          <button class="btn-load-more" (click)="loadMore()">
            <i class="fa-solid fa-plus"></i>
            Mehr anzeigen
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .favorites-section {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      background: var(--gradient-primary);
      color: white;
      cursor: pointer;
    }

    .section-header h2 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .toggle-favorites-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
    }

    .toggle-favorites-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .favorites-content {
      padding: var(--space-4);
    }

    .loading-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-danger);
    }

    .error-state i {
      font-size: 3rem;
      color: var(--color-danger);
      margin-bottom: var(--space-4);
    }

    .error-state p {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-sm);
    }

    .btn-retry {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-retry:hover {
      background: var(--color-primary-700);
      transform: translateY(-1px);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 4rem;
      color: var(--color-border);
      margin-bottom: var(--space-4);
    }

    .empty-state h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .empty-state p {
      margin: 0;
      font-size: var(--text-sm);
    }

    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .favorite-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition);
      cursor: pointer;
    }

    .favorite-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
    }

    .favorite-image {
      position: relative;
      height: 150px;
      overflow: hidden;
    }

    .favorite-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .favorite-badge {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      background: var(--color-primary);
      color: white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
    }

    .favorite-content {
      padding: var(--space-4);
    }

    .favorite-header {
      margin-bottom: var(--space-2);
    }

    .favorite-name {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
      font-size: var(--text-base);
      font-weight: 600;
      line-height: 1.3;
    }

    .favorite-restaurant {
      color: var(--color-primary);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .favorite-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: 1.4;
      margin-bottom: var(--space-3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .favorite-footer {
      margin-bottom: var(--space-3);
    }

    .favorite-price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-success);
      margin-bottom: var(--space-1);
    }

    .favorite-stats {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .order-count {
      font-size: var(--text-sm);
      color: var(--color-primary);
      font-weight: 600;
    }

    .last-ordered {
      font-size: var(--text-xs);
      color: var(--color-muted);
    }

    .favorite-actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-add-to-cart {
      flex: 1;
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      font-size: var(--text-sm);
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
    }

    .btn-add-to-cart:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-remove-favorite {
      background: var(--color-danger);
      color: white;
      border: none;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-remove-favorite:hover {
      background: color-mix(in oklab, var(--color-danger) 85%, black);
      transform: translateY(-1px);
    }

    .load-more-section {
      text-align: center;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-load-more {
      background: var(--color-muted-100);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin: 0 auto;
    }

    .btn-load-more:hover {
      background: var(--color-muted-200);
      transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .favorites-grid {
        grid-template-columns: 1fr;
      }

      .favorite-actions {
        flex-direction: column;
      }

      .btn-add-to-cart {
        order: 1;
      }

      .btn-remove-favorite {
        order: 2;
        align-self: center;
        width: fit-content;
      }
    }
  `]
})
export class FavoritesSectionComponent implements OnInit, OnDestroy {
  @Input() restaurantId?: string;
  @Input() showFavorites: boolean = true;
  @Output() favoriteSelected = new EventEmitter<FavoriteItem>();
  @Output() addToCartClicked = new EventEmitter<FavoriteItem>();
  @Output() removeFavoriteClicked = new EventEmitter<FavoriteItem>();

  favorites: FavoriteItem[] = [];
  isLoading = false;
  error: string | null = null;
  hasMore = false;
  isExpanded = true;
  private destroy$ = new Subject<void>();

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFavorites() {
    this.isExpanded = !this.isExpanded;
  }

  loadFavorites() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;

    this.favoritesService.getFavorites(this.restaurantId, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.favorites = response.favorites;
          this.hasMore = response.favorites.length === 10;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Fehler beim Laden der Favoriten';
          this.isLoading = false;
          console.error('Error loading favorites:', error);
        }
      });
  }

  loadMore() {
    if (this.isLoading || !this.hasMore) return;

    const currentLimit = 10;
    this.favoritesService.getFavorites(this.restaurantId, currentLimit + 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.favorites = response.favorites;
          this.hasMore = response.favorites.length === currentLimit + 10;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Fehler beim Laden weiterer Favoriten';
          this.isLoading = false;
          console.error('Error loading more favorites:', error);
        }
      });
  }

  selectFavorite(favorite: FavoriteItem) {
    this.favoriteSelected.emit(favorite);
  }

  addToCart(favorite: FavoriteItem, event: Event) {
    event.stopPropagation();
    this.addToCartClicked.emit(favorite);
  }

  removeFavorite(favorite: FavoriteItem, event: Event) {
    event.stopPropagation();
    this.removeFavoriteClicked.emit(favorite);
  }

  formatPrice(priceCents: number): string {
    return this.favoritesService.formatPrice(priceCents);
  }

  formatDate(dateString: string): string {
    return this.favoritesService.formatDate(dateString);
  }
}

