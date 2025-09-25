import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RestaurantTablesService, RestaurantTable, UpdateTableData } from '../../core/services/restaurant-tables.service';
import { RestaurantManagerService } from '../../core/services/restaurant-manager.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

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
          <p>Verschieben Sie Ihre Tische im Grid-System</p>
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

      <div class="grid-layout">
        <!-- Table Selection Panel -->
        <div class="table-selection-panel">
          <h3>Verfügbare Tische</h3>
          <p>Klicken Sie auf einen Tisch und dann auf eine Zelle im Grid</p>
          <div class="table-palette">
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
                <div class="placed-table">
                  <div class="table-icon">🪑</div>
                  <div class="table-info">
                    <span class="table-number">{{ cell.table.table_number }}</span>
                    <span class="table-capacity">{{ cell.table.capacity }}</span>
                  </div>
                  <button class="remove-btn" (click)="removeTableFromGrid(cell.table!)">
                    ✕
                  </button>
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
      cursor: grab;
    }

    .placed-table:active {
      cursor: grabbing;
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
  `]
})
export class RestaurantTableGridComponent implements OnInit {
  private tablesService = inject(RestaurantTablesService);
  private restaurantManagerService = inject(RestaurantManagerService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
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
    if (!this.selectedTable) {
      this.toastService.warning('Warnung', 'Bitte wählen Sie zuerst einen Tisch aus');
      return;
    }

    if (cell.table) {
      this.toastService.warning('Warnung', 'Diese Zelle ist bereits belegt');
      return;
    }

    // Place selected table in the clicked cell
    cell.table = this.selectedTable;
    this.hasChanges = true;
    this.selectedTable = null;

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
}

