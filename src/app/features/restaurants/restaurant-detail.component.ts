import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe, NgForOf, NgIf, CurrencyPipe, JsonPipe, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { OrdersService, LoyaltyData } from '../../core/services/orders.service';
import { AuthService } from '../../core/auth/auth.service';
import { MenuItemVariantsModalComponent } from './menu-item-variants-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { CartService } from '../../core/services/supplier.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { Observable, map, switchMap, tap, of, catchError } from 'rxjs';

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
  variants?: MenuItemVariant[];
}

interface MenuItemVariant {
  id: string;
  name: string;
  is_required: boolean;
  min_selections?: number;
  max_selections?: number;
  options: MenuItemVariantOption[];
}

interface MenuItemVariantOption {
  id: string;
  name: string;
  price_modifier_cents: number;
  is_available: boolean;
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

interface MenuCategoryWithItems {
  id: string;
  restaurant_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgIf, CurrencyPipe, JsonPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, ImageFallbackDirective, MenuItemVariantsModalComponent],
  template: `
    <div class="restaurant-detail" *ngIf="restaurant$ | async as restaurant">
      <!-- Restaurant Header -->
      <div class="restaurant-header">
        <div class="header-image" *ngIf="showDetailsView">
          <img [src]="restaurant.images.banner || restaurant.images.logo" [alt]="restaurant.name">
          <div class="image-overlay">
            <button class="back-btn" (click)="goBack()">
              <i class="fa-solid fa-arrow-left"></i>
              Zurück
            </button>
          </div>
        </div>

        <div class="header-content" *ngIf="showDetailsView">
          <div class="restaurant-info">
            <h1 class="restaurant-name">{{ restaurant.name }}</h1>
            <p class="restaurant-description">{{ restaurant.description }}</p>

            <!-- Button to switch to menu view -->
            <div class="view-switcher">
              <button class="switch-to-menu-btn" (click)="switchToMenuView()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 6h8"/>
                  <path d="M8 10h8"/>
                  <path d="M8 14h8"/>
                  <path d="M8 18h8"/>
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
                Speisekarte ansehen
              </button>
            </div>

            <div class="restaurant-meta">
              <div class="meta-item" [style.--item-index]="0">
                <i class="fa-solid fa-star"></i>
                <span>{{ restaurant.rating }} ({{ restaurant.total_reviews }} Bewertungen)</span>
              </div>
              <div class="meta-item" [style.--item-index]="1">
                <button class="eta-badge"
                        [class.eta-fast]="getEtaStatus(etaSummaryMinutes !== null ? etaSummaryMinutes : restaurant.delivery_info.estimated_delivery_time_minutes) === 'fast'"
                        [class.eta-medium]="getEtaStatus(etaSummaryMinutes !== null ? etaSummaryMinutes : restaurant.delivery_info.estimated_delivery_time_minutes) === 'medium'"
                        [class.eta-slow]="getEtaStatus(etaSummaryMinutes !== null ? etaSummaryMinutes : restaurant.delivery_info.estimated_delivery_time_minutes) === 'slow'"
                        (click)="openEtaModal(restaurant.id)">
                  <i class="fa-regular fa-clock"></i>
                  <span>Aktuell: {{ etaSummaryMinutes !== null ? etaSummaryMinutes : restaurant.delivery_info.estimated_delivery_time_minutes }} Min</span>
                </button>
              </div>
              <div class="meta-item" [style.--item-index]="2">
                <i class="fa-solid fa-clock"></i>
                <span>Durchschnitt: {{ restaurant.delivery_info.estimated_delivery_time_minutes }} Min</span>
              </div>
              <div class="meta-item" [style.--item-index]="3">
                <i class="fa-solid fa-euro-sign"></i>
                <span>Min. {{ restaurant.delivery_info.minimum_order_amount }}€</span>
              </div>
              <div class="meta-item" [style.--item-index]="4">
                <i class="fa-solid fa-truck"></i>
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

          <!-- Loyalty Status for logged-in users -->
          <div class="loyalty-status" *ngIf="(isLoggedIn$ | async) && currentLoyaltyData">
            <div class="loyalty-badge">
              <i class="fa-solid fa-ticket-alt"></i>
              <span>{{ currentLoyaltyData.current_stamps }}/{{ currentLoyaltyData.stamps_required }} Stempel</span>
              <button
                *ngIf="currentLoyaltyData.can_redeem"
                class="redeem-btn-small"
                (click)="onRedeemLoyalty(currentLoyaltyData)"
              >
                {{ currentLoyaltyData.discount_percent }}% Rabatt
              </button>
            </div>
          </div>

          <!-- Manager-defined Details Sections -->
          <div class="details-sections" *ngIf="(restaurant.details_sections?.length || 0) > 0">
            <div class="section" *ngFor="let section of (restaurant.details_sections || []); let i = index" [style.--section-index]="i">
              <h3 class="section-title" *ngIf="section.title">{{ section.title }}</h3>

              <ng-container [ngSwitch]="section.type">
                <!-- Text Section -->
                <div *ngSwitchCase="'text'" class="section-text" [innerText]="section.content"></div>

                <!-- Gallery Section -->
                <div *ngSwitchCase="'gallery'" class="section-gallery">
                  <div class="gallery-grid" *ngIf="section.images && section.images.length">
                    <div class="gallery-item" *ngFor="let img of section.images; let i = index">
                      <img [src]="img" [alt]="section.title || 'Galerie'" loading="lazy" />
                      <div class="gallery-overlay">
                        <span class="gallery-counter">{{ i + 1 }} / {{ section.images.length }}</span>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="!section.images || section.images.length === 0" class="empty-gallery">
                    <i class="fa-regular fa-images"></i>
                    <p>Keine Bilder vorhanden</p>
                  </div>
                </div>

                <!-- Video Section -->
                <div *ngSwitchCase="'video'" class="section-video">
                  <div class="video-container" *ngIf="section.video_url">
                    <iframe
                      width="100%"
                      height="400"
                      [src]="sanitizeVideoUrl(section.video_url)"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                    ></iframe>
                    <div class="video-play-button">
                      <i class="fa-solid fa-play"></i>
                    </div>
                  </div>
                  <div *ngIf="!section.video_url" class="empty-video">
                    <i class="fa-regular fa-circle-play"></i>
                    <p>Keine Video-URL vorhanden</p>
                  </div>
                </div>

                <!-- Fallback unknown type -->
                <div *ngSwitchDefault class="section-unknown">
                  <i class="fa-regular fa-circle-question"></i>
                  <p>Unbekannter Inhaltstyp</p>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug ETA Modal -->
      <div class="modal-backdrop" *ngIf="etaModalOpen" (click)="closeEtaModal()"></div>
      <div class="modal" *ngIf="etaModalOpen">
        <div class="modal-header">
          <h3>ETA Debug</h3>
          <button class="close-btn" (click)="closeEtaModal()">×</button>
        </div>
        <div class="modal-body" *ngIf="etaDebug; else modalLoading">
          <div class="eta-summary">
            <div class="eta-value">{{ etaDebug?.computed_eta_minutes }}<span>Min</span></div>
            <div class="eta-base">Basis: {{ etaDebug?.base_minutes }} Min</div>
          </div>
          <div class="eta-grid">
            <div class="eta-card">
              <h4>Komponenten</h4>
              <ul>
                <li>Fahrer-Queue: {{ etaDebug?.components?.driver_queue_minutes }} Min</li>
                <li>Küche-Backlog: {{ etaDebug?.components?.kitchen_backlog_minutes }} Min</li>
                <li>Unterwegs-Overhead: {{ etaDebug?.components?.in_transit_minutes }} Min</li>
              </ul>
            </div>
            <div class="eta-card">
              <h4>Bestellstatus</h4>
              <pre class="pre-inline">{{ etaDebug?.inputs?.status_counts | json }}</pre>
            </div>
            <div class="eta-card">
              <h4>Fahrer</h4>
              <div class="drivers-list">
                <div class="driver-item" *ngFor="let d of etaDebug?.inputs?.drivers">
                  <span class="driver-name">{{ d.name || d.id }}</span>
                  <span class="driver-status">{{ d.status }}</span>
                  <span class="driver-load">Aufträge: {{ d.active_orders }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="close-cta" (click)="closeEtaModal()">Schließen</button>
          </div>
        </div>
        <ng-template #modalLoading>
          <div class="modal-loading">
            <div class="loading-spinner"></div>
            <p>Berechne ETA...</p>
          </div>
        </ng-template>
      </div>


      <!-- Menu Categories (only show when not in details view) -->
      <div class="menu-section menu-compact" *ngIf="!showDetailsView">
        <div class="container">
          <h2 class="menu-title">Speisekarte</h2>


          <!-- Back Button for Menu View -->
          <div class="menu-back-button" *ngIf="!showDetailsView">
            <button class="back-btn" (click)="goBack()">
              <i class="fa-solid fa-arrow-left"></i>
              Zurück
            </button>
          </div>

          <!-- Sticky Category Navigation - Always visible at top of menu section -->
          <ng-container *ngIf="menuData$ | async as menuData">
            <div class="sticky-category-nav-inline" *ngIf="menuData?.categories && menuData.categories.length > 0">
              <div class="nav-container">
                <div class="category-nav">
                  <button
                    class="nav-item"
                    [class.active]="activeCategory === ''"
                    (click)="scrollToTop()">
                    Alle
                  </button>
                  <button
                    *ngFor="let category of menuData.categories"
                    class="nav-item"
                    [class.active]="activeCategory === category.id"
                    (click)="scrollToCategoryAndHighlight(category.id)"
                    [attr.data-nav-category]="category.id">
                    {{ category.name }}
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="menuData$ | async as menuData; else loading">
            <div class="no-menu" *ngIf="!menuData.categories || menuData.categories.length === 0">
              <i class="fa-regular fa-utensils"></i>
              <p>Keine Speisekarte verfügbar</p>
            </div>

            <div class="menu-categories" *ngIf="menuData.categories && menuData.categories.length > 0">
              <div *ngFor="let category of menuData.categories"
                   class="menu-category"
                   [id]="category.id"
                   [attr.data-category-id]="category.id">
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
                        <span class="btn-text">Hinzufügen</span>
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

      <!-- Variants Selection Modal -->
      <app-menu-item-variants-modal
        *ngIf="variantsModalOpen"
        [menuItem]="selectedMenuItem"
        [isOpen]="variantsModalOpen"
        (close)="closeVariantsModal()"
        (confirm)="onVariantsConfirm($event)">
      </app-menu-item-variants-modal>

  `,
  styles: [`
    .restaurant-detail {
      min-height: 100vh;
      padding-bottom: calc(80px + var(--space-6));
    }

    /* Sticky Category Navigation */
    .sticky-category-nav-inline {
      position: sticky;
      top: 0;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      z-index: 100;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }

    .category-nav {
      display: flex;
      gap: var(--space-1);
      padding: var(--space-3) 0;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .category-nav::-webkit-scrollbar {
      display: none;
    }

    .nav-item {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text);
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .nav-item.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      font-weight: 600;
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
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      line-height: 1.2;
    }

    .restaurant-description {
      font-size: var(--text-lg);
      color: var(--color-muted);
      margin-bottom: var(--space-5);
      max-width: 600px;
      line-height: 1.6;
      background: rgba(255, 255, 255, 0.8);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(8px);
    }

    .view-switcher {
      margin-bottom: var(--space-6);
    }

    .switch-to-menu-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-xl);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary) 30%, transparent);
      position: relative;
      overflow: hidden;
    }

    .switch-to-menu-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.6s;
    }

    .switch-to-menu-btn:hover::before {
      left: 100%;
    }

    .switch-to-menu-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px color-mix(in oklab, var(--color-primary) 40%, transparent);
    }

    .switch-to-menu-btn .btn-icon {
      width: 20px;
      height: 20px;
      transition: transform var(--transition);
    }

    .switch-to-menu-btn:hover .btn-icon {
      transform: scale(1.1);
    }

    .switch-to-details-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .switch-to-details-btn:hover {
      background: var(--bg-light);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .switch-to-details-btn .btn-icon {
      width: 18px;
      height: 18px;
    }

    /* Back Button for Menu View */
    .menu-back-button {
      margin-bottom: var(--space-4);
      display: flex;
      justify-content: flex-start;
    }

    .menu-back-button .back-btn {
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .menu-back-button .back-btn:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
      font-weight: 500;
      background: rgba(255, 255, 255, 0.8);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(8px);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .meta-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .meta-item i {
      color: var(--color-primary);
      font-size: var(--text-lg);
    }

    .restaurant-status {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      display: flex;
      justify-content: flex-end;
    }

    .loyalty-status {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      display: flex;
      justify-content: flex-end;
      margin-top: var(--space-2);
    }

    .loyalty-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: linear-gradient(135deg, var(--color-success), color-mix(in oklab, var(--color-success) 80%, white));
      border: 2px solid var(--color-success);
      border-radius: var(--radius-xl);
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-sm);
      font-weight: 600;
      color: white;
      box-shadow: var(--shadow-md);
      transition: all var(--transition);
    }

    .loyalty-badge:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .loyalty-badge i {
      font-size: var(--text-lg);
    }

    .redeem-btn-small {
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      margin-left: var(--space-2);
      box-shadow: var(--shadow-sm);
    }

    .redeem-btn-small:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: var(--shadow-md);
    }

    .eta-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 9999px;
      padding: 8px 16px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 2px solid;
    }
    .eta-badge i { color: white; font-size: 14px; }
    .eta-badge:hover { 
      transform: translateY(-2px);
    }

    /* Fast ETA (≤25 min) - Green */
    .eta-badge.eta-fast {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #047857;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .eta-badge.eta-fast:hover {
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    /* Medium ETA (26-45 min) - Yellow/Orange */
    .eta-badge.eta-medium {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-color: #b45309;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    .eta-badge.eta-medium:hover {
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    }

    /* Slow ETA (>45 min) - Red */
    .eta-badge.eta-slow {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-color: #b91c1c;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .eta-badge.eta-slow:hover {
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }

    .eta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
    }

    .eta-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .drivers-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .driver-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .pre-inline {
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      background: var(--bg-light);
      padding: 8px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(900px, calc(100% - 32px));
      max-height: 80vh;
      overflow: auto;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      z-index: 1001;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .modal-body {
      padding: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
    }

    .close-cta {
      background: var(--color-primary-600);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      padding: 8px 12px;
      cursor: pointer;
    }

    .eta-summary {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 12px;
    }

    .eta-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--color-heading);
    }

    .eta-value span { font-size: 16px; font-weight: 600; margin-left: 6px; }

    .status-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: var(--text-sm);
      box-shadow: var(--shadow-md);
      transition: all var(--transition);
    }

    .status-badge:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .status-badge.open {
      background: linear-gradient(135deg, var(--color-success), color-mix(in oklab, var(--color-success) 80%, white));
      color: white;
      border: 2px solid var(--color-success);
    }

    .status-badge.closed {
      background: linear-gradient(135deg, var(--color-danger), color-mix(in oklab, var(--color-danger) 80%, white));
      color: white;
      border: 2px solid var(--color-danger);
    }

    .menu-section {
      background: var(--bg-light);
      padding: var(--space-10) 0;
    }

    .menu-section.menu-compact {
      padding: 0;
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

      /* Desktop: Text anzeigen */
      .add-to-cart-btn .btn-text {
        display: inline;
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

    /* Responsive - Balanced mobile header (compact but readable) */
    @media (max-width: 768px) {
      /* Moderate header image height reduction */
      .header-image {
        height: 240px;
      }

      /* Balanced header content padding */
      .header-content {
        padding: var(--space-6) 0;
        margin-top: -40px;
      }

      /* Well-proportioned back button */
      .back-btn {
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-sm);
        border-radius: var(--radius-lg);
      }

      .image-overlay {
        padding: var(--space-5);
      }

      /* Readable restaurant name size */
      .restaurant-name {
        font-size: var(--text-2xl);
        margin-bottom: var(--space-3);
        line-height: 1.3;
      }

      /* Balanced description */
      .restaurant-description {
        font-size: var(--text-base);
        margin-bottom: var(--space-4);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Improved meta layout with better spacing */
      .restaurant-meta {
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .meta-item {
        font-size: var(--text-sm);
        gap: var(--space-2);
      }

      .meta-item i {
        font-size: 14px;
      }

      /* Better proportioned ETA badge */
      .eta-badge {
        padding: 6px 12px;
        font-size: var(--text-sm);
        border-radius: 16px;
      }

      .eta-badge i {
        font-size: 12px;
      }

      /* Well-sized status badge */
      .status-badge {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
        border-radius: var(--radius-lg);
      }

      .status-badge i {
        font-size: 12px;
      }

      /* Balanced restaurant info and status */
      .restaurant-info {
        padding: 0 var(--space-4);
      }

      .restaurant-status {
        padding: 0 var(--space-4);
        margin-top: var(--space-3);
      }

      .container {
        padding: 0 var(--space-4);
      }

      .menu-title {
        font-size: var(--text-2xl);
        margin-bottom: var(--space-4);
      }

      .menu-categories {
        gap: var(--space-4);
      }

      .menu-category {
        padding: var(--space-4);
        border-radius: var(--radius-lg);
      }

      .category-title {
        font-size: var(--text-lg);
        margin-bottom: var(--space-3);
        padding-bottom: var(--space-1);
      }

      .menu-items {
        gap: 0; /* Kein Gap zwischen Items, da margin-bottom verwendet wird */
      }

      /* Lieferando-ähnliches kompaktes Layout für mobile */
      .menu-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: var(--space-4);
        gap: var(--space-4);
        background: white;
        border-radius: var(--radius-lg);
        border: 1px solid #e5e7eb;
        margin-bottom: var(--space-3);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .item-content {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--space-4);
        flex: 1;
        min-width: 0;
      }

      /* Text-Content links, Bild rechts wie bei Lieferando */
      .item-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        order: 1;
      }

      .item-name {
        font-size: var(--text-base);
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 var(--space-1) 0;
        color: var(--color-heading);
      }

      .item-description {
        font-size: var(--text-sm);
        line-height: 1.4;
        margin: 0 0 var(--space-2) 0;
        color: var(--color-muted);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .item-price {
        font-size: var(--text-base);
        font-weight: 700;
        color: var(--color-primary);
        margin: 0;
      }

      /* Bild rechts positioniert */
      .item-image-container {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--color-border);
        position: relative;
        order: 2;
      }

      /* Button am rechten Rand des Bildes positioniert */
      .item-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 20;
        pointer-events: auto;
      }

      .add-to-cart-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-size: 14px;
        font-weight: 700;
        border: 2px solid white;
        background: var(--color-primary-600);
        color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all var(--transition);
        cursor: pointer;
        position: relative;
        z-index: 30;
      }

      .add-to-cart-btn .btn-text {
        display: none; /* Verstecke Text auf Mobile */
      }

      .add-to-cart-btn:hover:not(:disabled) {
        background: var(--color-primary-700);
        transform: scale(1.1);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
      }

      .add-to-cart-btn:active {
        transform: scale(1.05);
        background: var(--color-primary-800);
      }

      .add-to-cart-btn:focus {
        outline: 1px solid rgba(79, 169, 108, 0.5);
        outline-offset: 1px;
      }

      .unavailable-text {
        font-size: var(--text-xs);
        color: var(--color-muted);
        font-style: italic;
        text-align: center;
        padding: var(--space-2);
        background: #f9fafb;
        border-radius: var(--radius-md);
        margin: var(--space-2) 0;
      }

      /* Deaktivierte Produkte */
      .menu-item.unavailable {
        opacity: 0.6;
        background: #f9fafb;
        border-color: #e5e7eb;
      }

      .menu-item.unavailable .item-image-container {
        opacity: 0.5;
      }

      .menu-item.unavailable .item-name {
        color: var(--color-muted);
      }

      .menu-item.unavailable .item-price {
        color: var(--color-muted);
      }

      .menu-item.unavailable .add-to-cart-btn {
        background: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
        border-color: #d1d5db;
        transform: none;
      }

      .menu-item.unavailable .add-to-cart-btn:hover {
        transform: none;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
        background: #9ca3af;
      }
    }

    .cart-content {
        flex-direction: column;
        gap: var(--space-3);
        text-align: center;
      }

      .restaurant-detail {
        padding-bottom: calc(100px + var(--space-6));
      }

      /* Sticky Navigation Mobile Styles */
      .sticky-category-nav {
        top: 0; /* Ensure it stays at top on mobile */
      }

      .nav-container {
        padding: 0 var(--space-4);
      }

      .category-nav {
        padding: var(--space-2) 0;
        gap: var(--space-2);
      }

      .nav-item {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
        border-radius: var(--radius-md);
      }

      /* Additional mobile header improvements for very small screens */
      @media (max-width: 480px) {
        .header-image {
          height: 200px;
        }

        .header-content {
          padding: var(--space-4) 0;
          margin-top: -30px;
        }

        .restaurant-name {
          font-size: var(--text-xl);
          margin-bottom: var(--space-2);
        }

        .restaurant-description {
          font-size: var(--text-sm);
          -webkit-line-clamp: 2;
        }

        .restaurant-meta {
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .meta-item {
          font-size: var(--text-xs);
        }

        .eta-badge {
          padding: 4px 8px;
          font-size: var(--text-xs);
        }

        .status-badge {
          padding: var(--space-1) var(--space-2);
          font-size: var(--text-xs);
        }
      }

      /* Enhanced Details Sections Styling */
      .details-sections {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--space-6);
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
      }

    .section {
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
    }

      .section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--gradient-primary);
      }

      .section-title {
        font-size: var(--text-2xl);
        font-weight: 700;
        margin-bottom: var(--space-6);
        color: var(--color-heading);
        border-bottom: 3px solid var(--color-primary);
        padding-bottom: var(--space-3);
        display: inline-block;
        position: relative;
      }

      .section-title::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 0;
        width: 50px;
        height: 3px;
        background: var(--gradient-primary);
        border-radius: 2px;
      }

      .section-text {
        font-size: var(--text-lg);
        line-height: 1.8;
        color: var(--color-text);
        white-space: pre-wrap;
        background: var(--bg-light);
        padding: var(--space-6);
        border-radius: var(--radius-lg);
        border-left: 4px solid var(--color-primary);
        margin: var(--space-4) 0;
      }

      .section-gallery {
        margin-top: var(--space-6);
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-6);
        margin-top: var(--space-6);
      }

      .gallery-item {
        position: relative;
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        transition: all var(--transition);
        cursor: pointer;
      }

      .gallery-item:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .gallery-item img {
        width: 100%;
        height: 240px;
        object-fit: cover;
        transition: transform var(--transition);
      }

      .gallery-item:hover img {
        transform: scale(1.05);
      }

      .gallery-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
        display: flex;
        align-items: flex-end;
        padding: var(--space-4);
        opacity: 0;
        transition: opacity var(--transition);
      }

      .gallery-item:hover .gallery-overlay {
        opacity: 1;
      }

      .gallery-counter {
        color: white;
        font-size: var(--text-sm);
        font-weight: 600;
        background: rgba(0,0,0,0.7);
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        backdrop-filter: blur(4px);
      }

      .empty-gallery {
        text-align: center;
        padding: var(--space-12);
        color: var(--color-muted);
        background: var(--bg-light);
        border-radius: var(--radius-xl);
        border: 2px dashed var(--color-border);
      }

      .empty-gallery i {
        font-size: 48px;
        margin-bottom: var(--space-4);
        color: var(--color-border);
      }

      .section-video {
        margin-top: var(--space-6);
      }

      .video-container {
        position: relative;
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-lg);
        background: #000;
      }

      .video-container iframe {
        border-radius: var(--radius-xl);
        display: block;
      }

      .video-play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--color-primary);
        transition: all var(--transition);
        opacity: 0.8;
      }

      .video-container:hover .video-play-button {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
      }

      .empty-video {
        text-align: center;
        padding: var(--space-12);
        color: var(--color-muted);
        background: var(--bg-light);
        border-radius: var(--radius-xl);
        border: 2px dashed var(--color-border);
      }

      .empty-video i {
        font-size: 48px;
        margin-bottom: var(--space-4);
        color: var(--color-border);
      }

      .section-unknown {
        text-align: center;
        padding: var(--space-12);
        color: var(--color-muted);
        background: var(--bg-light);
        border-radius: var(--radius-xl);
        border: 2px dashed var(--color-border);
      }

      .section-unknown i {
        font-size: 48px;
        margin-bottom: var(--space-4);
        color: var(--color-border);
      }
  `]
})
export class RestaurantDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restaurantsService = inject(RestaurantsService);
  private ordersService = inject(OrdersService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  restaurant$!: Observable<RestaurantDTO>;
  menuData$!: Observable<{ categories: MenuCategoryWithItems[] }>;
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart ? this.cartService.getItemCount() : 0)
  );
  isLoggedIn$ = this.authService.currentUser$.pipe(map(user => !!user));
  currentLoyaltyData: LoyaltyData | null = null;

  etaDebug: any | null = null;
  etaModalOpen = false;
  etaSummaryMinutes: number | null = null;

  // Variants modal
  variantsModalOpen = false;
  selectedMenuItem: MenuItem | null = null;
  currentRestaurant: RestaurantDTO | null = null;

  // Category navigation
  activeCategory = ''; // Currently active/highlighted category based on scroll position
  showDetailsView = false; // true = show restaurant details, false = show menu
  private scrollHandler: (() => void) | null = null;
  private sanitizer = inject(DomSanitizer);

  ngOnInit() {
    const restaurantId = this.route.snapshot.paramMap.get('id');
    const viewParam = this.route.snapshot.queryParamMap.get('view');
    this.showDetailsView = viewParam === 'details';
    console.log('🏪 Restaurant detail component initialized with ID:', restaurantId, 'View:', viewParam);

    if (!restaurantId) {
      console.log('❌ No restaurant ID found, navigating to customer page');
      this.router.navigate(['/customer']);
      return;
    }

    this.restaurant$ = this.restaurantsService.getRestaurantById(restaurantId).pipe(
      tap(restaurant => {
        console.log('🔥 Restaurant data:', restaurant);
        this.currentRestaurant = restaurant;
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

    // Load variants for all menu items
    setTimeout(() => {
      this.loadVariantsForMenuItems(restaurantId).then(() => {
        console.log('🎉 Variants loading completed successfully');
      }).catch((error) => {
        console.error('💥 Variants loading failed:', error);
      });
    }, 1000); // Small delay to ensure menu is rendered

    // Preload ETA summary so the badge shows the dynamic time without opening the modal
    if (restaurantId) {
      this.fetchEtaSummary(restaurantId);
    }

    // Load loyalty data if user is logged in
    this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn && restaurantId) {
        this.loadLoyaltyData(restaurantId);
      }
    });

    // Initialize category navigation after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeCategoryNavigation();
    }, 1000);
  }
  sanitizeVideoUrl(url: string): SafeResourceUrl {
    try {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch {
      return '' as any;
    }
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  isOpen(restaurant: RestaurantDTO): boolean {
    // Check if restaurant is active first
    if (!restaurant.is_active) {
      return false;
    }

    // Check if restaurant is immediately closed (overrides all other checks)
    if (restaurant.is_immediately_closed) {
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

  async addToCart(item: MenuItem, restaurant: RestaurantDTO) {
    console.log('🛒 Adding to cart:', item);
    console.log('📋 Item variants on object:', (item as any).variants);

    // Check if item has variants that need selection
    let variants = (item as any).variants;

    // If no variants loaded yet, try to load them now
    if (!variants || variants.length === 0) {
      console.log('🔄 No variants found, trying to load them now...');
      try {
        const loadedVariants = await this.restaurantsService.getMenuItemVariants(restaurant.id, item.id).toPromise();
        if (loadedVariants && loadedVariants.length > 0) {
          console.log('✅ Variants loaded on-demand:', loadedVariants);

          // Transform and attach to item
          variants = loadedVariants.map(variant => ({
            id: variant.id,
            name: variant.name,
            is_required: variant.is_required,
            min_selections: variant.min_selections,
            max_selections: variant.max_selections,
            options: variant.options.map(option => ({
              id: option.id,
              name: option.name,
              price_modifier_cents: option.price_modifier_cents,
              is_available: option.is_available
            }))
          }));

          // Store on item for future use
          (item as any).variants = variants;
        }
      } catch (error) {
        console.error('❌ Failed to load variants on-demand:', error);
      }
    }

    if (variants && variants.length > 0) {
      console.log('✅ Opening variants modal for item:', item.name);
      console.log('🎯 Final variants data:', variants);
      this.selectedMenuItem = item;
      this.variantsModalOpen = true;
    } else {
      console.log('❌ Still no variants found, adding directly to cart');
      console.log('🔍 Available properties on item:', Object.keys(item));
      // No variants, add directly to cart
      this.cartService.addToCart(item, restaurant);
    }
  }

  viewCart() {
    // TODO: Navigate to cart/checkout page
    this.router.navigate(['/checkout']);
    console.log('Navigate to cart');
  }

  goBack() {
    this.router.navigate(['/customer']);
  }

  debugEta(restaurantId: string) {
    this.restaurantsService.getDeliveryEtaDebug(restaurantId).subscribe({
      next: (data) => {
        this.etaDebug = data;
        console.log('ETA Debug:', data);
        const minutes = typeof data?.computed_eta_minutes === 'number' ? data.computed_eta_minutes : null;
        this.etaSummaryMinutes = minutes;
      },
      error: (err) => {
        console.error('ETA Debug error:', err);
        this.etaDebug = { error: 'Fehler beim Abrufen der ETA-Daten' };
      }
    });
  }

  private fetchEtaSummary(restaurantId: string) {
    this.restaurantsService.getDeliveryEtaDebug(restaurantId).subscribe({
      next: (data) => {
        const minutes = typeof data?.computed_eta_minutes === 'number' ? data.computed_eta_minutes : null;
        this.etaSummaryMinutes = minutes;
      },
      error: () => {
        this.etaSummaryMinutes = null;
      }
    });
  }

  openEtaModal(restaurantId: string) {
    this.etaModalOpen = true;
    this.etaDebug = null;
    this.debugEta(restaurantId);
  }

  closeEtaModal() {
    this.etaModalOpen = false;
  }

  // Variants modal methods
  closeVariantsModal() {
    this.variantsModalOpen = false;
    this.selectedMenuItem = null;
  }

  onVariantsConfirm(selection: { selectedOptionIds: string[], selectedOptions: Array<{id: string, name: string, price_modifier_cents: number}> }) {
    if (this.selectedMenuItem && this.currentRestaurant) {
      this.cartService.addToCart(
        this.selectedMenuItem,
        this.currentRestaurant,
        selection.selectedOptionIds,
        selection.selectedOptions
      );
    }
    this.closeVariantsModal();
  }

  private async loadVariantsForMenuItems(restaurantId: string) {
    try {
      console.log('🏪 Starting to load variants for restaurant:', restaurantId);

      // First get menu categories with items
      const categories = await this.restaurantsService.getMenuCategoriesWithItems(restaurantId).toPromise();
      console.log('📋 Categories loaded:', categories?.length || 0);

      if (!categories) {
        console.warn('❌ No categories found');
        return;
      }

      // Load variants for each menu item
      let totalVariantsLoaded = 0;

      for (const category of categories) {
        console.log(`📂 Processing category: ${category.name} (${category.items.length} items)`);

        for (const item of category.items) {
          try {
            console.log(`🔄 Loading variants for: ${item.name} (ID: ${item.id})`);
            const variants = await this.restaurantsService.getMenuItemVariants(restaurantId, item.id).toPromise();

            if (variants && variants.length > 0) {
              console.log(`✅ Found ${variants.length} variant groups for ${item.name}`);

              // Transform backend variant format to frontend format
              const transformedVariants = variants.map(variant => ({
                id: variant.id,
                name: variant.name,
                is_required: variant.is_required,
                min_selections: variant.min_selections,
                max_selections: variant.max_selections,
                options: variant.options.map(option => ({
                  id: option.id,
                  name: option.name,
                  price_modifier_cents: option.price_modifier_cents,
                  is_available: option.is_available
                }))
              }));

              // Store variants directly on the item object
              (item as any).variants = transformedVariants;
              totalVariantsLoaded++;

              console.log(`✅ Variants attached to ${item.name}:`, transformedVariants);
            } else {
              console.log(`ℹ️ No variants found for ${item.name}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load variants for ${item.name} (${item.id}):`, error);
          }
        }
      }

      console.log(`🎉 Variants loading complete! ${totalVariantsLoaded} items with variants loaded.`);

    } catch (error) {
      console.error('💥 Error loading variants for menu items:', error);
    }
  }

  getEtaStatus(minutes: number): 'fast' | 'medium' | 'slow' {
    if (minutes <= 25) return 'fast';
    if (minutes <= 45) return 'medium';
    return 'slow';
  }

  private loadLoyaltyData(restaurantId: string) {
    this.ordersService.getMyLoyalty().pipe(
      catchError(error => {
        console.error('Error loading loyalty data:', error);
        return of({ count: 0, loyalty: [] });
      })
    ).subscribe(loyaltyResponse => {
      // Find loyalty data for current restaurant
      this.currentLoyaltyData = loyaltyResponse.loyalty.find(
        loyalty => loyalty.restaurant_id === restaurantId
      ) || null;
    });
  }

  onRedeemLoyalty(loyalty: LoyaltyData) {
    // TODO: Implement redemption logic for this restaurant
    alert(`Du kannst ${loyalty.discount_percent}% Rabatt bei ${loyalty.restaurant_name} einlösen!`);
  }

  private initializeCategoryNavigation() {
    // Set up scroll handler for category highlighting
    this.scrollHandler = () => this.updateActiveCategory();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Initial check
    this.updateActiveCategory();

    // Debug: Log alle verfügbaren Kategorie-IDs nach dem Laden
    setTimeout(() => {
      this.logAvailableCategoryIds();
    }, 1000);
  }

  private updateActiveCategory() {
    const categories = document.querySelectorAll('.menu-category');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const menuSection = document.querySelector('.menu-section') as HTMLElement;
    const menuOffset = menuSection ? menuSection.offsetTop : 0;

    let currentCategory = '';

    categories.forEach((category) => {
      const rect = category.getBoundingClientRect();
      const elementTop = rect.top + scrollTop - menuOffset;

      if (scrollTop >= elementTop - 100) { // 100px threshold from menu section
        currentCategory = category.id;
      }
    });

    this.activeCategory = currentCategory;
  }

  scrollToTop() {
    // Scroll to top of menu section
    const menuSection = document.querySelector('.menu-section') as HTMLElement;
    if (menuSection) {
      const menuOffset = menuSection.offsetTop - 20; // Small offset from menu section
      window.scrollTo({
        top: menuOffset,
        behavior: 'smooth'
      });
    }
    this.activeCategory = '';
  }

  scrollToCategoryAndHighlight(categoryId: string) {
    console.log('=== SCROLLING TO CATEGORY ===');
    console.log('Category ID:', categoryId);

    const element = document.getElementById(categoryId);
    console.log('Element found:', element);

    if (element) {
      console.log('Element position:', element.offsetTop);

      // Verwende scrollIntoView mit block: 'start' aber inline: 'nearest'
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',    // Element am Anfang des Viewports
        inline: 'nearest'
      });

      // Nach dem Scroll die Position um 100px nach oben anpassen
      setTimeout(() => {
        const currentScroll = window.pageYOffset;
        const newScroll = Math.max(0, currentScroll - 100);
        console.log('Adjusting scroll from', currentScroll, 'to', newScroll);

        window.scrollTo({
          top: newScroll,
          behavior: 'smooth'
        });
      }, 300); // Warte bis scrollIntoView fertig ist

    } else {
      console.error('❌ Element with ID', categoryId, 'not found');

      // Fallback: Suche nach allen Elementen mit IDs
      const allElements = document.querySelectorAll('[id]');
      console.log('Available IDs:', Array.from(allElements).map(el => el.id));
    }

    this.activeCategory = categoryId;
  }

  switchToMenuView() {
    const restaurantId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/restaurant', restaurantId]);
  }

  switchToDetailsView() {
    const restaurantId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/restaurant', restaurantId], {
      queryParams: { view: 'details' }
    });
  }

  private logAvailableCategoryIds() {
    const categoryElements = document.querySelectorAll('.menu-category[id]');
    const ids = Array.from(categoryElements).map(el => el.id);
    console.log('🔍 Available category IDs:', ids);

    if (ids.length === 0) {
      console.warn('⚠️ No category elements with IDs found!');
    }
  }

}