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
import { I18nService } from '../../core/services/i18n.service';

export interface Driver {
  id: string;
  user_id: string;
  tenant_id: string;
  name?: string;
  username?: string;
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
  current_status: 'available' | 'busy' | 'offline' | 'on_delivery' | 'pending_activation';
  status: 'available' | 'busy' | 'offline' | 'on_break' | 'pending_activation';
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
        <h1><i class="fa-solid fa-truck"></i> {{ translate('drivers.management') }}</h1>
        <p>{{ translate('drivers.manage_description') }}</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="btn btn-primary" (click)="addDriver()">
          <i class="fa-solid fa-plus"></i>
          <span class="btn-text-full">{{ translate('drivers.add_new') }}</span>
          <span class="btn-text-mobile">{{ translate('drivers.add_new_mobile') }}</span>
        </button>
        <button class="btn btn-success" (click)="refreshData()">
          <i class="fa-solid fa-refresh"></i>
          <span class="btn-text-full">{{ translate('drivers.refresh') }}</span>
          <span class="btn-text-mobile">{{ translate('drivers.refresh') }}</span>
        </button>
        <button class="btn btn-primary" (click)="optimizeMultiDriverRoutes()" [disabled]="isBulkOptimizing">
          <i class="fa-solid fa-route"></i>
          <span class="btn-text-full">{{ translate('drivers.multi_optimization') }}</span>
          <span class="btn-text-mobile">{{ translate('drivers.optimize') }}</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="driverStats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>{{ translate('drivers.total_drivers') }}</h3>
            <div class="stat-value">{{ driverStats.total_drivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>{{ translate('drivers.available_drivers') }}</h3>
            <div class="stat-value">{{ driverStats.available_drivers }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-route"></i>
          </div>
          <div class="stat-content">
            <h3>{{ translate('drivers.delivering_drivers') }}</h3>
            <div class="stat-value">{{ driverStats?.delivering_drivers || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>{{ translate('drivers.average_rating') }}</h3>
            <div class="stat-value">{{ (driverStats?.average_rating || 5.0) | number:'1.1-1' }}/5</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content-grid">
        <!-- Drivers List -->
        <div class="drivers-section">
          <h2>{{ translate('drivers.select_driver') }}</h2>
          <p class="section-description">{{ translate('drivers.select_description') }}</p>

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
                <span>{{ translate('drivers.selected') }}</span>
              </div>

              <div class="driver-header">
                <div class="driver-info">
                  <h4>{{ driver.name || translate('drivers.title') + ' ' + driver.id }}</h4>
                  <div class="vehicle-badge" [class]="driver.vehicle_type">
                    <i class="fa-solid" [ngClass]="getVehicleIcon(driver.vehicle_type)"></i>
                    {{ getVehicleTypeLabel(driver.vehicle_type) }}
                  </div>
                  <!-- Status Badges -->
                  <div class="status-badges">
                    <!-- Pending Activation Badge -->
                    <div class="pending-badge" *ngIf="driver.status === 'pending_activation' || driver.current_status === 'pending_activation'">
                      <i class="fa-solid fa-hourglass-half"></i>
                      <span>{{ translate('drivers.waiting_activation') }}</span>
                    </div>
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
                  <span>{{ driver.rating }}/5 {{ translate('drivers.rating') }}</span>
                </div>
                <div class="detail-item">
                  <i class="fa-solid fa-truck"></i>
                  <span>{{ driver.total_deliveries }} {{ translate('drivers.deliveries') }}</span>
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
                  [title]="translate('drivers.view_details')"
                >
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noDrivers>
            <div class="empty-state">
              <i class="fa-solid fa-truck"></i>
              <h3>{{ translate('drivers.no_drivers') }}</h3>
              <p>{{ translate('drivers.no_drivers_description') }}</p>
            </div>
          </ng-template>
        </div>

        <!-- Pending Orders with Checkboxes -->
        <div class="orders-section">
          <div class="orders-header">
            <h2>{{ translate('drivers.select_orders') }}</h2>
            <div class="bulk-actions" *ngIf="selectedDriver && pendingOrders.length > 0">
              <button
                class="btn btn-primary"
                (click)="assignSelectedOrders()"
                [disabled]="selectedOrders.length === 0 || isBulkAssigning"
              >
                <span *ngIf="!isBulkAssigning">
                  <i class="fa-solid fa-check"></i>
                  {{ selectedOrders.length }} {{ translate('drivers.assign_selected') }}
                </span>
                <span *ngIf="isBulkAssigning">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  {{ translate('drivers.assigning') }}
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
                  {{ translate('drivers.optimize_tour') }}
                </span>
                <span *ngIf="isOptimizing">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  {{ translate('drivers.optimizing') }}
                </span>
              </button>
              <button
                class="btn btn-success"
                *ngIf="selectedDriver && manualSequence.length > 0"
                (click)="saveManualTour()"
              >
                <i class="fa-solid fa-save"></i>
                {{ translate('drivers.save_tour') }}
              </button>
            </div>
          </div>

          <div class="assignment-info" *ngIf="selectedDriver">
            <div class="info-card">
              <i class="fa-solid fa-user-check"></i>
              <div class="info-content">
                <strong>{{ selectedDriver.name || translate('drivers.title') + ' ' + selectedDriver.id }}</strong> {{ translate('drivers.driver_selected') }}
                <br>
                <small>{{ translate('drivers.select_orders_description') }}</small>
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
                <h4>{{ translate('drivers.order') }} #{{ order.id }}</h4>
                <div class="order-value">€{{ order.total_price | number:'1.2-2' }}</div>
              </div>

              <div class="order-details">
                <div class="detail-item">
                  <i class="fa-solid fa-user"></i>
                  <span>{{ order.customer_name || translate('drivers.customer') }}</span>
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
              <h3>{{ translate('drivers.no_pending_orders') }}</h3>
              <p>{{ translate('drivers.no_pending_description') }}</p>
            </div>
          </ng-template>
        </div>
      </div>


      <!-- Loading Modal for Multi Optimization -->
      <div class="modal" *ngIf="isBulkOptimizing" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div class="loading-modal-content" style="background: white; border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 400px; width: 90%;">
          <div class="loading-spinner"></div>
          <h3 style="margin: 0; color: #333; font-size: 1.25rem;">{{ translate('drivers.multi_optimization_running') }}</h3>
          <p style="margin: 0; color: #666; text-align: center; font-size: 0.9rem;">{{ translate('drivers.multi_optimization_description') }}</p>
        </div>
      </div>

      <!-- Add Driver Modal with QR Code -->
      <div class="modal" *ngIf="showAddDriverModal" (click)="closeAddDriverModal()">
        <div class="modal-content add-driver-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-qrcode"></i> {{ translate('drivers.add_driver_modal') }}</h3>
            <button class="close-btn" (click)="closeAddDriverModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <!-- Tabs -->
          <div class="tabs-container">
            <button 
              class="tab-btn" 
              [class.active]="addDriverTab === 'qrcode'"
              (click)="addDriverTab = 'qrcode'"
            >
              <i class="fa-solid fa-qrcode"></i>
              QR-Code Registrierung
            </button>
            <button 
              class="tab-btn" 
              [class.active]="addDriverTab === 'quick'"
              (click)="addDriverTab = 'quick'"
            >
              <i class="fa-solid fa-bolt"></i>
              Schnellerfassung
            </button>
          </div>

          <div class="modal-body">
            <!-- QR-Code Tab -->
            <div *ngIf="addDriverTab === 'qrcode'">
              <div class="tab-info qr-info">
                <i class="fa-solid fa-info-circle"></i>
                <p><strong>QR-Code Registrierung:</strong> Fahrer wird erstellt und erhält QR-Code zum selbst aktivieren. Kein Passwort nötig!</p>
              </div>

              <form (ngSubmit)="createPendingDriver()" #qrForm="ngForm">
                <div class="form-group">
                  <label for="qrDriverName">Name des Fahrers *</label>
                  <input
                    type="text"
                    id="qrDriverName"
                    name="qr_name"
                    [(ngModel)]="qrDriverData.name"
                    required
                    class="form-input"
                    placeholder="Vorname Nachname"
                  />
                  <small class="form-hint">Der Benutzername wird automatisch generiert</small>
                </div>

                <div class="form-group">
                  <label for="qrVehicleType">Fahrzeugtyp *</label>
                  <select
                    id="qrVehicleType"
                    name="qr_vehicle_type"
                    [(ngModel)]="qrDriverData.vehicle_type"
                    required
                    class="form-select"
                  >
                    <option value="car">🚗 Auto</option>
                    <option value="motorcycle">🏍️ Motorrad</option>
                    <option value="bicycle">🚲 Fahrrad</option>
                    <option value="scooter">🛵 Roller</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="qrLicensePlate">Kennzeichen (optional)</label>
                  <input
                    type="text"
                    id="qrLicensePlate"
                    name="qr_license_plate"
                    [(ngModel)]="qrDriverData.license_plate"
                    class="form-input"
                    placeholder="z.B. M-AB 1234"
                  />
                </div>

                <div class="qr-features">
                  <h4><i class="fa-solid fa-check-circle"></i> Vorteile:</h4>
                  <ul>
                    <li>✓ Keine E-Mail erforderlich</li>
                    <li>✓ Fahrer setzt eigenes Passwort</li>
                    <li>✓ QR-Code per WhatsApp teilbar</li>
                    <li>✓ Aktivierung in 2 Minuten</li>
                  </ul>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn btn-ghost" (click)="closeAddDriverModal()">
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    class="btn btn-success"
                    [disabled]="!qrForm.form.valid || isCreatingPendingDriver"
                    style="background: #4caf50 !important; color: white !important; border: none !important;"
                  >
                    <span *ngIf="!isCreatingPendingDriver" style="color: white !important; display: flex; align-items: center; gap: 8px;">
                      <i class="fa-solid fa-qrcode" style="color: white !important;"></i>
                      <span style="color: white !important;">QR-Code erstellen</span>
                    </span>
                    <span *ngIf="isCreatingPendingDriver" style="color: white !important; display: flex; align-items: center; gap: 8px;">
                      <i class="fa-solid fa-spinner fa-spin" style="color: white !important;"></i>
                      <span style="color: white !important;">Erstelle...</span>
                    </span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Schnellerfassung Tab -->
            <div *ngIf="addDriverTab === 'quick'">
              <div class="tab-info">
                <i class="fa-solid fa-info-circle"></i>
                <p>Fahrer wird sofort mit E-Mail und Passwort erstellt</p>
              </div>

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

      <!-- QR Code Display Modal -->
      <div class="modal" *ngIf="showQRCodeModal" (click)="closeQRCodeModal()">
        <div class="modal-content qr-display-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-qrcode"></i> QR-Code generiert</h3>
            <button class="close-btn" (click)="closeQRCodeModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="pendingDriverData">
            <div class="qr-success-banner">
              <i class="fa-solid fa-check-circle"></i>
              <p>Fahrer wurde erfolgreich erstellt!</p>
            </div>

            <div class="qr-code-display" *ngIf="qrCodeImageUrl">
              <img [src]="qrCodeImageUrl" alt="QR Code" />
            </div>

            <div class="driver-info-card">
              <div class="info-row">
                <label><i class="fa-solid fa-user"></i> Name:</label>
                <span>{{ pendingDriverData.driver.name }}</span>
              </div>
              <div class="info-row">
                <label><i class="fa-solid fa-id-badge"></i> Benutzername:</label>
                <span class="username-display">{{ pendingDriverData.driver.username }}</span>
              </div>
              <div class="info-row">
                <label><i class="fa-solid fa-car"></i> Fahrzeugtyp:</label>
                <span>{{ getVehicleTypeLabel(pendingDriverData.driver.vehicle_type) }}</span>
              </div>
              <div class="info-row">
                <label><i class="fa-solid fa-clock"></i> Gültig bis:</label>
                <span>{{ pendingDriverData.expires_at | date:'dd.MM.yyyy HH:mm' }}</span>
              </div>
            </div>

            <div class="qr-actions-grid">
              <button class="btn btn-primary" (click)="copyActivationLink()">
                <i class="fa-solid fa-copy"></i>
                <span>Link kopieren</span>
              </button>
              <button class="btn btn-success" (click)="shareViaWhatsApp()">
                <i class="fa-brands fa-whatsapp"></i>
                <span>WhatsApp</span>
              </button>
              <button class="btn btn-secondary" (click)="downloadQRCode()">
                <i class="fa-solid fa-download"></i>
                <span>Herunterladen</span>
              </button>
              <button class="btn btn-info" (click)="printQRCode()">
                <i class="fa-solid fa-print"></i>
                <span>Drucken</span>
              </button>
            </div>

            <div class="qr-instructions">
              <h4><i class="fa-solid fa-info-circle"></i> Nächste Schritte:</h4>
              <ol>
                <li>Teilen Sie den QR-Code mit dem Fahrer</li>
                <li>Fahrer scannt QR-Code mit Smartphone</li>
                <li>Fahrer setzt eigenes Passwort</li>
                <li>Fahrer kann sich direkt einloggen</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Driver Details Modal -->
      <div class="modal" *ngIf="showDriverDetailsModal" (click)="closeDriverDetailsModal()">
        <div class="modal-content driver-details-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-user"></i> {{ translate('drivers.driver_details') }}</h3>
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
                  <h4>{{ selectedDriverForDetails.name || translate('drivers.title') + ' ' + selectedDriverForDetails.id }}</h4>
                  <div class="driver-meta">
                    <span class="driver-email" *ngIf="selectedDriverForDetails.email">{{ selectedDriverForDetails.email }}</span>
                    <span class="driver-username" *ngIf="selectedDriverForDetails.username">{{ selectedDriverForDetails.username }}</span>
                    <span class="driver-phone" *ngIf="selectedDriverForDetails.phone">{{ selectedDriverForDetails.phone }}</span>
                  </div>
                </div>
                <div class="driver-status-badge">
                  <span class="status-dot" [class]="selectedDriverForDetails.current_status || selectedDriverForDetails.status"></span>
                  <span>{{ getStatusLabel(selectedDriverForDetails.current_status || selectedDriverForDetails.status) }}</span>
                </div>
              </div>

              <!-- Pending Activation Warning & Actions -->
              <div class="pending-activation-alert" *ngIf="selectedDriverForDetails.status === 'pending_activation' || selectedDriverForDetails.current_status === 'pending_activation'">
                <div class="alert-content">
                  <i class="fa-solid fa-hourglass-half"></i>
                  <div>
                    <strong>{{ translate('drivers.driver_waiting_activation') }}</strong>
                    <p>{{ translate('drivers.activation_description') }}</p>
                  </div>
                </div>
                <button class="btn btn-warning" (click)="showActivationQRCode(selectedDriverForDetails)">
                  <i class="fa-solid fa-qrcode"></i>
                  {{ translate('drivers.show_qr_code_again') }}
                </button>
              </div>

              <div class="driver-stats-grid">
                <div class="stat-item">
                  <i class="fa-solid fa-star"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.rating }}/5</span>
                    <span class="stat-label">{{ translate('drivers.rating') }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-truck"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.total_deliveries }}</span>
                    <span class="stat-label">{{ translate('drivers.deliveries') }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-euro-sign"></i>
                  <div class="stat-info">
                    <span class="stat-value">€{{ selectedDriverForDetails.total_earnings | number:'1.2-2' }}</span>
                    <span class="stat-label">{{ translate('drivers.earnings') }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fa-solid fa-calendar"></i>
                  <div class="stat-info">
                    <span class="stat-value">{{ selectedDriverForDetails.joined_date | date:'shortDate' }}</span>
                    <span class="stat-label">{{ translate('drivers.joined') }}</span>
                  </div>
                </div>
              </div>

              <div class="driver-vehicle-info" *ngIf="selectedDriverForDetails.vehicle_info">
                <h5><i class="fa-solid fa-car"></i> {{ translate('drivers.vehicle') }}</h5>
                <div class="vehicle-details">
                  <div class="vehicle-badge" [class]="selectedDriverForDetails.vehicle_type">
                    <i class="fa-solid" [ngClass]="getVehicleIcon(selectedDriverForDetails.vehicle_type)"></i>
                    {{ getVehicleTypeLabel(selectedDriverForDetails.vehicle_type) }}
                  </div>
                  <span class="vehicle-info-text">{{ formatVehicleInfo(selectedDriverForDetails.vehicle_info) }}</span>
                  <span class="license-plate" *ngIf="selectedDriverForDetails.license_plate">
                    <i class="fa-solid fa-id-card"></i> {{ selectedDriverForDetails.license_plate }}
                  </span>
                </div>
              </div>
            </div>

            <div class="driver-orders-section">
              <!-- Tabs -->
              <div class="tabs-container">
                <div class="tabs">
                  <button
                    class="tab-button"
                    [class.active]="activeTab === 'active'"
                    (click)="switchTab('active')"
                  >
                    <div class="tab-content">
                      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      <span class="tab-text-full">{{ translate('drivers.active_tour') }} ({{ activeOrdersCount }})</span>
                      <span class="tab-text-mobile">{{ translate('drivers.active_tour_mobile') }} ({{ activeOrdersCount }})</span>
                    </div>
                  </button>
                  <button
                    class="tab-button"
                    [class.active]="activeTab === 'all'"
                    (click)="switchTab('all')"
                  >
                    <div class="tab-content">
                      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span class="tab-text-full">{{ translate('drivers.all_orders') }} ({{ allOrdersCount }})</span>
                      <span class="tab-text-mobile">{{ translate('drivers.all_orders_mobile') }} ({{ allOrdersCount }})</span>
                    </div>
                  </button>
                </div>

                <div class="tab-info" *ngIf="activeTab === 'active'">
                  <small><i class="fa-solid fa-info-circle"></i> {{ translate('drivers.tour_optimization_info') }}</small>
                </div>
              </div>

              <div style="margin: 8px 0;" *ngIf="activeTab === 'active'">
                <button class="btn btn-outline-primary" (click)="toggleMap()">
                  <i class="fa-solid fa-map"></i> {{ showMap ? translate('drivers.hide_map') : translate('drivers.show_map') }}
                </button>
              </div>
              <div class="map-container" *ngIf="showMap && activeTab === 'active'" style="height: 300px; border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 12px;">
                <div id="manager-route-map" style="height: 100%; width: 100%;"></div>
              </div>

              <div class="orders-loading" *ngIf="isLoadingDriverOrders">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ translate('drivers.loading_orders') }}</span>
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
                        <span>{{ order.customer_name || translate('drivers.customer') }}</span>
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
                        <span>{{ translate('drivers.assigned') }}: {{ order.created_at | date:'short' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="modal-actions" *ngIf="currentOrders.length > 0">
                    <button class="btn btn-outline-primary" (click)="optimizeTourForSelectedDriver()" [disabled]="isOptimizing">
                      <span *ngIf="!isOptimizing"><i class="fa-solid fa-route"></i> {{ translate('drivers.optimize_tour') }}</span>
                      <span *ngIf="isOptimizing"><i class="fa-solid fa-spinner fa-spin"></i> {{ translate('drivers.optimizing') }}</span>
                    </button>
                    <button
                      *ngIf="activeTab === 'active'"
                      class="btn btn-success"
                      (click)="saveManualTour()"
                      [disabled]="!canSaveSequence || isSaving">
                      <span *ngIf="!isSaving">
                        <i class="fa-solid fa-save"></i> {{ translate('drivers.save_sequence') }}
                      </span>
                      <span *ngIf="isSaving">
                        <i class="fa-solid fa-spinner fa-spin"></i> {{ translate('drivers.saving') }}
                      </span>
                    </button>
                  </div>

                  <div class="no-orders" *ngIf="currentOrders.length === 0">
                    <i class="fa-solid fa-inbox"></i>
                    <span>{{ translate('drivers.no_active_orders') }}</span>
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
                        <span>{{ order.customer_name || translate('drivers.customer') }}</span>
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
                        <span>{{ translate('drivers.assigned') }}: {{ order.created_at | date:'short' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="no-orders" *ngIf="currentOrders.length === 0">
                    <i class="fa-solid fa-inbox"></i>
                    <span>{{ translate('drivers.no_orders_found') }}</span>
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

    .driver-card.pending_activation {
      border-left: 4px solid #ffa726;
      background: #fff8e1;
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

    /* Pending Activation Badge */
    .pending-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      background: linear-gradient(135deg, #ffa726, #fb8c00);
      color: white;
      border: 1px solid rgba(255, 167, 38, 0.5);
      box-shadow: 0 2px 8px rgba(255, 167, 38, 0.3);
      animation: pendingPulse 2s ease-in-out infinite;
    }

    .pending-badge i {
      font-size: var(--text-sm);
    }

    @keyframes pendingPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
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
    .status-dot.pending_activation { background: #ffa726; } /* Orange für wartend */
    .status-dot.on_break { background: #ffeb3b; } /* Gelb für Pause */

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

    /* Responsive button text */
    .btn-text-full {
      display: inline;
    }

    .btn-text-mobile {
      display: none;
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
      background: #4caf50 !important;
      color: white !important;
      font-weight: 600 !important;
    }

    .btn-success span,
    .btn-success i {
      color: white !important;
    }

    .btn-success:hover:not(:disabled) {
      background: #45a049 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .btn-warning {
      background: #ff9800;
      color: white !important;
      font-weight: 600;
    }

    .btn-warning:hover:not(:disabled) {
      background: #f57c00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .btn:focus {
      outline: 2px solid var(--color-primary-300);
      outline-offset: 2px;
    }

    /* Touch-friendly focus for mobile */
    @media (max-width: 768px) {
      .btn:focus {
        outline: 3px solid var(--color-primary-300);
        outline-offset: 1px;
      }
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
    /* Tablet Styles */
    @media (max-width: 1024px) and (min-width: 769px) {
      .quick-actions {
        gap: var(--space-3);
        flex-wrap: wrap;
        justify-content: center;
      }

      .btn {
        padding: var(--space-3) var(--space-3);
        font-size: var(--text-sm);
        min-width: 140px;
      }

      .btn-text-full {
        display: inline;
      }

      .btn-text-mobile {
        display: none;
      }
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .main-content-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-3);
        width: 100%;
        max-width: 320px;
        margin: 0 auto var(--space-4) auto;
      }

      .btn {
        padding: var(--space-4) var(--space-3);
        font-size: var(--text-base);
        min-height: 48px; /* Better touch target */
        justify-content: center;
        width: 100%;
        white-space: nowrap;
      }

      .btn-text-full {
        display: none;
      }

      .btn-text-mobile {
        display: inline;
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

    /* Pending Activation Alert */
    .pending-activation-alert {
      background: #fff3e0;
      border: 2px solid #ffa726;
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .pending-activation-alert .alert-content {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .pending-activation-alert .alert-content i {
      font-size: var(--text-2xl);
      color: #f57c00;
      margin-top: 2px;
    }

    .pending-activation-alert strong {
      display: block;
      color: #e65100;
      margin-bottom: var(--space-1);
      font-size: var(--text-base);
    }

    .pending-activation-alert p {
      margin: 0;
      color: #ef6c00;
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .driver-username {
      font-family: 'Courier New', monospace;
      background: #e3f2fd;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: #1976d2;
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

    /* Multi-Driver Optimization Modal Styles */
    :host ::ng-deep .optimization-summary {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    :host ::ng-deep .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      text-align: center;
    }

    :host ::ng-deep .stat-item {
      font-size: 0.9rem;
      color: #666;
    }

    :host ::ng-deep .stat-item strong {
      display: block;
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 0.25rem;
    }

    :host ::ng-deep .assignments-list {
      margin-bottom: 1rem;
    }

    :host ::ng-deep .assignments-list h3 {
      margin-bottom: 0.75rem;
      color: #333;
    }

    :host ::ng-deep .assignment-item {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: white;
    }

    :host ::ng-deep .assignment-header {
      margin-bottom: 0.5rem;
      color: #4aa96c;
      font-weight: 600;
    }

    :host ::ng-deep .route-sequence {
      font-family: monospace;
      font-size: 0.85rem;
      color: #666;
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 4px;
      word-break: break-all;
    }

    :host ::ng-deep .unassigned-warning {
      background: #fff3cd;
      color: #856404;
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid #ffeaa7;
      margin-top: 1rem;
    }

:host ::ng-deep .modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

:host ::ng-deep .geocoding-warning {
  background: #fff3cd;
  color: #856404;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Loading Modal Animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Base Styles */
:host ::ng-deep .modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 10000 !important;
}

:host ::ng-deep .modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

:host ::ng-deep .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

:host ::ng-deep .modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

:host ::ng-deep .modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

:host ::ng-deep .modal-close:hover {
  background: #e0e0e0;
  color: #333;
}

:host ::ng-deep .modal-body {
  padding: 1.5rem;
}

:host ::ng-deep .modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

:host ::ng-deep .route-details {
  margin-top: 0.5rem;
}

:host ::ng-deep .route-stats {
  margin-top: 0.25rem;
  color: #666;
}

:host ::ng-deep .optimization-log {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

:host ::ng-deep .optimization-log h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

:host ::ng-deep .log-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

:host ::ng-deep .log-entry:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

:host ::ng-deep .route-addresses {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.85rem;
}

:host ::ng-deep .address-item {
  margin-bottom: 0.25rem;
  padding: 0.25rem 0;
}

:host ::ng-deep .address-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

:host ::ng-deep .address-item strong {
  color: #4aa96c;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff8c00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Tab Styles for Add Driver Modal */
.tabs-container {
  display: flex;
  gap: 0;
  padding: 0 var(--space-6);
  border-bottom: 2px solid var(--color-border);
  margin-top: -1px;
}

.tab-btn {
  flex: 1;
  padding: var(--space-4) var(--space-6);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-muted);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.tab-btn:hover {
  color: var(--color-primary);
  background: var(--color-surface-2);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--color-surface);
}

.tab-btn i {
  font-size: var(--text-lg);
}

.tab-info {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  color: #1565c0;
  font-size: var(--text-sm);
}

.tab-info.qr-info {
  background: #e8f5e9;
  border-color: #81c784;
  color: #2e7d32;
}

.tab-info i {
  margin-top: 2px;
  font-size: var(--text-base);
}

.tab-info p {
  margin: 0;
  line-height: 1.5;
}

.form-hint {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.qr-features {
  background: #f1f8e9;
  border: 1px solid #aed581;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.qr-features h4 {
  margin: 0 0 var(--space-3) 0;
  color: #33691e;
  font-size: var(--text-base);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.qr-features ul {
  margin: 0;
  padding-left: var(--space-5);
  color: #558b2f;
  font-size: var(--text-sm);
}

.qr-features li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

/* QR Code Display Modal Styles */
.qr-display-modal {
  max-width: 550px;
}

.qr-success-banner {
  text-align: center;
  background: linear-gradient(135deg, #4caf50, #81c784);
  color: white;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.qr-success-banner i {
  font-size: 3rem;
  margin-bottom: var(--space-2);
  display: block;
}

.qr-success-banner p {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.qr-code-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-6);
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-display img {
  max-width: 100%;
  height: auto;
  border: 4px solid white;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.driver-info-card {
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.driver-info-card .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.driver-info-card .info-row:last-child {
  border-bottom: none;
}

.driver-info-card label {
  font-weight: 600;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.driver-info-card label i {
  color: var(--color-primary);
  width: 20px;
}

.driver-info-card span {
  color: var(--color-text);
  text-align: right;
}

.username-display {
  font-family: 'Courier New', monospace;
  background: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-weight: 700;
  color: var(--color-primary) !important;
  border: 2px solid var(--color-primary-200);
}

.qr-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.qr-actions-grid .btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  font-size: var(--text-sm);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.qr-actions-grid .btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.qr-actions-grid .btn i {
  font-size: var(--text-2xl);
}

.btn-secondary {
  background: var(--color-muted);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #616161;
}

.btn-info {
  background: #00bcd4;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #00acc1;
}

.qr-instructions {
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.qr-instructions h4 {
  margin: 0 0 var(--space-3) 0;
  color: #e65100;
  font-size: var(--text-base);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.qr-instructions ol {
  margin: 0;
  padding-left: var(--space-5);
  color: #ef6c00;
}

.qr-instructions li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
  font-size: var(--text-sm);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .tabs-container {
    padding: 0 var(--space-4);
  }

  .tab-btn {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
  }

  .qr-actions-grid {
    grid-template-columns: 1fr;
  }

  .qr-display-modal {
    max-width: 95%;
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
  private driversService = inject(DriversService);
  private restaurantsService = inject(RestaurantsService);
  private i18nService = inject(I18nService);
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
  isBulkOptimizing = false;
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
  addDriverTab: 'quick' | 'qrcode' = 'qrcode'; // QR Code als Standard
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

  // QR Code registration
  qrDriverData = {
    name: '',
    vehicle_type: 'car' as 'car' | 'motorcycle' | 'bicycle' | 'scooter',
    license_plate: ''
  };
  showQRCodeModal = false;
  qrCodeImageUrl = '';
  activationUrl = '';
  pendingDriverData: any = null;

  // Loading states
  isLoading = false;
  isAddingDriver = false;
  isCreatingPendingDriver = false;
  isBulkAssigning = false;

  translate(key: string, params?: { [key: string]: string | number }): string {
    return this.i18nService.translate(key, params);
  }

  ngOnInit() {
    this.loadDrivers();
    this.loadPendingOrders();
    this.loadDriverStats();

    // Auto-refresh every 1 minute (60 seconds) - balanced polling
    const refreshSub = interval(60000).subscribe(() => {
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
    this.qrDriverData = {
      name: '',
      vehicle_type: 'car',
      license_plate: ''
    };
  }

  // QR Code Driver Registration Methods
  createPendingDriver() {
    if (!this.qrDriverData.name || !this.qrDriverData.vehicle_type) {
      this.toastService.error('Fehler', 'Name und Fahrzeugtyp sind erforderlich');
      return;
    }

    this.isCreatingPendingDriver = true;

    this.http.post(`${environment.apiUrl}/drivers/create-pending`, this.qrDriverData)
      .subscribe({
        next: (response: any) => {
          this.isCreatingPendingDriver = false;
          this.toastService.success('Erfolg', 'Fahrer erstellt! QR-Code wird angezeigt.');
          this.closeAddDriverModal();
          this.openQRCodeModal(response);
          this.refreshData();
        },
        error: (error) => {
          this.isCreatingPendingDriver = false;
          console.error('Create pending driver error:', error);
          this.toastService.error('Fehler', error.error?.error || 'Fahrer konnte nicht erstellt werden');
        }
      });
  }

  openQRCodeModal(data: any) {
    this.pendingDriverData = data;
    this.activationUrl = data.activation_url;
    this.showQRCodeModal = true;
    
    // Generate QR Code image
    setTimeout(() => {
      this.generateQRCodeImage();
    }, 100);
  }

  closeQRCodeModal() {
    this.showQRCodeModal = false;
    this.pendingDriverData = null;
    this.qrCodeImageUrl = '';
    this.activationUrl = '';
  }

  async generateQRCodeImage() {
    try {
      const QRCode = await import('qrcode');
      this.qrCodeImageUrl = await QRCode.toDataURL(this.activationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      this.toastService.error('Fehler', 'QR-Code konnte nicht generiert werden');
    }
  }

  copyActivationLink() {
    if (this.activationUrl) {
      navigator.clipboard.writeText(this.activationUrl).then(() => {
        this.toastService.success('Erfolg', 'Link kopiert!');
      }).catch(() => {
        this.toastService.error('Fehler', 'Link konnte nicht kopiert werden');
      });
    }
  }

  shareViaWhatsApp() {
    if (this.pendingDriverData) {
      const driver = this.pendingDriverData.driver;
      const message = encodeURIComponent(
        `Hallo ${driver.name}!\n\n` +
        `Dein Fahrer-Account wurde erstellt.\n` +
        `Benutzername: ${driver.username}\n\n` +
        `Scanne diesen QR-Code oder nutze den Link zur Aktivierung:\n` +
        `${this.activationUrl}\n\n` +
        `Gültig bis: ${new Date(this.pendingDriverData.expires_at).toLocaleString('de-DE')}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  }

  downloadQRCode() {
    if (this.qrCodeImageUrl) {
      const link = document.createElement('a');
      link.download = `qr-code-${this.pendingDriverData?.driver?.username || 'driver'}.png`;
      link.href = this.qrCodeImageUrl;
      link.click();
    }
  }

  printQRCode() {
    if (this.qrCodeImageUrl && this.pendingDriverData) {
      const driver = this.pendingDriverData.driver;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR-Code - ${driver.name}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px; 
                }
                h1 { margin-bottom: 10px; font-size: 24px; }
                .info { margin: 30px 0; line-height: 2; font-size: 16px; }
                img { margin: 30px 0; border: 2px solid #000; }
                .footer { margin-top: 40px; font-size: 14px; color: #666; }
              </style>
            </head>
            <body>
              <h1>🚗 Fahrer-Aktivierung</h1>
              <div class="info">
                <div><strong>Name:</strong> ${driver.name}</div>
                <div><strong>Benutzername:</strong> ${driver.username}</div>
                <div><strong>Fahrzeugtyp:</strong> ${this.getVehicleTypeLabel(driver.vehicle_type)}</div>
                <div><strong>Gültig bis:</strong> ${new Date(this.pendingDriverData.expires_at).toLocaleString('de-DE')}</div>
              </div>
              <img src="${this.qrCodeImageUrl}" width="300" height="300" />
              <p style="font-size: 18px; margin: 20px 0;"><strong>Scannen Sie den QR-Code zur Aktivierung</strong></p>
              <div class="footer">
                <p>Bei Problemen kontaktieren Sie Ihren Manager</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  }

  // Show activation QR code for pending drivers
  async showActivationQRCode(driver: Driver) {
    try {
      // Get the activation token for this driver
      const response = await this.http.get<any>(
        `${environment.apiUrl}/drivers/${driver.id}/activation-token`
      ).toPromise();

      if (response && response.activation_url) {
        // Prepare data in the same format as createPendingDriver response
        const qrData = {
          driver: {
            id: driver.id,
            name: driver.name,
            username: driver.username,
            vehicle_type: driver.vehicle_type,
            status: driver.status
          },
          activation_url: response.activation_url,
          qr_code_data: response.activation_url,
          expires_at: response.expires_at
        };

        this.closeDriverDetailsModal();
        this.openQRCodeModal(qrData);
      }
    } catch (error: any) {
      console.error('Error getting activation token:', error);
      this.toastService.error('Fehler', error.error?.error || 'Aktivierungs-Token konnte nicht abgerufen werden');
    }
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
      available: this.translate('drivers.available'),
      busy: this.translate('drivers.busy'),
      offline: this.translate('drivers.offline'),
      on_delivery: this.translate('drivers.on_delivery'),
      pending_activation: this.translate('drivers.waiting_activation'),
      on_break: this.translate('drivers.break_status')
    };
    return labels[status] || status;
  }

  getVehicleTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      car: this.translate('drivers.vehicle_type.car'),
      motorcycle: this.translate('drivers.vehicle_type.motorcycle'),
      bicycle: this.translate('drivers.vehicle_type.bicycle'),
      scooter: this.translate('drivers.vehicle_type.scooter')
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

  formatVehicleInfo(vehicleInfo: any): string {
    if (!vehicleInfo) return '';
    
    // If it's already a string, return it as is
    if (typeof vehicleInfo === 'string') return vehicleInfo;
    
    // If it's an object, format it nicely
    if (typeof vehicleInfo === 'object') {
      const parts: string[] = [];
      
      // Handle normal vehicle info (make, model, color)
      if (vehicleInfo.make) parts.push(vehicleInfo.make);
      if (vehicleInfo.model) parts.push(vehicleInfo.model);
      if (vehicleInfo.color) parts.push(vehicleInfo.color);
      
      // Special case: if only license_plate is present in the object (QR code created drivers)
      // Don't display it here as it should be shown separately in the license_plate section
      if (parts.length === 0 && vehicleInfo.license_plate) {
        return ''; // Return empty string to avoid showing the JSON object
      }
      
      return parts.join(' ');
    }
    
    return '';
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
      return `${this.translate('drivers.on_delivery')} (${activeDeliveries})`;
    }
    return this.translate('drivers.on_delivery');
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
    return this.translate('drivers.offline');
  }

  // New assignment workflow methods
  selectDriverForAssignment(driver: Driver) {
    if (!this.isDriverAvailable(driver)) {
      this.toastService.info(this.translate('common.info'), this.translate('drivers.driver_busy_message'));
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

  optimizeMultiDriverRoutes() {
    if (this.isBulkOptimizing) return;

    this.isBulkOptimizing = true;

    // Get managed restaurants
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        const restaurantId = restaurants?.[0]?.restaurant_id;
        if (!restaurantId) {
          this.toastService.error('Fehler', 'Kein Restaurant gefunden');
          this.isBulkOptimizing = false;
          return;
        }

        // Get all available drivers for this restaurant
        const availableDriverIds = this.drivers
          .filter((d: Driver) => d.status === 'available' || d.status === 'busy')
          .map((d: Driver) => d.id);


        if (availableDriverIds.length === 0) {
          this.toastService.error('Fehler', `Keine verfügbaren Fahrer gefunden. ${this.drivers.length} Fahrer insgesamt, aber keiner mit Status 'available' oder 'busy'.`);
          this.isBulkOptimizing = false;
          return;
        }

        // Call multi-driver optimization API
        this.http.post(`${environment.apiUrl}/restaurants/${restaurantId}/optimize-multi-driver`, {
          driver_ids: availableDriverIds
        }).subscribe({
          next: (result: any) => {
            console.log('Multi-driver optimization result:', result);
            console.log('Assignments:', result.assignments?.length || 0);

            // Always show modal - even if no assignments
            this.showMultiDriverOptimizationModal(result);

            // Show additional toast if needed
            if (!result.assignments || result.assignments.length === 0) {
              if (result.geocoding_issues > 0) {
                this.toastService.warning('Hinweis', `${result.geocoding_issues} Bestellung(en) konnten nicht geocodiert werden. Details im Modal.`);
              } else if (result.orders_total === 0) {
                this.toastService.info('Hinweis', 'Keine bereitstehenden Bestellungen gefunden. Details im Modal.');
              } else {
                this.toastService.warning('Hinweis', 'Keine sinnvollen Zuweisungen gefunden. Details im Modal.');
              }
            }

            this.isBulkOptimizing = false;
          },
          error: (error) => {
            console.error('Multi-driver optimization error:', error);
            this.toastService.error('Fehler', `Multi-Optimierung fehlgeschlagen: ${error.error?.error || error.message}`);
            this.isBulkOptimizing = false;
          }
        });
      },
      error: () => {
        this.toastService.error('Fehler', 'Manager-Restaurant konnte nicht geladen werden');
        this.isBulkOptimizing = false;
      }
    });
  }

  private showMultiDriverOptimizationModal(result: any) {
    try {
      console.log('Creating modal...');
      const assignments = result.assignments || [];
      const totalDistance = Math.round((result.total_distance || 0) / 1000); // Convert to km
      const totalDuration = Math.round((result.total_duration || 0) / 60); // Convert to minutes

      console.log('Assignments for modal:', assignments.length);

      const modalHtml = `
      <div class="modal" id="multiOptimizationModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div class="modal-content" style="background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); max-height: 90vh; overflow-y: auto; max-width: 600px; width: 90%;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e0e0e0; background: #f8f9fa; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 1.25rem; color: #333;"><i class="fa-solid fa-route"></i> Multi-Driver Routen-Optimierung</h2>
            <button class="close-btn" onclick="window.closeMultiOptimizationModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="optimization-summary" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <div class="summary-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; text-align: center;">
                <div class="stat-item" style="font-size: 0.9rem; color: #666;">
                  <strong style="display: block; font-size: 1.5rem; color: #333; margin-bottom: 0.25rem;">${result.drivers_used}</strong> Fahrer eingesetzt
                </div>
                <div class="stat-item" style="font-size: 0.9rem; color: #666;">
                  <strong style="display: block; font-size: 1.5rem; color: #333; margin-bottom: 0.25rem;">${result.orders_assigned}/${result.orders_total}</strong> Bestellungen zugewiesen
                </div>
                <div class="stat-item" style="font-size: 0.9rem; color: #666;">
                  <strong style="display: block; font-size: 1.5rem; color: #333; margin-bottom: 0.25rem;">${totalDistance} km</strong> Gesamtstrecke
                </div>
                <div class="stat-item" style="font-size: 0.9rem; color: #666;">
                  <strong style="display: block; font-size: 1.5rem; color: #333; margin-bottom: 0.25rem;">${totalDuration} min</strong> Gesamtdauer
                </div>
              </div>
              ${result.geocoding_issues > 0 ? `
                <div class="geocoding-warning" style="background: #fff3cd; color: #856404; padding: 0.75rem; border-radius: 6px; border: 1px solid #ffeaa7; margin-top: 1rem; font-size: 0.9rem;">
                  <i class="fa-solid fa-exclamation-triangle"></i>
                  ${result.geocoding_issues} Bestellung(en) konnten nicht geocodiert werden und wurden übersprungen.
                </div>
              ` : ''}
            </div>

            <div class="assignments-list" style="margin-bottom: 1rem;">
              <h3 style="margin-bottom: 0.75rem; color: #333;">Routen-Zuweisungen:</h3>
              ${assignments.map((assignment: any, index: number) => `
                <div class="assignment-item" style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.75rem; margin-bottom: 1rem; background: white;">
                  <div class="assignment-header" style="margin-bottom: 0.75rem; color: #4aa96c; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>Fahrer ${index + 1}:</strong> ${assignment.route.orderIdsInSequence.length} Bestellungen
                      ${assignment.route.distanceMeters ? ` (${Math.round(assignment.route.distanceMeters / 1000)} km)` : ''}
                    </div>
                    <button class="toggle-map-btn" onclick="toggleDriverMap(${index})" style="padding: 0.25rem 0.5rem; border: 1px solid #4aa96c; border-radius: 4px; background: transparent; color: #4aa96c; cursor: pointer; font-size: 0.8rem;">
                      <i class="fa-solid fa-map"></i> Karte anzeigen
                    </button>
                  </div>
                  
                  <!-- Route Map Container -->
                  <div class="route-map-container" id="driverMap${index}" style="display: none; margin-bottom: 0.75rem;">
                    <div class="map-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <h4 style="margin: 0; color: #333; font-size: 0.9rem;">Route für Fahrer ${index + 1}</h4>
                      <button class="close-map-btn" onclick="toggleDriverMap(${index})" style="background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem;">&times;</button>
                    </div>
                    <div class="driver-route-map" id="driverRouteMap${index}" style="height: 300px; width: 100%; border: 1px solid #e0e0e0; border-radius: 4px;"></div>
                  </div>
                  
                  <div class="route-details" style="margin-top: 0.5rem;">
                    <div class="route-sequence" style="font-family: monospace; font-size: 0.85rem; color: #666; background: #f8f9fa; padding: 0.5rem; border-radius: 4px; word-break: break-all;">
                      <strong>Route:</strong> ${assignment.route.orderIdsInSequence.join(' → ')}
                    </div>
                    ${assignment.route.orderDetails ? `
                      <div class="route-addresses" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem;">
                        ${assignment.route.orderDetails.map((order: any, idx: number) => `
                          <div class="address-item" style="margin-bottom: 0.25rem; padding: 0.25rem 0;">
                            <strong style="color: #4aa96c; margin-right: 0.5rem;">${idx + 1}.</strong> ${order.address}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                    <div class="route-stats" style="margin-top: 0.25rem; color: #666;">
                      <small>
                        ${assignment.route.distanceMeters ? `Distanz: ${Math.round(assignment.route.distanceMeters / 1000)} km` : ''}
                        ${assignment.route.durationSeconds ? ` • Dauer: ${Math.round(assignment.route.durationSeconds / 60)} min` : ''}
                      </small>
                    </div>
                  </div>
                </div>
              `).join('')}

              <div class="optimization-log" style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #e0e0e0;">
                <h4 style="margin: 0 0 0.75rem 0; color: #333; font-size: 1rem;">Optimierung Details:</h4>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Gefundene Bestellungen:</strong> ${result.orders_total || 0}
                </div>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Geocodierte Adressen:</strong> ${result.orders_geocoded || 0}
                </div>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Zuweisungsprobleme:</strong> ${result.geocoding_issues || 0}
                </div>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Eingesetzte Fahrer:</strong> ${result.drivers_used || 0}
                </div>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Gesamtstrecke:</strong> ${result.total_distance ? Math.round(result.total_distance / 1000) + ' km' : 'N/A'}
                </div>
                <div class="log-entry" style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                  <strong>Gesamtdauer:</strong> ${result.total_duration ? Math.round(result.total_duration / 60) + ' min' : 'N/A'}
                </div>
              </div>
            </div>

            ${result.unassigned_jobs?.length > 0 ? `
              <div class="unassigned-warning" style="background: #fff3cd; color: #856404; padding: 0.75rem; border-radius: 6px; border: 1px solid #ffeaa7; margin-top: 1rem;">
                <i class="fa-solid fa-exclamation-triangle"></i>
                ${result.unassigned_jobs.length} Bestellungen konnten nicht zugewiesen werden
              </div>
            ` : ''}
          </div>
          <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #e0e0e0; background: #f8f9fa; border-radius: 0 0 8px 8px; display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="btn btn-ghost" onclick="window.closeMultiOptimizationModal()" style="padding: 0.5rem 1rem; border: 1px solid #e0e0e0; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; background: transparent; color: #666;">
              Abbrechen
            </button>
            <button class="btn btn-primary" onclick="window.applyMultiOptimization(${JSON.stringify(assignments).replace(/"/g, '&quot;')})" style="padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; background: linear-gradient(135deg, #ff8c00, #ff6b35); color: white;">
              Zuweisungen anwenden
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add global functions for map management
    (window as any).toggleDriverMap = (driverIndex: number) => {
      const mapContainer = document.getElementById(`driverMap${driverIndex}`);
      const toggleBtn = document.querySelector(`button[onclick="toggleDriverMap(${driverIndex})"]`);
      
      if (mapContainer && toggleBtn) {
        const isVisible = mapContainer.style.display !== 'none';
        mapContainer.style.display = isVisible ? 'none' : 'block';
        
        if (isVisible) {
          // Hide map and clean up
          toggleBtn.innerHTML = '<i class="fa-solid fa-map"></i> Karte anzeigen';
          if (this.driverMaps.has(driverIndex)) {
            const map = this.driverMaps.get(driverIndex);
            if (map) {
              map.remove();
              this.driverMaps.delete(driverIndex);
            }
          }
        } else {
          // Show map and initialize
          toggleBtn.innerHTML = '<i class="fa-solid fa-map"></i> Karte ausblenden';
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            this.initializeDriverMap(driverIndex, assignments[driverIndex]);
          }, 100);
        }
      }
    };

    (window as any).applyMultiOptimization = (assignments: any[]) => {
      this.applyMultiDriverOptimization(assignments);
      this.cleanupAllDriverMaps();
      const modal = document.getElementById('multiOptimizationModal');
      if (modal) {
        modal.remove();
      }
    };

    // Add cleanup function for modal close
    (window as any).closeMultiOptimizationModal = () => {
      this.cleanupAllDriverMaps();
      const modal = document.getElementById('multiOptimizationModal');
      if (modal) {
        modal.remove();
      }
    };

    console.log('Modal HTML created successfully');
    } catch (error) {
      console.error('Error creating modal:', error);
      this.toastService.error('Fehler', 'Modal konnte nicht angezeigt werden: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private applyMultiDriverOptimization(assignments: any[]) {
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants: any[]) => {
        const restaurantId = restaurants?.[0]?.restaurant_id;
        if (!restaurantId) return;

        this.http.post(`${environment.apiUrl}/restaurants/${restaurantId}/apply-multi-driver-optimization`, {
          assignments
        }).subscribe({
          next: (result: any) => {
            this.toastService.success('Erfolg', `Zuweisungen angewendet: ${result.orders_assigned} Bestellungen`);
            this.refreshData();
          },
          error: (error) => {
            console.error('Apply optimization error:', error);
            this.toastService.error('Fehler', 'Zuweisungen konnten nicht angewendet werden');
          }
        });
      }
    });
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

  private driverMaps: Map<number, any> = new Map();

  private async initializeDriverMap(driverIndex: number, assignment: any) {
    const mapContainer = document.getElementById(`driverRouteMap${driverIndex}`);
    if (!mapContainer) return;

    // Clean up existing map if it exists
    if (this.driverMaps.has(driverIndex)) {
      const existingMap = this.driverMaps.get(driverIndex);
      if (existingMap) {
        existingMap.remove();
        this.driverMaps.delete(driverIndex);
      }
    }

    // Ensure Leaflet is loaded
    const ensureLeaflet = (cb: () => void) => {
      if ((window as any).L) return cb();
      if (!document.querySelector('link[href*="leaflet"]')) {
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

    ensureLeaflet(() => {
      const L = (window as any).L;
      if (!L) return;

      // Clear existing map content completely
      mapContainer.innerHTML = '';

      // Get restaurant coordinates
      this.computeStartCoords().then(() => {
        const center: [number, number] = this.startCoords ? [this.startCoords.lat, this.startCoords.lon] : [49.5, 8.4];
        
        // Create new map instance
        const map = L.map(`driverRouteMap${driverIndex}`, {
          preferCanvas: false
        }).setView(center, 12);
        
        // Store map reference for cleanup
        this.driverMaps.set(driverIndex, map);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
          attribution: '© OpenStreetMap contributors' 
        }).addTo(map);

        const markers: any[] = [];
        const routePath: Array<[number, number]> = [];

        // Add restaurant marker
        if (this.startCoords) {
          const restaurantMarker = L.marker([this.startCoords.lat, this.startCoords.lon])
            .addTo(map)
            .bindPopup('<strong>Restaurant Start</strong>');
          markers.push(restaurantMarker);
          routePath.push([this.startCoords.lat, this.startCoords.lon]);
        }

        // Add order markers and build route
        const addOrderMarkers = async () => {
          if (assignment.route.orderDetails) {
            for (let i = 0; i < assignment.route.orderDetails.length; i++) {
              const order = assignment.route.orderDetails[i];
              try {
                const res: any = await this.http.get(`${environment.apiUrl}/geocoding/search?q=${encodeURIComponent(order.address)}`).toPromise();
                if (res && typeof res.latitude === 'number' && typeof res.longitude === 'number') {
                  const orderMarker = L.marker([res.latitude, res.longitude])
                    .addTo(map)
                    .bindPopup(`<strong>Bestellung #${order.id}</strong><br/>${order.address}`);
                  markers.push(orderMarker);
                  routePath.push([res.latitude, res.longitude]);
                }
              } catch (error) {
                console.warn(`Could not geocode address: ${order.address}`, error);
              }
            }
          }

          // Add route polyline
          if (routePath.length >= 2) {
            L.polyline(routePath, { 
              color: '#ff8c00', 
              weight: 4, 
              opacity: 0.85 
            }).addTo(map);
          }

          // Fit map to show all markers
          if (markers.length > 0) {
            const group = L.featureGroup(markers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds.pad(0.2));
            }
          }
        };

        addOrderMarkers();
      });
    });
  }

  private cleanupAllDriverMaps() {
    this.driverMaps.forEach((map, driverIndex) => {
      if (map) {
        map.remove();
      }
    });
    this.driverMaps.clear();
  }
}
