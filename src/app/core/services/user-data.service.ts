import { Injectable } from '@angular/core';

export interface DeliveryAddress {
  street: string;
  city: string;
  postal_code: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface UserData {
  deliveryAddress: DeliveryAddress;
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
      customerInfo: customerInfo,
      orderNotes: notes || '',
      lastUpdated: new Date().toISOString()
    };
    this.saveData(data);
    console.log('💾 Complete checkout data saved to localStorage');
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
    return this.loadData().deliveryAddress;
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
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored).deliveryAddress.street.trim() !== '' : false;
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
