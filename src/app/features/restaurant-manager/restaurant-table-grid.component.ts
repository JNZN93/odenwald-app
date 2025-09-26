import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RestaurantTablesService, RestaurantTable, UpdateTableData } from '../../core/services/restaurant-tables.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { OrdersService, Order } from '../../core/services/orders.service';

interface GridCell {
  row: number;
  col: number;
  table?: RestaurantTable;
}

@Component({
  selector: 'app-restaurant-table-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="grid-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>🪑 Tisch-Grid Layout</h1>
          <p>Klicken Sie auf Tische zum Verschieben oder Doppelklick für Bestellungen</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="goBack()">
            ← Zurück zur Tischverwaltung
          </button>
          <button class="btn-primary" (click)="saveGridLayout()" [disabled]="isSaving || !hasChanges">
            💾 Layout speichern
          </button>
        </div>
      </div>

      <!-- Smart Mode Instructions -->
      <div class="instructions">
        <div class="instruction-item">
          <span class="instruction-icon">👆</span>
          <span>Einfacher Klick: Tisch für Verschieben auswählen</span>
        </div>
        <div class="instruction-item">
          <span class="instruction-icon">👆👆</span>
          <span>Doppelklick: Bestellungen anzeigen</span>
        </div>
        <div class="instruction-item">
          <span class="instruction-icon">➕</span>
          <span>Klick auf leere Zelle: Tisch platzieren</span>
        </div>
      </div>

      <div class="grid-layout">
        <!-- Table Selection Panel -->
        <div class="table-selection-panel">
          <h3>Verfügbare Tische</h3>
          <p>Wählen Sie einen Tisch aus und klicken Sie auf eine leere Zelle zum Platzieren</p>
          
          <div class="table-palette">
            <!-- Available tables for placement -->
            <div
              *ngFor="let table of availableTables$ | async"
              class="selectable-table"
              (click)="selectTable(table)"
              [class.selected]="selectedTable?.id === table.id"
            >
              <div class="table-icon">
                🪑
              </div>
              <div class="table-info">
                <span class="table-number">{{ table.table_number }}</span>
                <span class="table-capacity">{{ table.capacity }} Plätze</span>
              </div>
            </div>
          </div>

          <div class="grid-info">
            <h4>Grid-Info</h4>
            <p>Grid-Größe: {{ gridSize }}x{{ gridSize }}</p>
            <p>Platziert: {{ getPlacedTablesCount() }}</p>
            <p>Verfügbar: {{ (availableTables$ | async)?.length || 0 }}</p>
          </div>
        </div>

        <!-- Grid Area -->
        <div class="grid-area">
          <div class="grid-wrapper">
            <div
              class="grid-cell"
              *ngFor="let cell of gridCells; trackBy: trackByCell"
              [class.occupied]="cell.table"
              (click)="onCellClick(cell)"
            >
              <!-- Drop zone visual feedback for empty cells -->
              <div class="drop-zone" *ngIf="!cell.table">
                <div class="drop-indicator">
                  +
                </div>
              </div>

              <div class="cell-content" *ngIf="cell.table">
                <div class="placed-table" 
                     [class.selected]="selectedTable?.id === cell.table.id"
                     (click)="onTableClick(cell.table!, $event)"
                     (dblclick)="showTableOrders(cell.table!)">
                  <div class="table-content">
                    <div class="table-icon">🪑</div>
                    <div class="table-info">
                      <span class="table-number">{{ cell.table.table_number }}</span>
                      <span class="table-capacity">{{ cell.table.capacity }}</span>
                    </div>
                  </div>
                  
                  <!-- Orders button (appears when selected) -->
                  <button 
                    class="action-btn orders" 
                    *ngIf="selectedTable?.id === cell.table.id"
                    (click)="showTableOrders(cell.table!)" 
                    title="Bestellungen anzeigen">
                    <i class="fa-solid fa-receipt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Orders Modal -->
      <div class="modal-overlay" *ngIf="showOrdersModal" (click)="closeOrdersModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🪑 Tisch {{ selectedTableForOrders?.table_number }} - Bestellungen</h2>
            <button class="close-btn" (click)="closeOrdersModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <div *ngIf="tableOrdersLoading" class="loading">
              <p>Lade Bestellungen...</p>
            </div>
            
            <div *ngIf="!tableOrdersLoading && tableOrders.length === 0" class="no-orders">
              <p>Keine Bestellungen für diesen Tisch vorhanden.</p>
            </div>
            
            <div *ngIf="!tableOrdersLoading && tableOrders.length > 0" class="orders-list">
              <div *ngFor="let order of tableOrders" class="order-item">
                <div class="order-header">
                  <span class="order-id">Bestellung #{{ order.id }}</span>
                  <span class="order-status" [class]="'status-' + order.status">
                    {{ getStatusText(order.status) }}
                  </span>
                </div>
                <div class="order-details">
                  <p><strong>Erstellt:</strong> {{ formatDate(order.created_at) }}</p>
                  <p><strong>Gesamtpreis:</strong> {{ order.total_price | currency:'EUR':'symbol':'1.2-2' }}</p>
                  <p><strong>Zahlungsstatus:</strong> {{ getPaymentStatusText(order.payment_status) }}</p>
                  <div *ngIf="order.notes" class="order-notes">
                    <strong>Notizen:</strong> {{ order.notes }}
                  </div>
                </div>
                <div class="order-items">
                  <h4>Bestellte Artikel:</h4>
                  <ul>
                    <li *ngFor="let item of order.items">
                      {{ item.quantity }}x {{ item.name }} - {{ item.total_price | currency:'EUR':'symbol':'1.2-2' }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-container {
      max-width: 1400px;
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

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
      border: none;
    }

    .btn-primary {
      background: var(--color-primary-500);
      color: white;
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

    .btn-secondary {
      background: var(--color-gray-50);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
      background: var(--color-gray-100);
      border-color: var(--color-gray-300);
    }

    .instructions {
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      display: flex;
      gap: var(--space-6);
      justify-content: center;
      flex-wrap: wrap;
    }

    .instruction-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .instruction-icon {
      font-size: var(--text-lg);
      flex-shrink: 0;
    }

    .grid-layout {
      display: flex;
      gap: var(--space-6);
      background: white;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6);
    }

    .table-selection-panel {
      width: 300px;
      flex-shrink: 0;
    }

    .table-selection-panel h3 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .table-selection-panel p {
      color: var(--color-muted);
      margin-bottom: var(--space-4);
      font-size: var(--text-sm);
    }

    .table-palette {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      max-height: 400px;
      overflow-y: auto;
    }

    .selectable-table {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition);
    }

    .selectable-table:hover {
      background: var(--color-gray-100);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .selectable-table.selected {
      background: var(--color-primary-100);
      border-color: var(--color-primary-400);
      box-shadow: 0 0 0 2px var(--color-primary-200);
    }

    .table-icon {
      font-size: var(--text-xl);
      flex-shrink: 0;
    }

    .table-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .table-number {
      font-weight: 600;
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .table-capacity {
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .grid-info {
      padding: var(--space-4);
      background: var(--bg-light-green);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .grid-info h4 {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-3);
    }

    .grid-info p {
      margin: var(--space-1) 0;
      font-size: var(--text-sm);
      color: var(--color-muted);
    }

    .grid-area {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .grid-wrapper {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      grid-template-rows: repeat(10, 1fr);
      gap: 3px;
      background: #000;
      border: 3px solid #333;
      border-radius: var(--radius-lg);
      padding: 3px;
      width: 100%;
      max-width: 600px;
      aspect-ratio: 1;
      position: relative;
      overflow: hidden;
      z-index: 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .grid-cell {
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all var(--transition);
      cursor: pointer;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      border: 1px solid #e9ecef;
    }

    .grid-cell:hover {
      background: #e3f2fd;
      border-color: var(--color-primary-400);
      transform: scale(1.02);
    }

    .grid-cell.occupied {
      background: var(--color-primary-50);
      border-color: var(--color-primary-400);
    }

    .cell-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .placed-table {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: var(--space-2);
      background: var(--color-primary-500);
      color: white;
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      cursor: pointer;
      transition: all var(--transition);
    }

    .placed-table:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-sm);
    }

    .placed-table.selected {
      background: var(--color-warning-500);
      transform: scale(1.05);
      box-shadow: 0 0 0 3px var(--color-warning-200);
    }

    .table-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
    }


    .action-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 28px;
      height: 28px;
      border: 2px solid white;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      transition: all var(--transition);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 10;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
    }

    .action-btn.orders {
      background: var(--color-blue-600);
      color: white;
      border-color: var(--color-blue-700);
    }

    .action-btn.orders:hover {
      background: var(--color-blue-700);
      border-color: var(--color-blue-800);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px);
    }

    .action-btn.remove {
      background: var(--color-danger);
      color: white;
    }

    .action-btn.remove:hover {
      background: var(--color-danger-dark);
    }

    .placed-table .table-icon {
      font-size: var(--text-lg);
    }

    .placed-table .table-info {
      text-align: center;
    }

    .remove-btn {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-danger);
      color: white;
      border: none;
      font-size: var(--text-xs);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity var(--transition);
    }

    .grid-cell:hover .remove-btn {
      opacity: 1;
    }

    .drop-zone {
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity var(--transition);
      pointer-events: none;
      background: rgba(59, 130, 246, 0.2);
      border-radius: var(--radius-sm);
      border: 2px dashed var(--color-primary-400);
    }

    .grid-cell:hover .drop-zone {
      opacity: 1;
    }

    .drop-indicator {
      width: 24px;
      height: 24px;
      background: var(--color-primary-500);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: var(--text-lg);
    }

    .grid-cell.cdk-drop-list-dragging .drop-zone {
      opacity: 1;
      background: rgba(59, 130, 246, 0.3);
      border-color: var(--color-primary-500);
    }

    /* Click to place styles */
    .grid-cell:hover:not(.occupied) {
      background: var(--color-primary-50);
      border-color: var(--color-primary-300);
    }

    .grid-cell.occupied:hover {
      background: var(--color-primary-100);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .instructions {
        flex-direction: column;
        gap: var(--space-3);
      }

      .instruction-item {
        justify-content: center;
      }

      .grid-layout {
        flex-direction: column;
      }

      .table-selection-panel {
        width: 100%;
      }

      .grid-wrapper {
        max-width: 500px;
      }
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .grid-container {
        padding: var(--space-4);
      }

      .grid-layout {
        padding: var(--space-4);
      }

      .grid-wrapper {
        max-width: 100%;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
      }
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

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
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

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--text-xl);
      cursor: pointer;
      color: var(--color-muted);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition);
    }

    .close-btn:hover {
      background: var(--color-gray-100);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--space-6);
      overflow-y: auto;
      flex: 1;
    }

    .loading, .no-orders {
      text-align: center;
      padding: var(--space-8);
      color: var(--color-muted);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .order-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      background: var(--color-gray-50);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .order-id {
      font-weight: 600;
      color: var(--color-text);
    }

    .order-status {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-pending { background: var(--color-warning-100); color: var(--color-warning-700); }
    .status-confirmed { background: var(--color-blue-100); color: var(--color-blue-700); }
    .status-preparing { background: var(--color-orange-100); color: var(--color-orange-700); }
    .status-ready { background: var(--color-green-100); color: var(--color-green-700); }
    .status-served { background: var(--color-purple-100); color: var(--color-purple-700); }
    .status-paid { background: var(--color-green-100); color: var(--color-green-700); }

    .order-details {
      margin-bottom: var(--space-3);
    }

    .order-details p {
      margin: var(--space-1) 0;
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .order-notes {
      margin-top: var(--space-2);
      padding: var(--space-2);
      background: white;
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-primary-400);
    }

    .order-items h4 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
    }

    .order-items ul {
      margin: 0;
      padding-left: var(--space-4);
    }

    .order-items li {
      font-size: var(--text-sm);
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }
  `]
})
export class RestaurantTableGridComponent implements OnInit {
  private tablesService = inject(RestaurantTablesService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private ordersService = inject(OrdersService);
  private router = inject(Router);

  // Grid configuration
  gridSize = 10;
  gridCells: GridCell[] = [];
  placedTables: RestaurantTable[] = [];
  availableTables$!: Observable<RestaurantTable[]>;

  // State
  isSaving = false;
  hasChanges = false;
  selectedTable: RestaurantTable | null = null;
  originalGridState: Map<string, {row: number, col: number}> = new Map();

  // Smart mode - no separate modes needed

  // Table orders modal
  showOrdersModal = false;
  selectedTableForOrders: RestaurantTable | null = null;
  tableOrders: Order[] = [];
  tableOrdersLoading = false;
  currentRestaurantId: string | null = null;

  ngOnInit() {
    this.initializeGrid();
    this.loadTables();
  }

  private initializeGrid() {
    this.gridCells = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.gridCells.push({
          row,
          col
        });
      }
    }
  }

  private loadTables() {
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants) => {
        if (restaurants?.length > 0) {
          this.loadTablesForRestaurant(Number(restaurants[0].restaurant_id));
        }
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
        this.toastService.error('Fehler', 'Restaurants konnten nicht geladen werden');
      }
    });
  }

  private loadTablesForRestaurant(restaurantId: number) {
    this.currentRestaurantId = restaurantId.toString();
    this.availableTables$ = this.tablesService.getTables(restaurantId).pipe(
      map(tables => {
        // Clear current grid state
        this.gridCells.forEach(cell => cell.table = undefined);
        this.placedTables = [];

        // Separate placed and available tables
        const availableTables: RestaurantTable[] = [];

        tables.forEach(table => {
          if (table.grid_row !== null && table.grid_row !== undefined &&
              table.grid_col !== null && table.grid_col !== undefined &&
              table.grid_row >= 0 && table.grid_row < this.gridSize &&
              table.grid_col >= 0 && table.grid_col < this.gridSize) {
            // Table is placed in grid
            this.placeTableInGrid(table, table.grid_row, table.grid_col);
            if (!this.placedTables.find(t => t.id === table.id)) {
              this.placedTables.push(table);
            }
            this.originalGridState.set(table.id.toString(), { row: table.grid_row, col: table.grid_col });
          } else {
            // Table is available for placement
            availableTables.push(table);
          }
        });

        return availableTables;
      })
    );
  }

  private placeTableInGrid(table: RestaurantTable, row: number, col: number) {
    const cellIndex = row * this.gridSize + col;
    if (cellIndex < this.gridCells.length) {
      this.gridCells[cellIndex].table = table;
    }
  }

  selectTable(table: RestaurantTable) {
    this.selectedTable = table;
  }

  onCellClick(cell: GridCell) {
    if (cell.table) {
      // Clicking on a table - handled by onTableClick
      return;
    }

    // Clicking on empty cell
    if (this.selectedTable) {
      // Move the selected table to the new position
      this.moveTableToPosition(this.selectedTable, cell.row, cell.col);
      this.selectedTable = null;
    } else {
      // No table selected - show hint
      this.toastService.warning('Hinweis', 'Wählen Sie einen Tisch aus der Liste oder klicken Sie auf einen platzierten Tisch');
    }

    // Force change detection
    this.gridCells = [...this.gridCells];
  }

  removeTableFromGrid(table: RestaurantTable) {
    // Find and remove from grid
    const cellIndex = this.gridCells.findIndex(cell => cell.table?.id === table.id);
    if (cellIndex >= 0) {
      this.gridCells[cellIndex].table = undefined;
      this.hasChanges = true;
      
      // Force change detection
      this.gridCells = [...this.gridCells];
    }
  }

  private updateAvailableTables() {
    // Get current restaurant and reload tables
    this.restaurantManagerService.getManagedRestaurants().subscribe({
      next: (restaurants) => {
        if (restaurants?.length > 0) {
          this.loadTablesForRestaurant(Number(restaurants[0].restaurant_id));
        }
      }
    });
  }

  async saveGridLayout() {
    this.isSaving = true;
    this.loadingService.start('save-grid');

    try {
      // Prepare updates for all placed tables
      const updatePromises: Promise<any>[] = [];

      // Update placed tables with new positions
      this.gridCells.forEach((cell, index) => {
        if (cell.table) {
          const updateData: UpdateTableData = {
            grid_row: cell.row,
            grid_col: cell.col
          };
          updatePromises.push(
            this.tablesService.updateTable(cell.table!.id, updateData).toPromise()
          );
        }
      });

      // Clear grid positions for tables that were removed
      const currentPlacedTableIds = new Set(this.placedTables.map(t => t.id));
      const originalPlacedTableIds = Array.from(this.originalGridState.keys()).map(id => parseInt(id));

      originalPlacedTableIds.forEach(tableId => {
        if (!currentPlacedTableIds.has(tableId)) {
          // Table was removed from grid
          const updateData: UpdateTableData = {
            grid_row: undefined,
            grid_col: undefined
          };
          updatePromises.push(
            this.tablesService.updateTable(tableId, updateData).toPromise()
          );
        }
      });

      await Promise.all(updatePromises);

      this.toastService.success('Erfolg', 'Grid-Layout wurde gespeichert');
      this.hasChanges = false;

      // Update original state
      this.originalGridState.clear();
      this.gridCells.forEach(cell => {
        if (cell.table) {
          this.originalGridState.set(cell.table!.id.toString(), { row: cell.row, col: cell.col });
        }
      });

    } catch (error: any) {
      console.error('Error saving grid layout:', error);
      this.toastService.error('Fehler', 'Grid-Layout konnte nicht gespeichert werden');
    } finally {
      this.isSaving = false;
      this.loadingService.stop('save-grid');
    }
  }

  goBack() {
    this.router.navigate(['/restaurant-manager/tables']);
  }

  trackByCell(index: number, cell: GridCell): string {
    return `${cell.row}-${cell.col}`;
  }

  getPlacedTablesCount(): number {
    return this.gridCells.filter(cell => cell.table).length;
  }

  // Smart mode table interaction
  onTableClick(table: RestaurantTable, event: MouseEvent) {
    // Prevent double-click from triggering single click
    if (event.detail === 2) {
      return;
    }

    if (this.selectedTable && this.selectedTable.id === table.id) {
      // Clicking on the same selected table - deselect it
      this.selectedTable = null;
    } else {
      // Select this table for repositioning
      this.selectedTable = table;
    }
    
    // Force change detection to update visual state
    this.gridCells = [...this.gridCells];
  }

  moveTableToPosition(table: RestaurantTable, newRow: number, newCol: number) {
    // Find and clear the current position
    const currentCellIndex = this.gridCells.findIndex(cell => cell.table?.id === table.id);
    if (currentCellIndex >= 0) {
      this.gridCells[currentCellIndex].table = undefined;
    }

    // Place table in new position
    this.placeTableInGrid(table, newRow, newCol);
    this.hasChanges = true;
  }

  // Table orders modal methods
  showTableOrders(table: RestaurantTable) {
    if (!this.currentRestaurantId) {
      this.toastService.error('Fehler', 'Restaurant ID nicht verfügbar');
      return;
    }

    this.selectedTableForOrders = table;
    this.showOrdersModal = true;
    this.loadTableOrders(table.id.toString());
  }

  closeOrdersModal() {
    this.showOrdersModal = false;
    this.selectedTableForOrders = null;
    this.tableOrders = [];
  }

  loadTableOrders(tableId: string) {
    if (!this.currentRestaurantId) return;

    this.tableOrdersLoading = true;
    
    // Debug: Log the parameters being sent
    console.log('Loading table orders for:', {
      restaurantId: this.currentRestaurantId,
      tableId: tableId,
      tableNumber: this.selectedTableForOrders?.table_number
    });

    // Try with table_number first, as this is how orders are typically linked
    const tableNumber = this.selectedTableForOrders?.table_number?.toString();
    
    this.ordersService.getTableOrders(this.currentRestaurantId, tableNumber).subscribe({
      next: (orders) => {
        console.log('Loaded orders for table:', tableNumber, orders);
        this.tableOrders = orders;
        this.tableOrdersLoading = false;
      },
      error: (error) => {
        console.error('Error loading table orders:', error);
        this.toastService.error('Fehler', 'Bestellungen konnten nicht geladen werden');
        this.tableOrdersLoading = false;
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'preparing': 'In Vorbereitung',
      'ready': 'Bereit',
      'served': 'Serviert',
      'paid': 'Bezahlt',
      'open': 'Offen',
      'in_progress': 'In Bearbeitung',
      'out_for_delivery': 'Unterwegs',
      'delivered': 'Geliefert',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  }

  getPaymentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Ausstehend',
      'paid': 'Bezahlt',
      'failed': 'Fehlgeschlagen'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

