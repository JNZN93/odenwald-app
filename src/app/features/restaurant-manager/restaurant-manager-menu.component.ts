import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';

// Local interface for category management
interface CategoryFormData {
  id?: string;
  name: string;
  position: number;
}

@Component({
  selector: 'app-restaurant-manager-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
                  <span class="price">€{{ item.price.toFixed(2) }}</span>
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
                  <span class="price">€{{ item.price.toFixed(2) }}</span>
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

            <div class="form-group">
              <label for="itemImage">Bild URL</label>
              <input id="itemImage" type="url" [(ngModel)]="currentItem.image_url" name="imageUrl">
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

    .btn-primary, .btn-secondary, .btn-sm {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
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
      background: var(--bg-light-green);
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
  showAddCategoryModal: boolean = false;
  editingItem: any = null;
  editingCategory: CategoryFormData | null = null;

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
              price: typeof i.price === 'number' ? i.price : (i.price_cents ? i.price_cents / 100 : 0),
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
    if (!this.currentItem.name || !(this.currentItem.price > 0)) {
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
        price_cents: Math.round(Number(this.currentItem.price) * 100),
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
          price: typeof (created as any).price === 'number' ? (created as any).price : (created.price_cents ? created.price_cents / 100 : Number(this.currentItem.price)),
          image_url: created.image_url,
          is_available: !!(created as any).is_available,
          is_vegetarian: !!(created as any).is_vegetarian,
          is_vegan: !!(created as any).is_vegan,
          is_gluten_free: !!(created as any).is_gluten_free,
          allergens: Array.isArray((created as any).allergens) ? (created as any).allergens : [],
          preparation_time_minutes: (created as any).preparation_time_minutes ?? this.currentItem.preparation_time_minutes ?? 15
        };

        // Create new array reference to trigger Angular change detection
        this.menuItems = [...this.menuItems, normalized];

        // Reload categories in case a new category was created
        if (this.managedRestaurantId) {
          this.restaurantsService.getMenuCategoriesWithItems(this.managedRestaurantId).subscribe({
            next: (cats: any[]) => {
              this.categories = (cats || [])
                .filter(c => c.id)
                .map(c => ({
                  id: String(c.id),
                  name: c.name,
                  position: c.position ?? 0
                }));
            },
            error: () => {
              // Keep existing categories on error
            }
          });
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
      preparation_time_minutes: 15
    };
    this.editingItem = null;
  }

  resetCategoryForm() {
    this.currentCategory = {
      name: '',
      position: 0
    };
    this.editingCategory = null;
  }
}
