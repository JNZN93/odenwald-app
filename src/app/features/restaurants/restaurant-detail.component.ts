import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe, NgForOf, NgIf, CurrencyPipe } from '@angular/common';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { CartService } from '../../core/services/supplier.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable, map, switchMap, tap } from 'rxjs';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  category_id: string | null;
  image_url?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
}

interface MenuCategory {
  id: string;
  restaurant_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: Date;
  updated_at: Date;
  items: MenuItem[];
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgIf, CurrencyPipe, ImageFallbackDirective],
  template: `
    <div class="restaurant-detail" *ngIf="restaurant$ | async as restaurant">
      <!-- Restaurant Header -->
      <div class="restaurant-header">
        <div class="header-image">
          <img [src]="restaurant.images.banner || restaurant.images.logo" [alt]="restaurant.name">
          <div class="image-overlay">
            <button class="back-btn" (click)="goBack()">
              <i class="fa-solid fa-arrow-left"></i>
              Zurück
            </button>
          </div>
        </div>

        <div class="header-content">
          <div class="restaurant-info">
            <h1 class="restaurant-name">{{ restaurant.name }}</h1>
            <p class="restaurant-description">{{ restaurant.description }}</p>

            <div class="restaurant-meta">
              <div class="meta-item">
                <i class="fa-solid fa-star"></i>
                <span>{{ restaurant.rating }} ({{ restaurant.total_reviews }} Bewertungen)</span>
              </div>
              <div class="meta-item">
                <i class="fa-regular fa-clock"></i>
                <span>{{ restaurant.delivery_info.estimated_delivery_time_minutes }} Min Lieferzeit</span>
              </div>
              <div class="meta-item">
                <i class="fa-regular fa-euro-sign"></i>
                <span>Min. {{ restaurant.delivery_info.minimum_order_amount }}€</span>
              </div>
              <div class="meta-item">
                <i class="fa-regular fa-truck"></i>
                <span>{{ restaurant.delivery_info.delivery_fee }}€ Liefergebühr</span>
              </div>
            </div>
          </div>

          <div class="restaurant-status">
            <span class="status-badge" [class.open]="isOpen(restaurant)" [class.closed]="!isOpen(restaurant)">
              <i class="fa-solid" [class.fa-circle-check]="isOpen(restaurant)" [class.fa-circle-xmark]="!isOpen(restaurant)"></i>
              {{ isOpen(restaurant) ? 'Geöffnet' : 'Geschlossen' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Menu Categories -->
      <div class="menu-section">
        <div class="container">
          <h2 class="menu-title">Speisekarte</h2>

          <ng-container *ngIf="menuData$ | async as menuData; else loading">
            <div class="no-menu" *ngIf="!menuData.categories || menuData.categories.length === 0">
              <i class="fa-regular fa-utensils"></i>
              <p>Keine Speisekarte verfügbar</p>
            </div>

            <div class="menu-categories" *ngIf="menuData.categories && menuData.categories.length > 0">
              <div *ngFor="let category of menuData.categories" class="menu-category">
                <h3 class="category-title">{{ category.name }}</h3>

                <div class="menu-items">
                  <div *ngFor="let item of category.items" class="menu-item" [class.unavailable]="!item.is_available">
                    <div class="item-content">
                      <div class="item-image-container">
                        <img
                          [src]="item.image_url || ''"
                          [alt]="item.name"
                          class="item-image"
                          loading="lazy"
                          appImageFallback
                        >
                      </div>

                      <div class="item-info">
                        <h4 class="item-name">{{ item.name }}</h4>
                        <p class="item-description" *ngIf="item.description">{{ item.description }}</p>
                        <div class="item-price">{{ item.price_cents / 100 | currency:'EUR':'symbol':'1.2-2':'de' }}</div>
                      </div>
                    </div>

                    <div class="item-actions">
                      <button
                        class="add-to-cart-btn"
                        (click)="addToCart(item, restaurant)"
                        [disabled]="!item.is_available"
                        *ngIf="item.is_available">
                        <i class="fa-solid fa-plus"></i>
                        Hinzufügen
                      </button>
                      <span class="unavailable-text" *ngIf="!item.is_available">Nicht verfügbar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #loading>
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Lade Speisekarte...</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Shopping Cart Preview -->
      <ng-container *ngIf="(cartItemsCount$ | async) as cartCount">
        <div class="cart-preview" *ngIf="cartCount > 0">
          <div class="cart-content">
            <div class="cart-info">
              <i class="fa-solid fa-shopping-cart"></i>
              <span>{{ cartCount }} Artikel im Warenkorb</span>
            </div>
          <button class="view-cart-btn" (click)="viewCart()">
            Warenkorb ansehen
          </button>
        </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .restaurant-detail {
      min-height: 100vh;
    }

    .restaurant-header {
      position: relative;
    }

    .header-image {
      position: relative;
      height: 300px;
      overflow: hidden;
    }

    .header-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: var(--space-6);
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      color: var(--color-text);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .back-btn:hover {
      background: white;
      transform: translateY(-2px);
    }

    .header-content {
      background: var(--color-surface);
      padding: var(--space-8) 0;
      margin-top: -50px;
      position: relative;
      z-index: 2;
    }

    .restaurant-info {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }

    .restaurant-name {
      font-size: var(--text-4xl);
      font-weight: 700;
      margin-bottom: var(--space-3);
      color: var(--color-heading);
    }

    .restaurant-description {
      font-size: var(--text-lg);
      color: var(--color-muted);
      margin-bottom: var(--space-5);
      max-width: 600px;
    }

    .restaurant-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .meta-item i {
      color: var(--color-primary);
    }

    .restaurant-status {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      display: flex;
      justify-content: flex-end;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
      font-size: var(--text-sm);
    }

    .status-badge.open {
      background: color-mix(in oklab, var(--color-success) 15%, white);
      color: var(--color-success);
    }

    .status-badge.closed {
      background: color-mix(in oklab, var(--color-danger) 15%, white);
      color: var(--color-danger);
    }

    .menu-section {
      background: var(--bg-light);
      padding: var(--space-10) 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }

    .menu-title {
      font-size: var(--text-3xl);
      font-weight: 700;
      margin-bottom: var(--space-8);
      color: var(--color-heading);
      text-align: center;
    }

    .no-menu {
      text-align: center;
      padding: var(--space-12) 0;
      color: var(--color-muted);
    }

    .no-menu i {
      font-size: 48px;
      margin-bottom: var(--space-4);
      color: var(--color-border);
    }

    .menu-categories {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .menu-category {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .category-title {
      font-size: var(--text-2xl);
      font-weight: 600;
      margin-bottom: var(--space-6);
      color: var(--color-heading);
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: var(--space-2);
    }

    .menu-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--bg-light);
      transition: all var(--transition);
    }

    .item-content {
      display: flex;
      gap: var(--space-4);
      flex: 1;
      margin-right: var(--space-4);
    }

    .item-image-container {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-border);
    }

    .item-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .menu-item:hover:not(.unavailable) {
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    .menu-item.unavailable {
      opacity: 0.6;
      background: color-mix(in oklab, var(--color-muted) 10%, var(--bg-light));
    }

    .item-info {
      flex: 1;
      margin-right: var(--space-4);
    }

    .item-name {
      font-size: var(--text-lg);
      font-weight: 600;
      margin-bottom: var(--space-2);
      color: var(--color-heading);
    }

    .item-description {
      color: var(--color-muted);
      margin-bottom: var(--space-3);
      line-height: 1.5;
    }

    .item-price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary);
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .add-to-cart-btn {
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .add-to-cart-btn:hover:not(:disabled) {
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .add-to-cart-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .unavailable-text {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-style: italic;
    }

    .loading-state {
      text-align: center;
      padding: var(--space-12) 0;
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

    .cart-preview {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-primary-700);
      border-top: 2px solid var(--color-primary-600);
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
      z-index: 100;
    }

    .cart-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-4) var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cart-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: white;
      font-weight: 600;
    }

    .cart-info i {
      color: rgba(255, 255, 255, 0.9);
      font-size: var(--text-lg);
    }

    .view-cart-btn {
      background: var(--color-primary-800);
      border: 2px solid var(--color-primary-700);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .view-cart-btn:hover {
      background: var(--color-primary-900);
      border-color: var(--color-primary-800);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .restaurant-name {
        font-size: var(--text-2xl);
      }

      .restaurant-meta {
        flex-direction: column;
        gap: var(--space-3);
      }

      .menu-item {
        flex-direction: column;
        gap: var(--space-3);
      }

      .item-content {
        flex-direction: column;
        gap: var(--space-3);
      }

      .item-image-container {
        width: 60px;
        height: 60px;
        align-self: center;
      }

      .item-info {
        margin-right: 0;
      }

      .cart-content {
        flex-direction: column;
        gap: var(--space-3);
        text-align: center;
      }
    }
  `]
})
export class RestaurantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restaurantsService = inject(RestaurantsService);
  private cartService = inject(CartService);

  restaurant$!: Observable<RestaurantDTO>;
  menuData$!: Observable<{ categories: MenuCategory[] }>;
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart ? this.cartService.getItemCount() : 0)
  );

  ngOnInit() {
    const restaurantId = this.route.snapshot.paramMap.get('id');
    console.log('🏪 Restaurant detail component initialized with ID:', restaurantId);

    if (!restaurantId) {
      console.log('❌ No restaurant ID found, navigating to customer page');
      this.router.navigate(['/customer']);
      return;
    }

    this.restaurant$ = this.restaurantsService.getById(restaurantId).pipe(
      tap(restaurant => {
        console.log('🔥 Restaurant data:', restaurant);
      })
    );

    this.menuData$ = this.restaurant$.pipe(
      switchMap(restaurant => {
        console.log('🔄 Switching to menu data for restaurant:', restaurantId);
        return this.restaurantsService.getMenuCategoriesWithItems(restaurantId).pipe(
          tap(categories => {
            console.log('🍽️ Menu categories with items:', categories);
            console.log('📊 Categories count:', categories?.length || 0);
          }),
          map(categories => {
            console.log('📋 Final menu data:', { categories });
            return { categories };
          })
        );
      })
    );
  }

  isOpen(restaurant: RestaurantDTO): boolean {
    // Check if restaurant is active first
    if (!restaurant.is_active) {
      return false;
    }

    // Check current time against opening hours
    const now = new Date();
    const currentDay = this.getCurrentDayName(now.getDay());
    const currentTime = this.formatTime(now);

    const todayHours = restaurant.opening_hours[currentDay];

    // If restaurant is closed today, return false
    if (todayHours.is_closed) {
      return false;
    }

    // Compare current time with opening hours
    const openTime = todayHours.open;
    const closeTime = todayHours.close;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  private getCurrentDayName(dayIndex: number): keyof RestaurantDTO['opening_hours'] {
    const days: Array<keyof RestaurantDTO['opening_hours']> = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    return days[dayIndex];
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  addToCart(item: MenuItem, restaurant: RestaurantDTO) {
    console.log('Adding to cart:', item);
    this.cartService.addToCart(item, restaurant);
  }

  viewCart() {
    // TODO: Navigate to cart/checkout page
    this.router.navigate(['/checkout']);
    console.log('Navigate to cart');
  }

  goBack() {
    this.router.navigate(['/customer']);
  }
}