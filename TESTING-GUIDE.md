# 🧪 Frontend Testing Guide mit API Schema-Validierung

## Übersicht

Dieses Projekt nutzt **Zod** für Type-Safe API Schema-Validierung in Frontend-Tests.

### Was wurde erstellt?

1. **📋 Schema-Definitionen** (`src/app/core/schemas/api-responses.schema.ts`)
   - Zod-Schemas für alle API-Responses
   - Type-Safe Validierung zur Runtime
   - Automatische TypeScript-Types

2. **🛠️ Test-Helpers** (`src/app/core/testing/test-helpers.ts`)
   - `expectValidSchema()` - Schema validieren mit aussagekräftigen Fehlern
   - `isValidSchema()` - Boolean-Check ohne Exception
   - `MockDataBuilder` - Mock-Daten generieren
   - `schemaMatchers` - Custom Jasmine Matcher
   - `waitForObservable()` - Async/Await Support

3. **📝 Test-Beispiele**
   - `orders.service.spec.ts` - Basis-Tests
   - `example-test-with-helpers.spec.ts` - Fortgeschrittene Beispiele

## 🚀 Quick Start

### 1. Schema definieren

```typescript
// api-responses.schema.ts
import { z } from 'zod';

export const OrderSchema = z.object({
  id: z.string(),
  restaurant_id: z.string(),
  total_price: z.number().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'delivered']),
  items: z.array(OrderItemSchema)
});

export type Order = z.infer<typeof OrderSchema>;
```

### 2. Test schreiben

```typescript
import { expectValidSchema, MockDataBuilder } from '../testing/test-helpers';
import { OrderSchema } from '../schemas/api-responses.schema';

describe('OrdersService', () => {
  it('sollte Bestellung erstellen', (done) => {
    // ARRANGE
    const mockResponse = MockDataBuilder.createMockCreateOrderResponse();

    // ACT
    service.createOrder(orderData).subscribe({
      next: (response) => {
        // ASSERT - Schema validieren
        const validated = expectValidSchema(
          OrderSchema,
          response.order,
          'Order sollte dem Schema entsprechen'
        );

        expect(validated.status).toBe('pending');
        done();
      }
    });

    // Mock HTTP
    const req = httpMock.expectOne('/api/orders');
    req.flush(mockResponse);
  });
});
```

## 📖 Beispiel-Szenarien

### Szenario 1: Kunde bestellt beim Restaurant

```typescript
it('sollte Bestellung mit korrektem Schema erstellen', (done) => {
  const orderRequest = {
    restaurant_id: '123',
    delivery_address: 'Hauptstraße 42, Frankfurt',
    items: [
      { menu_item_id: '456', quantity: 2, unit_price: 12.50 }
    ]
  };

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

  service.createOrder(orderRequest).subscribe({
    next: (response) => {
      // Schema validieren
      const validated = expectValidSchema(
        CreateOrderResponseSchema,
        response
      );

      // Assertions
      expect(validated.order.id).toBe('999');
      expect(validated.order.total_price).toBe(25.00);
      expect(validated.order.status).toBe('pending');
      
      done();
    }
  });

  const req = httpMock.expectOne('/api/orders');
  req.flush(mockResponse);
});
```

### Szenario 2: Mit Custom Matcher

```typescript
beforeEach(() => {
  jasmine.addMatchers(schemaMatchers);
});

it('sollte Order mit Matcher validieren', (done) => {
  service.getOrder('123').subscribe({
    next: (order) => {
      // Einfacher Custom Matcher
      expect(order).toMatchSchema(OrderSchema);
      expect(order.status).toBe('delivered');
      done();
    }
  });
});
```

### Szenario 3: Async/Await

```typescript
it('sollte Order erstellen (async)', async () => {
  const mockResponse = MockDataBuilder.createMockCreateOrderResponse();

  const promise = waitForObservable(
    service.createOrder(orderData)
  );

  httpMock.expectOne('/api/orders').flush(mockResponse);

  const response = await promise;
  
  expect(response).toMatchSchema(CreateOrderResponseSchema);
  expect(response.order.status).toBe('pending');
});
```

### Szenario 4: Kompletter Flow

```typescript
it('sollte vollständigen Order-Flow testen', async () => {
  // 1. Order erstellen
  const createResponse = MockDataBuilder.createMockCreateOrderResponse();
  const createPromise = waitForObservable(service.createOrder(orderData));
  httpMock.expectOne('/api/orders').flush(createResponse);
  const created: any = await createPromise;
  
  expect(created.order.status).toBe('pending');

  // 2. Order abrufen
  const getPromise = waitForObservable(service.getOrderById('999'));
  httpMock.expectOne('/api/orders/999').flush({ order: created.order });
  const fetched: any = await getPromise;
  
  expect(fetched.id).toBe('999');

  // 3. Status aktualisieren
  const updatePromise = waitForObservable(
    service.updateOrderStatus('999', 'confirmed')
  );
  httpMock.expectOne('/api/orders/999/status').flush({
    message: 'Updated',
    order: { ...created.order, status: 'confirmed' }
  });
  const updated: any = await updatePromise;
  
  expect(updated.order.status).toBe('confirmed');
});
```

## 🎯 Best Practices

### ✅ DO

```typescript
// Schema-Validierung in Tests
const validated = expectValidSchema(OrderSchema, response);

// Mock-Daten mit Builder
const mockOrder = MockDataBuilder.createMockOrder({ status: 'pending' });

// Custom Matcher verwenden
expect(response).toMatchSchema(OrderSchema);

// Request UND Response validieren
const requestValid = isValidSchema(CreateOrderRequestSchema, request);
const responseValid = isValidSchema(CreateOrderResponseSchema, response);
```

### ❌ DON'T

```typescript
// Nicht: Schema-Validierung vergessen
expect(response.status).toBe('pending'); // Ohne Schema-Check!

// Nicht: Hardcoded Mock-Daten
const mockOrder = {
  id: '123',
  // ... viele Felder manuell schreiben
};

// Nicht: parse() statt safeParse()
const order = OrderSchema.parse(response); // Wirft Exception!
```

## 🔍 Debugging

Wenn ein Test fehlschlägt:

```typescript
const result = OrderSchema.safeParse(response);

if (!result.success) {
  console.log('Validation errors:');
  result.error.issues.forEach(issue => {
    console.log(`  ${issue.path.join('.')}: ${issue.message}`);
  });
}
```

## 🚀 Tests ausführen

```bash
# Alle Tests
npm test

# Spezifischer Test
npm test -- --include='**/orders.service.spec.ts'

# Headless (CI)
npm test -- --browsers=ChromeHeadless --watch=false

# Mit Coverage
npm test -- --code-coverage
```

## 📚 Verfügbare Helper

### `expectValidSchema<T>(schema, data, errorMessage?): T`
Validiert und gibt type-safe Daten zurück oder wirft Fehler.

### `isValidSchema<T>(schema, data): boolean`
Prüft Schema ohne Exception zu werfen.

### `MockDataBuilder`
- `createMockOrder(overrides?)`
- `createMockOrderItem(overrides?)`
- `createMockOrderWithItems(itemCount?, orderOverrides?)`
- `createMockGetOrdersResponse(orderCount?)`
- `createMockCreateOrderResponse(orderOverrides?)`

### `waitForObservable<T>(observable): Promise<T>`
Konvertiert Observable zu Promise für async/await.

### `schemaMatchers`
Custom Jasmine Matcher: `expect(data).toMatchSchema(schema)`

## 📁 Datei-Struktur

```
src/app/core/
├── schemas/
│   ├── api-responses.schema.ts    # Zod-Schemas
│   └── README.md                  # Schema-Dokumentation
├── testing/
│   ├── test-helpers.ts            # Helper-Funktionen
│   └── example-test-with-helpers.spec.ts  # Beispiele
└── services/
    └── orders.service.spec.ts     # Service-Tests
```

## 🎓 Weiterführende Themen

- **E2E-Tests**: Schema-Validierung auch in Cypress/Playwright
- **API-Mocking**: MSW (Mock Service Worker) für realistische Mocks
- **Contract Testing**: Pact.io für Backend-Frontend Contract Tests
- **Type Generation**: Automatisches Generieren von Schemas aus OpenAPI

## 🔗 Ressourcen

- [Zod Documentation](https://zod.dev/)
- [Angular Testing](https://angular.io/guide/testing)
- [Jasmine](https://jasmine.github.io/)
- [HttpClientTestingModule](https://angular.io/api/common/http/testing/HttpClientTestingModule)
