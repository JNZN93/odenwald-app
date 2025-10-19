import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService, Order, OrderItem } from '../../core/services/orders.service';
import { MenuItemsService, VariantGroup, VariantOption } from '../../core/services/menu-items.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-order-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2>Bestellung #{{ order?.id }} bearbeiten</h2>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <!-- Order Info - Kompakt -->
        <div class="order-info-compact" *ngIf="order">
          <div class="order-status">
            <span class="status-badge" [ngClass]="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
            <span class="order-type">{{ getOrderTypeText(order.order_type) }}</span>
            <span *ngIf="order.table_number" class="table-info">Tisch {{ order.table_number }}</span>
            <span class="total-price">{{ order.total_price | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="modal-body-grid">
          <!-- Current Items - Links -->
          <div class="current-items-section">
            <h3>Aktuelle Items</h3>
            <div class="items-list-compact">
              <div *ngFor="let item of order?.items; let i = index" class="item-row-compact">
                <div class="item-main">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-price">{{ item.unit_price | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="item-controls">
                  <div class="quantity-controls">
                    <button (click)="updateItemQuantity(i, item.quantity - 1)" class="qty-btn" [disabled]="item.quantity <= 1">-</button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button (click)="updateItemQuantity(i, item.quantity + 1)" class="qty-btn">+</button>
                  </div>
                  <span class="item-total">{{ (item.quantity * item.unit_price) | currency:'EUR':'symbol':'1.2-2' }}</span>
                  <button (click)="removeItem(i)" class="remove-btn">🗑️</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Items - Rechts -->
          <div class="add-items-section">
            <h3>Items hinzufügen</h3>
            
            <!-- Loading state -->
            <div *ngIf="availableMenuItems.length === 0 && !hasLoadedMenuItems" class="loading-message">
              <p>Menü wird geladen...</p>
            </div>
            
            <!-- No items found -->
            <div *ngIf="availableMenuItems.length === 0 && hasLoadedMenuItems" class="no-items-message">
              <p>Keine Menü-Items verfügbar für dieses Restaurant.</p>
              <p class="help-text">Bitte überprüfen Sie, ob Menü-Items für dieses Restaurant konfiguriert sind.</p>
            </div>
            
            <!-- Menu items list -->
            <div class="menu-items-compact" *ngIf="availableMenuItems.length > 0">
              <div *ngFor="let menuItem of availableMenuItems" class="menu-item-compact">
                <div class="menu-item-main">
                  <span class="menu-item-name">{{ menuItem.name }}</span>
                  <span class="menu-item-price">{{ menuItem.price | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                
                <!-- Variants Section -->
                <div class="variants-section" *ngIf="hasVariants(menuItem.id)">
                  <div *ngFor="let variantGroup of getVariantsForMenuItem(menuItem.id)" class="variant-group-compact">
                    <label class="variant-label">
                      {{ variantGroup.name }}
                      <span *ngIf="variantGroup.is_required" class="required">*</span>
                    </label>
                    <select 
                      class="variant-select"
                      [multiple]="variantGroup.max_selections > 1"
                      (change)="onVariantChange(menuItem.id, variantGroup.id, $event)"
                    >
                      <option value="">-- Auswählen --</option>
                      <option 
                        *ngFor="let option of variantGroup.options" 
                        [value]="option.id"
                        [selected]="isVariantOptionSelected(menuItem.id, variantGroup.id, option.id)"
                        [disabled]="!option.is_available"
                      >
                        {{ option.name }}
                        <span *ngIf="option.price_modifier_cents !== 0">
                          ({{ option.price_modifier_cents > 0 ? '+' : '' }}{{ option.price_modifier_cents / 100 | currency:'EUR':'symbol':'1.2-2' }})
                        </span>
                      </option>
                    </select>
                    <div class="variant-error" *ngIf="getVariantValidationError(menuItem.id, variantGroup.id)">
                      {{ getVariantValidationError(menuItem.id, variantGroup.id) }}
                    </div>
                  </div>
                </div>
                
                <div class="menu-item-controls">
                  <div class="quantity-input">
                    <button (click)="decreaseAddQuantity(menuItem)" class="qty-btn">-</button>
                    <span class="quantity">{{ getAddQuantity(menuItem.id) }}</span>
                    <button (click)="increaseAddQuantity(menuItem)" class="qty-btn">+</button>
                  </div>
                  <button 
                    (click)="addMenuItem(menuItem)" 
                    class="add-btn"
                    [disabled]="!canAddMenuItem(menuItem.id)"
                    [title]="!canAddMenuItem(menuItem.id) ? 'Menge und Varianten erforderlich' : ''"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="cancel-btn" (click)="closeModal()">Abbrechen</button>
          <button class="save-btn" (click)="saveChanges()" [disabled]="!hasChanges() || isSaving">
            {{ isSaving ? 'Speichern...' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 16px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 1000px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #6b7280;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .order-info-compact {
      padding: 12px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .order-status {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge.preparing { background: #fde68a; color: #b45309; }
    .status-badge.ready { background: #dcfce7; color: #166534; }

    .order-type, .table-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .total-price {
      font-weight: 600;
      color: #059669;
      margin-left: auto;
    }

    .modal-body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 20px;
    }

    .current-items-section, .add-items-section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .current-items-section h3, .add-items-section h3 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .items-list-compact, .menu-items-compact {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-row-compact, .menu-item-compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .item-main, .menu-item-main {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-name, .menu-item-name {
      font-weight: 500;
      color: #111827;
      font-size: 0.875rem;
    }

    .item-price, .menu-item-price {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .item-controls, .menu-item-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .quantity-controls, .quantity-input {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .qty-btn {
      width: 24px;
      height: 24px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .qty-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .qty-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity {
      min-width: 20px;
      text-align: center;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .item-total {
      font-weight: 600;
      color: #111827;
      min-width: 60px;
      text-align: right;
      font-size: 0.75rem;
    }

    .remove-btn {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 2px;
    }

    .add-btn {
      width: 28px;
      height: 28px;
      background: #059669;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .add-btn:hover:not(:disabled) {
      background: #047857;
    }

    .add-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .variants-section {
      margin: 8px 0;
      padding: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .variant-group-compact {
      margin-bottom: 8px;
    }

    .variant-group-compact:last-child {
      margin-bottom: 0;
    }

    .variant-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    }

    .variant-label .required {
      color: #dc2626;
    }

    .variant-select {
      width: 100%;
      padding: 4px 6px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.75rem;
      background: white;
    }

    .variant-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .variant-error {
      font-size: 0.7rem;
      color: #dc2626;
      margin-top: 2px;
    }

    .loading-message, .no-items-message {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .loading-message p, .no-items-message p {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
    }

    .no-items-message .help-text {
      font-size: 0.75rem;
      color: #9ca3af;
      margin: 0;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .cancel-btn {
      padding: 8px 16px;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .cancel-btn:hover {
      background: #f9fafb;
    }

    .save-btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .save-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .save-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .modal-body-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
      }
      
      .modal-content {
        max-width: 95vw;
      }
    }
  `]
})
export class OrderEditModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() order: Order | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<Order>();

  private ordersService = inject(OrdersService);
  private menuItemsService = inject(MenuItemsService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  availableMenuItems: any[] = [];
  itemQuantities: { [key: string]: number } = {};
  addQuantities: { [key: string]: number } = {};
  isSaving = false;
  hasLoadedMenuItems = false;
  menuItemVariants: { [key: string]: VariantGroup[] } = {};
  selectedVariants: { [key: string]: { [variantGroupId: string]: string[] } } = {};

  ngOnInit() {
    if (this.order) {
      this.resetModal();
      this.loadMenuItems();
      this.initializeQuantities();
    }
  }

  ngOnChanges() {
    if (this.order && this.isOpen) {
      this.resetModal();
      this.loadMenuItems();
      this.initializeQuantities();
    }
  }

  private resetModal() {
    this.hasLoadedMenuItems = false;
    this.availableMenuItems = [];
    this.addQuantities = {};
    this.menuItemVariants = {};
    this.selectedVariants = {};
  }

  private async loadMenuItems() {
    if (!this.order) return;
    
    console.log('Loading menu items for restaurant:', this.order.restaurant_id);
    
    try {
      this.availableMenuItems = await this.menuItemsService.getMenuItemsByRestaurant(this.order.restaurant_id).toPromise() || [];
      console.log('Loaded menu items:', this.availableMenuItems);
      
      // Load variants for each menu item
      for (const menuItem of this.availableMenuItems) {
        try {
          const variants = await this.menuItemsService.getVariantsForMenuItem(this.order.restaurant_id, menuItem.id).toPromise() || [];
          this.menuItemVariants[menuItem.id] = variants;
          
          // Initialize selected variants
          this.selectedVariants[menuItem.id] = {};
          variants.forEach(variantGroup => {
            this.selectedVariants[menuItem.id][variantGroup.id] = [];
          });
        } catch (error) {
          console.error(`Error loading variants for menu item ${menuItem.id}:`, error);
          this.menuItemVariants[menuItem.id] = [];
        }
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      this.toastService.error('Fehler', 'Menü konnte nicht geladen werden');
    } finally {
      this.hasLoadedMenuItems = true;
    }
  }

  private initializeQuantities() {
    if (!this.order) return;
    
    this.itemQuantities = {};
    this.order.items.forEach((item, index) => {
      this.itemQuantities[index] = item.quantity;
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'preparing': 'Wird zubereitet',
      'ready': 'Bereit',
      'served': 'Serviert',
      'paid': 'Bezahlt',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  }

  getOrderTypeText(orderType?: string): string {
    const typeMap: { [key: string]: string } = {
      'dine_in': 'Im Restaurant',
      'delivery': 'Lieferung',
      'pickup': 'Abholung'
    };
    return typeMap[orderType || ''] || '';
  }

  updateItemQuantity(index: number, newQuantity: number) {
    if (newQuantity < 0) return;
    this.itemQuantities[index] = newQuantity;
  }

  removeItem(index: number) {
    if (this.order) {
      this.order.items.splice(index, 1);
      this.initializeQuantities();
    }
  }

  getAddQuantity(menuItemId: string): number {
    return this.addQuantities[menuItemId] || 0;
  }

  increaseAddQuantity(menuItem: any) {
    this.addQuantities[menuItem.id] = (this.addQuantities[menuItem.id] || 0) + 1;
  }

  decreaseAddQuantity(menuItem: any) {
    const current = this.addQuantities[menuItem.id] || 0;
    if (current > 0) {
      this.addQuantities[menuItem.id] = current - 1;
    }
  }

  addMenuItem(menuItem: any) {
    const quantity = this.getAddQuantity(menuItem.id);
    if (quantity === 0 || !this.order) return;

    // Calculate final price including variants
    let finalPrice = menuItem.price;
    let variantDescription = '';
    
    const variants = this.menuItemVariants[menuItem.id] || [];
    for (const variantGroup of variants) {
      const selectedOptions = this.selectedVariants[menuItem.id][variantGroup.id] || [];
      for (const optionId of selectedOptions) {
        const option = variantGroup.options.find(opt => opt.id === optionId);
        if (option) {
          finalPrice += option.price_modifier_cents / 100; // Convert cents to euros
          variantDescription += `, ${option.name}`;
        }
      }
    }

    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      menu_item_id: menuItem.id,
      name: menuItem.name + (variantDescription ? variantDescription : ''),
      quantity: quantity,
      unit_price: finalPrice,
      total_price: finalPrice * quantity
    };

    this.order.items.push(newItem);
    this.addQuantities[menuItem.id] = 0;
    this.initializeQuantities();
    
    // Reset variant selections for this menu item
    if (this.selectedVariants[menuItem.id]) {
      Object.keys(this.selectedVariants[menuItem.id]).forEach(variantGroupId => {
        this.selectedVariants[menuItem.id][variantGroupId] = [];
      });
    }
    
    console.log('Added menu item:', newItem);
    console.log('Order items now:', this.order.items);
  }

  hasChanges(): boolean {
    if (!this.order) return false;

    // Check for quantity changes
    for (let i = 0; i < this.order.items.length; i++) {
      if (this.itemQuantities[i] !== this.order.items[i].quantity) {
        return true;
      }
    }

    // Check for new items (items with temp IDs)
    const hasNewItems = this.order.items.some(item => item.id.startsWith('temp-'));
    if (hasNewItems) {
      return true;
    }

    return false;
  }

  async saveChanges() {
    if (!this.order || this.isSaving) return;

    this.isSaving = true;
    this.loadingService.start('edit-order');

    try {
      // Update quantities
      const quantityUpdates: Array<{ item_id: string; quantity: number }> = [];
      const itemsToRemove: string[] = [];
      const newItemsToAdd: Array<{ menu_item_id: string; quantity: number; unit_price: number }> = [];

      for (let i = 0; i < this.order.items.length; i++) {
        const item = this.order.items[i];
        const currentQuantity = item.quantity;
        const newQuantity = this.itemQuantities[i];

        if (item.id.startsWith('temp-')) {
          // This is a new item
          newItemsToAdd.push({
            menu_item_id: item.menu_item_id,
            quantity: newQuantity,
            unit_price: item.unit_price
          });
        } else {
          // This is an existing item
          if (newQuantity === 0) {
            itemsToRemove.push(item.id);
          } else if (newQuantity !== currentQuantity) {
            quantityUpdates.push({
              item_id: item.id,
              quantity: newQuantity
            });
          }
        }
      }

      // Add new items
      if (newItemsToAdd.length > 0) {
        await this.ordersService.addItemsToOrder(this.order.id, newItemsToAdd).toPromise();
      }

      // Remove items
      if (itemsToRemove.length > 0) {
        await this.ordersService.removeItemsFromOrder(this.order.id, itemsToRemove).toPromise();
      }

      // Update quantities
      if (quantityUpdates.length > 0) {
        await this.ordersService.updateItemQuantities(this.order.id, quantityUpdates).toPromise();
      }

      this.toastService.success('Erfolg', 'Bestellung wurde erfolgreich bearbeitet');
      this.orderUpdated.emit(this.order);
      this.closeModal();

    } catch (error) {
      console.error('Error saving order changes:', error);
      this.toastService.error('Fehler', 'Bestellung konnte nicht bearbeitet werden');
    } finally {
      this.isSaving = false;
      this.loadingService.stop('edit-order');
    }
  }

  closeModal() {
    this.closed.emit();
  }

  // Variant helper methods
  getVariantsForMenuItem(menuItemId: string): VariantGroup[] {
    return this.menuItemVariants[menuItemId] || [];
  }

  hasVariants(menuItemId: string): boolean {
    const variants = this.getVariantsForMenuItem(menuItemId);
    return variants.length > 0;
  }

  toggleVariantOption(menuItemId: string, variantGroupId: string, optionId: string) {
    if (!this.selectedVariants[menuItemId]) {
      this.selectedVariants[menuItemId] = {};
    }
    if (!this.selectedVariants[menuItemId][variantGroupId]) {
      this.selectedVariants[menuItemId][variantGroupId] = [];
    }

    const selectedOptions = this.selectedVariants[menuItemId][variantGroupId];
    const variantGroup = this.getVariantsForMenuItem(menuItemId).find(vg => vg.id === variantGroupId);
    
    if (!variantGroup) return;

    const optionIndex = selectedOptions.indexOf(optionId);
    
    if (optionIndex > -1) {
      // Remove option
      selectedOptions.splice(optionIndex, 1);
    } else {
      // Add option (check max selections)
      if (variantGroup.max_selections === 1) {
        // Radio button behavior - replace selection
        selectedOptions.length = 0;
        selectedOptions.push(optionId);
      } else {
        // Checkbox behavior - add if under limit
        if (selectedOptions.length < variantGroup.max_selections) {
          selectedOptions.push(optionId);
        }
      }
    }
  }

  isVariantOptionSelected(menuItemId: string, variantGroupId: string, optionId: string): boolean {
    const selectedOptions = this.selectedVariants[menuItemId]?.[variantGroupId] || [];
    return selectedOptions.includes(optionId);
  }

  canSelectVariantOption(menuItemId: string, variantGroupId: string): boolean {
    const variantGroup = this.getVariantsForMenuItem(menuItemId).find(vg => vg.id === variantGroupId);
    if (!variantGroup) return false;

    const selectedOptions = this.selectedVariants[menuItemId]?.[variantGroupId] || [];
    return selectedOptions.length < variantGroup.max_selections;
  }

  getVariantValidationError(menuItemId: string, variantGroupId: string): string | null {
    const variantGroup = this.getVariantsForMenuItem(menuItemId).find(vg => vg.id === variantGroupId);
    if (!variantGroup) return null;

    const selectedOptions = this.selectedVariants[menuItemId]?.[variantGroupId] || [];
    
    if (variantGroup.is_required && selectedOptions.length === 0) {
      return `${variantGroup.name} ist erforderlich`;
    }
    
    if (selectedOptions.length < variantGroup.min_selections) {
      return `Mindestens ${variantGroup.min_selections} Auswahl(en) erforderlich`;
    }
    
    return null;
  }

  canAddMenuItem(menuItemId: string): boolean {
    const quantity = this.getAddQuantity(menuItemId);
    if (quantity === 0) return false;

    const variants = this.getVariantsForMenuItem(menuItemId);
    for (const variantGroup of variants) {
      const error = this.getVariantValidationError(menuItemId, variantGroup.id);
      if (error) return false;
    }

    return true;
  }

  onVariantChange(menuItemId: string, variantGroupId: string, event: any) {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
    
    if (!this.selectedVariants[menuItemId]) {
      this.selectedVariants[menuItemId] = {};
    }
    this.selectedVariants[menuItemId][variantGroupId] = selectedOptions;
  }
}
