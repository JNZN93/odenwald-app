import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
  restaurant_id: string;
  selected_variant_option_ids?: string[];
  selected_variant_options?: Array<{
    id: string;
    name: string;
    price_modifier_cents: number;
  }>;
}

export interface Cart {
  restaurant_id: string;
  restaurant_name: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  minimum_order: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        this.cartSubject.next(cart);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        localStorage.removeItem('shopping_cart');
      }
    }
  }

  private saveCartToStorage(cart: Cart | null): void {
    if (cart) {
      localStorage.setItem('shopping_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('shopping_cart');
    }
  }

  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  addToCart(menuItem: any, restaurant: any, selectedVariantOptionIds?: string[], selectedVariantOptions?: Array<{id: string, name: string, price_modifier_cents: number}>): void {
    const currentCart = this.getCurrentCart();

    // Check if item is from same restaurant
    if (currentCart && currentCart.restaurant_id !== restaurant.id) {
      // Clear cart if different restaurant
      if (!confirm('Möchten Sie den aktuellen Warenkorb leeren und von einem anderen Restaurant bestellen?')) {
        return;
      }
      this.clearCart();
    }

    // Calculate unit price including variant price modifiers
    let unitPrice = menuItem.price_cents / 100;
    if (selectedVariantOptions) {
      unitPrice += selectedVariantOptions.reduce((sum, option) => sum + (option.price_modifier_cents / 100), 0);
    }

    const cartItem: CartItem = {
      menu_item_id: menuItem.id,
      name: menuItem.name,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice,
      image_url: menuItem.image_url,
      restaurant_id: restaurant.id,
      selected_variant_option_ids: selectedVariantOptionIds,
      selected_variant_options: selectedVariantOptions
    };

    let updatedCart: Cart;

    let isNewItem = true;

    if (currentCart && currentCart.restaurant_id === restaurant.id) {
      // Add to existing cart
      // Find existing item with same menu_item_id AND same selected variants
      const existingItemIndex = currentCart.items.findIndex(item => {
        const sameMenuItem = item.menu_item_id === menuItem.id;
        const sameVariants = JSON.stringify(item.selected_variant_option_ids?.sort()) === JSON.stringify(selectedVariantOptionIds?.sort());
        return sameMenuItem && sameVariants;
      });

      if (existingItemIndex >= 0) {
        currentCart.items[existingItemIndex].quantity += 1;
        currentCart.items[existingItemIndex].total_price =
          currentCart.items[existingItemIndex].quantity * currentCart.items[existingItemIndex].unit_price;
        isNewItem = false;
      } else {
        currentCart.items.push(cartItem);
        isNewItem = true;
      }

      updatedCart = { ...currentCart };
    } else {
      // Create new cart
      updatedCart = {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        items: [cartItem],
        subtotal: cartItem.total_price,
        delivery_fee: restaurant.delivery_info?.delivery_fee || 0,
        total: cartItem.total_price + (restaurant.delivery_info?.delivery_fee || 0),
        minimum_order: restaurant.delivery_info?.minimum_order_amount || 0
      };
      isNewItem = true;
    }

    // Recalculate totals
    this.updateCartTotals(updatedCart);
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage(updatedCart);

    // Toast-Benachrichtigung anzeigen
    if (isNewItem) {
      this.toastService.success(
        'Artikel hinzugefügt',
        `${menuItem.name} wurde zu Ihrem Warenkorb hinzugefügt`,
        3500
      );
    } else {
      this.toastService.info(
        'Menge erhöht',
        `Menge von ${menuItem.name} wurde erhöht`,
        2500
      );
    }
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    const currentCart = this.getCurrentCart();
    if (!currentCart) return;

    const itemIndex = currentCart.items.findIndex(item => item.menu_item_id === menuItemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        currentCart.items.splice(itemIndex, 1);
      } else {
        currentCart.items[itemIndex].quantity = quantity;
        currentCart.items[itemIndex].total_price =
          quantity * currentCart.items[itemIndex].unit_price;
      }

      this.updateCartTotals(currentCart);
      this.cartSubject.next(currentCart);
      this.saveCartToStorage(currentCart);
    }
  }

  removeFromCart(menuItemId: string): void {
    this.updateQuantity(menuItemId, 0);
  }

  updateCartItemVariants(menuItemId: string, selectedVariantOptionIds: string[], selectedVariantOptions: Array<{id: string, name: string, price_modifier_cents: number}>, restaurant: any, menuItem: any): void {
    const currentCart = this.getCurrentCart();
    if (!currentCart) return;

    const itemIndex = currentCart.items.findIndex(item => item.menu_item_id === menuItemId);
    if (itemIndex < 0) return;

    // Calculate new unit price with variants
    let newUnitPrice = (menuItem.price_cents || 0) / 100;
    selectedVariantOptions.forEach(option => {
      newUnitPrice += option.price_modifier_cents / 100;
    });

    // Update the cart item
    const item = currentCart.items[itemIndex];
    item.unit_price = newUnitPrice;
    item.total_price = item.quantity * newUnitPrice;
    item.selected_variant_option_ids = selectedVariantOptionIds;
    item.selected_variant_options = selectedVariantOptions;

    this.updateCartTotals(currentCart);
    this.cartSubject.next(currentCart);
    this.saveCartToStorage(currentCart);

    this.toastService.success(
      'Varianten aktualisiert',
      `${item.name} wurde mit neuen Varianten aktualisiert`,
      2500
    );
  }

  clearCart(): void {
    this.cartSubject.next(null);
    this.saveCartToStorage(null);
  }

  private updateCartTotals(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    cart.total = cart.subtotal + cart.delivery_fee;
  }

  getItemCount(): number {
    const cart = this.getCurrentCart();
    return cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  }

  getItemQuantity(menuItemId: string, selectedVariantOptionIds?: string[]): number {
    const cart = this.getCurrentCart();
    if (!cart) return 0;

    const item = cart.items.find(item => {
      const sameMenuItem = item.menu_item_id === menuItemId;
      const sameVariants = JSON.stringify(item.selected_variant_option_ids?.sort()) === JSON.stringify(selectedVariantOptionIds?.sort());
      return sameMenuItem && sameVariants;
    });

    return item ? item.quantity : 0;
  }

  isMinimumOrderMet(): boolean {
    const cart = this.getCurrentCart();
    return cart ? cart.subtotal >= cart.minimum_order : false;
  }

  // Order creation
  createOrder(deliveryAddress: string, deliveryInstructions?: string, paymentMethod?: string, customerInfo?: any, useLoyaltyReward?: boolean, notes?: string): Observable<any> {
    const cart = this.getCurrentCart();
    if (!cart || cart.items.length === 0) {
      throw new Error('Warenkorb ist leer');
    }

    const orderData: any = {
      restaurant_id: cart.restaurant_id,
      delivery_address: deliveryAddress,
      delivery_instructions: deliveryInstructions || '',
      notes: notes || '',
      payment_method: paymentMethod || 'cash',
      items: cart.items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        selected_variant_option_ids: item.selected_variant_option_ids
      }))
    };

    // Add customer_info for guest orders
    if (customerInfo) {
      orderData.customer_info = customerInfo;
    }

    // Apply loyalty flag if requested
    if (useLoyaltyReward) {
      orderData.use_loyalty_reward = true;
    }

    return this.http.post(`${environment.apiUrl}/orders`, orderData);
  }
}

// Legacy interfaces for backward compatibility with shopping component
export interface Supplier {
  id: string;
  name: string;
  type: 'wholesale' | 'local' | 'specialty';
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  delivery_info: {
    minimum_order: number;
    delivery_fee: number;
    delivery_time_days: number;
    free_delivery_threshold?: number;
  };
  rating: number;
  is_verified: boolean;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  name: string;
  description?: string;
  category: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'pack';
  price_per_unit: number;
  min_order_quantity: number;
  available_quantity: number;
  image_url?: string;
  is_organic: boolean;
  is_fresh: boolean;
  expiry_date?: string;
}

export interface ShoppingCartItem {
  product: SupplierProduct;
  quantity: number;
  total_price: number;
}

export interface ShoppingCart {
  id: string;
  restaurant_id: string;
  supplier_id: string;
  items: ShoppingCartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  created_at: string;
  estimated_delivery: string;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);

  // Mock data for demonstration - in real app these would be API calls to suppliers
  getSuppliers(): Observable<Supplier[]> {
    // This would be: return this.http.get<Supplier[]>(`${environment.supplierApiUrl}/suppliers`);
    return new Observable(observer => {
      observer.next([
        {
          id: '1',
          name: 'Metro Großhandel',
          type: 'wholesale',
          address: {
            street: 'Industriestraße 123',
            city: 'Frankfurt',
            postal_code: '60313',
            country: 'Deutschland'
          },
          contact: {
            phone: '+49 69 12345678',
            email: 'info@metro.de',
            website: 'https://www.metro.de'
          },
          delivery_info: {
            minimum_order: 100,
            delivery_fee: 15,
            delivery_time_days: 2,
            free_delivery_threshold: 500
          },
          rating: 4.5,
          is_verified: true
        },
        {
          id: '2',
          name: 'Selgros Cash & Carry',
          type: 'wholesale',
          address: {
            street: 'Gewerbepark 456',
            city: 'München',
            postal_code: '80339',
            country: 'Deutschland'
          },
          contact: {
            phone: '+49 89 87654321',
            email: 'info@selgros.de',
            website: 'https://www.selgros.de'
          },
          delivery_info: {
            minimum_order: 75,
            delivery_fee: 12,
            delivery_time_days: 1,
            free_delivery_threshold: 300
          },
          rating: 4.2,
          is_verified: true
        }
      ]);
      observer.complete();
    });
  }

  getSupplierProducts(supplierId: string): Observable<SupplierProduct[]> {
    // This would be: return this.http.get<SupplierProduct[]>(`${environment.supplierApiUrl}/suppliers/${supplierId}/products`);
    return new Observable(observer => {
      observer.next([
        {
          id: '1',
          supplier_id: supplierId,
          name: 'Bio-Tomaten',
          description: 'Frische Bio-Tomaten aus regionalem Anbau',
          category: 'Gemüse',
          unit: 'kg',
          price_per_unit: 3.50,
          min_order_quantity: 5,
          available_quantity: 100,
          image_url: 'assets/images/restaurants/italian-pizzeria.jpg',
          is_organic: true,
          is_fresh: true,
          expiry_date: '2025-09-15'
        },
        {
          id: '2',
          supplier_id: supplierId,
          name: 'Rindfleisch Premium',
          description: 'Qualitäts-Rindfleisch aus artgerechter Haltung',
          category: 'Fleisch',
          unit: 'kg',
          price_per_unit: 18.90,
          min_order_quantity: 2,
          available_quantity: 50,
          image_url: 'assets/images/restaurants/german-schnitzel.jpg',
          is_organic: false,
          is_fresh: true,
          expiry_date: '2025-09-10'
        },
        {
          id: '3',
          supplier_id: supplierId,
          name: 'Olivenöl Extra Vergine',
          description: 'Kaltgepresstes Olivenöl aus Italien',
          category: 'Öle & Fette',
          unit: 'l',
          price_per_unit: 8.50,
          min_order_quantity: 1,
          available_quantity: 200,
          image_url: 'assets/images/restaurants/asian-sushi.jpg',
          is_organic: true,
          is_fresh: false
        }
      ]);
      observer.complete();
    });
  }

  createOrder(orderData: Partial<ShoppingCart>): Observable<ShoppingCart> {
    // This would be: return this.http.post<ShoppingCart>(`${environment.supplierApiUrl}/orders`, orderData);
    return new Observable(observer => {
      const order: ShoppingCart = {
        id: Math.random().toString(36).substr(2, 9),
        restaurant_id: orderData.restaurant_id || '',
        supplier_id: orderData.supplier_id || '',
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.delivery_fee || 0,
        total: orderData.total || 0,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      };
      observer.next(order);
      observer.complete();
    });
  }
}


