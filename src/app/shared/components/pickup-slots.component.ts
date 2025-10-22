import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

export interface PickupSlot {
  type: 'asap' | 'scheduled';
  label: string;
  value: string;
  available: boolean;
  estimated_time?: string;
}

@Component({
  selector: 'app-pickup-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pickup-slots-container">
      <div class="slots-header">
        <h3>Abholzeit wählen</h3>
        <p class="slots-description">Wählen Sie, wann Sie Ihre Bestellung abholen möchten</p>
      </div>

      <!-- Pickup Time Options -->
      <div class="pickup-options">
        <!-- ASAP Option -->
        <div class="option-card" [class.selected]="selectedOption === 'asap'" (click)="selectOption('asap')">
          <div class="option-content">
            <div class="option-icon">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="option-text">
              <div class="option-title">Sofort abholen</div>
              <div class="option-description">Schnellste Abholung verfügbar</div>
            </div>
          </div>
          <div class="option-selected" *ngIf="selectedOption === 'asap'">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>

        <!-- Scheduled Option -->
        <div class="option-card" [class.selected]="selectedOption === 'scheduled'" (click)="selectOption('scheduled')">
          <div class="option-content">
            <div class="option-icon">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div class="option-text">
              <div class="option-title">Geplante Abholung</div>
              <div class="option-description">Wählen Sie einen bestimmten Zeitpunkt</div>
            </div>
          </div>
          <div class="option-selected" *ngIf="selectedOption === 'scheduled'">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>
      </div>

      <!-- Time Selection for Scheduled Pickup -->
      <div class="scheduled-selection" *ngIf="selectedOption === 'scheduled'">
        <div class="date-time-inputs">
          <div class="input-group">
            <label for="pickup-date">Datum:</label>
            <div class="date-display">
              <i class="fa-solid fa-calendar"></i>
              <span>{{ getCurrentDateLabel() }}</span>
            </div>
          </div>
          <div class="input-group">
            <label for="pickup-time">Uhrzeit:</label>
            <input
              type="time"
              id="pickup-time"
              [(ngModel)]="selectedTime"
              (ngModelChange)="onTimeChange()"
              class="time-input"
            >
          </div>
        </div>
        <div class="time-note">
          <i class="fa-solid fa-info-circle"></i>
          <span>Mindestens 15 Minuten im Voraus buchen</span>
        </div>
      </div>

      <!-- Selected Pickup Time Summary -->
      <div class="selected-summary" *ngIf="selectedOption">
        <div class="summary-content">
          <i class="fa-solid fa-check-circle"></i>
          <div class="summary-text">
            <span class="summary-label">Ausgewählte Abholzeit:</span>
            <span class="summary-value">{{ getSelectedTimeLabel() }}</span>
          </div>
        </div>
        <button class="btn-change" (click)="clearSelection()">Ändern</button>
      </div>
    </div>
  `,
  styles: [`
    .pickup-slots-container {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .slots-header {
      margin-bottom: var(--space-4);
      text-align: center;
    }

    .slots-header h3 {
      margin: 0 0 var(--space-2) 0;
      color: var(--color-heading);
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .slots-description {
      margin: 0;
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .pickup-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .option-card {
      position: relative;
      background: white;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      cursor: pointer;
      transition: all var(--transition);
      overflow: hidden;
    }

    .option-card:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .option-card.selected {
      border-color: var(--color-primary);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .option-icon {
      width: 48px;
      height: 48px;
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xl);
      color: var(--color-primary);
    }

    .option-text {
      flex: 1;
    }

    .option-title {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-base);
      margin-bottom: var(--space-1);
    }

    .option-description {
      color: var(--color-muted);
      font-size: var(--text-sm);
    }

    .option-selected {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      background: var(--color-primary);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
    }

    .scheduled-selection {
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .date-time-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .input-group label {
      font-weight: 600;
      color: var(--color-heading);
      font-size: var(--text-sm);
    }

    .date-input, .time-input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: white;
      cursor: pointer;
    }

    .date-input:focus, .time-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 15%, transparent);
    }

    .date-display {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: color-mix(in oklab, var(--color-primary) 5%, white);
      color: var(--color-primary);
      font-weight: 500;
    }

    .date-display i {
      color: var(--color-primary);
    }

    .time-note {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-muted);
      font-size: var(--text-xs);
    }

    .time-note i {
      color: var(--color-primary);
    }

    .selected-summary {
      background: color-mix(in oklab, var(--color-primary) 10%, white);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .summary-content i {
      color: var(--color-primary);
      font-size: var(--text-lg);
    }

    .summary-text {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .summary-label {
      font-size: var(--text-xs);
      color: var(--color-muted);
      font-weight: 500;
    }

    .summary-value {
      font-size: var(--text-sm);
      color: var(--color-heading);
      font-weight: 600;
    }

    .btn-change {
      background: none;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: var(--text-xs);
      font-weight: 600;
      transition: all var(--transition);
    }

    .btn-change:hover {
      background: var(--color-primary);
      color: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pickup-options {
        grid-template-columns: 1fr;
      }

      .date-time-inputs {
        grid-template-columns: 1fr;
      }

      .selected-summary {
        flex-direction: column;
        gap: var(--space-3);
        align-items: stretch;
      }

      .summary-content {
        justify-content: center;
      }
    }
  `]
})
export class PickupSlotsComponent implements OnInit, OnDestroy {
  @Input() restaurantId!: string;
  @Output() slotSelected = new EventEmitter<PickupSlot>();

  selectedOption: 'asap' | 'scheduled' | null = null;
  selectedDate?: string;
  selectedTime?: string;
  
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Set default values - always use current date
    this.selectedDate = this.minDate;
    this.selectedTime = this.getDefaultTime();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectOption(option: 'asap' | 'scheduled') {
    this.selectedOption = option;
    this.emitSelectedSlot();
  }

  clearSelection() {
    this.selectedOption = null;
    this.selectedDate = this.minDate; // Always reset to current date
    this.selectedTime = this.getDefaultTime();
  }

  onTimeChange() {
    this.emitSelectedSlot();
  }

  getCurrentDateLabel(): string {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Check if selected date is today or tomorrow
    const selectedDateObj = new Date(this.selectedDate!);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
    
    if (selectedDateOnly.getTime() === todayDate.getTime()) {
      return 'Heute';
    } else if (selectedDateOnly.getTime() === tomorrowDate.getTime()) {
      return 'Morgen';
    } else {
      return selectedDateObj.toLocaleDateString('de-DE', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }

  private emitSelectedSlot() {
    if (!this.selectedOption) return;

    let slot: PickupSlot;

    if (this.selectedOption === 'asap') {
      slot = {
        type: 'asap',
        label: 'Sofort abholen',
        value: 'asap',
        available: true
      };
    } else {
      // Validate scheduled time - always use current date
      if (!this.selectedTime) return;

      const scheduledDateTime = new Date(`${this.minDate}T${this.selectedTime}`);
      const now = new Date();
      const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now for pickup

      if (scheduledDateTime < minTime) {
        // Auto-adjust to minimum time
        this.selectedTime = this.formatTime(minTime);
        scheduledDateTime.setTime(minTime.getTime());
      }

      slot = {
        type: 'scheduled',
        label: this.formatScheduledLabel(scheduledDateTime),
        value: scheduledDateTime.toISOString(),
        available: true
      };
    }

    this.slotSelected.emit(slot);
  }

  getSelectedTimeLabel(): string {
    if (!this.selectedOption) return '';

    if (this.selectedOption === 'asap') {
      return 'Sofort abholen';
    } else {
      if (!this.selectedTime) return '';
      const scheduledDateTime = new Date(`${this.minDate}T${this.selectedTime}`);
      return this.formatScheduledLabel(scheduledDateTime);
    }
  }

  private formatScheduledLabel(dateTime: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const slotDate = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
    
    if (slotDate.getTime() === today.getTime()) {
      return `Heute um ${dateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (slotDate.getTime() === tomorrow.getTime()) {
      return `Morgen um ${dateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${dateTime.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} um ${dateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  private getDefaultTime(): string {
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now for pickup
    return this.formatTime(minTime);
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get maxDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  }
}
