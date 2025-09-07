import { Component, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

interface MenuItem {
  id: string;
  name: string;
  price_cents: number;
  variants?: MenuItemVariant[];
}

@Component({
  selector: 'app-menu-item-variants-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ menuItem?.name }}</h2>
          <button class="close-btn" (click)="closeModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="base-price">
            <span>Grundpreis: {{ (menuItem?.price_cents || 0) / 100 | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
          </div>

          <div class="variants-section">
            <div *ngFor="let variant of menuItem?.variants" class="variant-group">
              <h3 class="variant-name">
                {{ variant.name }}
                <span class="required-indicator" *ngIf="variant.is_required">*</span>
              </h3>

              <div class="variant-options">
                <div *ngFor="let option of variant.options" class="option-item">
                  <label class="option-label" [class.disabled]="!option.is_available">
                    <input
                      [type]="variant.max_selections === 1 ? 'radio' : 'checkbox'"
                      [name]="variant.id"
                      [checked]="isOptionSelected(variant.id, option.id)"
                      (change)="toggleOption(variant, option)"
                      [disabled]="!option.is_available || !canSelectOption(variant)"
                      class="option-checkbox"
                    >
                    <span class="option-name">{{ option.name }}</span>
                    <span class="option-price" *ngIf="option.price_modifier_cents !== 0">
                      ({{ option.price_modifier_cents > 0 ? '+' : '' }}{{ option.price_modifier_cents / 100 | currency:'EUR':'symbol':'1.2-2':'de' }})
                    </span>
                    <span class="not-available" *ngIf="!option.is_available">Nicht verfügbar</span>
                  </label>
                </div>
              </div>

              <div class="variant-info" *ngIf="variant.min_selections || variant.max_selections">
                <small>
                  <span *ngIf="variant.min_selections">Min. {{ variant.min_selections }}</span>
                  <span *ngIf="variant.min_selections && variant.max_selections"> - </span>
                  <span *ngIf="variant.max_selections">Max. {{ variant.max_selections }}</span>
                  Auswahlen
                  <span *ngIf="variant.is_required"> erforderlich</span>
                </small>
              </div>
            </div>
          </div>

          <div class="total-price">
            <span>Gesamtpreis: {{ calculateTotalPrice() | currency:'EUR':'symbol':'1.2-2':'de' }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Abbrechen</button>
          <button class="btn btn-primary" (click)="confirmSelection()" [disabled]="!isSelectionValid()">
            <i class="fa-solid fa-plus"></i>
            Zum Warenkorb hinzufügen
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
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
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
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
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .base-price {
      text-align: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-weight: 600;
      color: #374151;
    }

    .variants-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .variant-group {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
    }

    .variant-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .required-indicator {
      color: #ef4444;
      font-size: 1.25rem;
    }

    .variant-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .option-label:hover:not(.disabled) {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .option-label.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option-checkbox {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: #3b82f6;
    }

    .option-name {
      flex: 1;
      font-weight: 500;
      color: #374151;
    }

    .option-price {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 600;
    }

    .not-available {
      font-size: 0.75rem;
      color: #ef4444;
      font-style: italic;
    }

    .variant-info {
      margin-top: 0.75rem;
      color: #6b7280;
    }

    .total-price {
      text-align: center;
      padding: 1rem;
      background: #1f2937;
      color: white;
      border-radius: 8px;
      margin-top: 1.5rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .modal-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class MenuItemVariantsModalComponent implements OnChanges {
  @Input() menuItem: MenuItem | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{
    selectedOptionIds: string[];
    selectedOptions: Array<{id: string, name: string, price_modifier_cents: number}>;
  }>();

  selectedOptions = new Map<string, Set<string>>(); // variantId -> Set of optionIds

  ngOnChanges(changes: SimpleChanges): void {
    // Reset selections when menuItem changes
    if (changes['menuItem'] && changes['menuItem'].currentValue) {
      this.selectedOptions.clear();
    }
  }

  isOptionSelected(variantId: string, optionId: string): boolean {
    return this.selectedOptions.get(variantId)?.has(optionId) || false;
  }

  toggleOption(variant: MenuItemVariant, option: MenuItemVariantOption): void {
    if (!option.is_available) return;

    const variantSelections = this.selectedOptions.get(variant.id) || new Set<string>();

    // For radio buttons (single selection), always clear and select the new option
    if (variant.max_selections === 1) {
      variantSelections.clear();
      variantSelections.add(option.id);
    } else {
      // For checkboxes (multi selection)
      if (variantSelections.has(option.id)) {
        // Option is already selected - deselect it
        variantSelections.delete(option.id);
      } else {
        // Check if we've reached max selections
        if (variant.max_selections && variantSelections.size >= variant.max_selections) {
          return; // Don't allow more selections
        }
        variantSelections.add(option.id);
      }
    }

    this.selectedOptions.set(variant.id, variantSelections);
  }

  canSelectOption(variant: MenuItemVariant): boolean {
    // For single selection (max_selections === 1), always allow selection
    // because we clear previous selections when a new one is chosen
    if (variant.max_selections === 1) {
      return true;
    }

    // For multi-selection, check if we've reached max selections
    const currentSelections = this.selectedOptions.get(variant.id)?.size || 0;
    return !variant.max_selections || currentSelections < variant.max_selections;
  }

  calculateTotalPrice(): number {
    if (!this.menuItem) return 0;

    let total = this.menuItem.price_cents / 100;

    for (const variant of this.menuItem.variants || []) {
      const selectedOptionIds = this.selectedOptions.get(variant.id) || new Set<string>();
      for (const option of variant.options) {
        if (selectedOptionIds.has(option.id)) {
          total += option.price_modifier_cents / 100;
        }
      }
    }

    return total;
  }

  isSelectionValid(): boolean {
    if (!this.menuItem?.variants) return true;

    for (const variant of this.menuItem.variants) {
      const selectedCount = this.selectedOptions.get(variant.id)?.size || 0;

      if (variant.is_required) {
        if (variant.min_selections && selectedCount < variant.min_selections) {
          return false;
        }
        if (selectedCount === 0) {
          return false;
        }
      }

      if (variant.min_selections && selectedCount < variant.min_selections) {
        return false;
      }

      if (variant.max_selections && selectedCount > variant.max_selections) {
        return false;
      }
    }

    return true;
  }

  confirmSelection(): void {
    if (!this.isSelectionValid()) return;

    const selectedOptionIds: string[] = [];
    const selectedOptions: Array<{id: string, name: string, price_modifier_cents: number}> = [];

    for (const variant of this.menuItem?.variants || []) {
      const variantSelections = this.selectedOptions.get(variant.id) || new Set<string>();
      for (const option of variant.options) {
        if (variantSelections.has(option.id)) {
          selectedOptionIds.push(option.id);
          selectedOptions.push({
            id: option.id,
            name: option.name,
            price_modifier_cents: option.price_modifier_cents
          });
        }
      }
    }

    this.confirm.emit({
      selectedOptionIds,
      selectedOptions
    });

    this.closeModal();
  }

  closeModal(): void {
    this.selectedOptions.clear();
    this.close.emit();
  }
}
