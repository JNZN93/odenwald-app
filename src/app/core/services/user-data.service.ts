import { Injectable } from '@angular/core';

export interface DeliveryAddress {
  id?: string;
  name?: string; // Optional name for the address (e.g., "Home", "Work")
  street: string;
  city: string;
  postal_code: string;
  instructions?: string; // Additional delivery instructions
  is_default?: boolean; // Mark as default address
  created_at?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface UserData {
  deliveryAddress?: DeliveryAddress; // Legacy single address (for backwards compatibility)
  deliveryAddresses?: DeliveryAddress[]; // New multiple addresses array
  defaultAddressId?: string; // ID of the default address
  customerInfo: CustomerInfo;
  orderNotes?: string;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly STORAGE_KEY = 'user_checkout_data';

  /**
   * Speichere die Lieferadresse lokal
   */
  saveDeliveryAddress(address: DeliveryAddress): void {
    const data = this.loadData();
    data.deliveryAddress = address;
    data.lastUpdated = new Date().toISOString();
    this.saveData(data);
    console.log('💾 Delivery address saved to localStorage');
  }

  /**
   * Speichere die Kontaktdaten lokal
   */
  saveCustomerInfo(customerInfo: CustomerInfo): void {
    const data = this.loadData();
    data.customerInfo = customerInfo;
    data.lastUpdated = new Date().toISOString();
    this.saveData(data);
    console.log('💾 Customer info saved to localStorage');
  }

  /**
   * Speichere die Bestellnotizen lokal
   */
  saveOrderNotes(notes: string): void {
    const data = this.loadData();
    data.orderNotes = notes;
    data.lastUpdated = new Date().toISOString();
    this.saveData(data);
    console.log('💾 Order notes saved to localStorage');
  }

  /**
   * Speichere alle Checkout-Daten auf einmal
   */
  saveCheckoutData(address: DeliveryAddress, customerInfo: CustomerInfo, notes?: string): void {
    const data: UserData = {
      deliveryAddress: address,
      deliveryAddresses: this.getDeliveryAddresses(), // Initialize if not exists
      customerInfo: customerInfo,
      orderNotes: notes || '',
      lastUpdated: new Date().toISOString()
    };
    this.saveData(data);
    console.log('💾 Complete checkout data saved to localStorage');
  }

  /**
   * Speichere eine neue Lieferadresse automatisch (wird beim Checkout aufgerufen)
   */
  saveDeliveryAddressAutomatically(address: DeliveryAddress): void {
    const data = this.loadData();
    
    // Initialize deliveryAddresses array if it doesn't exist
    if (!data.deliveryAddresses) {
      data.deliveryAddresses = [];
    }

    // Check if address already exists (same street, city, postal_code)
    const existingAddress = data.deliveryAddresses.find(addr => 
      addr.street.trim().toLowerCase() === address.street.trim().toLowerCase() &&
      addr.city.trim().toLowerCase() === address.city.trim().toLowerCase() &&
      addr.postal_code.trim() === address.postal_code.trim()
    );

    if (!existingAddress) {
      // Generate ID if not provided
      if (!address.id) {
        address.id = this.generateAddressId();
      }
      
      // Set creation date
      address.created_at = new Date().toISOString();
      
      // If this is the first address, make it default
      if (data.deliveryAddresses.length === 0) {
        address.is_default = true;
        data.defaultAddressId = address.id;
      }

      data.deliveryAddresses.push(address);
      data.deliveryAddress = address; // Keep legacy compatibility
      data.lastUpdated = new Date().toISOString();
      
      this.saveData(data);
      console.log('💾 New delivery address automatically saved:', address);
    } else {
      console.log('📍 Address already exists, not saving duplicate');
    }
  }

  /**
   * Lade alle gespeicherten Lieferadressen
   */
  getDeliveryAddresses(): DeliveryAddress[] {
    const data = this.loadData();
    return data.deliveryAddresses || [];
  }

  /**
   * Lade die Standard-Adresse
   */
  getDefaultDeliveryAddress(): DeliveryAddress | null {
    const data = this.loadData();
    const addresses = data.deliveryAddresses || [];
    
    if (data.defaultAddressId) {
      return addresses.find(addr => addr.id === data.defaultAddressId) || null;
    }
    
    // Fallback: return first address or legacy address
    return addresses.length > 0 ? addresses[0] : data.deliveryAddress || null;
  }

  /**
   * Setze eine Adresse als Standard
   */
  setDefaultAddress(addressId: string): void {
    const data = this.loadData();
    data.defaultAddressId = addressId;
    
    // Update is_default flags
    if (data.deliveryAddresses) {
      data.deliveryAddresses.forEach(addr => {
        addr.is_default = addr.id === addressId;
      });
    }
    
    data.lastUpdated = new Date().toISOString();
    this.saveData(data);
    console.log('📍 Default address set to:', addressId);
  }

  /**
   * Füge eine neue Adresse hinzu (manuell über Account Settings)
   */
  addDeliveryAddress(address: DeliveryAddress): void {
    const data = this.loadData();
    
    if (!data.deliveryAddresses) {
      data.deliveryAddresses = [];
    }

    // Generate ID if not provided
    if (!address.id) {
      address.id = this.generateAddressId();
    }
    
    // Set creation date
    address.created_at = new Date().toISOString();
    
    // If this is the first address, make it default
    if (data.deliveryAddresses.length === 0) {
      address.is_default = true;
      data.defaultAddressId = address.id;
    }

    data.deliveryAddresses.push(address);
    data.lastUpdated = new Date().toISOString();
    
    this.saveData(data);
    console.log('💾 New delivery address added:', address);
  }

  /**
   * Aktualisiere eine bestehende Adresse
   */
  updateDeliveryAddress(addressId: string, updatedAddress: Partial<DeliveryAddress>): void {
    const data = this.loadData();
    
    if (!data.deliveryAddresses) {
      return;
    }

    const index = data.deliveryAddresses.findIndex(addr => addr.id === addressId);
    if (index !== -1) {
      data.deliveryAddresses[index] = { ...data.deliveryAddresses[index], ...updatedAddress };
      data.lastUpdated = new Date().toISOString();
      
      // Update legacy address if this was the default
      if (data.deliveryAddresses[index].is_default) {
        data.deliveryAddress = data.deliveryAddresses[index];
      }
      
      this.saveData(data);
      console.log('💾 Delivery address updated:', addressId);
    }
  }

  /**
   * Lösche eine Adresse
   */
  deleteDeliveryAddress(addressId: string): void {
    const data = this.loadData();
    
    if (!data.deliveryAddresses) {
      return;
    }

    const index = data.deliveryAddresses.findIndex(addr => addr.id === addressId);
    if (index !== -1) {
      const wasDefault = data.deliveryAddresses[index].is_default;
      data.deliveryAddresses.splice(index, 1);
      
      // If we deleted the default address, set a new default
      if (wasDefault && data.deliveryAddresses.length > 0) {
        data.deliveryAddresses[0].is_default = true;
        data.defaultAddressId = data.deliveryAddresses[0].id;
        data.deliveryAddress = data.deliveryAddresses[0];
      } else if (data.deliveryAddresses.length === 0) {
        data.defaultAddressId = undefined;
        data.deliveryAddress = undefined;
      }
      
      data.lastUpdated = new Date().toISOString();
      this.saveData(data);
      console.log('🗑️ Delivery address deleted:', addressId);
    }
  }

  /**
   * Generiere eine eindeutige ID für Adressen
   */
  private generateAddressId(): string {
    return 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Lade alle gespeicherten Daten
   */
  loadData(): UserData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        console.log('📂 User data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
    }

    // Default-Werte zurückgeben
    return {
      deliveryAddress: {
        street: '',
        city: '',
        postal_code: ''
      },
      customerInfo: {
        name: '',
        email: '',
        phone: ''
      },
      orderNotes: '',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Lade nur die Lieferadresse
   */
  loadDeliveryAddress(): DeliveryAddress {
    const data = this.loadData();
    return data.deliveryAddress || {
      street: '',
      city: '',
      postal_code: ''
    };
  }

  /**
   * Lade nur die Kontaktdaten
   */
  loadCustomerInfo(): CustomerInfo {
    return this.loadData().customerInfo;
  }

  /**
   * Lade die Bestellnotizen
   */
  loadOrderNotes(): string {
    return this.loadData().orderNotes || '';
  }

  /**
   * Prüfe, ob Daten vorhanden sind
   */
  hasData(): boolean {
    try {
      const data = this.loadData();
      // Check if we have addresses (either legacy or new format)
      if (data.deliveryAddresses && data.deliveryAddresses.length > 0) {
        return data.deliveryAddresses.some(addr => addr.street.trim() !== '');
      }
      // Fallback to legacy check
      return data.deliveryAddress ? data.deliveryAddress.street.trim() !== '' : false;
    } catch {
      return false;
    }
  }

  /**
   * Lösche alle gespeicherten Daten
   */
  clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ User data cleared from localStorage');
  }

  /**
   * Prüfe, ob die Daten aktuell sind (nicht älter als 30 Tage)
   */
  isDataRecent(): boolean {
    try {
      const data = this.loadData();
      if (!data.lastUpdated) return false;

      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      return daysDiff <= 30; // 30 Tage
    } catch {
      return false;
    }
  }

  /**
   * Private Hilfsmethode zum Speichern
   */
  private saveData(data: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  }
}
