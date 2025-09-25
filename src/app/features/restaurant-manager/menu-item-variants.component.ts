import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantsService } from '../../core/services/restaurants.service';

interface VariantGroup {
  id: string;
  menu_item_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  position: number;
  options: VariantOption[];
}

interface VariantOption {
  id: string;
  variant_group_id: string;
  name: string;
  price_modifier_cents: number;
  is_available: boolean;
  position: number;
}

@Component({
  selector: 'app-menu-item-variants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="variants-container">
      <div class="variants-header">
        <h3>Varianten verwalten</h3>
        <button class="btn-primary" (click)="prepareNewGroup(); showAddGroupModal = true">
          <i class="fa-solid fa-plus"></i>
          Neue Varianten-Gruppe
        </button>
      </div>

      <!-- Existing Groups -->
      <div class="variants-list">
        <div *ngFor="let group of variantGroups; trackBy: trackByGroupId" class="variant-group-card">
          <div class="group-header">
            <div class="group-info">
              <h4>{{ group.name }}</h4>
              <div class="group-meta">
                <span class="badge" [class.required]="group.is_required" [class.optional]="!group.is_required">
                  {{ group.is_required ? 'Pflicht' : 'Optional' }}
                </span>
                <span class="selection-info">
                  Min: {{ group.min_selections }}, Max: {{ group.max_selections }}
                </span>
              </div>
            </div>
            <div class="group-actions">
              <button class="btn-sm" (click)="editGroup(group)" title="Bearbeiten">
                <i class="fa-solid fa-edit"></i>
              </button>
              <button class="btn-sm" (click)="deleteGroup(group)" title="Löschen">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="group-options">
            <div class="options-header">
              <h5>Optionen</h5>
              <button class="btn-sm primary" (click)="prepareNewOption(group); showAddOptionModal = true">
                <i class="fa-solid fa-plus"></i>
                Neue Option
              </button>
            </div>

            <div class="options-list">
              <div *ngFor="let option of group.options; trackBy: trackByOptionId" class="option-item">
                <div class="option-info">
                  <span class="option-name">{{ option.name }}</span>
                  <span class="option-price" [class.free]="option.price_modifier_cents === 0">
                    {{ option.price_modifier_cents === 0 ? 'kostenlos' : '+' + (option.price_modifier_cents / 100).toFixed(2) + '€' }}
                  </span>
                  <span class="option-status" [class.available]="option.is_available">
                    {{ option.is_available ? 'Verfügbar' : 'Nicht verfügbar' }}
                  </span>
                </div>
                <div class="option-actions">
                  <button class="btn-sm" (click)="editOption(option)" title="Bearbeiten">
                    <i class="fa-solid fa-edit"></i>
                  </button>
                  <button class="btn-sm danger" (click)="deleteOption(option)" title="Löschen">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              <div *ngIf="group.options.length === 0" class="empty-options">
                <i class="fa-solid fa-list"></i>
                <p>Keine Optionen vorhanden</p>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="variantGroups.length === 0" class="empty-groups">
          <i class="fa-solid fa-layer-group"></i>
          <p>Keine Varianten-Gruppen vorhanden</p>
          <p class="hint">Fügen Sie Varianten-Gruppen hinzu, um verschiedene Optionen für dieses Gericht anzubieten.</p>
        </div>
      </div>

      <!-- Add/Edit Group Modal -->
      <div *ngIf="showAddGroupModal || showEditGroupModal" class="modal-overlay" (click)="closeGroupModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ showEditGroupModal ? 'Varianten-Gruppe bearbeiten' : 'Neue Varianten-Gruppe' }}</h3>
            <button class="close-btn" (click)="closeGroupModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form (ngSubmit)="saveGroup()" #groupForm="ngForm">
            <div class="form-group">
              <label for="groupName">Name der Gruppe *</label>
              <input
                type="text"
                id="groupName"
                [(ngModel)]="groupFormData.name"
                name="name"
                required
                placeholder="z.B. Größe, Extras"
              >
            </div>

            <div class="form-group">
              <label for="isRequired">Typ</label>
              <select id="isRequired" [(ngModel)]="groupFormData.is_required" name="is_required">
                <option [value]="false">Optional</option>
                <option [value]="true">Pflicht</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="minSelections">Min. Auswahl</label>
                <input
                  type="number"
                  id="minSelections"
                  [(ngModel)]="groupFormData.min_selections"
                  name="min_selections"
                  min="0"
                  max="10"
                >
              </div>
              <div class="form-group">
                <label for="maxSelections">Max. Auswahl</label>
                <input
                  type="number"
                  id="maxSelections"
                  [(ngModel)]="groupFormData.max_selections"
                  name="max_selections"
                  min="1"
                  max="10"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="position">Position</label>
              <input
                type="number"
                id="position"
                [(ngModel)]="groupFormData.position"
                name="position"
                min="0"
                max="100"
              >
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeGroupModal()">Abbrechen</button>
              <button type="submit" class="btn-primary" [disabled]="!groupForm.valid">
                {{ showEditGroupModal ? 'Speichern' : 'Erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add/Edit Option Modal -->
      <div *ngIf="showAddOptionModal || showEditOptionModal" class="modal-overlay" (click)="closeOptionModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ showEditOptionModal ? 'Option bearbeiten' : 'Neue Option' }}</h3>
            <button class="close-btn" (click)="closeOptionModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form (ngSubmit)="saveOption()" #optionForm="ngForm">
            <div class="form-group">
              <label for="optionName">Name der Option *</label>
              <input
                type="text"
                id="optionName"
                [(ngModel)]="optionFormData.name"
                name="name"
                required
                placeholder="z.B. 26 cm, Extra Käse"
              >
            </div>

            <div class="form-group">
              <label for="priceModifier">Preis-Modifikator (€)</label>
              <input
                type="number"
                id="priceModifier"
                [(ngModel)]="optionFormData.price_modifier_cents"
                name="price_modifier_cents"
                step="0.01"
                placeholder="z.B. 4.00 für +4.00€, 0 für kostenlos"
              >
              <small class="form-hint">
                Preis in Euro (4.00 = +4.00€, -0.50 = -0.50€)
              </small>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="optionFormData.is_available"
                  name="is_available"
                >
                Verfügbar
              </label>
            </div>

            <div class="form-group">
              <label for="optionPosition">Position</label>
              <input
                type="number"
                id="optionPosition"
                [(ngModel)]="optionFormData.position"
                name="position"
                min="0"
                max="100"
              >
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeOptionModal()">Abbrechen</button>
              <button type="submit" class="btn-primary" [disabled]="!optionForm.valid">
                {{ showEditOptionModal ? 'Speichern' : 'Erstellen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .variants-container {
      margin-top: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .variants-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .variants-header h3 {
      margin: 0;
      color: #333;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-sm {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 0.25rem;
    }

    .btn-sm:hover {
      background: #e9ecef;
    }

    .btn-sm.danger {
      color: #dc3545;
      border-color: #dc3545;
    }

    .btn-sm.danger:hover {
      background: #f8d7da;
    }

    .btn-sm.primary {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .btn-sm.primary:hover {
      background: #0056b3;
    }

    .variant-group-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .group-header {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .group-info h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .group-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .badge.required {
      background: #dc3545;
      color: white;
    }

    .badge.optional {
      background: #28a745;
      color: white;
    }

    .selection-info {
      font-size: 0.9rem;
      color: #666;
    }

    .group-options {
      padding: 1rem;
    }

    .options-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .options-header h5 {
      margin: 0;
      color: #333;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .option-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .option-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .option-name {
      font-weight: 500;
      color: #333;
    }

    .option-price {
      font-weight: 500;
      color: #28a745;
    }

    .option-price.free {
      color: #17a2b8;
    }

    .option-status {
      font-size: 0.9rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .option-status.available {
      background: #d4edda;
      color: #155724;
    }

    .option-status:not(.available) {
      background: #f8d7da;
      color: #721c24;
    }

    .empty-groups, .empty-options {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .empty-groups i, .empty-options i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-groups .hint {
      font-size: 0.9rem;
      color: #999;
      margin-top: 0.5rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .close-btn:hover {
      color: #333;
    }

    form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-row .form-group {
      flex: 1;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 1rem;
    }

    input[type="text"]:focus,
    input[type="number"]:focus,
    select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.9rem;
      color: #666;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        margin: 1rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .modal-actions {
        flex-direction: column;
      }

      .modal-actions button {
        width: 100%;
      }
    }
  `]
})
export class MenuItemVariantsComponent implements OnInit {
  @Input() menuItemId!: string;
  @Input() restaurantId!: string;

  @Output() variantsChanged = new EventEmitter<void>();

  private restaurantsService = inject(RestaurantsService);

  variantGroups: VariantGroup[] = [];

  // Modal states
  showAddGroupModal = false;
  showEditGroupModal = false;
  showAddOptionModal = false;
  showEditOptionModal = false;

  // Form data
  groupFormData: Partial<VariantGroup> & { name: string } = {
    name: '',
    is_required: false,
    min_selections: 0,
    max_selections: 1,
    position: 0
  };

  optionFormData: Partial<VariantOption> & { name: string } = {
    name: '',
    price_modifier_cents: 0,
    is_available: true,
    position: 0
  };

  // Selected items for editing
  selectedGroup: VariantGroup | null = null;
  selectedOption: VariantOption | null = null;

  ngOnInit() {
    this.loadVariants();
  }

  async loadVariants() {
    try {
      const response = await firstValueFrom(this.restaurantsService.getVariantsForMenuItem(this.restaurantId, this.menuItemId));
      this.variantGroups = response.variant_groups || [];
    } catch (error) {
      console.error('Error loading variants:', error);
      // Handle error appropriately
    }
  }

  // Group CRUD
  async saveGroup() {
    try {
      console.log('Saving group with data:', this.groupFormData);
      console.log('Edit mode:', this.showEditGroupModal);
      console.log('Selected group:', this.selectedGroup);
      
      // Check if form data is valid
      if (!this.groupFormData.name || this.groupFormData.name.trim() === '') {
        alert('Bitte geben Sie einen Namen für die Varianten-Gruppe ein.');
        return;
      }
      
      if (this.showEditGroupModal && this.selectedGroup) {
        console.log('Updating existing group...');
        await firstValueFrom(this.restaurantsService.updateVariantGroup(
          this.restaurantId,
          this.menuItemId,
          this.selectedGroup.id,
          this.groupFormData
        ));
        console.log('Group updated successfully');
      } else {
        console.log('Creating new group...');
        await firstValueFrom(this.restaurantsService.createVariantGroup(
          this.restaurantId,
          this.menuItemId,
          this.groupFormData
        ));
        console.log('Group created successfully');
      }

      this.closeGroupModal();
      await this.loadVariants();
      this.variantsChanged.emit();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Fehler beim Speichern der Varianten-Gruppe: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  editGroup(group: VariantGroup) {
    this.selectedGroup = group;
    this.groupFormData = { ...group };
    this.showEditGroupModal = true;
  }

  async deleteGroup(group: VariantGroup) {
    if (confirm(`Möchten Sie die Varianten-Gruppe "${group.name}" wirklich löschen?`)) {
      try {
        await firstValueFrom(this.restaurantsService.deleteVariantGroup(
          this.restaurantId,
          this.menuItemId,
          group.id
        ));
        await this.loadVariants();
        this.variantsChanged.emit();
      } catch (error) {
        console.error('Error deleting group:', error);
        // Handle error appropriately
      }
    }
  }

  // Option CRUD
  async saveOption() {
    // If no selectedGroup, try to find it from the current context
    let targetGroup = this.selectedGroup;
    
    if (!targetGroup && this.showAddOptionModal) {
      // If we're adding a new option but no group is selected, this is an error
      console.error('No selected group for saving option');
      alert('Fehler: Keine Varianten-Gruppe ausgewählt. Bitte wählen Sie zuerst eine Gruppe aus.');
      return;
    }

    if (!targetGroup && this.showEditOptionModal && this.selectedOption) {
      // If we're editing an option, find the group it belongs to
      targetGroup = this.variantGroups.find(group => 
        group.options.some(option => option.id === this.selectedOption!.id)
      ) || null;
    }

    if (!targetGroup) {
      console.error('Could not determine target group for saving option');
      alert('Fehler: Varianten-Gruppe konnte nicht ermittelt werden.');
      return;
    }

    try {
      // Check if form data is valid
      if (!this.optionFormData.name || this.optionFormData.name.trim() === '') {
        alert('Bitte geben Sie einen Namen für die Option ein.');
        return;
      }

      const data = {
        ...this.optionFormData,
        price_modifier_cents: Math.round(Number(this.optionFormData.price_modifier_cents || 0) * 100),
        variant_group_id: targetGroup.id
      };

      console.log('Saving option with data:', data);
      console.log('Edit mode:', this.showEditOptionModal);
      console.log('Selected option:', this.selectedOption);
      console.log('Target group:', targetGroup);

      if (this.showEditOptionModal && this.selectedOption) {
        console.log('Updating existing option...');
        await firstValueFrom(this.restaurantsService.updateVariantOption(
          this.restaurantId,
          this.menuItemId,
          targetGroup.id,
          this.selectedOption.id,
          data
        ));
        console.log('Option updated successfully');
      } else {
        console.log('Creating new option...');
        await firstValueFrom(this.restaurantsService.createVariantOption(
          this.restaurantId,
          this.menuItemId,
          targetGroup.id,
          data
        ));
        console.log('Option created successfully');
      }

      this.closeOptionModal();
      await this.loadVariants();
      this.variantsChanged.emit();
    } catch (error) {
      console.error('Error saving option:', error);
      alert('Fehler beim Speichern der Option: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }

  editOption(option: VariantOption) {
    this.selectedOption = option;
    this.optionFormData = {
      ...option,
      price_modifier_cents: option.price_modifier_cents / 100 // Convert from cents to euros for display
    };
    this.showEditOptionModal = true;
  }

  async deleteOption(option: VariantOption) {
    if (confirm(`Möchten Sie die Option "${option.name}" wirklich löschen?`)) {
      try {
        await firstValueFrom(this.restaurantsService.deleteVariantOption(
          this.restaurantId,
          this.menuItemId,
          option.variant_group_id,
          option.id
        ));
        await this.loadVariants();
        this.variantsChanged.emit();
      } catch (error) {
        console.error('Error deleting option:', error);
        // Handle error appropriately
      }
    }
  }

  // Modal management
  closeGroupModal() {
    this.showAddGroupModal = false;
    this.showEditGroupModal = false;
    this.selectedGroup = null;
    // Reset form data to initial state
    this.groupFormData = {
      name: '',
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      position: 0
    };
  }

  closeOptionModal() {
    this.showAddOptionModal = false;
    this.showEditOptionModal = false;
    this.selectedOption = null;
    // Reset form data to initial state
    this.optionFormData = {
      name: '',
      price_modifier_cents: 0,
      is_available: true,
      position: 0
    };
  }

  // TrackBy functions for performance
  trackByGroupId(index: number, group: VariantGroup): string {
    return group.id;
  }

  trackByOptionId(index: number, option: VariantOption): string {
    return option.id;
  }

  // Automatic position management
  getNextGroupPosition(): number {
    if (this.variantGroups.length === 0) return 1;
    const maxPosition = Math.max(...this.variantGroups.map(g => g.position || 0));
    return maxPosition + 1;
  }

  getNextOptionPosition(group: VariantGroup): number {
    if (!group.options || group.options.length === 0) return 1;
    const maxPosition = Math.max(...group.options.map(o => o.position || 0));
    return maxPosition + 1;
  }

  // Auto-assign positions when creating new items
  prepareNewGroup(): void {
    this.groupFormData = {
      name: '',
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      position: this.getNextGroupPosition()
    };
  }

  prepareNewOption(group: VariantGroup): void {
    this.selectedGroup = group;
    this.optionFormData = {
      name: '',
      price_modifier_cents: 0,
      is_available: true,
      position: this.getNextOptionPosition(group)
    };
  }
}
