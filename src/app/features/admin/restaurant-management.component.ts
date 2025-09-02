import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RestaurantsService, RestaurantDTO } from '../../core/services/restaurants.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';
import { environment } from '../../../environments/environment';
import { UpdateRestaurantRequest } from '@odenwald/shared';
import { ToastService } from '../../core/services/toast.service';

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

      <!-- Edit Restaurant Modal -->
      <div class="edit-modal-overlay" *ngIf="showEditModal">
        <div class="edit-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="fa-solid fa-edit"></i> Restaurant bearbeiten</h2>
            <button class="close-btn" (click)="closeEditModal()" [disabled]="loading">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="editingRestaurant && editForm && editForm.address && editForm.contact_info && editForm.delivery_info && editForm.payment_methods">
            <form class="edit-form">
              <!-- Basic Information -->
              <div class="form-section">
                <h3>Grundinformationen</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-name">Name *</label>
                    <input
                      id="edit-name"
                      type="text"
                      [(ngModel)]="editForm.name"
                      name="name"
                      placeholder="Restaurant Name"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-cuisine">Küchentyp *</label>
                    <select
                      id="edit-cuisine"
                      [(ngModel)]="editForm.cuisine_type"
                      name="cuisine_type"
                      required
                    >
                      <option value="">Küchentyp auswählen</option>
                      <option value="italian">Italienisch</option>
                      <option value="german">Deutsch</option>
                      <option value="turkish">Türkisch</option>
                      <option value="chinese">Chinesisch</option>
                      <option value="japanese">Japanisch</option>
                      <option value="american">Amerikanisch</option>
                      <option value="indian">Indisch</option>
                      <option value="french">Französisch</option>
                      <option value="thai">Thailändisch</option>
                      <option value="greek">Griechisch</option>
                      <option value="spanish">Spanisch</option>
                      <option value="mexican">Mexikanisch</option>
                      <option value="vietnamese">Vietnamesisch</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="edit-description">Beschreibung</label>
                  <textarea
                    id="edit-description"
                    [(ngModel)]="editForm.description"
                    name="description"
                    placeholder="Kurze Beschreibung des Restaurants"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <!-- Address Information -->
              <div class="form-section">
                <h3>Adresse</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-street">Straße *</label>
                    <input
                      id="edit-street"
                      type="text"
                      [(ngModel)]="editForm.address.street"
                      name="street"
                      placeholder="Straße und Hausnummer"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-city">Stadt *</label>
                    <input
                      id="edit-city"
                      type="text"
                      [(ngModel)]="editForm.address.city"
                      name="city"
                      placeholder="Stadt"
                      required
                    >
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-postal">PLZ *</label>
                    <input
                      id="edit-postal"
                      type="text"
                      [(ngModel)]="editForm.address.postal_code"
                      name="postal_code"
                      placeholder="Postleitzahl"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-country">Land *</label>
                    <input
                      id="edit-country"
                      type="text"
                      [(ngModel)]="editForm.address.country"
                      name="country"
                      placeholder="Land"
                      value="Deutschland"
                      required
                    >
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="form-section">
                <h3>Kontaktinformationen</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-phone">Telefon *</label>
                    <input
                      id="edit-phone"
                      type="tel"
                      [(ngModel)]="editForm.contact_info.phone"
                      name="phone"
                      placeholder="+49 123 456789"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-email">E-Mail</label>
                    <input
                      id="edit-email"
                      type="email"
                      [(ngModel)]="editForm.contact_info.email"
                      name="email"
                      placeholder="info@restaurant.de"
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label for="edit-website">Website</label>
                  <input
                    id="edit-website"
                    type="url"
                    [(ngModel)]="editForm.contact_info.website"
                    name="website"
                    placeholder="https://www.restaurant.de"
                  >
                </div>
              </div>

              <!-- Delivery Information -->
              <div class="form-section">
                <h3>Lieferinformationen</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-delivery-radius">Lieferradius (km)</label>
                    <input
                      id="edit-delivery-radius"
                      type="number"
                      [(ngModel)]="editForm.delivery_info.delivery_radius_km"
                      name="delivery_radius_km"
                      placeholder="10"
                      min="0"
                      step="0.1"
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-min-order">Mindestbestellwert (€)</label>
                    <input
                      id="edit-min-order"
                      type="number"
                      [(ngModel)]="editForm.delivery_info.minimum_order_amount"
                      name="minimum_order_amount"
                      placeholder="15.00"
                      min="0"
                      step="0.01"
                    >
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-delivery-fee">Liefergebühr (€)</label>
                    <input
                      id="edit-delivery-fee"
                      type="number"
                      [(ngModel)]="editForm.delivery_info.delivery_fee"
                      name="delivery_fee"
                      placeholder="2.50"
                      min="0"
                      step="0.01"
                    >
                  </div>
                  <div class="form-group">
                    <label for="edit-delivery-time">Lieferzeit (Minuten)</label>
                    <input
                      id="edit-delivery-time"
                      type="number"
                      [(ngModel)]="editForm.delivery_info.estimated_delivery_time_minutes"
                      name="estimated_delivery_time_minutes"
                      placeholder="30"
                      min="1"
                      step="1"
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label for="edit-free-delivery">Kostenlose Lieferung ab (€)</label>
                  <input
                    id="edit-free-delivery"
                    type="number"
                    [(ngModel)]="editForm.delivery_info.free_delivery_threshold"
                    name="free_delivery_threshold"
                    placeholder="25.00"
                    min="0"
                    step="0.01"
                  >
                </div>
              </div>

              <!-- Payment Methods -->
              <div class="form-section">
                <h3>Zahlungsmethoden</h3>
                <div class="payment-methods-grid">
                  <label class="payment-method">
                    <input
                      type="checkbox"
                      [(ngModel)]="editForm.payment_methods.cash"
                      name="cash_payment"
                    >
                    <span class="checkmark"></span>
                    Barzahlung
                  </label>
                  <label class="payment-method">
                    <input
                      type="checkbox"
                      [(ngModel)]="editForm.payment_methods.card"
                      name="card_payment"
                    >
                    <span class="checkmark"></span>
                    Kreditkarte
                  </label>
                  <label class="payment-method">
                    <input
                      type="checkbox"
                      [(ngModel)]="editForm.payment_methods.paypal"
                      name="paypal_payment"
                    >
                    <span class="checkmark"></span>
                    PayPal
                  </label>
                </div>
              </div>

              <!-- Restaurant Images -->
              <div class="form-section">
                <h3>Restaurant-Bilder</h3>

                <!-- Current Images Display -->
                <div class="current-images" *ngIf="editingRestaurant?.images">
                  <div class="image-preview" *ngIf="editingRestaurant.images.logo">
                    <h4>Aktuelles Logo:</h4>
                    <img [src]="editingRestaurant.images.logo" [alt]="editingRestaurant.name + ' Logo'" class="preview-image">
                  </div>
                  <div class="image-preview" *ngIf="editingRestaurant.images.banner">
                    <h4>Aktuelles Banner:</h4>
                    <img [src]="editingRestaurant.images.banner" [alt]="editingRestaurant.name + ' Banner'" class="preview-image">
                  </div>
                  <div class="gallery-preview" *ngIf="editingRestaurant.images.gallery && editingRestaurant.images.gallery.length > 0">
                    <h4>Gallery-Bilder:</h4>
                    <div class="gallery-grid">
                      <div class="gallery-item" *ngFor="let image of editingRestaurant.images.gallery; let i = index">
                        <img [src]="image" [alt]="editingRestaurant.name + ' Gallery ' + (i+1)" class="gallery-image">
                        <button
                          type="button"
                          class="remove-gallery-btn"
                          (click)="removeGalleryImage(i)"
                          [disabled]="loading"
                        >
                          <i class="fa-solid fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Upload New Images -->
                <div class="upload-section">
                  <div class="upload-group">
                    <label for="logo-upload">Neues Logo hochladen:</label>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      (change)="onLogoSelected($event)"
                      #logoInput
                    >
                    <button
                      type="button"
                      class="upload-btn"
                      (click)="uploadLogo()"
                      [disabled]="!selectedLogoFile || loading"
                    >
                      <i class="fa-solid fa-upload"></i>
                      Logo hochladen
                    </button>
                  </div>

                  <div class="upload-group">
                    <label for="banner-upload">Neues Banner hochladen:</label>
                    <input
                      type="file"
                      id="banner-upload"
                      accept="image/*"
                      (change)="onBannerSelected($event)"
                      #bannerInput
                    >
                    <button
                      type="button"
                      class="upload-btn"
                      (click)="uploadBanner()"
                      [disabled]="!selectedBannerFile || loading"
                    >
                      <i class="fa-solid fa-upload"></i>
                      Banner hochladen
                    </button>
                  </div>

                  <div class="upload-group">
                    <label for="gallery-upload">Gallery-Bilder hochladen:</label>
                    <input
                      type="file"
                      id="gallery-upload"
                      accept="image/*"
                      multiple
                      (change)="onGallerySelected($event)"
                      #galleryInput
                    >
                    <button
                      type="button"
                      class="upload-btn"
                      (click)="uploadGallery()"
                      [disabled]="!selectedGalleryFiles || selectedGalleryFiles.length === 0 || loading"
                    >
                      <i class="fa-solid fa-upload"></i>
                      Gallery-Bilder hochladen
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button
              class="btn-cancel"
              (click)="closeEditModal()"
              [disabled]="loading"
            >
              Abbrechen
            </button>
            <button
              class="btn-save"
              (click)="saveEditRestaurant()"
              [disabled]="loading || !editForm.name || !editForm.cuisine_type"
            >
              <i class="fa-solid fa-save" *ngIf="!loading"></i>
              <i class="fa-solid fa-spinner fa-spin" *ngIf="loading"></i>
              {{ loading ? 'Speichere...' : 'Speichern' }}
            </button>
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

    /* Edit Modal Styles */
    .edit-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .edit-modal {
      background: white !important; /* Sicherstellen, dass Modal weiß ist */
      border-radius: 12px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid #e5e7eb !important; /* Leichter grauer Rahmen */
    }

    .modal-header {
      padding: 24px !important;
      border-bottom: 1px solid #e5e7eb !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #effaf1 !important; /* Sehr helles Grün aus dem Theme */
      border-radius: 12px 12px 0 0 !important;
    }

    .modal-header h2 {
      margin: 0;
      color: #111827 !important; /* Dunkelgraue Schrift */
      font-size: 20px !important;
      font-weight: 600 !important;
      display: flex;
      align-items: center;
      gap: 8px !important;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover:not(:disabled) {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .form-section {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      background: var(--bg-light);
    }

    .form-section h3 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-2);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-heading);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-3);
    }

    .payment-method {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      transition: all var(--transition);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .payment-method:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    .payment-method input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
    }

    .payment-method input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .payment-method input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .modal-footer {
      padding: 24px !important;
      border-top: 1px solid #e5e7eb !important;
      display: flex;
      justify-content: flex-end;
      gap: 12px !important;
      background: #effaf1 !important; /* Sehr helles Grün aus dem Theme */
      border-radius: 0 0 12px 12px !important;
    }

    .btn-cancel,
    .btn-save {
      padding: 12px 24px !important;
      border: none;
      border-radius: 8px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer;
      transition: all 0.2s ease !important;
      display: flex;
      align-items: center;
      gap: 8px !important;
      min-width: 120px;
      justify-content: center;
    }

    .btn-cancel {
      background: #f0f9f0 !important; /* Hellgrüner Hintergrund aus dem Theme */
      color: #2f7146 !important; /* Dunkles Grün für Text */
      border: 2px solid #99dbaa !important; /* Mittleres Grün für Rahmen */
    }

    .btn-cancel:hover:not(:disabled) {
      background: #99dbaa !important; /* Mittleres Grün beim Hover */
      border-color: #6fcf90 !important; /* Helleres Grün für Rahmen */
      color: #173a24 !important; /* Sehr dunkles Grün für Text */
    }

    .btn-save {
      background: #2f7146 !important; /* Dunkleres Grün aus dem Theme */
      color: white !important;
      border: 2px solid #2f7146 !important;
    }

    .btn-save:hover:not(:disabled) {
      background: #245a38 !important; /* Noch dunkleres Grün beim Hover */
      border-color: #245a38 !important;
    }

    .btn-cancel:disabled,
    .btn-save:disabled,
    .close-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Image Upload Styles */
    .current-images {
      margin-bottom: var(--space-6);
    }

    .image-preview, .gallery-preview {
      margin-bottom: var(--space-4);
    }

    .image-preview h4, .gallery-preview h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
      font-size: var(--text-base);
      font-weight: 600;
    }

    .preview-image {
      width: 100%;
      max-width: 200px;
      height: 120px;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 2px solid var(--color-border);
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-3);
    }

    .gallery-item {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 2px solid var(--color-border);
    }

    .gallery-image {
      width: 100%;
      height: 80px;
      object-fit: cover;
      display: block;
    }

    .remove-gallery-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(220, 38, 38, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      transition: all var(--transition);
      opacity: 0;
    }

    .gallery-item:hover .remove-gallery-btn {
      opacity: 1;
    }

    .remove-gallery-btn:hover:not(:disabled) {
      background: rgba(185, 28, 28, 0.9);
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .upload-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .upload-group label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-heading);
    }

    .upload-group input[type="file"] {
      padding: var(--space-2);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--bg-light);
      font-size: var(--text-sm);
    }

    .upload-group input[type="file"]:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .upload-btn {
      align-self: flex-start;
      background: var(--color-primary-600);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .upload-btn:hover:not(:disabled) {
      background: var(--color-primary-700);
    }

    .upload-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

      .edit-modal-overlay {
        padding: var(--space-2);
      }

      .edit-modal {
        max-height: 95vh;
      }

      .modal-header {
        padding: var(--space-4);
      }

      .modal-body {
        padding: var(--space-4);
      }

      .modal-footer {
        padding: var(--space-4);
        flex-direction: column;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .btn-cancel,
      .btn-save {
        width: 100%;
        justify-content: center;
      }

      .upload-section {
        gap: var(--space-3);
      }

      .upload-group {
        gap: var(--space-2);
      }

      .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: var(--space-2);
      }

      .preview-image {
        max-width: 150px;
        height: 100px;
      }
    }
  `]
})
export class RestaurantManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private restaurantsService = inject(RestaurantsService);
  private toastService = inject(ToastService);

  restaurants: RestaurantDTO[] = [];
  filteredRestaurants: RestaurantDTO[] = [];
  stats: RestaurantManagementStats | null = null;
  loading = false;

  // Filters
  selectedStatus = 'all';
  searchTerm = '';
  sortBy = 'name';

  // Edit modal properties
  showEditModal = false;
  editingRestaurant: RestaurantDTO | null = null;

  // Image upload properties
  selectedLogoFile: File | null = null;
  selectedBannerFile: File | null = null;
  selectedGalleryFiles: FileList | null = null;

  editForm: UpdateRestaurantRequest = {
    name: '',
    cuisine_type: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'Deutschland'
    },
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    delivery_info: {
      delivery_radius_km: 10,
      minimum_order_amount: 15,
      delivery_fee: 2.5,
      estimated_delivery_time_minutes: 30
    },
    payment_methods: {
      cash: true,
      card: true,
      paypal: false
    }
  };

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

          // Show success message
          const action = restaurant.is_active ? 'aktiviert' : 'deaktiviert';
          this.toastService.success(
            'Status erfolgreich geändert',
            `Das Restaurant "${restaurant.name}" wurde erfolgreich ${action}.`
          );
        },
        error: (error: any) => {
          console.error('Error toggling restaurant status:', error);
          this.loading = false;

          // Show error message
          const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
          this.toastService.error(
            'Fehler beim Status ändern',
            `Der Status des Restaurants konnte nicht geändert werden: ${errorMessage}`
          );
        }
      });
    }
  }

  editRestaurant(restaurant: RestaurantDTO) {
    this.editingRestaurant = restaurant;
    // Initialize edit form with current restaurant data
    this.editForm = {
      name: restaurant.name || '',
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type || '',
      address: {
        street: restaurant.address?.street || '',
        city: restaurant.address?.city || '',
        postal_code: restaurant.address?.postal_code || '',
        country: restaurant.address?.country || 'Deutschland'
      },
      contact_info: {
        phone: restaurant.contact_info?.phone || '',
        email: restaurant.contact_info?.email || '',
        website: restaurant.contact_info?.website || ''
      },
      delivery_info: {
        delivery_radius_km: restaurant.delivery_info?.delivery_radius_km || 10,
        minimum_order_amount: restaurant.delivery_info?.minimum_order_amount || 15,
        delivery_fee: restaurant.delivery_info?.delivery_fee || 2.5,
        estimated_delivery_time_minutes: restaurant.delivery_info?.estimated_delivery_time_minutes || 30,
        free_delivery_threshold: restaurant.delivery_info?.free_delivery_threshold
      },
      payment_methods: {
        cash: restaurant.payment_methods?.cash ?? true,
        card: restaurant.payment_methods?.card ?? true,
        paypal: restaurant.payment_methods?.paypal ?? false
      }
    };
    this.showEditModal = true;
  }

  saveEditRestaurant() {
    if (!this.editingRestaurant || !this.editForm) return;

    this.loading = true;
    this.restaurantsService.updateRestaurant(this.editingRestaurant.id, this.editForm).subscribe({
      next: (updatedRestaurant) => {
        // Update the restaurant in the list
        const index = this.restaurants.findIndex(r => r.id === updatedRestaurant.id);
        if (index !== -1) {
          this.restaurants[index] = updatedRestaurant;
          this.applyFilters();
          this.loadStats();
        }
        this.closeEditModal();
        this.loading = false;

        // Show success message
        this.toastService.success(
          'Restaurant erfolgreich aktualisiert',
          `Das Restaurant "${updatedRestaurant.name}" wurde erfolgreich gespeichert.`
        );
      },
      error: (error: any) => {
        console.error('Error updating restaurant:', error);
        this.loading = false;

        // Show error message
        const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
        this.toastService.error(
          'Fehler beim Speichern',
          `Das Restaurant konnte nicht gespeichert werden: ${errorMessage}`
        );
      }
    });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingRestaurant = null;
    this.selectedLogoFile = null;
    this.selectedBannerFile = null;
    this.selectedGalleryFiles = null;
    this.editForm = {
      name: '',
      cuisine_type: '',
      address: {
        street: '',
        city: '',
        postal_code: '',
        country: 'Deutschland'
      },
      contact_info: {
        phone: '',
        email: '',
        website: ''
      },
      delivery_info: {
        delivery_radius_km: 10,
        minimum_order_amount: 15,
        delivery_fee: 2.5,
        estimated_delivery_time_minutes: 30
      },
      payment_methods: {
        cash: true,
        card: true,
        paypal: false
      }
    };
  }

  // Image upload methods
  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
    }
  }

  onBannerSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedBannerFile = file;
    }
  }

  onGallerySelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedGalleryFiles = files;
    }
  }

  uploadLogo() {
    if (!this.selectedLogoFile || !this.editingRestaurant) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('logo', this.selectedLogoFile);

    this.restaurantsService.uploadRestaurantLogo(this.editingRestaurant.id, formData).subscribe({
      next: (response) => {
        // Update the restaurant's logo in the list
        const index = this.restaurants.findIndex(r => r.id === this.editingRestaurant!.id);
        if (index !== -1) {
          this.restaurants[index].images.logo = response.logo_url;
          this.editingRestaurant!.images.logo = response.logo_url;
        }
        this.selectedLogoFile = null;
        this.loading = false;

        this.toastService.success(
          'Logo erfolgreich hochgeladen',
          `Das Logo für "${this.editingRestaurant!.name}" wurde erfolgreich aktualisiert.`
        );
      },
      error: (error: any) => {
        console.error('Error uploading logo:', error);
        this.loading = false;

        const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
        this.toastService.error(
          'Fehler beim Logo-Upload',
          `Das Logo konnte nicht hochgeladen werden: ${errorMessage}`
        );
      }
    });
  }

  uploadBanner() {
    if (!this.selectedBannerFile || !this.editingRestaurant) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('banner', this.selectedBannerFile);

    this.restaurantsService.uploadRestaurantBanner(this.editingRestaurant.id, formData).subscribe({
      next: (response) => {
        // Update the restaurant's banner in the list
        const index = this.restaurants.findIndex(r => r.id === this.editingRestaurant!.id);
        if (index !== -1) {
          this.restaurants[index].images.banner = response.banner_url;
          this.editingRestaurant!.images.banner = response.banner_url;
        }
        this.selectedBannerFile = null;
        this.loading = false;

        this.toastService.success(
          'Banner erfolgreich hochgeladen',
          `Das Banner für "${this.editingRestaurant!.name}" wurde erfolgreich aktualisiert.`
        );
      },
      error: (error: any) => {
        console.error('Error uploading banner:', error);
        this.loading = false;

        const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
        this.toastService.error(
          'Fehler beim Banner-Upload',
          `Das Banner konnte nicht hochgeladen werden: ${errorMessage}`
        );
      }
    });
  }

  uploadGallery() {
    if (!this.selectedGalleryFiles || !this.editingRestaurant) return;

    this.loading = true;
    const formData = new FormData();

    // Add all selected files to form data
    for (let i = 0; i < this.selectedGalleryFiles.length; i++) {
      formData.append('gallery', this.selectedGalleryFiles[i]);
    }

    this.restaurantsService.uploadRestaurantGallery(this.editingRestaurant.id, formData).subscribe({
      next: (response) => {
        // Update the restaurant's gallery in the list
        const index = this.restaurants.findIndex(r => r.id === this.editingRestaurant!.id);
        if (index !== -1) {
          const existingGallery = this.restaurants[index].images.gallery || [];
          this.restaurants[index].images.gallery = [...existingGallery, ...response.gallery_urls];
          this.editingRestaurant!.images.gallery = [...existingGallery, ...response.gallery_urls];
        }
        this.selectedGalleryFiles = null;
        this.loading = false;

        this.toastService.success(
          'Gallery-Bilder erfolgreich hochgeladen',
          `${response.gallery_urls.length} Bilder wurden zur Gallery von "${this.editingRestaurant!.name}" hinzugefügt.`
        );
      },
      error: (error: any) => {
        console.error('Error uploading gallery:', error);
        this.loading = false;

        const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
        this.toastService.error(
          'Fehler beim Gallery-Upload',
          `Die Gallery-Bilder konnten nicht hochgeladen werden: ${errorMessage}`
        );
      }
    });
  }

  removeGalleryImage(imageIndex: number) {
    if (!this.editingRestaurant) return;

    if (confirm('Möchten Sie dieses Gallery-Bild wirklich entfernen?')) {
      this.loading = true;

      this.restaurantsService.deleteGalleryImage(this.editingRestaurant.id, imageIndex).subscribe({
        next: () => {
          // Update the restaurant's gallery in the list
          const index = this.restaurants.findIndex(r => r.id === this.editingRestaurant!.id);
          if (index !== -1 && this.restaurants[index].images.gallery) {
            this.restaurants[index].images.gallery.splice(imageIndex, 1);
            this.editingRestaurant!.images.gallery = [...this.restaurants[index].images.gallery];
          }
          this.loading = false;

          this.toastService.success(
            'Gallery-Bild entfernt',
            `Das Bild wurde erfolgreich aus der Gallery von "${this.editingRestaurant!.name}" entfernt.`
          );
        },
        error: (error: any) => {
          console.error('Error removing gallery image:', error);
          this.loading = false;

          const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
          this.toastService.error(
            'Fehler beim Entfernen',
            `Das Gallery-Bild konnte nicht entfernt werden: ${errorMessage}`
          );
        }
      });
    }
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

          // Show success message
          this.toastService.success(
            'Restaurant erfolgreich gelöscht',
            `Das Restaurant "${restaurant.name}" wurde erfolgreich aus der Datenbank entfernt.`
          );
        },
        error: (error: any) => {
          console.error('Error deleting restaurant:', error);
          this.loading = false;

          // Show error message
          const errorMessage = error?.error?.error || 'Ein unerwarteter Fehler ist aufgetreten';
          this.toastService.error(
            'Fehler beim Löschen',
            `Das Restaurant konnte nicht gelöscht werden: ${errorMessage}`
          );
        }
      });
    }
  }

  addRestaurant() {
    // TODO: Implement add restaurant modal
    console.log('Add new restaurant');
  }
}
