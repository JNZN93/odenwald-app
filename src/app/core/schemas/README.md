# API Schema Validierung im Frontend

Diese Dokumentation erklärt, wie du API-Responses mit Zod-Schemas in deinen Frontend-Tests validierst.

## 📦 Übersicht

Wir nutzen **Zod** für Type-Safe API Schema Validierung. Das bietet folgende Vorteile:

- ✅ **Runtime-Validierung**: Überprüfe zur Laufzeit, ob API-Responses dem erwarteten Format entsprechen
- ✅ **Type-Safety**: TypeScript-Types werden automatisch aus Zod-Schemas generiert
- ✅ **Bessere Tests**: Klare, wartbare Test-Assertions
- ✅ **Früherkennung**: API-Breaking-Changes werden sofort erkannt

## 🔧 Setup

### 1. Installation

```bash
npm install zod
```

### 2. Schema definieren

Erstelle Schemas für deine API-Responses:

```typescript
// api-responses.schema.ts
import { z } from 'zod';

export const OrderSchema = z.object({
  id: z.string(),
  restaurant_id: z.string(),
  total_price: z.number().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'delivered']),
  // ... weitere Felder
});

export type Order = z.infer<typeof OrderSchema>;
```

## 📝 Test-Beispiele

### Beispiel 1: Kunde bestellt beim Restaurant

```typescript
describe('createOrder', () => {
  it('sollte eine Bestellung erstellen und Schema validieren', (done) => {
    // ARRANGE: Test-Daten
    const orderRequest = {
      restaurant_id: '123',
      delivery_address: 'Hauptstraße 42, Frankfurt',
      items: [
        { menu_item_id: '456', quantity: 2, unit_price: 12.50 }
      ]
    };

    // Erwartete Response
    const mockResponse = {
      message: 'Order created successfully',
      order: {
        id: '999',
        restaurant_id: '123',
        total_price: 25.00,
        status: 'pending',
        // ... weitere Felder
      }
    };

    // ACT: Service aufrufen
    service.createOrder(orderRequest).subscribe({
      next: (response) => {
        // ASSERT: Schema validieren
        const validation = CreateOrderResponseSchema.safeParse(response);
        
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(validation.data.order.status).toBe('pending');
          expect(validation.data.order.total_price).toBe(25.00);
        }
        
        done();
      }
    });

    // Mock HTTP Request
    const req = httpMock.expectOne('/api/orders');
    req.flush(mockResponse);
  });
});
```

### Beispiel 2: Order-Status aktualisieren

```typescript
it('sollte Order-Status aktualisieren', (done) => {
  const orderId = '999';
  const newStatus = 'confirmed';

  service.updateOrderStatus(orderId, newStatus).subscribe({
    next: (response) => {
      // Schema validieren
      const validation = UpdateOrderStatusResponseSchema.safeParse(response);
      
      expect(validation.success).toBe(true);
      expect(response.order.status).toBe('confirmed');
      
      done();
    }
  });

  const req = httpMock.expectOne(`/api/orders/${orderId}/status`);
  expect(req.request.method).toBe('PATCH');
  expect(req.request.body).toEqual({ status: newStatus });
  req.flush({ message: 'Updated', order: { ...mockOrder, status: newStatus } });
});
```

### Beispiel 3: Liste von Orders abrufen

```typescript
it('sollte alle Orders mit korrektem Schema zurückgeben', (done) => {
  const mockResponse = {
    count: 2,
    orders: [
      { id: '1', restaurant_name: 'Burger King', status: 'delivered', ... },
      { id: '2', restaurant_name: 'Pizza Hut', status: 'preparing', ... }
    ]
  };

  service.getOrders().subscribe({
    next: (orders) => {
      // Validiere Response
      const validation = GetOrdersResponseSchema.safeParse({
        count: mockResponse.count,
        orders: mockResponse.orders
      });
      
      expect(validation.success).toBe(true);
      expect(orders.length).toBe(2);
      
      // Validiere jede einzelne Order
      orders.forEach(order => {
        const orderValidation = OrderSchema.safeParse(order);
        expect(orderValidation.success).toBe(true);
      });
      
      done();
    }
  });

  const req = httpMock.expectOne('/api/orders');
  req.flush(mockResponse);
});
```

## 🎯 Best Practices

### 1. Schema-First Approach

Definiere zuerst das Schema, bevor du Tests schreibst:

```typescript
// 1. Schema definieren
export const OrderSchema = z.object({ ... });

// 2. Type generieren
export type Order = z.infer<typeof OrderSchema>;

// 3. In Tests verwenden
const validation = OrderSchema.safeParse(response);
```

### 2. Verwende safeParse statt parse

```typescript
// ❌ NICHT: Wirft Exception bei Fehler
const order = OrderSchema.parse(response);

// ✅ GUT: Gibt Erfolg/Fehler-Objekt zurück
const result = OrderSchema.safeParse(response);
if (result.success) {
  const order = result.data;
} else {
  console.error('Validation failed:', result.error);
}
```

### 3. Request UND Response validieren

```typescript
it('sollte Request und Response validieren', (done) => {
  const orderRequest = { ... };

  // Request validieren
  const requestValidation = CreateOrderRequestSchema.safeParse(orderRequest);
  expect(requestValidation.success).toBe(true);

  service.createOrder(orderRequest).subscribe({
    next: (response) => {
      // Response validieren
      const responseValidation = CreateOrderResponseSchema.safeParse(response);
      expect(responseValidation.success).toBe(true);
      done();
    }
  });

  const req = httpMock.expectOne('/api/orders');
  
  // Validiere auch den Request-Body
  const bodyValidation = CreateOrderRequestSchema.safeParse(req.request.body);
  expect(bodyValidation.success).toBe(true);
  
  req.flush(mockResponse);
});
```

### 4. Teste auch invalide Schemas

```typescript
it('sollte Fehler bei ungültigem Schema erkennen', (done) => {
  const invalidResponse = {
    message: 'Created',
    order: {
      id: '123',
      // Fehlende required fields
    }
  };

  service.createOrder(orderRequest).subscribe({
    next: (response) => {
      const validation = CreateOrderResponseSchema.safeParse(response);
      
      expect(validation.success).toBe(false);
      
      if (!validation.success) {
        // Logge Fehler für Debugging
        console.warn('Schema validation failed:', validation.error.errors);
      }
      
      done();
    }
  });

  const req = httpMock.expectOne('/api/orders');
  req.flush(invalidResponse);
});
```

### 5. Wiederverwendbare Test-Helpers

```typescript
// test-helpers.ts
export function expectValidSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T {
  const result = schema.safeParse(data);
  
  expect(result.success).toBe(true, errorMessage || 'Schema validation failed');
  
  if (!result.success) {
    console.error('Validation errors:', result.error.errors);
    throw new Error('Schema validation failed');
  }
  
  return result.data;
}

// In Tests verwenden:
it('test', (done) => {
  service.getOrder('123').subscribe({
    next: (response) => {
      const validatedOrder = expectValidSchema(
        OrderSchema, 
        response,
        'Order response should match schema'
      );
      
      expect(validatedOrder.status).toBe('pending');
      done();
    }
  });
});
```

## 🚀 Tests ausführen

```bash
# Alle Tests ausführen
npm test

# Spezifischen Test ausführen
npm test -- --include='**/orders.service.spec.ts'

# Mit Coverage
npm test -- --code-coverage
```

## 🔍 Debugging

Wenn Schema-Validierung fehlschlägt:

```typescript
const result = OrderSchema.safeParse(response);

if (!result.success) {
  console.log('Validation errors:', result.error.errors);
  
  // Detaillierte Fehler:
  result.error.errors.forEach(err => {
    console.log(`Field: ${err.path.join('.')}`);
    console.log(`Error: ${err.message}`);
  });
}
```

## 📚 Weitere Ressourcen

- [Zod Documentation](https://zod.dev/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [HttpClientTestingModule](https://angular.io/api/common/http/testing/HttpClientTestingModule)
