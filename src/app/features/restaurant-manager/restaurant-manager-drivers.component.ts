import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OrdersService, Order } from '../../core/services/orders.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { environment } from '../../../environments/environment';
import { Subscription, interval } from 'rxjs';

export interface Driver {
  id: string;
  user_id: string;
  tenant_id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicle_type: 'car' | 'motorcycle' | 'bicycle' | 'scooter';
  vehicle_info?: {
    make?: string;
    model?: string;
    color?: string;
    license_plate?: string;
  };
  license_plate?: string;
  is_active: boolean;
  current_status: 'available' | 'busy' | 'offline' | 'on_delivery';
  status: 'available' | 'busy' | 'offline' | 'on_break';
  current_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  joined_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}


@Component({
  selector: 'app-restaurant-manager-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="drivers-management-container">
      <!-- Header -->
      <div class="page-header">
        <h1><i class="fa-solid fa-truck"></i> Fahrer-Management</h1>
        <p>Verwalten Sie Ihre Fahrer und weisen Sie Aufträge zu</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="btn btn-primary" (click)="addDriver()">
          <i class="fa-solid fa-plus"></i>
          Neuen Fahrer hinzufügen
        </button>
        <button class="btn btn-success" (click)="refreshData()">
          <i class="fa-solid fa-refresh"></i>
          Aktualisieren
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="driverStats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>Gesamt Fahrer</h3>
            <div class="stat-value">{{ driverStats.total_drivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>Verfügbar</h3>
            <div class="stat-value">{{ driverStats.available_drivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-route"></i>
          </div>
          <div class="stat-content">
            <h3>Unterwegs</h3>
            <div class="stat-value">{{ driverStats.delivering_drivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>Durchschnittsbewertung</h3>
            <div class="stat-value">{{ driverStats.average_rating | number:'1.1-1' }}/5</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content-grid">
        <!-- Drivers List -->
        <div class="drivers-section">
          <h2>Meine Fahrer</h2>

          <div class="drivers-list" *ngIf="drivers.length > 0; else noDrivers">
            <div
              class="driver-card"
              *ngFor="let driver of drivers"
              [class]="getDriverStatusClass(driver)"
            >
              <div class="driver-header">
                <div class="driver-info">
                  <h4>{{ driver.name || 'Fahrer ' + driver.id }}</h4>
                  <div class="vehicle-badge" [class]="driver.vehicle_type">
                    <i class="fa-solid" [ngClass]="getVehicleIcon(driver.vehicle_type)"></i>
                    {{ getVehicleTypeLabel(driver.vehicle_type) }}
                  </div>
                </div>
                <div class="status-indicator">
                  <span class="status-dot" [class]="driver.current_status"></span>
                  <span class="status-text">{{ getStatusLabel(driver.current_status) }}</span>
                </div>
              </div>

              <div class="driver-details">
                <div class="detail-item">
                  <i class="fa-solid fa-star"></i>
                  <span>{{ driver.rating }}/5 Bewertung</span>
                </div>
                <div class="detail-item">
                  <i class="fa-solid fa-truck"></i>
                  <span>{{ driver.total_deliveries }} Lieferungen</span>
                </div>
                <div class="detail-item" *ngIf="driver.current_location">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>{{ driver.current_location.address }}</span>
                </div>
              </div>

              <div class="driver-actions">
                <button
                  class="btn btn-ghost btn-sm"
                  (click)="viewDriverDetails(driver)"
                  title="Details anzeigen"
                >
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  (click)="contactDriver(driver)"
                  title="Fahrer kontaktieren"
                >
                  <i class="fa-solid fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noDrivers>
            <div class="empty-state">
              <i class="fa-solid fa-truck"></i>
              <h3>Noch keine Fahrer</h3>
              <p>Fügen Sie Ihren ersten Fahrer hinzu, um mit Lieferungen zu beginnen.</p>
            </div>
          </ng-template>
        </div>

        <!-- Pending Orders -->
        <div class="orders-section">
          <h2>Ausstehende Aufträge</h2>

          <div class="orders-list" *ngIf="pendingOrders.length > 0; else noOrders">
            <div class="order-card" *ngFor="let order of pendingOrders">
              <div class="order-header">
                <h4>Bestellung #{{ order.id }}</h4>
                <div class="order-value">€{{ order.total_price | number:'1.2-2' }}</div>
              </div>

              <div class="order-details">
                <div class="detail-item">
                  <i class="fa-solid fa-user"></i>
                  <span>{{ order.customer_name || 'Kunde' }}</span>
                </div>
                <div class="detail-item">
                  <i class="fa-solid fa-map-marker-alt"></i>
                  <span>{{ order.delivery_address }}</span>
                </div>
              </div>

              <div class="order-actions">
                <button
                  class="btn btn-outline-primary"
                  (click)="openManualAssignment(order)"
                  [disabled]="isAssigning"
                >
                  <span *ngIf="!isAssigning">
                    <i class="fa-solid fa-hand-pointer"></i>
                    Manuell zuweisen
                  </span>
                  <span *ngIf="isAssigning">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Lade...
                  </span>
                </button>
                <div class="button-spacer"></div>
                <button
                  class="btn btn-ghost btn-sm"
                  (click)="assignBestDriver(order)"
                  [disabled]="isAssigning"
                  title="Automatische Zuweisung"
                >
                  <span *ngIf="!isAssigning">
                    <i class="fa-solid fa-magic"></i>
                    Auto-Zuweisung
                  </span>
                  <span *ngIf="isAssigning">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Zuweisen...
                  </span>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noOrders>
            <div class="empty-state">
              <i class="fa-solid fa-clipboard-list"></i>
              <h3>Keine ausstehenden Aufträge</h3>
              <p>Alle Bestellungen wurden bereits zugewiesen.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Assignment Modal -->
      <div class="modal" *ngIf="showAssignmentModal" (click)="closeAssignmentModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Fahrer zuweisen</h3>
            <button class="close-btn" (click)="closeAssignmentModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedOrder">
            <div class="order-summary">
              <h4>Bestellung #{{ selectedOrder.id }}</h4>
              <p><strong>Kunde:</strong> {{ selectedOrder.customer_name || 'Unbekannt' }}</p>
              <p><strong>Adresse:</strong> {{ selectedOrder.delivery_address }}</p>
              <p><strong>Gesamt:</strong> €{{ selectedOrder.total_price | number:'1.2-2' }}</p>
            </div>

            <div class="available-drivers">
              <h4>Verfügbare Fahrer</h4>
              <div class="driver-selection" *ngIf="availableDrivers.length > 0; else noDriversAvailable">
                <div
                  class="driver-option"
                  *ngFor="let driver of availableDrivers"
                  [class.selected]="selectedDriver?.id === driver.id"
                  (click)="selectDriver(driver)"
                >
                  <div class="driver-option-header">
                    <span class="driver-name">{{ driver.name || 'Fahrer ' + driver.id }}</span>
                    <div class="vehicle-badge" [class]="driver.vehicle_type">
                      <i class="fa-solid" [ngClass]="getVehicleIcon(driver.vehicle_type)"></i>
                      {{ getVehicleTypeLabel(driver.vehicle_type) }}
                    </div>
                  </div>
                  <div class="driver-option-details">
                    <span>Bewertung: {{ driver.rating }}/5</span>
                    <span>{{ driver.total_deliveries }} Lieferungen</span>
                  </div>
                </div>
              </div>
              <ng-template #noDriversAvailable>
                <div class="empty-state">
                  <i class="fa-solid fa-user-slash"></i>
                  <h4>Keine Fahrer verfügbar</h4>
                  <p>Alle Fahrer sind derzeit beschäftigt oder offline.</p>
                </div>
              </ng-template>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" (click)="closeAssignmentModal()">
                Abbrechen
              </button>
              <button
                class="btn btn-primary"
                (click)="confirmAssignment()"
                [disabled]="!selectedDriver || isConfirming"
              >
                <span *ngIf="!isConfirming">
                  <i class="fa-solid fa-check"></i>
                  Zuweisen
                </span>
                <span *ngIf="isConfirming">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Zuweisen...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Driver Modal -->
      <div class="modal" *ngIf="showAddDriverModal" (click)="closeAddDriverModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Neuen Fahrer hinzufügen</h3>
            <button class="close-btn" (click)="closeAddDriverModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <form (ngSubmit)="submitAddDriver()" #driverForm="ngForm">
              <div class="form-group">
                <label for="driverName">Name *</label>
                <input
                  type="text"
                  id="driverName"
                  name="name"
                  [(ngModel)]="newDriver.name"
                  required
                  class="form-input"
                  placeholder="Vollständiger Name"
                />
              </div>

              <div class="form-group">
                <label for="driverEmail">E-Mail *</label>
                <input
                  type="email"
                  id="driverEmail"
                  name="email"
                  [(ngModel)]="newDriver.email"
                  required
                  email
                  class="form-input"
                  placeholder="fahrer@beispiel.de"
                />
              </div>

              <div class="form-group">
                <label for="driverPhone">Telefon</label>
                <input
                  type="tel"
                  id="driverPhone"
                  name="phone"
                  [(ngModel)]="newDriver.phone"
                  class="form-input"
                  placeholder="+49 123 456789"
                />
              </div>

              <div class="form-group">
                <label for="driverPassword">Passwort *</label>
                <input
                  type="password"
                  id="driverPassword"
                  name="password"
                  [(ngModel)]="newDriver.password"
                  required
                  minlength="8"
                  class="form-input"
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>

              <div class="form-group">
                <label for="driverPasswordConfirm">Passwort bestätigen *</label>
                <input
                  type="password"
                  id="driverPasswordConfirm"
                  name="password_confirm"
                  [(ngModel)]="newDriver.password_confirm"
                  required
                  minlength="8"
                  class="form-input"
                  placeholder="Passwort wiederholen"
                />
              </div>

              <div class="form-group">
                <label for="vehicleType">Fahrzeugtyp *</label>
                <select
                  id="vehicleType"
                  name="vehicle_type"
                  [(ngModel)]="newDriver.vehicle_type"
                  required
                  class="form-select"
                >
                  <option value="car">Auto</option>
                  <option value="motorcycle">Motorrad</option>
                  <option value="bicycle">Fahrrad</option>
                  <option value="scooter">Roller</option>
                </select>
              </div>

              <div class="form-group">
                <label for="vehicleInfo">Fahrzeugdetails</label>
                <input
                  type="text"
                  id="vehicleInfo"
                  name="vehicle_info"
                  [(ngModel)]="newDriver.vehicle_info"
                  class="form-input"
                  placeholder="z.B. Marke, Modell, Farbe"
                />
              </div>

              <div class="form-group">
                <label for="licensePlate">Kennzeichen</label>
                <input
                  type="text"
                  id="licensePlate"
                  name="license_plate"
                  [(ngModel)]="newDriver.license_plate"
                  class="form-input"
                  placeholder="z.B. M-AB 123 CD"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost" (click)="closeAddDriverModal()">
                  Abbrechen
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="!driverForm.form.valid || !passwordsMatch() || isAddingDriver"
                >
                  <span *ngIf="!isAddingDriver">
                    <i class="fa-solid fa-plus"></i>
                    Fahrer hinzufügen
                  </span>
                  <span *ngIf="isAddingDriver">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Hinzufügen...
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drivers-management-container {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .page-header h1 {
      font-size: var(--text-3xl);
      color: var(--color-heading);
      margin-bottom: var(--space-2);
    }

    .page-header p {
      color: var(--color-muted);
      font-size: var(--text-lg);
    }

    .quick-actions {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      justify-content: center;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-sm);
    }

    .stat-icon {
      font-size: var(--text-2xl);
      color: var(--color-primary);
    }

    .stat-content h3 {
      margin: 0 0 var(--space-1) 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-heading);
    }

    /* Main Content Grid */
    .main-content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-8);
    }

    .drivers-section h2, .orders-section h2 {
      font-size: var(--text-xl);
      color: var(--color-heading);
      margin-bottom: var(--space-4);
    }

    /* Drivers List */
    .drivers-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .driver-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);
    }

    .driver-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .driver-card.available {
      border-left: 4px solid var(--color-success);
    }

    .driver-card.on_delivery {
      border-left: 4px solid var(--color-primary);
    }

    .driver-card.offline {
      border-left: 4px solid var(--color-muted);
      opacity: 0.7;
    }

    .driver-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .driver-info h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    .vehicle-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    .vehicle-badge.car { background: var(--color-primary-500); color: white; }
    .vehicle-badge.motorcycle { background: var(--color-warning); color: white; }
    .vehicle-badge.bicycle { background: var(--color-success); color: white; }
    .vehicle-badge.scooter { background: var(--color-info); color: white; }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.available { background: var(--color-success); }
    .status-dot.on_delivery { background: var(--color-primary); }
    .status-dot.offline { background: var(--color-muted); }
    .status-dot.busy { background: var(--color-warning); }

    .status-text {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .driver-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .driver-actions {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    .btn-sm {
      padding: var(--space-2);
      font-size: var(--text-sm);
    }

    /* Orders List */
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .order-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      box-shadow: var(--shadow-sm);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .order-header h4 {
      margin: 0;
      color: var(--color-heading);
    }

    .order-value {
      font-weight: 700;
      color: var(--color-success);
      font-size: var(--text-lg);
    }

    .order-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .order-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: var(--space-8) 0;
      color: var(--color-muted);
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      color: var(--color-border);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h3 {
      margin: 0;
      color: var(--color-heading);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      cursor: pointer;
      color: var(--color-muted);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .order-summary {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-md);
    }

    .order-summary h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .order-summary p {
      margin: var(--space-1) 0;
      color: var(--color-text);
    }

    .available-drivers h4 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
    }

    .driver-selection {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
    }

    .driver-option {
      padding: var(--space-3);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition);
    }

    .driver-option:hover {
      border-color: var(--color-primary);
    }

    .driver-option.selected {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
    }

    .driver-option-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .driver-name {
      font-weight: 600;
      color: var(--color-heading);
    }

    .driver-option-details {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .modal-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
    }

    /* Button spacing in order actions */
    .order-actions {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .button-spacer {
      display: none; /* Trenner komplett ausblenden */
    }

    /* Form Styles */
    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 500;
      color: var(--color-heading);
    }

    .form-input, .form-select {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      transition: border-color var(--transition);
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 10%, transparent);
    }

    .form-input:invalid {
      border-color: var(--color-error);
    }

    /* Buttons */
    .btn {
      padding: var(--space-3) var(--space-4);
      border: none;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      transition: all var(--transition);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--gradient-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary) 25%, transparent);
    }

    .btn-success {
      background: var(--color-success);
      color: white;
    }

    .btn-warning {
      background: var(--color-warning);
      color: white;
    }

    .btn-ghost {
      background: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--color-surface-2);
    }

    .btn-outline-primary {
      background: transparent;
      color: var(--color-primary-500);
      border: 1px solid var(--color-primary-500);
    }

    .btn-outline-primary:hover:not(:disabled) {
      background: var(--color-primary-500);
      color: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .main-content-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        flex-direction: column;
        align-items: center;
      }

      .driver-header {
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
      }

      .order-header {
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
      }

      .modal-content {
        width: 95%;
        margin: var(--space-4);
      }
    }
  `]
})
export class RestaurantManagerDriversComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private ordersService = inject(OrdersService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private subscriptions: Subscription[] = [];

  drivers: Driver[] = [];
  pendingOrders: Order[] = [];
  driverStats: any = null;

  // Modal state
  showAssignmentModal = false;
  selectedOrder: Order | null = null;
  selectedDriver: Driver | null = null;
  availableDrivers: Driver[] = [];

  // Add driver modal state
  showAddDriverModal = false;
  newDriver = {
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    vehicle_type: 'car' as 'car' | 'motorcycle' | 'bicycle' | 'scooter',
    vehicle_info: '',
    license_plate: ''
  };

  // Loading states
  isLoading = false;
  isAssigning = false;
  isConfirming = false;
  isAddingDriver = false;

  ngOnInit() {
    this.loadDrivers();
    this.loadPendingOrders();
    this.loadDriverStats();

    // Auto-refresh every 30 seconds
    const refreshSub = interval(30000).subscribe(() => {
      this.refreshData();
    });
    this.subscriptions.push(refreshSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadDrivers() {
    try {
      this.isLoading = true;
      const response = await this.http.get<{ drivers: Driver[] }>(
        `${environment.apiUrl}/drivers`
      ).toPromise();

      this.drivers = response?.drivers || [];

      // Debug: Check if names are loaded properly
      console.log('Drivers loaded:', this.drivers.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        user_id: d.user_id
      })));
    } catch (error: any) {
      console.error('Error loading drivers:', error);
      if (error.status === 500) {
        this.toastService.error('Backend-Fehler', 'Server-Fehler beim Laden der Fahrer. Bitte starten Sie das Backend neu.');
      } else if (error.status === 0) {
        this.toastService.error('Verbindungsfehler', 'Backend-Server ist nicht erreichbar. Bitte starten Sie das Backend.');
      } else {
        this.toastService.error('Fehler', 'Fahrer konnten nicht geladen werden');
      }
    } finally {
      this.isLoading = false;
    }
  }

  async loadPendingOrders() {
    try {
      // Use the same approach as the orders component: get managed restaurants first
      this.restaurantManagerService.getManagedRestaurants().subscribe({
        next: async (restaurants: any[]) => {
          if (restaurants?.length > 0) {
            // Get orders for the first restaurant (same as orders component)
            const restaurantId = restaurants[0].restaurant_id;

            // Load orders with different statuses to find pending ones
            const allOrders = await this.ordersService.getRestaurantOrders(restaurantId).toPromise();

            console.log('All orders for restaurant:', {
              restaurantId,
              totalOrders: allOrders?.length || 0,
              ordersByStatus: allOrders?.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              sampleOrders: allOrders?.slice(0, 5).map(o => ({
                id: o.id,
                status: o.status,
                created_at: o.created_at,
                customer_name: o.customer_name
              }))
            });

            // Filter for orders that need driver assignment (pending, ready, open, in_progress without driver)
            const pendingOrders = allOrders?.filter(order =>
              (order.status === 'pending' || order.status === 'ready' || order.status === 'open' || order.status === 'in_progress') &&
              !order.driver_id
            ) || [];

            console.log('Filtered pending orders:', {
              count: pendingOrders.length,
              orders: pendingOrders.map(o => ({
                id: o.id,
                status: o.status,
                hasDriver: !!o.driver_id
              }))
            });

            this.pendingOrders = pendingOrders;
          } else {
            console.log('No managed restaurants found');
            this.pendingOrders = [];
          }
        },
        error: (error) => {
          console.error('Error loading managed restaurants:', error);
          this.pendingOrders = [];
        }
      });
    } catch (error) {
      console.error('Error loading pending orders:', error);
      this.pendingOrders = [];
    }
  }

  async loadDriverStats() {
    try {
      const response = await this.http.get(
        `${environment.apiUrl}/drivers/stats`
      ).toPromise();

      this.driverStats = response;
    } catch (error: any) {
      console.error('Error loading driver stats:', error);
      if (error.status === 500) {
        this.toastService.error('Backend-Fehler', 'Server-Fehler beim Laden der Fahrer-Statistiken. Bitte starten Sie das Backend neu.');
      } else if (error.status === 0) {
        this.toastService.error('Verbindungsfehler', 'Backend-Server ist nicht erreichbar. Bitte starten Sie das Backend.');
      } else {
        this.toastService.error('Fehler', 'Fahrer-Statistiken konnten nicht geladen werden');
      }
    }
  }

  async assignBestDriver(order: Order) {
    if (this.isAssigning) return;

    try {
      this.isAssigning = true;

      const response = await this.http.post(
        `${environment.apiUrl}/drivers/assign`,
        {
          order_id: order.id,
          delivery_address: order.delivery_address,
          priority: 'normal'
        }
      ).toPromise();

      this.toastService.success('Erfolg', 'Fahrer wurde erfolgreich zugewiesen');
      await this.refreshData();
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      const message = error.error?.error || 'Fahrer-Zuweisung fehlgeschlagen';
      this.toastService.error('Fehler', message);
    } finally {
      this.isAssigning = false;
    }
  }

  async assignOrderToDriver(driver: Driver) {
    // Show modal for manual driver selection
    this.selectedOrder = null; // We'll need to select an order first
    this.selectedDriver = driver;
    this.showAssignmentModal = true;

    // Load available drivers for the modal - check both status fields
    this.availableDrivers = this.drivers.filter(d =>
      d.current_status === 'available' || d.status === 'available'
    );

    console.log('Opening driver assignment modal:', {
      selectedDriver: driver.id,
      totalDrivers: this.drivers.length,
      availableDrivers: this.availableDrivers.length,
      availableDriversList: this.availableDrivers.map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        current_status: d.current_status
      }))
    });
  }

  async openManualAssignment(order: Order) {
    // Show modal for manual driver selection for specific order
    this.selectedOrder = order;
    this.selectedDriver = null;
    this.showAssignmentModal = true;

    // Load available drivers for the modal - check both current_status and status fields
    this.availableDrivers = this.drivers.filter(d =>
      d.current_status === 'available' || d.status === 'available'
    );

    // Fallback: If no available drivers found, show all drivers (for testing/debugging)
    if (this.availableDrivers.length === 0) {
      console.warn('No available drivers found, showing all drivers as fallback');
      this.availableDrivers = this.drivers;
    }

    console.log('Opening manual assignment modal:', {
      order: order.id,
      totalDrivers: this.drivers.length,
      availableDrivers: this.availableDrivers.length,
      availableDriversList: this.availableDrivers.map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        current_status: d.current_status
      }))
    });
  }

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
  }

  async confirmAssignment() {
    if (!this.selectedOrder || !this.selectedDriver || this.isConfirming) return;

    try {
      this.isConfirming = true;

      // Verwende die korrekte API für manuelle Zuweisung
      const response = await this.http.post(
        `${environment.apiUrl}/orders/${this.selectedOrder.id}/assign-driver`,
        {
          driver_id: this.selectedDriver.id,
          estimated_delivery_time: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 Minuten
        }
      ).toPromise();

      this.toastService.success('Erfolg', `${this.selectedDriver.name || 'Fahrer'} wurde erfolgreich zugewiesen`);
      this.closeAssignmentModal();
      await this.refreshData();
    } catch (error: any) {
      console.error('Error confirming assignment:', error);
      const message = error.error?.error || 'Zuweisung fehlgeschlagen';
      this.toastService.error('Fehler', message);
    } finally {
      this.isConfirming = false;
    }
  }

  closeAssignmentModal() {
    this.showAssignmentModal = false;
    this.selectedOrder = null;
    this.selectedDriver = null;
    this.availableDrivers = [];
  }

  addDriver() {
    this.showAddDriverModal = true;
    this.resetNewDriverForm();
  }

  closeAddDriverModal() {
    this.showAddDriverModal = false;
    this.resetNewDriverForm();
  }

  resetNewDriverForm() {
    this.newDriver = {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirm: '',
      vehicle_type: 'car',
      vehicle_info: '',
      license_plate: ''
    };
  }

  passwordsMatch(): boolean {
    if (!this.newDriver.password || !this.newDriver.password_confirm) {
      return false;
    }
    return this.newDriver.password === this.newDriver.password_confirm;
  }

  async submitAddDriver() {
    if (this.isAddingDriver) return;

    try {
      this.isAddingDriver = true;

      // Get current user's tenant_id for the driver
      const currentUser = this.authService.currentUserSubject.value;
      if (!currentUser || !currentUser.tenant_id) {
        throw new Error('Restaurant manager must have a tenant assigned');
      }

      // First create a user account for the driver
      const userResponse = await this.http.post(
        `${environment.apiUrl}/auth/register`,
        {
          name: this.newDriver.name,
          email: this.newDriver.email,
          password: this.newDriver.password,
          role: 'driver',
          phone: this.newDriver.phone,
          tenantId: currentUser.tenant_id
        }
      ).toPromise();

      const user = (userResponse as any).user;

      // Then create the driver profile
      const driverResponse = await this.http.post(
        `${environment.apiUrl}/drivers`,
        {
          user_id: user.id,
          vehicle_type: this.newDriver.vehicle_type,
          vehicle_info: this.newDriver.vehicle_info,
          license_plate: this.newDriver.license_plate
        }
      ).toPromise();

      this.toastService.success('Erfolg', 'Fahrer wurde erfolgreich hinzugefügt');
      this.closeAddDriverModal();
      await this.refreshData();

    } catch (error: any) {
      console.error('Error adding driver:', error);
      let errorMessage = 'Fahrer konnte nicht hinzugefügt werden';
      
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status === 409) {
        errorMessage = 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits';
      } else if (error.status === 0) {
        errorMessage = 'Backend-Server ist nicht erreichbar';
      }

      this.toastService.error('Fehler', errorMessage);
    } finally {
      this.isAddingDriver = false;
    }
  }

  viewDriverDetails(driver: Driver) {
    // TODO: Implement driver details modal
    console.log('View driver details:', driver);
  }

  contactDriver(driver: Driver) {
    // TODO: Implement contact functionality
    if (driver.phone) {
      window.open(`tel:${driver.phone}`);
    } else {
      this.toastService.info('Info', 'Keine Telefonnummer verfügbar');
    }
  }

  async refreshData() {
    await Promise.all([
      this.loadDrivers(),
      this.loadPendingOrders(),
      this.loadDriverStats()
    ]);
  }

  // Helper methods
  getDriverStatusClass(driver: Driver): string {
    return driver.current_status;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      available: 'Verfügbar',
      busy: 'Beschäftigt',
      offline: 'Offline',
      on_delivery: 'Unterwegs'
    };
    return labels[status] || status;
  }

  getVehicleTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      car: 'Auto',
      motorcycle: 'Motorrad',
      bicycle: 'Fahrrad',
      scooter: 'Roller'
    };
    return labels[type] || type;
  }

  getVehicleIcon(type: string): string {
    const icons: { [key: string]: string } = {
      car: 'fa-car',
      motorcycle: 'fa-motorcycle',
      bicycle: 'fa-bicycle',
      scooter: 'fa-scooter'
    };
    return icons[type] || 'fa-car';
  }
}
