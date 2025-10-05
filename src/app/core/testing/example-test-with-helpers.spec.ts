/**
 * BEISPIEL: Vollständiger Test mit Schema-Validierung und Test-Helpers
 * 
 * Dieser Test zeigt Best Practices für Frontend-Tests mit API-Schema-Validierung
 * Beispiel-Szenario: Kunde bestellt beim Restaurant
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService } from '../services/orders.service';
import { environment } from '../../../environments/environment';
import {
  OrderSchema,
  CreateOrderResponseSchema,
  GetOrdersResponseSchema
} from '../schemas/api-responses.schema';
import {
  expectValidSchema,
  isValidSchema,
  MockDataBuilder,
  schemaMatchers,
  waitForObservable
} from './test-helpers';

describe('OrdersService - Vollständiges Beispiel mit Test-Helpers', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/orders`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdersService]
    });
    
    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Custom Matchers hinzufügen
    jasmine.addMatchers(schemaMatchers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('🛒 Kunde bestellt beim Restaurant - Kompletter Flow', () => {
    
    it('sollte eine Bestellung erstellen mit korrektem Schema (mit Test-Helpers)', (done) => {
      // ARRANGE: Bestelldaten vorbereiten
      const orderRequest = {
        restaurant_id: '123',
        delivery_address: 'Hauptstraße 42, 60594 Frankfurt',
        delivery_instructions: 'Bitte an der Rezeption abgeben',
        payment_method: 'card',
        items: [
          { menu_item_id: '456', quantity: 2, unit_price: 12.50 },
          { menu_item_id: '789', quantity: 1, unit_price: 8.90 }
        ]
      };

      // Mock-Response mit Builder erstellen
      const mockResponse = MockDataBuilder.createMockCreateOrderResponse({
        restaurant_id: '123',
        restaurant_name: 'Pizza Paradise',
        total_price: 37.40,
        items: [
          MockDataBuilder.createMockOrderItem({
            menu_item_id: '456',
            name: 'Margherita Pizza',
            quantity: 2,
            unit_price: 12.50,
            total_price: 25.00
          }),
          MockDataBuilder.createMockOrderItem({
            id: '2',
            menu_item_id: '789',
            name: 'Cola',
            quantity: 1,
            unit_price: 8.90,
            total_price: 8.90
          })
        ]
      });

      // ACT: Service aufrufen
      service.createOrder(orderRequest).subscribe({
        next: (response) => {
          // ASSERT: Mit expectValidSchema - wirft Fehler bei Problemen
          const validatedResponse = expectValidSchema(
            CreateOrderResponseSchema,
            response,
            'Create Order Response sollte dem Schema entsprechen'
          );

          // Jetzt ist validatedResponse type-safe!
          expect(validatedResponse.message).toBe('Order created successfully');
          expect(validatedResponse.order.restaurant_id).toBe('123');
          expect(validatedResponse.order.total_price).toBe(37.40);
          expect(validatedResponse.order.items.length).toBe(2);
          expect(validatedResponse.order.items[0].name).toBe('Margherita Pizza');
          
          done();
        },
        error: (error) => {
          fail(`Request sollte nicht fehlschlagen: ${error.message}`);
          done();
        }
      });

      // Mock HTTP Response
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(orderRequest);
      req.flush(mockResponse);
    });

    it('sollte Bestellung erstellen (mit Custom Matcher)', (done) => {
      const mockResponse = MockDataBuilder.createMockCreateOrderResponse();

      service.createOrder({
        restaurant_id: '123',
        delivery_address: 'Test Address',
        items: [{ menu_item_id: '456', quantity: 1, unit_price: 10.00 }]
      }).subscribe({
        next: (response) => {
          // Custom Matcher verwenden
          expect(response).toMatchSchema(CreateOrderResponseSchema);
          expect(response.order).toMatchSchema(OrderSchema);
          
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('sollte Bestellung erstellen (mit async/await)', async () => {
      const mockResponse = MockDataBuilder.createMockCreateOrderResponse();

      // Observable in Promise umwandeln
      const responsePromise = waitForObservable(
        service.createOrder({
          restaurant_id: '123',
          delivery_address: 'Test',
          items: [{ menu_item_id: '1', quantity: 1, unit_price: 10.00 }]
        })
      );

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);

      // Await verwenden
      const response = await responsePromise;
      
      // Schema validieren
      const validatedResponse = expectValidSchema(
        CreateOrderResponseSchema,
        response
      );
      
      expect(validatedResponse.order.status).toBe('pending');
    });
  });

  describe('📋 Orders abrufen', () => {
    
    it('sollte alle Orders mit korrektem Schema zurückgeben', (done) => {
      // Mock-Response mit mehreren Orders
      const mockResponse = MockDataBuilder.createMockGetOrdersResponse(5);

      service.getOrders().subscribe({
        next: (orders) => {
          // Response-Schema validieren
          const validatedResponse = expectValidSchema(
            GetOrdersResponseSchema,
            mockResponse,
            'GetOrders Response sollte Schema entsprechen'
          );

          expect(validatedResponse.count).toBe(5);
          expect(orders.length).toBe(5);

          // Jede einzelne Order validieren
          orders.forEach((order, index) => {
            expect(order).toMatchSchema(OrderSchema);
            expect(order.restaurant_name).toBe(`Restaurant ${index + 1}`);
          });

          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('sollte Orders nach Restaurant filtern', (done) => {
      const restaurantId = '123';
      
      const mockResponse = MockDataBuilder.createMockGetOrdersResponse(2);
      mockResponse.orders.forEach((order: any) => {
        order.restaurant_id = restaurantId;
        order.restaurant_name = 'Pizza Paradise';
      });

      service.getOrders({ restaurant_id: restaurantId }).subscribe({
        next: (orders) => {
          // Alle Orders sollten vom gleichen Restaurant sein
          orders.forEach(order => {
            expect(order).toMatchSchema(OrderSchema);
            expect(order.restaurant_id).toBe(restaurantId);
          });

          done();
        }
      });

      const req = httpMock.expectOne(req => 
        req.url === baseUrl && req.params.get('restaurant_id') === restaurantId
      );
      req.flush(mockResponse);
    });
  });

  describe('🔄 Order-Status aktualisieren', () => {
    
    it('sollte Order-Status von pending zu confirmed ändern', (done) => {
      const orderId = '999';
      const newStatus = 'confirmed';

      const mockResponse = {
        message: 'Order status updated successfully',
        order: MockDataBuilder.createMockOrder({
          id: orderId,
          status: newStatus
        })
      };

      service.updateOrderStatus(orderId, newStatus as any).subscribe({
        next: (response) => {
          // Schema validieren
          expect(response).toMatchSchema(CreateOrderResponseSchema);
          
          // Status überprüfen
          expect(response.order.status).toBe(newStatus);
          expect(response.order.id).toBe(orderId);
          
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${orderId}/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      req.flush(mockResponse);
    });
  });

  describe('🚨 Fehlerbehandlung', () => {
    
    it('sollte ungültige Schemas erkennen', (done) => {
      const invalidResponse = {
        message: 'Created',
        order: {
          id: '123',
          // Viele required fields fehlen
          items: []
        }
      };

      service.createOrder({
        restaurant_id: '123',
        delivery_address: 'Test',
        items: [{ menu_item_id: '1', quantity: 1, unit_price: 10 }]
      }).subscribe({
        next: (response) => {
          // Prüfe, ob Schema valide ist
          const isValid = isValidSchema(CreateOrderResponseSchema, response);
          
          expect(isValid).toBe(false);
          
          // Bei invaliden Daten können wir trotzdem arbeiten, aber mit Warnung
          if (!isValid) {
            console.warn('⚠️ API Response entspricht nicht dem erwarteten Schema!');
          }
          
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(invalidResponse);
    });

    it('sollte HTTP-Fehler behandeln', (done) => {
      service.createOrder({
        restaurant_id: '123',
        delivery_address: 'Test',
        items: [{ menu_item_id: '1', quantity: 1, unit_price: 10 }]
      }).subscribe({
        next: () => {
          fail('Sollte nicht erfolgreich sein');
          done();
        },
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('Invalid order');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { message: 'Invalid order data' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('📊 Komplexe Szenarien', () => {
    
    it('sollte vollständigen Order-Flow testen: Erstellen -> Abrufen -> Status ändern', async () => {
      // 1. Order erstellen
      const createResponse = MockDataBuilder.createMockCreateOrderResponse({
        id: '999',
        status: 'pending'
      });

      const createPromise = waitForObservable(
        service.createOrder({
          restaurant_id: '123',
          delivery_address: 'Test',
          items: [{ menu_item_id: '1', quantity: 1, unit_price: 10 }]
        })
      );

      httpMock.expectOne(baseUrl).flush(createResponse);
      const created: any = await createPromise;
      
      expect(created).toMatchSchema(CreateOrderResponseSchema);
      expect(created.order.status).toBe('pending');

      // 2. Order abrufen
      const getResponse = { order: { order: createResponse.order, items: [] } };
      const getPromise = waitForObservable(service.getOrderById('999'));
      
      httpMock.expectOne(`${baseUrl}/999`).flush(getResponse);
      const fetched: any = await getPromise;
      
      expect(fetched).toMatchSchema(OrderSchema);
      expect(fetched.id).toBe('999');

      // 3. Status ändern
      const updateResponse = {
        message: 'Updated',
        order: { ...createResponse.order, status: 'confirmed' }
      };
      const updatePromise = waitForObservable(
        service.updateOrderStatus('999', 'confirmed' as any)
      );

      httpMock.expectOne(`${baseUrl}/999/status`).flush(updateResponse);
      const updated: any = await updatePromise;

      expect(updated).toMatchSchema(CreateOrderResponseSchema);
      expect(updated.order.status).toBe('confirmed');
    });
  });
});
