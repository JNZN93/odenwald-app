import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface WholesalerProduct {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  wholesale_price: number | null;
  min_order_quantity: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  images: string[];
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-wholesaler-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-container">
      <div class="products-header">
        <div class="header-content">
          <h1>Produktverwaltung</h1>
          <p>Verwalten Sie Ihren Produktkatalog</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openAddProductModal()">
            <i class="fa-solid fa-plus"></i>
            Produkt hinzufügen
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
            <path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p>Produkte werden geladen...</p>
      </div>

      <!-- Products Table -->
      <div class="products-table-container" *ngIf="!loading && products.length > 0">
        <table class="products-table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Kategorie</th>
              <th>Preis</th>
              <th>Lager</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products">
              <td>
                <div class="product-info">
                  <strong>{{ product.name }}</strong>
                  <small *ngIf="product.description">{{ product.description }}</small>
                </div>
              </td>
              <td>
                <span class="category-badge">{{ product.category || 'Keine Kategorie' }}</span>
              </td>
              <td>
                <div class="price-info">
                  <span class="price">€{{ product.price.toFixed(2) }}</span>
                  <small *ngIf="product.wholesale_price && product.wholesale_price > 0">Groß: €{{ product.wholesale_price.toFixed(2) }}</small>
                </div>
              </td>
              <td>
                <span class="stock-info" [class.low-stock]="product.stock_quantity < 10">
                  {{ product.stock_quantity }} {{ product.unit || 'Stück' }}
                </span>
              </td>
              <td>
                <span class="status-badge" [class]="product.is_available ? 'available' : 'unavailable'">
                  {{ product.is_available ? 'Verfügbar' : 'Nicht verfügbar' }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn-sm btn-secondary" (click)="editProduct(product)">
                    <i class="fa-solid fa-edit"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="deleteProduct(product)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && products.length === 0">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3h18v18H3z"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </div>
        <h3>Noch keine Produkte</h3>
        <p>Fügen Sie Ihre ersten Produkte zu Ihrem Katalog hinzu.</p>
        <button class="btn-primary" (click)="openAddProductModal()">
          <i class="fa-solid fa-plus"></i>
          Erstes Produkt hinzufügen
        </button>
      </div>

      <!-- Add/Edit Product Modal -->
      <div class="modal-overlay" *ngIf="showProductModal" (click)="closeProductModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt' }}</h2>
            <button class="close-btn" (click)="closeProductModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form class="product-form" (ngSubmit)="saveProduct()">
            <div class="form-row">
              <div class="form-group">
                <label for="product-name">Produktname *</label>
                <input
                  id="product-name"
                  type="text"
                  [(ngModel)]="productForm.name"
                  name="name"
                  required
                  placeholder="z.B. Tomaten Bio"
                />
              </div>
              <div class="form-group">
                <label for="product-category">Kategorie</label>
                <select id="product-category" [(ngModel)]="productForm.category" name="category">
                  <option value="">Keine Kategorie</option>
                  <option value="Frisch">Frisch</option>
                  <option value="Tiefkühl">Tiefkühl</option>
                  <option value="Konserven">Konserven</option>
                  <option value="Getränke">Getränke</option>
                  <option value="Backwaren">Backwaren</option>
                  <option value="Gewürze">Gewürze</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="product-description">Beschreibung</label>
              <textarea
                id="product-description"
                [(ngModel)]="productForm.description"
                name="description"
                rows="3"
                placeholder="Detaillierte Beschreibung des Produkts..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-price">Verkaufspreis (€) *</label>
                <input
                  id="product-price"
                  type="number"
                  [(ngModel)]="productForm.price"
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>
              <div class="form-group">
                <label for="product-wholesale-price">Großhandelspreis (€)</label>
                <input
                  id="product-wholesale-price"
                  type="number"
                  [(ngModel)]="productForm.wholesale_price"
                  name="wholesale_price"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-unit">Einheit *</label>
                <select id="product-unit" [(ngModel)]="productForm.unit" name="unit" required>
                  <option value="piece">Stück</option>
                  <option value="kg">kg</option>
                  <option value="liter">Liter</option>
                  <option value="pack">Packung</option>
                </select>
              </div>
              <div class="form-group">
                <label for="product-stock">Lagerbestand *</label>
                <input
                  id="product-stock"
                  type="number"
                  [(ngModel)]="productForm.stock_quantity"
                  name="stock_quantity"
                  min="0"
                  required
                  placeholder="0"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-min-order">Mindestbestellmenge</label>
                <input
                  id="product-min-order"
                  type="number"
                  [(ngModel)]="productForm.min_order_quantity"
                  name="min_order_quantity"
                  min="1"
                  placeholder="1"
                />
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    [(ngModel)]="productForm.is_available"
                    name="is_available"
                  />
                  Produkt verfügbar
                </label>
              </div>
            </div>

            <!-- Bilder Section -->
            <div class="form-section">
              <h3 class="section-title">Produktbilder</h3>

              <!-- Bild-URL Eingabe -->
              <div class="form-group">
                <label for="image-url">Bild-URL hinzufügen</label>
                <div class="url-input-group">
                  <input
                    id="image-url"
                    type="url"
                    [(ngModel)]="imageUrl"
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    class="btn-secondary btn-sm"
                    (click)="addImageUrl()"
                    [disabled]="!imageUrl || addingImage"
                  >
                    <i class="fa-solid fa-plus" *ngIf="!addingImage"></i>
                    <i class="fa-solid fa-spinner fa-spin" *ngIf="addingImage"></i>
                    Hinzufügen
                  </button>
                </div>
              </div>

              <!-- Datei-Upload -->
              <div class="form-group">
                <label for="image-upload">Bilder hochladen</label>
                <div class="file-upload-area"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)">
                  <input
                    id="image-upload"
                    type="file"
                    #fileInput
                    (change)="onFileSelected($event)"
                    accept="image/*"
                    multiple
                    style="display: none;"
                  />
                  <div class="upload-content">
                    <i class="fa-solid fa-cloud-upload-alt upload-icon"></i>
                    <p class="upload-text">
                      Ziehen Sie Bilder hierher oder
                      <button type="button" class="upload-link" (click)="fileInput.click()">wählen Sie welche aus</button>
                    </p>
                    <p class="upload-hint">Max. 5 Bilder, je 5MB</p>
                  </div>
                </div>
              </div>

              <!-- Bildvorschau -->
              <div class="images-preview" *ngIf="productForm.images && productForm.images.length > 0">
                <h4>Aktuelle Bilder ({{ productForm.images.length }}/10)</h4>
                <div class="images-grid">
                  <div class="image-item" *ngFor="let image of productForm.images; let i = index">
                    <img [src]="image" [alt]="'Produktbild ' + (i + 1)" class="image-preview" />
                    <button
                      type="button"
                      class="remove-image-btn"
                      (click)="removeImage(i)"
                      [disabled]="removingImage"
                    >
                      <i class="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeProductModal()">Abbrechen</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                <i class="fa-solid fa-save" *ngIf="!saving"></i>
                <i class="fa-solid fa-spinner fa-spin" *ngIf="saving"></i>
                {{ saving ? 'Wird gespeichert...' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .products-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
    }

    .products-header h1 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    .products-header p {
      margin: 0;
      color: var(--color-muted);
    }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-danger {
      background: var(--color-danger);
      color: white;
    }

    .products-table-container {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      overflow: hidden;
    }

    .products-table {
      width: 100%;
      border-collapse: collapse;
    }

    .products-table th,
    .products-table td {
      padding: var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    .products-table th {
      background: var(--bg-light);
      font-weight: 600;
      color: var(--color-heading);
    }

    .product-info strong {
      display: block;
      color: var(--color-heading);
    }

    .product-info small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .category-badge {
      background: var(--bg-light-green);
      color: var(--color-success);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .price-info {
      display: flex;
      flex-direction: column;
    }

    .price {
      font-weight: 600;
      color: var(--color-primary);
    }

    .price-info small {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .stock-info {
      font-weight: 500;
    }

    .stock-info.low-stock {
      color: var(--color-danger);
    }

    .status-badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.available {
      background: var(--bg-success);
      color: var(--color-success);
    }

    .status-badge.unavailable {
      background: var(--bg-danger);
      color: var(--color-danger);
    }

    .actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-sm {
      padding: var(--space-2);
      font-size: var(--text-sm);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
    }

    .empty-icon {
      margin-bottom: var(--space-4);
      color: var(--color-muted);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .empty-state p {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-muted);
    }

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
      padding: var(--space-4);
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      color: var(--color-heading);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      color: var(--color-muted);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--bg-light);
      color: var(--color-text);
    }

    .product-form {
      padding: var(--space-6);
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
      font-weight: 500;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .modal-actions {
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: var(--space-4);
      color: var(--color-primary);
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Bilder Section Styles */
    .form-section {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .section-title {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-heading);
    }

    .url-input-group {
      display: flex;
      gap: var(--space-2);
      align-items: stretch;
    }

    .url-input-group input {
      flex: 1;
    }

    .file-upload-area {
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      text-align: center;
      background: white;
      transition: all var(--transition);
      cursor: pointer;
    }

    .file-upload-area:hover,
    .file-upload-area.drag-over {
      border-color: var(--color-primary);
      background: var(--bg-light-green);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .upload-icon {
      font-size: var(--text-4xl);
      color: var(--color-muted);
    }

    .upload-text {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .upload-link {
      background: none;
      border: none;
      color: var(--color-primary);
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
      padding: 0;
    }

    .upload-link:hover {
      color: var(--color-primary-dark);
    }

    .upload-hint {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .images-preview {
      margin-top: var(--space-4);
    }

    .images-preview h4 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-heading);
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-3);
    }

    .image-item {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: white;
      border: 1px solid var(--color-border);
    }

    .image-preview {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    }

    .remove-image-btn {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
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
      font-size: var(--text-xs);
      transition: all var(--transition);
    }

    .remove-image-btn:hover:not(:disabled) {
      background: rgba(239, 68, 68, 1);
      transform: scale(1.1);
    }

    .remove-image-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .products-header {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: var(--space-2);
      }

      .url-input-group {
        flex-direction: column;
      }

      .images-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      }

      .image-preview {
        height: 100px;
      }
    }
  `]
})
export class WholesalerProductsComponent implements OnInit {
  private http = inject(HttpClient);

  products: WholesalerProduct[] = [];
  loading = false;
  saving = false;

  showProductModal = false;
  editingProduct: WholesalerProduct | null = null;

  productForm: {
    name: string;
    description: string;
    category: string;
    price: number;
    wholesale_price: number | null;
    unit: string;
    stock_quantity: number;
    min_order_quantity: number;
    is_available: boolean;
    images: string[];
  } = {
    name: '',
    description: '',
    category: '',
    price: 0,
    wholesale_price: null,
    unit: 'piece',
    stock_quantity: 0,
    min_order_quantity: 1,
    is_available: true,
    images: []
  };

  // Neue Properties für Bildfunktionen
  imageUrl: string = '';
  addingImage: boolean = false;
  uploadingImages: boolean = false;
  removingImage: boolean = false;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.http.get<{products: WholesalerProduct[]}>(`${environment.apiUrl}/wholesaler-products`).subscribe({
      next: (response) => {
        // Transform products to ensure numeric fields are numbers and images is an array
        this.products = response.products.map(product => ({
          ...product,
          price: Number(product.price),
          wholesale_price: product.wholesale_price ? Number(product.wholesale_price) : null,
          stock_quantity: Number(product.stock_quantity),
          min_order_quantity: Number(product.min_order_quantity),
          images: Array.isArray(product.images) ? product.images : []
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.loading = false;
        // Could show error toast here
      }
    });
  }

  openAddProductModal() {
    this.editingProduct = null;
    this.resetProductForm();
    this.showProductModal = true;
  }

  editProduct(product: WholesalerProduct) {
    this.editingProduct = product;
    this.productForm = {
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: Number(product.price),
      wholesale_price: product.wholesale_price ? Number(product.wholesale_price) : null,
      unit: product.unit,
      stock_quantity: Number(product.stock_quantity),
      min_order_quantity: Number(product.min_order_quantity),
      is_available: product.is_available,
      images: Array.isArray(product.images) ? product.images : []
    };
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.editingProduct = null;
    this.resetProductForm();
  }

  private resetProductForm() {
    this.productForm = {
      name: '',
      description: '',
      category: '',
      price: 0.00,
      wholesale_price: null,
      unit: 'piece',
      stock_quantity: 0,
      min_order_quantity: 1,
      is_available: true,
      images: []
    };
    this.imageUrl = '';
  }

  saveProduct() {
    if (!this.productForm.name || this.productForm.price <= 0) {
      return;
    }

    this.saving = true;

    const productData = {
      name: this.productForm.name,
      description: this.productForm.description || null,
      category: this.productForm.category || null,
      price: Number(this.productForm.price),
      wholesale_price: this.productForm.wholesale_price ? Number(this.productForm.wholesale_price) : null,
      unit: this.productForm.unit,
      stock_quantity: Number(this.productForm.stock_quantity),
      min_order_quantity: Number(this.productForm.min_order_quantity),
      is_available: this.productForm.is_available,
      images: Array.isArray(this.productForm.images) ? this.productForm.images : []
    };

    if (this.editingProduct) {
      // Update existing product
      this.http.put(`${environment.apiUrl}/wholesaler-products/${this.editingProduct.id}`, productData).subscribe({
        next: () => {
          this.saving = false;
          this.closeProductModal();
          this.loadProducts(); // Fetch updated list
        },
        error: (error) => {
          console.error('Failed to update product:', error);
          this.saving = false;
          // Could show error toast here
        }
      });
    } else {
      // Create new product
      this.http.post(`${environment.apiUrl}/wholesaler-products`, productData).subscribe({
        next: () => {
          this.saving = false;
          this.closeProductModal();
          this.loadProducts(); // Fetch updated list
        },
        error: (error) => {
          console.error('Failed to create product:', error);
          this.saving = false;
          // Could show error toast here
        }
      });
    }
  }

  deleteProduct(product: WholesalerProduct) {
    if (confirm(`Sind Sie sicher, dass Sie "${product.name}" löschen möchten?`)) {
      this.http.delete(`${environment.apiUrl}/wholesaler-products/${product.id}`).subscribe({
        next: () => {
          this.loadProducts(); // Fetch updated list after deletion
        },
        error: (error) => {
          console.error('Failed to delete product:', error);
          // Could show error toast here
        }
      });
    }
  }

  // Bild-Funktionen
  addImageUrl() {
    if (!this.imageUrl.trim()) return;

    // Validierung der URL
    try {
      new URL(this.imageUrl);
    } catch {
      alert('Bitte geben Sie eine gültige URL ein.');
      return;
    }

    // Prüfen ob bereits 10 Bilder vorhanden sind
    if (this.productForm.images.length >= 10) {
      alert('Maximal 10 Bilder pro Produkt erlaubt.');
      return;
    }

    this.addingImage = true;

    if (this.editingProduct) {
      // Bild-URL zu bestehendem Produkt hinzufügen
      this.http.post(`${environment.apiUrl}/wholesaler-products/${this.editingProduct.id}/images/url`, {
        imageUrl: this.imageUrl
      }).subscribe({
        next: (response: any) => {
          this.productForm.images = response.product.images || [];
          this.imageUrl = '';
          this.addingImage = false;
        },
        error: (error) => {
          console.error('Failed to add image URL:', error);
          alert('Fehler beim Hinzufügen der Bild-URL.');
          this.addingImage = false;
        }
      });
    } else {
      // Bild-URL zur Form hinzufügen (für neues Produkt)
      this.productForm.images.push(this.imageUrl);
      this.imageUrl = '';
      this.addingImage = false;
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadImages(Array.from(files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadImages(Array.from(files));
    }
  }

  uploadImages(files: File[]) {
    // Validierung
    if (this.productForm.images.length + files.length > 10) {
      alert('Maximal 10 Bilder pro Produkt erlaubt.');
      return;
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxFileSize);
    if (invalidFiles.length > 0) {
      alert('Einige Dateien sind zu groß. Maximale Dateigröße: 5MB');
      return;
    }

    if (!this.editingProduct) {
      alert('Bitte speichern Sie zuerst das Produkt, bevor Sie Bilder hochladen.');
      return;
    }

    this.uploadingImages = true;
    const formData = new FormData();

    files.forEach(file => {
      formData.append('images', file);
    });

    this.http.post(`${environment.apiUrl}/wholesaler-products/${this.editingProduct.id}/images/upload`, formData).subscribe({
      next: (response: any) => {
        this.productForm.images = response.product.images || [];
        this.uploadingImages = false;
      },
      error: (error) => {
        console.error('Failed to upload images:', error);
        alert('Fehler beim Hochladen der Bilder.');
        this.uploadingImages = false;
      }
    });
  }

  removeImage(index: number) {
    const imageUrl = this.productForm.images[index];

    if (!this.editingProduct) {
      // Für neues Produkt einfach aus dem Array entfernen
      this.productForm.images.splice(index, 1);
      return;
    }

    this.removingImage = true;

    this.http.delete(`${environment.apiUrl}/wholesaler-products/${this.editingProduct.id}/images`, {
      body: { imageUrl }
    }).subscribe({
      next: (response: any) => {
        this.productForm.images = response.product.images || [];
        this.removingImage = false;
      },
      error: (error) => {
        console.error('Failed to remove image:', error);
        alert('Fehler beim Entfernen des Bildes.');
        this.removingImage = false;
      }
    });
  }
}
