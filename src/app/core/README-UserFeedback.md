# User Feedback System - Implementierung & Verwendung

## 📋 Übersicht

Das User Feedback System bietet eine umfassende Lösung für Benutzerinteraktionen in der ODNWLD liefert App. Es umfasst Toast-Nachrichten, Ladezustände, Bestätigungsdialoge und globale Fehlerbehandlung.

## 🏗️ Architektur

### Services

#### 1. ToastService
**Zweck:** Verwaltet nicht-blockierende Benachrichtigungen

```typescript
import { ToastService } from '../services/toast.service';

// Inject Service
private toastService = inject(ToastService);

// Verwendung
this.toastService.success('Bestellung erfolgreich', 'Ihre Pizza ist unterwegs!');
this.toastService.error('Fehler', 'Bestellung konnte nicht bearbeitet werden');
this.toastService.warning('Warnung', 'Bitte überprüfen Sie Ihre Eingaben');
this.toastService.info('Info', 'Neue Funktionen verfügbar');
```

#### 2. LoadingService
**Zweck:** Verwaltet Ladezustände für UI-Feedback

```typescript
import { LoadingService } from '../services/loading.service';

// Inject Service
private loadingService = inject(LoadingService);

// Verwendung
// Start Loading
this.loadingService.start('order-processing');

// Stop Loading
this.loadingService.stop('order-processing');

// Mit Observable
this.loadingService.withLoading('api-call')(this.http.get('/api/orders'))
  .subscribe(result => {
    console.log('Daten geladen:', result);
  });

// In Template
<div *ngIf="loadingService.isLoading('order-processing') | async">
  <app-loading-spinner text="Bestellung wird bearbeitet..."></app-loading-spinner>
</div>
```

#### 3. ConfirmationService
**Zweck:** Verwaltet Bestätigungsdialoge für kritische Aktionen

```typescript
import { ConfirmationService } from '../services/confirmation.service';

// Inject Service
private confirmationService = inject(ConfirmationService);

// Verwendung
async deleteOrder(orderId: string) {
  const confirmed = await this.confirmationService.confirmDelete(
    'Bestellung löschen',
    'Sind Sie sicher, dass Sie diese Bestellung stornieren möchten?'
  );

  if (confirmed) {
    // Löschen ausführen
    await this.orderService.deleteOrder(orderId);
    this.toastService.success('Gelöscht', 'Bestellung wurde storniert');
  }
}
```

#### 4. ErrorHandlerService
**Zweck:** Globale Fehlerbehandlung und Benutzer-Feedback

```typescript
import { ErrorHandlerService } from '../services/error-handler.service';

// Inject Service
private errorHandlerService = inject(ErrorHandlerService);

// Verwendung
// Automatische Fehlerbehandlung für HTTP-Fehler
this.http.get('/api/orders').subscribe({
  next: (result) => console.log(result),
  error: (error) => {
    // Fehler wird automatisch behandelt
    // Toast-Nachricht wird angezeigt
    // Loading State wird gestoppt
  }
});

// Manuelle Fehlerbehandlung
try {
  await this.orderService.createOrder(orderData);
} catch (error) {
  this.errorHandlerService.handleApiError(
    error,
    'Bestellung konnte nicht erstellt werden'
  );
}
```

## 🎨 Komponenten

### ToastContainerComponent
**Zweck:** Zeigt Toast-Nachrichten global an

```html
<!-- Wird automatisch in app.component.html eingebunden -->
<app-toast-container></app-toast-container>
```

### ConfirmationDialogComponent
**Zweck:** Zeigt Bestätigungsdialoge global an

```html
<!-- Wird automatisch in app.component.html eingebunden -->
<app-confirmation-dialog></app-confirmation-dialog>
```

### LoadingSpinnerComponent
**Zweck:** Zeigt Ladeanimationen in verschiedenen Größen

```html
<!-- Kleine Größe -->
<app-loading-spinner size="sm"></app-loading-spinner>

<!-- Mittlere Größe (Standard) -->
<app-loading-spinner size="md" text="Lädt..."></app-loading-spinner>

<!-- Große Größe -->
<app-loading-spinner size="lg" variant="pulse"></app-loading-spinner>

<!-- Weiß für dunkle Hintergründe -->
<app-loading-spinner variant="white"></app-loading-spinner>
```

## 🛠️ Utility-Klasse

### UserFeedbackUtils
**Zweck:** Vereinfacht häufig verwendete Feedback-Patterns

```typescript
import { UserFeedbackUtils } from '../utils/user-feedback.utils';

export class MyComponent {
  private feedback = inject(UserFeedbackUtils);

  async saveOrder(orderData: any) {
    // CRUD Operation mit Feedback
    const result = await this.feedback.updateItem(
      () => this.orderService.updateOrder(orderData),
      'Bestellung erfolgreich aktualisiert',
      'Fehler beim Aktualisieren der Bestellung'
    );

    if (result) {
      // Erfolgreich aktualisiert
    }
  }

  async deleteOrder(orderId: string) {
    // Löschung mit Bestätigung
    const deleted = await this.feedback.deleteItem(
      () => this.orderService.deleteOrder(orderId),
      'Bestellung erfolgreich gelöscht'
    );

    if (deleted) {
      // Erfolgreich gelöscht
    }
  }

  async submitForm(formData: any, isValid: boolean) {
    // Form Validierung mit Feedback
    const result = await this.feedback.validateAndSave(
      isValid,
      () => this.apiService.submitForm(formData),
      'Bitte füllen Sie alle erforderlichen Felder aus'
    );
  }
}
```

## 🔧 HTTP Interceptor

### HttpLoadingInterceptor
**Zweck:** Automatische Loading States und Fehlerbehandlung für HTTP-Anfragen

```typescript
// Wird automatisch für alle HTTP-Anfragen ausgeführt
// Startet Loading State beim Request
// Stoppt Loading State bei Response/Error
// Zeigt Toast bei erfolgreichen Operationen
// Behandelt HTTP-Fehler automatisch
```

## 📱 Verwendung in Komponenten

### Beispiel: Bestellungsverwaltung

```typescript
import { Component, inject } from '@angular/core';
import { UserFeedbackUtils } from '../utils/user-feedback.utils';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-order-list',
  template: `
    <div class="orders-container">
      <div *ngIf="feedback.loadingService.isLoading('orders') | async" class="loading">
        <app-loading-spinner text="Bestellungen werden geladen..."></app-loading-spinner>
      </div>

      <div *ngFor="let order of orders" class="order-item">
        <h3>Bestellung #{{ order.id }}</h3>
        <button (click)="updateStatus(order.id, 'confirmed')" [disabled]="updatingOrderId === order.id">
          Bestätigen
        </button>
        <button (click)="cancelOrder(order.id)" class="danger">
          Stornieren
        </button>
      </div>
    </div>
  `
})
export class OrderListComponent {
  private feedback = inject(UserFeedbackUtils);
  private ordersService = inject(OrdersService);

  orders: any[] = [];
  updatingOrderId: string | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    try {
      const result = await this.feedback.withLoading('orders')(
        this.ordersService.getOrders()
      ).toPromise();

      this.orders = result;
    } catch (error) {
      // Fehler wird automatisch behandelt
    }
  }

  async updateStatus(orderId: string, status: string) {
    this.updatingOrderId = orderId;

    const result = await this.feedback.updateItem(
      () => this.ordersService.updateOrderStatus(orderId, status),
      `Bestellung erfolgreich ${status === 'confirmed' ? 'bestätigt' : 'aktualisiert'}`
    );

    if (result) {
      // Bestellung in lokaler Liste aktualisieren
      const index = this.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        this.orders[index] = result;
      }
    }

    this.updatingOrderId = null;
  }

  async cancelOrder(orderId: string) {
    const cancelled = await this.feedback.deleteItem(
      () => this.ordersService.cancelOrder(orderId),
      'Bestellung erfolgreich storniert'
    );

    if (cancelled) {
      // Bestellung aus lokaler Liste entfernen
      this.orders = this.orders.filter(o => o.id !== orderId);
    }
  }
}
```

## 🎯 Best Practices

### 1. Konsistente Messaging
```typescript
// ✅ Gut: Klare, hilfreiche Nachrichten
this.toastService.success('Bestellung aufgegeben', 'Ihre Pizza wird in 25 Minuten geliefert');

// ❌ Schlecht: Technische Meldungen
this.toastService.error('Error', 'HTTP 500 Internal Server Error');
```

### 2. Loading States für alle async Operationen
```typescript
// ✅ Gut: Immer Loading State verwenden
async saveData() {
  this.loadingService.start('saving');
  try {
    await this.apiService.save(data);
    this.toastService.success('Gespeichert', 'Daten wurden erfolgreich gespeichert');
  } finally {
    this.loadingService.stop('saving');
  }
}
```

### 3. Bestätigung für destruktive Aktionen
```typescript
// ✅ Gut: Immer bestätigen lassen
async deleteItem(id: string) {
  const confirmed = await this.confirmationService.confirmDelete();
  if (confirmed) {
    await this.apiService.delete(id);
  }
}
```

### 4. Graceful Error Handling
```typescript
// ✅ Gut: Immer Error-Handling
this.http.get('/api/data').subscribe({
  next: (result) => {
    // Erfolg behandeln
  },
  error: (error) => {
    // Fehler wird automatisch behandelt durch HttpLoadingInterceptor
    // Zusätzliche benutzerdefinierte Behandlung möglich
  }
});
```

## 🎨 Styling & Theming

### CSS Custom Properties
```css
:root {
  --toast-success: #10b981;
  --toast-error: #ef4444;
  --toast-warning: #f59e0b;
  --toast-info: #3b82f6;
  --toast-duration: 5000ms;
}
```

### Responsive Design
- Toast-Nachrichten sind auf mobilen Geräten zentriert
- Bestätigungsdialoge skalieren automatisch
- Loading Spinner sind in verschiedenen Größen verfügbar

## 🔍 Monitoring & Debugging

### Toast-Verfolgung
```typescript
// Anzahl der aktuellen Toasts
const toastCount = this.toastService.getCount();
const errorCount = this.toastService.getCountByType('error');

// Alle Toasts löschen
this.toastService.clear();

// Nur Fehler löschen
this.toastService.clearByType('error');
```

### Loading State Monitoring
```typescript
// Überprüfen ob etwas lädt
const isGlobalLoading = this.loadingService.isLoadingSync();
const isSpecificLoading = this.loadingService.isLoadingSync('my-operation');

// Alle Loading States stoppen
this.loadingService.stopAll();
```

## 📈 Erweiterte Features

### Toast mit Aktionen
```typescript
this.toastService.show('info', 'Neue Version verfügbar', 'Update jetzt verfügbar', 10000, {
  label: 'Jetzt aktualisieren',
  callback: () => window.location.reload()
});
```

### Bulk-Operationen mit Feedback
```typescript
const results = await Promise.allSettled(operations);

const successCount = results.filter(r => r.status === 'fulfilled').length;
const errorCount = results.filter(r => r.status === 'rejected').length;

if (errorCount === 0) {
  this.feedback.showBulkSuccess(successCount, 'Bestellungen');
} else if (successCount === 0) {
  this.feedback.showBulkError(errorCount, 'Bestellungen');
} else {
  this.feedback.showBulkPartialSuccess(successCount, errorCount, 'Bestellungen');
}
```

### Form Validierung mit Feedback
```typescript
async submitForm(formData: any) {
  const result = await this.feedback.validateAndSave(
    this.myForm.valid,
    () => this.apiService.submitForm(formData),
    'Bitte korrigieren Sie die hervorgehobenen Felder'
  );

  if (result) {
    // Form erfolgreich übermittelt
  }
}
```

## 🔧 Konfiguration

### Toast-Einstellungen
```typescript
// In app.config.ts oder eigenem Service
export const TOAST_CONFIG = {
  defaultDuration: 5000,
  maxToasts: 5,
  position: 'top-right',
  animation: 'slide'
};
```

### Loading-Einstellungen
```typescript
export const LOADING_CONFIG = {
  showGlobalOverlay: true,
  debounceTime: 300,
  minLoadingTime: 500
};
```

Das User Feedback System ist vollständig in die ODNWLD liefert App integriert und bietet eine professionelle, benutzerfreundliche Erfahrung für alle Interaktionen.
