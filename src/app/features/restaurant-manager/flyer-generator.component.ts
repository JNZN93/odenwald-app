import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantsService } from '../../core/services/restaurants.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';

interface FlyerTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'list' | 'featured';
  showImages: boolean;
  showPrices: boolean;
  showDescriptions: boolean;
  showCategories: boolean;
}

interface PaperFormat {
  id: string;
  name: string;
  description: string;
  width: number; // in mm
  height: number; // in mm
  icon: string;
  commonUse: string;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  bleedArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

@Component({
  selector: 'app-flyer-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flyer-generator-container">
      <!-- Header -->
      <div class="generator-header">
        <h1><i class="fas fa-file-pdf"></i> Flyer Generator</h1>
        <p>Erstellen Sie professionelle Flyer in verschiedenen Formaten mit Ihren Produkten</p>
      </div>

      <!-- Format Selection -->
      <div class="format-section">
        <h2>Papierformat wählen</h2>
        <div class="format-grid">
          <div 
            *ngFor="let format of paperFormats" 
            class="format-card"
            [class.selected]="selectedFormat?.id === format.id"
            (click)="selectFormat(format)">
            <div class="format-preview">
              <div class="format-icon">
                <i [class]="format.icon"></i>
              </div>
            <div class="format-dimensions">
              {{ format.width }} × {{ format.height }} mm
            </div>
            <div class="format-margins">
              Sichere Zone: {{ format.safeArea.top }}mm
            </div>
            </div>
            <h3>{{ format.name }}</h3>
            <p>{{ format.description }}</p>
            <div class="format-use">{{ format.commonUse }}</div>
          </div>
        </div>
      </div>

      <!-- Template Selection -->
      <div class="template-section" *ngIf="selectedFormat">
        <h2>Flyer-Vorlage wählen</h2>
        <div class="template-grid">
          <div 
            *ngFor="let template of templates" 
            class="template-card"
            [class.selected]="selectedTemplate?.id === template.id"
            (click)="selectTemplate(template)">
            <div class="template-preview">
              <div class="preview-content" [ngClass]="'preview-' + template.layout">
                <div class="preview-item" *ngFor="let i of [1,2,3]">
                  <div class="preview-image" *ngIf="template.showImages"></div>
                  <div class="preview-text">
                    <div class="preview-title">Produkt {{i}}</div>
                    <div class="preview-price" *ngIf="template.showPrices">€12.50</div>
                  </div>
                </div>
              </div>
            </div>
            <h3>{{ template.name }}</h3>
            <p>{{ template.description }}</p>
          </div>
        </div>
      </div>

      <!-- Product Selection -->
      <div class="product-selection-section" *ngIf="selectedTemplate && selectedFormat">
        <h2>Produkte auswählen</h2>
        <div class="selection-controls">
          <button class="btn-secondary" (click)="selectAllProducts()">
            <i class="fas fa-check-double"></i> Alle auswählen
          </button>
          <button class="btn-secondary" (click)="deselectAllProducts()">
            <i class="fas fa-times"></i> Alle abwählen
          </button>
          <button class="btn-secondary" (click)="selectByCategory()">
            <i class="fas fa-filter"></i> Nach Kategorie
          </button>
        </div>

        <div class="categories-grid">
          <div *ngFor="let category of categories" class="category-section">
            <div class="category-header">
              <h3>{{ category.name }}</h3>
              <label class="category-checkbox">
                <input 
                  type="checkbox" 
                  [checked]="isCategorySelected(category.id)"
                  (change)="toggleCategory(category.id, $event)">
                <span class="checkmark"></span>
                Alle auswählen
              </label>
            </div>
            
            <div class="products-grid">
              <div 
                *ngFor="let item of getItemsForCategory(category.id)" 
                class="product-item"
                [class.selected]="isProductSelected(item.id)"
                (click)="toggleProduct(item.id)">
                <div class="product-image" *ngIf="selectedTemplate.showImages">
                  <img [src]="getItemImageUrl(item)" [alt]="item.name" (error)="onImageError($event)">
                </div>
                <div class="product-info">
                  <h4>{{ item.name }}</h4>
                  <p class="product-description" *ngIf="selectedTemplate.showDescriptions">
                    {{ item.description }}
                  </p>
                  <div class="product-details">
                    <span class="price" *ngIf="selectedTemplate.showPrices">
                      €{{ (item.price || 0).toFixed(2) }}
                    </span>
                    <div class="product-badges">
                      <span *ngIf="item.is_vegetarian" class="badge vegetarian">V</span>
                      <span *ngIf="item.is_vegan" class="badge vegan">VG</span>
                      <span *ngIf="item.is_gluten_free" class="badge gluten-free">GF</span>
                    </div>
                  </div>
                </div>
                <div class="selection-indicator">
                  <i class="fas fa-check" *ngIf="isProductSelected(item.id)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customization Options -->
      <div class="customization-section" *ngIf="selectedTemplate && selectedProducts.length > 0 && selectedFormat">
        <h2>Anpassungen</h2>
        <div class="customization-grid">
          <div class="customization-group">
            <h3>Restaurant-Informationen</h3>
            <div class="form-group">
              <label for="restaurantName">Restaurant Name</label>
              <input 
                id="restaurantName" 
                type="text" 
                [(ngModel)]="flyerData.restaurantName"
                placeholder="Ihr Restaurant Name">
            </div>
            <div class="form-group">
              <label for="restaurantAddress">Adresse</label>
              <input 
                id="restaurantAddress" 
                type="text" 
                [(ngModel)]="flyerData.restaurantAddress"
                placeholder="Straße, PLZ Ort">
            </div>
            <div class="form-group">
              <label for="restaurantPhone">Telefon</label>
              <input 
                id="restaurantPhone" 
                type="text" 
                [(ngModel)]="flyerData.restaurantPhone"
                placeholder="+49 123 456789">
            </div>
          </div>

          <div class="customization-group">
            <h3>Flyer-Einstellungen</h3>
            <div class="form-group">
              <label for="flyerTitle">Flyer Titel</label>
              <input 
                id="flyerTitle" 
                type="text" 
                [(ngModel)]="flyerData.title"
                placeholder="z.B. Unsere Spezialitäten">
            </div>
            <div class="form-group">
              <label for="flyerSubtitle">Untertitel</label>
              <input 
                id="flyerSubtitle" 
                type="text" 
                [(ngModel)]="flyerData.subtitle"
                placeholder="z.B. Frisch zubereitet mit Liebe">
            </div>
            <div class="form-group">
              <label for="colorScheme">Farbschema</label>
              <select id="colorScheme" [(ngModel)]="flyerData.colorScheme">
                <option value="classic">Klassisch</option>
                <option value="modern">Modern</option>
                <option value="elegant">Elegant</option>
                <option value="vibrant">Lebendig</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="preview-section" *ngIf="selectedTemplate && selectedProducts.length > 0 && selectedFormat">
        <div class="preview-header">
          <h2>Vorschau</h2>
          <div class="preview-info">
            <span class="product-count">{{ selectedProducts.length }} Produkt{{ selectedProducts.length !== 1 ? 'e' : '' }} ausgewählt</span>
            <span class="template-info">{{ selectedTemplate.name }}</span>
            <span class="format-info">{{ selectedFormat.name }}</span>
            <span class="margin-info">Sichere Zone: {{ selectedFormat.safeArea.top }}mm</span>
          </div>
        </div>
        <div class="preview-container">
          <div class="flyer-preview" 
               [ngClass]="'scheme-' + flyerData.colorScheme"
               [style.width.mm]="selectedFormat.width"
               [style.height.mm]="selectedFormat.height">
            <!-- Flyer Header -->
            <div class="flyer-header">
              <h1 class="flyer-title">{{ flyerData.title || 'Unsere Spezialitäten' }}</h1>
              <p class="flyer-subtitle" *ngIf="flyerData.subtitle">{{ flyerData.subtitle }}</p>
              <div class="restaurant-info">
                <h2>{{ flyerData.restaurantName || 'Restaurant Name' }}</h2>
                <p *ngIf="flyerData.restaurantAddress">{{ flyerData.restaurantAddress }}</p>
                <p *ngIf="flyerData.restaurantPhone">{{ flyerData.restaurantPhone }}</p>
              </div>
            </div>

            <!-- Products Grid - Sorted by Categories -->
            <div class="flyer-content" [ngClass]="'layout-' + selectedTemplate.layout">
              <div *ngFor="let category of getSelectedProductsByCategory()" class="category-section">
                <div class="category-header" *ngIf="selectedTemplate.showCategories">
                  <h3 class="category-title">{{ category.name }}</h3>
                </div>
                <div class="products-container" [ngClass]="'layout-' + selectedTemplate.layout">
                  <div 
                    *ngFor="let item of category.items" 
                    class="flyer-product"
                    [ngClass]="'layout-' + selectedTemplate.layout">
                    <div class="product-image" *ngIf="selectedTemplate.showImages">
                      <img [src]="getItemImageUrl(item)" [alt]="item.name" (error)="onImageError($event)">
                    </div>
                    <div class="product-content">
                      <h4>{{ item.name }}</h4>
                      <p class="product-description" *ngIf="selectedTemplate.showDescriptions">
                        {{ item.description }}
                      </p>
                      <div class="product-price" *ngIf="selectedTemplate.showPrices">
                        €{{ (item.price || 0).toFixed(2) }}
                      </div>
                      <div class="product-badges" *ngIf="item.is_vegetarian || item.is_vegan || item.is_gluten_free">
                        <span *ngIf="item.is_vegetarian" class="badge vegetarian">V</span>
                        <span *ngIf="item.is_vegan" class="badge vegan">VG</span>
                        <span *ngIf="item.is_gluten_free" class="badge gluten-free">GF</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flyer-footer">
              <p>Besuchen Sie uns für eine unvergessliche kulinarische Erfahrung!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section" *ngIf="selectedTemplate && selectedProducts.length > 0 && selectedFormat">
        <div class="action-buttons">
          <button class="btn-primary" (click)="generatePDF()" [disabled]="isGenerating">
            <i class="fas fa-file-pdf" *ngIf="!isGenerating"></i>
            <i class="fas fa-spinner fa-spin" *ngIf="isGenerating"></i>
            {{ isGenerating ? 'Generiere PDF...' : 'PDF herunterladen' }}
          </button>
          <button class="btn-secondary" (click)="printFlyer()">
            <i class="fas fa-print"></i>
            Drucken
          </button>
          <button class="btn-secondary" (click)="saveAsImage()">
            <i class="fas fa-image"></i>
            Als Bild speichern
          </button>
          <button class="btn-secondary" (click)="resetFlyer()">
            <i class="fas fa-undo"></i>
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flyer-generator-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .generator-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .generator-header h1 {
      color: var(--color-primary-600);
      margin-bottom: var(--space-2);
    }

    .generator-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    /* Format Selection */
    .format-section {
      margin-bottom: var(--space-8);
    }

    .format-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
    }

    .format-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
    }

    .format-card {
      background: white;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      cursor: pointer;
      transition: all var(--transition);
      text-align: center;
    }

    .format-card:hover {
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .format-card.selected {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
      transform: translateY(-2px);
    }

    .format-preview {
      margin-bottom: var(--space-4);
    }

    .format-icon {
      font-size: 3rem;
      color: var(--color-primary-500);
      margin-bottom: var(--space-2);
    }

    .format-dimensions {
      font-size: var(--text-sm);
      color: var(--color-muted);
      font-weight: 600;
    }

    .format-margins {
      font-size: var(--text-xs);
      color: var(--color-muted-600);
      font-weight: 500;
      margin-top: var(--space-1);
    }

    .format-card h3 {
      margin-bottom: var(--space-2);
      color: var(--color-text);
      font-size: var(--text-lg);
    }

    .format-card p {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-2);
    }

    .format-use {
      background: var(--color-muted-100);
      color: var(--color-muted-700);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    /* Template Selection */
    .template-section {
      margin-bottom: var(--space-8);
    }

    .template-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
    }

    .template-card {
      background: white;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      cursor: pointer;
      transition: all var(--transition);
    }

    .template-card:hover {
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-md);
    }

    .template-card.selected {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }

    .template-preview {
      height: 200px;
      background: #f8f9fa;
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      padding: var(--space-4);
      overflow: hidden;
    }

    .preview-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
    }

    .preview-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .preview-featured {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .preview-item {
      background: white;
      border-radius: var(--radius-md);
      padding: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .preview-image {
      width: 40px;
      height: 40px;
      background: var(--color-muted-200);
      border-radius: var(--radius-sm);
    }

    .preview-text {
      flex: 1;
    }

    .preview-title {
      font-size: var(--text-sm);
      font-weight: 600;
      margin-bottom: 2px;
    }

    .preview-price {
      font-size: var(--text-xs);
      color: var(--color-primary-600);
      font-weight: 600;
    }

    .template-card h3 {
      margin-bottom: var(--space-2);
      color: var(--color-text);
    }

    .template-card p {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    /* Product Selection */
    .product-selection-section {
      margin-bottom: var(--space-8);
    }

    .product-selection-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
    }

    .selection-controls {
      display: flex;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
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

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-600);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--color-muted-100);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-muted-200);
    }

    .categories-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
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
      padding: var(--space-4) var(--space-6);
      background: var(--bg-light-green);
      border-bottom: 1px solid var(--color-border);
    }

    .category-header h3 {
      margin: 0;
      color: var(--color-text);
    }

    .category-checkbox {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
    }

    .category-checkbox input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      position: relative;
      transition: all var(--transition);
    }

    .category-checkbox input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    .category-checkbox input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
      padding: var(--space-6);
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
    }

    .product-item:hover {
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-sm);
    }

    .product-item.selected {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }

    .product-image {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-md);
      overflow: hidden;
      flex-shrink: 0;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-info {
      flex: 1;
    }

    .product-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-text);
      font-size: var(--text-base);
    }

    .product-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin: 0 0 var(--space-2) 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-primary-600);
    }

    .product-badges {
      display: flex;
      gap: var(--space-1);
    }

    .badge {
      padding: calc(var(--space-1) - 1px) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      border: 1px solid var(--color-border);
      background: white;
    }

    .badge.vegetarian {
      background: color-mix(in oklab, var(--color-success) 6%, white);
      color: var(--color-success);
      border-color: color-mix(in oklab, var(--color-success) 30%, var(--color-border));
    }

    .badge.vegan {
      background: color-mix(in oklab, var(--color-info) 6%, white);
      color: var(--color-info);
      border-color: color-mix(in oklab, var(--color-info) 30%, var(--color-border));
    }

    .badge.gluten-free {
      background: color-mix(in oklab, var(--color-warning) 6%, white);
      color: var(--color-warning);
      border-color: color-mix(in oklab, var(--color-warning) 30%, var(--color-border));
    }

    .selection-indicator {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      width: 24px;
      height: 24px;
      background: var(--color-primary-500);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    /* Customization */
    .customization-section {
      margin-bottom: var(--space-8);
    }

    .customization-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
    }

    .customization-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-6);
    }

    .customization-group {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      padding: var(--space-6);
    }

    .customization-group h3 {
      margin-bottom: var(--space-4);
      color: var(--color-text);
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      transition: all var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-100);
    }

    /* Preview */
    .preview-section {
      margin-bottom: var(--space-8);
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }

    .preview-header h2 {
      margin: 0;
      color: var(--color-text);
    }

    .preview-info {
      display: flex;
      gap: var(--space-4);
      align-items: center;
    }

    .product-count {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .template-info {
      background: var(--color-muted-100);
      color: var(--color-muted-700);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .format-info {
      background: var(--color-info-100);
      color: var(--color-info-700);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .margin-info {
      background: var(--color-warning-100);
      color: var(--color-warning-700);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .preview-section h2 {
      margin-bottom: var(--space-6);
      color: var(--color-text);
    }

    .preview-container {
      display: flex;
      justify-content: center;
      background: var(--color-muted-100);
      padding: var(--space-8);
      border-radius: var(--radius-xl);
    }

    .flyer-preview {
      background: white;
      box-shadow: var(--shadow-xl);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
      transform: scale(0.4);
      transform-origin: top center;
      min-width: 210mm;
      min-height: 297mm;
    }

    /* Color Schemes */
    .scheme-classic {
      --primary-color: #2c3e50;
      --secondary-color: #34495e;
      --accent-color: #e74c3c;
    }

    .scheme-modern {
      --primary-color: #3498db;
      --secondary-color: #2980b9;
      --accent-color: #e67e22;
    }

    .scheme-elegant {
      --primary-color: #8e44ad;
      --secondary-color: #9b59b6;
      --accent-color: #f39c12;
    }

    .scheme-vibrant {
      --primary-color: #e74c3c;
      --secondary-color: #c0392b;
      --accent-color: #f1c40f;
    }

    .flyer-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: var(--space-8);
      text-align: center;
    }

    .flyer-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 var(--space-2) 0;
    }

    .flyer-subtitle {
      font-size: 1.2rem;
      margin: 0 0 var(--space-4) 0;
      opacity: 0.9;
    }

    .restaurant-info h2 {
      font-size: 1.8rem;
      margin: 0 0 var(--space-2) 0;
    }

    .restaurant-info p {
      margin: 0;
      font-size: 1rem;
      opacity: 0.9;
    }

    .flyer-content {
      padding: var(--space-6);
      flex: 1;
    }

    /* Category Sections */
    .category-section {
      margin-bottom: var(--space-4);
    }

    .category-header {
      background: var(--primary-color);
      color: white;
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-2);
      border-radius: var(--radius-md);
    }

    .category-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .products-container {
      display: grid;
      gap: var(--space-2);
    }

    .products-container.layout-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-1);
    }

    .products-container.layout-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .products-container.layout-featured {
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
    }

    .flyer-product {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-2);
      background: white;
      transition: all var(--transition);
    }

    .flyer-product:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .flyer-product.layout-grid {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: var(--space-1);
      gap: var(--space-1);
    }

    .flyer-product.layout-list {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: var(--space-1);
      gap: var(--space-1);
    }

    .flyer-product.layout-featured {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: var(--space-1-5);
      gap: var(--space-1);
    }

    .flyer-product .product-image {
      width: 100%;
      height: 70px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      order: 1;
      border: 1px solid var(--color-border);
      background: var(--color-muted-100);
    }

    .flyer-product.layout-list .product-image {
      height: 60px;
    }

    .flyer-product.layout-featured .product-image {
      height: 85px;
    }

    .flyer-product .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .flyer-product .product-content {
      flex: 1;
      order: 2;
      display: flex;
      flex-direction: column;
      gap: 1px;
      text-align: center;
    }

    .flyer-product h4 {
      font-size: 0.7rem;
      font-weight: 600;
      margin: 0;
      color: var(--primary-color);
      line-height: 1.1;
    }

    .flyer-product.layout-list h4 {
      font-size: 0.75rem;
    }

    .flyer-product.layout-featured h4 {
      font-size: 0.75rem;
    }

    .flyer-product .product-description {
      font-size: 0.6rem;
      color: var(--color-muted);
      margin: 0;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .flyer-product.layout-list .product-description {
      font-size: 0.65rem;
    }

    .flyer-product.layout-featured .product-description {
      font-size: 0.65rem;
      -webkit-line-clamp: 2;
    }

    .flyer-product .product-price {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }

    .flyer-product.layout-list .product-price {
      font-size: 0.8rem;
    }

    .flyer-product.layout-featured .product-price {
      font-size: 0.85rem;
    }

    .flyer-product .product-badges {
      display: flex;
      justify-content: center;
      gap: 1px;
      flex-wrap: wrap;
      margin-top: 1px;
    }

    .flyer-footer {
      background: var(--color-muted-100);
      padding: var(--space-4);
      text-align: center;
      color: var(--color-muted);
      font-style: italic;
    }

    /* Actions */
    .actions-section {
      text-align: center;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .flyer-generator-container {
        padding: var(--space-4);
      }

      .format-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .template-grid {
        grid-template-columns: 1fr;
      }

      .customization-grid {
        grid-template-columns: 1fr;
      }

      .products-grid {
        grid-template-columns: 1fr;
      }

      .flyer-preview {
        transform: scale(0.3);
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .preview-info {
        flex-direction: column;
        gap: var(--space-2);
      }
    }

    @media (max-width: 480px) {
      .format-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FlyerGeneratorComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private restaurantManagerService = inject(RestaurantManagerService);

  menuItems: any[] = [];
  categories: any[] = [];
  managedRestaurantId: string | null = null;

  selectedTemplate: FlyerTemplate | null = null;
  selectedFormat: PaperFormat | null = null;
  selectedProducts: any[] = [];
  isGenerating = false;

  flyerData = {
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    title: 'Unsere Spezialitäten',
    subtitle: 'Frisch zubereitet mit Liebe',
    colorScheme: 'classic'
  };

  templates: FlyerTemplate[] = [
    {
      id: 'grid',
      name: 'Raster-Layout',
      description: 'Produkte in einem übersichtlichen Raster angeordnet',
      layout: 'grid',
      showImages: true,
      showPrices: true,
      showDescriptions: true,
      showCategories: true
    },
    {
      id: 'list',
      name: 'Listen-Layout',
      description: 'Produkte in einer kompakten Liste dargestellt',
      layout: 'list',
      showImages: true,
      showPrices: true,
      showDescriptions: true,
      showCategories: true
    },
    {
      id: 'featured',
      name: 'Featured-Layout',
      description: 'Produkte groß und prominent dargestellt',
      layout: 'featured',
      showImages: true,
      showPrices: true,
      showDescriptions: true,
      showCategories: true
    }
  ];

  paperFormats: PaperFormat[] = [
    {
      id: 'a4',
      name: 'DIN A4',
      description: 'Standard-Flyer Format',
      width: 210,
      height: 297,
      icon: 'fas fa-file-alt',
      commonUse: 'Standard Flyer',
      safeArea: { top: 10, right: 10, bottom: 10, left: 10 },
      bleedArea: { top: 3, right: 3, bottom: 3, left: 3 }
    },
    {
      id: 'a5',
      name: 'DIN A5',
      description: 'Kompaktes Format',
      width: 148,
      height: 210,
      icon: 'fas fa-file',
      commonUse: 'Handzettel',
      safeArea: { top: 8, right: 8, bottom: 8, left: 8 },
      bleedArea: { top: 3, right: 3, bottom: 3, left: 3 }
    },
    {
      id: 'a6',
      name: 'DIN A6',
      description: 'Kleines Format',
      width: 105,
      height: 148,
      icon: 'fas fa-file-image',
      commonUse: 'Postkarte',
      safeArea: { top: 5, right: 5, bottom: 5, left: 5 },
      bleedArea: { top: 2, right: 2, bottom: 2, left: 2 }
    },
    {
      id: 'din-lang',
      name: 'DIN Lang',
      description: 'Briefumschlag Format',
      width: 110,
      height: 220,
      icon: 'fas fa-envelope',
      commonUse: 'Briefumschlag',
      safeArea: { top: 8, right: 8, bottom: 8, left: 8 },
      bleedArea: { top: 3, right: 3, bottom: 3, left: 3 }
    },
    {
      id: 'business-card',
      name: 'Visitenkarte',
      description: 'Kleines Business Format',
      width: 85,
      height: 55,
      icon: 'fas fa-id-card',
      commonUse: 'Visitenkarte',
      safeArea: { top: 3, right: 3, bottom: 3, left: 3 },
      bleedArea: { top: 2, right: 2, bottom: 2, left: 2 }
    },
    {
      id: 'custom',
      name: 'Benutzerdefiniert',
      description: 'Eigene Maße',
      width: 210,
      height: 297,
      icon: 'fas fa-cog',
      commonUse: 'Individuell',
      safeArea: { top: 10, right: 10, bottom: 10, left: 10 },
      bleedArea: { top: 3, right: 3, bottom: 3, left: 3 }
    }
  ];

  ngOnInit() {
    this.loadRestaurantData();
  }

  private loadRestaurantData() {
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
            this.categories = (cats || [])
              .filter(c => c.id)
              .map(c => ({
                id: String(c.id),
                name: c.name,
                position: c.position ?? 0
              }));

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

            // Set default restaurant data
            if (managers?.[0]) {
              this.flyerData.restaurantName = managers[0].restaurant_name || '';
              // Load restaurant details for address and phone
              this.loadRestaurantDetails(managers[0].restaurant_id);
            }
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

  private loadRestaurantDetails(restaurantId: string) {
    this.restaurantsService.getRestaurantById(restaurantId).subscribe({
      next: (restaurant) => {
        if (restaurant) {
          // Format address from object to string
          const address = restaurant.address;
          this.flyerData.restaurantAddress = `${address.street}, ${address.postal_code} ${address.city}`;
          this.flyerData.restaurantPhone = restaurant.contact_info.phone || '';
        }
      },
      error: (error) => {
        console.error('Error loading restaurant details:', error);
      }
    });
  }

  selectTemplate(template: FlyerTemplate) {
    this.selectedTemplate = template;
  }

  selectFormat(format: PaperFormat) {
    this.selectedFormat = format;
  }

  getItemsForCategory(categoryId: string): any[] {
    return this.menuItems.filter(item => 
      item.category_id === categoryId && item.is_available
    );
  }

  getSelectedProductsByCategory(): any[] {
    if (!this.selectedProducts.length) return [];
    
    // Group selected products by category
    const categoryMap = new Map<string, any[]>();
    
    this.selectedProducts.forEach(product => {
      const categoryId = product.category_id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      categoryMap.get(categoryId)!.push(product);
    });
    
    // Convert to array and sort by category position
    return Array.from(categoryMap.entries())
      .map(([categoryId, items]) => {
        const category = this.categories.find(c => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name || 'Unbekannte Kategorie',
          position: category?.position || 999,
          items: items
        };
      })
      .sort((a, b) => a.position - b.position);
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProducts.some(p => p.id === productId);
  }

  isCategorySelected(categoryId: string): boolean {
    const categoryItems = this.getItemsForCategory(categoryId);
    return categoryItems.length > 0 && categoryItems.every(item => 
      this.isProductSelected(item.id)
    );
  }

  toggleProduct(productId: string) {
    const product = this.menuItems.find(p => p.id === productId);
    if (!product) return;

    const index = this.selectedProducts.findIndex(p => p.id === productId);
    if (index >= 0) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
  }

  toggleCategory(categoryId: string, event: any) {
    const categoryItems = this.getItemsForCategory(categoryId);
    const isSelected = event.target.checked;

    if (isSelected) {
      // Add all category items that aren't already selected
      categoryItems.forEach(item => {
        if (!this.isProductSelected(item.id)) {
          this.selectedProducts.push(item);
        }
      });
    } else {
      // Remove all category items
      this.selectedProducts = this.selectedProducts.filter(p => 
        !categoryItems.some(item => item.id === p.id)
      );
    }
  }

  selectAllProducts() {
    this.selectedProducts = this.menuItems.filter(item => item.is_available);
  }

  deselectAllProducts() {
    this.selectedProducts = [];
  }

  selectByCategory() {
    // Implementation for category-based selection
    // This could open a modal with category checkboxes
  }

  getItemImageUrl(item: any): string {
    const placeholderImages = [
      '/assets/images/food-placeholder-1-new.jpg',
      '/assets/images/food-placeholder-2.jpg', 
      '/assets/images/food-placeholder-3-new.jpg',
      '/assets/images/stock/food-placeholder-1.jpg',
      '/assets/images/stock/food-placeholder-3.jpg'
    ];
    
    if (item.image_url && item.image_url.trim() !== '') {
      return item.image_url;
    }
    
    const placeholderIndex = (item.id ? parseInt(item.id) : 0) % placeholderImages.length;
    return placeholderImages[placeholderIndex];
  }

  onImageError(event: any): void {
    const placeholderImages = [
      '/assets/images/food-placeholder-1-new.jpg',
      '/assets/images/food-placeholder-2.jpg',
      '/assets/images/food-placeholder-3-new.jpg'
    ];
    
    const randomIndex = Math.floor(Math.random() * placeholderImages.length);
    event.target.src = placeholderImages[randomIndex];
  }

  generatePDF() {
    this.isGenerating = true;
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.isGenerating = false;
      alert('Pop-up-Blocker verhindert das Öffnen des PDF-Fensters. Bitte erlauben Sie Pop-ups für diese Seite.');
      return;
    }

    // Generate HTML content for PDF
    const htmlContent = this.generateFlyerHTML();
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for images to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        this.isGenerating = false;
        
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 2000);
      }, 1000);
    };
  }

  printFlyer() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up-Blocker verhindert das Öffnen des Druckfensters. Bitte erlauben Sie Pop-ups für diese Seite.');
      return;
    }

    const htmlContent = this.generateFlyerHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
  }

  private generateFlyerHTML(): string {
    const colorScheme = this.flyerData.colorScheme;
    const layout = this.selectedTemplate?.layout || 'grid';
    const format = this.selectedFormat;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Restaurant Flyer</title>
        <style>
          @page {
            size: ${format?.width}mm ${format?.height}mm;
            margin: ${format?.safeArea.top}mm ${format?.safeArea.right}mm ${format?.safeArea.bottom}mm ${format?.safeArea.left}mm;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            width: ${format?.width}mm;
            height: ${format?.height}mm;
            background: white;
            box-sizing: border-box;
          }
          
          .flyer-container {
            width: 100%;
            height: 100%;
            position: relative;
            padding: ${format?.safeArea.top}mm ${format?.safeArea.right}mm ${format?.safeArea.bottom}mm ${format?.safeArea.left}mm;
            box-sizing: border-box;
          }
          
          .flyer-header {
            background: linear-gradient(135deg, var(--primary-color, #2c3e50), var(--secondary-color, #34495e));
            color: white;
            padding: ${Math.max(format?.safeArea.top || 10, 5)}mm;
            text-align: center;
            margin: -${format?.safeArea.top || 10}mm -${format?.safeArea.right || 10}mm 0 -${format?.safeArea.left || 10}mm;
          }
          
          .flyer-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 10px 0;
          }
          
          .flyer-subtitle {
            font-size: 1.2rem;
            margin: 0 0 20px 0;
            opacity: 0.9;
          }
          
          .restaurant-info h2 {
            font-size: 1.8rem;
            margin: 0 0 10px 0;
          }
          
          .restaurant-info p {
            margin: 0;
            font-size: 1rem;
            opacity: 0.9;
          }
          
          .flyer-content {
            padding: ${Math.max(format?.safeArea.top || 10, 5)}mm;
            flex: 1;
          }
          
          .category-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .category-header {
            background: var(--primary-color, #2c3e50);
            color: white;
            padding: 8px 12px;
            margin-bottom: 8px;
            border-radius: 6px;
          }
          
          .category-title {
            font-size: 0.9rem;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .products-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
          }
          
          .products-list {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          
          .products-featured {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .flyer-product {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 8px;
            background: white;
            page-break-inside: avoid;
          }
          
          .flyer-product.grid {
            display: flex;
            flex-direction: column;
            text-align: center;
            padding: 4px;
            gap: 3px;
          }
          
          .flyer-product.list {
            display: flex;
            flex-direction: column;
            text-align: center;
            padding: 4px;
            gap: 3px;
          }
          
          .flyer-product.featured {
            display: flex;
            flex-direction: column;
            text-align: center;
            padding: 5px;
            gap: 3px;
          }
          
          .product-image {
            width: 100%;
            height: 50px;
            border-radius: 3px;
            overflow: hidden;
            flex-shrink: 0;
            order: 1;
            border: 1px solid #e0e0e0;
            background: #fafafa;
          }
          
          .flyer-product.list .product-image {
            height: 45px;
          }
          
          .flyer-product.featured .product-image {
            height: 60px;
          }
          
          .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .product-content {
            flex: 1;
            order: 2;
            display: flex;
            flex-direction: column;
            gap: 1px;
            text-align: center;
          }
          
          .flyer-product h4 {
            font-size: 0.65rem;
            font-weight: 600;
            margin: 0;
            color: var(--primary-color, #2c3e50);
            line-height: 1.1;
          }
          
          .flyer-product.list h4 {
            font-size: 0.7rem;
          }
          
          .flyer-product.featured h4 {
            font-size: 0.7rem;
          }
          
          .flyer-product .product-description {
            font-size: 0.55rem;
            color: #666;
            margin: 0;
            line-height: 1.1;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .flyer-product.list .product-description {
            font-size: 0.6rem;
          }
          
          .flyer-product.featured .product-description {
            font-size: 0.6rem;
            -webkit-line-clamp: 2;
          }
          
          .flyer-product .product-price {
            font-size: 0.7rem;
            font-weight: 700;
            color: var(--primary-color, #2c3e50);
            margin: 0;
          }
          
          .flyer-product.list .product-price {
            font-size: 0.75rem;
          }
          
          .flyer-product.featured .product-price {
            font-size: 0.8rem;
          }
          
          .flyer-product .product-badges {
            display: flex;
            justify-content: center;
            gap: 1px;
            flex-wrap: wrap;
            margin-top: 1px;
          }
          
          .badge {
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
            border: 1px solid #e0e0e0;
            background: #fff;
          }
          
          .badge.vegetarian {
            background: #eaf7ef;
            color: #155724;
            border-color: #b7e1c1;
          }
          
          .badge.vegan {
            background: #e9f4ff;
            color: #004085;
            border-color: #b3d7ff;
          }
          
          .badge.gluten-free {
            background: #fff6e0;
            color: #856404;
            border-color: #eedc9a;
          }
          
          .flyer-footer {
            background: #f8f9fa;
            padding: ${Math.max(format?.safeArea.bottom || 10, 5)}mm;
            text-align: center;
            color: #666;
            font-style: italic;
            margin: -${format?.safeArea.bottom || 10}mm -${format?.safeArea.right || 10}mm -${format?.safeArea.bottom || 10}mm -${format?.safeArea.left || 10}mm;
          }
          
          /* Color schemes */
          .scheme-classic {
            --primary-color: #2c3e50;
            --secondary-color: #34495e;
            --accent-color: #e74c3c;
          }
          
          .scheme-modern {
            --primary-color: #3498db;
            --secondary-color: #2980b9;
            --accent-color: #e67e22;
          }
          
          .scheme-elegant {
            --primary-color: #8e44ad;
            --secondary-color: #9b59b6;
            --accent-color: #f39c12;
          }
          
          .scheme-vibrant {
            --primary-color: #e74c3c;
            --secondary-color: #c0392b;
            --accent-color: #f1c40f;
          }
        </style>
      </head>
      <body>
        <div class="flyer-container scheme-${colorScheme}">
          <div class="flyer-header">
            <h1 class="flyer-title">${this.flyerData.title}</h1>
            ${this.flyerData.subtitle ? `<p class="flyer-subtitle">${this.flyerData.subtitle}</p>` : ''}
            <div class="restaurant-info">
              <h2>${this.flyerData.restaurantName}</h2>
              ${this.flyerData.restaurantAddress ? `<p>${this.flyerData.restaurantAddress}</p>` : ''}
              ${this.flyerData.restaurantPhone ? `<p>${this.flyerData.restaurantPhone}</p>` : ''}
            </div>
          </div>
          
          <div class="flyer-content">
            ${this.getSelectedProductsByCategory().map(category => `
              <div class="category-section">
                ${this.selectedTemplate?.showCategories ? `
                  <div class="category-header">
                    <h3 class="category-title">${category.name}</h3>
                  </div>
                ` : ''}
                <div class="products-${layout}">
                  ${category.items.map((item: any) => `
                    <div class="flyer-product ${layout}">
                      ${this.selectedTemplate?.showImages ? `
                        <div class="product-image">
                          <img src="${this.getItemImageUrl(item)}" alt="${item.name}">
                        </div>
                      ` : ''}
                      <div class="product-content">
                        <h4>${item.name}</h4>
                        ${this.selectedTemplate?.showDescriptions && item.description ? `
                          <p class="product-description">${item.description}</p>
                        ` : ''}
                        ${this.selectedTemplate?.showPrices ? `
                          <div class="product-price">€${(item.price || 0).toFixed(2)}</div>
                        ` : ''}
                        ${(item.is_vegetarian || item.is_vegan || item.is_gluten_free) ? `
                          <div class="product-badges">
                            ${item.is_vegetarian ? '<span class="badge vegetarian">V</span>' : ''}
                            ${item.is_vegan ? '<span class="badge vegan">VG</span>' : ''}
                            ${item.is_gluten_free ? '<span class="badge gluten-free">GF</span>' : ''}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="flyer-footer">
            <p>Besuchen Sie uns für eine unvergessliche kulinarische Erfahrung!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  saveAsImage() {
    // Create a canvas to render the flyer
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high quality (A4 at 300 DPI)
    canvas.width = 2480; // A4 width at 300 DPI
    canvas.height = 3508; // A4 height at 300 DPI

    // Create a temporary container to render the flyer
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm';
    tempContainer.style.height = '297mm';
    tempContainer.style.background = 'white';
    tempContainer.style.transform = 'scale(3.5)'; // Scale up for high resolution
    tempContainer.style.transformOrigin = 'top left';
    
    document.body.appendChild(tempContainer);

    // Generate the flyer HTML and append to temp container
    const flyerHTML = this.generateFlyerHTML();
    tempContainer.innerHTML = flyerHTML;

    // Wait for images to load, then capture
    setTimeout(() => {
      // Use html2canvas if available, otherwise fallback to basic method
      if ((window as any).html2canvas) {
        (window as any).html2canvas(tempContainer, {
          scale: 1,
          width: 210,
          height: 297,
          useCORS: true
        }).then((canvas: HTMLCanvasElement) => {
          // Download the image
          const link = document.createElement('a');
          link.download = `restaurant-flyer-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          // Cleanup
          document.body.removeChild(tempContainer);
        });
      } else {
        // Fallback: show instructions
        alert('Für die Bildfunktion wird html2canvas benötigt. Bitte verwenden Sie stattdessen die Druckfunktion und wählen Sie "Als PDF speichern".');
        document.body.removeChild(tempContainer);
      }
    }, 2000);
  }

  resetFlyer() {
    this.selectedTemplate = null;
    this.selectedFormat = null;
    this.selectedProducts = [];
    this.flyerData = {
      restaurantName: '',
      restaurantAddress: '',
      restaurantPhone: '',
      title: 'Unsere Spezialitäten',
      subtitle: 'Frisch zubereitet mit Liebe',
      colorScheme: 'classic'
    };
  }
}
