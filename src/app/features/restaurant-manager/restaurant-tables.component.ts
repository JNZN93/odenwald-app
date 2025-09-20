import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RestaurantTablesService, RestaurantTable, CreateTableData, UpdateTableData } from '../../core/services/restaurant-tables.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import * as QRCode from 'qrcode';

// QR Code Generation (Browser-native)
interface QRCodeOptions {
  text: string;
  width?: number;
  height?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: number;
}

@Component({
  selector: 'app-restaurant-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="tables-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>🪑 Tischverwaltung</h1>
          <p>Verwalten Sie die Tische in Ihrem Restaurant</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()" [disabled]="isLoading">
            ➕ Neuer Tisch
          </button>
        </div>
      </div>

      <!-- Tables Grid -->
      <div class="tables-section">
        <div class="tables-grid" *ngIf="tables$ | async as tables">
          <div
            *ngFor="let table of tables"
            class="table-card"
            [class.inactive]="!table.is_active"
          >
            <div class="table-header">
              <h3>Tisch {{ table.table_number }}</h3>
              <span class="table-status" [class.active]="table.is_active">
                {{ table.is_active ? '🟢 Aktiv' : '🔴 Inaktiv' }}
              </span>
            </div>

            <div class="table-info">
              <div class="info-item">
                <span class="label">Kapazität:</span>
                <span class="value">{{ table.capacity }} Personen</span>
              </div>
              <div class="info-item">
                <span class="label">Standort:</span>
                <span class="value">{{ getLocationText(table.location) }}</span>
              </div>
            </div>

            <div class="table-actions">
              <button class="btn-secondary" (click)="editTable(table)" title="Bearbeiten">
                ✏️ Bearbeiten
              </button>
              <button
                class="btn-secondary"
                (click)="toggleTable(table)"
                [title]="table.is_active ? 'Deaktivieren' : 'Aktivieren'"
              >
                {{ table.is_active ? '🔴 Deaktivieren' : '🟢 Aktivieren' }}
              </button>
              <button class="btn-secondary" (click)="showQRCode(table)" title="QR-Code anzeigen">
                📱 QR-Code
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="tables.length === 0" class="empty-state">
            <div class="empty-icon">🪑</div>
            <h3>Keine Tische vorhanden</h3>
            <p>Erstellen Sie Ihren ersten Tisch, um Tischangebote zu ermöglichen.</p>
            <button class="btn-primary" (click)="openCreateModal()">
              ➕ Ersten Tisch erstellen
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingTable ? 'Tisch bearbeiten' : 'Neuer Tisch' }}</h3>
            <button class="close-btn" (click)="closeModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="saveTable()" #tableForm="ngForm">
            <div class="form-group">
              <label for="table_number">Tischnummer *</label>
              <input
                id="table_number"
                type="text"
                [(ngModel)]="tableFormData.table_number"
                name="table_number"
                required
                placeholder="z.B. 1, A5, Bar-3"
              >
            </div>

            <div class="form-group">
              <label for="capacity">Kapazität *</label>
              <input
                id="capacity"
                type="number"
                [(ngModel)]="tableFormData.capacity"
                name="capacity"
                required
                min="1"
                max="20"
                placeholder="Anzahl Personen"
              >
            </div>

            <div class="form-group">
              <label for="location">Standort *</label>
              <select
                id="location"
                [(ngModel)]="tableFormData.location"
                name="location"
                required
              >
                <option value="indoor">Drinnen</option>
                <option value="outdoor">Draußen</option>
                <option value="bar">Bar</option>
                <option value="vip">VIP-Bereich</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">
                Abbrechen
              </button>
              <button type="submit" class="btn-primary" [disabled]="!tableForm.valid || isSaving">
                {{ isSaving ? 'Speichere...' : (editingTable ? 'Aktualisieren' : 'Erstellen') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- QR Code Modal -->
      <div class="modal-overlay" *ngIf="showQRModal" (click)="closeQRModal()">
        <div class="modal qr-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>QR-Code für Tisch {{ selectedTable?.table_number }}</h3>
            <button class="close-btn" (click)="closeQRModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedTable">
            <div class="qr-code-container">
              <div class="qr-placeholder">
                <img
                  *ngIf="selectedTable.qr_code"
                  [src]="generateQRCodeImage(selectedTable.qr_code!)"
                  alt="QR Code"
                  class="qr-image"
                />
                <div class="qr-text">{{ selectedTable.qr_code || 'QR-Code wird generiert...' }}</div>
                <p class="qr-hint">Scannen für Tischangebot</p>
              </div>
            </div>

            <div class="qr-actions">
              <button class="btn-secondary" (click)="downloadQR()">
                📥 Herunterladen
              </button>
              <button class="btn-secondary" (click)="printQR()">
                🖨️ Drucken
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tables-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      padding: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-muted);
      margin: 0;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-500);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .tables-section {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
    }

    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
    }

    .table-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: white;
      transition: all var(--transition);
    }

    .table-card:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-2px);
    }

    .table-card.inactive {
      opacity: 0.6;
      border-color: var(--color-gray-300);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .table-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .table-status {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: 600;
    }

    .table-status.active {
      background: var(--color-success-50);
      color: var(--color-success);
    }

    .table-info {
      margin-bottom: var(--space-4);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      font-weight: 500;
      color: var(--color-text);
    }

    .info-item .value {
      color: var(--color-muted);
    }

    .table-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      padding: var(--space-2) var(--space-3);
      background: var(--color-gray-50);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition);
    }

    .btn-secondary:hover {
      background: var(--color-gray-100);
      border-color: var(--color-gray-300);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--space-12);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      color: var(--color-muted);
      margin-bottom: var(--space-4);
    }

    /* Modal Styles */
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

    .modal {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-gray-50);
    }

    .modal-header h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      font-size: var(--text-lg);
      padding: var(--space-1);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
      flex: 1;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      transition: border-color var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px var(--color-primary-50);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    /* QR Modal */
    .qr-modal {
      max-width: 400px;
    }

    .qr-code-container {
      text-align: center;
      margin-bottom: var(--space-4);
    }

    .qr-placeholder {
      padding: var(--space-6);
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      text-align: center;
    }

    .qr-image {
      max-width: 200px;
      height: auto;
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
      box-shadow: var(--shadow-sm);
    }

    .qr-text {
      font-family: monospace;
      font-size: var(--text-sm);
      color: var(--color-text);
      word-break: break-all;
      margin-bottom: var(--space-2);
    }

    .qr-hint {
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .qr-actions {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    @media (max-width: 768px) {
      .tables-container {
        padding: var(--space-4);
      }

      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .tables-grid {
        grid-template-columns: 1fr;
      }

      .table-actions {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
      }

      .qr-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RestaurantTablesComponent implements OnInit {
  private tablesService = inject(RestaurantTablesService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  // State
  tables$!: Observable<RestaurantTable[]>;
  isLoading = false;
  showModal = false;
  showQRModal = false;
  editingTable: RestaurantTable | null = null;
  selectedTable: RestaurantTable | null = null;
  isSaving = false;

  // Form data
  tableFormData: CreateTableData & UpdateTableData = {
    table_number: '',
    capacity: 4,
    location: 'indoor'
  };

  // QR Code cache
  private qrCodeCache = new Map<string, string>();

  ngOnInit() {
    this.loadTables();
  }

  loadTables() {
    this.isLoading = true;
    this.loadingService.start('tables');

    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants) => {
        if (restaurants?.length > 0) {
          this.tables$ = this.tablesService.getTables(Number(restaurants[0].restaurant_id));
          this.tables$.subscribe({
            next: () => {
              this.loadingService.stop('tables');
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading tables:', error);
              this.toastService.error('Fehler', 'Tische konnten nicht geladen werden');
              this.loadingService.stop('tables');
              this.isLoading = false;
            }
          });
        } else {
          this.loadingService.stop('tables');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
        this.toastService.error('Fehler', 'Restaurants konnten nicht geladen werden');
        this.loadingService.stop('tables');
        this.isLoading = false;
      }
    });
  }

  openCreateModal() {
    this.editingTable = null;
    this.tableFormData = {
      table_number: '',
      capacity: 4,
      location: 'indoor'
    };
    this.showModal = true;
  }

  editTable(table: RestaurantTable) {
    this.editingTable = table;
    this.tableFormData = {
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingTable = null;
    this.tableFormData = {
      table_number: '',
      capacity: 4,
      location: 'indoor'
    };
  }

  async saveTable() {
    if (!this.tableFormData.table_number || !this.tableFormData.capacity) {
      this.toastService.error('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    this.isSaving = true;
    this.loadingService.start('save-table');

    try {
      const restaurants = await this.restaurantManagerService.getManagedRestaurants().toPromise();
      if (!restaurants?.length) {
        throw new Error('Kein Restaurant gefunden');
      }

      const restaurantId = Number(restaurants[0].restaurant_id);

      if (this.editingTable) {
        // Update existing table
        await this.tablesService.updateTable(this.editingTable.id, this.tableFormData).toPromise();
        this.toastService.success('Erfolg', 'Tisch wurde aktualisiert');
      } else {
        // Create new table
        await this.tablesService.createTable(restaurantId, this.tableFormData).toPromise();
        this.toastService.success('Erfolg', 'Tisch wurde erstellt');
      }

      this.closeModal();
      this.loadTables(); // Reload tables

    } catch (error: any) {
      console.error('Error saving table:', error);
      this.toastService.error('Fehler', error.error?.error || 'Tisch konnte nicht gespeichert werden');
    } finally {
      this.isSaving = false;
      this.loadingService.stop('save-table');
    }
  }

  async toggleTable(table: RestaurantTable) {
    try {
      await this.tablesService.toggleActive(table.id).toPromise();
      this.toastService.success('Erfolg', `Tisch ${table.table_number} wurde ${table.is_active ? 'deaktiviert' : 'aktiviert'}`);
      this.loadTables(); // Reload tables
    } catch (error: any) {
      console.error('Error toggling table:', error);
      this.toastService.error('Fehler', 'Tisch-Status konnte nicht geändert werden');
    }
  }

  showQRCode(table: RestaurantTable) {
    this.selectedTable = table;
    this.showQRModal = true;
  }

  closeQRModal() {
    this.showQRModal = false;
    this.selectedTable = null;
  }

  downloadQR() {
    if (!this.selectedTable?.qr_code) {
      this.toastService.error('Fehler', 'QR-Code nicht verfügbar');
      return;
    }

    try {
      // Create QR code image
      const qrImageUrl = this.generateQRCodeImage(this.selectedTable.qr_code);

      // Create download link
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `tisch-${this.selectedTable.table_number}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toastService.success('Erfolg', 'QR-Code heruntergeladen');
    } catch (error) {
      console.error('QR download failed:', error);
      this.toastService.error('Fehler', 'QR-Code Download fehlgeschlagen');
    }
  }

  printQR() {
    if (!this.selectedTable?.qr_code) {
      this.toastService.error('Fehler', 'QR-Code nicht verfügbar');
      return;
    }

    try {
      // Create QR code image
      const qrImageUrl = this.generateQRCodeImage(this.selectedTable.qr_code);

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR-Code für Tisch ${this.selectedTable.table_number}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                h1 { color: #333; }
                img { max-width: 300px; margin: 20px 0; }
                .info { font-size: 14px; color: #666; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>QR-Code für Tisch ${this.selectedTable.table_number}</h1>
              <img src="${qrImageUrl}" alt="QR Code" />
              <div class="info">
                <p>Scannen für Tischangebot</p>
                <p>Restaurant: ${this.selectedTable.restaurant_id}</p>
                <p>Generiert am: ${new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      this.toastService.success('Info', 'Druckdialog geöffnet');
    } catch (error) {
      console.error('QR print failed:', error);
      this.toastService.error('Fehler', 'QR-Code Druck fehlgeschlagen');
    }
  }

  public generateQRCodeImage(qrData: string): string {
    // Check cache first
    if (this.qrCodeCache.has(qrData)) {
      return this.qrCodeCache.get(qrData)!;
    }

    try {
      // Generate real QR code with proper URL
      const fullUrl = `${window.location.origin}${qrData}`;
      console.log('Generating QR code for URL:', fullUrl);
      
      // Create real QR code synchronously (using canvas)
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, fullUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
        }
      });
      
      const qrCodeUrl = canvas.toDataURL('image/png');
      this.qrCodeCache.set(qrData, qrCodeUrl);
      return qrCodeUrl;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      return this.createFallbackQRCodeImage(qrData);
    }
  }

  private createSimpleQRCodeImage(text: string): string {
    // Create a canvas-based QR code (simplified version)
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 300);

    // Black border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 260, 260);

    // Corner markers (simplified QR code pattern)
    ctx.fillStyle = 'black';

    // Top-left corner
    ctx.fillRect(30, 30, 60, 20);
    ctx.fillRect(30, 30, 20, 60);
    ctx.fillRect(70, 50, 20, 20);

    // Top-right corner
    ctx.fillRect(210, 30, 60, 20);
    ctx.fillRect(250, 30, 20, 60);

    // Bottom-left corner
    ctx.fillRect(30, 250, 60, 20);
    ctx.fillRect(30, 210, 20, 60);

    // Center text
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TISCH', 150, 140);
    ctx.fillText(text.split('/').pop() || 'QR', 150, 160);
    ctx.fillText('Scannen zum', 150, 180);
    ctx.fillText('Bestellen', 150, 200);

    return canvas.toDataURL('image/png');
  }

  private createFallbackQRCodeImage(text: string): string {
    // Create a simple text-based fallback
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 300, 300);

    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', 150, 120);
    ctx.fillText('für Tischbestellung', 150, 145);
    ctx.fillText(text.substring(text.lastIndexOf('/') + 1), 150, 170);
    ctx.fillText('Scannen zum Bestellen', 150, 195);

    // Simple border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 260, 260);

    return canvas.toDataURL('image/png');
  }

  getLocationText(location: string): string {
    const locationMap: { [key: string]: string } = {
      'indoor': 'Drinnen',
      'outdoor': 'Draußen',
      'bar': 'Bar',
      'vip': 'VIP-Bereich'
    };
    return locationMap[location] || location;
  }
}
