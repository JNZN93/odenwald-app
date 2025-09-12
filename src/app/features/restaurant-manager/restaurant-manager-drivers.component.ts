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
import { DriversService } from '../../core/services/drivers.service';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RestaurantsService } from '../../core/services/restaurants.service';

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
  imports: [CommonModule, FormsModule, DragDropModule],
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
            <div class="stat-value">{{ driverStats?.delivering_drivers || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>Durchschnittsbewertung</h3>
            <div class="stat-value">{{ (driverStats?.average_rating || 5.0) | number:'1.1-1' }}/5</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content-grid">
        <!-- Drivers List -->
        <div class="drivers-section">
          <h2>1. Fahrer auswählen</h2>
          <p class="section-description">Wählen Sie zuerst einen Fahrer aus, dem Sie Bestellungen zuweisen möchten. Nur verfügbare Fahrer können ausgewählt werden.</p>

          <div class="drivers-list" *ngIf="drivers.length > 0; else noDrivers">
            <div
              class="driver-card selectable"
              *ngFor="let driver of drivers"
              [class]="getDriverStatusClass(driver)"
              [class.selected]="selectedDriver?.id === driver.id"
              [class.disabled]="!isDriverAvailable(driver)"
              (click)="selectDriverForAssignment(driver)"
            >
              <div class="selection-indicator">
                <i class="fa-solid fa-ban" *ngIf="!isDriverAvailable(driver)"></i>
                <i class="fa-solid fa-circle-check" *ngIf="isDriverAvailable(driver) && selectedDriver?.id !== driver.id"></i>
                <i class="fa-solid fa-circle-dot" *ngIf="selectedDriver?.id === driver.id"></i>
              </div>

              <!-- Selection badge for selected driver -->
              <div class="selection-badge" *ngIf="selectedDriver?.id === driver.id">
                <i class="fa-solid fa-check"></i>
                <span>Ausgewählt</span>
              </div>

              <div class="driver-header">
                <div class="driver-info">
                  <h4>{{ driver.name || 'Fahrer ' + driver.id }}</h4>
                  <div class="vehicle-badge" [class]="driver.vehicle_type">
                    <i class="fa-solid" [ngClass]="getVehicleIcon(driver.vehicle_type)"></i>
                    {{ getVehicleTypeLabel(driver.vehicle_type) }}
                  </div>
                  <!-- Status Badges -->
                  <div class="status-badges">
                    <!-- Delivery Status Badge for drivers who are busy (since there's no on_delivery status in DB) -->
                    <div class="delivery-status-badge" *ngIf="driver.status === 'busy' || driver.current_status === 'busy'" [class]="getDeliveryBadgeClass(driver)">
                      <i class="fa-solid fa-route"></i>
                      <span>{{ getDeliveryBadgeText(driver) }}</span>
                    </div>

                    <!-- Offline Status Badge for drivers who are offline -->
                    <div class="offline-status-badge" *ngIf="driver.status === 'offline' || driver.current_status === 'offline'" [class]="getOfflineBadgeClass(driver)">
                      <i class="fa-solid fa-moon"></i>
                      <span>{{ getOfflineBadgeText(driver) }}</span>
                    </div>
                  </div>
                </div>
                <div class="status-indicator">
                  <span class="status-dot" [class]="driver.status || driver.current_status"></span>
                  <span class="status-text">{{ getStatusLabel(driver.status || driver.current_status) }}</span>
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

        <!-- Pending Orders with Checkboxes -->
        <div class="orders-section">
          <div class="orders-header">
            <h2>2. Bestellungen auswählen</h2>
            <div class="bulk-actions" *ngIf="selectedDriver && pendingOrders.length > 0">
              <button
                class="btn btn-primary"
                (click)="assignSelectedOrders()"
                [disabled]="selectedOrders.length === 0 || isBulkAssigning"
              >
                <span *ngIf="!isBulkAssigning">
                  <i class="fa-solid fa-check"></i>
                  {{ selectedOrders.length }} Bestellung{{ selectedOrders.length !== 1 ? 'en' : '' }} zuweisen
                </span>
                <span *ngIf="isBulkAssigning">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Zuweisen...
                </span>
              </button>
              <button
                class="btn btn-outline-primary"
                *ngIf="selectedDriver"
                (click)="optimizeTourForSelectedDriver()"
                [disabled]="isOptimizing"
              >
                <span *ngIf="!isOptimizing">
                  <i class="fa-solid fa-route"></i>
                  Tour optimieren
                </span>
                <span *ngIf="isOptimizing">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  Optimieren...
                </span>
              </button>
              <button
                class="btn btn-success"
                *ngIf="selectedDriver && manualSequence.length > 0"
                (click)="saveManualTour()"
              >
                <i class="fa-solid fa-save"></i>
                Tour speichern
              </button>
            </div>
          </div>

          <div class="assignment-info" *ngIf="selectedDriver">
            <div class="info-card">
              <i class="fa-solid fa-user-check"></i>
              <div class="info-content">
                <strong>{{ selectedDriver.name || 'Fahrer ' + selectedDriver.id }}</strong> ausgewählt
                <br>
                <small>Wählen Sie die Bestellungen aus, die zugewiesen werden sollen</small>
              </div>
            </div>
          </div>

          <div class="orders-list" *ngIf="pendingOrders.length > 0; else noOrders">
            <div
              class="order-card selectable"
              *ngFor="let order of pendingOrders"
              [class.selected]="isOrderSelected(order)"
              [class.disabled]="!selectedDriver"
              (click)="toggleOrderSelection(order)"
            >
              <div class="order-selection-indicator" *ngIf="isOrderSelected(order)">
                <i class="fa-solid fa-check"></i>
              </div>

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
                <div class="detail-item">
                  <i class="fa-solid fa-clock"></i>
                  <span>{{ order.created_at | date:'short' }}</span>
                </div>
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


      <!-- Add Driver Modal -->
      <div class="modal" *ngIf="showAddDriverModal" (click)="closeAddDriverModal()">
        <div class="modal-content add-driver-modal" (click)="$event.stopPropagation()">
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

      <!-- Driver Details Modal -->
      <div class="modal" *ngIf="showDriverDetailsModal" (click)="closeDriverDetailsModal()">
        <div class="modal-content driver-details-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-user"></i> Fahrer-Details</h3>
            <button class="close-btn" (click)="closeDriverDetailsModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedDriverForDetails">
            <div class="driver-profile-section">
              <div class="driver-profile-header">
                <div class="driver-avatar">
                  <i class="fa-solid fa-user-circle"></i>
                </div>
                <div class="driver-basic-info">
                  <h4>{{ selectedDriverForDetails.name || 'Fahrer ' + selectedDriverForDetails.id }}</h4>
                  <div class="driver-meta">
                    <span class="driver-email">{{ selectedDriverForDetails.email }}</span>
                    <span class="driver-phone" *ngIf="selectedDriverForDetails.phone">{{ selectedDriverForDetails.phone }}</span>
                  </div>
                </div>
                <div class="driver-status-badge">
                  <span class="status-dot" [class]="selectedDriverForDetails.current_status"></span>
                  <span>{{ getStatusLabel(selectedDriverForDetails.current_status) }}</span>
                </div>
              </div>

              <div class="driver-stats-grid">
                <div class="stat-item">
                  <i class="fa-solid fa-star"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.rating }}/5</span>
                    <span class="stat-label">Bewertung</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-truck"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.total_deliveries }}</span>
                    <span class="stat-label">Lieferungen</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-euro-sign"></i>
                  <div class="stat-info">
                    <span class="stat-value">€{{ selectedDriverForDetails.total_earnings | number:'1.2-2' }}</span>
                    <span class="stat-label">Verdienst</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-calendar"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.joined_date | date:'shortDate' }}</span>
                    <span class="stat-label">Beigetreten</span>
                  </div>
                </div>
              </div>

              <div class="driver-vehicle-info" *ngIf="selectedDriverForDetails.vehicle_info">
                <h5><i class="fa-solid fa-car"></i> Fahrzeug</h5>
                <div class="vehicle-details">
                  <div class="vehicle-badge" [class]="selectedDriverForDetails.vehicle_type">
                    <i class="fa-solid" [ngClass]="getVehicleIcon(selectedDriverForDetails.vehicle_type)"></i>
                    {{ getVehicleTypeLabel(selectedDriverForDetails.vehicle_type) }}
                  </div>
                  <span class="vehicle-info-text">{{ selectedDriverForDetails.vehicle_info }}</span>
                  <span class="license-plate" *ngIf="selectedDriverForDetails.license_plate">
                    <i class="fa-solid fa-id-card"></i> {{ selectedDriverForDetails.license_plate }}
                  </span>
                </div>
              </div>
            </div>

            <div class="driver-orders-section">
              <!-- Tabs -->
              <div class="tabs-container">
                <div class="tabs-header">
                  <button
                    class="tab-button"
                    [class.active]="activeTab === 'active'"
                    (click)="switchTab('active')"
                  >
                    <i class="fa-solid fa-route"></i>
                    Aktive Tour ({{ activeOrdersCount }})
                  </button>
                  <button
                    class="tab-button"
                    [class.active]="activeTab === 'all'"
                    (click)="switchTab('all')"
                  >
                    <i class="fa-solid fa-list"></i>
                    Alle Bestellungen ({{ allOrdersCount }})
                  </button>
                </div>

                <div class="tab-info" *ngIf="activeTab === 'active'">
                  <small><i class="fa-solid fa-info-circle"></i> Nur Bestellungen, die für Tour-Optimierung geeignet sind</small>
                </div>
              </div>

              <div style="margin: 8px 0;" *ngIf="activeTab === 'active'">
                <button class="btn btn-outline-primary" (click)="toggleMap()">
                  <i class="fa-solid fa-map"></i> Karte {{ showMap ? 'ausblenden' : 'anzeigen' }}
                </button>
              </div>
              <div class="map-container" *ngIf="showMap && activeTab === 'active'" style="height: 300px; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 12px;">
                <div id="manager-route-map" style="height: 100%; width: 100%;"></div>
              </div>

              <div class="orders-loading" *ngIf="isLoadingDriverOrders">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Lade Bestellungen...</span>
              </div>

              <!-- Active Tour Tab Content -->
              <div *ngIf="activeTab === 'active' && !isLoadingDriverOrders">
                <div class="driver-orders-list" cdkDropList (cdkDropListDropped)="onAssignedOrdersDrop($event)">
                  <div class="order-item" *ngFor="let order of currentOrders; let i = index" cdkDrag>
                    <div class="order-header">
                      <span class="order-id">#{{ order.id }}</span>
                      <span class="order-status" [class]="order.status">{{ getOrderStatusLabel(order.status) }}</span>
                    </div>
                    <div class="order-details">
                      <div class="order-customer">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ order.customer_name || 'Kunde' }}</span>
                      </div>
                      <div class="order-address">
                        <i class="fa-solid fa-map-marker-alt"></i>
                        <span>{{ order.delivery_address }}</span>
                      </div>
                      <div class="order-value">
                        <i class="fa-solid fa-euro-sign"></i>
                        <span>€{{ order.total_price | number:'1.2-2' }}</span>
                      </div>
                    </div>
                    <div class="order-timing">
                      <div class="order-created">
                        <i class="fa-solid fa-calendar"></i>
                        <span>{{ order.created_at | date:'short' }}</span>
                      </div>
                      <div class="order-assigned">
                        <i class="fa-solid fa-clock"></i>
                        <span>Zugewiesen: {{ order.created_at | date:'short' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="modal-actions" *ngIf="currentOrders.length > 0">
                    <button class="btn btn-outline-primary" (click)="optimizeTourForSelectedDriver()" [disabled]="isOptimizing">
                      <span *ngIf="!isOptimizing"><i class="fa-solid fa-route"></i> Tour optimieren</span>
                      <span *ngIf="isOptimizing"><i class="fa-solid fa-spinner fa-spin"></i> Optimieren...</span>
                    </button>
                    <button
                      *ngIf="activeTab === 'active'"
                      class="btn btn-success"
                      (click)="saveManualTour()"
                      [disabled]="!canSaveSequence || isSaving">
                      <span *ngIf="!isSaving">
                        <i class="fa-solid fa-save"></i> Reihenfolge speichern
                      </span>
                      <span *ngIf="isSaving">
                        <i class="fa-solid fa-spinner fa-spin"></i> Speichere...
                      </span>
                    </button>
                  </div>

                  <div class="no-orders" *ngIf="currentOrders.length === 0">
                    <i class="fa-solid fa-inbox"></i>
                    <span>Keine aktiven Bestellungen für Tour-Optimierung</span>
                  </div>
                </div>
              </div>

              <!-- All Orders Tab Content -->
              <div *ngIf="activeTab === 'all' && !isLoadingDriverOrders">
                <div class="driver-orders-list">
                  <div class="order-item" *ngFor="let order of currentOrders; let i = index">
                    <div class="order-header">
                      <span class="order-id">#{{ order.id }}</span>
                      <span class="order-status" [class]="order.status">{{ getOrderStatusLabel(order.status) }}</span>
                    </div>
                    <div class="order-details">
                      <div class="order-customer">
                        <i class="fa-solid fa-user"></i>
                        <span>{{ order.customer_name || 'Kunde' }}</span>
                      </div>
                      <div class="order-address">
                        <i class="fa-solid fa-map-marker-alt"></i>
                        <span>{{ order.delivery_address }}</span>
                      </div>
                      <div class="order-value">
                        <i class="fa-solid fa-euro-sign"></i>
                        <span>€{{ order.total_price | number:'1.2-2' }}</span>
                      </div>
                    </div>
                    <div class="order-timing">
                      <div class="order-created">
                        <i class="fa-solid fa-calendar"></i>
                        <span>{{ order.created_at | date:'short' }}</span>
                      </div>
                      <div class="order-assigned">
                        <i class="fa-solid fa-clock"></i>
                        <span>Zugewiesen: {{ order.created_at | date:'short' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="no-orders" *ngIf="currentOrders.length === 0">
                    <i class="fa-solid fa-inbox"></i>
                    <span>Keine Bestellungen gefunden</span>
                  </div>
                </div>
              </div>
            </div>
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

    .section-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
      margin-bottom: var(--space-4);
      margin-top: -var(--space-2);
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .bulk-actions {
      display: flex;
      gap: var(--space-3);
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .driver-card.selectable {
      cursor: pointer;
    }

    .driver-card.selectable:hover:not(.disabled):not(.selected) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.08);
      border-color: #ff8c00;
    }

    .driver-card.selectable:hover:not(.disabled).selected {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.1);
    }

    .driver-card.selected {
      border-color: #ff8c00;
      background: rgba(255, 140, 0, 0.08);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.1);
      border-left: 1px solid #ff8c00;
      transform: translateY(-1px);
    }

    .driver-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--color-surface-2);
    }

    .selection-indicator {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      font-size: var(--text-lg);
      color: var(--color-muted);
      z-index: 2;
    }

    .selection-indicator .fa-ban {
      color: var(--color-error);
    }

    .driver-card.selected .selection-indicator {
      color: #ff8c00;
    }

    .driver-card.disabled .selection-indicator {
      color: var(--color-error);
    }

    .selection-badge {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      background: #ff8c00;
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(255, 140, 0, 0.4);
      animation: selectionPulse 0.3s ease-out;
      z-index: 3;
    }

    .selection-badge i {
      font-size: var(--text-sm);
    }

    @keyframes selectionPulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .driver-card.available {
      border-left: 4px solid var(--color-success);
    }

    .driver-card.busy {
      border-left: 4px solid #ff8c00;
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

    /* Status Badges Container */
    .status-badges {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: var(--space-1);
      margin-right: var(--space-6);
      padding-right: var(--space-3);
    }

    /* Delivery Status Badge */
    .delivery-status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      animation: deliveryPulse 2s ease-in-out infinite;
      box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
    }

    .delivery-status-badge.on-delivery {
      background: linear-gradient(135deg, #ff8c00, #ff6b35);
      color: white;
      border: 1px solid rgba(255, 140, 0, 0.5);
    }

    .delivery-status-badge i {
      font-size: var(--text-sm);
    }


    /* Offline Status Badge */
    .offline-status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
    }

    .offline-status-badge.offline {
      background: linear-gradient(135deg, #6c757d, #495057);
      color: white;
      border: 1px solid rgba(108, 117, 125, 0.5);
    }

    .offline-status-badge i {
      font-size: var(--text-sm);
    }

    @keyframes deliveryPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }


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

    .status-dot.available { background: #32cd32; } /* Hellgrün für verfügbar */
    .status-dot.busy { background: #ff8c00; } /* Orange für beschäftigt/unterwegs */
    .status-dot.offline { background: #6c757d; } /* Grau für offline */

    .status-text {
      font-size: var(--text-sm);
      color: var(--color-muted);
      margin-right: var(--space-6);
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
      position: relative;
    }

    .order-card.selectable {
      transition: all var(--transition);
      cursor: pointer;
      position: relative;
    }

    .order-card.selectable:hover:not(.disabled) {
      border-color: #ff8c00;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.1);
    }

    .order-card.selected {
      border-color: #ff8c00;
      background: rgba(255, 140, 0, 0.1);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.1);
    }

    .order-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--color-surface-2);
    }

    .order-selection-indicator {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      width: 24px;
      height: 24px;
      background: #ff8c00;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--text-sm);
      box-shadow: 0 2px 4px rgba(255, 140, 0, 0.3);
      animation: selectionPulse 0.3s ease-out;
    }

    @keyframes selectionPulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .assignment-info {
      margin-bottom: var(--space-4);
    }

    .info-card {
      background: rgba(255, 140, 0, 0.08);
      border: 1px solid rgba(255, 140, 0, 0.3);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .info-card i {
      color: #ff8c00;
      font-size: var(--text-lg);
    }

    .info-content {
      flex: 1;
      font-size: var(--text-sm);
    }

    .info-content strong {
      color: var(--color-heading);
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

      .driver-details-modal {
        max-width: 800px;
      }
    }

    /* Modal Styles */
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

    .modal-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-6);
    }

    /* Driver Details Modal Styles */
    .driver-details-modal {
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .driver-profile-section {
      margin-bottom: var(--space-6);
    }

    .driver-profile-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-light);
      border-radius: var(--radius-md);
    }

    .driver-avatar {
      font-size: var(--text-4xl);
      color: var(--color-primary);
    }

    .driver-basic-info h4 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
    }

    .driver-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .driver-status-badge {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
    }

    .driver-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .stat-item i {
      font-size: var(--text-xl);
      color: var(--color-primary);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-heading);
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .driver-vehicle-info h5 {
      margin: 0 0 var(--space-3) 0;
      color: var(--color-heading);
      font-size: var(--text-base);
    }

    .vehicle-details {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-surface);
      border-radius: var(--radius-md);
    }

    .vehicle-info-text {
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .license-plate {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2);
      background: var(--color-primary-500);
      color: white;
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    /* Tabs */
    .tabs-container {
      margin-bottom: var(--space-4);
    }

    .tabs-header {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .tab-button {
      background: var(--bg-light);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .tab-button:hover {
      background: var(--color-surface);
    }

    .tab-button.active {
      background: var(--gradient-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .tab-info {
      color: var(--color-muted);
      font-size: var(--text-xs);
      margin-bottom: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .driver-orders-section h5 {
      margin: 0 0 var(--space-4) 0;
      color: var(--color-heading);
      font-size: var(--text-base);
    }

    .orders-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-6);
      color: var(--color-muted);
    }

    .driver-orders-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .order-item {
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
      background: var(--color-surface);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .order-id {
      font-weight: 600;
      color: var(--color-heading);
    }

    .order-status {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 500;
      text-transform: uppercase;
    }

    .order-status.pending { background: #ffa500; color: white; } /* Hellorange für ausstehend */
    .order-status.confirmed { background: #87ceeb; color: white; } /* Hellblau für bestätigt */
    .order-status.preparing { background: #ff8c00; color: white; } /* Orange für in Zubereitung */
    .order-status.ready { background: #ff8c00; color: white; } /* Orange für bereit */
    .order-status.in_progress { background: #ff8c00; color: white; } /* Orange für unterwegs */
    .order-status.delivered { background: #228b22; color: white; } /* Dunkelgrün für geliefert */
    .order-status.cancelled { background: #dc143c; color: white; } /* Rot für storniert */

    .order-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .order-customer, .order-address, .order-value {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .order-timing {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .order-created, .order-assigned {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .no-orders {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-6);
      color: var(--color-muted);
      background: var(--color-surface);
      border-radius: var(--radius-md);
    }
  `]
})
export class RestaurantManagerDriversComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private ordersService = inject(OrdersService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private driversService = inject(DriversService);
  private restaurantsService = inject(RestaurantsService);
  private subscriptions: Subscription[] = [];

  drivers: Driver[] = [];
  pendingOrders: Order[] = [];
  driverStats: any = null;

  // New assignment workflow state
  assignmentSelectedDriver: Driver | null = null;
  selectedOrders: Order[] = [];

  // Driver details modal state
  showDriverDetailsModal = false;
  selectedDriverForDetails: Driver | null = null;
  driverAssignedOrders: Order[] = [];
  driverAllOrders: Order[] = [];
  isLoadingDriverOrders = false;
  manualSequence: string[] = [];
  isOptimizing = false;
  isSaving = false;
  activeTab: 'active' | 'all' = 'active';
  // Map state
  showMap = false;
  private map: any = null;
  private orderCoords: Map<string, { lat: number; lon: number }> = new Map();
  private startCoords: { lat: number; lon: number } | null = null;
  private managedRestaurantId: string | null = null;

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
  isAddingDriver = false;
  isBulkAssigning = false;

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
            this.managedRestaurantId = String(restaurantId);

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

      console.log('Driver stats response:', response);
      console.log('Response stats property:', (response as any)?.stats);
      this.driverStats = (response as any)?.stats;
      console.log('Driver stats set to:', this.driverStats);
      console.log('Average rating value:', this.driverStats?.average_rating);
      console.log('Average rating type:', typeof this.driverStats?.average_rating);
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

  async viewDriverDetails(driver: Driver) {
    this.selectedDriverForDetails = driver;
    this.showDriverDetailsModal = true;
    this.driverAssignedOrders = [];
    await this.loadDriverAssignedOrders(driver.id);
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
    return driver.status || driver.current_status;
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

  // Status Badge Methods
  getDeliveryBadgeClass(driver: Driver): string {
    // You could enhance this to consider delivery count or urgency
    return 'on-delivery';
  }

  getDeliveryBadgeText(driver: Driver): string {
    // Show delivery count if available, otherwise just "Unterwegs"
    const activeDeliveries = this.getActiveDeliveryCount(driver);
    if (activeDeliveries > 0) {
      return `Unterwegs (${activeDeliveries})`;
    }
    return 'Unterwegs';
  }

  getActiveDeliveryCount(driver: Driver): number {
    // This is a simplified count - in a real implementation, you'd fetch
    // the actual active deliveries for this driver from the backend
    // For now, we'll return a mock count based on driver ID for demonstration
    // Using a deterministic calculation to avoid ExpressionChangedAfterItHasBeenCheckedError
    const driverId = driver.id || driver.user_id || 'default';
    return (parseInt(driverId.toString().slice(-1), 10) % 3) + 1; // 1-3 based on last digit of ID
  }


  getOfflineBadgeClass(driver: Driver): string {
    return 'offline';
  }

  getOfflineBadgeText(driver: Driver): string {
    return 'Offline';
  }

  // New assignment workflow methods
  selectDriverForAssignment(driver: Driver) {
    if (!this.isDriverAvailable(driver)) {
      this.toastService.info('Info', 'Dieser Fahrer ist bereits beschäftigt und kann keine neuen Bestellungen annehmen');
      return;
    }

    if (this.assignmentSelectedDriver?.id === driver.id) {
      // Deselect if already selected
      this.assignmentSelectedDriver = null;
      this.selectedOrders = [];
    } else {
      // Select new driver
      this.assignmentSelectedDriver = driver;
      this.selectedOrders = [];
    }
  }

  isDriverAvailable(driver: Driver): boolean {
    // Only allow assignment to available drivers
    // Exclude busy and offline drivers since they are already working
    const driverStatus = driver.status || driver.current_status;
    return driverStatus === 'available';
  }

  toggleOrderSelection(order: Order) {
    if (!this.assignmentSelectedDriver) {
      this.toastService.info('Info', 'Bitte wählen Sie zuerst einen Fahrer aus');
      return;
    }

    const index = this.selectedOrders.findIndex(o => o.id === order.id);
    if (index > -1) {
      this.selectedOrders.splice(index, 1);
    } else {
      this.selectedOrders.push(order);
    }
  }

  isOrderSelected(order: Order): boolean {
    return this.selectedOrders.some(o => o.id === order.id);
  }

  async assignSelectedOrders() {
    if (!this.assignmentSelectedDriver || this.selectedOrders.length === 0 || this.isBulkAssigning) return;

    try {
      this.isBulkAssigning = true;

      const assignmentPromises = this.selectedOrders.map(order =>
        this.http.post(
          `${environment.apiUrl}/orders/${order.id}/assign-driver`,
          {
            driver_id: this.assignmentSelectedDriver!.id,
            estimated_delivery_time: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          }
        ).toPromise()
      );

      await Promise.all(assignmentPromises);

      this.toastService.success(
        'Erfolg',
        `${this.selectedOrders.length} Bestellung${this.selectedOrders.length !== 1 ? 'en' : ''} wurde${this.selectedOrders.length === 1 ? '' : 'n'} erfolgreich zugewiesen`
      );

      // Reset selection
      this.selectedOrders = [];
      this.assignmentSelectedDriver = null;

      await this.refreshData();
    } catch (error: any) {
      console.error('Error bulk assigning orders:', error);
      const message = error.error?.error || 'Zuweisung fehlgeschlagen';
      this.toastService.error('Fehler', message);
    } finally {
      this.isBulkAssigning = false;
    }
  }

  optimizeTourForSelectedDriver() {
    // Use the correct driver variable based on context
    const driver = this.selectedDriverForDetails || this.selectedDriver;
    if (!driver) return;

    this.isOptimizing = true;
    // Determine restaurant id from manager context
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        const restaurantId = restaurants?.[0]?.restaurant_id;
        if (!restaurantId) {
          this.toastService.error('Fehler', 'Kein Restaurant gefunden');
          this.isOptimizing = false;
          return;
        }
        this.driversService.optimizeTour(driver.id, String(restaurantId)).subscribe({
          next: (res) => {
            this.manualSequence = res.route.orderIdsInSequence || [];
            this.toastService.success('Erfolg', 'Tour optimiert');

            // Always reload driver orders to ensure we have the latest data
            if (driver) {
              this.loadDriverAssignedOrders(driver.id);
            }

            this.isOptimizing = false;
          },
          error: (err) => {
            console.error('Optimize tour error', err);
            this.toastService.error('Fehler', 'Optimierung fehlgeschlagen');
            this.isOptimizing = false;
          }
        });
      },
      error: () => {
        this.toastService.error('Fehler', 'Manager-Restaurant konnte nicht geladen werden');
        this.isOptimizing = false;
      }
    });
  }

  saveManualTour() {
    // Use the correct driver variable based on context
    const driver = this.selectedDriverForDetails || this.selectedDriver;
    if (!driver || this.manualSequence.length === 0) return;

    this.isSaving = true;
    this.driversService.saveTour(driver.id, this.manualSequence).subscribe({
      next: () => {
        this.toastService.success('Erfolg', 'Tour gespeichert');

        // Reload driver orders to ensure we have the latest data
        if (driver) {
          this.loadDriverAssignedOrders(driver.id);
        }
      },
      error: (err) => {
        console.error('Save tour error', err);
        this.toastService.error('Fehler', 'Tour konnte nicht gespeichert werden');
      }
    }).add(() => {
      this.isSaving = false;
    });
  }

  // Getter for template
  get selectedDriver(): Driver | null {
    return this.assignmentSelectedDriver;
  }

  // Driver details modal methods
  async loadDriverAssignedOrders(driverId: string) {
    try {
      this.isLoadingDriverOrders = true;

      // Load all orders for the driver
      const response = await this.http.get<{ orders: Order[] }>(
        `${environment.apiUrl}/drivers/${driverId}/orders`
      ).toPromise();

      this.driverAllOrders = response?.orders || [];

      // Filter active orders for tour optimization (same logic as backend)
      this.driverAssignedOrders = this.driverAllOrders.filter(order =>
        ['ready', 'picked_up', 'confirmed', 'preparing'].includes(order.status)
      );

      // Sort active orders by delivery_sequence if available, otherwise by created_at
      this.driverAssignedOrders.sort((a, b) => {
        const aSeq = (a as any).delivery_sequence || 999999;
        const bSeq = (b as any).delivery_sequence || 999999;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      this.manualSequence = this.driverAssignedOrders.map(o => o.id);
      if (this.showMap) {
        this.updateMap();
      }
    } catch (error: any) {
      console.error('Error loading driver orders:', error);
      this.toastService.error('Fehler', 'Bestellungen konnten nicht geladen werden');
      this.driverAssignedOrders = [];
      this.driverAllOrders = [];
    } finally {
      this.isLoadingDriverOrders = false;
    }
  }

  onAssignedOrdersDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.driverAssignedOrders, event.previousIndex, event.currentIndex);
    this.manualSequence = this.driverAssignedOrders.map(o => o.id);
    if (this.showMap) {
      this.updateMap();
    }
  }

  closeDriverDetailsModal() {
    this.showDriverDetailsModal = false;
    this.selectedDriverForDetails = null;
    this.driverAssignedOrders = [];
    this.driverAllOrders = [];
    this.activeTab = 'active';
  }

  switchTab(tab: 'active' | 'all') {
    this.activeTab = tab;
    if (this.showMap) {
      this.updateMap();
    }
  }

  get currentOrders(): Order[] {
    return this.activeTab === 'active' ? this.driverAssignedOrders : this.driverAllOrders;
  }

  get canSaveSequence(): boolean {
    const driver = this.selectedDriverForDetails || this.selectedDriver;
    return this.activeTab === 'active' && this.manualSequence.length > 0 && !!driver;
  }

  get activeOrdersCount(): number {
    return this.driverAssignedOrders.length;
  }

  get allOrdersCount(): number {
    return this.driverAllOrders.length;
  }

  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      preparing: 'In Zubereitung',
      ready: 'Bereit',
      in_progress: 'Unterwegs',
      delivered: 'Geliefert',
      cancelled: 'Storniert'
    };
    return labels[status] || status;
  }

  // Map
  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap) {
      setTimeout(() => this.updateMap(), 0);
    }
  }

  private updateMap() {
    const L = (window as any).L;
    const ensureLeaflet = (cb: () => void) => {
      if (L) return cb();
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => cb();
      document.head.appendChild(script);
    };

    // Ensure we have restaurant start coordinates, then render
    this.computeStartCoords().then(() => ensureLeaflet(() => this.renderMap()));
  }

  private renderMap() {
    const container = document.getElementById('manager-route-map');
    if (!container) return;
    const L = (window as any).L;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    // Center on restaurant if available, else fallback
    const center: [number, number] = this.startCoords ? [this.startCoords.lat, this.startCoords.lon] : [49.5, 8.4];
    this.map = L.map('manager-route-map').setView(center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(this.map);

    const markers: any[] = [];
    const addMarker = (lat: number, lon: number, label: string) => {
      const m = L.marker([lat, lon]).addTo(this.map).bindPopup(label);
      markers.push(m);
      return m;
    };

    // Add start marker (restaurant)
    if (this.startCoords) {
      addMarker(this.startCoords.lat, this.startCoords.lon, 'Restaurant Start');
    }

    // Best-effort order markers by geocoding quickly
    const addOrderMarkers = async () => {
      const path: Array<[number, number]> = [];
      if (this.startCoords) path.push([this.startCoords.lat, this.startCoords.lon]);
      for (const order of this.driverAssignedOrders) {
        try {
          const res: any = await this.http.get(`${environment.apiUrl}/geocoding/search?q=${encodeURIComponent(order.delivery_address)}`).toPromise();
          if (res && typeof res.latitude === 'number' && typeof res.longitude === 'number') {
            addMarker(res.latitude, res.longitude, `#${order.id}<br>${order.delivery_address}`);
            path.push([res.latitude, res.longitude]);
          }
        } catch {
          // ignore
        }
      }
      if (this.startCoords) path.push([this.startCoords.lat, this.startCoords.lon]);
      if (path.length >= 2) {
        L.polyline(path, { color: '#ff8c00', weight: 4, opacity: 0.85 }).addTo(this.map);
      }
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        const b = group.getBounds();
        if (b.isValid()) this.map.fitBounds(b.pad(0.2));
      }
    };

    addOrderMarkers();
  }

  private async computeStartCoords(): Promise<void> {
    if (this.startCoords || !this.managedRestaurantId) return;
    try {
      const restaurant: any = await this.restaurantsService.getRestaurantById(this.managedRestaurantId).toPromise();
      const coords = restaurant?.address?.coordinates;
      if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
        this.startCoords = { lat: coords.latitude, lon: coords.longitude };
        return;
      }
      // Fallback: geocode textual address
      const addrParts = restaurant?.address;
      const addrStr = addrParts ? `${addrParts.street || ''}, ${addrParts.postal_code || ''} ${addrParts.city || ''}, ${addrParts.country || ''}` : '';
      if (addrStr.trim().length > 0) {
        const res: any = await this.http.get(`${environment.apiUrl}/geocoding/search?q=${encodeURIComponent(addrStr)}`).toPromise();
        if (res && typeof res.latitude === 'number' && typeof res.longitude === 'number') {
          this.startCoords = { lat: res.latitude, lon: res.longitude };
        }
      }
    } catch {
      // ignore
    }
  }
}
