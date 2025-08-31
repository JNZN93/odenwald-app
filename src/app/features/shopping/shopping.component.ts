import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier, SupplierProduct, ShoppingCartItem, ShoppingCart } from '../../core/services/supplier.service';
import { ImageFallbackDirective } from '../../core/image-fallback.directive';

@Component({
  selector: 'app-shopping',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageFallbackDirective],
  template: `
    <section class="shopping-section container">
      <header class="section-header">
        <h1 class="section-title">Einkauf bei Großhändlern</h1>
        <p class="section-subtitle">Bestelle Lebensmittel und Zutaten direkt von regionalen Großhändlern</p>
      </header>
      
      <!-- Supplier Selection -->
      <div class="supplier-selection">
        <h2 class="subsection-title">Großhändler auswählen</h2>
        <div class="suppliers-grid">
          <div 
            *ngFor="let supplier of suppliers" 
            class="supplier-card"
            [class.selected]="selectedSupplier?.id === supplier.id"
            (click)="selectSupplier(supplier)"
          >
            <div class="supplier-header">
              <h3 class="supplier-name">{{ supplier.name }}</h3>
              <span class="badge badge-primary">{{ supplier.type === 'wholesale' ? 'Großhandel' : supplier.type }}</span>
            </div>
            
            <div class="supplier-info">
              <div class="info-item">
                <span>{{ supplier.address.street }}, {{ supplier.address.city }}</span>
              </div>
              <div class="info-item">
                <span>{{ supplier.contact.phone }}</span>
              </div>
              <div class="info-item">
                <span>Min. {{ supplier.delivery_info.minimum_order }}€</span>
              </div>
              <div class="info-item">
                <span>{{ supplier.delivery_info.delivery_fee }}€ Lieferung</span>
              </div>
              <div class="info-item">
                <span>{{ supplier.delivery_info.delivery_time_days }} Tage</span>
              </div>
            </div>
            
            <div class="supplier-rating">
              <span class="rating-value">Bewertung: {{ supplier.rating }}/5</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Catalog -->
      <div *ngIf="selectedSupplier" class="product-catalog">
        <div class="catalog-header">
          <h2 class="subsection-title">Produkte von {{ selectedSupplier.name }}</h2>
          <p class="catalog-subtitle">Wähle aus unserem umfangreichen Sortiment</p>
        </div>
        
        <div class="products-grid">
          <div *ngFor="let product of products" class="product-card">
            <div class="product-image">
              <img [src]="product.image_url || ''" [alt]="product.name" appImageFallback>
              <div class="product-badges">
                <span class="badge badge-success" *ngIf="product.is_organic">Bio</span>
                <span class="badge badge-primary" *ngIf="product.is_fresh">Frisch</span>
              </div>
            </div>
            
            <div class="product-content">
              <div class="product-header">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-category">{{ product.category }}</div>
              </div>
              
              <p class="product-description">{{ product.description }}</p>
              
              <div class="product-details">
                <div class="detail-item">
                  <span>{{ product.unit }}</span>
                </div>
                <div class="detail-item">
                  <span>Verfügbar: {{ product.available_quantity }} {{ product.unit }}</span>
                </div>
              </div>
              
              <div class="product-pricing">
                <div class="price-info">
                  <span class="price">{{ product.price_per_unit }}€ / {{ product.unit }}</span>
                  <span class="min-order">Min. {{ product.min_order_quantity }} {{ product.unit }}</span>
                </div>
                
                <div class="quantity-selector">
                  <label for="qty-{{ product.id }}">Menge:</label>
                  <input 
                    type="number" 
                    [id]="'qty-' + product.id"
                    [(ngModel)]="productQuantities[product.id]"
                    [min]="product.min_order_quantity"
                    [max]="product.available_quantity"
                    (change)="updateCart()"
                    class="quantity-input"
                  >
                  <button
                    class="btn btn-primary add-to-cart-btn"
                    (click)="addToCart(product)"
                    [disabled]="!productQuantities[product.id] || productQuantities[product.id] < product.min_order_quantity"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shopping Cart -->
      <div *ngIf="cart.items.length > 0" class="shopping-cart">
        <div class="cart-header">
          <h2 class="subsection-title">
            Warenkorb
          </h2>
          <span class="cart-count">{{ cart.items.length }} Artikel</span>
        </div>
        
        <div class="cart-items">
          <div *ngFor="let item of cart.items" class="cart-item">
            <div class="item-info">
              <h4 class="item-name">{{ item.product.name }}</h4>
              <p class="item-details">{{ item.quantity }} {{ item.product.unit }} × {{ item.product.price_per_unit }}€</p>
            </div>
            <div class="item-total">
              <span class="total-price">{{ item.total_price }}€</span>
              <button class="btn btn-ghost remove-btn" (click)="removeFromCart(item.product.id)">
                Entfernen
              </button>
            </div>
          </div>
        </div>
        
        <div class="cart-summary">
          <div class="summary-row">
            <span>Zwischensumme:</span>
            <span>{{ cart.subtotal }}€</span>
          </div>
          <div class="summary-row">
            <span>Liefergebühr:</span>
            <span>{{ cart.delivery_fee }}€</span>
          </div>
          <div class="summary-row total">
            <span>Gesamt:</span>
            <span>{{ cart.total }}€</span>
          </div>
        </div>
        
        <button class="btn btn-success checkout-btn" (click)="placeOrder()">
          Bestellung aufgeben
        </button>
      </div>
    </section>
  `,
  styles: [`
    .shopping-section {
      padding: var(--space-8) 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: var(--space-10);
    }

    .section-title {
      font-size: var(--text-3xl);
      margin-bottom: var(--space-2);
      color: var(--color-heading);
    }

    .section-subtitle {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .subsection-title {
      font-size: var(--text-2xl);
      color: var(--color-heading);
      margin-bottom: var(--space-4);
      text-align: center;
    }

    .catalog-subtitle {
      color: var(--color-muted);
      margin-bottom: var(--space-6);
    }

    /* Supplier Selection */
    .supplier-selection {
      margin-bottom: var(--space-10);
    }

    .suppliers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--space-6);
    }

    .supplier-card {
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
    }

    .supplier-card:hover {
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-md);
    }

    .supplier-card.selected {
      border-color: var(--color-primary-500);
      background: color-mix(in oklab, var(--color-primary-50) 30%, white);
      box-shadow: var(--shadow-lg);
    }

    .supplier-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .supplier-name {
      color: var(--color-heading);
      font-size: var(--text-xl);
      margin: 0;
      flex: 1;
    }

    .supplier-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .supplier-rating {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2) 0;
    }

    .rating-value {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    /* Product Catalog */
    .product-catalog {
      margin-bottom: var(--space-10);
    }

    .catalog-header {
      margin-bottom: var(--space-6);
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
    }

    .product-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .product-card:hover {
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary-300);
    }

    .product-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-badges {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .product-content {
      padding: var(--space-6);
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .product-name {
      color: var(--color-heading);
      font-size: var(--text-lg);
      margin: 0;
      flex: 1;
    }

    .product-category {
      background: var(--color-surface-2);
      color: var(--color-muted);
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .product-description {
      color: var(--color-muted);
      margin-bottom: var(--space-4);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .product-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .detail-item {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    .product-pricing {
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-4);
    }

    .price-info {
      margin-bottom: var(--space-4);
    }

    .price {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--color-success);
      display: block;
      margin-bottom: var(--space-1);
    }

    .min-order {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .quantity-selector label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .quantity-input {
      width: 80px;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      text-align: center;
    }

    .add-to-cart-btn {
      flex: 1;
      min-width: 120px;
    }

    /* Shopping Cart */
    .shopping-cart {
      background: var(--color-surface);
      border: 2px solid var(--color-primary-300);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-md);
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .cart-count {
      background: var(--color-primary-500);
      color: white;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .cart-items {
      margin-bottom: var(--space-6);
    }

    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .item-info h4 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-heading);
    }

    .item-details {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .item-total {
      text-align: right;
    }

    .total-price {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-success);
      display: block;
      margin-bottom: var(--space-2);
    }

    .remove-btn {
      font-size: var(--text-sm);
      padding: 6px 12px;
    }

    .cart-summary {
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      font-size: var(--text-md);
    }

    .summary-row.total {
      border-top: 2px solid var(--color-border);
      padding-top: var(--space-3);
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--color-heading);
    }

    .checkout-btn {
      width: 100%;
      padding: var(--space-4);
      font-size: var(--text-lg);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .suppliers-grid,
      .products-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .quantity-selector {
        flex-direction: column;
        align-items: stretch;
      }

      .add-to-cart-btn {
        min-width: auto;
      }

      .cart-header {
        flex-direction: column;
        gap: var(--space-3);
        align-items: flex-start;
      }
    }

    @media (max-width: 480px) {
      .section-title {
        font-size: var(--text-2xl);
      }

      .product-card .product-content {
        padding: var(--space-4);
      }

      .shopping-cart {
        padding: var(--space-4);
      }
    }

    @media (min-width: 1200px) {
      .suppliers-grid {
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      }
    }
  `]
})
export class ShoppingComponent implements OnInit {
  private supplierService = inject(SupplierService);

  suppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  products: SupplierProduct[] = [];
  productQuantities: { [key: string]: number } = {};
  cart: ShoppingCart = {
    id: '',
    restaurant_id: 'restaurant-1', // In real app, get from auth service
    supplier_id: '',
    items: [],
    subtotal: 0,
    delivery_fee: 0,
    total: 0,
    status: 'draft',
    created_at: '',
    estimated_delivery: ''
  };

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers = suppliers;
    });
  }

  selectSupplier(supplier: Supplier) {
    this.selectedSupplier = supplier;
    this.cart.supplier_id = supplier.id;
    this.cart.delivery_fee = supplier.delivery_info.delivery_fee;
    this.loadProducts(supplier.id);
    this.updateCart();
  }

  loadProducts(supplierId: string) {
    this.supplierService.getSupplierProducts(supplierId).subscribe(products => {
      this.products = products;
      // Initialize quantities with minimum order quantities
      products.forEach(product => {
        this.productQuantities[product.id] = product.min_order_quantity;
      });
    });
  }

  addToCart(product: SupplierProduct) {
    const quantity = this.productQuantities[product.id];
    if (!quantity || quantity < product.min_order_quantity) return;

    const existingItem = this.cart.items.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.quantity * product.price_per_unit;
    } else {
      this.cart.items.push({
        product,
        quantity,
        total_price: quantity * product.price_per_unit
      });
    }

    this.updateCart();
  }

  removeFromCart(productId: string) {
    this.cart.items = this.cart.items.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  updateCart() {
    this.cart.subtotal = this.cart.items.reduce((sum, item) => sum + item.total_price, 0);
    this.cart.total = this.cart.subtotal + this.cart.delivery_fee;
  }

  placeOrder() {
    if (this.cart.items.length === 0) return;

    this.supplierService.createOrder(this.cart).subscribe(order => {
      alert(`Bestellung erfolgreich aufgegeben! Bestellnummer: ${order.id}`);
      // Reset cart
      this.cart.items = [];
      this.updateCart();
    });
  }
}

