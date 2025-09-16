import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { MenuItemVariantsComponent } from './menu-item-variants.component';

// Local interface for category management
interface CategoryFormData {
  id?: string;
  name: string;
  position: number;
}

@Component({
  selector: 'app-restaurant-manager-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MenuItemVariantsComponent],
  template: `
    <div class="menu-container">
      <!-- Header -->
      <div class="menu-header">
        <h1>Speisekarte verwalten</h1>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddItemModal = true">
            <i class="fa-solid fa-plus"></i>
            Neues Gericht
          </button>
          <button class="btn-secondary" (click)="showAddCategoryModal = true">
            <i class="fa-solid fa-folder-plus"></i>
            Neue Kategorie
          </button>
        </div>
      </div>

      <!-- Categories and Items -->
      <div class="menu-content">
        <!-- Active Categories -->
        <div *ngFor="let category of getActiveCategories()" class="category-section">
          <div class="category-header">
            <h2>{{ category.name }}</h2>
            <div class="category-actions">
              <button class="btn-sm" (click)="editCategory(category)">
                <i class="fa-solid fa-edit"></i>
              </button>
              <button class="btn-sm danger" (click)="deleteCategory(category)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="items-grid">
            <!-- Active items -->
            <div *ngFor="let item of getActiveItemsForCategory(category.id)" class="menu-item-card">
              <div class="item-image">
                <img [src]="getItemImageUrl(item)" [alt]="item.name" (error)="onImageError($event)">
                <div class="item-status" [class.available]="item.is_available" [class.unavailable]="!item.is_available">
                  {{ item.is_available ? 'Verfügbar' : 'Nicht verfügbar' }}
                </div>
              </div>

              <div class="item-content">
                <h3>{{ item.name }}</h3>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-details">
                  <span class="price">€{{ (item.price || 0).toFixed(2) }}</span>
                  <span class="prep-time">{{ item.preparation_time_minutes }} Min.</span>
                </div>
                <div class="item-badges">
                  <span *ngIf="item.is_vegetarian" class="badge vegetarian">Vegetarisch</span>
                  <span *ngIf="item.is_vegan" class="badge vegan">Vegan</span>
                  <span *ngIf="item.is_gluten_free" class="badge gluten-free">Glutenfrei</span>
                </div>
              </div>

              <div class="item-actions">
                <button class="btn-sm" (click)="editItem(item)" title="Bearbeiten">
                  <i class="fa-solid fa-edit"></i>
                </button>
                <button class="btn-sm" [class.success]="item.is_available" [class.warning]="!item.is_available"
                        (click)="toggleItemAvailability(item)"
                        [title]="item.is_available ? 'Deaktivieren' : 'Aktivieren'">
                  <i class="fa-solid" [class.fa-eye]="item.is_available" [class.fa-eye-slash]="!item.is_available"></i>
                </button>
                <button class="btn-sm danger" (click)="deleteItem(item)" title="Deaktivieren">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <div *ngIf="getActiveItemsForCategory(category.id).length === 0" class="empty-category">
              <i class="fa-solid fa-utensils"></i>
              <p>Keine Gerichte in dieser Kategorie</p>
            </div>
          </div>
        </div>

        <!-- Deactivated Items Category -->
        <div *ngIf="getDeactivatedItems().length > 0" class="category-section deactivated">
          <div class="category-header">
            <h2>🚫 Deaktivierte Gerichte</h2>
            <div class="category-info">
              <span class="info-badge">{{ getDeactivatedItems().length }} Gericht{{ getDeactivatedItems().length !== 1 ? 'e' : '' }}</span>
            </div>
          </div>

          <div class="items-grid">
            <div *ngFor="let item of getDeactivatedItems()" class="menu-item-card inactive">
              <div class="item-image">
                <img [src]="getItemImageUrl(item)" [alt]="item.name" (error)="onImageError($event)">
                <div class="item-status unavailable">
                  Deaktiviert
                </div>
              </div>

              <div class="item-content">
                <h3>{{ item.name }}</h3>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-details">
                  <span class="price">€{{ (item.price || 0).toFixed(2) }}</span>
                  <span class="prep-time">{{ item.preparation_time_minutes }} Min.</span>
                </div>
                <div class="item-badges">
                  <span *ngIf="item.is_vegetarian" class="badge vegetarian">Vegetarisch</span>
                  <span *ngIf="item.is_vegan" class="badge vegan">Vegan</span>
                  <span *ngIf="item.is_gluten_free" class="badge gluten-free">Glutenfrei</span>
                </div>
              </div>

              <div class="item-actions">
                <button class="btn-sm success" (click)="restoreItem(item)" title="Wiederherstellen">
                  <i class="fa-solid fa-undo"></i>
                  Aktivieren
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Item Modal -->
      <div *ngIf="showAddItemModal" class="modal-overlay" (click)="showAddItemModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingItem ? 'Gericht bearbeiten' : 'Neues Gericht hinzufügen' }}</h3>
            <button class="close-btn" (click)="showAddItemModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <!-- Tabs for Item Details and Variants -->
          <div class="modal-tabs">
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab === 'details'"
              (click)="activeTab = 'details'">
              Grunddaten
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab === 'variants'"
              (click)="activeTab = 'variants'">
              Varianten
            </button>
          </div>

          <div [class.hidden]="activeTab !== 'details'">
            <form (ngSubmit)="saveItem()" #itemForm="ngForm" class="modal-form">
              <div class="form-group">
                <label for="itemName">Name *</label>
                <input id="itemName" type="text" [(ngModel)]="currentItem.name" name="name" required>
              </div>

            <div class="form-group">
              <label for="itemDescription">Beschreibung</label>
              <textarea id="itemDescription" [(ngModel)]="currentItem.description" name="description" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="itemPrice">Preis (€) *</label>
                <input id="itemPrice" type="number" step="0.01" [(ngModel)]="currentItem.price" name="price" required>
              </div>

              <div class="form-group">
                <label for="itemPrepTime">Zubereitungszeit (Min.) *</label>
                <input id="itemPrepTime" type="number" [(ngModel)]="currentItem.preparation_time_minutes" name="prepTime" required>
              </div>
            </div>

            <div class="form-group">
              <label for="itemCategory">Kategorie (optional)</label>
              <select id="itemCategory" [(ngModel)]="currentItem.category_id" name="category">
                <option [ngValue]="undefined">Ohne Kategorie</option>
                <option *ngFor="let category of categories" [ngValue]="category.id">{{ category.name }}</option>
              </select>
            </div>

            <!-- Image Upload Section -->
            <div class="form-group">
              <label for="itemImage">Bild</label>

              <!-- Image Source Toggle -->
              <div class="image-source-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="imageSource === 'url'"
                  (click)="setImageSource('url')">
                  <i class="fa-solid fa-link"></i>
                  Bild-URL
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  [class.active]="imageSource === 'upload'"
                  (click)="setImageSource('upload')">
                  <i class="fa-solid fa-upload"></i>
                  Datei hochladen
                </button>
              </div>

              <!-- URL Input -->
              <div *ngIf="imageSource === 'url'" class="url-input-container">
                <input
                  id="itemImage"
                  type="url"
                  [(ngModel)]="currentItem.image_url"
                  name="imageUrl"
                  placeholder="https://beispiel.com/bild.jpg"
                  class="url-input">
                <small class="input-help">Geben Sie eine URL zu einem Bild ein</small>
              </div>

              <!-- File Upload -->
              <div *ngIf="imageSource === 'upload'" class="upload-container">
                <div class="current-image-preview" *ngIf="currentItem.image_url">
                  <img [src]="currentItem.image_url" [alt]="currentItem.name" class="preview-thumbnail">
                  <button type="button" class="remove-image-btn" (click)="removeCurrentImage()">
                    <i class="fa-solid fa-times"></i>
                  </button>
                </div>

                <div class="upload-area" [class.has-image]="currentItem.image_url">
                  <input
                    type="file"
                    #imageFileInput
                    (change)="onImageFileSelected($event)"
                    accept="image/*"
                    style="display: none;">
                  <div class="upload-content" (click)="imageFileInput.click()">
                    <i class="fa-solid fa-cloud-upload-alt upload-icon"></i>
                    <div class="upload-text">
                      <strong>Bild auswählen</strong>
                      <span>JPEG, PNG, GIF oder WebP (max. 3MB)</span>
                    </div>
                  </div>
                </div>

                <div class="upload-progress" *ngIf="isUploadingImage">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="uploadProgress"></div>
                  </div>
                  <span>Hochladen... {{ uploadProgress }}%</span>
                </div>
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentItem.is_available" name="isAvailable">
                <span class="checkmark"></span>
                Verfügbar
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentItem.is_vegetarian" name="isVegetarian">
                <span class="checkmark"></span>
                Vegetarisch
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentItem.is_vegan" name="isVegan">
                <span class="checkmark"></span>
                Vegan
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentItem.is_gluten_free" name="isGlutenFree">
                <span class="checkmark"></span>
                Glutenfrei
              </label>
            </div>

            <div class="form-group">
              <label for="itemAllergens">Allergene (kommagetrennt)</label>
              <input id="itemAllergens" type="text" [(ngModel)]="currentItem.allergens" name="allergens">
            </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showAddItemModal = false">Abbrechen</button>
                <button type="submit" class="btn-primary" [disabled]="!itemForm.valid">
                  {{ editingItem ? 'Speichern' : 'Hinzufügen' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Variants Tab -->
          <div [class.hidden]="activeTab !== 'variants'">
            <app-menu-item-variants
              *ngIf="editingItem"
              [menuItemId]="editingItem.id"
              [restaurantId]="managedRestaurantId!"
              (variantsChanged)="onVariantsChanged()">
            </app-menu-item-variants>
          </div>
        </div>
      </div>

      <!-- Add Category Modal -->
      <div *ngIf="showAddCategoryModal" class="modal-overlay" (click)="showAddCategoryModal = false">
        <div class="modal-content small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}</h3>
            <button class="close-btn" (click)="showAddCategoryModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form (ngSubmit)="saveCategory()" #categoryForm="ngForm" class="modal-form">
            <div class="form-group">
              <label for="categoryName">Name *</label>
              <input id="categoryName" type="text" [(ngModel)]="currentCategory.name" name="name" required>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showAddCategoryModal = false">Abbrechen</button>
              <button type="submit" class="btn-primary" [disabled]="!categoryForm.valid">
                {{ editingCategory ? 'Speichern' : 'Hinzufügen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6) 0;
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }

    .menu-header h1 {
      margin: 0;
      color: var(--color-text);
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
      font-size: var(--text-base);
    }

    .btn-primary {
      background: var(--color-primary-500);
      color: white;
    }

    .btn-primary:hover {
      background: var(--color-primary-600);
    }

    .btn-secondary {
      background: var(--color-muted-100);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-muted-200);
    }

    .btn-sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
    }

    .btn-sm.danger {
      background: var(--color-danger);
      color: white;
    }

    .btn-sm.danger:hover {
      background: var(--color-danger-600);
    }

    .btn-sm.success {
      background: var(--color-success);
      color: white;
    }

    .btn-sm.warning {
      background: var(--color-warning);
      color: white;
    }

    .menu-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .category-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      overflow: hidden;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      background: white;
      border-bottom: 1px solid var(--color-border);
    }

    .category-header h2 {
      margin: 0;
      color: var(--color-text);
    }

    .category-actions {
      display: flex;
      gap: var(--space-2);
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
      padding: var(--space-6);
    }

    .menu-item-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition);
    }

    .menu-item-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .item-image {
      position: relative;
      height: 150px;
      overflow: hidden;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-status {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
    }

    .item-status.available {
      background: var(--color-success);
      color: white;
    }

    .item-status.unavailable {
      background: var(--color-danger);
      color: white;
    }

    .item-content {
      padding: var(--space-4);
    }

    .item-content h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .item-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
    }

    .prep-time {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .item-badges {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .badge.vegetarian {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .badge.vegan {
      background: var(--color-info-50);
      color: var(--color-info);
    }

    .badge.gluten-free {
      background: var(--color-warning-50);
      color: var(--color-warning);
    }

    .item-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: 0 var(--space-4) var(--space-4);
    }

    .empty-category {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--space-8);
      color: var(--color-muted);
    }

    .empty-category i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      max-width: 700px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
    }

    .modal-content.small {
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-8) var(--space-8) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--bg-light-green);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--color-text);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-lg);
      cursor: pointer;
      color: var(--color-muted);
    }

    .close-btn:hover {
      color: var(--color-text);
    }

    .form-group {
      margin-bottom: var(--space-6);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-3);
      font-weight: 600;
      color: var(--color-text);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      transition: all var(--transition);
      background: white;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      background: white;
      box-shadow: 0 0 0 3px var(--color-primary-100);
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      padding: var(--space-5);
      background: white;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .checkbox-label:hover {
      background: white;
      box-shadow: var(--shadow-sm);
    }

    .checkbox-label input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      position: relative;
      transition: all var(--transition);
      flex-shrink: 0;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .modal-form {
      padding: var(--space-8);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-4);
      padding: var(--space-8);
      border-top: 1px solid var(--color-border);
      background: white;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }

    .category-section.deactivated {
      background: linear-gradient(135deg, var(--color-muted-50) 0%, var(--color-muted-100) 100%);
      border: 2px solid var(--color-danger-200);
    }

    .category-section.deactivated .category-header {
      background: var(--color-danger-50);
      border-bottom: 2px solid var(--color-danger-200);
    }

    .category-section.deactivated .category-header h2 {
      color: var(--color-danger-700);
      font-weight: 600;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .info-badge {
      background: var(--color-danger-100);
      color: var(--color-danger-700);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
      border: 1px solid var(--color-danger-300);
    }

    .menu-item-card.inactive {
      opacity: 0.8;
      border-color: var(--color-danger-300);
      background: var(--color-muted-25);
      transform: none;
    }

    .menu-item-card.inactive:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }

    .menu-item-card.inactive .item-content h3 {
      color: var(--color-muted-700);
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }

    .menu-item-card.inactive .item-status.unavailable {
      background: var(--color-danger-500);
    }

    /* Image Upload Styles */
    .image-source-toggle {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--color-muted-100);
      color: var(--color-muted-700);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all var(--transition);
    }

    .toggle-btn:hover {
      background: var(--color-muted-200);
    }

    .toggle-btn.active {
      background: var(--color-primary-500);
      color: white;
      border-color: var(--color-primary-500);
    }

    .url-input-container {
      margin-bottom: var(--space-4);
    }

    .url-input {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      transition: all var(--transition);
    }

    .url-input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-100);
    }

    .input-help {
      display: block;
      margin-top: var(--space-2);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .upload-container {
      margin-bottom: var(--space-4);
    }

    .current-image-preview {
      position: relative;
      display: inline-block;
      margin-bottom: var(--space-4);
    }

    .preview-thumbnail {
      max-width: 150px;
      max-height: 100px;
      border-radius: var(--radius-md);
      border: 2px solid var(--color-border);
      object-fit: cover;
    }

    .remove-image-btn {
      position: absolute;
      top: var(--space-1);
      right: var(--space-1);
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      transition: all var(--transition);
    }

    .remove-image-btn:hover {
      background: var(--color-danger);
      transform: scale(1.1);
    }

    .upload-area {
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      text-align: center;
      background: var(--bg-light);
      transition: all var(--transition);
      cursor: pointer;
    }

    .upload-area:hover {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, var(--bg-light));
    }

    .upload-area.has-image {
      border-color: var(--color-success);
      background: color-mix(in oklab, var(--color-success) 5%, var(--bg-light));
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .upload-icon {
      font-size: 2rem;
      color: var(--color-primary);
    }

    .upload-text strong {
      display: block;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .upload-text span {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .upload-progress {
      margin-top: var(--space-4);
      text-align: center;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--color-muted-200);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: var(--space-2);
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary-500);
      transition: width var(--transition);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .menu-container {
        padding: var(--space-4) 0;
      }

      .menu-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .items-grid {
        grid-template-columns: 1fr;
        padding: var(--space-4);
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .checkbox-group {
        grid-template-columns: 1fr;
      }

      .image-source-toggle {
        flex-direction: column;
      }

      .toggle-btn {
        justify-content: center;
      }

      .upload-area {
        padding: var(--space-4);
      }

      .preview-thumbnail {
        max-width: 120px;
        max-height: 80px;
      }
    }

    /* Modal Tabs */
    .modal-tabs {
      display: flex;
      border-bottom: 1px solid #dee2e6;
      margin-bottom: var(--space-4);
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-weight: 500;
      color: #6c757d;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-btn.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .tab-btn:hover:not(.active) {
      color: #495057;
    }

    .hidden {
      display: none;
    }
  `]
})
export class RestaurantManagerMenuComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private restaurantManagerService = inject(RestaurantManagerService);

  menuItems: any[] = [];
  categories: CategoryFormData[] = [];
  managedRestaurantId: string | null = null;

  showAddItemModal: boolean = false;
  activeTab: string = 'details';
  showAddCategoryModal: boolean = false;
  editingItem: any = null;
  editingCategory: CategoryFormData | null = null;

  // Image upload properties
  imageSource: 'url' | 'upload' = 'upload'; // Default to upload
  isUploadingImage: boolean = false;
  uploadProgress: number = 0;

  currentItem: any = {
    name: '',
    description: '',
    price: 0,
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    allergens: [],
    preparation_time_minutes: 15
  };

  currentCategory: CategoryFormData = {
    name: '',
    position: 0
  };

  ngOnInit() {
    // Load real categories and items for the manager's restaurant
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (managers) => {
        const restaurantId = managers?.[0]?.restaurant_id;
        if (!restaurantId) {
          this.menuItems = [];
          this.categories = [];
          return;
        }
        this.managedRestaurantId = String(restaurantId);
        this.restaurantsService.getMenuCategoriesWithItems(String(restaurantId)).subscribe({
          next: (cats: any[]) => {
            // Map categories
            this.categories = (cats || [])
              .filter(c => c.id) // Only include categories with valid IDs
              .map(c => ({
                id: String(c.id),
                name: c.name,
                position: c.position ?? 0
              }));

            // Flatten items and normalize for template
            this.menuItems = (cats || []).flatMap(c => (c.items || []).map((i: any) => ({
              id: String(i.id),
              category_id: String(i.category_id ?? c.id),
              name: i.name,
              description: i.description,
              price: typeof i.price === 'number' ? i.price : (i.price_cents ? Math.round(i.price_cents) / 100 : 0),
              image_url: i.image_url,
              is_available: !!i.is_available,
              is_vegetarian: !!i.is_vegetarian,
              is_vegan: !!i.is_vegan,
              is_gluten_free: !!i.is_gluten_free,
              allergens: Array.isArray(i.allergens) ? i.allergens : [],
              preparation_time_minutes: i.preparation_time_minutes ?? 15
            })));
          },
          error: () => {
            this.menuItems = [];
            this.categories = [];
          }
        });
      },
      error: () => {
        this.menuItems = [];
        this.categories = [];
      }
    });
  }

  getItemsForCategory(categoryId: string | undefined): any[] {
    if (!categoryId) return [];
    return this.menuItems.filter(item => {
      const itemCategoryId = item.category_id ? String(item.category_id) : null;
      const targetCategoryId = String(categoryId);
      return itemCategoryId === targetCategoryId;
    });
  }

  getActiveItemsForCategory(categoryId: string | undefined): any[] {
    if (!categoryId) return [];
    return this.menuItems.filter(item => {
      // Ensure both values are compared as strings to handle type mismatches
      const itemCategoryId = item.category_id ? String(item.category_id) : null;
      const targetCategoryId = String(categoryId);
      return itemCategoryId === targetCategoryId && item.is_available;
    });
  }

  // Debug method to check menu items
  debugMenuItems() {
    console.log('=== Current Menu Items ===');
    this.menuItems.forEach(item => {
      console.log(`ID: ${item.id}, Name: ${item.name}, Category: ${item.category_id}, Available: ${item.is_available}`);
    });
  }

  getActiveCategories(): any[] {
    return this.categories;
  }

  getDeactivatedItems(): any[] {
    return this.menuItems.filter(item => !item.is_available);
  }

  getItemImageUrl(item: any): string {
    // Array von verfügbaren Platzhalter-Bildern
    const placeholderImages = [
      '/assets/images/food-placeholder-1-new.jpg',
      '/assets/images/food-placeholder-2.jpg', 
      '/assets/images/food-placeholder-3-new.jpg',
      '/assets/images/stock/food-placeholder-1.jpg',
      '/assets/images/stock/food-placeholder-3.jpg'
    ];
    
    // Wenn ein Bild-URL vorhanden ist, verwende es
    if (item.image_url && item.image_url.trim() !== '') {
      return item.image_url;
    }
    
    // Ansonsten wähle einen Platzhalter basierend auf dem Item-Index
    const placeholderIndex = (item.id ? parseInt(item.id) : 0) % placeholderImages.length;
    return placeholderImages[placeholderIndex];
  }

  onImageError(event: any): void {
    // Fallback zu einem Standard-Platzhalter bei Fehlern
    const placeholderImages = [
      '/assets/images/food-placeholder-1-new.jpg',
      '/assets/images/food-placeholder-2.jpg',
      '/assets/images/food-placeholder-3-new.jpg'
    ];
    
    const randomIndex = Math.floor(Math.random() * placeholderImages.length);
    event.target.src = placeholderImages[randomIndex];
  }

  editItem(item: any) {
    this.editingItem = item;
    this.currentItem = {
      ...item,
      // Ensure category_id is a string for proper form binding
      category_id: item.category_id ? String(item.category_id) : undefined
    };

    // Set image source based on whether item has an image URL
    this.imageSource = item.image_url && item.image_url.trim() ? 'upload' : 'upload'; // Default to upload for editing

    // Set default tab to details
    this.activeTab = 'details';

    // console.log('Editing item:', item.name, 'original category_id:', item.category_id, 'form category_id:', this.currentItem.category_id);
    this.showAddItemModal = true;
  }

  deleteItem(item: any) {
    if (!confirm(`Sind Sie sicher, dass Sie "${item.name}" deaktivieren möchten?`) || !this.managedRestaurantId) {
      return;
    }

    this.restaurantsService.deleteMenuItem(this.managedRestaurantId, item.id).subscribe({
      next: () => {
        // Update local item to reflect deactivated state
        const index = this.menuItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const deactivatedItem = { ...item, is_available: false };
          // Create new array reference for Angular change detection
          this.menuItems = [
            ...this.menuItems.slice(0, index),
            deactivatedItem,
            ...this.menuItems.slice(index + 1)
          ];
        }
        alert('Gericht wurde erfolgreich deaktiviert.');
      },
      error: (err) => {
        console.error('Deactivate menu item failed', err);
        alert('Fehler beim Deaktivieren des Gerichts. Bitte versuchen Sie es erneut.');
      }
    });
  }

  restoreItem(item: any) {
    if (!confirm(`Sind Sie sicher, dass Sie "${item.name}" wieder aktivieren möchten?`) || !this.managedRestaurantId) {
      return;
    }

    this.restaurantsService.restoreMenuItem(this.managedRestaurantId, item.id).subscribe({
      next: () => {
        // Update local item to reflect restored state
        const index = this.menuItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const restoredItem = { ...item, is_available: true };
          // Create new array reference for Angular change detection
          this.menuItems = [
            ...this.menuItems.slice(0, index),
            restoredItem,
            ...this.menuItems.slice(index + 1)
          ];
        }
        alert('Gericht wurde erfolgreich wieder aktiviert.');
      },
      error: (err) => {
        console.error('Restore menu item failed', err);
        alert('Fehler beim Wiederherstellen des Gerichts. Bitte versuchen Sie es erneut.');
      }
    });
  }

  toggleItemAvailability(item: any) {
    if (!this.managedRestaurantId) {
      return;
    }

    const newAvailability = !item.is_available;

    this.restaurantsService.updateMenuItem(this.managedRestaurantId, item.id, {
      is_available: newAvailability
    }).subscribe({
      next: () => {
        // Update local item on success - create new array reference for Angular change detection
        const index = this.menuItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const updatedItem = { ...item, is_available: newAvailability };
          // Create new array reference for Angular change detection
          this.menuItems = [
            ...this.menuItems.slice(0, index),
            updatedItem,
            ...this.menuItems.slice(index + 1)
          ];
        }
      },
      error: (err) => {
        console.error('Toggle availability failed', err);
        alert('Fehler beim Ändern der Verfügbarkeit. Bitte versuchen Sie es erneut.');
      }
    });
  }

  editCategory(category: CategoryFormData) {
    this.editingCategory = category;
    this.currentCategory = { ...category };
    this.showAddCategoryModal = false;
    this.showAddCategoryModal = true;
  }

  deleteCategory(category: CategoryFormData) {
    if (!confirm(`Sind Sie sicher, dass Sie die Kategorie "${category.name}" löschen möchten?`) || !this.managedRestaurantId || !category.id) {
      return;
    }

    this.restaurantsService.deleteCategory(this.managedRestaurantId, category.id).subscribe({
      next: () => {
        const index = this.categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          // Create new array reference for Angular change detection
          this.categories = [
            ...this.categories.slice(0, index),
            ...this.categories.slice(index + 1)
          ];
        }
      },
      error: (err) => {
        console.error('Delete category failed', err);
      }
    });
  }

  saveItem() {
    if (!this.currentItem.name || !(Number(this.currentItem.price) > 0)) {
      return;
    }

    // If no restaurant context, skip
    if (!this.managedRestaurantId) {
      console.warn('No managed restaurant found for current user.');
      return;
    }

    // Category is optional - ensure it's a string or null
    const categoryId = this.currentItem.category_id ? String(this.currentItem.category_id) : null;

    // console.log('Updating item:', this.editingItem?.name, 'categoryId:', categoryId, 'type:', typeof categoryId);

    if (this.editingItem) {
      // Update existing item via API
      const updatePayload: any = {
        name: this.currentItem.name,
        description: this.currentItem.description || undefined,
        price_cents: Math.round(Number(this.currentItem.price || 0) * 100),
        is_available: this.currentItem.is_available,
        is_vegetarian: !!this.currentItem.is_vegetarian,
        is_vegan: !!this.currentItem.is_vegan,
        is_gluten_free: !!this.currentItem.is_gluten_free,
        preparation_time_minutes: this.currentItem.preparation_time_minutes ?? 15,
        image_url: this.currentItem.image_url || undefined
      };

      // Always include category_id, even if null (to allow removing category assignment)
      updatePayload.category_id = categoryId;

      this.restaurantsService.updateMenuItem(this.managedRestaurantId!, this.editingItem.id, updatePayload).subscribe({
        next: (updated) => {
          // Update local item with server response
          const index = this.menuItems.findIndex(i => i.id === this.editingItem!.id);
          if (index !== -1) {
            // Create a new object to ensure Angular detects the change
            const updatedItem = {
              ...this.currentItem,
              // Update with server data if available, but ensure category_id is set correctly
              ...updated.menu_item,
              category_id: updated.menu_item?.category_id ?? categoryId
            };
            // Create new array reference for Angular change detection
            this.menuItems = [
              ...this.menuItems.slice(0, index),
              updatedItem,
              ...this.menuItems.slice(index + 1)
            ];
          }
          this.showAddItemModal = false;
          this.resetItemForm();
          alert('Gericht wurde erfolgreich aktualisiert!');
        },
        error: (err) => {
          console.error('Update menu item failed', err);
          alert('Fehler beim Aktualisieren des Gerichts. Bitte versuchen Sie es erneut.');
        }
      });
      return;
    }

    const payload = {
      ...(categoryId ? { category_id: categoryId } : {}),
      name: this.currentItem.name,
      description: this.currentItem.description || undefined,
      // prefer cents if backend expects it
      price_cents: Math.round(Number(this.currentItem.price) * 100),
      is_vegetarian: !!this.currentItem.is_vegetarian,
      is_vegan: !!this.currentItem.is_vegan,
      is_gluten_free: !!this.currentItem.is_gluten_free,
      preparation_time_minutes: this.currentItem.preparation_time_minutes ?? 15,
      image_url: this.currentItem.image_url || undefined
    };

    this.restaurantsService.createMenuItem(this.managedRestaurantId, payload).subscribe({
      next: (created) => {
        const normalized = {
          id: String(created.id),
          category_id: created.category_id ? String(created.category_id) : undefined,
          name: created.name,
          description: created.description,
          price: typeof (created as any).price === 'number' ? (created as any).price : (created.price_cents ? created.price_cents / 100 : Number(this.currentItem.price || 0)),
          image_url: created.image_url,
          is_available: !!(created as any).is_available,
          is_vegetarian: !!(created as any).is_vegetarian,
          is_vegan: !!(created as any).is_vegan,
          is_gluten_free: !!(created as any).is_gluten_free,
          allergens: Array.isArray((created as any).allergens) ? (created as any).allergens : [],
          preparation_time_minutes: (created as any).preparation_time_minutes ?? this.currentItem.preparation_time_minutes ?? 15
        };

        // If we have a temporary image file to upload, do it now
        if (this.tempImageFile && this.managedRestaurantId) {
          const formData = new FormData();
          formData.append('image', this.tempImageFile);

          this.restaurantsService.uploadMenuItemImage(this.managedRestaurantId, normalized.id, formData).subscribe({
            next: (uploadResponse: any) => {
              normalized.image_url = uploadResponse.image_url;
              // Update the item in the array with the new image URL
              const index = this.menuItems.findIndex(item => item.id === normalized.id);
              if (index !== -1) {
                this.menuItems[index] = { ...normalized };
                this.menuItems = [...this.menuItems]; // Trigger change detection
              }
            },
            error: (uploadError) => {
              console.error('Image upload failed after item creation:', uploadError);
              // Don't show error alert here, item was created successfully
            }
          });
        }

        // Reload the entire menu data to ensure consistency and proper display
        if (this.managedRestaurantId) {
          this.restaurantsService.getMenuCategoriesWithItems(this.managedRestaurantId).subscribe({
            next: (cats: any[]) => {
              // Update categories
              this.categories = (cats || [])
                .filter(c => c.id)
                .map(c => ({
                  id: String(c.id),
                  name: c.name,
                  position: c.position ?? 0
                }));

              // Update menu items with fresh data from server
              this.menuItems = (cats || []).flatMap(c => (c.items || []).map((i: any) => ({
                id: String(i.id),
                category_id: String(i.category_id ?? c.id),
                name: i.name,
                description: i.description,
                price: typeof i.price === 'number' ? i.price : (i.price_cents ? Math.round(i.price_cents) / 100 : 0),
                image_url: i.image_url,
                is_available: !!i.is_available,
                is_vegetarian: !!i.is_vegetarian,
                is_vegan: !!i.is_vegan,
                is_gluten_free: !!i.is_gluten_free,
                allergens: Array.isArray(i.allergens) ? i.allergens : [],
                preparation_time_minutes: i.preparation_time_minutes ?? 15
              })));
            },
            error: (err) => {
              console.error('Failed to reload menu data:', err);
              // Fallback: just add the normalized item to the array
              this.menuItems = [...this.menuItems, normalized];
            }
          });
        } else {
          // Fallback: just add the normalized item to the array
          this.menuItems = [...this.menuItems, normalized];
        }

        this.showAddItemModal = false;
        this.resetItemForm();
        alert('Gericht wurde erfolgreich hinzugefügt!');
      },
      error: (err) => {
        console.error('Create menu item failed', err);
        alert('Fehler beim Hinzufügen des Gerichts. Bitte versuchen Sie es erneut.');
      }
    });
  }

  saveCategory() {
    if (!this.currentCategory.name || !this.managedRestaurantId) {
      return;
    }

    const payload = {
      name: this.currentCategory.name,
      position: this.currentCategory.position || 0
    };

    if (this.editingCategory) {
      // Update existing category
      if (!this.editingCategory?.id) return;
      
      this.restaurantsService.updateCategory(this.managedRestaurantId, this.editingCategory.id, payload).subscribe({
        next: (updated) => {
          const index = this.categories.findIndex(c => c.id === this.editingCategory!.id);
          if (index !== -1) {
            const updatedCategory = {
              id: String(updated.id),
              name: updated.name,
              position: (updated as any).position || 0
            };
            // Create new array reference for Angular change detection
            this.categories = [
              ...this.categories.slice(0, index),
              updatedCategory,
              ...this.categories.slice(index + 1)
            ];
          }
          this.showAddCategoryModal = false;
          this.resetCategoryForm();
        },
        error: (err) => {
          console.error('Update category failed', err);
        }
      });
    } else {
      // Create new category
      this.restaurantsService.createCategory(this.managedRestaurantId, payload).subscribe({
        next: (created) => {
          const newCategory: CategoryFormData = {
            id: String(created.id),
            name: created.name,
            position: (created as any).position || 0
          };
          // Create new array reference for Angular change detection
          this.categories = [...this.categories, newCategory];
          this.showAddCategoryModal = false;
          this.resetCategoryForm();
        },
        error: (err) => {
          console.error('Create category failed', err);
        }
      });
    }
  }

  resetItemForm() {
    this.currentItem = {
      name: '',
      description: '',
      price: 0,
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      allergens: [],
      preparation_time_minutes: 15,
      image_url: ''
    };
    this.editingItem = null;
    this.imageSource = 'upload'; // Reset to default
    this.isUploadingImage = false;
    this.uploadProgress = 0;
  }

  // Image upload methods
  setImageSource(source: 'url' | 'upload') {
    this.imageSource = source;
    if (source === 'url') {
      // Clear any existing uploaded image URL when switching to URL mode
      this.currentItem.image_url = '';
    }
  }

  onImageFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadImageFile(file);
    }
  }

  uploadImageFile(file: File) {
    if (!this.managedRestaurantId) {
      alert('Fehler: Kein Restaurant gefunden.');
      return;
    }

    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Datei ist zu groß. Maximale Größe ist 3MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Ungültiger Dateityp. Erlaubt: JPEG, PNG, GIF, WebP.');
      return;
    }

    this.isUploadingImage = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('image', file);

    // If we have an existing item, upload to that item
    if (this.editingItem) {
      this.restaurantsService.uploadMenuItemImage(this.managedRestaurantId, this.editingItem.id, formData).subscribe({
        next: (response: any) => {
          this.currentItem.image_url = response.image_url;
          this.isUploadingImage = false;
          this.uploadProgress = 100;
          alert('Bild erfolgreich hochgeladen!');
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.isUploadingImage = false;
          this.uploadProgress = 0;
          alert('Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.');
        }
      });
    } else {
      // For new items, we'll upload after creating the item
      // Store the file temporarily and upload it after item creation
      this.tempImageFile = file;
      this.uploadProgress = 100;
      this.isUploadingImage = false;
      alert('Bild ausgewählt. Es wird nach dem Speichern des Gerichts hochgeladen.');
    }
  }

  removeCurrentImage() {
    if (this.editingItem && this.managedRestaurantId) {
      // Remove image from existing item
      this.restaurantsService.deleteMenuItemImage(this.managedRestaurantId, this.editingItem.id).subscribe({
        next: () => {
          this.currentItem.image_url = '';
          alert('Bild erfolgreich entfernt.');
        },
        error: (error) => {
          console.error('Remove image failed:', error);
          alert('Fehler beim Entfernen des Bildes.');
        }
      });
    } else {
      // Just clear the URL for new items
      this.currentItem.image_url = '';
    }
  }

  private tempImageFile: File | null = null;

  resetCategoryForm() {
    this.currentCategory = {
      name: '',
      position: 0
    };
    this.editingCategory = null;
  }

  onVariantsChanged() {
    // Refresh menu items to reflect any changes in variants
    if (this.managedRestaurantId) {
      this.loadMenuCategories();
    }
  }

  private loadMenuCategories() {
    if (!this.managedRestaurantId) return;

    this.restaurantsService.getMenuCategoriesWithItems(this.managedRestaurantId).subscribe({
      next: (cats: any[]) => {
        this.categories = (cats || [])
          .filter(c => c.id)
          .map(c => ({
            id: String(c.id),
            name: c.name,
            position: c.position ?? 0
          }));

        this.menuItems = (cats || []).flatMap(c => (c.items || []).map((i: any) => ({
          id: String(i.id),
          name: i.name,
          description: i.description,
          price_cents: i.price_cents,
          is_available: i.is_available,
          category_id: String(c.id),
          image_url: i.image_url,
          is_vegetarian: i.is_vegetarian,
          is_vegan: i.is_vegan,
          is_gluten_free: i.is_gluten_free
        })));
      },
      error: (error) => {
        console.error('Error loading menu categories:', error);
      }
    });
  }
}
