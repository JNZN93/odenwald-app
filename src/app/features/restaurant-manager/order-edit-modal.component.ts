import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService, Order, OrderItem } from '../../core/services/orders.service';
import { MenuItemsService } from '../../core/services/menu-items.service';
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
          <h2>Bestellung bearbeiten - #{{ order?.id }}</h2>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <!-- Order Info -->
        <div class="order-info" *ngIf="order">
          <div class="order-status">
            <span class="status-badge" [ngClass]="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
            <span class="order-type">{{ getOrderTypeText(order.order_type) }}</span>
          </div>
          <div class="order-meta">
            <span *ngIf="order.table_number">Tisch: {{ order.table_number }}</span>
            <span *ngIf="order.party_size">Personen: {{ order.party_size }}</span>
            <span>{{ order.total_price | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        <!-- Current Items -->
        <div class="current-items" *ngIf="order">
          <h3>Aktuelle Bestellung</h3>
          <div class="items-list">
            <div *ngFor="let item of order.items; let i = index" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">{{ item.unit_price | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
              <div class="quantity-controls">
                <button (click)="updateItemQuantity(i, item.quantity - 1)" class="qty-btn" [disabled]="item.quantity <= 1">-</button>
                <span class="quantity">{{ item.quantity }}</span>
                <button (click)="updateItemQuantity(i, item.quantity + 1)" class="qty-btn">+</button>
              </div>
              <div class="item-total">{{ (item.quantity * item.unit_price) | currency:'EUR':'symbol':'1.2-2' }}</div>
              <button (click)="removeItem(i)" class="remove-btn">❌</button>
            </div>
          </div>
        </div>

        <!-- Add Items Section -->
        <div class="add-items-section">
          <h3>Items hinzufügen</h3>
          <div class="menu-items" *ngIf="availableMenuItems.length > 0">
            <div *ngFor="let menuItem of availableMenuItems" class="menu-item-card">
              <div class="menu-item-info">
                <span class="menu-item-name">{{ menuItem.name }}</span>
                <span class="menu-item-price">{{ menuItem.price | currency:'EUR':'symbol':'1.2-2' }}</span>
              </div>
              <div class="add-controls">
                <div class="quantity-input">
                  <button (click)="decreaseAddQuantity(menuItem)" class="qty-btn">-</button>
                  <span class="quantity">{{ getAddQuantity(menuItem.id) }}</span>
                  <button (click)="increaseAddQuantity(menuItem)" class="qty-btn">+</button>
                </div>
                <button 
                  (click)="addMenuItem(menuItem)" 
                  class="add-btn"
                  [disabled]="getAddQuantity(menuItem.id) === 0"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="cancel-btn" (click)="closeModal()">Abbrechen</button>
          <button class="save-btn" (click)="saveChanges()" [disabled]="!hasChanges() || isSaving">
            {{ isSaving ? 'Speichern...' : 'Änderungen speichern' }}
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
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 5px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .order-info {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .order-status {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge.preparing { background: #fde68a; color: #b45309; }
    .status-badge.ready { background: #dcfce7; color: #166534; }

    .order-type {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .order-meta {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .current-items, .add-items-section {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .current-items h3, .add-items-section h3 {
      margin: 0 0 16px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .item-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-name {
      font-weight: 500;
      color: #111827;
    }

    .item-price {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 600;
    }

    .qty-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .qty-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity {
      min-width: 24px;
      text-align: center;
      font-weight: 500;
    }

    .item-total {
      font-weight: 600;
      color: #111827;
      min-width: 80px;
      text-align: right;
    }

    .remove-btn {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
    }

    .menu-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .menu-item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .menu-item-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .menu-item-name {
      font-weight: 500;
      color: #111827;
    }

    .menu-item-price {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .add-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .quantity-input {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .add-btn {
      padding: 8px 16px;
      background: #059669;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .add-btn:hover:not(:disabled) {
      background: #047857;
    }

    .add-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
    }

    .cancel-btn {
      padding: 12px 24px;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn:hover {
      background: #f9fafb;
    }

    .save-btn {
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .save-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .save-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class OrderEditModalComponent implements OnInit {
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

  ngOnInit() {
    if (this.order) {
      this.loadMenuItems();
      this.initializeQuantities();
    }
  }

  private async loadMenuItems() {
    if (!this.order) return;
    
    try {
      this.availableMenuItems = await this.menuItemsService.getMenuItemsByRestaurant(this.order.restaurant_id).toPromise() || [];
    } catch (error) {
      console.error('Error loading menu items:', error);
      this.toastService.error('Fehler', 'Menü konnte nicht geladen werden');
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

    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      quantity: quantity,
      unit_price: menuItem.price,
      total_price: menuItem.price * quantity
    };

    this.order.items.push(newItem);
    this.addQuantities[menuItem.id] = 0;
    this.initializeQuantities();
  }

  hasChanges(): boolean {
    if (!this.order) return false;

    // Check for quantity changes
    for (let i = 0; i < this.order.items.length; i++) {
      if (this.itemQuantities[i] !== this.order.items[i].quantity) {
        return true;
      }
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

      for (let i = 0; i < this.order.items.length; i++) {
        const currentQuantity = this.order.items[i].quantity;
        const newQuantity = this.itemQuantities[i];

        if (newQuantity === 0) {
          itemsToRemove.push(this.order.items[i].id);
        } else if (newQuantity !== currentQuantity) {
          quantityUpdates.push({
            item_id: this.order.items[i].id,
            quantity: newQuantity
          });
        }
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
}
