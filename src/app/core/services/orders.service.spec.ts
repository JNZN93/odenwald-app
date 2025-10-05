import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService, Order } from './orders.service';
import { environment } from '../../../environments/environment';
import {
  OrderSchema,
  CreateOrderResponseSchema,
  GetOrdersResponseSchema,
  CreateOrderRequestSchema
} from '../schemas/api-responses.schema';

describe('OrdersService', () => {
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
  });

  afterEach(() => {
    // Verify that no unmatched requests are outstanding
    httpMock.verify();
  });

  describe('createOrder - Kunde bestellt beim Restaurant', () => {
    it('sollte eine neue Bestellung erstellen und das Response-Schema validieren', (done) => {
      // ARRANGE: Test-Daten vorbereiten
      const orderRequest = {
        restaurant_id: '123',
        delivery_address: 'Hauptstraße 42, 60594 Frankfurt',
        delivery_instructions: 'Bitte klingeln',
        payment_method: 'card',
        items: [
          {
            menu_item_id: '456',
            quantity: 2,
            unit_price: 12.50
          },
          {
            menu_item_id: '789',
            quantity: 1,
            unit_price: 8.90
          }
        ]
      };

      // Erwartete API-Response (Mock)
      const mockResponse = {
        message: 'Order created successfully',
        order: {
          id: '999',
          user_id: '1',
          restaurant_id: '123',
          restaurant_name: 'Pizza Paradise',
          customer_name: 'Max Mustermann',
          customer_email: 'max@example.com',
          items: [
            {
              id: '1',
              menu_item_id: '456',
              name: 'Margherita Pizza',
              quantity: 2,
              unit_price: 12.50,
              total_price: 25.00,
              image_url: 'https://example.com/pizza.jpg'
            },
            {
              id: '2',
              menu_item_id: '789',
              name: 'Cola',
              quantity: 1,
              unit_price: 8.90,
              total_price: 8.90
            }
          ],
          subtotal: 33.90,
          delivery_fee: 3.50,
          total_price: 37.40,
          status: 'pending' as const,
          payment_status: 'pending' as const,
          payment_method: 'card' as const,
          delivery_address: 'Hauptstraße 42, 60594 Frankfurt',
          delivery_instructions: 'Bitte klingeln',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      // ACT: Service-Methode aufrufen
      service.createOrder(orderRequest).subscribe({
        next: (response) => {
          // ASSERT: Response-Schema validieren
          const validationResult = CreateOrderResponseSchema.safeParse(response);
          
          expect(validationResult.success).toBe(true, 
            'API Response sollte dem CreateOrderResponseSchema entsprechen');

          if (validationResult.success) {
            const validatedData = validationResult.data;

            // Überprüfe Basis-Felder
            expect(validatedData.message).toBe('Order created successfully');
            expect(validatedData.order.id).toBe('999');
            expect(validatedData.order.restaurant_id).toBe('123');
            expect(validatedData.order.restaurant_name).toBe('Pizza Paradise');

            // Überprüfe Items
            expect(validatedData.order.items.length).toBe(2);
            expect(validatedData.order.items[0].name).toBe('Margherita Pizza');
            expect(validatedData.order.items[0].quantity).toBe(2);
            expect(validatedData.order.items[0].unit_price).toBe(12.50);

            // Überprüfe Preise
            expect(validatedData.order.subtotal).toBe(33.90);
            expect(validatedData.order.delivery_fee).toBe(3.50);
            expect(validatedData.order.total_price).toBe(37.40);

            // Überprüfe Status
            expect(validatedData.order.status).toBe('pending');
            expect(validatedData.order.payment_status).toBe('pending');
          }

          done();
        },
        error: (error) => {
          fail(`Request failed: ${error.message}`);
          done();
        }
      });

      // HTTP-Request abfangen und Mock-Response zurückgeben
      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      
      // Validiere Request-Body
      const requestValidation = CreateOrderRequestSchema.safeParse(req.request.body);
      expect(requestValidation.success).toBe(true, 
        'Request-Body sollte dem CreateOrderRequestSchema entsprechen');

      req.flush(mockResponse);
    });

    it('sollte Fehler behandeln, wenn die API ein ungültiges Schema zurückgibt', (done) => {
      const orderRequest = {
        restaurant_id: '123',
        delivery_address: 'Hauptstraße 42',
        items: [
          { menu_item_id: '456', quantity: 1, unit_price: 10.00 }
        ]
      };

      // Ungültige API-Response (fehlendes required field)
      const invalidResponse = {
        message: 'Order created',
        order: {
          id: '999',
          // restaurant_id fehlt - sollte Validierung fehlschlagen
          items: []
          // ... andere required fields fehlen
        }
      };

      service.createOrder(orderRequest).subscribe({
        next: (response) => {
          // Schema-Validierung durchführen
          const validationResult = CreateOrderResponseSchema.safeParse(response);
          
          expect(validationResult.success).toBe(false);
          
          if (!validationResult.success) {
            console.warn('Schema-Validierung fehlgeschlagen:', validationResult.error.issues);
            // In einem echten Test würdest du hier einen Error werfen oder loggen
          }

          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(invalidResponse);
    });
  });

  describe('getOrders', () => {
    it('sollte alle Bestellungen mit korrektem Schema zurückgeben', (done) => {
      const mockResponse = {
        count: 2,
        orders: [
          {
            id: '1',
            user_id: '100',
            restaurant_id: '10',
            restaurant_name: 'Burger King',
            items: [],
            subtotal: 25.00,
            delivery_fee: 2.50,
            total_price: 27.50,
            status: 'delivered',
            payment_status: 'paid',
            delivery_address: 'Test Street 1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            user_id: '100',
            restaurant_id: '11',
            restaurant_name: 'Sushi Place',
            items: [],
            subtotal: 45.00,
            delivery_fee: 3.00,
            total_price: 48.00,
            status: 'preparing',
            payment_status: 'paid',
            delivery_address: 'Test Street 2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };

      service.getOrders().subscribe({
        next: (orders) => {
          // Validiere Response-Schema
          const validationResult = GetOrdersResponseSchema.safeParse({
            count: mockResponse.count,
            orders: mockResponse.orders
          });

          expect(validationResult.success).toBe(true);
          expect(orders.length).toBe(2);
          
          // Validiere einzelne Orders
          orders.forEach(order => {
            const orderValidation = OrderSchema.safeParse(order);
            expect(orderValidation.success).toBe(true);
          });

          // Überprüfe erste Order
          expect(orders[0].restaurant_name).toBe('Burger King');
          expect(orders[0].status).toBe('delivered');
          expect(orders[0].total_price).toBe(27.50);

          done();
        },
        error: (error) => {
          fail(`Request failed: ${error.message}`);
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('sollte Orders mit Filtern abrufen', (done) => {
      const filters = {
        status: 'preparing',
        restaurant_id: '123'
      };

      const mockResponse = {
        count: 1,
        orders: [
          {
            id: '1',
            user_id: '100',
            restaurant_id: '123',
            restaurant_name: 'Test Restaurant',
            items: [],
            subtotal: 30.00,
            delivery_fee: 2.50,
            total_price: 32.50,
            status: 'preparing',
            payment_status: 'paid',
            delivery_address: 'Test Address',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };

      service.getOrders(filters).subscribe({
        next: (orders) => {
          expect(orders.length).toBe(1);
          expect(orders[0].status).toBe('preparing');
          expect(orders[0].restaurant_id).toBe('123');
          done();
        }
      });

      const req = httpMock.expectOne(req => 
        req.url === baseUrl && 
        req.params.has('status') && 
        req.params.has('restaurant_id')
      );
      expect(req.request.params.get('status')).toBe('preparing');
      expect(req.request.params.get('restaurant_id')).toBe('123');
      req.flush(mockResponse);
    });
  });

  describe('updateOrderStatus', () => {
    it('sollte Order-Status erfolgreich aktualisieren', (done) => {
      const orderId = '999';
      const newStatus = 'confirmed';

      const mockResponse = {
        message: 'Order status updated',
        order: {
          id: orderId,
          user_id: '100',
          restaurant_id: '123',
          restaurant_name: 'Test Restaurant',
          items: [],
          subtotal: 30.00,
          delivery_fee: 2.50,
          total_price: 32.50,
          status: newStatus,
          payment_status: 'paid',
          delivery_address: 'Test Address',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      service.updateOrderStatus(orderId, newStatus as any).subscribe({
        next: (response) => {
          expect(response.message).toBe('Order status updated');
          expect(response.order.status).toBe(newStatus);
          
          // Schema-Validierung
          const validation = CreateOrderResponseSchema.safeParse(response);
          expect(validation.success).toBe(true);
          
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${orderId}/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      req.flush(mockResponse);
    });
  });

  describe('Schema-Validierung Helper', () => {
    it('sollte OrderSchema für valide Orders bestehen', () => {
      const validOrder = {
        id: '123',
        user_id: '456',
        restaurant_id: '789',
        restaurant_name: 'Test Restaurant',
        items: [],
        subtotal: 25.00,
        delivery_fee: 3.00,
        total_price: 28.00,
        status: 'pending',
        payment_status: 'pending',
        delivery_address: 'Test Address',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = OrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('sollte OrderSchema für invalide Orders ablehnen', () => {
      const invalidOrder = {
        id: '123',
        // Fehlende required fields
        items: [],
        status: 'invalid_status' // Ungültiger Status
      };

      const result = OrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Fehler können für Debugging ausgegeben werden
        console.log('Validierungsfehler:', result.error.issues);
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
