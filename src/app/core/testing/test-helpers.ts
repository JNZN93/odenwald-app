import { z } from 'zod';

/**
 * Test Helper Funktionen für Schema-Validierung und wiederverwendbare Test-Logik
 */

/**
 * Validiert Daten gegen ein Zod-Schema und wirft einen aussagekräftigen Fehler bei Fehlschlag
 * 
 * @example
 * ```typescript
 * const order = expectValidSchema(OrderSchema, apiResponse, 'Order response should be valid');
 * expect(order.status).toBe('pending');
 * ```
 */
export function expectValidSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues
      .map((err: any) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    
    const message = errorMessage || 'Schema validation failed';
    console.error(`${message}:\n${errors}`);
    
    throw new Error(`${message}\nValidation errors:\n${errors}`);
  }
  
  return result.data;
}

/**
 * Prüft, ob Daten dem Schema entsprechen und gibt boolean zurück (ohne Exception zu werfen)
 * 
 * @example
 * ```typescript
 * if (isValidSchema(OrderSchema, response)) {
 *   // Response ist valide
 * }
 * ```
 */
export function isValidSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): data is T {
  const result = schema.safeParse(data);
  return result.success;
}

/**
 * Gibt Validierungsfehler als formatierten String zurück
 * 
 * @example
 * ```typescript
 * const errors = getValidationErrors(OrderSchema, invalidData);
 * console.log(errors); // "id: Required, status: Invalid enum value"
 * ```
 */
export function getValidationErrors(
  schema: z.ZodSchema<any>,
  data: unknown
): string | null {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return null;
  }
  
  return result.error.issues
    .map((err: any) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

/**
 * Mock-Daten Generator für Tests
 */
export class MockDataBuilder {
  /**
   * Erstellt eine Mock-Order mit optionalen Overrides
   */
  static createMockOrder(overrides: Partial<any> = {}): any {
    const now = new Date().toISOString();
    
    return {
      id: '123',
      user_id: '456',
      restaurant_id: '789',
      restaurant_name: 'Test Restaurant',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      items: [],
      subtotal: 25.00,
      delivery_fee: 3.50,
      total_price: 28.50,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'card',
      delivery_address: 'Test Street 123, Frankfurt',
      created_at: now,
      updated_at: now,
      ...overrides
    };
  }

  /**
   * Erstellt ein Mock-OrderItem
   */
  static createMockOrderItem(overrides: Partial<any> = {}): any {
    return {
      id: '1',
      menu_item_id: '100',
      name: 'Test Item',
      quantity: 1,
      unit_price: 12.50,
      total_price: 12.50,
      image_url: 'https://example.com/test.jpg',
      ...overrides
    };
  }

  /**
   * Erstellt eine komplette Mock-Order mit Items
   */
  static createMockOrderWithItems(
    itemCount: number = 2,
    orderOverrides: Partial<any> = {}
  ): any {
    const items = Array.from({ length: itemCount }, (_, i) =>
      this.createMockOrderItem({
        id: String(i + 1),
        menu_item_id: String(100 + i),
        name: `Test Item ${i + 1}`,
        quantity: 1,
        unit_price: 10.00 + i,
        total_price: 10.00 + i
      })
    );

    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const delivery_fee = 3.50;

    return this.createMockOrder({
      items,
      subtotal,
      total_price: subtotal + delivery_fee,
      ...orderOverrides
    });
  }

  /**
   * Erstellt Mock-Response für getOrders
   */
  static createMockGetOrdersResponse(orderCount: number = 3): any {
    const orders = Array.from({ length: orderCount }, (_, i) =>
      this.createMockOrder({
        id: String(i + 1),
        restaurant_name: `Restaurant ${i + 1}`
      })
    );

    return {
      count: orders.length,
      orders
    };
  }

  /**
   * Erstellt Mock-Response für createOrder
   */
  static createMockCreateOrderResponse(orderOverrides: Partial<any> = {}): any {
    return {
      message: 'Order created successfully',
      order: this.createMockOrder(orderOverrides)
    };
  }
}

/**
 * Jasmine Custom Matcher für Schema-Validierung
 * 
 * @example
 * ```typescript
 * beforeEach(() => {
 *   jasmine.addMatchers(schemaMatchers);
 * });
 * 
 * it('test', () => {
 *   expect(response).toMatchSchema(OrderSchema);
 * });
 * ```
 */
export const schemaMatchers: jasmine.CustomMatcherFactories = {
  toMatchSchema: () => ({
    compare: (actual: unknown, schema: z.ZodSchema<any>) => {
      const result = schema.safeParse(actual);
      
      if (result.success) {
        return {
          pass: true,
          message: 'Data matches schema'
        };
      }
      
      const errors = result.error.issues
        .map((err: any) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      return {
        pass: false,
        message: `Expected data to match schema, but validation failed:\n${errors}`
      };
    }
  })
};

/**
 * TypeScript Declaration für Custom Matcher
 */
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toMatchSchema(schema: z.ZodSchema<any>): boolean;
    }
  }
}

/**
 * Wartet auf async Observable und gibt das Ergebnis zurück
 * Nützlich für Tests mit done() callback
 * 
 * @example
 * ```typescript
 * it('test', async () => {
 *   const result = await waitForObservable(service.getOrder('123'));
 *   expect(result.status).toBe('pending');
 * });
 * ```
 */
export function waitForObservable<T>(observable: any): Promise<T> {
  return new Promise((resolve, reject) => {
    observable.subscribe({
      next: (value: T) => resolve(value),
      error: (error: any) => reject(error)
    });
  });
}
